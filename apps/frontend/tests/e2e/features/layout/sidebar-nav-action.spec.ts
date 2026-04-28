/**
 * Sidebar Nav Action — Nested Anchor / Hydration 회귀 차단
 *
 * 본 회귀 (2026-04-28 세션):
 *   `<a>` 안 NavBadge가 `badgeLinkHref` 분기로 또 `<Link>`(=`<a>`)를 렌더 →
 *   "In HTML, <a> cannot be a descendant of <a>" hydration error 발생.
 *
 * 해결 패턴: 행 컨테이너 + sibling anchor (`NavRowWithSecondaryAction`).
 * 정적 검증(ESLint NESTED_LINK_RULE)이 빌드 타임에 차단하나, 런타임 단에서도
 * 사이드바 진입 시 다음을 보장:
 *   1) 콘솔에 `<a>` nested / hydration mismatch 경고 0건
 *   2) 사이드바 DOM에 `a > a` 중첩 0건
 *   3) (시드에 yourTurn ≥ 1건일 때) Tab 순서: 메인 anchor → 보조 anchor
 *
 * 시드 의존성 회피:
 *   - Tab 순서 검증은 보조 anchor가 렌더된 경우에만 (개수 0이면 skip)
 *   - 콘솔/DOM 검증은 시드 무관 (사이드바는 모든 라우트에 항상 렌더)
 *
 * 실행:
 *   pnpm --filter frontend exec playwright test sidebar-nav-action --project=chromium
 */
import { test, expect, type ConsoleMessage } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '..', '..', '.auth');

// site_admin: 모든 nav item + 가능한 모든 배지 노출 (yourTurn 시드가 있다면 본 역할이 발견)
test.use({ storageState: path.join(AUTH_DIR, 'site-admin.json') });

/**
 * Nested anchor / hydration mismatch 콘솔 패턴.
 * React 19 + Next.js 16의 메시지 변형을 모두 포함:
 *   - "In HTML, <a> cannot be a descendant of <a>"
 *   - "<a> cannot contain a nested <a>"
 *   - "Hydration failed because the initial UI does not match"
 *   - "There was an error while hydrating"
 */
const HYDRATION_PATTERNS = [
  /<a>\s*cannot\s+(?:be\s+a\s+descendant|contain\s+a\s+nested)/i,
  /nested\s+<a>/i,
  /Hydration\s+failed/i,
  /error\s+while\s+hydrating/i,
  /text\s+content\s+(?:does\s+not\s+match|did\s+not\s+match)/i,
] as const;

function isHydrationViolation(text: string): boolean {
  return HYDRATION_PATTERNS.some((pat) => pat.test(text));
}

interface ConsoleViolation {
  type: ReturnType<ConsoleMessage['type']> | 'pageerror';
  text: string;
}

test.describe('Sidebar — nested anchor / hydration regression', () => {
  test('사이드바 진입 시 hydration / nested-anchor 콘솔 위반 0건', async ({ page }) => {
    const violations: ConsoleViolation[] = [];

    // Listener는 navigate 전에 등록 — 첫 SSR/hydration 단계 메시지도 캐치
    page.on('console', (msg) => {
      if (msg.type() !== 'error' && msg.type() !== 'warning') return;
      const text = msg.text();
      if (isHydrationViolation(text)) {
        violations.push({ type: msg.type(), text });
      }
    });
    page.on('pageerror', (err) => {
      const text = err.message;
      if (isHydrationViolation(text)) {
        violations.push({ type: 'pageerror', text });
      }
    });

    // /checkouts: yourTurn 보조 anchor가 활성화될 가능성이 높은 라우트
    await page.goto('/checkouts', { waitUntil: 'domcontentloaded' });

    // 사이드바 nav item hover/focus — pseudo class 진입에 따른 추가 렌더 트리거
    const checkoutsLink = page.locator('aside#desktop-sidebar a[href="/checkouts"]').first();
    await checkoutsLink.hover();
    await checkoutsLink.focus();

    // hydration 안정화 대기 — 사이드바 nav 첫 항목 렌더 완료까지 (dev mode HMR/SSE 무관)
    await page
      .locator('aside#desktop-sidebar nav a[href="/"]')
      .first()
      .waitFor({ state: 'visible' });

    expect(
      violations,
      `hydration / nested-anchor violations on /checkouts:\n${violations
        .map((v) => `  [${v.type}] ${v.text}`)
        .join('\n')}`
    ).toEqual([]);
  });

  test('사이드바 DOM에 nested anchor (a > a) 0건', async ({ page }) => {
    await page.goto('/checkouts', { waitUntil: 'domcontentloaded' });
    // hydration 안정화 — sidebar element가 attach되고 nav 첫 항목이 렌더될 때까지
    await page
      .locator('aside#desktop-sidebar nav a[href="/"]')
      .first()
      .waitFor({ state: 'visible' });

    const nestedCount = await page.evaluate(() => {
      const sidebar = document.getElementById('desktop-sidebar');
      if (!sidebar) return -1;
      return sidebar.querySelectorAll('a a').length;
    });

    expect(nestedCount, 'desktop-sidebar should contain zero nested anchors (a > a)').toBe(0);
  });

  test('보조 anchor 렌더 시 Tab 순서: 메인 anchor → 보조 anchor', async ({ page }) => {
    await page.goto('/checkouts', { waitUntil: 'domcontentloaded' });

    const secondaryAnchor = page.locator('aside#desktop-sidebar a[href*="view=yourTurn"]');
    const secondaryCount = await secondaryAnchor.count();

    if (secondaryCount === 0) {
      // 시드에 yourTurn 건이 0이면 보조 anchor가 렌더되지 않음 — Tab 순서 검증은 의미 없음.
      // 본 케이스는 다른 두 테스트로 충분히 회귀 차단.
      test.skip(true, 'No yourTurn checkouts in seed — secondary anchor not rendered');
      return;
    }

    const primaryAnchor = page.locator('aside#desktop-sidebar a[href="/checkouts"]').first();

    await primaryAnchor.focus();
    await page.keyboard.press('Tab');

    const activeHref = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement | null)?.getAttribute('href') ?? ''
    );

    expect(
      activeHref,
      'Tab from primary nav anchor should land on secondary anchor (yourTurn)'
    ).toContain('view=yourTurn');
  });
});
