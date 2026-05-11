/**
 * Shortcut Overrides — localStorage SSOT
 *
 * `useKeyboardShortcuts` 가 SSOT 정의된 키 위에 사용자 override 를 적용할 수 있도록
 * 단일 진입점을 제공한다. SSR safe (typeof window 가드), 손상된 JSON 자동 복구.
 *
 * - storage key 는 절대 인라인 사용 금지 — `SHORTCUT_OVERRIDES_STORAGE_KEY` 경유
 * - 한 단축키 당 1글자(또는 'Enter'/'Escape' 같은 명명 키) 만 허용 — UI level validation
 */

import type { ShortcutId } from '@/lib/constants/keyboard-shortcuts';

export const SHORTCUT_OVERRIDES_STORAGE_KEY = 'shortcut_overrides_v1';

/** 사용자가 동시에 override 가능한 단축키 최대 개수 — 잠재적 localStorage abuse 방어 */
export const MAX_OVERRIDE_KEYS = 32;

/** 허용되는 명명 키 — 일반 영문/숫자/심볼 1글자 외에 추가로 통과시킬 special keys */
const ALLOWED_NAMED_KEYS = new Set(['Enter', 'Escape', 'Tab', ' ']);

export type ShortcutOverrideMap = Partial<Record<ShortcutId, string>>;

/** SSR safe — server 에서는 빈 객체 */
export function loadShortcutOverrides(): ShortcutOverrideMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SHORTCUT_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return sanitize(parsed as Record<string, unknown>);
  } catch {
    return {};
  }
}

export function saveShortcutOverrides(map: ShortcutOverrideMap): void {
  if (typeof window === 'undefined') return;
  const sanitized = sanitize(map as Record<string, unknown>);
  try {
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    /* quota or disabled — silent */
  }
}

export function resetShortcutOverrides(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SHORTCUT_OVERRIDES_STORAGE_KEY);
  } catch {
    /* silent */
  }
}

/** 입력 키가 override 로 허용 가능한지 — UI level validation 용 */
export function isValidOverrideKey(key: string): boolean {
  if (!key) return false;
  if (ALLOWED_NAMED_KEYS.has(key)) return true;
  return key.length === 1;
}

function sanitize(input: Record<string, unknown>): ShortcutOverrideMap {
  const out: ShortcutOverrideMap = {};
  let count = 0;
  for (const [k, v] of Object.entries(input)) {
    if (count >= MAX_OVERRIDE_KEYS) break;
    if (typeof v !== 'string') continue;
    if (!isValidOverrideKey(v)) continue;
    out[k as ShortcutId] = v;
    count++;
  }
  return out;
}
