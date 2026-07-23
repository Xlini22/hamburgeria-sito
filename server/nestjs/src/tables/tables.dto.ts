import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';

export class CreateTableDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  tableNumber!: number;

  @IsString()
  @Length(1, 80)
  name!: string;
}

export class UpdateTableDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  tableNumber?: number;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TableTokenParamDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token!: string;
}

export class GenerateTableQrDto extends TableTokenParamDto {}

export class UpdateGuestCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  quantity!: number;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  preference?: string;
}

export class UpdateGuestReadinessDto {
  @IsBoolean()
  ready!: boolean;
}

export class UpdateGuestNameDto {
  @IsString()
  @Length(1, 40)
  @Matches(/^[\p{L}\p{M}0-9 .'-]+$/u)
  name!: string;
}

export class SubmitTableOrderDto {
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  idempotencyKey!: string;

  @IsBoolean()
  confirmNotReady!: boolean;
}
