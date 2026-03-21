/**
 * Group D: 교정 반려 워크플로우
 *
 * 테스트 대상:
 * - 반려 사유 미입력 시 제출 차단
 * - 반려 완료 시 상태 변경
 * - 반려된 기록은 장비 교정일에 영향 없음
 *
 * ## SSOT 준수
 * - CalibrationApprovalStatus: @equipment-management/schemas
 * - auth.fixture.ts: testOperatorPage, techManagerPage
 * - Equipment ID Set 2 사용 (다른 그룹과 격리)
 *   - EQUIPMENT_3: Network Analyzer (반려 테스트용)
 *
 * NOTE: Seed user UUIDs (00000000-0000-0000-0000-...) don't pass Zod's strict
 * RFC 4122 UUID validation. Route interception strips calibrationManagerId/registeredBy
 * from POST body since both are optional in the backend schema.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

/**
 * Intercept calibration POST to strip seed-user UUID fields that fail Zod strict validation.
 */
async function setupCalibrationRouteInterceptor(page: import('@playwright/test').Page) {
  await page.route('**/api/calibration', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = JSON.parse(request.postData()!);
      delete body.calibrationManagerId;
      delete body.registeredBy;
      await route.continue({ postData: JSON.stringify(body) });
    } else {
      await route.continue();
    }
  });
}

