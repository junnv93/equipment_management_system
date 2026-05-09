/**
 * Backend Error Code / Validation Issues Extraction Hub (SSOT — ADR-0008)
 *
 * 모든 도메인 error mapper(`disposal-errors`/`equipment-errors`/...)가 본 hub를 통해
 * backend 응답에서 ErrorCode + Zod issues를 추출한다. ErrorCode 우선 routing,
 * issues fallback. 호출자는 단일 wrapper `extractErrorCodeOrIssues` 사용.
 *
 * @see packages/schemas/src/validation/zod-issue.ts (BackendValidationIssue SSOT)
 * @see apps/frontend/lib/errors/zod-issue-mapper.ts (FE i18n routing)
 */
import type { BackendValidationIssue } from '@equipment-management/schemas';

/**
 * Backend 응답에서 ErrorCode 추출 (ApiError / Axios error / plain object 호환).
 *
 * 우선순위:
 * 1. `error.code` (ApiError instance)
 * 2. `error.response.data.code` (Axios)
 *
 * @returns ErrorCode string (e.g. 'EQUIPMENT_NOT_FOUND') or null
 */
export function extractErrorCode(error: unknown): string | null {
  if (error === null || typeof error !== 'object') return null;

  const obj = error as Record<string, unknown>;
  if (typeof obj.code === 'string') return obj.code;

  const response = obj.response as Record<string, unknown> | undefined;
  if (response && typeof response === 'object') {
    const data = response.data as Record<string, unknown> | undefined;
    if (data && typeof data.code === 'string') return data.code;
  }

  return null;
}

/**
 * Backend 응답에서 Zod validation issues 추출 (ADR-0008 §B-option SSOT).
 *
 * 우선순위:
 * 1. `error.issues` (직접 throw된 BackendValidationError 등)
 * 2. `error.response.data.issues` (Axios raw error)
 * 3. `error.details.issues` (ApiError — createApiError 가 top-level issues 를 details 에 보존, ADR-0008)
 *
 * @returns BackendValidationIssue[] or null (issues 미존재 / non-validation 응답)
 */
export function extractValidationIssues(error: unknown): BackendValidationIssue[] | null {
  if (error === null || typeof error !== 'object') return null;

  const obj = error as Record<string, unknown>;
  // DEBUG: ADR-0008 issues extraction trace
  console.log(
    '[ADR-0008-DEBUG] extractValidationIssues called, obj.code:',
    obj.code,
    'obj.issues:',
    obj.issues,
    'obj.details:',
    obj.details
  );

  const direct = pickIssues(obj.issues);
  if (direct) return direct;

  const response = obj.response as Record<string, unknown> | undefined;
  if (response && typeof response === 'object') {
    const data = response.data as Record<string, unknown> | undefined;
    if (data) {
      const fromAxios = pickIssues(data.issues);
      if (fromAxios) return fromAxios;
    }
  }

  // ADR-0008: ApiError.details.issues — createApiError 가 top-level issues 를 보존한 경로
  const details = obj.details as Record<string, unknown> | undefined;
  console.log('[ADR-0008-DEBUG] details:', details, 'typeof details:', typeof details);
  if (details && typeof details === 'object') {
    const fromDetails = pickIssues(details.issues);
    console.log('[ADR-0008-DEBUG] fromDetails:', fromDetails);
    if (fromDetails) return fromDetails;
  }

  return null;
}

function pickIssues(value: unknown): BackendValidationIssue[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const valid: BackendValidationIssue[] = [];
  for (const item of value) {
    if (item && typeof item === 'object' && 'code' in item && 'path' in item) {
      const candidate = item as { code: unknown; path: unknown };
      if (typeof candidate.code === 'string' && Array.isArray(candidate.path)) {
        valid.push(item as BackendValidationIssue);
      }
    }
  }
  return valid.length > 0 ? valid : null;
}

export interface ErrorEnvelope {
  code: string | null;
  issues: BackendValidationIssue[] | null;
}

/**
 * Hub wrapper — ErrorCode + Validation issues 한 번에 추출.
 *
 * 도메인 mapper 호출 권장: `const { code, issues } = extractErrorCodeOrIssues(error);`
 * - `code` 가 도메인 매핑에 있으면 ErrorCode 우선 routing.
 * - 없으면 `issues` 가 있을 때 zod-issue-mapper 로 fallback.
 * - 둘 다 null 이면 generic fallback (Error.message 등).
 */
export function extractErrorCodeOrIssues(error: unknown): ErrorEnvelope {
  return {
    code: extractErrorCode(error),
    issues: extractValidationIssues(error),
  };
}
