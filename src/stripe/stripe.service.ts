import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secret || 'sk_test_placeholder');
  }

  getClient(): Stripe {
    return this.stripe;
  }

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (user?.stripeCustomerId) return user.stripeCustomerId;
    const customer = await this.stripe.customers.create({ email });
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  async createCheckoutSession(
    userId: string,
    userEmail: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
    yearly: boolean,
  ): Promise<{ url: string }> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan no encontrado');
    if (plan.slug === 'FREE') throw new Error('El plan gratuito no requiere pago');

    const priceId = yearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
    if (!priceId) throw new Error('Precio de Stripe no configurado para este plan');

    const customerId = await this.getOrCreateCustomer(userId, userEmail);
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        yearly: String(yearly),
      },
      subscription_data: {
        metadata: { userId, planId, yearly: String(yearly) },
        trial_period_days: 0,
      },
    });
    if (!session.url) throw new Error('No se pudo crear la URL de checkout');
    return { url: session.url };
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET no configurado');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
