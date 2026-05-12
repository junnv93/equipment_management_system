import { z } from 'zod';

/**
 * Saved View scope 트리아드 — packages SSOT.
 *
 * - PRIVATE: 본인만 read/write (teamId NULL)
 * - TEAM   : 같은 팀 read, 본인만 write (teamId NOT NULL)
 * - GLOBAL : 모두 read, MANAGE_SAVED_VIEWS_GLOBAL 권한만 write (teamId NULL)
 *
 * 채택 이유 (vs 이분법 OWNER/SHARED):
 * - GLOBAL 후속 도입 시 enum 변경 ripple 1회 회피.
 * - UI 는 MVP 에서 PRIVATE 기본만 노출 (TEAM/GLOBAL 은 후속 sprint scope picker).
 */
export const SAVED_VIEW_SCOPE_VALUES = ['PRIVATE', 'TEAM', 'GLOBAL'] as const;
export const SavedViewScopeEnum = z.enum(SAVED_VIEW_SCOPE_VALUES);
export type SavedViewScope = z.infer<typeof SavedViewScopeEnum>;

/**
 * 한 사용자가 한 모듈에 저장 가능한 view 최대 개수 — service + frontend SSOT.
 *
 * 이 한도는 saved-views 도메인 전용. 다른 도메인(예: 검색 필터 즐겨찾기) 도입 시
 * 새 상수를 추가하고 본 상수를 재사용하지 말 것 (의미 결합 방지).
 */
export const MAX_SAVED_VIEWS_PER_MODULE = 5;

/**
 * 본 sprint MVP scope — view 가 적용되는 도메인 모듈 화이트리스트.
 *
 * 향후 'equipment' / 'calibration_plans' 등 확장 시 본 배열 + 백엔드 service.module
 * 검증만 추가. DB schema 무변경 (`module varchar(40)` 슬롯 재사용).
 */
export const SAVED_VIEW_MODULE_VALUES = ['checkouts'] as const;
export const SavedViewModuleEnum = z.enum(SAVED_VIEW_MODULE_VALUES);
export type SavedViewModule = z.infer<typeof SavedViewModuleEnum>;
