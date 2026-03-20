import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { eq, and, gte, lte, desc, sql, SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { auditLogs, NewAuditLog, AuditLog, AuditLogDetails } from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  type AuditAction,
  type AuditEntityType,
  type CreateAuditLogDto,
  type AuditLogFilter,
} from '@equipment-management/schemas';
import {
  CACHE_TTL,
  USER_ROLE_LABELS,
  type UserRole,
  type ResolvedDataScope,
} from '@equipment-management/shared-constants';
import { SYSTEM_USER_UUID } from '../../database/utils/uuid-constants';
import type { PaginationMeta } from '../../common/types/api-response';

export type { AuditLogFilter, PaginationMeta };

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * 액션별 감사 로그 건수 요약
 */
export interface AuditActionCounts {
  [action: string]: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE') private db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 감사 로그 생성 (비동기)
   *
   * 성능 영향을 최소화하기 위해 비동기로 처리합니다.
   * 로그 저장 실패가 비즈니스 로직에 영향을 주지 않습니다.
   */
  async create(dto: CreateAuditLogDto): Promise<void> {
    try {
      // NewAuditLog 타입 호환성 문제 우회를 위해 객체를 직접 전달
      const newLog = {
        userId: dto.userId,
        userName: dto.userName,
        userRole: dto.userRole,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        entityName: dto.entityName,
        details: dto.details,
        ipAddress: dto.ipAddress,
        userSite: dto.userSite,
        userTeamId: dto.userTeamId,
        timestamp: new Date(),
        createdAt: new Date(),
      } as NewAuditLog;

      await this.db.insert(auditLogs).values(newLog);

      // 캐시 무효화 (append-only이므로 리스트 캐시만 무효화)
      this.invalidateListCaches(dto.entityType, dto.entityId, dto.userId);

      this.logger.debug(
        `Audit log created: ${dto.userName}(${dto.userRole}) - ${dto.action} ${dto.entityType}(${dto.entityId})`
      );
    } catch (error) {
      // 로그 저장 실패는 비즈니스 로직에 영향을 주지 않음
      this.logger.error(`Failed to create audit log: ${error}`, error);
    }
  }

  /**
   * 리스트 캐시 무효화
   * 새 로그 생성 시 관련 캐시를 삭제합니다.
   */
  private invalidateListCaches(entityType: string, entityId: string, userId: string): void {
    // 전체 리스트 캐시 무효화 (필터 조합이 다양하므로 패턴 매칭)
    this.cacheService.deleteByPattern('^audit-logs:list:');

    // 특정 엔티티 캐시 무효화 (scope suffix 포함 모든 variant 삭제)
    this.cacheService.deleteByPattern(`^audit-logs:entity:${entityType}:${entityId}:`);

    // 특정 사용자 캐시 무효화 (scope suffix 포함 모든 variant 삭제)
    this.cacheService.deleteByPattern(`^audit-logs:user:${userId}:`);
  }

