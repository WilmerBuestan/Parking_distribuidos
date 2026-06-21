import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';

@Entity({ name: 'user_role', schema: 'public' })
export class UsuarioRol {
  @PrimaryColumn('uuid', { name: 'id_user' })
  idUser: string;

  @PrimaryColumn('uuid', { name: 'id_role' })
  idRole: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    name: 'assigned_at',
  })
  assignedAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  usuario: Usuario;

  @ManyToOne(() => Rol, (rol) => rol.usuarioRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_role' })
  rol: Rol;
}
