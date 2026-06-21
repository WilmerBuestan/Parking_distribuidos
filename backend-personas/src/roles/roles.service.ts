import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Rol } from '../personas/entities/rol.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Usuario } from '../personas/entities/usuario.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    // Forzamos el tipado a string para eliminar la advertencia de 'unsafe'
    const name: string = String(createRoleDto.name);
    const roleName = name.toUpperCase();

    const existe = await this.rolRepository.findOne({
      where: { name: roleName },
    });

    if (existe) {
      throw new BadRequestException(`El rol ${roleName} ya existe`);
    }

    const rol = this.rolRepository.create({
      name: roleName,
      description: createRoleDto.description || '',
    });

    return this.rolRepository.save(rol);
  }
  async findAll() {
    return this.rolRepository.find({ where: { active: true } });
  }

  async assignRole(assignRoleDto: AssignRoleDto): Promise<{
    message: string;
    usuario: string;
    rol: string;
    estadoUsuario: string;
  }> {
    const { idUser, idRole } = assignRoleDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const usuario: Usuario | null = await queryRunner.manager.findOne(
        Usuario,
        { where: { idPerson: idUser } },
      );
      if (!usuario) throw new BadRequestException('Usuario no encontrado');

      const rol: Rol | null = await queryRunner.manager.findOne(Rol, {
        where: { id: idRole },
      });
      if (!rol) throw new BadRequestException('Rol no encontrado');

      const yaAsignado: UsuarioRol | null = await queryRunner.manager.findOne(
        UsuarioRol,
        {
          where: { idUser, idRole, active: true },
        },
      );

      if (yaAsignado) {
        throw new BadRequestException(
          'El usuario ya tiene este rol activo asignado',
        );
      }

      const nuevoUsuarioRol: UsuarioRol = queryRunner.manager.create(
        UsuarioRol,
        {
          idUser,
          idRole,
        },
      );
      await queryRunner.manager.save(UsuarioRol, nuevoUsuarioRol);

      if (!usuario.active) {
        usuario.active = true;
        await queryRunner.manager.save(Usuario, usuario);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Rol asignado correctamente',
        usuario: usuario.username,
        rol: rol.name,
        estadoUsuario: 'ACTIVO',
      };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      // Aseguramos que 'err' sea tratado como un Error
      const error = err instanceof Error ? err : new Error('Error desconocido');
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findByRole(roleName: string) {
    const rol = await this.rolRepository.findOne({
      where: { name: roleName.toUpperCase() },
      relations: {
        usuarioRoles: {
          // Asumiendo que definiste esta relación en tu entidad Rol
          usuario: true,
        },
      },
    });

    if (!rol) throw new BadRequestException('Rol no encontrado');
    return rol;
  }
}
