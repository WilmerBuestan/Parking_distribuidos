import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignPermisoDto {
  @IsUUID()
  @IsNotEmpty()
  idRole: string;

  @IsUUID()
  @IsNotEmpty()
  idPermiso: string;
}
