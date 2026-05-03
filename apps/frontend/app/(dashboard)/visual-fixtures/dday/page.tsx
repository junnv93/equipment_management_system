/**
 * Visual Regression Fixture — D-day 6-level (Sprint 4.5 S4)
 *
 * 본 페이지는 **개발/테스트 전용**. production 빌드에서는 `notFound()` 반환으로
 * 라우트 자체가 응답하지 않는다. Playwright `toHaveScreenshot()` baseline 캡처에 사용.
 *
 * SSOT 직접 import — 임계값/className 하드코딩 0건.
 *  - `CHECKOUT_DDAY_VISUAL_THRESHOLDS` (입력값 매트릭스 도출)
 *  - `getCheckoutDdayVisualLevel` (분기 SSOT)
 *  - `DDAY_VISUAL_LEVEL_CLASSES` (스타일 SSOT)
 *
 * 실행: `pnpm dev` 후 http://localhost:3000/visual-fixtures/dday
 * Baseline 갱신: `pnpm --filter frontend exec playwright test visual/dday-6level --update-snapshots`
 */

import { notFound } from 'next/navigation';
import {
  CHECKOUT_DDAY_VISUAL_THRESHOLDS,
  DDAY_VISUAL_LEVEL_CLASSES,
  getCheckoutDdayVisualLevel,
  type CheckoutDdayVisualLevel,
} from '@/lib/design-tokens';

// 6-level boundary 입력값 — SSOT 임계값에서 직접 도출 (하드코딩 0).
const T = CHECKOUT_DDAY_VISUAL_THRESHOLDS;
const FIXTURE_INPUTS: readonly { daysRemaining: number; expectedLevel: CheckoutDdayVisualLevel }[] =
  [
    { daysRemaining: T.relaxedFloor + 3, expectedLevel: 1 }, // relaxed
    { daysRemaining: T.normalFloor + 1, expectedLevel: 2 }, // normal
    { daysRemaining: T.warningFloor + 1, expectedLevel: 3 }, // warning-soft
    { daysRemaining: T.urgentDay, expectedLevel: 4 }, // urgent (D-day)
    { daysRemaining: T.overdueLightFloor + 1, expectedLevel: 5 }, // overdue-light
    { daysRemaining: T.overdueLightFloor - 2, expectedLevel: 6 }, // critical-pulse
  ];

export default function DdayVisualFixturePage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="p-8 bg-background">
      <h1 className="text-base font-semibold mb-4">D-day 6-level visual regression fixture</h1>
      <ul className="flex flex-col gap-3" data-testid="dday-fixture-list">
        {FIXTURE_INPUTS.map(({ daysRemaining, expectedLevel }) => {
          const actualLevel = getCheckoutDdayVisualLevel(daysRemaining);
          const className = DDAY_VISUAL_LEVEL_CLASSES[actualLevel];
          return (
            <li
              key={`level-${expectedLevel}`}
              data-testid={`dday-level-${expectedLevel}`}
              data-days-remaining={daysRemaining}
              data-actual-level={actualLevel}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-mono text-muted-foreground w-16">
                Lv {expectedLevel}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${className}`}>
                {daysRemaining > 0
                  ? `D-${daysRemaining}`
                  : daysRemaining === 0
                    ? 'D-Day'
                    : `D+${Math.abs(daysRemaining)}`}
              </span>
              <span className="text-xs text-muted-foreground">
                ({daysRemaining}d → level {actualLevel})
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
