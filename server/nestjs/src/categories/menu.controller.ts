import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findMenu() {
    return this.categoriesService.findMenu();
  }
}
