import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatePersonaDto } from '../personas/dto/create-persona.dto';
import { UpdatePersonaDto } from '../personas/dto/update-persona.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './guards/public.decorator';
import { RequierePermiso } from './guards/requiere-permiso.decorator';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: CreatePersonaDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  // ===== Fase D: Endpoints de CLIENTE =====

  @RequierePermiso('usuario:ver_propio')
  @Get('me')
  getMe(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.authService.getMe(userId);
  }

  @RequierePermiso('usuario:actualizar_propio')
  @Patch('me')
  updateMe(@Req() req: Request, @Body() dto: UpdatePersonaDto) {
    const userId = (req as any).user.sub;
    return this.authService.updateMe(userId, dto);
  }

  @RequierePermiso('vehiculos:ver_propios')
  @Get('mis-vehiculos')
  getMisVehiculos(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.authService.getMisVehiculos(userId);
  }
}
