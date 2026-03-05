import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
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
    const token = this.generateToken(user.id, user.email);
    return { user, access_token: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    const token = this.generateToken(user.id, user.email);
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
