import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import {
  eq,
  and,
  or,
  ne,
  gte,
  lt,
  lte,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  count,
  sql,
  type SQL,
} from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import {
  CalibrationApprovalStatusEnum,
  CalibrationPlanStatusValues,
  ValidationStatusValues,
  CheckoutStatusValues,
  CheckoutPurposeValues,
  EquipmentImportStatusValues,
  EquipmentImportSourceEnum,
  NonConformanceStatusValues,
  DisposalReviewStatusValues,
  ApprovalStatusEnum,
  type UserRole,
  type CheckoutStatus,
  type CalibrationPlanStatus,
  type DisposalReviewStatus,
  type EquipmentImportSource,
  type EquipmentImportStatus,
} from '@equipment-management/schemas';
import {
  APPROVAL_KPI,
  ROLE_APPROVAL_CATEGORIES,
  resolveDataScope,
  NON_CONFORMANCE_DATA_SCOPE,
  CHECKOUT_DATA_SCOPE,
  INTERMEDIATE_CHECK_DATA_SCOPE,
  CALIBRATION_DATA_SCOPE,
  CALIBRATION_PLAN_DATA_SCOPE,
  TEST_SOFTWARE_DATA_SCOPE,
  EQUIPMENT_IMPORT_DATA_SCOPE,
  DISPOSAL_DATA_SCOPE,
  EQUIPMENT_REQUEST_DATA_SCOPE,
  type FeatureScopePolicy,
  type UserScopeContext,
  CACHE_TTL,
} from '@equipment-management/shared-constants';
import { ApprovalCategoryValues, getNCTypesRequiring } from '@equipment-management/schemas';
import { toSafeInt } from '../../common/utils';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';

/** 승인 카테고리 축약 (SSOT: @equipment-management/schemas) */
const AC = ApprovalCategoryValues;

/**
 * 역할별 승인 카테고리 (Set 변환 — O(1) lookup)
 * SSOT: @equipment-management/shared-constants ROLE_APPROVAL_CATEGORIES
 */
const ROLE_CATEGORIES = Object.fromEntries(
  Object.entries(ROLE_APPROVAL_CATEGORIES).map(([role, cats]) => [role, new Set(cats)])
) as unknown as Record<UserRole, ReadonlySet<string>>;

/**
 * 카테고리별 승인 대기 개수
 *
 * Direction-based categories (consolidated):
 * - outgoing: All equipment leaving facility (checkouts + vendor returns)
 * - incoming: All equipment entering facility (returns + rental imports + shared imports)
 *
 * Specialized categories:
 * - equipment, calibration, inspection, nonconformity, disposal_review, disposal_final, etc.
 */
export interface ApprovalKpiResponse {
  /** 오늘 현재 사용자가 처리(승인+반려)한 건수 */
  todayProcessed: number;
  /** 현재 카테고리에서 URGENT_THRESHOLD_DAYS 이상 경과한 건수 */
  urgentCount: number;
  /** 현재 카테고리 평균 대기일 (정수) */
  avgWaitDays: number;
}

export interface PendingCountsByCategory {
  // Direction-based (consolidated)
  outgoing: number;
  incoming: number;

  // Specialized approvals
  equipment: number;
  calibration: number;
  inspection: number;
  nonconformity: number;
  disposal_review: number;
  disposal_final: number;
  plan_review: number;
  plan_final: number;
  software_validation: number;
}

/**
 * 승인 관리 통합 서비스
 *
 * 모든 승인 카테고리의 대기 개수를 한 번에 조회하여
 * 프론트엔드가 13번의 별도 API 호출을 할 필요 없이
 * 1번의 호출로 모든 배지 카운트를 가져올 수 있도록 함
 */
