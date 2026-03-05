import { Controller, Post, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from './subscriptions.service';

@Controller('stripe/webhook')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      return { received: false };
    }
    let event: Stripe.Event;
    try {
      event = await this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      return { received: false, error: (err as Error).message };
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription && session.metadata?.userId) {
          await this.subscriptionsService.syncFromStripeSubscription(
            session.metadata.userId,
            session.subscription as string,
          );
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await this.subscriptionsService.syncFromStripeSubscription(userId, sub.id);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          await this.subscriptionsService.markPastDue(invoice.subscription);
        }
        break;
      }
      default:
        break;
    }
    return { received: true };
  }
}
