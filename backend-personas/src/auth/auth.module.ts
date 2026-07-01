import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PersonasModule } from '../personas/personas.module';
import { RolesModule } from '../roles/roles.module';
import { Usuario } from '../personas/entities/usuario.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Rol } from '../personas/entities/rol.entity';
import { RefreshToken } from '../personas/entities/refresh-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermisosGuard } from './guards/permisos.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, UsuarioRol, Rol, RefreshToken]),
    PersonasModule,
    RolesModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // Regresamos el "as any" para que TypeScript nos deje en paz con el StringValue
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
            '20m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermisosGuard],
  exports: [JwtModule, JwtAuthGuard, PermisosGuard],
})
export class AuthModule {}
