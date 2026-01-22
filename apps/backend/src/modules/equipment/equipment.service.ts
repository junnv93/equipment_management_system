import { Injectable, NotFoundException, Inject, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
// 표준 상태값은 schemas 패키지에서 import
import { EquipmentStatus, SharedSource } from '@equipment-management/schemas';
import { CreateSharedEquipmentDto } from './dto/create-shared-equipment.dto';
import { eq, and, like, lte, or, desc, asc, sql, SQL } from 'drizzle-orm';
import { equipment } from '@equipment-management/db/schema/equipment';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import type { Equipment } from '@equipment-management/db/schema/equipment';

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

    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + calibrationCycle);
    return nextDate;
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
   * 쿼리 조건 빌더
   * findAll 메서드의 복잡한 쿼리 로직을 분리
   */
  private buildQueryConditions(queryParams: EquipmentQueryDto, userSite?: string): QueryConditions {
    const { search, status, location, manufacturer, teamId, calibrationDue, sort, site, isShared } =
      queryParams;

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

    // 교정 예정일 필터 (복합 인덱스 활용)
    if (calibrationDue !== undefined) {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + calibrationDue);

      whereConditions.push(
        and(
          sql`${equipment.nextCalibrationDate} IS NOT NULL`,
          lte(equipment.nextCalibrationDate, dueDate)
        )
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
        )
      );
    }

    // 정렬 설정
    const orderBy: SQL<unknown>[] = [];
    if (sort) {
      const [field, direction] = sort.split('.');
      if (field && this.INDEXED_FIELDS.includes(field as (typeof this.INDEXED_FIELDS)[number])) {
        // 필드명에 따라 적절한 컬럼 참조 사용
        switch (field) {
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
          default:
            orderBy.push(direction === 'asc' ? asc(equipment.name) : desc(equipment.name));
            break;
        }
      } else {
        // 인덱스가 없는 필드는 기본 정렬 사용
        orderBy.push(asc(equipment.name));
      }
    } else {
      // 기본 정렬: 이름 오름차순 (인덱스 있음)
      orderBy.push(asc(equipment.name));
    }

    return { whereConditions, orderBy };
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

    const entity: Partial<Equipment> = {
      uuid: uuidv4(),
      name: dto.name,
      managementNumber: dto.managementNumber,
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

      // 캐시 무효화
      await this.invalidateCache();

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

      // 공용장비 데이터 구성
      const insertData: Partial<Equipment> = {
        uuid: uuidv4(),
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

      // 캐시 무효화
      await this.invalidateCache();

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
   * ✅ Single Source of Truth: Zod 스키마가 타입 변환 및 검증을 모두 처리
   * @param queryParams 쿼리 파라미터
   * @param userSite 사용자 사이트 (시험실무자는 자신의 사이트만 조회)
   */
  async findAll(queryParams: EquipmentQueryDto, userSite?: string): Promise<EquipmentListResponse> {
    const { page = 1, pageSize = 20 } = queryParams;

    // 캐시 키 생성
    const cacheKey = this.buildCacheKey('list', {
      search: queryParams.search,
      status: queryParams.status,
      location: queryParams.location,
      manufacturer: queryParams.manufacturer,
      teamId: queryParams.teamId,
      calibrationDue: queryParams.calibrationDue,
      site: queryParams.site, // ✅ 사이트 필터 캐시 키에 포함
      isShared: queryParams.isShared, // ✅ 공용장비 필터 캐시 키에 포함
      sort: queryParams.sort,
      page,
      pageSize,
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // 쿼리 조건 빌드
          const { whereConditions, orderBy } = this.buildQueryConditions(queryParams, userSite);

          // 총 아이템 수 계산
          const countCacheKey = this.buildCacheKey('count', {
            search: queryParams.search,
            status: queryParams.status,
            location: queryParams.location,
            manufacturer: queryParams.manufacturer,
            teamId: queryParams.teamId,
            calibrationDue: queryParams.calibrationDue,
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

          // 데이터 조회
          const finalOrderBy = orderBy.length > 0 ? orderBy : [asc(equipment.name)];
          const items = await this.db
            .select()
            .from(equipment)
            .where(and(...whereConditions))
            .orderBy(...finalOrderBy)
            .limit(numericPageSize)
            .offset(numericOffset);

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
  async findOne(uuid: string, includeTeam = false): Promise<Equipment & { team?: any }> {
    const cacheKey = this.buildCacheKey('detail', { uuid, includeTeam });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // 소프트 삭제된 항목은 제외 (isActive = true만 조회)
          // ✅ Drizzle relations 사용 (CAST 불필요)
          const equipmentData = await this.db.query.equipment.findFirst({
            where: and(eq(equipment.uuid, uuid), eq(equipment.isActive, true)),
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
   * UUID로 장비 업데이트
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

      // DTO를 DB 엔티티로 변환
      const updateData = this.transformUpdateDtoToEntity(updateEquipmentDto, existingEquipment);

      // 업데이트 수행
      const [updated] = await this.db
        .update(equipment)
        .set(updateData)
        .where(eq(equipment.uuid, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`장비 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
   */
  private async invalidateCache(): Promise<void> {
    await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
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
        .where(eq(equipment.uuid, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`장비 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

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
   * API 표준: 모든 리소스 식별자는 uuid로 통일
   */
  async updateStatus(uuid: string, status: EquipmentStatus): Promise<Equipment> {
    try {
      // Equipment 모듈의 transformUpdateDtoToEntity 패턴과 동일하게 처리
      const updateData: Partial<Equipment> = {
        status,
        updatedAt: new Date(),
      };

      const [updated] = await this.db
        .update(equipment)
        .set(updateData as Record<string, unknown>)
        .where(eq(equipment.uuid, uuid))
        .returning();

      if (!updated) {
        throw new NotFoundException(`장비 UUID ${uuid}를 찾을 수 없습니다.`);
      }

      // 캐시 무효화
      await this.invalidateCache();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
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
   */
  async findCalibrationDue(days: number): Promise<Equipment[]> {
    const cacheKey = this.buildCacheKey('calibration', { days });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + days);

          return await this.db.query.equipment.findMany({
            where: and(
              eq(equipment.isActive, true),
              sql`${equipment.nextCalibrationDate} IS NOT NULL`,
              lte(equipment.nextCalibrationDate, dueDate)
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
            .select({ id: equipment.uuid })
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
