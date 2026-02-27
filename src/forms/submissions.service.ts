import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Person } from '../persons/person.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { SubmissionHistory } from './entities/submission-history.entity';
import { SaveFormDto } from './dto/save-form.dto';

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
    @InjectRepository(SubmissionHistory)
    private readonly historyRepo: Repository<SubmissionHistory>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

    const ahora = new Date();
    const respuestas = dto.respuestas ?? [];

    await this.dataSource.transaction(async (manager) => {
      let envio = await manager.findOne(FormSubmission, {
        where: { personaId, cuestionarioSlug: slug, activo: true },
      });

      if (!envio) {
        envio = manager.create(FormSubmission, {
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
      await manager.save(FormSubmission, envio);

      await manager.save(
        manager.create(SubmissionHistory, {
          personaId,
          cuestionarioSlug: slug,
          versionCuestionario:
            dto.version_cuestionario ?? envio.versionCuestionario,
          respuestasJson: JSON.stringify(respuestas),
        }),
      );
    });

    return this.getForm(personaId, slug);
  }

  async getFormHistory(personaId: number, slug: string) {
    const records = await this.historyRepo.find({
      where: { personaId, cuestionarioSlug: slug },
      order: { fechaCreacion: 'DESC' },
    });
    return records.map((r) => ({
      id: r.id,
      versionCuestionario: r.versionCuestionario,
      respuestas: r.respuestasJson ? JSON.parse(r.respuestasJson) : [],
      fecha: r.fechaCreacion.toISOString(),
    }));
  }
}
