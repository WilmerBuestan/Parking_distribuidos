import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchTicketDto {
  @ApiProperty({
    description: 'Cédula del usuario',
    example: '1718456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  cedula?: string;

  @ApiProperty({
    description: 'Placa del vehículo',
    example: 'ABC-1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  placa?: string;
}
