import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePermisoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string; // ej. "zonas:gestionar"

  @IsString()
  @IsNotEmpty()
  modulo: string; // ej. "zonas"

  @IsString()
  @IsOptional()
  descripcion?: string;
}
