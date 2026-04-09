import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { MonitoringService } from '../../modules/monitoring/monitoring.service';

// 인증된 사용자 정보 타입
interface AuthUser {
  id?: string;
  userId?: string;
}

// Express Request에 user 추가
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * 응답 크기를 안전하게 추정한다. 로깅 인터셉터는 결코 핸들러 응답을 깨뜨려서는 안 되므로,
 * serializable 하지 않은 모든 값(undefined, Buffer, Stream, circular ref, BigInt 등)을
 * sentinel 로 폴백한다.
 *
 * - `undefined` → 0 (파일 다운로드, res.send, 204 No Content 등 stream/empty 응답)
 * - `Buffer` → byteLength (직접 바이트 크기)
 * - 그 외 직렬화 실패 → -1 (크기 미상 sentinel)
 */
function safeResponseSize(data: unknown): number {
  if (data === undefined || data === null) return 0;
  if (Buffer.isBuffer(data)) return data.byteLength;
  try {
    const json = JSON.stringify(data);
    return typeof json === 'string' ? json.length : -1;
  } catch {
    return -1;
  }
}

// 에러 타입
interface HttpError extends Error {
  status?: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly monitoringService: MonitoringService
  ) {
    this.loggerService.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url, body, headers, params, query } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.userId || 'anonymous';

    const startTime = Date.now();

    // 요청 시작 로깅
    this.loggerService.log(`Request ${method} ${url}`, {
      userId,
      method,
      url,
      userAgent,
      params,
      query,
      // 민감한 정보는 로깅하지 않음
      body: this.sanitizeBody(body),
    });

    // 응답 처리 및 로깅
    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const responseTime = Date.now() - startTime;

          // 응답 로깅
          this.loggerService.log(`Response ${method} ${url} ${responseTime}ms`, {
            userId,
            method,
            url,
            responseTime,
            // 응답 크기 추정. 로깅은 결코 핸들러 응답을 깨뜨리면 안 되므로 throw-safe.
            // undefined(파일 다운로드, res.send, 204), Buffer, Stream, BigInt, circular ref 등
            // JSON.stringify 가 throw/misbehave 하는 모든 케이스에서 안전한 폴백 반환.
            responseSize: safeResponseSize(data),
          });

          // info 레벨 로그 카운트 증가
          this.monitoringService.incrementLogCount('info');
        },
        error: (error: HttpError) => {
          const responseTime = Date.now() - startTime;

          // 오류 로깅
          this.loggerService.error(
            `Error ${method} ${url} ${responseTime}ms ${error.status ?? 500} ${error.message}`,
            error.stack,
            {
              userId,
              method,
              url,
              responseTime,
              errorName: error.name,
              errorMessage: error.message,
            }
          );

          // error 레벨 로그 카운트 증가
          this.monitoringService.incrementLogCount('error');
        },
      })
    );
  }

  /**
   * 민감한 정보를 마스킹 처리하여 로깅
   */
  private sanitizeBody(
    body: Record<string, unknown> | null | undefined
  ): Record<string, unknown> | null | undefined {
    if (!body) return body;

    // 객체 복사
    const sanitizedBody = { ...body };

    // 민감한 필드 마스킹
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
    ];

    sensitiveFields.forEach((field) => {
      if (field in sanitizedBody) {
        sanitizedBody[field] = '******';
      }
    });

    return sanitizedBody;
  }
}
