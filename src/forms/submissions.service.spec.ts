import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { Person } from '../persons/person.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { SubmissionHistory } from './entities/submission-history.entity';

const USUARIO = 'profesional@mdmq.gob.ec';

const mockPersonRepo = { findOne: jest.fn() };
const mockFormSubmissionRepo = { findOne: jest.fn() };
const mockHistoryRepo = { find: jest.fn() };
const mockDataSource = { transaction: jest.fn() };

// Fábrica de manager de transacción
const makeManager = (overrides: Record<string, jest.Mock> = {}) => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
  save: jest.fn().mockResolvedValue({}),
  ...overrides,
});

const baseSubmission = (overrides = {}): Partial<FormSubmission> => ({
  personaId: 1,
  cuestionarioSlug: 'triaje',
  versionCuestionario: 1,
  respuestasJson: JSON.stringify([{ campoId: 1, valor: 'Sí' }]),
  activo: true,
  fechaModificacion: new Date('2026-01-01'),
  usuarioCreacion: null,
  usuarioModificacion: null,
  ...overrides,
});

describe('SubmissionsService', () => {
  let service: SubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: getRepositoryToken(Person), useValue: mockPersonRepo },
        { provide: getRepositoryToken(FormSubmission), useValue: mockFormSubmissionRepo },
        { provide: getRepositoryToken(SubmissionHistory), useValue: mockHistoryRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
    jest.clearAllMocks();
  });

  // ─── getForm ──────────────────────────────────────────────────────────────
  describe('getForm', () => {
    it('retorna respuestas vacías si no existe submission para esa persona y slug', async () => {
      mockPersonRepo.findOne.mockResolvedValue({ id: 1, activo: true });
      mockFormSubmissionRepo.findOne.mockResolvedValue(null);

      const result = await service.getForm(1, 'triaje');

      expect(result.respuestas).toEqual([]);
      expect(result.personaId).toBe(1);
      expect(result.cuestionarioSlug).toBe('triaje');
      expect(result.fecha_modificacion).toBeNull();
    });

    it('retorna las respuestas parseadas si existe un submission', async () => {
      mockPersonRepo.findOne.mockResolvedValue({ id: 1, activo: true });
      mockFormSubmissionRepo.findOne.mockResolvedValue(baseSubmission());

      const result = await service.getForm(1, 'triaje');

      expect(result.respuestas).toHaveLength(1);
      expect(result.respuestas[0]).toEqual({ campoId: 1, valor: 'Sí' });
      expect(result.versionCuestionario).toBe(1);
      expect(result.fecha_modificacion).not.toBeNull();
    });

    it('retorna respuestas vacías si el JSON de respuestas está vacío', async () => {
      mockPersonRepo.findOne.mockResolvedValue({ id: 1, activo: true });
      mockFormSubmissionRepo.findOne.mockResolvedValue(
        baseSubmission({ respuestasJson: null }),
      );

      const result = await service.getForm(1, 'triaje');

      expect(result.respuestas).toEqual([]);
    });

    it('lanza NotFoundException si la persona no existe', async () => {
      mockPersonRepo.findOne.mockResolvedValue(null);

      await expect(service.getForm(999, 'triaje')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getFormHistory ───────────────────────────────────────────────────────
  describe('getFormHistory', () => {
    it('retorna el historial mapeado con respuestas parseadas', async () => {
      mockHistoryRepo.find.mockResolvedValue([
        {
          id: 1,
          versionCuestionario: 1,
          respuestasJson: JSON.stringify([{ campoId: 1, valor: 'No' }]),
          fechaCreacion: new Date('2026-01-01'),
        },
        {
          id: 2,
          versionCuestionario: 2,
          respuestasJson: JSON.stringify([{ campoId: 1, valor: 'Sí' }]),
          fechaCreacion: new Date('2026-01-02'),
        },
      ]);

      const result = await service.getFormHistory(1, 'triaje');

      expect(result).toHaveLength(2);
      expect(result[0].respuestas[0].valor).toBe('No');
      expect(result[1].versionCuestionario).toBe(2);
    });

    it('retorna lista vacía si no hay historial', async () => {
      mockHistoryRepo.find.mockResolvedValue([]);

      const result = await service.getFormHistory(1, 'triaje');

      expect(result).toHaveLength(0);
    });

    it('maneja registros con respuestasJson null', async () => {
      mockHistoryRepo.find.mockResolvedValue([
        {
          id: 1,
          versionCuestionario: 1,
          respuestasJson: null,
          fechaCreacion: new Date(),
        },
      ]);

      const result = await service.getFormHistory(1, 'triaje');

      expect(result[0].respuestas).toEqual([]);
    });
  });

  // ─── saveForm ─────────────────────────────────────────────────────────────
  describe('saveForm', () => {
    it('lanza NotFoundException si la persona no existe', async () => {
      mockPersonRepo.findOne.mockResolvedValue(null);

      await expect(
        service.saveForm(999, 'triaje', { version_cuestionario: 1, respuestas: [] }, USUARIO),
      ).rejects.toThrow(NotFoundException);
    });

    it('crea un nuevo submission si no existe uno previo', async () => {
      mockPersonRepo.findOne.mockResolvedValue({ id: 1, activo: true });

      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(null), // no hay submission previo
      });
      mockDataSource.transaction.mockImplementation(async (cb: (m: typeof manager) => Promise<void>) =>
        cb(manager),
      );

      // getForm se llama al final de saveForm para retornar el resultado
      mockFormSubmissionRepo.findOne.mockResolvedValue(baseSubmission({ respuestasJson: '[]' }));

      const result = await service.saveForm(
        1,
        'triaje',
        { version_cuestionario: 1, respuestas: [] },
        USUARIO,
      );

      expect(result.personaId).toBe(1);
      // Se llama save dos veces: una para FormSubmission, otra para SubmissionHistory
      expect(manager.save).toHaveBeenCalledTimes(2);
    });

    it('escribe usuarioCreacion y usuarioModificacion al crear un submission nuevo', async () => {
      mockPersonRepo.findOne.mockResolvedValue({ id: 1, activo: true });

      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockDataSource.transaction.mockImplementation(async (cb: (m: typeof manager) => Promise<void>) =>
        cb(manager),
      );
      mockFormSubmissionRepo.findOne.mockResolvedValue(baseSubmission({ respuestasJson: '[]' }));

      await service.saveForm(
        1,
        'triaje',
        { version_cuestionario: 1, respuestas: [] },
        USUARIO,
      );

      expect(manager.create).toHaveBeenCalledWith(
        FormSubmission,
        expect.objectContaining({
          usuarioCreacion: USUARIO,
          usuarioModificacion: USUARIO,
        }),
      );
    });

    it('actualiza un submission existente sin cambiar usuarioCreacion', async () => {
      mockPersonRepo.findOne.mockResolvedValue({ id: 1, activo: true });

      const existingSubmission = {
        ...baseSubmission(),
        usuarioCreacion: 'otro@mdmq.gob.ec',
      };
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(existingSubmission),
      });
      mockDataSource.transaction.mockImplementation(async (cb: (m: typeof manager) => Promise<void>) =>
        cb(manager),
      );
      mockFormSubmissionRepo.findOne.mockResolvedValue(
        baseSubmission({ respuestasJson: JSON.stringify([{ campoId: 1, valor: 'Actualizado' }]) }),
      );

      const result = await service.saveForm(
        1,
        'triaje',
        { version_cuestionario: 1, respuestas: [{ campoId: 1, valor: 'Actualizado' } as any] },
        USUARIO,
      );

      // usuarioModificacion se actualiza, usuarioCreacion permanece del original
      expect(existingSubmission.usuarioModificacion).toBe(USUARIO);
      expect(existingSubmission.usuarioCreacion).toBe('otro@mdmq.gob.ec');
      expect(result.cuestionarioSlug).toBe('triaje');
    });
  });
});
