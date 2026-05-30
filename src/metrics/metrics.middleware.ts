import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/metrics') {
      next();
      return;
    }

    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - start;
      const durationSeconds = Number(durationNs) / 1e9;
      const route =
        (req.route as { path?: string } | undefined)?.path ?? req.path;
      this.metricsService.enregistrerRequeteHttp(
        route,
        req.method,
        res.statusCode,
        durationSeconds,
      );
    });

    next();
  }
}
