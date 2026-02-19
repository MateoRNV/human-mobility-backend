import { ApiProperty } from '@nestjs/swagger';

class RespuestaCuestionarioDto {
  @ApiProperty()
  campoId: string;
  @ApiProperty()
  tipo: string;
  @ApiProperty({ required: false })
  valor?: unknown;
  @ApiProperty({ required: false })
  selecciones?: Array<{ fila: string; columna: string }>;
  @ApiProperty({ required: false })
  valorObservaciones?: string;
  @ApiProperty({ required: false })
  observaciones?: string;
  @ApiProperty({ required: false })
  valorExtra?: unknown;
}

export class SaveFormDto {
  @ApiProperty({ required: false })
  version_cuestionario?: number;
  @ApiProperty({ type: [RespuestaCuestionarioDto] })
  respuestas: RespuestaCuestionarioDto[];
}
