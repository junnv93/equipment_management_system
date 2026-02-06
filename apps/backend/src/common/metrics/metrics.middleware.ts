import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = process.hrtime();

    const route = this.normalizeRoute(originalUrl);

    this.metricsService.incrementHttpRequestsInProgress(method, route);

    res.on('finish', () => {
      const status = res.statusCode.toString();
      const diff = process.hrtime(start);
      const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
      const responseTimeInSeconds = responseTime / 1000;

      this.metricsService.decrementHttpRequestsInProgress(method, route);
      this.metricsService.incrementHttpRequestTotal(method, route, status);
      this.metricsService.observeHttpRequestDuration(method, route, status, responseTimeInSeconds);
    });

    next();
  }

  private normalizeRoute(url: string): string {
    // URL의 동적 파라미터를 패턴으로 변환 (예: /users/123 -> /users/:id)
    return url
      .split('/')
      .map((part) => {
        // 숫자만 있는 부분을 :id로 변환
        if (/^\d+$/.test(part)) {
          return ':id';
        }
        // UUID 형식인 부분을 :uuid로 변환
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
          return ':uuid';
        }
        return part;
      })
      .join('/');
  }
}
