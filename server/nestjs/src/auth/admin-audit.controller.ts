import { Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuditService } from './admin-audit.service';
import { AuditQueryDto } from './admin-audit.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Post(':id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req()
    request: Request & {
      user: { userId: number; username: string; role: string };
    },
  ) {
    return this.auditService.restore(id, {
      userId: request.user.userId,
      username: request.user.username,
      role: request.user.role,
      ipAddress: request.ip || request.socket.remoteAddress || undefined,
      userAgent: request.get('user-agent'),
    });
  }
}
