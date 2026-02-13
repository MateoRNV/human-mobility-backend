import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { SaveFormDto } from './dto/save-form.dto';

@ApiTags('personas')
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
  create(@Body() dto: CreatePersonDto) {
    return this.personsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.personsService.update(id, dto);
  }

  @Get(':personaId/cuestionarios/:slug')
  getForm(
    @Param('personaId', ParseIntPipe) personaId: number,
    @Param('slug') slug: string,
  ) {
    return this.personsService.getForm(personaId, slug);
  }

  @Put(':personaId/cuestionarios/:slug')
  saveForm(
    @Param('personaId', ParseIntPipe) personaId: number,
    @Param('slug') slug: string,
    @Body() dto: SaveFormDto,
  ) {
    return this.personsService.saveForm(personaId, slug, dto);
  }
}
