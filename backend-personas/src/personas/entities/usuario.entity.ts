import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Persona } from './persona.entity';
import { UsuarioRol } from './usuario-rol.entity';

@Entity({ name: 'users', schema: 'public' })
export class Usuario {
  @PrimaryColumn('uuid', { name: 'id_person' })
  idPerson: string;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @Column({ type: 'character varying', length: 15, unique: true })
  username: string;

  @Column({ type: 'character varying', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'timestamp without time zone',
    name: 'last_login',
    nullable: true,
  })
  lastLogin: Date;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Persona, (persona) => persona.usuario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_person' })
  persona: Persona;

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.usuario)
  usuarioRoles: UsuarioRol[];
}
