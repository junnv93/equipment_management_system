/**
 * Cable 도메인 에러 매핑 SSOT — cables-errors.ts 에서 re-export
 *
 * @see cables-errors.ts (실제 구현체 — SSOT)
 * @see apps/frontend/messages/{ko,en}/cables.json (errors namespace)
 */
export { mapCableErrorToToast } from './cables-errors';

export function mapBackendErrorCode(code?: string): string {
  return code ?? 'UNKNOWN_ERROR';
}
