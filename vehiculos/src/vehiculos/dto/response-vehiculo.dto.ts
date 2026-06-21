import { TipoMoto } from '../entities/motocicleta.entity';

export class ResponseVehiculoDto {
  id!: string;
  placa!: string;
  marca!: string;
  modelo!: string;
  color!: string;
  anio!: number;
  clasificacion!: string;
  tipo!: string;
  numeroPuertas!: number;
  capacidadMaletero!: number;
  capacidadCarga!: number;
  cabina!: string;
  tipoMoto!: TipoMoto;
}
