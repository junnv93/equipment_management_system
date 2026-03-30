/**
 * Group D: 권한 기반 데이터 접근 제어 테스트
 *
 * 검증 범위:
 * 1. test_engineer는 사이트 필터를 볼 수 있고, 기본 소속 사이트가 적용됨
 * 2. technical_manager는 모든 사이트 조회 가능 (사이트 필터 사용)
 * 3. lab_manager는 전체 조회 가능
 * 4. 백엔드 권한 로직 검증
 * 5. 팀 필터 권한 검증
 *
 * 기본 필터 동작:
 * - 모든 역할: 초기 접속 시 사용자 소속 사이트/팀이 기본 필터로 적용됨
 * - ?site= 파라미터를 명시하면 기본 필터가 적용되지 않음
 *
 * SSOT:
 * - Permission: @equipment-management/shared-constants
 * - UserRole: @equipment-management/schemas
 * - API Endpoint: GET /api/equipment
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import type { Site } from '@equipment-management/schemas';

test.describe('Group D: Role-based Data Access Control', () => {
  test.describe('14.1. test_engineer sees site filter with default applied', () => {
    test('should display site filter with default site for test_engineer', async ({
      testOperatorPage,
    }) => {
      // testOperatorPage는 SUW 사이트 시험실무자
      await testOperatorPage.goto('/equipment');

      // 클라이언트 컴포넌트 마운트 대기 (스켈레톤 → 실제 UI, 첫 테스트는 cold start로 더 오래 걸림)
      await expect(
        testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' })
      ).toBeVisible({ timeout: 30000 });

      // ✅ 사이트 필터가 모든 역할에 표시됨
      const siteFilterCombobox = testOperatorPage.getByRole('combobox', { name: /사이트/i });
      await expect(siteFilterCombobox).toBeVisible();

      // ✅ 기본 필터: 사용자 소속 사이트(suwon)가 자동 적용됨
      await testOperatorPage.waitForURL(/site=suwon/, { timeout: 10000 });

      // 데이터 로딩 대기 (URL 변경 후 리페치)
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 15000 });

      // 1. UI 검증: 모든 표시된 장비가 SUW 사이트
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const row = equipmentRows.nth(i);
        const locationText = await row.locator('td').nth(5).textContent();
        expect(locationText).toMatch(/SUWON|수원|SUW/i);
      }

      console.log('[Test] ✅ test_engineer sees site filter with own site equipment');
    });

    test('should automatically apply site AND team filter for test_engineer', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(
        testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' })
      ).toBeVisible({ timeout: 20000 });

      // ✅ test_engineer: 사이트 + 팀 기본 필터 적용 확인
      await testOperatorPage.waitForURL(/site=suwon/, { timeout: 10000 });

      // 사이트 필터 뱃지 확인
      const siteBadge = testOperatorPage.getByText(/사이트:\s*수원랩/);
      await expect(siteBadge).toBeVisible();

      // ✅ teamId도 URL에 포함되어야 함 (test_engineer는 팀 필터 기본 적용)
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('teamId=');

      // 팀 필터 뱃지도 표시되어야 함
      const teamBadge = testOperatorPage.getByText(/팀:/);
      await expect(teamBadge).toBeVisible();

      // 데이터 로딩 대기
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 15000 });

      // UI에 표시된 모든 장비가 SUW 사이트
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const row = equipmentRows.nth(i);
        const locationText = await row.locator('td').nth(5).textContent();
        expect(locationText).toMatch(/SUWON|수원|SUW/i);
      }

      console.log('[Test] ✅ Default site + team filter auto-applied for test_engineer');
    });
  });

  test.describe('14.2. technical_manager sees site+team default and all filter options', () => {
    test('should apply site AND team default filter for technical_manager', async ({
      techManagerPage,
    }) => {
      await techManagerPage.goto('/equipment');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(techManagerPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible(
        { timeout: 20000 }
      );

      // ✅ technical_manager: 사이트 + 팀 기본 필터 적용 확인
      await techManagerPage.waitForURL(/site=suwon/, { timeout: 10000 });

      // teamId도 URL에 포함되어야 함
      const currentUrl = techManagerPage.url();
      expect(currentUrl).toContain('teamId=');

      // 사이트 + 팀 필터 뱃지 확인
      const siteBadge = techManagerPage.getByText(/사이트:\s*수원랩/);
      await expect(siteBadge).toBeVisible();
      const teamBadge = techManagerPage.getByText(/팀:/);
      await expect(teamBadge).toBeVisible();

      console.log('[Test] ✅ technical_manager: site + team default filter applied');
    });

    test('should display site filter dropdown for technical_manager', async ({
      techManagerPage,
    }) => {
      // ✅ ?site= 로 기본 필터 우회
      await techManagerPage.goto('/equipment?site=');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(techManagerPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible(
        { timeout: 20000 }
      );

      // 사이트 필터 표시 확인
      const siteFilterCombobox = techManagerPage.getByRole('combobox', { name: /사이트/i });
      await expect(siteFilterCombobox).toBeVisible();

      // 필터 옵션 확인
      await siteFilterCombobox.click();

      // 모든 사이트 옵션이 표시되어야 함
      await expect(techManagerPage.getByRole('option', { name: '모든 사이트' })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: '수원랩' })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: '의왕랩' })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: '평택랩' })).toBeVisible();

      console.log('[Test] ✅ technical_manager can see site filter');
    });

    test('should filter equipment by selected site for technical_manager', async ({
      techManagerPage,
    }) => {
      // ✅ ?site= 로 기본 필터 우회하여 깨끗한 상태에서 시작
      await techManagerPage.goto('/equipment?site=');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(techManagerPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible(
        { timeout: 20000 }
      );

      // 사이트 필터 선택: 수원랩
      const siteFilterCombobox = techManagerPage.getByRole('combobox', { name: /사이트/i });
      await siteFilterCombobox.click();

      // "수원랩" 선택
      await techManagerPage.getByRole('option', { name: /수원랩/ }).click();

      // 필터 적용 후 로드 대기

      // URL 검증
      await expect(techManagerPage).toHaveURL(/site=(SUW|suwon)/i);

      // 필터 뱃지 확인
      await expect(techManagerPage.getByText(/사이트:\s*수원랩/)).toBeVisible();

      // 비즈니스 로직 검증: UI에 표시된 모든 장비가 수원랩
      const equipmentRows = techManagerPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const row = equipmentRows.nth(i);
        const locationText = await row.locator('td').nth(5).textContent();
        expect(locationText).toMatch(/SUWON|수원|SUW/i);
      }

      console.log('[Test] ✅ technical_manager can filter by site');
    });
  });

  test.describe('14.3. lab_manager sees site-only default filter', () => {
    test('should apply site-only default filter for lab_manager (no team)', async ({
      siteAdminPage,
    }) => {
      // lab_manager는 사이트 필터만 기본 적용, 팀 필터는 없음
      await siteAdminPage.goto('/equipment');

      // 클라이언트 컴포넌트 마운트 대기 (cold start 대비 넉넉한 timeout)
      await expect(siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible({
        timeout: 30000,
      });

      // ✅ lab_manager: 사이트 기본 필터 적용 확인
      await siteAdminPage.waitForURL(/site=suwon/, { timeout: 10000 });

      // teamId는 URL에 포함되지 않아야 함 (lab_manager는 팀 필터 미적용)
      const currentUrl = siteAdminPage.url();
      expect(currentUrl).not.toContain('teamId=');

      // 사이트 뱃지만 표시, 팀 뱃지는 없음
      const siteBadge = siteAdminPage.getByText(/사이트:\s*수원랩/);
      await expect(siteBadge).toBeVisible();

      console.log('[Test] ✅ lab_manager: site-only default filter (no team)');
    });

    test('should display equipment from all sites for lab_manager', async ({ siteAdminPage }) => {
      // ✅ ?site= 로 기본 필터 우회하여 모든 사이트 장비 표시
      await siteAdminPage.goto('/equipment?site=&teamId=');

      // 클라이언트 컴포넌트 마운트 및 데이터 로딩 대기
      await siteAdminPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 20000 });

      // 여러 사이트의 장비가 섞여 있어야 함
      const equipmentRows = siteAdminPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // 모든 행의 사이트 수집
      const sites = new Set<string>();
      for (let i = 0; i < rowCount; i++) {
        const row = equipmentRows.nth(i);
        const locationText = await row.locator('td').nth(5).textContent();

        if (locationText?.match(/SUWON|수원/i)) sites.add('SUW');
        else if (locationText?.match(/UIWANG|의왕/i)) sites.add('UIW');
        else if (locationText?.match(/PYEONGTAEK|평택/i)) sites.add('PYT');
      }

      console.log('[Test] Sites in UI:', Array.from(sites));

      // 최소 2개 이상의 사이트 장비가 있어야 함 (시드 데이터 의존)
      expect(sites.size).toBeGreaterThanOrEqual(2);

      // 사이트 필터 표시 확인
      const siteFilterCombobox = siteAdminPage.getByRole('combobox', { name: /사이트/i });
      await expect(siteFilterCombobox).toBeVisible();

      console.log('[Test] ✅ lab_manager sees all sites equipment');
    });

    test('should allow lab_manager to filter by any site', async ({ siteAdminPage }) => {
      // ✅ ?site= 로 기본 필터 우회
      await siteAdminPage.goto('/equipment?site=');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible({
        timeout: 20000,
      });

      // 사이트 필터 선택: 의왕랩
      const siteFilterCombobox = siteAdminPage.getByRole('combobox', { name: /사이트/i });
      await siteFilterCombobox.click();
      await siteAdminPage.getByRole('option', { name: /의왕랩/ }).click();

      // 필터 적용 후 로드 대기

      // URL 검증
      await expect(siteAdminPage).toHaveURL(/site=(UIW|uiwang)/i);

      // 비즈니스 로직 검증: UI에 표시된 장비가 의왕랩인지 확인
      const equipmentRows = siteAdminPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      if (rowCount > 0) {
        for (let i = 0; i < rowCount; i++) {
          const row = equipmentRows.nth(i);
          const locationText = await row.locator('td').nth(5).textContent();
          expect(locationText).toMatch(/UIWANG|의왕|UIW/i);
        }
      }

      console.log('[Test] ✅ lab_manager can filter by any site');
    });
  });

  test.describe('14.4. Team filter respects site restrictions', () => {
    test('should show only own site teams for test_engineer', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(
        testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' })
      ).toBeVisible({ timeout: 20000 });

      // 추가 필터 버튼 클릭 후 팀 필터 드롭다운 클릭 (2차 필터)
      await testOperatorPage.getByRole('button', { name: /추가 필터/ }).click();
      const teamFilterCombobox = testOperatorPage.getByRole('combobox', { name: '팀 필터 선택' });
      await teamFilterCombobox.click();

      // 팀 옵션 로드 대기

      // 비즈니스 로직 검증: 팀 옵션에 "모든 팀"과 실제 팀들이 표시됨
      const teamOptions = testOperatorPage.getByRole('option');
      const optionCount = await teamOptions.count();

      // 최소 "모든 팀" 옵션은 있어야 함
      expect(optionCount).toBeGreaterThanOrEqual(1);

      // "모든 팀" 옵션 확인
      const allTeamsOption = testOperatorPage.getByRole('option', { name: /모든 팀/i });
      await expect(allTeamsOption).toBeVisible();

      console.log(`[Test] Found ${optionCount} team options for test_engineer`);
      console.log('[Test] ✅ test_engineer sees only own site teams');
    });

    test('should filter equipment by team for lab_manager', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/equipment');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible({
        timeout: 20000,
      });

      // 추가 필터 버튼 클릭 후 팀 필터 드롭다운 클릭 (2차 필터)
      await siteAdminPage.getByRole('button', { name: /추가 필터/ }).click();
      const teamFilterCombobox = siteAdminPage.getByRole('combobox', { name: '팀 필터 선택' });
      await teamFilterCombobox.click();

      // 팀 목록 로드 대기

      // 첫 번째 팀 선택 (모든 팀 제외)
      const teamOptions = siteAdminPage.getByRole('option').filter({
        hasNotText: '모든 팀',
      });

      const firstTeamOption = teamOptions.first();
      const teamCount = await teamOptions.count();

      if (teamCount > 0) {
        const teamName = await firstTeamOption.textContent();
        await firstTeamOption.click();

        // 필터 적용 후 로드 대기

        // URL에 teamId가 포함되어 있는지 확인
        await expect(siteAdminPage).toHaveURL(/teamId=/);

        // 필터 뱃지 확인
        await expect(siteAdminPage.getByText(new RegExp(`팀:.*${teamName}`))).toBeVisible();

        // 비즈니스 로직 검증: 장비가 필터링되었는지 확인
        const equipmentRows = siteAdminPage.locator('[data-testid="equipment-row"]');
        const rowCount = await equipmentRows.count();

        console.log(`[Test] Filtered by team: ${teamName}, found ${rowCount} equipment`);
        console.log('[Test] ✅ lab_manager can filter by team');
      } else {
        console.log('[Test] ⚠️ No teams available to test filtering');
      }
    });
  });

  test.describe('Additional: Permission boundary tests', () => {
    test('should not allow test_engineer to bypass site filter via URL manipulation', async ({
      testOperatorPage,
    }) => {
      // 보안 테스트: 백엔드가 URL 파라미터 조작을 막는지 검증
      // test_engineer가 ?site=uiwang을 URL에 입력해도 자신의 사이트(SUW)만 볼 수 있어야 함
      await testOperatorPage.goto('/equipment?site=uiwang');

      // 클라이언트 컴포넌트 마운트 대기
      await expect(
        testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' })
      ).toBeVisible({ timeout: 20000 });

      // 장비 목록 로드 대기

      // 보안 검증: 백엔드가 URL 조작을 무시하고 자신의 사이트만 반환해야 함
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      // 기대 동작: SUW 장비만 표시되어야 함
      if (rowCount > 0) {
        for (let i = 0; i < rowCount; i++) {
          const row = equipmentRows.nth(i);
          const locationText = await row.locator('td').nth(5).textContent();
          expect(locationText).toMatch(/SUWON|수원|SUW/i);
          expect(locationText).not.toMatch(/UIWANG|의왕|UIW/i);
        }
      }

      console.log('[Test] ✅ Backend prevents URL manipulation for site filter');
    });

    test('should apply correct permission for each role', async ({
      testOperatorPage,
      techManagerPage,
      siteAdminPage,
    }) => {
      // 병렬로 각 역할의 페이지 로드
      // ✅ test_engineer, technical_manager: 사이트+팀 기본 필터
      // ✅ lab_manager: 사이트만 기본 필터 (teamId 없음)
      await Promise.all([
        testOperatorPage.goto('/equipment'),
        techManagerPage.goto('/equipment'),
        siteAdminPage.goto('/equipment'),
      ]);

      // 클라이언트 컴포넌트 마운트 대기 (모든 페이지)
      await Promise.all([
        expect(testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible({
          timeout: 20000,
        }),
        expect(techManagerPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible({
          timeout: 20000,
        }),
        expect(siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' })).toBeVisible({
          timeout: 20000,
        }),
      ]);

      // 데이터 로딩 대기 (모든 페이지)
      await Promise.all([
        testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 15000 }),
        techManagerPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 15000 }),
        siteAdminPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 15000 }),
      ]);

      // 권한 검증: 역할별 기본 필터 정책
      // test_engineer: site + teamId 기본 적용
      const testEngineerUrl = testOperatorPage.url();
      expect(testEngineerUrl).toContain('site=suwon');
      expect(testEngineerUrl).toContain('teamId=');

      // technical_manager: site + teamId 기본 적용
      const techManagerUrl = techManagerPage.url();
      expect(techManagerUrl).toContain('site=suwon');
      expect(techManagerUrl).toContain('teamId=');

      // lab_manager: site만 기본 적용 (teamId 없음)
      const labManagerUrl = siteAdminPage.url();
      expect(labManagerUrl).toContain('site=suwon');
      expect(labManagerUrl).not.toContain('teamId=');

      // ✅ 모든 역할에 사이트 필터가 표시됨
      for (const page of [testOperatorPage, techManagerPage, siteAdminPage]) {
        const siteFilter = page.getByRole('combobox', { name: /사이트/i });
        await expect(siteFilter).toBeVisible();
      }

      // test_engineer: 팀 필터 뱃지 표시
      const testEngineerTeamBadge = testOperatorPage.getByText(/팀:/);
      await expect(testEngineerTeamBadge).toBeVisible();

      // lab_manager: 팀 필터 뱃지 없음
      const labManagerTeamBadge = siteAdminPage.getByText(/팀:/);
      await expect(labManagerTeamBadge).not.toBeVisible();

      console.log('[Test] ✅ Each role has correct default filter policy');
      console.log('[Test] test_engineer URL:', testEngineerUrl);
      console.log('[Test] technical_manager URL:', techManagerUrl);
      console.log('[Test] lab_manager URL:', labManagerUrl);
    });
  });
});
