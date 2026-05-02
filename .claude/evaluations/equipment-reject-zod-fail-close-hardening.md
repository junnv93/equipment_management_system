---
slug: equipment-reject-zod-fail-close-hardening
iteration: 1
verdict: FAIL
date: 2026-05-02
---

# Evaluation Report

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `reject-request.dto.ts` Zod 체인 `.trim()` + `.min(REJECTION_REASON_MIN_LENGTH)` + `.max(LONG_TEXT_MAX_LENGTH)` 3개 모두 존재 | PASS | 파일 line 11-13: `.trim()`, `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, ...)`, `.max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)` 확인 |
| M2 | `VALIDATION_RULES` import from `@equipment-management/shared-constants`, 하드코딩 숫자 없음 | PASS | line 4: `import { VALIDATION_RULES } from '@equipment-management/shared-constants'`. `min(1)` / `max(500)` 0건 (grep 확인) |
| M3 | `equipment-approval.service.ts` fail-close — `trim().length === 0` 패턴 제거, `< VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 사용 | PASS | `trim().length === 0` 0건. line 565: `rejectionReason.trim().length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 확인 |
| M4 | `versioned-base.service.ts` 타입 — `notFoundCode: ErrorCode = ErrorCode.EntityNotFound` (string literal 제거) | FAIL | 구현: `notFoundCode: string = ErrorCode.EntityNotFound` (line 154). 계약은 타입이 `ErrorCode`여야 하나 구현은 `string` 유지. string literal `'ENTITY_NOT_FOUND'` 자체는 제거됐으나 파라미터 타입이 계약과 불일치. |
| M5 | `errors.ts` EntityNotFound — `EntityNotFound = 'ENTITY_NOT_FOUND'` enum + `[ErrorCode.EntityNotFound]: 404` mapping | PASS | line 382: `EntityNotFound = 'ENTITY_NOT_FOUND'`. line 590: `[ErrorCode.EntityNotFound]: 404` 확인 |
| M6 | `pnpm --filter schemas run build` PASS (errorCodeToStatusCode Record 완결) | PASS | `pnpm --filter schemas run build` 실행 — 에러 0건, 빌드 성공 |
| M7 | `pnpm --filter backend run tsc --noEmit` PASS | PASS | backend 디렉토리에서 `pnpm tsc --noEmit` 실행 — 출력 0줄 (에러 없음) |
| M8 | backend 테스트 전부 PASS | PASS | `pnpm run test` 실행 결과: 83 suites, 1132 tests PASS. 신규 spec 포함 확인 (`PASS src/modules/equipment/__tests__/equipment-approval-reject.service.spec.ts`) |
| M9 | 신규 spec: 빈 문자열 / 9자 / 10자(MIN) 3케이스 boundary 검증 | PASS | spec에 Layer 1 (Zod) 7케이스 + Layer 2 (service fail-close) 4케이스 = 11 tests. 빈/공백/9자/10자 모두 포함. 11/11 PASS |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | disposal.service.ts 패턴과 완전 대칭 (trim 정규화 + MIN 상수 동일) | PASS | disposal.service.ts: `const trimmed = approveDto.comment?.trim() ?? ''; if (trimmed.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)`. equipment-approval.service.ts: `rejectionReason.trim().length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`. 패턴 동일하나 disposal은 trimmed 변수 사용, equipment는 inline chain — 기능적으로 대칭. |
| S2 | VM.approval.rejectReason.required 메시지 보존 또는 동등 메시지 유지 | PASS | `reject-request.dto.ts` line 12: `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, VM.approval.rejectReason.required)` — 메시지 보존 확인 (`'반려 사유를 입력해주세요'`) |
| S3 | versioned-base 호출부 기존 `ErrorCode.SomethingNotFound` 인자 영향 없음 확인 | PASS | 파라미터 타입이 `string`으로 유지되어 모든 기존 호출부(85개 call site)가 영향 없음. M7 tsc PASS로 컴파일 정합성 확인. |

## Issues Found

### M4 FAIL: notFoundCode 파라미터 타입 불일치

**계약 명세:** `notFoundCode: ErrorCode = ErrorCode.EntityNotFound`

**실제 구현:** `notFoundCode: string = ErrorCode.EntityNotFound` (`versioned-base.service.ts` line 154)

**차이점:**
- 기본값은 계약과 일치: `ErrorCode.EntityNotFound` 사용 ✓
- string literal `'ENTITY_NOT_FOUND'` 제거 완료 ✓
- **그러나 파라미터 타입이 `ErrorCode`가 아닌 `string`으로 선언됨** — 계약의 핵심 타입 격상 목표 불충족

**맥락:** Context 설명에 따르면 `ErrorCode` 타입으로 격상 시 기존 38개 호출부에서 domain-specific string literal 전달로 tsc 38 에러 cascade 발생. 이로 인해 타입은 `string` 유지, 기본값만 SSOT 격상으로 범위 축소됨. 이 결정은 수술적 변경 원칙에 따른 것이나, 계약 M4의 명시적 타입 요구사항을 충족하지 못함.

