import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormDefinition } from './entities/form-definition.entity';
import * as fs from 'fs';
import * as path from 'path';

interface FormJson {
  version: number;
  slug: string;
  name: string;
  title: string;
  sections: unknown[];
}

@Injectable()
export class FormsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FormsSeederService.name);

  constructor(
    @InjectRepository(FormDefinition)
    private readonly defRepo: Repository<FormDefinition>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      this.logger.warn(`Directorio de datos no encontrado: ${dataDir}`);
      return;
    }

    const files = fs
      .readdirSync(dataDir)
      .filter((file) => file.endsWith('.json'));

    for (const file of files) {
      await this.seedForm(file);
    }
  }

  private async seedForm(filename: string): Promise<void> {
    const filePath = path.join(__dirname, 'data', filename);

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Archivo de definición no encontrado: ${filePath}`);
      return;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const json: FormJson = JSON.parse(raw);

    const existing = await this.defRepo.findOne({
      where: { slug: json.slug },
    });

    if (!existing) {
      const definition = this.defRepo.create({
        slug: json.slug,
        version: json.version,
        nombre: json.name,
        configuracionJson: raw,
        activo: true,
        usuarioCreacion: 'system-seeder',
      });

      await this.defRepo.save(definition);
      this.logger.log(
        `Definición "${json.slug}" v${json.version} insertada correctamente.`,
      );
    } else if (existing.version < json.version) {
      existing.version = json.version;
      existing.nombre = json.name;
      existing.configuracionJson = raw;
      existing.usuarioModificacion = 'system-seeder';

      await this.defRepo.save(existing);
      this.logger.log(
        `Definición "${json.slug}" actualizada a v${json.version}.`,
      );
    } else {
      this.logger.log(
        `Definición "${json.slug}" v${existing.version} ya existe. Omitiendo.`,
      );
    }
  }
}
