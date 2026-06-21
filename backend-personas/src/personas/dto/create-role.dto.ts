import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
