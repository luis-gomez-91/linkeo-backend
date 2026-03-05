import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StripeService } from './stripe.service';
import { UsersService } from '../users/users.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('stripe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
  ) {}

  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Crear sesión de checkout para suscripción' })
  async createCheckoutSession(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    const profile = await this.usersService.getProfile(userId);
    const email = (profile as { email: string }).email;
    return this.stripeService.createCheckoutSession(
      userId,
      email,
      dto.planId,
      dto.successUrl,
      dto.cancelUrl,
      dto.yearly ?? false,
    );
  }

  @Post('customer-portal')
  @ApiOperation({ summary: 'URL del portal de cliente Stripe (gestionar/cancelar)' })
  async customerPortal(
    @CurrentUser('sub') userId: string,
    @Body('returnUrl') returnUrl: string,
  ) {
    const profile = await this.usersService.getProfile(userId) as {
      stripeCustomerId?: string;
      subscription?: { stripeCustomerId?: string };
    };
    const customerId = profile.subscription?.stripeCustomerId ?? profile.stripeCustomerId;
    if (!customerId) throw new BadRequestException('No tienes una suscripción de pago. Suscríbete primero a un plan.');
    return this.stripeService.createCustomerPortalSession(customerId, returnUrl || 'https://app.linkeo.com/settings');
  }
}
