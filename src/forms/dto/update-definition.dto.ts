import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsNotEmpty,
} from 'class-validator';

export class UpdateDefinitionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiProperty({ description: 'Esquema JSON completo del formulario' })
  @IsObject()
  @IsNotEmpty()
  configuracion: Record<string, unknown>;
}
