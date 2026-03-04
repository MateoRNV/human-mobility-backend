import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { Person } from './person.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const USUARIO = 'profesional@mdmq.gob.ec';

// Helper: instancia base de Person con todos los campos que usa toListDto/toDetailDto
const basePerson = (overrides: Partial<Person> = {}): Person =>
  ({
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    documento: '1700000001',
    numeroCaso: '20241',
    parentId: null,
    parent: null,
    children: [],
    contactos: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
    usuarioCreacion: null,
    usuarioModificacion: null,
    enviosCuestionario: [],
    ...overrides,
  }) as Person;

describe('PersonsService', () => {
  let service: PersonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonsService,
        { provide: getRepositoryToken(Person), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PersonsService>(PersonsService);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('retorna la lista mapeada con nombreCompleto', async () => {
      mockRepo.find.mockResolvedValue([basePerson()]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].nombreCompleto).toBe('Juan Pérez');
      expect(result[0].id).toBe(1);
    });

    it('retorna lista vacía cuando no hay personas activas', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });

    it('incluye los slugs de cuestionarios completados', async () => {
      const person = basePerson({
        enviosCuestionario: [
          { cuestionarioSlug: 'triaje' } as any,
          { cuestionarioSlug: 'social' } as any,
        ],
      });
      mockRepo.find.mockResolvedValue([person]);

      const result = await service.findAll();

      expect(result[0].cuestionarios).toEqual(['triaje', 'social']);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('retorna la persona existente', async () => {
      mockRepo.findOne.mockResolvedValue(basePerson());

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.nombreCompleto).toBe('Juan Pérez');
    });

    it('lanza NotFoundException si la persona no existe o está inactiva', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('crea una persona con documento sin conflictos', async () => {
      // Call 1: verificar conflicto de documento → null (sin conflicto)
      // Call 2: findOne al final para retornar el resultado
      mockRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue(basePerson());

      const created = basePerson({ numeroCaso: null });
      mockRepo.create.mockReturnValue(created);
      mockRepo.save
        .mockResolvedValueOnce(created)       // guardado inicial (sin numeroCaso)
        .mockResolvedValue(basePerson());     // guardado con numeroCaso asignado

      const result = await service.create(
        { nombre: 'Juan', apellido: 'Pérez', documento: '1700000001' },
        USUARIO,
      );

      expect(result.documento).toBe('1700000001');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioCreacion: USUARIO,
          usuarioModificacion: USUARIO,
        }),
      );
    });

    it('lanza ConflictException si ya existe una persona con ese documento', async () => {
      // Call 1: verificar conflicto → retorna persona existente
      mockRepo.findOne.mockResolvedValueOnce(basePerson({ id: 99 }));

      await expect(
        service.create({ nombre: 'Juan', apellido: 'Pérez', documento: '1700000001' }, USUARIO),
      ).rejects.toThrow(ConflictException);
    });

    it('crea una persona sin documento verificando nombre+apellido', async () => {
      // Call 1: check nombre+apellido → null (sin conflicto)
      // Call 2: findOne al final
      mockRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue(basePerson({ documento: null }));

      const created = basePerson({ documento: null, numeroCaso: null });
      mockRepo.create.mockReturnValue(created);
      mockRepo.save
        .mockResolvedValueOnce(created)
        .mockResolvedValue(basePerson({ documento: null }));

      const result = await service.create(
        { nombre: 'Juan', apellido: 'Pérez' },
        USUARIO,
      );

      expect(result.nombre).toBe('Juan');
    });

    it('lanza ConflictException si ya existe persona con mismo nombre+apellido sin documento', async () => {
      mockRepo.findOne.mockResolvedValueOnce(basePerson({ id: 99, documento: null }));

      await expect(
        service.create({ nombre: 'Juan', apellido: 'Pérez' }, USUARIO),
      ).rejects.toThrow(ConflictException);
    });

    it('asigna el numeroCaso del padre cuando se proporciona parentId', async () => {
      const parent = basePerson({ id: 5, numeroCaso: '20245' });
      const child = basePerson({ id: 6, parentId: 5, numeroCaso: '20245' });

      mockRepo.findOne
        .mockResolvedValueOnce(null)    // check conflicto documento
        .mockResolvedValueOnce(parent)  // buscar parent
        .mockResolvedValue(child);      // findOne final

      mockRepo.create.mockReturnValue({ ...child, numeroCaso: null });
      mockRepo.save.mockResolvedValue(child);

      const result = await service.create(
        { nombre: 'Juan', apellido: 'Pérez', documento: '1700000001', parentId: 5 },
        USUARIO,
      );

      expect(result.parentId).toBe(5);
      expect(result.numeroCaso).toBe('20245');
    });

    it('lanza NotFoundException si el parentId no existe', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce(null)  // check conflicto documento
        .mockResolvedValueOnce(null); // parent no encontrado

      await expect(
        service.create(
          { nombre: 'Juan', apellido: 'Pérez', documento: '1700000001', parentId: 999 },
          USUARIO,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('actualiza el nombre de la persona', async () => {
      const person = basePerson({ documento: null });
      const updated = basePerson({ nombre: 'Carlos', documento: null });

      mockRepo.findOne
        .mockResolvedValueOnce(person)    // buscar persona
        .mockResolvedValueOnce(null)      // check conflicto nombre+apellido → sin conflicto
        .mockResolvedValue(updated);      // findOne final

      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { nombre: 'Carlos' }, USUARIO);

      expect(result.nombre).toBe('Carlos');
    });

    it('escribe usuarioModificacion al actualizar', async () => {
      const person = basePerson({ documento: null });
      mockRepo.findOne
        .mockResolvedValueOnce(person)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(person);
      mockRepo.save.mockResolvedValue(person);

      await service.update(1, { nombre: 'Carlos' }, USUARIO);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioModificacion: USUARIO }),
      );
    });

    it('lanza NotFoundException si la persona no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'X' }, USUARIO)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ConflictException si ya existe otra persona con el mismo documento', async () => {
      const person = basePerson({ documento: '1700000001' });
      const other = basePerson({ id: 99, documento: '1700000001' });

      mockRepo.findOne
        .mockResolvedValueOnce(person)  // buscar persona
        .mockResolvedValueOnce(other);  // conflict check → encuentra otra persona

      await expect(
        service.update(1, { documento: '1700000001' }, USUARIO),
      ).rejects.toThrow(ConflictException);
    });
  });
});
