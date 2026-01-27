import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, SQL, gte, lt, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import {
  calibrationPlans,
  calibrationPlanItems,
} from '@equipment-management/db/schema/calibration-plans';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  CreateCalibrationPlanDto,
  UpdateCalibrationPlanDto,
  UpdateCalibrationPlanItemDto,
  CalibrationPlanQueryDto,
  ExternalEquipmentQueryDto,
  ApproveCalibrationPlanDto,
  RejectCalibrationPlanDto,
  ConfirmPlanItemDto,
} from './dto';

@Injectable()
export class CalibrationPlansService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  /**
   * 교정계획서 생성 (외부교정 대상 장비 자동 로드)
   */
  async create(createDto: CreateCalibrationPlanDto) {
    const { year, siteId, teamId, createdBy } = createDto;

    // 이미 해당 연도/시험소에 계획서가 있는지 확인
    const existing = await this.db
      .select()
      .from(calibrationPlans)
      .where(and(eq(calibrationPlans.year, year), eq(calibrationPlans.siteId, siteId)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`${year}년 ${siteId} 시험소의 교정계획서가 이미 존재합니다.`);
    }

    // 트랜잭션으로 계획서 생성 + 항목 자동 생성
    const result = await this.db.transaction(async (tx) => {
      // 1. 계획서 생성
      const [plan] = await tx
        .insert(calibrationPlans)
        .values({
          year,
          siteId,
          teamId,
          createdBy,
          status: 'draft',
        } as any)
        .returning();

      // 2. 해당 연도 교정 예정인 외부교정 대상 장비 조회
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);

      const conditions: SQL[] = [
        eq(equipment.site, siteId),
        eq(equipment.calibrationMethod, 'external_calibration'),
        eq(equipment.isActive, true),
      ];

      // 차기교정일이 해당 연도 내인 장비만 포함
      const externalEquipments = await tx
        .select()
        .from(equipment)
        .where(and(...conditions))
        .orderBy(equipment.nextCalibrationDate);

      // 해당 연도에 교정 예정인 장비만 필터링
      const filteredEquipments = externalEquipments.filter((eq) => {
        if (!eq.nextCalibrationDate) return false;
        const nextDate = new Date(eq.nextCalibrationDate);
        return nextDate >= startOfYear && nextDate < endOfYear;
      });

      // 3. 항목 생성 (스냅샷 저장)
      if (filteredEquipments.length > 0) {
        const items = filteredEquipments.map((eq, index) => ({
          planId: plan.id,
          equipmentId: eq.id,
          sequenceNumber: index + 1,
          // 현황 스냅샷
          snapshotValidityDate: eq.lastCalibrationDate,
          snapshotCalibrationCycle: eq.calibrationCycle,
          snapshotCalibrationAgency: eq.calibrationAgency,
          // 계획
          plannedCalibrationDate: eq.nextCalibrationDate,
          plannedCalibrationAgency: eq.calibrationAgency, // 기본값: 현재 교정기관
        }));

        await tx.insert(calibrationPlanItems).values(items as any);
      }

      return plan;
    });

    // 생성된 계획서와 항목 조회해서 반환
    return this.findOne(result.id);
  }

  /**
   * 교정계획서 목록 조회
   */
  async findAll(query: CalibrationPlanQueryDto) {
    const { year, siteId, status, page = 1, pageSize = 20 } = query;

    const conditions: SQL[] = [];

    if (year) {
      conditions.push(eq(calibrationPlans.year, year));
    }

    if (siteId) {
      conditions.push(eq(calibrationPlans.siteId, siteId));
    }

    if (status) {
      conditions.push(eq(calibrationPlans.status, status));
    }

    // 전체 개수 조회
    const allItems = await this.db
      .select()
      .from(calibrationPlans)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalItems = allItems.length;

    // 페이지네이션 적용 조회
    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select()
      .from(calibrationPlans)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(calibrationPlans.year), desc(calibrationPlans.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
      },
    };
  }

  /**
   * 교정계획서 상세 조회 (항목 포함)
   */
  async findOne(uuid: string) {
    const [plan] = await this.db
      .select()
      .from(calibrationPlans)
      .where(eq(calibrationPlans.id, uuid));

    if (!plan) {
      throw new NotFoundException(`교정계획서 UUID ${uuid}를 찾을 수 없습니다.`);
    }

    // 항목 조회 (장비 정보 포함)
    const items = await this.db
      .select({
        item: calibrationPlanItems,
        equipment: {
          id: equipment.id,
          name: equipment.name,
          managementNumber: equipment.managementNumber,
          modelName: equipment.modelName,
          manufacturer: equipment.manufacturer,
          location: equipment.location,
          lastCalibrationDate: equipment.lastCalibrationDate,
          nextCalibrationDate: equipment.nextCalibrationDate,
          calibrationCycle: equipment.calibrationCycle,
          calibrationAgency: equipment.calibrationAgency,
        },
      })
      .from(calibrationPlanItems)
      .innerJoin(equipment, eq(calibrationPlanItems.equipmentId, equipment.id))
      .where(eq(calibrationPlanItems.planId, plan.id))
      .orderBy(calibrationPlanItems.sequenceNumber);

    return {
      ...plan,
      items: items.map((row) => ({
        ...row.item,
        equipment: row.equipment,
      })),
    };
  }

  /**
   * 교정계획서 수정 (draft 상태만)
   */
  async update(uuid: string, updateDto: UpdateCalibrationPlanDto) {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== 'draft') {
      throw new BadRequestException('작성 중(draft) 상태의 계획서만 수정할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(calibrationPlans)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      } as any)
      .where(eq(calibrationPlans.id, uuid))
      .returning();

    return this.findOne(uuid);
  }

  /**
   * 교정계획서 삭제 (draft 상태만)
   */
  async remove(uuid: string) {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== 'draft') {
      throw new BadRequestException('작성 중(draft) 상태의 계획서만 삭제할 수 있습니다.');
    }

    // 항목도 CASCADE로 함께 삭제됨
    await this.db.delete(calibrationPlans).where(eq(calibrationPlans.id, uuid));

    return { uuid, deleted: true };
  }

  /**
   * 승인 요청 (draft -> pending_approval)
   */
  async submit(uuid: string) {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== 'draft') {
      throw new BadRequestException('작성 중(draft) 상태의 계획서만 승인 요청할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(calibrationPlans)
      .set({
        status: 'pending_approval',
        updatedAt: new Date(),
      } as any)
      .where(eq(calibrationPlans.id, uuid))
      .returning();

    return this.findOne(uuid);
  }

  /**
   * 승인 (pending_approval -> approved, lab_manager만)
   */
  async approve(uuid: string, approveDto: ApproveCalibrationPlanDto) {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== 'pending_approval') {
      throw new BadRequestException(
        '승인 대기(pending_approval) 상태의 계획서만 승인할 수 있습니다.'
      );
    }

    const [updated] = await this.db
      .update(calibrationPlans)
      .set({
        status: 'approved',
        approvedBy: approveDto.approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(calibrationPlans.id, uuid))
      .returning();

    return this.findOne(uuid);
  }

  /**
   * 반려 (pending_approval -> rejected, lab_manager만, reason 필수)
   */
  async reject(uuid: string, rejectDto: RejectCalibrationPlanDto) {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== 'pending_approval') {
      throw new BadRequestException(
        '승인 대기(pending_approval) 상태의 계획서만 반려할 수 있습니다.'
      );
    }

    if (!rejectDto.rejectionReason || rejectDto.rejectionReason.trim() === '') {
      throw new BadRequestException('반려 사유는 필수입니다.');
    }

    const [updated] = await this.db
      .update(calibrationPlans)
      .set({
        status: 'rejected',
        approvedBy: rejectDto.rejectedBy, // 반려자도 approvedBy에 기록
        rejectionReason: rejectDto.rejectionReason,
        updatedAt: new Date(),
      } as any)
      .where(eq(calibrationPlans.id, uuid))
      .returning();

    return this.findOne(uuid);
  }

  /**
   * 항목 확인 (기술책임자)
   */
  async confirmItem(planUuid: string, itemUuid: string, confirmDto: ConfirmPlanItemDto) {
    const plan = await this.findOneBasic(planUuid);

    // 승인된 계획서만 항목 확인 가능
    if (plan.status !== 'approved') {
      throw new BadRequestException('승인된 계획서만 항목을 확인할 수 있습니다.');
    }

    const [item] = await this.db
      .select()
      .from(calibrationPlanItems)
      .where(and(eq(calibrationPlanItems.id, itemUuid), eq(calibrationPlanItems.planId, plan.id)));

    if (!item) {
      throw new NotFoundException(`항목 UUID ${itemUuid}를 찾을 수 없습니다.`);
    }

    const [updated] = await this.db
      .update(calibrationPlanItems)
      .set({
        confirmedBy: confirmDto.confirmedBy,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(calibrationPlanItems.id, itemUuid))
      .returning();

    return updated;
  }

  /**
   * 항목 수정 (계획된 교정기관, 비고)
   */
  async updateItem(planUuid: string, itemUuid: string, updateDto: UpdateCalibrationPlanItemDto) {
    const plan = await this.findOneBasic(planUuid);

    if (plan.status !== 'draft') {
      throw new BadRequestException('작성 중(draft) 상태의 계획서만 항목을 수정할 수 있습니다.');
    }

    const [item] = await this.db
      .select()
      .from(calibrationPlanItems)
      .where(and(eq(calibrationPlanItems.id, itemUuid), eq(calibrationPlanItems.planId, plan.id)));

    if (!item) {
      throw new NotFoundException(`항목 UUID ${itemUuid}를 찾을 수 없습니다.`);
    }

    const [updated] = await this.db
      .update(calibrationPlanItems)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      } as any)
      .where(eq(calibrationPlanItems.id, itemUuid))
      .returning();

    return updated;
  }

  /**
   * 외부교정 대상 장비 조회
   */
  async findExternalEquipment(query: ExternalEquipmentQueryDto) {
    const { year, siteId } = query;

    const conditions: SQL[] = [
      eq(equipment.calibrationMethod, 'external_calibration'),
      eq(equipment.isActive, true),
    ];

    if (siteId) {
      conditions.push(eq(equipment.site, siteId));
    }

    let result = await this.db
      .select({
        id: equipment.id,
        name: equipment.name,
        managementNumber: equipment.managementNumber,
        modelName: equipment.modelName,
        manufacturer: equipment.manufacturer,
        location: equipment.location,
        site: equipment.site,
        lastCalibrationDate: equipment.lastCalibrationDate,
        nextCalibrationDate: equipment.nextCalibrationDate,
        calibrationCycle: equipment.calibrationCycle,
        calibrationAgency: equipment.calibrationAgency,
      })
      .from(equipment)
      .where(and(...conditions))
      .orderBy(equipment.nextCalibrationDate);

    // 연도 필터가 있으면 해당 연도에 교정 예정인 장비만 반환
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      result = result.filter((eq) => {
        if (!eq.nextCalibrationDate) return false;
        const nextDate = new Date(eq.nextCalibrationDate);
        return nextDate >= startOfYear && nextDate < endOfYear;
      });
    }

    return result;
  }

  /**
   * 실제 교정일 자동 기록 (장비 lastCalibrationDate 변경 시 호출)
   * CalibrationService에서 교정 완료 시 호출됨
   */
  async recordActualCalibrationDate(equipmentId: string, calibrationDate: Date) {
    const currentYear = calibrationDate.getFullYear();

    // 해당 연도의 승인된 교정계획서 항목 조회
    const items = await this.db
      .select({
        item: calibrationPlanItems,
        plan: calibrationPlans,
      })
      .from(calibrationPlanItems)
      .innerJoin(calibrationPlans, eq(calibrationPlanItems.planId, calibrationPlans.id))
      .where(
        and(
          eq(calibrationPlanItems.equipmentId, equipmentId),
          eq(calibrationPlans.year, currentYear),
          eq(calibrationPlans.status, 'approved')
        )
      );

    // 해당 항목의 actualCalibrationDate 업데이트
    for (const row of items) {
      await this.db
        .update(calibrationPlanItems)
        .set({
          actualCalibrationDate: calibrationDate,
          updatedAt: new Date(),
        } as any)
        .where(eq(calibrationPlanItems.id, row.item.id));
    }

    return items.length;
  }

  /**
   * 기본 계획서 조회 (항목 없이)
   */
  private async findOneBasic(uuid: string) {
    const [plan] = await this.db
      .select()
      .from(calibrationPlans)
      .where(eq(calibrationPlans.id, uuid));

    if (!plan) {
      throw new NotFoundException(`교정계획서 UUID ${uuid}를 찾을 수 없습니다.`);
    }

    return plan;
  }
}
