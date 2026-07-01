import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoTicket {
  ACTIVO = 'ACTIVO',
  PAGADO = 'PAGADO',
  ANULADO = 'ANULADO',
}

export enum TipoVehiculo {
  MOTOCICLETA = 'Motocicleta',
  AUTO = 'Auto',
  CAMIONETA = 'Camioneta',
}

export enum TipoEspacio {
  REGULAR = 'REGULAR',
  PREFERENTE = 'PREFERENTE',
  DISCAPACITADO = 'DISCAPACITADO',
}

@Entity({ name: 'tickets' })
@Index(['idUsuario', 'estado'])
@Index(['idVehiculo', 'estado'])
@Index(['cedula'])
@Index(['placa'])
@Index(['horaEntrada'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  cedula: string;

  @Column({ type: 'varchar', length: 20 })
  placa: string;

  @Column({ type: 'uuid', name: 'id_usuario' })
  idUsuario: string;

  @Column({ type: 'uuid', name: 'id_vehiculo' })
  idVehiculo: string;

  @Column({ type: 'uuid', name: 'id_empleado', nullable: true })
  idEmpleado: string | null;

  @Column({ type: 'varchar', name: 'zona_id' })
  zonaId: string;

  @Column({ type: 'varchar', name: 'espacio_id', nullable: true })
  espacioId: string | null;

  @Column({
    type: 'enum',
    enum: TipoEspacio,
    name: 'tipo_espacio',
    nullable: true,
  })
  tipoEspacio: TipoEspacio | null;

  @Column({
    type: 'enum',
    enum: TipoVehiculo,
    name: 'tipo_vehiculo',
  })
  tipoVehiculo: TipoVehiculo;

  @Column({ type: 'timestamp', name: 'fecha_hora_ingreso' })
  fechaHoraIngreso: Date;

  @Column({ type: 'timestamp', name: 'fecha_hora_salida', nullable: true })
  fechaHoraSalida: Date | null;

  @Column({ type: 'integer', name: 'tiempo_minutos', nullable: true })
  tiempoMinutos: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'valor_recaudado',
    nullable: true,
  })
  valorRecaudado: number | null;

  @Column({
    type: 'enum',
    enum: EstadoTicket,
    default: EstadoTicket.ACTIVO,
  })
  estado: EstadoTicket;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}