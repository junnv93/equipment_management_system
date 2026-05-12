/**
 * 승인 철회 schema SSOT — backend ZodValidationPipe + frontend type infer 양쪽 공유.
 *
 * Backend: `apps/backend/src/modules/checkouts/dto/revoke-approval.dto.ts` 가 본 schema 를 import.
 * Frontend: `apps/frontend/lib/api/checkout-revoke-approval.ts` 가 `RevokeApprovalInput` type 만 import.
 *
 * 정책 (UL-QP-18 §4.7 승인 철회):
 * - `version` 필수 — CAS optimistic locking
 * - `reason` 필수 — 사용자 입력 사유 (min `REVOCATION_REASON_MIN_LENGTH(10)`, max `LONG_TEXT_MAX_LENGTH(500)`)
 * - 자동 시스템 트리거(5초 undo) 도 backend 정책상 사유 필수 — frontend 가 시스템 reason 생성 (`SYSTEM_UNDO_REVOCATION_REASON`)
 *
 * 의존: SCHEMA_VALIDATION_RULES (schemas 측 SSOT). shared-constants 의존 금지 (의존 그래프 최하층 보존).
 */

import { z } from 'zod';
import { SCHEMA_VALIDATION_RULES } from './schema-validation-rules';
import { VM } from './validation';

export const revokeApprovalSchema = z.object({
  version: z.number().int(VM.version.int).positive(VM.version.positive),
  reason: z
    .string()
    .trim()
    .min(
      SCHEMA_VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH,
      VM.string.min('철회 사유', SCHEMA_VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH)
    )
    .max(
      SCHEMA_VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('철회 사유', SCHEMA_VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
});

export type RevokeApprovalInput = z.infer<typeof revokeApprovalSchema>;

/**
 * 시스템 자동 reason — 5초 undo 토스트 트리거 시 frontend 가 채움.
 * Backend 정책상 reason 필수 + audit log 에 시스템 액션임을 명시.
 * 10자 이상 (REVOCATION_REASON_MIN_LENGTH 충족).
 */
export const SYSTEM_UNDO_REVOCATION_REASON = '[시스템] 승인 직후 5초 내 본인 undo 토스트 트리거';
