/**
 * a11y 헬퍼 — `@axe-core/playwright` 통합.
 *
 * 사용 패턴: dashboard / 일반 페이지의 axe scan을 단일 함수로 표준화.
 * `color-contrast` 룰은 CI 환경(헤드리스)에서 정확도가 낮으므로 비활성.
 *
 * 소비처: `tests/e2e/dashboard-screenshots.spec.ts`, `tests/e2e/a11y/*.spec.ts`.
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function runAxe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast'])
    .analyze();
}

/**
 * critical / serious 임팩트 위반 0건 강제. 위반 시 콘솔에 상세 출력 후 expect 실패.
 * minor / moderate 위반은 경고만 — 별도 리포트로 추적 권장.
 */
export function assertNoHighImpact(results: Awaited<ReturnType<typeof runAxe>>) {
  const high = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  if (high.length > 0) {
    const summary = high.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes[0]?.target,
    }));
    console.error('a11y high-impact violations:', JSON.stringify(summary, null, 2));
  }
  expect(high).toHaveLength(0);
}
