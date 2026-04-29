---
slug: typography-6-tier
type: contract
date: 2026-04-24
depends: []
sprint: 5
sprint_step: 5.2
---

# Contract: Sprint 5.2 — Typography 6단계 + `TYPOGRAPHY_TOKENS` alias + raw `text-xs/sm` 교체

## Context

V2 §9: 현재 checkout 영역의 폰트 사이즈가 `text-xs`/`text-sm` raw 클래스로 혼용되어 위계가 불분명하다.
"장비명(주체)" 이 `text-sm`(14px)인데 메타정보와 동일 사이즈 → 시각적 계층이 없음.

- Hero KPI(22px) → Action Panel(18px) → Row title(14px/semibold) → Body(12.5px) → Meta(11.5px) → Kicker(10.5px uppercase) 6단계로 정립.
- `TYPOGRAPHY_TOKENS`에 alias 추가 — 컴포넌트가 `T.rowTitle` 같은 의미 기반 클래스 소비.
- raw `text-xs`/`text-sm` 직접 사용은 checkout 컴포넌트 내부에서 금지 (verify-design-tokens 규칙 추가).
- Sprint 5.4 density-rhythm과 동반 — line-height가 row 64px cozy와 정합되어야 함.
- **신규 폰트 사이즈 도입 없음**: Tailwind custom scale 사용 (`text-[12.5px]`). 번들 영향 최소.

---

## Scope

### 수정 대상

- `apps/frontend/lib/design-tokens/typography.ts` (신규 or 기존 `semantic.ts`에 통합)
  - `TYPOGRAPHY_TOKENS` 객체 선언 + export.
  - 6단계 alias 정의 (아래 참조 구현 참조).
- `apps/frontend/lib/design-tokens/index.ts`
  - `TYPOGRAPHY_TOKENS` re-export 추가.
- **checkout 컴포넌트 일괄 교체** (직접 raw 사용 → 토큰 alias):
  - `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
    - 장비명: `text-sm font-medium` → `TYPOGRAPHY_TOKENS.rowTitle`
    - 메타(날짜/목적): `text-xs text-ink-500` → `TYPOGRAPHY_TOKENS.meta`
    - YourTurn 요약: raw `text-xs font-medium` → `TYPOGRAPHY_TOKENS.meta`
  - `apps/frontend/components/checkouts/CheckoutDetailClient.tsx`
    - 페이지 타이틀 h1: `text-xl font-semibold` → `TYPOGRAPHY_TOKENS.heroH`
    - 섹션 소제목: `text-base font-semibold` → `TYPOGRAPHY_TOKENS.actionH`
    - 날짜·담당자 메타: `text-sm` → `TYPOGRAPHY_TOKENS.body`
    - purpose 태그 kicker: `text-xs uppercase` → `TYPOGRAPHY_TOKENS.kicker`
  - `apps/frontend/components/checkouts/CheckoutNextStepPanel.tsx`
    - Panel title: `text-base font-semibold` → `TYPOGRAPHY_TOKENS.actionH`
  - `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx`
    - step 숫자: `text-xs` → `TYPOGRAPHY_TOKENS.meta`
- **검증 스킬 업데이트**:
  - `.claude/skills/verify-design-tokens/` — checkout 컴포넌트 내부 raw `text-xs\|text-sm` 금지 규칙 추가.
  - 예외 허용: `className` prop으로 외부에서 override하는 경우, `cn(T.meta, className)` 패턴.
- `apps/frontend/messages/ko.json` + `en.json`
  - (추가 키 없음 — 토큰 alias는 CSS, i18n 변경 없음)

### 수정 금지

- `globals.css` `@theme` 섹션 — 폰트 사이즈 CSS 변수는 Tailwind 기본 스케일 + `text-[Npx]` arbitrary 사용.
- 다른 도메인(equipment, calibration 등) 컴포넌트 — checkout 영역만 교체.
- `text-lg`/`text-2xl` 사용 컴포넌트 (Hero KPI 섹션 기존 값) — Sprint 7 이후 전체 도메인 확장 시.

### 신규 생성

- `apps/frontend/lib/design-tokens/typography.ts` (파일 크기에 따라 semantic.ts 통합 가능)

---

## 참조 구현

```typescript
// apps/frontend/lib/design-tokens/typography.ts

/**
 * 6단계 타이포그래피 alias.
 * 사용: cn(TYPOGRAPHY_TOKENS.rowTitle, className)
 * 금지: checkout 컴포넌트 내부에서 text-xs/text-sm raw 직접 사용.
 */
export const TYPOGRAPHY_TOKENS = {
  /** 22px / line-height 28px · semibold — 페이지 타이틀 (Hero H) */
  heroH:    'text-[22px] leading-7 font-semibold',
  /** 18px / line-height 24px · semibold — NextStepPanel title, 섹션 소제목 */
  actionH:  'text-[18px] leading-6 font-semibold',
  /** 14px / line-height 20px · semibold — 행 장비명 (Row title, 주체 승격) */
  rowTitle: 'text-sm leading-5 font-semibold',
  /** 12.5px / line-height 18px — 본문 날짜·담당자·상태 서술 */
  body:     'text-[12.5px] leading-[18px]',
  /** 11.5px / line-height 16px — 보조 메타(목적·기간·행위자) */
  meta:     'text-[11.5px] leading-4',
  /** 10.5px · uppercase · tracking — 목적 태그, 섹션 kicker */
  kicker:   'text-[10.5px] uppercase tracking-[.12em] font-medium',
} as const;

