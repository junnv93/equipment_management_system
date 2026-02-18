'use client';

import { Badge } from '@/components/ui/badge';
import { differenceInDays, isBefore } from 'date-fns';
import { toDate, formatDate } from '@/lib/utils/date';
import { useTranslations } from 'next-intl';

interface UsagePeriodBadgeProps {
  startDate: string | Date;
  endDate: string | Date;
  className?: string;
}

/**
 * 사용 기간 D-day 배지 컴포넌트
 *
 * 임시등록(공용/렌탈) 장비의 사용 기간 남은 일수를 표시합니다.
 *
 * 상태별 색상:
 * - 정상 (8일 이상): 녹색
 * - 경고 (D-7 이내): 노란색
 * - 초과 (D+N): 빨간색
 *
 * @example
 * <UsagePeriodBadge
 *   startDate="2026-01-01"
 *   endDate="2026-02-28"
 * />
 */
export function UsagePeriodBadge({ startDate, endDate, className }: UsagePeriodBadgeProps) {
  const t = useTranslations('equipment.usagePeriodBadge');
  const now = new Date();
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return null;

  const daysRemaining = differenceInDays(end, now);

  // 사용 시작 전
  if (isBefore(now, start)) {
    return (
      <Badge variant="outline" className={className} aria-label={t('beforeStart')}>
        {t('startDate', { date: formatDate(start, 'MM/dd') })}
      </Badge>
    );
  }

  // 상태 결정
  const variant =
    daysRemaining < 0
      ? 'destructive' // 초과
      : daysRemaining <= 7
        ? 'default' // D-7 이내 (노란색)
        : 'secondary'; // 정상

  const label =
    daysRemaining < 0
      ? `D+${Math.abs(daysRemaining)}`
      : daysRemaining === 0
        ? 'D-Day'
        : `D-${daysRemaining}`;

  return (
    <Badge variant={variant} className={className} aria-label={t('ariaLabel', { label })}>
      {label}
    </Badge>
  );
}
