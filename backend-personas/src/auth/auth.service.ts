import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PersonasService } from '../personas/personas.service';
import { RolesService } from '../roles/roles.service';
import { CreatePersonaDto } from '../personas/dto/create-persona.dto';
import { Usuario } from '../personas/entities/usuario.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Rol } from '../personas/entities/rol.entity';
import { RefreshToken } from '../personas/entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_DIAS = 7;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly personasService: PersonasService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registro público. Reutiliza PersonasService.create() (que ya crea
   * Persona + Usuario con su username autogenerado), y luego:
   * 1. Activa el usuario inmediatamente (sin aprobación manual).
   * 2. Le asigna el rol CLIENTE, que es la base de todo usuario registrado.
   */
  async register(dto: CreatePersonaDto) {
    const resultado = await this.personasService.create(dto);
    const idPerson = resultado.persona.id as string;

    const usuario = await this.usuarioRepository.findOne({
      where: { idPerson },
    });
    if (!usuario) {
      throw new BadRequestException(
        'No se pudo localizar el usuario recién creado',
      );
    }

    usuario.active = true;
    await this.usuarioRepository.save(usuario);

    const rolCliente = await this.rolRepository.findOne({
      where: { name: 'CLIENTE' },
    });
    if (rolCliente) {
      const vinculo = this.usuarioRolRepository.create({
        idUser: idPerson,
        idRole: rolCliente.id,
      });
      await this.usuarioRolRepository.save(vinculo);
    }

    return {
      message: 'Usuario registrado y activado correctamente',
      username: usuario.username,
      persona: resultado.persona,
    };
  }

  /**
   * Login por username + password. Genera un par de tokens:
   * - accessToken: corto, lleva roles y permisos, se verifica localmente
   *   en cada microservicio sin llamar a personas-service.
   * - refreshToken: largo, se guarda hasheado en BD, permite revocación.
   */
  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { username: dto.username },
      relations: { persona: true },
    });

    if (!usuario || !usuario.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { roles, permisos } = await this.obtenerRolesYPermisos(
      usuario.idPerson,
    );

    const accessToken = await this.generarAccessToken(usuario, roles, permisos);
    const refreshToken = await this.generarYGuardarRefreshToken(
      usuario.idPerson,
    );

    return {
      accessToken,
      refreshToken,
      usuario: {
        username: usuario.username,
        roles,
        permisos,
      },
    };
  }

  /**
   * Recibe un refresh token, valida que exista, no esté revocado ni expirado,
   * y emite un accessToken NUEVO con los permisos actuales del usuario
   * (por si cambiaron desde el último login).
   */
  async refresh(refreshTokenPlano: string) {
    const tokenHash = this.hashToken(refreshTokenPlano);

    const registro = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!registro || registro.revocado || registro.expiraEn < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idPerson: registro.idUser },
    });
    if (!usuario || !usuario.active) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const { roles, permisos } = await this.obtenerRolesYPermisos(
      usuario.idPerson,
    );
    const accessToken = await this.generarAccessToken(usuario, roles, permisos);

    return { accessToken };
  }

  /** Revoca un refresh token específico (cierra solo esa sesión). */
  async logout(refreshTokenPlano: string) {
    const tokenHash = this.hashToken(refreshTokenPlano);
    const registro = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (registro) {
      registro.revocado = true;
      await this.refreshTokenRepository.save(registro);
    }

    return { message: 'Sesión cerrada correctamente' };
  }

  // ===== Helpers privados =====

  private async obtenerRolesYPermisos(
    idPerson: string,
  ): Promise<{ roles: string[]; permisos: string[] }> {
    const vinculos = await this.usuarioRolRepository.find({
      where: { idUser: idPerson, active: true },
      relations: { rol: true },
    });

    const roles = vinculos.filter((v) => v.rol?.active).map((v) => v.rol.name);

    const permisos = await this.rolesService.obtenerPermisosDeRoles(roles);

    return { roles, permisos };
  }

  private async generarAccessToken(
    usuario: Usuario,
    roles: string[],
    permisos: string[],
  ): Promise<string> {
    const payload = {
      sub: usuario.idPerson,
      username: usuario.username,
      roles,
      permisos,
    };
    return this.jwtService.signAsync(payload);
  }

  private async generarYGuardarRefreshToken(idPerson: string): Promise<string> {
    const tokenPlano = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(tokenPlano);

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + REFRESH_TOKEN_DIAS);

    const registro = this.refreshTokenRepository.create({
      idUser: idPerson,
      tokenHash,
      expiraEn,
      revocado: false,
    });
    await this.refreshTokenRepository.save(registro);

    return tokenPlano;
  }

  /** El refresh token nunca se guarda en texto plano, solo su hash SHA-256. */
  private hashToken(tokenPlano: string): string {
    return crypto.createHash('sha256').update(tokenPlano).digest('hex');
  }
}
