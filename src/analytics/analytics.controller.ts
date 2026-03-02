import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService, AnalyticsResponse } from './analytics.service';

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':slug/fields')
  @ApiOperation({ summary: 'Campos disponibles para gráficos' })
  @ApiParam({ name: 'slug', description: 'Slug del cuestionario' })
  async getChartableFields(@Param('slug') slug: string) {
    return this.analyticsService.getChartableFields(slug);
  }

  @Get(':slug/overview')
  @ApiOperation({ summary: 'Resumen general con métricas clave' })
  @ApiParam({ name: 'slug', description: 'Slug del cuestionario' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getOverview(
    @Param('slug') slug: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getOverview(slug, { from, to });
  }

  @Get(':slug/field/:campoId')
  @ApiOperation({ summary: 'Distribución de respuestas para un campo' })
  @ApiParam({ name: 'slug', description: 'Slug del cuestionario' })
  @ApiParam({ name: 'campoId', description: 'ID del campo' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getFieldDistribution(
    @Param('slug') slug: string,
    @Param('campoId') campoId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getFieldDistribution(slug, campoId, {
      from,
      to,
    });
  }

  @Get(':slug/timeseries/:campoId')
  @ApiOperation({ summary: 'Serie temporal agrupada por mes' })
  @ApiParam({ name: 'slug', description: 'Slug del cuestionario' })
  @ApiParam({
    name: 'campoId',
    description: 'ID del campo de fecha (ej: fld-1)',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getTimeSeries(
    @Param('slug') slug: string,
    @Param('campoId') campoId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTimeSeries(slug, campoId, { from, to });
  }

  @Get(':slug/crosstab')
  @ApiOperation({ summary: 'Análisis cruzado entre dos campos' })
  @ApiParam({ name: 'slug', description: 'Slug del cuestionario' })
  @ApiQuery({ name: 'fieldA', required: true, description: 'Campo eje X' })
  @ApiQuery({
    name: 'fieldB',
    required: true,
    description: 'Campo desglose',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getCrossTab(
    @Param('slug') slug: string,
    @Query('fieldA') fieldA: string,
    @Query('fieldB') fieldB: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!fieldA || !fieldB) {
      throw new BadRequestException('fieldA y fieldB son requeridos');
    }
    return this.analyticsService.getCrossTab(slug, fieldA, fieldB, {
      from,
      to,
    });
  }

  @Get(':slug/raw')
  @ApiOperation({ summary: 'Respuestas sin procesar' })
  @ApiParam({ name: 'slug', description: 'Slug del cuestionario' })
  async getAllResponses(@Param('slug') slug: string) {
    return this.analyticsService.getAllResponses(slug);
  }
}
