import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

export enum Clasificacion {
  ELECTRICO = 'Electrico',
  HIBRIDO = 'Hibrido',
  GASOLINA = 'Gasolina',
  DIESEL = 'Diesel',
}

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export abstract class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  placa!: string;

  @Column()
  marca!: string;

  @Column()
  modelo!: string;

  @Column()
  color!: string;

  @Column()
  anio!: number;

  @Column({
    type: 'enum',
    enum: Clasificacion,
  })
  clasificacion!: Clasificacion;

  @Column({ type: 'boolean', name: 'en_parqueadero', default: false })
  enParqueadero!: boolean;

  abstract obtenerTipo(): string;
}
