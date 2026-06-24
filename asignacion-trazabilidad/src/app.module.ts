import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionModule } from './asignacion/asignacion.module';
import { Asignacion } from './asignacion/entities/asignacion.entity';
import { EventoAuditoria } from './asignacion/entities/evento-auditoria.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USUARIO'),
        password: configService.get<string>('DB_CONTRASENA'),
        database: configService.get<string>('DB_NOMBRE'),
        entities: [Asignacion, EventoAuditoria],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    AsignacionModule,
  ],
})
export class AppModule {}
