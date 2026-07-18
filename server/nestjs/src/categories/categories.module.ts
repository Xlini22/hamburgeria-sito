import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesController } from './categories.controller';
import { MenuController } from './menu.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [DatabaseModule, ProductsModule],
  controllers: [CategoriesController, MenuController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
