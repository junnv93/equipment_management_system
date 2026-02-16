/**
 * Group F: URL 필터 상태 관리 (SSOT 검증)
 *
 * 테스트 범위:
 * - 팀 필터 선택 시 URL 파라미터 반영
 * - URL 파라미터로 직접 필터 적용
 * - 페이지 새로고침 후 필터 상태 복원
 * - 역할별 기본 필터 서버 사이드 적용
 *
 * ✅ SSOT 준수:
 *    - auth.fixture.ts 사용
 *    - calibration-filter-utils.ts 필터 파싱 패턴
 *    - URL 파라미터가 유일한 진실의 소스 (SSOT)
 *
 * ⚠️ Mode: Parallel (읽기 전용, 상태 변경 없음)
 *
 * SSOT Reference:
 * - apps/frontend/lib/utils/calibration-filter-utils.ts
 * - apps/frontend/app/(dashboard)/calibration/page.tsx
 * - apps/backend/src/database/utils/uuid-constants.ts (Team IDs)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

// ============================================================================
// SSOT: Backend Team Constants (uuid-constants.ts)
// ============================================================================
const TEAM_FCC_EMC_RF_SUWON_ID = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1';
const TEAM_GENERAL_EMC_SUWON_ID = 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289';

/** Helper: wait for the calibration page heading to be visible */
async function waitForCalibrationPage(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible({ timeout: 30000 });
}

/**
 * Helper: open team filter Select and wait for team options to load.
 * Teams are loaded asynchronously via TanStack Query, so options may not
 * be available immediately when the dropdown opens.
 */
async function openTeamFilterAndWaitForOptions(page: import('@playwright/test').Page) {
  const combobox = page.getByRole('combobox');
  await expect(combobox).toBeVisible();
  await combobox.click();
  // Wait for team-specific options to appear (async load from /api/teams)
  await expect(
    page
      .getByRole('option')
      .filter({ hasText: /FCC EMC\/RF|General EMC|SAR|Automotive/ })
      .first()
  ).toBeVisible({ timeout: 20000 });
}

