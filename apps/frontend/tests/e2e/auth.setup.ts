/**
 * Playwright Auth Setup Project
 *
 * 5개 역할에 대해 browser-native 로그인을 수행하고
 * storageState(쿠키 + localStorage)를 .auth/ 디렉토리에 저장합니다.
 *
 * 이 파일은 모든 browser project 실행 전 1회만 실행됩니다.
 * (playwright.config.ts의 dependencies: ['setup'] 참조)
 *
 * 장점:
 * - Zero cookie parsing: 브라우저가 Set-Cookie를 자체 처리
 * - Zero CSRF management: signIn()이 CSRF를 자동 처리
 * - Zero hardcoded waits: waitForURL이 실제 redirect 완료를 감지
 * - 실제 프로덕션 플로우 검증: 로그인 UI 자체도 테스트됨
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '.auth');

/**
 * 역할별 설정
 * - role: 백엔드 역할 식별자
 * - label: DevLoginButtons의 버튼 텍스트 (getByRole 매칭용)
 * - file: storageState 저장 파일명
 */
const ROLES = [
  { role: 'test_engineer', label: '시험실무자', file: 'test-engineer.json' },
  { role: 'technical_manager', label: '기술책임자', file: 'technical-manager.json' },
  { role: 'quality_manager', label: '품질책임자', file: 'quality-manager.json' },
  { role: 'lab_manager', label: '시험소장', file: 'lab-manager.json' },
  { role: 'system_admin', label: '시스템 관리자', file: 'system-admin.json' },
] as const;

// .auth 디렉토리 보장
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

for (const { role, label, file } of ROLES) {
  const outputPath = path.join(AUTH_DIR, file);

  setup(`authenticate as ${role}`, async ({ page }) => {
    // 1. 로그인 페이지 이동
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 2. DevLoginButtons의 역할 버튼 클릭
    //    기본 팀: 수원 FCC EMC/RF (DevLoginButtons의 초기값)
    const button = page.getByRole('button', { name: label });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();

    // 3. NextAuth redirect 완료 대기 (로그인 → 대시보드)
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    // 4. storageState 저장 (쿠키 + localStorage)
    await page.context().storageState({ path: outputPath });
  });
}

// site-admin.json alias 생성 (seed-parallel-group-1.spec.ts 호환)
setup('create site-admin alias', async () => {
  const src = path.join(AUTH_DIR, 'lab-manager.json');
  const dst = path.join(AUTH_DIR, 'site-admin.json');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
  }
});
