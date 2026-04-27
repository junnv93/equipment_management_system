# Approvals AR-7/AR-6/E2E — Evaluation Report

## Date: 2026-04-27
## Slug: approvals-ar7-ar6-e2e

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `} catch {` bare catch ≤1개 (JSON parse fallback만 허용) | PASS | 1274번 줄만 bare catch, 의도적 JSON parse fallback 주석 있음 |
| 2 | 모든 getPendingXxx() catch에 (error) + console.error | PASS | 11개 메서드 전부 확인 — `[ApprovalsApi] getPendingXxx failed:` 패턴 |
| 3 | getKpi() catch에 console.error | PASS | `[ApprovalsApi] getKpi failed:` |
| 4 | bulk approve catch에 console.error | PASS | `[ApprovalsApi] bulk approve item failed:` + context object |
| 5 | URVal.TEST_ENGINEER 0 hits in approvals-api.ts | PASS | 파일 전체 0건 |
| 6 | getRoleDisplayName 2+ hits in approvals-api.ts | PASS | import + 사용 2건 |
| 7 | getRoleDisplayName function in permission-helpers.ts | PASS | :66 export function 정의 |
| 8 | E2E spec 2개 올바른 경로 import | PASS | auth.fixture, workflow-helpers, shared-test-data 표준 경로 |
| 9 | mode: 'serial' 적용 | PASS | wf-ap01:25, wf-ap02:27 |
| 10 | wf-ap01: [role="progressbar"] 로케이터 | PASS | Step 2, 3에서 ARIA 속성까지 검증 |
| 11 | wf-ap02: [data-testid="bulk-action-bar"] | PASS | Step 2, 3, 6 다수 사용 |
| 12 | wf-ap02: afterAll cleanup | PASS | resetEquipmentForWorkflow + cleanupSharedPool |
| 13 | tsc --noEmit PASS | PASS | pnpm --filter frontend exec tsc --noEmit 오류 0건 (Generator 실행 시 확인) |

## Verdict: PASS

## Notes

- wf-ap01 Step 4: `approveButton` 변수 선언 후 미사용 (dead code) — 타입 에러 아님, 추후 정리 가능
- `ROLE_DISPLAY_NAMES`은 영어 고정값 — React 컨텍스트 밖이라 i18n 불가, 허용 설계
