import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/** Payload que envía Paymentez/Nuvei al webhook (formato según documentación) */
interface PaymentezWebhookPayload {
  transaction?: {
    dev_reference?: string;
    status?: string;
    status_detail?: number;
    id?: string;
  };
  dev_reference?: string;
  status?: string;
  status_detail?: number;
  id?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentezWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de Paymentez/Nuvei - confirmar pago y activar plan' })
  async webhook(@Body() payload: PaymentezWebhookPayload) {
    const transaction = payload.transaction ?? payload;
    const devReference = transaction?.dev_reference ?? payload.dev_reference;
    const status = (transaction.status ?? payload.status ?? '').toLowerCase();
    const statusDetail = 'status_detail' in transaction ? transaction.status_detail : payload.status_detail;
    const transactionId = transaction.id ?? payload.id;

    if (!devReference) {
      return { received: true, processed: false, reason: 'missing dev_reference' };
    }

    // status_detail 3 = aprobado (según doc Paymentez); status "success" también
    const isSuccess = status === 'success' || status === 'approved' || statusDetail === 3;

    const pending = await this.prisma.pendingPayment.findUnique({
      where: { devReference },
    });

    if (!pending) {
      return { received: true, processed: false, reason: 'pending payment not found' };
    }

    if (pending.status === 'COMPLETED') {
      return { received: true, processed: true, reason: 'already completed' };
    }

    if (isSuccess) {
      await this.subscriptionsService.activatePaidPlan(pending.userId, pending.planId, pending.yearly);
      await this.prisma.pendingPayment.update({
        where: { devReference },
        data: { status: 'COMPLETED', transactionId: transactionId ?? undefined },
      });
      return { received: true, processed: true, reason: 'subscription activated' };
    }

    await this.prisma.pendingPayment.update({
      where: { devReference },
      data: { status: 'FAILED', transactionId: transactionId ?? undefined },
    });
    return { received: true, processed: true, reason: 'payment failed recorded' };
  }
}
