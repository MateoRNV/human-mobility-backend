import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';

class RespuestaCuestionarioDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  campoId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  valor?: unknown;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  selecciones?: Array<{ fila: string; columna: string }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  valorObservaciones?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  valorExtra?: unknown;
}

export class SaveFormDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  version_cuestionario?: number;

  @ApiProperty({ type: [RespuestaCuestionarioDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaCuestionarioDto)
  respuestas: RespuestaCuestionarioDto[];
}
