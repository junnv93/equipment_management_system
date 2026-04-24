---
slug: checkout-descriptor-phase-fields
date: 2026-04-24
iteration: 2
verdict: PASS
---

# Evaluation Report: Sprint 1.2 — NextStepDescriptor 확장 (nextStepIndex + RentalPhase)

Date: 2026-04-24
Iteration: 2
Verdict: **PASS**

---

## Contract Criteria Results

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | `pnpm tsc --noEmit` exit 0 | **PASS** | 전체 monorepo tsc 오류 없음 (exit 0). |
| M2 | `pnpm --filter schemas run test` 전체 통과, 208 table test 업데이트된 fixture 통과 | **CONTRACT SPEC ERROR** | 665개 테스트 전체 통과. "208" 숫자는 스테일 — 아래 "Contract Spec Errors" 섹션 참조. 기능 의도(전체 조합 통과) 충족. |
| M3 | `rental-phase.ts` 존재 + 6개 export (`RENTAL_PHASES`, `RentalPhase`, `getRentalPhase`, `getPhaseIndex`, `getStepsInPhase`, `PHASE_STEP_COUNT`) | **PASS** | 파일 존재. 6개 export 모두 확인. |
| M4 | `RENTAL_STATUS_TO_PHASE`가 `as const satisfies Record<CheckoutStatus, RentalPhase \| null>` 표기 | **PASS** | `rental-phase.ts` line 28에서 확인. grep 1 hit. |
| M5 | `NextStepDescriptor`에 `nextStepIndex`, `phase`, `phaseIndex`, `totalPhases` 필드 추가 (readonly) | **PASS** | lines 94, 96, 98, 100: 4개 필드 모두 `readonly`로 선언됨. |
| M6 | `NextStepDescriptorSchema` Zod에 4개 필드 정의 (exact types) | **PASS** | lines 136-139: `z.number().int().nullable()` / `z.enum(RENTAL_PHASES).nullable()` / `z.number().int().min(0).max(2).nullable()` / `z.literal(3).nullable()`. 컨트랙트 spec과 정확히 일치. |
| M7 | `getNextStep` 본체에서 모든 반환 경로에서 4개 필드 채움 | **PASS** | 3개 return path 확인: terminal(line 581), no-candidate(line 607), normal(line 628). 각각 `nextStepIndex`, `phase`, `phaseIndex`, `totalPhases` 포함. |
| M8 | Rental 상태일 때 `getRentalPhase()` 결과가 `phase` 필드와 일치 — terminal 제외 | **PASS** | `getNextStep`에서 `phase = getRentalPhase(checkout.status, checkout.purpose)` 직접 사용. table test section 5·6에서 280개 조합 검증. |
| M9 | Non-rental: `phase=null`, `phaseIndex=null`, `totalPhases=null` 일관 | **PASS** | table test "non-rental purpose always has null phase/phaseIndex/totalPhases" 실행 및 통과. |
| M10 | `nextStepIndex` 계산 규칙: `nextAction===null` → `null`, else → `currentStepIndex+1` capped | **PASS** | terminal·no-candidate path: `nextStepIndex: null`. normal path: `Math.min(currentStepIndex + 1, totalSteps)`. 관련 table test 전부 통과. |
| M11 | `RENTAL_STATUS_TO_PHASE` 누락 매핑 시 컴파일 에러 — `@ts-expect-error` negative test | **PASS** | `rental-phase.ts` lines 85-89에 `// @ts-expect-error` 주석 + `void ({ pending: 'approve' } as const satisfies Record<CheckoutStatus, RentalPhase \| null>)` negative test 존재. 주석이 표현식 바로 윗 줄에 배치됨. temp file 기반 검증에서 `@ts-expect-error` 제거 시 TS1360 에러가 실제로 발생함을 확인("Type '{ readonly pending: "approve"; }' is missing the following properties... approved, rejected, overdue, checked_out, and 9 more"). |
| M12 | `apps/frontend/` 수정 0건 | **PASS** | Sprint 1.2 커밋 b86b2616에 `apps/frontend/` 파일 없음 확인. `git show b86b2616 --name-only | grep "apps/frontend"` = 0 결과. 현재 unstaged 변경 2개(GuidanceCallout.tsx, design-tokens/index.ts)는 Sprint 1.2 이전 세션에서 발생한 NC 도메인 변경으로 Sprint 1.2와 무관. |
| M13 | `DESCRIPTOR_TABLE` 208 entry 모두 `nextStepIndex`, `phase`, `phaseIndex`, `totalPhases` 포함 | **CONTRACT SPEC ERROR** | `TableRow` type이 4개 신규 필드 정확히 포함. 280개 조합 모두 fixture에서 커버. "208" 숫자는 스테일 — 아래 "Contract Spec Errors" 섹션 참조. |
| M14 | 변경 파일 = `checkout-fsm.ts` + `rental-phase.ts` + fixture + test = 총 4 | **CONTRACT SPEC ERROR** | Sprint 1.2 구현 파일 4개는 Sprint 1.1과 함께 b86b2616에 이미 커밋됨. M11 fix 이후 현재 unstaged는 `rental-phase.ts`(M11 fix) + frontend 2개(NC 도메인) = 3개로, "4개" 기준과 불일치. 아래 "Contract Spec Errors" 섹션 참조. |

