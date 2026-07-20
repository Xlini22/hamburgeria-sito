import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, SessionMetadata } from './auth.service';
import { CredentialsDto } from './credential.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { LoginAttemptsService } from './login-attempts.service';

const REFRESH_COOKIE = 'bourmet_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly loginAttempts: LoginAttemptsService,
  ) {}

  @Post('login')
  async login(
    @Body() credentials: CredentialsDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ipAddress = this.clientIp(request);
    const retryAfter = this.loginAttempts.secondsUntilAllowed(ipAddress);
    if (retryAfter > 0) {
      response.setHeader('Retry-After', retryAfter);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Troppi tentativi. Riprova tra ${retryAfter} secondi.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const tokens = await this.authService.login(
        credentials,
        this.sessionMetadata(request),
      );
      this.loginAttempts.reset(ipAddress);
      this.setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt);
      return { access_token: tokens.accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.loginAttempts.recordFailure(ipAddress);
      }
      throw error;
    }
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshToken(
      request.cookies?.[REFRESH_COOKIE],
      this.sessionMetadata(request),
    );
    this.setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt);
    return { access_token: tokens.accessToken };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.cookies?.[REFRESH_COOKIE]);
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @Req()
    request: Request & {
      user: { userId: number; username: string; role: string };
    },
  ) {
    return request.user;
  }

  private setRefreshCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ) {
    response.cookie(REFRESH_COOKIE, token, {
      ...this.cookieOptions(),
      expires: expiresAt,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      path: '/api/auth',
    };
  }

  private sessionMetadata(request: Request): SessionMetadata {
    return {
      ipAddress: this.clientIp(request),
      userAgent: request.get('user-agent'),
    };
  }

  private clientIp(request: Request) {
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
