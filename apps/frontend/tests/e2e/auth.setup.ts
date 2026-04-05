/**
 * Playwright Auth Setup — API-based (Industry Standard)
 *
 * UI 로그인 대신 NextAuth API를 직접 호출하여 세션을 생성합니다.
 * 이 방식은 프론트엔드 렌더링 모드(dev/prod)와 완전히 독립적입니다.
 *
 * Flow:
 * 1. GET /api/auth/csrf → CSRF 토큰 획득
 * 2. POST /api/auth/callback/test-login → NextAuth가 세션 쿠키 생성
 * 3. storageState 저장 → 테스트에서 재사용
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '.auth');

const ROLES = [
  { role: 'test_engineer', file: 'test-engineer.json' },
  { role: 'technical_manager', file: 'technical-manager.json' },
  { role: 'quality_manager', file: 'quality-manager.json' },
  { role: 'lab_manager', file: 'lab-manager.json' },
  { role: 'system_admin', file: 'system-admin.json' },
] as const;

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

for (const { role, file } of ROLES) {
  const outputPath = path.join(AUTH_DIR, file);

  setup(`authenticate as ${role}`, async ({ page }) => {
    // 1. CSRF 토큰 획득 (NextAuth 보안 요구사항)
    const csrfResponse = await page.request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    // 2. NextAuth callback API로 직접 로그인 (UI 불필요)
    //    test-login CredentialsProvider의 authorize()가 백엔드 /api/auth/test-login 호출
    const signInResponse = await page.request.post('/api/auth/callback/test-login', {
      form: {
        csrfToken,
        role,
        json: 'true',
      },
    });

    // 3. 세션 생성 확인 — NextAuth가 Set-Cookie로 세션 토큰을 설정
    if (!signInResponse.ok()) {
      const text = await signInResponse.text();
      throw new Error(`Auth failed for ${role}: ${signInResponse.status()} ${text}`);
    }

    // 4. 세션 유효성 검증 — /api/auth/session이 사용자 정보를 반환하는지 확인
    const sessionResponse = await page.request.get('/api/auth/session');
    const session = await sessionResponse.json();
    if (!session?.user?.email) {
      throw new Error(`Session not created for ${role}: ${JSON.stringify(session)}`);
    }

    // 5. i18n: ko 로케일 고정
    await page.context().addCookies([
      {
        name: 'NEXT_LOCALE',
        value: 'ko',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
        sameSite: 'Lax',
      },
    ]);

    // 6. storageState 저장
    await page.context().storageState({ path: outputPath });
  });
}

// site-admin.json alias
setup('create site-admin alias', async () => {
  const src = path.join(AUTH_DIR, 'lab-manager.json');
  const dst = path.join(AUTH_DIR, 'site-admin.json');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
  }
});