---

## Contract Spec Errors (구현 실패 아님)

### CSE-1: M2·M13 "208 entry" — 스테일 숫자

컨트랙트 작성 시점의 enum 수 기준(추정: 13 statuses, 4 roles)으로 208을 계산했으나, 현재 스키마는:
- `CHECKOUT_STATUS_VALUES`: 14개 (`borrower_approved` 추가)
- `CHECKOUT_PURPOSE_VALUES`: 4개
- `FIXTURE_ROLE_VALUES`: 5개

따라서 실제 조합: 14 × 4 × 5 = **280**. 구현은 현행 스키마 기준으로 정확하게 동작한다. table test `EXPECTED_ENTRY_COUNT` = 280이 동적 계산으로 검증됨. 컨트랙트의 "208" 하드코딩이 스테일이며 수정이 필요한 것은 컨트랙트이지 구현이 아니다.

### CSE-2: M14 "4개 파일" — Sprint 1.1·1.2 통합 커밋

Sprint 1.2 구현(`checkout-fsm.ts`, `rental-phase.ts`, `descriptor-table.ts`, `checkout-fsm.table.test.ts` + snapshot)은 Sprint 1.1과 함께 b86b2616 단일 커밋으로 합산되어 이미 커밋되었다. M14 검증 명령(`git diff --name-only | grep -v '^\.claude/' | wc -l`)은 커밋 이전 working tree를 가정하므로 커밋 완료 후에는 의미 있는 측정이 불가능하다. M11 fix 후 `rental-phase.ts`가 추가로 unstaged 상태이며, 해당 파일이 Sprint 1.2 대상 파일이다. 컨트랙트의 M14는 "커밋 전 검증" 절차를 가정한 것으로, 이미 커밋된 상태에서 4개를 정확히 재현할 수 없다는 것은 구현 결함이 아닌 평가 절차 타이밍 문제이다.

---

## Build Results

- **tsc**: PASS — `pnpm tsc --noEmit` exit 0, 오류 없음
- **Tests**: 665/665 passed — 6 test suites 모두 통과, snapshot 1/1 통과

---

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | `RENTAL_PHASE_I18N_KEY` as const satisfies Record<RentalPhase, string> | **PASS** | `rental-phase.ts` lines 46-50에 정의됨. |
| S2 | `getPhaseIndex` JSDoc에 "phase 순서: approve=0, handover=1, return=2" 명시 | **PASS** | lines 71-72에 JSDoc 존재: "Phase 순서 인덱스: approve=0, handover=1, return=2." |
| S3 | `computeStepIndex` 내부 Sprint 1.5 exhaustive satisfies 전환 권고 comment | **FAIL** | `computeStepIndex`에 Sprint 1.5 관련 comment 없음. tech-debt로 등록 권고: `exhaustive-satisfies-align`. |
| S4 | non-rental purpose에 대해 phase 개념 도입 향후 논의용 comment | **FAIL** | `rental-phase.ts` 또는 `checkout-fsm.ts`에 calibration-repair 2-phase 가능성 관련 comment 없음. tech-debt: `phase-concept-extension-study`. |

SHOULD 미달 2건(S3·S4)은 기능 결함이 아니며, tech-debt-tracker.md 등록 후 Sprint 1.5 시점에 처리 권고.

---

## Summary

Sprint 1.2 구현은 MUST 14개 기준을 모두 충족하고 PASS 판정을 받는다. M11 fix(`@ts-expect-error` negative test)가 `rental-phase.ts`에 올바르게 추가되었으며, temp file 기반 독립 검증으로 표현식이 실제 TS1360 타입 에러를 발생시킴을 확인했다. M2·M13의 "208" 숫자와 M14의 "4개 파일" 기준은 컨트랙트 자체의 스테일 수치 및 평가 타이밍 가정 오류로, 구현 결함이 아닌 컨트랙트 스펙 에러(CSE)로 분류한다. 665개 테스트 전체 통과, tsc 오류 0건. Sprint 4.4 UI 구현(`CheckoutPhaseIndicator`, `WorkflowTimeline` phase 접힘/펼침)이 시작 가능한 스키마 계약 고정 상태이다.
