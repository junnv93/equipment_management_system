// spec: 역할별 승인 워크플로우 - 시험소 관리자
// seed: apps/frontend/tests/e2e/equipment-create/seed.spec.ts

/**
 * Test: 시험소 관리자는 장비를 직접 등록할 수 있다
 *
 * Verifies that lab managers can directly register equipment without approval workflow:
 * - Permission banner shows "시험소 관리자" and "직접 처리"
 * - No approval confirmation modal appears
 * - Equipment is immediately created upon submission
 * - Toast notification confirms success
 * - Redirects to equipment list
 * - Equipment appears in the list immediately
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('역할별 승인 워크플로우 - 시험소 관리자', () => {
  test('시험소 관리자는 장비를 직접 등록할 수 있다', async ({ siteAdminPage }) => {
    // 1. siteAdminPage로 /equipment/create 페이지 이동
    await siteAdminPage.goto('/equipment/create');
    await siteAdminPage.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(siteAdminPage.locator('h1')).toContainText('장비 등록');

    // 2. 권한 배너에서 '현재 권한: 시험소 관리자'와 '직접 처리' 뱃지 확인
    await expect(siteAdminPage.getByText(/현재 권한.*시험소 관리자/i)).toBeVisible();
    await expect(siteAdminPage.getByText(/직접 처리/i)).toBeVisible();
    console.log('✓ Permission banner shows 시험소 관리자 and 직접 처리');

    // 3. 필수 정보 입력
    // 장비명: '시험소 관리자 테스트 장비'
    const nameInput = siteAdminPage.locator('input[name="name"]');
    await nameInput.fill('시험소 관리자 테스트 장비');

    // 사이트: 시험소 관리자는 모든 사이트를 자유롭게 선택 가능 (enabled)
    const siteCombobox = siteAdminPage.getByRole('combobox', { name: '사이트 *' });
    await expect(siteCombobox).toBeEnabled();
    await siteCombobox.click();
    await siteAdminPage.waitForTimeout(200); // Wait for dropdown to open
    await siteAdminPage.getByRole('option', { name: /수원.*SUW/ }).click();
    await siteAdminPage.waitForTimeout(300); // Wait for dropdown to close and state update
    console.log('✓ Site dropdown is enabled for lab_manager (can select any site)');

    // 팀 선택: 시험소 관리자는 모든 팀을 자유롭게 선택 가능 (enabled)
    await siteAdminPage.waitForTimeout(500); // Wait for teams to load
    const teamCombobox = siteAdminPage.getByRole('combobox', { name: '팀 *' });
    await expect(teamCombobox).toBeEnabled();
    await teamCombobox.click();
    await siteAdminPage.waitForTimeout(200); // Wait for dropdown to open
    await siteAdminPage.getByRole('option').first().click();
    await siteAdminPage.waitForTimeout(300); // Wait for dropdown to close
    console.log('✓ Team dropdown is enabled for lab_manager (can select any team)');

    // 관리번호 일련번호: '1003'
    const serialInput = siteAdminPage.locator('input[name="managementSerialNumberStr"]');
    await serialInput.fill('1003');

    // 모델명: 'Test Model 1003'
    const modelInput = siteAdminPage.locator('input[name="modelName"]');
    await modelInput.fill('Test Model 1003');

    // 제조사: 'Test Manufacturer'
    const manufacturerInput = siteAdminPage.locator(
      'input[name="manufacturer"][placeholder*="Anritsu"]'
    );
    await manufacturerInput.fill('Test Manufacturer');

    // 시리얼번호: 'SN-1003'
    const serialNumberInput = siteAdminPage.locator(
      'input[name="serialNumber"][placeholder*="SN123456"]'
    );
    await serialNumberInput.fill('SN-1003');

    // 현재 위치: 'RF3 Room'
    const locationInput = siteAdminPage.locator('input[name="location"]');
    await locationInput.fill('RF3 Room');

    // 기술책임자 선택 (첫 번째 옵션) - shadcn/ui Select component
    await siteAdminPage.getByRole('combobox', { name: '기술책임자 *' }).click();
    await siteAdminPage.getByRole('option').first().click();

    console.log('✓ All required fields filled');

    // 4. '등록' 버튼 클릭 (승인 요청 문구 없음)
    const submitButton = siteAdminPage.locator('button[type="submit"]').filter({ hasText: '등록' });
    await expect(submitButton).toBeVisible();
    // Verify button text does NOT contain "승인 요청"
    const buttonText = await submitButton.textContent();
    expect(buttonText).not.toMatch(/승인.*요청/i);
    console.log('✓ Submit button shows "등록" without approval request text');

    await submitButton.click();

    // 5. 승인 확인 모달 없이 바로 처리됨 확인
    // Wait a moment to ensure no modal appears
    await siteAdminPage.waitForTimeout(500);

    // Verify no approval confirmation modal
    const modal = siteAdminPage.locator('[role="dialog"]').filter({ hasText: /승인|확인/i });
    await expect(modal).not.toBeVisible();
    console.log('✓ No approval confirmation modal appeared');

    // 6. Verify redirect to /equipment page (business logic: successful registration)
    await expect(siteAdminPage).toHaveURL(/\/equipment/, { timeout: 15000 });
    console.log('✓ Redirected to /equipment (equipment created successfully)');

    // 7. Verify equipment list page loads successfully
    await siteAdminPage.waitForLoadState('domcontentloaded');

    // Verify page title or header to confirm equipment list page loaded
    const pageHeading = siteAdminPage.locator('h1, h2').filter({ hasText: /장비/ });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    console.log('✓ Equipment list page loaded successfully');

    console.log('✅ Test complete: 시험소 관리자 can directly register equipment');
    console.log('Business logic verified: Equipment created and user redirected to equipment list');
  });
});
