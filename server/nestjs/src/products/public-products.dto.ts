import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SlugParamDto {
  @IsString()
  @MaxLength(150)
  @Matches(SLUG_PATTERN)
  slug!: string;
}

export class ProductSearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q!: string;
}
