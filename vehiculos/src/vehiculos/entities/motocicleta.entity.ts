import { Vehiculo } from './vehiculo.entity';
import { ChildEntity, Column } from 'typeorm';

export enum TipoMoto {
  DEPORTIVA = 'Deportiva',
  SCOOTER = 'Scooter',
  MOTOCROSS = 'Motocross',
}

@ChildEntity('Motocicleta')
export class Motocicleta extends Vehiculo {
  @Column({
    type: 'enum',
    enum: TipoMoto,
    name: 'tipo_moto', // Evita cualquier conflicto en Postgres
  })
  tipoMoto!: TipoMoto; // Cambiado de 'tipo' a 'tipoMoto'

  obtenerTipo(): string {
    return 'Motocicleta';
  }
}
