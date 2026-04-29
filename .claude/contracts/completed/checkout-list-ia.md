# Contract — PR-12 Checkout List IA

**Subject**: CheckoutEmptyState 3-variant 컴포넌트 + `CheckoutListTabs` 이중 카운트 헤더
**Date**: 2026-04-24
**Evaluator mode**: MUST 전부 통과 → pass. MUST 단 1건 실패 → fail. SHOULD는 비블로킹 참고.

---

## MUST (hard failures — any single miss → fail)

### M1. TypeScript & Lint

- `pnpm --filter frontend run tsc --noEmit` exits 0.
- `pnpm --filter backend run tsc --noEmit` exits 0 (회귀 없음).
- `pnpm --filter frontend run lint` exits 0.
- 신규/수정 파일 모두에서 `any` 타입 0건 (암시/명시 모두).

### M2. CheckoutEmptyState 컴포넌트 존재 및 계약

- 파일 `apps/frontend/components/checkouts/CheckoutEmptyState.tsx` 존재.
- `'use client'` 지시어 포함.
- Props에 `variant: 'in-progress' | 'completed' | 'filtered'` 유니온 필수.
- 루트 엘리먼트에 `data-testid="empty-state-{variant}"` 가 렌더됨 — 3 variant 모두:
  - `[data-testid="empty-state-in-progress"]`
  - `[data-testid="empty-state-completed"]`
  - `[data-testid="empty-state-filtered"]`
- 아이콘은 **`CHECKOUT_ICON_MAP.emptyState[variant]`** 를 통해서만 결정 — 호출부에서 icon prop 받지 않음.
- 루트에 `role="status"` 와 `aria-live="polite"` 존재.
- `lucide-react`에서 Lucide 아이콘 직접 import 0건 (icon map만 경유).

### M3. Design Token — `CHECKOUT_EMPTY_STATE_TOKENS`

- 파일 `apps/frontend/lib/design-tokens/components/checkout-empty-state.ts` 존재.
- `CHECKOUT_EMPTY_STATE_TOKENS` 가 `as const`로 export.
- 토큰 내부에 하드코딩 hex(`#[0-9a-fA-F]`) 또는 `bg-[#...]` arbitrary value 0건.
- `lib/design-tokens/index.ts` 에서 `CHECKOUT_EMPTY_STATE_TOKENS` barrel re-export 존재.

### M4. OutboundCheckoutsTab 연결

- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` 에서 `CheckoutEmptyState` import + 아래 3 분기에서 사용:
  - `filterActive` → `variant="filtered"`
  - `filters.subTab === 'completed'` → `variant="completed"`
  - 기본(inProgress) → `variant="in-progress"`
- 위 3 분기 중 `@/components/shared/EmptyState` 사용 금지. (overdue-clear 분기 예외 허용.)
- 상태 리터럴 배열(`['pending','approved',...]`) 신규 추가 0건 — `SUBTAB_STATUS_GROUPS` 경유 필수.

### M5. CheckoutListTabs 이중 카운트

- `components/checkouts/CheckoutListTabs.tsx` Props에 `currentEquipmentCount?: number` 존재.
- 활성 탭(`isActive` + `showCount`) 배지 내부에서 **두 카운트 동시 렌더**:
  - `t('list.count.checkouts', { count: currentCount })` 호출
  - `t('list.count.equipment', { count: currentEquipmentCount ?? 0 })` 호출
  - 두 카운트 사이 구분자(`t('list.count.separator')` 또는 동등 리터럴) 삽입
- `aria-label`에 두 카운트 모두 포함.
- `OutboundCheckoutsTab`에서 `CheckoutListTabs` 호출 시 `currentEquipmentCount` prop 전달.

### M6. i18n 키 존재 (ko + en 양쪽)

`apps/frontend/messages/ko/checkouts.json` 와 `apps/frontend/messages/en/checkouts.json` 두 파일 모두에:

- `list.subtab.ariaLabel`, `list.subtab.inProgress`, `list.subtab.completed`
- `list.count.checkouts` (값에 `{count}` 변수 포함)
- `list.count.equipment` (값에 `{count}` 변수 포함)
- `list.count.separator`
- `emptyState.inProgress.title`, `emptyState.inProgress.description`, `emptyState.inProgress.cta`
- `emptyState.completed.title`, `emptyState.completed.description`
- `emptyState.filtered.title`, `emptyState.filtered.description`, `emptyState.filtered.cta`

### M7. SSOT 위반 0건

신규/수정 파일(`CheckoutEmptyState.tsx`, `OutboundCheckoutsTab.tsx`, `CheckoutListTabs.tsx`, `checkout-empty-state.ts`)에서:

- 역할 문자열 리터럴 (`'ADMIN'`/`'USER'` 등) 금지.
- `setQueryData` 호출 금지.
- Lucide 아이콘 직접 import (`from 'lucide-react'`) in `CheckoutEmptyState.tsx` 금지.
- Checkout status enum 문자열 5개 이상 리터럴 배열 금지 — SSOT 경유 필수.

---

## SHOULD (non-blocking)

### S1. Dual-count UX

- 활성 탭에 "반출 N건 · 장비 M대" 형식 렌더 (구분자 공백 포함 — "·" 아니라 " · ").

### S2. E2E 스폿 (수동 또는 자동)

- `?subTab=in-progress` + 빈 결과 → `[data-testid="empty-state-in-progress"]` 표시.
- `?subTab=completed` + 빈 결과 → `[data-testid="empty-state-completed"]` 표시.
- `?destination=NON_EXISTENT` → `[data-testid="empty-state-filtered"]` + "필터 초기화" 동작.

### S3. 접근성·회귀 스폿

- `CheckoutListTabs` 키보드 내비게이션(←/→)이 기존과 동일.
- `CheckoutEmptyState` `canAct === false`일 때 primaryAction 숨김.

### S4. Surgical 변경

- `EmptyState.tsx`(공용) 미수정.
- `SUBTAB_STATUS_GROUPS`, `CHECKOUT_ICON_MAP`, `convertFiltersToApiParams` 미수정.
- Backend 파일 미수정.

---

## Evaluator 실행 가이드

1. exec-plan의 Verification Commands 전체 실행.
2. M1~M7 각 항목을 커맨드 결과 및 파일 내용과 대조.
3. MUST 전부 통과 → `pass`. 1건이라도 미충족 → `fail` + 구체적 실패 항목 보고.
4. SHOULD는 참고 기록만 — 실패 판정 금지.
