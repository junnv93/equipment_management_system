---
slug: errorcode-residual-closure
date: 2026-05-03
iteration: 1
verdict: PASS
---

# Evaluation: errorcode-residual-closure

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|---------|
| M1 | backend tsc 0 errors | PASS | `npx tsc --noEmit` 0 errors |
| M2 | frontend tsc 0 errors | PASS | `npx tsc --noEmit` 0 errors |
| M3 | backend tests ≥ 1133 | PASS | 83 suites · 1133 tests PASS |
| M4 | REVOCATION_REASON_MIN_LENGTH 상수 존재 | PASS | `validation-rules.ts:21` `REVOCATION_REASON_MIN_LENGTH: 10` |
| M5 | RevocationReasonRequired ErrorCode 존재 | PASS | `errors.ts` enum + 400 매핑 |
| M6 | DTO가 상수 참조 | PASS | `revoke-approval.dto.ts` `.min(VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH)` + `.max()` |
| M7 | service fail-close 존재 | PASS | `checkouts.service.ts` revokeApproval `ErrorCode.RevocationReasonRequired` |
| M8 | equipment-imports ForbiddenException | PASS | `equipment-imports.service.ts:754` ForbiddenException |
| M9 | non-conformance mapBackendErrorCode 존재 | PASS | `non-conformance-errors.ts` export function mapBackendErrorCode |
| M10 | cable-errors 잘못된 alias 제거 | PASS | standalone mapBackendErrorCode function |
| M11 | verify-zod inline 0건 유지 | PASS | grep → 0건 |

## SHOULD Criteria

| ID | Criterion | Verdict |
|----|-----------|---------|
| S1 | RevocationReasonRequired SECURITY_AUDITABLE_CODES 포함 | PASS |
| S2 | 철회 에러 2건 ko/en i18n parity | PASS |
| S3 | security-auditable-codes.ts 주석 수정 | PASS |

## Post-processing (완료)

- revokeApproval fail-close 순서 수정: `scope → reason → FSM` → `scope → FSM → reason` (MEMORY 원칙)
- SoftwareValidationErrorCode + getSoftwareValidationErrorMessageKey 데드코드 제거 (0 call sites)

## Summary

Verdict: **PASS** — 11/11 MUST, 3/3 SHOULD 충족
