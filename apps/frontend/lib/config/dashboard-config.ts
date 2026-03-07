/**
 * 대시보드 역할별 Config (SSOT)
 *
 * Config-Driven Architecture:
 * - 역할별 탭, StatsCards, 주의 항목을 단일 파일에 정의
 * - DashboardClient는 순수 렌더러 — 역할 분기 로직 없음
 * - 새 역할 추가 시 이 파일만 수정
 */

import type { LucideIcon } from 'lucide-react';
import { Package, AlertCircle, AlertTriangle, Clock, Truck, Ban, CheckCircle2 } from 'lucide-react';
import type { StatsVariant } from '@/lib/design-tokens';
import type { DashboardSummary } from '@/lib/api/dashboard-api';

// ─── Stats Card 설정 ───────────────────────────────────────────
export interface StatsCardConfig {
  key: string;
  label: string;
  getValue: (
    summary: DashboardSummary | undefined,
    statusStats: Record<string, number> | undefined
  ) => number;
  /** 비율/부연 설명 텍스트 (예: "총 142대 중 84%") */
  getDescription?: (
    summary: DashboardSummary | undefined,
    statusStats: Record<string, number> | undefined
  ) => string | undefined;
  icon: LucideIcon;
  variant: StatsVariant;
}

// ─── Control Center 설정 ────────────────────────────────────────
export interface ControlCenterConfig {
  /** 승인 대기 카드 표시 여부 */
  showPendingApprovals: boolean;
  /** 반출 기한 초과 카드 표시 여부 */
  showCheckoutOverdue: boolean;
  /** 교정 D-day 컴팩트 리스트 표시 여부 */
  showCalibrationDday: boolean;
  /** 팀별 장비 분포 표시 여부 */
  showTeamDistribution: boolean;
  /** 미니 달력 표시 여부 */
  showMiniCalendar: boolean;
  /** KPI 총계 레이블 ('my' | 'team' | 'all') */
  kpiDisplay: 'my' | 'team' | 'all';
  /**
   * KPI API 호출과 장비 목록 링크에 팀 필터(teamId)를 적용할지 여부.
   *
   * true  → session.user.teamId를 API와 링크에 자동 포함 (시험실무자, 기술책임자)
   * false → 팀 필터 없음, 사이트 전체 조회 (품질책임자, 시험소장, 시스템관리자)
   *
   * 이 플래그가 결정 주체 — resolveDashboardScope()는 이것을 그대로 따름.
   */
  requiresTeamScope: boolean;
}

// ─── 역할별 대시보드 설정 ───────────────────────────────────────
export interface DashboardRoleConfig {
  tabs: Array<{ value: string; label: string }>;
  statsCards: StatsCardConfig[];
  /** AlertPanel에서 표시할 항목 */
  alertSections: Array<'overdueCalibrations' | 'overdueCheckouts'>;
  /** Control Center 3-Tier 레이아웃 설정 */
  controlCenter: ControlCenterConfig;
}

