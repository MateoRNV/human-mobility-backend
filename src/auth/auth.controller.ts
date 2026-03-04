import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ProfesionalRol } from './profesional.entity';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión — devuelve access_token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Roles(ProfesionalRol.ADMIN)
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo profesional (solo ADMIN)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Datos del profesional autenticado' })
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @ApiBearerAuth()
  @Roles(ProfesionalRol.ADMIN)
  @Get('profesionales')
  @ApiOperation({ summary: 'Listar todos los profesionales (solo ADMIN)' })
  findAllProfesionales() {
    return this.authService.findAllProfesionales();
  }

  @ApiBearerAuth()
  @Roles(ProfesionalRol.ADMIN)
  @Patch('profesionales/:id')
  @ApiOperation({ summary: 'Cambiar rol o estado de un profesional (solo ADMIN)' })
  updateProfesional(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProfesionalDto,
  ) {
    return this.authService.updateProfesional(id, dto);
  }
}
