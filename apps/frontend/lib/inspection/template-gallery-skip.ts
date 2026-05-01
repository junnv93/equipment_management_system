/**
 * Template Gallery skip flag (Phase 1B-F)
 *
 * 사용자가 "다시 묻지 않기" 체크 시 localStorage에 기록 — 같은 equipmentTypeId의
 * 신규 장비 첫 점검 시 자동 노출 회피.
 *
 * SSR-safe: Next.js 16 server-side render 시 typeof window 체크로 throw 회피
 * (contract G-F.3).
 *
 * 키 형식: `inspection-gallery-skip-{equipmentTypeId}-{inspectionType}`
 * - equipmentTypeId 별 분리 — 멀티미터는 skip해도 오실로스코프는 자동 노출
 * - inspectionType 별 분리 — 중간/자체 별도 의사결정
 *
 * 값: '1' (존재 여부만 사용)
 */

const STORAGE_KEY_PREFIX = 'inspection-gallery-skip-';

function buildKey(
  equipmentTypeId: string | null | undefined,
  inspectionType: 'intermediate' | 'self'
): string | null {
  if (!equipmentTypeId) return null;
  return `${STORAGE_KEY_PREFIX}${equipmentTypeId}-${inspectionType}`;
}

/**
 * skip 플래그 조회 — true면 자동 노출 회피.
 *
 * SSR/disabled localStorage 환경에서는 항상 false 반환 (자동 노출 진행).
 */
export function isGallerySkipped(
  equipmentTypeId: string | null | undefined,
  inspectionType: 'intermediate' | 'self'
): boolean {
  if (typeof window === 'undefined') return false;
  const key = buildKey(equipmentTypeId, inspectionType);
  if (!key) return false;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    // private browsing, storage quota 등 — 자동 노출 진행 (실패 시 default)
    return false;
  }
}

/**
 * skip 플래그 set — 사용자가 "다시 묻지 않기" 체크 시 호출.
 */
export function markGallerySkipped(
  equipmentTypeId: string | null | undefined,
  inspectionType: 'intermediate' | 'self'
): void {
  if (typeof window === 'undefined') return;
  const key = buildKey(equipmentTypeId, inspectionType);
  if (!key) return;
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // 실패는 silent — 사용자 경험에 영향 없음 (skip 안 되면 다음에 다시 노출되는 것뿐)
  }
}

/**
 * skip 플래그 제거 (테스트 또는 사용자 reset 트리거).
 */
export function clearGallerySkipped(
  equipmentTypeId: string | null | undefined,
  inspectionType: 'intermediate' | 'self'
): void {
  if (typeof window === 'undefined') return;
  const key = buildKey(equipmentTypeId, inspectionType);
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // silent
  }
}
