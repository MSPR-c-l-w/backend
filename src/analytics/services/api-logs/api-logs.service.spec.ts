import { ApiLogsService } from './api-logs.service';
import { ApiMetricsService } from 'src/analytics/services/api-metrics/api-metrics.service';
import { MachineStatsService } from 'src/analytics/services/machine-stats/machine-stats.service';

describe('ApiLogsService', () => {
  let service: ApiLogsService;
  let metrics: {
    getKpis: jest.Mock;
    getTimeseries: jest.Mock;
    getEndpointStats: jest.Mock;
    getRequestsPerHour: jest.Mock;
  };
  let machine: { getStats: jest.Mock };

  beforeEach(() => {
    metrics = {
      getKpis: jest.fn(),
      getTimeseries: jest.fn(),
      getEndpointStats: jest.fn(),
      getRequestsPerHour: jest.fn(),
    };
    machine = {
      getStats: jest.fn(),
    };
    service = new ApiLogsService(
      metrics as unknown as ApiMetricsService,
      machine as unknown as MachineStatsService,
    );
  });

  it('should return server status and set warning when cpu or memory high', () => {
    metrics.getRequestsPerHour.mockReturnValue(1234);
    machine.getStats.mockReturnValue({
      cpuPercent: 95,
      memoryPercent: 10,
      loadAvg1m: 1.23,
      uptime: '1h 2m',
      lastRestart: 'Il y a 1h 2m',
    });

    const result = service.getServerStatus();

    expect(result).toEqual({
      name: 'Backend API',
      status: 'warning',
      uptime: '1h 2m',
      requestsPerHour: '1 234/h',
      cpuPercent: 95,
      memoryPercent: 10,
      lastRestart: 'Il y a 1h 2m',
      loadAvg1m: 1.23,
    });
  });

  it('should build dashboard using metrics services', () => {
    metrics.getKpis.mockReturnValue({
      totalCalls: 10,
      totalErrors: 2,
      averageLatencyMs: 123,
      successRatePercent: 80,
    });
    metrics.getTimeseries.mockReturnValue([
      { time: '00:00', calls: 1, errors: 0, latency: 100 },
    ]);
    metrics.getEndpointStats.mockReturnValue([
      {
        endpoint: 'GET /x',
        calls: 1,
        avgLatency: 100,
        errors: 0,
        successRate: 100,
      },
    ]);
    metrics.getRequestsPerHour.mockReturnValue(10);
    machine.getStats.mockReturnValue({
      cpuPercent: 10,
      memoryPercent: 10,
      loadAvg1m: 0.1,
      uptime: '10m',
      lastRestart: 'Il y a 10m',
    });

    const dashboard = service.getDashboard('24h');

    expect(metrics.getKpis).toHaveBeenCalled();
    expect(metrics.getTimeseries).toHaveBeenCalled();
    expect(metrics.getEndpointStats).toHaveBeenCalledWith(
      expect.any(Number),
      20,
    );
    expect(dashboard.kpis).toEqual({
      totalCalls: 10,
      successRatePercent: 80,
      averageLatencyMs: 123,
      totalErrors: 2,
    });
    expect(dashboard.timeseries).toHaveLength(1);
    expect(dashboard.endpoints).toHaveLength(1);
    expect(dashboard.server.status).toBe('online');
  });
});
