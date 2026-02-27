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
      order: { version: 'DESC' },
    });
  }

  async getAllDefinitions(): Promise<FormDefinition[]> {
    const all = await this.defRepo.find({
      where: { activo: true },
      order: { slug: 'ASC', version: 'DESC' },
    });
    const latestBySlug = new Map<string, FormDefinition>();
    for (const def of all) {
      if (!latestBySlug.has(def.slug)) {
        latestBySlug.set(def.slug, def);
      }
    }
    return Array.from(latestBySlug.values());
  }

  async updateDefinition(
    slug: string,
    dto: UpdateDefinitionDto,
  ): Promise<FormDefinition> {
    const existing = await this.defRepo.findOne({
      where: { slug, activo: true },
      order: { version: 'DESC' },
    });

    if (!existing) {
      throw new NotFoundException(
        `Definicion con slug "${slug}" no encontrada`,
      );
    }

    const newVersion = this.defRepo.create({
      slug: existing.slug,
      version: existing.version + 1,
      nombre: dto.nombre ?? existing.nombre,
      configuracionJson: JSON.stringify(dto.configuracion),
      activo: true,
    });

    return this.defRepo.save(newVersion);
  }

  async getDefinitionBySlugAndVersion(
    slug: string,
    version: number,
  ): Promise<FormDefinition | null> {
    return this.defRepo.findOne({
      where: { slug, version, activo: true },
    });
  }

  async getVersionsBySlug(slug: string): Promise<FormDefinition[]> {
    return this.defRepo.find({
      where: { slug, activo: true },
      order: { version: 'DESC' },
    });
  }
}
