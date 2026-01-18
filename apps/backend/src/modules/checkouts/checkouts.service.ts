import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { CheckoutQueryDto } from './dto/checkout-query.dto';
import { ApproveCheckoutDto } from './dto/approve-checkout.dto';
import { RejectCheckoutDto } from './dto/reject-checkout.dto';
import { ReturnCheckoutDto } from './dto/return-checkout.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { CheckoutStatus, CHECKOUT_STATUS_VALUES } from '@equipment-management/schemas';
import { eq, and, like, gte, lte, or, desc, asc, sql, SQL, isNull } from 'drizzle-orm';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { EquipmentService } from '../equipment/equipment.service';
import { TeamsService } from '../teams/teams.service';
import { ForbiddenException } from '@nestjs/common';
// Drizzle에서 자동 추론되는 타입 사용
type Checkout = typeof checkouts.$inferSelect;

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
 * 반출 목록 응답 인터페이스
 */
interface CheckoutListResponse {
  items: Checkout[];
  meta: PaginationMeta;
}

@Injectable()
export class CheckoutsService {
  private readonly logger = new Logger(CheckoutsService.name);
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5분
  private readonly CACHE_PREFIX = 'checkouts:';

  // 인덱스가 있는 필드 목록 (정렬 최적화용)
  private readonly INDEXED_FIELDS = [
    'status',
    'requesterId',
    'firstApproverId',
    'finalApproverId',
    'checkoutDate',
    'expectedReturnDate',
    'createdAt',
  ] as const;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly cacheService: SimpleCacheService,
    private readonly equipmentService: EquipmentService,
    private readonly teamsService: TeamsService
  ) {}

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
   * 캐시 무효화 헬퍼 메서드
   */
  private async invalidateCache(): Promise<void> {
    await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
  }

  /**
   * 쿼리 조건 빌더
   */
  private buildQueryConditions(queryParams: CheckoutQueryDto): QueryConditions {
    const {
      equipmentId,
      requesterId,
      approverId,
      purpose,
      statuses,
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
      whereConditions.push(
        or(eq(checkouts.firstApproverId, approverId), eq(checkouts.finalApproverId, approverId))
      );
    }

    if (purpose) {
      whereConditions.push(eq(checkouts.purpose, purpose));
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
        whereConditions.push(or(...statusConditions));
      }
    }

    // 날짜 범위 필터링
    if (checkoutFrom) {
      whereConditions.push(
        or(gte(checkouts.checkoutDate, new Date(checkoutFrom)), isNull(checkouts.checkoutDate))
      );
    }

    if (checkoutTo) {
      whereConditions.push(
        or(lte(checkouts.checkoutDate, new Date(checkoutTo)), isNull(checkouts.checkoutDate))
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
        )
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

    // 정렬 설정
    const orderBy: SQL<unknown>[] = [];
    if (sort) {
      const [field, direction] = sort.split('.');
      if (field && this.INDEXED_FIELDS.includes(field as (typeof this.INDEXED_FIELDS)[number])) {
        switch (field) {
          case 'status':
            orderBy.push(direction === 'asc' ? asc(checkouts.status) : desc(checkouts.status));
            break;
          case 'requesterId':
            orderBy.push(
              direction === 'asc' ? asc(checkouts.requesterId) : desc(checkouts.requesterId)
            );
            break;
          case 'checkoutDate':
            orderBy.push(
              direction === 'asc' ? asc(checkouts.checkoutDate) : desc(checkouts.checkoutDate)
            );
            break;
          case 'expectedReturnDate':
            orderBy.push(
              direction === 'asc'
                ? asc(checkouts.expectedReturnDate)
                : desc(checkouts.expectedReturnDate)
            );
            break;
          case 'createdAt':
          default:
            orderBy.push(
              direction === 'asc' ? asc(checkouts.createdAt) : desc(checkouts.createdAt)
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
   */
  async findAll(queryParams: CheckoutQueryDto): Promise<CheckoutListResponse> {
    const { page = 1, pageSize = 20 } = queryParams;

    const cacheKey = this.buildCacheKey('list', {
      equipmentId: queryParams.equipmentId,
      requesterId: queryParams.requesterId,
      approverId: queryParams.approverId,
      purpose: queryParams.purpose,
      statuses: queryParams.statuses,
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

          const finalOrderBy = orderBy.length > 0 ? orderBy : [desc(checkouts.createdAt)];
          const items = await this.db
            .select()
            .from(checkouts)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(...finalOrderBy)
            .limit(numericPageSize)
            .offset(numericOffset);

          return {
            items,
            meta: {
              totalItems,
              itemCount: items.length,
              itemsPerPage: numericPageSize,
              totalPages,
              currentPage: Number(page),
            },
          };
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
   * UUID로 반출 조회
   * ✅ 일관성: db.select()를 사용하여 다른 쿼리와 동일한 패턴 유지 (Rentals와 동일)
   * ✅ 개선: 관계 쿼리 API 의존성 제거로 안정성 향상
   */
  async findOne(uuid: string): Promise<Checkout> {
    const cacheKey = this.buildCacheKey('detail', { uuid });

    return this.cacheService.getOrSet(
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

    // 사용자 팀 타입 확인
    const userTeamType = userTeam.type?.toUpperCase();

    // EMC팀은 RF팀 장비 반출 신청/승인 불가
    if (userTeamType === 'EMC') {
      try {
        // ✅ 스키마 일치화: EquipmentService를 사용하여 타입 안전하게 조회
        const equipmentData = await this.equipmentService.findOne(equipmentId, true);

        if (!equipmentData.teamId) {
          // 팀이 없으면 체크하지 않음
          return;
        }

        const equipmentTeamType = equipmentData.team?.type?.toUpperCase();

        // EMC팀은 RF팀 장비 반출 신청/승인 불가
        if (equipmentTeamType === 'RF') {
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

        if (equipment.status !== 'available') {
          throw new BadRequestException(
            `장비 ${equipment.name}이(가) 현재 사용 가능한 상태가 아닙니다. 현재 상태: ${equipment.status}`
          );
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
        status: 'pending' as CheckoutStatus,
        firstApproverId: null,
        finalApproverId: null,
        returnerId: null,
        rejectionReason: null,
        calibrationChecked: false,
        repairChecked: false,
        workingStatusChecked: false,
        inspectionNotes: null,
      };

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

      // 캐시 무효화
      await this.invalidateCache();

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
   * 1차 승인 (내부 목적: 교정/수리)
   * 팀 매니저가 승인 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   * ✅ 팀별 권한 체크 추가: EMC팀은 RF팀 장비 반출 승인 불가
   */
  async approveFirst(
    uuid: string,
    approveDto: ApproveCheckoutDto,
    approverTeamId?: string
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');
      this.validateUuid(approveDto.approverId, '승인자');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== 'pending') {
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

      // 내부 목적(교정/수리)은 1단계 승인으로 완료
      if (checkout.purpose === 'calibration' || checkout.purpose === 'repair') {
        // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
        const updateData: Partial<Checkout> = {
          status: 'final_approved' as CheckoutStatus,
          firstApproverId: approveDto.approverId,
          updatedAt: new Date(),
        };

        const [updated] = await this.db
          .update(checkouts)
          .set(updateData as Record<string, unknown>)
          .where(eq(checkouts.id, uuid))
          .returning();

        if (!updated) {
          throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
        }

        await this.invalidateCache();
        return updated;
      }

      // 외부 대여 목적은 1차 승인만 수행
      if (checkout.purpose === 'external_rental') {
        // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
        const updateData: Partial<Checkout> = {
          status: 'first_approved' as CheckoutStatus,
          firstApproverId: approveDto.approverId,
          updatedAt: new Date(),
        };

        const [updated] = await this.db
          .update(checkouts)
          .set(updateData as Record<string, unknown>)
          .where(eq(checkouts.id, uuid))
          .returning();

        if (!updated) {
          throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
        }

        await this.invalidateCache();
        return updated;
      }

      throw new BadRequestException(`알 수 없는 반출 목적: ${checkout.purpose}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `1차 승인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 최종 승인 (외부 대여 목적만)
   * 팀 매니저가 최종 승인 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   * ✅ 팀별 권한 체크 추가: EMC팀은 RF팀 장비 반출 승인 불가
   */
  async approveFinal(
    uuid: string,
    approveDto: ApproveCheckoutDto,
    approverTeamId?: string
  ): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');
      this.validateUuid(approveDto.approverId, '승인자');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== 'first_approved') {
        throw new BadRequestException('1차 승인된 반출만 최종 승인할 수 있습니다.');
      }

      if (checkout.purpose !== 'external_rental') {
        throw new BadRequestException('외부 대여 목적 반출만 최종 승인이 필요합니다.');
      }

      // 팀별 권한 체크: 반출에 포함된 모든 장비에 대해 체크
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      for (const item of items) {
        await this.checkTeamPermission(item.equipmentId, approverTeamId);
      }

      const updateData: Partial<Checkout> = {
        status: 'final_approved' as CheckoutStatus,
        finalApproverId: approveDto.approverId,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(checkouts)
        .set(updateData as Record<string, unknown>)
        .where(eq(checkouts.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      await this.invalidateCache();
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `최종 승인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반출 반려
   * 반려 사유 필수 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   */
  async reject(uuid: string, rejectDto: RejectCheckoutDto): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');
      if (rejectDto.approverId) {
        this.validateUuid(rejectDto.approverId, '승인자');
      }

      const checkout = await this.findOne(uuid);

      // 대기 중이거나 1차 승인된 상태만 반려 가능
      if (checkout.status !== 'pending' && checkout.status !== 'first_approved') {
        throw new BadRequestException('대기 중이거나 1차 승인된 반출만 반려할 수 있습니다.');
      }

      // 반려 사유 필수 검증
      if (!rejectDto.reason || rejectDto.reason.trim().length === 0) {
        throw new BadRequestException('반려 사유는 필수입니다.');
      }

      const updateData: Partial<Checkout> = {
        status: 'rejected' as CheckoutStatus,
        firstApproverId:
          checkout.status === 'pending' ? rejectDto.approverId : checkout.firstApproverId,
        finalApproverId: checkout.status === 'first_approved' ? rejectDto.approverId : null,
        rejectionReason: rejectDto.reason.trim(),
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(checkouts)
        .set(updateData as Record<string, unknown>)
        .where(eq(checkouts.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      await this.invalidateCache();
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
  async startCheckout(uuid: string): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== 'final_approved') {
        throw new BadRequestException('최종 승인된 반출만 반출할 수 있습니다.');
      }

      // 반출 처리
      const updateData: Partial<Checkout> = {
        status: 'checked_out' as CheckoutStatus,
        checkoutDate: new Date(),
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(checkouts)
        .set(updateData as Record<string, unknown>)
        .where(eq(checkouts.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 반출된 장비들의 상태를 'checked_out'으로 변경
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      for (const item of items) {
        await this.equipmentService.updateStatus(item.equipmentId, 'checked_out');
      }

      await this.invalidateCache();
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
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
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

      if (checkout.status !== 'checked_out') {
        throw new BadRequestException('반출 중인 반출만 반입할 수 있습니다.');
      }

      // 반입 처리
      const updateData: Partial<Checkout> = {
        status: 'returned' as CheckoutStatus,
        actualReturnDate: new Date(),
        returnerId,
        calibrationChecked: returnDto.calibrationChecked ?? false,
        repairChecked: returnDto.repairChecked ?? false,
        workingStatusChecked: returnDto.workingStatusChecked ?? false,
        inspectionNotes: returnDto.inspectionNotes || null,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(checkouts)
        .set(updateData as Record<string, unknown>)
        .where(eq(checkouts.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 반입된 장비들의 상태를 'available'로 복원
      const items = await this.db
        .select()
        .from(checkoutItems)
        .where(eq(checkoutItems.checkoutId, uuid));

      for (const item of items) {
        await this.equipmentService.updateStatus(item.equipmentId, 'available');
      }

      await this.invalidateCache();
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
   * 반출 취소
   * 승인 전 신청자만 취소 가능 (요구사항)
   * ✅ 개선: UUID 검증 추가 (Rentals와 동일한 패턴)
   */
  async cancel(uuid: string): Promise<Checkout> {
    try {
      // ✅ UUID 형식 검증
      this.validateUuid(uuid, '반출');

      const checkout = await this.findOne(uuid);

      if (checkout.status !== 'pending') {
        throw new BadRequestException('승인 전 반출만 취소할 수 있습니다.');
      }

      const updateData: Partial<Checkout> = {
        status: 'canceled' as CheckoutStatus,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(checkouts)
        .set(updateData as Record<string, unknown>)
        .where(eq(checkouts.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      await this.invalidateCache();
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
      if (existingCheckout.status !== 'pending') {
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

      const [updated] = await this.db
        .update(checkouts)
        .set(updateFields as Record<string, unknown>)
        .where(eq(checkouts.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`반출 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      await this.invalidateCache();
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
