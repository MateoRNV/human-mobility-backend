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
    return this.defRepo.manager.transaction(async (manager) => {
      const existing = await manager.findOne(FormDefinition, {
        where: { slug, activo: true },
        order: { version: 'DESC' },
      });

      if (!existing) {
        throw new NotFoundException(
          `Definicion con slug "${slug}" no encontrada`,
        );
      }

      const nextVersion = existing.version + 1;

      const newDef = manager.create(FormDefinition, {
        slug: existing.slug,
        version: nextVersion,
        nombre: dto.nombre ?? existing.nombre ?? slug,
        configuracionJson: JSON.stringify({
          ...dto.configuracion,
          version: nextVersion,
        }),
        activo: true,
      });

      return manager.save(FormDefinition, newDef);
    });
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
