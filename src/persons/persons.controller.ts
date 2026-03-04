import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('personas')
@ApiBearerAuth()
@Controller('api/personas')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  findAll() {
    return this.personsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personsService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreatePersonDto,
    @CurrentUser() user: { email: string },
  ) {
    return this.personsService.create(dto, user.email);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() user: { email: string },
  ) {
    return this.personsService.update(id, dto, user.email);
  }
}
