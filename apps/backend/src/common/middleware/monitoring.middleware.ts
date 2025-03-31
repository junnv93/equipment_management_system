import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../../modules/monitoring/monitoring.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const endpoint = req.originalUrl || req.url;
    
    // 응답 완료 후 호출될 리스너 추가
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // 모니터링 서비스에 요청 정보 기록
      this.monitoringService.recordHttpRequest(
        endpoint,
        statusCode,
        responseTime
      );
    });
    
    next();
  }
} 