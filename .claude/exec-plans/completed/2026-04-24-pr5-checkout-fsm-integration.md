# PR-5: CheckoutGroupCard + CheckoutDetailClient FSM 통합 + Feature Flag

## Slug: pr5-checkout-fsm-integration
## Date: 2026-04-24
## Mode: Mode 2 (Full — Component FSM integration + Feature Flag gating)

## Depends on
- PR-1 FSM schemas (`packages/schemas/src/fsm/checkout-fsm.ts`) — done
- PR-3 design tokens (`ELEVATION_TOKENS`, `TYPOGRAPHY_TOKENS`, `SPACING_RHYTHM_TOKENS`, `CHECKOUT_ROW_TOKENS`, `NEXT_STEP_PANEL_TOKENS`) — done
- PR-4 `components/shared/NextStepPanel.tsx` (variants: floating/inline/compact) + `useCheckoutNextStep` — done

---

## 변경 파일 목록
- [ ] `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — RentalFlowInline 헬퍼 보존, 공용 `<NextStepPanel variant="compact">` 삽입, Feature Flag 분기
- [ ] `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — renderActions(L338-L515) → `LegacyActionsBlock` 추출, 공용 `<NextStepPanel variant="floating">` + onActionClick 와이어, Feature Flag 분기, import를 shared로 교체

확인만 (변경 없음):
- `apps/frontend/lib/features/checkout-flags.ts` — `isNextStepPanelEnabled()` 이미 존재
- `apps/frontend/.env.local` — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 이미 존재
- `apps/frontend/.env.example` — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 이미 존재

> Note: 스펙 초안에는 `.env.local.example`이 명시되어 있으나 레포에는 `.env.example`만 존재. 실존 파일 기준으로 진행. env 키는 양쪽 파일에 이미 존재하므로 이번 PR에서 실제 편집 없음.

---

## 현재 코드 구조 (Planner 분석 결과)

### CheckoutGroupCard.tsx
- **L60-129 `RentalFlowInline`**: `CheckoutStatus`만 받아 현재 단계 "칩 + tooltip" 렌더. 5단계 고정, i18n키 `checkouts.rentalFlow.*`에 의존. 렌탈 그룹 한정. 터미널(rejected/canceled)에서는 `null`.
- **L366 사용처**: `{isRentalGroup && rentalStatus && <RentalFlowInline status={rentalStatus} />}` — 그룹 헤더 내부 인라인 표시.
- **L47 import**: `RENTAL_FLOW_INLINE_TOKENS` — Feature Flag off 경로에서 계속 사용되므로 유지.
- **L185-218 equipmentRows**: 이미 `descriptor: NextStepDescriptor | undefined`를 feature flag on일 때 계산해 row에 부착. `CheckoutMiniProgress`가 소비 중.
- **공용 NextStepPanel 미도입 상태**.

### CheckoutDetailClient.tsx
- **L66 legacy import**: `import { NextStepPanel } from '@/components/checkouts/NextStepPanel';` — `@/components/shared/NextStepPanel`으로 교체 대상.
- **L338-L515 `renderActions`**: 역할/상태 기반 `buttons: React.ReactNode[]` 반환. 7개 분기(pending approve/reject, cancel, approved start, checked_out return, rental condition check, handover QR, rental lender_received return, returned approve/reject, export form). 아무 div로도 감싸지지 않고 L535에서 `{renderActions()}`로 호출.
- **L113-117 nextStepDescriptor**: 이미 `useCheckoutNextStep` 훅으로 계산됨. 입력은 status/purpose/dueAt. 서버 nextStep 주입은 없음 — client-side getNextStep fallback만 사용.
- **L547-549 legacy panel render**: `{isNextStepPanelEnabled() && <NextStepPanel descriptor={...} checkoutId={...} />}` — shared variant(`variant="floating"`, `onActionClick`)로 교체 대상.

### 두 NextStepPanel의 차이
| 파일 | variant prop | onActionClick | isPending | 토큰 |
|------|------------|--------------|-----------|------|
| `components/checkouts/NextStepPanel.tsx` | 없음 | 없음 (`checkoutId` 기반) | 없음 | `WORKFLOW_PANEL_TOKENS` |
| `components/shared/NextStepPanel.tsx` | `'floating' \| 'inline' \| 'compact'` | `(action: CheckoutAction) => void` | `boolean` | `NEXT_STEP_PANEL_TOKENS` |

PR-5는 **shared** 버전을 사용해야 함.

