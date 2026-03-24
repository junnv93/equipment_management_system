import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, asc, desc, sql, isNull, or, lte, gte } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { calibrationFactors, CalibrationFactor, equipment } from '@equipment-management/db/schema';
import { CreateCalibrationFactorDto } from './dto/create-calibration-factor.dto';
import { CalibrationFactorQueryDto } from './dto/calibration-factor-query.dto';
import {
  ApproveCalibrationFactorDto,
  RejectCalibrationFactorDto,
} from './dto/approve-calibration-factor.dto';
import { CalibrationFactorApprovalStatusValues } from '@equipment-management/schemas';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CacheInvalidationHelper } from '../../common/cache/cache-invalidation.helper';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';

const CalibrationFactorApprovalStatus = CalibrationFactorApprovalStatusValues;

// 컨트롤러 하위 호환성을 위한 인터페이스 (decimal → number, jsonb → typed)
export interface CalibrationFactorRecord {
  id: string;
  equipmentId: string;
  calibrationId: string | null;
  factorType: string;
  factorName: string;
  factorValue: number;
  unit: string;
  parameters: Record<string, unknown> | null;
  effectiveDate: string;
  expiryDate: string | null;
  approvalStatus: string;
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: Date;
  approvedAt: Date | null;
  approverComment: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class CalibrationFactorsService extends VersionedBaseService {
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.CALIBRATION_FACTORS;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  private buildCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  /**
   * Drizzle CalibrationFactor → CalibrationFactorRecord 변환
   * - decimal factorValue: string → number
   * - jsonb parameters: unknown → Record<string, unknown>
   */
  private normalize(record: CalibrationFactor): CalibrationFactorRecord {
    return {
      ...record,
      factorValue: Number(record.factorValue),
      parameters: record.parameters as Record<string, unknown> | null,
    };
  }

  // 보정계수 변경 요청 (상태: pending)
  async create(
    createDto: CreateCalibrationFactorDto,
    requestedBy: string
  ): Promise<CalibrationFactorRecord> {
    const [newFactor] = await this.db
      .insert(calibrationFactors)
      .values({
        equipmentId: createDto.equipmentId,
        calibrationId: createDto.calibrationId || null,
        factorType: createDto.factorType,
        factorName: createDto.factorName,
        factorValue: String(createDto.factorValue),
        unit: createDto.unit,
        parameters: createDto.parameters || null,
        effectiveDate: createDto.effectiveDate,
        expiryDate: createDto.expiryDate || null,
        requestedBy,
      })
      .returning();

    this.cacheService.deleteByPattern(this.CACHE_PREFIX);

    return this.normalize(newFactor);
  }

  // 보정계수 목록 조회 (필터: equipmentId, approvalStatus)
  async findAll(query: CalibrationFactorQueryDto): Promise<{
    items: CalibrationFactorRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const {
      equipmentId,
      approvalStatus,
      factorType,
      search,
      site,
      teamId,
      sort = 'effectiveDate.desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const cacheKey = this.buildCacheKey(
      'list',
      `${equipmentId ?? ''}_${approvalStatus ?? ''}_${factorType ?? ''}_${search ?? ''}_${site ?? ''}_${teamId ?? ''}_${sort}_${page}_${pageSize}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions = [isNull(calibrationFactors.deletedAt)];
        if (equipmentId) conditions.push(eq(calibrationFactors.equipmentId, equipmentId));
        if (approvalStatus) conditions.push(eq(calibrationFactors.approvalStatus, approvalStatus));
        if (factorType) conditions.push(eq(calibrationFactors.factorType, factorType));
        if (search) conditions.push(safeIlike(calibrationFactors.factorName, likeContains(search)));
        // JOIN 기반 사이트/팀 필터 (correlated subquery 대신 — 성능 개선)
        const needsEquipmentJoin = !!site || !!teamId;
        if (site) conditions.push(eq(equipment.site, site));
        if (teamId) conditions.push(eq(equipment.teamId, teamId));

        const [sortField, sortOrder] = sort.split('.');
        const sortColumn =
          sortField === 'effectiveDate'
            ? calibrationFactors.effectiveDate
            : sortField === 'requestedAt'
              ? calibrationFactors.requestedAt
              : calibrationFactors.createdAt;
        const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

        const baseQuery = needsEquipmentJoin
          ? this.db
              .select()
              .from(calibrationFactors)
              .innerJoin(equipment, eq(calibrationFactors.equipmentId, equipment.id))
          : this.db.select().from(calibrationFactors);
        const countBaseQuery = needsEquipmentJoin
          ? this.db
              .select({ count: sql<number>`count(*)` })
              .from(calibrationFactors)
              .innerJoin(equipment, eq(calibrationFactors.equipmentId, equipment.id))
          : this.db.select({ count: sql<number>`count(*)` }).from(calibrationFactors);

        const [rows, [{ count }]] = await Promise.all([
          baseQuery
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(pageSize)
            .offset((page - 1) * pageSize),
          countBaseQuery.where(and(...conditions)),
        ]);

        // JOIN 시 { calibration_factors, equipment } 구조로 반환되므로 정규화
        const items = rows.map((row: Record<string, unknown>) =>
          'calibration_factors' in row
            ? (row as { calibration_factors: CalibrationFactor }).calibration_factors
            : (row as CalibrationFactor)
        );

        const totalItems = Number(count);
        return {
          items: items.map(this.normalize.bind(this)),
          meta: {
            totalItems,
            itemCount: items.length,
            itemsPerPage: pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page,
          },
        };
      },
      CACHE_TTL.LONG
    );
  }

  // 단일 보정계수 조회 (cache-aside)
  async findOne(id: string): Promise<CalibrationFactorRecord> {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [factor] = await this.db
          .select()
          .from(calibrationFactors)
          .where(and(eq(calibrationFactors.id, id), isNull(calibrationFactors.deletedAt)))
          .limit(1);

        if (!factor) {
          throw new NotFoundException({
            code: 'CALIBRATION_FACTOR_NOT_FOUND',
            message: `Calibration factor ID ${id} not found.`,
          });
        }

        return this.normalize(factor);
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 보정계수의 사이트 및 팀 조회 (calibration_factors → equipment 경유)
   * 크로스사이트/크로스팀 접근 제어에 사용
   */
  async getFactorSiteAndTeam(
    equipmentId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!result) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment ${equipmentId} not found.`,
      });
    }

