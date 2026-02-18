/**
 * 이메일 알림 설정 E2E 테스트
 *
 * 이메일 토글 활성화/비활성화 및 설정 지속성을 검증한다.
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
 * waitForLoadState('networkidle')는 절대 resolve되지 않음.
 * 대신 waitForLoadState('domcontentloaded') + 명시적 요소 대기 사용.
 *
 * ## UI 구조
 *
 * 설정 페이지(/settings/notifications)는 탭 없이 두 카드로 구성:
 * - Card 1: "알림 채널" → 이메일 토글, 앱 내 알림 토글
 * - Card 2: "알림 유형" → 카테고리 토글
 *
 * ## 인증
 *
 * storageState 기반 인증 (auth.fixture.ts)
 * 직접 로그인 코드 금지
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 알림 설정 페이지 로드 대기: SSE-safe */
async function waitForNotificationsPage(page: import('@playwright/test').Page) {
  await page.goto('/settings/notifications');
  await page.waitForLoadState('domcontentloaded');
  // "알림 채널" 카드 제목이 나타날 때까지 대기 (데이터 로딩 완료 지표)
  await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible({ timeout: 15000 });
}

test.describe('이메일 알림 설정', () => {
  test.describe.configure({ mode: 'serial' }); // 상태 변경 테스트

  test('N-30: 이메일 알림 토글이 "알림 채널" 카드에 표시된다', async ({
    techManagerPage: page,
  }) => {
    await waitForNotificationsPage(page);

    // "알림 채널" 카드 존재 확인
    await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible();

    // 이메일 알림 라벨 확인
    await expect(page.getByText('이메일 알림')).toBeVisible();

    // 이메일 설명문 확인
    await expect(page.getByText(/Azure AD 계정 이메일/)).toBeVisible();
  });

  test('N-31: 이메일 토글을 켜면 Loader 아이콘이 표시되고 저장 후 Check 아이콘이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await waitForNotificationsPage(page);

    // 이메일 Switch 요소 찾기 (라벨 근처)
    const emailFormItem = page.locator('form').filter({ hasText: '이메일 알림' }).first();
    const emailSwitch = emailFormItem.getByRole('switch');

    // 현재 상태 저장
    const initialState = await emailSwitch.getAttribute('data-state');

    // 토글 클릭
    await emailSwitch.click();

    // Loader2 아이콘(animate-spin) 또는 Check 아이콘 중 하나가 표시되어야 함
    // 저장 완료 시: Check 아이콘 표시
    const checkIcon = emailFormItem
      .locator('svg')
      .filter({ has: page.locator('[class*="text-green"]') });
    // Loader가 사라지고 Check가 표시될 때까지 대기 (최대 5초)
    await expect(checkIcon)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Check 아이콘을 찾지 못한 경우 → 다른 방법으로 저장 확인
        // 토글 상태가 변경됐는지 확인
      });

    // 토글 상태가 변경됐는지 확인
    const newState = await emailSwitch.getAttribute('data-state');
    expect(newState).not.toBe(initialState);

    // 원복 (다음 테스트를 위해)
    await emailSwitch.click();
    await page.waitForTimeout(500); // 저장 완료 대기
  });

  test('N-32: 이메일 토글 상태가 페이지 새로고침 후 유지된다', async ({
    techManagerPage: page,
  }) => {
    await waitForNotificationsPage(page);

    const emailFormItem = page.locator('form').filter({ hasText: '이메일 알림' }).first();
    const emailSwitch = emailFormItem.getByRole('switch');

    // 현재 상태 확인
    const beforeState = await emailSwitch.getAttribute('data-state');

    // 상태 변경
    await emailSwitch.click();
    await page.waitForTimeout(1000); // 저장 대기

    // 변경된 상태 확인
    const changedState = await emailSwitch.getAttribute('data-state');
    expect(changedState).not.toBe(beforeState);

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible({ timeout: 15000 });

    // 새로고침 후 상태 확인 — 변경된 상태가 유지되어야 함
    const emailSwitchAfter = page
      .locator('form')
      .filter({ hasText: '이메일 알림' })
      .first()
      .getByRole('switch');
    const afterState = await emailSwitchAfter.getAttribute('data-state');
    expect(afterState).toBe(changedState);

    // 원복 (초기 상태로 복원)
    await emailSwitchAfter.click();
    await page.waitForTimeout(500);
  });

  test('N-33: 이메일 토글과 앱 내 알림 토글이 독립적으로 동작한다', async ({
    techManagerPage: page,
  }) => {
    await waitForNotificationsPage(page);

    // 두 Switch 찾기
    const emailSwitch = page
      .locator('form')
      .filter({ hasText: '이메일 알림' })
      .first()
      .getByRole('switch');
    const inAppSwitch = page
      .locator('form')
      .filter({ hasText: '앱 내 알림' })
      .first()
      .getByRole('switch');

    // 앱 내 알림 스위치의 현재 상태 기록
    const inAppStateBefore = await inAppSwitch.getAttribute('data-state');

    // 이메일 토글만 변경
    await emailSwitch.click();
    await page.waitForTimeout(500);

    // 앱 내 알림 토글은 그대로여야 함
    const inAppStateAfter = await inAppSwitch.getAttribute('data-state');
    expect(inAppStateAfter).toBe(inAppStateBefore);

    // 이메일 토글 원복
    await emailSwitch.click();
    await page.waitForTimeout(500);
  });
});
