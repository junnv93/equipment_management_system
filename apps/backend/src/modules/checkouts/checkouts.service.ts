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
    private readonly equipmentService: EquipmentService
  ) {}

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
   */
  async findOne(uuid: string): Promise<Checkout> {
    const cacheKey = this.buildCacheKey('detail', { uuid });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const checkout = await this.db.query.checkouts.findFirst({
            where: eq(checkouts.id, uuid),
            with: {
              items: {
                with: {
                  equipment: true,
                },
              },
            },
          });

          if (!checkout) {
            throw new NotFoundException(`UUID ${uuid}의 반출을 찾을 수 없습니다.`);
          }

          return checkout as unknown as Checkout;
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
   * 반출 생성
   * 장비 담당자만 신청 가능 (요구사항)
   */
  async create(createCheckoutDto: CreateCheckoutDto, requesterId: string): Promise<Checkout> {
    try {
      // 장비 존재 여부 및 사용 가능 여부 확인
      for (const equipmentId of createCheckoutDto.equipmentIds) {
        const equipment = await this.equipmentService.findOne(equipmentId);

        if (equipment.status !== 'available') {
          throw new BadRequestException(
            `장비 ${equipment.name}이(가) 현재 사용 가능한 상태가 아닙니다. 현재 상태: ${equipment.status}`
          );
        }
      }

      // 반입 예정일 검증
      const expectedReturnDate = new Date(createCheckoutDto.expectedReturnDate);
      if (expectedReturnDate <= new Date()) {
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
   */
  async approveFirst(uuid: string, approveDto: ApproveCheckoutDto): Promise<Checkout> {
    try {
      const checkout = await this.findOne(uuid);

      if (checkout.status !== 'pending') {
        throw new BadRequestException('대기 중인 반출만 승인할 수 있습니다.');
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
   */
  async approveFinal(uuid: string, approveDto: ApproveCheckoutDto): Promise<Checkout> {
    try {
      const checkout = await this.findOne(uuid);

      if (checkout.status !== 'first_approved') {
        throw new BadRequestException('1차 승인된 반출만 최종 승인할 수 있습니다.');
      }

      if (checkout.purpose !== 'external_rental') {
        throw new BadRequestException('외부 대여 목적 반출만 최종 승인이 필요합니다.');
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
   */
  async reject(uuid: string, rejectDto: RejectCheckoutDto): Promise<Checkout> {
    try {
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
   */
  async startCheckout(uuid: string): Promise<Checkout> {
    try {
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
   */
  async returnCheckout(
    uuid: string,
    returnDto: ReturnCheckoutDto,
    returnerId: string
  ): Promise<Checkout> {
    try {
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
   */
  async cancel(uuid: string): Promise<Checkout> {
    try {
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
   */
  async update(uuid: string, updateCheckoutDto: UpdateCheckoutDto): Promise<Checkout> {
    try {
      const existingCheckout = await this.findOne(uuid);

      // 승인된 반출은 수정 불가
      if (existingCheckout.status !== 'pending') {
        throw new BadRequestException('승인 전 반출만 수정할 수 있습니다.');
      }

      // 업데이트할 데이터 준비 (Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일)
      const updateFields: Partial<Checkout> = {
        updatedAt: new Date(),
      };

      if (updateCheckoutDto.expectedReturnDate !== undefined) {
        updateFields.expectedReturnDate = new Date(updateCheckoutDto.expectedReturnDate);
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
