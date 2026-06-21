import { EstadoTicket } from '../entities/ticket.entity';

export class TicketResponseDto {
  id: string;
  cedula: string;
  placa: string;
  zonaId: string;
  horaEntrada: Date;
  horaSalida: Date | null;
  tiempoMinutos: number | null;
  tarifaTotal: number | null;
  estado: EstadoTicket;
  createdAt: Date;
  updatedAt: Date;
}
