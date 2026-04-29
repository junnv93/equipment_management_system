---
slug: checkout-ux-u03-filter-sticky-saved-views
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-03
---

# Contract: Sprint 4.5 · U-03 — 필터 Sticky 헤더 + Saved Views (시스템 기본 + 사용자 커스텀)

## Context

V2 §8 U-03: 사용자가 같은 필터 조합을 반복 입력. "내 차례" / "기한 초과" / "이번 주 반납"이 매번 수동.

- **Sticky 필터**: 필터 툴바가 스크롤해도 상단 고정. MEMORY.md `--sticky-header-height` CSS 변수 + ResizeObserver 패턴 재사용.
- **시스템 기본 뷰**: 3종 하드코딩이 아닌 **서버 집계** 기반 chip (서버 카운트: 내 차례 / 기한 초과 / 이번 주 반납).
- **사용자 커스텀 뷰**: URL + localStorage 하이브리드. 최대 5개, 드래그 정렬.
- **SSOT**: MEMORY.md "Filter SSOT: URL 파라미터가 유일한 진실의 소스" — 뷰 전환 시 URL만 변경, localStorage는 사용자 저장 리스트 뿐.

---

## Scope

### 신규 생성
- `apps/frontend/components/checkouts/FilterStickyBar.tsx` — `sticky top-[var(--sticky-header-height)]` 래퍼 + Saved Views chip toolbar.
- `apps/frontend/components/checkouts/SavedViewsToolbar.tsx` — 시스템 뷰 + 커스텀 뷰 chip 리스트, "+ 저장" 버튼.
- `apps/frontend/components/checkouts/SaveViewDialog.tsx` — 뷰 이름 입력 + 저장 / 덮어쓰기 / 삭제.
- `apps/frontend/hooks/use-saved-views.ts` — localStorage persistence + URL sync.
- `apps/frontend/lib/saved-views.ts` — `SavedView` 타입 + `SavedViewStore` interface (localStorage adapter).

### 수정 대상
- **Frontend**
  - `apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx` / `InboundCheckoutsTab.tsx` — `<FilterStickyBar>` 래핑.
  - `apps/frontend/lib/api/query-config.ts` — `queryKeys.checkouts.view.savedViewCounts()` 신설 (시스템 기본 뷰 3종 서버 집계).
  - `apps/frontend/hooks/use-checkout-filters.ts` (이미 있다면) — URL sync에 saved view id 지원.
- **Backend**
  - `apps/backend/src/modules/checkouts/checkouts.service.ts` — `getSavedViewCounts(userId, teamId)` method. 응답: `{ yourTurn: number; overdue: number; dueThisWeek: number }`.
  - `apps/backend/src/modules/checkouts/checkouts.controller.ts` — `GET /checkouts/saved-view-counts`.
- **i18n**
  - `ko.json`/`en.json`:
    - `checkouts.savedViews.system.yourTurn` / `overdue` / `dueThisWeek`
    - `checkouts.savedViews.save` / `delete` / `rename` / `overwrite` / `cancel`
    - `checkouts.savedViews.limitReached` ("최대 5개까지 저장 가능")
    - `checkouts.savedViews.dialog.title` / `description` / `namePlaceholder`
- **CSS**
  - `apps/frontend/app/globals.css` — `--sticky-header-height` 이미 존재한다면 재사용. ResizeObserver로 동적 계산하는 `use-sticky-header-height` 훅 존재 여부 확인 후 재사용.

### 수정 금지
- 필터 자체 로직 (URL 파라미터 포맷).
- `buildDetailCachePattern` SSOT (MEMORY.md).
- 페이지네이션.

---

## 참조 구현

```typescript
// apps/frontend/lib/saved-views.ts
export interface SavedView {
  id: string;          // UUID
  label: string;
  filters: Record<string, string>;
  sort: { field: string; direction: 'asc' | 'desc' };
  createdAt: string;
  updatedAt: string;
}

export interface SavedViewStore {
  list(): SavedView[];
  add(view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>): SavedView;
  update(id: string, patch: Partial<SavedView>): SavedView | null;
  remove(id: string): void;
  reorder(ids: string[]): void;
}

const STORAGE_KEY = 'equipment-mgmt.checkouts.savedViews';
const MAX_VIEWS = 5;

export function createLocalStorageViewStore(): SavedViewStore {
  // localStorage 기반 CRUD. QuotaExceededError 가드 + SSR safe (typeof window check).
}
```

