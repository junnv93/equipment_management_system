---
slug: checkout-ux-u11-nav-your-turn-badge
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-11
---

# Contract: Sprint 4.5 · U-11 — 전역 nav "내 차례 N" 배지 + SSE 옵션 실시간

## Context

V2 §8 U-11: 승인자가 반출 메뉴를 들여다봐야 N건 대기 여부 확인. nav에 상시 배지 표시.

- **기존 자산**: `queryKeys.checkouts.resource.pendingCount()` (Sprint 3.2 재편 후). 이미 `CHECKOUT_SUMMARY` preset(staleTime SHORT + refetchOnWindowFocus, MEMORY.md P-5 OK).
- **SSE**: MEMORY.md `REFETCH_STRATEGIES CRITICAL 30s` — 선택적 실시간 채널. 본 contract에서는 **옵션** (MUST 아님, SHOULD).
- **링크**: 클릭 시 `/checkouts?view=yourTurn` — Sprint 4.5 U-03 saved view 경유.
- **숨김 규칙**: 0건이면 숨김, 10+는 "9+".
- **a11y**: `aria-label="내 차례 반출 N건 대기 중"`.

---

## Scope

### 수정 대상
- `apps/frontend/components/layout/SidebarNav.tsx` (또는 navigation 컴포넌트 실제 경로) — "반출입" 메뉴 항목에 `<NavBadge count={n} />` 추가.
- `apps/frontend/components/shared/NavBadge.tsx` (신규) — 재사용 가능한 nav 배지 컴포넌트.
- `apps/frontend/hooks/use-checkouts-your-turn-count.ts` (신규) — `queryKeys.checkouts.resource.pendingCount()` wrap.
- **i18n**
  - `ko.json`/`en.json`:
    - `nav.checkouts.yourTurnBadge.aria` ("내 차례 반출 {count}건 대기 중" / "{count} checkouts awaiting your action")
    - `nav.checkouts.yourTurnBadge.overflow` ("9+")

### 수정 금지
- `pendingCount` API 본체.
- Sidebar 구조 전면 재작성.

### 신규 생성
- `NavBadge.tsx`
- `use-checkouts-your-turn-count.ts`

---

## 참조 구현

```tsx
// NavBadge.tsx
interface NavBadgeProps {
  count: number;
  max?: number; // default 9
  ariaLabel: string;
  className?: string;
}

export function NavBadge({ count, max = 9, ariaLabel, className }: NavBadgeProps) {
  if (count === 0) return null;
  const display = count > max ? `${max}+` : String(count);
  return (
    <span
      aria-label={ariaLabel}
      className={cn(NAV_BADGE_TOKENS.base, className)}
    >
      {display}
    </span>
  );
}
```

```tsx
// SidebarNav.tsx (상세: "반출입" 항목)
const { data: pendingCount = 0 } = useCheckoutsYourTurnCount();
const t = useTranslations('nav.checkouts.yourTurnBadge');

<Link href="/checkouts?view=yourTurn">
  <Package className="h-4 w-4" aria-hidden="true" />
  {t('menuLabel')}
  <NavBadge
    count={pendingCount}
    ariaLabel={t('aria', { count: pendingCount })}
  />
</Link>
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `NavBadge.tsx` 신규 파일 + named export | grep |
| M3 | `use-checkouts-your-turn-count.ts` 훅 + `queryKeys.checkouts.resource.pendingCount()` 재사용 | grep |
| M4 | `CHECKOUT_SUMMARY` preset(staleTime SHORT + refetchOnWindowFocus) 적용 | grep |
| M5 | `count === 0` 시 배지 미렌더 | E2E |
| M6 | `count > 9` 시 "9+" 렌더 | E2E |
| M7 | 클릭 시 `/checkouts?view=yourTurn` 이동 (URL saved view 경유) | E2E |
| M8 | `aria-label`이 i18n 경유 + count interpolation (하드코딩 0) | grep |
| M9 | 역할별 표시 조건: approver/admin만 렌더. requester는 숨김 (본인 요청은 "대기"가 다른 의미) | E2E + permission |
| M10 | SSR safe: 초기 count `undefined` 시 배지 미렌더 (layout flash 방지) | manual |
| M11 | i18n 2+ 키 양 로케일 | `jq` |
| M12 | NAV_BADGE_TOKENS 토큰 정의 (raw class 0) | grep |
| M13 | E2E: pending 0 → 배지 없음 / pending 5 → "5" 렌더 / pending 12 → "9+" 렌더 / 클릭 → /checkouts?view=yourTurn | Playwright |
| M14 | a11y: `aria-label`만 스크린리더에 음성 announce (숫자는 aria-label로 충분) | axe + manual |
| M15 | 변경 파일 수 ≤ **6** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | SSE 실시간 업데이트 (MEMORY.md CRITICAL 30s refetch strategy, backend notifications module 협업) | `your-turn-sse` |
| S2 | Pulse 애니메이션 (새 배지 발생 시 `motion-safe:animate-pulse` 1회) | `your-turn-badge-pulse` |
| S3 | Overdue count 별도 배지 (critical color) | `overdue-nav-badge` |
| S4 | 배지 클릭 시 드롭다운으로 pending list 미리보기 | `your-turn-dropdown-preview` |
| S5 | Nav 배지 패턴을 equipment/calibration/non-conformance 메뉴에도 적용 — `NavBadge` 재사용 | `nav-badge-reuse-other-menus` |
| S6 | 배지 숫자 interpolation의 plural 처리 (`1 item` vs `2 items`) | `nav-badge-i18n-plural` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/components/shared/NavBadge.tsx apps/frontend/hooks/use-checkouts-your-turn-count.ts

test -f apps/frontend/components/shared/NavBadge.tsx && echo "NavBadge OK"
test -f apps/frontend/hooks/use-checkouts-your-turn-count.ts && echo "hook OK"

grep -n "pendingCount\|CHECKOUT_SUMMARY" apps/frontend/hooks/use-checkouts-your-turn-count.ts

grep -n "view=yourTurn" apps/frontend/components/layout/

jq '.nav.checkouts.yourTurnBadge' apps/frontend/messages/ko.json apps/frontend/messages/en.json

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 6

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u11-nav-badge
```

---

## Acceptance

MUST 15개 PASS + count=0/5/12 3 시나리오 E2E + axe 0 violation.
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 3.2 · `checkout-query-keys-view-resource-refactor.md` — `resource.pendingCount` 키.
- Sprint 4.5 U-03 · `checkout-ux-u03-filter-sticky-saved-views.md` — `view=yourTurn` saved view.
- MEMORY.md `REFETCH_STRATEGIES CRITICAL` — SSE는 SHOULD.
- MEMORY.md `project_76_tech_debt_0420b_20260421` — P-5(pendingCount refetch) 이미 OK.
