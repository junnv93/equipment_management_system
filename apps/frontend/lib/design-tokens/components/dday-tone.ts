/**
 * D-day 4-단계 톤 토큰 (대시보드 개선안 v1)
 *
 * 명세 (개발 명세서.md §1.1, §3.5):
 *  - overdue : 기한 초과       (days > 0)            → 빨강
 *  - urgent  : DDAY_THRESHOLDS.urgent 일 이내        → 주황
 *  - soon    : DDAY_THRESHOLDS.soon 일 이내          → 파랑
 *  - normal  : 그 이상 여유                          → 초록
 *
 * SSOT: `resolveDdayTone(days)`만 사용 (직접 색상 클래스 하드코딩 금지).
 * 임계값은 `@equipment-management/shared-constants`의 dashboard-thresholds 모듈을 참조 —
 * frontend/backend가 동일 임계값을 보장한다.
 *
 * 기존 6-단계 시스템(`dday-colors.ts`)과 별도로 운영합니다.
 *  - 6-단계: 시간 기반 점진(`farFuture/upcoming/soon/...`) — 기존 카드 호환
 *  - 4-단계: 의미론 액션(`overdue/urgent/soon/normal`) — 신규 DDayTag/PriorityRow
 */
import {
  DDAY_THRESHOLDS,
  UTILIZATION_GAUGE_THRESHOLDS,
  DISTRIBUTION_BAR_THRESHOLDS,
  SYSTEM_HEALTH_THRESHOLDS,
  SYSTEM_HEALTH_GAUGE_CAPS,
  SYSTEM_HEALTH_OVERALL_THRESHOLDS,
} from '@equipment-management/shared-constants';

export const DDAY_TONES = ['overdue', 'urgent', 'soon', 'normal'] as const;

export type DdayTone = (typeof DDAY_TONES)[number];

/**
 * `days` (양수 = 초과 일수, 음수 = 남은 일수, 0 = 오늘).
 * 명세서의 입력 규약과 동일: `daysUntilDue` 음수, `daysOverdue` 양수.
 *
 * 임계값은 SSOT (`DDAY_THRESHOLDS` from shared-constants).
 */
export function resolveDdayTone(days: number): DdayTone {
  if (days > 0) return 'overdue';
  if (days >= -DDAY_THRESHOLDS.urgent) return 'urgent';
  if (days >= -DDAY_THRESHOLDS.soon) return 'soon';
  return 'normal';
}

/**
 * 표시 형식.
 *  - days > 0  : `D+{days}`
 *  - days = 0  : `D-day`
 *  - days < 0  : `D{days}` (음수 그대로 — 예: -6 → "D-6")
 */
export function formatDdayLabel(days: number): string {
  if (days > 0) return `D+${days}`;
  if (days === 0) return 'D-day';
  return `D${days}`;
}

/** 4단계 톤 → tag 클래스 (badge 컨테이너 className). */
export const DDAY_TONE_CLASSES: Record<DdayTone, string> = {
  overdue: 'border-l-[3px] border-brand-critical bg-brand-critical/10 text-brand-critical',
  urgent: 'border-l-[3px] border-brand-warning bg-brand-warning/15 text-brand-warning',
  soon: 'border-l-[3px] border-brand-info bg-brand-info/10 text-brand-info',
  normal: 'border-l-[3px] border-brand-success bg-brand-success/10 text-brand-success',
};

/** 4단계 톤 → 분포 막대 강조 색상 (TeamEquipmentDistribution에서 재사용). */
export const DIST_BAR_TONE_CLASSES = {
  default: 'bg-brand-info',
  warn: 'bg-brand-warning',
  danger: 'bg-brand-critical',
  ok: 'bg-brand-success',
} as const;

export type DistBarTone = keyof typeof DIST_BAR_TONE_CLASSES;

/**
 * utilizationPct → 막대 톤.
 * 명세서 §3.6: 임계값은 SSOT (`DISTRIBUTION_BAR_THRESHOLDS`).
 */
export function resolveDistBarTone(utilizationPct: number): DistBarTone {
  if (utilizationPct < DISTRIBUTION_BAR_THRESHOLDS.danger) return 'danger';
  if (utilizationPct < DISTRIBUTION_BAR_THRESHOLDS.warn) return 'warn';
  return 'default';
}

