import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminProductsService } from './admin-products.service';
import {
  AdminAllergenDto,
  AdminCategoryDto,
  AdminIngredientDto,
  AdminProductDto,
  BestSellerListDto,
  IdListDto,
  ImageVisibilityDto,
} from './admin-products.dto';
import { AdminAuditInterceptor } from '../auth/admin-audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get('products')
  findAll() {
    return this.adminProductsService.findAll();
  }

  @Post('products')
  @Roles('admin', 'editor')
  create(@Body() input: AdminProductDto) {
    return this.adminProductsService.create(input);
  }

  @Patch('products/:id')
  @Roles('admin', 'editor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: AdminProductDto,
  ) {
    return this.adminProductsService.update(id, input);
  }

  @Post('products/:id/image')
  @Roles('admin', 'editor')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: join(
          process.cwd(),
          'public',
          'images',
          'catalog',
          'uploads',
        ),
        filename: (_request, file, callback) => {
          const extensions: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
          };
          callback(null, `${randomUUID()}${extensions[file.mimetype]}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Only JPG, PNG and WebP images are allowed',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image is required');
    const imagePath = `images/catalog/uploads/${file.filename}`;
    try {
      return await this.adminProductsService.setPrimaryImage(
        id,
        imagePath,
        file.originalname,
      );
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  @Get('products/:id/images')
  findImages(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.findImages(id);
  }

  @Patch('products/:id/images/:imageId/primary')
  @Roles('admin', 'editor')
  selectPrimaryImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.adminProductsService.selectPrimaryImage(id, imageId);
  }

  @Patch('products/:id/images/:imageId/visibility')
  @Roles('admin', 'editor')
  setImageVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() body: ImageVisibilityDto,
  ) {
    return this.adminProductsService.setImageVisibility(
      id,
      imageId,
      body.isVisible,
    );
  }

  @Patch('products/:id/images-order')
  @Roles('admin', 'editor')
  saveImageOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: IdListDto,
  ) {
    return this.adminProductsService.saveImageOrder(id, body.imageIds);
  }

  @Delete('products/:id/images/:imageId')
  @Roles('admin', 'editor')
  async removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const result = await this.adminProductsService.removeImage(id, imageId);
    const uploadPrefix = 'images/catalog/uploads/';
    if (result.removedPath.startsWith(uploadPrefix)) {
      const filename = result.removedPath.slice(uploadPrefix.length);
      if (filename && !filename.includes('/') && !filename.includes('\\')) {
        await unlink(
          join(
            process.cwd(),
            'public',
            'images',
            'catalog',
            'uploads',
            filename,
          ),
        ).catch(() => undefined);
      }
    }
    return { imagePath: result.imagePath };
  }

  @Get('categories')
  findCategories() {
    return this.adminProductsService.findCategories();
  }

  @Post('categories')
  @Roles('admin')
  createCategory(@Body() input: AdminCategoryDto) {
    return this.adminProductsService.createCategory(input);
  }

  @Patch('categories/:id')
  @Roles('admin')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: AdminCategoryDto,
  ) {
    return this.adminProductsService.updateCategory(id, input);
  }

  @Delete('categories/:id')
  @Roles('admin')
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.removeCategory(id);
  }

  @Patch('best-sellers')
  @Roles('admin')
  saveBestSellers(@Body() body: BestSellerListDto) {
    return this.adminProductsService.saveBestSellers(body.productIds);
  }

  @Get('ingredients')
  findIngredients() {
    return this.adminProductsService.findIngredients();
  }

  @Post('ingredients')
  @Roles('admin', 'editor')
  createIngredient(@Body() input: AdminIngredientDto) {
    return this.adminProductsService.createIngredient(input);
  }

  @Patch('ingredients/:id')
  @Roles('admin', 'editor')
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: AdminIngredientDto,
  ) {
    return this.adminProductsService.updateIngredient(id, input);
  }

  @Delete('ingredients/:id')
  @Roles('admin', 'editor')
  removeIngredient(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.removeIngredient(id);
  }

  @Get('allergens')
  findAllergens() {
    return this.adminProductsService.findAllergens();
  }

  @Post('allergens')
  @Roles('admin')
  createAllergen(@Body() input: AdminAllergenDto) {
    return this.adminProductsService.createAllergen(input);
  }

  @Get('allergens/:id/usage')
  findAllergenUsage(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.findAllergenUsage(id);
  }

  @Delete('allergens/:id')
  @Roles('admin')
  removeAllergen(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.removeAllergen(id);
  }
}