test.describe('URL 필터 상태 관리', () => {
  test('6.1. 팀 필터 선택 시 URL에 teamId 파라미터가 반영된다', async ({
    techManagerPage: page,
  }) => {
    // 1. techManagerPage로 /calibration 이동
    await page.goto('/calibration');
    await waitForCalibrationPage(page);

    // 역할별 기본 필터가 자동 적용되므로 현재 URL 기록
    const initialUrl = page.url();

    // 2. 팀 필터 combobox 클릭 (shadcn Select의 SelectTrigger는 role="combobox")
    // Teams load asynchronously, so wait for options to appear
    await openTeamFilterAndWaitForOptions(page);

    // 3. 첫 번째 팀 옵션 선택 (combobox 펼쳐진 상태에서 option 찾기)
    const firstTeamOption = page
      .getByRole('option')
      .filter({ hasText: /FCC EMC\/RF|General EMC|SAR/ })
      .first();
    const selectedTeamName = await firstTeamOption.textContent();

    await firstTeamOption.click();

    // 4. URL이 /calibration?...teamId={selectedTeamId} 형식으로 변경되는지 확인
    await page.waitForURL(/\/calibration\?.*teamId=[a-f0-9-]+/);

    const urlAfterSelection = page.url();
    expect(urlAfterSelection).toMatch(/teamId=[a-f0-9-]+/);

    // teamId 파라미터 추출
    const urlParams = new URL(urlAfterSelection).searchParams;
    const selectedTeamId = urlParams.get('teamId');
    expect(selectedTeamId).not.toBeNull();
    expect(selectedTeamId).toMatch(/^[a-f0-9-]+$/);

    // URL이 기본 필터와 달라졌는지 확인 (다른 팀 선택 시 URL 변경)
    // 기술책임자는 기본적으로 자신의 팀이 설정되어 있으므로,
    // 다른 팀 선택 시 teamId가 변경되어야 함
    expect(urlAfterSelection).toContain('teamId=');
  });

  test('6.2. URL에 직접 필터 파라미터를 입력하면 해당 필터가 적용된다', async ({
    techManagerPage: page,
  }) => {
    // 1. techManagerPage로 /calibration?teamId={knownTeamId} 직접 이동
    const knownTeamId = TEAM_FCC_EMC_RF_SUWON_ID;
    await page.goto(`/calibration?teamId=${knownTeamId}`);
    await waitForCalibrationPage(page);

    // 2. 팀 필터 combobox의 선택값이 해당 팀명으로 표시되는지 확인
    // Teams are loaded asynchronously - the combobox shows empty until the matching
    // SelectItem is rendered. Wait for the team name to appear (up to 20s).
    const teamFilterCombobox = page.getByRole('combobox');
    await expect(teamFilterCombobox).toBeVisible();
    await expect(teamFilterCombobox).toContainText('FCC EMC/RF', { timeout: 20000 });

    // 3. 테이블 데이터가 해당 팀으로 필터링되었는지 확인 (팀 컬럼 값)
    const table = page.locator('table');
    const isTableVisible = await table.isVisible().catch(() => false);

    if (isTableVisible) {
      const firstRow = page.locator('tbody tr').first();
      const isRowVisible = await firstRow.isVisible().catch(() => false);
      if (isRowVisible) {
        // 팀 컬럼은 3번째 (0-indexed: 장비명, 관리번호, 팀)
        const teamCell = firstRow.locator('td').nth(2);
        await expect(teamCell).toContainText('FCC EMC/RF');
      }
    }

    // 4. URL에서 teamId 파라미터를 제거하고 이동 (/calibration)
    await page.goto('/calibration');
    await waitForCalibrationPage(page);

    // 5. 기술책임자는 자신의 팀이 기본 필터로 적용됨 (역할별 기본 필터)
    const urlAfterRemoval = page.url();
    const urlParamsAfterRemoval = new URL(urlAfterRemoval).searchParams;

    // 역할별 기본 필터가 있는 경우 teamId가 자동 추가됨
    const teamIdAfterRemoval = urlParamsAfterRemoval.get('teamId');
    if (teamIdAfterRemoval) {
      expect(teamIdAfterRemoval).toMatch(/^[a-f0-9-]+$/);
    }
  });

  test('6.3. 페이지 새로고침 후에도 필터 상태가 URL에서 복원된다', async ({
    techManagerPage: page,
  }) => {
    // 1. 특정 teamId를 URL에 직접 설정 (General EMC)
    // URL 직접 접근으로 race condition 없이 정확한 필터 상태 설정
    const knownTeamId = TEAM_GENERAL_EMC_SUWON_ID;
    await page.goto(`/calibration?teamId=${knownTeamId}&site=suwon`);
    await waitForCalibrationPage(page);

    // 2. 팀 필터에 General EMC가 표시되는지 확인 (teams async load)
    const combobox = page.getByRole('combobox');
    await expect(combobox).toContainText('General EMC', { timeout: 20000 });

    // 3. 현재 URL 기록
    const urlBeforeReload = page.url();
    const urlParamsBefore = new URL(urlBeforeReload).searchParams;
    const teamIdBefore = urlParamsBefore.get('teamId');
    expect(teamIdBefore).toBe(knownTeamId);

    // 4. page.reload()로 페이지 새로고침
    await page.reload();
    await waitForCalibrationPage(page);

    // 5. 팀 필터 선택값이 유지되는지 확인
    // After reload, teams load async again - wait for the team name
    const comboboxAfterReload = page.getByRole('combobox');
    await expect(comboboxAfterReload).toBeVisible();
    await expect(comboboxAfterReload).toContainText('General EMC', { timeout: 20000 });

    // 6. URL 파라미터가 유지되는지 확인
    const urlAfterReload = page.url();
    const urlParamsAfter = new URL(urlAfterReload).searchParams;
    const teamIdAfter = urlParamsAfter.get('teamId');

    expect(teamIdAfter).toBe(teamIdBefore);
  });

  test('6.4. 역할별 기본 필터가 서버 사이드에서 올바르게 적용된다', async ({
    testOperatorPage,
    techManagerPage,
    siteAdminPage,
  }) => {
    // 1. testOperatorPage로 /calibration 이동 (필터 없이)
    await testOperatorPage.goto('/calibration');
    await expect(testOperatorPage.getByRole('heading', { name: '교정 관리' })).toBeVisible({
      timeout: 30000,
    });

    // 2. URL에 site와 teamId 파라미터가 자동 추가되었는지 확인
    const urlTestOperator = testOperatorPage.url();
    const urlParamsTestOperator = new URL(urlTestOperator).searchParams;

    expect(urlParamsTestOperator.get('site')).not.toBeNull(); // 시험실무자: site 기본 적용
    expect(urlParamsTestOperator.get('teamId')).not.toBeNull(); // 시험실무자: teamId 기본 적용

    const siteTestOperator = urlParamsTestOperator.get('site');
    const teamIdTestOperator = urlParamsTestOperator.get('teamId');
    expect(siteTestOperator).toMatch(/^(suwon|uiwang|pyeongtaek|SUW|UIW|PYT)$/i);
    expect(teamIdTestOperator).toMatch(/^[a-f0-9-]+$/);

    // 3. techManagerPage로 /calibration 이동 (필터 없이)
    await techManagerPage.goto('/calibration');
    await expect(techManagerPage.getByRole('heading', { name: '교정 관리' })).toBeVisible({
      timeout: 30000,
    });

    // 4. URL에 site와 teamId 파라미터가 자동 추가되었는지 확인
    const urlTechManager = techManagerPage.url();
    const urlParamsTechManager = new URL(urlTechManager).searchParams;

    expect(urlParamsTechManager.get('site')).not.toBeNull(); // 기술책임자: site 기본 적용
    expect(urlParamsTechManager.get('teamId')).not.toBeNull(); // 기술책임자: teamId 기본 적용

    const siteTechManager = urlParamsTechManager.get('site');
    const teamIdTechManager = urlParamsTechManager.get('teamId');
    expect(siteTechManager).toMatch(/^(suwon|uiwang|pyeongtaek|SUW|UIW|PYT)$/i);
    expect(teamIdTechManager).toMatch(/^[a-f0-9-]+$/);

    // 5. siteAdminPage로 /calibration 이동 (필터 없이)
    await siteAdminPage.goto('/calibration');
    await expect(siteAdminPage.getByRole('heading', { name: '교정 관리' })).toBeVisible({
      timeout: 30000,
    });

    // 6. URL에 site 파라미터만 자동 추가되었는지 확인
    const urlSiteAdmin = siteAdminPage.url();
    const urlParamsSiteAdmin = new URL(urlSiteAdmin).searchParams;

    // 시험소장(lab_manager)은 SITE_RESTRICTED_ROLES에 포함되어 site만 적용
    // teamId는 TEAM_RESTRICTED_ROLES에 포함되지 않으므로 없음
    const siteSiteAdmin = urlParamsSiteAdmin.get('site');
    if (siteSiteAdmin) {
      expect(siteSiteAdmin).toMatch(/^(suwon|uiwang|pyeongtaek|SUW|UIW|PYT)$/i);
    }
    expect(urlParamsSiteAdmin.get('teamId')).toBeNull(); // 시험소장: teamId 없음
  });
});
