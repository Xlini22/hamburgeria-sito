import { IsString, MaxLength, MinLength } from 'class-validator';

export class CredentialsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
