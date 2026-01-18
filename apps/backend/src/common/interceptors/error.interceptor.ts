import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';
import { MonitoringService } from '../../modules/monitoring/monitoring.service';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly monitoringService: MonitoringService
  ) {
    this.logger.setContext('ErrorInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // 오류 로그 카운트 증가
        this.monitoringService.incrementLogCount('error');

        // 기존 HttpException은 그대로 전달
        if (error instanceof HttpException) {
          const status = error.getStatus();
          const response = error.getResponse();

          // 오류 로깅
          this.logger.error(`HttpException: ${status} ${error.message}`, error.stack, { response });

          return throwError(() => error);
        }

        // 데이터베이스 오류 또는 기타 서버 오류
        this.logger.error(`시스템 오류: ${error.message || '알 수 없는 오류'}`, error.stack, {
          originalError: error,
        });

        // 운영 환경에서는 자세한 오류 정보를 클라이언트에 노출하지 않음
        const isProd = process.env.NODE_ENV === 'production';
        const errorMessage = isProd
          ? '서버에서 오류가 발생했습니다. 나중에 다시 시도해주세요.'
          : error.message || '알 수 없는 오류';

        // 인터널 서버 오류로 변환하여 반환
        return throwError(
          () =>
            new InternalServerErrorException({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: errorMessage,
              error: 'Internal Server Error',
              timestamp: new Date().toISOString(),
            })
        );
      })
    );
  }
}
