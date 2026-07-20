import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const users = await this.databaseService.query<any[]>(
      'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
      [payload.sub],
    );
    if (!users.length) throw new UnauthorizedException();
    return {
      userId: users[0].id,
      username: users[0].username,
      role: users[0].role,
    };
  }
}
