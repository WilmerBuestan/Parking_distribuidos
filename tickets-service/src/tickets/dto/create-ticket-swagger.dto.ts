import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: '1712345678', description: 'Cédula de la persona' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({ example: 'PBA-3256', description: 'Placa del vehículo' })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({
    example: '2287d61b-a911-4266-8c3a-e7678756102d',
    description: 'UUID de la zona donde se emite el ticket',
  })
  @IsString()
  @IsNotEmpty()
  zonaId: string;
}