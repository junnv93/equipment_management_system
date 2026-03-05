'use client';

import { useLocale } from 'next-intl';
import { DATE_FNS_LOCALES, formatDate, formatRelativeTime } from '@/lib/utils/date';

/**
 * 현재 로케일에 맞는 날짜 포맷 유틸리티를 반환하는 훅.
 *
 * SSOT: date-fns locale은 next-intl의 useLocale()에서 결정.
 * 컴포넌트에서 직접 formatDate/formatRelativeTime를 호출하는 대신 이 훅을 사용하면
 * 언어 설정 변경 시 날짜 표기도 자동으로 전환된다.
 *
 * @example
 * const { fmtDate, fmtRelative, fullDateFmt } = useDateFormatter();
 * <time title={fmtDate(createdAt, fullDateFmt)}>{fmtRelative(createdAt)}</time>
 */
export function useDateFormatter() {
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale] ?? DATE_FNS_LOCALES.ko;

  // 로케일별 전체 날짜+시간 포맷 문자열
  const fullDateFmt = locale === 'en' ? 'MMM d, yyyy HH:mm' : 'yyyy년 MM월 dd일 HH:mm';

  return {
    /** 날짜를 포맷된 문자열로 변환 */
    fmtDate: (date: string | Date | undefined | null, formatStr?: string) =>
      formatDate(date, formatStr, false, dateFnsLocale),
    /** 날짜와 시간을 포함한 포맷 */
    fmtDateTime: (date: string | Date | undefined | null) =>
      formatDate(date, fullDateFmt, false, dateFnsLocale),
    /** 상대 시간 표시 ("3 minutes ago" / "3분 전") */
    fmtRelative: (date: string | Date | undefined | null) =>
      formatRelativeTime(date, dateFnsLocale),
    /** 현재 로케일의 전체 날짜+시간 포맷 문자열 */
    fullDateFmt,
  };
}
