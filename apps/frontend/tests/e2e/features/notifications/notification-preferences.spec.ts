/**
 * 알림 설정 E2E 테스트
 *
 * /settings/notifications: 카테고리 토글 변경, 저장, 새로고침 후 persist 확인
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
 * waitForLoadState('networkidle')는 절대 resolve되지 않음.
 * 대신 waitForLoadState('domcontentloaded') + 명시적 요소 대기 사용.
 *
 * ## 카테고리 라벨 SSOT
 *
 * NOTIFICATION_CATEGORY_LABELS (shared-constants):
 * checkout='반출', calibration='교정', calibration_plan='교정계획',
 * non_conformance='부적합', disposal='폐기', equipment_import='장비 반입',
 * equipment='장비', system='시스템'
 *
 * storageState 기반 인증 (auth.fixture.ts)
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 알림 설정 페이지 로드 대기: SSE-safe */
async function waitForSettingsPage(page: import('@playwright/test').Page) {
  await page.goto('/settings/notifications');
  await page.waitForLoadState('domcontentloaded');
  // "기본 설정" 탭이 나타날 때까지 대기 (데이터 로딩 완료 지표)
  await expect(page.getByRole('tab', { name: '기본 설정' })).toBeVisible({ timeout: 15000 });
}

test.describe('알림 설정', () => {
  test('N-20: 설정 페이지가 정상 로드된다', async ({ techManagerPage: page }) => {
    await waitForSettingsPage(page);

    // 페이지 제목 (heading으로 특정 — 사이드바/브레드크럼에도 "알림 설정" 존재)
    await expect(page.getByRole('heading', { name: '알림 설정' })).toBeVisible();

    // 탭: "기본 설정", "알림 유형"
    await expect(page.getByRole('tab', { name: '기본 설정' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '알림 유형' })).toBeVisible();
  });

  test('N-21: 카테고리 토글 변경 후 저장한다', async ({ techManagerPage: page }) => {
    await waitForSettingsPage(page);

    // "알림 유형" 탭 클릭
    await page.getByRole('tab', { name: '알림 유형' }).click();

    // 탭 전환 후 카드 제목이 표시될 때까지 대기
    await expect(page.getByText('알림 유형 설정')).toBeVisible({ timeout: 5000 });

    // SSOT 카테고리 라벨 확인 (NOTIFICATION_CATEGORY_LABELS)
    // exact: true 필수 — 라벨과 설명문에 유사 텍스트가 중복 존재
    await expect(page.getByText('반출', { exact: true })).toBeVisible();
    await expect(page.getByText('교정계획', { exact: true })).toBeVisible();
    await expect(page.getByText('시스템', { exact: true })).toBeVisible();

    // 저장 버튼 클릭
    const saveButton = page.getByRole('button', { name: '설정 저장' });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 성공 토스트
    await expect(page.getByText(/저장|성공/)).toBeVisible({ timeout: 5000 });
  });

  test('N-22: 새로고침 후 설정이 유지된다', async ({ techManagerPage: page }) => {
    await waitForSettingsPage(page);

    // "알림 유형" 탭 클릭
    await page.getByRole('tab', { name: '알림 유형' }).click();
    await expect(page.getByText('알림 유형 설정')).toBeVisible({ timeout: 5000 });

    // 시스템 카테고리의 Switch 상태 확인
    const systemSwitch = page.getByRole('switch').last();
    await expect(systemSwitch).toBeVisible();
    const isChecked = await systemSwitch.getAttribute('data-state');

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('tab', { name: '기본 설정' })).toBeVisible({ timeout: 15000 });

    // "알림 유형" 탭 다시 클릭
    await page.getByRole('tab', { name: '알림 유형' }).click();
    await expect(page.getByText('알림 유형 설정')).toBeVisible({ timeout: 5000 });

    // 토글 상태 유지 확인
    const systemSwitchAfter = page.getByRole('switch').last();
    await expect(systemSwitchAfter).toBeVisible();
    const isCheckedAfter = await systemSwitchAfter.getAttribute('data-state');
    expect(isCheckedAfter).toBe(isChecked);
  });
});
