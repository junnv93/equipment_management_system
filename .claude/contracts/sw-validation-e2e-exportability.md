# Contract: sw-validation-e2e-exportability

## Scope

1. `apps/frontend/tests/e2e/workflows/wf-14b-software-validation.spec.ts` — Steps 12–15 추가
2. `apps/frontend/lib/utils/software-validation-exportability.ts` — 신규 유틸

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `tsc --noEmit` (frontend) 0 errors | `pnpm --filter frontend run tsc --noEmit` |
| M2 | `pnpm --filter frontend run lint` PASS | ESLint 0 errors |
| M3 | Step 12 (자기승인 차단) — TE가 submit 후 TE role로 approve 시 HTTP 403 + `code: 'SELF_APPROVAL_FORBIDDEN'` | E2E assertion |
| M4 | Step 13 (이중승인 차단) — 동일 TM이 technical approve 후 quality-approve 시도 시 HTTP 403 + `code: 'DUAL_APPROVAL_SAME_PERSON_FORBIDDEN'` | E2E assertion |
| M5 | Step 14 (재검증 배너) — rejected 상태에서 revise 호출 시 status==='draft' 복귀 | E2E assertion |
| M6 | Step 15 (T6 DOCX) — self 타입 controlFunctions 포함 유효성확인을 quality_approve 후 export, PizZip으로 XML 파싱 → 제어기능 데이터(로봇 이동 제어 등) 포함 확인 | PizZip assertion |
| M7 | `software-validation-exportability.ts` — `ValidationStatus` SSOT import, 로컬 재정의 금지 | Grep: no local type redefinition |
| M8 | `isValidationExportable()` — `draft`/`rejected` 상태 false, `quality_approved` true | Unit test 또는 E2E |
| M9 | workflow-helpers.ts에 `reviseSoftwareValidation()` 헬퍼 추가 (CAS-Aware 패턴 동일) | Grep |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `NON_EXPORTABLE_VALIDATION_STATUSES` readonly array 네이밍 — checkout-exportability.ts 패턴 일치 |
| S2 | Step 15 DOCX XML에 controlFunctions 첫 번째 항목의 `controlledFunction` 값('로봇 이동 제어') 포함 검증 |
| S3 | 새 tests가 기존 spec의 `test.describe.configure({ mode: 'serial' })` outer-scope 아래에 별도 `describe` 블록으로 배치 |

## Out of Scope

- 프론트엔드 UI 컴포넌트 변경 (export 버튼 disabled 처리는 컴포넌트 작업 시 유틸 가져다 쓸 준비만)
- 백엔드 코드 변경
- 기존 Step 1–11 수정
