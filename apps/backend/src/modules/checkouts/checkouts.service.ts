import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
  ConflictException,
  forwardRef,
} from '@nestjs/common';
import { CheckoutErrorCode } from './checkout-error-codes';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { CheckoutQueryDto } from './dto/checkout-query.dto';
import { ApproveCheckoutDto } from './dto/approve-checkout.dto';
import { RejectCheckoutDto } from './dto/reject-checkout.dto';
import { ReturnCheckoutDto } from './dto/return-checkout.dto';
import { ApproveReturnDto } from './dto/approve-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';
import { CreateConditionCheckDto } from './dto/create-condition-check.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import {
  CheckoutStatus,
  EQUIPMENT_STATUS_LABELS,
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
  ConditionCheckStepValues as CCSVal,
  type ConditionCheckStep,
  type CheckoutPurpose,
  canPerformAction,
  getNextStep,
  getTransitionsFor,
  CHECKOUT_TRANSITIONS,
  type CheckoutAction,
  type NextActor,
  type NextStepDescriptor,
  type AuditAction,
  type AuditEntityType,
  type AuditLogUserRole,
} from '@equipment-management/schemas';
import {
  CACHE_TTL,
  CHECKOUT_DATA_SCOPE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  QUERY_SAFETY_LIMITS,
  getAllowedStatusesForPurpose,
  Permission,
} from '@equipment-management/shared-constants';
import { eq, and, gte, lte, or, desc, asc, sql, SQL, isNull, inArray } from 'drizzle-orm';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { conditionChecks } from '@equipment-management/db/schema/condition-checks';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { createScopeAwareCacheKeyBuilder } from '../../common/cache/scope-aware-cache-key';
import { EquipmentService } from '../equipment/equipment.service';
import { TeamsService } from '../teams/teams.service';
import { EquipmentImportsService } from '../equipment-imports/equipment-imports.service';
import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { buildCheckoutSiteCondition, buildCheckoutTeamCondition } from './checkout-scope.util';
import type { AuthenticatedRequest } from '../../types/auth';
import type { PaginationMeta } from '../../common/types/api-response';
// Drizzle에서 자동 추론되는 타입 사용
export type Checkout = typeof checkouts.$inferSelect;

/**
 * ✅ Phase 2: Server-Driven UI
 * 사용자 권한 + 상태 기반 가능한 액션
 */
export interface CheckoutAvailableActions {
  canApprove: boolean;
  canReject: boolean;
  canStart: boolean;
  canReturn: boolean;
  canApproveReturn: boolean;
  canRejectReturn: boolean;
  canCancel: boolean;
  canSubmitConditionCheck: boolean;
}

/**
 * ✅ Phase 2: Server-Driven UI
 * 메타데이터(availableActions + nextStep)를 포함한 Checkout
 */
export interface CheckoutWithMeta extends Checkout {
  meta: {
    availableActions: CheckoutAvailableActions;
    nextStep: NextStepDescriptor;
  };
}

/**
 * 쿼리 조건 빌더 인터페이스
 */
interface QueryConditions {
  whereConditions: SQL<unknown>[];
  orderBy: SQL<unknown>[];
}

/**
 * 장비 정보 인터페이스 (반출 목록용)
 */
interface CheckoutEquipment {
  id: string;
  name: string | null;
  managementNumber: string | null;
}

/**
 * 사용자 정보 인터페이스 (반출 목록용)
 */
interface CheckoutUser {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * 반출 항목 (관계 데이터 포함)
 */
interface CheckoutWithRelations extends Checkout {
  equipment: CheckoutEquipment[];
  user: CheckoutUser | null;
}

/**
 * 반출 목록 응답 인터페이스
 */
export interface CheckoutListResponse {
  items: CheckoutWithRelations[];
  meta: PaginationMeta;
  summary?: {
    total: number;
    pending: number;
    approved: number;
    overdue: number;
    returnedToday: number;
  };
}

@Injectable()
export class CheckoutsService extends VersionedBaseService {
  private readonly logger = new Logger(CheckoutsService.name);
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.CHECKOUTS;

