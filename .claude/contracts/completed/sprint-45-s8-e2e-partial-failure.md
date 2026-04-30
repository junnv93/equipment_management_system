---
slug: sprint-45-s8-e2e-partial-failure
created: 2026-04-30
status: active
mode: 1
---

# Contract: Sprint 4.5 S8 — E2E 5건 일괄 반려 + 부분 실패 시뮬레이션

## Context

tech-debt-tracker의 `[2026-04-30 sprint-4.5 SHOULD] S8 bulk-reject e2e 테스트` 항목.
setqueryd-purge-and-bulk-ux harness에서 이연된 SHOULD — 기존 wf-ap02 7-step은 2건 bulk reject를
커버하나, 5건 전체 성공 + 부분 실패(route intercept) 시나리오가 미구현.

**병행 작업**: setqueryd-purge-and-bulk-ux 커밋 미완 변경(8 files) 동시 커밋.

## Scope

| 파일 | 변경 유형 |
|------|----------|
| `apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts` | extend (Step 8-9 mock tests + WF-AP02-EXT describe 추가) |
| `.claude/exec-plans/tech-debt-tracker.md` | update (S8 완료 마킹) |

## 구현 전략

- **Steps 8-9** (기존 describe 내): mock route로 전체 성공/부분 실패 toast 분기 UI 검증 (빠름)
- **WF-AP02-EXT** (별도 describe): 실제 5건 장비 생성 → 실제 bulk reject (E2E 통합) + 3건 mock 부분 실패

## MUST Criteria

| # | 기준 | grep/명령 |
|---|------|----------|
| M1 | `pnpm tsc --noEmit` PASS (exit 0) | `pnpm tsc --noEmit` |
| M2 | `pnpm --filter frontend exec tsc --noEmit` PASS | frontend tsc |
| M3 | `wf-ap02` spec에 `WF-AP02-EXT` describe 블록 존재 | `grep "WF-AP02-EXT" ...spec.ts` ≥ 1 |
| M4 | EXT_EQUIPMENT_IDS 배열에 5개 장비 (TEST_EQUIPMENT_IDS 경유, 하드코딩 UUID 금지) | `grep "EXT_EQUIPMENT_IDS = \[" ...spec.ts` → 5-element array |
| M5 | `createCheckout` EXT 루프 존재 | `grep "EXT_EQUIPMENT_IDS" ...spec.ts` ≥ 2 |
| M6 | Step EXT-2: 5건 체크박스 loop `i < 5` | `grep "i < 5" ...spec.ts` ≥ 1 |
| M7 | `page.route` 또는 `techManagerPage.route` 인터셉트 2건 이상 (Step 8 + Step 9 또는 EXT-3) | `grep "\.route(" ...spec.ts` ≥ 2 |
| M8 | mock body `rejected` + `failed` 배열 모두 포함 (부분 실패용) | `grep "rejected.*failed\|failed.*rejected" ...spec.ts` ≥ 1 |
| M9 | `unroute` 정리 — finally 블록 또는 await 패턴 | `grep "unroute" ...spec.ts` ≥ 2 |
| M10 | `expectToastVisible` import + 사용 (toast-helpers SSOT) | `grep "expectToastVisible" ...spec.ts` ≥ 2 |
| M11 | `afterAll` 2건 이상 (기존 + EXT cleanup) | `grep "afterAll" ...spec.ts` ≥ 2 |
| M12 | `/api/checkouts/bulk-reject` 리터럴은 route glob 패턴용 — 허용; 도메인 코드 URL 하드코딩 없음 | route 패턴 외 하드코딩 없음 |
| M13 | 부분 실패 toast 어설션 패턴 (`건 반려 완료.*건 실패` 또는 유사) | `grep "건 반려 완료\|bulkRejectResult" ...spec.ts` ≥ 1 |

## SHOULD Criteria

| # | 기준 |
|---|------|
| S1 | Step 9에서 `testOperatorPage` + `techManagerPage` 두 fixture 병용 |
| S2 | Step 8-2: `expectToastVisible`로 "N건 반려" toast 검증 |
| S3 | tech-debt-tracker에서 `S8 bulk-reject e2e` 체크박스 완료 처리 |

## Out of Scope

- 5건 이상의 스트레스 테스트 (max 50 제한은 별도 테스트)
- 전체 실패(all failed) 케이스 — 별도 SHOULD 항목
- 기존 Step 1~7 수정 금지 (수술적 변경)
