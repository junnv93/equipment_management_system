/**
 * CalibrationDueBadge — 다음 교정일 임박 D-N 뱃지 (qr-visual-redesign TASK 2 / 2026-05-11).
 *
 * `nextCalibrationDate` 가 **30일 이내** 일 때만 노출 — 31일 이상은 `null` 반환.
 * D-0 (당일) / D-N (남은 일수) / D+N (초과) 3 상태 자동 매핑.
 *
 * 톤 매핑:
 * - ≤ 0일 (overdue): `urgent` (즉각 조치)
 * - ≤ 7일: `warning` (한 주 이내)
 * - ≤ 30일: `warning` (한 달 이내)
 * - ≥ 31일: 미노출
 *
 * font-mono + tabular-nums 강제 — 자릿수 점프 방지 (".text-mono" 클래스).
 *
 * @see packages/shared-constants/src/dashboard-thresholds.ts (DDAY_THRESHOLDS — 미사용, 본 컴포넌트는 30일 boundary 단일)
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getSemanticBadgeClasses, getSemanticDotClasses } from '@/lib/design-tokens/brand';

/** 노출 boundary (포함) — 31일 이상은 미노출 */
const SHOW_WITHIN_DAYS = 30;

export interface CalibrationDueBadgeProps {
  nextCalibrationDate: string | Date | null | undefined;
  /** 비교 기준 시각 (테스트 주입) — 기본 `new Date()` */
  now?: Date;
  className?: string;
}

/**
 * 남은 일수 계산 — 시각이 아닌 날짜(자정) 기준으로 표시 일관성 확보.
 * 같은 날짜는 D-0, 익일은 D-1 ... (1초 차이로 D-N 흔들리는 회귀 차단).
 */
function getDaysUntil(target: Date, now: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((targetDay - nowDay) / oneDay);
}

export function CalibrationDueBadge({
  nextCalibrationDate,
  now = new Date(),
  className,
}: CalibrationDueBadgeProps): React.JSX.Element | null {
  const t = useTranslations('qr.calibrationDueBadge');
  if (!nextCalibrationDate) return null;
  const target =
    typeof nextCalibrationDate === 'string' ? new Date(nextCalibrationDate) : nextCalibrationDate;
  if (Number.isNaN(target.getTime())) return null;

  const days = getDaysUntil(target, now);
  if (days > SHOW_WITHIN_DAYS) return null;

  const tone = days < 0 ? 'urgent' : days <= 7 ? 'warning' : 'warning';
  const label =
    days < 0
      ? t('overdue', { days: Math.abs(days) })
      : days === 0
        ? t('dueToday')
        : t('dueIn', { days });

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5',
        getSemanticBadgeClasses(tone),
        'text-xs',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(getSemanticDotClasses(tone), 'h-1.5 w-1.5 shrink-0')}
      />
      <span className="font-mono tabular-nums">{label}</span>
    </span>
  );
}
