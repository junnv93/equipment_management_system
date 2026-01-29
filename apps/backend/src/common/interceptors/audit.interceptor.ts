import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';
import { AuditService, CreateAuditLogDto } from '../../modules/audit/audit.service';
import { AuditLogDetails } from '@equipment-management/db/schema';

// 인증된 사용자 정보 타입
interface AuthUser {
  id?: string;
  userId?: string;
  name?: string;
  role?: string;
  roles?: string[];
}

// Express Request에 user 추가
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 메타데이터 가져오기
    const auditMetadata = this.reflector.get<AuditLogMetadata>(AUDIT_LOG_KEY, context.getHandler());

    // 데코레이터가 없으면 패스
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 인증된 사용자가 없으면 패스 (로그인/로그아웃 제외)
    if (!user && !['login', 'logout'].includes(auditMetadata.action)) {
      return next.handle();
    }

    // 변경 전 값 저장 (update/delete 시)
    let previousValue: Record<string, unknown> | undefined;
    if (auditMetadata.trackPreviousValue) {
      // 비동기로 이전 값을 가져오는 로직은 서비스에서 처리
      // 여기서는 요청 데이터만 저장
    }

    return next.handle().pipe(
      tap({
        next: (response: unknown) => {
          // 비동기로 감사 로그 기록 (성능 영향 최소화)
          this.logAuditAsync(auditMetadata, request, response, previousValue).catch((error) => {
            this.logger.error(
              `Audit log failed: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error.stack : undefined
            );
          });
        },
        error: () => {
          // 에러 발생 시에도 필요하다면 로그 기록 가능
          // 현재는 성공한 경우만 기록
        },
      })
    );
  }

  /**
   * 비동기로 감사 로그 기록
   */
  private async logAuditAsync(
    metadata: AuditLogMetadata,
    request: AuthenticatedRequest,
    response: unknown,
    previousValue?: Record<string, unknown>
  ): Promise<void> {
    const user = request.user;
    const ipAddress = this.getClientIp(request);

    // 엔티티 ID 추출
    const entityId = this.extractValue(metadata.entityIdPath, request, response);
    if (!entityId) {
      this.logger.warn(`Could not extract entityId for ${metadata.action} ${metadata.entityType}`);
      return;
    }

    // 엔티티 이름 추출
    const entityName = this.extractValue(metadata.entityNamePath, request, response);

    // 상세 정보 구성
    const details: AuditLogDetails = {};
    if (previousValue) {
      details.previousValue = previousValue;
    }
    if (response && typeof response === 'object') {
      // 민감한 정보 제외하고 새 값 저장
      details.newValue = this.sanitizeData(response);
    }
    if (request.body && Object.keys(request.body).length > 0) {
      details.additionalInfo = { requestBody: this.sanitizeData(request.body) };
    }

    const auditLogDto: CreateAuditLogDto = {
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Anonymous User',
      userRole: user?.role || 'unknown',
      action: metadata.action,
      entityType: metadata.entityType,
      entityId,
      entityName,
      details: Object.keys(details).length > 0 ? details : undefined,
      ipAddress,
    };

    await this.auditService.create(auditLogDto);
  }

  /**
   * 경로에서 값 추출
   * 예: 'params.uuid', 'body.id', 'response.uuid', 'response.data.id'
   */
  private extractValue(
    path: string | undefined,
    request: AuthenticatedRequest,
    response: unknown
  ): string | undefined {
    if (!path) return undefined;

    const parts = path.split('.');
    let value: unknown;

    // 첫 번째 부분에 따라 시작 객체 결정
    const source = parts[0];
    if (source === 'params') {
      value = request.params;
      parts.shift();
    } else if (source === 'body') {
      value = request.body;
      parts.shift();
    } else if (source === 'query') {
      value = request.query;
      parts.shift();
    } else if (source === 'response') {
      value = response;
      parts.shift();
    } else {
      // 기본적으로 response에서 시작
      value = response;
    }

    // 나머지 경로 따라가기
    for (const part of parts) {
      if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return typeof value === 'string' ? value : (value as { toString?: () => string })?.toString?.();
  }

  /**
   * 클라이언트 IP 주소 가져오기
   */
  private getClientIp(request: AuthenticatedRequest): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      // x-forwarded-for는 string 또는 string[] 일 수 있음
      const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return forwardedValue?.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress;
  }

  /**
   * 민감한 데이터 제거
   */
  private sanitizeData(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'privateKey',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '******';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
