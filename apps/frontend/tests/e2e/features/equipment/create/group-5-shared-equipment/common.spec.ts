// spec: 공용/렌탈 장비 임시등록 - 기본 기능

/**
 * Test: 공용장비 임시등록 성공
 *
 * 4-step wizard form:
 *   Step 0: 기본 정보 → Step 1: 상태·위치 + 임시등록 → Step 2: 교정 정보 → Step 3: 이력·첨부 → 등록
 *
 * technical_manager creates an approval request (not direct creation),
 * so the redirect goes to /equipment list with a success toast.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { format, addMonths, addYears } from 'date-fns';
import fs from 'fs';
import os from 'os';
import path from 'path';

test.describe('공용/렌탈 장비 임시등록 - 기본 기능', () => {
  test('공용장비 임시등록 성공', async ({ techManagerPage: page }) => {
    test.setTimeout(120_000);
    const today = format(new Date(), 'yyyy-MM-dd');
    const sixMonthsLater = format(addMonths(new Date(), 6), 'yyyy-MM-dd');
    const oneYearLater = format(addYears(new Date(), 1), 'yyyy-MM-dd');
    // 유니크한 시리얼 번호 생성
    const uniqueSerial = String(Date.now()).slice(-4);

    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, 'calibration-cert-test.pdf');
    fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.4\n%Mock PDF content for testing\n%%EOF'));

    try {
      await page.goto('/equipment/create-shared');
      await expect(page.locator('h1')).toContainText('임시등록');

      // ── Step 0: 기본 정보 ──
      await page.locator('input[name="name"]').fill('공용장비 테스트');
      await expect(page.getByRole('combobox', { name: '사이트 *' })).toBeDisabled();
      await expect(page.getByRole('combobox', { name: '팀 *' })).toBeDisabled();
      await page.locator('input[name="managementSerialNumberStr"]').fill(uniqueSerial);
      await page.locator('input[name="modelName"]').fill('Shared Model');
      await page.locator('input[name="manufacturer"]').first().fill('Shared Manufacturer');
      await page.locator('input[name="serialNumber"]').first().fill(`SN-${uniqueSerial}`);

      // "다음" → Step 1
      await page.getByRole('button', { name: '다음' }).click();

      // ── Step 1: 상태·위치 + 임시등록 전용 ──
      await expect(page.locator('input[name="location"]')).toBeVisible({ timeout: 5000 });

      await page.locator('input[name="location"]').fill('RF1 Room');

      // 기술책임자 선택
      await page.getByRole('combobox', { name: '기술책임자 *' }).click();
      await page.getByRole('option').first().click();

      // 임시등록 전용: 장비 유형 기본 선택 확인
      await expect(page.locator('#type-common')).toBeVisible();

      // 소유처: SSOT (EQUIPMENT_OWNER_OPTIONS[0] → i18n label)
      const ownerTrigger = page.locator('#owner').locator('..').getByRole('combobox');
      await ownerTrigger.click();
      await page.getByRole('option', { name: 'Safety팀' }).click();

      // 사용 기간
      await page.locator('input#usagePeriodStart').fill(today);
      await page.locator('input#usagePeriodEnd').fill(sixMonthsLater);

      // 교정성적서 PDF
      await page.locator('input#calibrationCertificate').setInputFiles(pdfPath);

      // "다음" → Step 2
      await page.getByRole('button', { name: '다음' }).click();

      // ── Step 2: 교정 정보 ──
      await expect(page.locator('input[name="calibrationCycle"]')).toBeVisible({ timeout: 5000 });

      await page.getByRole('combobox', { name: '관리 방법 *' }).click();
      await page.getByRole('option', { name: '외부 교정' }).click();
      await page.locator('input[name="calibrationCycle"]').fill('12');
      await page.locator('input[name="lastCalibrationDate"]').fill(today);
      await page.locator('input[name="nextCalibrationDate"]').fill(oneYearLater);
      await page.locator('input[name="calibrationAgency"]').fill('KOLAS');

      // "다음" → Step 3
      await page.getByRole('button', { name: '다음' }).click();

      // ── Step 3: 이력·첨부 → 등록 ──
      await expect(page.getByText('이력 관리 안내')).toBeVisible({ timeout: 10000 });

      // 등록 버튼 클릭 (technical_manager → needsApproval=true → 확인 다이얼로그)
      const submitBtn = page.getByRole('button', { name: /등록/ });
      await expect(submitBtn).toBeVisible({ timeout: 5000 });
      await submitBtn.click();

      // 확인 다이얼로그에서 승인 요청 제출
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await dialog.getByRole('button', { name: '요청하기' }).click();

      // 기술책임자는 승인 요청 → 장비 목록 리다이렉트
      await expect(page).toHaveURL(/\/equipment(\?.*)?$/, { timeout: 15000 });

      // 성공 토스트 확인 (i18n: form.createShared.approvalRequestComplete)
      await expect(page.getByText('등록 요청 완료', { exact: true })).toBeVisible({
        timeout: 5000,
      });
    } finally {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
  });
});
