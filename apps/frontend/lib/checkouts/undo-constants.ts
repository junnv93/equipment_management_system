/**
 * Undo 인프라 SSOT 상수.
 *
 * `useUndoToast` (단건, axios 의존) + `useBulkUndoToast` (bulk, axios 무의존) 양쪽이 공유.
 * jest 환경에서 axios ESM transform 회피를 위해 별도 파일로 분리.
 *
 * 변경 시 영향: `useOptimisticMutation` `undoWindowMs`, Toast 표시 시간, 사용자 expectation.
 */
export const UNDO_TOAST_DURATION_MS = 5000;
