---
slug: checkout-ux-u09-dday-color-temperature
type: contract
date: 2026-04-24
depends: [checkout-detail-dday-badge]
sprint: 4
sprint_step: 4.5.U-09
---

# Contract: Sprint 4.5 · U-09 — Due-date 공감각 색온도 6단계 gradient

## Context

V2 §8 U-09 + V1 S5: 현재 `getDdayClasses`는 2-3단계 (neutral/warning/critical)만 구분. 6단계 gradient로 **시간 감각**을 UI로 직감 전달.

- 6단계:
  - `D-7+` neutral (`bg-ink-100 text-ink-600`)
  - `D-6 ~ D-4` info tint (`bg-brand-info/10 text-brand-info`)
  - `D-3 ~ D-1` warning (`bg-brand-warning/10 text-brand-warning`)
  - `D-0` orange 강조 (`bg-orange-500 text-white`)
  - `D+1 ~ D+3` critical (`bg-brand-critical/15 text-brand-critical`)
  - `D+4+` pulse critical (`bg-brand-critical text-white motion-safe:animate-pulse`)
- MEMORY.md brand migration 패턴: CSS 변수로 정의하여 `.dark` 자동 전환.
- WCAG: **색만으로 정보 전달 금지** → 색 + 숫자 + 아이콘(경고) 3중 단서.

---

## Scope

### 수정 대상
- `apps/frontend/lib/utils/dday.ts` (또는 기존 `getDdayClasses` 정의 파일)
  - `getDdayBucket(daysRemaining): DdayBucket` export (Sprint 4.3에서 interface만 잡은 것 구현).
  - `getDdayClasses(daysRemaining)` 기존 로직을 bucket 기반으로 재작성.
  - `getDdayIcon(daysRemaining): LucideIcon | null` — warning/critical/pulseCritical bucket만 icon 반환.
- `apps/frontend/lib/design-tokens/semantic.ts`
  - `DDAY_BUCKET_TOKENS`: `satisfies Record<DdayBucket, { bg: string; text: string; icon?: string }>`.
  - CSS 변수로 6단계 정의 → `globals.css` `:root` + `.dark` 양쪽.
- `apps/frontend/components/checkouts/DdayBadge.tsx` (Sprint 4.3 신규)
  - `getDdayIcon` 결과를 badge 왼쪽에 렌더 (null이면 미렌더).
  - `aria-label`에 "위험" / "임박" 단서 추가.
- **CSS**
  - `apps/frontend/app/globals.css`:
    ```css
    :root {
      --dday-safe-bg: hsl(var(--ink-100));
      --dday-safe-fg: hsl(var(--ink-600));
      --dday-info-bg: hsl(var(--brand-info) / 0.1);
      /* ... 6단계 */
    }
    .dark {
      /* 자동 전환 (MEMORY.md 원칙) */
    }
    ```
  - `motion-safe:animate-pulse` 적용은 `pulseCritical` bucket만.

### 수정 금지
- `formatDday` (텍스트 포맷만) — 재사용.
- `CheckoutGroupCard.tsx` row 구조 — Sprint 4.2 소관.
- Sprint 4.3 `DdayBadge` 컴포넌트 shell (변경 없음).

---

## 참조 구현

