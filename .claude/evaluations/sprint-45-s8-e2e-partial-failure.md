---
slug: sprint-45-s8-e2e-partial-failure
evaluated: 2026-04-30
iteration: 2
verdict: PASS
---

# Evaluation: sprint-45-s8-e2e-partial-failure

## MUST Criteria

| # | 기준 | 결과 | 근거 |
|---|------|------|------|
| M1 | `pnpm tsc --noEmit` PASS (exit 0) | PASS | 루트 tsc exit 0, 출력 없음 |
| M2 | `pnpm --filter frontend exec tsc --noEmit` PASS | PASS | frontend tsc exit 0, 출력 없음 |
| M3 | `wf-ap02` spec에 `WF-AP02-EXT` describe 블록 존재 | PASS | grep-c=6 (line 348 `test.describe('WF-AP02-EXT: ...')` 포함) |
| M4 | EXT_EQUIPMENT_IDS 배열에 5개 장비 (TEST_EQUIPMENT_IDS 경유, 하드코딩 UUID 금지) | PASS | 5개 항목 모두 `TEST_EQUIPMENT_IDS.*` 경유. 원시 UUID 패턴 없음 |
| M5 | `EXT_EQUIPMENT_IDS` 참조 2건 이상 | PASS | grep-c=5 (선언 1 + beforeAll/afterAll/EXT-1/EXT-3 루프 4회) |
| M6 | Step EXT-2: 5건 체크박스 loop `i < 5` | PASS | grep-c=1 (line 399) |
| M7 | `.route(` 인터셉트 2건 이상 | PASS | grep-c=3 (Step 8 line 243, Step 9 line 305, EXT-3 line 449) |
| M8 | mock body `rejected` + `failed` 배열 모두 포함 (부분 실패용) | PASS | grep-c=1 — Step 9 line 311에서 `rejected`/`failed` 두 필드가 한 줄 인라인으로 합쳐짐: `body: JSON.stringify({ rejected: ids.slice(0, 1).map(...), failed: ids.slice(1).map(...) })` — `rejected.*failed` 패턴 매칭 확인 |
| M9 | `unroute` 정리 2건 이상 | PASS | grep-c=3 (line 278, 337, 494) |
| M10 | `expectToastVisible` import + 사용 2건 이상 | PASS | grep-c=5 (import 1 + Step 8/9/EXT-2/EXT-3 사용 4회) |
| M11 | `afterAll` 2건 이상 | PASS | grep-c=2 (WF-AP02 afterAll line 38, WF-AP02-EXT afterAll line 366) |
| M12 | `/api/checkouts/bulk-reject` 리터럴이 route glob 패턴용 외에 하드코딩 없음 | PASS | 6건 전부 `page.route(...)` 또는 `page.unroute(...)` 호출 내에 위치. 도메인 코드 URL 하드코딩 없음 |
| M13 | 부분 실패 toast 어설션 패턴 (`건 반려 완료` 또는 `bulkRejectResult`) | PASS | grep-c=4 (`건 반려 완료` 패턴: Step 9 line 335 comment + assertion, EXT-3 line 491 comment + 492 assertion) |

## SHOULD Criteria

| # | 기준 | 결과 | 비고 |
|---|------|------|------|
| S1 | Step 9에서 `testOperatorPage` + `techManagerPage` 두 fixture 병용 | FAIL | Step 9 (line 282)는 `techManagerPage: page` 단일 fixture만 사용. 두 fixture 병용은 EXT-3 (line 430)에서만 구현됨. Step 9의 `createCheckout(page, ...)` 호출이 techManager 세션을 사용하는 것은 도메인 의미상으로도 부정확 (반출 신청은 operator 권한 필요) |
| S2 | Step 8-2: `expectToastVisible`로 "N건 반려" toast 검증 | PASS | Step 8 line 276 — `expectToastVisible(page, /건이 반려되었습니다/, { timeout: 10000 })` 확인 |
| S3 | tech-debt-tracker에서 `S8 bulk-reject e2e` 체크박스 완료 처리 | PASS | tech-debt-tracker.md line 42: `- [x] **[2026-04-30 sprint-4.5 SHOULD] S8 bulk-reject e2e 테스트**` — `[x]` 완료 마킹 확인 |

## Issues Found

### FAIL Items

없음. M1–M13 전체 PASS.

### SHOULD Failures (후속 처리)

**S1 — Step 9의 `testOperatorPage` fixture 누락**

계약 기준: Step 9에서 `testOperatorPage` + `techManagerPage` 두 fixture를 병용해야 한다.
현재 Step 9 (line 282)는 `{ techManagerPage: page }` 단일 fixture만 구조 분해하며,
`createCheckout(page, ...)` 호출에 techManager 세션을 사용한다.
반출 신청(`createCheckout`)은 operator 권한이 필요하므로 도메인 정확성 측면에서도 결함이다.
두 fixture 병용은 EXT-3 (line 430: `{ testOperatorPage, techManagerPage }`)에서만 달성됨.
후속 sprint에서 Step 9 fixture를 EXT-3 패턴으로 수정하거나, 계약 S1 기준을 "EXT-3에서 달성"으로 재정의 권장.

## Summary

이전 iteration 1에서 FAIL이었던 M8은 Step 9 line 311에서 `rejected`/`failed` 두 필드를 한 줄 인라인으로 통합하여 `rejected.*failed` grep 패턴이 정상 매칭(grep-c=1)됨으로써 해소되었다. M1–M13 전체 PASS, tsc clean. SHOULD 3건 중 S1(Step 9 단일 fixture)만 미충족이나 MUST에 해당하지 않아 전체 verdict는 PASS.
