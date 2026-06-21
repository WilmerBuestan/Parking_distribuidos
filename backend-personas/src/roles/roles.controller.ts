import { Controller, Get, Post, Body, Param } from '@nestjs/common'; // Asegúrate de incluir Param
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Post('assign')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assignRole(assignRoleDto);
  }

  @Get('by-role/:name')
  findByRole(@Param('name') name: string) {
    // Ahora 'Param' está definido
    return this.rolesService.findByRole(name);
  }
}
