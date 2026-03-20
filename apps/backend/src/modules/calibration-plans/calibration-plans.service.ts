import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, and, desc, sql, inArray, SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import {
  calibrationPlans,
  calibrationPlanItems,
  type NewCalibrationPlan,
  type NewCalibrationPlanItem,
} from '@equipment-management/db/schema/calibration-plans';
import { equipment } from '@equipment-management/db/schema/equipment';
import { users } from '@equipment-management/db/schema/users';
import { teams } from '@equipment-management/db/schema/teams';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import type {
  CreateCalibrationPlanPayload,
  UpdateCalibrationPlanInput,
  UpdateCalibrationPlanItemInput,
  CalibrationPlanQueryInput,
  ExternalEquipmentQueryInput,
  SubmitForReviewPayload,
  ReviewCalibrationPlanPayload,
  ApproveCalibrationPlanPayload,
  RejectCalibrationPlanPayload,
  ConfirmPlanItemPayload,
} from './dto';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import type {
  CalibrationPlanDetail,
  CalibrationPlanListResult,
  CalibrationPlanSummary,
  CalibrationPlanItem,
  CalibrationPlanDeleteResult,
  ExternalCalibrationEquipment,
  CalibrationPlanVersionHistoryItem,
} from './calibration-plans.types';
import { CACHE_TTL } from '@equipment-management/shared-constants';

