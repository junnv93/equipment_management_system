---
slug: color-semantic-5-axis
type: contract
date: 2026-04-24
depends: []
sprint: 5
sprint_step: 5.3
---

# Contract: Sprint 5.3 — Color Semantic 5축 정립 + Purple 용도 제한 규약 + `verify-design-tokens` 경고

## Context

V2 §9: checkout 영역에서 색이 **의미 없이** 사용되는 케이스가 존재.
- Rental purpose 식별에 쓰는 purple이 상태 배지(status badge)에도 등장.
- "내 차례" 강조색과 "기한 초과" 색이 구분되지 않는 곳.
- "완료" 색과 "진행 중" 색이 컴포넌트마다 다른 값.

**5축 원칙**:
1. **Neutral** — Primary action (버튼 기본), 텍스트 잉크 (ink-900/600/400)
2. **Warning** — 내 차례(YourTurn), 기한 임박(D-3~D-1) → `brand-warning`
3. **Critical** — 기한 초과(D+1~), 반려 결과 → `brand-critical`
4. **OK** — 완료(완전 승인/반납 완료) → `brand-success`
5. **Purple** — **Rental purpose 식별 전용** (purposeBar, purpose chip). 상태·CTA 사용 절대 금지.

- 신규 색 추가 없음 — 기존 brand token 재배치·정책화만.
- `verify-design-tokens` skill에 purple 오용 경고 규칙 추가.
- 이 정책이 확정되어야 Sprint 5.1 `empty-state-variant-colors`의 variant 색 매핑이 완성 가능 (downstream).

---

## Scope

### 수정 대상

- `apps/frontend/lib/design-tokens/semantic.ts`
  - `COLOR_SEMANTIC_AXIS` 객체 신설:
    ```ts
    export const COLOR_SEMANTIC_AXIS = {
      neutral:  { text: 'text-ink-900',         bg: 'bg-ink-50',           border: 'border-ink-200'          },
      warning:  { text: 'text-brand-warning',    bg: 'bg-brand-warning/10', border: 'border-brand-warning/20' },
      critical: { text: 'text-brand-critical',   bg: 'bg-brand-critical/10',border: 'border-brand-critical/20'},
      ok:       { text: 'text-brand-success',    bg: 'bg-brand-success/10', border: 'border-brand-success/20' },
      rental:   { text: 'text-brand-purple',     bg: 'bg-brand-purple/10',  border: 'border-brand-purple/20'  },
    } as const satisfies Record<SemanticColorAxis, SemanticColorSlot>;
    ```
  - `SemanticColorAxis` 타입 export: `'neutral' | 'warning' | 'critical' | 'ok' | 'rental'`.
  - `SemanticColorSlot` 인터페이스: `{ text: string; bg: string; border: string }`.
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - **purple 사용 위치 감사**: `purposeBar`, `purpose chip`만 `COLOR_SEMANTIC_AXIS.rental` 경유. 나머지 purple 직접 사용 전부 적절한 축으로 교체.
  - `CHECKOUT_STATUS_BADGE_TOKENS` — 완료 상태는 `ok` 축, 반려 상태는 `critical` 축 경유.
  - `CHECKOUT_YOUR_TURN_BADGE_TOKENS` — `warning` 축 경유.
- `apps/frontend/lib/design-tokens/components/checkout-your-turn.ts` (존재하는 경우)
  - `summary` / `badge` variant가 `COLOR_SEMANTIC_AXIS.warning.text` 경유.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - `getPurposeBarClass` 결과 = `COLOR_SEMANTIC_AXIS.rental.bg` + `COLOR_SEMANTIC_AXIS.rental.border` (Sprint 2.1과 정합).
  - YourTurn raw `text-brand-info font-medium` (L-2) → `COLOR_SEMANTIC_AXIS.warning.text`.
- **`.claude/skills/verify-design-tokens/`** — purple 사용 경고 규칙:
  ```yaml
  - id: purple-purpose-only
    pattern: 'brand-purple|text-purple|bg-purple'
    excluded_files:
      - 'checkout-empty-state.ts'   # rental 축 정의 파일
      - 'checkout.ts'               # purposeBar 정의
    severity: error
    message: "Purple은 Rental purpose 식별(purposeBar/chip)에만 허용. 상태·CTA에 사용 금지."
  ```

