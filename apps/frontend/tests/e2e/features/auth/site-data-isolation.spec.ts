/**
 * Site Data Isolation E2E Tests
 *
 * @SiteScoped 인터셉터가 역할별 데이터 스코프를 올바르게 적용하는지 검증합니다.
 *
 * 검증 대상 정책 (data-scope.ts):
 * - EQUIPMENT_DATA_SCOPE: test_engineer → site (자기 사이트만)
 * - TEAMS_SITE_RESTRICTED_ROLES: test_engineer → 자기 사이트 팀만
 * - lab_manager, system_admin → 전체 데이터 접근
 *
 * 검증 방식: getBackendToken() → JWT 토큰 직접 발급 → 백엔드 API 호출
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { getBackendToken } from '../checkouts/helpers/checkout-helpers';
import { TEST_EQUIPMENT_IDS, BASE_URLS } from '../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

// 수원 사이트 장비 ID (검증용)
const SUWON_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;
// 의왕 사이트 장비 ID (test_engineer가 볼 수 없어야 함)
const UIWANG_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.RECEIVER_UIW_W;
// 의왕 팀 ID
const UIWANG_TEAM_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';

// ============================================================================
// 장비 데이터 격리 (EQUIPMENT_DATA_SCOPE)
// ============================================================================

test.describe('장비 데이터 격리 (EQUIPMENT_DATA_SCOPE)', () => {
  test('TC-01: test_engineer는 자기 사이트(suwon) 장비만 조회된다', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.get(`${BACKEND_URL}/api/equipment?pageSize=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const equipmentList = body.data ?? body;
    const ids = equipmentList.map((e: { id: string }) => e.id);

    // suwon 장비는 포함되어야 함
    expect(ids).toContain(SUWON_EQUIPMENT_ID);

    // uiwang 장비는 포함되지 않아야 함 (사이트 스코프 격리)
    expect(ids).not.toContain(UIWANG_EQUIPMENT_ID);
  });

  test('TC-02: lab_manager는 전체 사이트 장비를 조회할 수 있다', async ({
    siteAdminPage: page,
  }) => {
    const token = await getBackendToken(page, 'lab_manager');

    const response = await page.request.get(`${BACKEND_URL}/api/equipment?pageSize=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const equipmentList = body.data ?? body;
    const ids = equipmentList.map((e: { id: string }) => e.id);

    // suwon 장비도 있어야 함
    expect(ids).toContain(SUWON_EQUIPMENT_ID);
    // uiwang 장비도 있어야 함 (전체 스코프)
    expect(ids).toContain(UIWANG_EQUIPMENT_ID);
  });

  test('TC-03: system_admin은 전체 사이트 장비를 조회할 수 있다', async ({
    systemAdminPage: page,
  }) => {
    const token = await getBackendToken(page, 'system_admin');

    const response = await page.request.get(`${BACKEND_URL}/api/equipment?pageSize=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const equipmentList = body.data ?? body;
    const ids = equipmentList.map((e: { id: string }) => e.id);

    expect(ids).toContain(SUWON_EQUIPMENT_ID);
    expect(ids).toContain(UIWANG_EQUIPMENT_ID);
  });
});

// ============================================================================
// 팀 데이터 격리 (TEAMS_SITE_RESTRICTED_ROLES)
// ============================================================================

test.describe('팀 데이터 격리 (TEAMS_SITE_RESTRICTED_ROLES)', () => {
  test('TC-04: test_engineer는 자기 사이트(suwon) 팀만 조회된다', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.get(`${BACKEND_URL}/api/teams?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const teamList = body.data ?? body;
    const teamIds = teamList.map((t: { id: string }) => t.id);
    const sites = teamList.map((t: { site: string }) => t.site);

    // uiwang 팀은 포함되지 않아야 함
    expect(teamIds).not.toContain(UIWANG_TEAM_ID);

    // 모든 팀이 suwon 사이트여야 함
    for (const site of sites) {
      expect(site).toBe('suwon');
    }
  });

  test('TC-05: lab_manager는 모든 사이트 팀을 조회할 수 있다', async ({ siteAdminPage: page }) => {
    const token = await getBackendToken(page, 'lab_manager');

    const response = await page.request.get(`${BACKEND_URL}/api/teams?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const teamList = body.data ?? body;
    const teamIds = teamList.map((t: { id: string }) => t.id);

    // uiwang 팀도 있어야 함 (전체 스코프)
    expect(teamIds).toContain(UIWANG_TEAM_ID);
  });
});

// ============================================================================
// UI: 사이트 필터 disabled 검증
// ============================================================================

test.describe('UI: 사이트 필터 고정 표시', () => {
  test('TC-06: test_engineer 장비 목록에서 사이트 필터가 비활성화됨', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/equipment');

    // 필터 패널이 닫혀 있으면 열기
    const filterTrigger = page.getByRole('button', { name: /필터/i });
    const siteSelect = page.locator('#filter-site');
    if (!(await siteSelect.isVisible({ timeout: 1000 }).catch(() => false))) {
      await filterTrigger.click();
    }

    // 사이트 필터 select가 존재하고 disabled 상태인지 확인
    await expect(siteSelect).toBeVisible({ timeout: 5000 });
    await expect(siteSelect).toBeDisabled();
  });

  test('TC-07: lab_manager 장비 목록에서 사이트 필터가 활성화됨', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/equipment');

    // 필터 패널이 닫혀 있으면 열기
    const filterTrigger = page.getByRole('button', { name: /필터/i });
    const siteSelect = page.locator('#filter-site');
    if (!(await siteSelect.isVisible({ timeout: 1000 }).catch(() => false))) {
      await filterTrigger.click();
    }

    // 사이트 필터 select가 존재하고 enabled 상태인지 확인
    await expect(siteSelect).toBeVisible({ timeout: 5000 });
    await expect(siteSelect).toBeEnabled();
  });
});
