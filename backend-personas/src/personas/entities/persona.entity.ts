import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export enum TipoPersona {
  NATURAL = 'NATURAL',
  JURIDICA = 'JURIDICA',
}

@Entity({ name: 'persons', schema: 'public' })
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'character varying', length: 30, unique: true })
  dni: string;

  @Column({ type: 'character varying', length: 50, unique: true })
  email: string;

  @Column({
    type: 'character varying',
    length: 30,
    name: 'first_name',
    nullable: true,
  })
  firstName: string;

  @Column({
    type: 'character varying',
    length: 30,
    name: 'middle_name',
    nullable: true,
  })
  middleName: string;

  @Column({
    type: 'character varying',
    length: 30,
    name: 'last_name',
    nullable: true,
  })
  lastName: string;

  @Column({ type: 'character varying', length: 30, nullable: true })
  nationality: string;

  @Column({ type: 'character varying', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'character varying',
    name: 'tipo_persona',
    default: TipoPersona.NATURAL,
  })
  tipoPersona: TipoPersona;

  @Column({
    type: 'character varying',
    length: 100,
    name: 'razon_social',
    nullable: true,
  })
  razonSocial: string;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Usuario, (usuario) => usuario.persona)
  usuario: Usuario;
}
