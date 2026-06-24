import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoAsignacion {
  ACTIVA = 'ACTIVA',
  FINALIZADA = 'FINALIZADA',
}

/**
 * RF1: la relación de propiedad usa una CLAVE COMPUESTA (userId + vehicleId),
 * no un id autogenerado. Esto se modela en TypeORM con dos @PrimaryColumn,
 * en vez de @PrimaryGeneratedColumn. La combinación de ambas columnas
 * es la llave primaria real de la tabla.
 */
@Entity({ name: 'asignaciones' })
export class Asignacion {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @Column({
    type: 'varchar',
    default: EstadoAsignacion.ACTIVA,
  })
  estado: EstadoAsignacion;

  @CreateDateColumn({ name: 'fecha_asignacion', type: 'timestamptz' })
  fechaAsignacion: Date;

  @Column({ name: 'fecha_finalizacion', type: 'timestamptz', nullable: true })
  fechaFinalizacion: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}