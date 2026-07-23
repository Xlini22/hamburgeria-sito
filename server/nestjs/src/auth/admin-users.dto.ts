import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const ROLES = ['admin', 'editor', 'viewer', 'kitchen'] as const;

export class CreateAdminUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(USERNAME_PATTERN)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsIn(ROLES)
  role!: string;

  @IsBoolean()
  isActive!: boolean;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(USERNAME_PATTERN)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
