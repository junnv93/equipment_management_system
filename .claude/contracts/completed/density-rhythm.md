---
slug: density-rhythm
type: contract
date: 2026-04-24
depends: [checkout-row-3zone-grid]
sprint: 5
sprint_step: 5.4
---

# Contract: Sprint 5.4 — Density & Rhythm — 행 64px cozy + 섹션 24px + 카드 12px 일관 적용

## Context

V2 §9: checkout 목록의 정보 밀도가 일관되지 않음.
- 행 높이가 컨텐츠에 따라 40px~80px 유동 → 스캔 시 리듬이 깨짐.
- 섹션 간격 `mb-3`~`mb-8` 혼용(Sprint 2.5에서 일부 정리됨).
- 카드 간격: `gap-2`/`gap-3`/`gap-4` 혼용.

**목표 규칙**:
| 레벨 | 값 | 적용 대상 |
|------|-----|---------|
| Row | min-h-[64px] + py-3 cozy | 각 checkout 행 |
| Section gap | gap-y-6 (24px) | Outbound/Inbound 섹션 헤더~섹션 컨텐츠 간 |
| Card gap | gap-3 (12px) | CheckoutGroupCard 내 row list |
| Row gap | divider (border-b) + gap-y-0 | 행 간 (divider로 구분, gap 0) |

- Sprint 2.5 `SECTION_RHYTHM_TOKENS` 단일화가 선행 완료 전제 — 본 contract는 **checkout 영역 전체 일관 적용 + 기준 문서화**만.
- Sprint 4.2 `checkout-row-3zone-grid.md`의 3-zone grid row가 이 64px cozy와 맞물림 (depends).

---

## Scope

### 수정 대상

- `apps/frontend/lib/design-tokens/components/checkout-density.ts` (신규)
  - `CHECKOUT_DENSITY_TOKENS` 선언 + export.
- `apps/frontend/lib/design-tokens/index.ts`
  - `CHECKOUT_DENSITY_TOKENS` re-export.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - Row container: `min-h-[64px] py-3` cozy 적용 (`CHECKOUT_DENSITY_TOKENS.row.container` 경유).
  - Row list: `flex flex-col gap-y-0 divide-y divide-ink-100` (`CHECKOUT_DENSITY_TOKENS.rowList`).
  - Group card body gap: `gap-3` (`CHECKOUT_DENSITY_TOKENS.cardGap`).
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
  - 섹션 간 gap: `CHECKOUT_DENSITY_TOKENS.sectionGap` 경유 (`gap-y-6`).
  - 기존 `mb-3`/`mb-4`/`mb-5` 잔존분 → `SECTION_RHYTHM_TOKENS.tight` 또는 `CHECKOUT_DENSITY_TOKENS.sectionGap`으로 최종 통합.
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - 동일 섹션 gap 적용.
- `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx`
  - 탭 컨텐츠 최상위 래퍼 gap: `gap-y-6`.
- **`.claude/skills/verify-design-tokens/`** — raw `mb-\d+` / `gap-\d+` checkout 컴포넌트 내 직접 사용 경고 추가.

### 수정 금지

- `SECTION_RHYTHM_TOKENS` (semantic.ts) — Sprint 2.5 소관, 변경 없음. `CHECKOUT_DENSITY_TOKENS`가 소비만.
- 행 최대 높이 설정 (`max-h`) — 컨텐츠 overflow 위험. min-h만 설정.
- 모바일(<480px) 다른 밀도 — 반응형 override 없음 (Sprint 6 이후 별도).

### 신규 생성

- `apps/frontend/lib/design-tokens/components/checkout-density.ts`

---

## 참조 구현

```typescript
// apps/frontend/lib/design-tokens/components/checkout-density.ts

/**
 * Checkout 영역 밀도·리듬 토큰.
 * 원칙:
 *  - Row: min-h-[64px] cozy (타이틀 + 메타 2줄이 여유 있게 들어가는 최소 높이)
 *  - Section gap: 24px (gap-y-6) — 섹션 헤더와 컨텐츠 사이
 *  - Card gap: 12px (gap-3) — 그룹 카드 내 row 목록
 *  - Row gap: 0 + divider — 행 간 구분은 border-b만
 */
export const CHECKOUT_DENSITY_TOKENS = {
  row: {
    container: 'min-h-[64px] py-3 px-4',
    divider:   'border-b border-ink-100 last:border-b-0',
  },
  rowList:    'flex flex-col divide-y divide-ink-100',
  cardGap:    'gap-3',     // 그룹 카드 내 row list
  sectionGap: 'gap-y-6',  // 섹션 간 (24px)
  pageGap:    'gap-y-8',  // 페이지 최상위 섹션 간 (32px — tabContent ↔ headerArea)
} as const;
```

