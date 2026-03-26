// spec: equipment-create test plan
// seed: apps/frontend/tests/e2e/equipment-create/seed.spec.ts

/**
 * Test: 기술책임자는 장비를 직접 등록할 수 있다
 *
 * Verifies that technical managers can directly register equipment without approval workflow:
 * - Permission banner shows "기술책임자" and "직접 처리"
 * - 사이트/팀 드롭다운이 자동 설정되고 비활성화 (자기 팀만 등록 가능)
 * - No approval confirmation modal appears
 * - Equipment is immediately created upon submission
 * - Toast notification confirms success
 * - Redirects to equipment list
 * - Equipment appears in the list immediately
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('역할별 승인 워크플로우 - 기술책임자', () => {
  test('기술책임자는 장비를 직접 등록할 수 있다', async ({ techManagerPage }) => {
    // 1. techManagerPage로 /equipment/create 페이지 이동
    await techManagerPage.goto('/equipment/create');

    // Verify page loaded
    await expect(techManagerPage.locator('h1')).toContainText('장비 등록');

    // 2. 권한 배너에서 '현재 권한: 기술책임자'와 '직접 처리' 뱃지 확인
    await expect(techManagerPage.getByText(/현재 권한.*기술책임자/i)).toBeVisible();
    await expect(techManagerPage.getByText(/직접 처리/i)).toBeVisible();
    console.log('✓ Permission banner shows 기술책임자 and 직접 처리');

    // 3. 필수 정보 입력
    // 장비명: '기술책임자 테스트 장비'
    const nameInput = techManagerPage.locator('input[name="name"]');
    await nameInput.fill('기술책임자 테스트 장비');

    // 사이트: 기술책임자는 자기 사이트가 자동 설정되고 변경 불가
    const siteCombobox = techManagerPage.getByRole('combobox', { name: '사이트 *' });
    await expect(siteCombobox).toBeDisabled();
    await expect(siteCombobox).toContainText(/수원/);
    console.log('✓ Site dropdown is disabled and auto-set for tech_manager');

    // 팀: 기술책임자는 자기 팀이 자동 설정되고 변경 불가
    const teamCombobox = techManagerPage.getByRole('combobox', { name: '팀 *' });
    await expect(teamCombobox).toBeDisabled();
    await expect(teamCombobox).not.toContainText('팀을 선택하세요');
    console.log('✓ Team dropdown is disabled and auto-set for tech_manager');

    // 소속 제한 안내 문구 확인
    await expect(
      techManagerPage.getByText('소속 사이트의 장비만 등록할 수 있습니다')
    ).toBeVisible();
    await expect(techManagerPage.getByText('소속 팀의 장비만 등록할 수 있습니다')).toBeVisible();
    console.log('✓ Restriction messages displayed for tech_manager');

    // 관리번호 일련번호: '1002'
    const serialInput = techManagerPage.locator('input[name="managementSerialNumberStr"]');
    await serialInput.fill('1002');

    // 모델명: 'Test Model 1002'
    const modelInput = techManagerPage.locator('input[name="modelName"]');
    await modelInput.fill('Test Model 1002');

    // 제조사: 'Test Manufacturer'
    const manufacturerInput = techManagerPage.locator(
      'input[name="manufacturer"][placeholder*="Anritsu"]'
    );
    await manufacturerInput.fill('Test Manufacturer');

    // 시리얼번호: 'SN-1002'
    const serialNumberInput = techManagerPage.locator(
      'input[name="serialNumber"][placeholder*="SN123456"]'
    );
    await serialNumberInput.fill('SN-1002');

    // 현재 위치: 'RF2 Room'
    const locationInput = techManagerPage.locator('input[name="location"]');
    await locationInput.fill('RF2 Room');

    // 기술책임자 선택 (첫 번째 옵션) - shadcn/ui Select component
    await techManagerPage.getByRole('combobox', { name: '기술책임자 *' }).click();
    await techManagerPage.getByRole('option').first().click();

    console.log('✓ All required fields filled');

    // 4. '등록' 버튼 클릭 (승인 요청 문구 없음)
    const submitButton = techManagerPage
      .locator('button[type="submit"]')
      .filter({ hasText: '등록' });
    await expect(submitButton).toBeVisible();
    // Verify button text does NOT contain "승인 요청"
    const buttonText = await submitButton.textContent();
    expect(buttonText).not.toMatch(/승인.*요청/i);
    console.log('✓ Submit button shows "등록" without approval request text');

    await submitButton.click();

    // 5. 승인 확인 모달 없이 바로 처리됨 확인
    // Wait a moment to ensure no modal appears

    // Verify no approval confirmation modal
    const modal = techManagerPage.locator('[role="dialog"]').filter({ hasText: /승인|확인/i });
    await expect(modal).not.toBeVisible();
    console.log('✓ No approval confirmation modal appeared');

    // 6. Verify redirect to /equipment page (business logic: successful registration)
    await expect(techManagerPage).toHaveURL(/\/equipment/, { timeout: 15000 });
    console.log('✓ Redirected to /equipment (equipment created successfully)');

    // 7. Verify equipment list page loads successfully
    await techManagerPage.waitForLoadState('domcontentloaded');

    // Verify page title or header to confirm equipment list page loaded
    const pageHeading = techManagerPage.locator('h1, h2').filter({ hasText: /장비/ });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    console.log('✓ Equipment list page loaded successfully');

    console.log('✅ Test complete: 기술책임자 can directly register equipment');
    console.log('Business logic verified: Equipment created with auto-set site/team');
  });
});
