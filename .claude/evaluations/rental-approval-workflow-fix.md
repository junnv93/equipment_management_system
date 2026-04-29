---
slug: rental-approval-workflow-fix
iteration: 2
date: 2026-04-29
overall_verdict: PASS
---

# Evaluation: rental-approval-workflow-fix

## Summary

- Files changed: 16 (FSM SSOT 1 + BE 2 + FE 7 + i18n 4 + skills 1 + frontend-types 1)
- Lines: +353 / -45 (핵심 도메인 파일 기준)
- MUST passed: 14/14
- SHOULD tracked: 4건

---

## MUST results

| ID | Title | Verdict | Evidence |
|----|-------|---------|----------|
| must-1 | tsc BE+FE pass | PASS | `pnpm --filter backend exec tsc --noEmit` → 출력 없음(0건). `pnpm --filter frontend exec tsc --noEmit` → 출력 없음(0건). |
| must-2 | schemas FSM unit + table tests pass | PASS | 7 suites, 695 tests all PASS. `checkout-fsm.table.test.ts` + `checkout-fsm.exhaustive.test.ts` 포함. |
| must-3 | backend checkouts module tests pass | PASS | 5 suites, 72 tests all PASS. `checkouts.service.spec.ts` / `handover-token.service.spec.ts` 등. |
| must-4 | backend approvals module tests pass | PASS | 1 suite, 5 tests all PASS. |
| must-5 | backend lint pass | PASS | `pnpm --filter backend run lint` → 오류 없음. |
| must-6 | frontend lint pass | **PASS** | `pnpm --filter frontend run lint` → 출력 없음 (0건). `tsconfig.tsbuildinfo` 삭제 + 미사용 변수 수정으로 ESLint 오류 해소. |
| must-7 | i18n parity ko/en 100% | PASS | `node scripts/check-i18n-call-sites.mjs --all` → "837개 파일 / 20개 ns 검사 — 누락 0건". |
| must-8 | 4 dev-log symptoms 회귀 테스트 PASS | **PASS** | (a) `describe('approve')` 내 신규 케이스 — `rentalPendingCheckout(purpose:'rental', status:'pending')` + `mockReqLender(teamId:'aabb1234-...')` → `service.approve()` → `BadRequestException` 기대. 40/40 PASS. lender scope 통과 후 FSM `assertFsmAction` INVALID_TRANSITION 실경로 검증됨. (b) 기존 PASS 유지. (c) `describe('findAll meta injection')` 2케이스 — userPermissions 제공 시 `meta.availableActions`, `meta.nextStep`, `canBorrowerApprove`, `canBorrowerReject` 존재 assert; undefined 시 `meta` 자체 undefined assert. 40/40 PASS. post-cache injection 실경로 검증됨. (d) 기존 PASS 유지. 4케이스 전체 커버. |
| must-9 | verify-checkout-fsm Step 42+43 | PASS | Step 42: `CheckoutActorContext` + `TRANSITION_ACTOR_SIDE` FSM SSOT 정의 확인. `canPerformAction`/`getNextStep` 옵셔널 actorCtx 시그니처. `calculateAvailableActions` actorCtx 단일 helper 도출 — 인라인 lenderTeamOk 0건. `canBorrowerApprove`/`canBorrowerReject` BE/FE 동기. `fsm.blocked.actor_team` ko/en parity 확인. Step 43: findAll 컨트롤러 `req.user?.permissions ?? []` + `req.user?.teamId` forward. post-cache meta 주입 패턴. requesterTeamId join 보존. |
| must-10 | verify-ssot — role 리터럴 0 | PASS | `grep 'technical_manager\|test_engineer'` in FE checkouts/ + approvals-api.ts → 분기 조건으로 사용된 케이스 0건. `CheckoutGroupCard.tsx:108`의 `?? 'test_engineer'` fallback은 `useCheckoutGroupDescriptors(role)` 타입 기본값으로 role 분기가 아님. FSM transition 재구현 0건. |
| must-11 | SECURITY — backend FSM/scope guards 강도 유지 | PASS | `enforceScopeForBorrower` 2건, `enforceScopeFromCheckout` 9건 — 시그니처/로직 변경 없음. `assertFsmAction` approve/borrowerApprove/borrowerReject/reject/start/return/approveReturn/rejectReturn/cancel — 9개 endpoint 모두 보존. fail-close 순서(scope → FSM → domain) 일관. |
| must-12 | verify-cas — CAS coherence 보존 | PASS | approve/borrowerApprove/reject 모두 `updateCheckoutStatus` → `updateWithVersion` 체인 경유. `onError` rollback의 `setQueryData` 패턴은 optimistic update 스냅샷 복원 — `onSuccess` setQueryData 0건. detail 캐시 invalidate: `queryClient.removeQueries(queryKeys.checkouts.resource.detail(id))` onError CAS 409 분기에서 2곳 확인. |
| must-13 | verify-i18n — error.actionLabel parity | PASS | `check-i18n-call-sites.mjs --all` 누락 0건. `UNKNOWN_ERROR.actionLabel` ko/en 양쪽 존재. `fsm.blocked.actor_team` ko/en 양쪽 존재. `fsm.hint.pendingBorrowerWait` ko/en 양쪽 존재. `equipment-errors.ts:336` `ERROR_MESSAGES[UNKNOWN_ERROR].actionLabel: '다시 시도'` 확인. |
| must-14 | review-architecture — Critical 0건 | PASS | DB→Service→Controller→DTO→Hook→Component→Cache 7-layer 트레이스 Critical 0건. Warning 2건(G9 미수정, findAll meta 조건부 분기), Info 1건(useCheckoutGroupDescriptors actorCtx 미전달) — SHOULD로 추적. |

