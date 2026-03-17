import { AnalyticsController } from './analytics.controller';
import type { IAnalyticsService } from 'src/analytics/interfaces/analytics.interface';
import { ApiLogsService } from 'src/analytics/services/api-logs/api-logs.service';

describe('AnalyticsController (API & Logs endpoints)', () => {
  let controller: AnalyticsController;
  let analyticsService: Partial<IAnalyticsService>;
  let apiLogsService: { getDashboard: jest.Mock; getServerStatus: jest.Mock };

  beforeEach(() => {
    analyticsService = {
      getEngagementSummary: jest.fn(),
      getEngagementTimeseries: jest.fn(),
      getProgression: jest.fn(),
      getDemographicsConversion: jest.fn(),
      getNutritionTrends: jest.fn(),
    };
    apiLogsService = {
      getDashboard: jest.fn(),
      getServerStatus: jest.fn(),
    };
    controller = new AnalyticsController(
      analyticsService as IAnalyticsService,
      apiLogsService as unknown as ApiLogsService,
    );
  });

  it('should default range to 24h when invalid', () => {
    apiLogsService.getDashboard.mockReturnValue({
      kpis: {
        totalCalls: 0,
        successRatePercent: 0,
        averageLatencyMs: 0,
        totalErrors: 0,
      },
      timeseries: [],
      endpoints: [],
      server: {
        name: 'Backend API',
        status: 'online',
        uptime: '0m',
        requestsPerHour: '0/h',
        cpuPercent: 0,
        memoryPercent: 0,
        lastRestart: 'Il y a 0m',
        loadAvg1m: 0,
      },
    });

    controller.getApiLogsDashboard('invalid' as never);

    expect(apiLogsService.getDashboard).toHaveBeenCalledWith('24h');
  });

  it('should forward range to dashboard', () => {
    apiLogsService.getDashboard.mockReturnValue({} as never);

    controller.getApiLogsDashboard('7j');

    expect(apiLogsService.getDashboard).toHaveBeenCalledWith('7j');
  });

  it('should return server status', () => {
    apiLogsService.getServerStatus.mockReturnValue({
      name: 'Backend API',
      status: 'online',
      uptime: '10m',
      requestsPerHour: '1/h',
      cpuPercent: 1,
      memoryPercent: 2,
      lastRestart: 'Il y a 10m',
      loadAvg1m: 0,
    });

    const result = controller.getApiLogsServerStatus();

    expect(apiLogsService.getServerStatus).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'Backend API', status: 'online' });
  });
});
