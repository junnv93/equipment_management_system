/**
 * 교정 상태 계산 유틸리티 (SSOT)
 *
 * CRITICAL: 3곳의 중복 로직 통합
 * - EquipmentHeader.tsx (lines 114-181)
 * - EquipmentCardGrid.tsx (lines 97-156)
 * - EquipmentTable.tsx (lines 194-249)
 *
 * 단일 책임: 교정 D-day 계산, severity 판정, 아이콘/라벨 생성
 */

import { type LucideIcon } from 'lucide-react';
import { type CalibrationMethod } from '@equipment-management/schemas';
import { type CalibrationSeverity, CALIBRATION_BADGE_TOKENS } from '@/lib/design-tokens';

/**
 * 교정 상태 정보
 */
export interface CalibrationStatus {
  /** 타입: 교정 기한 초과 or 임박 */
  type: 'overdue' | 'upcoming';
  /** Severity: 위험도 (3-tier) */
  severity: CalibrationSeverity;
  /** 일수 (절댓값) */
  days: number;
  /** 짧은 라벨 (예: "D+15", "D-7") */
  label: string;
  /** 전체 라벨 (예: "교정 기한 15일 초과", "7일 후 교정 만료") */
  fullLabel: string;
  /** i18n 키 (예: "calibration.dday.overdue") + 보간 파라미터 — Phase 3에서 전환 */
  fullLabelKey: string;
  /** i18n 보간 파라미터 (예: { days: 15 }) */
  fullLabelParams?: Record<string, string | number>;
  /** 아이콘 */
  icon: LucideIcon;
}

/**
 * 교정 상태 계산
 *
 * @param status - 장비 상태 (EquipmentStatus)
 * @param calibrationRequired - 교정 필요 여부
 * @param calibrationMethod - 교정 방법
 * @param nextCalibrationDate - 차기 교정일
 * @returns CalibrationStatus | null
 *
 * @example
 * // 교정 기한 15일 초과
 * calculateCalibrationStatus('available', true, 'external', '2024-01-01')
 * // → { type: 'overdue', severity: 'overdue', days: 15, label: 'D+15', fullLabel: '교정 기한 15일 초과', icon: AlertCircle }
 *
 * // 7일 후 만료
 * calculateCalibrationStatus('available', true, 'internal', '2024-02-23')
 * // → { type: 'upcoming', severity: 'urgent', days: 7, label: 'D-7', fullLabel: '7일 후 교정 만료', icon: AlertTriangle }
 */
export function calculateCalibrationStatus(
  status: string | undefined | null,
  calibrationRequired: boolean | undefined | null,
  calibrationMethod: CalibrationMethod | undefined | null,
  nextCalibrationDate: string | Date | undefined | null
): CalibrationStatus | null {
  // 1. 교정 상태 표시를 건너뛸 장비 상태 확인
  const isNonConforming = status === 'non_conforming';
  const shouldSkipCalibration = shouldSkipCalibrationDisplay(status);

  if (shouldSkipCalibration && !isNonConforming) {
    return null;
  }

  // 2. 교정 불필요 장비
  if (!calibrationRequired || calibrationMethod === 'not_applicable') {
    return null;
  }

  // 3. 차기 교정일 없음
  if (!nextCalibrationDate) {
    return null;
  }

  // 4. 날짜 계산
  const nextDate = new Date(nextCalibrationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 5. 교정 기한 초과
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      type: 'overdue',
      severity: 'overdue',
      days: overdueDays,
      label: `D+${overdueDays}`,
      fullLabel: `교정 기한 ${overdueDays}일 초과`,
      fullLabelKey: 'calibration.dday.overdue',
      fullLabelParams: { days: overdueDays },
      icon: CALIBRATION_BADGE_TOKENS.overdue.icon,
    };
  }

  // 6. non_conforming 상태이지만 교정기한이 아직 남은 경우 - 표시 안함
  if (isNonConforming) {
    return null;
  }

  // 7. 30일 이내 교정 만료
  if (diffDays <= 30) {
    const severity: CalibrationSeverity = diffDays <= 7 ? 'urgent' : 'warning';
    const label = diffDays === 0 ? 'D-Day' : `D-${diffDays}`;
    const fullLabel = diffDays === 0 ? '오늘 교정 만료' : `${diffDays}일 후 교정 만료`;
    const fullLabelKey = diffDays === 0 ? 'calibration.dday.today' : 'calibration.dday.upcoming';

    return {
      type: 'upcoming',
      severity,
      days: diffDays,
      label,
      fullLabel,
      fullLabelKey,
      fullLabelParams: diffDays === 0 ? undefined : { days: diffDays },
      icon: CALIBRATION_BADGE_TOKENS[severity].icon,
    };
  }

  // 8. 30일 초과 - 정상 (표시 안함)
  return null;
}

/**
 * 교정 상태 표시를 건너뛸 장비 상태 목록
 *
 * SSOT: equipment-status-styles.ts의 STATUS_SKIP_CALIBRATION_DISPLAY
 */
const STATUS_SKIP_CALIBRATION_DISPLAY = [
  'retired',
  'non_conforming',
  'spare',
  'pending_disposal',
  'disposed',
  'temporary',
  'inactive',
];

/**
 * 교정 상태 표시 여부 확인
 *
 * @param status - 장비 상태
 * @returns boolean
 */
export function shouldSkipCalibrationDisplay(status: string | undefined | null): boolean {
  if (!status) return false;
  return STATUS_SKIP_CALIBRATION_DISPLAY.includes(status);
}