@Injectable()
export class CalibrationPlansService extends VersionedBaseService {
  protected readonly db: AppDatabase;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    db: AppDatabase,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
    this.db = db;
  }

  // ──────────────────────────────────────────────
  //  Private helpers
  // ──────────────────────────────────────────────

  /**
   * CAS 패턴으로 교정계획서 업데이트
   *
   * ⚠️ VersionedBaseService.updateWithVersion()을 사용하지 않는 이유:
   *   calibration_plans 테이블은 `version`(계획서 개정 번호)과 `casVersion`(CAS 동시 수정 방지)을
   *   별도 컬럼으로 분리합니다. 베이스 클래스는 `version` 컬럼을 CAS 키로 사용하므로,
   *   여기서는 `casVersion` 컬럼 기반의 커스텀 CAS를 유지합니다.
   */
  private async updatePlanWithCAS(
    uuid: string,
    expectedCasVersion: number,
    updateData: Record<string, unknown>
  ): Promise<unknown> {
    const [updated] = await this.db
      .update(calibrationPlans)
      .set({
        ...updateData,
        casVersion: sql`cas_version + 1`,
        updatedAt: new Date(),
      } as Record<string, unknown>)
      .where(
        and(eq(calibrationPlans.id, uuid), eq(calibrationPlans.casVersion, expectedCasVersion))
      )
      .returning();

    if (!updated) {
      const [existing] = await this.db
        .select({
          id: calibrationPlans.id,
          casVersion: calibrationPlans.casVersion,
        })
        .from(calibrationPlans)
        .where(eq(calibrationPlans.id, uuid))
        .limit(1);

      if (!existing) {
        throw new NotFoundException({
          code: 'CALIBRATION_PLAN_NOT_FOUND',
          message: 'Calibration plan not found',
        });
      }

      // CAS 실패 시 detail 캐시 삭제 (stale cache 방지)
      this.cacheService.delete(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}detail:${uuid}`);

      throw new ConflictException({
        message: 'This record has been modified by another user. Please refresh the page.',
        code: 'VERSION_CONFLICT',
        currentVersion: existing.casVersion,
        expectedVersion: expectedCasVersion,
      });
    }

    return updated;
  }

  /**
   * 교정계획서 캐시 무효화
   */
  private invalidatePlanCache(uuid: string): void {
    this.cacheService.delete(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}detail:${uuid}`);
    this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}list:*`);
    this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}summary:*`);
  }

  /**
   * 기본 계획서 조회 (항목 없이, 캐시 미사용 — CAS 검증 및 사이트 접근 검증용)
   */
  async findOneBasic(uuid: string): Promise<typeof calibrationPlans.$inferSelect> {
    const [plan] = await this.db
      .select()
      .from(calibrationPlans)
      .where(eq(calibrationPlans.id, uuid));

    if (!plan) {
      throw new NotFoundException({
        code: 'CALIBRATION_PLAN_NOT_FOUND',
        message: `Calibration plan UUID ${uuid} not found`,
      });
    }

    return plan;
  }

  // ──────────────────────────────────────────────
  //  CRUD
  // ──────────────────────────────────────────────

  /**
   * 교정계획서 생성 (외부교정 대상 장비 자동 로드)
   */
  async create(createDto: CreateCalibrationPlanPayload): Promise<CalibrationPlanDetail> {
    const { year, siteId, teamId, createdBy } = createDto;

    // 이미 해당 연도/시험소에 최신 버전 계획서가 있는지 확인
    const existing = await this.db
      .select()
      .from(calibrationPlans)
      .where(
        and(
          eq(calibrationPlans.year, year),
          eq(calibrationPlans.siteId, siteId),
          eq(calibrationPlans.isLatestVersion, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException({
        code: 'CALIBRATION_PLAN_ALREADY_EXISTS',
        message: `Calibration plan for year ${year}, site ${siteId} already exists (version ${existing[0].version})`,
      });
    }

    // 트랜잭션으로 계획서 생성 + 항목 자동 생성
    const result = await this.db.transaction(async (tx) => {
      // 1. 계획서 생성
      const planData: NewCalibrationPlan = {
        year,
        siteId,
        teamId,
        createdBy,
        status: CPStatus.DRAFT,
      };
      const [plan] = await tx.insert(calibrationPlans).values(planData).returning();

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
        const items: NewCalibrationPlanItem[] = filteredEquipments.map((eq, index) => ({
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

        await tx.insert(calibrationPlanItems).values(items);
      }

      return plan;
    });

    this.invalidatePlanCache(result.id);
    // 생성된 계획서와 항목 조회해서 반환
    return this.findOne(result.id);
  }

  /**
   * 교정계획서 목록 조회
   *
   * includeSummary=true일 때 상태별 건수 요약 포함 (KPI 스트립용)
   * - summary는 status 필터 제외 조건으로 집계 (전체 상태 분포 표시)
   * - 캐시: CACHE_TTL.MEDIUM
   */
  async findAll(query: CalibrationPlanQueryInput): Promise<CalibrationPlanListResult> {
    const { year, siteId, teamId, status, page = 1, pageSize = 20, includeSummary } = query;

    const conditions: SQL[] = [];

    if (year) {
      conditions.push(eq(calibrationPlans.year, year));
    }

    if (siteId) {
      conditions.push(eq(calibrationPlans.siteId, siteId));
    }

    if (teamId) {
      conditions.push(eq(calibrationPlans.teamId, teamId));
    }

    if (status) {
      conditions.push(eq(calibrationPlans.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // COUNT(*) 단일 쿼리로 전체 개수 조회 (기존: 전체 fetch → .length)
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(calibrationPlans)
      .where(whereClause);

    const totalItems = count;

    // LEFT JOIN으로 작성자 이름/팀 이름 포함
    const offset = (page - 1) * pageSize;
    const rows = await this.db
      .select({
        plan: calibrationPlans,
        authorName: users.name,
        teamName: teams.name,
      })
      .from(calibrationPlans)
      .leftJoin(users, eq(calibrationPlans.createdBy, users.id))
      .leftJoin(teams, eq(calibrationPlans.teamId, teams.id))
      .where(whereClause)
      .orderBy(desc(calibrationPlans.year), desc(calibrationPlans.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 플랫 필드로 응답에 authorName, teamName 추가
    const items = rows.map((row) => ({
      ...row.plan,
      authorName: row.authorName,
      teamName: row.teamName,
    }));

    const result: CalibrationPlanListResult = {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
      },
    };

    if (includeSummary) {
      result.summary = await this.getSummary({ year, siteId, teamId });
    }

    return result;
  }

  /**
   * 상태별 건수 요약 집계 (status 필터 제외 — 전체 분포 표시)
   *
   * 단일 SQL GROUP BY 쿼리 → CACHE_TTL.MEDIUM 캐시
   */
  private async getSummary(filter: {
    year?: number;
    siteId?: string;
    teamId?: string;
  }): Promise<CalibrationPlanSummary> {
    const cacheKey = `${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}summary:${filter.year ?? ''}:${filter.siteId ?? ''}:${filter.teamId ?? ''}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // status 필터 제외한 base 조건 (KPI는 전체 상태 분포를 보여줌)
        const conditions: SQL[] = [];
        if (filter.year) conditions.push(eq(calibrationPlans.year, filter.year));
        if (filter.siteId) conditions.push(eq(calibrationPlans.siteId, filter.siteId));
        if (filter.teamId) conditions.push(eq(calibrationPlans.teamId, filter.teamId));
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [summaryData] = await this.db
          .select({
            total: sql<number>`count(*)::int`,
            draft: sql<number>`count(*) filter (where ${calibrationPlans.status} = ${CPStatus.DRAFT})::int`,
            pending_review: sql<number>`count(*) filter (where ${calibrationPlans.status} = ${CPStatus.PENDING_REVIEW})::int`,
            pending_approval: sql<number>`count(*) filter (where ${calibrationPlans.status} = ${CPStatus.PENDING_APPROVAL})::int`,
            approved: sql<number>`count(*) filter (where ${calibrationPlans.status} = ${CPStatus.APPROVED})::int`,
            rejected: sql<number>`count(*) filter (where ${calibrationPlans.status} = ${CPStatus.REJECTED})::int`,
          })
          .from(calibrationPlans)
          .where(whereClause);

        return {
          total: Number(summaryData.total),
          draft: Number(summaryData.draft),
          pending_review: Number(summaryData.pending_review),
          pending_approval: Number(summaryData.pending_approval),
          approved: Number(summaryData.approved),
          rejected: Number(summaryData.rejected),
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 교정계획서 상세 조회 (항목 포함, Cache-Aside)
   */
  async findOne(uuid: string): Promise<CalibrationPlanDetail> {
    const cacheKey = `${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}detail:${uuid}`;

    return this.cacheService.getOrSet<CalibrationPlanDetail>(
      cacheKey,
      async () => {
        // LEFT JOIN으로 작성자 이름/팀 이름 포함 (findAll과 동일 패턴)
        const [row] = await this.db
          .select({
            plan: calibrationPlans,
            authorName: users.name,
            teamName: teams.name,
          })
          .from(calibrationPlans)
          .leftJoin(users, eq(calibrationPlans.createdBy, users.id))
          .leftJoin(teams, eq(calibrationPlans.teamId, teams.id))
          .where(eq(calibrationPlans.id, uuid));

        if (!row) {
          throw new NotFoundException({
            code: 'CALIBRATION_PLAN_NOT_FOUND',
            message: `Calibration plan UUID ${uuid} not found`,
          });
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
          .where(eq(calibrationPlanItems.planId, row.plan.id))
          .orderBy(calibrationPlanItems.sequenceNumber);

        return {
          ...row.plan,
          authorName: row.authorName,
          teamName: row.teamName,
          items: items.map((r) => ({
            ...r.item,
            equipment: r.equipment,
          })),
        };
      },
      120 // TTL: 2분
    );
  }

  /**
   * 교정계획서 수정 (draft 상태만, CAS)
   */
  async update(
    uuid: string,
    updateDto: UpdateCalibrationPlanInput
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== CPStatus.DRAFT) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_DRAFT_CAN_UPDATE',
        message: 'Only draft plans can be updated.',
      });
    }

    const { casVersion, ...updateData } = updateDto;
    await this.updatePlanWithCAS(uuid, casVersion, updateData);

    this.invalidatePlanCache(uuid);
    return this.findOne(uuid);
  }

  /**
   * 교정계획서 삭제 (draft 상태만)
   */
  async remove(uuid: string): Promise<CalibrationPlanDeleteResult> {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== CPStatus.DRAFT) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_DRAFT_CAN_DELETE',
        message: 'Only draft plans can be deleted.',
      });
    }

    // 항목도 CASCADE로 함께 삭제됨
    await this.db.delete(calibrationPlans).where(eq(calibrationPlans.id, uuid));

    this.invalidatePlanCache(uuid);
    return { uuid, deleted: true as const };
  }

  // ──────────────────────────────────────────────
  //  3-Step Approval Workflow
  // ──────────────────────────────────────────────

  /**
   * 승인 요청 (draft -> pending_review) - 기존 호환성 유지
   * @deprecated submitForReview() 사용 권장
   */
  async submit(uuid: string): Promise<CalibrationPlanDetail> {
    const plan = await this.findOneBasic(uuid);
    return this.submitForReview(uuid, {
      casVersion: plan.casVersion,
      submittedBy: plan.createdBy,
    });
  }

  /**
   * 검토 요청 (draft/rejected -> pending_review, 기술책임자)
   * 3단계 승인 워크플로우의 첫 번째 단계
   */
  async submitForReview(
    uuid: string,
    submitDto: SubmitForReviewPayload
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== CPStatus.DRAFT && plan.status !== CPStatus.REJECTED) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_INVALID_STATUS_FOR_SUBMIT',
        message: 'Only draft or rejected plans can be submitted for review.',
      });
    }

    const { casVersion, submittedBy } = submitDto;

    await this.updatePlanWithCAS(uuid, casVersion, {
      status: CPStatus.PENDING_REVIEW,
      submittedAt: new Date(),
      // 반려 후 재제출 시 반려 정보 초기화
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      rejectionStage: null,
    });

    // 📢 알림 이벤트 발행
    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_PLAN_SUBMITTED, {
      planId: uuid,
      year: plan.year,
      site: plan.siteId,
      teamId: plan.teamId ?? '',
      createdBy: plan.createdBy,
      actorId: submittedBy || plan.createdBy,
      actorName: '',
      timestamp: new Date(),
    });

    this.invalidatePlanCache(uuid);
    return this.findOne(uuid);
  }

  /**
   * 검토 완료 (pending_review -> pending_approval, 품질책임자)
   * 3단계 승인 워크플로우의 두 번째 단계
   */
  async review(
    uuid: string,
    reviewDto: ReviewCalibrationPlanPayload
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== CPStatus.PENDING_REVIEW) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_PENDING_REVIEW_CAN_REVIEW',
        message: 'Only pending review plans can be reviewed.',
      });
    }

    const { casVersion, reviewedBy, reviewComment } = reviewDto;

    await this.updatePlanWithCAS(uuid, casVersion, {
      status: CPStatus.PENDING_APPROVAL,
      reviewedBy,
      reviewedAt: new Date(),
      reviewComment: reviewComment || null,
    });

    // 📢 알림 이벤트 발행
    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_PLAN_REVIEWED, {
      planId: uuid,
      year: plan.year,
      site: plan.siteId,
      teamId: plan.teamId ?? '',
      createdBy: plan.createdBy,
      actorId: reviewedBy,
      actorName: '',
      timestamp: new Date(),
    });

    this.invalidatePlanCache(uuid);
    return this.findOne(uuid);
  }

  /**
   * 최종 승인 (pending_approval -> approved, 시험소장)
   * 3단계 승인 워크플로우의 세 번째 단계
   */
  async approve(
    uuid: string,
    approveDto: ApproveCalibrationPlanPayload
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.findOneBasic(uuid);

    if (plan.status !== CPStatus.PENDING_APPROVAL) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_PENDING_APPROVAL_CAN_APPROVE',
        message: 'Only pending approval plans can be approved.',
      });
    }

    const { casVersion, approvedBy } = approveDto;

    await this.updatePlanWithCAS(uuid, casVersion, {
      status: CPStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    });

    // 📢 알림 이벤트 발행
    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_PLAN_APPROVED, {
      planId: uuid,
      year: plan.year,
      site: plan.siteId,
      teamId: plan.teamId ?? '',
      createdBy: plan.createdBy,
      actorId: approvedBy,
      actorName: '',
      timestamp: new Date(),
    });

    this.invalidatePlanCache(uuid);
    return this.findOne(uuid);
  }

  /**
   * 반려 (pending_review/pending_approval -> rejected)
   * 품질책임자(검토 단계) 또는 시험소장(승인 단계)이 반려
   */
  async reject(
    uuid: string,
    rejectDto: RejectCalibrationPlanPayload
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.findOneBasic(uuid);

    // 검토 대기 또는 승인 대기 상태에서만 반려 가능
    if (plan.status !== CPStatus.PENDING_REVIEW && plan.status !== CPStatus.PENDING_APPROVAL) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_INVALID_STATUS_FOR_REJECT',
        message: 'Only pending review or pending approval plans can be rejected.',
      });
    }

    if (!rejectDto.rejectionReason || rejectDto.rejectionReason.trim() === '') {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_REJECTION_REASON_REQUIRED',
        message: 'Rejection reason is required.',
      });
    }

    // 반려 단계 결정
    const rejectionStage = plan.status === CPStatus.PENDING_REVIEW ? 'review' : 'approval';

    const { casVersion, rejectedBy, rejectionReason } = rejectDto;

    await this.updatePlanWithCAS(uuid, casVersion, {
      status: CPStatus.REJECTED,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason,
      rejectionStage,
    });

    // 📢 알림 이벤트 발행
    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_PLAN_REJECTED, {
      planId: uuid,
      year: plan.year,
      site: plan.siteId,
      teamId: plan.teamId ?? '',
      createdBy: plan.createdBy,
      reason: rejectionReason,
      actorId: rejectedBy,
      actorName: '',
      timestamp: new Date(),
    });

    this.invalidatePlanCache(uuid);
    return this.findOne(uuid);
  }

  // ──────────────────────────────────────────────
  //  Plan Items
  // ──────────────────────────────────────────────

  /**
   * 항목 확인 (기술책임자, 승인된 계획서만)
   */
  async confirmItem(
    planUuid: string,
    itemUuid: string,
    confirmDto: ConfirmPlanItemPayload
  ): Promise<CalibrationPlanItem> {
    const plan = await this.findOneBasic(planUuid);

    // 승인된 계획서만 항목 확인 가능
    if (plan.status !== CPStatus.APPROVED) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_APPROVED_CAN_CONFIRM',
        message: 'Only approved plans can have items confirmed.',
      });
    }

    // optional CAS check (casVersion은 confirmPlanItemSchema에서 optional)
    if (confirmDto.casVersion !== undefined) {
      if (plan.casVersion !== confirmDto.casVersion) {
        this.cacheService.delete(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}detail:${planUuid}`);
        throw new ConflictException({
          message: 'This record has been modified by another user. Please refresh the page.',
          code: 'VERSION_CONFLICT',
          currentVersion: plan.casVersion,
          expectedVersion: confirmDto.casVersion,
        });
      }
    }

    const [item] = await this.db
      .select()
      .from(calibrationPlanItems)
      .where(and(eq(calibrationPlanItems.id, itemUuid), eq(calibrationPlanItems.planId, plan.id)));

    if (!item) {
      throw new NotFoundException({
        code: 'CALIBRATION_PLAN_ITEM_NOT_FOUND',
        message: `Plan item UUID ${itemUuid} not found`,
      });
    }

    const [updated] = await this.db
      .update(calibrationPlanItems)
      .set({
        confirmedBy: confirmDto.confirmedBy,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(calibrationPlanItems.id, itemUuid))
      .returning();

    this.invalidatePlanCache(planUuid);
    return updated;
  }

  /**
   * 항목 수정 (계획된 교정기관, 비고)
   */
  async updateItem(
    planUuid: string,
    itemUuid: string,
    updateDto: UpdateCalibrationPlanItemInput
  ): Promise<CalibrationPlanItem> {
    const plan = await this.findOneBasic(planUuid);

    if (plan.status !== CPStatus.DRAFT) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_DRAFT_CAN_UPDATE_ITEM',
        message: 'Only draft plans can have items updated.',
      });
    }

    const [item] = await this.db
      .select()
      .from(calibrationPlanItems)
      .where(and(eq(calibrationPlanItems.id, itemUuid), eq(calibrationPlanItems.planId, plan.id)));

    if (!item) {
      throw new NotFoundException({
        code: 'CALIBRATION_PLAN_ITEM_NOT_FOUND',
        message: `Plan item UUID ${itemUuid} not found`,
      });
    }

    const [updated] = await this.db
      .update(calibrationPlanItems)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(eq(calibrationPlanItems.id, itemUuid))
      .returning();

    this.invalidatePlanCache(planUuid);
    return updated;
  }

  // ──────────────────────────────────────────────
  //  External Equipment & Auto-Recording
  // ──────────────────────────────────────────────

  /**
   * 외부교정 대상 장비 조회
   */
  async findExternalEquipment(
    query: ExternalEquipmentQueryInput
  ): Promise<ExternalCalibrationEquipment[]> {
    const { year, siteId, teamId } = query;

    const conditions: SQL[] = [
      eq(equipment.calibrationMethod, 'external_calibration'),
      eq(equipment.isActive, true),
    ];

    if (siteId) {
      conditions.push(eq(equipment.site, siteId));
    }

    if (teamId) {
      conditions.push(eq(equipment.teamId, teamId));
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
  async recordActualCalibrationDate(equipmentId: string, calibrationDate: Date): Promise<number> {
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
          eq(calibrationPlans.status, CPStatus.APPROVED)
        )
      );

    // 해당 항목의 actualCalibrationDate 일괄 업데이트 (N+1 방지)
    if (items.length > 0) {
      const itemIds = items.map((row) => row.item.id);
      await this.db
        .update(calibrationPlanItems)
        .set({
          actualCalibrationDate: calibrationDate,
          updatedAt: new Date(),
        })
        .where(inArray(calibrationPlanItems.id, itemIds));

      // 영향받은 plan 캐시 일괄 무효화 (중복 제거)
      const planIds = [...new Set(items.map((row) => row.plan.id))];
      for (const planId of planIds) {
        this.invalidatePlanCache(planId);
      }
    }

    return items.length;
  }

  // ──────────────────────────────────────────────
  //  Versioning
  // ──────────────────────────────────────────────

  /**
   * 새 버전 생성 (승인된 계획서만)
   *
   * 승인된 교정계획서를 수정해야 할 경우 새 버전을 생성합니다.
   * - 기존 계획서는 isLatestVersion=false로 변경
   * - 새 계획서는 version+1, status='draft', isLatestVersion=true
   * - 기존 항목들을 새 계획서로 복사
   */
  async createNewVersion(uuid: string, userId: string): Promise<CalibrationPlanDetail> {
    const parent = await this.findOneBasic(uuid);

    if (parent.status !== CPStatus.APPROVED) {
      throw new BadRequestException({
        code: 'CALIBRATION_PLAN_ONLY_APPROVED_CAN_CREATE_VERSION',
        message: 'Only approved plans can create a new version.',
      });
    }

    // 트랜잭션으로 버전 생성
    const result = await this.db.transaction(async (tx) => {
      // 1. 기존 계획서를 최신 버전 아님으로 표시
      await tx
        .update(calibrationPlans)
        .set({ isLatestVersion: false, updatedAt: new Date() })
        .where(eq(calibrationPlans.id, uuid));

      // 2. 새 버전 생성
      const [newPlan] = await tx
        .insert(calibrationPlans)
        .values({
          year: parent.year,
          siteId: parent.siteId,
          teamId: parent.teamId,
          status: CPStatus.DRAFT,
          createdBy: userId,
          version: parent.version + 1,
          parentPlanId: parent.id,
          isLatestVersion: true,
        })
        .returning();

      // 3. 기존 항목 조회
      const existingItems = await tx
        .select()
        .from(calibrationPlanItems)
        .where(eq(calibrationPlanItems.planId, parent.id))
        .orderBy(calibrationPlanItems.sequenceNumber);

      // 4. 항목 복사
      if (existingItems.length > 0) {
        const newItems: NewCalibrationPlanItem[] = existingItems.map((item) => ({
          planId: newPlan.id,
          equipmentId: item.equipmentId,
          sequenceNumber: item.sequenceNumber,
          snapshotValidityDate: item.snapshotValidityDate,
          snapshotCalibrationCycle: item.snapshotCalibrationCycle,
          snapshotCalibrationAgency: item.snapshotCalibrationAgency,
          plannedCalibrationDate: item.plannedCalibrationDate,
          plannedCalibrationAgency: item.plannedCalibrationAgency,
          notes: item.notes,
        }));

        await tx.insert(calibrationPlanItems).values(newItems);
      }

      return newPlan;
    });

    // 부모 + 새 버전 캐시 무효화
    this.invalidatePlanCache(uuid);
    this.invalidatePlanCache(result.id);
    return this.findOne(result.id);
  }

  /**
   * 버전 히스토리 조회
   *
   * 특정 계획서의 모든 버전을 조회합니다.
   * - 같은 year + siteId를 가진 모든 버전
   * - 버전 번호 내림차순 정렬
   */
  async getVersionHistory(uuid: string): Promise<CalibrationPlanVersionHistoryItem[]> {
    const current = await this.findOneBasic(uuid);

    // 같은 연도+시험소의 모든 버전 조회
    const versions = await this.db
      .select({
        id: calibrationPlans.id,
        year: calibrationPlans.year,
        siteId: calibrationPlans.siteId,
        status: calibrationPlans.status,
        version: calibrationPlans.version,
        isLatestVersion: calibrationPlans.isLatestVersion,
        createdBy: calibrationPlans.createdBy,
        createdAt: calibrationPlans.createdAt,
        approvedBy: calibrationPlans.approvedBy,
        approvedAt: calibrationPlans.approvedAt,
      })
      .from(calibrationPlans)
      .where(
        and(eq(calibrationPlans.year, current.year), eq(calibrationPlans.siteId, current.siteId))
      )
      .orderBy(desc(calibrationPlans.version));

    return versions;
  }
}
