import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfesionalRol } from '../profesional.entity';

export class UpdateProfesionalDto {
  @ApiPropertyOptional({ enum: ProfesionalRol })
  @IsOptional()
  @IsEnum(ProfesionalRol)
  rol?: ProfesionalRol;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
