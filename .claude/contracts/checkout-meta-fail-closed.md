---
slug: checkout-meta-fail-closed
type: contract
date: 2026-04-24
depends: [checkout-fsm-resolve-action]
sprint: 1
sprint_step: 1.3
---

# Contract: Sprint 1.3 — `meta.availableActions` fail-closed 전환 + 서버 populate 보증

## Context

V2 리뷰 F-2 (P0) 지적: 현재 `CheckoutGroupCard.tsx` L215, L243에서

```typescript
canApproveItem: checkout.meta?.availableActions?.canApprove ?? canApprove,
// ...
.some((co) => co.meta?.availableActions?.canApprove ?? canApprove),
```

서버 `meta.availableActions`가 undefined면 **클라이언트 role 기반 계산으로 fallback**. 서버가 권한상 금지한 액션을 UI가 켜는 경로 존재 — 보안 약점.

**전제**: Sprint 1.1 (`checkout-fsm-resolve-action.md`)의 M6~M10 완료 후 서버가 **모든 응답**에서 `meta.availableActions` + `meta.nextStep`을 populate. 이 상태에서 클라의 `??` fallback이 **불필요**해지며, `?? false`로 안전하게 전환 가능.

보안 결정 경로는 오직 서버. 클라의 role 계산(`canApprove`)은 로딩 전 **UX hint** 용도(optimistic)로만 유지.

---

## Scope

### 수정 대상
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - L215: `?? canApprove` → `?? false`
  - L243: `?? canApprove` → `?? false`
  - (선택) L407 `canApproveBulk` 계산부에서 `canApprove` role 변수는 UX hint 전용 주석 추가
- `apps/frontend/components/checkouts/CheckoutsContent.tsx` (전역 UX hint 경로가 있으면)
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — `can(Permission.APPROVE_CHECKOUT)` 경로는 **Sprint 1.4**(LegacyActionsBlock 제거)에서 처리. 본 contract에서는 fail-closed 흐름만 보강.
- `apps/frontend/lib/api/checkout-api.ts` — 응답 파싱 시 `meta` 필드 누락 감지 로깅 (`console.warn` dev only, Sentry breadcrumb prod).

### 신규 생성
- `apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts` — 서버가 `meta`를 비워 응답하는 상황을 `page.route()` mock으로 재현, 승인/반출 시작/반납 버튼 모두 렌더되지 않는지 검증. 4개 role × 3개 상태 교차 = 최소 12 시나리오.

