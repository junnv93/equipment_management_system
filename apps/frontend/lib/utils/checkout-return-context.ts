/**
 * Checkout 목록 컨텍스트 보존 (Sprint 4.5 U-07).
 *
 * 상세 → 목록 복귀 시 직전 필터/페이지/정렬 복원. URL이 SSOT — sessionStorage는
 * 보조 (URL 부재 시 fallback only). private mode 등 storage 차단 환경에서는 null fallback.
 *
 * **TTL 1시간**: 사용자가 한 시간 이상 자리를 비웠다가 돌아오면 stale context를 복원하지
 * 않는다 (필터 의도가 더 이상 유효하지 않다고 가정).
 */

const CHECKOUT_RETURN_CONTEXT_KEY = 'checkout.return.context';
const CHECKOUT_RETURN_CONTEXT_TTL_MS = 60 * 60 * 1000;

interface StoredContext {
  query: string;
  ts: number;
}

function isStoredContext(value: unknown): value is StoredContext {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.query === 'string' && typeof v.ts === 'number';
}

/**
 * 목록 페이지의 현재 URL searchParams를 sessionStorage에 저장.
 * `searchParams`가 비어 있으면 저장하지 않음 (clean URL을 stale context로 덮지 않도록).
 */
export function saveCheckoutListContext(searchParams: URLSearchParams | string): void {
  try {
    const query = typeof searchParams === 'string' ? searchParams : searchParams.toString();
    if (!query) return;
    const payload: StoredContext = { query, ts: Date.now() };
    sessionStorage.setItem(CHECKOUT_RETURN_CONTEXT_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage 차단(private mode 등) — silent fallback (URL이 SSOT)
  }
}

/**
 * 저장된 목록 컨텍스트를 URLSearchParams로 복원. TTL 만료 또는 storage 차단 시 null.
 * 호출 후 자동 삭제 — 두 번 복원되지 않도록 (한 번 복귀 = 한 번 사용).
 */
export function restoreCheckoutListContext(): URLSearchParams | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_RETURN_CONTEXT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredContext(parsed)) return null;
    if (Date.now() - parsed.ts > CHECKOUT_RETURN_CONTEXT_TTL_MS) {
      sessionStorage.removeItem(CHECKOUT_RETURN_CONTEXT_KEY);
      return null;
    }
    sessionStorage.removeItem(CHECKOUT_RETURN_CONTEXT_KEY);
    return new URLSearchParams(parsed.query);
  } catch {
    return null;
  }
}

/** 명시적으로 컨텍스트를 삭제 (필터 초기화, 로그아웃 등). */
export function clearCheckoutListContext(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_RETURN_CONTEXT_KEY);
  } catch {
    // silent
  }
}
