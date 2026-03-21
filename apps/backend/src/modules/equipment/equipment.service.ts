import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
// 표준 상태값은 schemas 패키지에서 import
import {
  EquipmentStatus,
  EquipmentStatusEnum,
  EquipmentStatusValues as ESVal,
  ApprovalStatusEnum,
  ApprovalStatusValues,
  parseManagementNumber,
  CLASSIFICATION_TO_CODE,
} from '@equipment-management/schemas';
import { CreateSharedEquipmentDto } from './dto/create-shared-equipment.dto';
import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  SQL,
  inArray,
  notInArray,
  getTableColumns,
} from 'drizzle-orm';
import { equipment } from '@equipment-management/db/schema/equipment';
import { teams } from '@equipment-management/db/schema/teams';
import type { AppDatabase } from '@equipment-management/db';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import type { Equipment } from '@equipment-management/db/schema/equipment';
import type { Team } from '@equipment-management/db/schema/teams';
import {
  getUtcStartOfDay,
  getUtcEndOfDay,
  addDaysUtc,
  calculateNextCalibrationDate,
} from '../../common/utils';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import type { PaginationMeta } from '../../common/types/api-response';

/**
 * 쿼리 조건 빌더 인터페이스
 */
interface QueryConditions {
  whereConditions: SQL<unknown>[];
  orderBy: SQL<unknown>[];
}

/**
 * 장비 목록 응답 인터페이스
 */
export interface EquipmentListResponse {
  items: Equipment[];
  meta: PaginationMeta;
  /** 동일 필터 조건(status 제외)으로 집계한 상태별 장비 수 */
  summary: Record<string, number>;
}

/**
 * DB equipment 테이블의 유효 컬럼 이름 (SSOT: Drizzle 스키마에서 동적 추출)
 * DTO → Entity 변환 시, 이 Set에 없는 필드는 자동으로 무시됨.
 */
const EQUIPMENT_COLUMNS = new Set(Object.keys(getTableColumns(equipment)));

@Injectable()
export class EquipmentService extends VersionedBaseService {
  private readonly logger = new Logger(EquipmentService.name);
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.EQUIPMENT;

