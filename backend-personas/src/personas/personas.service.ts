import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { Persona, TipoPersona } from './entities/persona.entity';
import { Usuario } from './entities/usuario.entity';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPersonaDto: CreatePersonaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const persona = queryRunner.manager.create(Persona, {
        dni: createPersonaDto.dni,
        email: createPersonaDto.email,
        firstName: createPersonaDto.firstName,
        middleName: createPersonaDto.middleName, // Nuevo campo
        lastName: createPersonaDto.lastName,
        nationality: createPersonaDto.nationality, // Nuevo campo
        phone: createPersonaDto.phone, // Nuevo campo
        address: createPersonaDto.address, // Nuevo campo
        tipoPersona: createPersonaDto.tipoPersona || TipoPersona.NATURAL,
        razonSocial: createPersonaDto.razonSocial,
      });

      const savedPersona = await queryRunner.manager.save(persona);

      const baseUsername = this.generateBaseUsername(createPersonaDto);
      const finalUsername = await this.getAvailableUsername(
        baseUsername,
        queryRunner,
      );

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createPersonaDto.password,
        saltRounds,
      );

      const usuario = queryRunner.manager.create(Usuario, {
        idPerson: savedPersona.id,
        username: finalUsername,
        passwordHash: hashedPassword,
        active: false,
      });

      await queryRunner.manager.save(usuario);
      await queryRunner.commitTransaction();

      return {
        message: 'Persona y Usuario creados exitosamente',
        persona: savedPersona,
        usuario: {
          username: usuario.username,
          active: usuario.active,
        },
      };
    } catch (err: unknown) {
      // Se usa 'unknown' por buenas prácticas de TypeScript
      await queryRunner.rollbackTransaction();

      // Casteamos el error a una interfaz conocida para que ESLint permita leer 'code' y 'message'
      const error = err as Error & { code?: string };

      if (error.code === '23505') {
        throw new BadRequestException(
          'El DNI o el Email ya están registrados.',
        );
      }
      throw new InternalServerErrorException(
        'Error al crear el registro: ' + (error.message || 'Error desconocido'),
      );
    } finally {
      await queryRunner.release();
    }
  }

  private generateBaseUsername(dto: CreatePersonaDto): string {
    if (dto.tipoPersona === TipoPersona.JURIDICA && dto.razonSocial) {
      return dto.razonSocial
        .split(' ')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    }
    const firstLetter = dto.firstName
      ? dto.firstName.charAt(0).toLowerCase()
      : '';
    const lastName = dto.lastName
      ? dto.lastName.toLowerCase().replace(/[^a-z0-9]/g, '')
      : 'user';
    return `${firstLetter}${lastName}`;
  }

  private async getAvailableUsername(
    baseUsername: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    let username = baseUsername;
    let counter = 1;
    let exists = true;

    while (exists) {
      const user = await queryRunner.manager.findOne(Usuario, {
        where: { username },
      });
      if (!user) {
        exists = false;
      } else {
        username = `${baseUsername}${counter}`;
        counter++;
      }
    }
    return username;
  }

  async findAll() {
    return this.personaRepository.find({
      where: { active: true },
      relations: { usuario: true }, // Sintaxis actualizada para TypeORM
    });
  }

  async findOne(id: string) {
    const persona = await this.personaRepository.findOne({
      where: { id, active: true },
      relations: { usuario: true }, // Sintaxis actualizada para TypeORM
    });

    if (!persona) {
      throw new BadRequestException('Persona no encontrada o inactiva');
    }
    return persona;
  }

  async update(id: string, updatePersonaDto: UpdatePersonaDto) {
    await this.findOne(id); // Reutilizamos la validación de existencia

    // Copiamos los datos para mantener el tipado estricto y eliminamos el password si existe
    const datosPersona = { ...updatePersonaDto };
    delete datosPersona.password;

    await this.personaRepository.update(id, datosPersona);

    return this.findOne(id); // Devolvemos el registro actualizado
  }

  async remove(id: string) {
    // 1. Buscamos la persona con su usuario
    const persona = await this.personaRepository.findOne({
      where: { id },
      relations: { usuario: true }, // Asegúrate de usar la sintaxis de objeto
    });

    if (!persona) {
      throw new BadRequestException('Persona no encontrada');
    }

    // 2. REGLA DE NEGOCIO: Si el usuario está activo, prohibir desactivación de la persona
    if (persona.usuario && persona.usuario.active) {
      throw new BadRequestException(
        'Acción denegada: No se puede desactivar a una persona mientras su usuario tenga acceso activo. Primero desactive el usuario.',
      );
    }

    // 3. Si llega aquí, es porque el usuario ya está inactivo o no tiene usuario, procedemos
    persona.active = false;
    await this.personaRepository.save(persona);

    return {
      message: `La persona con DNI ${persona.dni} ha sido desactivada correctamente`,
    };
  }

  // ===== MÉTODOS DE BÚSQUEDA PARA TICKETS-SERVICE =====

  async findByCedula(cedula: string) {
    const persona = await this.personaRepository.findOne({
      where: { dni: cedula, active: true },
      relations: { usuario: true },
    });
    if (!persona) {
      throw new NotFoundException(
        `No se encontró persona con cédula ${cedula}`,
      );
    }
    return persona;
  }

  async findByUsername(username: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { username },
      relations: { persona: true },
    });
    if (!usuario) {
      throw new NotFoundException(
        `No se encontró usuario con username ${username}`,
      );
    }
    return usuario.persona;
  }

  async findByApellido(apellido: string) {
    return this.personaRepository.find({
      where: { lastName: ILike(`%${apellido}%`), active: true },
      relations: { usuario: true },
    });
  }

  async cambiarEstado(id: string, nuevoEstado: boolean) {
    const persona = await this.personaRepository.findOne({
      where: { id },
      relations: { usuario: true },
    });

    if (!persona) throw new BadRequestException('Persona no encontrada');

    // Regla: Si quiero desactivar (false) y el usuario está activo, bloqueo.
    if (nuevoEstado === false && persona.usuario?.active) {
      throw new BadRequestException(
        'No puedes desactivar a esta persona. Primero desactiva su usuario.',
      );
    }

    persona.active = nuevoEstado;
    return await this.personaRepository.save(persona);
  }
}
