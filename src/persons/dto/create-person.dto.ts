import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreatePersonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  documento?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  parentId?: number | null;
}
