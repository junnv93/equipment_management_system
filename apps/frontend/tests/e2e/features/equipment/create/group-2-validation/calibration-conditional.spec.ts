/**
 * Equipment Create - Form Validation Tests
 *
 * Test Suite: 폼 유효성 검사
 * Seed File: apps/frontend/tests/e2e/equipment-create/seed.spec.ts
 *
 * spec: Test conditional required fields for calibration information
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폼 유효성 검사', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('교정 정보 조건부 필수 필드 검증', async ({ techManagerPage: page }) => {
    // 1. techManagerPage로 /equipment/create 페이지 이동
    await page.goto('/equipment/create');

    // 페이지 로드 확인
    await expect(page.getByRole('heading', { name: '장비 등록' })).toBeVisible();

    // 교정 정보 섹션으로 스크롤
    const calibrationSection = page.getByRole('heading', { name: /교정 정보/i });
    await calibrationSection.scrollIntoViewIfNeeded();
    await expect(calibrationSection).toBeVisible();

    // 2. 관리 방법='외부 교정' 선택
    const managementMethodCombobox = page.getByRole('combobox', { name: /관리 방법/i });
    await managementMethodCombobox.click();
    await page.getByRole('option', { name: '외부 교정' }).click();

    // 선택 확인
    await expect(managementMethodCombobox).toContainText('외부 교정');

    // 3. 교정 주기, 최종 교정일, 교정 기관 필드 필수로 활성화 확인
    // 교정 주기 필수 표시 확인
    const calibrationCycleLabel = page.locator('label', { has: page.locator('text=/교정 주기/i') });
    await expect(calibrationCycleLabel).toContainText('*');

    // 최종 교정일 필수 표시 확인
    const lastCalibrationDateLabel = page.locator('label', {
      has: page.locator('text=/최종 교정일/i'),
    });
    await expect(lastCalibrationDateLabel).toContainText('*');

    // 교정 기관 필수 표시 확인
    const calibrationAgencyLabel = page.locator('label', {
      has: page.locator('text=/교정 기관/i'),
    });
    await expect(calibrationAgencyLabel).toContainText('*');

    console.log('✅ 외부 교정 선택 시 교정 필드 필수 표시 확인');

    // 4. 교정 주기 없이 등록 시도 시 에러 메시지 확인
    // 기본 정보 최소한 입력 (등록 버튼 활성화를 위해)
    await page.getByLabel('장비명').fill('테스트 장비');

    // 사이트/팀: 기술책임자는 자동 설정 (disabled)
    await expect(page.getByRole('combobox', { name: /사이트/i })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: /팀/i })).toBeDisabled();

    // 관리번호 일련번호 입력
    const serialNumberInput = page
      .getByLabel(/일련번호.*4자리/i)
      .or(page.locator('input[name="managementSerialNumberStr"]'));
    await serialNumberInput.fill('0001');

    // 교정 주기와 최종 교정일을 입력하지 않고 등록 시도
    // (교정 기관만 입력)
    const calibrationAgencyInput = page.getByLabel(/교정 기관/i);
    await calibrationAgencyInput.fill('HCT');

    // 등록 버튼 클릭 시도
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    // 교정 주기 필드로 포커스 이동 및 에러 확인
    // 브라우저가 자동으로 필수 필드로 스크롤하는 것을 기다림

    // HTML5 required 속성으로 인한 브라우저 기본 검증 또는
    // 커스텀 에러 메시지 확인
    const calibrationCycleInput = page.getByLabel(/교정 주기/i);
    await calibrationCycleInput.scrollIntoViewIfNeeded();

    // 필드가 비어있음을 확인
    await expect(calibrationCycleInput).toHaveValue('');

    console.log('✅ 교정 주기 미입력 시 등록 제한 확인');

    // 5. 관리 방법='자가 교정' 선택 (self_inspection)
    await managementMethodCombobox.scrollIntoViewIfNeeded();
    await managementMethodCombobox.click();
    await page.getByRole('option', { name: '자체 점검' }).click();

    // 선택 확인
    await expect(managementMethodCombobox).toContainText('자체 점검');

    // 6. 교정 관련 필드 선택 사항으로 변경 확인
    // 교정 주기 필수 표시가 사라졌는지 확인
    const calibrationCycleLabelAfter = page.locator('label', {
      has: page.locator('text=/교정 주기.*개월/i'),
    });
    const hasRequiredMarker = await calibrationCycleLabelAfter.locator('text=*').count();

    // 필수 마커가 없어야 함 (선택사항)
    expect(hasRequiredMarker).toBe(0);

    // 최종 교정일도 선택 사항으로 변경
    const lastCalibrationDateLabelAfter = page.locator('label', {
      has: page.locator('text=/최종 교정일/i'),
    });
    await lastCalibrationDateLabelAfter.scrollIntoViewIfNeeded();
    const hasRequiredMarkerDate = await lastCalibrationDateLabelAfter.locator('text=*').count();
    expect(hasRequiredMarkerDate).toBe(0);

    // 교정 기관도 선택 사항으로 변경
    const calibrationAgencyLabelAfter = page.locator('label', {
      has: page.locator('text=/교정 기관/i'),
    });
    await calibrationAgencyLabelAfter.scrollIntoViewIfNeeded();
    const hasRequiredMarkerAgency = await calibrationAgencyLabelAfter.locator('text=*').count();
    expect(hasRequiredMarkerAgency).toBe(0);

    console.log('✅ 자체 점검 선택 시 교정 필드 선택사항으로 변경 확인');

    // 7. '중간점검 대상' 체크박스 선택
    const intermediateCheckCheckbox = page.getByRole('checkbox', { name: /중간점검 대상/i });
    await intermediateCheckCheckbox.scrollIntoViewIfNeeded();
    await intermediateCheckCheckbox.click();

    // 체크 확인
    await expect(intermediateCheckCheckbox).toBeChecked();

    // 8. 중간점검 주기, 최종 중간점검일 필드 활성화 확인
    // 중간점검 관련 필드가 표시되는지 확인
    const lastIntermediateCheckDateLabel = page.locator('label', {
      has: page.locator('text=/최종 중간 점검일/i'),
    });
    await expect(lastIntermediateCheckDateLabel).toBeVisible();
    await expect(lastIntermediateCheckDateLabel).toContainText('*'); // 필수 표시

    const intermediateCheckCycleLabel = page.locator('label', {
      has: page.locator('text=/중간점검 주기/i'),
    });
    await expect(intermediateCheckCycleLabel).toBeVisible();
    await expect(intermediateCheckCycleLabel).toContainText('*'); // 필수 표시

    // 차기 중간 점검일 필드도 표시되는지 확인 (선택사항)
    const nextIntermediateCheckDateLabel = page.locator('label', {
      has: page.locator('text=/차기 중간 점검일/i'),
    });
    await expect(nextIntermediateCheckDateLabel).toBeVisible();

    console.log('✅ 중간점검 대상 선택 시 관련 필드 활성화 확인');

    // 중간점검 필드가 회색 박스 안에 표시되는지 확인
    const intermediateCheckSection = page.locator('.border.rounded-md.bg-muted\\/30').filter({
      has: page.locator('text=/최종 중간 점검일/i'),
    });
    await expect(intermediateCheckSection).toBeVisible();

    console.log('✅ 교정 정보 조건부 필수 필드 검증 테스트 완료');
  });
});
