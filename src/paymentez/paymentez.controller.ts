import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentezService } from './paymentez.service';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { InitReferenceDto } from './dto/init-reference.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentezController {
  constructor(
    private readonly paymentezService: PaymentezService,
    private readonly usersService: UsersService,
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('init-reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicializar referencia de pago (Nuvei/Paymentez) - devuelve checkout_url' })
  async initReference(
    @CurrentUser('sub') userId: string,
    @Body() dto: InitReferenceDto,
  ) {
    const profile = await this.usersService.getProfile(userId) as { email: string };
    const plan = await this.getPlanAndAmount(dto.planId, dto.yearly ?? false);
    const amount = plan.amount;
    const description = `Linkeo - ${plan.name} (${dto.yearly ? 'Anual' : 'Mensual'})`;
    const devReference = `linkeo-${userId}-${plan.slug}-${Date.now()}`;
    const result = await this.paymentezService.initReference({
      userId,
      userEmail: profile.email,
      amount,
      description,
      devReference,
      locale: 'es',
      vat: 0,
    });
    await this.prisma.pendingPayment.create({
      data: {
        devReference,
        userId,
        planId: dto.planId,
        yearly: dto.yearly ?? false,
        status: 'PENDING',
        paymentezRef: result.reference,
      },
    });
    return {
      checkout_url: result.checkout_url,
      reference: result.reference,
      dev_reference: devReference,
    };
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar estado del pago tras volver del checkout (por dev_reference)' })
  async confirm(
    @CurrentUser('sub') userId: string,
    @Body('dev_reference') devReference: string,
  ) {
    if (!devReference) throw new BadRequestException('dev_reference es requerido');
    const pending = await this.prisma.pendingPayment.findUnique({
      where: { devReference },
    });
    if (!pending || pending.userId !== userId) throw new BadRequestException('Pago no encontrado');
    if (pending.status === 'COMPLETED') {
      const sub = await this.subscriptionsService.getCurrentSubscription(userId);
      return { status: 'completed', subscription: sub };
    }
    if (pending.status === 'FAILED') {
      return { status: 'failed' };
    }
    return { status: 'pending', message: 'El pago aún no ha sido confirmado. Si ya pagaste, puede tardar unos segundos.' };
  }

  private async getPlanAndAmount(planId: string, yearly: boolean): Promise<{ name: string; slug: string; amount: number }> {
    const plan = await this.plansService.findById(planId);
    if (!plan) throw new BadRequestException('Plan no encontrado');
    if (plan.slug === 'FREE') throw new BadRequestException('El plan gratuito no requiere pago');
    const amount = yearly && plan.priceYearly != null
      ? Number(plan.priceYearly)
      : Number(plan.priceMonthly);
    return { name: plan.name, slug: plan.slug, amount };
  }
}
