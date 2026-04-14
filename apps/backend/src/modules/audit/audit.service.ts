import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { eq, and, gte, lte, desc, sql, or, lt, SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import {
  auditLogs,
  users,
  NewAuditLog,
  AuditLog,
  AuditLogDetails,
} from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  type AuditAction,
  type AuditEntityType,
  type CreateAuditLogDto,
  type AuditLogFilter,
  type CursorPaginatedAuditLogsResponse,
  type AuditLog as SchemasAuditLog,
} from '@equipment-management/schemas';
import {
  CACHE_TTL,
  QUERY_SAFETY_LIMITS,
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
   * 성능 영향을 최소화하기 위해 비동기로 처리합니다. 로그 저장 실패는
   * 단독 호출(tx 미지정) 시 비즈니스 로직에 영향을 주지 않습니다. 트랜잭션
   * executor가 주입된 경우에는 호출자에게 에러를 전파하여 롤백을 허용합니다.
   *
   * 캐시 무효화는 수행하지 않습니다 — 감사 로그는 append-only이므로
   * 리스트 캐시는 TTL(CACHE_TTL.MEDIUM) 만료에 위임합니다. 매 insert마다
   * deleteByPrefix 호출은 write-heavy 워크로드에서 캐시 적중률을 0에 수렴시키고
   * Redis CPU/메모리를 브루트포스로 소모합니다.
   */
  async create(dto: CreateAuditLogDto, tx?: AppDatabase): Promise<void> {
    const executor = tx ?? this.db;
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

      await executor.insert(auditLogs).values(newLog);

      this.logger.debug(
        `Audit log created: ${dto.userName}(${dto.userRole}) - ${dto.action} ${dto.entityType}(${dto.entityId})`
      );
    } catch (error) {
      // 트랜잭션 executor 주입 시: 롤백을 위해 에러 전파
      if (tx) {
        throw error;
      }
      // 단독 호출: 로그 저장 실패가 비즈니스 로직에 영향을 주지 않음
      this.logger.error(`Failed to create audit log: ${error}`, error);
    }
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
        const conditions = this.buildFilterConditions(filter);
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
   * 커서 기반 감사 로그 조회
   *
   * keyset pagination: (timestamp DESC, id DESC) 복합 커서로 O(1) seek.
   * summary는 첫 페이지(cursor 없음)에서만 포함.
   */
  async findAllCursor(
    filter: AuditLogFilter,
    cursor?: string,
    limit = 30
  ): Promise<CursorPaginatedAuditLogsResponse> {
    const cacheKey = `${CACHE_KEY_PREFIXES.AUDIT_LOGS}cursor:${JSON.stringify(filter)}:${cursor ?? 'first'}:${limit}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions = this.buildFilterConditions(filter);

        // 커서 디코딩 → keyset WHERE 조건 추가
        let validCursor = false;
        if (cursor) {
          try {
            const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as {
              t: string;
              i: string;
            };
            const cursorTimestamp = new Date(decoded.t);
            if (isNaN(cursorTimestamp.getTime()) || typeof decoded.i !== 'string') {
              throw new Error('malformed cursor fields');
            }
            // (timestamp, id) < (cursor.t, cursor.i) — row value comparison
            conditions.push(
              or(
                lt(auditLogs.timestamp, cursorTimestamp),
                and(eq(auditLogs.timestamp, cursorTimestamp), lt(auditLogs.id, decoded.i))
              )!
            );
            validCursor = true;
          } catch {
            this.logger.warn(`Invalid cursor token — treating as first page`);
          }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // 첫 페이지(커서 없거나 무효): summary 병렬 실행, 유효한 후속 페이지: items만
        const fetchLimit = limit + 1; // hasMore 감지용
        const isFirstPage = !validCursor;

        const [items, summaryResult] = await Promise.all([
          this.db
            .select()
            .from(auditLogs)
            .where(whereClause)
            .orderBy(desc(auditLogs.timestamp), desc(auditLogs.id))
            .limit(fetchLimit),
          isFirstPage
            ? this.db
                .select({
                  action: auditLogs.action,
                  count: sql<number>`count(*)`,
                })
                .from(auditLogs)
                .where(whereClause)
                .groupBy(auditLogs.action)
            : Promise.resolve(null),
        ]);

        const hasMore = items.length > limit;
        const pageItems = hasMore ? items.slice(0, limit) : items;

        // 다음 커서: 마지막 아이템의 (timestamp, id) 인코딩
        let nextCursor: string | null = null;
        if (hasMore && pageItems.length > 0) {
          const lastItem = pageItems[pageItems.length - 1];
          nextCursor = Buffer.from(
            JSON.stringify({
              t: new Date(lastItem.timestamp).toISOString(),
              i: lastItem.id,
            })
          ).toString('base64');
        }

        // 첫 페이지 summary 파생
        let summary: Record<string, number> | undefined;
        if (summaryResult) {
          summary = {};
          for (const row of summaryResult) {
            summary[row.action] = Number(row.count);
          }
        }

        return { items: pageItems as unknown as SchemasAuditLog[], nextCursor, hasMore, summary };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 필터 조건 빌드 (findAll, findAllCursor 공용)
   */
  private buildFilterConditions(filter: AuditLogFilter): SQL[] {
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
    if (filter.userSite) {
      conditions.push(eq(auditLogs.userSite, filter.userSite));
    }
    if (filter.userTeamId) {
      conditions.push(eq(auditLogs.userTeamId, filter.userTeamId));
    }

    return conditions;
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
          .orderBy(desc(auditLogs.timestamp))
          .limit(QUERY_SAFETY_LIMITS.AUDIT_LOGS_PER_ENTITY);
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
    const roleName =
      log.userRole === 'system'
        ? '시스템'
        : log.userRole === 'unknown'
          ? '알 수 없음'
          : (USER_ROLE_LABELS[log.userRole as UserRole] ?? log.userRole);
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
        // null userId: FK SET NULL nullable. entityId는 nil UUID 유지 (no FK)
        userId: null,
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

  /**
   * 인증 성공 감사 이벤트 리스너
   *
   * 로그인 성공 시:
   * ① 감사 로그 생성 (action: 'login', entityType: 'user')
   * ② users.lastLogin 갱신 (userId가 유효한 경우)
   *
   * audit.auth.failed와 대칭 구조로, 비동기 처리하여 인증 흐름에 영향을 주지 않습니다.
   */
  @OnEvent('audit.auth.success', { async: true })
  async handleAuthSuccess(payload: {
    event: string;
    userId: string;
    email: string;
    provider: string;
    timestamp: string;
  }): Promise<void> {
    try {
      // ①+② 감사 로그 생성과 users.lastLogin 갱신을 단일 트랜잭션으로 원자 실행.
      // 두 쓰기가 독립 실행될 경우 한쪽 실패 시 데이터 불일치 가능
      // (예: lastLogin만 갱신되고 login 감사 로그가 누락 → 보안 조사 신뢰도 저하).
      //
      // NOTE: updatedAt 미갱신 — lastLogin은 사용자 정보 변경이 아닌 로그인 활동 추적 전용.
      // updatedAt 갱신 시 사용자 목록의 "최근 변경" 정렬에 매 로그인이 노이즈로 반영됨.
      // NOTE: AuditService에서 users 직접 UPDATE — 순환 의존성(AuditModule↔UsersModule) 회피를 위한 의도적 설계.
      // UsersService에 캐시 도입 시 UsersService.updateLastLogin()으로 위임 필요.
      await this.db.transaction(async (tx) => {
        await this.create(
          {
            userId: payload.userId || null,
            userName: payload.email,
            userRole: 'system', // 로그인 시점에는 세션 역할 미확정
            action: 'login',
            entityType: 'user',
            entityId: payload.userId || SYSTEM_USER_UUID,
            entityName: payload.email,
            details: {
              additionalInfo: {
                event: payload.event,
                provider: payload.provider,
                email: payload.email,
              },
            } satisfies AuditLogDetails,
          },
          tx as AppDatabase
        );

        if (payload.userId) {
          await tx.update(users).set({ lastLogin: new Date() }).where(eq(users.id, payload.userId));
        }
      });

      this.logger.log(`[AUTH] Login success: ${payload.email} (provider: ${payload.provider})`);
    } catch (error) {
      // 트랜잭션 실패 → 감사 로그 + lastLogin 모두 롤백됨. 로그인 흐름에는 영향 없음.
      this.logger.error(`Failed to log auth success event: ${error}`);
    }
  }
}
