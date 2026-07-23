import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt-strategy/jwt-strategy';
import { RolesGuard } from './roles.guard';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { LoginAttemptsService } from './login-attempts.service';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { InitialAdminService } from './initial-admin.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    AdminUsersService,
    LoginAttemptsService,
    AdminAuditService,
    AdminAuditInterceptor,
    InitialAdminService,
  ],
  controllers: [AuthController, AdminUsersController, AdminAuditController],
  exports: [RolesGuard, AdminAuditService, AdminAuditInterceptor],
})
export class AuthModule {}
