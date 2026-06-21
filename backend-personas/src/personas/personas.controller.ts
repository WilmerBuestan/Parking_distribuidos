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
@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personasService.create(createPersonaDto);
  }

  @Get()
  findAll() {
    return this.personasService.findAll();
  }

  @Get('cedula/:cedula')
  findByCedula(@Param('cedula') cedula: string) {
    return this.personasService.findByCedula(cedula);
  }

  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.personasService.findByUsername(username);
  }

  @Get('apellido/:apellido')
  findByApellido(@Param('apellido') apellido: string) {
    return this.personasService.findByApellido(apellido);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaDto) {
    return this.personasService.update(id, updatePersonaDto);
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.personasService.cambiarEstado(id, body.active);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // Quitamos el '+' para que pase el UUID como string
    return this.personasService.remove(id);
  }
}
