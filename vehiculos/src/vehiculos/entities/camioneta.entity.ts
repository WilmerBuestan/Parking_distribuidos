import { Vehiculo } from './vehiculo.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity('Camioneta')
export class Camioneta extends Vehiculo {
  @Column()
  capacidadCarga!: number;
  @Column()
  cabina!: string;

  obtenerTipo(): string {
    return 'Camioneta';
  }
}
