import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('entrada')
  @ApiOperation({
    summary: 'Emitir un ticket de entrada',
    description:
      'Valida persona, disponibilidad del vehículo y de la zona, asigna un ' +
      'espacio libre específico, crea el ticket y marca el vehículo como en parqueadero.',
  })
  @ApiResponse({ status: 201, description: 'Ticket creado, estado ABIERTO' })
  @ApiResponse({
    status: 400,
    description:
      'Persona/vehículo/zona no encontrados, vehículo ya en parqueadero, o sin espacios libres',
  })
  crearEntrada(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.crearEntrada(createTicketDto);
  }

  @Patch('salida/:ticketId')
  @ApiOperation({
    summary: 'Procesar la salida de un ticket',
    description:
      'Calcula tiempo transcurrido y tarifa según la zona, cierra el ticket, ' +
      'y libera tanto el vehículo como el espacio que tenía asignado.',
  })
  @ApiParam({ name: 'ticketId', example: '59914ba6-f572-4d78-82d7-44cb4485998e' })
  @ApiResponse({ status: 200, description: 'Ticket cerrado, con tarifa calculada' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  @ApiResponse({ status: 400, description: 'El ticket ya estaba cerrado' })
  procesarSalida(@Param('ticketId') ticketId: string) {
    return this.ticketsService.procesarSalida(ticketId);
  }

  @Get('activos')
  @ApiOperation({ summary: 'Listar todos los tickets actualmente ABIERTOS' })
  findActivos() {
    return this.ticketsService.findActivos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un ticket por su ID' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }
}