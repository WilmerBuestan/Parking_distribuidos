import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Rol } from '../personas/entities/rol.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Usuario } from '../personas/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, UsuarioRol, Usuario])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
