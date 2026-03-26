/**
 * 시나리오 5: 교정 등록 시 문서 업로드
 *
 * 검증 항목:
 * - CalibrationRegisterDialog에서 교정성적서 파일 첨부
 * - 교정 등록 완료 후 교정 이력에 성적서 다운로드 버튼 표시
 *
 * 역할: test_engineer (교정 등록 권한 보유)
 * 장비: SPECTRUM_ANALYZER_SUW_E (available, FCC EMC/RF 팀)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('교정 등록 — 문서 업로드', () => {
  test('TC-01: 교정 이력 탭에서 교정 등록 버튼이 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 교정 이력 탭 클릭
    const calibrationTab = page.getByRole('tab', { name: /교정 이력/ });
    await expect(calibrationTab).toBeVisible({ timeout: 10000 });
    await calibrationTab.click();

    // 교정 등록 버튼 확인
    const registerButton = page.getByRole('button', { name: '교정 등록' });
    await expect(registerButton).toBeVisible({ timeout: 5000 });
  });

  test('TC-02: 교정 등록 다이얼로그에서 교정성적서 파일 첨부', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 교정 이력 탭 클릭
    const calibrationTab = page.getByRole('tab', { name: /교정 이력/ });
    await expect(calibrationTab).toBeVisible({ timeout: 10000 });
    await calibrationTab.click();

    // 교정 등록 버튼 클릭
    const registerButton = page.getByRole('button', { name: '교정 등록' });
    await expect(registerButton).toBeVisible({ timeout: 5000 });
    await registerButton.click();

    // 다이얼로그 열림 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('교정 이력 등록')).toBeVisible();

    // 교정성적서 파일 필드 확인
    await expect(dialog.getByText('교정성적서 파일 *')).toBeVisible();

    // 파일 첨부
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-certificate.pdf'));

    // 파일명이 input에 반영되었는지 확인 (file input의 value는 브라우저가 관리)
    // 대신 다이얼로그가 여전히 열려 있고, 제출 가능 상태인지 확인
    await expect(dialog).toBeVisible();
  });

  test('TC-03: 교정 등록 — 필수 정보 입력 후 교정성적서 파일과 함께 제출', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 교정 이력 탭 클릭
    const calibrationTab = page.getByRole('tab', { name: /교정 이력/ });
    await expect(calibrationTab).toBeVisible({ timeout: 10000 });
    await calibrationTab.click();

    // 교정 등록 버튼 클릭
    const registerButton = page.getByRole('button', { name: '교정 등록' });
    await expect(registerButton).toBeVisible({ timeout: 5000 });
    await registerButton.click();

    // 다이얼로그
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 필수 입력 — 교정일/다음교정일은 기본값이 자동 채워짐
    // 교정 기관
    await dialog.getByLabel('교정 기관 *').fill('한국표준과학연구원(KRISS)');

    // 교정성적서 번호
    await dialog.getByLabel('교정성적서 번호 *').fill('CAL-E2E-DOC-001');

    // 교정 결과 선택
    const resultSelect = dialog.locator('button[role="combobox"]').first();
    await resultSelect.click();
    // "적합" 옵션 선택 (exact: true — "부적합", "조건부 적합" 제외)
    const passOption = page.getByRole('option', { name: '적합', exact: true });
    await expect(passOption).toBeVisible({ timeout: 3000 });
    await passOption.click();

    // 교정성적서 파일 첨부
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-certificate.pdf'));

    // 제출
    const submitButton = dialog.getByRole('button', { name: /등록.*승인/ });
    await submitButton.click();

    // 성공 확인: 다이얼로그가 닫히거나 성공 토스트
    await expect(dialog).not.toBeVisible({ timeout: 15000 });

    // 교정 이력 탭에서 새로 등록된 교정 확인 — 교정 기관명으로 검증
    // (교정성적서 번호는 테이블 컬럼에 표시되지 않음)
    await expect(page.getByText('한국표준과학연구원(KRISS)').first()).toBeVisible({
      timeout: 10000,
    });
    // 성적서 다운로드 버튼이 있으면 파일 업로드 성공
    await expect(page.getByRole('button', { name: '성적서 다운로드' }).first()).toBeVisible();
  });
});
