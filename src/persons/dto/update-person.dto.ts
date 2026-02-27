import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdatePersonDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  documento?: string | null;

  @ApiProperty({ required: false, type: [Object], nullable: true })
  @IsOptional()
  @IsArray()
  contactos?: any[] | null;
}