```typescript
// apps/frontend/lib/utils/dday.ts
import { AlertTriangle, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DdayBucket = 'safe' | 'info' | 'warn' | 'today' | 'overdue' | 'longOverdue';

export function getDdayBucket(daysRemaining: number): DdayBucket {
  if (daysRemaining >= 7) return 'safe';
  if (daysRemaining >= 4) return 'info';
  if (daysRemaining >= 1) return 'warn';
  if (daysRemaining === 0) return 'today';
  if (daysRemaining >= -3) return 'overdue';
  return 'longOverdue';
}

export const DDAY_BUCKET_TOKENS = {
  safe:         { bg: 'bg-[var(--dday-safe-bg)]',        text: 'text-[var(--dday-safe-fg)]' },
  info:         { bg: 'bg-[var(--dday-info-bg)]',        text: 'text-[var(--dday-info-fg)]' },
  warn:         { bg: 'bg-[var(--dday-warn-bg)]',        text: 'text-[var(--dday-warn-fg)]' },
  today:        { bg: 'bg-[var(--dday-today-bg)]',       text: 'text-[var(--dday-today-fg)]' },
  overdue:      { bg: 'bg-[var(--dday-overdue-bg)]',     text: 'text-[var(--dday-overdue-fg)]' },
  longOverdue:  { bg: 'bg-[var(--dday-long-bg)]',        text: 'text-[var(--dday-long-fg)] motion-safe:animate-pulse' },
} as const satisfies Record<DdayBucket, { bg: string; text: string }>;

export function getDdayIcon(daysRemaining: number): LucideIcon | null {
  const bucket = getDdayBucket(daysRemaining);
  if (bucket === 'today' || bucket === 'overdue' || bucket === 'longOverdue') return AlertTriangle;
  if (bucket === 'warn') return AlertCircle;
  return null;
}

export function getDdayClasses(daysRemaining: number): string {
  const bucket = getDdayBucket(daysRemaining);
  return `${DDAY_BUCKET_TOKENS[bucket].bg} ${DDAY_BUCKET_TOKENS[bucket].text}`;
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `getDdayBucket` 함수 export + 6단계 반환 | grep + unit test |
| M3 | `getDdayClasses` 기존 호출부 100% 호환 (bucket 기반 재작성) | E2E 회귀 |
| M4 | `DDAY_BUCKET_TOKENS`가 `satisfies Record<DdayBucket, ...>` 강제 | grep |
| M5 | CSS 변수 6단계 `:root` + `.dark` 동시 정의 (MEMORY.md 원칙) | grep |
| M6 | `.dark` 변형에서도 WCAG 4.5:1 대비 유지 (contrast 수동 검증) | axe + manual |
| M7 | 색만으로 정보 전달 **금지**: `DdayBadge`에 숫자 + icon (warn 이상) 동시 렌더 | E2E + axe |
| M8 | `motion-safe:animate-pulse`는 `longOverdue` bucket만 (`prefers-reduced-motion` 존중) | CSS |
| M9 | `getDdayIcon`이 `safe`/`info`는 null, `warn`부터 icon 반환 | unit test |
| M10 | `aria-label`에 "임박"/"초과" 등 시간 상태 단서 포함 (i18n 경유) | grep |
| M11 | 기존 `getDdayClasses` 2-3단계 로직 → 6단계 로직으로 전환 (stale raw class 0건) | grep 모든 사용처 |
| M12 | `review-design` skill 재실행 스코어 전/후 기록 (color + icon redundancy, AA contrast) | manual |
| M13 | E2E: D-7, D-3, D-0, D+1, D+5 5 시나리오에서 각 bucket 렌더 확인 | Playwright + viewport screenshot |
| M14 | Dark mode에서 각 bucket 클래스가 visible (contrast 검증 스크린샷 첨부) | manual |
| M15 | 변경 파일 수 ≤ **7** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 6단계 gradient Storybook stories (D-7/D-3/D-0/D+1/D+5) | `dday-storybook` |
| S2 | `pulseCritical` 애니메이션을 사용자 설정(`settings.reduceMotion`)으로도 제어 | `dday-pulse-user-toggle` |
| S3 | 색각 이상(color-blind) 시뮬레이션 테스트 | `dday-colorblind-sim` |
| S4 | `longOverdue` (D+14+) 7단계로 확장 검토 — 한 달 이상 초과 별도 bucket | `dday-long-overdue-extension` |
| S5 | D-day 계산 공휴일 제외 옵션 (business day) | `dday-business-day` |
| S6 | `getDdayBucket`을 domain 모듈로 승격 (backend에서도 사용 시) | `dday-bucket-shared-domain` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/lib/utils/dday.ts

pnpm --filter frontend run test -- dday
# 기대: 6 bucket unit test 통과

grep -n "satisfies Record<DdayBucket" apps/frontend/lib/utils/dday.ts
# 기대: 1 hit

grep -n "--dday-safe-bg\|--dday-info-bg\|--dday-warn-bg\|--dday-today-bg\|--dday-overdue-bg\|--dday-long-bg" apps/frontend/app/globals.css
# 기대: 6+ hit (:root + .dark 각 6 = 12+ 라인)

grep -n "motion-safe:animate-pulse" apps/frontend/lib/utils/dday.ts apps/frontend/app/globals.css
# 기대: longOverdue만

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 7

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u09-dday
```

---

## Acceptance

MUST 15개 PASS + 6 bucket unit test + dark mode contrast 수동 검증 + review-design 스코어 개선 기록.
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.3 · `checkout-detail-dday-badge.md` — `getDdayBucket` interface 소비.
- Sprint 4.2 · Row 3-zone — Zone 2 D-day 표기에 본 bucket 적용.
- Sprint 5.3 · Color semantic 5축 — orange 색은 today bucket 전용 (purpose 외 용도 허용 예외).
- MEMORY.md `Brand Color Migration` — CSS 변수 :root + .dark 양쪽 정의 원칙.
