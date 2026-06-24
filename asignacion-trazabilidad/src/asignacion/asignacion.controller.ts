import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AsignacionService } from './asignacion.service';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';

@ApiTags('asignaciones')
@Controller('asignaciones')
export class AsignacionController {
  constructor(private readonly asignacionService: AsignacionService) {}

  @Post()
  @ApiOperation({
    summary: 'Asignar un vehículo a un propietario',
    description:
      'Valida que el usuario y el vehículo existan, y que el vehículo no tenga ' +
      'ya otra asignación ACTIVA con un propietario distinto. Dispara automáticamente ' +
      'un evento de auditoría CREACION.',
  })
  crear(@Body() dto: CreateAsignacionDto) {
    return this.asignacionService.crear(dto);
  }

  @Patch(':userId/:vehicleId/finalizar')
  @ApiOperation({
    summary: 'Finalizar una asignación (sin eliminarla)',
    description:
      'Marca la asignación como FINALIZADA. Dispara un evento de auditoría MODIFICACION.',
  })
  @ApiParam({ name: 'userId', example: '29ded413-94e0-423e-84c0-b8161ef4d6fe' })
  @ApiParam({
    name: 'vehicleId',
    example: '1be7a7b5-42f7-4555-bf49-c4d325202452',
  })
  finalizar(
    @Param('userId') userId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.asignacionService.finalizar(userId, vehicleId);
  }

  @Delete(':userId/:vehicleId')
  @ApiOperation({
    summary: 'Eliminar físicamente una asignación',
    description: 'Dispara un evento de auditoría ELIMINACION.',
  })
  eliminar(
    @Param('userId') userId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.asignacionService.eliminar(userId, vehicleId);
  }

  @Get('usuario/:userId')
  @ApiOperation({
    summary: 'RF3 — Consultar la flota completa de un propietario',
    description:
      'Devuelve los vehículos ACTIVOS asignados al usuario, agregando tipo y ' +
      'categoría reales desde vehiculos-service mediante una llamada batch.',
  })
  consultarFlota(@Param('userId') userId: string) {
    return this.asignacionService.consultarFlotaPorUsuario(userId);
  }

  @Get('auditoria/:userId/:vehicleId')
  @ApiOperation({
    summary: 'Historial de auditoría de una asignación específica',
    description:
      'Lista todos los eventos (CREACION, MODIFICACION, ELIMINACION) registrados automáticamente.',
  })
  historial(
    @Param('userId') userId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.asignacionService.historialAuditoria(userId, vehicleId);
  }
}
