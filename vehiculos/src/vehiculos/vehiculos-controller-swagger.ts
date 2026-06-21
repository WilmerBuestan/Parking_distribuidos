import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@ApiTags('vehiculos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un nuevo vehículo (Auto, Camioneta o Motocicleta)',
  })
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculosService.create(createVehiculoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los vehículos registrados' })
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Get('placa/:placa')
  @ApiOperation({
    summary: 'Buscar vehículo por placa (uso interno de tickets-service)',
  })
  @ApiParam({ name: 'placa', example: 'PBA-3256' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'No existe vehículo con esa placa' })
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findByPlaca(placa);
  }

  @Get('disponibilidad/:placa')
  @ApiOperation({
    summary: 'Consultar si un vehículo está disponible (fuera del parqueadero)',
  })
  @ApiParam({ name: 'placa', example: 'PBA-3256' })
  @ApiResponse({
    status: 200,
    description: 'Objeto { disponible, vehiculo } con el estado actual',
  })
  checkDisponibilidad(@Param('placa') placa: string) {
    return this.vehiculosService.checkDisponibilidad(placa);
  }

  @Patch('placa/:placa/estado-parqueo')
  @ApiOperation({
    summary:
      'Marcar un vehículo como dentro/fuera del parqueadero (usado al emitir o cerrar un ticket)',
  })
  @ApiParam({ name: 'placa', example: 'PBA-3256' })
  actualizarEstadoParqueo(
    @Param('placa') placa: string,
    @Body() body: { enParqueadero: boolean },
  ) {
    return this.vehiculosService.actualizarEstadoParqueo(
      placa,
      body.enParqueadero,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por su ID interno (UUID)' })
  findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un vehículo' })
  update(
    @Param('id') id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un vehículo' })
  remove(@Param('id') id: string) {
    return this.vehiculosService.remove(id);
  }
}
