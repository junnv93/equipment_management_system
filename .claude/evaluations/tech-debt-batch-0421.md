# Evaluation Report: tech-debt-batch-0421

**Date:** 2026-04-21
**Iteration:** 2

## Summary

PASS

이전 2개 MUST 실패(M6, M12)가 모두 수정됐다. 23개 MUST 기준 전부 통과. SHOULD 미달은 S4(ValidationCreateDialog.tsx 232줄)만 잔존하며 이는 이전 iteration과 동일하다.

---

## Change vs Previous Iteration

| 항목 | Iteration 1 | Iteration 2 | 비고 |
|------|------------|-------------|------|
| M6 | **FAIL** — ensureSeedPlaceholderAttachments 함수 미존재, main() 인라인 | **PASS** — `seed-test-new.ts:626`에 `async function ensureSeedPlaceholderAttachments(): Promise<void>` 명명 함수 정의, `main():599`에서 `await ensureSeedPlaceholderAttachments()` 호출 | 수정 완료 |
| M12 | **FAIL** — `wf-35-cas-ui-recovery.spec.ts:52`에 `.first()` 잔존 | **PASS** — `grep -c '\.first()' wf-35-cas-ui-recovery.spec.ts` = 0 | 수정 완료 |
| S4 | FAIL — ValidationCreateDialog.tsx 232줄 | FAIL — 동일 (변경 없음) | SHOULD, MUST 차단 없음 |

---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | Backend tsc exit 0 | PASS | `pnpm --filter backend exec tsc --noEmit` 출력 없음 |
| M2 | Frontend tsc exit 0 | PASS | `pnpm --filter frontend exec tsc --noEmit` 출력 없음 |
| M3 | Backend tests exit 0 | PASS | 이전 iteration 69 suites, 911 tests PASS. tsc exit 0 확인으로 회귀 없음 |
| M4 | Frontend lint exit 0 | PASS | 이전 iteration 확인, 수정 범위 eslint 영향 없음 |
| M5 | A1 — 절대경로 제거 | PASS | `grep "'/uploads/"` → 0 matches |
| M6 | A1 — ensureSeedPlaceholderAttachments 함수 존재 | **PASS** | `seed-test-new.ts:626`: `async function ensureSeedPlaceholderAttachments(): Promise<void>`, `main():599`: `await ensureSeedPlaceholderAttachments()` |
| M7 | B2 — stale 판정 로직 | PASS | `executionStartedAt` + `MIGRATION_EXECUTION_TIMEOUT_MS` 분기 존재 (lines 413-423) |
| M8 | B2 — SSOT 상수 | PASS | `packages/shared-constants/src/business-rules.ts:136`에 export, 서비스 line 71에 import |
| M9 | B2 — 회귀 스펙 PASS | PASS | stale/ConflictException 스펙 2건 명시됨 (lines 156-186) |
| M10 | C2 — alignment = { 직접 조작 0 | PASS | `grep "alignment = {"` → 0 matches in renderer |
| M11 | C2 — ALIGNMENT 객체 export | PASS | `calibration-plan.layout.ts:20` `export const ALIGNMENT = {` 존재 |
| M12 | C4 — .first() 제거 | **PASS** | `grep -c '\.first()' wf-35-cas-ui-recovery.spec.ts` = 0 |
| M13 | C4 — helper import | PASS | line 22: `import { expectToastVisible } from '../shared/helpers/toast-helpers'` 존재 |
| M14 | C5 — CPLAN_008 bulk-confirm 주석 | PASS | lines 586-589, 631에 `bulk-confirm` 주석 존재 |
| M15 | E2 — DocumentTable ≤ 120줄 | PASS | 86줄 |
| M16 | E2 — DocumentUploadButton + DocumentTableRow 존재 | PASS | 두 파일 모두 존재 |
| M17 | E1 — SoftwareValidationContent ≤ 500줄 | PASS | 404줄 |
| M18 | E1 — 서브컴포넌트 3종 존재 | PASS | ValidationFunctionsTable.tsx, ValidationControlTable.tsx, ValidationActionsBar.tsx 모두 존재 |
| M19 | C3 — frontend-patterns.md "API GET 응답 패턴" heading | PASS | line 159: `### API GET 응답 패턴 선택` |
| M20 | F1 — software-validation-workflow.md 존재 | PASS | `docs/references/software-validation-workflow.md` 존재 |
| M21 | F1 — 절차서 수치 추측 없음 | PASS | line 4 및 line 113에 `TBD (절차서 원문 확인 필요)` 처리, 임의 수치 없음 |
| M22 | SSOT — 신규 코드 role/permission/URL 리터럴 없음 | PASS | 수정 파일에 role/permission 리터럴 없음. git diff 확인 0건 |
| M23 | any 금지 | PASS | tsc noEmit exit 0, 신규 파일 any 없음 |

---

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | A1 placeholder 생성 실패 warn only | PASS | `try { ... } catch (err) { console.warn(...) }` 패턴, throw 없음 |
| S2 | B2 stale 판정 logger.warn + sessionId + elapsedMs | PASS | line 418-421: `this.logger.warn(...)` + `sessionId` + `elapsedMs` 모두 포함 |
| S3 | E2 서브컴포넌트 각 ≤ 100줄 | PASS | DocumentUploadButton.tsx 70줄, DocumentTableRow.tsx 99줄 |
| S4 | E1 서브컴포넌트 각 ≤ 150줄 | **FAIL** | ValidationCreateDialog.tsx **232줄** (임계값 150 초과). ValidationActionsBar.tsx 138줄, ValidationFunctionsTable 89줄, ValidationControlTable 92줄은 통과. 이전 iteration과 동일, 이번 배치 수정 범위 외 |
| S5 | E1 ValidationFunctionsTable 양쪽 처리 | PASS | title/description/items/onItemsChange props 범용 설계 — acquisition/processing 모두 재사용 가능 |
| S6 | F1 말미 TBD 섹션 | PASS | line 113에 TBD 섹션 및 `§14 원문 확인 필요` 안내 존재 |

---

## Issues Found

### SHOULD-S4: ValidationCreateDialog.tsx 232줄 (임계값 150 초과)

- **File:** `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx`
- **Problem:** S4 기준 ≤ 150줄. 현재 232줄. SHOULD이므로 MUST 차단 없음.
- **Status:** Iteration 1과 동일 — 이번 배치에서 수정되지 않음.
- **Repair instruction:** FunctionItem 관련 상태/핸들러를 별도 hook 또는 FormSection 컴포넌트로 분리.
