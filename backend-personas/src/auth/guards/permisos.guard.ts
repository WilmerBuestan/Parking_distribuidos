import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISO_KEY } from './requiere-permiso.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const permisoRequerido = this.reflector.getAllAndOverride<string>(
      PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permisoRequerido) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permisos) {
      throw new ForbiddenException('No se encontraron permisos en el token');
    }

    const permisos: string[] = user.permisos;

    if (permisos.includes('*')) return true;
    if (permisos.includes(permisoRequerido)) return true;

    throw new ForbiddenException(
      'No tienes el permiso "' + permisoRequerido + '" para acceder a este recurso',
    );
  }
}
