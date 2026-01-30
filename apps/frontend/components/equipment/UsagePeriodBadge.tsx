import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';

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
  const now = dayjs();
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const daysRemaining = end.diff(now, 'days');

  // 사용 시작 전
  if (now.isBefore(start)) {
    return (
      <Badge variant="outline" className={className} aria-label="사용 시작 전">
        시작 예정: {start.format('MM/DD')}
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
    <Badge variant={variant} className={className} aria-label={`사용 기간 ${label}`}>
      {label}
    </Badge>
  );
}
