import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfesionalRol } from '../profesional.entity';

export class RegisterDto {
  @ApiProperty({ example: 'profesional@mdmq.gob.ec' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  apellido: string;

  @ApiPropertyOptional({ enum: ProfesionalRol, default: ProfesionalRol.CONSULTA })
  @IsOptional()
  @IsEnum(ProfesionalRol)
  rol?: ProfesionalRol;
}
