import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { SubmissionsService } from './submissions.service';
import { UpdateDefinitionDto } from './dto/update-definition.dto';
import { SaveFormDto } from './dto/save-form.dto';

@ApiTags('formularios')
@Controller('api/forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly submissionsService: SubmissionsService,
  ) {}

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

  @Get('definition/:slug/versions')
  async getDefinitionVersions(@Param('slug') slug: string) {
    const versions = await this.formsService.getVersionsBySlug(slug);

    if (!versions.length) {
      throw new NotFoundException(
        `No se encontraron versiones para el slug "${slug}".`,
      );
    }

    return versions.map((def) => ({
      id: def.id,
      version: def.version,
      nombre: def.nombre,
      fechaCreacion: def.fechaCreacion,
      fechaModificacion: def.fechaModificacion,
    }));
  }

  @Get('definition/:slug/version/:version')
  async getDefinitionByVersion(
    @Param('slug') slug: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    const definition = await this.formsService.getDefinitionBySlugAndVersion(
      slug,
      version,
    );

    if (!definition) {
      throw new NotFoundException(
        `No se encontró la definición del formulario con slug "${slug}" y versión ${version}.`,
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

  @Get('submissions/:personaId/:slug/history')
  @ApiOperation({ summary: 'Historial de envios de un cuestionario' })
  getFormHistory(
    @Param('personaId', ParseIntPipe) personaId: number,
    @Param('slug') slug: string,
  ) {
    return this.submissionsService.getFormHistory(personaId, slug);
  }

  @Get('submissions/:personaId/:slug')
  getForm(
    @Param('personaId', ParseIntPipe) personaId: number,
    @Param('slug') slug: string,
  ) {
    return this.submissionsService.getForm(personaId, slug);
  }

  @Put('submissions/:personaId/:slug')
  saveForm(
    @Param('personaId', ParseIntPipe) personaId: number,
    @Param('slug') slug: string,
    @Body() dto: SaveFormDto,
  ) {
    return this.submissionsService.saveForm(personaId, slug, dto);
  }
}
