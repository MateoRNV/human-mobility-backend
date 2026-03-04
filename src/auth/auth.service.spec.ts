import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Profesional, ProfesionalRol } from './profesional.entity';

jest.mock('bcrypt');

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwt = { sign: jest.fn().mockReturnValue('mock.token') };

const baseProfesional = (overrides = {}): Partial<Profesional> => ({
  id: 1,
  email: 'a@b.com',
  password: 'hashed',
  nombre: 'Ana',
  apellido: 'López',
  rol: ProfesionalRol.ADMIN,
  activo: true,
  fechaCreacion: new Date(),
  fechaModificacion: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Profesional), useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── login ───────────────────────────────────────────────────────────────
  describe('login', () => {
    it('retorna access_token y datos del profesional con credenciales válidas', async () => {
      mockRepo.findOne.mockResolvedValue(baseProfesional());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'a@b.com', password: '1234' });

      expect(result.access_token).toBe('mock.token');
      expect(result.profesional.email).toBe('a@b.com');
      expect(result.profesional).not.toHaveProperty('password');
    });

    it('lanza UnauthorizedException si el profesional no existe o está inactivo', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@b.com', password: '1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña no coincide', async () => {
      mockRepo.findOne.mockResolvedValue(baseProfesional());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'incorrecta' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── register ────────────────────────────────────────────────────────────
  describe('register', () => {
    it('crea un nuevo profesional y lo retorna sin el campo password', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const saved = baseProfesional({ id: 2, email: 'nuevo@b.com', rol: ProfesionalRol.CONSULTA });
      mockRepo.create.mockReturnValue(saved);
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.register({
        email: 'nuevo@b.com',
        password: '1234',
        nombre: 'Ana',
        apellido: 'López',
      });

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('nuevo@b.com');
    });

    it('usa ProfesionalRol.CONSULTA como rol por defecto si no se especifica', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const saved = baseProfesional({ rol: ProfesionalRol.CONSULTA });
      mockRepo.create.mockReturnValue(saved);
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.register({
        email: 'a@b.com',
        password: '1234',
        nombre: 'Ana',
        apellido: 'López',
      });

      expect(result.rol).toBe(ProfesionalRol.CONSULTA);
    });

    it('lanza ConflictException si el email ya está registrado', async () => {
      mockRepo.findOne.mockResolvedValue(baseProfesional());

      await expect(
        service.register({ email: 'a@b.com', password: '1234', nombre: 'A', apellido: 'B' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── getProfile ──────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('retorna el profesional sin password dado su id', async () => {
      mockRepo.findOne.mockResolvedValue(baseProfesional());

      const result = await service.getProfile(1);

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
    });

    it('lanza UnauthorizedException si el id no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── findAllProfesionales ─────────────────────────────────────────────────
  describe('findAllProfesionales', () => {
    it('retorna la lista completa sin el campo password', async () => {
      mockRepo.find.mockResolvedValue([
        baseProfesional({ id: 1 }),
        baseProfesional({ id: 2, email: 'b@b.com' }),
      ]);

      const result = await service.findAllProfesionales();

      expect(result).toHaveLength(2);
      result.forEach((p) => expect(p).not.toHaveProperty('password'));
    });

    it('retorna lista vacía si no hay profesionales', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.findAllProfesionales();

      expect(result).toHaveLength(0);
    });
  });

  // ─── updateProfesional ────────────────────────────────────────────────────
  describe('updateProfesional', () => {
    it('actualiza los campos enviados y retorna sin password', async () => {
      const existente = baseProfesional({ rol: ProfesionalRol.CONSULTA, activo: true });
      mockRepo.findOne.mockResolvedValue(existente);
      mockRepo.save.mockResolvedValue({ ...existente, rol: ProfesionalRol.ABOGADO });

      const result = await service.updateProfesional(1, { rol: ProfesionalRol.ABOGADO });

      expect(result).not.toHaveProperty('password');
      expect(result.rol).toBe(ProfesionalRol.ABOGADO);
    });

    it('puede desactivar un profesional', async () => {
      const existente = baseProfesional({ activo: true });
      mockRepo.findOne.mockResolvedValue(existente);
      mockRepo.save.mockResolvedValue({ ...existente, activo: false });

      const result = await service.updateProfesional(1, { activo: false });

      expect(result.activo).toBe(false);
    });

    it('lanza NotFoundException si el profesional no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProfesional(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── seed ─────────────────────────────────────────────────────────────────
  describe('seed', () => {
    it('crea el admin si no existe en la BD', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.seed();

      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('no crea el admin si ya existe', async () => {
      mockRepo.findOne.mockResolvedValue(baseProfesional());

      await service.seed();

      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });
});
