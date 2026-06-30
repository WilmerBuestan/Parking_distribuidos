import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PersonasModule } from './personas/personas.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermisosGuard } from './auth/guards/permisos.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin123',
      database: 'db_personas',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PersonasModule,
    RolesModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    // Guards globales: TODO endpoint requiere JWT por defecto.
    // Los endpoints públicos se marcan con @Public().
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermisosGuard,
    },
  ],
})
export class AppModule {}