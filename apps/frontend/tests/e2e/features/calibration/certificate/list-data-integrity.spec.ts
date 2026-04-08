/**
 * Group A: 교정 목록 데이터 통합 검증
 *
 * 테스트 범위:
 * - 통계 카드 UI 표시 및 합리성 검증
 * - 테이블 렌더링 및 컬럼 헤더 검증
 * - 기한 초과 탭의 날짜 검증
 * - 30일 이내 예정 탭의 상태 배지 검증
 * - 장비명 클릭 시 상세 페이지 이동 검증
 * - 교정 정보 등록 버튼의 equipmentId 전달 검증
 *
 * ✅ SSOT 준수:
 *    - auth.fixture.ts 사용
 *    - API interception 없이 UI 요소만 검증
 *    - Playwright Best Practices 적용
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

/** Helper: parse a number from a stat card value like "5대" → 5 */
function parseStatValue(text: string | null): number {
  return parseInt(text?.replace(/[^0-9]/g, '') || '0', 10);
}

test.describe('교정 목록 데이터 통합 검증', () => {
  test('1.1. 통계 카드가 올바르게 표시되고 수치가 합리적이다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 페이지 이동 및 로드 대기
    await page.goto('/calibration');
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

    // 2. 전체 교정 장비 카드 검증
    await expect(page.getByText('전체 교정 장비')).toBeVisible();
    const totalValue = parseStatValue(
      await page.getByTestId('calibration-stat-total').textContent()
    );
    expect(totalValue).toBeGreaterThanOrEqual(0);

    // 3. 정상 장비 카드 검증
    await expect(page.getByText('정상 장비')).toBeVisible();
    const normalValue = parseStatValue(
      await page.getByTestId('calibration-stat-compliant').textContent()
    );
    expect(normalValue).toBeGreaterThanOrEqual(0);

    // 4. 교정 기한 초과 카드 검증
    await expect(page.getByText('교정 기한 초과')).toBeVisible();
    const overdueValue = parseStatValue(
      await page.getByTestId('calibration-stat-overdue').textContent()
    );
    expect(overdueValue).toBeGreaterThanOrEqual(0);

    // 5. 30일 이내 교정 필요 카드 검증
    await expect(page.getByText('30일 이내 교정 필요')).toBeVisible();
    const upcomingValue = parseStatValue(
      await page.getByTestId('calibration-stat-upcoming').textContent()
    );
    expect(upcomingValue).toBeGreaterThanOrEqual(0);

    // 6. 합리성 검증: 정상 장비 = 전체 - 기한 초과
    expect(normalValue).toBe(totalValue - overdueValue);
  });

  test('1.2. 전체 탭에 테이블이 렌더링되고 컬럼 헤더가 올바르다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 페이지 이동
    await page.goto('/calibration');
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

    // 2. 전체 탭이 기본 활성인지 확인
    const allTab = page.getByRole('tab', { name: '전체' });
    await expect(allTab).toHaveAttribute('data-state', 'active');

    // 3. 데이터 로드 대기 - 로딩 메시지가 사라질 때까지 대기
    await expect(page.getByText('데이터를 불러오는 중...')).toBeHidden({ timeout: 15000 });

    // 4. 테이블 또는 빈 상태 확인
    const table = page.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 5. 테이블 행 수가 1개 이상인지 확인
      const rowCount = await page.locator('tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);

      // 6. 컬럼 헤더 검증 (exact text로 ambiguous match 방지)
      await expect(page.locator('th').filter({ hasText: '장비명' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: '관리번호' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: /^팀$/ })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: /^교정일$/ })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: '다음 교정일' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: '교정 기관' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: /^상태$/ })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: /^관리$/ })).toBeVisible();
    } else {
      // 빈 상태 표시 확인
      await expect(page.getByText('교정 정보가 없습니다')).toBeVisible();
    }
  });

  test('1.3. 기한 초과 탭의 모든 항목이 "기한 초과" 상태를 표시한다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 페이지 이동
    await page.goto('/calibration');
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

    // 2. 기한 초과 탭 클릭
    const overdueTab = page.getByRole('tab', { name: '기한 초과' });
    await overdueTab.click();
    await expect(overdueTab).toHaveAttribute('data-state', 'active');

    // 3. 테이블 또는 빈 상태 확인
    const table = page.locator('table');
    const emptyMessage = page.getByText('교정 정보가 없습니다');
    await expect(table.or(emptyMessage).first()).toBeVisible();

    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // 4. 각 행의 상태 컬럼(7번째, 0-indexed: 6)이 "기한 초과"를 표시하는지 검증
      for (let i = 0; i < rowCount; i++) {
        const statusCell = rows.nth(i).locator('td').nth(6);
        await expect(statusCell).toContainText('기한 초과');
      }
    }
  });

  test('1.4. 30일 이내 예정 탭의 항목이 "N일 남음" 상태를 표시한다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 페이지 이동
    await page.goto('/calibration');
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

    // 2. 30일 이내 예정 탭 클릭
    const upcomingTab = page.getByRole('tab', { name: '30일 이내 예정' });
    await upcomingTab.click();
    await expect(upcomingTab).toHaveAttribute('data-state', 'active');

    // 3. 테이블 또는 빈 상태 확인
    const table = page.locator('table');
    const emptyMessage = page.getByText('교정 정보가 없습니다');
    await expect(table.or(emptyMessage).first()).toBeVisible();

    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // 4. 첫 번째 행의 상태 컬럼이 "N일 남음" 패턴을 표시하는지 검증
      const firstRowStatus = rows.first().locator('td').nth(6);
      await expect(firstRowStatus).toBeVisible();
      const statusText = await firstRowStatus.textContent();

      // "N일 남음" 형태 (N은 1~30 사이)
      const match = statusText?.match(/(\d+)일 남음/);
      expect(match).not.toBeNull();
      const daysRemaining = parseInt(match![1], 10);
      expect(daysRemaining).toBeGreaterThanOrEqual(0);
      expect(daysRemaining).toBeLessThanOrEqual(30);
    }
  });

  test('1.5. 장비명 클릭 시 해당 장비 상세 페이지로 정확히 이동한다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 페이지 이동
    await page.goto('/calibration');
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

    // 2. 테이블 확인
    const table = page.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 3. 첫 번째 행의 장비명 링크 클릭
      const firstRow = page.locator('tbody tr').first();
      const equipmentLink = firstRow.locator('td').first().locator('a');
      await expect(equipmentLink).toBeVisible();

      const equipmentName = await equipmentLink.textContent();

      await equipmentLink.click();

      // 4. URL이 /equipment/{uuid} 패턴으로 변경되는지 검증
      await page.waitForURL(/\/equipment\/[a-f0-9-]+$/);

      // 5. 상세 페이지 제목에 장비명이 표시되는지 검증
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(equipmentName!.trim());
    }
  });

  test('1.6. 교정 등록 버튼 클릭 시 올바른 equipmentId가 전달된다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 페이지 이동
    await page.goto('/calibration');
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

    // 2. 테이블 확인
    const table = page.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 3. 첫 번째 행의 "교정 등록" 버튼 클릭
      const firstRow = page.locator('tbody tr').first();
      const registerButton = firstRow.getByRole('button', { name: /교정 등록/ });
      await expect(registerButton).toBeVisible();

      await registerButton.click();

      // 4. URL에 equipmentId 쿼리 파라미터가 포함되었는지 검증
      await page.waitForURL(/\/calibration\/register\?equipmentId=[a-f0-9-]+/);

      const currentUrl = page.url();
      const urlParams = new URL(currentUrl).searchParams;
      const equipmentId = urlParams.get('equipmentId');
      expect(equipmentId).not.toBeNull();
      expect(equipmentId).toMatch(/^[a-f0-9-]+$/);

      // 5. 교정 등록 폼이 로드되었는지 확인
      await expect(page.getByRole('heading', { name: /교정 정보 등록/ })).toBeVisible();
    }
  });
});