test.describe('교정 반려 워크플로우', () => {
  test.describe.configure({ mode: 'serial' }); // 상태 변경 테스트

  const equipmentId = TEST_EQUIPMENT_IDS.EQUIPMENT_3; // Network Analyzer
  let calibrationAgency: string;

  test('4.1. 반려 시 반려 사유 미입력이면 제출할 수 없다', async ({
    testOperatorPage,
    techManagerPage,
  }) => {
    // Intercept to fix seed-user UUID validation issue
    await setupCalibrationRouteInterceptor(testOperatorPage);

    // 1. 시험실무자로 새 교정 기록 등록 (pre-selected equipment via URL)
    await testOperatorPage.goto(`/calibration/register?equipmentId=${equipmentId}`);

    // Wait for form to load
    const formHeading = testOperatorPage.getByText('교정 정보 입력');
    await expect(formHeading).toBeVisible({ timeout: 15000 });

    // 교정 정보 입력
    calibrationAgency = `Rejection Test Agency ${Date.now()}`;

    const calibrationDateInput = testOperatorPage.locator('#calibrationDate');
    await expect(calibrationDateInput).toBeVisible();
    await calibrationDateInput.fill('2026-02-15');

    // Calibration cycle defaults to 12 months

    const agencyInput = testOperatorPage.getByLabel('교정 기관');
    await expect(agencyInput).toBeVisible();
    await agencyInput.fill(calibrationAgency);

    // Result defaults to '적합' (pass)

    // 등록 버튼 클릭
    const registerButton = testOperatorPage.getByRole('button', { name: /교정 정보 등록/ });
    await expect(registerButton).toBeVisible();
    await registerButton.click();

    // 성공 → 리다이렉트 확인
    await testOperatorPage.waitForURL(/\/calibration(?!\/register)/, { timeout: 20000 });

    // 2. 기술책임자로 승인 대기 목록 이동
    await techManagerPage.goto('/admin/approvals?tab=calibration');

    const pageHeading = techManagerPage.getByRole('heading', { name: /승인 관리/ });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // 방금 등록한 기록 찾기 (individual card: border-l-brand-warning)
    const targetCard = techManagerPage
      .locator('.border-l-brand-warning')
      .filter({ hasText: calibrationAgency });
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // 3. '반려' 버튼 클릭
    const rejectButton = targetCard.getByRole('button', { name: '반려' });
    await rejectButton.click();

    // 4. 반려 사유 다이얼로그 표시 확인 (RejectReasonDialog with title "교정 반려")
    const dialog = techManagerPage.getByRole('dialog', { name: '교정 반려' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 5. 반려 사유 입력 없이 '반려' 버튼 확인 - 비활성화 상태
    // RejectReasonDialog: disabled={!reason.trim() || isPending}
    const confirmButton = dialog.getByRole('button', { name: '반려' });
    await expect(confirmButton).toBeDisabled();

    // 다이얼로그가 여전히 열려 있는지 확인 (제출 차단됨)
    await expect(dialog).toBeVisible();

    // 취소 버튼 클릭하여 다이얼로그 닫기
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('4.2. 반려 사유 입력 후 반려 완료 시 기록 상태가 rejected로 변경된다', async ({
    techManagerPage,
  }) => {
    // 1. 승인 대기 목록 이동
    await techManagerPage.goto('/admin/approvals?tab=calibration');

    const pageHeading = techManagerPage.getByRole('heading', { name: /승인 관리/ });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // 2. 해당 기록의 '반려' 버튼 클릭 (individual card: border-l-brand-warning)
    const targetCard = techManagerPage
      .locator('.border-l-brand-warning')
      .filter({ hasText: calibrationAgency });
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    const rejectButton = targetCard.getByRole('button', { name: '반려' });
    await rejectButton.click();

    // 3. 반려 사유 입력
    const dialog = techManagerPage.getByRole('dialog', { name: '교정 반려' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const reasonInput = dialog.getByLabel(/반려 사유/);
    await reasonInput.fill('교정 성적서 날짜 오류 - 재등록 필요');

    // 4. '반려' 확인 버튼 클릭 (should now be enabled)
    const confirmButton = dialog.getByRole('button', { name: '반려' });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // 5. 성공 토스트 메시지 확인 (specific toast description to avoid strict mode violation)
    await expect(techManagerPage.getByText('교정 기록이 반려되었습니다.')).toBeVisible({
      timeout: 10000,
    });

    // 6. 해당 기록이 승인 대기 목록에서 사라지는지 확인
    const disappearedCard = techManagerPage
      .locator('.border-l-brand-warning')
      .filter({ hasText: calibrationAgency });
    await expect(disappearedCard).not.toBeVisible({ timeout: 10000 });
  });

  test('4.3. 반려된 기록은 장비 교정일에 영향을 주지 않는다', async ({ techManagerPage }) => {
    // 1. 장비 상세 페이지 교정 이력 탭으로 이동
    await techManagerPage.goto(`/equipment/${equipmentId}?tab=calibration`);

    // 2. 교정 이력 탭 로드 대기
    const calibrationTitle = techManagerPage.getByText('교정 이력').first();
    await expect(calibrationTitle).toBeVisible({ timeout: 15000 });

    // 3. 반려된 기록이 교정 이력 테이블에 표시되는지 확인
    const rejectedRow = techManagerPage.locator('tr').filter({ hasText: calibrationAgency });
    await expect(rejectedRow).toBeVisible({ timeout: 10000 });

    // 4. 반려된 기록이 '반려됨' 배지로 표시되는지 확인
    const rejectedBadge = rejectedRow.getByText('반려됨');
    await expect(rejectedBadge).toBeVisible();

    // 5. 기본 정보 탭으로 이동하여 교정일 확인
    await techManagerPage.goto(`/equipment/${equipmentId}?tab=basic`);

    // 기본 정보 탭 로드 대기
    await expect(techManagerPage.getByText('기본 정보').first()).toBeVisible({ timeout: 10000 });

    // 6. 반려된 기록의 교정일 (2026-02-15)이 장비의 다음 교정 예정일에 반영되지 않아야 함
    const nextCalibField = techManagerPage.getByText('다음 교정 예정일').locator('..');
    const nextCalibText = await nextCalibField.textContent();
    // Rejected calibration was for 2026-02-15 with 12 month cycle → next would be 2027-02-15
    // This should NOT be reflected
    expect(nextCalibText).not.toContain('2027-02-15');
  });
});
