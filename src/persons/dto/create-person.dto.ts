import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty()
  nombre: string;
  @ApiProperty({ required: false, nullable: true })
  documento?: string | null;
  @ApiProperty({ required: false, nullable: true })
  parentId?: number | null;
}
