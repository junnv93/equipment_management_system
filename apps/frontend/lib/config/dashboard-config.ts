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

// ─── 역할별 대시보드 설정 ───────────────────────────────────────
export interface DashboardRoleConfig {
  tabs: Array<{ value: string; label: string }>;
  statsCards: StatsCardConfig[];
  /** AlertPanel에서 표시할 항목 */
  alertSections: Array<'overdueCalibrations' | 'overdueCheckouts'>;
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
