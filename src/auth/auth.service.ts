import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthJsService, AuthJsJwtPayload } from './auth-js.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authJsService: AuthJsService,
  ) {}

  /**
   * Sesión con Auth.js: verifica el JWT emitido por Auth.js (correo, Google, Apple, Facebook, etc.),
   * crea o actualiza el usuario en nuestra BD y devuelve nuestro JWT.
   */
  async sessionWithAuthJs(accessToken: string) {
    const payload = await this.authJsService.verifyToken(accessToken);
    const user = await this.findOrCreateUserFromAuthJs(payload);
    const token = this.generateToken(user.id, user.email ?? '');
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      access_token: token,
    };
  }

  private async findOrCreateUserFromAuthJs(payload: AuthJsJwtPayload) {
    const email = payload.email ?? null;
    const name = payload.name ?? null;
    const avatarUrl = payload.picture ?? null;
    const sub = payload.sub!;

    let user = await this.prisma.user.findUnique({
      where: { supabaseUid: sub },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: email ?? user.email,
          name: name ?? user.name,
          avatarUrl: avatarUrl ?? user.avatarUrl,
          emailVerified: true,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          supabaseUid: sub,
          email,
          name,
          avatarUrl,
          emailVerified: true,
        },
      });
      const freePlan = await this.prisma.plan.findUnique({ where: { slug: 'FREE' } });
      if (freePlan) {
        await this.prisma.subscription.create({
          data: { userId: user.id, planId: freePlan.id, status: 'ACTIVE' },
        });
      }
    }
    return user;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Ya existe un usuario con este email');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: user.id },
      include: { plan: true },
    });
    if (!subscription) {
      const freePlan = await this.prisma.plan.findUnique({ where: { slug: 'FREE' } });
      if (freePlan)
        await this.prisma.subscription.create({
          data: { userId: user.id, planId: freePlan.id, status: 'ACTIVE' },
        });
    }
    const token = this.generateToken(user.id, user.email ?? '');
    return { user, access_token: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.passwordHash) {
      throw new UnauthorizedException('Esta cuenta usa inicio de sesión con Auth.js (Google, Apple, etc.). Inicia sesión desde la app.');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    const token = this.generateToken(user.id, user.email ?? '');
    const { passwordHash: _, ...safe } = user;
    return { user: safe, access_token: token };
  }

  private generateToken(sub: string, email: string): string {
    return this.jwtService.sign({ sub, email });
  }

  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }
}
