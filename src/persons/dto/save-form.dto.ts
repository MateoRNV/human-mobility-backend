import { ApiProperty } from '@nestjs/swagger';

class FormAnswerDto {
  @ApiProperty()
  fieldId: string;
  @ApiProperty()
  type: string;
  @ApiProperty({ required: false })
  value?: unknown;
  @ApiProperty({ required: false })
  selections?: Array<{ row: string; column: string }>;
  @ApiProperty({ required: false })
  observationsValue?: string;
  @ApiProperty({ required: false })
  observations?: string;
  @ApiProperty({ required: false })
  extraValue?: unknown;
}

export class SaveFormDto {
  @ApiProperty({ required: false })
  form_version?: number;
  @ApiProperty({ type: [FormAnswerDto] })
  answers: FormAnswerDto[];
}
