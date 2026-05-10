/**
 * Saved Views SSOT
 *
 * 커스텀 뷰를 localStorage에 저장/불러오기.
 * - SSR safe: typeof window === 'undefined' 가드
 * - MAX_VIEWS: 5개 하드 제한
 * - QuotaExceededError 처리
 */

export const MAX_VIEWS = 5;
const STORAGE_KEY = 'checkout_saved_views';

export interface SavedView {
  id: string;
  name: string;
  /** URL search params 직렬화 문자열 */
  params: string;
  createdAt: string;
}

export function getSavedViews(): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedView[];
  } catch {
    return [];
  }
}

export function saveSavedView(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView | null {
  if (typeof window === 'undefined') return null;
  const current = getSavedViews();
  if (current.length >= MAX_VIEWS) return null;
  const newView: SavedView = {
    ...view,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, newView]));
    return newView;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return null;
    }
    return null;
  }
}

export function deleteSavedView(id: string): void {
  if (typeof window === 'undefined') return;
  const filtered = getSavedViews().filter((v) => v.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // QuotaExceededError — already smaller, should not happen
  }
}

export function reorderSavedViews(views: SavedView[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch {
    // QuotaExceededError
  }
}
