import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @IsUUID()
  @IsNotEmpty()
  idUser: string;

  @IsUUID()
  @IsNotEmpty()
  idRole: string;
}
