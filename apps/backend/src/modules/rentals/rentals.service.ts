import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { RentalQueryDto } from './dto/rental-query.dto';
import { ReturnRequestDto } from './dto/return-request.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { LoanStatusEnum, LoanStatus } from '@equipment-management/schemas';
import { eq, and, like, gte, lte, or, desc, asc, sql, SQL, ne, isNull } from 'drizzle-orm';
import { loans } from '@equipment-management/db/schema/loans';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { EquipmentService } from '../equipment/equipment.service';
// Drizzle에서 자동 추론되는 타입 사용
type Loan = typeof loans.$inferSelect;

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
 * 대여 목록 응답 인터페이스
 */
interface LoanListResponse {
  items: Loan[];
  meta: PaginationMeta;
}

@Injectable()
export class RentalsService {
  private readonly logger = new Logger(RentalsService.name);
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5분
  private readonly CACHE_PREFIX = 'rentals:';

  // 인덱스가 있는 필드 목록 (정렬 최적화용)
  private readonly INDEXED_FIELDS = [
    'status',
    'equipmentId',
    'borrowerId',
    'approverId',
    'loanDate',
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
    // 순환 참조 방지를 위해 안전하게 직렬화
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
   * findAll 메서드의 복잡한 쿼리 로직을 분리
   */
  private buildQueryConditions(queryParams: RentalQueryDto): QueryConditions {
    const {
      equipmentId,
      userId,
      approverId,
      statuses,
      startFrom,
      startTo,
      endFrom,
      endTo,
      search,
      sort,
    } = queryParams;

    const whereConditions: SQL<unknown>[] = [];

    // 인덱스를 활용할 수 있는 조건을 먼저 추가 (성능 최적화)
    if (equipmentId) {
      whereConditions.push(eq(loans.equipmentId, equipmentId));
    }

    if (userId) {
      whereConditions.push(eq(loans.borrowerId, userId));
    }

    if (approverId) {
      whereConditions.push(eq(loans.approverId, approverId));
    }

    // 상태 필터링
    if (statuses) {
      const statusArray = statuses.split(',').map((s) => s.trim());
      if (statusArray.length === 1) {
        whereConditions.push(eq(loans.status, statusArray[0] as LoanStatus));
      } else {
        // 여러 상태값은 OR 조건으로 처리
        const statusConditions = statusArray.map((status) =>
          eq(loans.status, status as LoanStatus)
        );
        whereConditions.push(or(...statusConditions));
      }
    }

    // 날짜 범위 필터링
    if (startFrom) {
      whereConditions.push(or(gte(loans.loanDate, new Date(startFrom)), isNull(loans.loanDate)));
    }

    if (startTo) {
      whereConditions.push(or(lte(loans.loanDate, new Date(startTo)), isNull(loans.loanDate)));
    }

    if (endFrom) {
      whereConditions.push(gte(loans.expectedReturnDate, new Date(endFrom)));
    }

    if (endTo) {
      whereConditions.push(lte(loans.expectedReturnDate, new Date(endTo)));
    }

    // 검색어 조건은 마지막에 추가 (인덱스 활용도가 낮음)
    if (search) {
      whereConditions.push(or(like(loans.notes, `%${search}%`)));
    }

    // 정렬 설정
    const orderBy: SQL<unknown>[] = [];
    if (sort) {
      const [field, direction] = sort.split('.');
      if (field && this.INDEXED_FIELDS.includes(field as (typeof this.INDEXED_FIELDS)[number])) {
        // 필드명에 따라 적절한 컬럼 참조 사용
        switch (field) {
          case 'status':
            orderBy.push(direction === 'asc' ? asc(loans.status) : desc(loans.status));
            break;
          case 'equipmentId':
            orderBy.push(direction === 'asc' ? asc(loans.equipmentId) : desc(loans.equipmentId));
            break;
          case 'borrowerId':
            orderBy.push(direction === 'asc' ? asc(loans.borrowerId) : desc(loans.borrowerId));
            break;
          case 'approverId':
            orderBy.push(direction === 'asc' ? asc(loans.approverId) : desc(loans.approverId));
            break;
          case 'loanDate':
            orderBy.push(direction === 'asc' ? asc(loans.loanDate) : desc(loans.loanDate));
            break;
          case 'expectedReturnDate':
            orderBy.push(
              direction === 'asc' ? asc(loans.expectedReturnDate) : desc(loans.expectedReturnDate)
            );
            break;
          case 'createdAt':
          default:
            orderBy.push(direction === 'asc' ? asc(loans.createdAt) : desc(loans.createdAt));
            break;
        }
      } else {
        // 인덱스가 없는 필드는 기본 정렬 사용
        orderBy.push(desc(loans.createdAt));
      }
    } else {
      // 기본 정렬: 생성일 내림차순 (최신순)
      orderBy.push(desc(loans.createdAt));
    }

    return { whereConditions, orderBy };
  }

  /**
   * 대여 목록 조회 (필터링, 정렬, 페이지네이션 지원)
   * ✅ Single Source of Truth: Zod 스키마가 타입 변환 및 검증을 모두 처리
   */
  async findAll(queryParams: RentalQueryDto): Promise<LoanListResponse> {
    const { page = 1, pageSize = 20 } = queryParams;

    // 캐시 키 생성
    const cacheKey = this.buildCacheKey('list', {
      equipmentId: queryParams.equipmentId,
      userId: queryParams.userId,
      approverId: queryParams.approverId,
      statuses: queryParams.statuses,
      startFrom: queryParams.startFrom,
      startTo: queryParams.startTo,
      endFrom: queryParams.endFrom,
      endTo: queryParams.endTo,
      search: queryParams.search,
      sort: queryParams.sort,
      page,
      pageSize,
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // 쿼리 조건 빌드
          const { whereConditions, orderBy } = this.buildQueryConditions(queryParams);

          // 총 아이템 수 계산
          const countCacheKey = this.buildCacheKey('count', {
            equipmentId: queryParams.equipmentId,
            userId: queryParams.userId,
            approverId: queryParams.approverId,
            statuses: queryParams.statuses,
            startFrom: queryParams.startFrom,
            startTo: queryParams.startTo,
            endFrom: queryParams.endFrom,
            endTo: queryParams.endTo,
            search: queryParams.search,
          });

          const totalItems = await this.cacheService.getOrSet(
            countCacheKey,
            async () => {
              const countResult = await this.db
                .select({ count: sql<number>`COUNT(*)` })
                .from(loans)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
              return Number(countResult[0]?.count || 0);
            },
            this.CACHE_TTL
          );

          // 페이지네이션 계산
          const totalPages = Math.ceil(totalItems / pageSize);
          const offset = (page - 1) * pageSize;
          const numericPageSize = Number(pageSize);
          const numericOffset = Number(offset);

          // 데이터 조회
          const finalOrderBy = orderBy.length > 0 ? orderBy : [desc(loans.createdAt)];
          const items = await this.db
            .select()
            .from(loans)
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
            `대여 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  /**
   * UUID로 대여 조회
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async findOne(uuid: string): Promise<Loan> {
    const cacheKey = this.buildCacheKey('detail', { uuid });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const loan = await this.db.query.loans.findFirst({
            where: eq(loans.id, uuid),
          });

          if (!loan) {
            throw new NotFoundException(`UUID ${uuid}의 대여를 찾을 수 없습니다.`);
          }

          return loan;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.logger.error(
            `대여 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  /**
   * 대여 생성
   * 장비 존재 여부 확인 및 대여 가능 여부 검증
   */
  async create(createRentalDto: CreateRentalDto): Promise<Loan> {
    try {
      // 장비 존재 여부 확인
      const equipment = await this.equipmentService.findOne(createRentalDto.equipmentId);

      // 장비가 사용 가능한 상태인지 확인
      if (equipment.status !== 'available') {
        throw new BadRequestException(
          `장비가 현재 사용 가능한 상태가 아닙니다. 현재 상태: ${equipment.status}`
        );
      }

      // 대여 기간 검증
      const startDate = new Date(createRentalDto.startDate);
      const expectedReturnDate = new Date(createRentalDto.expectedEndDate);

      if (startDate >= expectedReturnDate) {
        throw new BadRequestException('반납 예정일은 시작일보다 늦어야 합니다.');
      }

      // 기간 중복 확인 (동일 장비의 활성 대여와 겹치지 않는지)
      await this.checkRentalConflict(createRentalDto.equipmentId, startDate, expectedReturnDate);

      // 대여 데이터 생성
      const insertData = {
        equipmentId: createRentalDto.equipmentId,
        borrowerId: createRentalDto.userId,
        approverId: createRentalDto.approverId || null,
        status: 'pending' as LoanStatus,
        loanDate: null, // 승인 후 실제 대여 시작 시 설정
        expectedReturnDate,
        actualReturnDate: null,
        notes: createRentalDto.notes
          ? `${createRentalDto.purpose}\n${createRentalDto.notes}`
          : createRentalDto.purpose || null,
        rejectionReason: null,
      };

      // 데이터베이스에 삽입
      const [newLoan] = await this.db.insert(loans).values(insertData).returning();

      // 장비 상태를 'in_use'로 변경하지 않음 (승인 전이므로)
      // 승인 시 상태 변경 예정

      // 캐시 무효화
      await this.invalidateCache();

      return newLoan;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `대여 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 대여 기간 충돌 확인
   */
  private async checkRentalConflict(
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    excludeLoanId?: string
  ): Promise<void> {
    try {
      const conflictConditions = [
        eq(loans.equipmentId, equipmentId),
        // 활성 상태의 대여만 확인 (반납 완료된 것은 제외)
        sql`${loans.status} IN ('pending', 'approved', 'active')`,
        // 날짜 범위가 겹치는지 확인
        or(
          and(
            sql`${loans.loanDate} IS NOT NULL`,
            lte(loans.loanDate, endDate),
            gte(loans.expectedReturnDate, startDate)
          ),
          and(isNull(loans.loanDate), gte(loans.expectedReturnDate, startDate))
        ),
      ];

      // 제외할 대여 ID가 있으면 추가
      if (excludeLoanId) {
        conflictConditions.push(ne(loans.id, excludeLoanId));
      }

      const conflictingLoans = await this.db
        .select({ id: loans.id })
        .from(loans)
        .where(and(...conflictConditions));

      if (conflictingLoans.length > 0) {
        throw new ConflictException(
          '해당 장비는 선택한 기간에 이미 대여 예정이거나 대여 중입니다.'
        );
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `대여 충돌 확인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException('대여 충돌을 확인할 수 없습니다.');
    }
  }

  /**
   * UUID로 대여 업데이트
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async update(uuid: string, updateRentalDto: UpdateRentalDto): Promise<Loan> {
    try {
      // 대여 존재 여부 확인
      const existingLoan = await this.findOne(uuid);

      // 승인된 대여는 수정 불가
      if (existingLoan.status === 'active' || existingLoan.status === 'approved') {
        throw new BadRequestException('승인되거나 대여 중인 대여는 수정할 수 없습니다.');
      }

      // 날짜가 변경되었을 경우 충돌 검사
      const startDate = existingLoan.loanDate ? new Date(existingLoan.loanDate) : new Date(); // loanDate가 없으면 현재 시점 기준

      const expectedReturnDate = updateRentalDto.expectedEndDate
        ? new Date(updateRentalDto.expectedEndDate)
        : new Date(existingLoan.expectedReturnDate);

      // expectedEndDate가 변경된 경우에만 충돌 검사
      if (updateRentalDto.expectedEndDate) {
        await this.checkRentalConflict(
          existingLoan.equipmentId,
          startDate,
          expectedReturnDate,
          uuid
        );
      }

      // 업데이트할 데이터 준비 (Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일)
      const updateData: Partial<Loan> = {
        updatedAt: new Date(),
      };

      // 필드 업데이트 (undefined가 아닌 경우만)
      if (updateRentalDto.expectedEndDate !== undefined) {
        updateData.expectedReturnDate = new Date(updateRentalDto.expectedEndDate);
      }

      if (updateRentalDto.notes !== undefined) {
        updateData.notes = updateRentalDto.notes || null;
      }

      if (updateRentalDto.status !== undefined) {
        // 상태값 검증
        const status = updateRentalDto.status as LoanStatus;
        if (!LoanStatusEnum.safeParse(status).success) {
          throw new BadRequestException(`유효하지 않은 상태값: ${status}`);
        }
        updateData.status = status;
      }

      // 업데이트 수행 (Equipment 모듈과 동일한 패턴)
      const [updated] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 업데이트 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * UUID로 대여 삭제
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async remove(uuid: string): Promise<Loan> {
    try {
      // 대여 존재 여부 확인
      const existingLoan = await this.findOne(uuid);

      // 승인된 대여는 삭제 불가
      if (existingLoan.status === 'active' || existingLoan.status === 'approved') {
        throw new BadRequestException('승인되거나 대여 중인 대여는 삭제할 수 없습니다.');
      }

      // 소프트 삭제 대신 canceled 상태로 변경
      // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
      const updateData: Partial<Loan> = {
        status: 'canceled' as LoanStatus,
        updatedAt: new Date(),
      };

      const [deleted] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!deleted) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

      return deleted;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 삭제 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 대여 승인
   * 장비 소유 팀의 담당자 또는 매니저가 승인
   */
  async approve(uuid: string, approverId: string): Promise<Loan> {
    try {
      const loan = await this.findOne(uuid);

      if (loan.status !== 'pending') {
        throw new BadRequestException('대기 중인 대여만 승인할 수 있습니다.');
      }

      // 승인 처리
      const updateData: Partial<Loan> = {
        status: 'approved' as LoanStatus,
        approverId,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 장비 상태를 'in_use'로 변경하지 않음 (실제 대여 시작 시 변경)
      // loanDate가 설정되면 상태를 'active'로 변경 예정

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 승인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 대여 반려
   * 반려 사유 필수 (요구사항)
   */
  async reject(uuid: string, approverId: string, rejectionReason: string): Promise<Loan> {
    try {
      const loan = await this.findOne(uuid);

      if (loan.status !== 'pending') {
        throw new BadRequestException('대기 중인 대여만 반려할 수 있습니다.');
      }

      // 반려 사유 필수 검증
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new BadRequestException('반려 사유는 필수입니다.');
      }

      // 반려 처리
      const updateData: Partial<Loan> = {
        status: 'rejected' as LoanStatus,
        approverId,
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 반려 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 대여 취소
   * 승인 전 신청자만 취소 가능 (요구사항)
   */
  async cancel(uuid: string): Promise<Loan> {
    try {
      const loan = await this.findOne(uuid);

      // 승인 전 상태만 취소 가능
      if (loan.status !== 'pending') {
        throw new BadRequestException('승인 전 대여만 취소할 수 있습니다.');
      }

      // 취소 처리
      const updateData: Partial<Loan> = {
        status: 'canceled' as LoanStatus,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 취소 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 대여 완료 (반납)
   * 실제 반납 처리 및 장비 상태 복원
   */
  async complete(uuid: string): Promise<Loan> {
    try {
      const loan = await this.findOne(uuid);

      // 대여 중이거나 승인된 상태만 완료 가능
      if (loan.status !== 'active' && loan.status !== 'approved') {
        throw new BadRequestException('대여 중이거나 승인된 대여만 완료할 수 있습니다.');
      }

      // 완료 처리
      // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
      const updateData: Partial<Loan> = {
        status: 'returned' as LoanStatus,
        actualReturnDate: new Date(),
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 장비 상태를 'available'로 복원
      await this.equipmentService.updateStatus(loan.equipmentId, 'available');

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 완료 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 대여 시작 (실제 대여 시작 시 호출)
   * loanDate 설정 및 장비 상태를 'in_use'로 변경
   */
  async startRental(uuid: string): Promise<Loan> {
    try {
      const loan = await this.findOne(uuid);

      // 승인된 상태만 대여 시작 가능
      if (loan.status !== 'approved') {
        throw new BadRequestException('승인된 대여만 시작할 수 있습니다.');
      }

      // 대여 시작 처리
      const updateData: Partial<Loan> = {
        status: 'active' as LoanStatus,
        loanDate: new Date(),
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(loans)
        .set(updateData as Record<string, unknown>)
        .where(eq(loans.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`대여 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 장비 상태를 'in_use'로 변경
      await this.equipmentService.updateStatus(loan.equipmentId, 'in_use');

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `대여 시작 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 반납 요청
   * 사용자가 반납을 요청 (현재는 complete로 통합 가능)
   */
  async requestReturn(uuid: string, _returnRequestDto: ReturnRequestDto): Promise<Loan> {
    // 반납 요청은 바로 완료 처리로 통합
    // 필요시 별도 상태('return_requested') 추가 가능
    return this.complete(uuid);
  }

  /**
   * 반납 승인
   * 관리자가 반납을 승인 (현재는 complete로 통합)
   */
  async approveReturn(uuid: string): Promise<Loan> {
    // 반납 승인은 바로 완료 처리로 통합
    return this.complete(uuid);
  }
}
