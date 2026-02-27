import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Person } from './person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
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
        where: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          documento: IsNull(),
          activo: true,
        },
      });
      if (existing)
        throw new ConflictException(
          `Ya existe una persona con el nombre ${dto.nombre} y apellido ${dto.apellido} sin documento`,
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
      apellido: dto.apellido,
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
    if (dto.apellido !== undefined) persona.apellido = dto.apellido;
    if (dto.documento !== undefined) persona.documento = dto.documento;
    if (dto.contactos !== undefined)
      persona.contactos = dto.contactos ? JSON.stringify(dto.contactos) : null;

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
        where: {
          nombre: persona.nombre,
          apellido: persona.apellido,
          documento: IsNull(),
          activo: true,
        },
      });
      if (existing && existing.id !== persona.id)
        throw new ConflictException(
          `Ya existe otra persona con el nombre ${persona.nombre} y apellido ${persona.apellido} sin documento`,
        );
    }

    const guardada = await this.personRepo.save(persona);
    return this.findOne(guardada.id);
  }

  private toListDto(persona: Person): ListaPersonasDto {
    return {
      id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      nombreCompleto: `${persona.nombre} ${persona.apellido}`,
      documento: persona.documento ?? '',
      numeroCaso: persona.numeroCaso ?? '',
      parentId: persona.parentId,
      contactos: persona.contactos ? JSON.parse(persona.contactos) : [],
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
  apellido: string;
  nombreCompleto: string;
  documento: string;
  numeroCaso: string;
  parentId?: number | null;
  contactos?: any[];
}

export type DetallePersonaDto = ListaPersonasDto;
