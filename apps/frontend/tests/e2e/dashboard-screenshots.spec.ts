/**
 * 역할별 대시보드 스크린샷 캡처 + 다크모드 + a11y 검증
 *
 * 출력 위치:
 *   기본: apps/frontend/tests/e2e/__screenshots__/dashboard/ (gitignored)
 *   override: SCREENSHOT_OUTPUT_DIR 환경변수
 *
 * 실행: pnpm exec playwright test dashboard-screenshots --project=chromium --workers=1
 *
 * 캡처 매트릭스 (5 역할 × 6 light + 5 역할 × 2 dark = 40 PNG + 5 axe scan):
 *   - 1440px light: 기본화면(viewport-only) + 전체페이지(full)
 *   - 탭별 light: 역할별 3~4 탭 × 1440px full
 *   - 반응형 light: 1280 / 1024 / 768
 *   - 1440px dark: 기본화면 + 전체페이지
 *   - axe-core: 1 scan per role (light, 1440px, WCAG 2.1 AA, critical+serious 0건)
 */
import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { runAxe, assertNoHighImpact } from './shared/utils/a11y-helper';
import { setTheme } from './shared/utils/theme-helper';

const AUTH_DIR = path.join(__dirname, '.auth');
const OUTPUT_BASE =
  process.env.SCREENSHOT_OUTPUT_DIR ??
  path.join(__dirname, '..', '..', '__screenshots__', 'dashboard');
const BASE_URL = 'http://localhost:3000';

const ROLES = [
  {
    label: '시험실무자',
    file: 'test-engineer.json',
    dir: '01_시험실무자_test_engineer',
    tabs: ['calibration', 'equipment', 'activity'],
  },
  {
    label: '기술책임자',
    file: 'technical-manager.json',
    dir: '02_기술책임자_technical_manager',
    tabs: ['calibration', 'equipment', 'activity'],
  },
  {
    label: '품질책임자',
    file: 'quality-manager.json',
    dir: '03_품질책임자_quality_manager',
    tabs: ['calibration', 'equipment', 'activity'],
  },
  {
    label: '시험소장',
    file: 'lab-manager.json',
    dir: '04_시험소장_lab_manager',
    tabs: ['calibration', 'equipment', 'checkout', 'activity'],
  },
  {
    label: '시스템관리자',
    file: 'system-admin.json',
    dir: '05_시스템관리자_system_admin',
    tabs: ['calibration', 'equipment', 'checkout', 'activity'],
  },
] as const;

const TAB_LABELS: Record<string, string> = {
  calibration: '교정현황',
  equipment: '장비현황',
  activity: '활동',
  checkout: '반출현황',
};

for (const { label, file, dir, tabs } of ROLES) {
  test.describe(`${label} 대시보드`, () => {
    test.use({ storageState: path.join(AUTH_DIR, file) });
    test.setTimeout(240_000); // 4분 (dark + axe 추가로 여유)

    test(`${label} — 역할별 대시보드 스크린샷 + 다크 + a11y`, async ({ page }) => {
      const outDir = path.join(OUTPUT_BASE, dir);
      fs.mkdirSync(outDir, { recursive: true });

      async function gotoAndCapture(query: string, filename: string, fullPage = true) {
        const url = query ? `${BASE_URL}/?${query}` : `${BASE_URL}/`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        if (page.url().includes('/login')) {
          throw new Error(`인증 실패 — login으로 리다이렉트됨 (file: ${file})`);
        }
        await page.waitForSelector('h1, nav', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(2000); // 애니메이션 완료
        await page.screenshot({ path: path.join(outDir, filename), fullPage });
      }

      // ── 1. 1440×900 light ────────────────────────────────
      await setTheme(page, 'light');
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoAndCapture('', '01_기본화면_1440px.png', false);
      await gotoAndCapture('', '02_전체페이지_1440px.png', true);

      // ── 2. 탭별 light ────────────────────────────────────
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        await gotoAndCapture(
          `tab=${tab}`,
          `03_탭_${String(i + 1).padStart(2, '0')}_${TAB_LABELS[tab] ?? tab}.png`,
          true
        );
      }

      // ── 3. 반응형 light ──────────────────────────────────
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoAndCapture('', '04_1280px_xl.png', true);

      await page.setViewportSize({ width: 1024, height: 768 });
      await gotoAndCapture('', '05_1024px_lg.png', true);

      await page.setViewportSize({ width: 768, height: 1024 });
      await gotoAndCapture('', '06_768px_tablet.png', true);

      // ── 4. 1440×900 dark ────────────────────────────────
      await setTheme(page, 'dark');
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoAndCapture('', '07_기본화면_1440px_dark.png', false);
      await gotoAndCapture('', '08_전체페이지_1440px_dark.png', true);

      // ── 5. a11y scan (light, 1440px) ─────────────────────
      await setTheme(page, 'light');
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1, nav', { timeout: 15_000 }).catch(() => {});
      const results = await runAxe(page);
      assertNoHighImpact(results);

      // eslint-disable-next-line no-console -- 테스트 진행 로그
      console.log(`✅ [${label}] ${tabs.length + 5} screenshots + 2 dark + axe scan → ${outDir}`);
    });
  });
}
