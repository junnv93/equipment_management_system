/**
 * 알림 설정 E2E 테스트
 *
 * /settings/notifications: 카테고리 토글 변경, 저장, 새로고침 후 persist 확인
 *
 * ## UI 구조 (SSOT)
 *
 * 설정 페이지(/settings/notifications)는 탭 없이 두 카드로 구성:
 * - Card 1: "알림 채널" → 이메일 토글, 앱 내 알림 토글 (auto-save)
 * - Card 2: "알림 유형" → 카테고리 토글 (auto-save)
 * 두 카드 모두 항상 표시됨 (탭 전환 불필요)
 *
 * ## 저장 방식
 *
 * 명시적 "저장" 버튼 없음. 토글 변경 시 PATCH /api/notifications/settings 자동 호출.
 * 저장 피드백: Loader2 아이콘(저장 중) → Check 아이콘(2초, 저장 완료)
 *
 * ## 카테고리 라벨 SSOT
 *
 * NOTIFICATION_CATEGORY_LABELS (shared-constants):
 * checkout='반출', calibration='교정', calibration_plan='교정계획',
 * non_conformance='부적합', disposal='폐기', equipment_import='장비 반입',
 * equipment='장비', system='시스템'
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
 * waitForLoadState('networkidle')는 절대 resolve되지 않음.
 * 대신 waitForLoadState('domcontentloaded') + 명시적 요소 대기 사용.
 *
 * storageState 기반 인증 (auth.fixture.ts)
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 알림 설정 페이지 로드 대기: SSE-safe, 카드 기반 UI */
async function waitForSettingsPage(page: import('@playwright/test').Page) {
  await page.goto('/settings/notifications');
  await page.waitForLoadState('domcontentloaded');
  // "알림 채널" 카드 제목이 나타날 때까지 대기 (데이터 로딩 완료 지표)
  await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible({ timeout: 15000 });
}

test.describe('알림 설정', () => {
  test.describe.configure({ mode: 'serial' }); // N-21/N-22 모두 상태 변경 — 순차 실행 필수

  test('N-20: 설정 페이지가 정상 로드된다', async ({ techManagerPage: page }) => {
    await waitForSettingsPage(page);

    // 두 카드 모두 항상 표시됨 (탭 없이 스크롤로 접근)
    // Note: "알림 설정"은 브레드크럼 텍스트이며 heading role 아님 — assertion 제거
    await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '알림 유형' })).toBeVisible();
  });

  test('N-21: 카테고리 토글 변경 시 auto-save된다', async ({ techManagerPage: page }) => {
    await waitForSettingsPage(page);

    // Card 2 "알림 유형" 섹션 확인 (항상 표시됨)
    await expect(page.getByRole('heading', { name: '알림 유형' })).toBeVisible();

    // SSOT 카테고리 라벨 확인 (NOTIFICATION_CATEGORY_LABELS)
    // exact: true 필수 — 라벨과 설명문에 유사 텍스트가 중복 존재
    await expect(page.getByText('반출', { exact: true })).toBeVisible();
    await expect(page.getByText('교정계획', { exact: true })).toBeVisible();
    await expect(page.getByText('시스템', { exact: true })).toBeVisible();

    // PATCH API 응답 인터셉터 설정 (auto-save 검증)
    const saveResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/notifications/settings') && resp.request().method() === 'PATCH'
    );

    // 마지막 카테고리 토글(시스템) 변경 → auto-save 트리거
    const switches = page.getByRole('switch');
    const lastSwitch = switches.last();
    await expect(lastSwitch).toBeVisible();
    const originalState = await lastSwitch.getAttribute('data-state');
    await lastSwitch.click();

    // auto-save API 호출 확인
    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBe(200);

    // 토글 상태 변경 확인
    const newState = await lastSwitch.getAttribute('data-state');
    expect(newState).not.toBe(originalState);

    // 원복 (다음 테스트를 위해)
    const restorePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/notifications/settings') && resp.request().method() === 'PATCH'
    );
    await lastSwitch.click();
    await restorePromise;
  });

  test('N-22: 새로고침 후 설정이 유지된다', async ({ techManagerPage: page }) => {
    await waitForSettingsPage(page);

    // Card 2의 마지막 switch(시스템 카테고리) 상태 확인
    const lastSwitch = page.getByRole('switch').last();
    await expect(lastSwitch).toBeVisible();
    const originalState = await lastSwitch.getAttribute('data-state');

    // 상태 변경 후 auto-save 대기
    const saveResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/notifications/settings') && resp.request().method() === 'PATCH'
    );
    await lastSwitch.click();
    await saveResponsePromise;

    // 변경된 상태 확인
    const changedState = await lastSwitch.getAttribute('data-state');
    expect(changedState).not.toBe(originalState);

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible({ timeout: 15000 });

    // 새로고침 후 마지막 switch 상태 재확인 — 변경된 상태가 유지되어야 함
    const lastSwitchAfter = page.getByRole('switch').last();
    await expect(lastSwitchAfter).toBeVisible();
    const afterState = await lastSwitchAfter.getAttribute('data-state');
    expect(afterState).toBe(changedState);

    // 원복 (초기 상태로 복원)
    const restoreResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/notifications/settings') && resp.request().method() === 'PATCH'
    );
    await lastSwitchAfter.click();
    await restoreResponsePromise;
  });
});
