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
import { Ticket, EstadoTicket, TipoVehiculo, TipoEspacio } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SearchTicketDto } from './dto/search-ticket.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

interface PersonaResponse {
  id: string;
  dni: string;
  email: string;
  firstName: string;
}

interface VehiculoResponse {
  id: string;
  placa: string;
  tipo: string;
  tipoVehiculo: string;
  disponible?: boolean;
  enParqueadero?: boolean;
}

interface ZonaResponse {
  id: string;
  disponible: boolean;
  espaciosLibres: number;
  tarifaPorHora: number;
  tipo?: string;
}

interface EspacioResponse {
  id: string;
  tipo?: string;
  tipo_espacio?: string;
}

@Injectable()
export class TicketsService {
  private readonly personasUrl: string;
  private readonly vehiculosUrl: string;
  private readonly zonasUrl: string;

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.personasUrl = this.configService.get<string>('PERSONAS_SERVICE_URL');
    this.vehiculosUrl = this.configService.get<string>('VEHICULOS_SERVICE_URL');
    this.zonasUrl = this.configService.get<string>('ZONAS_SERVICE_URL');
  }

  private async obtenerPersonaPorCedula(cedula: string): Promise<PersonaResponse> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.personasUrl}/personas/cedula/${cedula}`),
      );
      return res.data;
    } catch (error) {
      throw new BadRequestException(
        `No se encontró persona con cédula ${cedula}`,
      );
    }
  }

  private async obtenerVehiculoPorPlaca(placa: string): Promise<VehiculoResponse> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.vehiculosUrl}/vehiculos/placa/${placa}`),
      );
      return res.data;
    } catch (error) {
      throw new BadRequestException(
        `No se encontró vehículo con placa ${placa}`,
      );
    }
  }

  private async verificarVehiculoDisponible(placa: string): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${this.vehiculosUrl}/vehiculos/disponibilidad/${placa}`,
        ),
      );
      if (!res.data?.disponible) {
        throw new BadRequestException(
          `El vehículo con placa ${placa} ya se encuentra en el parqueadero`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `No se pudo verificar disponibilidad del vehículo ${placa}`,
      );
    }
  }

  private async verificarZonaDisponible(zonaId: string): Promise<ZonaResponse> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.zonasUrl}/zonas/disponibilidad/${zonaId}`),
      );
      if (!res.data?.disponible) {
        throw new BadRequestException(
          `La zona ${zonaId} no tiene espacios libres disponibles`,
        );
      }
      return res.data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `No se encontró la zona con ID ${zonaId}`,
      );
    }
  }

  private async asignarEspacio(zonaId: string): Promise<EspacioResponse> {
    try {
      const res = await firstValueFrom(
        this.httpService.patch(
          `${this.zonasUrl}/api/v1/espacios/asignar/${zonaId}`,
        ),
      );
      return res.data;
    } catch (error) {
      throw new BadRequestException(
        `No se pudo asignar un espacio libre en la zona ${zonaId}`,
      );
    }
  }

  private mapTipoVehiculo(tipo: string): TipoVehiculo {
    const tipoNormalizado = tipo.toLowerCase();
    if (tipoNormalizado.includes('motocicleta') || tipoNormalizado.includes('moto')) {
      return TipoVehiculo.MOTOCICLETA;
    }
    if (tipoNormalizado.includes('camioneta')) {
      return TipoVehiculo.CAMIONETA;
    }
    return TipoVehiculo.AUTO;
  }

  private mapTipoEspacio(tipo?: string): TipoEspacio | null {
    if (!tipo) return null;
    const tipoNormalizado = tipo.toUpperCase();
    if (tipoNormalizado.includes('PREFERENTE')) {
      return TipoEspacio.PREFERENTE;
    }
    if (tipoNormalizado.includes('DISCAPACITADO')) {
      return TipoEspacio.DISCAPACITADO;
    }
    return TipoEspacio.REGULAR;
  }

  private calcularValorRecaudado(
    tiempoMinutos: number,
    tarifaPorHora: number,
    tipoVehiculo: TipoVehiculo,
    tipoEspacio: TipoEspacio | null,
  ): number {
    let multiplicador = 1.0;

    // Ajuste por tipo de vehículo
    if (tipoVehiculo === TipoVehiculo.MOTOCICLETA) {
      multiplicador = 0.5;
    } else if (tipoVehiculo === TipoVehiculo.CAMIONETA) {
      multiplicador = 1.5;
    }

    // Ajuste por tipo de espacio
    if (tipoEspacio === TipoEspacio.PREFERENTE) {
      multiplicador *= 1.2;
    } else if (tipoEspacio === TipoEspacio.DISCAPACITADO) {
      multiplicador *= 0.8;
    }

    const tarifaAjustada = tarifaPorHora * multiplicador;
    return parseFloat(((tiempoMinutos / 60) * tarifaAjustada).toFixed(2));
  }

  async crearEntrada(dto: CreateTicketDto): Promise<Ticket> {
    // 1. Obtener y validar persona
    const persona = await this.obtenerPersonaPorCedula(dto.cedula);

    // 2. Obtener y validar vehículo
    const vehiculo = await this.obtenerVehiculoPorPlaca(dto.placa);
    await this.verificarVehiculoDisponible(dto.placa);

    // 3. Validar zona disponible
    await this.verificarZonaDisponible(dto.zonaId);

    // 4. Asignar espacio
    const espacioAsignado = await this.asignarEspacio(dto.zonaId);

    // 5. Crear ticket
    const tipoVehiculo = this.mapTipoVehiculo(vehiculo.tipoVehiculo || vehiculo.tipo);
    const tipoEspacio = this.mapTipoEspacio(espacioAsignado.tipo_espacio || espacioAsignado.tipo);

    const ticket = this.ticketRepository.create({
      cedula: dto.cedula,
      placa: dto.placa,
      idUsuario: persona.id,
      idVehiculo: vehiculo.id,
      idEmpleado: dto.idEmpleado || null,
      zonaId: dto.zonaId,
      espacioId: espacioAsignado.id,
      tipoVehiculo,
      tipoEspacio,
      fechaHoraIngreso: new Date(),
      estado: EstadoTicket.ACTIVO,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 6. Marcar vehículo como en parqueadero
    await firstValueFrom(
      this.httpService.patch(
        `${this.vehiculosUrl}/vehiculos/placa/${dto.placa}/estado-parqueo`,
        { enParqueadero: true },
      ),
    ).catch(() => null);

    return ticketGuardado;
  }

  async procesarSalida(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} no encontrado`);
    }

    if (ticket.estado !== EstadoTicket.ACTIVO) {
      throw new BadRequestException(
        `El ticket ${ticketId} no está activo. Estado: ${ticket.estado}`,
      );
    }

    const fechaHoraSalida = new Date();
    const diffMs = fechaHoraSalida.getTime() - ticket.fechaHoraIngreso.getTime();
    const tiempoMinutos = Math.ceil(diffMs / 60000);

    // Obtener tarifa de la zona
    let tarifaPorHora = 1.0;
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.zonasUrl}/zonas/${ticket.zonaId}`),
      );
      if (res.data?.tarifaPorHora) {
        tarifaPorHora = res.data.tarifaPorHora;
      }
    } catch {
      // Si no se puede obtener la tarifa, se usa el valor por defecto
    }

    // Calcular valor recaudado considerando tipo de vehículo y espacio
    const valorRecaudado = this.calcularValorRecaudado(
      tiempoMinutos,
      tarifaPorHora,
      ticket.tipoVehiculo,
      ticket.tipoEspacio,
    );

    ticket.fechaHoraSalida = fechaHoraSalida;
    ticket.tiempoMinutos = tiempoMinutos;
    ticket.valorRecaudado = valorRecaudado;
    ticket.estado = EstadoTicket.ACTIVO;

    const ticketActualizado = await this.ticketRepository.save(ticket);

    // Liberar espacio
    if (ticket.espacioId) {
      await firstValueFrom(
        this.httpService.patch(
          `${this.zonasUrl}/api/v1/espacios/${ticket.espacioId}/estado?nuevoEstado=LIBRE`,
        ),
      ).catch(() => null);
    }

    return ticketActualizado;
  }

  async procesarPago(dto: ProcessPaymentDto): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${dto.ticketId} no encontrado`);
    }

    if (ticket.estado === EstadoTicket.ANULADO) {
      throw new BadRequestException(
        `El ticket ${dto.ticketId} ha sido anulado`,
      );
    }

    if (ticket.estado === EstadoTicket.PAGADO) {
      throw new BadRequestException(
        `El ticket ${dto.ticketId} ya ha sido pagado`,
      );
    }

    if (!ticket.valorRecaudado) {
      throw new BadRequestException(
        `El ticket ${dto.ticketId} no tiene valor registrado. Debe procesar la salida primero`,
      );
    }

    if (dto.montoPagado < ticket.valorRecaudado) {
      throw new BadRequestException(
        `Monto insuficiente. Debe pagar ${ticket.valorRecaudado}, se intenta pagar ${dto.montoPagado}`,
      );
    }

    ticket.estado = EstadoTicket.PAGADO;
    ticket.idEmpleado = dto.idEmpleado || ticket.idEmpleado;

    const ticketPagado = await this.ticketRepository.save(ticket);

    // Liberar vehículo del parqueadero
    await firstValueFrom(
      this.httpService.patch(
        `${this.vehiculosUrl}/vehiculos/placa/${ticket.placa}/estado-parqueo`,
        { enParqueadero: false },
      ),
    ).catch(() => null);

    return ticketPagado;
  }

  async anularTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} no encontrado`);
    }

    if (ticket.estado === EstadoTicket.PAGADO) {
      throw new BadRequestException(
        `No se puede anular un ticket ya pagado`,
      );
    }

    ticket.estado = EstadoTicket.ANULADO;
    const ticketAnulado = await this.ticketRepository.save(ticket);

    // Liberar espacio
    if (ticket.espacioId) {
      await firstValueFrom(
        this.httpService.patch(
          `${this.zonasUrl}/api/v1/espacios/${ticket.espacioId}/estado?nuevoEstado=LIBRE`,
        ),
      ).catch(() => null);
    }

    // Liberar vehículo
    await firstValueFrom(
      this.httpService.patch(
        `${this.vehiculosUrl}/vehiculos/placa/${ticket.placa}/estado-parqueo`,
        { enParqueadero: false },
      ),
    ).catch(() => null);

    return ticketAnulado;
  }

  async findActivos(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { estado: EstadoTicket.ACTIVO },
      order: { fechaHoraIngreso: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }
    return ticket;
  }

  async buscarPorCedula(cedula: string): Promise<Ticket[]> {
    if (!cedula || cedula.trim().length === 0) {
      throw new BadRequestException('La cédula es requerida');
    }
    return this.ticketRepository.find({
      where: { cedula },
      order: { fechaHoraIngreso: 'DESC' },
    });
  }

  async buscarPorPlaca(placa: string): Promise<Ticket[]> {
    if (!placa || placa.trim().length === 0) {
      throw new BadRequestException('La placa es requerida');
    }
    return this.ticketRepository.find({
      where: { placa },
      order: { fechaHoraIngreso: 'DESC' },
    });
  }

  async buscar(dto: SearchTicketDto): Promise<Ticket[]> {
    if (!dto.cedula && !dto.placa) {
      throw new BadRequestException(
        'Debe proporcionar al menos una cédula o placa para buscar',
      );
    }

    if (dto.cedula && dto.placa) {
      return this.ticketRepository.find({
        where: [
          { cedula: dto.cedula },
          { placa: dto.placa },
        ],
        order: { fechaHoraIngreso: 'DESC' },
      });
    }

    if (dto.cedula) {
      return this.buscarPorCedula(dto.cedula);
    }

    return this.buscarPorPlaca(dto.placa);
  }

  async obtenerPorEstado(estado: EstadoTicket): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { estado },
      order: { fechaHoraIngreso: 'DESC' },
    });
  }
}
