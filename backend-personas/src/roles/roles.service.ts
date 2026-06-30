import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { AssignPermisoDto } from './dto/assign-permiso.dto';
import { Rol } from '../personas/entities/rol.entity';
import { UsuarioRol } from '../personas/entities/usuario-rol.entity';
import { Usuario } from '../personas/entities/usuario.entity';
import { Permiso } from '../personas/entities/permiso.entity';
import { RolPermiso } from '../personas/entities/rol-permiso.entity';

/**
 * Catálogo de roles y permisos base del sistema. Se siembra automáticamente
 * al arrancar la aplicación (ver onModuleInit), de forma idempotente: si el
 * rol o permiso ya existe, no se duplica ni se sobreescribe.
 *
 * "ROOT" usa el permiso wildcard "*", que el Guard de autorización interpreta
 * como acceso total a CUALQUIER permiso, incluyendo los que se creen después
 * para microservicios futuros (ej. "marketing:gestionar_campañas").
 */
const PERMISOS_BASE: { codigo: string; modulo: string; descripcion: string }[] =
  [
    // Cliente
    {
      codigo: 'zonas:ver',
      modulo: 'zonas',
      descripcion: 'Ver listado de zonas',
    },
    {
      codigo: 'espacios:ver',
      modulo: 'zonas',
      descripcion: 'Ver listado de espacios',
    },
    {
      codigo: 'vehiculos:ver_propios',
      modulo: 'vehiculos',
      descripcion: 'Ver los propios vehículos',
    },
    {
      codigo: 'vehiculos:crear_propio',
      modulo: 'vehiculos',
      descripcion: 'Registrar un vehículo propio',
    },
    {
      codigo: 'usuario:ver_propio',
      modulo: 'personas',
      descripcion: 'Ver los propios datos de usuario',
    },
    {
      codigo: 'usuario:actualizar_propio',
      modulo: 'personas',
      descripcion: 'Actualizar los propios datos',
    },

    // Admin
    {
      codigo: 'zonas:gestionar',
      modulo: 'zonas',
      descripcion: 'Crear, editar e inactivar zonas',
    },
    {
      codigo: 'espacios:gestionar',
      modulo: 'zonas',
      descripcion: 'Crear, editar e inactivar espacios',
    },
    {
      codigo: 'vehiculos:gestionar',
      modulo: 'vehiculos',
      descripcion: 'Gestionar cualquier vehículo',
    },
    {
      codigo: 'roles:gestionar',
      modulo: 'personas',
      descripcion: 'Crear roles y asignar permisos',
    },
    {
      codigo: 'usuarios:gestionar',
      modulo: 'personas',
      descripcion: 'Gestionar cualquier usuario',
    },
    {
      codigo: 'asignaciones:gestionar',
      modulo: 'asignaciones',
      descripcion: 'Gestionar asignaciones vehículo-propietario',
    },

    // Recaudador
    {
      codigo: 'tickets:emitir',
      modulo: 'tickets',
      descripcion: 'Emitir tickets de entrada',
    },
    {
      codigo: 'tickets:cobrar',
      modulo: 'tickets',
      descripcion: 'Cobrar/cerrar tickets',
    },

    // Root (wildcard, ver nota arriba)
    {
      codigo: '*',
      modulo: 'sistema',
      descripcion: 'Acceso total a cualquier permiso del sistema',
    },
  ];

