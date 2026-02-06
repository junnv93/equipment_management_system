/**
 * Equipment Create - File Upload Tests
 *
 * Test Suite: 파일 업로드
 * Seed File: apps/frontend/tests/e2e/equipment-create/seed.spec.ts
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('파일 업로드', () => {
  test('검수보고서 파일 업로드 성공', async ({ techManagerPage: page }) => {
    // 1. techManagerPage로 /equipment/create 페이지 이동
    await page.goto('/equipment/create');
    await page.waitForLoadState('networkidle');

    // 페이지 로드 확인
    await expect(page.getByRole('heading', { name: '장비 등록' })).toBeVisible();

    // 2. 필수 정보 입력: 장비명
    await page.getByLabel('장비명').fill('파일 업로드 테스트 장비');

    // 2. 필수 정보 입력: 사이트/팀 - 기술책임자는 자동 설정 (disabled)
    await expect(page.getByRole('combobox', { name: '사이트 *' })).toBeDisabled();
    await page.waitForTimeout(1000); // Wait for teams to load and auto-set
    await expect(page.getByRole('combobox', { name: '팀 *' })).toBeDisabled();

    // 2. 필수 정보 입력: 관리번호 일련번호
    await page.locator('input[name="managementSerialNumberStr"]').fill('3001');

    // 2. 필수 정보 입력: 모델명
    await page.getByLabel('모델명').fill('Upload Test Model');

    // 2. 필수 정보 입력: 제조사
    const manufacturerInput = page.locator('input[name="manufacturer"][placeholder*="Anritsu"]');
    await manufacturerInput.fill('Upload Manufacturer');

    // 2. 필수 정보 입력: 시리얼번호
    const serialNumberInput = page.locator('input[name="serialNumber"][placeholder*="SN123456"]');
    await serialNumberInput.fill('SN-3001');

    // 2. 필수 정보 입력: 현재 위치
    const locationInput = page.locator('input[name="location"]');
    await locationInput.fill('RF1 Room');

    // 2. 필수 정보 입력: 기술책임자 선택 - shadcn/ui Select component
    await page.getByRole('combobox', { name: '기술책임자 *' }).click();
    await page.getByRole('option').first().click();

    // 3. 파일 첨부 섹션으로 스크롤 (CardTitle with number prefix)
    const fileSection = page.getByRole('heading', { name: '4 파일 첨부' });
    await fileSection.scrollIntoViewIfNeeded();

    // 4. 파일 업로드 영역 찾기
    const fileUploadArea = page.locator('text=/드래그|클릭.*업로드/i').first();
    await expect(fileUploadArea).toBeVisible();

    // 5. 테스트 PDF 파일 업로드 (playwright에서 생성)
    // 임시 PDF 파일 생성
    const tmpDir = os.tmpdir();
    const testFileName = 'test-inspection-report.pdf';
    const testFilePath = path.join(tmpDir, testFileName);

    // PDF 파일 내용 생성 (간단한 PDF 헤더)
    const pdfContent = Buffer.from([
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d,
      0x31,
      0x2e,
      0x34,
      0x0a, // %PDF-1.4
      0x25,
      0xc7,
      0xec,
      0xf8,
      0xfa,
      0x0a, // Binary marker
      0x31,
      0x20,
      0x30,
      0x20,
      0x6f,
      0x62,
      0x6a,
      0x0a, // 1 0 obj
      0x3c,
      0x3c,
      0x20,
      0x2f,
      0x54,
      0x79,
      0x70,
      0x65,
      0x20,
      0x2f,
      0x43,
      0x61,
      0x74,
      0x61,
      0x6c,
      0x6f,
      0x67,
      0x20,
      0x2f,
      0x50,
      0x61,
      0x67,
      0x65,
      0x73,
      0x20,
      0x32,
      0x20,
      0x30,
      0x20,
      0x52,
      0x20,
      0x3e,
      0x3e,
      0x0a, // << /Type /Catalog /Pages 2 0 R >>
      0x65,
      0x6e,
      0x64,
      0x6f,
      0x62,
      0x6a,
      0x0a, // endobj
    ]);
    fs.writeFileSync(testFilePath, pdfContent);

    // 파일 선택 버튼 클릭 또는 파일 입력 찾기
    const fileInput = page.locator('input[type="file"]').first();

    // setInputFiles를 사용하여 파일 업로드
    await fileInput.setInputFiles(testFilePath);

    // 6. 업로드된 파일명 표시 확인
    await expect(page.locator('text=' + testFileName)).toBeVisible({ timeout: 10000 });

    // 7. '등록' 버튼 클릭
    const submitButton = page.getByRole('button', { name: /^등록/ });
    await submitButton.click();

    // 8. 등록 성공 확인 (토스트 메시지 또는 리다이렉트)
    // 등록 완료 메시지 또는 리다이렉트 대기
    await page.waitForURL(/\/equipment\/[a-f0-9-]+/, { timeout: 30000 }).catch(async () => {
      // 토스트 메시지 확인
      const toast = page
        .locator('[role="status"], [role="alert"]')
        .filter({ hasText: /등록.*완료|성공/i });
      await expect(toast).toBeVisible({ timeout: 10000 });
    });

    // 9. 장비 상세 페이지로 이동 확인
    await page.waitForLoadState('networkidle');

    // URL이 /equipment/[uuid] 형식인지 확인
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/equipment\/[a-f0-9-]+/);

    // 10. 첨부파일 섹션에서 업로드된 파일 확인
    // 첨부파일 탭 또는 섹션 찾기
    const attachmentTab = page.getByRole('tab', { name: /첨부.*파일|파일/i });
    if ((await attachmentTab.count()) > 0) {
      await attachmentTab.click();
      await page.waitForTimeout(1000);
    }

    // 업로드된 파일명 확인
    const uploadedFileLink = page
      .locator('text=' + testFileName)
      .or(page.locator('a, span').filter({ hasText: testFileName }));

    await expect(uploadedFileLink).toBeVisible({ timeout: 10000 });

    // 임시 파일 정리
    try {
      fs.unlinkSync(testFilePath);
    } catch (error) {
      console.warn('Failed to clean up temp file:', error);
    }

    console.log('✅ 파일 업로드 테스트 완료');
  });
});
