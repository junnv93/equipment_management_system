/**
 * 페이지네이션 공유 상수 (SSOT)
 *
 * 컴포넌트 내에 PAGE_SIZE_OPTIONS를 직접 선언하지 말 것.
 * 목록 페이지에서 이 상수를 import하여 사용한다.
 */

/** 페이지당 항목 수 옵션 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

/** 기본 페이지당 항목 수 */
export const DEFAULT_PAGE_SIZE: PageSizeOption = 20;
