---
slug: icon-motion-policy
type: contract
date: 2026-04-24
depends: [color-semantic-5-axis]
sprint: 5
sprint_step: 5.5
---

# Contract: Sprint 5.5 — Icon & Motion 규약 + `ICON_POLICY_TOKENS` + `MOTION_BUDGET_TOKENS`

## Context

V2 §9: checkout 영역 아이콘이 의미적 일관성 없이 배치됨.
- 상태 배지에 아이콘 + 필터 라벨에 아이콘 + 메타 텍스트에 아이콘 → "아이콘이 너무 많아 무의미해짐".
- Motion이 제각각: PR-15에서 정의한 `ANIMATION_PRESETS`이 있으나 checkout 특화 예산이 없음.
- `prefers-reduced-motion` 적용이 일부 컴포넌트에서 누락.

**Icon 규약**: "아이콘은 동사 앞에만"
- 허용: 승인하기, 반려하기, QR 발급, 반입 처리, 반출 시작, 반납 처리, 다운로드
- 금지: 상태 배지(pill), 필터 라벨 chip, 메타 텍스트(날짜·담당자·행 밑 정보), 섹션 소제목

**Motion 예산**:
| 이벤트 | duration | easing | reduced |
|--------|---------|--------|---------|
| 상태 전환 | 180ms | ease-out | instant |
| 패널 접힘/펼침 | 220ms | ease-in-out | instant |
| "내 차례" pulse | 2s · 1회 | linear | none |
| Row stagger-in | 40ms step · max 12행 | ease-out | instant |

- PR-15 `ANIMATION_PRESETS`(기존) 위에 checkout 특화 예산 레이어 추가. 기존 preset 수정 금지.
- Sprint 5.3 `color-semantic-5-axis`가 완료된 후 icon 색이 5축 매핑 가능 (depends).

---

## Scope

### 수정 대상

- `apps/frontend/lib/design-tokens/components/icon-policy.ts` (신규)
  - `CHECKOUT_ICON_POLICY` 객체: 허용 위치 목록 + 금지 위치 목록 (JSDoc + eslint 연동용).
  - `CHECKOUT_ACTION_ICONS`: CTA용 lucide 아이콘 상수 맵 (`approveIcon: CheckCircle2`, 등).
- `apps/frontend/lib/design-tokens/motion.ts` (기존 PR-15 파일 확장 — 추가만)
  - `CHECKOUT_MOTION_BUDGET` 객체 추가 (아래 참조 구현 참조).
  - 기존 `ANIMATION_PRESETS`, `REDUCED_MOTION`, `staggerItem` 수정 없음.
- `apps/frontend/lib/design-tokens/index.ts`
  - `CHECKOUT_ICON_POLICY`, `CHECKOUT_ACTION_ICONS`, `CHECKOUT_MOTION_BUDGET` re-export.
