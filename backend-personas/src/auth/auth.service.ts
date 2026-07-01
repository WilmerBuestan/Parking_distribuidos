import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { PersonasService } from '../personas/personas.service';
import { RolesService } from '../roles/roles.service';
import { CreatePersonaDto } from '../personas/dto/create-persona.dto';
import { UpdatePersonaDto } from '../personas/dto/update-persona.dto';
import { Usuario } from '../personas/entities/usuario.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Rol } from '../personas/entities/rol.entity';
import { RefreshToken } from '../personas/entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_DIAS = 7;

@Injectable()
export class AuthService {
  private readonly vehiculosUrl: string;
  private readonly asignacionesUrl: string;

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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.vehiculosUrl =
      this.configService.get<string>('VEHICULOS_SERVICE_URL') ?? 'http://localhost:3002';
    this.asignacionesUrl =
      this.configService.get<string>('ASIGNACIONES_SERVICE_URL') ?? 'http://localhost:3005';
  }

  // ===== Auth (ya existente) =====

  async register(dto: CreatePersonaDto) {
    const resultado = await this.personasService.create(dto);
    const idPerson = resultado.persona.id as string;

    const usuario = await this.usuarioRepository.findOne({
      where: { idPerson },
    });
    if (!usuario) {
      throw new BadRequestException('No se pudo localizar el usuario recién creado');
    }

    usuario.active = true;
    await this.usuarioRepository.save(usuario);

    const rolCliente = await this.rolRepository.findOne({ where: { name: 'CLIENTE' } });
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

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { username: dto.username },
      relations: { persona: true },
    });

    if (!usuario || !usuario.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { roles, permisos } = await this.obtenerRolesYPermisos(usuario.idPerson);

    const accessToken = await this.generarAccessToken(usuario, roles, permisos);
    const refreshToken = await this.generarYGuardarRefreshToken(usuario.idPerson);

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

    const { roles, permisos } = await this.obtenerRolesYPermisos(usuario.idPerson);
    const accessToken = await this.generarAccessToken(usuario, roles, permisos);

    return { accessToken };
  }

  async logout(refreshTokenPlano: string) {
    const tokenHash = this.hashToken(refreshTokenPlano);
    const registro = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (registro) {
      registro.revocado = true;
      await this.refreshTokenRepository.save(registro);
    }

    return { message: 'Sesión cerrada correctamente' };
  }

  // ===== Fase D: Endpoints de CLIENTE =====

  /**
   * GET /auth/me — devuelve los datos completos del usuario autenticado:
   * persona, username, roles y permisos. El userId se extrae del JWT,
   * nunca de un parámetro, así que un CLIENTE solo puede ver SUS datos.
   */
  async getMe(userId: string) {
    const persona = await this.personasService.findOne(userId);
    const { roles, permisos } = await this.obtenerRolesYPermisos(userId);

    const usuario = await this.usuarioRepository.findOne({
      where: { idPerson: userId },
    });

    return {
      persona,
      usuario: {
        username: usuario?.username,
        active: usuario?.active,
      },
      roles,
      permisos,
    };
  }

  /**
   * PATCH /auth/me — actualiza los datos propios del usuario autenticado.
   * Reutiliza PersonasService.update() con el ID que viene del JWT.
   */
  async updateMe(userId: string, dto: UpdatePersonaDto) {
    return this.personasService.update(userId, dto);
  }

  /**
   * GET /auth/mis-vehiculos — consulta los vehículos asignados al usuario
   * autenticado, llamando a asignacion-trazabilidad que a su vez agrega
   * datos de vehiculos-service (RF3 que ya probamos).
   */
  async getMisVehiculos(userId: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.asignacionesUrl}/asignaciones/usuario/${userId}`),
      );
      return res.data;
    } catch {
      // Si asignacion-trazabilidad no está corriendo, devolvemos vacío
      // en vez de fallar con 500, para que el frontend no se rompa.
      return { userId, totalVehiculos: 0, vehiculos: [], aviso: 'Servicio de asignaciones no disponible' };
    }
  }

  // ===== Helpers privados =====

  private async obtenerRolesYPermisos(
    idPerson: string,
  ): Promise<{ roles: string[]; permisos: string[] }> {
    const vinculos = await this.usuarioRolRepository.find({
      where: { idUser: idPerson, active: true },
      relations: { rol: true },
    });

    const roles = vinculos
      .filter((v) => v.rol?.active)
      .map((v) => v.rol.name);

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

  private hashToken(tokenPlano: string): string {
    return crypto.createHash('sha256').update(tokenPlano).digest('hex');
  }
}