import { ApiProperty } from '@nestjs/swagger';

export class UpdatePersonDto {
  @ApiProperty({ required: false })
  nombre?: string;
  @ApiProperty({ required: false, nullable: true })
  documento?: string | null;
}
