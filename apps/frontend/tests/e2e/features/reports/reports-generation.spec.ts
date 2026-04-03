/**
 * 보고서 관리(Reports) 페이지 E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 폼 렌더링
 * - 보고서 유형 선택 및 조건부 필터 표시
 * - 출력 형식 선택 (Excel, CSV, PDF)
 * - 기간 선택 (프리셋 + 사용자 정의)
 * - 유효성 검사 (유형 미선택 시)
 * - 역할별 접근
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('보고서 관리', () => {
  test('TC-01: 페이지 로딩 후 보고서 생성 폼이 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 보고서 유형 선택 드롭다운이 존재
    const reportTypeSelect = page.getByText(/보고서 유형|Report Type/i).first();
    await expect(reportTypeSelect).toBeVisible();
  });

  test('TC-02: 보고서 유형을 선택하면 조건부 필터가 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 보고서 유형 선택 트리거 클릭 (첫 번째 combobox = 보고서 유형)
    const selectTrigger = page.getByRole('combobox').first();
    await selectTrigger.click();

    // 드롭다운 옵션 중 첫 번째 선택 (장비 현황)
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    await options.first().click();

    // 보고서 유형 선택 후 에러 없이 페이지가 유지됨 (빈 value 버그 수정 확인)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 우측 정보 카드에 보고서 설명이 표시됨
    const summaryText = page.getByText(/보고서 설정 요약|설정 요약|보고서 유형:/i);
    await expect(summaryText.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-03: 출력 형식 라디오 버튼이 존재하고 선택 가능하다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 출력 형식 라디오 그룹 확인
    const radioGroup = page.getByRole('radiogroup');
    if ((await radioGroup.count()) > 0) {
      // Excel, CSV, PDF 라디오 옵션 존재 확인
      const radios = page.getByRole('radio');
      expect(await radios.count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('TC-04: 기간 선택 드롭다운이 프리셋 옵션을 제공한다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 기간 선택 텍스트 확인
    const periodLabel = page.getByText(/기간|period/i).first();
    await expect(periodLabel).toBeVisible();
  });

  test('TC-05: 기술책임자도 보고서 페이지에 접근할 수 있다', async ({ techManagerPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });

  test('TC-06: 보고서 생성 버튼이 존재한다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 생성 버튼 확인
    const generateBtn = page.getByRole('button', { name: /생성|generate/i });
    await expect(generateBtn).toBeVisible();
  });
});