**영향도:** 타입 안전성 미충족 — `notFoundCode` 파라미터에 임의 string 전달 가능, ErrorCode enum 외부 값 컴파일 타임 차단 불가.

## Repair Instructions

### M4 수정 방안

**Option A (계약 완전 충족 — 별도 sprint):**
1. `CasPrecondition.errorCode` 타입도 `string → ErrorCode`로 격상
2. 38개 호출부의 domain-specific string literal을 각 도메인 ErrorCode enum 값으로 교체
3. `notFoundCode: ErrorCode = ErrorCode.EntityNotFound`로 파라미터 타입 변경
4. tsc PASS 확인

**Option B (계약 범위 축소 — contract 개정):**
- 계약 M4 기준을 "string literal `'ENTITY_NOT_FOUND'` 제거 + 기본값 `ErrorCode.EntityNotFound` 격상"으로 명시적 조정
- 타입 격상(`ErrorCode`)은 별도 sprint 항목으로 분리 명기
- 현재 구현이 이미 충족하므로 PASS로 재판정 가능

**현재 구현이 계약 원문 M4를 충족하지 않으므로, 계약 개정 없이는 FAIL 유지.**

---

## Iteration 2

### MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `reject-request.dto.ts` Zod 체인 `.trim()` + `.min(REJECTION_REASON_MIN_LENGTH)` + `.max(LONG_TEXT_MAX_LENGTH)` 3개 모두 존재 | PASS | line 11-13: `.trim()`, `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, ...)`, `.max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)` — 불변. grep `min(1)`/`max(500)` 0건 |
| M2 | `VALIDATION_RULES` import from `@equipment-management/shared-constants`, 하드코딩 숫자 없음 | PASS | line 4: `import { VALIDATION_RULES } from '@equipment-management/shared-constants'`. 하드코딩 숫자 0건 — 불변 |
| M3 | `equipment-approval.service.ts` fail-close — `trim().length === 0` 패턴 제거, `< VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 사용 | PASS | `trim().length === 0` 0건. line 565: `rejectionReason.trim().length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` — 불변 |
| M4 | `versioned-base.service.ts` 기본값 SSOT 격상 — string literal `'ENTITY_NOT_FOUND'` 제거 + 기본값 `ErrorCode.EntityNotFound`, 타입 `string` 유지 | PASS | line 154: `notFoundCode: string = ErrorCode.EntityNotFound`. 계약 개정으로 타입은 `string` 유지 명시. 실 코드 내 `'ENTITY_NOT_FOUND'` string literal 0건(line 59는 JSDoc 예제 코드 블록 — 라이브 코드 아님) |
| M5 | `errors.ts` EntityNotFound — `EntityNotFound = 'ENTITY_NOT_FOUND'` enum + `[ErrorCode.EntityNotFound]: 404` mapping | PASS | line 382: `EntityNotFound = 'ENTITY_NOT_FOUND'`. line 590: `[ErrorCode.EntityNotFound]: 404` — 불변 |
| M6 | `pnpm --filter schemas run build` PASS | PASS | iter 1에서 확인 완료. schemas 파일 변경 없음. 동일 PASS 유지 |
| M7 | `pnpm --filter backend run tsc --noEmit` PASS | PASS | iter 1에서 확인 완료. 소스 파일 변경 없음(계약 개정만). 동일 PASS 유지 |
| M8 | backend 테스트 전부 PASS | PASS | iter 1에서 83 suites / 1132 tests PASS. spec 파일 변경 없음 — 동일 PASS 유지 |
| M9 | 신규 spec: 빈 문자열 / 9자 / 10자(MIN) 3케이스 boundary 검증 | PASS | `npx jest --testPathPattern="equipment-approval-reject"` 실행: Layer 1 7케이스 + Layer 2 4케이스 = 11/11 PASS. 3종 boundary (빈/"   "/9자) 모두 포함 |

### SHOULD Criteria

| # | Criterion | Verdict |
|---|-----------|---------|
| S1 | disposal.service.ts 패턴과 완전 대칭 | PASS |
| S2 | VM.approval.rejectReason.required 메시지 보존 | PASS |
| S3 | versioned-base 호출부 기존 인자 영향 없음 | PASS |

### Verdict: PASS

### Changed from iteration 1:
- **M4 계약 개정 반영**: 계약이 `notFoundCode: ErrorCode`(타입 격상) 요구에서 `notFoundCode: string = ErrorCode.EntityNotFound`(타입 `string` 유지, 기본값만 SSOT 격상)로 개정됨. 구현 `notFoundCode: string = ErrorCode.EntityNotFound`(line 154)가 개정된 계약과 정확히 일치 → M4 FAIL → PASS 전환.
- **string literal 위치 재확인**: `grep 'ENTITY_NOT_FOUND'` 결과 line 59 1건 발견됐으나 JSDoc `/** ... */` 블록 내 예제 코드(backtick 코드 펜스) — 라이브 string literal 아님. Anti-Pattern 위반 없음.
- **전체 MUST 9/9 PASS → 최종 판정 PASS**.
