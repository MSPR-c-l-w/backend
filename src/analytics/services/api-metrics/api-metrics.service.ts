import { Injectable } from '@nestjs/common';

type HttpMetricEvent = {
  ts: number;
  method: string;
  path: string;
  status: number;
  durationMs: number;
};

function normalizePath(path: string): string {
  // Réduction de la cardinalité (ids numériques/UUID).
  return path
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:uuid',
    );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

@Injectable()
export class ApiMetricsService {
  private readonly buffer: HttpMetricEvent[] = [];
  private readonly BUFFER_LIMIT = 100_000;

  record(event: Omit<HttpMetricEvent, 'path'> & { path: string }): void {
    const normalized: HttpMetricEvent = {
      ...event,
      path: normalizePath(event.path),
    };
    this.buffer.push(normalized);
    if (this.buffer.length > this.BUFFER_LIMIT) {
      this.buffer.splice(0, this.buffer.length - this.BUFFER_LIMIT);
    }
  }

  private getSinceMs(sinceMs: number): HttpMetricEvent[] {
    // Filtre simple (buffer in-memory borné).
    return this.buffer.filter((e) => e.ts >= sinceMs);
  }

  getKpis(sinceMs: number): {
    totalCalls: number;
    totalErrors: number;
    averageLatencyMs: number;
    successRatePercent: number;
  } {
    const events = this.getSinceMs(sinceMs);
    const totalCalls = events.length;
    const totalErrors = events.filter((e) => e.status >= 500).length;
    const successCalls = events.filter((e) => e.status < 400).length;
    const latencySum = events.reduce((sum, e) => sum + e.durationMs, 0);
    const averageLatencyMs =
      totalCalls > 0 ? Math.round(latencySum / totalCalls) : 0;
    const successRatePercent =
      totalCalls > 0 ? Math.round((successCalls / totalCalls) * 1000) / 10 : 0;
    return {
      totalCalls,
      totalErrors,
      averageLatencyMs,
      successRatePercent,
    };
  }

  getRequestsPerHour(sinceMs: number): number {
    const events = this.getSinceMs(sinceMs);
    const windowMs = Date.now() - sinceMs;
    if (windowMs <= 0) return 0;
    return Math.round((events.length / windowMs) * 3600_000);
  }

  getEndpointStats(
    sinceMs: number,
    limit = 20,
  ): Array<{
    endpoint: string;
    calls: number;
    avgLatency: number;
    errors: number;
    successRate: number;
  }> {
    const events = this.getSinceMs(sinceMs);
    const byEndpoint = new Map<
      string,
      { calls: number; latencySum: number; errors: number; success: number }
    >();

    for (const e of events) {
      const key = `${e.method.toUpperCase()} ${e.path}`;
      const cur = byEndpoint.get(key) ?? {
        calls: 0,
        latencySum: 0,
        errors: 0,
        success: 0,
      };
      cur.calls += 1;
      cur.latencySum += e.durationMs;
      if (e.status >= 500) cur.errors += 1;
      if (e.status < 400) cur.success += 1;
      byEndpoint.set(key, cur);
    }

    return Array.from(byEndpoint.entries())
      .map(([endpoint, s]) => {
        const avgLatency = s.calls > 0 ? Math.round(s.latencySum / s.calls) : 0;
        const successRate =
          s.calls > 0 ? Math.round((s.success / s.calls) * 1000) / 10 : 0;
        return {
          endpoint,
          calls: s.calls,
          avgLatency,
          errors: s.errors,
          successRate,
        };
      })
      .sort((a, b) => b.calls - a.calls)
      .slice(0, clamp(limit, 1, 100));
  }

  getTimeseries(params: {
    sinceMs: number;
    bucketMs: number;
    formatLabel: (bucketStart: number) => string;
  }): Array<{
    time: string;
    calls: number;
    errors: number;
    latency: number;
  }> {
    const { sinceMs, bucketMs, formatLabel } = params;
    const now = Date.now();
    const buckets = Math.ceil((now - sinceMs) / bucketMs);
    const series = new Array(buckets).fill(null).map(() => ({
      calls: 0,
      errors: 0,
      latencySum: 0,
    }));

    for (const e of this.getSinceMs(sinceMs)) {
      const idx = Math.floor((e.ts - sinceMs) / bucketMs);
      if (idx < 0 || idx >= series.length) continue;
      series[idx].calls += 1;
      if (e.status >= 500) series[idx].errors += 1;
      series[idx].latencySum += e.durationMs;
    }

    const result: Array<{
      time: string;
      calls: number;
      errors: number;
      latency: number;
    }> = [];
    for (let i = 0; i < series.length; i++) {
      const bucketStart = sinceMs + i * bucketMs;
      const calls = series[i].calls;
      const latency = calls > 0 ? Math.round(series[i].latencySum / calls) : 0;
      result.push({
        time: formatLabel(bucketStart),
        calls,
        errors: series[i].errors,
        latency,
      });
    }
    return result;
  }
}
