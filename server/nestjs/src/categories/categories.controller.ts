import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { SlugParamDto } from '../products/public-products.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug/products')
  findProducts(@Param() params: SlugParamDto) {
    return this.categoriesService.findProducts(params.slug);
  }
}