---

## Phase 1: Feature Flag 인프라 확인 (No-op)

### 목표
PR-4에서 이미 생성된 `isNextStepPanelEnabled()` 및 env 키가 기대대로 존재함을 확인. 신규 코드 추가 없음.

### 확인 사항
- [ ] `apps/frontend/lib/features/checkout-flags.ts` — `isNextStepPanelEnabled(): boolean` export 존재 (확인됨).
- [ ] `apps/frontend/.env.local` — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 키 존재 (확인됨).
- [ ] `apps/frontend/.env.example` — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 키 존재 (확인됨).

### 완료 조건
```bash
grep -l "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" \
  apps/frontend/.env.local \
  apps/frontend/.env.example \
  apps/frontend/lib/features/checkout-flags.ts
# 기대: 3 hits (파일명 3개 출력)
```

---

## Phase 2: CheckoutGroupCard 통합 — RentalFlowInline 분기 + compact NextStepPanel

### 목표
5개 원 + 칩 패턴의 `RentalFlowInline` 헬퍼를 FSM 기반 `<NextStepPanel variant="compact">` 렌더로 대체한다. Feature flag off일 때 기존 `RentalFlowInline` 동작을 유지(행위 불변).

### 달성 요구사항 (무엇을)
1. `RentalFlowInline` 헬퍼의 **내부 구현은 유지**하되, 렌탈 헤더 인라인 위치(L366)에서의 호출을 Feature Flag로 분기한다.
   - ON: `<NextStepPanel variant="compact" descriptor={rentalDescriptor} />` — 렌탈 그룹의 대표 checkout에서 계산한 descriptor 1개를 헤더에 인라인 표시.
   - OFF: `<RentalFlowInline status={rentalStatus} />` — 기존 동작.
2. 렌탈 헤더용 `rentalDescriptor`는 컴포넌트 최상단에서 훅으로 계산 — 입력은 `group.checkouts.find(co => co.purpose === CPVal.RENTAL)` 한 건의 status/purpose/dueAt.
3. 렌탈 그룹이 아니거나 `rentalStatus`가 비었을 때는 Feature Flag와 무관하게 아무것도 렌더하지 않음.
4. `NextStepPanel`의 `onActionClick`은 **이번 PR에서 연결하지 않음** — GroupCard는 단순 안내/헤더 표시. (SHOULD S4로 추적)
5. `isPending` prop 역시 미전달(optional). 최소 코드 원칙 준수.

### 수술적 변경 위치
- **import 블록**: `import { NextStepPanel } from '@/components/shared/NextStepPanel';` 추가.
- **L366 렌탈 헤더 렌더**: Feature Flag 분기 추가.
  ```tsx
  {isRentalGroup && rentalStatus && (
    isNextStepPanelEnabled()
      ? <NextStepPanel variant="compact" descriptor={rentalDescriptor} />
      : <RentalFlowInline status={rentalStatus} />
  )}
  ```
- **`rentalDescriptor` 계산**: 렌탈 대표 checkout으로 `useCheckoutNextStep` 호출 (컴포넌트 최상단).
- **`equipmentRows` useMemo**: 변경 없음.

### 완료 조건
```bash
grep -n "import { NextStepPanel }" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: @/components/shared/NextStepPanel 1 hit

grep -n 'variant="compact"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1 hit

grep -n "function RentalFlowInline" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1 hit (보존 확인)
```

---

## Phase 3: CheckoutDetailClient 통합 — renderActions 추출 + floating NextStepPanel + onActionClick 와이어

### 목표
L338-L515 `renderActions` 본체를 **`LegacyActionsBlock` 로컬 컴포넌트**로 추출하고, Feature Flag ON일 때는 `<NextStepPanel variant="floating" onActionClick={handleNextStepAction} isPending={...} />`가 주 액션 UI, OFF일 때는 `<LegacyActionsBlock>`이 액션 UI가 되도록 분기한다.

### 달성 요구사항 (무엇을)
1. **추출**: `renderActions` 함수 본문(L338-L515) → 동일 파일 내 로컬 컴포넌트 `function LegacyActionsBlock({ checkout, ...handlers })`. 내부 로직 1:1 이식, 어떤 분기/상수도 변경 금지(최소 코드 원칙).

2. **Export form 버튼**(L501-L512 영역) 분리: Feature Flag와 무관하게 항상 렌더되는 별도 JSX 블록. (FSM 범위 밖 기능)

