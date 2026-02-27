import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormDefinition } from './entities/form-definition.entity';
import { UpdateDefinitionDto } from './dto/update-definition.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(FormDefinition)
    private readonly defRepo: Repository<FormDefinition>,
  ) {}

  async getDefinitionBySlug(slug: string): Promise<FormDefinition | null> {
    return this.defRepo.findOne({
      where: { slug, activo: true },
    });
  }

  async getAllDefinitions(): Promise<FormDefinition[]> {
    return this.defRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async updateDefinition(
    slug: string,
    dto: UpdateDefinitionDto,
  ): Promise<FormDefinition> {
    const existing = await this.defRepo.findOne({
      where: { slug, activo: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Definicion con slug "${slug}" no encontrada`,
      );
    }

    if (dto.nombre) existing.nombre = dto.nombre;
    if (dto.version) existing.version = dto.version;
    existing.configuracionJson = JSON.stringify(dto.configuracion);
    existing.fechaModificacion = new Date();

    return this.defRepo.save(existing);
  }
}