export type TypographyKey = keyof typeof TYPOGRAPHY_TOKENS;
```

```tsx
// CheckoutGroupCard.tsx — 교체 예시
import { TYPOGRAPHY_TOKENS as T } from '@/lib/design-tokens/typography';

// Before
<span className="text-sm font-medium text-ink-900 truncate">{row.equipmentName}</span>
<span className="text-xs text-ink-500">{formatDate(row.requestedAt)}</span>

// After
<span className={cn(T.rowTitle, 'text-ink-900 truncate')}>{row.equipmentName}</span>
<span className={cn(T.meta, 'text-ink-500')}>{formatDate(row.requestedAt)}</span>
```

```tsx
// CheckoutDetailClient.tsx — 교체 예시
// Before
<h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
// After
<h1 className={T.heroH}>{t('pageTitle')}</h1>

// Before
<h2 className="text-base font-semibold">{t('nextStep')}</h2>
// After
<h2 className={T.actionH}>{t('nextStep')}</h2>
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + `pnpm lint` 통과 | 빌드 |
| M2 | `TYPOGRAPHY_TOKENS` 6 key 모두 존재 (heroH / actionH / rowTitle / body / meta / kicker) | grep |
| M3 | `TYPOGRAPHY_TOKENS`가 `lib/design-tokens/index.ts`에서 export | grep |
| M4 | `CheckoutGroupCard.tsx` 내 장비명 class가 `T.rowTitle` 경유 (raw `text-sm font-medium` 제거) | grep -n `text-sm font-medium` in CheckoutGroupCard → checkout 컴포넌트 0 |
| M5 | `CheckoutGroupCard.tsx` 메타 정보(날짜/목적)가 `T.meta` 경유 (raw `text-xs` 제거) | grep |
| M6 | `CheckoutDetailClient.tsx` 페이지 타이틀이 `T.heroH` 경유 | grep |
| M7 | `CheckoutNextStepPanel.tsx` 패널 타이틀이 `T.actionH` 경유 | grep |
| M8 | `rowTitle` = `text-sm leading-5 font-semibold` (14px/semibold — 기존 `text-sm font-medium`에서 semibold 승격) | grep in typography.ts |
| M9 | `body` = `text-[12.5px]`, `meta` = `text-[11.5px]`, `kicker` = `text-[10.5px] uppercase tracking-[.12em]` (arbitrary Tailwind — 신규 CSS 변수 없음) | grep |
| M10 | `.claude/skills/verify-design-tokens/`에 "checkout 컴포넌트 내 raw `text-xs\|text-sm` 금지" 규칙 추가 | skill YAML grep |
| M11 | `globals.css` 변경 없음 (신규 CSS 변수 미추가) | git diff -- apps/frontend/app/globals.css → 0 |
| M12 | bundle-size gate: First Load JS 증가 < 1 KB (토큰 alias는 JS 상수, CSS tree-shaking 이미 적용) | analyzerMode:json 비교 |
| M13 | 변경 파일 수 ≤ **10** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | equipment, calibration 등 타 도메인 컴포넌트도 `TYPOGRAPHY_TOKENS` 소비 전환 (전체 확장) | `typography-all-domains` |
| S2 | Storybook Typography 카탈로그 스토리 (6단계 시각 비교) | `typography-storybook` |
| S3 | `TYPOGRAPHY_TOKENS.label` 추가 (form label: 12.5px/semibold) — form 컴포넌트 통합 | `typography-form-label` |
| S4 | eslint 규칙으로 `text-xs`/`text-sm` raw 사용 checkout 파일에서 error — 스킬이 아닌 CI gate | `typography-eslint-gate` |

---

## Verification Commands

```bash
# 빌드
pnpm tsc --noEmit
pnpm lint

# 6 key 존재
grep -E "heroH|actionH|rowTitle|body|meta|kicker" \
  apps/frontend/lib/design-tokens/typography.ts
# 기대: 6줄 각각 1+ hit

# CheckoutGroupCard raw 제거 확인
grep -n "text-sm font-medium\|text-xs" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: className prop override 목적 외 0 hit

# CheckoutDetailClient 타이틀 교체
grep -n "T\.heroH\|TYPOGRAPHY_TOKENS\.heroH" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 1+ hit

# globals.css 미변경
git diff -- apps/frontend/app/globals.css
# 기대: 0 diff

# 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: ≤ 10
```

---

## Acceptance

MUST 13개 모두 PASS + Playwright screenshot(row title 굵기 변화) 시각 확인.
SHOULD 미달은 `tech-debt-tracker.md` 등록.

---

## 연계 contracts

- Sprint 5.4 · `density-rhythm.md` — `rowTitle` 14/20 line-height가 행 64px cozy와 정합.
- Sprint 5.1 · `empty-state-variant-colors.md` — `title`/`meta` 토큰 공유 (EmptyState 렌더).
- Sprint 4.1 · `checkout-next-step-panel-unified.md` — NextStepPanel title이 `actionH` 소비.
- Sprint 4.2 · `checkout-row-3zone-grid.md` — Zone 3 장비명이 `rowTitle` semibold 소비.
- MEMORY.md `project_82_pr3_design_tokens_20260424` — Design Token 3-Layer 체계, typography flat layer.
