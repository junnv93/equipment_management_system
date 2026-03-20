/**
 * 페이지네이션 공유 상수 — Backend/Frontend SSOT
 *
 * Backend: 서비스 레이어 기본값
 * Frontend: 목록 컴포넌트 기본값, URL 파라미터 파싱
 *
 * ⚠️ 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
 *
 * @example
 * // Backend
 * import { DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
 * const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
 *
 * // Frontend
 * import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@equipment-management/shared-constants';
 */

/** 페이지당 항목 수 옵션 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

/** 기본 페이지당 항목 수 */
export const DEFAULT_PAGE_SIZE: PageSizeOption = 20;

/** 대시보드 위젯 등 요약 조회 시 기본 제한 */
export const DASHBOARD_ITEM_LIMIT = 50;

/** 선택기(Selector/Combobox) 조회 시 기본 제한 — 드롭다운에서 충분한 항목을 표시 */
export const SELECTOR_PAGE_SIZE = 100;

/** 대시보드 최근 활동 조회 제한 */
export const DASHBOARD_ACTIVITIES_LIMIT = 20;

/** 페이지당 항목 수 최대값 — DTO의 .max() 검증에 사용 */
export const MAX_PAGE_SIZE: PageSizeOption = 100;
