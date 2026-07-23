import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuditInterceptor } from '../auth/admin-audit.interceptor';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import {
  CreateTableDto,
  GenerateTableQrDto,
  SubmitTableOrderDto,
  TableTokenParamDto,
  UpdateGuestCartItemDto,
  UpdateGuestNameDto,
  UpdateGuestReadinessDto,
  UpdateTableDto,
} from './tables.dto';
import { TablesService } from './tables.service';

type AdminRequest = Request & { user: { userId: number } };

@Controller('admin/tables')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('admin')
export class AdminTablesController {
  constructor(private readonly tables: TablesService) {}

  @Get()
  findAll() {
    return this.tables.findAll();
  }

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tables.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTableDto) {
    return this.tables.update(id, dto);
  }

  @Post(':id/open-session')
  open(@Param('id', ParseIntPipe) id: number, @Req() request: AdminRequest) {
    return this.tables.openSession(id, request.user.userId);
  }

  @Post(':id/close-session')
  close(@Param('id', ParseIntPipe) id: number, @Req() request: AdminRequest) {
    return this.tables.closeSession(id, request.user.userId);
  }

  @Post(':id/regenerate-token')
  regenerateToken(@Param('id', ParseIntPipe) id: number) {
    return this.tables.regenerateToken(id);
  }

  @Post(':id/qr')
  generateQr(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GenerateTableQrDto,
    @Req() request: Request,
  ) {
    const protocol =
      request.get('x-forwarded-proto')?.split(',')[0].trim() ||
      request.protocol;
    const host = request.get('x-forwarded-host') || request.get('host');
    return this.tables.generateQr(id, dto.token, `${protocol}://${host}`);
  }

  @Get(':id/cart')
  cart(@Param('id', ParseIntPipe) id: number) {
    return this.tables.tableCart(id);
  }
}

@Controller()
export class GuestTablesController {
  constructor(private readonly tables: TablesService) {}

  @Get('table-access/:token')
  enter(@Param() params: TableTokenParamDto, @Res() response: Response) {
    return this.tables.enter(params.token, response);
  }

  @Get('guest/session')
  session(@Req() request: Request) {
    return this.tables.guestSession(request.cookies?.bourmet_guest);
  }

  @Get('guest/cart')
  cart(@Req() request: Request) {
    return this.tables.guestCart(request.cookies?.bourmet_guest);
  }

  @Get('guest/table-cart')
  tableCart(@Req() request: Request) {
    return this.tables.guestTableCart(request.cookies?.bourmet_guest);
  }

  @Patch('guest/readiness')
  readiness(
    @Body() dto: UpdateGuestReadinessDto,
    @Req() request: Request,
  ) {
    return this.tables.updateGuestReadiness(
      request.cookies?.bourmet_guest,
      dto.ready,
    );
  }

  @Patch('guest/name')
  name(@Body() dto: UpdateGuestNameDto, @Req() request: Request) {
    return this.tables.updateGuestName(
      request.cookies?.bourmet_guest,
      dto.name,
    );
  }

  @Post('guest/orders')
  submitOrder(@Body() dto: SubmitTableOrderDto, @Req() request: Request) {
    return this.tables.submitTableOrder(
      request.cookies?.bourmet_guest,
      dto.idempotencyKey,
      dto.confirmNotReady,
    );
  }

  @Get('guest/orders')
  orderHistory(@Req() request: Request) {
    return this.tables.guestOrderHistory(request.cookies?.bourmet_guest);
  }

  @Put('guest/cart/items/:productId')
  updateCartItem(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateGuestCartItemDto,
    @Req() request: Request,
  ) {
    return this.tables.updateGuestCartItem(
      request.cookies?.bourmet_guest,
      productId,
      dto.quantity,
      dto.preference,
    );
  }
}
