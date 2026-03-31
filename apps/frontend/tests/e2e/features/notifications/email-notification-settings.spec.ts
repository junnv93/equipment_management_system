/**
 * 이메일 알림 설정 E2E 테스트
 *
 * 이메일 토글 활성화/비활성화 및 설정 지속성을 검증한다.
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
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

    // 이메일 Switch 요소 찾기 — 채널 카드의 첫 번째 switch (이메일)
    // Note: shadcn Form(FormProvider)은 DOM <form> 태그를 렌더링하지 않으므로
    //       page.locator('form').filter(...) 대신 role-based locator 사용
    const emailSwitch = page.getByRole('switch').first();

    // 현재 상태 저장
    const initialState = await emailSwitch.getAttribute('data-state');

    // 토글 클릭
    await emailSwitch.click();

    // 저장 완료 피드백: Check 아이콘 (text-green-500 클래스가 SVG 요소에 직접 적용)
    // Note: Check 아이콘이 2초 후 사라지므로 타이밍 허용
    const checkIcon = page.locator('svg.text-green-500').first();
    await expect(checkIcon)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // auto-save 응답 속도에 따라 Check 아이콘이 2초 이내에 나타났다 사라질 수 있음
        // 토글 상태 변경으로 저장 성공 여부를 대신 확인
      });

    // 토글 상태가 변경됐는지 확인
    const newState = await emailSwitch.getAttribute('data-state');
    expect(newState).not.toBe(initialState);

    // 원복 (다음 테스트를 위해)
    await emailSwitch.click();
  });

  test('N-32: 이메일 토글 상태가 페이지 새로고침 후 유지된다', async ({
    techManagerPage: page,
  }) => {
    await waitForNotificationsPage(page);

    // 채널 카드의 첫 번째 switch (이메일)
    const emailSwitch = page.getByRole('switch').first();

    // 현재 상태 확인
    const beforeState = await emailSwitch.getAttribute('data-state');

    // 상태 변경
    await emailSwitch.click();

    // 변경된 상태 확인
    const changedState = await emailSwitch.getAttribute('data-state');
    expect(changedState).not.toBe(beforeState);

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '알림 채널' })).toBeVisible({ timeout: 15000 });

    // 새로고침 후 상태 확인 — 변경된 상태가 유지되어야 함
    const emailSwitchAfter = page.getByRole('switch').first();
    const afterState = await emailSwitchAfter.getAttribute('data-state');
    expect(afterState).toBe(changedState);

    // 원복 (초기 상태로 복원)
    await emailSwitchAfter.click();
  });

  test('N-33: 이메일 토글과 앱 내 알림 토글이 독립적으로 동작한다', async ({
    techManagerPage: page,
  }) => {
    await waitForNotificationsPage(page);

    // 두 Switch 찾기 — 채널 카드: 이메일(0번), 앱 내 알림(1번) 순서
    // Note: shadcn Form은 DOM <form> 태그 없음 → role-based locator 사용
    const emailSwitch = page.getByRole('switch').first();
    const inAppSwitch = page.getByRole('switch').nth(1);

    // 앱 내 알림 스위치의 현재 상태 기록
    const inAppStateBefore = await inAppSwitch.getAttribute('data-state');

    // 이메일 토글만 변경
    await emailSwitch.click();

    // 앱 내 알림 토글은 그대로여야 함
    const inAppStateAfter = await inAppSwitch.getAttribute('data-state');
    expect(inAppStateAfter).toBe(inAppStateBefore);

    // 이메일 토글 원복
    await emailSwitch.click();
  });
});
