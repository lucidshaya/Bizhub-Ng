import { Module } from '@nestjs/common';
import { RetailAnalyticsController } from './retail-analytics.controller';
import { RetailAnalyticsService } from './retail-analytics.service';

@Module({
  controllers: [RetailAnalyticsController],
  providers: [RetailAnalyticsService],
})
export class RetailAnalyticsModule {}