- **아이콘 감사 + 제거** (checkout 컴포넌트):
  - `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
    - 상태 배지(pill) 내 아이콘 → 제거.
    - 필터 chip 내 아이콘 → 제거.
    - CTA 버튼 "승인하기" 앞 `CheckCircle2Icon` → `CHECKOUT_ACTION_ICONS.approve` 유지 (허용).
  - `apps/frontend/components/checkouts/CheckoutStatusBadge.tsx` (존재하는 경우)
    - 상태 텍스트 앞 아이콘 → 제거 또는 `aria-hidden` 처리 (WCAG: 색만으로 전달 금지이나 아이콘이 유일 단서이면 유지).
    - **예외**: 아이콘이 색 보조 수단인 경우(`critical` 상태 경고 아이콘) → 유지 + `aria-label` 명시.
  - `apps/frontend/components/checkouts/CheckoutsContent.tsx`
    - 탭 필터 라벨 chip 아이콘 → 제거.
- **Motion 소비 교체**:
  - `CheckoutGroupCard.tsx` stagger: `getStaggerFadeInStyle(rowIndex)` → `CHECKOUT_MOTION_BUDGET.rowStagger(rowIndex)` 래퍼 경유 (상한 12 + reduced-motion 체크 내장).
  - `CheckoutNextStepPanel.tsx` 접힘/펼침 transition: raw `transition-all` → `CHECKOUT_MOTION_BUDGET.panelTransition`.
  - YourTurn pulse: raw `animate-pulse` → `CHECKOUT_MOTION_BUDGET.yourTurnPulse`.
- **`transition-all` 제거** (MEMORY.md `Design Token 3-Layer: transition: all 금지`):
  - `CheckoutGroupCard.tsx`, `CheckoutNextStepPanel.tsx`, `CheckoutDetailClient.tsx` 내 `transition-all` → `transition-colors` 또는 명시적 property transition.
- **`.claude/skills/verify-design-tokens/`** — 아이콘 금지 위치 경고 규칙:
  ```yaml
  - id: icon-verb-only
    pattern: '<(CheckCircle|XCircle|Clock|AlertCircle|Circle|Dot)[^>]*>' # 상태 연상 아이콘
    context_includes: 'StatusBadge|FilterChip|MetaLine|SectionTitle'
    severity: warn
    message: "아이콘은 동사(CTA) 앞에만. 상태 배지·필터 chip·메타에 아이콘 금지."
  ```

### 수정 금지

- `ANIMATION_PRESETS` (motion.ts 기존 PR-15 정의) — 내부 수정 없음.
- `staggerItem` / `REDUCED_MOTION.safe` 함수 시그니처.
- 상태 배지의 색 구분 — 아이콘 제거 시 색만 남으면 WCAG 실패 가능. 반드시 텍스트 레이블 병존 확인 후 제거.

### 신규 생성

- `apps/frontend/lib/design-tokens/components/icon-policy.ts`

---

## 참조 구현

```typescript
// apps/frontend/lib/design-tokens/components/icon-policy.ts
import {
  CheckCircle2, XCircle, QrCode, PackageOpen, PackageCheck,
  ArrowDownToLine, Download, RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Checkout CTA 아이콘 맵.
 * 규칙: 동사 앞에만. 상태 배지·필터·메타 사용 금지.
 */
export const CHECKOUT_ACTION_ICONS = {
  approve:     CheckCircle2,   // 승인하기
  reject:      XCircle,        // 반려하기
  qr:          QrCode,         // QR 발급
  startLend:   PackageOpen,    // 반출 시작
  confirmIn:   PackageCheck,   // 반입 처리
  returnApprove: RotateCcw,    // 반납 처리
  download:    Download,       // 다운로드
} as const satisfies Record<string, LucideIcon>;

/**
 * 아이콘 정책 문서.
 * 이 객체는 런타임에서 사용되지 않음 — JSDoc + verify-design-tokens 규칙의 참조 근거.
 */
export const CHECKOUT_ICON_POLICY = {
  allowed:    ['CTA 버튼', 'QR drawer 트리거', '다운로드 버튼', '필터 초기화 CTA'],
  forbidden:  ['상태 배지(pill)', '필터 라벨 chip', '메타 텍스트', '섹션 소제목'],
  exception:  ['critical/error 상태 경고 아이콘 — 색 보조 수단, aria-label 필수'],
} as const;
```

```typescript
// apps/frontend/lib/design-tokens/motion.ts (추가 부분 — PR-15 기존 코드 하단에 append)
import { staggerItem, REDUCED_MOTION } from './motion'; // 기존 re-use

/**
 * Checkout 영역 모션 예산.
 * PR-15 ANIMATION_PRESETS 위에 정책화된 alias layer.
 */
export const CHECKOUT_MOTION_BUDGET = {
  /** 상태 전환 (pill, row background) */
  statusTransition:  'transition-colors duration-[180ms] ease-out motion-reduce:transition-none',
  /** 패널 접힘/펼침 (NextStepPanel, WorkflowTimeline phase) */
  panelTransition:   'transition-[height,opacity] duration-[220ms] ease-in-out motion-reduce:transition-none',
  /** YourTurn pulse — 2s 1회, reduced-motion 시 none */
  yourTurnPulse:     'motion-safe:animate-[pulse_2s_ease-in-out_1]',
  /** Row stagger-in 함수 — 상한 12행 + reduced-motion 체크 내장 */
  rowStagger: (index: number): React.CSSProperties => {
    if (index >= 12) return {};
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};
    return { animationDelay: `${index * 40}ms`, animationFillMode: 'both' };
  },
} as const;
```

```tsx
// CheckoutGroupCard.tsx — motion 교체 예시
import { CHECKOUT_MOTION_BUDGET as M } from '@/lib/design-tokens/motion';

// Before
<div style={getStaggerFadeInStyle(rowIndex)} className="transition-all ...">

// After
<div
  style={M.rowStagger(rowIndex)}
  className={cn(M.statusTransition, ...)}
