import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

/**
 * Cada fila representa una sesión activa (móvil, web, etc.). El refresh
 * token en sí NUNCA se guarda en texto plano, solo su hash (tokenHash),
 * igual que se hace con las contraseñas. Esto permite revocar sesiones
 * individuales (ej. "cerrar sesión en todos los dispositivos") sin afectar
 * las demás, y sin que un volcado de la base de datos filtre tokens usables.
 */
@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'id_user' })
  idUser: string;

  @Column({ type: 'character varying', length: 255, name: 'token_hash' })
  tokenHash: string;

  @Column({ type: 'timestamp without time zone', name: 'expira_en' })
  expiraEn: Date;

  @Column({ type: 'boolean', default: false })
  revocado: boolean;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user' })
  usuario: Usuario;
}
