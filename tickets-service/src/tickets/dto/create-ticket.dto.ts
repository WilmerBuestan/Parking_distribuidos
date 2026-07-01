import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Cédula del usuario',
    example: '1718456789',
  })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({
    description: 'Placa del vehículo',
    example: 'ABC-1234',
  })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({
    description: 'ID de la zona',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  zonaId: string;

  @ApiProperty({
    description: 'ID del empleado (sesión)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  idEmpleado?: string;
}
