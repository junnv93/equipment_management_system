---
slug: empty-state-variant-colors
type: contract
date: 2026-04-24
depends: [color-semantic-5-axis, empty-state-component]
sprint: 5
sprint_step: 5.1
---

# Contract: Sprint 5.1 — Empty State variant 3색 분리 + `CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg`

## Context

V1 S4: 현재 모든 empty state가 동일한 배경·아이콘 색상. "초대(noneYet)", "차단(noPermission)", "조절(noFilterResult)" 의미가 다른데 시각적으로 동일하게 처리됨 → 사용자가 "왜 비어 있는지" 즉시 인지 불가.

- Sprint 4.5 U-12 `checkout-ux-u12-empty-error-recovery.md`가 **CTA 주입** 담당.
- 본 contract는 **토큰 정의 + 색상 구분** 담당 — Sprint 5의 시각적 기반.
- Sprint 5.3 color-semantic-5-axis가 5축 색 체계를 확정한 이후 매핑 검토 필요 (depends 선행).
- 기존 `EMPTY_STATE_TOKENS`(semantic.ts, `empty-state-component.md`에서 SSOT 승격) 구조를 **확장**만. 재정의 금지.

---

## Scope

### 수정 대상

- `apps/frontend/lib/design-tokens/components/checkout-empty-state.ts` (신규 또는 기존 checkout.ts 분리)
  - `CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg` 맵 신설:
    ```ts
    variantIconBg: {
      noneYet:      'bg-brand-info/10 border border-brand-info/20',
      noPermission: 'bg-ink-100 border border-ink-200',
      noFilterResult: 'bg-brand-warning/10 border border-brand-warning/20',
      error:        'bg-brand-critical/10 border border-brand-critical/20',
      network:      'bg-ink-50 border border-ink-150',
    } satisfies Record<EmptyStateVariant, string>,
    ```
  - `CHECKOUT_EMPTY_STATE_TOKENS.variantIcon`: variant별 lucide 아이콘 상수 (컴포넌트에서 import 경유).
  - `CHECKOUT_EMPTY_STATE_TOKENS.container`, `title`, `description`, `icon`, `metaLine` — 기존 키 포함 통합.
- `apps/frontend/lib/design-tokens/index.ts`
  - `CHECKOUT_EMPTY_STATE_TOKENS` export 추가.
- `apps/frontend/components/checkouts/CheckoutEmptyState.tsx`
  - `variantIconBg` 토큰 소비: `className={cn(..., CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg[props.variant])}`.
  - 각 variant별 아이콘: `InboxIcon`(noneYet) / `ShieldOffIcon`(noPermission) / `FilterXIcon`(noFilterResult) / `AlertCircleIcon`(error) / `WifiOffIcon`(network).
- `apps/frontend/lib/design-tokens/semantic.ts`
  - `EMPTY_STATE_TOKENS.iconBg` (공용 기본값, checkout 전용 아님) 유지. checkout 전용은 `CHECKOUT_EMPTY_STATE_TOKENS`에서 override.
- `apps/frontend/messages/ko.json` + `en.json`
  - `checkouts.empty.noneYet.iconAlt`, `noPermission.iconAlt`, `noFilterResult.iconAlt`, `error.iconAlt`, `network.iconAlt` — 스크린리더용 alt.
- **`.claude/skills/verify-design-tokens/`** — `variantIconBg` 소비 여부 + raw 하드코딩 색 잔존 경고 규칙 추가.

### 수정 금지

- `EMPTY_STATE_TOKENS` (semantic.ts) 내부 구조 변경 — 공용 토큰은 건드리지 않음.
- Sprint 4.5 U-12 `CheckoutEmptyState`의 CTA 로직.
- 아이콘 import를 lucide 외 라이브러리로 변경.

### 신규 생성

- `apps/frontend/lib/design-tokens/components/checkout-empty-state.ts`
  (기존 checkout.ts에 포함된 경우 분리 여부는 파일 크기 기준: 120줄 초과 시 분리 권장)

---

## 참조 구현

```typescript
// apps/frontend/lib/design-tokens/components/checkout-empty-state.ts
import type { EmptyStateVariant } from '@/components/checkouts/CheckoutEmptyState';

export const CHECKOUT_EMPTY_STATE_TOKENS = {
  container:   'flex flex-col items-center gap-4 py-16 px-8 rounded-xl text-center',
  icon:        'size-12 mx-auto',
  title:       'text-[14px] leading-5 font-semibold text-ink-900',
  description: 'text-[12.5px] leading-[18px] text-ink-500 max-w-[320px]',
  metaLine:    'text-[11.5px] leading-4 text-ink-400',
  ctaRow:      'flex flex-wrap gap-2 justify-center mt-2',

  variantIconBg: {
    noneYet:        'bg-brand-info/10 border border-brand-info/20',
    noPermission:   'bg-ink-100 border border-ink-200',
    noFilterResult: 'bg-brand-warning/10 border border-brand-warning/20',
    error:          'bg-brand-critical/10 border border-brand-critical/20',
    network:        'bg-ink-50 border border-ink-150',
  } satisfies Record<EmptyStateVariant, string>,

  variantIconColor: {
    noneYet:        'text-brand-info',
    noPermission:   'text-ink-400',
    noFilterResult: 'text-brand-warning',
    error:          'text-brand-critical',
    network:        'text-ink-300',
  } satisfies Record<EmptyStateVariant, string>,
} as const;
```

