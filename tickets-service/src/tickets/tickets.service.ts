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
import { Ticket, EstadoTicket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

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

  async crearEntrada(dto: CreateTicketDto): Promise<Ticket> {
    // 1. Validar que la persona existe
    try {
      await firstValueFrom(
        this.httpService.get(`${this.personasUrl}/personas/cedula/${dto.cedula}`),
      );
    } catch {
      throw new BadRequestException(
        `No se encontró persona con cédula ${dto.cedula}`,
      );
    }

    // 2. Validar que el vehículo existe y está disponible
    let disponibilidadVehiculo: { disponible: boolean };
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${this.vehiculosUrl}/vehiculos/disponibilidad/${dto.placa}`,
        ),
      );
      disponibilidadVehiculo = res.data;
    } catch {
      throw new BadRequestException(
        `No se encontró vehículo con placa ${dto.placa}`,
      );
    }

    if (!disponibilidadVehiculo.disponible) {
      throw new BadRequestException(
        `El vehículo con placa ${dto.placa} ya se encuentra en el parqueadero`,
      );
    }

    // 3. Validar que la zona tiene espacios disponibles
    let zonaDisponibilidad: { disponible: boolean; espaciosLibres: number };
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${this.zonasUrl}/zonas/disponibilidad/${dto.zonaId}`,
        ),
      );
      zonaDisponibilidad = res.data;
    } catch {
      throw new BadRequestException(
        `No se encontró la zona con ID ${dto.zonaId}`,
      );
    }

    if (!zonaDisponibilidad.disponible) {
      throw new BadRequestException(
        `La zona ${dto.zonaId} no tiene espacios libres disponibles (${zonaDisponibilidad.espaciosLibres} libres)`,
      );
    }

    // 4. Asignar y ocupar un espacio específico DENTRO de la zona
    // Se hace ANTES de crear el ticket: si esto falla, no queda un ticket huérfano sin espacio real.
    let espacioAsignado: { id: string };
    try {
      const res = await firstValueFrom(
        this.httpService.patch(
          `${this.zonasUrl}/api/v1/espacios/asignar/${dto.zonaId}`,
        ),
      );
      espacioAsignado = res.data;
    } catch {
      throw new BadRequestException(
        `No se pudo asignar un espacio libre en la zona ${dto.zonaId}`,
      );
    }

    // 5. Crear el ticket, ya con el espacio confirmado y ocupado
    const ticket = this.ticketRepository.create({
      cedula: dto.cedula,
      placa: dto.placa,
      zonaId: dto.zonaId,
      espacioId: espacioAsignado.id,
      horaEntrada: new Date(),
      estado: EstadoTicket.ABIERTO,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 6. Marcar el vehículo como en parqueadero
    await firstValueFrom(
      this.httpService.patch(
        `${this.vehiculosUrl}/vehiculos/placa/${dto.placa}/estado-parqueo`,
        { enParqueadero: true },
      ),
    );

    return ticketGuardado;
  }

  async procesarSalida(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} no encontrado`);
    }

    if (ticket.estado === EstadoTicket.CERRADO) {
      throw new BadRequestException(`El ticket ${ticketId} ya está cerrado`);
    }

    const horaSalida = new Date();
    const diffMs = horaSalida.getTime() - ticket.horaEntrada.getTime();
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

    const tarifaTotal = parseFloat(
      ((tiempoMinutos / 60) * tarifaPorHora).toFixed(2),
    );

    ticket.horaSalida = horaSalida;
    ticket.tiempoMinutos = tiempoMinutos;
    ticket.tarifaTotal = tarifaTotal;
    ticket.estado = EstadoTicket.CERRADO;

    const ticketCerrado = await this.ticketRepository.save(ticket);

    // Liberar el vehículo en el servicio de vehículos
    await firstValueFrom(
      this.httpService.patch(
        `${this.vehiculosUrl}/vehiculos/placa/${ticket.placa}/estado-parqueo`,
        { enParqueadero: false },
      ),
    ).catch(() => null);

    // Liberar el espacio específico ocupado, simétrico a la asignación en crearEntrada
    if (ticket.espacioId) {
      await firstValueFrom(
        this.httpService.patch(
          `${this.zonasUrl}/api/v1/espacios/${ticket.espacioId}/estado?nuevoEstado=LIBRE`,
        ),
      ).catch(() => null);
    }

    return ticketCerrado;
  }

  async findActivos(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { estado: EstadoTicket.ABIERTO },
      order: { horaEntrada: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }
    return ticket;
  }
}