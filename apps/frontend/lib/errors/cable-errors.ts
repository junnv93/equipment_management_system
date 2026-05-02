/**
 * Cable 도메인 에러 매핑 SSOT — cables-errors.ts 에서 re-export
 *
 * @see cables-errors.ts (실제 구현체)
 * @see apps/frontend/messages/{ko,en}/cables.json (errors namespace)
 */
export { mapCableErrorToToast as mapBackendErrorCode } from './cables-errors';
export { mapCableErrorToToast } from './cables-errors';
