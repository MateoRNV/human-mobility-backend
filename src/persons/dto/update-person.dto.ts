import { ApiProperty } from '@nestjs/swagger';

export class UpdatePersonDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false, nullable: true })
  document?: string | null;
}
