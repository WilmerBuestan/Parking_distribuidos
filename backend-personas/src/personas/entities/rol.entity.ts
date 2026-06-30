import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UsuarioRol } from './usuario-rol.entity';
import { RolPermiso } from './rol-permiso.entity';

@Entity({ name: 'roles', schema: 'public' })
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'character varying', length: 50, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.rol)
  usuarioRoles: UsuarioRol[];

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.rol)
  rolPermisos: RolPermiso[];
}
