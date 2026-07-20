import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductSearchDto, SlugParamDto } from './public-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('best-sellers')
  findBestSellers() {
    return this.productsService.findBestSellers();
  }

  @Get('search')
  search(@Query() query: ProductSearchDto) {
    return this.productsService.search(query.q);
  }

  @Get(':slug')
  findOneBySlug(@Param() params: SlugParamDto) {
    return this.productsService.findOneBySlug(params.slug);
  }
}