```tsx
// apps/frontend/components/checkouts/FilterStickyBar.tsx
export function FilterStickyBar({ children }: PropsWithChildren) {
  return (
    <div
      className={cn(
        FILTER_STICKY_TOKENS.container,
        'sticky top-[var(--sticky-header-height)] z-10 bg-background'
      )}
    >
      <SavedViewsToolbar />
      <div className={FILTER_STICKY_TOKENS.filterRow}>{children}</div>
    </div>
  );
}
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `FilterStickyBar`가 `sticky top-[var(--sticky-header-height)]` 사용 (하드코딩 px 0) | grep |
| M3 | 시스템 뷰 3종은 `GET /checkouts/saved-view-counts`에서 집계 로드, FE 하드코딩 0 | grep + E2E |
| M4 | `queryKeys.checkouts.view.savedViewCounts()`가 stable key + CHECKOUT_SUMMARY preset (staleTime SHORT + refetchOnWindowFocus) | grep |
| M5 | 시스템 뷰 chip 클릭 → URL 쿼리 파라미터 변경만 (localStorage 쓰지 않음) | E2E |
| M6 | 사용자 커스텀 뷰는 **최대 5개** 하드 제한 — 5개 초과 저장 시 에러 i18n 토스트 | E2E |
| M7 | `SavedViewStore`가 localStorage `QuotaExceededError` 가드 (`try/catch` + fallback) | 코드 |
| M8 | SSR safe: `typeof window === 'undefined'` 체크 | 코드 |
| M9 | 뷰 전환 시 URL 쿼리 업데이트 + React Query `refetch` (Filter SSOT 원칙 준수) | E2E |
| M10 | 드래그 정렬 지원 (`@dnd-kit` 또는 HTML5 DnD). 키보드 조작도 가능 (`↑↓` 순서 변경) | a11y E2E |
| M11 | 저장 Dialog의 `role="dialog"` + focus trap + aria-label | axe |
| M12 | i18n 15+ 키 양 로케일 | `jq` |
| M13 | `PermissionsGuard`: `Permission.VIEW_CHECKOUTS` 요구 (count API) | grep |
| M14 | E2E: 시스템 뷰 3종 클릭 → 올바른 필터 적용 / 커스텀 뷰 저장/삭제/정렬 / 5개 초과 시 에러 토스트 | Playwright |
| M15 | `--sticky-header-height` CSS 변수 재사용 (새로 정의 0) | grep |
| M16 | 변경 파일 수 ≤ **12** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 팀 단위 공유 뷰 (admin이 팀 멤버에게 push) | `saved-views-team-share` |
| S2 | 서버 저장 뷰 (localStorage → DB 마이그레이션 옵션) | `saved-views-server-persist` |
| S3 | 뷰 export/import JSON | `saved-views-portable` |
| S4 | 뷰 최근 사용순 자동 정렬 (MRU) | `saved-views-mru-sort` |
| S5 | 시스템 뷰 count 0건이면 chip 자동 숨김 | `saved-view-zero-hide` |
| S6 | 뷰별 Analytics (어떤 뷰가 자주 쓰이는지) | `saved-views-analytics` |

---

## Verification Commands

```bash
# 1. 빌드
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/FilterStickyBar.tsx \
  apps/frontend/components/checkouts/SavedViewsToolbar.tsx \
  apps/frontend/hooks/use-saved-views.ts

# 2. sticky + CSS 변수
grep -n "var(--sticky-header-height)" apps/frontend/components/checkouts/FilterStickyBar.tsx
# 기대: 1+ hit (하드코딩 px 0)

grep -rn "top-\[[0-9]*px\]" apps/frontend/components/checkouts/FilterStickyBar.tsx
# 기대: 0 hit

# 3. API endpoint
grep -n "saved-view-counts\|getSavedViewCounts" apps/backend/src/modules/checkouts/
# 기대: controller + service

# 4. localStorage 한도
grep -n "MAX_VIEWS\|QuotaExceededError" apps/frontend/lib/saved-views.ts
# 기대: 2+ hit

# 5. i18n
jq '.checkouts.savedViews' apps/frontend/messages/ko.json apps/frontend/messages/en.json

# 6. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 12

# 7. E2E + axe
pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u03-saved-views
```

---

## Acceptance

루프 완료 조건 = MUST 16개 모두 PASS + E2E saved view 전체 흐름 통과 + axe 0 violation.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록.

---

## 연계 contracts

- Sprint 4.5 U-02 · `checkout-ux-u02-keyboard-shortcuts.md` — `F` 단축키로 필터 토글.
- Sprint 4.5 U-11 · `checkout-ux-u11-nav-your-turn-badge.md` — "내 차례" 배지와 동일 source 사용.
- Sprint 3.2 · `checkout-query-keys-view-resource-refactor.md` — `queryKeys.checkouts.view.savedViewCounts` 추가 지점.
- MEMORY.md `--sticky-header-height CSS 변수` — 재사용.
- MEMORY.md `Filter SSOT: URL 파라미터가 유일한 진실의 소스` — 원칙 준수.
