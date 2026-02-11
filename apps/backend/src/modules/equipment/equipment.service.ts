import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
// 표준 상태값은 schemas 패키지에서 import
import {
  EquipmentStatus,
  parseManagementNumber,
  CLASSIFICATION_TO_CODE,
} from '@equipment-management/schemas';
import { CreateSharedEquipmentDto } from './dto/create-shared-equipment.dto';
import { eq, and, like, or, desc, asc, sql, SQL } from 'drizzle-orm';
import { equipment } from '@equipment-management/db/schema/equipment';
import { teams } from '@equipment-management/db/schema/teams';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import type { Equipment } from '@equipment-management/db/schema/equipment';
import type { Team } from '@equipment-management/db/schema/teams';
import { getUtcStartOfDay, getUtcEndOfDay, addDaysUtc, addMonthsUtc } from '../../common/utils';

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
 * 장비 목록 응답 인터페이스
 */
export interface EquipmentListResponse {
  items: Equipment[];
  meta: PaginationMeta;
}

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5분
  private readonly CACHE_PREFIX = 'equipment:';

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
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 교정일 계산 헬퍼 메서드
   * 다음 교정일 = 최종 교정일 + 교정 주기(개월)
   * ✅ UTC 기준 계산으로 타임존 문제 방지
   */
  private calculateNextCalibrationDate(
    lastCalibrationDate?: Date | string,
    calibrationCycle?: number
  ): Date | undefined {
    if (!lastCalibrationDate || !calibrationCycle) {
      return undefined;
    }

    const lastDate =
      typeof lastCalibrationDate === 'string' ? new Date(lastCalibrationDate) : lastCalibrationDate;

    // UTC 기준으로 개월수 더하기
    return addMonthsUtc(lastDate, calibrationCycle);
  }

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
        throw new BadRequestException(`calibrationDue는 숫자여야 합니다: ${calibrationDue}`);
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
        throw new BadRequestException(
          `calibrationDueAfter는 숫자여야 합니다: ${calibrationDueAfter}`
        );
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
      whereConditions.push(
        or(
          like(equipment.name, `%${search}%`),
          like(equipment.managementNumber, `%${search}%`),
          like(equipment.serialNumber, `%${search}%`),
          sql`${equipment.description} IS NOT NULL AND ${equipment.description} LIKE ${`%${search}%`}`
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
    const nextCalibrationDate = this.calculateNextCalibrationDate(
      dto.lastCalibrationDate,
      dto.calibrationCycle
    );

    // 관리번호 컴포넌트 파싱
    const managementNumberComponents = this.parseManagementNumberComponents(dto.managementNumber);

    // id (uuid)는 자동 생성됨
    const entity: Partial<Equipment> = {
      name: dto.name,
      managementNumber: dto.managementNumber,
      // 관리번호 컴포넌트 (파싱된 값 또는 DTO에서 직접 전달된 값)
      siteCode: dto.siteCode || managementNumberComponents.siteCode,
      classificationCode: dto.classificationCode || managementNumberComponents.classificationCode,
      managementSerialNumber:
        dto.managementSerialNumber || managementNumberComponents.managementSerialNumber,
      assetNumber: dto.assetNumber,
      modelName: dto.modelName,
      manufacturer: dto.manufacturer,
      serialNumber: dto.serialNumber,
      location: dto.location,
      calibrationCycle: dto.calibrationCycle,
      teamId,
      site: dto.site, // 사이트 필드 추가
      lastCalibrationDate: dto.lastCalibrationDate ? new Date(dto.lastCalibrationDate) : undefined,
      nextCalibrationDate,
      calibrationAgency: dto.calibrationAgency,
      needsIntermediateCheck: dto.needsIntermediateCheck ?? false,
      calibrationMethod: dto.calibrationMethod,
      manufacturerContact: dto.manufacturerContact,
      supplier: dto.supplier,
      contactInfo: dto.contactInfo,
      softwareVersion: dto.softwareVersion,
      firmwareVersion: dto.firmwareVersion,
      manualLocation: dto.manualLocation,
      accessories: dto.accessories,
      technicalManager: dto.technicalManager,
      status: dto.status ?? 'available',
      isActive: true,

      // 위치 및 설치 정보
      initialLocation: dto.initialLocation,
      installationDate: dto.installationDate ? new Date(dto.installationDate) : undefined,

      // 중간점검 정보
      lastIntermediateCheckDate: dto.lastIntermediateCheckDate
        ? new Date(dto.lastIntermediateCheckDate)
        : undefined,
      intermediateCheckCycle: dto.intermediateCheckCycle,
      nextIntermediateCheckDate: dto.nextIntermediateCheckDate
        ? new Date(dto.nextIntermediateCheckDate)
        : undefined,

      // 시방일치 여부 및 교정필요 여부
      specMatch: dto.specMatch,
      calibrationRequired: dto.calibrationRequired,

      // 승인 프로세스 필드
      approvalStatus: dto.approvalStatus ?? 'approved', // 시스템 관리자는 직접 승인 가능
      // requestedBy와 approvedBy는 승인 프로세스에서 별도로 설정됨

      // 교정 결과 및 보정계수
      calibrationResult: dto.calibrationResult,
      correctionFactor: dto.correctionFactor,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // description은 값이 있을 때만 추가
    if (dto.description !== undefined) {
      entity.description = dto.description;
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
      const nextCalibrationDate = this.calculateNextCalibrationDate(
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

    // 나머지 필드 업데이트 (undefined가 아닌 경우만)
    const fields: Array<keyof UpdateEquipmentDto> = [
      'name',
      'managementNumber',
      'assetNumber',
      'modelName',
      'manufacturer',
      'manufacturerContact',
      'serialNumber',
      'location',
      'description',
      'specMatch',
      'calibrationRequired',
      'calibrationCycle',
      'lastCalibrationDate',
      'calibrationAgency',
      'needsIntermediateCheck',
      'calibrationMethod',
      'lastIntermediateCheckDate',
      'intermediateCheckCycle',
      'nextIntermediateCheckDate',
      'supplier',
      'contactInfo',
      'softwareVersion',
      'firmwareVersion',
      'manualLocation',
      'accessories',
      'technicalManager',
      'initialLocation',
      'installationDate',
      'status',
      'site',
      'approvalStatus',
      // 관리번호 컴포넌트 필드 (개별 업데이트 허용)
      'siteCode',
      'classificationCode',
      'managementSerialNumber',
      // 'requestedBy', 'approvedBy'는 승인 프로세스에서 별도로 관리됨
      'calibrationResult',
      'correctionFactor',
    ];

    for (const field of fields) {
      if (dto[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = dto[field];
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
        throw new BadRequestException(
          `관리번호 ${createEquipmentDto.managementNumber}은(는) 이미 사용 중입니다.`
        );
      }

      // 사이트 필드 검증: 필수 필드
      if (!createEquipmentDto.site) {
        throw new BadRequestException('사이트 정보는 필수입니다.');
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
        throw new BadRequestException(
          `관리번호 ${createSharedEquipmentDto.managementNumber}은(는) 이미 사용 중입니다.`
        );
      }

      // 다음 교정일 계산
      const nextCalibrationDate = this.calculateNextCalibrationDate(
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
        status: 'available',
        isActive: true,
        approvalStatus: 'approved', // 공용장비는 바로 승인 상태
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
    const { page = 1, pageSize = 20 } = queryParams;

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

          // 총 아이템 수 계산
          // ✅ Best Practice: 모든 필터 파라미터를 자동으로 포함
          // - page/pageSize는 count에 영향 없으므로 제외
          const { page: _, pageSize: __, sort: ___, ...countParams } = queryParams;
          const countCacheKey = this.buildCacheKey('count', {
            ...countParams,
            userSite,
          });

          const totalItems = await this.cacheService.getOrSet(
            countCacheKey,
            async () => {
              const countResult = await this.db
                .select({ count: sql<number>`COUNT(*)` })
                .from(equipment)
                .where(and(...whereConditions));
              return Number(countResult[0]?.count || 0);
            },
            this.CACHE_TTL
          );

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
          };
        } catch (error) {
          this.logger.error(
            `장비 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      this.CACHE_TTL
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
            throw new NotFoundException(`UUID ${uuid}의 장비를 찾을 수 없습니다.`);
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
      this.CACHE_TTL
    );
  }

  /**
   * Optimistic Locking: CAS 패턴으로 장비 업데이트
   *
   * ✅ Phase 1: Equipment Module - 2026-02-11
   * ✅ 참고: checkouts.service.ts의 updateWithVersion() 패턴 재사용
   *
   * @param uuid - 장비 UUID
   * @param expectedVersion - 클라이언트가 알고 있는 version
   * @param updateData - 업데이트할 데이터
   * @returns 업데이트된 장비 (version이 1 증가됨)
   * @throws ConflictException - version 불일치 (다른 사용자가 먼저 수정함)
   * @throws NotFoundException - 장비가 존재하지 않음
   */
  private async updateWithVersion(
    uuid: string,
    expectedVersion: number,
    updateData: Partial<Equipment>
  ): Promise<Equipment> {
    const [updated] = await this.db
      .update(equipment)
      .set({
        ...updateData,
        version: sql`version + 1`, // ✅ Explicit SQL increment (no trigger)
        updatedAt: new Date(),
      } as Record<string, unknown>)
      .where(and(eq(equipment.id, uuid), eq(equipment.version, expectedVersion))) // ← CAS condition
      .returning();

    if (!updated) {
      // Check if equipment exists or version mismatch
      const [existing] = await this.db
        .select({ id: equipment.id, version: equipment.version })
        .from(equipment)
        .where(eq(equipment.id, uuid))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`장비 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // Version mismatch = concurrent modification
      throw new ConflictException({
        message: '다른 사용자가 이미 수정했습니다. 페이지가 자동으로 새로고침됩니다.',
        code: 'VERSION_CONFLICT',
        currentVersion: existing.version,
        expectedVersion,
      });
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
          throw new BadRequestException(
            `관리번호 ${updateEquipmentDto.managementNumber}은(는) 이미 사용 중입니다.`
          );
        }
      }

      // 상태 변경 시 교정 기한 검증 (UL-QP-18)
      if (updateEquipmentDto.status) {
        this.validateCalibrationStatusChange(existingEquipment, updateEquipmentDto.status);
      }

      // DTO를 DB 엔티티로 변환
      const updateData = this.transformUpdateDtoToEntity(updateEquipmentDto, existingEquipment);

      // ✅ Optimistic Locking: CAS 패턴으로 업데이트
      const updated = await this.updateWithVersion(uuid, updateEquipmentDto.version, updateData);

      // 캐시 무효화 (기존 팀 + 변경된 팀 모두 무효화)
      const affectedTeamId = existingEquipment.teamId ?? updateEquipmentDto.teamId;
      await this.invalidateCache(uuid, affectedTeamId ?? undefined);

      return updated;
    } catch (error) {
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
    // 팀 필터링이 없는 전체 목록도 무효화
    await this.cacheService.deleteByPattern(`${this.CACHE_PREFIX}(list|count):(?!.*teamId)`);
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
    if (newStatus !== 'available') {
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

      throw new BadRequestException(
        `교정 기한이 ${overdueDays}일 초과된 장비는 "사용 가능" 상태로 변경할 수 없습니다. ` +
          `교정 기록을 등록하여 차기 교정일을 갱신해주세요.`
      );
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
        throw new NotFoundException(`장비 UUID ${uuid}를 찾을 수 없습니다.`);
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

      let updated: Equipment;

      if (version !== undefined) {
        // ✅ 외부 API 호출: Optimistic Locking 사용
        updated = await this.updateWithVersion(uuid, version, updateData);
      } else {
        // ✅ 내부 호출: CAS 스킵 (트랜잭션 내에서 안전)
        const [result] = await this.db
          .update(equipment)
          .set({
            ...updateData,
            version: sql`version + 1`, // Still increment version for consistency
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(eq(equipment.id, uuid))
          .returning();

        if (!result) {
          throw new NotFoundException(`장비 UUID ${uuid}를 찾을 수 없습니다.`);
        }

        updated = result;
      }

      // 캐시 무효화 (상태 변경된 장비)
      await this.invalidateCache(uuid, updated.teamId ?? undefined);

      return updated;
    } catch (error) {
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
   * 팀별 장비 조회
   */
  async findByTeam(teamId: string): Promise<Equipment[]> {
    const normalizedTeamId = this.normalizeTeamId(teamId);
    if (normalizedTeamId === undefined) {
      return [];
    }

    const cacheKey = this.buildCacheKey('team', { teamId: normalizedTeamId });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          return await this.db.query.equipment.findMany({
            where: and(eq(equipment.teamId, normalizedTeamId), eq(equipment.isActive, true)),
          });
        } catch (error) {
          this.logger.error(
            `팀 장비 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      this.CACHE_TTL
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
          });
        } catch (error) {
          this.logger.error(
            `교정 예정 장비 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  /**
   * 장비의 팀 타입 조회
   * ✅ 스키마 일치화: Drizzle relations를 사용하여 간단하고 타입 안전하게 조회
   */
  async getEquipmentTeamType(equipmentId: string): Promise<string | null> {
    try {
      // ✅ relations를 사용하여 팀 정보 포함 조회
      const equipmentData = await this.findOne(equipmentId, true);

      // ✅ 간단하게 team?.type 접근 가능
      return equipmentData.team?.type || null;
    } catch (error) {
      this.logger.error(
        `장비 팀 타입 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
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
      this.CACHE_TTL
    );
  }
}
