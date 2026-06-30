import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { AssignPermisoDto } from './dto/assign-permiso.dto';
import { RequierePermiso } from '../auth/guards/requiere-permiso.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequierePermiso('roles:gestionar')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @RequierePermiso('roles:gestionar')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @RequierePermiso('roles:gestionar')
  @Post('assign')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assignRole(assignRoleDto);
  }

  @RequierePermiso('roles:gestionar')
  @Get('by-role/:name')
  findByRole(@Param('name') name: string) {
    return this.rolesService.findByRole(name);
  }

  @RequierePermiso('roles:gestionar')
  @Post('permisos')
  createPermiso(@Body() dto: CreatePermisoDto) {
    return this.rolesService.createPermiso(dto);
  }

  @RequierePermiso('roles:gestionar')
  @Get('permisos')
  findAllPermisos() {
    return this.rolesService.findAllPermisos();
  }

  @RequierePermiso('roles:gestionar')
  @Post('permisos/assign')
  assignPermiso(@Body() dto: AssignPermisoDto) {
    return this.rolesService.assignPermiso(dto);
  }
}