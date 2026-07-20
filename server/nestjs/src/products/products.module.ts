import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DatabaseModule } from '../database/database.module';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminAuditService } from '../auth/admin-audit.service';
import { AdminAuditInterceptor } from '../auth/admin-audit.interceptor';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [
    ProductsService,
    AdminProductsService,
    AdminAuditService,
    AdminAuditInterceptor,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
