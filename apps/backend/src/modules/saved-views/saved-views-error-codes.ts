/**
 * Saved Views 도메인 에러 코드 — 백엔드 SSOT (frontend mapper 와 1:1).
 *
 * SSOT 위치 (5-layer defense-in-depth):
 *   (1) Zod schema           — DTO 검증 시 ErrorCode.ValidationError + issues
 *   (2) Service fail-close   — scope/CAS/한도 위반 시 본 enum throw
 *   (3) ErrorCode enum       — `packages/schemas/src/errors.ts` (HTTP 상태 매핑)
 *   (4) GlobalExceptionFilter — response shape 일관 변환
 *   (5) Frontend mapper      — `apps/frontend/lib/errors/saved-views-errors.ts`
 *
 * 본 파일은 (2) service 레이어 진입점. ErrorCode enum 값 자체를 import 해
 * 인라인 string literal 사용을 회피한다 (verify-zod Step 16 정합).
 */
import { ErrorCode } from '@equipment-management/schemas';

export const SAVED_VIEW_ERROR_CODES = {
  NotFound: ErrorCode.SavedViewNotFound,
  ScopeForbidden: ErrorCode.SavedViewScopeForbidden,
  MaxReached: ErrorCode.SavedViewMaxReached,
  TeamRequiredForScope: ErrorCode.SavedViewTeamRequiredForScope,
  VersionConflict: ErrorCode.VersionConflict,
} as const;

export type SavedViewErrorCode =
  (typeof SAVED_VIEW_ERROR_CODES)[keyof typeof SAVED_VIEW_ERROR_CODES];
