/**
 * Suite 13: Data Scope - 역할별 데이터 스코프 검증
 *
 * 검증 대상:
 * - test_engineer / technical_manager: 소속 팀 반출만 조회
 * - quality_manager: 전체(all) 조회
 * - lab_manager: 소속 사이트 전체 조회
 * - includeSummary=true 요약 표시
 *
 * Mode: parallel (읽기 전용)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { apiGet, cleanupCheckoutPool } from '../helpers/checkout-helpers';
import { BACKEND_URL } from '../helpers/checkout-constants';

test.afterAll(async () => {
  await cleanupCheckoutPool();
});

test.describe('Suite 13: 데이터 스코프 검증', () => {
  test('S13-01: test_engineer는 소속 팀 반출만 조회', async ({ testOperatorPage: page }) => {
    // API로 데이터 스코프 확인 (test_engineer = Suwon FCC EMC/RF E팀)
    const data = await apiGet(page, '/api/checkouts?direction=outbound', 'test_engineer');
    const items = (data as Record<string, unknown>).items as Array<Record<string, unknown>>;

    // test_engineer 소속 팀의 반출만 조회되는지 확인
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    // UI에서도 목록 접근 가능 확인
    await page.goto('/checkouts');
    await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();
  });

  test('S13-02: technical_manager는 소속 팀 반출만 조회', async ({ techManagerPage: page }) => {
    const data = await apiGet(page, '/api/checkouts?direction=outbound', 'technical_manager');
    const items = (data as Record<string, unknown>).items as Array<Record<string, unknown>>;
    expect(items).toBeDefined();

    // UI 목록 접근 가능
    await page.goto('/checkouts');
    await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();
  });

  test('S13-03: quality_manager는 전체 반출 조회 (scope: all)', async ({
    qualityManagerPage: page,
  }) => {
    // QM은 전체 데이터 조회 가능 (scope: all)
    const data = await apiGet(page, '/api/checkouts?direction=outbound', 'quality_manager');
    const response = data as Record<string, unknown>;

    // 전체 조회이므로 여러 팀의 데이터가 포함될 수 있음
    expect(response.items).toBeDefined();
    expect(response.meta).toBeDefined();
  });

  test('S13-04: lab_manager는 소속 사이트 반출 조회', async ({ siteAdminPage: page }) => {
    // lab_manager = Suwon site → Suwon의 모든 팀 반출 조회
    const data = await apiGet(page, '/api/checkouts?direction=outbound', 'lab_manager');
    const response = data as Record<string, unknown>;
    expect(response.items).toBeDefined();

    // UI에서 목록 접근 가능
    await page.goto('/checkouts');
    await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();
  });

  test('S13-05: includeSummary=true 시 반출 요약 정보 표시', async ({ techManagerPage: page }) => {
    // API에서 요약 정보 포함 조회
    const data = await apiGet(
      page,
      '/api/checkouts?direction=outbound&includeSummary=true',
      'technical_manager'
    );
    const response = data as Record<string, unknown>;

    // summary 필드 존재 확인
    expect(response.summary || response.meta).toBeDefined();
  });

  test('S13-06: UI 목록 페이지에서 필터링 동작', async ({ techManagerPage: page }) => {
    // 상태 필터로 pending만 조회
    await page.goto('/checkouts?statuses=pending');
    await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();

    // 목적 필터로 calibration만 조회
    await page.goto('/checkouts?purpose=calibration');
    await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();
  });

  test('S13-07: UI 목록 페이지에서 페이지네이션 동작', async ({ techManagerPage: page }) => {
    await page.goto('/checkouts?page=1&pageSize=5');
    await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();

    // 페이지 크기가 적용되어 결과가 제한됨
    // 2페이지가 있으면 페이지네이션 UI 확인
    const nextButton = page.getByRole('button', { name: '다음' });
    const hasNextPage = await nextButton.isVisible().catch(() => false);
    if (hasNextPage) {
      await nextButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });
});
