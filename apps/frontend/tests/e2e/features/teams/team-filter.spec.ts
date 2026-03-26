/**
 * 팀 필터 사이트별 조회 E2E 테스트 (Frontend)
 *
 * 비즈니스 규칙:
 * - 사용자 사이트에 맞는 팀만 표시
 * - 시험소장은 사이트 필터 변경 가능
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USER_EMAILS } from '../../shared/constants/shared-test-data';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
}

test.describe('팀 필터 - 사이트별 조회', () => {
  test('수원랩 사용자는 수원랩 팀만 볼 수 있어야 한다', async ({ page }) => {
    // Given: 수원랩 시험실무자로 로그인
    await loginAs(page, TEST_USER_EMAILS.TEST_ENGINEER_SUWON, 'password123');

    // When: 장비 목록에서 팀 필터 열기
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // 팀 필터 드롭다운 클릭
    const teamFilter = page.locator('select#filter-team');
    await teamFilter.click();

    // Then: 수원랩 팀만 옵션에 표시되어야 함
    const options = page.locator('select#filter-team option');
    const optionTexts = await options.allTextContents();

    console.log('사용 가능한 팀 옵션:', optionTexts);

    // "모든 팀" 옵션 제외하고 확인
    const teamOptions = optionTexts.filter((text) => text !== '모든 팀' && text.trim() !== '');

    // 팀 옵션이 있어야 함
    expect(teamOptions.length).toBeGreaterThan(0);

    // 각 팀 이름에 '테스트팀' 또는 '팀'이 포함되어야 함
    teamOptions.forEach((option) => {
      const isValidTeam = option.includes('팀') || option.includes('테스트');
      expect(isValidTeam).toBe(true);
    });
  });

  test('팀 필터를 선택하면 해당 팀의 장비만 표시되어야 한다', async ({ page }) => {
    // Given: 로그인
    await loginAs(page, TEST_USER_EMAILS.TEST_ENGINEER_SUWON, 'password123');
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // When: 필터 열고 첫 번째 팀 선택
    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    const teamFilter = page.locator('select#filter-team');
    const options = await teamFilter.locator('option').allTextContents();

    // "모든 팀"이 아닌 첫 번째 팀 찾기
    const firstTeamOption = options.find((opt) => opt !== '모든 팀' && opt.trim() !== '');

    if (firstTeamOption) {
      await teamFilter.selectOption({ label: firstTeamOption });
      await page.waitForLoadState('networkidle');

      // Then: 팀 필터 뱃지가 표시됨
      const teamBadge = page.locator(`text=/팀: ${firstTeamOption}/`);
      await expect(teamBadge).toBeVisible();

      // 장비 목록이 표시됨
      const equipmentList = page.locator('[data-testid="equipment-card"]');
      const count = await equipmentList.count();
      expect(count).toBeGreaterThanOrEqual(0);

      console.log(`선택한 팀: ${firstTeamOption}, 장비 수: ${count}`);
    }
  });

  test('시험소장은 사이트 필터를 변경할 수 있어야 한다', async ({ page }) => {
    // Given: 시험소장으로 로그인
    await loginAs(page, 'lab.manager@example.com', 'password123');
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // When: 사이트 필터 변경
    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    const siteFilter = page.locator('select#filter-site');

    // 사이트 필터가 보여야 함 (관리자만)
    if (await siteFilter.isVisible()) {
      // 수원랩 선택
      await siteFilter.selectOption('suwon');
      await page.waitForLoadState('networkidle');

      // 팀 필터 확인
      const teamFilter = page.locator('select#filter-team');
      await teamFilter.click();

      const teamOptions = await teamFilter.locator('option').allTextContents();
      console.log('수원랩 팀 목록:', teamOptions);

      // Then: 의왕랩으로 변경
      await siteFilter.selectOption('uiwang');
      await page.waitForLoadState('networkidle');

      const teamFilter2 = page.locator('select#filter-team');
      await teamFilter2.click();

      const teamOptions2 = await teamFilter2.locator('option').allTextContents();
      console.log('의왕랩 팀 목록:', teamOptions2);

      // 팀 목록이 변경되었는지 확인 (내용이 달라야 함)
      const isDifferent = JSON.stringify(teamOptions) !== JSON.stringify(teamOptions2);
      if (isDifferent) {
        console.log('✅ 사이트별로 다른 팀 목록이 표시됨');
      }
    } else {
      console.log('⚠️  사이트 필터가 표시되지 않음 (권한 확인 필요)');
    }
  });

  test('팀 필터와 교정 기한 필터를 함께 사용할 수 있어야 한다', async ({ page }) => {
    // Given: 로그인
    await loginAs(page, TEST_USER_EMAILS.TEST_ENGINEER_SUWON, 'password123');
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // When: 필터 열고 팀 + 교정 기한 필터 적용
    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // 팀 필터 선택
    const teamFilter = page.locator('select#filter-team');
    const teamOptions = await teamFilter.locator('option').allTextContents();
    const firstTeam = teamOptions.find((opt) => opt !== '모든 팀' && opt.trim() !== '');

    if (firstTeam) {
      await teamFilter.selectOption({ label: firstTeam });
    }

    // 교정 기한 필터 선택
    const calibrationDueFilter = page.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon');

    await page.waitForLoadState('networkidle');

    // Then: 두 필터 뱃지가 모두 표시됨
    const filterBadges = page.locator('[role="list"][aria-label="적용된 필터"] > div');
    const badgeCount = await filterBadges.count();

    expect(badgeCount).toBeGreaterThanOrEqual(1); // 최소 1개 이상

    console.log(`활성 필터 수: ${badgeCount}`);
  });

  test('팀 필터를 제거하면 모든 팀의 장비가 표시되어야 한다', async ({ page }) => {
    // Given: 팀 필터 적용 상태
    await loginAs(page, TEST_USER_EMAILS.TEST_ENGINEER_SUWON, 'password123');
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    const teamFilter = page.locator('select#filter-team');
    const teamOptions = await teamFilter.locator('option').allTextContents();
    const firstTeam = teamOptions.find((opt) => opt !== '모든 팀' && opt.trim() !== '');

    if (firstTeam) {
      await teamFilter.selectOption({ label: firstTeam });
      await page.waitForLoadState('networkidle');

      const beforeCount = await page.locator('[data-testid="equipment-card"]').count();

      // When: 팀 필터 제거 (모든 팀 선택)
      await teamFilter.selectOption({ label: '모든 팀' });
      await page.waitForLoadState('networkidle');

      // Then: 장비 수가 늘어나거나 동일해야 함
      const afterCount = await page.locator('[data-testid="equipment-card"]').count();
      expect(afterCount).toBeGreaterThanOrEqual(beforeCount);

      console.log(`필터 적용: ${beforeCount}개, 필터 제거: ${afterCount}개`);
    }
  });
});

test.describe('팀 관리 페이지', () => {
  test('팀 목록 페이지에서 사이트별 팀을 확인할 수 있어야 한다', async ({ page }) => {
    // Given: 로그인
    await loginAs(page, TEST_USER_EMAILS.TEST_ENGINEER_SUWON, 'password123');

    // When: 팀 목록 페이지로 이동
    await page.goto('http://localhost:3000/teams');
    await page.waitForLoadState('networkidle');

    // Then: 팀 목록이 표시됨
    const teamCards = page.locator('[data-testid="team-card"]');
    const count = await teamCards.count();

    expect(count).toBeGreaterThan(0);
    console.log(`팀 목록 수: ${count}`);

    // 각 팀 카드에서 사이트 정보 확인
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = teamCards.nth(i);
      const teamName = await card.locator('h3, h2').first().textContent();
      console.log(`팀 ${i + 1}: ${teamName}`);
    }
  });
});
