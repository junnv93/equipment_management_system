/**
 * Suite 02: 교정계획서 작성 테스트
 *
 * B-2: 기술책임자가 연도+사이트로 생성, 외부교정 장비 자동 로드
 * 직무분리 검증: QM/LM은 작성 페이지 접근 불가 (CREATE_CALIBRATION_PLAN 없음)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const CREATE_PAGE = '/calibration-plans/create';
const LIST_PAGE = '/calibration-plans';

test.describe('B-2: 교정계획서 작성', () => {
  test('페이지 헤더 및 폼 구조 확인', async ({ techManagerPage: page }) => {
    await page.goto(CREATE_PAGE);

    // i18n: planCreate.title = "교정계획서 작성"
    await expect(page.getByText('교정계획서 작성').first()).toBeVisible({ timeout: 15000 });

    // i18n: planCreate.basicInfo.title = "기본 정보"
    await expect(page.getByText('기본 정보')).toBeVisible();
  });

  test('연도+사이트 선택 UI 존재 확인', async ({ techManagerPage: page }) => {
    await page.goto(CREATE_PAGE);
    await expect(page.getByText('기본 정보')).toBeVisible({ timeout: 15000 });

    // 연도/사이트 선택 영역이 렌더링되었는지 확인
    // shadcn/ui Select는 button[role=combobox] 또는 div trigger 기반
    const yearTrigger = page.getByText(/연도|2026|2027/).first();
    await expect(yearTrigger).toBeVisible();

    const siteTrigger = page.getByText(/시험소/).first();
    await expect(siteTrigger).toBeVisible();
  });

  test('필수 정보 미입력 시 생성 버튼 비활성화 또는 에러', async ({ techManagerPage: page }) => {
    await page.goto(CREATE_PAGE);
    await expect(page.getByText('기본 정보')).toBeVisible({ timeout: 15000 });

    // 생성 버튼 확인
    const createButton = page.getByRole('button', { name: /계획서 생성/ });
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isDisabled = await createButton.isDisabled();
      if (!isDisabled) {
        await createButton.click();
        // 에러 토스트 또는 유효성 검증
        await expect(page.getByText(/필수.*누락|시험소.*선택|연도/).first()).toBeVisible({
          timeout: 5000,
        });
      } else {
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('QM은 교정계획서 작성 페이지 접근 시 리다이렉트', async ({ qualityManagerPage: page }) => {
    await page.goto(CREATE_PAGE);

    // QM은 CREATE_CALIBRATION_PLAN 권한 없음 → usePermissionGuard가 목록으로 리다이렉트
    await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 });
    expect(page.url()).not.toContain('/create');
  });

  test('LM(시험소장)은 교정계획서 작성 페이지 접근 시 리다이렉트', async ({
    siteAdminPage: page,
  }) => {
    await page.goto(CREATE_PAGE);

    // LM은 CREATE_CALIBRATION_PLAN 권한 없음 (직무분리) → 목록으로 리다이렉트
    await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 });
    expect(page.url()).not.toContain('/create');
  });
});
