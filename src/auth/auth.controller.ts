import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SessionDto } from './dto/session.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session')
  @ApiOperation({
    summary: 'Sesión con Auth.js',
    description:
      'Envía el JWT de Auth.js (getToken() desde tu app Next.js con correo, Google, Apple, Facebook, etc.). El backend lo decodifica con AUTH_SECRET, crea o actualiza el usuario y devuelve un JWT propio para la API.',
  })
  async session(@Body() dto: SessionDto) {
    return this.authService.sessionWithAuthJs(dto.access_token);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro con email y contraseña (legacy)' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login con email y contraseña (legacy)' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
