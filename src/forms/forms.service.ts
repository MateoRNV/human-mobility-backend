import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormDefinition } from './entities/form-definition.entity';

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
}
