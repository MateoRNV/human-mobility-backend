import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../persons/person.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { SaveFormDto } from './dto/save-form.dto';
import {
  TRIAJE_DERIVATION_FIELD_ID,
  DERIVATION_TO_FORM_SLUG,
} from '../persons/constants';

export interface RespuestaCuestionarioDto {
  personaId: number;
  cuestionarioSlug: string;
  versionCuestionario: number;
  respuestas: SaveFormDto['respuestas'];
  fecha_modificacion: string | null;
}

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async getForm(
    personaId: number,
    slug: string,
  ): Promise<RespuestaCuestionarioDto> {
    const persona = await this.personRepo.findOne({
      where: { id: personaId, activo: true },
    });
    if (!persona)
      throw new NotFoundException(`Persona ${personaId} no encontrada`);
    const envio = await this.formSubmissionRepo.findOne({
      where: { personaId, cuestionarioSlug: slug, activo: true },
    });
    if (!envio)
      return {
        personaId,
        cuestionarioSlug: slug,
        versionCuestionario: 1,
        respuestas: [],
        fecha_modificacion: null,
      };
    const respuestas = envio.respuestasJson
      ? (JSON.parse(envio.respuestasJson) as SaveFormDto['respuestas'])
      : [];
    return {
      personaId,
      cuestionarioSlug: slug,
      versionCuestionario: envio.versionCuestionario,
      respuestas,
      fecha_modificacion: envio.fechaModificacion?.toISOString() ?? null,
    };
  }

  async saveForm(
    personaId: number,
    slug: string,
    dto: SaveFormDto,
  ): Promise<RespuestaCuestionarioDto> {
    const persona = await this.personRepo.findOne({
      where: { id: personaId, activo: true },
    });
    if (!persona)
      throw new NotFoundException(`Persona ${personaId} no encontrada`);

    let envio = await this.formSubmissionRepo.findOne({
      where: { personaId, cuestionarioSlug: slug, activo: true },
    });
    const ahora = new Date();
    const respuestas = dto.respuestas ?? [];

    if (!envio) {
      envio = this.formSubmissionRepo.create({
        personaId,
        cuestionarioSlug: slug,
        versionCuestionario: dto.version_cuestionario ?? 1,
        respuestasJson: JSON.stringify(respuestas),
        activo: true,
        fechaModificacion: ahora,
      });
    } else {
      envio.versionCuestionario =
        dto.version_cuestionario ?? envio.versionCuestionario;
      envio.respuestasJson = JSON.stringify(respuestas);
      envio.fechaModificacion = ahora;
    }
    await this.formSubmissionRepo.save(envio);

    return this.getForm(personaId, slug);
  }

  private deriveServicesFromTriageAnswers(
    respuestas: SaveFormDto['respuestas'],
  ): string[] {
    const entrada = respuestas.find(
      (r) => r.campoId === TRIAJE_DERIVATION_FIELD_ID,
    );
    if (!entrada || !Array.isArray(entrada.valor)) return [];
    const valores = entrada.valor as string[];
    return valores
      .map((v) => DERIVATION_TO_FORM_SLUG[v])
      .filter((v) => v != null);
  }
}
