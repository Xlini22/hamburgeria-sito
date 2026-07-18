import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CredentialsDto } from './credential.dto';
import { DatabaseService } from './../database/database.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly databaseService: DatabaseService,
    ) { }

    async login(
        credentials: CredentialsDto,
    ): Promise<{ access_token: string; refresh_token: string }> {
        const users = await this.databaseService.query(
            'SELECT * FROM users WHERE username = ?',
            [credentials.username],
        );

        if (users.length === 0) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const user = users[0];

        const passwordOk = await bcrypt.compare(
            credentials.password,
            user.password,
        );

        if (!passwordOk) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user.id, user.username);
    }

    async generateTokens(
        userId: number,
        username: string,
    ): Promise<{ access_token: string; refresh_token: string }> {
        const payload = { username, sub: userId };

        const expiresIn = this.configService.getOrThrow<any>('JWT_EXPIRES_IN');
        const refreshExpiresIn = this.configService.getOrThrow<any>(
            'JWT_REFRESH_EXPIRES_IN',
        );

        const access_token = this.jwtService.sign(payload, {
          expiresIn,
        });

        const refresh_token = this.jwtService.sign(payload, {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn,
        });

        return { access_token, refresh_token };
    }

    async refreshToken(token: string): Promise<{ access_token: string; refresh_token: string }> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });

            return this.generateTokens(payload.sub, payload.username);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
