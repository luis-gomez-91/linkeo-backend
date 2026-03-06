import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentezModule } from './paymentez/paymentez.module';
import { PagesModule } from './pages/pages.module';
import { LinksModule } from './links/links.module';
import { ThemesModule } from './themes/themes.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PlansModule,
    SubscriptionsModule,
    PaymentezModule,
    PagesModule,
    LinksModule,
    ThemesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