    return { site: result.site, teamId: result.teamId };
  }

  // 장비별 현재 적용 중인 보정계수 조회 (승인됨 + 유효 기간 내)
  async findByEquipment(equipmentUuid: string): Promise<{
    equipmentId: string;
    factors: CalibrationFactorRecord[];
    count: number;
  }> {
    const cacheKey = `${this.CACHE_PREFIX}equipment:${equipmentUuid}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date().toISOString().split('T')[0];

        const records = await this.db
          .select()
          .from(calibrationFactors)
          .where(
            and(
              eq(calibrationFactors.equipmentId, equipmentUuid),
              eq(calibrationFactors.approvalStatus, CalibrationFactorApprovalStatus.APPROVED),
              isNull(calibrationFactors.deletedAt),
              lte(calibrationFactors.effectiveDate, today),
              or(isNull(calibrationFactors.expiryDate), gte(calibrationFactors.expiryDate, today))
            )
          );

        const factors = records.map(this.normalize.bind(this));
        return { equipmentId: equipmentUuid, factors, count: factors.length };
      },
      CACHE_TTL.LONG
    );
  }

  // 보정계수 대장 조회 (전체 장비의 현재 보정계수)
  async getRegistry(
    site?: string,
    teamId?: string
  ): Promise<{
    registry: {
      equipmentId: string;
      factors: CalibrationFactorRecord[];
      factorCount: number;
    }[];
    totalEquipments: number;
    totalFactors: number;
    generatedAt: Date;
  }> {
    const cacheKey = this.buildCacheKey('registry', `${site || 'all'}_${teamId || 'all'}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date().toISOString().split('T')[0];

        const conditions = [
          eq(calibrationFactors.approvalStatus, CalibrationFactorApprovalStatus.APPROVED),
          isNull(calibrationFactors.deletedAt),
          lte(calibrationFactors.effectiveDate, today),
          or(isNull(calibrationFactors.expiryDate), gte(calibrationFactors.expiryDate, today))!,
        ];
        // JOIN 기반 사이트/팀 필터 (correlated subquery 대신 — 성능 개선)
        const needsEquipmentJoin = !!site || !!teamId;
        if (site) conditions.push(eq(equipment.site, site));
        if (teamId) conditions.push(eq(equipment.teamId, teamId));

        const query = needsEquipmentJoin
          ? this.db
              .select()
              .from(calibrationFactors)
              .innerJoin(equipment, eq(calibrationFactors.equipmentId, equipment.id))
          : this.db.select().from(calibrationFactors);

        const rows = await query.where(and(...conditions));

        // JOIN 시 { calibration_factors, equipment } 구조로 반환되므로 정규화
        const records = rows.map((row: Record<string, unknown>) =>
          'calibration_factors' in row
            ? (row as { calibration_factors: CalibrationFactor }).calibration_factors
            : (row as CalibrationFactor)
        );

        const normalized = records.map(this.normalize.bind(this));
        const grouped = new Map<string, CalibrationFactorRecord[]>();
        for (const factor of normalized) {
          const existing = grouped.get(factor.equipmentId) ?? [];
          existing.push(factor);
          grouped.set(factor.equipmentId, existing);
        }

        return {
          registry: Array.from(grouped.entries()).map(([equipmentId, factors]) => ({
            equipmentId,
            factors,
            factorCount: factors.length,
          })),
          totalEquipments: grouped.size,
          totalFactors: normalized.length,
          generatedAt: new Date(),
        };
      },
      CACHE_TTL.VERY_LONG
    );
  }

  // 승인 대기 목록 조회
  async findPendingApprovals(
    site?: string,
    teamId?: string
  ): Promise<{
    items: CalibrationFactorRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.findAll({
      approvalStatus: CalibrationFactorApprovalStatus.PENDING,
      site,
      teamId,
    } as CalibrationFactorQueryDto);
  }

  // 보정계수 승인 (기술책임자) — CAS 적용
  async approve(
    id: string,
    approveDto: ApproveCalibrationFactorDto & { approverId: string }
  ): Promise<CalibrationFactorRecord> {
    const factor = await this.findOne(id);

    if (factor.approvalStatus !== CalibrationFactorApprovalStatus.PENDING) {
      throw new BadRequestException({
        code: 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_APPROVE',
        message: 'Only pending calibration factors can be approved.',
      });
    }

    let updated: CalibrationFactor;
    try {
      updated = await this.updateWithVersion<CalibrationFactor>(
        calibrationFactors,
        id,
        approveDto.version,
        {
          approvalStatus: CalibrationFactorApprovalStatus.APPROVED,
          approvedBy: approveDto.approverId,
          approvedAt: new Date(),
          approverComment: approveDto.approverComment,
        },
        '보정계수'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.cacheService.delete(this.buildCacheKey('detail', id));
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + 'registry:');
    this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.APPROVALS);
    await this.cacheInvalidationHelper.invalidateAllDashboard();

    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_FACTOR_APPROVED, {
      factorId: id,
      equipmentId: factor.equipmentId,
      actorId: approveDto.approverId,
      actorName: '',
      timestamp: new Date(),
    });

    return this.normalize(updated);
  }

  // 보정계수 반려 (기술책임자) — CAS 적용
  async reject(
    id: string,
    rejectDto: RejectCalibrationFactorDto & { approverId: string }
  ): Promise<CalibrationFactorRecord> {
    const factor = await this.findOne(id);

    if (factor.approvalStatus !== CalibrationFactorApprovalStatus.PENDING) {
      throw new BadRequestException({
        code: 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_REJECT',
        message: 'Only pending calibration factors can be rejected.',
      });
    }

    // calibration 모듈 패턴 통일: 반려 시 approvedBy=null 유지
    // 반려 사유는 approverComment에 저장 (DB에 rejectionReason 컬럼 없음)
    let updated: CalibrationFactor;
    try {
      updated = await this.updateWithVersion<CalibrationFactor>(
        calibrationFactors,
        id,
        rejectDto.version,
        {
          approvalStatus: CalibrationFactorApprovalStatus.REJECTED,
          approverComment: rejectDto.rejectionReason,
        },
        '보정계수'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.cacheService.delete(this.buildCacheKey('detail', id));
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + 'registry:');
    this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.APPROVALS);
    await this.cacheInvalidationHelper.invalidateAllDashboard();

    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_FACTOR_REJECTED, {
      factorId: id,
      equipmentId: factor.equipmentId,
      actorId: rejectDto.approverId,
      actorName: '',
      timestamp: new Date(),
      reason: rejectDto.rejectionReason,
    });

    return this.normalize(updated);
  }

  // 소프트 삭제 — CAS 적용
  async remove(id: string, version: number): Promise<{ id: string; deleted: boolean }> {
    await this.findOne(id);

    try {
      await this.updateWithVersion(
        calibrationFactors,
        id,
        version,
        { deletedAt: new Date() },
        '보정계수'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.cacheService.delete(this.buildCacheKey('detail', id));
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + 'registry:');
    this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.APPROVALS);
    await this.cacheInvalidationHelper.invalidateAllDashboard();

    return { id, deleted: true };
  }
}
