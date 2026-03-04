import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Profesional, ProfesionalRol } from './profesional.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Profesional) private profesionalesRepo: Repository<Profesional>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const profesional = await this.profesionalesRepo.findOne({
      where: { email: dto.email, activo: true },
    });
    if (!profesional) throw new UnauthorizedException('Credenciales inválidas');

    const isMatch = await bcrypt.compare(dto.password, profesional.password);
    if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');

    const payload = {
      sub: profesional.id,
      email: profesional.email,
      rol: profesional.rol,
    };
    return {
      access_token: this.jwtService.sign(payload),
      profesional: {
        id: profesional.id,
        email: profesional.email,
        nombre: profesional.nombre,
        apellido: profesional.apellido,
        rol: profesional.rol,
      },
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.profesionalesRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const profesional = this.profesionalesRepo.create({
      ...dto,
      password: hash,
      rol: dto.rol ?? ProfesionalRol.CONSULTA,
    });
    const saved = await this.profesionalesRepo.save(profesional);
    const { password, ...result } = saved;
    return result;
  }

  async getProfile(profesionalId: number) {
    const profesional = await this.profesionalesRepo.findOne({
      where: { id: profesionalId },
    });
    if (!profesional) throw new UnauthorizedException();
    const { password, ...result } = profesional;
    return result;
  }

  async findAllProfesionales() {
    const list = await this.profesionalesRepo.find({
      order: { nombre: 'ASC' },
    });
    return list.map(({ password, ...p }) => p);
  }

  async updateProfesional(id: number, dto: UpdateProfesionalDto) {
    const profesional = await this.profesionalesRepo.findOne({ where: { id } });
    if (!profesional) throw new NotFoundException('Profesional no encontrado');
    Object.assign(profesional, dto);
    const saved = await this.profesionalesRepo.save(profesional);
    const { password, ...result } = saved;
    return result;
  }

  async seed() {
    const admin = await this.profesionalesRepo.findOne({
      where: { email: 'admin@admin.ec' },
    });
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.profesionalesRepo.save(
        this.profesionalesRepo.create({
          email: 'admin@admin.ec',
          password: hash,
          nombre: 'Administrador',
          apellido: 'Sistema',
          rol: ProfesionalRol.ADMIN,
        }),
      );
    }
  }
}