```tsx
// CheckoutGroupCard.tsx — 적용 예시
import { CHECKOUT_DENSITY_TOKENS as D } from '@/lib/design-tokens/components/checkout-density';

// Row list
<ul className={D.rowList}>
  {equipmentRows.map((row, rowIndex) => (
    <li
      key={row.id}
      className={cn(D.row.container, D.row.divider)}
      style={getStaggerFadeInStyle(rowIndex)} // Sprint 3.5 상한 적용
    >
      {/* Zone 1-4 (Sprint 4.2 3-zone grid) */}
    </li>
  ))}
</ul>
```

```tsx
// OutboundCheckoutsTab.tsx — 섹션 간격
import { CHECKOUT_DENSITY_TOKENS as D } from '@/lib/design-tokens/components/checkout-density';

<div className={cn('flex flex-col', D.sectionGap)}>
  <SectionHeader ... />
  <CheckoutGroupCard ... />
</div>
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + `pnpm lint` 통과 | 빌드 |
| M2 | `CHECKOUT_DENSITY_TOKENS` 존재 + `row.container`, `rowList`, `cardGap`, `sectionGap` 4 key 이상 | grep |
| M3 | `row.container`에 `min-h-[64px]` 포함 (row 기본 cozy 64px) | grep in checkout-density.ts |
| M4 | `CheckoutGroupCard.tsx` row container가 `CHECKOUT_DENSITY_TOKENS.row.container` 경유 (raw `min-h-` 하드코딩 0) | grep |
| M5 | `rowList`가 `divide-y divide-ink-100` (divider 기반 row 구분, gap-y 0) | grep |
| M6 | `OutboundCheckoutsTab.tsx`의 섹션 간 raw `mb-3`~`mb-8` 모두 제거 → `sectionGap` 경유 | grep -n `mb-[3-8]` in OutboundCheckoutsTab.tsx → 0 |
| M7 | `InboundCheckoutsTab.tsx` 동일 처리 | grep |
| M8 | `CHECKOUT_DENSITY_TOKENS`가 `lib/design-tokens/index.ts`에서 export | grep |
| M9 | `.claude/skills/verify-design-tokens/`에 checkout 내 raw `mb-\d+` 경고 규칙 추가 | skill YAML grep |
| M10 | `SECTION_RHYTHM_TOKENS` 내부 미변경 (Sprint 2.5 소관 보존) | git diff -- semantic.ts → SECTION_RHYTHM_TOKENS 부분 0 diff |
| M11 | Playwright screenshot: 행 목록에서 cozy 64px 리듬 시각 확인 (min-h 적용 확인) | 스크린샷 비교 |
| M12 | 변경 파일 수 ≤ **9** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `compact` 모드 토큰 추가 (`min-h-[48px]` — 대량 목록 고밀도 옵션) | `density-compact-mode` |
| S2 | 사용자 설정에서 density 선택 (comfortable/compact) | `density-user-preference` |
| S3 | 모바일(<480px) `min-h-[56px]` + `py-2` override | `density-mobile-override` |
| S4 | Storybook 밀도 비교 스토리 (현재 vs cozy vs compact) | `density-storybook` |

---

## Verification Commands

```bash
# 빌드
pnpm tsc --noEmit
pnpm lint

# 토큰 4 key 확인
grep -E "row\.container|rowList|cardGap|sectionGap" \
  apps/frontend/lib/design-tokens/components/checkout-density.ts
# 기대: 4+ hit

# min-h-[64px] 확인
grep -n "min-h-\[64px\]" apps/frontend/lib/design-tokens/components/checkout-density.ts
# 기대: 1+ hit

# OutboundCheckoutsTab raw mb- 제거
grep -n "mb-[3-9]\|mb-1[0-9]" \
  apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx
# 기대: 0 hit

# SECTION_RHYTHM_TOKENS 미변경
git diff apps/frontend/lib/design-tokens/semantic.ts | \
  grep "SECTION_RHYTHM_TOKENS" | wc -l
# 기대: 0

# 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: ≤ 9
```

---

## Acceptance

MUST 12개 모두 PASS + Playwright screenshot 시각 확인 (64px cozy 리듬).
SHOULD 미달은 `tech-debt-tracker.md` 등록.

---

## 연계 contracts

- Sprint 4.2 · `checkout-row-3zone-grid.md` — 3-zone grid row container가 본 contract의 `row.container` 소비 (depends).
- Sprint 2.5 · `checkout-rhythm-focus-inbound-tokens.md` (Sprint 2 `SECTION_RHYTHM_TOKENS`) — 선행 완료 전제, 본 contract는 checkout 특화 확장만.
- Sprint 5.2 · `typography-6-tier.md` — `rowTitle` 14/20 line-height와 64px cozy 정합.
- Sprint 3.5 · `checkout-ux-u10-optimistic-skeleton.md` — stagger 12행 상한 + row height와 동일 container 클래스.
- MEMORY.md `Sticky header: --sticky-header-height CSS 변수 + ResizeObserver` — 섹션 gap이 sticky header 높이와 충돌하지 않도록.
