import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateKitchenOrderStatusDto } from './kitchen.dto';
import { KitchenService } from './kitchen.service';

type KitchenRequest = Request & { user: { userId: number } };

@Controller('kitchen/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'kitchen')
export class KitchenController {
  constructor(private readonly kitchen: KitchenService) {}

  @Get()
  findOrders() {
    return this.kitchen.findOrders();
  }

  @Get('history')
  findHistory(@Query('limit') limit?: string) {
    return this.kitchen.findHistory(limit ? Number(limit) : 50);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKitchenOrderStatusDto,
    @Req() request: KitchenRequest,
  ) {
    return this.kitchen.updateStatus(id, dto.status, request.user.userId);
  }
}