### 수정 금지
- 백엔드 로직 (이미 Sprint 1.1에서 populate 보증).
- `PermissionsGuard`, `canPerformAction` 기존 구현.
- LegacyActionsBlock 및 `can(Permission.*)` 직접 호출 경로 (Sprint 1.4 소관).

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 통과 |
| M2 | `pnpm --filter frontend exec eslint <수정 파일들>` error 0 | lint |
| M3 | `CheckoutGroupCard.tsx`에서 `?? canApprove` 패턴 0건 | `grep -c "?? canApprove" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 |
| M4 | `?? false` 패턴 정확히 2건 신규 추가 (L215·L243 대체) | `grep -c "availableActions?.canApprove ?? false" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 2 |
| M5 | 다른 `canApprove*` 필드(`canReject`, `canCancel`, `canStart`, `canApproveReturn`, `canRejectReturn`)에도 동일하게 `?? role` 대신 `?? false` — 전수 정리 | `grep -nE "availableActions\?\.\w+\s*\?\?\s*\w+[^f]" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 hit (false 외 fallback 금지) |
| M6 | `canApprove` 변수(role 기반)는 file 상단에 **UX hint 전용 주석** 추가 — 승인/반려 결정에는 사용 금지 | `grep -B1 "const canApprove =" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` 결과에 "UX hint" 주석 포함 |
| M7 | `checkout-api.ts`에서 응답 파싱 시 `meta` 없으면 `if (process.env.NODE_ENV !== 'production') console.warn('[FSM drift] meta missing', id)` 로그 | grep로 확인 |
| M8 | 신규 E2E spec 파일 `tests/e2e/features/checkouts/fsm/fail-closed.spec.ts` 존재 + 최소 12 test case | `grep -c "test(" apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts` >= 12 |
| M9 | E2E에서 `page.route('**/checkouts**', route => route.fulfill({ json: {...meta: undefined} }))` 패턴 사용 | grep로 확인 |
| M10 | E2E 12 시나리오 모두 **승인/반출/반납 버튼 `toBeHidden()`** 검증 포함 | grep `toBeHidden` 수 >= 12 |
| M11 | E2E가 `apps/frontend/tests/e2e/fixtures/storageState.*.json` 역할별 로그인 재사용 (MEMORY.md E2E 패턴 준수) | grep `storageState:` 관련 fixture 사용 확인 |
| M12 | 변경 파일 = frontend 2~3 + e2e 1 = **최대 4개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 4 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `canApprove` role 변수 제거하고 `availableToCurrentUser`(descriptor)로 대체 검토 (본 contract 범위 아님) | `checkout-role-canapprove-removal` |
| S2 | Sentry breadcrumb로 `meta drift` 실시간 알림 + dashboard 계측 | `fsm-meta-drift-observability` |
| S3 | E2E fail-closed 시나리오 role 4종 × status 5종 = 20건으로 확장 | `fail-closed-e2e-matrix-expansion` |
| S4 | 백엔드 interceptor에서 응답 직전 `meta` 완전성 검증 — 누락 시 500보다 "safe fallback: empty meta" (현재는 Sprint 1.1 populate 보증으로 대체됨) | `fsm-response-interceptor-guard` |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/components/checkouts/CheckoutsContent.tsx \
  apps/frontend/lib/api/checkout-api.ts

# 2. MUST grep
grep -c "?? canApprove" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0

grep -c "availableActions?.canApprove ?? false" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 2 (L215, L243 대체)

grep -nE "availableActions\?\.\w+\s*\?\?\s*\w+[^f]" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0 hit (false 아닌 fallback 금지)

grep -rn "FSM drift\|meta missing" apps/frontend/lib/api/checkout-api.ts
# 기대: 1+ hit

test -f apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts && echo OK

# 3. E2E 실행
pnpm --filter frontend run test:e2e -- fail-closed
# 기대: 12+ cases, all pass

# 4. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 4
```

---

## E2E 시나리오 매트릭스 (최소 12)

| # | role | status | 기대 |
|---|------|--------|------|
| 1 | test_engineer | PENDING (own) | 승인 버튼 hidden |
| 2 | test_engineer | CHECKED_OUT | 반입 처리 버튼 hidden |
| 3 | lab_manager | PENDING | 승인 버튼 hidden (meta 누락) |
| 4 | lab_manager | BORROWER_APPROVED | 최종 승인 버튼 hidden |
| 5 | lab_manager | LENDER_CHECKED | 수령 확인 hidden |
| 6 | technical_manager | PENDING | 승인 버튼 hidden |
| 7 | technical_manager | BORROWER_RETURNED | 반입 승인 hidden |
| 8 | technical_manager | RETURN_APPROVED | (terminal — 버튼 hidden 기본) |
| 9 | admin | PENDING | 승인 버튼 hidden — admin도 fallback 금지 |
| 10 | admin | OVERDUE | 독촉 버튼 hidden |
| 11 | admin | REJECTED | (terminal — 버튼 hidden 기본) |
| 12 | test_engineer | PENDING (다른 유저 소유) | cancel 버튼 hidden |

각 테스트는 `page.route('**/checkouts/*', route => route.fulfill({ json: {...original, meta: undefined} }))` 인터셉트 후 페이지 리로드 → 버튼 `toBeHidden()` 검증.

---

## Acceptance

루프 완료 조건 = MUST 12개 모두 PASS + E2E 12 시나리오 통과.
F-2 보안 약점 해소: 서버 응답 누락 시 UI가 "안전 실패"로 떨어짐.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.1 · `checkout-fsm-resolve-action.md` — **선행 필수**. 서버 meta 항상 populate 보증 전제.
- Sprint 1.4 · `legacy-actions-block-removal.md` — 상세 페이지의 `can(Permission.*)` 직접 호출 (C-1 불일치)도 동일 원칙으로 제거.
- MEMORY.md 보안 fail-close 순서: scope → FSM → domain validation. 본 contract는 이 순서의 **scope 단계** (UI 렌더 권한)에 해당.
