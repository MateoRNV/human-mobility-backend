import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FormsService } from './forms.service';

@ApiTags('formularios')
@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

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
