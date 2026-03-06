import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async ensureFreePlan(userId: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    const freePlan = await this.prisma.plan.findUnique({ where: { slug: 'FREE' } });
    if (!freePlan) return null;
    return this.prisma.subscription.create({
      data: { userId, planId: freePlan.id, status: 'ACTIVE' },
      include: { plan: true },
    });
  }

  /** Activar plan de pago tras confirmar pago con Paymentez/Nuvei */
  async activatePaidPlan(userId: string, planId: string, isYearly: boolean) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return null;
    const now = new Date();
    const periodEnd = new Date(now);
    if (isYearly) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isYearly,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isYearly,
      },
      include: { plan: true },
    });
  }
}
