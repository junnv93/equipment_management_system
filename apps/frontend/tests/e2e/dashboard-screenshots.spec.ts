/**
 * 역할별 대시보드 스크린샷 캡처 (디자인 리뷰용)
 * 실행: pnpm exec playwright test dashboard-screenshots --project=chromium --workers=1
 */
import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '.auth');
const OUTPUT_BASE = '/mnt/c/Users/kmjkd/Downloads/대시보드 리뷰/스크린샷';
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
    test.setTimeout(180_000); // 3분 (탭×goto 반복 여유 확보)

    test(`${label} — 역할별 대시보드 스크린샷`, async ({ page }) => {
      const outDir = path.join(OUTPUT_BASE, dir);
      fs.mkdirSync(outDir, { recursive: true });

      async function gotoAndCapture(query: string, filename: string, fullPage = true) {
        const url = query ? `${BASE_URL}/?${query}` : `${BASE_URL}/`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        // 로그인 리다이렉트 감지
        if (page.url().includes('/login')) {
          throw new Error(`인증 실패 — login으로 리다이렉트됨 (file: ${file})`);
        }
        // 콘텐츠 로딩 대기 — WelcomeHeader h1 또는 nav
        await page.waitForSelector('h1, nav', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(2000); // 애니메이션 완료
        await page.screenshot({ path: path.join(outDir, filename), fullPage });
      }

      // ── 1440×900 기본 뷰포트 ─────────────────────────────
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoAndCapture('', '01_기본화면_1440px.png', false);
      await gotoAndCapture('', '02_전체페이지_1440px.png', true);

      // ── 탭별 ─────────────────────────────────────────────
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        await gotoAndCapture(
          `tab=${tab}`,
          `03_탭_${String(i + 1).padStart(2, '0')}_${TAB_LABELS[tab] ?? tab}.png`,
          true
        );
      }

      // ── 반응형 뷰포트 ────────────────────────────────────
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoAndCapture('', '04_1280px_xl.png', true);

      await page.setViewportSize({ width: 1024, height: 768 });
      await gotoAndCapture('', '05_1024px_lg.png', true);

      await page.setViewportSize({ width: 768, height: 1024 });
      await gotoAndCapture('', '06_768px_tablet.png', true);

      console.log(`✅ [${label}] ${tabs.length + 4}장 저장 완료 → ${outDir}`);
    });
  });
}
