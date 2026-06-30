import { SetMetadata } from '@nestjs/common';

export const PERMISO_KEY = 'permiso_requerido';
export const RequierePermiso = (permiso: string) =>
  SetMetadata(PERMISO_KEY, permiso);
