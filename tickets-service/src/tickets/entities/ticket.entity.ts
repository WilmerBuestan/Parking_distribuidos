import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoTicket {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
}

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  cedula: string;

  @Column({ type: 'varchar', length: 20 })
  placa: string;

  @Column({ type: 'varchar', name: 'zona_id' })
  zonaId: string;

  @Column({ type: 'varchar', name: 'espacio_id', nullable: true })
  espacioId: string | null;

  @Column({ type: 'timestamp', name: 'hora_entrada' })
  horaEntrada: Date;

  @Column({ type: 'timestamp', name: 'hora_salida', nullable: true })
  horaSalida: Date | null;

  @Column({ type: 'integer', name: 'tiempo_minutos', nullable: true })
  tiempoMinutos: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'tarifa_total',
    nullable: true,
  })
  tarifaTotal: number | null;

  @Column({
    type: 'varchar',
    default: EstadoTicket.ABIERTO,
  })
  estado: EstadoTicket;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}