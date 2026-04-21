/**
 * 역할별 대시보드 스크린샷 캡처 스크립트 (storageState 기반)
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = '/tmp/dashboard-screenshots';
const AUTH_DIR = path.join(__dirname, 'apps/frontend/tests/e2e/.auth');

const ROLES = [
  { file: 'test-engineer.json', label: '시험실무자', key: 'test_engineer' },
  { file: 'technical-manager.json', label: '기술책임자', key: 'technical_manager' },
  { file: 'quality-manager.json', label: '품질책임자', key: 'quality_manager' },
  { file: 'lab-manager.json', label: '시험소장', key: 'lab_manager' },
  { file: 'system-admin.json', label: '시스템관리자', key: 'system_admin' },
];

async function captureRole(browser, roleInfo) {
  const storageState = path.join(AUTH_DIR, roleInfo.file);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState,
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const filename = `${OUTPUT_DIR}/${roleInfo.key}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`✓ ${roleInfo.label} (${roleInfo.key}) → ${filename}`);
  } catch (err) {
    console.error(`✗ ${roleInfo.label}: ${err.message}`);
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const role of ROLES) {
      await captureRole(browser, role);
    }
    console.log('\n모든 스크린샷 완료!');
  } finally {
    await browser.close();
  }
})();
