import { Module } from '@nestjs/common';
import { AnalyticsService } from './services/analytics/analytics.service';
import { AnalyticsController } from './controllers/analytics/analytics.controller';

@Module({
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
