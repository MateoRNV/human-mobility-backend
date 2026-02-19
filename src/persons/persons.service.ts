import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Person } from './person.entity';
import { FormSubmission } from '../forms/entities/form-submission.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { SaveFormDto } from '../forms/dto/save-form.dto';
import {
  TRIAJE_DERIVATION_FIELD_ID,
  FORM_SLUG_TRIAJE,
  DERIVATION_TO_FORM_SLUG,
} from './constants';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async findAll(): Promise<ListaPersonasDto[]> {
    const personas = await this.personRepo.find({
      where: { activo: true },
      relations: ['enviosCuestionario'],
      order: { fechaCreacion: 'DESC' },
    });
    return personas.map((p) => this.toListDto(p));
  }

  async findOne(id: number): Promise<DetallePersonaDto> {
    const persona = await this.personRepo.findOne({
      where: { id, activo: true },
      relations: ['enviosCuestionario'],
    });
    if (!persona) throw new NotFoundException(`Persona ${id} no encontrada`);
    return this.toDetailDto(persona);
  }

  async create(dto: CreatePersonDto): Promise<DetallePersonaDto> {
    if (dto.documento) {
      const existing = await this.personRepo.findOne({
        where: { documento: dto.documento, activo: true },
      });
      if (existing)
        throw new ConflictException(
          `Ya existe una persona con el documento ${dto.documento}`,
        );
    } else if (dto.nombre) {
      const existing = await this.personRepo.findOne({
        where: { nombre: dto.nombre, documento: IsNull(), activo: true },
      });
      if (existing)
        throw new ConflictException(
          `Ya existe una persona con el nombre ${dto.nombre} sin documento`,
        );
    }

    let numeroCaso: string | null = null;
    let parentId: number | null = null;

    if (dto.parentId) {
      const parent = await this.personRepo.findOne({
        where: { id: dto.parentId, activo: true },
      });
      if (!parent)
        throw new NotFoundException(`Caso ${dto.parentId} no encontrado`);
      numeroCaso = parent.numeroCaso;
      parentId = parent.id;
    }

    const persona = this.personRepo.create({
      nombre: dto.nombre,
      documento: dto.documento ?? null,
      activo: true,
      numeroCaso,
      parentId,
    });

    const guardada = await this.personRepo.save(persona);

    if (!parentId) {
      const anio = new Date().getFullYear();
      guardada.numeroCaso = `${anio}${guardada.id}`;
      await this.personRepo.save(guardada);
    }

    return this.findOne(guardada.id);
  }

  async update(id: number, dto: UpdatePersonDto): Promise<DetallePersonaDto> {
    const persona = await this.personRepo.findOne({
      where: { id, activo: true },
    });
    if (!persona) throw new NotFoundException(`Persona ${id} no encontrada`);
    if (dto.nombre !== undefined) persona.nombre = dto.nombre;
    if (dto.documento !== undefined) persona.documento = dto.documento;

    if (persona.documento) {
      const existing = await this.personRepo.findOne({
        where: { documento: persona.documento, activo: true },
      });
      if (existing && existing.id !== persona.id)
        throw new ConflictException(
          `Ya existe otra persona con el documento ${persona.documento}`,
        );
    } else {
      const existing = await this.personRepo.findOne({
        where: { nombre: persona.nombre, documento: IsNull(), activo: true },
      });
      if (existing && existing.id !== persona.id)
        throw new ConflictException(
          `Ya existe otra persona con el nombre ${persona.nombre} sin documento`,
        );
    }

    const guardada = await this.personRepo.save(persona);
    return this.findOne(guardada.id);
  }

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
        enviadoEn: null,
        respuestas: [],
      };
    const respuestas = envio.respuestasJson
      ? (JSON.parse(envio.respuestasJson) as SaveFormDto['respuestas'])
      : [];
    return {
      personaId,
      cuestionarioSlug: slug,
      versionCuestionario: envio.versionCuestionario,
      enviadoEn: envio.enviadoEn?.toISOString() ?? null,
      respuestas,
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
        enviadoEn: ahora,
        activo: true,
      });
    } else {
      envio.versionCuestionario =
        dto.version_cuestionario ?? envio.versionCuestionario;
      envio.respuestasJson = JSON.stringify(respuestas);
      envio.enviadoEn = ahora;
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

  private toListDto(persona: Person): ListaPersonasDto {
    const cuestionarios: Record<
      string,
      { enviadoEn: string | null; version: number }
    > = {};
    return {
      id: persona.id,
      nombre: persona.nombre,
      documento: persona.documento ?? '',
      numeroCaso: persona.numeroCaso ?? '',
      parentId: persona.parentId,
    };
  }

  private toDetailDto(persona: Person): DetallePersonaDto {
    const lista = this.toListDto(persona);
    return { ...lista };
  }
}

export interface ListaPersonasDto {
  id: number;
  nombre: string;
  documento: string;
  numeroCaso: string;
  parentId?: number | null;
}

export type DetallePersonaDto = ListaPersonasDto;

export interface RespuestaCuestionarioDto {
  personaId: number;
  cuestionarioSlug: string;
  versionCuestionario: number;
  enviadoEn: string | null;
  respuestas: SaveFormDto['respuestas'];
}
