import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Rol } from '../personas/entities/rol.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Usuario } from '../personas/entities/usuario.entity';
import { Permiso } from '../personas/entities/permiso.entity';
import { RolPermiso } from '../personas/entities/rol-permiso.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, UsuarioRol, Usuario, Permiso, RolPermiso]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
