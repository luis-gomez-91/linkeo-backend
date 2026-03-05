import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const theme = await this.prisma.theme.findFirst({
      where: { id, isActive: true },
    });
    if (!theme) throw new NotFoundException('Tema no encontrado');
    return theme;
  }
}
