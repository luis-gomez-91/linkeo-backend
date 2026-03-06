import { Module } from '@nestjs/common';
import { PaymentezService } from './paymentez.service';
import { PaymentezController } from './paymentez.controller';
import { PaymentezWebhookController } from './paymentez-webhook.controller';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [UsersModule, PlansModule, SubscriptionsModule],
  controllers: [PaymentezController, PaymentezWebhookController],
  providers: [PaymentezService],
  exports: [PaymentezService],
})
export class PaymentezModule {}
