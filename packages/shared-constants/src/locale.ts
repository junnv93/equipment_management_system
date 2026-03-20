/**
 * 로케일/타임존 공유 상수 — Backend/Frontend SSOT
 *
 * 리포트 출력, 날짜 포맷팅, 알림 메시지 등에서 일관된 로케일 사용을 보장합니다.
 *
 * @example
 * import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
 * new Date().toLocaleString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
 */

/** 기본 로케일 — BCP 47 언어 태그 */
export const DEFAULT_LOCALE = 'ko-KR' as const;

/** 기본 타임존 — IANA 타임존 식별자 */
export const DEFAULT_TIMEZONE = 'Asia/Seoul' as const;
