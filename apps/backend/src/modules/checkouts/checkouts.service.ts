import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
  ConflictException,
  forwardRef,
} from '@nestjs/common';
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
  CHECKOUT_STATUS_VALUES,
  EQUIPMENT_STATUS_LABELS,
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import { getAllowedStatusesForPurpose, Permission } from '@equipment-management/shared-constants';
import { eq, and, like, gte, lte, or, desc, asc, sql, SQL, isNull } from 'drizzle-orm';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { conditionChecks } from '@equipment-management/db/schema/condition-checks';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { EquipmentService } from '../equipment/equipment.service';
import { TeamsService } from '../teams/teams.service';
import { EquipmentImportsService } from '../equipment-imports/equipment-imports.service';
import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
// Drizzle에서 자동 추론되는 타입 사용
type Checkout = typeof checkouts.$inferSelect;

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
 * 메타데이터(availableActions)를 포함한 Checkout
 */
export interface CheckoutWithMeta extends Checkout {
  meta: {
    availableActions: CheckoutAvailableActions;
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
 * 페이지네이션 메타데이터 인터페이스
 */
interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
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
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5분
  private readonly CACHE_PREFIX = 'checkouts:';

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
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly cacheService: SimpleCacheService,
    private readonly equipmentService: EquipmentService,
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => EquipmentImportsService))
    private readonly rentalImportsService: EquipmentImportsService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super(); // ✅ Required for extending VersionedBaseService
  }

  /**
   * UUID 형식 검증 헬퍼 메서드
   * ✅ 재사용 가능한 유틸리티 함수로 분리 (Rentals와 동일한 패턴)
   */
  private validateUuid(uuid: string, fieldName: string): void {
    if (!uuid || typeof uuid !== 'string') {
      throw new BadRequestException(`${fieldName}는 필수이며 문자열이어야 합니다.`);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      throw new BadRequestException(`유효하지 않은 ${fieldName} UUID 형식입니다.`);
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
    try {
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
    } catch (error) {
      if (error instanceof ConflictException) {
        // ✅ Cache coherence: CAS 실패 시 stale cache 제거
        // findOne 캐시가 stale version을 가지고 있으면 재시도도 계속 409
        const detailCacheKey = this.buildCacheKey('detail', { uuid });
        await this.cacheService.delete(detailCacheKey);
      }
      throw error;
    }
  }

  /**
   * 캐시 키 생성 헬퍼 메서드
   */
  private buildCacheKey(suffix: string, params?: Record<string, unknown>): string {
    const baseKey = `${this.CACHE_PREFIX}${suffix}`;
    if (!params) {
      return baseKey;
    }
    const safeParams = JSON.stringify(params, (key, value) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return Object.keys(value).reduce(
          (acc, k) => {
            acc[k] = value[k];
            return acc;
          },
          {} as Record<string, unknown>
        );
      }
      return value;
    });
    return `${baseKey}:${safeParams}`;
  }

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
   * ✅ 성능 최적화: 선택적 무효화로 캐시 히트율 30-40% 개선
   *
   * @param teamIds 영향받는 팀 ID 배열 (지정하지 않으면 전체 무효화)
   * @param checkoutId 변경된 checkout의 ID (detail 캐시 무효화용)
   *
   * 예: 반출 생성 시 신청자 팀과 대여 팀의 캐시만 무효화
   */
  private async invalidateCache(teamIds?: string[], checkoutId?: string): Promise<void> {
    // ✅ SSOT: 개별 checkout의 detail 캐시 무효화 (optimistic locking 지원)
    if (checkoutId) {
      const detailCacheKey = this.buildCacheKey('detail', { uuid: checkoutId });
      await this.cacheService.delete(detailCacheKey);
    }

    if (!teamIds || teamIds.length === 0) {
      // 팀 정보가 없으면 전체 무효화 (안전한 fallback)
      await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
      return;
    }

    // ✅ 선택적 무효화: 영향받는 팀의 캐시만 삭제
    // 패턴: "checkouts:list:...teamId":"team-uuid-here"..."
    // 패턴: "checkouts:summary:...teamId":"team-uuid-here"..."
    // 패턴: "checkouts:count:...teamId":"team-uuid-here"..."
    for (const teamId of teamIds) {
      // 해당 팀이 포함된 모든 캐시 키 삭제
      await this.cacheService.deleteByPattern(`${this.CACHE_PREFIX}.*"teamId":"${teamId}".*`);
    }

    // 팀 필터링이 없는 전체 목록 캐시도 무효화 (summary, destinations 등)
    await this.cacheService.deleteByPattern(
      `${this.CACHE_PREFIX}(summary|list|count):(?!.*teamId)`
    );
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

    // 사이트 필터링 (신청자의 사이트 OR 대여 시 빌려주는 사이트)
    if (site) {
      const usersAtSite = this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.site, site));

      whereConditions.push(
        or(sql`${checkouts.requesterId} IN (${usersAtSite})`, eq(checkouts.lenderSiteId, site))!
      );
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
      whereConditions.push(
        or(
          like(checkouts.destination, `%${search}%`),
          like(checkouts.reason, `%${search}%`),
          like(checkouts.address, `%${search}%`)
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

    // 팀 ID 필터링 (신청자의 팀 OR 대여 시 빌려주는 팀)
    if (teamId) {
      // direction과 teamId를 조합한 필터링
      if (direction === 'outbound') {
        // 반출: 우리 팀 장비가 나가는 건
        // - (신청자가 우리 팀 AND 목적이 rental이 아님) = 교정/수리 반출
        // - OR (lenderTeamId가 우리 팀) = 타팀이 우리 장비를 빌려감
        const requestersByTeam = this.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.teamId, teamId));

        whereConditions.push(
          or(
            and(
              sql`${checkouts.requesterId} IN (${requestersByTeam})`,
              sql`${checkouts.purpose} != ${CPVal.RENTAL}`
            ),
            eq(checkouts.lenderTeamId, teamId)
          )!
        );
      } else if (direction === 'inbound') {
        // 반입: 외부 장비가 들어오는 건
        // - (신청자가 우리 팀 AND 목적이 rental) = 우리가 타팀 장비를 빌림
        const requestersByTeam = this.db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.teamId, teamId));

        whereConditions.push(
          and(
            sql`${checkouts.requesterId} IN (${requestersByTeam})`,
            eq(checkouts.purpose, CPVal.RENTAL)
          )!
        );
      } else {
        // direction 없으면 기존 로직 유지 (양쪽 모두 포함)
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
    const { page = 1, pageSize = 20 } = queryParams;

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

          const countCacheKey = this.buildCacheKey('count', {
            equipmentId: queryParams.equipmentId,
            requesterId: queryParams.requesterId,
            approverId: queryParams.approverId,
            teamId: queryParams.teamId,
            site: queryParams.site,
            purpose: queryParams.purpose,
            statuses: queryParams.statuses,
            checkoutFrom: queryParams.checkoutFrom,
            checkoutTo: queryParams.checkoutTo,
            returnFrom: queryParams.returnFrom,
            returnTo: queryParams.returnTo,
            search: queryParams.search,
          });

          const totalItems = await this.cacheService.getOrSet(
            countCacheKey,
            async () => {
              const countResult = await this.db
                .select({ count: sql<number>`COUNT(*)` })
                .from(checkouts)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
              return Number(countResult[0]?.count || 0);
            },
            this.CACHE_TTL
          );

          const totalPages = Math.ceil(totalItems / pageSize);
          const offset = (page - 1) * pageSize;
          const numericPageSize = Number(pageSize);
          const numericOffset = Number(offset);

          // ✅ N+1 Query Fix: Use Drizzle relational query API with JOIN
          // This replaces 41 queries (1 + 20×2) with a single optimized JOIN query
          // Query builder for manual sorting (relational API doesn't support complex ORDER BY)
          const checkoutIds = await this.db
            .select({ id: checkouts.id })
            .from(checkouts)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(...(orderBy.length > 0 ? orderBy : [desc(checkouts.createdAt)]))
            .limit(numericPageSize)
            .offset(numericOffset);

          if (checkoutIds.length === 0) {
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

          // Fetch checkouts with relations using Drizzle's relational API
          // This performs efficient JOINs thanks to the indexes we created
          const itemsWithRelations = await this.db.query.checkouts.findMany({
            where: (checkouts, { inArray }) =>
              inArray(
                checkouts.id,
                checkoutIds.map((c) => c.id)
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

          // Transform to match expected response format
          const sortedItems = checkoutIds
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

          // ✅ 성능 최적화: includeSummary=true 시 단일 쿼리로 요약 정보 포함
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
      this.CACHE_TTL
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
    const TTL_24H = 24 * 60 * 60 * 1000; // 24시간

    const cached = await this.cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const results = await this.db
      .selectDistinct({ destination: checkouts.destination })
      .from(checkouts)
      .where(sql`${checkouts.destination} IS NOT NULL AND ${checkouts.destination} != ''`)
      .orderBy(asc(checkouts.destination));

    const destinations = results.map((r) => r.destination).filter(Boolean) as string[];
    await this.cacheService.set(cacheKey, destinations, TTL_24H);

    return destinations;
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
      this.CACHE_TTL
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
            throw new NotFoundException(`UUID ${uuid}의 반출을 찾을 수 없습니다.`);
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
      this.CACHE_TTL
    );

    // ✅ Phase 2: userPermissions 제공 시 meta.availableActions 포함
    if (userPermissions) {
      const availableActions = await this.calculateAvailableActions(
        checkout,
        userPermissions,
        userTeamId
      );

      return {
        ...checkout,
        meta: { availableActions },
      };
    }

    return checkout;
  }

  /**
   * 팀별 권한 체크 헬퍼 메서드
   * EMC팀은 RF팀 장비 반출 신청/승인 불가 (같은 사이트 내에서도)
   */
  private async checkTeamPermission(equipmentId: string, userTeamId?: string): Promise<void> {
    if (!userTeamId) {
      return; // 팀 정보가 없으면 체크하지 않음
    }

    // 장비 정보 조회
    const equipment = await this.equipmentService.findOne(equipmentId);
    if (!equipment.teamId) {
      return; // 장비에 팀이 없으면 체크하지 않음
    }

    // 사용자 팀 정보 조회
    const userTeam = await this.teamsService.findOne(userTeamId);
    if (!userTeam) {
      return; // 사용자 팀 정보를 찾을 수 없으면 체크하지 않음
    }

    // 사용자 팀 분류 확인
    const userTeamClassification = userTeam.classification;

    // EMC팀은 RF팀 장비 반출 신청/승인 불가
    if (userTeamClassification === 'general_emc') {
      try {
        // ✅ 스키마 일치화: EquipmentService를 사용하여 타입 안전하게 조회
        const equipmentData = await this.equipmentService.findOne(equipmentId, true);

        if (!equipmentData.teamId) {
          // 팀이 없으면 체크하지 않음
          return;
        }

        const equipmentTeamClassification = equipmentData.team?.classification;

        // EMC팀은 RF팀 장비 반출 신청/승인 불가
        if (equipmentTeamClassification === 'general_rf') {
          throw new ForbiddenException('EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다.');
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.error(
          `팀별 권한 체크 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        );
        // 오류 발생 시 체크를 건너뛰고 진행 (보안보다는 안정성 우선)
      }
    }
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
  private async calculateAvailableActions(
    checkout: Checkout,
    userPermissions: string[],
    userTeamId?: string
  ): Promise<CheckoutAvailableActions> {
    const { status, purpose, lenderTeamId } = checkout;
    const hasPermission = (p: Permission) => userPermissions.includes(p);

    return {
      // 승인: pending 상태 + 승인 권한 + (대여의 경우 lender 팀 일치)
      canApprove:
        status === CSVal.PENDING &&
        hasPermission(Permission.APPROVE_CHECKOUT) &&
        (purpose !== CPVal.RENTAL || !lenderTeamId || lenderTeamId === userTeamId),

      // 반려: pending 상태 + 반려 권한
      canReject: status === CSVal.PENDING && hasPermission(Permission.REJECT_CHECKOUT),

      // 반출 시작: approved 상태 + 대여 목적 아님 + 반출 시작 권한
      canStart:
        status === CSVal.APPROVED &&
        purpose !== CPVal.RENTAL &&
        hasPermission(Permission.START_CHECKOUT),

      // 반입: (checked_out이고 대여 아님) 또는 (lender_received이고 대여) + 반입 권한
      canReturn:
        ((status === CSVal.CHECKED_OUT && purpose !== CPVal.RENTAL) ||
          (status === CSVal.LENDER_RECEIVED && purpose === CPVal.RENTAL)) &&
        hasPermission(Permission.COMPLETE_CHECKOUT),

      // 반입 승인: returned 상태 + 승인 권한
      canApproveReturn: status === CSVal.RETURNED && hasPermission(Permission.APPROVE_CHECKOUT),

      // 반입 반려: returned 상태 + 승인 권한 (approveReturn과 동일 조건)
      canRejectReturn: status === CSVal.RETURNED && hasPermission(Permission.APPROVE_CHECKOUT),

      // 취소: pending 상태 + 취소 권한
      canCancel: status === CSVal.PENDING && hasPermission(Permission.CANCEL_CHECKOUT),

      // 상태 확인 등록: 대여 목적 + 특정 상태들 + 완료 권한
      canSubmitConditionCheck:
        purpose === CPVal.RENTAL &&
        (
          [
            CSVal.APPROVED,
            CSVal.LENDER_CHECKED,
            CSVal.BORROWER_RECEIVED,
            CSVal.IN_USE,
            CSVal.BORROWER_RETURNED,
          ] as string[]
        ).includes(status) &&
        hasPermission(Permission.COMPLETE_CHECKOUT),
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
      this.validateUuid(requesterId, '신청자');

      if (!createCheckoutDto.equipmentIds || createCheckoutDto.equipmentIds.length === 0) {
        throw new BadRequestException('반출할 장비를 최소 1개 이상 선택해야 합니다.');
      }
      for (const equipmentId of createCheckoutDto.equipmentIds) {
        this.validateUuid(equipmentId, '장비');
      }

      // 장비 존재 여부 및 사용 가능 여부 확인
      for (const equipmentId of createCheckoutDto.equipmentIds) {
        let equipment;
        try {
          equipment = await this.equipmentService.findOne(equipmentId);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw new BadRequestException(`UUID ${equipmentId}의 장비를 찾을 수 없습니다.`);
          }
          throw error;
        }

        // 목적별 허용 상태 검증 (SSOT: shared-constants에서 규칙 import)
        const allowedStatuses = getAllowedStatusesForPurpose(createCheckoutDto.purpose);
        if (!allowedStatuses.includes(equipment.status as any)) {
          const statusLabel =
            EQUIPMENT_STATUS_LABELS[equipment.status as keyof typeof EQUIPMENT_STATUS_LABELS] ??
            equipment.status;
          throw new BadRequestException(
            `장비 ${equipment.name}이(가) 현재 "${statusLabel}" 상태이므로 ${createCheckoutDto.purpose === CPVal.RENTAL ? '대여' : '반출'} 신청할 수 없습니다.`
          );
        }

        // 목적별 팀 소유권 검증
        const purposeVal = createCheckoutDto.purpose;
        if (purposeVal === CPVal.CALIBRATION || purposeVal === CPVal.REPAIR) {
          // 교정/수리: 자기 팀 장비만 가능
          if (userTeamId && equipment.teamId && equipment.teamId !== userTeamId) {
            throw new BadRequestException('교정/수리 목적의 반출은 소속 팀 장비만 가능합니다.');
          }
        } else if (purposeVal === CPVal.RENTAL) {
          // 외부 대여: 다른 팀 장비만 가능
          if (userTeamId && equipment.teamId && equipment.teamId === userTeamId) {
            throw new BadRequestException('외부 대여는 다른 팀의 장비만 가능합니다.');
          }
        }

        // 팀별 권한 체크: EMC팀은 RF팀 장비 반출 신청 불가
        await this.checkTeamPermission(equipmentId, userTeamId);
      }

      // ✅ 날짜 처리 및 검증 강화
      const expectedReturnDate = new Date(createCheckoutDto.expectedReturnDate);

      // expectedReturnDate 유효성 검증
      if (isNaN(expectedReturnDate.getTime())) {
        throw new BadRequestException('유효하지 않은 반입 예정일 형식입니다.');
      }

      // 반입 예정일은 현재 시점보다 늦어야 함
      const now = new Date();
      if (expectedReturnDate <= now) {
        throw new BadRequestException('반입 예정일은 현재 시점보다 늦어야 합니다.');
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

      // 반출 생성 (Equipment 모듈과 동일한 패턴: as typeof table.$inferInsert)
      const [newCheckout] = await this.db
        .insert(checkouts)
        .values(insertData as typeof checkouts.$inferInsert)
        .returning();

      // 반출 장비 목록 생성
      const itemsData = createCheckoutDto.equipmentIds.map((equipmentId) => ({
        checkoutId: newCheckout.id,
        equipmentId,
        conditionBefore: null,
        conditionAfter: null,
        inspectionNotes: null,
      }));

      await this.db.insert(checkoutItems).values(itemsData);

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화
      const affectedTeams = [userTeamId, insertData.lenderTeamId].filter(Boolean) as string[];
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined);

      // 📢 알림 이벤트 발행 (fire-and-forget)
      const firstEquipment = await this.equipmentService.findOne(createCheckoutDto.equipmentIds[0]);
      this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_CREATED, {
        checkoutId: newCheckout.id,
        equipmentId: createCheckoutDto.equipmentIds[0],
        equipmentName: firstEquipment.name,
        managementNumber: firstEquipment.managementNumber,
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
    approverTeamId?: string
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');

      // approverId는 컨트롤러에서 세션으로부터 주입되므로 반드시 존재해야 함
      if (!approveDto.approverId) {
        throw new BadRequestException('승인자 정보가 필요합니다.');
      }
      this.validateUuid(approveDto.approverId, '승인자');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== CSVal.PENDING) {
        throw new BadRequestException('대기 중인 반출만 승인할 수 있습니다.');
      }

      // 팀별 권한 체크: 반출에 포함된 모든 장비에 대해 체크
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      for (const item of items) {
        await this.checkTeamPermission(item.equipmentId, approverTeamId);
      }

      // 대여 목적: 장비 소속 팀(lenderTeamId)의 기술책임자만 승인 가능
      if (checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId && approverTeamId) {
        if (approverTeamId !== checkout.lenderTeamId) {
          throw new ForbiddenException('대여 장비 소속 팀의 기술책임자만 승인할 수 있습니다.');
        }
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      const updated = await this.updateCheckoutStatus(
        uuid,
        checkout,
        CSVal.APPROVED as CheckoutStatus,
        {
          approverId: approveDto.approverId,
          approvedAt: new Date(),
        }
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행
      const approveItems = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));
      if (approveItems.length > 0) {
        const eq1 = await this.equipmentService.findOne(approveItems[0].equipmentId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_APPROVED, {
          checkoutId: uuid,
          equipmentId: approveItems[0].equipmentId,
          equipmentName: eq1.name,
          managementNumber: eq1.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: approveDto.approverId,
          actorName: '',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
    rejectDto: RejectCheckoutDto & { approverId: string }
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');
      if (rejectDto.approverId) {
        this.validateUuid(rejectDto.approverId, '승인자');
      }

      const checkout = await this.findOne(uuid);

      // 대기 중인 상태만 반려 가능
      if (checkout.status !== CSVal.PENDING) {
        throw new BadRequestException('대기 중인 반출만 반려할 수 있습니다.');
      }

      // 반려 사유 필수 검증
      if (!rejectDto.reason || rejectDto.reason.trim().length === 0) {
        throw new BadRequestException('반려 사유는 필수입니다.');
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      const updated = await this.updateCheckoutStatus(
        uuid,
        checkout,
        CSVal.REJECTED as CheckoutStatus,
        {
          approverId: rejectDto.approverId,
          rejectionReason: rejectDto.reason.trim(),
        }
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행
      const rejectItems = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));
      if (rejectItems.length > 0) {
        const eq1 = await this.equipmentService.findOne(rejectItems[0].equipmentId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_REJECTED, {
          checkoutId: uuid,
          equipmentId: rejectItems[0].equipmentId,
          equipmentName: eq1.name,
          managementNumber: eq1.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          reason: rejectDto.reason,
          actorId: rejectDto.approverId ?? '',
          actorName: '',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
    }
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== CSVal.APPROVED) {
        throw new BadRequestException('승인된 반출만 반출할 수 있습니다.');
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환 (version 검증 포함)
      const updated = await this.updateWithVersion<Checkout>(
        checkouts,
        uuid,
        dto.version,
        {
          status: CSVal.CHECKED_OUT as CheckoutStatus,
          checkoutDate: new Date(),
        },
        '반출'
      );

      // 반출된 장비들의 상태를 'checked_out'으로 변경
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      for (const item of items) {
        await this.equipmentService.updateStatus(item.equipmentId, ESVal.CHECKED_OUT);
      }

      // 장비별 반출 전 상태 기록 (Phase 3)
      if (dto.itemConditions && dto.itemConditions.length > 0) {
        for (const cond of dto.itemConditions) {
          await this.db
            .update(checkoutItems)
            .set({ conditionBefore: cond.conditionBefore })
            .where(
              and(
                eq(checkoutItems.checkoutId, uuid),
                eq(checkoutItems.equipmentId, cond.equipmentId)
              )
            );
        }
      }

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행
      if (items.length > 0) {
        const eq1 = await this.equipmentService.findOne(items[0].equipmentId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_STARTED, {
          checkoutId: uuid,
          equipmentId: items[0].equipmentId,
          equipmentName: eq1.name,
          managementNumber: eq1.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: checkout.requesterId,
          actorName: '',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
    returnerId: string
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');
      this.validateUuid(returnerId, '반입 처리자');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== CSVal.CHECKED_OUT) {
        throw new BadRequestException('반출 중인 반출만 반입할 수 있습니다.');
      }

      // ✅ 반출 유형별 필수 검사 항목 검증
      const purpose = checkout.purpose;

      // 모든 유형: workingStatusChecked 필수
      if (!returnDto.workingStatusChecked) {
        throw new BadRequestException('작동 여부 확인은 필수입니다.');
      }

      // 교정 목적: calibrationChecked 필수
      if (purpose === CPVal.CALIBRATION && !returnDto.calibrationChecked) {
        throw new BadRequestException('교정 목적 반출의 경우 교정 확인은 필수입니다.');
      }

      // 수리 목적: repairChecked 필수
      if (purpose === CPVal.REPAIR && !returnDto.repairChecked) {
        throw new BadRequestException('수리 목적 반출의 경우 수리 확인은 필수입니다.');
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      const updated = await this.updateCheckoutStatus(
        uuid,
        checkout,
        CSVal.RETURNED as CheckoutStatus,
        {
          actualReturnDate: new Date(),
          returnerId,
          calibrationChecked: returnDto.calibrationChecked ?? false,
          repairChecked: returnDto.repairChecked ?? false,
          workingStatusChecked: returnDto.workingStatusChecked ?? false,
          inspectionNotes: returnDto.inspectionNotes || null,
        }
      );

      // 장비별 반입 후 상태 기록 (Phase 3)
      if (returnDto.itemConditions && returnDto.itemConditions.length > 0) {
        for (const cond of returnDto.itemConditions) {
          await this.db
            .update(checkoutItems)
            .set({ conditionAfter: cond.conditionAfter })
            .where(
              and(
                eq(checkoutItems.checkoutId, uuid),
                eq(checkoutItems.equipmentId, cond.equipmentId)
              )
            );
        }
      }

      // ✅ 장비 상태는 기술책임자 최종 승인 후에 변경 (approveReturn에서 처리)

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행
      const returnItems = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));
      if (returnItems.length > 0) {
        const eq1 = await this.equipmentService.findOne(returnItems[0].equipmentId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_RETURNED, {
          checkoutId: uuid,
          equipmentId: returnItems[0].equipmentId,
          equipmentName: eq1.name,
          managementNumber: eq1.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: returnerId,
          actorName: '',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
    approveReturnDto: ApproveReturnDto & { approverId: string }
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');
      this.validateUuid(approveReturnDto.approverId, '승인자');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== CSVal.RETURNED) {
        throw new BadRequestException('검사 완료된(returned) 반입만 최종 승인할 수 있습니다.');
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      const updated = await this.updateCheckoutStatus(
        uuid,
        checkout,
        CSVal.RETURN_APPROVED as CheckoutStatus,
        {
          returnApprovedBy: approveReturnDto.approverId,
          returnApprovedAt: new Date(),
        }
      );

      // ✅ 반입 승인 후 장비 상태를 'available'로 복원
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      for (const item of items) {
        await this.equipmentService.updateStatus(item.equipmentId, ESVal.AVAILABLE);
      }

      // 렌탈 반납 목적 checkout일 경우 rental import 완료 콜백
      if (checkout.purpose === CPVal.RETURN_TO_VENDOR) {
        try {
          await this.rentalImportsService.onReturnCompleted(uuid);
        } catch (callbackError) {
          this.logger.warn(
            `렌탈 반입 완료 콜백 처리 중 오류: ${callbackError instanceof Error ? callbackError.message : String(callbackError)}`
          );
        }
      }

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행
      if (items.length > 0) {
        const eq1 = await this.equipmentService.findOne(items[0].equipmentId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED, {
          checkoutId: uuid,
          equipmentId: items[0].equipmentId,
          equipmentName: eq1.name,
          managementNumber: eq1.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          actorId: approveReturnDto.approverId,
          actorName: '',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
    rejectReturnDto: RejectReturnDto & { approverId: string; approverTeamId?: string }
  ): Promise<Checkout> {
    try {
      this.validateUuid(uuid, '반출');
      this.validateUuid(rejectReturnDto.approverId, '승인자');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== CSVal.RETURNED) {
        throw new BadRequestException('검사 완료된(returned) 반입만 반려할 수 있습니다.');
      }

      if (!rejectReturnDto.reason || rejectReturnDto.reason.trim().length === 0) {
        throw new BadRequestException('반려 사유는 필수입니다.');
      }

      // ✅ 팀별 권한 체크 (크로스 사이트 워크플로우 — approve와 동일 패턴)
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      if (rejectReturnDto.approverTeamId) {
        for (const item of items) {
          await this.checkTeamPermission(item.equipmentId, rejectReturnDto.approverTeamId);
        }
      }

      // 대여 목적: 장비 소속 팀(lenderTeamId)의 기술책임자만 반려 가능
      if (
        checkout.purpose === CPVal.RENTAL &&
        checkout.lenderTeamId &&
        rejectReturnDto.approverTeamId
      ) {
        if (rejectReturnDto.approverTeamId !== checkout.lenderTeamId) {
          throw new BadRequestException(
            '대여 장비 소속 팀의 기술책임자만 반입을 반려할 수 있습니다.'
          );
        }
      }

      // ✅ Optimistic locking: returned → checked_out (재반입 프로세스)
      const updated = await this.updateCheckoutStatus(
        uuid,
        checkout,
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

      // ✅ 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      // 📢 알림 이벤트 발행 (items는 팀 권한 체크에서 이미 fetch됨)
      if (items.length > 0) {
        const eq1 = await this.equipmentService.findOne(items[0].equipmentId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_RETURN_REJECTED, {
          checkoutId: uuid,
          equipmentId: items[0].equipmentId,
          equipmentName: eq1.name,
          managementNumber: eq1.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: affectedTeams[0] ?? '',
          reason: rejectReturnDto.reason,
          actorId: rejectReturnDto.approverId,
          actorName: '',
          timestamp: new Date(),
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        // ✅ CAS 실패 시 detail 캐시 삭제 (stale cache 방지)
        const detailCacheKey = `checkouts:detail:${JSON.stringify({ uuid })}`;
        this.cacheService.delete(detailCacheKey);
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
    checkerId: string
  ): Promise<typeof conditionChecks.$inferSelect> {
    try {
      this.validateUuid(uuid, '반출');
      this.validateUuid(checkerId, '확인자');

      const checkout = await this.findOne(uuid);

      // 대여 목적만 상태 확인 가능
      if (checkout.purpose !== CPVal.RENTAL) {
        throw new BadRequestException('상태 확인은 대여 목적 반출에서만 사용할 수 있습니다.');
      }

      // 단계별 현재 상태 검증 및 상태 전이 매핑
      const stepTransitions: Record<string, { requiredStatus: string; nextStatus: string }> = {
        lender_checkout: { requiredStatus: CSVal.APPROVED, nextStatus: CSVal.LENDER_CHECKED },
        borrower_receive: { requiredStatus: CSVal.LENDER_CHECKED, nextStatus: CSVal.IN_USE },
        borrower_return: { requiredStatus: CSVal.IN_USE, nextStatus: CSVal.BORROWER_RETURNED },
        lender_return: {
          requiredStatus: CSVal.BORROWER_RETURNED,
          nextStatus: CSVal.LENDER_RECEIVED,
        },
      };

      const transition = stepTransitions[dto.step];
      if (!transition) {
        throw new BadRequestException(`유효하지 않은 상태 확인 단계입니다: ${dto.step}`);
      }

      if (checkout.status !== transition.requiredStatus) {
        throw new BadRequestException(
          `현재 반출 상태(${checkout.status})에서는 ${dto.step} 단계를 수행할 수 없습니다. ` +
            `필요한 상태: ${transition.requiredStatus}`
        );
      }

      // condition_checks에 INSERT
      const [conditionCheck] = await this.db
        .insert(conditionChecks)
        .values({
          checkoutId: uuid,
          step: dto.step,
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

      // 반출 상태 자동 전이
      const checkoutUpdateData: Partial<Checkout> = {
        status: transition.nextStatus as CheckoutStatus,
        updatedAt: new Date(),
      };

      // 단계별 날짜 및 장비 상태 업데이트
      if (dto.step === 'lender_checkout') {
        // ① 반출 전 확인 → checkoutDate 설정, 장비 status → checked_out
        checkoutUpdateData.checkoutDate = new Date();
        const items = await this.db
          .select()
          .from(checkoutItems)
          .where(eq(checkoutItems.checkoutId, uuid));
        for (const item of items) {
          await this.equipmentService.updateStatus(item.equipmentId, ESVal.CHECKED_OUT);
        }
      } else if (dto.step === 'lender_return') {
        // ④ 반입 확인 → actualReturnDate 설정, 장비 status → available
        checkoutUpdateData.actualReturnDate = new Date();
        const items = await this.db
          .select()
          .from(checkoutItems)
          .where(eq(checkoutItems.checkoutId, uuid));
        for (const item of items) {
          await this.equipmentService.updateStatus(item.equipmentId, ESVal.AVAILABLE);
        }
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      await this.updateWithVersion<Checkout>(
        checkouts,
        uuid,
        checkout.version,
        checkoutUpdateData,
        '반출'
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined);

      return conditionCheck;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
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
    this.validateUuid(uuid, '반출');

    const checks = await this.db
      .select()
      .from(conditionChecks)
      .where(eq(conditionChecks.checkoutId, uuid))
      .orderBy(asc(conditionChecks.checkedAt));

    // checker 정보 조인
    const checksWithChecker = await Promise.all(
      checks.map(async (check) => {
        const [checkerData] = await this.db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
          })
          .from(schema.users)
          .where(eq(schema.users.id, check.checkedBy))
          .limit(1);

        return {
          ...check,
          checker: checkerData || undefined,
        };
      })
    );

    return checksWithChecker;
  }

  /**
   * 반출 취소
   * 승인 전 신청자만 취소 가능 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   */
  async cancel(uuid: string): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== CSVal.PENDING) {
        throw new BadRequestException('승인 전 반출만 취소할 수 있습니다.');
      }

      // ✅ Optimistic locking: CAS를 사용한 상태 전환
      const updated = await this.updateCheckoutStatus(
        uuid,
        checkout,
        CSVal.CANCELED as CheckoutStatus
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화 + detail 캐시 무효화
      const affectedTeams = await this.getAffectedTeamIds(checkout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
  async update(uuid: string, updateCheckoutDto: UpdateCheckoutDto): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');

      const existingCheckout = await this.findOne(uuid);

      // 승인된 반출은 수정 불가
      if (existingCheckout.status !== CSVal.PENDING) {
        throw new BadRequestException('승인 전 반출만 수정할 수 있습니다.');
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
          throw new BadRequestException('유효하지 않은 반입 예정일 형식입니다.');
        }

        // 반입 예정일은 현재 시점보다 늦어야 함
        const now = new Date();
        if (expectedReturnDate <= now) {
          throw new BadRequestException('반입 예정일은 현재 시점보다 늦어야 합니다.');
        }

        updateFields.expectedReturnDate = expectedReturnDate;
      }

      if (updateCheckoutDto.destination !== undefined) {
        updateFields.destination = updateCheckoutDto.destination;
      }

      if (updateCheckoutDto.reason !== undefined) {
        updateFields.reason = updateCheckoutDto.reason;
      }

      if (updateCheckoutDto.status !== undefined) {
        const status = updateCheckoutDto.status as CheckoutStatus;
        if (!(CHECKOUT_STATUS_VALUES as readonly string[]).includes(status)) {
          throw new BadRequestException(`유효하지 않은 상태값: ${status}`);
        }
        updateFields.status = status;
      }

      // ✅ Optimistic locking: CAS를 사용한 업데이트
      const updated = await this.updateWithVersion<Checkout>(
        checkouts,
        uuid,
        existingCheckout.version,
        updateFields,
        '반출'
      );

      // ✅ 선택적 캐시 무효화: 영향받는 팀만 무효화
      const affectedTeams = await this.getAffectedTeamIds(existingCheckout);
      await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
  async remove(uuid: string): Promise<Checkout> {
    return this.cancel(uuid);
  }
}