  // 인덱스가 있는 필드 목록 (정렬 최적화용)
  private readonly INDEXED_FIELDS = [
    'managementNumber',
    'status',
    'location',
    'manufacturer',
    'teamId',
    'managerId',
    'nextCalibrationDate',
    'modelName',
    'isActive',
    'name',
  ] as const;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
  }

  // calculateNextCalibrationDate → common/utils/date-utils.ts (SSOT)

  /**
   * TeamId 정규화 헬퍼 메서드
   * ✅ 스키마 일치화: 이제 teamId는 uuid(string) 타입이므로 정규화 불필요
   * 하지만 하위 호환성을 위해 유지 (string만 반환)
   */
  private normalizeTeamId(teamId?: string | number): string | undefined {
    if (teamId === undefined || teamId === null) {
      return undefined;
    }
    // uuid는 문자열이므로 문자열로 변환
    return typeof teamId === 'string' ? teamId : String(teamId);
  }

  /**
   * 캐시 키용 파라미터 정규화
   *
   * Best Practice: undefined/null/빈 문자열 제거하여 캐시 키를 일관되게 생성
   *
   * @param params 쿼리 파라미터 객체
   * @returns 정규화된 파라미터 객체
   */
  private normalizeCacheParams(params: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(params).reduce(
      (acc, [key, value]) => {
        // undefined, null, 빈 문자열 제거
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  /**
   * 캐시 키 생성 헬퍼 메서드
   *
   * Best Practice: 순환 참조 방지 + 결정론적 키 생성
   * - Object.keys().sort()로 키 순서 보장
   * - 정규화된 파라미터만 포함하여 불필요한 캐시 미스 방지
   */
  private buildCacheKey(suffix: string, params?: Record<string, unknown>): string {
    const baseKey = `${this.CACHE_PREFIX}${suffix}`;
    if (!params) {
      return baseKey;
    }

    // 정규화된 파라미터로 결정론적 키 생성
    const normalizedParams = this.normalizeCacheParams(params);

    // 키 순서를 보장하기 위해 정렬
    const sortedParams = Object.keys(normalizedParams)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = normalizedParams[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

    const safeParams = JSON.stringify(sortedParams);
    return `${baseKey}:${safeParams}`;
  }

  /**
   * 쿼리 조건 빌더
   * findAll 메서드의 복잡한 쿼리 로직을 분리
   */
  private buildQueryConditions(queryParams: EquipmentQueryDto, userSite?: string): QueryConditions {
    const {
      search,
      status,
      location,
      manufacturer,
      teamId,
      calibrationDue,
      calibrationDueAfter,
      calibrationOverdue,
      sort,
      site,
      isShared,
      calibrationMethod,
      classification,
      showRetired,
    } = queryParams;

    // 🔍 디버그: 교정 필터 파라미터 로깅
    if (
      calibrationDue !== undefined ||
      calibrationDueAfter !== undefined ||
      calibrationOverdue !== undefined
    ) {
      this.logger.log(
        `[CALIBRATION FILTER] calibrationDue=${calibrationDue} (type: ${typeof calibrationDue}), ` +
          `calibrationDueAfter=${calibrationDueAfter} (type: ${typeof calibrationDueAfter}), ` +
          `calibrationOverdue=${calibrationOverdue} (type: ${typeof calibrationOverdue})`
      );
    }

    const whereConditions: SQL<unknown>[] = [eq(equipment.isActive, true)];

    // 사이트 필터링: 쿼리 파라미터가 있으면 우선, 없으면 사용자 사이트로 필터링
    const siteFilter = site || userSite;
    if (siteFilter) {
      whereConditions.push(eq(equipment.site, siteFilter));
    }

    // 공용장비 필터 (isShared 인덱스 활용)
    if (isShared !== undefined) {
      whereConditions.push(eq(equipment.isShared, isShared));
    }

    // 인덱스를 활용할 수 있는 조건을 먼저 추가 (성능 최적화)
    if (status) {
      whereConditions.push(eq(equipment.status, status));
    }

    // 퇴역/폐기 장비 숨기기 (showRetired=false이고 특정 상태 필터가 없을 때)
    if (showRetired === false && !status) {
      whereConditions.push(notInArray(equipment.status, [ESVal.RETIRED, ESVal.DISPOSED]));
    }

    if (teamId) {
      const normalizedTeamId = this.normalizeTeamId(teamId);
      if (normalizedTeamId !== undefined) {
        whereConditions.push(eq(equipment.teamId, normalizedTeamId));
      }
    }

    if (location) {
      whereConditions.push(eq(equipment.location, location));
    }

    if (manufacturer) {
      whereConditions.push(eq(equipment.manufacturer, manufacturer));
    }

    // 교정 방법 필터
    if (calibrationMethod) {
      whereConditions.push(eq(equipment.calibrationMethod, calibrationMethod));
    }

    // 장비 분류 필터 (관리번호 분류코드 기준)
    if (classification) {
      const classificationCode = CLASSIFICATION_TO_CODE[classification];
      whereConditions.push(eq(equipment.classificationCode, classificationCode));
    }

    // 교정 예정일 필터 (복합 인덱스 활용)
    // ✅ 비즈니스 규칙: 반출 상태와 무관하게 교정일 기준으로 필터링
    // calibrationDue > 0: "교정 임박" - 오늘부터 N일 이내에 교정 예정
    // calibrationDue < 0: "교정 기한 초과" - 과거 날짜까지 포함
    // 반출 중인 장비도 포함 (타시험소에 반입 요청 또는 일정 관리 목적)
    // ✅ UTC 기준 날짜 비교로 타임존 문제 방지
    if (calibrationDue !== undefined) {
      // ✅ 쿼리 파라미터는 문자열로 전달되므로 명시적 숫자 변환
      const days = Number(calibrationDue);

      if (isNaN(days)) {
        throw new BadRequestException({
          code: 'EQUIPMENT_INVALID_CALIBRATION_DUE',
          message: `calibrationDue must be a number: ${calibrationDue}`,
        });
      }

      const today = getUtcStartOfDay(); // UTC 기준 오늘 00:00:00

      if (days >= 0) {
        // 양수: 오늘부터 N일 이내 (교정 임박)
        // 예: calibrationDue=30 → 오늘 00:00 <= nextCalibrationDate <= 오늘+30일 23:59:59
        const dueDate = getUtcEndOfDay(addDaysUtc(today, days));

        // ✅ Drizzle ORM의 Date 객체 처리 문제 해결: sql 템플릿으로 명시적 타임스탬프 변환
        whereConditions.push(
          and(
            sql`${equipment.nextCalibrationDate} IS NOT NULL`,
            sql`${equipment.nextCalibrationDate} >= ${today.toISOString()}::timestamp`,
            sql`${equipment.nextCalibrationDate} <= ${dueDate.toISOString()}::timestamp`
          )!
        );
      } else {
        // 음수: 오늘 이전 (교정 기한 초과)
        // 예: calibrationDue=-1 → nextCalibrationDate < 오늘 00:00
        whereConditions.push(
          and(
            sql`${equipment.nextCalibrationDate} IS NOT NULL`,
            sql`${equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`
          )!
        );
      }
    }

    // "교정 여유": calibrationDueAfter일 이후에 교정이 예정된 장비
    // 예: calibrationDueAfter=30 → nextCalibrationDate > 오늘+30일 23:59:59
    // ✅ UTC 기준 날짜 비교
    if (calibrationDueAfter !== undefined) {
      // ✅ 쿼리 파라미터는 문자열로 전달되므로 명시적 숫자 변환
      const afterDays = Number(calibrationDueAfter);

      if (isNaN(afterDays)) {
        throw new BadRequestException({
          code: 'EQUIPMENT_INVALID_CALIBRATION_DUE_AFTER',
          message: `calibrationDueAfter must be a number: ${calibrationDueAfter}`,
        });
      }

      const afterDate = getUtcEndOfDay(addDaysUtc(getUtcStartOfDay(), afterDays));

      whereConditions.push(
        and(
          sql`${equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${equipment.nextCalibrationDate} > ${afterDate.toISOString()}::timestamp` // calibrationDueAfter일 이후
        )!
      );
    }

    // 교정 기한 초과 필터 (독립적 필터 - status와 조합 가능)
    // ✅ Drizzle ORM의 Date 객체 처리 문제 해결: sql 템플릿으로 명시적 타임스탬프 변환
    // 📅 비즈니스 로직: 차기교정일이 오늘까지면 오늘까지는 유효 → 오늘 이전(<)만 초과
    if (calibrationOverdue !== undefined && calibrationOverdue === true) {
      const today = getUtcStartOfDay();
      whereConditions.push(
        and(
          sql`${equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`
        )!
      );
    }

    // 검색어 조건은 마지막에 추가 (인덱스 활용도가 낮음)
    if (search) {
      const pattern = likeContains(search);
      whereConditions.push(
        or(
          safeIlike(equipment.name, pattern),
          safeIlike(equipment.managementNumber, pattern),
          safeIlike(equipment.serialNumber, pattern),
          safeIlike(equipment.description, pattern)
        )!
      );
    }

    // 정렬 설정
    const orderBy: SQL<unknown>[] = [];
    if (sort) {
      const [field, direction] = sort.split('.');
      if (field && this.INDEXED_FIELDS.includes(field as (typeof this.INDEXED_FIELDS)[number])) {
        // 필드명에 따라 적절한 컬럼 참조 사용
        switch (field) {
          case 'managementNumber':
            orderBy.push(
              direction === 'asc'
                ? asc(equipment.managementNumber)
                : desc(equipment.managementNumber)
            );
            break;
          case 'status':
            orderBy.push(direction === 'asc' ? asc(equipment.status) : desc(equipment.status));
            break;
          case 'location':
            orderBy.push(direction === 'asc' ? asc(equipment.location) : desc(equipment.location));
            break;
          case 'manufacturer':
            orderBy.push(
              direction === 'asc' ? asc(equipment.manufacturer) : desc(equipment.manufacturer)
            );
            break;
          case 'teamId':
            orderBy.push(direction === 'asc' ? asc(equipment.teamId) : desc(equipment.teamId));
            break;
          case 'managerId':
            orderBy.push(
              direction === 'asc' ? asc(equipment.managerId) : desc(equipment.managerId)
            );
            break;
          case 'nextCalibrationDate':
            orderBy.push(
              direction === 'asc'
                ? asc(equipment.nextCalibrationDate)
                : desc(equipment.nextCalibrationDate)
            );
            break;
          case 'modelName':
            orderBy.push(
              direction === 'asc' ? asc(equipment.modelName) : desc(equipment.modelName)
            );
            break;
          case 'isActive':
            orderBy.push(direction === 'asc' ? asc(equipment.isActive) : desc(equipment.isActive));
            break;
          case 'name':
            orderBy.push(direction === 'asc' ? asc(equipment.name) : desc(equipment.name));
            break;
          default:
            orderBy.push(asc(equipment.managementNumber));
            break;
        }
      } else {
        // 인덱스가 없는 필드는 기본 정렬 사용
        orderBy.push(asc(equipment.managementNumber));
      }
    } else {
      // 기본 정렬: 관리번호 오름차순 (unique 인덱스 있음)
      orderBy.push(asc(equipment.managementNumber));
    }

    return { whereConditions, orderBy };
  }

  /**
   * 관리번호 컴포넌트 파싱 헬퍼 메서드
   * 관리번호에서 시험소코드, 분류코드, 일련번호를 추출하여 개별 필드에 설정
   */
  private parseManagementNumberComponents(managementNumber: string): {
    siteCode?: string;
    classificationCode?: string;
    managementSerialNumber?: number;
  } {
    const parsed = parseManagementNumber(managementNumber);
    if (!parsed) {
      return {};
    }
    return {
      siteCode: parsed.siteCode,
      classificationCode: parsed.classificationCode,
      managementSerialNumber: parseInt(parsed.serialNumber, 10),
    };
  }

  /**
   * DTO를 DB 엔티티로 변환 (생성용)
   */
  private transformCreateDtoToEntity(dto: CreateEquipmentDto): Partial<Equipment> {
    const teamId = this.normalizeTeamId(dto.teamId);
    const nextCalibrationDate = calculateNextCalibrationDate(
      dto.lastCalibrationDate,
      dto.calibrationCycle
    );

    // 관리번호 컴포넌트 파싱
    const managementNumberComponents = this.parseManagementNumberComponents(dto.managementNumber);

    // 특수 처리 필드: 기본값, 파싱, 정규화가 필요한 필드만 명시
    const entity: Partial<Equipment> = {
      // 관리번호 컴포넌트 (DTO 직접 전달 > 관리번호에서 파싱)
      siteCode: dto.siteCode || managementNumberComponents.siteCode,
      classificationCode: dto.classificationCode || managementNumberComponents.classificationCode,
      managementSerialNumber:
        dto.managementSerialNumber || managementNumberComponents.managementSerialNumber,
      // 정규화/기본값
      teamId,
      nextCalibrationDate,
      needsIntermediateCheck: dto.needsIntermediateCheck ?? false,
      status: dto.status ?? EquipmentStatusEnum.enum.available,
      isActive: true,
      approvalStatus: dto.approvalStatus ?? ApprovalStatusValues.APPROVED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 나머지: DB 컬럼에 존재하는 DTO 필드를 자동 매핑 (SSOT: EQUIPMENT_COLUMNS)
    const CUSTOM_HANDLED = new Set<string>([
      'teamId',
      'siteCode',
      'classificationCode',
      'managementSerialNumber',
      'nextCalibrationDate',
      'needsIntermediateCheck',
      'status',
      'isActive',
      'approvalStatus',
      'version',
      'id',
      'createdAt',
      'updatedAt',
    ]);

    for (const [key, value] of Object.entries(dto)) {
      if (
        value !== undefined &&
        EQUIPMENT_COLUMNS.has(key) &&
        !CUSTOM_HANDLED.has(key) &&
        !(key in entity)
      ) {
        (entity as Record<string, unknown>)[key] = value;
      }
    }

    return entity;
  }

  /**
   * DTO를 DB 엔티티로 변환 (업데이트용)
   */
  private transformUpdateDtoToEntity(
    dto: UpdateEquipmentDto,
    existingEquipment: Equipment
  ): Partial<Equipment> {
    const updateData: Partial<Equipment> = {
      updatedAt: new Date(),
    };

    // 교정일 재계산이 필요한 경우
    const lastCalibrationDate = dto.lastCalibrationDate ?? existingEquipment.lastCalibrationDate;
    const calibrationCycle = dto.calibrationCycle ?? existingEquipment.calibrationCycle;

    if (
      lastCalibrationDate &&
      calibrationCycle &&
      (dto.lastCalibrationDate !== undefined || dto.calibrationCycle !== undefined)
    ) {
      const nextCalibrationDate = calculateNextCalibrationDate(
        lastCalibrationDate,
        calibrationCycle
      );
      if (nextCalibrationDate !== existingEquipment.nextCalibrationDate) {
        updateData.nextCalibrationDate = nextCalibrationDate;
      }
    }

    // TeamId 정규화
    if (dto.teamId !== undefined) {
      updateData.teamId = this.normalizeTeamId(dto.teamId);
    }

    // 관리번호 변경 시 컴포넌트도 재파싱
    if (dto.managementNumber && dto.managementNumber !== existingEquipment.managementNumber) {
      const components = this.parseManagementNumberComponents(dto.managementNumber);
      if (components.siteCode) updateData.siteCode = components.siteCode;
      if (components.classificationCode)
        updateData.classificationCode = components.classificationCode;
      if (components.managementSerialNumber)
        updateData.managementSerialNumber = components.managementSerialNumber;
    }

    // 나머지 필드: DB 컬럼에 존재하는 필드만 자동 매핑 (SSOT: EQUIPMENT_COLUMNS)
    // - DB에 없는 DTO 필드(classification, managementSerialNumberStr 등)는 자동 제외
    // - 위에서 이미 처리된 필드(teamId, nextCalibrationDate 등)는 덮어쓰지 않음
    const CUSTOM_HANDLED = new Set<string>([
      'teamId', // normalizeTeamId()로 별도 처리
      'version', // CAS — updateWithVersion이 관리
      'id', // PK 변경 불가
      'createdAt', // 생성 시점 고정
    ]);

    for (const [key, value] of Object.entries(dto)) {
      if (
        value !== undefined &&
        EQUIPMENT_COLUMNS.has(key) &&
        !CUSTOM_HANDLED.has(key) &&
        !(key in updateData)
      ) {
        (updateData as Record<string, unknown>)[key] = value;
      }
    }

    return updateData;
  }

  /**
   * 관리번호 중복 검사
   *
   * 실시간으로 관리번호 사용 가능 여부를 확인합니다.
   * 수정 시에는 현재 장비 ID를 제외하고 검사합니다.
   *
   * @param managementNumber - 검사할 관리번호
   * @param excludeId - 제외할 장비 ID (수정 시 현재 장비)
   * @returns 사용 가능 여부와 메시지
   */
  async checkManagementNumberAvailability(
    managementNumber: string,
    excludeId?: string
  ): Promise<{
    available: boolean;
    message: string;
    existingEquipment?: { id: string; name: string; managementNumber: string };
  }> {
    // 관리번호로 기존 장비 검색
    const existingEquipment = await this.db.query.equipment.findFirst({
      where: eq(equipment.managementNumber, managementNumber),
      columns: {
        id: true,
        name: true,
        managementNumber: true,
      },
    });

    // 중복 장비가 없으면 사용 가능
    if (!existingEquipment) {
      return {
        available: true,
        message: '사용 가능한 관리번호입니다.',
      };
    }

    // 수정 모드에서 자기 자신인 경우 사용 가능
    if (excludeId && existingEquipment.id === excludeId) {
      return {
        available: true,
        message: '현재 장비의 관리번호입니다.',
      };
    }

    // 중복 - 사용 불가
    return {
      available: false,
      message: `관리번호 '${managementNumber}'은(는) 이미 '${existingEquipment.name}' 장비에서 사용 중입니다.`,
      existingEquipment: {
        id: existingEquipment.id,
        name: existingEquipment.name,
        managementNumber: existingEquipment.managementNumber,
      },
    };
  }

  /**
   * 장비 생성
   * 관리번호 중복 검사 후 새 장비 생성
   */
  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    try {
      // 관리번호 중복 확인
      const existingEquipment = await this.db.query.equipment.findFirst({
        where: eq(equipment.managementNumber, createEquipmentDto.managementNumber),
      });

      if (existingEquipment) {
        throw new BadRequestException({
          code: 'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE',
          message: `Management number ${createEquipmentDto.managementNumber} is already in use.`,
        });
      }

      // 사이트 필드 검증: 필수 필드
      if (!createEquipmentDto.site) {
        throw new BadRequestException({
          code: 'EQUIPMENT_SITE_REQUIRED',
          message: 'Site information is required.',
        });
      }

      // DTO를 DB 엔티티로 변환
      const insertData = this.transformCreateDtoToEntity(createEquipmentDto);

      // 데이터베이스에 삽입
      const [newEquipment] = await this.db
        .insert(equipment)
        .values(insertData as typeof equipment.$inferInsert)
        .returning();

      // 캐시 무효화 (신규 장비이므로 teamId 기반 선택적 무효화)
      await this.invalidateCache(newEquipment.id, newEquipment.teamId ?? undefined);

      return newEquipment;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `장비 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 공용장비 생성
   * 최소 필수 정보만으로 공용장비를 등록합니다.
   * 공용장비는 isShared = true로 설정됩니다.
   */
  async createShared(createSharedEquipmentDto: CreateSharedEquipmentDto): Promise<Equipment> {
    try {
      // 관리번호 중복 확인
      const existingEquipment = await this.db.query.equipment.findFirst({
        where: eq(equipment.managementNumber, createSharedEquipmentDto.managementNumber),
      });

      if (existingEquipment) {
        throw new BadRequestException({
          code: 'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE',
          message: `Management number ${createSharedEquipmentDto.managementNumber} is already in use.`,
        });
      }

      // 다음 교정일 계산
      const nextCalibrationDate = calculateNextCalibrationDate(
        createSharedEquipmentDto.lastCalibrationDate,
        createSharedEquipmentDto.calibrationCycle
      );

      // 공용장비 데이터 구성 (id는 자동 생성됨)
      const insertData: Partial<Equipment> = {
        name: createSharedEquipmentDto.name,
        managementNumber: createSharedEquipmentDto.managementNumber,
        site: createSharedEquipmentDto.site,
        modelName: createSharedEquipmentDto.modelName,
        manufacturer: createSharedEquipmentDto.manufacturer,
        serialNumber: createSharedEquipmentDto.serialNumber,
        location: createSharedEquipmentDto.location,
        description: createSharedEquipmentDto.description,
        calibrationCycle: createSharedEquipmentDto.calibrationCycle,
        lastCalibrationDate: createSharedEquipmentDto.lastCalibrationDate
          ? new Date(createSharedEquipmentDto.lastCalibrationDate)
          : undefined,
        nextCalibrationDate,
        calibrationAgency: createSharedEquipmentDto.calibrationAgency,
        calibrationMethod: createSharedEquipmentDto.calibrationMethod,
        // 공용장비 필드 설정
        isShared: true,
        sharedSource: createSharedEquipmentDto.sharedSource,
        // 기본값 설정
        status: EquipmentStatusEnum.enum.available,
        isActive: true,
        approvalStatus: ApprovalStatusEnum.enum.approved, // 공용장비는 바로 승인 상태
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 데이터베이스에 삽입
      const [newEquipment] = await this.db
        .insert(equipment)
        .values(insertData as typeof equipment.$inferInsert)
        .returning();

      // 캐시 무효화 (공용장비 생성)
      await this.invalidateCache(newEquipment.id, newEquipment.teamId ?? undefined);

      return newEquipment;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `공용장비 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 장비 목록 조회 (필터링, 정렬, 페이지네이션 지원)
   *
   * ✅ SSOT Principles:
   * - Zod 스키마가 타입 변환 및 검증을 모두 처리
   * - queryParams 객체가 유일한 필터 소스 (수동 필드 나열 금지)
   * - 캐시 키 자동 생성으로 휴먼 에러 방지
   *
   * ✅ Best Practices:
   * - 캐시 키에 모든 파라미터 자동 포함 (새 필터 추가 시 수동 작업 불필요)
   * - normalizeCacheParams()로 undefined/null 제거하여 일관된 캐시 키 생성
   * - 정렬된 키로 결정론적 캐시 히트 보장
   *
   * @param queryParams 쿼리 파라미터
   * @param userSite 사용자 사이트 (시험실무자는 자신의 사이트만 조회)
   */
  async findAll(queryParams: EquipmentQueryDto, userSite?: string): Promise<EquipmentListResponse> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = queryParams;

    // 캐시 키 생성
    // ✅ Best Practice: 모든 쿼리 파라미터를 자동으로 포함 (SSOT)
    // - 새 필터 추가 시 수동으로 캐시 키에 추가할 필요 없음
    // - normalizeCacheParams()가 undefined/null/빈 문자열 자동 제거
    // - 휴먼 에러 방지 및 유지보수성 향상
    const cacheKey = this.buildCacheKey('list', {
      ...queryParams,
      userSite, // 사용자 사이트도 캐시 키에 포함 (역할별 필터링)
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // 쿼리 조건 빌드
          const { whereConditions, orderBy } = this.buildQueryConditions(queryParams, userSite);

          // 상태별 카운트 조건: status 필터만 제외한 WHERE 조건 재구축
          // 동일한 site/teamId/search/classification 등 필터를 적용하되
          // status 조건만 빼서 GROUP BY status로 전체 분포를 조회
          const {
            status: _excludeStatus,
            page: _,
            pageSize: __,
            sort: ___,
            ...baseParams
          } = queryParams;
          const { whereConditions: statusCountWhere } = this.buildQueryConditions(
            { ...baseParams } as EquipmentQueryDto,
            userSite
          );

          // 총 아이템 수 + 상태별 카운트 병렬 조회
          const { page: _p, pageSize: _ps, sort: _s, ...countParams } = queryParams;
          const countCacheKey = this.buildCacheKey('count', {
            ...countParams,
            userSite,
          });

          const statusCountCacheKey = this.buildCacheKey('statusCounts', {
            ...baseParams,
            userSite,
          });

          const [totalItems, summary] = await Promise.all([
            // 총 아이템 수 계산 — 페이지 간 공유 캐시
            this.cacheService.getOrSet(
              countCacheKey,
              async () => {
                const countResult = await this.db
                  .select({ count: sql<number>`COUNT(*)` })
                  .from(equipment)
                  .where(and(...whereConditions));
                return Number(countResult[0]?.count || 0);
              },
              CACHE_TTL.LONG
            ),
            // 상태별 카운트 — status 필터 제외, 나머지 필터 동일
            this.cacheService.getOrSet(
              statusCountCacheKey,
              async () => {
                const statusResults = await this.db
                  .select({
                    status: equipment.status,
                    count: sql<number>`cast(count(*) as integer)`,
                  })
                  .from(equipment)
                  .where(and(...statusCountWhere))
                  .groupBy(equipment.status);

                const counts: Record<string, number> = {};
                statusResults.forEach((r) => {
                  if (r.status) counts[r.status] = r.count;
                });
                return counts;
              },
              CACHE_TTL.LONG
            ),
          ]);

          // 페이지네이션 계산
          const totalPages = Math.ceil(totalItems / pageSize);
          const offset = (page - 1) * pageSize;
          const numericPageSize = Number(pageSize);
          const numericOffset = Number(offset);

          // 디버깅: 테스트 환경에서 쿼리 파라미터 로깅
          if (process.env.NODE_ENV === 'test') {
            this.logger.debug(
              `Pagination params: pageSize=${numericPageSize}, offset=${numericOffset}, totalItems=${totalItems}`
            );
          }

          // 데이터 조회 (팀 이름 포함을 위해 LEFT JOIN 사용)
          const finalOrderBy = orderBy.length > 0 ? orderBy : [asc(equipment.name)];

          // ✅ 장비 목록 조회 후 팀 이름 추가
          const rawItems = await this.db
            .select()
            .from(equipment)
            .where(and(...whereConditions))
            .orderBy(...finalOrderBy)
            .limit(numericPageSize)
            .offset(numericOffset);

          // 팀 ID 목록 추출 (중복 제거)
          const teamIds = [
            ...new Set(rawItems.filter((item) => item.teamId).map((item) => item.teamId as string)),
          ];

          // 팀 정보 일괄 조회 (N+1 쿼리 방지)
          let teamMap: Map<string, string> = new Map();
          if (teamIds.length > 0) {
            const teamData = await this.db
              .select({ id: teams.id, name: teams.name })
              .from(teams)
              .where(
                sql`${teams.id} IN (${sql.join(
                  teamIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              );
            teamMap = new Map(teamData.map((t) => [t.id, t.name]));
          }

          // 장비 데이터에 팀 이름 추가
          const items = rawItems.map((item) => ({
            ...item,
            teamName: item.teamId ? teamMap.get(item.teamId) || null : null,
          }));

          // 디버깅: 테스트 환경에서 실제 반환된 아이템 수 로깅
          if (process.env.NODE_ENV === 'test') {
            this.logger.debug(
              `Query returned ${items.length} items (expected max ${numericPageSize})`
            );
          }

          return {
            items,
            meta: {
              totalItems,
              itemCount: items.length,
              itemsPerPage: numericPageSize,
              totalPages,
              currentPage: Number(page),
            },
            summary,
          };
        } catch (error) {
          this.logger.error(
            `장비 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * UUID로 장비 조회
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   * 내부 id는 데이터베이스 내부에서만 사용
   * ✅ 스키마 일치화: Drizzle relations를 사용하여 타입 안전한 조인
   */
  async findOne(uuid: string, includeTeam = false): Promise<Equipment & { team?: Team | null }> {
    const cacheKey = this.buildCacheKey('detail', { uuid, includeTeam });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // 소프트 삭제된 항목은 제외 (isActive = true만 조회)
          // ✅ Drizzle relations 사용 (CAST 불필요)
          const equipmentData = await this.db.query.equipment.findFirst({
            where: and(eq(equipment.id, uuid), eq(equipment.isActive, true)),
            with: includeTeam ? { team: true } : undefined,
          });

          if (!equipmentData) {
            throw new NotFoundException({
              code: 'EQUIPMENT_NOT_FOUND',
              message: `Equipment with UUID ${uuid} not found.`,
            });
          }

          return equipmentData;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.logger.error(
            `장비 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 여러 장비를 배치 조회 (캐시 우선 + 미스만 DB 조회)
   *
   * @param uuids 장비 UUID 배열
   * @param includeTeam 팀 정보 포함 여부
   * @returns Map<uuid, Equipment & { team?: Team | null }>
   * @throws BadRequestException 존재하지 않는 장비가 포함된 경우
   */
  async findByIds(
    uuids: string[],
    includeTeam = false
  ): Promise<Map<string, Equipment & { team?: Team | null }>> {
    const result = new Map<string, Equipment & { team?: Team | null }>();
    const missedUuids: string[] = [];

    // 1. 캐시 히트 확인
    for (const uuid of uuids) {
      const cacheKey = this.buildCacheKey('detail', { uuid, includeTeam });
      const cached = this.cacheService.get<Equipment & { team?: Team | null }>(cacheKey);
      if (cached) {
        result.set(uuid, cached);
      } else {
        missedUuids.push(uuid);
      }
    }

    // 2. 캐시 미스만 배치 DB 조회
    if (missedUuids.length > 0) {
      const query = includeTeam
        ? this.db
            .select()
            .from(equipment)
            .leftJoin(teams, eq(equipment.teamId, teams.id))
            .where(and(inArray(equipment.id, missedUuids), eq(equipment.isActive, true)))
        : this.db
            .select()
            .from(equipment)
            .where(and(inArray(equipment.id, missedUuids), eq(equipment.isActive, true)));

      const rows = await query;

      for (const row of rows) {
        const equipData = includeTeam
          ? {
              ...(row as { equipment: Equipment; teams: Team | null }).equipment,
              team: (row as { equipment: Equipment; teams: Team | null }).teams,
            }
          : (row as unknown as Equipment);
        const uuid = includeTeam
          ? (row as { equipment: Equipment }).equipment.id
          : (row as unknown as Equipment).id;

        result.set(uuid, equipData);

        // 개별 캐시에 set
        const cacheKey = this.buildCacheKey('detail', { uuid, includeTeam });
        this.cacheService.set(cacheKey, equipData, CACHE_TTL.LONG);
      }

      // 존재하지 않는 장비 확인
      for (const uuid of missedUuids) {
        if (!result.has(uuid)) {
          throw new BadRequestException({
            code: 'EQUIPMENT_NOT_FOUND',
            message: `Equipment with UUID ${uuid} not found.`,
          });
        }
      }
    }

    return result;
  }

  /**
   * 여러 장비의 상태를 배치 업데이트
   * 스케줄러의 inArray 패턴 재사용
   *
   * @param uuids 장비 UUID 배열
   * @param newStatus 변경할 상태
   * @param expectedStatus 현재 상태 조건 (선택 — 지정 시 해당 상태인 장비만 업데이트)
   * @returns 업데이트된 장비의 { id, teamId } 배열
   */
  async updateStatusBatch(
    uuids: string[],
    newStatus: EquipmentStatus,
    expectedStatus?: EquipmentStatus,
    tx?: AppDatabase
  ): Promise<Array<{ id: string; teamId: string | null }>> {
    if (uuids.length === 0) return [];

    const executor = tx ?? this.db;

    const whereConditions = [inArray(equipment.id, uuids), eq(equipment.isActive, true)];
    if (expectedStatus) {
      whereConditions.push(eq(equipment.status, expectedStatus));
    }

    const updated = await executor
      .update(equipment)
      .set({
        status: newStatus,
        version: sql`version + 1`,
        updatedAt: new Date(),
      } as Record<string, unknown>)
      .where(and(...whereConditions))
      .returning({ id: equipment.id, teamId: equipment.teamId });

    // 캐시 무효화 (트랜잭션 외부에서 실행해도 안전 — 최악의 경우 cache miss)
    for (const row of updated) {
      await this.invalidateCache(row.id, row.teamId ?? undefined);
    }

    return updated;
  }

  /**
   * UUID로 장비 업데이트
   *
   * ✅ Phase 1: Equipment Module - 2026-02-11
   * ✅ Optimistic Locking: updateWithVersion() 사용
   *
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async update(uuid: string, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
    try {
      // 장비 존재 여부 확인
      const existingEquipment = await this.findOne(uuid);

      // 관리번호 수정 시 중복 확인
      if (
        updateEquipmentDto.managementNumber &&
        updateEquipmentDto.managementNumber !== existingEquipment.managementNumber
      ) {
        const duplicateCheck = await this.db.query.equipment.findFirst({
          where: eq(equipment.managementNumber, updateEquipmentDto.managementNumber),
        });

        if (duplicateCheck) {
          throw new BadRequestException({
            code: 'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE',
            message: `Management number ${updateEquipmentDto.managementNumber} is already in use.`,
          });
        }
      }

      // 상태 변경 시 교정 기한 검증 (UL-QP-18)
      if (updateEquipmentDto.status) {
        this.validateCalibrationStatusChange(existingEquipment, updateEquipmentDto.status);
      }

      // DTO를 DB 엔티티로 변환
      const updateData = this.transformUpdateDtoToEntity(updateEquipmentDto, existingEquipment);

      // ✅ Optimistic Locking: CAS 패턴으로 업데이트 (VersionedBaseService)
      const updated = await this.updateWithVersion<Equipment>(
        equipment,
        uuid,
        updateEquipmentDto.version,
        updateData as Record<string, unknown>,
        '장비',
        undefined,
        'EQUIPMENT_NOT_FOUND'
      );

      // 캐시 무효화 (기존 팀 + 변경된 팀 모두 무효화)
      const affectedTeamId = existingEquipment.teamId ?? updateEquipmentDto.teamId;
      await this.invalidateCache(uuid, affectedTeamId ?? undefined);

      return updated;
    } catch (error) {
      if (error instanceof ConflictException) {
        // ✅ Cache coherence: CAS 실패 시 stale cache 제거
        // findOne 캐시가 stale version을 가지고 있으면 재시도도 계속 409
        await this.cacheService.delete(this.buildCacheKey('detail', { uuid }));
        await this.cacheService.delete(this.buildCacheKey('detail', { uuid, includeTeam: true }));
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `장비 업데이트 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 캐시 무효화 헬퍼 메서드
   *
   * @param equipmentId - 특정 장비 ID (detail 캐시 무효화)
   * @param teamId - 영향받는 팀 ID (선택적 무효화)
   */
  private async invalidateCache(equipmentId?: string, teamId?: string): Promise<void> {
    // 개별 장비 detail 캐시 무효화
    if (equipmentId) {
      await this.cacheService.delete(this.buildCacheKey('detail', { uuid: equipmentId }));
      await this.cacheService.delete(
        this.buildCacheKey('detail', { uuid: equipmentId, includeTeam: true })
      );
    }

    if (teamId) {
      // 선택적 무효화: 해당 팀 관련 목록 캐시만 삭제
      await this.cacheService.deleteByPattern(`${this.CACHE_PREFIX}.*"teamId":"${teamId}".*`);
      // 팀 전용 캐시 삭제
      await this.cacheService.delete(this.buildCacheKey('team', { teamId }));
    }

    // 전체 집계/필터 없는 캐시는 항상 무효화 (calibration, all-ids 등)
    await this.cacheService.deleteByPattern(`${this.CACHE_PREFIX}(calibration|all-ids)`);
    // 팀 필터링이 없는 전체 목록/카운트도 무효화
    await this.cacheService.deleteByPattern(
      `${this.CACHE_PREFIX}(list|count|statusCounts):(?!.*teamId)`
    );
  }

  /**
   * 공개 캐시 무효화 메서드 (E2E 테스트용)
   * Controller에서 호출할 수 있도록 public으로 노출
   */
  async invalidateCachePublic(): Promise<void> {
    await this.invalidateCache();
    this.logger.log('Equipment cache invalidated via API endpoint');
  }

  /**
   * 교정 기한 초과 장비의 "사용 가능" 상태 변경 검증
   *
   * UL-QP-18 비즈니스 규칙:
   * - 교정 필요 장비가 교정 기한이 초과된 경우, "사용 가능" 상태로 변경 불가
   * - 교정 기록을 등록하여 차기 교정일을 갱신해야만 "사용 가능" 상태로 변경 가능
   *
   * @param existingEquipment 기존 장비 정보
   * @param newStatus 변경하려는 상태
   * @throws BadRequestException 교정 기한 초과 장비를 "사용 가능"으로 변경 시도할 때
   */
  private validateCalibrationStatusChange(
    existingEquipment: Equipment,
    newStatus: EquipmentStatus
  ): void {
    // "사용 가능"으로 변경하는 경우에만 검증
    if (newStatus !== EquipmentStatusEnum.enum.available) {
      return;
    }

    // 교정 필요 장비가 아니면 검증 불필요
    if (!existingEquipment.calibrationRequired) {
      return;
    }

    // 교정 방법이 "해당 없음"이면 검증 불필요
    if (existingEquipment.calibrationMethod === 'not_applicable') {
      return;
    }

    // 차기 교정일이 없으면 검증 불필요 (아직 교정 계획이 없는 신규 장비)
    if (!existingEquipment.nextCalibrationDate) {
      return;
    }

    // 교정 기한 초과 여부 확인 (UTC 기준)
    const today = getUtcStartOfDay();
    const nextCalibrationDate = getUtcStartOfDay(new Date(existingEquipment.nextCalibrationDate));

    if (nextCalibrationDate < today) {
      const diffTime = today.getTime() - nextCalibrationDate.getTime();
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      throw new BadRequestException({
        code: 'EQUIPMENT_CALIBRATION_OVERDUE_STATUS_BLOCK',
        message: `Equipment overdue by ${overdueDays} day(s) cannot be changed to "available" status. Please register a calibration record to update the next calibration date.`,
      });
    }
  }

  /**
   * UUID로 장비 삭제 (소프트 삭제)
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async remove(uuid: string): Promise<Equipment> {
    try {
      // 소프트 삭제 (isActive = false)
      // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
      const updateData: Partial<Equipment> = {
        isActive: false,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(equipment)
        .set(updateData as Record<string, unknown>)
        .where(eq(equipment.id, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: `Equipment with UUID ${uuid} not found.`,
        });
      }

      // 캐시 무효화 (삭제된 장비)
      await this.invalidateCache(uuid, updated.teamId ?? undefined);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `장비 삭제 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * UUID로 장비 상태 업데이트
   *
   * ✅ Phase 1: Equipment Module - 2026-02-11
   * ✅ Optimistic Locking: updateWithVersion() 사용 (외부 API 호출 시)
   * ✅ 내부 호출: version 없이 호출 가능 (CAS 스킵)
   *
   * @param uuid - 장비 UUID
   * @param status - 변경할 상태
   * @param version - Optimistic locking version (선택사항: 내부 호출 시 생략 가능)
   *
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async updateStatus(uuid: string, status: EquipmentStatus, version?: number): Promise<Equipment> {
    try {
      // 기존 장비 조회 (교정 상태 검증을 위해)
      const existingEquipment = await this.findOne(uuid);

      // 상태 변경 시 교정 기한 검증 (UL-QP-18)
      this.validateCalibrationStatusChange(existingEquipment, status);

      // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
      const updateData: Partial<Equipment> = {
        status,
      };

      // ✅ CAS 보호: 외부/내부 호출 모두 VersionedBaseService 사용
      const effectiveVersion = version ?? existingEquipment.version;
      const updated = await this.updateWithVersion<Equipment>(
        equipment,
        uuid,
        effectiveVersion,
        updateData as Record<string, unknown>,
        '장비',
        undefined,
        'EQUIPMENT_NOT_FOUND'
      );

      // 캐시 무효화 (상태 변경된 장비)
      await this.invalidateCache(uuid, updated.teamId ?? undefined);

      return updated;
    } catch (error) {
      if (error instanceof ConflictException) {
        // ✅ Cache coherence: CAS 실패 시 stale cache 제거
        await this.cacheService.delete(this.buildCacheKey('detail', { uuid }));
        await this.cacheService.delete(this.buildCacheKey('detail', { uuid, includeTeam: true }));
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `장비 상태 업데이트 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * 팀별 장비 조회 (페이지네이션 지원)
   */
  async findByTeam(
    teamId: string,
    page = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Promise<{
    items: Equipment[];
    meta: PaginationMeta;
  }> {
    const normalizedTeamId = this.normalizeTeamId(teamId);
    if (normalizedTeamId === undefined) {
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: pageSize,
          totalPages: 0,
          currentPage: page,
        },
      };
    }

    const cacheKey = this.buildCacheKey('team', { teamId: normalizedTeamId, page, pageSize });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const whereClause = and(
            eq(equipment.teamId, normalizedTeamId),
            eq(equipment.isActive, true)
          );

          const [{ count: totalItems }] = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(equipment)
            .where(whereClause);

          const total = Number(totalItems || 0);
          const totalPages = Math.ceil(total / pageSize);
          const offset = (page - 1) * pageSize;

          const items = await this.db.query.equipment.findMany({
            where: whereClause,
            limit: pageSize,
            offset,
          });

          return {
            items,
            meta: {
              totalItems: total,
              itemCount: items.length,
              itemsPerPage: pageSize,
              totalPages,
              currentPage: page,
            },
          };
        } catch (error) {
          this.logger.error(
            `팀 장비 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 교정 예정 장비 조회
   * ✅ UTC 기준 날짜 비교
   */
  async findCalibrationDue(days: number): Promise<Equipment[]> {
    const cacheKey = this.buildCacheKey('calibration', { days });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const today = getUtcStartOfDay();
          const dueDate = getUtcEndOfDay(addDaysUtc(today, days));

          // ✅ Drizzle ORM의 Date 객체 처리 문제 해결: sql 템플릿으로 명시적 타임스탬프 변환
          return await this.db.query.equipment.findMany({
            where: and(
              eq(equipment.isActive, true),
              sql`${equipment.nextCalibrationDate} IS NOT NULL`,
              sql`${equipment.nextCalibrationDate} <= ${dueDate.toISOString()}::timestamp`
            ),
            orderBy: asc(equipment.nextCalibrationDate),
            limit: 500,
          });
        } catch (error) {
          this.logger.error(
            `교정 예정 장비 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 장비의 팀 분류 조회
   * ✅ 스키마 일치화: Drizzle relations를 사용하여 간단하고 타입 안전하게 조회
   * ✅ SSOT: classification (소문자_언더스코어)
   */
  async getEquipmentTeamType(equipmentId: string): Promise<string | null> {
    try {
      // ✅ relations를 사용하여 팀 정보 포함 조회
      const equipmentData = await this.findOne(equipmentId, true);

      // ✅ 간단하게 team?.classification 접근 가능
      return equipmentData.team?.classification || null;
    } catch (error) {
      this.logger.error(
        `장비 팀 분류 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * 모든 활성 장비의 UUID 목록 조회
   */
  async findAllEquipmentIds(): Promise<string[]> {
    const cacheKey = this.buildCacheKey('all-ids');

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const result = await this.db
            .select({ id: equipment.id })
            .from(equipment)
            .where(eq(equipment.isActive, true));

          return result.map((item) => item.id);
        } catch (error) {
          this.logger.error(
            `장비 ID 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }
}
