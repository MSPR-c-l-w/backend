import { Module } from '@nestjs/common';
import { AnalyticsService } from './services/analytics/analytics.service';
import { AnalyticsController } from './controllers/analytics/analytics.controller';
import { SERVICES } from 'src/utils/constants';
import { ApiMetricsService } from 'src/analytics/services/api-metrics/api-metrics.service';
import { ApiLogsService } from 'src/analytics/services/api-logs/api-logs.service';
import { MachineStatsService } from 'src/analytics/services/machine-stats/machine-stats.service';

@Module({
  providers: [
    { provide: SERVICES.ANALYTICS, useClass: AnalyticsService },
    AnalyticsService,
    ApiMetricsService,
    MachineStatsService,
    ApiLogsService,
  ],
  controllers: [AnalyticsController],
  exports: [
    { provide: SERVICES.ANALYTICS, useClass: AnalyticsService },
    AnalyticsService,
    ApiMetricsService,
    ApiLogsService,
  ],
})
export class AnalyticsModule {}
