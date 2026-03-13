import { Injectable, Inject } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import {
  equipment as equipmentTable,
  calibrations as calibrationsTable,
  checkouts as checkoutsTable,
  checkoutItems as checkoutItemsTable,
  teams as teamsTable,
  repairHistory as repairHistoryTable,
  auditLogs as auditLogsTable,
} from '@equipment-management/db/schema';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  EquipmentStatusValues as ESVal,
  CheckoutStatusValues as CSVal,
  CalibrationStatusEnum,
  type AuditAction,
  type AuditEntityType,
  type AuditLogFilter,
  type CalibrationStatus,
  type EquipmentStatus,
} from '@equipment-management/schemas';
import { USER_ROLE_LABELS, type UserRole } from '@equipment-management/shared-constants';
import type { ReportColumn, ReportData } from './report-export.service';

// ─── 공통 날짜 유틸 ───────────────────────────────────────────────────────────

/**
 * period 문자열에서 [start, end] 날짜 범위를 계산합니다.
 * startDate/endDate가 직접 제공되면 그대로 사용합니다.
 */
function resolveDateRange(
  period: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (period) {
    case 'last_week':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'last_year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default: // last_month
      start.setMonth(start.getMonth() - 1);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

// ─── 상태 레이블 (한국어) ────────────────────────────────────────────────────

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  available: '사용가능',
  in_use: '사용중',
  checked_out: '반출중',
  calibration_scheduled: '교정예정',
  calibration_overdue: '교정기한초과',
  non_conforming: '부적합',
  spare: '여분',
  retired: '폐기',
  pending_disposal: '폐기대기',
  disposed: '폐기완료',
  temporary: '임시',
  inactive: '비활성',
};

const CALIBRATION_STATUS_LABELS: Record<string, string> = {
  scheduled: '예정됨',
  in_progress: '진행중',
  completed: '완료됨',
  failed: '실패',
};

@Injectable()
export class ReportsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // 통계 집계 API (JSON 응답 — 기존 엔드포인트)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * 장비 사용(반출) 통계
   */
  async getEquipmentUsage(
    startDate?: string,
    endDate?: string,
    equipmentId?: string,
    _departmentId?: string
  ) {
    const { start, end } = resolveDateRange('last_month', startDate, endDate);

    // checkouts ←→ checkoutItems ←→ equipment ←→ teams
    const dateConditions = [
      gte(checkoutsTable.createdAt, start),
      lte(checkoutsTable.createdAt, end),
    ];
    const equipCondition = equipmentId
      ? eq(checkoutItemsTable.equipmentId, equipmentId)
      : undefined;

    const teamRows = await this.db
      .select({
        teamName: teamsTable.name,
        checkoutCount: count(checkoutsTable.id),
        equipmentCount: sql<number>`COUNT(DISTINCT ${checkoutItemsTable.equipmentId})`,
      })
      .from(checkoutsTable)
      .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
      .leftJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(and(...dateConditions, ...(equipCondition ? [equipCondition] : [])))
      .groupBy(teamsTable.id, teamsTable.name);

    const topRows = await this.db
      .select({
        equipmentId: checkoutItemsTable.equipmentId,
        name: equipmentTable.name,
        checkoutCount: count(checkoutsTable.id),
      })
      .from(checkoutsTable)
      .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
      .leftJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .where(and(...dateConditions, ...(equipCondition ? [equipCondition] : [])))
      .groupBy(checkoutItemsTable.equipmentId, equipmentTable.name)
      .orderBy(desc(count(checkoutsTable.id)))
      .limit(5);

    const totalCheckouts = teamRows.reduce((acc, r) => acc + Number(r.checkoutCount), 0);

    return {
      timeframe: { startDate: start.toISOString(), endDate: end.toISOString() },
      totalUsageHours: totalCheckouts * 8,
      totalEquipmentCount: topRows.length,
      departmentDistribution: teamRows.map((r) => ({
        departmentId: r.teamName ?? '미배정',
        departmentName: r.teamName ?? '미배정',
        usageHours: Number(r.checkoutCount) * 8,
        equipmentCount: Number(r.equipmentCount),
      })),
      topEquipment: topRows.map((r) => ({
        equipmentId: r.equipmentId ?? '',
        name: r.name ?? '',
        usageHours: Number(r.checkoutCount) * 8,
        usageCount: Number(r.checkoutCount),
      })),
      monthlyTrend: await this._getMonthlyCheckoutTrend(start, end),
    };
  }

  /**
   * 교정 상태 통계
   */
  async getCalibrationStatus(status?: string, timeframe?: string) {
    const { start, end } = resolveDateRange(timeframe ?? 'last_month');

    const calConditions = [
      gte(calibrationsTable.calibrationDate, start),
      lte(calibrationsTable.calibrationDate, end),
    ];
    if (status) calConditions.push(eq(calibrationsTable.status, status as CalibrationStatus));

    const statusRows = await this.db
      .select({
        status: calibrationsTable.status,
        statusCount: count(calibrationsTable.id),
      })
      .from(calibrationsTable)
      .where(and(...calConditions))
      .groupBy(calibrationsTable.status);

    const totalCalibrations = statusRows.reduce((acc, r) => acc + Number(r.statusCount), 0);

    const [overdueRow] = await this.db
      .select({ cnt: count(equipmentTable.id) })
      .from(equipmentTable)
      .where(eq(equipmentTable.status, ESVal.CALIBRATION_OVERDUE));

    const [dueRow] = await this.db
      .select({ cnt: count(equipmentTable.id) })
      .from(equipmentTable)
      .where(eq(equipmentTable.status, ESVal.CALIBRATION_SCHEDULED));

    const [totalEquipRow] = await this.db
      .select({ cnt: count(equipmentTable.id) })
      .from(equipmentTable);

    return {
      summary: {
        totalEquipment: Number(totalEquipRow?.cnt ?? 0),
        requireCalibration: Number(dueRow?.cnt ?? 0) + Number(overdueRow?.cnt ?? 0),
        dueThisMonth: Number(dueRow?.cnt ?? 0),
        overdue: Number(overdueRow?.cnt ?? 0),
        completedThisMonth: statusRows
          .filter((r) => r.status === CalibrationStatusEnum.enum.completed)
          .reduce((acc, r) => acc + Number(r.statusCount), 0),
      },
      status: statusRows.map((r) => ({
        status: CALIBRATION_STATUS_LABELS[r.status] ?? r.status,
        count: Number(r.statusCount),
        percentage:
          totalCalibrations > 0
            ? Math.round((Number(r.statusCount) / totalCalibrations) * 1000) / 10
            : 0,
      })),
      calibrationTrend: await this._getMonthlyCalibrationTrend(start, end),
    };
  }

  /**
   * @deprecated Use getCheckoutStatistics. 메서드 이름 호환성 유지.
   */
  async getRentalStatistics(startDate?: string, endDate?: string, departmentId?: string) {
    return this.getCheckoutStatistics(startDate, endDate, departmentId);
  }

  /**
   * 반출 통계 (대여/교정/수리 포함)
   */
  async getCheckoutStatistics(startDate?: string, endDate?: string, _departmentId?: string) {
    const { start, end } = resolveDateRange('last_month', startDate, endDate);

    const dateConditions = [
      gte(checkoutsTable.createdAt, start),
      lte(checkoutsTable.createdAt, end),
    ];

    const statusRows = await this.db
      .select({
        status: checkoutsTable.status,
        statusCount: count(checkoutsTable.id),
      })
      .from(checkoutsTable)
      .where(and(...dateConditions))
      .groupBy(checkoutsTable.status);

    const teamRows = await this.db
      .select({
        teamName: teamsTable.name,
        teamId: teamsTable.id,
        checkoutCount: count(checkoutsTable.id),
      })
      .from(checkoutsTable)
      .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
      .leftJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(and(...dateConditions))
      .groupBy(teamsTable.id, teamsTable.name);

    const totalCount = statusRows.reduce((acc, r) => acc + Number(r.statusCount), 0);
    const activeStatuses: Set<string> = new Set([
      CSVal.APPROVED,
      CSVal.CHECKED_OUT,
      CSVal.LENDER_CHECKED,
      CSVal.BORROWER_RECEIVED,
      CSVal.IN_USE,
    ]);
    const returnedStatuses: Set<string> = new Set([
      CSVal.RETURNED,
      CSVal.RETURN_APPROVED,
      CSVal.LENDER_RECEIVED,
    ]);

    const activeCount = statusRows
      .filter((r) => activeStatuses.has(r.status))
      .reduce((acc, r) => acc + Number(r.statusCount), 0);
    const returnedCount = statusRows
      .filter((r) => returnedStatuses.has(r.status))
      .reduce((acc, r) => acc + Number(r.statusCount), 0);

    return {
      timeframe: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalCheckouts: totalCount,
        activeCheckouts: activeCount,
        avgCheckoutDuration: 4.5,
        returnRate: totalCount > 0 ? Math.round((returnedCount / totalCount) * 1000) / 10 : 0,
      },
      checkoutsByDepartment: teamRows.map((r) => ({
        departmentId: r.teamId ?? '미배정',
        departmentName: r.teamName ?? '미배정',
        count: Number(r.checkoutCount),
        percentage:
          totalCount > 0 ? Math.round((Number(r.checkoutCount) / totalCount) * 1000) / 10 : 0,
      })),
      checkoutStatus: statusRows.map((r) => ({
        status: r.status,
        count: Number(r.statusCount),
        percentage:
          totalCount > 0 ? Math.round((Number(r.statusCount) / totalCount) * 1000) / 10 : 0,
      })),
      monthlyTrend: await this._getMonthlyCheckoutTrend(start, end),
    };
  }

  /**
   * 장비 활용률 통계
   */
  async getUtilizationRate(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    equipmentId?: string,
    _categoryId?: string
  ) {
    const { start, end } = resolveDateRange(`last_${period}`);

    const checkoutDateConditions = [
      gte(checkoutsTable.createdAt, start),
      lte(checkoutsTable.createdAt, end),
    ];
    const itemCondition = equipmentId ? eq(checkoutItemsTable.equipmentId, equipmentId) : undefined;

    const rows = await this.db
      .select({
        equipmentId: equipmentTable.id,
        name: equipmentTable.name,
        managementNumber: equipmentTable.managementNumber,
        teamName: teamsTable.name,
        checkoutCount: sql<number>`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .leftJoin(
        checkoutsTable,
        and(eq(checkoutsTable.id, checkoutItemsTable.checkoutId), ...checkoutDateConditions)
      )
      .where(itemCondition)
      .groupBy(
        equipmentTable.id,
        equipmentTable.name,
        equipmentTable.managementNumber,
        teamsTable.name
      )
      .orderBy(desc(sql`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`));

    const periodDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    const withRate = rows.map((r) => ({
      ...r,
      utilizationRate: Math.min(
        100,
        Math.round((Number(r.checkoutCount) / periodDays) * 1000) / 10
      ),
    }));

    const avg =
      withRate.length > 0
        ? withRate.reduce((acc, r) => acc + r.utilizationRate, 0) / withRate.length
        : 0;

    const sorted = [...withRate].sort((a, b) => b.utilizationRate - a.utilizationRate);

    return {
      period,
      summary: {
        averageUtilization: Math.round(avg * 10) / 10,
        highUtilizationCount: withRate.filter((r) => r.utilizationRate >= 80).length,
        lowUtilizationCount: withRate.filter((r) => r.utilizationRate <= 20).length,
        totalEquipmentCount: withRate.length,
      },
      utilizationByCategory: [],
      topUtilized: sorted.slice(0, 5).map((r) => ({
        equipmentId: r.equipmentId,
        name: `${r.name} (${r.managementNumber})`,
        utilizationRate: r.utilizationRate,
        department: r.teamName ?? '-',
      })),
      lowUtilized: sorted
        .slice(-5)
        .reverse()
        .map((r) => ({
          equipmentId: r.equipmentId,
          name: `${r.name} (${r.managementNumber})`,
          utilizationRate: r.utilizationRate,
          department: r.teamName ?? '-',
        })),
    };
  }

  /**
   * 장비 가동 중단(수리) 통계
   */
  async getEquipmentDowntime(startDate?: string, endDate?: string, equipmentId?: string) {
    const { start, end } = resolveDateRange('last_month', startDate, endDate);

    const conditions = [
      gte(repairHistoryTable.repairDate, start),
      lte(repairHistoryTable.repairDate, end),
    ];
    if (equipmentId) conditions.push(eq(repairHistoryTable.equipmentId, equipmentId));

    const repairRows = await this.db
      .select({
        equipmentId: equipmentTable.id,
        name: equipmentTable.name,
        managementNumber: equipmentTable.managementNumber,
        incidentCount: count(repairHistoryTable.id),
      })
      .from(repairHistoryTable)
      .leftJoin(equipmentTable, eq(repairHistoryTable.equipmentId, equipmentTable.id))
      .where(and(...conditions))
      .groupBy(equipmentTable.id, equipmentTable.name, equipmentTable.managementNumber)
      .orderBy(desc(count(repairHistoryTable.id)))
      .limit(10);

    const totalIncidents = repairRows.reduce((acc, r) => acc + Number(r.incidentCount), 0);

    return {
      timeframe: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalDowntimeHours: totalIncidents * 8,
        totalIncidents,
        avgDowntimeDuration: totalIncidents > 0 ? 8 : 0,
        affectedEquipmentCount: repairRows.length,
      },
      downtimeReasons: [{ reason: '고장 수리', hours: totalIncidents * 8, percentage: 100 }],
      topDowntimeEquipment: repairRows.slice(0, 3).map((r) => ({
        equipmentId: r.equipmentId ?? '',
        name: `${r.name ?? ''} (${r.managementNumber ?? ''})`,
        downtimeHours: Number(r.incidentCount) * 8,
        incidents: Number(r.incidentCount),
      })),
      monthlyTrend: [],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 내보내기 데이터 조회 (export endpoints에서 파일 생성용)
  // ══════════════════════════════════════════════════════════════════════════

  async getEquipmentInventoryData(filters: {
    site?: string;
    status?: string;
    teamId?: string;
  }): Promise<ReportData> {
    const conditions = [];
    if (filters.site) conditions.push(eq(equipmentTable.siteCode, filters.site));
    if (filters.status)
      conditions.push(eq(equipmentTable.status, filters.status as EquipmentStatus));
    if (filters.teamId) conditions.push(eq(equipmentTable.teamId, filters.teamId));

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        name: equipmentTable.name,
        manufacturer: equipmentTable.manufacturer,
        modelName: equipmentTable.modelName,
        status: equipmentTable.status,
        teamName: teamsTable.name,
        location: equipmentTable.location,
        lastCalibrationDate: equipmentTable.lastCalibrationDate,
        nextCalibrationDate: equipmentTable.nextCalibrationDate,
        calibrationCycle: equipmentTable.calibrationCycle,
        serialNumber: equipmentTable.serialNumber,
        siteCode: equipmentTable.siteCode,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipmentTable.managementNumber);

    const columns: ReportColumn[] = [
      { header: '관리번호', key: 'managementNumber', width: 16 },
      { header: '장비명', key: 'name', width: 24 },
      { header: '제조사', key: 'manufacturer', width: 16 },
      { header: '모델명', key: 'modelName', width: 20 },
      { header: '상태', key: 'statusLabel', width: 14 },
      { header: '팀', key: 'teamName', width: 18 },
      { header: '위치', key: 'location', width: 16 },
      { header: '마지막 교정일', key: 'lastCalibration', width: 16 },
      { header: '다음 교정일', key: 'nextCalibration', width: 16 },
      { header: '교정주기(월)', key: 'calibrationCycle', width: 14 },
      { header: '시험소', key: 'siteCode', width: 10 },
    ];

    const fmtDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString('ko-KR') : '-';

    return {
      title: '장비 현황 보고서',
      columns,
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        managementNumber: r.managementNumber,
        name: r.name,
        manufacturer: r.manufacturer ?? '-',
        modelName: r.modelName ?? '-',
        statusLabel: EQUIPMENT_STATUS_LABELS[r.status] ?? r.status,
        teamName: r.teamName ?? '-',
        location: r.location ?? '-',
        lastCalibration: fmtDate(r.lastCalibrationDate),
        nextCalibration: fmtDate(r.nextCalibrationDate),
        calibrationCycle: r.calibrationCycle ? `${r.calibrationCycle}개월` : '-',
        siteCode: r.siteCode ?? '-',
        serialNumber: r.serialNumber ?? '-',
      })),
    };
  }

  async getCalibrationStatusData(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ReportData> {
    const { start, end } = resolveDateRange('last_year', filters.startDate, filters.endDate);

    const conditions = [
      gte(calibrationsTable.calibrationDate, start),
      lte(calibrationsTable.calibrationDate, end),
    ];
    if (filters.status)
      conditions.push(eq(calibrationsTable.status, filters.status as CalibrationStatus));

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        equipmentName: equipmentTable.name,
        calibrationDate: calibrationsTable.calibrationDate,
        completionDate: calibrationsTable.completionDate,
        agencyName: calibrationsTable.agencyName,
        certificateNumber: calibrationsTable.certificateNumber,
        status: calibrationsTable.status,
        approvalStatus: calibrationsTable.approvalStatus,
        result: calibrationsTable.result,
        cost: calibrationsTable.cost,
        nextCalibrationDate: calibrationsTable.nextCalibrationDate,
      })
      .from(calibrationsTable)
      .leftJoin(equipmentTable, eq(calibrationsTable.equipmentId, equipmentTable.id))
      .where(and(...conditions))
      .orderBy(desc(calibrationsTable.calibrationDate));

    const APPROVAL_LABELS: Record<string, string> = {
      pending_approval: '승인대기',
      approved: '승인됨',
      rejected: '반려됨',
    };
    const fmtDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString('ko-KR') : '-';

    return {
      title: '교정 현황 보고서',
      columns: [
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'equipmentName', width: 24 },
        { header: '교정일', key: 'calibrationDateStr', width: 14 },
        { header: '완료일', key: 'completionDateStr', width: 14 },
        { header: '교정기관', key: 'agencyName', width: 20 },
        { header: '교정증서번호', key: 'certificateNumber', width: 18 },
        { header: '상태', key: 'statusLabel', width: 12 },
        { header: '승인상태', key: 'approvalStatus', width: 14 },
        { header: '결과', key: 'result', width: 16 },
        { header: '비용(원)', key: 'costStr', width: 14 },
        { header: '다음교정일', key: 'nextCalibrationStr', width: 14 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        managementNumber: r.managementNumber ?? '-',
        equipmentName: r.equipmentName ?? '-',
        calibrationDateStr: fmtDate(r.calibrationDate),
        completionDateStr: fmtDate(r.completionDate),
        agencyName: r.agencyName ?? '-',
        certificateNumber: r.certificateNumber ?? '-',
        statusLabel: CALIBRATION_STATUS_LABELS[r.status] ?? r.status,
        approvalStatus: APPROVAL_LABELS[r.approvalStatus] ?? r.approvalStatus,
        result: r.result ?? '-',
        costStr: r.cost ? `${Number(r.cost).toLocaleString('ko-KR')}원` : '-',
        nextCalibrationStr: fmtDate(r.nextCalibrationDate),
      })),
    };
  }

  async getUtilizationData(filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
    site?: string;
  }): Promise<ReportData> {
    const { start, end } = resolveDateRange(
      filters.period ?? 'last_month',
      filters.startDate,
      filters.endDate
    );
    const periodDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    const checkoutDateConditions = [
      gte(checkoutsTable.createdAt, start),
      lte(checkoutsTable.createdAt, end),
    ];

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        name: equipmentTable.name,
        teamName: teamsTable.name,
        siteCode: equipmentTable.siteCode,
        checkoutCount: sql<number>`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .leftJoin(
        checkoutsTable,
        and(eq(checkoutsTable.id, checkoutItemsTable.checkoutId), ...checkoutDateConditions)
      )
      .where(filters.site ? eq(equipmentTable.siteCode, filters.site) : undefined)
      .groupBy(
        equipmentTable.id,
        equipmentTable.managementNumber,
        equipmentTable.name,
        teamsTable.name,
        equipmentTable.siteCode
      )
      .orderBy(desc(sql`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`));

    const getGrade = (rate: number) => {
      if (rate >= 80) return '고활용';
      if (rate >= 40) return '보통';
      return '저활용';
    };

    return {
      title: '장비 활용률 보고서',
      columns: [
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'name', width: 24 },
        { header: '팀', key: 'teamName', width: 18 },
        { header: '시험소', key: 'siteCode', width: 10 },
        { header: '반출횟수', key: 'checkoutCount', width: 12 },
        { header: '활용률(%)', key: 'utilizationRate', width: 12 },
        { header: '활용등급', key: 'utilizationGrade', width: 12 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => {
        const rate = Math.min(100, Math.round((Number(r.checkoutCount) / periodDays) * 1000) / 10);
        return {
          managementNumber: r.managementNumber,
          name: r.name,
          teamName: r.teamName ?? '-',
          siteCode: r.siteCode ?? '-',
          checkoutCount: Number(r.checkoutCount),
          utilizationRate: `${rate}%`,
          utilizationGrade: getGrade(rate),
        };
      }),
    };
  }

  async getTeamEquipmentData(filters: { site?: string; teamId?: string }): Promise<ReportData> {
    const conditions = [];
    if (filters.site) conditions.push(eq(equipmentTable.siteCode, filters.site));
    if (filters.teamId) conditions.push(eq(equipmentTable.teamId, filters.teamId));

    const rows = await this.db
      .select({
        teamName: teamsTable.name,
        teamSite: teamsTable.site,
        managementNumber: equipmentTable.managementNumber,
        name: equipmentTable.name,
        manufacturer: equipmentTable.manufacturer,
        modelName: equipmentTable.modelName,
        status: equipmentTable.status,
        location: equipmentTable.location,
        nextCalibrationDate: equipmentTable.nextCalibrationDate,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(teamsTable.name, equipmentTable.managementNumber);

    const fmtDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString('ko-KR') : '-';

    return {
      title: '팀별 장비 현황 보고서',
      columns: [
        { header: '팀명', key: 'teamName', width: 20 },
        { header: '시험소', key: 'teamSite', width: 12 },
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'name', width: 24 },
        { header: '제조사', key: 'manufacturer', width: 16 },
        { header: '모델명', key: 'modelName', width: 20 },
        { header: '상태', key: 'statusLabel', width: 14 },
        { header: '위치', key: 'location', width: 16 },
        { header: '다음 교정일', key: 'nextCalibration', width: 16 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        teamName: r.teamName ?? '미배정',
        teamSite: r.teamSite ?? '-',
        managementNumber: r.managementNumber,
        name: r.name,
        manufacturer: r.manufacturer ?? '-',
        modelName: r.modelName ?? '-',
        statusLabel: EQUIPMENT_STATUS_LABELS[r.status] ?? r.status,
        location: r.location ?? '-',
        nextCalibration: fmtDate(r.nextCalibrationDate),
      })),
    };
  }

  async getMaintenanceData(filters: {
    startDate?: string;
    endDate?: string;
    equipmentId?: string;
  }): Promise<ReportData> {
    const { start, end } = resolveDateRange('last_year', filters.startDate, filters.endDate);

    const conditions = [
      gte(repairHistoryTable.repairDate, start),
      lte(repairHistoryTable.repairDate, end),
    ];
    if (filters.equipmentId) {
      conditions.push(eq(repairHistoryTable.equipmentId, filters.equipmentId));
    }

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        equipmentName: equipmentTable.name,
        teamName: teamsTable.name,
        repairDate: repairHistoryTable.repairDate,
        repairDescription: repairHistoryTable.repairDescription,
        repairResult: repairHistoryTable.repairResult,
        notes: repairHistoryTable.notes,
      })
      .from(repairHistoryTable)
      .leftJoin(equipmentTable, eq(repairHistoryTable.equipmentId, equipmentTable.id))
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(and(...conditions))
      .orderBy(desc(repairHistoryTable.repairDate));

    const RESULT_LABELS: Record<string, string> = {
      completed: '완료',
      partial: '부분완료',
      failed: '실패',
    };

    return {
      title: '수리 및 점검 이력 보고서',
      columns: [
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'equipmentName', width: 24 },
        { header: '팀', key: 'teamName', width: 18 },
        { header: '수리일자', key: 'repairDateStr', width: 14 },
        { header: '수리내용', key: 'repairDescription', width: 30 },
        { header: '수리결과', key: 'repairResult', width: 14 },
        { header: '비용(원)', key: 'costStr', width: 14 },
        { header: '비고', key: 'notes', width: 20 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        managementNumber: r.managementNumber ?? '-',
        equipmentName: r.equipmentName ?? '-',
        teamName: r.teamName ?? '-',
        repairDateStr: r.repairDate ? new Date(r.repairDate).toLocaleDateString('ko-KR') : '-',
        repairDescription: r.repairDescription,
        repairResult: RESULT_LABELS[r.repairResult ?? ''] ?? r.repairResult ?? '-',
        costStr: '-',
        notes: r.notes ?? '-',
      })),
    };
  }

  /**
   * 감사 로그 내보내기 데이터 조회
   *
   * RBAC 스코프 필터(userSite/userTeamId)는 컨트롤러에서 resolveDataScope()로 주입됨.
   * 최대 10,000건 제한 — 대용량 데이터는 날짜 범위 필터로 분할 내보내기 권장.
   */
  async getAuditLogExportData(filter: AuditLogFilter): Promise<ReportData> {
    const conditions = [];

    if (filter.userId) conditions.push(eq(auditLogsTable.userId, filter.userId));
    if (filter.entityType) conditions.push(eq(auditLogsTable.entityType, filter.entityType));
    if (filter.entityId) conditions.push(eq(auditLogsTable.entityId, filter.entityId));
    if (filter.action) conditions.push(eq(auditLogsTable.action, filter.action));
    if (filter.startDate)
      conditions.push(gte(auditLogsTable.timestamp, new Date(filter.startDate)));
    if (filter.endDate) conditions.push(lte(auditLogsTable.timestamp, new Date(filter.endDate)));
    // RBAC 서버 강제 스코프
    if (filter.userSite) conditions.push(eq(auditLogsTable.userSite, filter.userSite));
    if (filter.userTeamId) conditions.push(eq(auditLogsTable.userTeamId, filter.userTeamId));

    const rows = await this.db
      .select({
        timestamp: auditLogsTable.timestamp,
        userName: auditLogsTable.userName,
        userRole: auditLogsTable.userRole,
        action: auditLogsTable.action,
        entityType: auditLogsTable.entityType,
        entityName: auditLogsTable.entityName,
        entityId: auditLogsTable.entityId,
        ipAddress: auditLogsTable.ipAddress,
        userSite: auditLogsTable.userSite,
      })
      .from(auditLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogsTable.timestamp))
      .limit(10_000);

    const columns: ReportColumn[] = [
      { header: '시간', key: 'timestampStr', width: 22 },
      { header: '사용자명', key: 'userName', width: 16 },
      { header: '역할', key: 'roleLabel', width: 14 },
      { header: '액션', key: 'actionLabel', width: 12 },
      { header: '대상유형', key: 'entityTypeLabel', width: 16 },
      { header: '대상명', key: 'entityName', width: 24 },
      { header: '대상ID(앞8자)', key: 'entityIdShort', width: 16 },
      { header: 'IP주소', key: 'ipAddress', width: 16 },
      { header: '시험소', key: 'userSite', width: 10 },
    ];

    const fmtTs = (d: Date | string) =>
      new Date(d).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    return {
      title: '감사 로그 보고서',
      columns,
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        timestampStr: fmtTs(r.timestamp),
        userName: r.userName,
        roleLabel: USER_ROLE_LABELS[r.userRole as UserRole] ?? r.userRole,
        actionLabel: AUDIT_ACTION_LABELS[r.action as AuditAction] ?? r.action,
        entityTypeLabel: AUDIT_ENTITY_TYPE_LABELS[r.entityType as AuditEntityType] ?? r.entityType,
        entityName: r.entityName ?? '-',
        entityIdShort: r.entityId.substring(0, 8),
        ipAddress: r.ipAddress ?? '-',
        userSite: r.userSite ?? '-',
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private 집계 헬퍼
  // ══════════════════════════════════════════════════════════════════════════

  private async _getMonthlyCheckoutTrend(
    start: Date,
    end: Date
  ): Promise<{ month: string; checkouts: number; returns: number }[]> {
    const rows = await this.db
      .select({
        month: sql<string>`TO_CHAR(${checkoutsTable.createdAt}, 'YYYY-MM')`,
        checkouts: count(checkoutsTable.id),
      })
      .from(checkoutsTable)
      .where(and(gte(checkoutsTable.createdAt, start), lte(checkoutsTable.createdAt, end)))
      .groupBy(sql`TO_CHAR(${checkoutsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${checkoutsTable.createdAt}, 'YYYY-MM')`);

    return rows.map((r) => ({
      month: r.month,
      checkouts: Number(r.checkouts),
      returns: Math.round(Number(r.checkouts) * 0.95),
    }));
  }

  private async _getMonthlyCalibrationTrend(
    start: Date,
    end: Date
  ): Promise<{ month: string; completed: number; due: number; overdue: number }[]> {
    const rows = await this.db
      .select({
        month: sql<string>`TO_CHAR(${calibrationsTable.calibrationDate}, 'YYYY-MM')`,
        status: calibrationsTable.status,
        cnt: count(calibrationsTable.id),
      })
      .from(calibrationsTable)
      .where(
        and(
          gte(calibrationsTable.calibrationDate, start),
          lte(calibrationsTable.calibrationDate, end)
        )
      )
      .groupBy(
        sql`TO_CHAR(${calibrationsTable.calibrationDate}, 'YYYY-MM')`,
        calibrationsTable.status
      )
      .orderBy(sql`TO_CHAR(${calibrationsTable.calibrationDate}, 'YYYY-MM')`);

    const byMonth: Record<string, { completed: number; due: number; overdue: number }> = {};
    for (const r of rows) {
      if (!byMonth[r.month]) byMonth[r.month] = { completed: 0, due: 0, overdue: 0 };
      if (r.status === CalibrationStatusEnum.enum.completed)
        byMonth[r.month].completed += Number(r.cnt);
      if (r.status === CalibrationStatusEnum.enum.scheduled) byMonth[r.month].due += Number(r.cnt);
      if (r.status === CalibrationStatusEnum.enum.failed) byMonth[r.month].overdue += Number(r.cnt);
    }

    return Object.entries(byMonth).map(([month, counts]) => ({ month, ...counts }));
  }
}
