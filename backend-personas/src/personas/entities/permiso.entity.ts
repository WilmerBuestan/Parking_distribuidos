import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolPermiso } from './rol-permiso.entity';

/**
 * Catálogo de permisos granulares del sistema.
 *
 * El campo "codigo" sigue la convención "modulo:accion" (ej. "zonas:gestionar",
 * "tickets:emitir", "usuarios:eliminar_fisico"). El campo "modulo" identifica
 * de qué microservicio/dominio proviene, para que el sistema quede abierto:
 * cuando se agregue un microservicio nuevo (ej. "marketing"), simplemente se
 * insertan sus permisos aquí (ej. "marketing:gestionar_campañas") sin tocar
 * el esquema de Rol ni de Usuario.
 */
@Entity({ name: 'permisos' })
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', length: 100, unique: true })
  codigo: string;

  @Column({ type: 'character varying', length: 50 })
  modulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.permiso)
  rolPermisos: RolPermiso[];
}
