import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  product?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'product.create',
    'product.update',
    'product.delete',
    'category.create',
    'category.update',
    'category.delete',
    'ingredient.create',
    'ingredient.update',
    'ingredient.delete',
    'allergen.create',
    'allergen.update',
    'allergen.delete',
    'user.create',
    'user.update',
    'best-sellers.update',
    'image.upload',
    'image.primary',
    'image.visibility',
    'images.reorder',
    'image.delete',
    'audit.restore',
  ])
  action?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['active', 'archive', 'all'])
  source: 'active' | 'archive' | 'all' = 'active';
}
