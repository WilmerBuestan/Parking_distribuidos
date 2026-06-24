import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Repository } from 'typeorm';
import { FactoryVehiculos } from './factory/factory-vehiculos';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private respositoryVehiculos: Repository<Vehiculo>,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const existe = await this.respositoryVehiculos.findOne({
      where: { placa: createVehiculoDto.datos.placa },
    });
    if (existe) {
      throw new Error(
        `Ya existe un vehículo con la placa ${createVehiculoDto.datos.placa}`,
      );
    }

    // CORRECCIÓN 3: Usar el Factory para instanciar la clase hija correcta
    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);

    // Guardar el vehículo ya instanciado con su respectiva clase
    return this.respositoryVehiculos.save(vehiculo);
  }

  async findAll(): Promise<Vehiculo[]> {
    return this.respositoryVehiculos.find();
  }

  async findByIds(ids: string[]): Promise<Vehiculo[]> {
    if (!ids || ids.length === 0) return [];
    return this.respositoryVehiculos
      .createQueryBuilder('vehiculo')
      .where('vehiculo.id IN (:...ids)', { ids })
      .getMany();
  }

  async findOne(id: string): Promise<Vehiculo> {
    const existe = await this.respositoryVehiculos.findOne({
      where: { id },
    });
    if (!existe) {
      throw new Error(`No se encontró un vehículo con el id ${id}`);
    }
    return existe;
  }

  async update(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    Object.assign(vehiculo, updateVehiculoDto.datos);
    return this.respositoryVehiculos.save(vehiculo);
  }

  async remove(id: string): Promise<void> {
    const vehiculo = await this.findOne(id);
    await this.respositoryVehiculos.remove(vehiculo);
  }

  async findByPlaca(placa: string): Promise<Vehiculo> {
    const vehiculo = await this.respositoryVehiculos.findOne({
      where: { placa },
    });
    if (!vehiculo) {
      throw new NotFoundException(`No se encontró vehículo con placa ${placa}`);
    }
    return vehiculo;
  }

  async checkDisponibilidad(
    placa: string,
  ): Promise<{ disponible: boolean; vehiculo: Vehiculo }> {
    const vehiculo = await this.findByPlaca(placa);
    return { disponible: !vehiculo.enParqueadero, vehiculo };
  }

  async actualizarEstadoParqueo(
    placa: string,
    enParqueadero: boolean,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findByPlaca(placa);
    vehiculo.enParqueadero = enParqueadero;
    return this.respositoryVehiculos.save(vehiculo);
  }
}
