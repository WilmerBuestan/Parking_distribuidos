import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';

@Entity({ name: 'rol_permiso', schema: 'public' })
export class RolPermiso {
  @PrimaryColumn('uuid', { name: 'id_role' })
  idRole: string;

  @PrimaryColumn('uuid', { name: 'id_permiso' })
  idPermiso: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    name: 'assigned_at',
  })
  assignedAt: Date;

  @ManyToOne(() => Rol, (rol) => rol.rolPermisos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_role' })
  rol: Rol;

  @ManyToOne(() => Permiso, (permiso) => permiso.rolPermisos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_permiso' })
  permiso: Permiso;
}
