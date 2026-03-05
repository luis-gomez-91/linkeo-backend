import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { StripeModule } from './stripe/stripe.module';
import { PagesModule } from './pages/pages.module';
import { LinksModule } from './links/links.module';
import { ThemesModule } from './themes/themes.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PlansModule,
    SubscriptionsModule,
    StripeModule,
    PagesModule,
    LinksModule,
    ThemesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
