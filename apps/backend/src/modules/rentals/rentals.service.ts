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
import { ApproveRentalDto } from './dto/approve-rental.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { LoanStatusEnum, LoanStatus } from '@equipment-management/schemas';
import { eq, and, like, gte, lte, or, desc, asc, sql, SQL, ne, isNull } from 'drizzle-orm';
import { loans } from '@equipment-management/db/schema/loans';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { EquipmentService } from '../equipment/equipment.service';
import { TeamsService } from '../teams/teams.service';
import { ForbiddenException } from '@nestjs/common';
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
export interface LoanListResponse {
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
    private readonly equipmentService: EquipmentService,
    private readonly teamsService: TeamsService
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
   * ✅ 일관성: db.select()를 사용하여 다른 쿼리와 동일한 패턴 유지
   */
  async findOne(uuid: string): Promise<Loan> {
    const cacheKey = this.buildCacheKey('detail', { uuid });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // ✅ 일관성: db.query 대신 db.select() 사용 (관계 쿼리 API 의존성 제거)
          const [loan] = await this.db.select().from(loans).where(eq(loans.id, uuid)).limit(1);

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
   * 팀별 권한 체크 헬퍼 메서드
   * EMC팀은 RF팀 장비 대여 신청/승인 불가 (같은 사이트 내에서도)
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

    // EMC팀은 RF팀 장비 대여 신청/승인 불가
    if (userTeamType === 'EMC') {
      try {
        // ✅ 스키마 일치화: EquipmentService를 사용하여 타입 안전하게 조회
        const equipmentData = await this.equipmentService.findOne(equipmentId, true);

        if (!equipmentData.teamId) {
          // 팀이 없으면 체크하지 않음
          return;
        }

        const equipmentTeamType = equipmentData.team?.type?.toUpperCase();

        // EMC팀은 RF팀 장비 대여 신청/승인 불가
        if (equipmentTeamType === 'RF') {
          throw new ForbiddenException('EMC팀은 RF팀 장비에 대한 대여 신청/승인 권한이 없습니다.');
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
   * 대여 생성
   * 장비 존재 여부 확인 및 대여 가능 여부 검증
   * ✅ 개선: startDate 선택 필드 처리, 날짜 검증 강화, 에러 처리 개선
   * ✅ 팀별 권한 체크 추가: EMC팀은 RF팀 장비 대여 신청 불가
   */
  /**
   * UUID 형식 검증 헬퍼 메서드
   * ✅ 재사용 가능한 유틸리티 함수로 분리
   */
  private validateUuid(uuid: string, fieldName: string): void {
    if (!uuid || typeof uuid !== 'string') {
      throw new BadRequestException(`${fieldName}는 필수이며 문자열이어야 합니다.`);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      throw new BadRequestException(`유효하지 않은 ${fieldName} UUID 형식입니다.`);
    }
  }

  async create(createRentalDto: CreateRentalDto, userTeamId?: string): Promise<Loan> {
    try {
      // ✅ UUID 형식 검증 (일관된 검증 로직)
      this.validateUuid(createRentalDto.equipmentId, '장비');
      this.validateUuid(createRentalDto.userId, '사용자');
      if (createRentalDto.approverId) {
        this.validateUuid(createRentalDto.approverId, '승인자');
      }

      // 장비 존재 여부 확인
      let equipment;
      try {
        equipment = await this.equipmentService.findOne(createRentalDto.equipmentId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException(
            `UUID ${createRentalDto.equipmentId}의 장비를 찾을 수 없습니다.`
          );
        }
        throw error;
      }

      // ✅ Equipment 객체의 uuid 필드 사용 (equipment.id는 serial이므로 UUID가 아님)
      // equipment.uuid는 이미 createRentalDto.equipmentId와 동일하므로 검증 완료

      // 부적합 장비 대여 차단
      if (equipment.status === 'non_conforming') {
        throw new BadRequestException(
          '부적합 상태의 장비는 대여할 수 없습니다. 부적합 처리가 완료된 후 대여 신청해주세요.'
        );
      }

      // 장비가 사용 가능한 상태인지 확인
      if (equipment.status !== 'available') {
        throw new BadRequestException(
          `장비가 현재 사용 가능한 상태가 아닙니다. 현재 상태: ${equipment.status}`
        );
      }

      // 팀별 권한 체크: EMC팀은 RF팀 장비 대여 신청 불가
      await this.checkTeamPermission(createRentalDto.equipmentId, userTeamId);

      // 날짜 처리 및 검증
      // startDate는 선택 필드이므로, 제공되지 않으면 현재 시점 또는 expectedEndDate 기준으로 계산
      const expectedReturnDate = new Date(createRentalDto.expectedEndDate);

      // expectedEndDate 유효성 검증
      if (isNaN(expectedReturnDate.getTime())) {
        throw new BadRequestException('유효하지 않은 반납 예정일 형식입니다.');
      }

      // startDate 처리: 제공되지 않으면 현재 시점 사용
      const startDate = createRentalDto.startDate
        ? new Date(createRentalDto.startDate)
        : new Date();

      // startDate 유효성 검증
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('유효하지 않은 시작일 형식입니다.');
      }

      // 대여 기간 검증
      if (startDate >= expectedReturnDate) {
        throw new BadRequestException('반납 예정일은 시작일보다 늦어야 합니다.');
      }

      // 미래 날짜 검증 (과거 날짜로 대여 신청 방지)
      const now = new Date();
      if (startDate < now) {
        throw new BadRequestException('시작일은 현재 시점 이후여야 합니다.');
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

      // ✅ 동일 팀 자동 승인 로직
      // 대여 신청자의 팀과 장비 소유 팀이 동일한 경우 자동 승인
      const isSameTeamRequest = await this.isSameTeam(createRentalDto.equipmentId, userTeamId);
      if (isSameTeamRequest && createRentalDto.userId) {
        this.logger.log(`동일 팀 대여 신청 자동 승인: loanId=${newLoan.id}`);
        const autoApprovedLoan = await this.approve(
          newLoan.id,
          createRentalDto.userId, // 신청자를 승인자로 설정
          userTeamId,
          { comment: '동일 팀 장비 대여 - 자동 승인' },
          true // isAutoApproved
        );
        return autoApprovedLoan;
      }

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
   * ✅ 개선: 날짜 null 처리 강화, 안전한 날짜 비교 로직
   */
  private async checkRentalConflict(
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    excludeLoanId?: string
  ): Promise<void> {
    try {
      // 날짜 유효성 검증
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('유효하지 않은 날짜 형식입니다.');
      }

      if (startDate >= endDate) {
        throw new BadRequestException('시작일은 종료일보다 이전이어야 합니다.');
      }

      const conflictConditions = [
        eq(loans.equipmentId, equipmentId),
        // 활성 상태의 대여만 확인 (반납 완료된 것은 제외)
        sql`${loans.status} IN ('pending', 'approved', 'active')`,
        // 날짜 범위가 겹치는지 확인
        // ✅ 개선: loanDate가 null인 경우와 아닌 경우를 안전하게 처리
        or(
          // loanDate가 있는 경우: 실제 대여 기간과 겹치는지 확인
          // (loanDate <= endDate) AND (expectedReturnDate >= startDate)
          and(
            sql`${loans.loanDate} IS NOT NULL`,
            lte(loans.loanDate, endDate),
            gte(loans.expectedReturnDate, startDate)
          ),
          // loanDate가 null인 경우 (pending/approved 상태): expectedReturnDate 기준으로 확인
          // expectedReturnDate >= startDate (예정된 반납일이 새 대여 시작일 이후)
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
      if (error instanceof ConflictException || error instanceof BadRequestException) {
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
      // ✅ 개선: 날짜 null 처리 및 유효성 검증 강화
      let startDate: Date;
      if (existingLoan.loanDate) {
        startDate = new Date(existingLoan.loanDate);
        if (isNaN(startDate.getTime())) {
          throw new BadRequestException('기존 대여 시작일이 유효하지 않습니다.');
        }
      } else {
        // loanDate가 없으면 현재 시점 또는 expectedReturnDate 기준으로 계산
        startDate = new Date();
      }

      const expectedReturnDate = updateRentalDto.expectedEndDate
        ? new Date(updateRentalDto.expectedEndDate)
        : new Date(existingLoan.expectedReturnDate);

      // 날짜 유효성 검증
      if (isNaN(expectedReturnDate.getTime())) {
        throw new BadRequestException('유효하지 않은 반납 예정일 형식입니다.');
      }

      // 대여 기간 검증
      if (startDate >= expectedReturnDate) {
        throw new BadRequestException('반납 예정일은 시작일보다 늦어야 합니다.');
      }

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
   * ✅ 팀별 권한 체크 추가: EMC팀은 RF팀 장비 대여 승인 불가
   * ✅ 승인자 코멘트 및 자동 승인 여부 필드 추가
   */
  async approve(
    uuid: string,
    approverId: string,
    approverTeamId?: string,
    approveDto?: ApproveRentalDto,
    isAutoApproved = false
  ): Promise<Loan> {
    try {
      const loan = await this.findOne(uuid);

      if (loan.status !== 'pending') {
        throw new BadRequestException('대기 중인 대여만 승인할 수 있습니다.');
      }

      // 팀별 권한 체크: 대여 장비에 대해 체크 (자동 승인이 아닌 경우만)
      if (!isAutoApproved) {
        await this.checkTeamPermission(loan.equipmentId, approverTeamId);
      }

      // 승인 처리
      const updateData: Partial<Loan> = {
        status: 'approved' as LoanStatus,
        approverId,
        approverComment: approveDto?.comment || null,
        autoApproved: isAutoApproved,
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
   * 동일 팀 여부 확인 (자동 승인용)
   * 신청자 팀과 장비 소유 팀이 동일한지 확인
   */
  private async isSameTeam(equipmentId: string, borrowerTeamId?: string): Promise<boolean> {
    if (!borrowerTeamId) {
      return false;
    }

    try {
      const equipment = await this.equipmentService.findOne(equipmentId, true);
      if (!equipment.teamId) {
        return false;
      }
      return equipment.teamId === borrowerTeamId;
    } catch (error) {
      this.logger.warn(
        `동일 팀 확인 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
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
