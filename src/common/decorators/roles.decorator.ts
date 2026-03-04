import { SetMetadata } from '@nestjs/common';
import { ProfesionalRol } from '../../auth/profesional.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ProfesionalRol[]) =>
  SetMetadata(ROLES_KEY, roles);
