# Exec Plan — PR-12 Checkout List IA (Dual-Count Header + CheckoutEmptyState)

**Date**: 2026-04-24
**Scope**: 반출 목록 IA 개선 — CheckoutEmptyState 3-variant 컴포넌트 + 이중 카운트 헤더 "반출 N건 · 장비 M대"
**Mode**: Mode 2 harness (Planner → Generator → Evaluator)
**Slug**: checkout-list-ia

---

## Goal

이미 구현된 서브탭/URL SSOT/statuses 복수 필터 기반 위에,
(a) 체크아웃 전용 `CheckoutEmptyState` 컴포넌트를 신규 도입하여 `in-progress` / `completed` / `filtered` 3 variant 공용화하고,
(b) `CheckoutListTabs`의 활성 탭 카운트를 "반출 N건 · 장비 M대" 이중 카운트로 확장한다.

## Non-Goals (out of scope)

- Backend `CheckoutSummary` 스키마 변경 — 장비 수는 클라이언트에서 `checkoutsData.data`로부터 파생.
- Overdue celebration 변형 (OutboundCheckoutsTab L352-358 `TODO(PR-8)`) — PR-12는 3 variant만. 해당 분기는 기존 `EmptyState` 유지.
- Backend `statuses` 필터 / `SUBTAB_STATUS_GROUPS` / `CheckoutListTabs` 키보드 내비게이션 — 이미 구현됨.
- `handleSubTabChange` / `emptyStateParams` 계산 로직 — `OutboundCheckoutsTab`에서 재활용.

## Patterns & Conventions Referenced

| Convention | Source | Usage |
|---|---|---|
| Design token 3-layer | `lib/design-tokens/components/checkout.ts` | `CHECKOUT_EMPTY_STATE_TOKENS` 위치·export 관례 |
| Barrel export | `lib/design-tokens/index.ts` (checkout section) | 신규 토큰 재export 위치 |
| EmptyState variant 계약 | `components/shared/EmptyState.tsx` | canAct, primaryAction.href, testId 패턴 재사용 |
| Checkout empty state icons SSOT | `CHECKOUT_ICON_MAP.emptyState` (checkout-icons.ts) | 로컬 아이콘 재정의 금지 — 이 맵에서만 소비 |
| Subtab SSOT | `SUBTAB_STATUS_GROUPS` (checkout-filter-utils.ts) | 상태 배열 리터럴 금지 |
| Dual-count i18n | `ko/checkouts.json` `list.count.checkouts`/`.equipment`/`.separator` | 이미 존재 — 추가 키 없음 |

## Architecture Decision

- **CheckoutEmptyState는 `EmptyState`의 wrapper가 아닌 checkout 도메인 전용 컴포넌트로 신규 작성**.
  이유: (1) variant 키가 다르다(`in-progress`/`completed`/`filtered` vs `no-data`/`filtered`/`celebration`),
  (2) icon을 prop이 아닌 `CHECKOUT_ICON_MAP.emptyState[variant]`에서 내부 해석하여 호출부의 아이콘 import/전달 부담 제거,
  (3) `data-testid="empty-state-{variant}"` 규칙을 variant와 자동 연동.
- **이중 카운트는 `CheckoutListTabs`의 활성 탭 count span 내부**에서 조합으로 표시한다.
  별도 헤더 영역을 신설하지 않는다 — 서브탭 라벨과 카운트가 이미 한 줄에 있으므로 정보 밀도 유지.
- **Equipment count는 클라이언트 파생** — `OutboundCheckoutsTab`에서 `checkoutsData.data`로부터
  `equipment?.length` 합산을 계산하여 `CheckoutListTabs`에 `currentEquipmentCount` prop으로 전달.
  백엔드 스키마 변경 없음.

---

## Phase 1: Design Tokens

### Deliverable 1.1: 신규 파일

**Path**: `apps/frontend/lib/design-tokens/components/checkout-empty-state.ts`

**What it achieves**:
- `CHECKOUT_EMPTY_STATE_TOKENS` — CheckoutEmptyState 전용 디자인 토큰을 export.
- variant 3종(`'in-progress' | 'completed' | 'filtered'`)에 대한 아이콘 색상, 컨테이너/타이틀/설명/액션 영역 클래스 제공.
- `type CheckoutEmptyStateVariant = 'in-progress' | 'completed' | 'filtered'` 타입 export.