/**
 * utilizationGaugeTone — KPI 가동률 게이지용.
 * 명세서 §3.2 가동률 정책. 임계값은 SSOT (`UTILIZATION_GAUGE_THRESHOLDS`).
 */
export function utilizationGaugeTone(pct: number): 'ok' | 'warn' | 'danger' {
  if (pct >= UTILIZATION_GAUGE_THRESHOLDS.ok) return 'ok';
  if (pct >= UTILIZATION_GAUGE_THRESHOLDS.warn) return 'warn';
  return 'danger';
}

/**
 * SystemHealthCard 메트릭별 톤 + 게이지 비율 결정 (명세서 §3.9).
 *
 * 임계값과 게이지 capacity는 SSOT (`SYSTEM_HEALTH_THRESHOLDS`, `SYSTEM_HEALTH_GAUGE_CAPS`).
 *  - activeUsers: (value/capacity)*100 → utilizationGaugeTone (UTILIZATION_GAUGE_THRESHOLDS 재사용).
 *  - 그 외 메트릭: SYSTEM_HEALTH_THRESHOLDS의 ok/warn 임계값 비교.
 */
export type SystemHealthTone = 'ok' | 'warn' | 'danger';

export type SystemHealthMetric = 'activeUsers' | 'dbMs' | 'storage' | 'queue';

export function resolveSystemHealthTone(
  metric: SystemHealthMetric,
  value: number,
  capacity?: number
): SystemHealthTone {
  switch (metric) {
    case 'activeUsers': {
      if (!capacity || capacity <= 0) return 'ok';
      const pct = (value / capacity) * 100;
      return utilizationGaugeTone(pct);
    }
    case 'dbMs':
      if (value < SYSTEM_HEALTH_THRESHOLDS.dbMs.ok) return 'ok';
      if (value < SYSTEM_HEALTH_THRESHOLDS.dbMs.warn) return 'warn';
      return 'danger';
    case 'storage':
      if (value < SYSTEM_HEALTH_THRESHOLDS.storagePct.ok) return 'ok';
      if (value < SYSTEM_HEALTH_THRESHOLDS.storagePct.warn) return 'warn';
      return 'danger';
    case 'queue':
      if (value < SYSTEM_HEALTH_THRESHOLDS.queueSize.ok) return 'ok';
      if (value < SYSTEM_HEALTH_THRESHOLDS.queueSize.warn) return 'warn';
      return 'danger';
  }
}

/** 시스템 health 게이지 막대 너비(%) — 메트릭별 capacity 기준 정규화 (SSOT). */
export function resolveSystemHealthGaugePct(
  metric: SystemHealthMetric,
  value: number,
  capacity?: number
): number {
  switch (metric) {
    case 'activeUsers':
      if (!capacity || capacity <= 0) return 0;
      return Math.min((value / capacity) * 100, 100);
    case 'dbMs':
      return Math.min((value / SYSTEM_HEALTH_GAUGE_CAPS.dbMs) * 100, 100);
    case 'storage':
      return Math.min(Math.max(value, 0), 100);
    case 'queue':
      return Math.min((value / SYSTEM_HEALTH_GAUGE_CAPS.queueSize) * 100, 100);
  }
}

/** Backend overallStatus 응답 → 프론트 meta pill 톤. */
export type SystemHealthOverallStatus = 'healthy' | 'degraded' | 'down';

export function resolveSystemHealthOverallTone(
  status: SystemHealthOverallStatus
): SystemHealthTone {
  switch (status) {
    case 'healthy':
      return 'ok';
    case 'degraded':
      return 'warn';
    case 'down':
      return 'danger';
  }
}

/**
 * Backend가 4개 메트릭 raw 값을 받아 overallStatus를 판정할 때 사용.
 * 프론트 측에서는 백엔드 계산값(overallStatus)을 그대로 신뢰하므로 호출 불필요하지만,
 * SSOT 일관성을 위해 export한다 (테스트 + 백엔드 import 용도).
 */
export function evaluateSystemHealthOverall(metrics: {
  dbResponseMs: number;
  storagePct: number;
}): SystemHealthOverallStatus {
  const { down, degraded } = SYSTEM_HEALTH_OVERALL_THRESHOLDS;
  if (metrics.dbResponseMs >= down.dbMs) return 'down';
  if (metrics.dbResponseMs >= degraded.dbMs || metrics.storagePct >= degraded.storagePct) {
    return 'degraded';
  }
  return 'healthy';
}
