---
slug: equipment-reject-zod-fail-close-hardening
type: mode1
date: 2026-05-02
status: active
---

# Contract: equipment-reject-zod-fail-close-hardening

tech-debt 3건 — equipment reject Zod + fail-close + versioned-base type 격상

## Scope (5 files)

| File | Change |
|------|--------|
| `packages/schemas/src/errors.ts` | `EntityNotFound = 'ENTITY_NOT_FOUND'` enum + `errorCodeToStatusCode` mapping 추가 |
| `apps/backend/src/modules/equipment/dto/reject-request.dto.ts` | `.trim().min(REJECTION_REASON_MIN_LENGTH).max(LONG_TEXT_MAX_LENGTH)` |
| `apps/backend/src/modules/equipment/services/equipment-approval.service.ts` | fail-close `< REJECTION_REASON_MIN_LENGTH` + `VALIDATION_RULES` import |
| `apps/backend/src/common/base/versioned-base.service.ts` | `notFoundCode: ErrorCode = ErrorCode.EntityNotFound` |
| `apps/backend/src/modules/equipment/__tests__/equipment-approval-reject.service.spec.ts` | 신규 — 반려 사유 boundary 3 케이스 (빈/짧은/MIN자) |

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | `reject-request.dto.ts` Zod 체인 | `.trim()` + `.min(REJECTION_REASON_MIN_LENGTH)` + `.max(LONG_TEXT_MAX_LENGTH)` 3개 모두 존재 |
| M2 | `reject-request.dto.ts` SSOT import | `VALIDATION_RULES` from `@equipment-management/shared-constants` import, 하드코딩 숫자 없음 |
| M3 | `equipment-approval.service.ts` fail-close | `rejectionReason.trim().length === 0` 패턴 제거, `< VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 사용 |
| M4 | `versioned-base.service.ts` 기본값 SSOT 격상 | string literal `'ENTITY_NOT_FOUND'` 제거 + 기본값 `ErrorCode.EntityNotFound`로 격상. **타입은 `string` 유지** — 기존 38개 호출부가 domain-specific string literal 전달 중이므로 완전한 `ErrorCode` 타입 격상은 별도 sprint(notFoundCode-type-full-migration). |
| M5 | `errors.ts` EntityNotFound | `EntityNotFound = 'ENTITY_NOT_FOUND'` enum + `[ErrorCode.EntityNotFound]: 404` mapping |
| M6 | schemas 빌드 | `pnpm --filter schemas run build` PASS (errorCodeToStatusCode Record 완결) |
| M7 | backend tsc | `pnpm --filter backend run tsc --noEmit` PASS |
| M8 | backend 테스트 | `pnpm --filter backend run test` — 기존 테스트 전부 PASS |
| M9 | boundary spec | 신규 spec: 빈 문자열 / 9자 / 10자(MIN) 3케이스 boundary 검증 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | disposal.service.ts 패턴과 완전 대칭 (trim 정규화 + MIN 상수 동일) |
| S2 | VM.approval.rejectReason.required 메시지 보존 또는 동등 메시지 유지 |
| S3 | versioned-base 호출부 기존 `ErrorCode.SomethingNotFound` 인자 영향 없음 확인 |

## Anti-Patterns (즉시 FAIL)

- `min(1)` 하드코딩 잔존
- `max(500)` 하드코딩 잔존  
- `trim().length === 0` 체크 잔존
- `notFoundCode = 'ENTITY_NOT_FOUND'` string literal 잔존 (기본값이 string literal이면 FAIL; `ErrorCode.EntityNotFound` 사용 필수)
- `EntityNotFound` errorCodeToStatusCode mapping 누락 (컴파일 에러)
