import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePermisoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  modulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
