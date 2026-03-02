import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormSubmission } from '../forms/entities/form-submission.entity';
import { FormDefinition } from '../forms/entities/form-definition.entity';

// ─── Interfaces ──────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
  percentage: number;
}

export interface AnalyticsResponse {
  field: { id: string; title: string; type: string };
  data: ChartDataPoint[];
  totalResponses: number;
  emptyResponses: number;
}

export interface ChartableField {
  id: string;
  title: string;
  type: string;
  section: string;
  special?: boolean;
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface OverviewResponse {
  totalPersonas: number;
  totalSubmissions: number;
  topMotivos: ChartDataPoint[];
  topPaises: ChartDataPoint[];
  bySexo: ChartDataPoint[];
  vulnerabilityCount: number;
}

export interface TimeSeriesPoint {
  period: string;
  periodKey: string;
  count: number;
}

export interface TimeSeriesResponse {
  field: { id: string; title: string };
  granularity: 'month';
  data: TimeSeriesPoint[];
  totalInRange: number;
}

export interface CrossTabRow {
  name: string;
  [key: string]: number | string;
}

export interface CrossTabResponse {
  fieldA: { id: string; title: string };
  fieldB: { id: string; title: string };
  rows: CrossTabRow[];
  seriesKeys: string[];
  totalResponses: number;
}

// ─── Constantes ──────────────────────────────────────────────

const NON_CHARTABLE_TYPES = new Set([
  'text',
  'textarea',
  'long-text',
  'table',
  'signature',
  'file',
  'label',
  'divider',
  'heading',
]);

/** Campos de tipo 'text' que en la práctica tienen valores finitos */
const SPECIAL_TEXT_FIELDS = new Set(['fld-17']);

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
    @InjectRepository(FormDefinition)
    private readonly definitionRepo: Repository<FormDefinition>,
  ) {}

  // ─── Endpoints públicos ────────────────────────────────────

  async getChartableFields(slug: string): Promise<ChartableField[]> {
    const definition = await this.getLatestDefinition(slug);
    const config = JSON.parse(definition.configuracionJson || '{}');
    const fields: ChartableField[] = [];

    for (const section of config.sections || []) {
      for (const field of section.fields || []) {
        const isChartable =
          !NON_CHARTABLE_TYPES.has(field.type) ||
          SPECIAL_TEXT_FIELDS.has(field.id);

        if (isChartable) {
          fields.push({
            id: field.id,
            title: field.title || field.id,
            type: field.type,
            section: section.title || section.id || 'General',
            ...(SPECIAL_TEXT_FIELDS.has(field.id) ? { special: true } : {}),
          });
        }
      }
    }

    return fields;
  }

  async getFieldDistribution(
    slug: string,
    campoId: string,
    filter?: DateRangeFilter,
  ): Promise<AnalyticsResponse> {
    const definition = await this.getLatestDefinition(slug);
    const config = JSON.parse(definition.configuracionJson || '{}');
    const fieldDef = this.findField(config, campoId);

    if (!fieldDef) {
      throw new BadRequestException(
        `Campo "${campoId}" no encontrado en cuestionario "${slug}"`,
      );
    }

    if (
      NON_CHARTABLE_TYPES.has(fieldDef.type) &&
      !SPECIAL_TEXT_FIELDS.has(fieldDef.id)
    ) {
      throw new BadRequestException(
        `El campo "${campoId}" es de tipo "${fieldDef.type}" y no genera análisis útiles`,
      );
    }

    const labelMap = this.buildLabelMap(fieldDef);
    const submissions = await this.loadSubmissions(slug, filter);

    const responses: any[] = [];
    let emptyCount = 0;

    for (const submission of submissions) {
      const respuestas = submission.respuestasJson
        ? JSON.parse(submission.respuestasJson)
        : [];
      const respuesta = respuestas.find((r: any) => r.campoId === campoId);

      if (
        !respuesta ||
        respuesta.valor === null ||
        respuesta.valor === undefined ||
        respuesta.valor === ''
      ) {
        emptyCount++;
        continue;
      }

      responses.push(respuesta);
    }

    // Para campos de texto especial, tratar como select implícito
    const effectiveType = SPECIAL_TEXT_FIELDS.has(fieldDef.id)
      ? 'select'
      : fieldDef.type;

    const grouped = this.groupByFieldType(effectiveType, responses, labelMap);

    const totalResponses = responses.length;
    const data: ChartDataPoint[] = Object.entries(grouped)
      .map(([label, count]: [string, number]) => ({
        label,
        value: count,
        percentage:
          totalResponses > 0
            ? +((count / totalResponses) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      field: {
        id: fieldDef.id,
        title: fieldDef.title || fieldDef.id,
        type: fieldDef.type,
      },
      data,
      totalResponses,
      emptyResponses: emptyCount,
    };
  }

  async getOverview(
    slug: string,
    filter?: DateRangeFilter,
  ): Promise<OverviewResponse> {
    const submissions = await this.loadSubmissions(slug, filter);
    const definition = await this.getLatestDefinition(slug);
    const config = JSON.parse(definition.configuracionJson || '{}');

    const personaIds = new Set(submissions.map((s) => s.personaId));
    const totalPersonas = personaIds.size;
    const totalSubmissions = submissions.length;

    // Motivos de consulta (fld-2, multi-select)
    const motivosField = this.findField(config, 'fld-2');
    const motivosLabelMap = motivosField
      ? this.buildLabelMap(motivosField)
      : new Map();
    const motivosGrouped = this.groupByFieldType(
      'multi-select',
      this.extractFieldResponses(submissions, 'fld-2'),
      motivosLabelMap,
    );
    const topMotivos = this.toChartDataPoints(motivosGrouped).slice(0, 5);

    // País de origen (fld-17, text especial)
    const paisesGrouped = this.groupByFieldType(
      'select',
      this.extractFieldResponses(submissions, 'fld-17'),
      new Map(),
    );
    const topPaises = this.toChartDataPoints(paisesGrouped).slice(0, 5);

    // Sexo (fld-21, select)
    const sexoField = this.findField(config, 'fld-21');
    const sexoLabelMap = sexoField
      ? this.buildLabelMap(sexoField)
      : new Map();
    const sexoGrouped = this.groupByFieldType(
      'select',
      this.extractFieldResponses(submissions, 'fld-21'),
      sexoLabelMap,
    );
    const bySexo = this.toChartDataPoints(sexoGrouped);

    // Vulnerabilidad
    const vulnFieldIds = this.findVulnerabilityFieldIds(config);
    let vulnerabilityCount = 0;
    for (const s of submissions) {
      const respuestas = s.respuestasJson
        ? JSON.parse(s.respuestasJson)
        : [];
      const hasVuln = respuestas.some(
        (r: any) =>
          vulnFieldIds.has(r.campoId) &&
          (r.valor === true || r.valor === 'true' || r.valor === '1'),
      );
      if (hasVuln) vulnerabilityCount++;
    }

    return {
      totalPersonas,
      totalSubmissions,
      topMotivos,
      topPaises,
      bySexo,
      vulnerabilityCount,
    };
  }

  async getTimeSeries(
    slug: string,
    campoId: string,
    filter?: DateRangeFilter,
  ): Promise<TimeSeriesResponse> {
    const definition = await this.getLatestDefinition(slug);
    const config = JSON.parse(definition.configuracionJson || '{}');
    const fieldDef = this.findField(config, campoId);

    if (!fieldDef || fieldDef.type !== 'date') {
      throw new BadRequestException(
        `Campo "${campoId}" debe ser de tipo date para series temporales`,
      );
    }

    const allSubmissions = await this.submissionRepo.find({
      where: { cuestionarioSlug: slug, activo: true },
    });

    const from = filter?.from ? new Date(filter.from) : null;
    const to = filter?.to ? new Date(filter.to + 'T23:59:59') : null;
    const buckets = new Map<string, { label: string; count: number }>();

    for (const s of allSubmissions) {
      const arr = s.respuestasJson ? JSON.parse(s.respuestasJson) : [];
      const resp = arr.find((r: any) => r.campoId === campoId);
      if (!resp?.valor) continue;

      const fecha = new Date(resp.valor);
      if (isNaN(fecha.getTime())) continue;

      if (from && fecha < from) continue;
      if (to && fecha > to) continue;

      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const month = fecha.toLocaleString('es-ES', { month: 'long' });
      const pretty = month.charAt(0).toUpperCase() + month.slice(1) + ' ' + fecha.getFullYear();

      if (!buckets.has(key)) buckets.set(key, { label: pretty, count: 0 });
      buckets.get(key)!.count++;
    }

    const data: TimeSeriesPoint[] = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodKey, { label, count }]) => ({
        period: label,
        periodKey,
        count,
      }));

    return {
      field: { id: fieldDef.id, title: fieldDef.title || fieldDef.id },
      granularity: 'month',
      data,
      totalInRange: data.reduce((sum, d) => sum + d.count, 0),
    };
  }

  async getCrossTab(
    slug: string,
    campoAId: string,
    campoBId: string,
    filter?: DateRangeFilter,
  ): Promise<CrossTabResponse> {
    const definition = await this.getLatestDefinition(slug);
    const config = JSON.parse(definition.configuracionJson || '{}');

    const fieldA = this.findField(config, campoAId);
    const fieldB = this.findField(config, campoBId);
    if (!fieldA)
      throw new BadRequestException(`Campo A "${campoAId}" no encontrado`);
    if (!fieldB)
      throw new BadRequestException(`Campo B "${campoBId}" no encontrado`);

    const labelMapA = this.buildLabelMap(fieldA);
    const labelMapB = this.buildLabelMap(fieldB);

    const submissions = await this.loadSubmissions(slug, filter);

    const cellMap = new Map<string, number>();
    const valuesA = new Set<string>();
    const valuesB = new Set<string>();

    for (const s of submissions) {
      const arr = s.respuestasJson ? JSON.parse(s.respuestasJson) : [];
      const respA = arr.find((r: any) => r.campoId === campoAId);
      const respB = arr.find((r: any) => r.campoId === campoBId);
      if (!respA?.valor || !respB?.valor) continue;

      const effectiveTypeA = SPECIAL_TEXT_FIELDS.has(fieldA.id)
        ? 'select'
        : fieldA.type;
      const effectiveTypeB = SPECIAL_TEXT_FIELDS.has(fieldB.id)
        ? 'select'
        : fieldB.type;

      const valsA = this.flattenValue(effectiveTypeA, respA, labelMapA);
      const valsB = this.flattenValue(effectiveTypeB, respB, labelMapB);

      for (const a of valsA) {
        for (const b of valsB) {
          if (!a || !b) continue;
          const key = `${a}||${b}`;
          cellMap.set(key, (cellMap.get(key) || 0) + 1);
          valuesA.add(a);
          valuesB.add(b);
        }
      }
    }

    const seriesKeys = [...valuesB].sort();
    const rows: CrossTabRow[] = [...valuesA]
      .sort()
      .map((a) => {
        const row: CrossTabRow = { name: a };
        let total = 0;
        for (const b of seriesKeys) {
          const count = cellMap.get(`${a}||${b}`) || 0;
          row[b] = count;
          total += count;
        }
        row.total = total;
        return row;
      })
      .sort((x, y) => (y.total as number) - (x.total as number));

    return {
      fieldA: { id: fieldA.id, title: fieldA.title || fieldA.id },
      fieldB: { id: fieldB.id, title: fieldB.title || fieldB.id },
      rows,
      seriesKeys,
      totalResponses: submissions.length,
    };
  }

  async getAllResponses(slug: string) {
    const submissions = await this.submissionRepo.find({
      where: { cuestionarioSlug: slug, activo: true },
    });

    return submissions.map((s) => ({
      personaId: s.personaId,
      fecha: s.fechaModificacion,
      respuestas: s.respuestasJson ? JSON.parse(s.respuestasJson) : [],
    }));
  }

  // ─── Helpers privados ──────────────────────────────────────

  private async getLatestDefinition(slug: string): Promise<FormDefinition> {
    const definition = await this.definitionRepo.findOne({
      where: { slug, activo: true },
      order: { version: 'DESC' },
    });

    if (!definition) {
      throw new BadRequestException(
        `Cuestionario "${slug}" no encontrado`,
      );
    }

    return definition;
  }

  private async loadSubmissions(
    slug: string,
    filter?: DateRangeFilter,
  ): Promise<FormSubmission[]> {
    const all = await this.submissionRepo.find({
      where: { cuestionarioSlug: slug, activo: true },
    });

    if (!filter?.from && !filter?.to) return all;

    const from = filter.from ? new Date(filter.from) : null;
    const to = filter.to ? new Date(filter.to + 'T23:59:59') : null;

    return all.filter((s) => {
      const d = s.fechaCreacion;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  private findField(config: any, campoId: string): any | null {
    for (const section of config.sections || []) {
      for (const field of section.fields || []) {
        if (field.id === campoId) return field;
      }
    }
    return null;
  }

  private buildLabelMap(fieldDef: any): Map<string, string> {
    const map = new Map<string, string>();
    if (!fieldDef.options || !Array.isArray(fieldDef.options)) return map;

    for (const opt of fieldDef.options) {
      if (typeof opt === 'string') {
        map.set(opt, opt);
      } else if (opt && typeof opt === 'object') {
        const value = String(opt.value ?? opt.id ?? '');
        const label = String(opt.label ?? opt.text ?? opt.title ?? value);
        if (value) map.set(value, label);
      }
    }

    return map;
  }

  private extractFieldResponses(
    submissions: FormSubmission[],
    campoId: string,
  ): any[] {
    const out: any[] = [];
    for (const s of submissions) {
      const arr = s.respuestasJson ? JSON.parse(s.respuestasJson) : [];
      const r = arr.find((x: any) => x.campoId === campoId);
      if (
        r &&
        r.valor !== null &&
        r.valor !== undefined &&
        r.valor !== ''
      ) {
        out.push(r);
      }
    }
    return out;
  }

  private findVulnerabilityFieldIds(config: any): Set<string> {
    const ids = new Set<string>();
    for (const section of config.sections || []) {
      const title: string = (
        section.title ||
        section.id ||
        ''
      ).toLowerCase();
      if (title.includes('vulnerab')) {
        for (const field of section.fields || []) {
          if (field.type === 'checkbox' || field.type === 'boolean') {
            ids.add(field.id);
          }
        }
      }
    }
    return ids;
  }

  private toChartDataPoints(
    grouped: Record<string, number>,
  ): ChartDataPoint[] {
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    return Object.entries(grouped)
      .map(([label, value]) => ({
        label,
        value,
        percentage: total > 0 ? +((value / total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  private groupByFieldType(
    fieldType: string,
    responses: any[],
    labelMap: Map<string, string>,
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const respuesta of responses) {
      const values = this.flattenValue(fieldType, respuesta, labelMap);

      for (const val of values) {
        const trimmed = val?.trim();
        if (trimmed) {
          grouped[trimmed] = (grouped[trimmed] || 0) + 1;
        }
      }
    }

    return grouped;
  }

  private flattenValue(
    type: string,
    resp: any,
    labelMap: Map<string, string>,
  ): string[] {
    if (type === 'multi-select' || type === 'multi-checkbox') {
      if (!Array.isArray(resp.valor)) return [];
      return resp.valor
        .filter((v: any) => v !== null && v !== undefined && v !== '')
        .map((v: any) => this.resolveLabel(String(v), labelMap));
    }

    if (type === 'date') {
      const fecha = new Date(resp.valor);
      if (isNaN(fecha.getTime())) return [];
      const month = fecha.toLocaleString('es-ES', { month: 'long' });
      const year = fecha.getFullYear();
      return [
        `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`,
      ];
    }

    if (type === 'matrix') {
      if (resp.valor && typeof resp.valor === 'object') {
        return Object.entries(resp.valor).map(
          ([row, col]: [string, any]) =>
            `${this.resolveLabel(row, labelMap)}: ${col}`,
        );
      }
      return [];
    }

    if (type === 'checkbox' || type === 'boolean') {
      const val = resp.valor;
      return [
        val === true || val === 'true' || val === '1' ? 'Sí' : 'No',
      ];
    }

    // select, radio, number, text (special)
    return [this.resolveLabel(String(resp.valor), labelMap)];
  }

  private resolveLabel(
    value: string,
    labelMap: Map<string, string>,
  ): string {
    return labelMap.get(value) || value;
  }
}
