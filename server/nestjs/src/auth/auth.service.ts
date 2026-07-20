import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { DatabaseService } from './../database/database.service';
import { CredentialsDto } from './credential.dto';

export type SessionMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

type AuthUser = {
  id: number;
  username: string;
  role: string;
};

type RefreshPayload = {
  sub: number;
  username: string;
  role: string;
  type: 'refresh';
  jti: string;
  exp: number;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async login(
    credentials: CredentialsDto,
    metadata: SessionMetadata,
  ): Promise<TokenPair> {
    const users = await this.databaseService.query<any[]>(
      `SELECT id, username, password, role
       FROM users
       WHERE username = ? AND is_active = 1
       LIMIT 1`,
      [credentials.username],
    );
    if (!users.length) throw new UnauthorizedException('Invalid credentials');

    const passwordOk = await bcrypt.compare(
      credentials.password,
      users[0].password,
    );
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    const user: AuthUser = users[0];
    const tokens = this.buildTokenPair(user);
    await this.databaseService.query(
      `INSERT INTO auth_refresh_sessions
        (id, user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tokens.sessionId,
        user.id,
        this.hashToken(tokens.refreshToken),
        tokens.refreshExpiresAt,
        metadata.ipAddress?.slice(0, 45) || null,
        metadata.userAgent?.slice(0, 255) || null,
      ],
    );
    return tokens;
  }

  async refreshToken(
    token: string | undefined,
    metadata: SessionMetadata,
  ): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(token);
    const sessions = await this.databaseService.query<any[]>(
      `SELECT
        s.id,
        s.user_id,
        s.token_hash,
        s.revoked_at,
        s.expires_at,
        u.username,
        u.role,
        u.is_active
       FROM auth_refresh_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.user_id = ?
       LIMIT 1`,
      [payload.jti, payload.sub],
    );
    if (!sessions.length) throw new UnauthorizedException('Invalid session');

    const session = sessions[0];
    const presentedHash = this.hashToken(token!);
    const storedHash = String(session.token_hash);
    const hashesMatch =
      presentedHash.length === storedHash.length &&
      timingSafeEqual(Buffer.from(presentedHash), Buffer.from(storedHash));
    const expired = new Date(session.expires_at).getTime() <= Date.now();

    if (
      !hashesMatch ||
      session.revoked_at ||
      expired ||
      !Boolean(session.is_active)
    ) {
      await this.revokeAllUserSessions(Number(session.user_id));
      throw new UnauthorizedException('Invalid session');
    }

    const user: AuthUser = {
      id: Number(session.user_id),
      username: session.username,
      role: session.role,
    };
    const nextTokens = this.buildTokenPair(user);
    await this.databaseService.transaction(async (query) => {
      const update = await query<any>(
        `UPDATE auth_refresh_sessions
         SET revoked_at = NOW(3), replaced_by_session_id = ?
         WHERE id = ? AND revoked_at IS NULL`,
        [nextTokens.sessionId, session.id],
      );
      if (update.affectedRows !== 1) {
        throw new UnauthorizedException('Session already rotated');
      }
      await query(
        `INSERT INTO auth_refresh_sessions
          (id, user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nextTokens.sessionId,
          user.id,
          this.hashToken(nextTokens.refreshToken),
          nextTokens.refreshExpiresAt,
          metadata.ipAddress?.slice(0, 45) || null,
          metadata.userAgent?.slice(0, 255) || null,
        ],
      );
    });
    return nextTokens;
  }

  async logout(token: string | undefined) {
    if (!token) return;
    try {
      const payload = this.verifyRefreshToken(token);
      await this.databaseService.query(
        `UPDATE auth_refresh_sessions
         SET revoked_at = COALESCE(revoked_at, NOW(3))
         WHERE id = ? AND user_id = ? AND token_hash = ?`,
        [payload.jti, payload.sub, this.hashToken(token)],
      );
    } catch {
      // Logout remains idempotent even for expired or invalid cookies.
    }
  }

  async revokeAllUserSessions(userId: number) {
    await this.databaseService.query(
      `UPDATE auth_refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW(3))
       WHERE user_id = ?`,
      [userId],
    );
  }

  private buildTokenPair(user: AuthUser): TokenPair {
    const accessToken = this.jwtService.sign({
      username: user.username,
      role: user.role,
      sub: user.id,
      type: 'access',
    });
    const sessionId = randomUUID();
    const refreshToken = this.jwtService.sign(
      {
        username: user.username,
        role: user.role,
        sub: user.id,
        type: 'refresh',
        jti: sessionId,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<any>(
          'JWT_REFRESH_EXPIRES_IN',
        ),
      },
    );
    const decoded = this.jwtService.decode(refreshToken) as RefreshPayload;
    return {
      accessToken,
      refreshToken,
      sessionId,
      refreshExpiresAt: new Date(decoded.exp * 1000),
    };
  }

  private verifyRefreshToken(token: string | undefined): RefreshPayload {
    if (!token) throw new UnauthorizedException('Missing refresh token');
    try {
      const payload = this.jwtService.verify<RefreshPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (
        payload.type !== 'refresh' ||
        !payload.jti ||
        !Number.isInteger(payload.sub)
      ) {
        throw new Error('Invalid payload');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
