import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  makeCounterProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsService } from './metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Nombre total de requêtes HTTP reçues',
      labelNames: ['route', 'method', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Durée des requêtes HTTP en secondes',
      labelNames: ['route', 'method', 'status_code'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1],
    }),
    makeCounterProvider({
      name: 'ai_api_calls_total',
      help: "Nombre total d'appels aux APIs IA externes",
      labelNames: ['provider', 'type'],
    }),
    makeHistogramProvider({
      name: 'etl_pipeline_duration_seconds',
      help: 'Durée des pipelines ETL en secondes',
      labelNames: ['pipeline'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