**Constraints**:
- 하드코딩된 Tailwind hex/bg-[#xxx] 금지. `brand-*` 시멘틱만 사용.
- `CHECKOUT_ICON_MAP.emptyState` 키와 variant 키가 1:1 대응.
- `as const` assertion 필수.

### Deliverable 1.2: Barrel export 업데이트

**Path**: `apps/frontend/lib/design-tokens/index.ts`

**What it achieves**:
- Checkout section 내부에서 `CHECKOUT_EMPTY_STATE_TOKENS`와 `CheckoutEmptyStateVariant` 타입을
  `./components/checkout-empty-state`로부터 re-export.

**Constraints**:
- 기존 export 순서 유지 — 무관한 인접 export를 재정렬하지 않음(surgical).

---

## Phase 2: CheckoutEmptyState Component

### Deliverable 2.1: 신규 파일

**Path**: `apps/frontend/components/checkouts/CheckoutEmptyState.tsx`

**What it achieves**:
- `'use client'` 선언 클라이언트 컴포넌트.
- `CheckoutEmptyStateProps` 인터페이스:
  - `variant: CheckoutEmptyStateVariant` (필수) — 아이콘과 testid를 자동 결정.
  - `title: string`, `description: string` (필수).
  - `primaryAction?: { label: string; href?: string; onClick?: () => void }`.
  - `secondaryAction?: { label: string; onClick: () => void }`.
  - `canAct?: boolean` — false 시 primaryAction 숨김.
  - `className?: string`.
- **자동 resolution**:
  - 아이콘: `CHECKOUT_ICON_MAP.emptyState[variant]` 내부 조회 — 호출부는 아이콘을 전달하지 않음.
  - testid: `data-testid="empty-state-{variant}"` — variant 값 그대로 보간하여 자동 부여.
- **접근성**: 루트에 `role="status"`, `aria-live="polite"` 필수. 아이콘 `aria-hidden="true"`.
- **primaryAction 렌더링**: `href` 있으면 `<Link>` 기반 `<Button asChild>`, 없으면 `<Button onClick>`.

**Constraints**:
- `EmptyState` 컴포넌트를 재호출하지 않음(wrapper 금지) — 직접 JSX 작성.
- 아이콘을 prop으로 받지 않음 — variant로부터 내부 결정.
- `any` 타입 금지.
- `lucide-react` 직접 import 금지 — `CHECKOUT_ICON_MAP`만 경유.
- Tailwind hex 하드코딩 금지.

---

## Phase 3: Wire OutboundCheckoutsTab & CheckoutListTabs

### Deliverable 3.1: `CheckoutListTabs.tsx` 수정

**Path**: `apps/frontend/components/checkouts/CheckoutListTabs.tsx`

**What it achieves**:
- `CheckoutListTabsProps`에 `currentEquipmentCount?: number` 추가.
- 활성 탭(isActive && showCount)에서 **이중 카운트** 렌더:
  - `t('list.count.checkouts', { count: currentCount })` + `t('list.count.separator')` + `t('list.count.equipment', { count: currentEquipmentCount ?? 0 })`
  - `aria-label`도 두 카운트를 모두 포함.
- `currentEquipmentCount === undefined`인 경우 기존 단일 카운트 폴백.

**Constraints**:
- 카운트 배지 스타일은 기존 `CHECKOUT_TAB_BADGE_TOKENS` 재사용 — 신규 토큰 금지.
- 키보드 내비게이션·aria-selected·tabIndex 기존 로직 변경 금지(surgical).

### Deliverable 3.2: `OutboundCheckoutsTab.tsx` 수정

**Path**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`

**What it achieves**:
- `CheckoutEmptyState` import 추가.
- **Equipment count 파생**: `useMemo`로 `checkoutsData?.data`를 순회하여 총 장비 수 계산.
  ```ts
  const currentEquipmentCount = useMemo(
    () => checkoutsData?.data?.reduce((sum, c) => sum + (c.equipment?.length ?? 0), 0) ?? 0,
    [checkoutsData?.data]
  );
  ```
- `CheckoutListTabs` 호출부에 `currentEquipmentCount={currentEquipmentCount}` prop 추가.
- `emptyStateParams` 재구조화:
  - `overdue-clear` 분기(summary.overdue===0 + status===OVERDUE) → 기존 `EmptyState` + celebration 유지 (`TODO(PR-8)` 주석 보존).
  - `filterActive` → `CheckoutEmptyState variant="filtered"`.
  - `filters.subTab === 'completed'` → `CheckoutEmptyState variant="completed"`.
  - 기본(inProgress) → `CheckoutEmptyState variant="in-progress"` + primary "반출 신청".
- `icon` / `testId` 프로퍼티 제거(컴포넌트 내부 결정).

**Constraints**:
- 상태 리터럴 배열 추가 금지 — `SUBTAB_STATUS_GROUPS` SSOT 존재.
- overdue-clear 분기 기존 `EmptyState` 유지.
- "TODO(PR-8): i18n 키로 교체 예정" 주석 보존.

---

## Phase 4: i18n 검증 (변경 없음 예상)

**What it achieves**:
- `ko/checkouts.json` / `en/checkouts.json` 에 아래 키가 모두 존재하는지 확인:
  - `list.subtab.ariaLabel`, `list.subtab.inProgress`, `list.subtab.completed`
  - `list.count.checkouts`, `list.count.equipment`, `list.count.separator`
  - `emptyState.inProgress.{title,description,cta}`, `emptyState.completed.{title,description}`, `emptyState.filtered.{title,description,cta}`
- 누락 키 발견 시에만 추가.

---

## Data Flow

```
URL ?subTab=inProgress
  └▶ CheckoutsContent (client)
       └▶ parseCheckoutFiltersFromSearchParams → UICheckoutFilters (subTab='inProgress')
            └▶ convertFiltersToApiParams → CheckoutQuery (statuses='pending,approved,...')
                 └▶ checkoutApi.getCheckouts → PaginatedResponse<Checkout, CheckoutSummary>
                      └▶ OutboundCheckoutsTab:
                           ├─ currentEquipmentCount = Σ(data[*].equipment?.length)
                           ├─ CheckoutListTabs({ currentCount, currentEquipmentCount })
                           │   └─ 활성 탭 배지: "반출 5건 · 장비 8대"
                           └─ allGroups.length === 0:
                                ├─ overdue-clear → <EmptyState celebration/> (TODO-PR-8)
                                ├─ filterActive → <CheckoutEmptyState variant="filtered" />
                                ├─ subTab==='completed' → <CheckoutEmptyState variant="completed" />
                                └─ else → <CheckoutEmptyState variant="in-progress" />
```

---

## Build Sequence (Checklist)

- [ ] **Phase 1.1**: `checkout-empty-state.ts` 신규 작성
- [ ] **Phase 1.2**: `lib/design-tokens/index.ts` barrel export 추가
- [ ] **Phase 2**: `CheckoutEmptyState.tsx` 신규 작성
- [ ] **Phase 3.1**: `CheckoutListTabs.tsx` — `currentEquipmentCount` prop + 이중 카운트
- [ ] **Phase 3.2**: `OutboundCheckoutsTab.tsx` — `CheckoutEmptyState` 연결
- [ ] **Phase 4**: i18n 키 검증
- [ ] **Verification**: 아래 명령 전부 통과

---

## Verification Commands

```bash
# 1) Frontend tsc
pnpm --filter frontend run tsc --noEmit

# 2) Backend tsc (회귀 방지)
pnpm --filter backend run tsc --noEmit

# 3) Lint
pnpm --filter frontend run lint

# 4) SSOT 위반 — 리터럴 상태 배열 스캔
rg -n "\[\s*['\"]pending['\"]" apps/frontend/components/checkouts/CheckoutEmptyState.tsx apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx 2>/dev/null || echo "clean"

# 5) Lucide 직접 import 스캔 (CheckoutEmptyState만)
grep "from 'lucide-react'" apps/frontend/components/checkouts/CheckoutEmptyState.tsx 2>/dev/null || echo "clean"

# 6) data-testid 패턴 확인
grep -n "data-testid" apps/frontend/components/checkouts/CheckoutEmptyState.tsx

# 7) i18n 키 검증
node -e "
const ko=require('./apps/frontend/messages/ko/checkouts.json');
const en=require('./apps/frontend/messages/en/checkouts.json');
const keys=['list.count.checkouts','list.count.equipment','list.count.separator','list.subtab.ariaLabel','list.subtab.inProgress','list.subtab.completed','emptyState.inProgress.title','emptyState.completed.title','emptyState.filtered.title'];
const g=(o,p)=>p.split('.').reduce((a,b)=>a?.[b],o);
keys.forEach(k=>{if(!g(ko,k)||!g(en,k)){console.error('MISSING',k);process.exit(1);}});
console.log('i18n OK');
"

# 8) 빌드 smoke
pnpm --filter frontend run build
```