### 수정 금지

- `globals.css` — brand-purple CSS 변수 정의 변경 없음.
- `BRAND_COLORS_HEX` / `BRAND_CLASS_MATRIX` (primitives) — 색 값 변경 없음.
- purpose chip / purposeBar의 purple 사용 — 이것은 합법, 건드리지 않음.

### 신규 생성

- `apps/frontend/lib/design-tokens/semantic.ts`에 `COLOR_SEMANTIC_AXIS` + 타입 2개 추가 (파일 내 추가, 신규 파일 불필요).

---

## 참조 구현

```typescript
// apps/frontend/lib/design-tokens/semantic.ts (추가 부분)

export type SemanticColorAxis = 'neutral' | 'warning' | 'critical' | 'ok' | 'rental';

export interface SemanticColorSlot {
  text:   string;
  bg:     string;
  border: string;
}

/**
 * 5축 의미 색상 맵.
 * 규칙:
 *  - rental(purple) 축 = Rental purpose 식별(purposeBar, purpose chip) 전용.
 *  - 상태 배지·CTA·아이콘 색·토스트에서 rental 축 사용 금지.
 *  - warning = YourTurn / 기한 임박 (D-3~D-1).
 *  - critical = 기한 초과 (D+1~) / 반려.
 *  - ok = 완료 (return_approved / 교정완료 등).
 */
export const COLOR_SEMANTIC_AXIS = {
  neutral:  { text: 'text-ink-900',       bg: 'bg-ink-50',            border: 'border-ink-200'          },
  warning:  { text: 'text-brand-warning', bg: 'bg-brand-warning/10',  border: 'border-brand-warning/20' },
  critical: { text: 'text-brand-critical',bg: 'bg-brand-critical/10', border: 'border-brand-critical/20'},
  ok:       { text: 'text-brand-success', bg: 'bg-brand-success/10',  border: 'border-brand-success/20' },
  rental:   { text: 'text-brand-purple',  bg: 'bg-brand-purple/10',   border: 'border-brand-purple/20'  },
} as const satisfies Record<SemanticColorAxis, SemanticColorSlot>;
```

```typescript
// apps/frontend/lib/design-tokens/components/checkout.ts (교체 예시)

// Before (L-2: raw)
// text-brand-info font-medium

// After (warning 축 경유)
import { COLOR_SEMANTIC_AXIS } from '@/lib/design-tokens/semantic';

export const CHECKOUT_YOUR_TURN_BADGE_TOKENS = {
  badge:   `${COLOR_SEMANTIC_AXIS.warning.text} font-medium text-[11.5px]`,
  summary: `${COLOR_SEMANTIC_AXIS.warning.text} font-medium text-[11.5px] shrink-0`,
} as const;
```

