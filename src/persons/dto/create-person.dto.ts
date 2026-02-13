import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty()
  name: string;
  @ApiProperty({ required: false, nullable: true })
  document?: string | null;
}
