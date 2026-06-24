import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAsignacionDto {
  @ApiProperty({ example: '29ded413-94e0-423e-84c0-b8161ef4d6fe' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '1be7a7b5-42f7-4555-bf49-c4d325202452' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;
}