import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanSlug } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { slug: slug.toUpperCase() as PlanSlug, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }
}
