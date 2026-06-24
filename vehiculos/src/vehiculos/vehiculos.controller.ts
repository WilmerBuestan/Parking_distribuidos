import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculosService.create(createVehiculoDto);
  }

  @Get()
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Post('batch')
  @ApiOperation({
    summary:
      'Buscar varios vehículos por lista de IDs (uso interno entre microservicios)',
  })
  findByIds(@Body() body: { ids: string[] }) {
    return this.vehiculosService.findByIds(body.ids);
  }

  @Get('placa/:placa')
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findByPlaca(placa);
  }

  @Get('disponibilidad/:placa')
  checkDisponibilidad(@Param('placa') placa: string) {
    return this.vehiculosService.checkDisponibilidad(placa);
  }

  @Patch('placa/:placa/estado-parqueo')
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
  findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiculosService.remove(id);
  }
}
