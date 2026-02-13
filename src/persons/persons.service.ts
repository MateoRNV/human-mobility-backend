import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../person/person.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { SaveFormDto } from './dto/save-form.dto';
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

  async findAll(): Promise<PersonListDto[]> {
    const persons = await this.personRepo.find({
      where: { activo: true },
      relations: ['formSubmissions'],
      order: { createdAt: 'DESC' },
    });
    return persons.map((p) => this.toListDto(p));
  }

  async findOne(id: number): Promise<PersonDetailDto> {
    const person = await this.personRepo.findOne({
      where: { id, activo: true },
      relations: ['formSubmissions'],
    });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return this.toDetailDto(person);
  }

  async create(dto: CreatePersonDto): Promise<PersonDetailDto> {
    const person = this.personRepo.create({
      name: dto.name,
      document: dto.document ?? null,
      derivedServices: null,
      activo: true,
    });
    const saved = await this.personRepo.save(person);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdatePersonDto): Promise<PersonDetailDto> {
    const person = await this.personRepo.findOne({
      where: { id, activo: true },
    });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    if (dto.name !== undefined) person.name = dto.name;
    if (dto.document !== undefined) person.document = dto.document;
    const saved = await this.personRepo.save(person);
    return this.findOne(saved.id);
  }

  async getForm(personId: number, slug: string): Promise<FormResponseDto> {
    const person = await this.personRepo.findOne({
      where: { id: personId, activo: true },
    });
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    const submission = await this.formSubmissionRepo.findOne({
      where: { personId, formSlug: slug, activo: true },
    });
    if (!submission)
      return {
        personId,
        formSlug: slug,
        formVersion: 1,
        submittedAt: null,
        answers: [],
      };
    const answers = submission.answersJson
      ? (JSON.parse(submission.answersJson) as SaveFormDto['answers'])
      : [];
    return {
      personId,
      formSlug: slug,
      formVersion: submission.formVersion,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      answers,
    };
  }

  async saveForm(
    personId: number,
    slug: string,
    dto: SaveFormDto,
  ): Promise<FormResponseDto> {
    const person = await this.personRepo.findOne({
      where: { id: personId, activo: true },
    });
    if (!person) throw new NotFoundException(`Person ${personId} not found`);

    let submission = await this.formSubmissionRepo.findOne({
      where: { personId, formSlug: slug, activo: true },
    });
    const now = new Date();
    const answers = dto.answers ?? [];

    if (!submission) {
      submission = this.formSubmissionRepo.create({
        personId,
        formSlug: slug,
        formVersion: dto.form_version ?? 1,
        answersJson: JSON.stringify(answers),
        submittedAt: now,
        activo: true,
      });
    } else {
      submission.formVersion = dto.form_version ?? submission.formVersion;
      submission.answersJson = JSON.stringify(answers);
      submission.submittedAt = now;
    }
    await this.formSubmissionRepo.save(submission);

    if (slug === FORM_SLUG_TRIAJE) {
      const derived = this.deriveServicesFromTriageAnswers(answers);
      person.derivedServices =
        derived.length > 0 ? JSON.stringify(derived) : null;
      await this.personRepo.save(person);
    }

    return this.getForm(personId, slug);
  }

  private deriveServicesFromTriageAnswers(
    answers: SaveFormDto['answers'],
  ): string[] {
    const entry = answers.find((a) => a.fieldId === TRIAJE_DERIVATION_FIELD_ID);
    if (!entry || !Array.isArray(entry.value)) return [];
    const values = entry.value as string[];
    return values.filter((v) => DERIVATION_TO_FORM_SLUG[v] != null);
  }

  private parseDerivedServices(person: Person): string[] {
    if (!person.derivedServices) return [];
    try {
      return JSON.parse(person.derivedServices) as string[];
    } catch {
      return [];
    }
  }

  private toListDto(person: Person): PersonListDto {
    const forms: Record<string, { submittedAt: string | null; version: number }> = {};
    for (const fs of person.formSubmissions ?? []) {
      if (!fs.activo) continue;
      forms[fs.formSlug] = {
        submittedAt: fs.submittedAt?.toISOString() ?? null,
        version: fs.formVersion,
      };
    }
    return {
      id: person.id,
      name: person.name,
      document: person.document ?? '',
      derivedServices: this.parseDerivedServices(person),
      forms,
    };
  }

  private toDetailDto(person: Person): PersonDetailDto {
    const list = this.toListDto(person);
    return { ...list };
  }
}

export interface PersonListDto {
  id: number;
  name: string;
  document: string;
  derivedServices: string[];
  forms: Record<
    string,
    { submittedAt: string | null; version: number }
  >;
}

export type PersonDetailDto = PersonListDto;

export interface FormResponseDto {
  personId: number;
  formSlug: string;
  formVersion: number;
  submittedAt: string | null;
  answers: SaveFormDto['answers'];
}
