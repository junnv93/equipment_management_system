/**
 * DDayTag — 4단계 톤 D-day 뱃지 (대시보드 개선안 §2.2)
 *
 * 입력 규약:
 *  - `days > 0`  : 초과 일수 (예: 45 → "D+45", overdue 톤)
 *  - `days = 0`  : 오늘
 *  - `days < 0`  : 남은 일수 (예: -6 → "D-6", urgent 톤)
 *
 * SSOT: 톤/표시 형식 결정은 `resolveDdayTone`/`formatDdayLabel`만 사용.
 *  - 직접 색상 클래스 하드코딩 금지 (verify-ssot 규칙 위반).
 *
 * i18n: aria-label은 `dashboard.ddayTag.*` 키. 스크린리더가 "5일 남음" 등으로 읽음.
 */

'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  DDAY_TONE_CLASSES,
  formatDdayLabel,
  resolveDdayTone,
  type DdayTone,
} from '@/lib/design-tokens';

interface DDayTagProps {
  /** 양수=초과, 음수=남은 일수, 0=오늘 */
  days: number;
  size?: 'sm' | 'md';
  /** 강제 톤 (자동 결정을 우회). 보통은 미지정 권장. */
  tone?: DdayTone;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<DDayTagProps['size']>, string> = {
  sm: 'text-[11px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export function DDayTag({ days, size = 'sm', tone, className }: DDayTagProps) {
  const t = useTranslations('dashboard.ddayTag');
  const resolved: DdayTone = tone ?? resolveDdayTone(days);
  const label = formatDdayLabel(days);
  const ariaLabel =
    resolved === 'overdue'
      ? t('ariaOverdue', { days })
      : days === 0
        ? t('ariaToday')
        : t('ariaRemaining', { days: Math.abs(days) });

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-mono font-semibold tabular-nums tracking-tight',
        DDAY_TONE_CLASSES[resolved],
        SIZE_CLASSES[size],
        className
      )}
      aria-label={ariaLabel}
      data-tone={resolved}
    >
      {label}
    </span>
  );
}