@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 역할별 승인 대기 개수 조회 (Approvals 페이지용)
   *
   * getApprovalCountsByScope() 결과에 ROLE_CATEGORIES gating을 적용합니다.
   * 역할에 해당하지 않는 카테고리는 DB 쿼리 자체를 생략합니다.
   *
   * @param userCtx - Controller에서 JWT 기반으로 구성한 스코프 컨텍스트 (DB 재조회 불필요)
   */
  async getPendingCountsByRole(userCtx: UserScopeContext): Promise<PendingCountsByCategory> {
    const cacheKey = `${CACHE_KEY_PREFIXES.APPROVALS}counts:${userCtx.role}:${userCtx.site || 'all'}:${userCtx.teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const allowedCategories = ROLE_CATEGORIES[userCtx.role] ?? new Set();
        return this.getApprovalCountsByScope(userCtx, allowedCategories);
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 스코프 기반 승인 대기 개수 — Core Counting (SSOT)
   *
   * DashboardService와 ApprovalsController 양쪽에서 사용하는 단일 소스.
   * allowedCategories가 주어지면 해당 카테고리만 쿼리하고 나머지는 0을 반환합니다.
   * 생략 시 전체 카테고리를 쿼리합니다 (Dashboard용).
   *
   * 스코프 해석: data-scope.ts의 SSOT 정책 + resolveDataScope()를 사용.
   * SiteScopeInterceptor와 동일한 해석기를 공유하여 카운트/목록 불일치를 방지합니다.
   *
   * @param userCtx - 사용자 역할/사이트/팀 컨텍스트 (정책 해석에 사용)
   * @param allowedCategories - 쿼리할 카테고리 제한 (없으면 전체)
   */
  async getApprovalCountsByScope(
    userCtx: UserScopeContext,
    allowedCategories?: ReadonlySet<string>
  ): Promise<PendingCountsByCategory> {
    const shouldQuery = (category: string): boolean =>
      !allowedCategories || allowedCategories.has(category);

    const [
      outgoingCheckouts,
      outgoingVendorReturns,
      incomingReturns,
      incomingRentalImports,
      incomingSharedImports,
      equipmentCount,
      calibrationCount,
      inspectionCount,
      nonconformityCount,
      disposalReviewCount,
      disposalFinalCount,
      planReviewCount,
      planFinalCount,
      softwareCount,
    ] = await Promise.all([
      // === Outgoing (반출) — SSOT: CHECKOUT_DATA_SCOPE ===
      shouldQuery(AC.OUTGOING)
        ? this.getCheckoutCount(
            CheckoutStatusValues.PENDING,
            userCtx,
            undefined,
            CheckoutPurposeValues.RETURN_TO_VENDOR
          )
        : Promise.resolve(0),

      shouldQuery(AC.OUTGOING)
        ? this.getCheckoutCount(
            CheckoutStatusValues.PENDING,
            userCtx,
            CheckoutPurposeValues.RETURN_TO_VENDOR
          )
        : Promise.resolve(0),

      // === Incoming (반입) — SSOT: CHECKOUT_DATA_SCOPE / EQUIPMENT_IMPORT_DATA_SCOPE ===
      shouldQuery(AC.INCOMING)
        ? this.getCheckoutCount(CheckoutStatusValues.RETURNED, userCtx)
        : Promise.resolve(0),

      shouldQuery(AC.INCOMING)
        ? this.getEquipmentImportCount(
            EquipmentImportStatusValues.PENDING,
            EquipmentImportSourceEnum.enum.rental,
            userCtx
          )
        : Promise.resolve(0),

      shouldQuery(AC.INCOMING)
        ? this.getEquipmentImportCount(
            EquipmentImportStatusValues.PENDING,
            EquipmentImportSourceEnum.enum.internal_shared,
            userCtx
          )
        : Promise.resolve(0),

      // === Specialized — 각 메서드가 자신의 SSOT 정책으로 스코프 해석 ===
      shouldQuery(AC.EQUIPMENT) ? this.getEquipmentRequestCount(userCtx) : Promise.resolve(0),
      shouldQuery(AC.CALIBRATION) ? this.getCalibrationCount(userCtx) : Promise.resolve(0),
      shouldQuery(AC.INSPECTION) ? this.getIntermediateCheckCount(userCtx) : Promise.resolve(0),
      shouldQuery(AC.NONCONFORMITY) ? this.getNonConformanceCount(userCtx) : Promise.resolve(0),
      shouldQuery(AC.DISPOSAL_REVIEW)
        ? this.getDisposalCount(DisposalReviewStatusValues.PENDING, userCtx)
        : Promise.resolve(0),
      shouldQuery(AC.DISPOSAL_FINAL)
        ? this.getDisposalCount(DisposalReviewStatusValues.REVIEWED, userCtx)
        : Promise.resolve(0),
      shouldQuery(AC.PLAN_REVIEW)
        ? this.getCalibrationPlanReviewCount(userCtx)
        : Promise.resolve(0),
      shouldQuery(AC.PLAN_FINAL) ? this.getCalibrationPlanFinalCount(userCtx) : Promise.resolve(0),
      shouldQuery(AC.SOFTWARE_VALIDATION)
        ? this.getSoftwareValidationCount(userCtx)
        : Promise.resolve(0),
    ]);

    return {
      outgoing: outgoingCheckouts + outgoingVendorReturns,
      incoming: incomingReturns + incomingRentalImports + incomingSharedImports,
      equipment: equipmentCount,
      calibration: calibrationCount,
      inspection: inspectionCount,
      nonconformity: nonconformityCount,
      disposal_review: disposalReviewCount,
      disposal_final: disposalFinalCount,
      plan_review: planReviewCount,
      plan_final: planFinalCount,
      software_validation: softwareCount,
    };
  }

  /**
   * 승인 KPI 조회 — 서버 사이드 집계
   *
   * 4개 KPI 메트릭을 서버에서 집계하여 반환:
   * - todayProcessed: audit_logs에서 오늘 처리 건수
   * - urgentCount: 지정 카테고리에서 URGENT_THRESHOLD_DAYS 이상 경과한 건수
   * - avgWaitDays: 지정 카테고리 평균 대기일
   *
   * @param userId - JWT에서 추출된 사용자 ID (todayProcessed 조회에 필요)
   * @param userCtx - Controller에서 JWT 기반으로 구성한 스코프 컨텍스트
   * @param category - 카테고리 (없으면 urgentCount/avgWaitDays = 0)
   */
  async getKpi(
    userId: string,
    userCtx: UserScopeContext,
    category?: string
  ): Promise<ApprovalKpiResponse> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayProcessedPromise = this.db
      .select({ value: count() })
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.userId, userId),
          gte(schema.auditLogs.timestamp, todayStart),
          inArray(schema.auditLogs.action, [...APPROVAL_KPI.PROCESSED_ACTIONS])
        )
      );

    const categoryKpiPromise = category
      ? this.getCategoryKpi(userCtx, category)
      : Promise.resolve({ urgentCount: 0, avgWaitDays: 0 });

    const [todayResult, categoryKpi] = await Promise.all([
      todayProcessedPromise,
      categoryKpiPromise,
    ]);

    return {
      todayProcessed: toSafeInt(todayResult[0]?.value),
      urgentCount: toSafeInt(categoryKpi.urgentCount),
      avgWaitDays: toSafeInt(categoryKpi.avgWaitDays),
    };
  }

  /**
   * 카테고리별 KPI 집계 — SQL COUNT FILTER + AVG
   *
   * 각 카테고리의 소스 테이블에서 단일 SQL 쿼리로 집계.
   * SSOT: 긴급 임계값은 APPROVAL_KPI.URGENT_THRESHOLD_DAYS 사용.
   *
   * user 정보를 파라미터로 받아 중복 DB 조회를 방지.
   */
  private async getCategoryKpi(
    userCtx: UserScopeContext,
    category: string
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDays = APPROVAL_KPI.URGENT_THRESHOLD_DAYS;

    try {
      switch (category) {
        case AC.OUTGOING:
          return this.getOutgoingKpi(userCtx, thresholdDays);
        case AC.INCOMING:
          return this.getIncomingKpi(userCtx, thresholdDays);
        case AC.EQUIPMENT:
          return this.getEquipmentRequestKpi(userCtx, thresholdDays);
        case AC.CALIBRATION:
          return this.getCalibrationKpi(userCtx, thresholdDays);
        case AC.INSPECTION:
          return this.getInspectionKpi(userCtx, thresholdDays);
        case AC.NONCONFORMITY:
          return this.getNonConformanceKpi(userCtx, thresholdDays);
        case AC.DISPOSAL_REVIEW:
          return this.getDisposalKpi(DisposalReviewStatusValues.PENDING, userCtx, thresholdDays);
        case AC.DISPOSAL_FINAL:
          return this.getDisposalKpi(DisposalReviewStatusValues.REVIEWED, userCtx, thresholdDays);
        case AC.PLAN_REVIEW:
          return this.getCalibrationPlanKpi(
            CalibrationPlanStatusValues.PENDING_REVIEW,
            userCtx,
            thresholdDays
          );
        case AC.PLAN_FINAL:
          return this.getCalibrationPlanKpi(
            CalibrationPlanStatusValues.PENDING_APPROVAL,
            userCtx,
            thresholdDays
          );
        case AC.SOFTWARE_VALIDATION:
          return this.getSoftwareValidationKpi(userCtx, thresholdDays);
        default:
          return { urgentCount: 0, avgWaitDays: 0 };
      }
    } catch (error) {
      this.logger.error(
        `KPI 조회 실패 (${category}):`,
        error instanceof Error ? error.message : error
      );
      return { urgentCount: 0, avgWaitDays: 0 };
    }
  }

  /**
   * 반출 (outgoing) KPI — 일반 반출 + 벤더 반환 합산
   *
   * SSOT: getApprovalCountsByScope()의 outgoing 로직과 동일한 분리 패턴
   * - 일반 반출: status=PENDING, purpose ≠ RETURN_TO_VENDOR
   * - 벤더 반환: status=PENDING, purpose = RETURN_TO_VENDOR
   */
  private async getOutgoingKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);

    // 일반 반출 (purpose ≠ RETURN_TO_VENDOR)
    const regularQuery = this.getCheckoutKpiQuery(
      CheckoutStatusValues.PENDING,
      userCtx,
      thresholdDate,
      { excludePurpose: CheckoutPurposeValues.RETURN_TO_VENDOR }
    );

    // 벤더 반환 (purpose = RETURN_TO_VENDOR)
    const vendorQuery = this.getCheckoutKpiQuery(
      CheckoutStatusValues.PENDING,
      userCtx,
      thresholdDate,
      { purpose: CheckoutPurposeValues.RETURN_TO_VENDOR }
    );

    const [regular, vendor] = await Promise.all([regularQuery, vendorQuery]);
    const r = regular[0];
    const v = vendor[0];

    const totalUrgent = toSafeInt(r?.urgent) + toSafeInt(v?.urgent);
    const totalCount = toSafeInt(r?.total) + toSafeInt(v?.total);
    const totalSumDays = toSafeInt(r?.sumDays) + toSafeInt(v?.sumDays);

    return {
      urgentCount: totalUrgent,
      avgWaitDays: totalCount > 0 ? Math.round(totalSumDays / totalCount) : 0,
    };
  }

  /**
   * 반출 KPI 쿼리 빌더 — COUNT + urgent + sumDays
   *
   * SSOT: CHECKOUT_DATA_SCOPE 정책 기반 스코프 필터링
   */
  private getCheckoutKpiQuery(
    status: CheckoutStatus,
    userCtx: UserScopeContext,
    thresholdDate: Date,
    filter?: { purpose?: string; excludePurpose?: string }
  ): Promise<{ total: number; urgent: number; sumDays: number }[]> {
    const conditions: SQL[] = [eq(schema.checkouts.status, status)];
    if (filter?.purpose) conditions.push(eq(schema.checkouts.purpose, filter.purpose));
    if (filter?.excludePurpose)
      conditions.push(ne(schema.checkouts.purpose, filter.excludePurpose));

    const kpiSelect = {
      total: count(),
      urgent:
        sql<number>`(count(*) filter (where ${schema.checkouts.createdAt} <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      sumDays:
        sql<number>`coalesce(sum(extract(epoch from (now() - ${schema.checkouts.createdAt})) / 86400)::int, 0)`.as(
          'sum_days'
        ),
    };

    const scopeCondition = this.buildScopeCondition(CHECKOUT_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.users.site, s),
      team: (t) => eq(schema.users.teamId, t),
    });

    if (scopeCondition) {
      return this.db
        .select(kpiSelect)
        .from(schema.checkouts)
        .innerJoin(schema.users, eq(schema.checkouts.requesterId, schema.users.id))
        .where(and(...conditions, scopeCondition));
    }
    return this.db
      .select(kpiSelect)
      .from(schema.checkouts)
      .where(and(...conditions));
  }

  /**
   * 반입 카테고리 KPI — 복합 소스 (반입 + 렌탈임포트 + 공유임포트)
   *
   * 3개 소스를 각각 쿼리 후 가중 평균 계산
   */
  private async getIncomingKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);

    // 반입 반환 건 — SSOT: CHECKOUT_DATA_SCOPE 정책 기반
    const returnQuery = this.getCheckoutKpiQuery(
      CheckoutStatusValues.RETURNED,
      userCtx,
      thresholdDate
    );

    // 렌탈 임포트 — SSOT: EQUIPMENT_IMPORT_DATA_SCOPE 정책 기반
    const rentalQuery = this.getImportKpiQuery(
      EquipmentImportSourceEnum.enum.rental,
      userCtx,
      thresholdDate
    );

    // 공유 임포트
    const sharedQuery = this.getImportKpiQuery(
      EquipmentImportSourceEnum.enum.internal_shared,
      userCtx,
      thresholdDate
    );

    const [returnResult, rentalResult, sharedResult] = await Promise.all([
      returnQuery,
      rentalQuery,
      sharedQuery,
    ]);

    const r = returnResult[0];
    const rn = rentalResult[0];
    const sh = sharedResult[0];

    const totalUrgent = toSafeInt(r?.urgent) + toSafeInt(rn?.urgent) + toSafeInt(sh?.urgent);
    const totalCount = toSafeInt(r?.total) + toSafeInt(rn?.total) + toSafeInt(sh?.total);
    const totalSumDays = toSafeInt(r?.sumDays) + toSafeInt(rn?.sumDays) + toSafeInt(sh?.sumDays);

    return {
      urgentCount: totalUrgent,
      avgWaitDays: totalCount > 0 ? Math.round(totalSumDays / totalCount) : 0,
    };
  }

  private getImportKpiQuery(
    sourceType: EquipmentImportSource,
    userCtx: UserScopeContext,
    thresholdDate: Date
  ): Promise<{ total: number; urgent: number; sumDays: number }[]> {
    const conditions: SQL[] = [
      eq(schema.equipmentImports.status, EquipmentImportStatusValues.PENDING),
      eq(schema.equipmentImports.sourceType, sourceType),
    ];
    const scopeCondition = this.buildScopeCondition(EQUIPMENT_IMPORT_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.equipmentImports.site, s),
    });
    if (scopeCondition) conditions.push(scopeCondition);

    return this.db
      .select({
        total: count(),
        urgent:
          sql<number>`(count(*) filter (where ${schema.equipmentImports.createdAt} <= ${thresholdDate}))::int`.as(
            'urgent'
          ),
        sumDays:
          sql<number>`coalesce(sum(extract(epoch from (now() - ${schema.equipmentImports.createdAt})) / 86400)::int, 0)`.as(
            'sum_days'
          ),
      })
      .from(schema.equipmentImports)
      .where(and(...conditions));
  }

  /**
   * 장비 등록 승인 KPI — SSOT: EQUIPMENT_REQUEST_DATA_SCOPE
   */
  private async getEquipmentRequestKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);
    const conditions: SQL[] = [
      eq(schema.equipmentRequests.approvalStatus, ApprovalStatusEnum.enum.pending_approval),
    ];
    const kpiSelect = {
      urgent:
        sql<number>`(count(*) filter (where ${schema.equipmentRequests.createdAt} <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      avgDays:
        sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.equipmentRequests.createdAt})) / 86400))::int, 0)`.as(
          'avg_days'
        ),
    };
    const scopeCondition = this.buildScopeCondition(EQUIPMENT_REQUEST_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.users.site, s),
      team: (t) => eq(schema.users.teamId, t),
    });

    const [result] = scopeCondition
      ? await this.db
          .select(kpiSelect)
          .from(schema.equipmentRequests)
          .innerJoin(schema.users, eq(schema.equipmentRequests.requestedBy, schema.users.id))
          .where(and(...conditions, scopeCondition))
      : await this.db
          .select(kpiSelect)
          .from(schema.equipmentRequests)
          .where(and(...conditions));

    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 교정 기록 승인 KPI — SSOT: CALIBRATION_DATA_SCOPE
   */
  private async getCalibrationKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);
    const conditions: SQL[] = [
      eq(schema.calibrations.approvalStatus, CalibrationApprovalStatusEnum.enum.pending_approval),
    ];
    const kpiSelect = {
      urgent:
        sql<number>`(count(*) filter (where ${schema.calibrations.createdAt} <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      avgDays:
        sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.calibrations.createdAt})) / 86400))::int, 0)`.as(
          'avg_days'
        ),
    };
    const scopeCondition = this.buildScopeCondition(CALIBRATION_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.equipment.site, s),
      team: (t) => eq(schema.equipment.teamId, t),
    });

    const [result] = scopeCondition
      ? await this.db
          .select(kpiSelect)
          .from(schema.calibrations)
          .innerJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
          .where(and(...conditions, scopeCondition))
      : await this.db
          .select(kpiSelect)
          .from(schema.calibrations)
          .where(and(...conditions));

    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 중간점검 KPI — SSOT: INTERMEDIATE_CHECK_DATA_SCOPE
   */
  private async getInspectionKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const today = new Date().toISOString().split('T')[0];
    const thresholdDate = this.getThresholdDate(thresholdDays);
    const conditions: SQL[] = [
      isNotNull(schema.calibrations.intermediateCheckDate),
      lt(schema.calibrations.intermediateCheckDate, today),
    ];
    const kpiSelect = {
      urgent:
        sql<number>`(count(*) filter (where ${schema.calibrations.intermediateCheckDate}::timestamp <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      avgDays:
        sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.calibrations.intermediateCheckDate}::timestamp)) / 86400))::int, 0)`.as(
          'avg_days'
        ),
    };
    const scopeCondition = this.buildScopeCondition(INTERMEDIATE_CHECK_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.equipment.site, s),
      team: (t) => eq(schema.equipment.teamId, t),
    });

    const [result] = scopeCondition
      ? await this.db
          .select(kpiSelect)
          .from(schema.calibrations)
          .innerJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
          .where(and(...conditions, scopeCondition))
      : await this.db
          .select(kpiSelect)
          .from(schema.calibrations)
          .where(and(...conditions));

    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 부적합 종료 승인 KPI
   */
  private async getNonConformanceKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);
    const conditions: SQL[] = [
      eq(schema.nonConformances.status, NonConformanceStatusValues.CORRECTED),
      isNull(schema.nonConformances.deletedAt),
      and(
        or(
          notInArray(schema.nonConformances.ncType, [...getNCTypesRequiring('repair')]),
          isNotNull(schema.nonConformances.repairHistoryId)
        )!,
        or(
          notInArray(schema.nonConformances.ncType, [...getNCTypesRequiring('recalibration')]),
          isNotNull(schema.nonConformances.calibrationId)
        )!
      )!,
    ];

    // SSOT: NON_CONFORMANCE_DATA_SCOPE 정책 기반 스코프 필터링
    const scopeCondition = this.buildScopeCondition(NON_CONFORMANCE_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.equipment.site, s),
      team: (t) => eq(schema.equipment.teamId, t),
    });
    if (scopeCondition) conditions.push(scopeCondition);

    const [result] = await this.db
      .select({
        urgent:
          sql<number>`(count(*) filter (where ${schema.nonConformances.createdAt} <= ${thresholdDate}))::int`.as(
            'urgent'
          ),
        avgDays:
          sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.nonConformances.createdAt})) / 86400))::int, 0)`.as(
            'avg_days'
          ),
      })
      .from(schema.nonConformances)
      .innerJoin(schema.equipment, eq(schema.nonConformances.equipmentId, schema.equipment.id))
      .where(and(...conditions));

    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 폐기 승인 KPI — SSOT: DISPOSAL_DATA_SCOPE
   *
   * review/final 통합: reviewStatus로 단계 구분, 정책으로 스코프 자동 해석.
   */
  private async getDisposalKpi(
    reviewStatus: DisposalReviewStatus,
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);
    const conditions: SQL[] = [eq(schema.disposalRequests.reviewStatus, reviewStatus)];
    const kpiSelect = {
      urgent:
        sql<number>`(count(*) filter (where ${schema.disposalRequests.createdAt} <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      avgDays:
        sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.disposalRequests.createdAt})) / 86400))::int, 0)`.as(
          'avg_days'
        ),
    };
    const scopeCondition = this.buildScopeCondition(DISPOSAL_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.equipment.site, s),
      team: (t) => eq(schema.equipment.teamId, t),
    });

    const [result] = scopeCondition
      ? await this.db
          .select(kpiSelect)
          .from(schema.disposalRequests)
          .innerJoin(schema.equipment, eq(schema.disposalRequests.equipmentId, schema.equipment.id))
          .where(and(...conditions, scopeCondition))
      : await this.db
          .select(kpiSelect)
          .from(schema.disposalRequests)
          .where(and(...conditions));

    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 교정계획서 KPI (검토/최종 공용) — SSOT: CALIBRATION_PLAN_DATA_SCOPE
   */
  private async getCalibrationPlanKpi(
    status: CalibrationPlanStatus,
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);

    const kpiSelect = {
      urgent:
        sql<number>`(count(*) filter (where ${schema.calibrationPlans.createdAt} <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      avgDays:
        sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.calibrationPlans.createdAt})) / 86400))::int, 0)`.as(
          'avg_days'
        ),
    };

    const conditions: SQL[] = [
      eq(schema.calibrationPlans.status, status),
      eq(schema.calibrationPlans.isLatestVersion, true),
    ];

    const scopeCondition = this.buildScopeCondition(CALIBRATION_PLAN_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.calibrationPlans.siteId, s),
      team: (t) => eq(schema.calibrationPlans.teamId, t),
    });
    if (scopeCondition) conditions.push(scopeCondition);

    const [result] = await this.db
      .select(kpiSelect)
      .from(schema.calibrationPlans)
      .where(and(...conditions));

    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 소프트웨어 유효성 확인 KPI — SSOT: TEST_SOFTWARE_DATA_SCOPE (test_software JOIN)
   */
  private async getSoftwareValidationKpi(
    userCtx: UserScopeContext,
    thresholdDays: number
  ): Promise<{ urgentCount: number; avgWaitDays: number }> {
    const thresholdDate = this.getThresholdDate(thresholdDays);

    const kpiSelect = {
      urgent:
        sql<number>`(count(*) filter (where ${schema.softwareValidations.submittedAt} <= ${thresholdDate}))::int`.as(
          'urgent'
        ),
      avgDays:
        sql<number>`coalesce(round(avg(extract(epoch from (now() - ${schema.softwareValidations.submittedAt})) / 86400))::int, 0)`.as(
          'avg_days'
        ),
    };

    const conditions: SQL[] = [
      or(
        eq(schema.softwareValidations.status, ValidationStatusValues.SUBMITTED),
        eq(schema.softwareValidations.status, ValidationStatusValues.APPROVED)
      )!,
    ];

    const scopeCondition = this.buildScopeCondition(TEST_SOFTWARE_DATA_SCOPE, userCtx, {
      site: (s) => eq(schema.testSoftware.site, s),
    });

    if (scopeCondition) {
      const [result] = await this.db
        .select(kpiSelect)
        .from(schema.softwareValidations)
        .innerJoin(
          schema.testSoftware,
          eq(schema.softwareValidations.testSoftwareId, schema.testSoftware.id)
        )
        .where(and(...conditions, scopeCondition));
      return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
    }

    const [result] = await this.db
      .select(kpiSelect)
      .from(schema.softwareValidations)
      .where(and(...conditions));
    return { urgentCount: toSafeInt(result?.urgent), avgWaitDays: toSafeInt(result?.avgDays) };
  }

  /**
   * 현재 시각에서 thresholdDays만큼 이전 날짜 계산
   */
  private getThresholdDate(thresholdDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - thresholdDays);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 정책 기반 스코프 SQL 조건 생성 (SSOT)
   *
   * SiteScopeInterceptor와 동일한 resolveDataScope()를 사용하여
   * COUNT/KPI 쿼리에서도 SSOT 정책 기반 필터링을 보장합니다.
   *
   * 콜백 패턴으로 테이블 독립적 — 호출자가 자신의 JOIN 컬럼을 지정합니다.
   *
   * @example
   * // NC: equipment.site 기반
   * buildScopeCondition(NON_CONFORMANCE_DATA_SCOPE, userCtx, {
   *   site: (s) => eq(schema.equipment.site, s),
   *   team: (t) => eq(schema.equipment.teamId, t),
   * });
   * // Checkout: users 테이블 기반
   * buildScopeCondition(CHECKOUT_DATA_SCOPE, userCtx, {
   *   site: (s) => eq(schema.users.site, s),
   *   team: (t) => eq(schema.users.teamId, t),
   * });
   */
  private buildScopeCondition(
    policy: FeatureScopePolicy,
    userCtx: UserScopeContext,
    scopeFilters: {
      site?: (siteValue: string) => SQL;
      team?: (teamIdValue: string) => SQL;
    }
  ): SQL | undefined {
    const scope = resolveDataScope(userCtx, policy);

    switch (scope.type) {
      case 'all':
        return undefined;
      case 'site':
        if (!scope.site) {
          throw new ForbiddenException({
            code: 'SCOPE_ACCESS_DENIED',
            message: 'No site assigned to user',
          });
        }
        if (!scopeFilters.site) {
          throw new ForbiddenException({
            code: 'SCOPE_FILTER_UNAVAILABLE',
            message: 'Site scope filter is not available for this resource',
          });
        }
        return scopeFilters.site(scope.site);
      case 'team':
        // SiteScopeInterceptor와 동일: teamId 없으면 site 폴백, 둘 다 없으면 차단
        if (!scope.teamId) {
          if (scope.site && scopeFilters.site) {
            return scopeFilters.site(scope.site);
          }
          throw new ForbiddenException({
            code: 'SCOPE_ACCESS_DENIED',
            message: 'No team or site assigned to user',
          });
        }
        // team 콜백 있으면 사용, 없으면 site로 폴백 (team ⊂ site)
        if (scopeFilters.team) {
          return scopeFilters.team(scope.teamId);
        }
        if (scope.site && scopeFilters.site) {
          return scopeFilters.site(scope.site);
        }
        throw new ForbiddenException({
          code: 'SCOPE_FILTER_UNAVAILABLE',
          message: 'Team/site scope filter is not available for this resource',
        });
      case 'none':
        // ROLE_CATEGORIES gating에서 이미 제외 — 안전장치
        return sql`false`;
    }
  }

  /**
   * 반출 승인 대기 개수 조회
   *
   * SSOT: CHECKOUT_DATA_SCOPE 정책 기반 스코프 필터링
   * - TM: team (requesterId → users.teamId)
   * - QM/LM: site (requesterId → users.site)
   * - all: 필터 없음 (users JOIN 생략 → 성능)
   */
  private async getCheckoutCount(
    status: CheckoutStatus,
    userCtx: UserScopeContext,
    purpose?: string,
    excludePurpose?: string
  ): Promise<number> {
    try {
      const conditions: SQL[] = [eq(schema.checkouts.status, status)];
      if (purpose) conditions.push(eq(schema.checkouts.purpose, purpose));
      if (excludePurpose) conditions.push(ne(schema.checkouts.purpose, excludePurpose));

      const scopeCondition = this.buildScopeCondition(CHECKOUT_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.users.site, s),
        team: (t) => eq(schema.users.teamId, t),
      });

      // 스코프 필터 있으면 users JOIN 필요, 없으면 (all) JOIN 생략
      if (scopeCondition) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.checkouts)
          .innerJoin(schema.users, eq(schema.checkouts.requesterId, schema.users.id))
          .where(and(...conditions, scopeCondition));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.checkouts)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '반출 승인 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  /**
   * 장비 반입 승인 대기 개수 — SSOT: EQUIPMENT_IMPORT_DATA_SCOPE
   */
  private async getEquipmentImportCount(
    status: EquipmentImportStatus,
    sourceType: EquipmentImportSource,
    userCtx: UserScopeContext
  ): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(schema.equipmentImports.status, status),
        eq(schema.equipmentImports.sourceType, sourceType),
      ];
      const scopeCondition = this.buildScopeCondition(EQUIPMENT_IMPORT_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.equipmentImports.site, s),
        team: (t) => eq(schema.equipmentImports.teamId, t),
      });
      if (scopeCondition) conditions.push(scopeCondition);

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.equipmentImports)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '장비 반입 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  /**
   * 장비 등록/수정/삭제 승인 대기 개수 — SSOT: EQUIPMENT_REQUEST_DATA_SCOPE
   *
   * JOIN 경로: equipmentRequests → users (requestedBy) → users.teamId/site
   */
  private async getEquipmentRequestCount(userCtx: UserScopeContext): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(schema.equipmentRequests.approvalStatus, ApprovalStatusEnum.enum.pending_approval),
      ];
      const scopeCondition = this.buildScopeCondition(EQUIPMENT_REQUEST_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.users.site, s),
        team: (t) => eq(schema.users.teamId, t),
      });

      if (scopeCondition) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.equipmentRequests)
          .innerJoin(schema.users, eq(schema.equipmentRequests.requestedBy, schema.users.id))
          .where(and(...conditions, scopeCondition));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.equipmentRequests)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '장비 요청 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  /**
   * 교정 기록 승인 대기 개수 — SSOT: CALIBRATION_DATA_SCOPE
   */
  private async getCalibrationCount(userCtx: UserScopeContext): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(schema.calibrations.approvalStatus, CalibrationApprovalStatusEnum.enum.pending_approval),
      ];
      const scopeCondition = this.buildScopeCondition(CALIBRATION_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.equipment.site, s),
        team: (t) => eq(schema.equipment.teamId, t),
      });

      if (scopeCondition) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.calibrations)
          .innerJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
          .where(and(...conditions, scopeCondition));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrations)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error('교정 카운트 조회 실패:', error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * 중간점검 처리 대기 개수 — SSOT: INTERMEDIATE_CHECK_DATA_SCOPE
   */
  private async getIntermediateCheckCount(userCtx: UserScopeContext): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const conditions: SQL[] = [
        isNotNull(schema.calibrations.intermediateCheckDate),
        lte(schema.calibrations.intermediateCheckDate, today),
      ];
      const scopeCondition = this.buildScopeCondition(INTERMEDIATE_CHECK_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.equipment.site, s),
        team: (t) => eq(schema.equipment.teamId, t),
      });

      if (scopeCondition) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.calibrations)
          .innerJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
          .where(and(...conditions, scopeCondition));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrations)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '중간점검 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  /**
   * 부적합 종료 승인 대기 개수 (corrected 상태)
   *
   * Team filtering:
   * - technical_manager: Only non-conformances from their own team
   * - lab_manager: All non-conformances (cross-site visibility)
   */
  private async getNonConformanceCount(userCtx: UserScopeContext): Promise<number> {
    try {
      // N+1 제거: findMany + 2중 client-side filter → COUNT + SQL WHERE 푸시다운
      // NC_CORRECTION_PREREQUISITES SSOT 기반 전제조건 필터
      const repairTypes = getNCTypesRequiring('repair');
      const recalibrationTypes = getNCTypesRequiring('recalibration');
      const conditions: SQL[] = [
        eq(schema.nonConformances.status, NonConformanceStatusValues.CORRECTED),
        isNull(schema.nonConformances.deletedAt),
        // 전제조건 충족된 NC만 승인 가능
        and(
          or(
            notInArray(schema.nonConformances.ncType, [...repairTypes]),
            isNotNull(schema.nonConformances.repairHistoryId)
          )!,
          or(
            notInArray(schema.nonConformances.ncType, [...recalibrationTypes]),
            isNotNull(schema.nonConformances.calibrationId)
          )!
        )!,
      ];

      // SSOT: NON_CONFORMANCE_DATA_SCOPE 정책 기반 스코프 필터링
      const scopeCondition = this.buildScopeCondition(NON_CONFORMANCE_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.equipment.site, s),
        team: (t) => eq(schema.equipment.teamId, t),
      });
      if (scopeCondition) conditions.push(scopeCondition);

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.nonConformances)
        .innerJoin(schema.equipment, eq(schema.nonConformances.equipmentId, schema.equipment.id))
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error('부적합 카운트 조회 실패:', error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * 폐기 승인 대기 개수 — SSOT: DISPOSAL_DATA_SCOPE
   *
   * review/final 통합: reviewStatus 파라미터로 단계 구분.
   * - PENDING (검토 대기): TM → team 스코프
   * - REVIEWED (최종 승인 대기): LM → site 스코프
   * 단일 정책으로 역할별 스코프가 자동 해석됩니다.
   */
  private async getDisposalCount(
    reviewStatus: DisposalReviewStatus,
    userCtx: UserScopeContext
  ): Promise<number> {
    try {
      const conditions: SQL[] = [eq(schema.disposalRequests.reviewStatus, reviewStatus)];
      const scopeCondition = this.buildScopeCondition(DISPOSAL_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.equipment.site, s),
        team: (t) => eq(schema.equipment.teamId, t),
      });

      if (scopeCondition) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.disposalRequests)
          .innerJoin(schema.equipment, eq(schema.disposalRequests.equipmentId, schema.equipment.id))
          .where(and(...conditions, scopeCondition));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.disposalRequests)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error('폐기 카운트 조회 실패:', error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * 교정계획서 검토 대기 개수 (품질책임자) — SSOT: CALIBRATION_PLAN_DATA_SCOPE
   */
  private async getCalibrationPlanReviewCount(userCtx: UserScopeContext): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(schema.calibrationPlans.status, CalibrationPlanStatusValues.PENDING_REVIEW),
        eq(schema.calibrationPlans.isLatestVersion, true),
      ];

      const scopeCondition = this.buildScopeCondition(CALIBRATION_PLAN_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.calibrationPlans.siteId, s),
        team: (t) => eq(schema.calibrationPlans.teamId, t),
      });
      if (scopeCondition) conditions.push(scopeCondition);

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrationPlans)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '교정계획서 검토 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  /**
   * 교정계획서 최종 승인 대기 개수 (시험소장) — SSOT: CALIBRATION_PLAN_DATA_SCOPE
   */
  private async getCalibrationPlanFinalCount(userCtx: UserScopeContext): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(schema.calibrationPlans.status, CalibrationPlanStatusValues.PENDING_APPROVAL),
        eq(schema.calibrationPlans.isLatestVersion, true),
      ];

      const scopeCondition = this.buildScopeCondition(CALIBRATION_PLAN_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.calibrationPlans.siteId, s),
        team: (t) => eq(schema.calibrationPlans.teamId, t),
      });
      if (scopeCondition) conditions.push(scopeCondition);

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrationPlans)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '교정계획서 최종승인 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  /**
   * 소프트웨어 유효성 확인 승인 대기 개수 — SSOT: TEST_SOFTWARE_DATA_SCOPE (test_software JOIN)
   */
  private async getSoftwareValidationCount(userCtx: UserScopeContext): Promise<number> {
    try {
      const conditions: SQL[] = [
        or(
          eq(schema.softwareValidations.status, ValidationStatusValues.SUBMITTED),
          eq(schema.softwareValidations.status, ValidationStatusValues.APPROVED)
        )!,
      ];

      const scopeCondition = this.buildScopeCondition(TEST_SOFTWARE_DATA_SCOPE, userCtx, {
        site: (s) => eq(schema.testSoftware.site, s),
      });

      if (scopeCondition) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.softwareValidations)
          .innerJoin(
            schema.testSoftware,
            eq(schema.softwareValidations.testSoftwareId, schema.testSoftware.id)
          )
          .where(and(...conditions, scopeCondition));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.softwareValidations)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error(
        '소프트웨어 유효성 확인 카운트 조회 실패:',
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }
}
