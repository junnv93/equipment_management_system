/**
 * 시스템 모니터링(Monitoring) 대시보드 E2E 테스트
 *
 * 검증 대상:
 * - RBAC: MANAGE_SYSTEM_SETTINGS 권한 필요
 * - KPI 스트립 렌더링 (CPU, Memory, Requests, Error Rate)
 * - 서비스 헬스 카드
 * - HTTP 통계 카드
 * - 캐시 성능 카드
 * - 권한 없는 역할 리다이렉트
 */
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시스템 모니터링 대시보드', () => {
  test('TC-01: 시스템 관리자가 모니터링 페이지에 접근할 수 있다', async ({
    systemAdminPage: page,
  }) => {
    await page.goto('/admin/monitoring');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('TC-02: 시험실무자는 모니터링 페이지에 접근할 수 없다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/admin/monitoring');

    // MANAGE_SYSTEM_SETTINGS 없으면 /dashboard로 리다이렉트
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 10000 });
    expect(page.url()).not.toContain('/admin/monitoring');
  });

  test('TC-03: 기술책임자도 모니터링 페이지에 접근할 수 없다', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/monitoring');

    // 리다이렉트 확인
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 10000 });
    expect(page.url()).not.toContain('/admin/monitoring');
  });

  test('TC-04: KPI 스트립이 CPU, Memory 등 지표를 표시한다', async ({ systemAdminPage: page }) => {
    await page.goto('/admin/monitoring');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // KPI 지표 텍스트 확인 (CPU, Memory, 요청 등)
    const cpuText = page.getByText(/CPU/i);
    await expect(cpuText.first()).toBeVisible({ timeout: 15000 });

    const memoryText = page.getByText(/Memory|메모리/i);
    await expect(memoryText.first()).toBeVisible();
  });

  test('TC-05: 서비스 헬스 섹션이 표시된다', async ({ systemAdminPage: page }) => {
    await page.goto('/admin/monitoring');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 서비스 헬스 카드 영역 (Database, API, Cache 등)
    const serviceSection = page.getByText(/서비스 상태|Service Health|Database/i);
    await expect(serviceSection.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-06: HTTP 통계 섹션이 표시된다', async ({ systemAdminPage: page }) => {
    await page.goto('/admin/monitoring');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // HTTP 통계 영역
    const httpSection = page.getByText(/HTTP|요청|Request/i);
    await expect(httpSection.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-07: 캐시 성능 섹션이 표시된다', async ({ systemAdminPage: page }) => {
    await page.goto('/admin/monitoring');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 캐시 성능 영역
    const cacheSection = page.getByText(/캐시|Cache/i);
    await expect(cacheSection.first()).toBeVisible({ timeout: 15000 });
  });
});
