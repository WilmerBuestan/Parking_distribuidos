import { Vehiculo } from './vehiculo.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity('Auto')
export class Auto extends Vehiculo {
  @Column()
  numeroPuertas!: number;
  @Column()
  capacidadMaletero!: number;
  obtenerTipo(): string {
    return 'Auto';
  }
}