```tsx
// CheckoutEmptyState.tsx — variant 분기 핵심 (Sprint 4.5 U-12와 합산)
import { CHECKOUT_EMPTY_STATE_TOKENS as T } from '@/lib/design-tokens/components/checkout-empty-state';
import { InboxIcon, ShieldOffIcon, FilterXIcon, AlertCircleIcon, WifiOffIcon } from 'lucide-react';

const VARIANT_ICON = {
  noneYet:        InboxIcon,
  noPermission:   ShieldOffIcon,
  noFilterResult: FilterXIcon,
  error:          AlertCircleIcon,
  network:        WifiOffIcon,
} as const satisfies Record<EmptyStateVariant, React.ComponentType<{ className?: string }>>;

export function CheckoutEmptyState({ variant, ...props }: CheckoutEmptyStateProps) {
  const Icon = VARIANT_ICON[variant];
  return (
    <div
      role="status"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(T.container, T.variantIconBg[variant])}
    >
      <Icon className={cn(T.icon, T.variantIconColor[variant])} aria-hidden="true" />
      {/* title, description, CTA — Sprint 4.5 U-12 로직 */}
    </div>
  );
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + `pnpm lint` 통과 | 빌드 |
| M2 | `CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg` 5 variant 모두 존재 (`satisfies Record<EmptyStateVariant, string>` 통과) | tsc + grep |
| M3 | `noneYet` → `bg-brand-info/10` 색상, `noPermission` → `bg-ink-100`, `noFilterResult` → `bg-brand-warning/10` | grep |
| M4 | `variantIconBg` 값에 `dark:` prefix 없음 (CSS 변수 자동 전환 체계 — MEMORY.md "brand color migration 패턴") | grep -n `dark:` in checkout-empty-state.ts → 0 |
| M5 | `CheckoutEmptyState.tsx`가 `variantIconBg[variant]` 토큰 소비 (raw `bg-` 하드코딩 0) | grep |
| M6 | 5 variant 각각 lucide 아이콘 매핑 + `aria-hidden="true"` | grep |
| M7 | `variantIconColor` 5 variant (`satisfies Record<EmptyStateVariant, string>`) | tsc |
| M8 | `iconAlt` i18n 키 5종 양 로케일 | `jq` |
| M9 | `.claude/skills/verify-design-tokens/`에 "raw `bg-brand-` 하드코딩 in EmptyState 금지" 규칙 추가 | skill YAML grep |
| M10 | Sprint 4.5 U-12 CTA 로직 미변경 — `git diff` 확인 | git diff --stat |
| M11 | 변경 파일 수 ≤ **8** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | Storybook에 5 variant 스토리 추가 | `empty-state-storybook-5variants` |
| S2 | Playwright screenshot 회귀 비교 (before/after 5종) | `empty-state-visual-regression` |
| S3 | `noFilterResult` 배경에 줄무늬 overlay (CSS `repeating-linear-gradient`) — 차별화 추가 강조 | `empty-nofilter-stripe` |
| S4 | 다크모드 검증: CSS 변수가 `.dark` 클래스에서 올바른 색으로 전환 | `empty-state-dark-mode-audit` |

---

## Verification Commands

```bash
# 빌드
pnpm tsc --noEmit
pnpm lint

# variantIconBg 5종
grep -n "variantIconBg" apps/frontend/lib/design-tokens/components/checkout-empty-state.ts
# 기대: noneYet / noPermission / noFilterResult / error / network 5개

# dark: prefix 금지
grep -n "dark:" apps/frontend/lib/design-tokens/components/checkout-empty-state.ts
# 기대: 0 hit

# 토큰 소비 검증
grep -n "variantIconBg\[" apps/frontend/components/checkouts/CheckoutEmptyState.tsx
# 기대: 1+ hit

# i18n
jq '.checkouts.empty | to_entries[] | {key: .key, iconAlt: .value.iconAlt}' \
  apps/frontend/messages/ko.json apps/frontend/messages/en.json
# 기대: 5 variant × 2 locale = 10 결과

# 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: ≤ 8
```

---

## Acceptance

MUST 11개 모두 PASS + Playwright screenshot 5 variant 시각 확인.
SHOULD 미달은 `tech-debt-tracker.md` 등록.

---

## 연계 contracts

- Sprint 5.3 · `color-semantic-5-axis.md` — 5축 색 체계 정의 선행 필수 (depends).
- Sprint 4.5 U-12 · `checkout-ux-u12-empty-error-recovery.md` — CTA 로직 담당, 본 contract는 토큰만.
- `empty-state-component.md` — 공용 `EMPTY_STATE_TOKENS` SSOT (override 불가).
- Sprint 5.2 · `typography-6-tier.md` — `title`/`description`/`metaLine` 토큰 폰트 사이즈 동기화.
- MEMORY.md `brand color migration 패턴` — `dark:` prefix 금지, CSS 변수 자동 전환.
