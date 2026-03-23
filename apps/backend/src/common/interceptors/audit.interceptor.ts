import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';
import { AuditService } from '../../modules/audit/audit.service';
import type { AuditAction, CreateAuditLogDto } from '@equipment-management/schemas';
import { SYSTEM_USER_UUID } from '../../database/utils/uuid-constants';
import { AuditLogDetails } from '@equipment-management/db/schema';
import type { AuthenticatedRequest, JwtUser } from '../../types/auth';

/** 감사 로그 details JSON 최대 크기 (바이트) */
const AUDIT_DETAILS_MAX_SIZE = 32_768; // 32KB
/** 배열 truncate 임계값 */
const AUDIT_ARRAY_MAX_LENGTH = 5;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. @SkipAudit() 체크 — 명시적 제외
    const skipAudit = this.reflector.get<boolean>(SKIP_AUDIT_KEY, context.getHandler());
    if (skipAudit) {
      return next.handle();
    }

    // 2. @AuditLog() 메타데이터 가져오기
    const auditMetadata = this.reflector.get<AuditLogMetadata>(AUDIT_LOG_KEY, context.getHandler());

    // 3. 기본 감사 로직 (POST/PATCH/DELETE → 자동 감사)
    if (!auditMetadata) {
      const httpMethod = request.method?.toUpperCase();
      const shouldAuditByDefault = ['POST', 'PATCH', 'DELETE'].includes(httpMethod);

      if (!shouldAuditByDefault) {
        return next.handle(); // GET 등 → 감사 안 함
      }

      // 인증된 사용자가 없으면 패스
      if (!user) {
        return next.handle();
      }

      // 기본 메타데이터 생성 (경로 기반 추론)
      const defaultMetadata: AuditLogMetadata = this.createDefaultMetadata(request, httpMethod);

      return this.auditResponse(next, defaultMetadata, request, user);
    }

    // 4. @AuditLog() 커스텀 메타데이터 사용
    // 인증된 사용자가 없으면 패스 (로그인/로그아웃 제외)
    if (!user && !['login', 'logout'].includes(auditMetadata.action)) {
      return next.handle();
    }

    return this.auditResponse(next, auditMetadata, request, user);
  }

  /**
   * 응답 후 감사 로그 기록
   */
  private auditResponse(
    next: CallHandler,
    metadata: AuditLogMetadata,
    request: AuthenticatedRequest,
    _user: JwtUser | undefined
  ): Observable<unknown> {
    // 변경 전 값 저장 (update/delete 시)
    let previousValue: Record<string, unknown> | undefined;
    if (metadata.trackPreviousValue) {
      // 비동기로 이전 값을 가져오는 로직은 서비스에서 처리
      // 여기서는 요청 데이터만 저장
    }

    return next.handle().pipe(
      tap({
        next: (response: unknown) => {
          // 비동기로 감사 로그 기록 (성능 영향 최소화)
          this.logAuditAsync(metadata, request, response, previousValue).catch((error) => {
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
   * 기본 감사 로그 메타데이터 생성 (경로 기반 추론)
   *
   * 예: POST /api/equipment → { action: 'create', entityType: 'equipment', entityIdPath: 'response.id' }
   */
  private createDefaultMetadata(
    request: AuthenticatedRequest,
    httpMethod: string
  ): AuditLogMetadata {
    const path = request.route?.path || request.url;
    const segments = path.split('/').filter(Boolean);

    // 마지막 경로 세그먼트를 엔티티 타입으로 추론
    const entityType = segments[segments.length - 1]?.replace(/^api$/, 'unknown') || 'unknown';

    // HTTP 메서드를 액션으로 변환
    const actionMap: Record<string, AuditAction> = {
      POST: 'create',
      PATCH: 'update',
      DELETE: 'delete',
    };
    const action = (actionMap[httpMethod] || 'create') as AuditLogMetadata['action'];

    // 엔티티 ID 경로 추론
    // - 응답에 id/uuid가 있으면 사용
    // - 없으면 params.uuid/params.id 시도
    const entityIdPath = 'response.id';

    return {
      action,
      entityType,
      entityIdPath,
    };
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
    const user: JwtUser | undefined = request.user;
    const ipAddress = this.getClientIp(request);

    // 엔티티 ID 추출
    const entityId = this.extractValue(metadata.entityIdPath, request, response);
    if (!entityId) {
      this.logger.warn(`Could not extract entityId for ${metadata.action} ${metadata.entityType}`);
      return;
    }

    // 엔티티 이름 추출
    const entityName = this.extractValue(metadata.entityNamePath, request, response);

    // 상세 정보 구성 (크기 제한 적용)
    const details: AuditLogDetails = {};
    if (previousValue) {
      details.previousValue = this.truncateForAudit(previousValue);
    }
    if (response && typeof response === 'object') {
      details.newValue = this.truncateForAudit(this.sanitizeData(response));
    }
    if (request.body && Object.keys(request.body).length > 0) {
      details.additionalInfo = {
        requestBody: this.truncateForAudit(this.sanitizeData(request.body)),
      };
    }

    // 최종 크기 검증 — JSON이 최대 크기 초과 시 요약본으로 대체
    const detailsJson = JSON.stringify(details);
    const finalDetails =
      detailsJson.length > AUDIT_DETAILS_MAX_SIZE
        ? this.createDetailsSummary(metadata, details)
        : details;

    const auditLogDto: CreateAuditLogDto = {
      // SSOT: JwtUser.userId (JWT sub → userId)
      // nil UUID 폴백: 'anonymous' 문자열은 PostgreSQL uuid 컬럼에 INSERT 실패
      userId: user?.userId || SYSTEM_USER_UUID,
      userName: user?.name || 'Anonymous User',
      // SSOT: JwtUser.roles (배열의 첫 번째 역할)
      userRole: user?.roles?.[0] || 'unknown',
      action: metadata.action,
      entityType: metadata.entityType,
      entityId,
      entityName,
      details: Object.keys(finalDetails).length > 0 ? finalDetails : undefined,
      ipAddress,
      // RBAC 스코프: JwtUser에서 사이트/팀 추출 (역할별 감사 로그 필터링용)
      userSite: user?.site,
      userTeamId: user?.teamId,
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
    } else if (source === 'user') {
      value = request.user;
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
      'accesstoken',
      'refreshtoken',
      'secret',
      'apikey',
      'privatekey',
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

  /**
   * 감사 로그용 데이터 truncate
   *
   * 배열이 AUDIT_ARRAY_MAX_LENGTH를 초과하면 처음 N개만 보존하고
   * 요약 메타데이터를 추가합니다. 중첩 객체는 1단계까지만 포함합니다.
   *
   * 예: items 배열 34개 → 처음 5개 + { _truncated: true, _totalCount: 34 }
   *
   * ✅ Circular reference protection: WeakSet으로 방문 객체 추적
   * ✅ Reference-based logging: Calibration plan items를 ID 배열로 변환
   */
  private truncateForAudit(
    data: Record<string, unknown>,
    depth = 0,
    visited = new WeakSet<object>()
  ): Record<string, unknown> {
    if (depth > 2) {
      return { _truncated: true, _reason: 'max depth exceeded' };
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // Reference-based logging: Calibration plan items → ID 배열
        if (key === 'items' && this.isCalibrationPlanItemsArray(value)) {
          result[key] = this.extractItemReferences(value);
          result[`_${key}Count`] = value.length;
          continue;
        }

        if (value.length > AUDIT_ARRAY_MAX_LENGTH) {
          // 배열 truncate: 처음 N개 항목만 보존
          const truncatedItems = value
            .slice(0, AUDIT_ARRAY_MAX_LENGTH)
            .map((item) =>
              item && typeof item === 'object' && !Array.isArray(item)
                ? this.truncateForAuditWithCircularCheck(item, depth, visited)
                : item
            );
          result[key] = truncatedItems;
          result[`_${key}Truncated`] = { totalCount: value.length, shown: AUDIT_ARRAY_MAX_LENGTH };
        } else {
          result[key] = value.map((item) =>
            item && typeof item === 'object' && !Array.isArray(item)
              ? this.truncateForAuditWithCircularCheck(item, depth, visited)
              : item
          );
        }
      } else if (value && typeof value === 'object') {
        result[key] = this.truncateForAuditWithCircularCheck(value, depth, visited);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Circular reference 체크를 포함한 truncate
   */
  private truncateForAuditWithCircularCheck(
    obj: object,
    depth: number,
    visited: WeakSet<object>
  ): Record<string, unknown> {
    // Circular reference 감지
    if (visited.has(obj)) {
      return { _circular: true };
    }

    visited.add(obj);
    return this.truncateForAudit(obj as Record<string, unknown>, depth + 1, visited);
  }

  /**
   * Calibration plan items 배열 여부 확인
   */
  private isCalibrationPlanItemsArray(arr: unknown[]): boolean {
    if (arr.length === 0) return false;
    const first = arr[0];
    return (
      first !== null &&
      first !== undefined &&
      typeof first === 'object' &&
      'id' in first &&
      'planId' in first &&
      'equipmentId' in first
    );
  }

  /**
   * Items 배열을 ID 참조 배열로 변환 (Reference-based logging)
   */
  private extractItemReferences(items: unknown[]): Array<Record<string, unknown>> {
    return items.map((item) => {
      if (!item || typeof item !== 'object') return {};

      const ref: Record<string, unknown> = {};
      const obj = item as Record<string, unknown>;

      // 핵심 식별자만 보존
      if ('id' in obj) ref.id = obj.id;
      if ('equipmentId' in obj) ref.equipmentId = obj.equipmentId;
      if ('sequenceNumber' in obj) ref.sequenceNumber = obj.sequenceNumber;

      // Equipment는 ID만 (전체 객체 제외)
      if ('equipment' in obj && obj.equipment && typeof obj.equipment === 'object') {
        const equipment = obj.equipment as Record<string, unknown>;
        ref.equipment = { id: equipment.id, name: equipment.name };
      }

      return ref;
    });
  }

  /**
   * details JSON이 최대 크기를 초과할 때 요약본 생성
   *
   * AuditLogDetails 타입의 기존 필드만 사용하여 요약본을 구성합니다.
   * newValue에는 스칼라 필드만, additionalInfo에 oversized 메타를 저장합니다.
   */
  private createDetailsSummary(
    metadata: AuditLogMetadata,
    details: AuditLogDetails
  ): AuditLogDetails {
    const summary: AuditLogDetails = {};

    // newValue: 스칼라 필드만 추출 (배열/객체 제외 → count만 기록)
    if (details.newValue && typeof details.newValue === 'object') {
      const scalarFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(details.newValue)) {
        if (value === null || typeof value !== 'object') {
          scalarFields[key] = value;
        } else if (Array.isArray(value)) {
          scalarFields[`_${key}Count`] = value.length;
        }
      }
      summary.newValue = scalarFields;
    }

    // additionalInfo: oversized 경고 + 원본 메타데이터
    summary.additionalInfo = {
      _oversized: true,
      _action: metadata.action,
      _entityType: metadata.entityType,
    };

    return summary;
  }
}