  // 인덱스가 있는 필드 목록 (정렬 최적화용)
  private readonly INDEXED_FIELDS = [
    'status',
    'requesterId',
    'approverId',
    'checkoutDate',
    'expectedReturnDate',
    'createdAt',
  ] as const;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly equipmentService: EquipmentService,
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => EquipmentImportsService))
    private readonly rentalImportsService: EquipmentImportsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService
  ) {
    super(); // ✅ Required for extending VersionedBaseService
  }

  // ============================================================================
  // FSM 헬퍼
  // ============================================================================

  private static readonly FSM_TO_AUDIT_ACTION: Record<CheckoutAction, AuditAction> = {
    approve: 'approve',
    reject: 'reject',
    cancel: 'cancel',
    start: 'checkout',
    lender_check: 'checkout',
    borrower_receive: 'checkout',
    mark_in_use: 'checkout',
    borrower_return: 'return',
    lender_receive: 'return',
    submit_return: 'return',
    approve_return: 'approve',
    reject_return: 'reject',
  };

  private assertFsmAction(
    checkout: Pick<Checkout, 'status' | 'purpose'>,
    action: CheckoutAction,
    userPermissions: readonly string[]
  ): void {
    const fsmInput = {
      status: checkout.status,
      purpose: checkout.purpose as CheckoutPurpose,
    };
    const check = canPerformAction(fsmInput, action, userPermissions);
    if (check.ok) return;
    if (check.reason === 'invalid_transition') {
      throw new BadRequestException({
        code: CheckoutErrorCode.INVALID_TRANSITION,
        message: `Action "${action}" not allowed from status "${checkout.status}" (purpose: ${checkout.purpose})`,
      });
    }
    throw new ForbiddenException({
      code: CheckoutErrorCode.FORBIDDEN,
      message: `Missing required permission for action "${action}"`,
    });
  }

  private resolveAuditSuffix(
    checkout: Pick<Checkout, 'status' | 'purpose'>,
    action: CheckoutAction
  ): string {
    const purpose = checkout.purpose as CheckoutPurpose;
    const rule = CHECKOUT_TRANSITIONS.find(
      (t) =>
        t.from === checkout.status &&
        t.action === action &&
        (t.purposes.length === 0 || t.purposes.includes(purpose))
    );
    return rule?.auditEventSuffix ?? 'unknown';
  }

  private resolveNextActor(purpose: Checkout['purpose'], nextStatus: CheckoutStatus): NextActor {
    const next = getTransitionsFor(nextStatus, purpose as CheckoutPurpose);
    return next[0]?.nextActor ?? 'none';
  }

  private buildNextStep(
    checkout: Checkout,
    userPermissions: readonly string[]
  ): NextStepDescriptor {
    return getNextStep(
      {
        status: checkout.status,
        purpose: checkout.purpose as CheckoutPurpose,
        dueAt: checkout.expectedReturnDate?.toISOString() ?? null,
      },
      userPermissions
    );
  }

  private async writeTransitionAudit(
    checkout: Pick<Checkout, 'status' | 'purpose' | 'reason'>,
    action: CheckoutAction,
    entityId: string,
    nextStatus: CheckoutStatus,
    req: AuthenticatedRequest
  ): Promise<void> {
    try {
      await this.auditService.create({
        userId: req.user?.userId ?? null,
        userName: req.user?.name ?? 'system',
        userRole: (req.user?.roles?.[0] ?? 'system') as AuditLogUserRole,
        action: CheckoutsService.FSM_TO_AUDIT_ACTION[action],
        entityType: 'checkout' as AuditEntityType,
        entityId,
        entityName: checkout.reason ?? undefined,
        details: {
          additionalInfo: {
            fsmEvent: `checkout.${this.resolveAuditSuffix(checkout, action)}`,
            from: checkout.status,
            to: nextStatus,
            purpose: checkout.purpose,
          },
        },
        userSite: req.user?.site,
        userTeamId: req.user?.teamId,
      });
    } catch (err) {
      this.logger.error(
        `감사 로그 기록 실패 — action: ${action}, entityId: ${entityId}, error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined
      );
    }
  }

  /**
   * UUID 형식 검증 헬퍼 메서드
   * ✅ 재사용 가능한 유틸리티 함수로 분리 (Rentals와 동일한 패턴)
   */
  private validateUuid(uuid: string, fieldName: string): void {
    if (!uuid || typeof uuid !== 'string') {
      throw new BadRequestException({
        code: CheckoutErrorCode.INVALID_UUID,
        message: `${fieldName} is required and must be a string`,
      });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      throw new BadRequestException({
        code: CheckoutErrorCode.INVALID_UUID,
        message: `Invalid ${fieldName} UUID format`,
      });
    }
  }

  /**
   * 상태 전환 헬퍼 (반복 코드 제거)
   *
   * ✅ VersionedBaseService.updateWithVersion() 사용 (DRY)
   * ✅ Type-safe: CheckoutStatus enum 사용
   * ✅ Consistent: 모든 상태 변경이 optimistic locking 사용 보장
   */
  protected async updateCheckoutStatus(
    uuid: string,
    currentCheckout: Checkout,
    newStatus: CheckoutStatus,
    additionalData?: Partial<Checkout>
  ): Promise<Checkout> {
    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
    return await this.updateWithVersion<Checkout>(
      checkouts,
      uuid,
      currentCheckout.version,
      {
        status: newStatus,
        ...additionalData,
      },
      '반출'
    );
  }

  /**
   * VersionedBaseService 훅 override — 409 발생 시 detail 캐시 자동 무효화.
   * 모든 updateWithVersion 호출 경로(update/approve/reject/cancel/return/condition-check 등)
   * 가 단일 정책을 공유 → 메서드별 try/catch boilerplate 제거.
   */
  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', { uuid: id }));
  }

  private readonly buildCacheKey = createScopeAwareCacheKeyBuilder(
    CACHE_KEY_PREFIXES.CHECKOUTS,
    new Set(['list', 'summary'])
  );

  /**
   * 반출에서 영향받는 팀 ID 추출
   * @param checkout 반출 데이터
   * @returns 영향받는 팀 ID 배열
   */
  private async getAffectedTeamIds(checkout: Checkout): Promise<string[]> {
    const teamIds: string[] = [];

    // 신청자의 팀 ID
    const [requesterUser] = await this.db
      .select({ teamId: schema.users.teamId })
      .from(schema.users)
      .where(eq(schema.users.id, checkout.requesterId))
      .limit(1);

    if (requesterUser?.teamId) {
      teamIds.push(requesterUser.teamId);
    }

    // 대여 시 빌려주는 팀 ID
    if (checkout.lenderTeamId) {
      teamIds.push(checkout.lenderTeamId);
    }

    return [...new Set(teamIds)]; // 중복 제거
  }

  /**
   * 캐시 무효화 헬퍼 메서드
   *
   * 설계: 스코프(global vs team)는 `buildCacheKey` 에 의해 캐시 키의 **구조적
   * segment**로 인코딩되어 있다 (`:t:<teamId>:` 또는 `:g:`). 따라서
   * 무효화를 `deleteByPrefix` 만으로 수행 가능 — 정규식 매칭 불필요.
   *
   * @param teamIds 영향받는 팀 ID 배열 (지정하지 않으면 전체 무효화)
   * @param checkoutId 변경된 checkout의 ID (detail 캐시 무효화용)
   */
  private async invalidateCache(teamIds?: string[], checkoutId?: string): Promise<void> {
    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS);

    if (checkoutId) {
      this.cacheService.delete(this.buildCacheKey('detail', { uuid: checkoutId }));
    }

    if (!teamIds || teamIds.length === 0) {
      this.cacheService.deleteByPrefix(this.CACHE_PREFIX);
      return;
    }

    // 영향받는 팀 스코프만 정밀 무효화
    for (const teamId of teamIds) {
      this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:t:${teamId}:`);
      this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}summary:t:${teamId}:`);
    }

    // 글로벌 스코프 (팀 필터 없는) 캐시도 무효화
    this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:g:`);
    this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}summary:g:`);

    // destinations 캐시 무효화
    this.cacheService.delete(`${this.CACHE_PREFIX}.destinations`);
  }

  /**
   * 쿼리 조건 빌더
   */
  private buildQueryConditions(queryParams: CheckoutQueryDto): QueryConditions {
    const {
      equipmentId,
      requesterId,
      approverId,
      teamId,
      site,
      direction,
      purpose,
      statuses,
      destination,
      checkoutFrom,
      checkoutTo,
      returnFrom,
      returnTo,
      search,
      sort,
    } = queryParams;

    const whereConditions: SQL<unknown>[] = [];

    // 인덱스를 활용할 수 있는 조건을 먼저 추가
    if (requesterId) {
      whereConditions.push(eq(checkouts.requesterId, requesterId));
    }

    if (approverId) {
      whereConditions.push(eq(checkouts.approverId, approverId));
    }

    if (purpose) {
      whereConditions.push(eq(checkouts.purpose, purpose));
    }

    // 사이트 필터 — SSOT helper (checkout-scope.util.ts) 사용. 인라인 SQL 금지.
    if (site) {
      whereConditions.push(buildCheckoutSiteCondition(this.db, site, direction));
    }

    if (destination) {
      whereConditions.push(eq(checkouts.destination, destination));
    }

    // 상태 필터링
    if (statuses) {
      const statusArray = statuses.split(',').map((s) => s.trim());
      if (statusArray.length === 1) {
        whereConditions.push(eq(checkouts.status, statusArray[0] as CheckoutStatus));
      } else {
        const statusConditions = statusArray.map((status) =>
          eq(checkouts.status, status as CheckoutStatus)
        );
        whereConditions.push(or(...statusConditions)!);
      }
    }

    // 날짜 범위 필터링
    if (checkoutFrom) {
      whereConditions.push(
        or(gte(checkouts.checkoutDate, new Date(checkoutFrom)), isNull(checkouts.checkoutDate))!
      );
    }

    if (checkoutTo) {
      whereConditions.push(
        or(lte(checkouts.checkoutDate, new Date(checkoutTo)), isNull(checkouts.checkoutDate))!
      );
    }

    if (returnFrom) {
      whereConditions.push(gte(checkouts.expectedReturnDate, new Date(returnFrom)));
    }

    if (returnTo) {
      whereConditions.push(lte(checkouts.expectedReturnDate, new Date(returnTo)));
    }

    // 검색어 조건
    if (search) {
      const pattern = likeContains(search);
      whereConditions.push(
        or(
          safeIlike(checkouts.destination, pattern),
          safeIlike(checkouts.reason, pattern),
          safeIlike(checkouts.address, pattern)
        )!
      );
    }

    // 장비 ID로 필터링 (checkoutItems 조인 필요)
    if (equipmentId) {
      // 서브쿼리로 처리
      const subquery = this.db
        .select({ checkoutId: checkoutItems.checkoutId })
        .from(checkoutItems)
        .where(eq(checkoutItems.equipmentId, equipmentId));

      whereConditions.push(sql`${checkouts.id} IN (${subquery})`);
    }

    // 팀 ID 필터 — SSOT helper (checkout-scope.util.ts) 사용. 인라인 SQL 금지.
    if (teamId) {
      whereConditions.push(buildCheckoutTeamCondition(this.db, teamId, direction));
    }

    // 정렬 설정
    const orderBy: SQL<unknown>[] = [];
    if (sort) {
      const [field, sortDirection] = sort.split('.');
      if (field && this.INDEXED_FIELDS.includes(field as (typeof this.INDEXED_FIELDS)[number])) {
        switch (field) {
          case 'status':
            orderBy.push(sortDirection === 'asc' ? asc(checkouts.status) : desc(checkouts.status));
            break;
          case 'requesterId':
            orderBy.push(
              sortDirection === 'asc' ? asc(checkouts.requesterId) : desc(checkouts.requesterId)
            );
            break;
          case 'checkoutDate':
            orderBy.push(
              sortDirection === 'asc' ? asc(checkouts.checkoutDate) : desc(checkouts.checkoutDate)
            );
            break;
          case 'expectedReturnDate':
            orderBy.push(
              sortDirection === 'asc'
                ? asc(checkouts.expectedReturnDate)
                : desc(checkouts.expectedReturnDate)
            );
            break;
          case 'createdAt':
          default:
            orderBy.push(
              sortDirection === 'asc' ? asc(checkouts.createdAt) : desc(checkouts.createdAt)
            );
            break;
        }
      } else {
        orderBy.push(desc(checkouts.createdAt));
      }
    } else {
      orderBy.push(desc(checkouts.createdAt));
    }

    return { whereConditions, orderBy };
  }

  /**
   * 반출 목록 조회
   * @param queryParams 쿼리 파라미터
   * @param includeSummary 요약 정보 포함 여부 (기본값: false)
   */
  async findAll(
    queryParams: CheckoutQueryDto,
    includeSummary = false
  ): Promise<CheckoutListResponse> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = queryParams;

    const cacheKey = this.buildCacheKey('list', {
      equipmentId: queryParams.equipmentId,
      requesterId: queryParams.requesterId,
      approverId: queryParams.approverId,
      teamId: queryParams.teamId,
      site: queryParams.site,
      purpose: queryParams.purpose,
      statuses: queryParams.statuses,
      destination: queryParams.destination,
      checkoutFrom: queryParams.checkoutFrom,
      checkoutTo: queryParams.checkoutTo,
      returnFrom: queryParams.returnFrom,
      returnTo: queryParams.returnTo,
      search: queryParams.search,
      sort: queryParams.sort,
      page,
      pageSize,
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const { whereConditions, orderBy } = this.buildQueryConditions(queryParams);

          const numericPageSize = Number(pageSize);
          const numericOffset = Number((page - 1) * pageSize);

          // ✅ CTE 최적화: COUNT(*) OVER() + ID 페치를 단일 쿼리로 합침 (3쿼리 → 2쿼리)
          const idsWithCount = await this.db
            .select({
              id: checkouts.id,
              totalCount: sql<number>`COUNT(*) OVER()`,
            })
            .from(checkouts)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(...(orderBy.length > 0 ? orderBy : [desc(checkouts.createdAt)]))
            .limit(numericPageSize)
            .offset(numericOffset);

          // COUNT(*) OVER()는 결과가 0건이면 totalCount를 알 수 없음
          // offset 초과 시(예: 3페이지 요청인데 데이터 1페이지분만 존재) 별도 count 쿼리 폴백
          let totalItems: number;
          if (idsWithCount.length > 0) {
            totalItems = Number(idsWithCount[0].totalCount);
          } else {
            const [countRow] = await this.db
              .select({ count: sql<number>`COUNT(*)` })
              .from(checkouts)
              .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
            totalItems = Number(countRow?.count || 0);
          }
          const totalPages = Math.ceil(totalItems / numericPageSize);

          if (idsWithCount.length === 0) {
            return {
              items: [],
              meta: {
                totalItems,
                itemCount: 0,
                itemsPerPage: numericPageSize,
                totalPages,
                currentPage: Number(page),
              },
            };
          }

          // 관계 데이터 페치 (Drizzle relational API로 효율적 JOIN)
          const itemsWithRelations = await this.db.query.checkouts.findMany({
            where: (checkouts, { inArray }) =>
              inArray(
                checkouts.id,
                idsWithCount.map((c) => c.id)
              ),
            with: {
              items: {
                with: {
                  equipment: {
                    columns: {
                      id: true,
                      name: true,
                      managementNumber: true,
                    },
                  },
                },
              },
              requester: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
                with: {
                  team: true,
                },
              },
            },
          });

          // 정렬 순서 유지하며 응답 형식으로 변환
          const sortedItems = idsWithCount
            .map((idObj) => {
              const item = itemsWithRelations.find((c) => c.id === idObj.id);
              if (!item) return null;

              return {
                ...item,
                equipment: item.items.map((ci) => ({
                  id: ci.equipment.id,
                  name: ci.equipment.name,
                  managementNumber: ci.equipment.managementNumber,
                })),
                user: item.requester || null,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          const response: CheckoutListResponse = {
            items: sortedItems,
            meta: {
              totalItems,
              itemCount: sortedItems.length,
              itemsPerPage: numericPageSize,
              totalPages,
              currentPage: Number(page),
            },
          };

          if (includeSummary) {
            response.summary = await this.getSummary(queryParams.teamId);
          }

          return response;
        } catch (error) {
          this.logger.error(
            `반출 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 고유 반출지(destination) 목록 조회
   */
  /**
   * 반출지 목록 조회 (필터용)
   * ✅ 캐시: 24시간 TTL (불변 데이터)
   */
  async getDistinctDestinations(): Promise<string[]> {
    const cacheKey = `${this.CACHE_PREFIX}.destinations`;

    const cached = await this.cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const results = await this.db
      .selectDistinct({ destination: checkouts.destination })
      .from(checkouts)
      .where(sql`${checkouts.destination} IS NOT NULL AND ${checkouts.destination} != ''`)
      .orderBy(asc(checkouts.destination));

    const destinations = results.map((r) => r.destination).filter(Boolean) as string[];
    await this.cacheService.set(cacheKey, destinations, CACHE_TTL.DAY);

    return destinations;
  }

  /**
   * 확인 필요 목록 조회 (현재 사용자 기준)
   *
   * UL-QP-18 렌탈 4단계 확인 워크플로우:
   * ① approved → lender_checked (빌려주는 측: 반출 전 확인)
   * ② lender_checked → borrower_received (빌리는 측: 인수 확인)
   * ③ borrower_received/in_use → borrower_returned (빌리는 측: 반납 전 확인)
   * ④ borrower_returned → lender_received (빌려주는 측: 반입 확인)
   */
  async getPendingChecks(
    userId: string,
    userTeamId: string | undefined,
    role?: 'lender' | 'borrower',
    page = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Promise<CheckoutListResponse> {
    const lenderStatuses = [CSVal.APPROVED, CSVal.BORROWER_RETURNED];
    const borrowerStatuses = [CSVal.LENDER_CHECKED, CSVal.BORROWER_RECEIVED, CSVal.IN_USE];

    const conditions: SQL<unknown>[] = [eq(checkouts.purpose, CPVal.RENTAL)];

    if (role === 'lender') {
      if (!userTeamId) return this.emptyListResponse(page, pageSize);
      conditions.push(
        and(eq(checkouts.lenderTeamId, userTeamId), inArray(checkouts.status, lenderStatuses))!
      );
    } else if (role === 'borrower') {
      conditions.push(
        and(eq(checkouts.requesterId, userId), inArray(checkouts.status, borrowerStatuses))!
      );
    } else {
      const lenderCondition = userTeamId
        ? and(eq(checkouts.lenderTeamId, userTeamId), inArray(checkouts.status, lenderStatuses))
        : undefined;
      const borrowerCondition = and(
        eq(checkouts.requesterId, userId),
        inArray(checkouts.status, borrowerStatuses)
      );
      conditions.push(
        lenderCondition ? or(lenderCondition, borrowerCondition)! : borrowerCondition!
      );
    }

    const numericPageSize = Math.min(Number(pageSize), MAX_PAGE_SIZE);
    const numericOffset = (page - 1) * numericPageSize;

    const idsWithCount = await this.db
      .select({ id: checkouts.id, totalCount: sql<number>`COUNT(*) OVER()` })
      .from(checkouts)
      .where(and(...conditions))
      .orderBy(desc(checkouts.createdAt))
      .limit(numericPageSize)
      .offset(numericOffset);

    let totalItems: number;
    if (idsWithCount.length > 0) {
      totalItems = Number(idsWithCount[0].totalCount);
    } else {
      const [countRow] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(checkouts)
        .where(and(...conditions));
      totalItems = Number(countRow?.count || 0);
    }

    if (idsWithCount.length === 0) {
      return this.emptyListResponse(page, numericPageSize, totalItems);
    }

    const itemsWithRelations = await this.db.query.checkouts.findMany({
      where: (checkouts, { inArray: inArr }) =>
        inArr(
          checkouts.id,
          idsWithCount.map((c) => c.id)
        ),
      with: {
        items: {
          with: {
            equipment: { columns: { id: true, name: true, managementNumber: true } },
          },
        },
        requester: {
          columns: { id: true, name: true, email: true },
          with: { team: true },
        },
      },
    });

    const sortedItems = idsWithCount
      .map((idObj) => {
        const item = itemsWithRelations.find((c) => c.id === idObj.id);
        if (!item) return null;
        return {
          ...item,
          equipment: item.items.map((ci) => ({
            id: ci.equipment.id,
            name: ci.equipment.name,
            managementNumber: ci.equipment.managementNumber,
          })),
          user: item.requester || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      items: sortedItems,
      meta: {
        totalItems,
        itemCount: sortedItems.length,
        itemsPerPage: numericPageSize,
        totalPages: Math.ceil(totalItems / numericPageSize),
        currentPage: Number(page),
      },
    };
  }

  private emptyListResponse(page: number, pageSize: number, totalItems = 0): CheckoutListResponse {
    return {
      items: [],
      meta: {
        totalItems,
        itemCount: 0,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize) || 0,
        currentPage: Number(page),
      },
    };
  }

  /**
   * 반출 요약 정보 조회 (대시보드용)
   * ✅ 성능: 단일 쿼리로 모든 상태별 카운트 집계
   * ✅ 캐시: 5분 TTL
   */
  async getSummary(teamId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    overdue: number;
    returnedToday: number;
  }> {
    const cacheKey = this.buildCacheKey('summary', { teamId });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // WHERE 조건 빌드 (팀 필터링)
          const whereConditions: SQL<unknown>[] = [];
          if (teamId) {
            const requestersByTeam = this.db
              .select({ id: schema.users.id })
              .from(schema.users)
              .where(eq(schema.users.teamId, teamId));

            whereConditions.push(
              or(
                sql`${checkouts.requesterId} IN (${requestersByTeam})`,
                eq(checkouts.lenderTeamId, teamId)
              )!
            );
          }

          // 단일 쿼리로 모든 상태별 카운트 집계
          const [summaryData] = await this.db
            .select({
              total: sql<number>`COUNT(*)`,
              pending: sql<number>`COUNT(*) FILTER (WHERE ${checkouts.status} = ${CSVal.PENDING})`,
              approved: sql<number>`COUNT(*) FILTER (WHERE ${checkouts.status} = ${CSVal.APPROVED})`,
              overdue: sql<number>`COUNT(*) FILTER (WHERE ${checkouts.status} = ${CSVal.OVERDUE})`,
              returnedToday: sql<number>`COUNT(*) FILTER (WHERE ${checkouts.status} = ${CSVal.RETURNED} AND DATE(${checkouts.actualReturnDate}) = CURRENT_DATE)`,
            })
            .from(checkouts)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

          return {
            total: Number(summaryData.total || 0),
            pending: Number(summaryData.pending || 0),
            approved: Number(summaryData.approved || 0),
            overdue: Number(summaryData.overdue || 0),
            returnedToday: Number(summaryData.returnedToday || 0),
          };
        } catch (error) {
          this.logger.error(
            `반출 요약 정보 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * UUID로 반출 조회
   * ✅ 일관성: db.select()를 사용하여 다른 쿼리와 동일한 패턴 유지 (Rentals와 동일)
   * ✅ 개선: 관계 쿼리 API 의존성 제거로 안정성 향상
   */
  /**
   * ✅ Phase 2: Server-Driven UI
   * Optional userPermissions로 meta.availableActions 포함 가능
   *
   * @param uuid 반출 UUID
   * @param userPermissions (선택) 사용자 권한 목록 - 제공 시 meta 포함
   * @param userTeamId (선택) 사용자 팀 ID
   * @returns Checkout 또는 CheckoutWithMeta
   */
  async findOne(
    uuid: string,
    userPermissions?: string[],
    userTeamId?: string
  ): Promise<Checkout | CheckoutWithMeta> {
    const cacheKey = this.buildCacheKey('detail', { uuid });

    const checkout = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // ✅ 일관성: db.query 대신 db.select() 사용 (관계 쿼리 API 의존성 제거)
          const [checkout] = await this.db
            .select()
            .from(checkouts)
            .where(eq(checkouts.id, uuid))
            .limit(1);

          if (!checkout) {
            throw new NotFoundException({
              code: CheckoutErrorCode.NOT_FOUND,
              message: `Checkout with UUID ${uuid} not found`,
            });
          }

          // ✅ 개선: checkoutItems는 별도로 조회 (필요시)
          // 관계 데이터가 필요한 경우 별도 메서드로 분리하거나, 조인 쿼리 사용
          return checkout;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.logger.error(
            `반출 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );

    // ✅ Phase 2: userPermissions 제공 시 meta.availableActions + nextStep 포함
    if (userPermissions) {
      const availableActions = this.calculateAvailableActions(
        checkout,
        userPermissions,
        userTeamId
      );
      const nextStep = this.buildNextStep(checkout, userPermissions);

      return {
        ...checkout,
        meta: { availableActions, nextStep },
      };
    }

    return checkout;
  }

  // ==========================================================================
  // 스코프 접근 제어 헬퍼 (purpose-aware)
  //
  // 도메인 규칙:
  // - calibration/repair: 장비 사이트/팀 기준 (자기 팀 장비만)
  // - rental: lender 사이트/팀 기준 (빌려주는 측이 관리 주체)
  //
  // enforceScopeFromData: 이미 조회한 장비 데이터 재활용 (0 추가 쿼리)
  // enforceScopeFromCheckout: checkout만으로 검증 (rental=0, cal/repair=1 쿼리)
  // ==========================================================================

  /**
   * 이미 조회한 장비 데이터로 스코프 검증 (추가 DB 쿼리 없음)
   * approve, rejectReturn 등 장비 데이터를 이미 가진 메서드에서 사용
   */
  private enforceScopeFromData(
    checkout: { purpose: string; lenderSiteId: string | null; lenderTeamId: string | null },
    equipmentSite: string,
    equipmentTeamId: string | null,
    req: AuthenticatedRequest
  ): void {
    const { site, teamId } =
      checkout.purpose === CPVal.RENTAL && checkout.lenderSiteId
        ? { site: checkout.lenderSiteId, teamId: checkout.lenderTeamId }
        : { site: equipmentSite, teamId: equipmentTeamId };

    enforceSiteAccess(req, site, CHECKOUT_DATA_SCOPE, teamId);
  }

  /**
   * checkout 레코드만으로 스코프 검증
   * rental: lenderSiteId/lenderTeamId 사용 (0 추가 쿼리)
   * calibration/repair: 첫 번째 장비의 사이트/팀 조회 (1 쿼리)
   */
  private async enforceScopeFromCheckout(
    checkout: Checkout,
    req: AuthenticatedRequest
  ): Promise<void> {
    if (checkout.purpose === CPVal.RENTAL && checkout.lenderSiteId) {
      enforceSiteAccess(req, checkout.lenderSiteId, CHECKOUT_DATA_SCOPE, checkout.lenderTeamId);
      return;
    }

    const [equip] = await this.db
      .select({ site: schema.equipment.site, teamId: schema.equipment.teamId })
      .from(checkoutItems)
      .innerJoin(schema.equipment, eq(checkoutItems.equipmentId, schema.equipment.id))
      .where(eq(checkoutItems.checkoutId, checkout.id))
      .limit(1);

    if (equip) {
      enforceSiteAccess(req, equip.site, CHECKOUT_DATA_SCOPE, equip.teamId);
    }
  }

  /**
   * 팀별 권한 체크 헬퍼 메서드
   * EMC팀은 RF팀 장비 반출 신청/승인 불가 (같은 사이트 내에서도)
   */
  private checkTeamPermission(
    equipmentData: { team?: { classification?: string | null } | null },
    userTeamClassification?: string | null
  ): void {
    if (!userTeamClassification || !equipmentData.team) return;

    // EMC팀은 RF팀 장비 반출 신청/승인 불가
    if (
      userTeamClassification === 'general_emc' &&
      equipmentData.team.classification === 'general_rf'
    ) {
      throw new ForbiddenException({
        code: CheckoutErrorCode.CROSS_TEAM_FORBIDDEN,
        message: 'EMC team does not have checkout permission for RF team equipment',
      });
    }
  }

  /**
   * checkout_items + equipment LEFT JOIN으로 아이템 + 첫 번째 장비 정보 동시 획득
   * 알림용 중복 패턴 제거 헬퍼
   */
  private async getCheckoutItemsWithFirstEquipment(checkoutId: string): Promise<{
    items: Array<{ equipmentId: string }>;
    firstEquipment: { name: string | null; managementNumber: string | null } | null;
  }> {
    const rows = await this.db
      .select({
        equipmentId: checkoutItems.equipmentId,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
      })
      .from(checkoutItems)
      .leftJoin(schema.equipment, eq(checkoutItems.equipmentId, schema.equipment.id))
      .where(eq(checkoutItems.checkoutId, checkoutId));

    const items = rows.map((r) => ({ equipmentId: r.equipmentId }));
    const firstEquipment =
      rows.length > 0
        ? { name: rows[0].equipmentName, managementNumber: rows[0].managementNumber }
        : null;

    return { items, firstEquipment };
  }

  /**
   * ✅ Phase 2: Server-Driven UI
   * 사용자 권한 + 상태 기반 액션 계산
   *
   * SSOT: 서버가 클라이언트에게 가능한 액션 알림
   * - 클라이언트는 이 정보만 보고 UI 렌더링
   * - 권한 로직 중복 제거 (서버에만 존재)
   *
   * @param checkout 반출 정보
   * @param userPermissions 사용자 권한 목록
   * @param userTeamId 사용자 팀 ID (선택)
   * @returns 가능한 액션 목록
   */
  private calculateAvailableActions(
    checkout: Checkout,
    userPermissions: readonly string[],
    userTeamId?: string
  ): CheckoutAvailableActions {
    const { purpose, lenderTeamId } = checkout;
    const fsmInput = {
      status: checkout.status,
      purpose: checkout.purpose as CheckoutPurpose,
    };

    // rental 승인은 FSM permission 외에 lenderTeam identity-rule 추가 적용
    const baseCanApprove = canPerformAction(fsmInput, 'approve', userPermissions).ok;
    const lenderTeamOk = purpose !== CPVal.RENTAL || !lenderTeamId || lenderTeamId === userTeamId;

    return {
      canApprove: baseCanApprove && lenderTeamOk,
      canReject: canPerformAction(fsmInput, 'reject', userPermissions).ok,
      canStart: canPerformAction(fsmInput, 'start', userPermissions).ok,
      canReturn: canPerformAction(fsmInput, 'submit_return', userPermissions).ok,
      canApproveReturn: canPerformAction(fsmInput, 'approve_return', userPermissions).ok,
      canRejectReturn: canPerformAction(fsmInput, 'reject_return', userPermissions).ok,
      canCancel: canPerformAction(fsmInput, 'cancel', userPermissions).ok,
      // step-based (FSM 미매핑) — 기존 로직 유지
      canSubmitConditionCheck:
        purpose === CPVal.RENTAL &&
        (
          [
            CSVal.APPROVED,
            CSVal.LENDER_CHECKED,
            CSVal.BORROWER_RECEIVED,
            CSVal.BORROWER_RETURNED,
          ] as string[]
        ).includes(checkout.status) &&
        userPermissions.includes(Permission.COMPLETE_CHECKOUT),
    };
  }

  /**
   * 반출 생성
   * 장비 담당자만 신청 가능 (요구사항)
   * ✅ 개선: UUID 검증, 날짜 처리 강화, 에러 처리 개선 (Rentals와 동일한 패턴)
   * ✅ 팀별 권한 체크 추가: EMC팀은 RF팀 장비 반출 신청 불가
   */
  async create(
    createCheckoutDto: CreateCheckoutDto,
    requesterId: string,
    userTeamId?: string
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증 (일관된 검증 로직)
      this.validateUuid(requesterId, 'requesterId');

      if (!createCheckoutDto.equipmentIds || createCheckoutDto.equipmentIds.length === 0) {
        throw new BadRequestException({
          code: CheckoutErrorCode.NO_EQUIPMENT,
          message: 'At least one equipment must be selected for checkout',
        });
      }
      for (const equipmentId of createCheckoutDto.equipmentIds) {
        this.validateUuid(equipmentId, 'equipmentId');
      }

      // 장비 존재 여부 및 사용 가능 여부 확인 (배치 조회로 N+1 방지)
      let equipmentMap: Awaited<ReturnType<typeof this.equipmentService.findByIds>>;
      try {
        equipmentMap = await this.equipmentService.findByIds(createCheckoutDto.equipmentIds, true);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw new BadRequestException({
            code: CheckoutErrorCode.EQUIPMENT_NOT_FOUND,
            message: (error.getResponse() as { message: string }).message,
          });
        }
        throw error;
      }

      // 이미 반출 중(active)인 장비가 있는지 확인 — 중복 반출 방지
      // OVERDUE 포함: 기한 초과 반출도 여전히 active 상태이므로 중복 반출 차단 필요
      const activeStatuses = [
        CSVal.PENDING,
        CSVal.APPROVED,
        CSVal.CHECKED_OUT,
        CSVal.OVERDUE,
        CSVal.LENDER_CHECKED,
        CSVal.BORROWER_RECEIVED,
        CSVal.BORROWER_RETURNED,
        CSVal.LENDER_RECEIVED,
        CSVal.RETURNED,
      ];
      const activeCheckoutItems = await this.db
        .select({
          equipmentId: checkoutItems.equipmentId,
        })
        .from(checkoutItems)
        .innerJoin(checkouts, eq(checkoutItems.checkoutId, checkouts.id))
        .where(
          and(
            inArray(checkoutItems.equipmentId, createCheckoutDto.equipmentIds),
            inArray(checkouts.status, activeStatuses)
          )
        );

      if (activeCheckoutItems.length > 0) {
        const duplicateIds = [...new Set(activeCheckoutItems.map((item) => item.equipmentId))];
        const duplicateNames = duplicateIds
          .map((id) => equipmentMap.get(id)?.name ?? id)
          .join(', ');
        throw new BadRequestException({
          code: CheckoutErrorCode.EQUIPMENT_ALREADY_ACTIVE,
          message: `이미 반출 진행 중인 장비가 포함되어 있습니다: ${duplicateNames}`,
        });
      }

      // 사용자 팀 classification 조회 (1회)
      let userTeamClassification: string | null | undefined;
      if (userTeamId) {
        const userTeam = await this.teamsService.findOne(userTeamId);
        userTeamClassification = userTeam?.classification;
      }

      const allowedStatuses = getAllowedStatusesForPurpose(createCheckoutDto.purpose);
      const purposeVal = createCheckoutDto.purpose;

      for (const [_equipmentId, equip] of equipmentMap) {
        // 목적별 허용 상태 검증 (SSOT: shared-constants에서 규칙 import)
        if (!allowedStatuses.includes(equip.status as never)) {
          const statusLabel =
            EQUIPMENT_STATUS_LABELS[equip.status as keyof typeof EQUIPMENT_STATUS_LABELS] ??
            equip.status;
          throw new BadRequestException({
            code: CheckoutErrorCode.EQUIPMENT_STATUS_INVALID,
            message: `Equipment ${equip.name} is in "${statusLabel}" status and cannot be checked out`,
          });
        }

        // 목적별 팀 소유권 검증
        if (purposeVal === CPVal.CALIBRATION || purposeVal === CPVal.REPAIR) {
          // 교정/수리: 자기 팀 장비만 가능
          if (userTeamId && equip.teamId && equip.teamId !== userTeamId) {
            throw new BadRequestException({
              code: CheckoutErrorCode.OWN_TEAM_ONLY,
              message: 'Calibration/repair checkouts are only allowed for own team equipment',
            });
          }
        } else if (purposeVal === CPVal.RENTAL) {
          // 외부 대여: 다른 팀 장비만 가능
          if (userTeamId && equip.teamId && equip.teamId === userTeamId) {
            throw new BadRequestException({
              code: CheckoutErrorCode.OTHER_TEAM_ONLY,
              message: 'External rental is only allowed for other team equipment',
            });
          }
        }

        // 팀별 권한 체크: EMC팀은 RF팀 장비 반출 신청 불가 (동기, DB 0회)
        this.checkTeamPermission(equip, userTeamClassification);
      }

      // ✅ 날짜 처리 및 검증 강화
      const expectedReturnDate = new Date(createCheckoutDto.expectedReturnDate);

      // expectedReturnDate 유효성 검증
      if (isNaN(expectedReturnDate.getTime())) {
        throw new BadRequestException({
          code: CheckoutErrorCode.INVALID_RETURN_DATE,
          message: 'Invalid expected return date format',
        });
      }

      // 반입 예정일은 현재 시점보다 늦어야 함
      const now = new Date();
      if (expectedReturnDate <= now) {
        throw new BadRequestException({
          code: CheckoutErrorCode.RETURN_DATE_PAST,
          message: 'Expected return date must be in the future',
        });
      }

      // 반출 데이터 생성 (Equipment 모듈의 transformCreateDtoToEntity 패턴과 동일)
      const insertData: Partial<Checkout> = {
        requesterId,
        purpose: createCheckoutDto.purpose,
        destination: createCheckoutDto.destination,
        phoneNumber: createCheckoutDto.phoneNumber || null,
        address: createCheckoutDto.address || null,
        reason: createCheckoutDto.reason,
        expectedReturnDate,
        checkoutDate: null,
        actualReturnDate: null,
        status: CSVal.PENDING as CheckoutStatus,
        approverId: null,
        approvedAt: null,
        returnerId: null,
        rejectionReason: null,
        calibrationChecked: false,
        repairChecked: false,
        workingStatusChecked: false,
        inspectionNotes: null,
      };

      // 외부 대여 시 빌려주는 측 정보 저장
      if (createCheckoutDto.purpose === CPVal.RENTAL) {
        insertData.lenderTeamId = createCheckoutDto.lenderTeamId || null;
        insertData.lenderSiteId = createCheckoutDto.lenderSiteId || null;
      }

      // 반출 생성 — checkouts + checkoutItems 원자성 보장
      const [newCheckout] = await this.db.transaction(async (tx) => {
        const [checkout] = await tx
          .insert(checkouts)
          .values(insertData as typeof checkouts.$inferInsert)
          .returning();

        // 반출 장비 목록 생성 (QP-18-06: 순번 자동 할당, 수량 기본 1)
        const itemsData = createCheckoutDto.equipmentIds.map((equipmentId, index) => ({
          checkoutId: checkout.id,
          equipmentId,
          sequenceNumber: index + 1,
          quantity: 1,
          conditionBefore: null,
          conditionAfter: null,
          inspectionNotes: null,
        }));

        await tx.insert(checkoutItems).values(itemsData);

        return [checkout];
      });

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화
      const affectedTeams = [userTeamId, insertData.lenderTeamId].filter(Boolean) as string[];
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined);

      // 📢 알림 이벤트 발행 (fire-and-forget) — equipmentMap 재사용 (DB 0회)
      const firstEquipment = equipmentMap.get(createCheckoutDto.equipmentIds[0]);
      await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_CREATED, {
        checkoutId: newCheckout.id,
        equipmentId: createCheckoutDto.equipmentIds[0],
        equipmentName: firstEquipment?.name,
        managementNumber: firstEquipment?.managementNumber,
        requesterId,
        requesterTeamId: userTeamId ?? '',
        purpose: createCheckoutDto.purpose,
        actorId: requesterId,
        actorName: '', // 컨트롤러에서 이름 전달 불필요 — 레지스트리 템플릿이 처리
        timestamp: new Date(),
      });

      return newCheckout;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `반출 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반출 승인 (모든 목적 통합 - 1단계 승인)
   * 기술책임자가 승인 (요구사항)
   * ✅ 승인 프로세스 단순화: 모든 반출 목적에 대해 1단계 승인으로 통합
   * ✅ 팀별 권한 체크 추가: EMC팀은 RF팀 장비 반출 승인 불가
   */
  async approve(
    uuid: string,
    approveDto: ApproveCheckoutDto & { approverId: string },
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');

      // approverId는 컨트롤러에서 세션으로부터 주입되므로 반드시 존재해야 함
      if (!approveDto.approverId) {
        throw new BadRequestException({
          code: CheckoutErrorCode.APPROVER_REQUIRED,
          message: 'Approver information is required',
        });
      }
      this.validateUuid(approveDto.approverId, 'approverId');

      const checkout = await this.findOne(uuid);
      const userPermissions: readonly string[] = req.user?.permissions ?? [];
      this.assertFsmAction(checkout, 'approve', userPermissions);

      // 팀별 권한 체크: 반출에 포함된 모든 장비에 대해 체크 (배치 조회)
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      const equipmentIds = items.map((item) => item.equipmentId);
      const equipmentMap = await this.equipmentService.findByIds(equipmentIds, true);

      // ✅ 스코프 접근 제어 — 이미 조회한 장비 데이터 재활용 (추가 쿼리 0)
      const firstEquip = equipmentMap.values().next().value;
      if (!firstEquip) {
        throw new BadRequestException({
          code: CheckoutErrorCode.NO_EQUIPMENT,
          message: 'No equipment found for this checkout',
        });
      }
      this.enforceScopeFromData(checkout, firstEquip.site, firstEquip.teamId, req);

      // 사용자 팀 classification 조회 (1회)
      const approverTeamId = req.user?.teamId;
      let approverTeamClassification: string | null | undefined;
      if (approverTeamId) {
        const approverTeam = await this.teamsService.findOne(approverTeamId);
        approverTeamClassification = approverTeam?.classification;
      }

      for (const item of items) {
        const equip = equipmentMap.get(item.equipmentId);
        if (equip) {
          this.checkTeamPermission(equip, approverTeamClassification);
        }
      }

      // 대여 목적: 장비 소속 팀(lenderTeamId)의 기술책임자만 승인 가능
      // approverTeamId 미존재(팀 미소속) 시에도 반드시 거부 — identity-rule 강제
      if (checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId) {
        if (!approverTeamId || approverTeamId !== checkout.lenderTeamId) {
          throw new ForbiddenException({
            code: CheckoutErrorCode.LENDER_TEAM_ONLY,
            message: 'Only the technical manager of the lending team can approve',
          });
        }
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      const updated = await this.updateCheckoutStatus(
        uuid,
        { ...checkout, version: approveDto.version },
        CSVal.APPROVED as CheckoutStatus,
        {
          approverId: approveDto.approverId,
          approvedAt: new Date(),
        }
      );

      await this.writeTransitionAudit(
        checkout,
        'approve',
        uuid,
        CSVal.APPROVED as CheckoutStatus,
        req
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행 — items/equipmentMap 재사용 (DB 0회)
      if (items.length > 0) {
        const firstEquip = equipmentMap.get(items[0].equipmentId);
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_APPROVED, {
          checkoutId: uuid,
          equipmentId: items[0].equipmentId,
          equipmentName: firstEquip?.name,
          managementNumber: firstEquip?.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: approveDto.approverId,
          actorName: '',
          nextActor: this.resolveNextActor(checkout.purpose, CSVal.APPROVED as CheckoutStatus),
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `반출 승인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반출 반려
   * 반려 사유 필수 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   */
  async reject(
    uuid: string,
    rejectDto: RejectCheckoutDto & { approverId: string },
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');
      if (rejectDto.approverId) {
        this.validateUuid(rejectDto.approverId, 'approverId');
      }

      const checkout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(checkout, req);
      const rejectPermissions: readonly string[] = req.user?.permissions ?? [];
      this.assertFsmAction(checkout, 'reject', rejectPermissions);

      // 반려 사유 필수 검증
      if (!rejectDto.reason || rejectDto.reason.trim().length === 0) {
        throw new BadRequestException({
          code: CheckoutErrorCode.REJECTION_REASON_REQUIRED,
          message: 'Rejection reason is required',
        });
      }

      // ✅ Optimistic locking: 클라이언트가 보낸 version으로 CAS 수행
      const updated = await this.updateCheckoutStatus(
        uuid,
        { ...checkout, version: rejectDto.version },
        CSVal.REJECTED as CheckoutStatus,
        {
          approverId: rejectDto.approverId,
          rejectionReason: rejectDto.reason.trim(),
        }
      );

      await this.writeTransitionAudit(
        checkout,
        'reject',
        uuid,
        CSVal.REJECTED as CheckoutStatus,
        req
      );

      // ✅ 캐시 무효화 + 알림 데이터를 병렬로 가져오기 (순차 → 병렬)
      const [affectedTeams, { items: rejectItems, firstEquipment: rejectFirstEquip }] =
        await Promise.all([
          this.getAffectedTeamIds(checkout),
          this.getCheckoutItemsWithFirstEquipment(uuid),
        ]);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행
      if (rejectItems.length > 0 && rejectFirstEquip) {
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_REJECTED, {
          checkoutId: uuid,
          equipmentId: rejectItems[0].equipmentId,
          equipmentName: rejectFirstEquip.name,
          managementNumber: rejectFirstEquip.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          reason: rejectDto.reason,
          actorId: rejectDto.approverId ?? undefined,
          actorName: '',
          nextActor: 'none',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `반출 반려 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반출 시작 (실제 반출 처리)
   * 최종 승인된 반출만 반출 가능
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   */
  async startCheckout(
    uuid: string,
    dto: {
      version: number;
      itemConditions?: Array<{ equipmentId: string; conditionBefore: string }>;
    },
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');

      const checkout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(checkout, req);
      const startPermissions: readonly string[] = req.user?.permissions ?? [];
      this.assertFsmAction(checkout, 'start', startPermissions);

      // ✅ 트랜잭션: checkout 상태 변경 + 장비 상태 변경 + 상태 기록을 원자적으로 처리
      const { items, firstEquipment } = await this.getCheckoutItemsWithFirstEquipment(uuid);
      const equipmentIds = items.map((item) => item.equipmentId);

      const updated = await this.db.transaction(async (tx) => {
        // 1. CAS를 사용한 checkout 상태 전환 (version 검증 포함)
        const result = await this.updateWithVersion<Checkout>(
          checkouts,
          uuid,
          dto.version,
          {
            status: CSVal.CHECKED_OUT as CheckoutStatus,
            checkoutDate: new Date(),
          },
          '반출',
          tx
        );

        // 2. 반출된 장비들의 상태를 배치로 'checked_out'으로 변경
        await this.equipmentService.updateStatusBatch(
          equipmentIds,
          ESVal.CHECKED_OUT,
          undefined,
          tx
        );

        // 3. 장비별 반출 전 상태 기록 (Phase 3) — 배치 업데이트로 N+1 방지
        if (dto.itemConditions && dto.itemConditions.length > 0) {
          const conditionCases = dto.itemConditions.map(
            (cond) =>
              sql`WHEN ${checkoutItems.equipmentId} = ${cond.equipmentId} THEN ${cond.conditionBefore}`
          );
          const equipmentIdsForCondition = dto.itemConditions.map((c) => c.equipmentId);
          await tx
            .update(checkoutItems)
            .set({
              conditionBefore: sql`CASE ${sql.join(conditionCases, sql` `)} END`,
            })
            .where(
              and(
                eq(checkoutItems.checkoutId, uuid),
                inArray(checkoutItems.equipmentId, equipmentIdsForCondition)
              )
            );
        }

        return result;
      });

      await this.writeTransitionAudit(
        checkout,
        'start',
        uuid,
        CSVal.CHECKED_OUT as CheckoutStatus,
        req
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행 — JOIN 결과 재사용 (DB 0회)
      if (items.length > 0 && firstEquipment) {
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_STARTED, {
          checkoutId: uuid,
          equipmentId: items[0].equipmentId,
          equipmentName: firstEquipment.name,
          managementNumber: firstEquipment.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: checkout.requesterId,
          actorName: '',
          nextActor: this.resolveNextActor(checkout.purpose, CSVal.CHECKED_OUT as CheckoutStatus),
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `반출 시작 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반입 처리
   * 교정/수리 확인 및 작동 여부 확인 포함 (요구사항)
   * 상태: checked_out → returned (검사 완료, 기술책임자 승인 대기)
   * ✅ 개선: UUID 검증 추가, 반출 유형별 필수 검사 항목 검증
   */
  async returnCheckout(
    uuid: string,
    returnDto: ReturnCheckoutDto,
    returnerId: string,
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');
      this.validateUuid(returnerId, 'returnerId');

      const checkout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(checkout, req);
      const returnPermissions: readonly string[] = req.user?.permissions ?? [];
      this.assertFsmAction(checkout, 'submit_return', returnPermissions);

      // ✅ 반출 유형별 필수 검사 항목 검증
      const purpose = checkout.purpose;

      // 모든 유형: workingStatusChecked 필수
      if (!returnDto.workingStatusChecked) {
        throw new BadRequestException({
          code: CheckoutErrorCode.WORKING_STATUS_REQUIRED,
          message: 'Working status check is required',
        });
      }

      // 교정 목적: calibrationChecked 필수
      if (purpose === CPVal.CALIBRATION && !returnDto.calibrationChecked) {
        throw new BadRequestException({
          code: CheckoutErrorCode.CALIBRATION_CHECK_REQUIRED,
          message: 'Calibration check is required for calibration purpose checkouts',
        });
      }

      // 수리 목적: repairChecked 필수
      if (purpose === CPVal.REPAIR && !returnDto.repairChecked) {
        throw new BadRequestException({
          code: CheckoutErrorCode.REPAIR_CHECK_REQUIRED,
          message: 'Repair check is required for repair purpose checkouts',
        });
      }

      // ✅ 트랜잭션: checkout 상태 변경 + 장비별 상태 기록을 원자적으로 처리
      const updated = await this.db.transaction(async (tx) => {
        // 1. CAS를 사용한 checkout 상태 전환
        const result = await this.updateWithVersion<Checkout>(
          checkouts,
          uuid,
          returnDto.version,
          {
            status: CSVal.RETURNED as CheckoutStatus,
            actualReturnDate: new Date(),
            returnerId,
            calibrationChecked: returnDto.calibrationChecked ?? false,
            repairChecked: returnDto.repairChecked ?? false,
            workingStatusChecked: returnDto.workingStatusChecked ?? false,
            inspectionNotes: returnDto.inspectionNotes || null,
          },
          '반출',
          tx
        );

        // 2. 장비별 반입 후 상태 기록 (Phase 3) — 배치 업데이트로 N+1 방지
        if (returnDto.itemConditions && returnDto.itemConditions.length > 0) {
          const conditionCases = returnDto.itemConditions.map(
            (cond) =>
              sql`WHEN ${checkoutItems.equipmentId} = ${cond.equipmentId} THEN ${cond.conditionAfter}`
          );
          const equipmentIdsForCondition = returnDto.itemConditions.map((c) => c.equipmentId);
          await tx
            .update(checkoutItems)
            .set({
              conditionAfter: sql`CASE ${sql.join(conditionCases, sql` `)} END`,
            })
            .where(
              and(
                eq(checkoutItems.checkoutId, uuid),
                inArray(checkoutItems.equipmentId, equipmentIdsForCondition)
              )
            );
        }

        return result;
      });

      // ✅ 장비 상태는 기술책임자 최종 승인 후에 변경 (approveReturn에서 처리)

      await this.writeTransitionAudit(
        checkout,
        'submit_return',
        uuid,
        CSVal.RETURNED as CheckoutStatus,
        req
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행 — JOIN 헬퍼 사용 (1 query)
      const { items: returnItems, firstEquipment: returnFirstEquip } =
        await this.getCheckoutItemsWithFirstEquipment(uuid);
      if (returnItems.length > 0 && returnFirstEquip) {
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_RETURNED, {
          checkoutId: uuid,
          equipmentId: returnItems[0].equipmentId,
          equipmentName: returnFirstEquip.name,
          managementNumber: returnFirstEquip.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: returnerId,
          actorName: '',
          nextActor: this.resolveNextActor(checkout.purpose, CSVal.RETURNED as CheckoutStatus),
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
        throw error;
      }
      this.logger.error(
        `반입 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반입 최종 승인
   * 기술책임자가 검사 완료된 반입을 최종 승인 (요구사항)
   * 상태: returned → return_approved
   * 장비 상태: available로 자동 복원
   */
  async approveReturn(
    uuid: string,
    approveReturnDto: ApproveReturnDto & { approverId: string },
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');
      this.validateUuid(approveReturnDto.approverId, 'approverId');

      const checkout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(checkout, req);
      const approveReturnPermissions: readonly string[] = req.user?.permissions ?? [];
      this.assertFsmAction(checkout, 'approve_return', approveReturnPermissions);

      // ✅ 트랜잭션: checkout 상태 변경 + 장비 상태 복원을 원자적으로 처리
      const { items, firstEquipment } = await this.getCheckoutItemsWithFirstEquipment(uuid);
      const equipmentIds = items.map((item) => item.equipmentId);

      if (!firstEquipment) {
        throw new BadRequestException({
          code: CheckoutErrorCode.NO_EQUIPMENT,
          message: 'No equipment found for this checkout',
        });
      }

      const updated = await this.db.transaction(async (tx) => {
        // 1. CAS를 사용한 checkout 상태 전환
        const result = await this.updateWithVersion<Checkout>(
          checkouts,
          uuid,
          approveReturnDto.version,
          {
            status: CSVal.RETURN_APPROVED as CheckoutStatus,
            returnApprovedBy: approveReturnDto.approverId,
            returnApprovedAt: new Date(),
          },
          '반출',
          tx
        );

        // 2. 장비 상태를 배치로 'available'로 복원
        await this.equipmentService.updateStatusBatch(
          equipmentIds,
          ESVal.AVAILABLE,
          ESVal.CHECKED_OUT,
          tx
        );

        return result;
      });

      // 렌탈 반납 목적 checkout일 경우 rental import 완료 콜백
      if (checkout.purpose === CPVal.RETURN_TO_VENDOR) {
        try {
          await this.rentalImportsService.onReturnCompleted(uuid);
        } catch (callbackError) {
          this.logger.error(
            `렌탈 반입 완료 콜백 실패 — checkoutId: ${uuid}, purpose: ${checkout.purpose}, error: ${callbackError instanceof Error ? callbackError.message : String(callbackError)}`,
            callbackError instanceof Error ? callbackError.stack : undefined
          );
        }
      }

      await this.writeTransitionAudit(
        checkout,
        'approve_return',
        uuid,
        CSVal.RETURN_APPROVED as CheckoutStatus,
        req
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행 — JOIN 결과 재사용 (DB 0회)
      if (items.length > 0 && firstEquipment) {
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED, {
          checkoutId: uuid,
          equipmentId: items[0].equipmentId,
          equipmentName: firstEquipment.name,
          managementNumber: firstEquipment.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: approveReturnDto.approverId,
          actorName: '',
          nextActor: 'none',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
        throw error;
      }
      this.logger.error(
        `반입 최종 승인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반입 반려
   * 기술책임자가 검사 결과가 미충족일 때 반입을 반려
   * 상태: returned → checked_out (재검사/재반입 필요)
   * 장비 상태는 변경하지 않음 (이미 checked_out 상태 유지 중)
   */
  async rejectReturn(
    uuid: string,
    rejectReturnDto: RejectReturnDto & { approverId: string; approverTeamId?: string },
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      this.validateUuid(uuid, 'checkoutId');
      this.validateUuid(rejectReturnDto.approverId, 'approverId');

      const checkout = await this.findOne(uuid);
      const rejectReturnPermissions: readonly string[] = req.user?.permissions ?? [];

      if (!rejectReturnDto.reason || rejectReturnDto.reason.trim().length === 0) {
        throw new BadRequestException({
          code: CheckoutErrorCode.REJECTION_REASON_REQUIRED,
          message: 'Rejection reason is required',
        });
      }

      // ✅ items + equipment 일괄 조회 (권한 체크 + 알림에서 재사용)
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      const equipmentIds = items.map((item) => item.equipmentId);
      const equipmentMap = await this.equipmentService.findByIds(equipmentIds, true);

      // ✅ 스코프 접근 제어 — approverTeamId 유무와 무관하게 항상 실행 (방어선 일관성)
      const firstEquip = equipmentMap.values().next().value;
      if (!firstEquip) {
        throw new BadRequestException({
          code: CheckoutErrorCode.NO_EQUIPMENT,
          message: 'No equipment found for this checkout',
        });
      }
      this.enforceScopeFromData(checkout, firstEquip.site, firstEquip.teamId, req);
      // 스코프 검증 이후 FSM 검사 — 스코프 외 사용자가 FSM 오류로 상태 역추론하는 정보 노출 방지
      this.assertFsmAction(checkout, 'reject_return', rejectReturnPermissions);

      let approverClassification: string | null | undefined;
      if (rejectReturnDto.approverTeamId) {
        const approverTeam = await this.teamsService.findOne(rejectReturnDto.approverTeamId);
        approverClassification = approverTeam?.classification;
      }

      for (const item of items) {
        const equip = equipmentMap.get(item.equipmentId);
        if (equip) {
          this.checkTeamPermission(equip, approverClassification);
        }
      }

      // ✅ Optimistic locking: returned → checked_out (재반입 프로세스)
      // 클라이언트가 보낸 version으로 CAS 수행 (서버 최신값 사용 금지)
      const updated = await this.updateCheckoutStatus(
        uuid,
        { ...checkout, version: rejectReturnDto.version },
        CSVal.CHECKED_OUT as CheckoutStatus,
        {
          rejectionReason: rejectReturnDto.reason.trim(),
          // 검사 결과 초기화 — 재검사 필요 (스키마: boolean NOT NULL default false)
          calibrationChecked: false,
          repairChecked: false,
          workingStatusChecked: false,
          inspectionNotes: null,
          actualReturnDate: null,
        }
      );

      await this.writeTransitionAudit(
        checkout,
        'reject_return',
        uuid,
        CSVal.CHECKED_OUT as CheckoutStatus,
        req
      );

      // ✅ 캐시 무효화 — items/equipmentMap은 이미 보유, 팀 ID만 추가 조회
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행 — 이미 조회한 items + equipmentMap 재사용 (추가 쿼리 0)
      const firstEquipId = items[0]?.equipmentId;
      const rejectReturnEquip = firstEquipId ? equipmentMap.get(firstEquipId) : undefined;
      if (items.length > 0) {
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_RETURN_REJECTED, {
          checkoutId: uuid,
          equipmentId: firstEquipId,
          equipmentName: rejectReturnEquip?.name ?? null,
          managementNumber: rejectReturnEquip?.managementNumber ?? null,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          reason: rejectReturnDto.reason,
          actorId: rejectReturnDto.approverId,
          actorName: '',
          nextActor: this.resolveNextActor(checkout.purpose, CSVal.CHECKED_OUT as CheckoutStatus),
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
        throw error;
      }
      this.logger.error(
        `반입 반려 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 상태 확인 등록 (대여 목적 양측 4단계)
   * condition_checks 테이블에 INSERT + 반출 상태 자동 전이
   */
  async submitConditionCheck(
    uuid: string,
    dto: CreateConditionCheckDto,
    checkerId: string,
    req: AuthenticatedRequest
  ): Promise<typeof conditionChecks.$inferSelect> {
    try {
      this.validateUuid(uuid, 'checkoutId');
      this.validateUuid(checkerId, 'checkerId');

      const checkout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(checkout, req);

      // 대여 목적만 상태 확인 가능
      if (checkout.purpose !== CPVal.RENTAL) {
        throw new BadRequestException({
          code: CheckoutErrorCode.CONDITION_CHECK_RENTAL_ONLY,
          message: 'Condition check is only available for rental purpose checkouts',
        });
      }

      // 단계별 현재 상태 검증 및 상태 전이 매핑
      const stepTransitions: Record<
        ConditionCheckStep,
        { requiredStatus: string; nextStatus: string }
      > = {
        [CCSVal.LENDER_CHECKOUT]: {
          requiredStatus: CSVal.APPROVED,
          nextStatus: CSVal.LENDER_CHECKED,
        },
        [CCSVal.BORROWER_RECEIVE]: {
          requiredStatus: CSVal.LENDER_CHECKED,
          nextStatus: CSVal.BORROWER_RECEIVED,
        },
        [CCSVal.BORROWER_RETURN]: {
          requiredStatus: CSVal.BORROWER_RECEIVED,
          nextStatus: CSVal.BORROWER_RETURNED,
        },
        [CCSVal.LENDER_RETURN]: {
          requiredStatus: CSVal.BORROWER_RETURNED,
          nextStatus: CSVal.LENDER_RECEIVED,
        },
      };

      const transition = stepTransitions[dto.step];
      if (!transition) {
        throw new BadRequestException({
          code: CheckoutErrorCode.INVALID_CONDITION_STEP,
          message: `Invalid condition check step: ${dto.step}`,
        });
      }

      if (checkout.status !== transition.requiredStatus) {
        throw new BadRequestException({
          code: CheckoutErrorCode.INVALID_STATUS_FOR_STEP,
          message: `Cannot perform step ${dto.step} in current status (${checkout.status}). Required status: ${transition.requiredStatus}`,
        });
      }

      // ✅ 트랜잭션: condition_check 삽입 + checkout 상태 전환 + 장비 상태 변경을 원자적으로 처리
      const needsEquipmentStatusChange =
        dto.step === CCSVal.LENDER_CHECKOUT || dto.step === CCSVal.LENDER_RETURN;
      let equipmentIds: string[] = [];

      if (needsEquipmentStatusChange) {
        const items = await this.db
          .select({ equipmentId: checkoutItems.equipmentId })
          .from(checkoutItems)
          .where(eq(checkoutItems.checkoutId, uuid));
        equipmentIds = items.map((item) => item.equipmentId);
      }

      const conditionCheck = await this.db.transaction(async (tx) => {
        // 1. condition_checks에 INSERT
        const [check] = await tx
          .insert(conditionChecks)
          .values({
            checkoutId: uuid,
            step: dto.step as ConditionCheckStep,
            checkedBy: checkerId,
            checkedAt: new Date(),
            appearanceStatus: dto.appearanceStatus,
            operationStatus: dto.operationStatus,
            accessoriesStatus: dto.accessoriesStatus || null,
            abnormalDetails: dto.abnormalDetails || null,
            comparisonWithPrevious: dto.comparisonWithPrevious || null,
            notes: dto.notes || null,
          })
          .returning();

        // 2. 반출 상태 자동 전이
        const checkoutUpdateData: Partial<Checkout> = {
          status: transition.nextStatus as CheckoutStatus,
          updatedAt: new Date(),
        };

        // 3. 단계별 날짜 및 장비 상태 업데이트
        if (dto.step === CCSVal.LENDER_CHECKOUT) {
          checkoutUpdateData.checkoutDate = new Date();
          await this.equipmentService.updateStatusBatch(
            equipmentIds,
            ESVal.CHECKED_OUT,
            undefined,
            tx
          );
        } else if (dto.step === CCSVal.LENDER_RETURN) {
          checkoutUpdateData.actualReturnDate = new Date();
          await this.equipmentService.updateStatusBatch(
            equipmentIds,
            ESVal.AVAILABLE,
            undefined,
            tx
          );
        }

        // 4. CAS를 사용한 checkout 상태 전환
        await this.updateWithVersion<Checkout>(
          checkouts,
          uuid,
          dto.version,
          checkoutUpdateData,
          '반출',
          tx
        );

        return check;
      });

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      return conditionCheck;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
        throw error;
      }
      this.logger.error(
        `상태 확인 등록 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반출별 상태 확인 이력 조회
   */
  async getConditionChecks(uuid: string): Promise<
    (typeof conditionChecks.$inferSelect & {
      checker?: { id: string; name: string | null; email: string | null };
    })[]
  > {
    this.validateUuid(uuid, 'checkoutId');

    const rows = await this.db
      .select({
        check: conditionChecks,
        checkerId: schema.users.id,
        checkerName: schema.users.name,
        checkerEmail: schema.users.email,
      })
      .from(conditionChecks)
      .leftJoin(schema.users, eq(schema.users.id, conditionChecks.checkedBy))
      .where(eq(conditionChecks.checkoutId, uuid))
      .orderBy(asc(conditionChecks.checkedAt))
      .limit(QUERY_SAFETY_LIMITS.CONDITION_CHECKS_PER_CHECKOUT);

    return rows.map((row) => ({
      ...row.check,
      checker: row.checkerId
        ? { id: row.checkerId, name: row.checkerName, email: row.checkerEmail }
        : undefined,
    }));
  }

  /**
   * 반출 취소
   * 승인 전 신청자만 취소 가능 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   */
  async cancel(uuid: string, version: number, req: AuthenticatedRequest): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');

      const checkout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(checkout, req);
      const cancelPermissions: readonly string[] = req.user?.permissions ?? [];
      this.assertFsmAction(checkout, 'cancel', cancelPermissions);

      // ✅ Optimistic locking: 클라이언트가 보낸 version으로 CAS 수행
      const updated = await this.updateCheckoutStatus(
        uuid,
        { ...checkout, version },
        CSVal.CANCELED as CheckoutStatus
      );

      // 렌탈 반납 목적 checkout 취소 시 import 상태 롤백 콜백
      if (checkout.purpose === CPVal.RETURN_TO_VENDOR) {
        try {
          await this.rentalImportsService.onReturnCanceled(uuid);
        } catch (callbackError) {
          this.logger.error(
            `렌탈 반입 취소 롤백 콜백 실패 — checkoutId: ${uuid}, purpose: ${checkout.purpose}, error: ${callbackError instanceof Error ? callbackError.message : String(callbackError)}`,
            callbackError instanceof Error ? callbackError.stack : undefined
          );
        }
      }

      await this.writeTransitionAudit(
        checkout,
        'cancel',
        uuid,
        CSVal.CANCELED as CheckoutStatus,
        req
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `반출 취소 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * UUID로 반출 업데이트
   * ✅ 개선: UUID 검증, 날짜 처리 강화 (Rentals와 동일한 패턴)
   */
  async update(
    uuid: string,
    updateCheckoutDto: UpdateCheckoutDto,
    req: AuthenticatedRequest
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, 'checkoutId');

      const existingCheckout = await this.findOne(uuid);
      await this.enforceScopeFromCheckout(existingCheckout, req);

      // 승인된 반출은 수정 불가
      if (existingCheckout.status !== CSVal.PENDING) {
        throw new BadRequestException({
          code: CheckoutErrorCode.ONLY_PENDING_CAN_UPDATE,
          message: 'Only pending checkouts can be updated',
        });
      }

      // 업데이트할 데이터 준비 (Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일)
      const updateFields: Partial<Checkout> = {
        updatedAt: new Date(),
      };

      // ✅ 날짜 처리 및 검증 강화
      if (updateCheckoutDto.expectedReturnDate !== undefined) {
        const expectedReturnDate = new Date(updateCheckoutDto.expectedReturnDate);

        // 날짜 유효성 검증
        if (isNaN(expectedReturnDate.getTime())) {
          throw new BadRequestException({
            code: CheckoutErrorCode.INVALID_RETURN_DATE,
            message: 'Invalid expected return date format',
          });
        }

        // 반입 예정일은 현재 시점보다 늦어야 함
        const now = new Date();
        if (expectedReturnDate <= now) {
          throw new BadRequestException({
            code: CheckoutErrorCode.RETURN_DATE_PAST,
            message: 'Expected return date must be in the future',
          });
        }

        updateFields.expectedReturnDate = expectedReturnDate;
      }

      if (updateCheckoutDto.destination !== undefined) {
        updateFields.destination = updateCheckoutDto.destination;
      }

      if (updateCheckoutDto.reason !== undefined) {
        updateFields.reason = updateCheckoutDto.reason;
      }

      // ✅ status는 전용 상태 전이 메서드(approve/reject/cancel 등)를 통해서만 변경 가능
      // → UpdateCheckoutDto에서 status 필드 제거됨

      // ✅ Optimistic locking: 클라이언트가 전송한 version으로 CAS 검증
      // existingCheckout.version이 아닌 DTO의 version을 사용해야 동시 수정을 감지
      const updated = await this.updateWithVersion<Checkout>(
        checkouts,
        uuid,
        updateCheckoutDto.version,
        updateFields,
        '반출'
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(existingCheckout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
        throw error;
      }
      this.logger.error(
        `반출 업데이트 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * UUID로 반출 삭제 (취소로 처리)
   */
  async remove(uuid: string, version: number, req: AuthenticatedRequest): Promise<Checkout> {
    return this.cancel(uuid, version, req);
  }

  /**
   * 반출의 접근 제어 스코프 결정 (purpose-aware)
   *
   * 도메인 규칙:
   * - calibration/repair: 요청자(requester)의 사이트/팀 기준
   *   → 리스트 필터(SiteScopeInterceptor)와 동일한 데이터 소스 사용
   *   → 교정/수리는 자기 팀 장비만 반출 가능 (생성 시 보장)
   * - rental: lender 사이트/팀 기준 (빌려주는 측이 관리 주체)
   *
   * 리스트 쿼리와 단건 접근 제어가 동일한 기준(requester 팀)을 사용하여
   * "리스트에 보이지만 승인 불가" 불일치를 방지한다.
   */
  async getCheckoutScopeContext(
    checkoutId: string
  ): Promise<{ site: string; teamId: string | null }> {
    // ✅ CTE 최적화: checkout + users를 LEFT JOIN + CASE로 단일 쿼리 (2쿼리 → 1쿼리)
    // rental → lender 기준, calibration/repair → requester 기준
    const [result] = await this.db
      .select({
        site: sql<string>`CASE
          WHEN ${checkouts.purpose} = ${CPVal.RENTAL} AND ${checkouts.lenderSiteId} IS NOT NULL
          THEN ${checkouts.lenderSiteId}
          ELSE ${schema.users.site}
        END`,
        teamId: sql<string | null>`CASE
          WHEN ${checkouts.purpose} = ${CPVal.RENTAL} AND ${checkouts.lenderSiteId} IS NOT NULL
          THEN ${checkouts.lenderTeamId}
          ELSE ${schema.users.teamId}
        END`,
      })
      .from(checkouts)
      .leftJoin(schema.users, eq(schema.users.id, checkouts.requesterId))
      .where(eq(checkouts.id, checkoutId));

    if (!result) {
      throw new NotFoundException({
        code: CheckoutErrorCode.NOT_FOUND,
        message: `Checkout ${checkoutId} not found.`,
      });
    }

    if (!result.site) {
      throw new NotFoundException({
        code: CheckoutErrorCode.NOT_FOUND,
        message: `Checkout ${checkoutId} requester not found.`,
      });
    }

    return { site: result.site, teamId: result.teamId };
  }
}
