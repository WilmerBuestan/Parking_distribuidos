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
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@ApiTags('personas')
@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva persona y su usuario asociado' })
  create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personasService.create(createPersonaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las personas activas' })
  findAll() {
    return this.personasService.findAll();
  }

  @Get('cedula/:cedula')
  @ApiOperation({
    summary: 'Buscar persona por cédula (uso interno de tickets-service)',
  })
  @ApiParam({ name: 'cedula', example: '1712345678' })
  @ApiResponse({ status: 200, description: 'Persona encontrada' })
  @ApiResponse({ status: 404, description: 'No existe persona con esa cédula' })
  findByCedula(@Param('cedula') cedula: string) {
    return this.personasService.findByCedula(cedula);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Buscar persona por username de su usuario' })
  @ApiParam({ name: 'username', example: 'wbuestan' })
  @ApiResponse({ status: 200, description: 'Persona encontrada' })
  @ApiResponse({
    status: 404,
    description: 'No existe usuario con ese username',
  })
  findByUsername(@Param('username') username: string) {
    return this.personasService.findByUsername(username);
  }

  @Get('apellido/:apellido')
  @ApiOperation({
    summary:
      'Buscar personas por apellido (coincidencia parcial, sin distinguir mayúsculas)',
  })
  @ApiParam({ name: 'apellido', example: 'Buestan' })
  @ApiResponse({
    status: 200,
    description: 'Lista de personas coincidentes (puede ser vacía)',
  })
  findByApellido(@Param('apellido') apellido: string) {
    return this.personasService.findByApellido(apellido);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una persona por su ID interno (UUID)' })
  findOne(@Param('id') id: string) {
    return this.personasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una persona' })
  update(@Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaDto) {
    return this.personasService.update(id, updatePersonaDto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Activar o desactivar una persona' })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.personasService.cambiarEstado(id, body.active);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar (soft delete) una persona' })
  remove(@Param('id') id: string) {
    // Quitamos el '+' para que pase el UUID como string
    return this.personasService.remove(id);
  }
}
