import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Asignacion, EstadoAsignacion } from './entities/asignacion.entity';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';

/**
 * Forma mínima en la que vehiculos-service responde un vehículo.
 * Solo se declaran los campos que realmente se consumen aquí; el resto
 * de campos que el otro servicio devuelva simplemente se ignoran.
 */
interface VehiculoDto {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  clasificacion: string;
  obtenerTipo?: string;
  tipo?: string;
}

@Injectable()
export class AsignacionService {
  private readonly personasUrl: string;
  private readonly vehiculosUrl: string;

  constructor(
    @InjectRepository(Asignacion)
    private readonly asignacionRepository: Repository<Asignacion>,
    @InjectRepository(EventoAuditoria)
    private readonly auditoriaRepository: Repository<EventoAuditoria>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.personasUrl =
      this.configService.get<string>('PERSONAS_SERVICE_URL') ??
      'http://localhost:3001';
    this.vehiculosUrl =
      this.configService.get<string>('VEHICULOS_SERVICE_URL') ??
      'http://localhost:3002';
  }

  /**
   * RF1: crea la asignación, validando:
   * 1. Que el usuario exista (personas-service).
   * 2. Que el vehículo exista (vehiculos-service).
   * 3. Que el vehículo NO tenga ya otra asignación ACTIVA con un usuario distinto
   *    (regla de negocio: "un vehículo solo puede estar asignado a un propietario
   *    activo a la vez" — esto NO lo garantiza la clave compuesta por sí sola,
   *    porque permitiría el mismo vehicleId con un userId distinto sin problema
   *    a nivel de base de datos. Se valida explícitamente aquí).
   */
  async crear(dto: CreateAsignacionDto): Promise<Asignacion> {
    await this.validarUsuarioExiste(dto.userId);
    await this.validarVehiculoExiste(dto.vehicleId);

    const yaExisteMismaClave = await this.asignacionRepository.findOne({
      where: { userId: dto.userId, vehicleId: dto.vehicleId },
    });
    if (yaExisteMismaClave) {
      throw new BadRequestException(
        `Ya existe una asignación para este usuario y vehículo (estado: ${yaExisteMismaClave.estado})`,
      );
    }

    const asignacionActivaDeOtroUsuario =
      await this.asignacionRepository.findOne({
        where: { vehicleId: dto.vehicleId, estado: EstadoAsignacion.ACTIVA },
      });
    if (asignacionActivaDeOtroUsuario) {
      throw new BadRequestException(
        `El vehículo ${dto.vehicleId} ya está asignado activamente a otro propietario (${asignacionActivaDeOtroUsuario.userId})`,
      );
    }

    const asignacion = this.asignacionRepository.create({
      userId: dto.userId,
      vehicleId: dto.vehicleId,
      estado: EstadoAsignacion.ACTIVA,
    });

    // El guardado dispara automáticamente AsignacionSubscriber.afterInsert(),
    // que registra el evento de auditoría CREACION sin que este método lo invoque.
    return this.asignacionRepository.save(asignacion);
  }

  /**
   * Finaliza una asignación (no la borra físicamente, cambia su estado).
   * Esto dispara afterUpdate() en el subscriber → evento MODIFICACION.
   */
  async finalizar(userId: string, vehicleId: string): Promise<Asignacion> {
    const asignacion = await this.asignacionRepository.findOne({
      where: { userId, vehicleId },
    });
    if (!asignacion) {
      throw new NotFoundException(
        `No existe asignación para userId=${userId} y vehicleId=${vehicleId}`,
      );
    }
    if (asignacion.estado === EstadoAsignacion.FINALIZADA) {
      throw new BadRequestException('Esta asignación ya está finalizada');
    }

    asignacion.estado = EstadoAsignacion.FINALIZADA;
    asignacion.fechaFinalizacion = new Date();
    return this.asignacionRepository.save(asignacion);
  }

  /**
   * Elimina físicamente una asignación (dispara afterRemove() → evento ELIMINACION).
   * Se mantiene separado de "finalizar" porque eliminar es destructivo y
   * finalizar es el flujo normal de negocio (terminar la propiedad sin perder histórico).
   */
  async eliminar(userId: string, vehicleId: string): Promise<void> {
    const asignacion = await this.asignacionRepository.findOne({
      where: { userId, vehicleId },
    });
    if (!asignacion) {
      throw new NotFoundException(
        `No existe asignación para userId=${userId} y vehicleId=${vehicleId}`,
      );
    }
    await this.asignacionRepository.remove(asignacion);
  }

  /**
   * RF3: dado un propietario, retorna su flota completa, agregando los datos
   * reales de cada vehículo (tipo, categoría) desde vehiculos-service mediante
   * el endpoint batch (una sola llamada HTTP en vez de N).
   */
  async consultarFlotaPorUsuario(userId: string) {
    await this.validarUsuarioExiste(userId);

    const asignaciones = await this.asignacionRepository.find({
      where: { userId, estado: EstadoAsignacion.ACTIVA },
    });

    if (asignaciones.length === 0) {
      return { userId, totalVehiculos: 0, vehiculos: [] };
    }

    const vehicleIds = asignaciones.map((a) => a.vehicleId);

    let vehiculos: VehiculoDto[] = [];
    try {
      const res = await firstValueFrom(
        this.httpService.post<VehiculoDto[]>(
          `${this.vehiculosUrl}/vehiculos/batch`,
          {
            ids: vehicleIds,
          },
        ),
      );
      vehiculos = res.data;
    } catch {
      throw new BadRequestException(
        'No se pudo obtener el detalle de los vehículos desde vehiculos-service',
      );
    }

    return {
      userId,
      totalVehiculos: vehiculos.length,
      vehiculos: vehiculos.map((v) => ({
        vehicleId: v.id,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        tipo: v.obtenerTipo ?? v.tipo, // discriminador de TypeORM (Auto/Camioneta/Motocicleta)
        categoria: v.clasificacion, // Electrico/Hibrido/Gasolina/Diesel
      })),
    };
  }

  /** Historial de auditoría de una asignación específica (RF2, endpoint de apoyo) */
  async historialAuditoria(
    userId: string,
    vehicleId: string,
  ): Promise<EventoAuditoria[]> {
    return this.auditoriaRepository.find({
      where: { userId, vehicleId },
      order: { timestamp: 'ASC' },
    });
  }

  private async validarUsuarioExiste(userId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.personasUrl}/personas/${userId}`),
      );
    } catch {
      throw new BadRequestException(
        `No se encontró un usuario con ID ${userId}`,
      );
    }
  }

  private async validarVehiculoExiste(vehicleId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.vehiculosUrl}/vehiculos/${vehicleId}`),
      );
    } catch {
      throw new BadRequestException(
        `No se encontró un vehículo con ID ${vehicleId}`,
      );
    }
  }
}
