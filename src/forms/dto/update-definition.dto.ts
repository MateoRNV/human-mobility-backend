import { ApiProperty } from '@nestjs/swagger';

export class UpdateDefinitionDto {
  @ApiProperty({ required: false })
  nombre?: string;

  @ApiProperty({ required: false })
  version?: number;

  @ApiProperty({ description: 'Esquema JSON completo del formulario' })
  configuracion: Record<string, any>;
}
