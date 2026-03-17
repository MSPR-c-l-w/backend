export type ApiLogsRange = '1h' | '24h' | '7j' | '30j';

export interface ApiLogsKpisDto {
  totalCalls: number;
  successRatePercent: number;
  averageLatencyMs: number;
  totalErrors: number;
}

export interface ApiLogsTimeseriesPointDto {
  time: string;
  calls: number;
  errors: number;
  latency: number;
}

export interface ApiLogsEndpointStatDto {
  endpoint: string;
  calls: number;
  avgLatency: number;
  errors: number;
  successRate: number;
}

export interface ApiLogsServerStatusDto {
  name: string;
  status: 'online' | 'warning';
  uptime: string;
  requestsPerHour: string;
  cpuPercent: number;
  memoryPercent: number;
  lastRestart: string;
  loadAvg1m: number;
}

export interface ApiLogsDashboardDto {
  kpis: ApiLogsKpisDto;
  timeseries: ApiLogsTimeseriesPointDto[];
  endpoints: ApiLogsEndpointStatDto[];
  server: ApiLogsServerStatusDto;
}
