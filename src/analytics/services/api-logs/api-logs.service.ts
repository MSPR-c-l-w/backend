import { Injectable } from '@nestjs/common';
import {
  type ApiLogsDashboardDto,
  type ApiLogsRange,
  type ApiLogsServerStatusDto,
} from 'src/analytics/interfaces/api-logs.interface';
import { ApiMetricsService } from 'src/analytics/services/api-metrics/api-metrics.service';
import { MachineStatsService } from 'src/analytics/services/machine-stats/machine-stats.service';

function rangeToWindowMs(range: ApiLogsRange): number {
  if (range === '1h') return 3600_000;
  if (range === '24h') return 24 * 3600_000;
  if (range === '7j') return 7 * 24 * 3600_000;
  return 30 * 24 * 3600_000;
}

function rangeToBucket(range: ApiLogsRange): {
  bucketMs: number;
  formatLabel: (ts: number) => string;
} {
  if (range === '1h') {
    return {
      bucketMs: 5 * 60_000,
      formatLabel: (ts) =>
        new Date(ts).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
    };
  }
  if (range === '24h') {
    return {
      bucketMs: 60 * 60_000,
      formatLabel: (ts) =>
        new Date(ts).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
    };
  }
  if (range === '7j') {
    return {
      bucketMs: 6 * 60 * 60_000,
      formatLabel: (ts) =>
        new Date(ts).toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }),
    };
  }
  return {
    bucketMs: 24 * 60 * 60_000,
    formatLabel: (ts) =>
      new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      }),
  };
}

@Injectable()
export class ApiLogsService {
  constructor(
    private readonly metrics: ApiMetricsService,
    private readonly machine: MachineStatsService,
  ) {}

  getServerStatus(): ApiLogsServerStatusDto {
    const machineStats = this.machine.getStats();
    const requestsPerHour = this.metrics.getRequestsPerHour(
      Date.now() - 3600_000,
    );

    return {
      name: 'Backend API',
      status:
        machineStats.cpuPercent > 90 || machineStats.memoryPercent > 92
          ? 'warning'
          : 'online',
      uptime: machineStats.uptime,
      requestsPerHour: `${requestsPerHour.toLocaleString('fr-FR')}/h`,
      cpuPercent: machineStats.cpuPercent,
      memoryPercent: machineStats.memoryPercent,
      lastRestart: machineStats.lastRestart,
      loadAvg1m: machineStats.loadAvg1m,
    };
  }

  getDashboard(range: ApiLogsRange): ApiLogsDashboardDto {
    const windowMs = rangeToWindowMs(range);
    const sinceMs = Date.now() - windowMs;

    const kpis = this.metrics.getKpis(sinceMs);
    const { bucketMs, formatLabel } = rangeToBucket(range);
    const timeseries = this.metrics.getTimeseries({
      sinceMs,
      bucketMs,
      formatLabel,
    });
    const endpoints = this.metrics.getEndpointStats(sinceMs, 20);

    const server = this.getServerStatus();

    return {
      kpis: {
        totalCalls: kpis.totalCalls,
        successRatePercent: kpis.successRatePercent,
        averageLatencyMs: kpis.averageLatencyMs,
        totalErrors: kpis.totalErrors,
      },
      timeseries,
      endpoints,
      server,
    };
  }
}
