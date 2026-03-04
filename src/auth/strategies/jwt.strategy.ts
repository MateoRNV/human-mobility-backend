import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Profesional } from '../profesional.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Profesional)
    private profesionalesRepo: Repository<Profesional>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'human-mobility-secret-dev-only',
    });
  }

  async validate(payload: { sub: number; email: string; rol: string }) {
    const profesional = await this.profesionalesRepo.findOne({
      where: { id: payload.sub, activo: true },
    });
    if (!profesional) throw new UnauthorizedException();
    const { password, ...result } = profesional;
    return result;
  }
}
