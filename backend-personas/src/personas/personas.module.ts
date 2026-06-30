import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from './entities/persona.entity';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { Permiso } from './entities/permiso.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Persona,
      Usuario,
      Rol,
      UsuarioRol,
      Permiso,
      RolPermiso,
      RefreshToken,
    ]),
  ],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [PersonasService],
})
export class PersonasModule {}
