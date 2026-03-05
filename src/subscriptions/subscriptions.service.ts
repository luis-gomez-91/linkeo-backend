import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async getCurrentSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async syncFromStripeSubscription(userId: string, stripeSubscriptionId: string) {
    const stripe = this.stripeService.getClient();
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ['plan.product'] });
    const priceId = sub.items.data[0]?.price.id;
    let plan = sub.metadata?.planId
      ? await this.prisma.plan.findUnique({ where: { id: sub.metadata.planId as string } })
      : null;
    if (!plan && priceId) {
      const planByPrice = await this.prisma.plan.findFirst({
        where: {
          OR: [{ stripePriceIdMonthly: priceId }, { stripePriceIdYearly: priceId }],
        },
      });
      plan = planByPrice ?? null;
    }
    if (!plan) return;

    const status = this.mapStripeStatus(sub.status);
    const isYearly = sub.items.data[0]?.price.recurring?.interval === 'year';

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        status,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        isYearly,
      },
      update: {
        planId: plan.id,
        status,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        isYearly,
      },
    });
  }

  private async getPlanSlugByStripePriceId(priceId: string): Promise<string | null> {
    const plan = await this.prisma.plan.findFirst({
      where: {
        OR: [
          { stripePriceIdMonthly: priceId },
          { stripePriceIdYearly: priceId },
        ],
      },
    });
    return plan?.slug ?? null;
  }

  private mapStripeStatus(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: 'ACTIVE',
      canceled: 'CANCELED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
      unpaid: 'UNPAID',
    };
    return map[status] || 'ACTIVE';
  }

  async markPastDue(stripeSubscriptionId: string) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId },
      data: { status: 'PAST_DUE' },
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
}
