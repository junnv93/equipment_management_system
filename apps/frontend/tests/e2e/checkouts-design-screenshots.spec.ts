/**
 * 반출입 페이지 — 역할별 디자인 리뷰 스크린샷 캡처
 * 실행: pnpm exec playwright test checkouts-design-screenshots --project=chromium --workers=1
 */
import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '.auth');
const OUTPUT_BASE = '/mnt/c/Users/kmjkd/Downloads/반출입 페이지 리뷰/스크린샷';
const BASE_URL = 'http://localhost:3000';

const CHECKOUT_001_ID = '10000000-0000-0000-0000-000000000001';

const ROLES = [
  { label: '시험실무자', file: 'test-engineer.json', dir: '01_시험실무자_test_engineer' },
  { label: '기술책임자', file: 'technical-manager.json', dir: '02_기술책임자_technical_manager' },
  { label: '품질책임자', file: 'quality-manager.json', dir: '03_품질책임자_quality_manager' },
  { label: '시험소장', file: 'lab-manager.json', dir: '04_시험소장_lab_manager' },
  { label: '시스템관리자', file: 'system-admin.json', dir: '05_시스템관리자_system_admin' },
  { label: '사이트관리자', file: 'site-admin.json', dir: '06_사이트관리자_site_admin' },
] as const;

for (const { label, file, dir } of ROLES) {
  test.describe(`${label} 반출입 페이지`, () => {
    test.use({ storageState: path.join(AUTH_DIR, file) });
    test.setTimeout(180_000);

    test(`${label} — 반출입 디자인 스크린샷`, async ({ page }) => {
      const outDir = path.join(OUTPUT_BASE, dir);
      fs.mkdirSync(outDir, { recursive: true });

      async function gotoAndCapture(urlPath: string, filename: string, fullPage = true) {
        await page.goto(`${BASE_URL}${urlPath}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        if (page.url().includes('/login')) {
          throw new Error(`인증 실패 — login으로 리다이렉트됨 (file: ${file})`);
        }
        await page.waitForSelector('h1, nav', { timeout: 15_000 }).catch(() => {});
        // Tabs/카드 렌더 안정화
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(outDir, filename), fullPage });
      }

      // ── 1440×900 기본 뷰포트 ─────────────────────────────
      await page.setViewportSize({ width: 1440, height: 900 });

      // 1) 목록 — 반출 탭 (above-fold)
      await gotoAndCapture('/checkouts', '01_목록_반출_above_fold_1440px.png', false);
      // 2) 목록 — 반출 탭 (full page)
      await gotoAndCapture('/checkouts', '02_목록_반출_full_1440px.png', true);
      // 3) 목록 — 반입 탭
      await gotoAndCapture('/checkouts?tab=inbound', '03_목록_반입_full_1440px.png', true);
      // 4) 상세 페이지
      await gotoAndCapture(`/checkouts/${CHECKOUT_001_ID}`, '04_상세_full_1440px.png', true);
      await gotoAndCapture(`/checkouts/${CHECKOUT_001_ID}`, '05_상세_above_fold_1440px.png', false);

      // ── 반응형 1280px ────────────────────────────────────
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoAndCapture('/checkouts', '06_목록_1280px_xl.png', true);

      // ── 반응형 1024px ────────────────────────────────────
      await page.setViewportSize({ width: 1024, height: 768 });
      await gotoAndCapture('/checkouts', '07_목록_1024px_lg.png', true);

      console.log(`✅ [${label}] 7장 저장 완료 → ${outDir}`);
    });
  });
}