const ROLES_BASE: { name: string; description: string; permisos: string[] }[] =
  [
    {
      name: 'CLIENTE',
      description: 'Rol base de todo usuario registrado',
      permisos: [
        'zonas:ver',
        'espacios:ver',
        'vehiculos:ver_propios',
        'vehiculos:crear_propio',
        'usuario:ver_propio',
        'usuario:actualizar_propio',
      ],
    },
    {
      name: 'ADMIN',
      description:
        'Gestión operativa de zonas, espacios, vehículos, roles y usuarios',
      permisos: [
        'zonas:gestionar',
        'espacios:gestionar',
        'vehiculos:gestionar',
        'roles:gestionar',
        'usuarios:gestionar',
        'asignaciones:gestionar',
      ],
    },
    {
      name: 'RECAUDADOR',
      description: 'Emisión y cobro de tickets',
      permisos: ['tickets:emitir', 'tickets:cobrar'],
    },
    {
      name: 'ROOT',
      description:
        'Acceso total, incluida la eliminación física de cualquier entidad',
      permisos: ['*'],
    },
  ];

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Permiso)
    private readonly permisoRepository: Repository<Permiso>,
    @InjectRepository(RolPermiso)
    private readonly rolPermisoRepository: Repository<RolPermiso>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Se ejecuta una sola vez, automáticamente, cuando el módulo arranca.
   * Es idempotente: en arranques posteriores no duplica nada, solo
   * verifica que cada rol/permiso/vínculo exista y lo crea si falta.
   */
  async onModuleInit() {
    await this.seedPermisosYRoles();
  }

  private async seedPermisosYRoles(): Promise<void> {
    // 1. Crear los permisos base que no existan aún
    const permisosCreados = new Map<string, Permiso>();
    for (const def of PERMISOS_BASE) {
      let permiso = await this.permisoRepository.findOne({
        where: { codigo: def.codigo },
      });
      if (!permiso) {
        permiso = await this.permisoRepository.save(
          this.permisoRepository.create(def),
        );
      }
      permisosCreados.set(def.codigo, permiso);
    }

    // 2. Crear los roles base que no existan, y vincular sus permisos
    for (const def of ROLES_BASE) {
      let rol = await this.rolRepository.findOne({ where: { name: def.name } });
      if (!rol) {
        rol = await this.rolRepository.save(
          this.rolRepository.create({
            name: def.name,
            description: def.description,
          }),
        );
      }

      for (const codigoPermiso of def.permisos) {
        const permiso = permisosCreados.get(codigoPermiso);
        if (!permiso) continue;

        const yaVinculado = await this.rolPermisoRepository.findOne({
          where: { idRole: rol.id, idPermiso: permiso.id },
        });
        if (!yaVinculado) {
          await this.rolPermisoRepository.save(
            this.rolPermisoRepository.create({
              idRole: rol.id,
              idPermiso: permiso.id,
            }),
          );
        }
      }
    }
  }

  // ===== Roles (ya existente, sin cambios) =====

  async create(createRoleDto: CreateRoleDto) {
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
          usuario: true,
        },
      },
    });

    if (!rol) throw new BadRequestException('Rol no encontrado');
    return rol;
  }

  // ===== Permisos (nuevo) =====

  async createPermiso(dto: CreatePermisoDto) {
    const existe = await this.permisoRepository.findOne({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw new BadRequestException(`El permiso "${dto.codigo}" ya existe`);
    }
    const permiso = this.permisoRepository.create(dto);
    return this.permisoRepository.save(permiso);
  }

  async findAllPermisos() {
    return this.permisoRepository.find({ where: { active: true } });
  }

  async assignPermiso(dto: AssignPermisoDto) {
    const rol = await this.rolRepository.findOne({ where: { id: dto.idRole } });
    if (!rol) throw new BadRequestException('Rol no encontrado');

    const permiso = await this.permisoRepository.findOne({
      where: { id: dto.idPermiso },
    });
    if (!permiso) throw new BadRequestException('Permiso no encontrado');

    const yaVinculado = await this.rolPermisoRepository.findOne({
      where: { idRole: dto.idRole, idPermiso: dto.idPermiso },
    });
    if (yaVinculado) {
      throw new BadRequestException('Este permiso ya está asignado a este rol');
    }

    const vinculo = this.rolPermisoRepository.create({
      idRole: dto.idRole,
      idPermiso: dto.idPermiso,
    });
    await this.rolPermisoRepository.save(vinculo);

    return {
      message: 'Permiso asignado correctamente',
      rol: rol.name,
      permiso: permiso.codigo,
    };
  }

  /**
   * Dado un array de nombres de rol (los que tenga un usuario), devuelve
   * el conjunto de códigos de permiso (sin duplicados) que esos roles otorgan.
   * Es la pieza que usa el módulo de Auth al generar el JWT en el login.
   */
  async obtenerPermisosDeRoles(nombresRoles: string[]): Promise<string[]> {
    if (nombresRoles.length === 0) return [];

    const roles = await this.rolRepository.find({
      where: nombresRoles.map((name) => ({ name, active: true })),
      relations: { rolPermisos: { permiso: true } },
    });

    const codigos = new Set<string>();
    for (const rol of roles) {
      for (const rp of rol.rolPermisos ?? []) {
        if (rp.active && rp.permiso?.active) {
          codigos.add(rp.permiso.codigo);
        }
      }
    }
    return Array.from(codigos);
  }
}
