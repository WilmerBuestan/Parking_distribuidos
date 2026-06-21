import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { Auto } from '../entities/auto.entity';
import { Vehiculo } from '../entities/vehiculo.entity';
import { Camioneta } from '../entities/camioneta.entity';
import { Motocicleta } from '../entities/motocicleta.entity';

export class FactoryVehiculos {
  static crear(dto: CreateVehiculoDto): Vehiculo {
    // CORRECCIÓN 3: Unificación de nombres
    switch (dto.tipo) {
      case 'Auto': {
        const auto = new Auto();
        Object.assign(auto, dto.datos);
        return auto;
      }
      case 'Motocicleta': {
        const moto = new Motocicleta();
        Object.assign(moto, dto.datos);
        return moto;
      }
      case 'Camioneta': {
        const camion = new Camioneta();
        Object.assign(camion, dto.datos);
        return camion;
      }
      default:
        throw new Error(`Tipo de vehículo no soportado: ${dto.tipo}`);
    }
  }
}
