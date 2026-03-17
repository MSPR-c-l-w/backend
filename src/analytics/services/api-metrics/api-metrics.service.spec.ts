import { ApiMetricsService } from './api-metrics.service';

describe('ApiMetricsService', () => {
  let service: ApiMetricsService;

  beforeEach(() => {
    service = new ApiMetricsService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should normalize numeric ids and uuids in paths', () => {
    const now = 1_700_000_000_000;
    jest.setSystemTime(now);

    service.record({
      ts: now,
      method: 'GET',
      path: '/users/123/profile',
      status: 200,
      durationMs: 10,
    });
    service.record({
      ts: now,
      method: 'GET',
      path: '/users/550e8400-e29b-41d4-a716-446655440000/profile',
      status: 200,
      durationMs: 12,
    });

    const stats = service.getEndpointStats(now - 1, 10);
    expect(stats.map((s) => s.endpoint)).toEqual(
      expect.arrayContaining([
        'GET /users/:id/profile',
        'GET /users/:uuid/profile',
      ]),
    );
  });

  it('should compute KPIs (calls, errors, average latency, success rate)', () => {
    const now = 1_700_000_000_000;
    jest.setSystemTime(now);

    service.record({
      ts: now - 1000,
      method: 'GET',
      path: '/ok',
      status: 200,
      durationMs: 100,
    });
    service.record({
      ts: now - 900,
      method: 'POST',
      path: '/bad-request',
      status: 400,
      durationMs: 50,
    });
    service.record({
      ts: now - 800,
      method: 'GET',
      path: '/boom',
      status: 500,
      durationMs: 250,
    });

    const kpis = service.getKpis(now - 10_000);
    expect(kpis.totalCalls).toBe(3);
    expect(kpis.totalErrors).toBe(1);
    expect(kpis.averageLatencyMs).toBe(Math.round((100 + 50 + 250) / 3));
    // success = <400 => only 200
    expect(kpis.successRatePercent).toBeCloseTo(33.3, 1);
  });

  it('should compute endpoint stats and sort by calls', () => {
    const now = 1_700_000_000_000;
    jest.setSystemTime(now);

    for (let i = 0; i < 3; i++) {
      service.record({
        ts: now - 1000 + i,
        method: 'GET',
        path: '/a',
        status: 200,
        durationMs: 100,
      });
    }
    service.record({
      ts: now - 900,
      method: 'GET',
      path: '/b',
      status: 503,
      durationMs: 300,
    });

    const stats = service.getEndpointStats(now - 10_000, 10);
    expect(stats[0]).toMatchObject({
      endpoint: 'GET /a',
      calls: 3,
      errors: 0,
      avgLatency: 100,
      successRate: 100,
    });
    expect(stats[1]).toMatchObject({
      endpoint: 'GET /b',
      calls: 1,
      errors: 1,
      avgLatency: 300,
      successRate: 0,
    });
  });

  it('should bucket timeseries and compute avg latency per bucket', () => {
    const base = 1_700_000_000_000;
    jest.setSystemTime(base);

    const sinceMs = base - 10_000;
    const bucketMs = 5_000;
    const label = (ts: number) => `t:${ts}`;

    // 2 events in bucket 0
    service.record({
      ts: sinceMs + 100,
      method: 'GET',
      path: '/x',
      status: 200,
      durationMs: 100,
    });
    service.record({
      ts: sinceMs + 200,
      method: 'GET',
      path: '/x',
      status: 500,
      durationMs: 300,
    });
    // 1 event in bucket 1
    service.record({
      ts: sinceMs + 5_100,
      method: 'GET',
      path: '/x',
      status: 200,
      durationMs: 200,
    });

    const series = service.getTimeseries({
      sinceMs,
      bucketMs,
      formatLabel: label,
    });

    expect(series.length).toBeGreaterThanOrEqual(2);
    expect(series[0]).toMatchObject({
      time: label(sinceMs),
      calls: 2,
      errors: 1,
      latency: 200,
    });
    expect(series[1]).toMatchObject({
      calls: 1,
      errors: 0,
      latency: 200,
    });
  });
});