---

## SHOULD results (track only)

- **SHOULD-1**: WCAG 2.4.6 — `actor_team` blocked 버튼 `aria-label` + SR 텍스트 구현 미확인 (`NextStepPanel.tsx` `blockingReason='actor_team'` 분기 UI 접근성 검증 필요).
- **SHOULD-2**: G9 미수정 — `getPendingChecks` `borrowerStatuses`에 `CSVal.PENDING` 미포함 (`checkouts.service.ts:856-857`). 수원랩 TM이 rental 신청 수신 시 pending-checks 페이지/nav 배지에 표시 안 됨. tech-debt-tracker 등록 권고.
- **SHOULD-3**: `findAll` `userPermissions?` 옵셔널 + `if (userPermissions)` 조건부 분기 — 컨트롤러 경유 시 항상 `[]`가 전달되어 실질적 영향 없으나, 내부 직접 호출 시 meta 누락 가능 경로 존재 (`checkouts.service.ts:633,799`).
- **SHOULD-4**: `useCheckoutGroupDescriptors` actorCtx 미전달 (`hooks/use-checkout-group-descriptors.ts:38-44`) — `yourTurnCount` 집계가 lender/borrower 구분 없이 permission 기준만 사용. 실제 mutation은 server meta 기반이므로 잘못된 API call 방지는 됨. 단 `yourTurnCount` 뱃지가 lender TM에 과도하게 높게 표시될 수 있음.

---

## Critical issues (if any)

없음 — Critical 이슈 0건.

---

---

## Iteration changes (vs iteration 1)

### MUST-6: FAIL → PASS
- `apps/frontend/tsconfig.tsbuildinfo` 삭제 (stale cache가 rename된 파일 `use-cas-guarded-mutation.ts → .tsx` 참조하여 ESLint 오류 야기)
- `apps/frontend/scripts/generate-loading.ts:90-93` `isRedirectOnly` 미사용 변수 블록 제거
- `pnpm --filter frontend run lint` 출력 없음 (exit 0) 확인

### MUST-8(a): FAIL → PASS
- `describe('approve')` 블록에 신규 케이스 추가 (lines 485-529):
  - `rentalPendingCheckout`: `{purpose:'rental', status:'pending', lenderTeamId:'aabb1234-...'}`
  - `mockReqLender`: `{teamId:'aabb1234-...'}` — lender 팀 소속 TM (scope 통과 가능)
  - `service.approve()` 호출 → `BadRequestException` 기대
  - 실경로: scope(`enforceScopeFromCheckout`) 통과 → FSM `assertFsmAction` INVALID_TRANSITION → 400
  - 40/40 PASS 확인, 거짓 양성 없음

### MUST-8(c): FAIL → PASS
- `describe('findAll meta injection')` 신규 describe 블록 추가 (lines 165-222):
  - 케이스 1: `userPermissions` + `teamId` 제공 → `meta.availableActions`, `meta.nextStep`, `canBorrowerApprove`, `canBorrowerReject` 존재 assert
  - 케이스 2: `userPermissions` undefined → `meta` 자체 undefined assert (backward compat)
  - `mockCacheService.getOrSet` → meta 없는 rawItem 반환 → 서비스가 post-cache injection하지 않으면 테스트 실패 구조 (거짓 양성 없음)
  - 40/40 PASS 확인

### 회귀 없음 확인
- `checkouts|approvals` 전체 6 suites, 80 tests PASS (이전 72 + 신규 8)
- BE tsc: 출력 없음 (0건)
- FE tsc: 출력 없음 (0건)
- schemas tests: 7 suites, 695 tests PASS
- i18n parity: 842개 파일 / 20개 ns 누락 0건

---

## Iteration changes (vs iteration 0)

iteration 1 — 초회 평가.
