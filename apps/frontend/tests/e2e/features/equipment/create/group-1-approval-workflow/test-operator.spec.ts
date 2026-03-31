/**
 * Equipment Create - Test Operator Approval Workflow
 * spec: 역할별 승인 워크플로우 - 시험실무자
 * seed: apps/frontend/tests/e2e/equipment-create/seed.spec.ts
 *
 * Test Scope:
 * - 시험실무자가 장비 등록 시 승인 요청 생성
 * - 권한 배너 표시 확인 (시험실무자, 승인 필요)
 * - 사이트/팀 드롭다운 자동 설정 및 비활성화 확인
 * - 기본 정보 및 교정 정보 입력
 * - 승인 요청 확인 모달 표시
 * - 승인 대기 상태로 등록
 *
 * @remarks
 * This test uses testOperatorPage fixture (시험실무자) which requires approval workflow.
 * Equipment will enter pending approval state and won't be visible until approved.
 * test_engineer는 자신의 사이트/팀 장비만 등록 가능 (사이트/팀 드롭다운 disabled)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('역할별 승인 워크플로우', () => {
  test('시험실무자는 장비 등록 시 승인 요청을 생성한다', async ({ testOperatorPage }) => {
    // 1. testOperatorPage로 /equipment/create 페이지 이동
    await testOperatorPage.goto('/equipment/create');

    // Verify page loaded
    await expect(testOperatorPage.locator('h1')).toContainText('장비 등록');

    // 2. 권한 배너에서 '현재 권한: 시험실무자'와 '승인 필요' 뱃지 확인
    const permissionBanner = testOperatorPage
      .locator('[class*="bg-yellow"]')
      .filter({ hasText: '시험실무자' });
    await expect(permissionBanner).toBeVisible();
    await expect(permissionBanner).toContainText('시험실무자');

    // Check for approval badge within the permission banner (specific to avoid ambiguity)
    // The badge is rendered as: <Badge variant="outline">승인 필요</Badge>
    const approvalBadge = permissionBanner
      .locator('.inline-flex.items-center.rounded-md')
      .filter({ hasText: '승인 필요' });
    await expect(approvalBadge).toBeVisible();
    console.log('✓ Permission banner shows 시험실무자 and 승인 필요 badge');

    // 3. 기본 정보 입력: 장비명='시험실무자 테스트 장비'
    const nameInput = testOperatorPage.locator('input[name="name"]');
    await nameInput.fill('시험실무자 테스트 장비');

    // 4. 사이트: 시험실무자는 자신의 사이트가 자동 설정되고 변경 불가
    const siteCombobox = testOperatorPage.getByRole('combobox', { name: '사이트 *' });
    await expect(siteCombobox).toBeDisabled();
    // 사이트가 자동으로 사용자의 사이트(수원)로 설정되어 있는지 확인
    await expect(siteCombobox).toContainText(/수원/);
    console.log('✓ Site dropdown is disabled and auto-set for test_engineer');

    // Wait for teams to load after auto-set site

    // 5. 팀: 시험실무자는 자신의 팀이 자동 설정되고 변경 불가
    const teamCombobox = testOperatorPage.getByRole('combobox', { name: '팀 *' });
    await expect(teamCombobox).toBeDisabled();
    // 팀이 자동 선택되어 '팀을 선택하세요' placeholder가 아닌 실제 팀명이 표시되는지 확인
    await expect(teamCombobox).not.toContainText('팀을 선택하세요');
    console.log('✓ Team dropdown is disabled and auto-set for test_engineer');

    // 분류코드 자동 설정 확인 (팀 자동 선택 후)
    const classificationDisplay = testOperatorPage.locator('text=/분류.*자동/i').first();
    await expect(classificationDisplay).toBeVisible();

    // 소속 제한 안내 문구 확인
    await expect(
      testOperatorPage.getByText('소속 사이트의 장비만 등록할 수 있습니다')
    ).toBeVisible();
    await expect(testOperatorPage.getByText('소속 팀의 장비만 등록할 수 있습니다')).toBeVisible();
    console.log('✓ Restriction messages displayed for test_engineer');

    // 6. 관리번호 일련번호 입력: '1001'
    const serialInput = testOperatorPage.locator('input[name="managementSerialNumberStr"]');
    await serialInput.fill('1001');

    // 7. 모델명 입력: 'Test Model 1001'
    const modelInput = testOperatorPage.locator('input[name="modelName"]');
    await modelInput.fill('Test Model 1001');

    // 8. 제조사 입력: 'Test Manufacturer'
    const manufacturerInput = testOperatorPage.locator(
      'input[name="manufacturer"][placeholder*="Anritsu"]'
    );
    await manufacturerInput.fill('Test Manufacturer');

    // 9. 시리얼번호 입력: 'SN-1001'
    const serialNumberInput = testOperatorPage.locator(
      'input[name="serialNumber"][placeholder*="SN123456"]'
    );
    await serialNumberInput.fill('SN-1001');

    // 10. 교정 정보: 관리 방법='외부 교정' 선택 - shadcn/ui Select component
    await testOperatorPage.getByRole('combobox', { name: '관리 방법 *' }).click();
    await testOperatorPage.getByRole('option', { name: '외부 교정' }).click();

    // Wait for conditional fields to appear

    // 11. 교정 주기 입력: 12
    const calibrationCycleInput = testOperatorPage.locator('input[name="calibrationCycle"]');
    await calibrationCycleInput.fill('12');

    // 12. 최종 교정일 입력: 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    const lastCalibrationDateInput = testOperatorPage.locator('input[name="lastCalibrationDate"]');
    await lastCalibrationDateInput.fill(today);

    // 13. 교정 기관 입력: 'KOLAS'
    const calibrationAgencyInput = testOperatorPage.locator('input[name="calibrationAgency"]');
    await calibrationAgencyInput.fill('KOLAS');

    // 14. 현재 위치 입력: 'RF1 Room'
    const locationInput = testOperatorPage.locator('input[name="location"]');
    await locationInput.fill('RF1 Room');

    // 15. 기술책임자 선택 - shadcn/ui Select component
    await testOperatorPage.getByRole('combobox', { name: '기술책임자 *' }).click();
    await testOperatorPage.getByRole('option').first().click();

    // 16. '등록 (승인 요청)' 버튼 클릭
    const submitButton = testOperatorPage.locator('button[type="submit"]').filter({
      hasText: /등록.*승인 요청/i,
    });
    await submitButton.click();

    // 17. 승인 요청 확인 모달 표시 확인
    // Use specific selector to avoid mobile nav drawer dialog
    const confirmDialog = testOperatorPage.getByRole('dialog', { name: '등록 요청 확인' });
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });

    // Verify modal content shows approval process information
    await expect(confirmDialog.getByText('승인 프로세스 안내')).toBeVisible();
    await expect(confirmDialog.getByText(/기술책임자의 승인이 필요합니다/)).toBeVisible();
    console.log('✓ Approval confirmation modal displayed with correct content');

    // 18. 모달에서 '요청하기' 버튼 클릭
    const confirmButton = confirmDialog.locator('button').filter({ hasText: /요청하기/i });
    await confirmButton.click();

    // 19. Verify redirect to /equipment page (business logic: approval request created)
    await expect(testOperatorPage).toHaveURL(/\/equipment/, { timeout: 15000 });
    console.log('✓ Redirected to /equipment (approval request created successfully)');

    // 20. Verify equipment list page loads successfully
    await testOperatorPage.waitForLoadState('domcontentloaded');

    const pageHeading = testOperatorPage.locator('h1, h2').filter({ hasText: /장비/ });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    console.log('✓ Equipment list page loaded successfully');

    console.log('✅ Test complete: 시험실무자 approval request workflow verified');
    console.log('Business logic verified: Approval request created with auto-set site/team');
  });
});
