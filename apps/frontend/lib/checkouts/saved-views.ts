/**
 * Saved Views — frontend SSOT helpers + localStorage migration backup.
 *
 * 본 모듈은 **서버 도메인으로 승격된 이후의 helper-only 모듈** 이다.
 * - `SavedView` 타입은 backend `SavedView` row 와 동등 (id/name/params/scope/teamId/version 등).
 * - localStorage 쓰기 함수는 **deprecated 처리**. 마지막 호출은 import banner 의 cleanup 1건뿐.
 * - 읽기 함수(`readLocalStorageBackup`) 는 import banner 가 1회 호출 후 즉시 `clearLocalStorageBackup` 한다.
 *
 * 신규 view 의 CRUD/정렬은 `hooks/use-saved-views.ts` 의 TanStack Query 훅으로만 수행.
 *
 * @see apps/frontend/hooks/use-saved-views.ts
 * @see apps/frontend/components/checkouts/SavedViewsImportBanner.tsx
 */

import { MAX_SAVED_VIEWS_PER_MODULE, type SavedViewScope } from '@equipment-management/schemas';

/** 사용자당 module 별 view 최대 개수 — backend SSOT 재노출 (UI maxReached 메시지용). */
export const MAX_VIEWS = MAX_SAVED_VIEWS_PER_MODULE;

/** localStorage 키 — legacy 경로. import banner 외 호출 금지. */
const LEGACY_STORAGE_KEY = 'checkout_saved_views';

/**
 * SavedView (frontend view-model) — backend row 와 동등하되, server 응답 그대로 사용 가능.
 *
 * scope/teamId/version 필드는 서버 도메인 승격 후 신규 도입. 마이그레이션 backup 에서
 * 읽힌 legacy row 는 `scope=PRIVATE / teamId=null / version=1` 로 가정.
 */
export interface SavedView {
  id: string;
  name: string;
  params: string;
  ownerId: string;
  module: 'checkouts';
  scope: SavedViewScope;
  teamId: string | null;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy localStorage 백업 항목 — import banner 가 server bulkImport 로 승격 후 삭제.
 *
 * shape 은 sprint pre-server 시점 그대로:
 *   `{ id: string; name: string; params: string; createdAt: string }`
 *
 * 위 4 필드만 사용 (ownerId/scope/teamId 등은 서버 측에서 기본값 부여).
 */
export interface LegacySavedView {
  id: string;
  name: string;
  params: string;
  createdAt: string;
}

/** localStorage 백업 읽기 — SSR safe. import banner 진입점에서 1회 호출. */
export function readLocalStorageBackup(): LegacySavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (v): v is LegacySavedView =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as Record<string, unknown>).id === 'string' &&
          typeof (v as Record<string, unknown>).name === 'string' &&
          typeof (v as Record<string, unknown>).params === 'string'
      )
      .slice(0, MAX_VIEWS);
  } catch {
    return [];
  }
}

/**
 * localStorage 백업 삭제 — import banner 가 server bulkImport 성공 직후 1회 호출.
 *
 * 이 함수는 본 모듈에서 **유일하게 허용된 localStorage 쓰기 호출** 이다.
 * 다른 곳에서 호출 금지 (verify-frontend-state 검증).
 */
export function clearLocalStorageBackup(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // SecurityError / DOMException — silent. import banner 는 결과를 본인이 책임.
  }
}
