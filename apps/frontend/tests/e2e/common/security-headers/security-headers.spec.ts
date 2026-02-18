/**
 * 보안 헤더 검증 E2E 테스트
 *
 * 프론트엔드 및 백엔드 서버의 보안 헤더가 올바르게 설정되어 있는지 검증합니다.
 * - X-Frame-Options: 클릭재킹 방지
 * - X-Content-Type-Options: MIME 스니핑 방지
 * - Referrer-Policy: 리퍼러 정보 누출 방지
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Security Headers', () => {
  test('SH-01: Backend API 보안 헤더 검증', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/monitoring/health');

    const headers = response.headers();

    // X-Frame-Options: 클릭재킹 방지
    expect(headers['x-frame-options']).toBeTruthy();

    // X-Content-Type-Options: MIME 스니핑 방지
    expect(headers['x-content-type-options']).toBe('nosniff');

    // Referrer-Policy: 리퍼러 정보 제한
    expect(headers['referrer-policy']).toBeTruthy();
  });

  test('SH-02: Frontend 보안 헤더 검증', async ({ testOperatorPage: page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();

    const headers = response!.headers();

    // X-Frame-Options: 클릭재킹 방지
    expect(headers['x-frame-options']).toBeTruthy();

    // X-Content-Type-Options: MIME 스니핑 방지
    expect(headers['x-content-type-options']).toBe('nosniff');
  });
});
