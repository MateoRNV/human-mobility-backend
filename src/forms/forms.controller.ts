import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FormsService } from './forms.service';

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
}