```typescript
// verify-design-tokens skill 규칙 (YAML 스니펫)
rules:
  - id: purple-purpose-only
    grep: 'brand-purple|text-purple-|bg-purple-'
    exclude_paths:
      - 'lib/design-tokens/semantic.ts'       # 정의 허용
      - 'lib/design-tokens/components/checkout.ts'  # purposeBar 정의 허용
      - 'lib/design-tokens/primitives.ts'     # color hex 정의
    severity: error
    message: |
      Purple은 Rental purpose 식별(purposeBar·chip) 전용입니다.
      상태 배지·CTA·아이콘·토스트에서 brand-purple 직접 사용 금지.
      COLOR_SEMANTIC_AXIS.rental이 유일한 합법 진입점.
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + `pnpm lint` 통과 | 빌드 |
| M2 | `COLOR_SEMANTIC_AXIS` 5축 모두 존재 + `satisfies Record<SemanticColorAxis, SemanticColorSlot>` | tsc + grep |
| M3 | `SemanticColorAxis` 타입 export | grep in semantic.ts |
| M4 | `CHECKOUT_YOUR_TURN_BADGE_TOKENS`가 `COLOR_SEMANTIC_AXIS.warning.text` 경유 (raw `text-brand-info` 제거) | grep -n `brand-info` in checkout-your-turn.ts → 0 |
| M5 | `CHECKOUT_STATUS_BADGE_TOKENS` 완료 상태 → `ok` 축, 반려 상태 → `critical` 축 | grep |
| M6 | `CheckoutGroupCard.tsx`의 YourTurn raw `text-brand-info` 제거 (토큰 경유) | grep -n `text-brand-info` in CheckoutGroupCard.tsx → 0 |
| M7 | purposeBar / purpose chip만 `rental` 축(brand-purple) 사용 — 외 컴포넌트 0 | grep -rn `brand-purple` apps/frontend/components/checkouts/ — 2개 이하(bar+chip) |
| M8 | `.claude/skills/verify-design-tokens/`에 `purple-purpose-only` 규칙 추가 | skill YAML grep |
| M9 | `dark:` prefix 없음 (COLOR_SEMANTIC_AXIS 선언부) | grep -n `dark:` in semantic.ts → 추가분 0 |
| M10 | 신규 CSS 변수 없음 (globals.css 변경 없음) | git diff -- globals.css → 0 |
| M11 | `COLOR_SEMANTIC_AXIS`가 `lib/design-tokens/index.ts`에서 export | grep |
| M12 | 변경 파일 수 ≤ **8** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | equipment, calibration 도메인도 `COLOR_SEMANTIC_AXIS` 소비 전환 | `color-axis-all-domains` |
| S2 | Storybook Color Palette 스토리 — 5축 시각 비교 | `color-axis-storybook` |
| S3 | `ok` 축에 `strong` variant 추가 (`bg-brand-success` 100% — 완전 완료 강조) | `color-ok-strong-variant` |
| S4 | CI lint 규칙으로 purple 오용 자동 차단 (eslint-plugin-no-restricted-syntax) | `eslint-purple-gate` |

---

## Verification Commands

```bash
# 빌드
pnpm tsc --noEmit
pnpm lint

# 5축 존재
grep -E "neutral|warning|critical|ok|rental" \
  apps/frontend/lib/design-tokens/semantic.ts | grep "COLOR_SEMANTIC_AXIS"
# 기대: 5 key 확인

# brand-info 제거 (YourTurn 교체)
grep -rn "text-brand-info\|brand-info" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/lib/design-tokens/components/checkout-your-turn.ts
# 기대: 0 hit (CheckoutGroupCard), 0 hit (your-turn token 파일)

# purple purpose-only 검증
grep -rn "brand-purple" apps/frontend/components/checkouts/ | \
  grep -v "purposeBar\|purpose.*chip\|CheckoutPurposeChip"
# 기대: 0 hit

# skill 규칙 추가 확인
grep -n "purple-purpose-only" .claude/skills/verify-design-tokens/*.{yaml,md,ts} 2>/dev/null
# 기대: 1+ hit

# globals.css 미변경
git diff -- apps/frontend/app/globals.css
# 기대: 0 diff

# 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: ≤ 8
```

---

## Acceptance

MUST 12개 모두 PASS + purple 오용 0건 grep 확인.
SHOULD 미달은 `tech-debt-tracker.md` 등록.

---

## 연계 contracts

- Sprint 5.1 · `empty-state-variant-colors.md` — variant 색이 본 contract 5축 기반 (downstream).
- Sprint 5.5 · `icon-motion-policy.md` — icon 색 정책이 `COLOR_SEMANTIC_AXIS` 연동.
- Sprint 2.2 · `checkout-ux-u09-dday-color-temperature.md` — D-day 6단계가 warning/critical 축 매핑.
- `design-token-layer2-expansion.md` — Layer 2 semantic token 확장의 일부.
- MEMORY.md `project_82_pr3_design_tokens_20260424` — 신규 색 추가 시 3곳 동시 원칙 (이 contract는 추가 없음, 재배치만).
- MEMORY.md `brand token 파일 내 dark:bg-brand-* 금지` — CSS 변수 자동 전환 체계 준수.