  /**
   * 감사 로그 조회 (페이지네이션 지원)
   */
  async findAll(
    filter: AuditLogFilter,
    pagination: PaginationOptions
  ): Promise<{ items: AuditLog[]; meta: PaginationMeta; summary: AuditActionCounts }> {
    // 캐시 키 생성 (필터와 페이지네이션 포함)
    const cacheKey = `${CACHE_KEY_PREFIXES.AUDIT_LOGS}list:${JSON.stringify(filter)}:${pagination.page}:${pagination.limit}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions: SQL[] = [];

        if (filter.userId) {
          conditions.push(eq(auditLogs.userId, filter.userId));
        }

        if (filter.entityType) {
          conditions.push(eq(auditLogs.entityType, filter.entityType));
        }

        if (filter.entityId) {
          conditions.push(eq(auditLogs.entityId, filter.entityId));
        }

        if (filter.action) {
          conditions.push(eq(auditLogs.action, filter.action));
        }

        if (filter.startDate) {
          conditions.push(gte(auditLogs.timestamp, new Date(filter.startDate)));
        }

        if (filter.endDate) {
          conditions.push(lte(auditLogs.timestamp, new Date(filter.endDate)));
        }

        // RBAC 스코프 필터 (서버 강제 — 클라이언트 우회 불가)
        if (filter.userSite) {
          conditions.push(eq(auditLogs.userSite, filter.userSite));
        }
        if (filter.userTeamId) {
          conditions.push(eq(auditLogs.userTeamId, filter.userTeamId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // GROUP BY action + 페이지네이션 아이템을 병렬 실행
        // COUNT(*) 별도 쿼리 제거 — GROUP BY 합산으로 totalItems 파생
        const [actionCountsResult, items] = await Promise.all([
          this.db
            .select({
              action: auditLogs.action,
              count: sql<number>`count(*)`,
            })
            .from(auditLogs)
            .where(whereClause)
            .groupBy(auditLogs.action),
          this.db
            .select()
            .from(auditLogs)
            .where(whereClause)
            .orderBy(desc(auditLogs.timestamp))
            .limit(pagination.limit)
            .offset((pagination.page - 1) * pagination.limit),
        ]);

        // GROUP BY 결과에서 totalItems + summary 동시 파생 (단일 스캔)
        const summary: AuditActionCounts = {};
        let totalItems = 0;
        for (const row of actionCountsResult) {
          const count = Number(row.count);
          summary[row.action] = count;
          totalItems += count;
        }

        return {
          items,
          meta: {
            totalItems,
            itemCount: items.length,
            itemsPerPage: pagination.limit,
            totalPages: Math.ceil(totalItems / pagination.limit),
            currentPage: pagination.page,
          },
          summary,
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 감사 로그 단건 조회 (ID로 조회)
   *
   * scope가 있으면 userSite/userTeamId WHERE 조건 추가 — 타 사이트/팀 접근 차단
   */
  async findOne(id: string, scope?: ResolvedDataScope): Promise<AuditLog> {
    const scopeKey = scope ? `${scope.type}:${scope.site ?? ''}:${scope.teamId ?? ''}` : 'all';
    const cacheKey = `${CACHE_KEY_PREFIXES.AUDIT_LOGS}detail:${id}:${scopeKey}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions: SQL[] = [eq(auditLogs.id, id)];
        if (scope?.type === 'site' && scope.site) {
          conditions.push(eq(auditLogs.userSite, scope.site));
        }
        if (scope?.type === 'team' && scope.teamId) {
          conditions.push(eq(auditLogs.userTeamId, scope.teamId));
        }

        const [log] = await this.db
          .select()
          .from(auditLogs)
          .where(and(...conditions))
          .limit(1);

        if (!log) {
          throw new NotFoundException(`Audit log with ID ${id} not found`);
        }

        return log;
      },
      CACHE_TTL.VERY_LONG
    );
  }

  /**
   * 특정 엔티티의 감사 로그 조회
   *
   * scope가 있으면 userSite/userTeamId WHERE 조건 추가 — 타 사이트/팀 접근 차단
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    scope?: ResolvedDataScope
  ): Promise<AuditLog[]> {
    const scopeKey = scope ? `${scope.type}:${scope.site ?? ''}:${scope.teamId ?? ''}` : 'all';
    const cacheKey = `${CACHE_KEY_PREFIXES.AUDIT_LOGS}entity:${entityType}:${entityId}:${scopeKey}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions: SQL[] = [
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId),
        ];
        if (scope?.type === 'site' && scope.site) {
          conditions.push(eq(auditLogs.userSite, scope.site));
        }
        if (scope?.type === 'team' && scope.teamId) {
          conditions.push(eq(auditLogs.userTeamId, scope.teamId));
        }

        return this.db
          .select()
          .from(auditLogs)
          .where(and(...conditions))
          .orderBy(desc(auditLogs.timestamp));
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 특정 사용자의 감사 로그 조회
   *
   * scope가 있으면 userSite/userTeamId WHERE 조건 추가 — 타 사이트/팀 접근 차단
   */
  async findByUser(userId: string, limit = 100, scope?: ResolvedDataScope): Promise<AuditLog[]> {
    const scopeKey = scope ? `${scope.type}:${scope.site ?? ''}:${scope.teamId ?? ''}` : 'all';
    const cacheKey = `${CACHE_KEY_PREFIXES.AUDIT_LOGS}user:${userId}:${scopeKey}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions: SQL[] = [eq(auditLogs.userId, userId)];
        if (scope?.type === 'site' && scope.site) {
          conditions.push(eq(auditLogs.userSite, scope.site));
        }
        if (scope?.type === 'team' && scope.teamId) {
          conditions.push(eq(auditLogs.userTeamId, scope.teamId));
        }

        return this.db
          .select()
          .from(auditLogs)
          .where(and(...conditions))
          .orderBy(desc(auditLogs.timestamp))
          .limit(limit);
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 포맷된 로그 메시지 생성
   *
   * 예: "2025년 5월 09일 09:30, 홍석환(기술책임자)이 '네트워크 분석기(SUW-E0326)' 신규 등록 요청을 '승인'함."
   *
   * SSOT 사용: AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPE_LABELS, USER_ROLE_LABELS
   */
  formatLogMessage(log: AuditLog): string {
    const date = new Date(log.timestamp);
    const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate().toString().padStart(2, '0')}일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    // SSOT 레이블 사용
    const roleName = USER_ROLE_LABELS[log.userRole as UserRole] || log.userRole;
    const actionName = AUDIT_ACTION_LABELS[log.action as AuditAction] || log.action;
    const entityTypeName =
      AUDIT_ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] || log.entityType;

    if (log.entityName) {
      return `${formattedDate}, ${log.userName}(${roleName})이 '${log.entityName}' ${entityTypeName}을(를) '${actionName}'함.`;
    }

    return `${formattedDate}, ${log.userName}(${roleName})이 ${entityTypeName}(${log.entityId})을(를) '${actionName}'함.`;
  }

  /**
   * 인증 실패 감사 이벤트 리스너
   *
   * 로그인 실패, 리프레시 토큰 거부 등 보안 관련 이벤트를 감사 로그에 기록합니다.
   * 비동기로 처리하여 인증 흐름에 영향을 주지 않습니다.
   */
  @OnEvent('audit.auth.failed', { async: true })
  async handleAuthFailed(payload: {
    event: string;
    email?: string;
    reason: string;
    timestamp: string;
    sessionAge?: number;
  }): Promise<void> {
    try {
      await this.create({
        // nil UUID: PostgreSQL uuid 컬럼 호환 — 'system'/'anonymous' 문자열은 INSERT 실패
        userId: SYSTEM_USER_UUID,
        userName: payload.email ?? 'unknown',
        userRole: 'system',
        action: 'login', // 로그인 시도 실패 — 기존 enum 재사용
        entityType: 'user', // 인증은 사용자 엔티티 — 기존 enum 재사용
        entityId: SYSTEM_USER_UUID, // uuid 컬럼 호환; 실제 이메일은 entityName으로
        entityName: payload.email ?? 'unknown',
        details: {
          // AuditLogDetails.additionalInfo: 커스텀 필드는 이 아래에 위치해야 함
          additionalInfo: {
            reason: payload.reason,
            event: payload.event, // 원본 이벤트명 보존 (login_failed / refresh_denied)
            email: payload.email,
            ...(payload.sessionAge !== undefined && { sessionAge: payload.sessionAge }),
          },
        } satisfies AuditLogDetails,
      });

      this.logger.warn(
        `[SECURITY] Auth failed: ${payload.event} - ${payload.reason} (email: ${payload.email ?? 'unknown'})`
      );
    } catch (error) {
      this.logger.error(`Failed to log auth failure event: ${error}`);
    }
  }
}