>
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + `pnpm lint` 통과 | 빌드 |
| M2 | `CHECKOUT_ACTION_ICONS` 7 key 이상 + `satisfies Record<string, LucideIcon>` | tsc + grep |
| M3 | `CHECKOUT_MOTION_BUDGET.rowStagger(13)` = `{}` (상한 12) | unit test |
| M4 | `rowStagger` 내부 `matchMedia('prefers-reduced-motion: reduce')` 체크 존재 | grep |
| M5 | `CheckoutGroupCard.tsx` stagger가 `M.rowStagger` 경유 (raw `getStaggerFadeInStyle` 직접 호출 0) | grep |
| M6 | `CheckoutGroupCard.tsx`, `CheckoutNextStepPanel.tsx` 내 `transition-all` 0 (MEMORY.md "transition: all 금지") | grep -n `transition-all` → 0 |
| M7 | 상태 배지(pill) 내 아이콘 제거 또는 `aria-hidden="true"` + 텍스트 레이블 병존 | DOM grep + axe |
| M8 | 필터 chip 내 아이콘 제거 (상태·목적 chip 내 불필요 아이콘 0) | grep |
| M9 | CTA "승인하기" 버튼 앞 `CHECKOUT_ACTION_ICONS.approve` 소비 (허용 위치) | grep |
| M10 | `yourTurnPulse` 에 `motion-safe:` prefix 포함 | grep in motion.ts |
| M11 | `panelTransition` = `duration-[220ms] ease-in-out motion-reduce:transition-none` | grep |
| M12 | `.claude/skills/verify-design-tokens/`에 `icon-verb-only` 규칙 추가 | skill YAML grep |
| M13 | 기존 `ANIMATION_PRESETS`, `staggerItem` 미변경 (PR-15 소관) | git diff motion.ts → 기존 함수 0 diff |
| M14 | `CHECKOUT_MOTION_BUDGET` export in `index.ts` | grep |
| M15 | Playwright a11y: axe-core 아이콘 관련 위반 0 (aria-hidden 누락 등) | axe-core E2E |
| M16 | 변경 파일 수 ≤ **10** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | eslint 규칙: CTA 외 위치에 lucide icon 직접 사용 시 경고 | `eslint-icon-verb-only` |
| S2 | `CHECKOUT_ACTION_ICONS`를 Storybook 아이콘 카탈로그에 추가 | `icon-storybook-catalog` |
| S3 | `rowStagger`의 40ms step을 CSS custom property로 추출 (`--checkout-stagger-step`) — Storybook에서 조절 가능 | `stagger-css-var` |
| S4 | VoiceOver/NVDA 스크린리더 테스트 — 아이콘 제거 후 상태 배지 읽힘 확인 | `a11y-icon-removal-audit` |
| S5 | "critical 예외" 아이콘 자동 식별 스크립트 (색 보조 수단인지 판별) | `icon-exception-detector` |

---

## Verification Commands

```bash
# 빌드
pnpm tsc --noEmit
pnpm lint

# CHECKOUT_ACTION_ICONS 7 key
grep -E "approve|reject|qr|startLend|confirmIn|returnApprove|download" \
  apps/frontend/lib/design-tokens/components/icon-policy.ts | wc -l
# 기대: ≥ 7

# transition-all 금지
grep -rn "transition-all" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/components/checkouts/CheckoutNextStepPanel.tsx \
  apps/frontend/app/\(dashboard\)/checkouts/
# 기대: 0 hit

# rowStagger 상한 + reduced-motion
grep -n "index >= 12\|prefers-reduced-motion" \
  apps/frontend/lib/design-tokens/motion.ts
# 기대: 2+ hit

# yourTurnPulse motion-safe
grep -n "motion-safe" apps/frontend/lib/design-tokens/motion.ts
# 기대: 1+ hit (yourTurnPulse)

# 기존 ANIMATION_PRESETS 미변경
git diff apps/frontend/lib/design-tokens/motion.ts | head -50
# 기대: 기존 export 함수 diff 없음

# axe E2E
pnpm --filter frontend run test:e2e -- checkouts/a11y/icon-policy

# 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: ≤ 10
```

---

## Acceptance

MUST 16개 모두 PASS + axe-core 아이콘 관련 위반 0 + Playwright screenshot으로 icon 제거 후 배지 가독성 시각 확인.
SHOULD 미달은 `tech-debt-tracker.md` 등록.

---

## 연계 contracts

- Sprint 5.3 · `color-semantic-5-axis.md` — icon 색이 5축 매핑 (critical 예외 아이콘 색 = `COLOR_SEMANTIC_AXIS.critical.text`) (depends).
- Sprint 3.5 · `checkout-ux-u10-optimistic-skeleton.md` — stagger 12행 상한 정책 공유.
- PR-15 · `pr15-motion-design.md` — `ANIMATION_PRESETS` 기반, 본 contract는 checkout 특화 budget alias만.
- Sprint 4.5 U-02 · `checkout-ux-u02-keyboard-shortcuts.md` — 단축키 치트시트의 아이콘도 동사 앞 규칙 준수.
- MEMORY.md `Design Token 3-Layer: transition: all 금지, focus-visible over focus` — motion 규약 근거.
- MEMORY.md `project_82_pr3_design_tokens_20260424` — PR-15 motion.ts 기존 구조.