3. **렌더 분기** (L535 `{renderActions()}` 위치 교체):
   ```tsx
   {isNextStepPanelEnabled() ? null : <LegacyActionsBlock ... />}
   {isCheckoutExportable(checkout.status) && <ExportFormButton ... />}
   ```

4. **floating NextStepPanel** (L547-549 교체):
   ```tsx
   {isNextStepPanelEnabled() && (
     <NextStepPanel
       variant="floating"
       descriptor={nextStepDescriptor}
       onActionClick={handleNextStepAction}
       isPending={isAnyNextStepMutationPending}
     />
   )}
   ```

5. **`handleNextStepAction(action: CheckoutAction)` 디스패처 신설**: action → mutation/dialog/router 매핑 switch.

6. **import 교체**: `@/components/checkouts/NextStepPanel` → `@/components/shared/NextStepPanel`.

### Action → Handler 매핑 (FSM CheckoutAction 전수)

| Action | Handler |
|--------|---------|
| `approve` | `approveMutation.mutate()` |
| `reject` | `setDialogState({reject: true})` |
| `cancel` | `setDialogState({cancel: true})` |
| `start` | `setDialogState({start: true})` |
| `lender_check` | `router.push(\`/checkouts/${id}/check\`)` |
| `borrower_receive` | `router.push(\`/checkouts/${id}/check\`)` |
| `mark_in_use` | `router.push(\`/checkouts/${id}/check\`)` |
| `borrower_return` | `router.push(\`/checkouts/${id}/check\`)` |
| `lender_receive` | `router.push(\`/checkouts/${id}/check\`)` |
| `submit_return` | `router.push(\`/checkouts/${id}/return\`)` |
| `approve_return` | `setDialogState({approveReturn: true})` |
| `reject_return` | `setDialogState({rejectReturn: true})` |
| `borrower_approve` | no-op (SHOULD S1 — 백엔드 미배선) |
| `borrower_reject` | no-op (SHOULD S1) |

### 금지사항
- `renderActions` 본체의 조건식·버튼 순서·disabled 로직 수정 금지.
- `status === '...'` 직접 비교 신규 추가 금지 (FSM이 floating 패널 전담).
- `setQueryData` 신규 사용 금지.
- `components/checkouts/NextStepPanel.tsx` 수정 금지.

### 완료 조건
```bash
grep -n "function LegacyActionsBlock" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 1 hit

grep -nE "function renderActions|const renderActions" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 0 hit

grep -n "@/components/checkouts/NextStepPanel" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 0 hit

grep -n "@/components/shared/NextStepPanel" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 1 hit

grep -n 'variant="floating"' apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 1 hit

grep -n "handleNextStepAction" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: >= 2 hit (선언 + onActionClick 전달)
```

---

## Phase 4: 유효성 검증

```bash
# TypeScript 컴파일
pnpm --filter frontend exec tsc --noEmit

# ESLint
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'

# Feature Flag 양방향 검증
# a) NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false → RentalFlowInline 칩 + LegacyActionsBlock 버튼 (legacy)
# b) NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true  → compact NextStepPanel + floating NextStepPanel (neo)

# 변경 파일 수 확인 (2개만)
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 2
```

---

## Risk / Rollback

| 리스크 | 완화 |
|--------|------|
| floating 패널 action 클릭 → dialog/mutation 디스패치 미스매치 | `handleNextStepAction` switch 테이블을 위 매핑 테이블과 교차검증 |
| RentalFlowInline 헬퍼 삭제로 i18n 키 참조 잔존 | 헬퍼를 **삭제하지 않고 보존** (off 경로 폴백) |
| shared NextStepPanel이 i18n `checkouts.fsm.*` 키를 요구 | PR-4에서 이미 정합화됨 |
| LegacyActionsBlock 추출로 closure over mutation 참조 변경 | props로 모든 mutation/setter/handler/t를 명시 전달 |

### Rollback
1. `.env.local`에서 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` → 즉시 legacy UI 복원.
2. PR-5 revert 시 파일 2개만 되돌리므로 충돌 최소화.

---

## Out of Scope
- 서버 응답 `nextStep` 필드 제공 (backend PR).
- `components/checkouts/NextStepPanel.tsx` 레거시 파일 삭제.
- i18n `checkouts.rentalFlow.*` 키 정리.
- `borrower_approve`/`borrower_reject` 백엔드 엔드포인트 배선 (PR-6+ 범위).
- export form 버튼 FSM 편입 (의도적 제외).
