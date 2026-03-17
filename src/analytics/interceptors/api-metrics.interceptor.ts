import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiMetricsService } from 'src/analytics/services/api-metrics/api-metrics.service';

@Injectable()
export class ApiMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: ApiMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const type = context.getType<'http' | 'ws' | 'rpc'>();
    if (type !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{
      method?: string;
      originalUrl?: string;
      url?: string;
    }>();
    const response = http.getResponse<{ statusCode?: number }>();

    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - start;
          this.metrics.record({
            ts: Date.now(),
            method: request.method ?? 'GET',
            path: request.originalUrl ?? request.url ?? '',
            status: response.statusCode ?? 200,
            durationMs,
          });
        },
        error: () => {
          const durationMs = Date.now() - start;
          this.metrics.record({
            ts: Date.now(),
            method: request.method ?? 'GET',
            path: request.originalUrl ?? request.url ?? '',
            status: response.statusCode ?? 500,
            durationMs,
          });
        },
      }),
    );
  }
}
