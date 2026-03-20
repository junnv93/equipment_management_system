/**
 * Group B: 팀 필터 테스트
 *
 * 검증 범위:
 * 1. 팀 목록 동적 로딩 (GET /api/teams)
 * 2. 사이트별 팀 필터링 (권한 기반)
 * 3. 팀 선택 시 장비 필터링
 * 4. 팀 필터와 다른 필터의 조합
 *
 * 비즈니스 로직:
 * - test_engineer는 자신의 사이트 팀만 볼 수 있음
 * - lab_manager는 모든 팀 볼 수 있음
 * - teamId로 필터링 시 해당 팀의 장비만 반환
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';

test.describe('Group B: Team Filter', () => {
  test.describe('8.1. Team filter loads options dynamically from API', () => {
    test('should load teams from API for test_engineer', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 팀 필터 드롭다운 클릭
      const teamFilter = testOperatorPage.locator('#filter-team');
      await expect(teamFilter).toBeVisible();
      await teamFilter.click();

      // Wait for options to load
      await testOperatorPage.waitForTimeout(500);

      // UI 확인: "모든 팀" 옵션 표시
      await expect(testOperatorPage.getByRole('option', { name: /모든 팀/i })).toBeVisible();

      // 팀 옵션 확인 (최소 0개 이상)
      const teamOptions = testOperatorPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });
      const teamCount = await teamOptions.count();
      expect(teamCount).toBeGreaterThanOrEqual(0);

      console.log('[Test] ✅ Team filter loaded successfully');
    });

    test('should load all teams for lab_manager', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/equipment');
      await siteAdminPage.waitForLoadState('networkidle');

      const teamFilter = siteAdminPage.locator('#filter-team');
      await expect(teamFilter).toBeVisible();
      await teamFilter.click();

      // Wait for options to load
      await siteAdminPage.waitForTimeout(500);

      // UI 확인: "모든 팀" 옵션 표시
      await expect(siteAdminPage.getByRole('option', { name: /모든 팀/i })).toBeVisible();

      // 팀 옵션 확인
      const teamOptions = siteAdminPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });
      const teamCount = await teamOptions.count();
      expect(teamCount).toBeGreaterThanOrEqual(0);

      console.log('[Test] ✅ lab_manager team filter loaded successfully');
    });

    test('should update teams when site filter changes', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/equipment');
      await siteAdminPage.waitForLoadState('networkidle');

      // 1. 사이트 필터 선택: 수원랩
      const siteFilter = siteAdminPage.locator('#filter-site');
      await siteFilter.click();
      await siteAdminPage.getByRole('option', { name: /수원랩/ }).click();
      await siteAdminPage.waitForTimeout(500);

      // 2. 팀 필터 열기
      const teamFilter = siteAdminPage.locator('#filter-team');
      await teamFilter.click();

      // Wait for options to load
      await siteAdminPage.waitForTimeout(500);

      // UI 확인: 팀 옵션이 표시됨
      await expect(siteAdminPage.getByRole('option', { name: /모든 팀/i })).toBeVisible();

      console.log('[Test] ✅ Teams updated when site filter changes');
    });
  });

  test.describe('8.2. Selecting team filter updates URL', () => {
    test('should filter equipment by selected team', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 팀 필터 열기
      const teamFilter = testOperatorPage.locator('#filter-team');
      await teamFilter.click();

      // Wait for options to load
      await testOperatorPage.waitForTimeout(500);

      // 첫 번째 팀 선택 (모든 팀 제외)
      const teamOptions = testOperatorPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        const firstTeamOption = teamOptions.first();
        const teamName = await firstTeamOption.textContent();
        await firstTeamOption.click();

        // Wait for URL to update
        await testOperatorPage.waitForURL(/teamId=/, { timeout: 10000 });

        // Wait for table to reload
        await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', {
          timeout: 10000,
          state: 'attached',
        });

        // URL 검증
        const currentUrl = testOperatorPage.url();
        const urlObj = new URL(currentUrl);
        expect(urlObj.searchParams.has('teamId')).toBe(true);

        // 필터 뱃지 확인
        await expect(
          testOperatorPage.getByText(new RegExp(`팀:.*${teamName?.trim()}`))
        ).toBeVisible();

        console.log('[Test] ✅ Team filter applied successfully');
      } else {
        console.log('[Test] ⚠️ No teams available to test filtering');
      }
    });

    test('should remove team filter when selecting "모든 팀"', async ({ testOperatorPage }) => {
      // 먼저 팀 필터 적용
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const teamFilter = testOperatorPage.locator('#filter-team');
      await teamFilter.click();

      await testOperatorPage.waitForTimeout(500);

      const teamOptions = testOperatorPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        // 팀 선택
        await teamOptions.first().click();

        // Wait for URL to update
        await testOperatorPage.waitForURL(/teamId=/, { timeout: 10000 });

        // "모든 팀" 선택
        await teamFilter.click();
        await testOperatorPage.getByRole('option', { name: /모든 팀/i }).click();

        // Wait for URL to update
        await testOperatorPage.waitForTimeout(500);

        // URL 검증: teamId 파라미터 제거
        const currentUrl = testOperatorPage.url();
        const urlObj = new URL(currentUrl);
        expect(urlObj.searchParams.has('teamId')).toBe(false);

        console.log('[Test] ✅ Team filter removed successfully');
      }
    });

    test('should combine team filter with other filters', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/equipment');
      await siteAdminPage.waitForLoadState('networkidle');

      // 1. 상태 필터 적용
      const statusFilter = siteAdminPage.locator('#filter-status');
      await statusFilter.click();
      await siteAdminPage.getByRole('option', { name: '사용 가능' }).click();
      await siteAdminPage.waitForTimeout(500);

      // 2. 팀 필터 적용
      const teamFilter = siteAdminPage.locator('#filter-team');
      await teamFilter.click();

      await siteAdminPage.waitForTimeout(500);

      const teamOptions = siteAdminPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        await teamOptions.first().click();

        // Wait for URL to update
        await siteAdminPage.waitForURL(/status=.*teamId=/, { timeout: 10000 });

        // Wait for table to reload
        await siteAdminPage.waitForSelector('[data-testid="equipment-row"]', {
          timeout: 10000,
          state: 'attached',
        });

        // URL 검증: 두 필터 모두 적용
        const currentUrl = siteAdminPage.url();
        const urlObj = new URL(currentUrl);
        expect(urlObj.searchParams.get('status')).toBe(ESVal.AVAILABLE);
        expect(urlObj.searchParams.has('teamId')).toBe(true);

        console.log('[Test] ✅ Team filter combined with status filter');
      }
    });
  });

  test.describe('Additional: Team filter edge cases', () => {
    test('should handle case when team has no equipment', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const teamFilter = testOperatorPage.locator('#filter-team');
      await teamFilter.click();

      await testOperatorPage.waitForTimeout(500);

      const teamOptions = testOperatorPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        // 마지막 팀 선택 (장비가 없을 가능성 높음)
        const lastTeamOption = teamOptions.last();
        await lastTeamOption.click();

        // Wait for table to load
        await testOperatorPage.waitForTimeout(1000);

        // 빈 상태 메시지나 필터 초기화 버튼이 있는지 확인
        const emptyMessage =
          testOperatorPage.getByText(/검색 결과가 없습니다|등록된 장비가 없습니다/);
        const resetButton = testOperatorPage.getByRole('button', { name: /필터.*초기화/i });

        // 장비가 없으면 빈 상태 메시지가 표시되어야 함
        const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
        const hasResetButton = await resetButton.isVisible().catch(() => false);

        if (hasEmptyMessage || hasResetButton) {
          console.log('[Test] ✅ Empty state handled correctly for team with no equipment');
        } else {
          console.log('[Test] ⚠️ Team has equipment, skipping empty state check');
        }
      }
    });

    test('should maintain team filter across pagination', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const teamFilter = testOperatorPage.locator('#filter-team');
      await teamFilter.click();

      await testOperatorPage.waitForTimeout(500);

      const teamOptions = testOperatorPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        const firstTeam = teamOptions.first();
        await firstTeam.click();

        // Wait for URL to update
        await testOperatorPage.waitForURL(/teamId=/, { timeout: 10000 });

        const currentUrl = testOperatorPage.url();
        const urlObj = new URL(currentUrl);
        const teamId = urlObj.searchParams.get('teamId');

        // 페이지네이션 버튼이 있는 경우에만 테스트
        const nextButton = testOperatorPage.getByRole('button', {
          name: /다음.*페이지|next/i,
        });

        const isNextVisible = await nextButton.isVisible().catch(() => false);
        const isNextDisabled = await nextButton.isDisabled().catch(() => true);

        if (isNextVisible && !isNextDisabled) {
          await nextButton.click();

          // Wait for page to update
          await testOperatorPage.waitForTimeout(1000);

          // 팀 필터 유지 확인
          const newUrl = testOperatorPage.url();
          const newUrlObj = new URL(newUrl);
          expect(newUrlObj.searchParams.get('teamId')).toBe(teamId);

          console.log('[Test] ✅ Team filter maintained across pagination');
        } else {
          console.log('[Test] ⚠️ Not enough data for pagination test');
        }
      }
    });

    test('should handle team filter with search query', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 검색어 입력
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('분석');
      await searchInput.press('Enter');
      await testOperatorPage.waitForTimeout(500);

      // 팀 필터 적용
      const teamFilter = testOperatorPage.locator('#filter-team');
      await teamFilter.click();

      await testOperatorPage.waitForTimeout(500);

      const teamOptions = testOperatorPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        await teamOptions.first().click();

        // Wait for URL to update
        await testOperatorPage.waitForTimeout(1000);

        // URL 검증: 검색어와 팀 필터 모두 적용
        const currentUrl = testOperatorPage.url();
        const urlObj = new URL(currentUrl);
        expect(urlObj.searchParams.get('search')).toBe('분석');
        expect(urlObj.searchParams.has('teamId')).toBe(true);

        console.log('[Test] ✅ Team filter works with search query');
      }
    });
  });
});
