import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';
import { AuditService } from '../../modules/audit/audit.service';
import type { AuditAction, CreateAuditLogDto } from '@equipment-management/schemas';
import { AuditLogDetails } from '@equipment-management/db/schema';
import type { AuthenticatedRequest, JwtUser } from '../../types/auth';

/** 감사 로그 details JSON 최대 크기 (바이트) */
const AUDIT_DETAILS_MAX_SIZE = 32_768; // 32KB
/** 배열 truncate 임계값 */
const AUDIT_ARRAY_MAX_LENGTH = 5;
/** UUID v4 형식 검증 (entityId NOT NULL 제약 충족 여부 사전 판정) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  private readonly validInternalApiKeys: string[];

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService
  ) {
    const currentKey = this.configService.get<string>('INTERNAL_API_KEY') || '';
    const previousKey = this.configService.get<string>('INTERNAL_API_KEY_PREVIOUS') || '';
    this.validInternalApiKeys = [currentKey, previousKey].filter(Boolean);
  }

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
    // 인증된 사용자가 없으면 패스 (로그인/로그아웃/내부 서비스 호출 제외)
    if (!user && !['login', 'logout'].includes(auditMetadata.action)) {
      // 내부 서비스 호출: API 키 값까지 검증 (헤더 존재만으로 신뢰하지 않음)
      const apiKey = request.headers?.['x-internal-api-key'] as string | undefined;
      const isInternalService = !!apiKey && this.validInternalApiKeys.includes(apiKey);
      if (!isInternalService) {
        return next.handle();
      }
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
        error: (err: unknown) => {
          // 권한/스코프 거부(403)만 별도 감사 — cross-site probing 추적 목적.
          // 5xx, 400, 404 등은 운영 노이즈가 크고 감사 가치가 낮아 제외.
          // 로깅 실패는 swallow → 원본 에러 전파에 영향 없음.
          if (!this.isForbiddenError(err)) return;
          this.logAccessDeniedAsync(metadata, request, err).catch((logError) => {
            this.logger.error(
              `Access-denied audit log failed: ${logError instanceof Error ? logError.message : String(logError)}`,
              logError instanceof Error ? logError.stack : undefined
            );
          });
        },
      })
    );
  }

  /** HttpException 중 status === 403 (Forbidden) 인지 판정 */
  private isForbiddenError(err: unknown): err is HttpException {
    return err instanceof HttpException && err.getStatus() === HttpStatus.FORBIDDEN;
  }

  /**
   * 권한 거부 감사 로그 기록 (cross-site probing 분석용)
   *
   * - response 가 없으므로 entityId는 params(uuid)에서만 추출 시도
   * - 추출 실패 시: audit_logs.entity_id NOT NULL 제약을 만족할 수 없으므로
   *   DB 기록 대신 보안 logger.warn 으로 fallback (전체 컨텍스트 포함)
   * - userId/IP/site/team + sanitized 요청 본문을 모두 보존하여 forensic 분석 가능
   */
  private async logAccessDeniedAsync(
    metadata: AuditLogMetadata,
    request: AuthenticatedRequest,
    err: HttpException
  ): Promise<void> {
    const user: JwtUser | undefined = request.user;
    const ipAddress = this.getClientIp(request);

    const entityId = this.extractEntityIdFromParams(request);
    const errorResponse = err.getResponse();
    const errorMessage =
      typeof errorResponse === 'string'
        ? errorResponse
        : ((errorResponse as { message?: string })?.message ?? err.message);

    // entityId 없으면 DB 기록 불가 (NOT NULL 제약). 보안 로그로만 남김.
    if (!entityId) {
      this.logger.warn(
        `[AccessDenied] ${metadata.action}/${metadata.entityType} userId=${user?.userId ?? 'anon'} ` +
          `site=${user?.site ?? '-'} team=${user?.teamId ?? '-'} ip=${ipAddress ?? '-'} ` +
          `path=${request.method} ${request.originalUrl ?? request.url} reason=${errorMessage}`
      );
      return;
    }

    const details: AuditLogDetails = {
      additionalInfo: {
        deniedAction: metadata.action,
        reason: errorMessage,
        path: `${request.method} ${request.originalUrl ?? request.url}`,
      },
    };
    if (request.body && Object.keys(request.body).length > 0) {
      (details.additionalInfo as Record<string, unknown>).requestBody = this.truncateForAudit(
        this.sanitizeData(request.body)
      );
    }
    if (request.query && Object.keys(request.query).length > 0) {
      (details.additionalInfo as Record<string, unknown>).query = this.sanitizeData(request.query);
    }

    const auditLogDto: CreateAuditLogDto = {
      userId: user?.userId ?? null,
      userName: user?.name || 'Anonymous User',
      userRole: user?.roles?.[0] || 'unknown',
      action: 'access_denied',
      entityType: metadata.entityType,
      entityId,
      entityName: undefined,
      details,
      ipAddress,
      userSite: user?.site,
      userTeamId: user?.teamId,
    };

    await this.auditService.create(auditLogDto);
  }

  /**
   * params 에서 UUID 형식 식별자만 추출 (uuid > id 우선)
   * audit_logs.entityId 가 uuid NOT NULL 이므로 형식 검증 필수
   */
  private extractEntityIdFromParams(request: AuthenticatedRequest): string | undefined {
    const params = (request.params ?? {}) as Record<string, string | undefined>;
    const candidates = [params.uuid, params.id, params.entityId];
    return candidates.find((c): c is string => typeof c === 'string' && UUID_REGEX.test(c));
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
      // null 폴백: audit_logs.userId는 FK SET NULL nullable. userName으로 행위자 식별
      userId: user?.userId ?? null,
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
