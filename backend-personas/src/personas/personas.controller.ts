import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { RequierePermiso } from '../auth/guards/requiere-permiso.decorator';

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @RequierePermiso('usuarios:gestionar')
  @Post()
  create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personasService.create(createPersonaDto);
  }

  @RequierePermiso('usuarios:gestionar')
  @Get()
  findAll() {
    return this.personasService.findAll();
  }

  @RequierePermiso('usuarios:gestionar')
  @Get('cedula/:cedula')
  findByCedula(@Param('cedula') cedula: string) {
    return this.personasService.findByCedula(cedula);
  }

  @RequierePermiso('usuarios:gestionar')
  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.personasService.findByUsername(username);
  }

  @RequierePermiso('usuarios:gestionar')
  @Get('apellido/:apellido')
  findByApellido(@Param('apellido') apellido: string) {
    return this.personasService.findByApellido(apellido);
  }

  @RequierePermiso('usuarios:gestionar')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personasService.findOne(id);
  }

  @RequierePermiso('usuarios:gestionar')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaDto) {
    return this.personasService.update(id, updatePersonaDto);
  }

  @RequierePermiso('usuarios:gestionar')
  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() body: { active: boolean }) {
    return this.personasService.cambiarEstado(id, body.active);
  }

  @RequierePermiso('usuarios:gestionar')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personasService.remove(id);
  }
}
