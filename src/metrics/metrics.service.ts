import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpDurationHistogram: Histogram<string>,
    @InjectMetric('ai_api_calls_total')
    private readonly aiCallsCounter: Counter<string>,
    @InjectMetric('etl_pipeline_duration_seconds')
    private readonly etlDurationHistogram: Histogram<string>,
  ) {}

  enregistrerRequeteHttp(
    route: string,
    method: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = { route, method, status_code: String(statusCode) };
    this.httpRequestsCounter.inc(labels);
    this.httpDurationHistogram.observe(labels, durationSeconds);
  }

  enregistrerAppelIA(provider: string, type: string): void {
    this.aiCallsCounter.inc({ provider, type });
  }

  observerDureeETL(pipeline: string, durationSeconds: number): void {
    this.etlDurationHistogram.observe({ pipeline }, durationSeconds);
  }
}
