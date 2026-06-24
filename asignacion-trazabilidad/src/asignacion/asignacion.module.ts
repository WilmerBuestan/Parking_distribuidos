import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AsignacionController } from './asignacion.controller';
import { AsignacionService } from './asignacion.service';
import { Asignacion } from './entities/asignacion.entity';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { AsignacionSubscriber } from './subscribers/asignacion.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asignacion, EventoAuditoria]),
    HttpModule,
  ],
  controllers: [AsignacionController],
  // AsignacionSubscriber se registra como provider para que Nest lo instancie
  // (y su constructor se ejecute, registrándose ante el DataSource de TypeORM).
  providers: [AsignacionService, AsignacionSubscriber],
})
export class AsignacionModule {}
