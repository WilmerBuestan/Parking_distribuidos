import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  Length, // <-- Esta es la importación que faltaba y causaba el error
} from 'class-validator';
import { TipoPersona } from '../entities/persona.entity';

export class CreatePersonaDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 11, { message: 'La cédula/RUC debe tener entre 10 y 11 dígitos' })
  @Matches(/^\d+$/, { message: 'El DNI debe contener solo números' })
  dni: string;

  @IsEmail({}, { message: 'El formato de correo no es válido' })
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'El celular debe empezar con 09 y tener 10 dígitos' })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEnum(TipoPersona)
  @IsNotEmpty()
  tipoPersona: TipoPersona;

  @IsOptional()
  @IsString()
  razonSocial?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}