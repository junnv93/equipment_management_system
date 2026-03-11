import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, and, asc, desc, sql, isNull, ilike, or, lte, gte } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { calibrationFactors, CalibrationFactor } from '@equipment-management/db/schema';
import { CreateCalibrationFactorDto } from './dto/create-calibration-factor.dto';
import { CalibrationFactorQueryDto } from './dto/calibration-factor-query.dto';
import {
  ApproveCalibrationFactorDto,
  RejectCalibrationFactorDto,
} from './dto/approve-calibration-factor.dto';
import { CalibrationFactorApprovalStatusValues } from '@equipment-management/schemas';

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
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class CalibrationFactorsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

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
      sort = 'effectiveDate.desc',
      page = 1,
      pageSize = 20,
    } = query;

    const conditions = [isNull(calibrationFactors.deletedAt)];
    if (equipmentId) conditions.push(eq(calibrationFactors.equipmentId, equipmentId));
    if (approvalStatus) conditions.push(eq(calibrationFactors.approvalStatus, approvalStatus));
    if (factorType) conditions.push(eq(calibrationFactors.factorType, factorType));
    if (search) conditions.push(ilike(calibrationFactors.factorName, `%${search}%`));

    const [sortField, sortOrder] = sort.split('.');
    const sortColumn =
      sortField === 'effectiveDate'
        ? calibrationFactors.effectiveDate
        : sortField === 'requestedAt'
          ? calibrationFactors.requestedAt
          : calibrationFactors.createdAt;
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [items, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(calibrationFactors)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(calibrationFactors)
        .where(and(...conditions)),
    ]);

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
  }

  // 단일 보정계수 조회
  async findOne(id: string): Promise<CalibrationFactorRecord> {
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
  }

  // 장비별 현재 적용 중인 보정계수 조회 (승인됨 + 유효 기간 내)
  async findByEquipment(equipmentUuid: string): Promise<{
    equipmentId: string;
    factors: CalibrationFactorRecord[];
    count: number;
  }> {
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
  }

  // 보정계수 대장 조회 (전체 장비의 현재 보정계수)
  async getRegistry(): Promise<{
    registry: {
      equipmentId: string;
      factors: CalibrationFactorRecord[];
      factorCount: number;
    }[];
    totalEquipments: number;
    totalFactors: number;
    generatedAt: Date;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const records = await this.db
      .select()
      .from(calibrationFactors)
      .where(
        and(
          eq(calibrationFactors.approvalStatus, CalibrationFactorApprovalStatus.APPROVED),
          isNull(calibrationFactors.deletedAt),
          lte(calibrationFactors.effectiveDate, today),
          or(isNull(calibrationFactors.expiryDate), gte(calibrationFactors.expiryDate, today))
        )
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
  }

  // 승인 대기 목록 조회
  async findPendingApprovals(): Promise<{
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
    } as CalibrationFactorQueryDto);
  }

  // 보정계수 승인 (기술책임자)
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

    const now = new Date();
    const [updated] = await this.db
      .update(calibrationFactors)
      .set({
        approvalStatus: CalibrationFactorApprovalStatus.APPROVED,
        approvedBy: approveDto.approverId,
        approvedAt: now,
        approverComment: approveDto.approverComment,
        updatedAt: now,
      })
      .where(eq(calibrationFactors.id, id))
      .returning();

    return this.normalize(updated);
  }

  // 보정계수 반려 (기술책임자)
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

    const now = new Date();
    const [updated] = await this.db
      .update(calibrationFactors)
      .set({
        approvalStatus: CalibrationFactorApprovalStatus.REJECTED,
        approvedBy: rejectDto.approverId,
        approvedAt: now,
        approverComment: rejectDto.rejectionReason,
        updatedAt: now,
      })
      .where(eq(calibrationFactors.id, id))
      .returning();

    return this.normalize(updated);
  }

  // 소프트 삭제
  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.findOne(id);

    await this.db
      .update(calibrationFactors)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(calibrationFactors.id, id));

    return { id, deleted: true };
  }
}
