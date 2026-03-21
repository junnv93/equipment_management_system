'use client';

import { useLocale } from 'next-intl';
import { DATE_FNS_LOCALES, formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { DisplayPreferences } from '@equipment-management/schemas';

/**
 * 사용자 dateFormat 설정 → date-fns 포맷 문자열 변환 맵
 *
 * SSOT: schemas 패키지의 DATE_FORMAT_OPTIONS와 1:1 대응
 */
const DATE_FORMAT_MAP: Record<DisplayPreferences['dateFormat'], string> = {
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'YYYY.MM.DD': 'yyyy.MM.dd',
};

/**
 * dateFormat에 시간을 결합한 전체 날짜+시간 포맷 생성
 */
const DATE_TIME_FORMAT_MAP: Record<DisplayPreferences['dateFormat'], string> = {
  'YYYY-MM-DD': 'yyyy-MM-dd HH:mm',
  'YYYY.MM.DD': 'yyyy.MM.dd HH:mm',
};

/**
 * 현재 로케일과 사용자 표시 설정에 맞는 날짜 포맷 유틸리티를 반환하는 훅.
 *
 * SSOT:
 * - date-fns locale: next-intl의 useLocale()
 * - 날짜 포맷: 사용자 표시 설정의 dateFormat (useUserPreferences)
 *
 * 컴포넌트에서 직접 formatDate/formatRelativeTime를 호출하는 대신 이 훅을 사용하면
 * 언어/날짜 형식 설정 변경 시 날짜 표기도 자동으로 전환됩니다.
 *
 * @example
 * const { fmtDate, fmtRelative, fullDateFmt } = useDateFormatter();
 * <time title={fmtDate(createdAt, fullDateFmt)}>{fmtRelative(createdAt)}</time>
 */
export function useDateFormatter() {
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale] ?? DATE_FNS_LOCALES.ko;
  const { dateFormat } = useUserPreferences();

  // 사용자 설정 기반 포맷 문자열
  const dateFmt = DATE_FORMAT_MAP[dateFormat];
  const fullDateFmt = DATE_TIME_FORMAT_MAP[dateFormat];

  return {
    /** 날짜를 포맷된 문자열로 변환 (사용자 설정 dateFormat 적용) */
    fmtDate: (date: string | Date | undefined | null, formatStr?: string) =>
      formatDate(date, formatStr ?? dateFmt, false, dateFnsLocale),
    /** 날짜와 시간을 포함한 포맷 (사용자 설정 dateFormat 적용) */
    fmtDateTime: (date: string | Date | undefined | null) =>
      formatDate(date, fullDateFmt, false, dateFnsLocale),
    /** 상대 시간 표시 ("3 minutes ago" / "3분 전") */
    fmtRelative: (date: string | Date | undefined | null) =>
      formatRelativeTime(date, dateFnsLocale),
    /** 현재 사용자 설정의 전체 날짜+시간 포맷 문자열 */
    fullDateFmt,
    /** 현재 사용자 설정의 날짜만 포맷 문자열 */
    dateFmt,
  };
}
