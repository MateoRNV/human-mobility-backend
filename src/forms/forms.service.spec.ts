import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormDefinition } from './entities/form-definition.entity';

// Fábrica de manager de transacción
const makeManager = (overrides: Record<string, jest.Mock> = {}) => ({
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
  save: jest.fn().mockImplementation((_entity: unknown, data: unknown) => Promise.resolve(data)),
  ...overrides,
});

const mockDefRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  manager: {
    transaction: jest.fn(),
  },
};

const baseDef = (overrides: Partial<FormDefinition> = {}): FormDefinition =>
  ({
    id: 1,
    slug: 'triaje',
    version: 1,
    nombre: 'Triaje',
    configuracionJson: '{"campos":[]}',
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
    ...overrides,
  }) as FormDefinition;

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: getRepositoryToken(FormDefinition), useValue: mockDefRepo },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
    jest.clearAllMocks();
  });

  // ─── getDefinitionBySlug ──────────────────────────────────────────────────
  describe('getDefinitionBySlug', () => {
    it('retorna la definición activa más reciente del slug', async () => {
      mockDefRepo.findOne.mockResolvedValue(baseDef({ version: 3 }));

      const result = await service.getDefinitionBySlug('triaje');

      expect(result?.slug).toBe('triaje');
      expect(result?.version).toBe(3);
    });

    it('retorna null si el slug no existe', async () => {
      mockDefRepo.findOne.mockResolvedValue(null);

      const result = await service.getDefinitionBySlug('no-existe');

      expect(result).toBeNull();
    });
  });

  // ─── getAllDefinitions ─────────────────────────────────────────────────────
  describe('getAllDefinitions', () => {
    it('retorna solo la versión más reciente de cada slug', async () => {
      mockDefRepo.find.mockResolvedValue([
        baseDef({ id: 2, slug: 'triaje', version: 2 }),
        baseDef({ id: 1, slug: 'triaje', version: 1 }),
        baseDef({ id: 3, slug: 'social', version: 1 }),
      ]);

      const result = await service.getAllDefinitions();

      expect(result).toHaveLength(2);
      expect(result.find((d) => d.slug === 'triaje')?.version).toBe(2);
      expect(result.find((d) => d.slug === 'social')?.version).toBe(1);
    });

    it('retorna lista vacía si no hay definiciones', async () => {
      mockDefRepo.find.mockResolvedValue([]);

      const result = await service.getAllDefinitions();

      expect(result).toHaveLength(0);
    });

    it('maneja múltiples slugs con múltiples versiones', async () => {
      mockDefRepo.find.mockResolvedValue([
        baseDef({ id: 4, slug: 'legal', version: 3 }),
        baseDef({ id: 3, slug: 'legal', version: 2 }),
        baseDef({ id: 2, slug: 'triaje', version: 2 }),
        baseDef({ id: 1, slug: 'triaje', version: 1 }),
      ]);

      const result = await service.getAllDefinitions();

      expect(result).toHaveLength(2);
      expect(result.find((d) => d.slug === 'legal')?.version).toBe(3);
    });
  });

  // ─── updateDefinition ─────────────────────────────────────────────────────
  describe('updateDefinition', () => {
    it('crea una nueva versión incrementando el número de versión', async () => {
      const existing = baseDef({ version: 1 });
      const newDef = baseDef({ id: 2, version: 2 });

      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(existing),
        save: jest.fn().mockResolvedValue(newDef),
      });
      mockDefRepo.manager.transaction.mockImplementation(async (cb: (m: typeof manager) => Promise<FormDefinition>) =>
        cb(manager),
      );

      const result = await service.updateDefinition('triaje', {
        configuracion: { campos: [] },
      });

      expect(result.version).toBe(2);
      expect(result.slug).toBe('triaje');
    });

    it('incluye el número de versión dentro del configuracionJson', async () => {
      const existing = baseDef({ version: 2 });

      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(existing),
        save: jest.fn().mockImplementation((_entity: unknown, data: FormDefinition) =>
          Promise.resolve(data),
        ),
      });
      mockDefRepo.manager.transaction.mockImplementation(async (cb: (m: typeof manager) => Promise<FormDefinition>) =>
        cb(manager),
      );

      const result = await service.updateDefinition('triaje', {
        configuracion: { campos: ['campo1'] },
      });

      const config = JSON.parse(result.configuracionJson ?? '{}');
      expect(config.version).toBe(3);
    });

    it('lanza NotFoundException si el slug no existe', async () => {
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockDefRepo.manager.transaction.mockImplementation(async (cb: (m: typeof manager) => Promise<FormDefinition>) =>
        cb(manager),
      );

      await expect(
        service.updateDefinition('no-existe', { configuracion: {} }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getDefinitionBySlugAndVersion ────────────────────────────────────────
  describe('getDefinitionBySlugAndVersion', () => {
    it('retorna la versión exacta solicitada', async () => {
      mockDefRepo.findOne.mockResolvedValue(baseDef({ version: 2 }));

      const result = await service.getDefinitionBySlugAndVersion('triaje', 2);

      expect(result?.version).toBe(2);
    });

    it('retorna null si la versión no existe', async () => {
      mockDefRepo.findOne.mockResolvedValue(null);

      const result = await service.getDefinitionBySlugAndVersion('triaje', 99);

      expect(result).toBeNull();
    });
  });

  // ─── getVersionsBySlug ────────────────────────────────────────────────────
  describe('getVersionsBySlug', () => {
    it('retorna todas las versiones de un slug ordenadas DESC', async () => {
      mockDefRepo.find.mockResolvedValue([
        baseDef({ version: 3 }),
        baseDef({ version: 2 }),
        baseDef({ version: 1 }),
      ]);

      const result = await service.getVersionsBySlug('triaje');

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
    });

    it('retorna lista vacía si el slug no tiene versiones', async () => {
      mockDefRepo.find.mockResolvedValue([]);

      const result = await service.getVersionsBySlug('no-existe');

      expect(result).toHaveLength(0);
    });
  });
});
