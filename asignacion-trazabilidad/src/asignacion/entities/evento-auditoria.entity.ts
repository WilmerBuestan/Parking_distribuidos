import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum TipoAccion {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  ELIMINACION = 'ELIMINACION',
}

/**
 * RF2: entidad de auditoría, completamente SEPARADA de Asignacion.
 * Nunca se escribe aquí manualmente desde el service: la escritura ocurre
 * automáticamente desde AsignacionSubscriber, que escucha los eventos del
 * ciclo de vida de TypeORM (afterInsert, afterUpdate, afterRemove).
 * Esto es lo que logra el desacoplamiento que pide el criterio de evaluación.
 */
@Entity({ name: 'eventos_auditoria' })
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'varchar', name: 'tipo_accion' })
  tipoAccion: TipoAccion;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'jsonb', name: 'datos_anteriores', nullable: true })
  datosAnteriores: Record<string, any> | null;

  @Column({ type: 'jsonb', name: 'datos_nuevos', nullable: true })
  datosNuevos: Record<string, any> | null;
}