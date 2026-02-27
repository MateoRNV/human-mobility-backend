import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { UpdateDefinitionDto } from './dto/update-definition.dto';

@ApiTags('formularios')
@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('definitions')
  async getAllDefinitions() {
    const definitions = await this.formsService.getAllDefinitions();
    return definitions.map((def) => ({
      id: def.id,
      slug: def.slug,
      version: def.version,
      nombre: def.nombre,
    }));
  }

  @Get('definition/:slug')
  async getDefinition(@Param('slug') slug: string) {
    const definition = await this.formsService.getDefinitionBySlug(slug);

    if (!definition) {
      throw new NotFoundException(
        `No se encontró la definición del formulario con slug "${slug}".`,
      );
    }

    return {
      id: definition.id,
      slug: definition.slug,
      version: definition.version,
      nombre: definition.nombre,
      configuracion: definition.configuracionJson
        ? JSON.parse(definition.configuracionJson)
        : null,
    };
  }

  @Put('definition/:slug')
  @ApiOperation({ summary: 'Actualizar definicion de formulario' })
  async updateDefinition(
    @Param('slug') slug: string,
    @Body() dto: UpdateDefinitionDto,
  ) {
    const updated = await this.formsService.updateDefinition(slug, dto);
    return {
      id: updated.id,
      slug: updated.slug,
      version: updated.version,
      nombre: updated.nombre,
      configuracion: updated.configuracionJson
        ? JSON.parse(updated.configuracionJson)
        : null,
    };
  }
}
