import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('entrada')
  crearEntrada(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.crearEntrada(createTicketDto);
  }

  @Patch('salida/:ticketId')
  procesarSalida(@Param('ticketId') ticketId: string) {
    return this.ticketsService.procesarSalida(ticketId);
  }

  @Get('activos')
  findActivos() {
    return this.ticketsService.findActivos();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }
}
