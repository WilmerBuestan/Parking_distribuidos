import { EstadoTicket, TipoEspacio, TipoVehiculo } from '../entities/ticket.entity';

export class TicketResponseDto {
  id: string;
  cedula: string;
  placa: string;
  idUsuario: string;
  idVehiculo: string;
  idEmpleado: string | null;
  zonaId: string;
  espacioId: string | null;
  tipoEspacio: TipoEspacio | null;
  tipoVehiculo: TipoVehiculo;
  fechaHoraIngreso: Date;
  fechaHoraSalida: Date | null;
  tiempoMinutos: number | null;
  valorRecaudado: number | null;
  estado: EstadoTicket;
  createdAt: Date;
  updatedAt: Date;
}
