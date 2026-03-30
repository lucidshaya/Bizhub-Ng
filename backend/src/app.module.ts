import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { CamerasModule } from './cameras/cameras.module';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        try {
          const store = await redisStore({
            url: configService.get('REDIS_URL') || 'redis://localhost:6379',
            ttl: 300000, // 5 minutes default TTL
          });
          return { store };
        } catch (error) {
          console.warn('Redis Connection Error: falling back to in-memory cache.');
          return {}; // Memory store is default when no store is provided
        }
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    StaffModule,
    TransactionsModule,
    DashboardModule,
    ChatModule,
    CamerasModule,
    SettingsModule,
    PaymentsModule,
    AdminModule,
    EmailModule,
    WebhooksModule,
    WaitlistModule,
    SupportModule,
  ],
})
export class AppModule { }
