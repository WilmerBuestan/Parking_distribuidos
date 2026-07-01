import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SearchTicketDto } from './dto/search-ticket.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { Ticket, EstadoTicket } from './entities/ticket.entity';
import { TicketResponseDto } from './dto/ticket-response.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('entrada')
  @ApiOperation({ summary: 'Crear un nuevo ticket de entrada' })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o conflictos' })
  crearEntrada(@Body() createTicketDto: CreateTicketDto): Promise<TicketResponseDto> {
    return this.ticketsService.crearEntrada(createTicketDto);
  }

  @Patch('salida/:ticketId')
  @ApiOperation({ summary: 'Procesar la salida de un ticket' })
  @ApiResponse({ status: 200, description: 'Salida procesada exitosamente' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  procesarSalida(@Param('ticketId') ticketId: string): Promise<TicketResponseDto> {
    return this.ticketsService.procesarSalida(ticketId);
  }

  @Patch('pago')
  @ApiOperation({ summary: 'Procesar el pago de un ticket' })
  @ApiResponse({ status: 200, description: 'Pago procesado exitosamente' })
  @ApiResponse({ status: 400, description: 'Monto insuficiente o ticket en estado inválido' })
  procesarPago(@Body() processPaymentDto: ProcessPaymentDto): Promise<TicketResponseDto> {
    return this.ticketsService.procesarPago(processPaymentDto);
  }

  @Patch('anular/:ticketId')
  @ApiOperation({ summary: 'Anular un ticket' })
  @ApiResponse({ status: 200, description: 'Ticket anulado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  anularTicket(@Param('ticketId') ticketId: string): Promise<TicketResponseDto> {
    return this.ticketsService.anularTicket(ticketId);
  }

  @Get('activos')
  @ApiOperation({ summary: 'Obtener todos los tickets activos' })
  @ApiResponse({ status: 200, description: 'Lista de tickets activos' })
  findActivos(): Promise<TicketResponseDto[]> {
    return this.ticketsService.findActivos();
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar tickets por cédula o placa' })
  @ApiQuery({ name: 'cedula', required: false, type: String })
  @ApiQuery({ name: 'placa', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Búsqueda realizada exitosamente' })
  buscar(@Query('cedula') cedula?: string, @Query('placa') placa?: string): Promise<TicketResponseDto[]> {
    return this.ticketsService.buscar({ cedula, placa });
  }

  @Get('cedula/:cedula')
  @ApiOperation({ summary: 'Buscar tickets por cédula' })
  @ApiResponse({ status: 200, description: 'Tickets encontrados' })
  buscarPorCedula(@Param('cedula') cedula: string): Promise<TicketResponseDto[]> {
    return this.ticketsService.buscarPorCedula(cedula);
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Buscar tickets por placa' })
  @ApiResponse({ status: 200, description: 'Tickets encontrados' })
  buscarPorPlaca(@Param('placa') placa: string): Promise<TicketResponseDto[]> {
    return this.ticketsService.buscarPorPlaca(placa);
  }

  @Get('estado/:estado')
  @ApiOperation({ summary: 'Obtener tickets por estado' })
  @ApiResponse({ status: 200, description: 'Tickets encontrados' })
  obtenerPorEstado(@Param('estado') estado: EstadoTicket): Promise<TicketResponseDto[]> {
    return this.ticketsService.obtenerPorEstado(estado);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  @ApiResponse({ status: 200, description: 'Ticket encontrado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findOne(@Param('id') id: string): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(id);
  }
}