// ─── 재사용 가능한 Stats Card 팩토리 ────────────────────────────
const STATS = {
  totalEquipment: (labelKey: string): StatsCardConfig => ({
    key: 'total',
    label: labelKey, // i18n key under 'dashboard.stats'
    getValue: (s) => s?.totalEquipment || 0,
    icon: Package,
    variant: 'default',
  }),
  available: (): StatsCardConfig => ({
    key: 'available',
    label: 'available', // i18n key
    getValue: (s) => s?.availableEquipment || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      const available = s?.availableEquipment || 0;
      if (total === 0) return undefined;
      return `percentOfTotal:${Math.round((available / total) * 100)}:${total}`;
    },
    icon: CheckCircle2,
    variant: 'success',
  }),
  calibrationOverdue: (): StatsCardConfig => ({
    key: 'calibrationOverdue',
    label: 'calibrationOverdue', // i18n key
    getValue: (_, stats) => stats?.calibration_overdue || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      if (total === 0) return undefined;
      return 'immediateAction';
    },
    icon: AlertTriangle,
    variant: 'danger',
  }),
  nonConforming: (): StatsCardConfig => ({
    key: 'nonConforming',
    label: 'nonConforming', // i18n key
    getValue: (_, stats) => stats?.non_conforming || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      if (total === 0) return undefined;
      return 'unusable';
    },
    icon: AlertCircle,
    variant: 'danger',
  }),
  upcomingCalibrations: (): StatsCardConfig => ({
    key: 'upcomingCalibrations',
    label: 'calibrationScheduled', // i18n key
    getValue: (s) => s?.upcomingCalibrations || 0,
    getDescription: () => 'within30Days',
    icon: Clock,
    variant: 'warning',
  }),
  activeCheckouts: (): StatsCardConfig => ({
    key: 'activeCheckouts',
    label: 'activeCheckouts', // i18n key
    getValue: (s) => s?.activeCheckouts || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      const active = s?.activeCheckouts || 0;
      if (total === 0) return undefined;
      return `percentOfTotal:${Math.round((active / total) * 100)}:${total}`;
    },
    icon: Truck,
    variant: 'primary',
  }),
  pendingDisposal: (): StatsCardConfig => ({
    key: 'pendingDisposal',
    label: 'pendingDisposal', // i18n key
    getValue: (_, stats) => stats?.pending_disposal || 0,
    getDescription: () => 'awaitingApproval',
    icon: Ban,
    variant: 'warning',
  }),
} as const;

// ─── 역할별 설정 (SSOT) ────────────────────────────────────────
export const DASHBOARD_ROLE_CONFIG: Record<string, DashboardRoleConfig> = {
  test_engineer: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('myEquipment'),
      STATS.available(),
      STATS.upcomingCalibrations(),
      STATS.activeCheckouts(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showPendingApprovals: false,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      showTeamDistribution: false,
      showMiniCalendar: true,
      kpiDisplay: 'my',
      requiresTeamScope: true,
    },
  },

  technical_manager: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('teamEquipment'),
      STATS.calibrationOverdue(),
      STATS.nonConforming(),
      STATS.activeCheckouts(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showPendingApprovals: true,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      showTeamDistribution: true,
      showMiniCalendar: true,
      kpiDisplay: 'team',
      requiresTeamScope: true,
    },
  },

  quality_manager: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('allEquipment'),
      STATS.nonConforming(),
      STATS.upcomingCalibrations(),
      STATS.calibrationOverdue(),
    ],
    alertSections: ['overdueCalibrations'],
    controlCenter: {
      showPendingApprovals: true,
      showCheckoutOverdue: false,
      showCalibrationDday: true,
      showTeamDistribution: false,
      showMiniCalendar: true,
      kpiDisplay: 'all',
      requiresTeamScope: false,
    },
  },

  lab_manager: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'checkout', label: 'checkout' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('allEquipment'),
      STATS.calibrationOverdue(),
      STATS.nonConforming(),
      STATS.pendingDisposal(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showPendingApprovals: true,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      showTeamDistribution: true,
      showMiniCalendar: true,
      kpiDisplay: 'all',
      requiresTeamScope: false,
    },
  },

  system_admin: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'checkout', label: 'checkout' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('allEquipment'),
      STATS.nonConforming(),
      STATS.calibrationOverdue(),
      STATS.activeCheckouts(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showPendingApprovals: true,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      showTeamDistribution: true,
      showMiniCalendar: true,
      kpiDisplay: 'all',
      requiresTeamScope: false,
    },
  },
};

// ─── 기본값 + Fallback ─────────────────────────────────────────
export const DEFAULT_ROLE = 'test_engineer';
export const DEFAULT_TAB = 'calibration';

/** 레거시 URL 호환 매핑 — 기존 북마크/공유 링크 자동 리다이렉트 */
export const LEGACY_TAB_MAP: Record<string, string> = {
  attention: 'calibration',
  overview: 'calibration',
  rental: 'checkout',
  approvals: 'calibration',
};
