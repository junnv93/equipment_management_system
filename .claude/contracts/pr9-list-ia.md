---
slug: pr9-list-ia
created: 2026-04-24
mode: 1
domain: checkouts / e2e
---

# Contract: PR-9 suite-list-ia E2E (S9~S11)

## Context

PR-9 S1~S8은 `suite-next-step/s-next-step.spec.ts` (185줄)로 구현 완료.
S9~S11은 `suite-list-ia/` 디렉토리 신규 작성 필요.

### 전제 조건 (Generator가 반드시 수행할 컴포넌트 수정)

1. **EmptyState.tsx** — `testId?: string` prop 추가, root div에 `data-testid={testId}` 바인딩
2. **OutboundCheckoutsTab.tsx** — EmptyState에 testId 전달:
   - `filterActive` → `testId="empty-state-filtered"`
   - `filters.subTab === 'completed'` → `testId="empty-state-completed"`
   - 기본(inProgress) → `testId="empty-state-in-progress"`
3. **CheckoutGroupCard.tsx** — `isNextStepPanelEnabled() && row.descriptor?.availableToCurrentUser === true` 시
   `<span data-testid="your-turn-badge">` 배지 추가 (i18n: `checkouts:actor.yourTurn` 또는 하드코딩 "내 차례")

## MUST Criteria

### M1: tsc 0 errors
`pnpm --filter frontend exec tsc --noEmit` → 0 errors

### M2: 3 spec files 존재
- `apps/frontend/tests/e2e/features/checkouts/suite-list-ia/s-subtab.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-list-ia/s-your-turn.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-list-ia/s-empty-states.spec.ts`

### M3: S9 subtab 커버리지
- role="tablist" + aria-selected 검증
- 기본 진입: URL에 ?subTab 없음 (inProgress가 기본값이므로 URL에서 생략됨)
- "완료" 탭 클릭 후: URL에 ?subTab=completed 포함
- ←/→ 키보드 전환 동작 검증

### M4: S10 YourTurnBadge 커버리지
- feature flag beforeAll 감지 패턴 적용 (suite-next-step 참조)
- technical_manager: APPROVED 반출 row에 `data-testid="your-turn-badge"` 존재
- test_engineer: 동일 row에 badge 미존재

### M5: S11 EmptyState 커버리지
- 필터 적용 후 결과 없음: `data-testid="empty-state-filtered"` 노출
- completed 탭 빈 상태: `data-testid="empty-state-completed"` 노출
- inProgress 탭 빈 상태: `data-testid="empty-state-in-progress"` 노출

### M6: data-testid 실존
S10/S11 spec에서 참조하는 모든 data-testid 속성이 실제 컴포넌트 코드에 존재해야 함
(grep으로 검증)

## SHOULD Criteria

### S1: suite-list-ia dry-run
`pnpm --filter frontend run test:e2e -- suite-list-ia` → 0 failures
(dev server 미실행 시 SKIP 허용, 사유 명시)

### S2: fixture 패턴 준수
- `tests/e2e/shared/fixtures/auth.fixture.ts` storageState 인증 사용
- `tests/e2e/shared/constants/test-checkout-ids.ts` 상수 사용 (ID 하드코딩 금지)

### S3: serial 모드
suite-next-step과 동일하게 `test.describe.configure({ mode: 'serial' })` 적용

## Out of Scope

- suite-next-step S1~S8 수정
- backend 코드 변경
- 새로운 API 엔드포인트 추가
- UI 디자인 변경 (data-testid 추가 및 배지 최소 구현만)
