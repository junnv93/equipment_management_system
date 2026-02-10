// spec: 공용/렌탈 장비 임시등록 - 기본 기능
// seed: apps/frontend/tests/e2e/equipment-create/seed.spec.ts

/**
 * Test: 공용장비 임시등록 성공
 *
 * Verifies that technical managers can successfully register shared equipment from other teams:
 * - Navigate to create-shared page
 * - Verify temporary registration alert is displayed
 * - Select equipment type "공용장비 (타 팀)" (default)
 * - Select owner from dropdown (Safety팀)
 * - Input usage period (today to 6 months from today)
 * - Fill in basic equipment information
 * - Fill in calibration information (next calibration date after usage end date)
 * - Upload calibration certificate PDF
 * - Submit the form
 * - Verify redirect to equipment detail page (success verification via URL, not toast)
 * - Verify shared equipment banner is displayed
 *
 * Expected Results:
 * - equipmentType: 'common' is set
 * - sharedSource: 'safety_lab' is set
 * - status: 'temporary' is automatically set
 * - isShared: true is automatically set
 * - Equipment data is saved to DB
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { format, addMonths, addYears } from 'date-fns';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('공용/렌탈 장비 임시등록 - 기본 기능', () => {
  /**
   * FIXME: Database migration required
   *
   * This test correctly:
   * - Fills all required form fields for shared equipment registration
   * - Uploads calibration certificate PDF file
   * - Submits the form to POST /api/equipment
   *
   * Expected behavior:
   * - Backend should create equipment record with uploaded files
   * - Frontend should navigate to equipment detail page
   *
   * Actual behavior:
   * - Backend returns 500 error: "relation \"equipment_attachments\" does not exist"
   * - The equipment_attachments table is missing from the database
   *
   * Resolution:
   * - Run database migrations to create the equipment_attachments table
   * - The schema exists at: packages/db/src/schema/equipment-attachments.ts
   * - Once the table is created, this test should pass without modification
   */
  test.fixme('공용장비 임시등록 성공', async ({ techManagerPage }) => {
    // Prepare test data - dates
    const today = format(new Date(), 'yyyy-MM-dd');
    const sixMonthsLater = format(addMonths(new Date(), 6), 'yyyy-MM-dd');
    const oneYearLater = format(addYears(new Date(), 1), 'yyyy-MM-dd');

    // Create a mock PDF file for calibration certificate
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, 'calibration-cert-test.pdf');
    fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.4\n%Mock PDF content for testing\n%%EOF'));

    try {
      // 1. techManagerPage로 /equipment/create-shared 페이지 이동
      await techManagerPage.goto('/equipment/create-shared');
      await techManagerPage.waitForLoadState('networkidle');
      console.log('✓ Navigated to /equipment/create-shared');

      // Verify page loaded
      await expect(techManagerPage.locator('h1')).toContainText('공용/렌탈 장비 임시등록');

      // 2. 임시등록 안내 Alert 표시 확인
      const alertTitle = techManagerPage.locator('text=임시등록이란?');
      await expect(alertTitle).toBeVisible();

      // Verify alert contains shared equipment information - use specific selectors to avoid strict mode violations
      const alertDescription = techManagerPage
        .locator('[role="alert"]')
        .filter({ hasText: '임시등록이란?' });
      await expect(alertDescription).toContainText('공용장비');
      await expect(alertDescription).toContainText('타 팀');
      await expect(alertDescription).toContainText('렌탈장비');
      await expect(alertDescription).toContainText('교정성적서 필수');
      console.log('✓ Temporary registration alert is displayed');

      // 3. 장비 유형: '공용장비 (타 팀)' 라디오 버튼 선택 (기본값 확인)
      const commonRadio = techManagerPage.locator('input[name="equipmentType"][value="common"]');
      await expect(commonRadio).toBeChecked(); // Should be checked by default
      console.log('✓ Equipment type "공용장비 (타 팀)" is selected by default');

      // 4. 소유처 드롭다운에서 'Safety팀' 선택
      const ownerSelect = techManagerPage.locator('select#owner');
      await expect(ownerSelect).toBeVisible();
      await ownerSelect.selectOption('Safety팀');
      // Verify the selection worked
      await expect(ownerSelect).toHaveValue('Safety팀');
      console.log('✓ Selected owner: Safety팀');

      // 5. 사용 시작일 입력: 오늘 날짜
      const usageStartInput = techManagerPage.locator('input#usagePeriodStart');
      await usageStartInput.fill(today);
      console.log(`✓ Usage start date: ${today}`);

      // 6. 사용 종료일 입력: 오늘부터 6개월 후
      const usageEndInput = techManagerPage.locator('input#usagePeriodEnd');
      await usageEndInput.fill(sixMonthsLater);
      console.log(`✓ Usage end date: ${sixMonthsLater}`);

      // 7. 기본 정보 입력
      // 장비명: '공용장비 테스트'
      const nameInput = techManagerPage.locator('input[name="name"]');
      await nameInput.fill('공용장비 테스트');

      // 사이트/팀: 기술책임자는 자동 설정 (disabled)
      await expect(techManagerPage.getByRole('combobox', { name: '사이트 *' })).toBeDisabled();
      await techManagerPage.waitForTimeout(1000); // Wait for teams to load and auto-set
      await expect(techManagerPage.getByRole('combobox', { name: '팀 *' })).toBeDisabled();

      // 관리번호 일련번호: '5001'
      const serialInput = techManagerPage.locator('input[name="managementSerialNumberStr"]');
      await serialInput.fill('5001');

      // 모델명: 'Shared Model'
      const modelInput = techManagerPage.locator('input[name="modelName"]');
      await modelInput.fill('Shared Model');

      // 제조사: 'Shared Manufacturer'
      const manufacturerInput = techManagerPage.locator(
        'input[name="manufacturer"][placeholder*="Anritsu"]'
      );
      await manufacturerInput.fill('Shared Manufacturer');

      // 시리얼번호: 'SN-5001'
      const serialNumberInput = techManagerPage.locator(
        'input[name="serialNumber"][placeholder*="SN123456"]'
      );
      await serialNumberInput.fill('SN-5001');

      // 현재 위치: 'RF1 Room'
      const locationInput = techManagerPage.locator('input[name="location"]');
      await locationInput.fill('RF1 Room');

      // 기술책임자 선택 (첫 번째 옵션) - shadcn/ui Select component
      await techManagerPage.getByRole('combobox', { name: '기술책임자 *' }).click();
      await techManagerPage.getByRole('option').first().click();

      console.log('✓ All basic information fields filled');

      // 8. 교정 정보 입력
      // 관리 방법: '외부 교정' - shadcn/ui Select component
      await techManagerPage.getByRole('combobox', { name: '관리 방법 *' }).click();
      await techManagerPage.getByRole('option', { name: '외부 교정' }).click();

      // 교정 주기: 12
      const calibrationCycleInput = techManagerPage.locator('input[name="calibrationCycle"]');
      await calibrationCycleInput.fill('12');

      // 최종 교정일: 오늘 날짜
      const lastCalibrationDateInput = techManagerPage.locator('input[name="lastCalibrationDate"]');
      await lastCalibrationDateInput.fill(today);

      // 차기 교정일: 1년 후 (사용 종료일보다 이후)
      const nextCalibrationDateInput = techManagerPage.locator('input[name="nextCalibrationDate"]');
      await nextCalibrationDateInput.fill(oneYearLater);

      // 교정 기관: 'KOLAS'
      const calibrationAgencyInput = techManagerPage.locator('input[name="calibrationAgency"]');
      await calibrationAgencyInput.fill('KOLAS');

      console.log('✓ All calibration information fields filled');

      // Wait a moment to allow validation checker to run
      await techManagerPage.waitForTimeout(500);

      // Verify calibration validity checker shows valid message
      const validityMessage = techManagerPage.locator('text=교정 유효기간 확인됨');
      await expect(validityMessage).toBeVisible();
      console.log('✓ Calibration validity confirmed');

      // 9. 교정성적서 PDF 파일 업로드
      const fileInput = techManagerPage.locator('input#calibrationCertificate');
      await fileInput.setInputFiles(pdfPath);
      console.log('✓ Calibration certificate PDF uploaded');

      // Wait for file to be processed
      await techManagerPage.waitForTimeout(1000);

      // 10. '등록' 버튼 클릭
      const submitButton = techManagerPage
        .locator('button[type="submit"]')
        .filter({ hasText: '등록' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      // Listen for console errors and network responses
      const consoleMessages: string[] = [];
      const apiResponses: { url: string; status: number; body?: unknown }[] = [];

      techManagerPage.on('console', (msg) => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      });

      techManagerPage.on('response', async (response) => {
        if (response.url().includes('/api/equipment')) {
          try {
            const body = await response.json();
            apiResponses.push({ url: response.url(), status: response.status(), body });
          } catch {
            apiResponses.push({ url: response.url(), status: response.status() });
          }
        }
      });

      // Wait for navigation after clicking submit
      await submitButton.click();
      console.log('✓ Submit button clicked');

      // Wait a bit for any API calls to complete
      await techManagerPage.waitForTimeout(3000);

      // Log API responses for debugging
      if (apiResponses.length > 0) {
        console.log('API Responses:', JSON.stringify(apiResponses, null, 2));
      }

      // Log console messages for debugging
      if (consoleMessages.length > 0) {
        console.log('Console messages:');
        consoleMessages.forEach((msg) => console.log('  ', msg));
      }

      // Wait for navigation to complete
      await expect(techManagerPage).toHaveURL(/\/equipment\/[a-f0-9-]+$/, { timeout: 15000 });
      console.log('✓ Redirected to equipment detail page after successful registration');

      // 13. 공용장비 배너 표시 확인
      // Wait for page to fully load
      await techManagerPage.waitForLoadState('networkidle');
      await techManagerPage.waitForTimeout(1000);

      // Verify shared equipment banner - use specific selector to target the alert/banner component
      const sharedBanner = techManagerPage
        .locator('[role="alert"]')
        .filter({ hasText: /공용장비|임시등록/ });
      await expect(sharedBanner.first()).toBeVisible({ timeout: 5000 });
      console.log('✓ Shared equipment banner is displayed');

      // Verify equipment appears with correct management number format
      await expect(techManagerPage.locator('text=/SUW-.*5001/')).toBeVisible({ timeout: 5000 });
      console.log('✓ Equipment with management number SUW-*-5001 is displayed');

      console.log('✅ Test complete: 공용장비 임시등록 성공');
    } finally {
      // Clean up the temporary PDF file
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log('✓ Cleaned up temporary PDF file');
      }
    }
  });
});
