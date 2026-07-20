import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AdminUsersService } from './admin-users.service';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './admin-users.dto';
import { AdminAuditInterceptor } from './admin-audit.interceptor';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: CreateAdminUserDto) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.usersService.update(id, body);
  }
}
