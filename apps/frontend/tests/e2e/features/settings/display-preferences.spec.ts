/**
 * 표시 설정(Display Preferences) E2E 테스트
 *
 * 검증 대상:
 * - 언어(locale) 변경 후 즉시 반영
 * - 소프트 네비게이션 후 설정 유지 (TC2 회귀 방지)
 * - 저장 후 Save 버튼 비활성화
 *
 * 아키텍처 노트:
 * - setLocaleViaApi(): 백엔드 직접 호출로 사전 상태 설정 (UI 독립적)
 * - serial 모드: DB 상태 변경 테스트 → TOCTOU 레이스 방지
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

/** 백엔드 API로 locale 직접 설정 (UI 우회, 테스트 상태 독립성 확보) */
async function setLocaleViaApi(
  page: import('@playwright/test').Page,
  locale: 'ko' | 'en'
): Promise<void> {
  const backendUrl = BASE_URLS.BACKEND;
  await page.evaluate(
    async ({ targetLocale, backendUrl: url }) => {
      const session = await fetch('/api/auth/session').then((r) => r.json());
      const accessToken = session?.accessToken;
      if (!accessToken) throw new Error('No access token');
      const res = await fetch(`${url}/api/users/me/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ locale: targetLocale }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    },
    { targetLocale: locale, backendUrl }
  );
}

test.describe('표시 설정 - 언어 변경', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async ({ testOperatorPage: page }) => {
    // 테스트 후 DB를 초기 상태(ko)로 복원
    await page.goto('/settings/display');
    await page.waitForLoadState('load');
    await setLocaleViaApi(page, 'ko');
  });

  test('TC-01: 한국어 → 영어 저장 후 Language Select가 English를 표시한다', async ({
    testOperatorPage: page,
  }) => {
    // 1. 초기 상태 보장: DB locale='ko'로 설정
    await page.goto('/settings/display');
    await page.waitForLoadState('load');
    await setLocaleViaApi(page, 'ko');

    // 2. locale='ko'로 페이지 재로드
    const [getRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(BASE_URLS.BACKEND) &&
          r.url().includes('me/preferences') &&
          r.request().method() === 'GET'
      ),
      page.goto('/settings/display'),
    ]);
    const responseBody = await getRes.json();
    const prefs = responseBody?.data ?? responseBody;
    expect(prefs.locale, '초기 locale이 ko이어야 함').toBe('ko');

    // 3. Language Select가 '한국어'를 표시하는지 확인
    const localeSelect = page.getByLabel(/^언어$|^Language$/);
    await expect(localeSelect).toBeVisible({ timeout: 10000 });
    await expect(localeSelect).toContainText('한국어');

    // 4. English로 변경
    await localeSelect.click();
    await page.getByRole('option', { name: 'English' }).click();

    // 5. Save 버튼 활성화 확인 (dirty 상태)
    const saveBtn = page.getByRole('button', { name: /저장|Save/ });
    await expect(saveBtn).toBeEnabled();

    // 6. 저장 (PATCH 완료 대기)
    const [patchRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('me/preferences') && r.request().method() === 'PATCH'
      ),
      saveBtn.click(),
    ]);
    const patchBody = await patchRes.json();
    const patchData = patchBody?.data ?? patchBody;
    expect(patchData.locale, 'PATCH 응답 locale이 en이어야 함').toBe('en');

    // 7. router.refresh() 후 영어 UI로 전환 — Language Select가 English를 표시
    const localeSelectAfter = page.getByLabel(/^언어$|^Language$/);
    await expect(localeSelectAfter).toContainText('English', { timeout: 15000 });

    // 8. 저장 직후 Save 버튼이 비활성화되어야 함 (form.reset(variables) 효과)
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });
  });

  test('TC-02: 다른 설정으로 이동 후 복귀해도 영어가 유지된다 (소프트 네비게이션 회귀)', async ({
    testOperatorPage: page,
  }) => {
    // 이 테스트는 TC-01과 독립적으로도 동작할 수 있도록 직접 en으로 설정
    await page.goto('/settings/display');
    await page.waitForLoadState('load');
    await setLocaleViaApi(page, 'en');

    // 알림 설정으로 이동 (소프트 네비게이션)
    await page.goto('/settings/notifications');
    await page.waitForLoadState('load');
    await page.waitForSelector('main, article, h1, h2', { timeout: 10000 });

    // 표시 설정으로 복귀
    await page.goto('/settings/display');
    await page.waitForLoadState('load');

    // Language Select가 English를 표시하는지 확인 (핵심 회귀 검증)
    // 이전 버그: useEffect 타이밍 문제 → Radix Select가 '' (빈 값) 표시
    // 수정 후:  values 옵션으로 동기적 동기화 → 'English' 정상 표시
    const localeSelect = page.getByLabel(/^언어$|^Language$/);
    await expect(localeSelect).toBeVisible({ timeout: 10000 });
    await expect(localeSelect).toContainText('English', { timeout: 10000 });
  });

  test('TC-03: 영어 상태에서 한국어로 변경 후 저장하면 한국어가 표시된다', async ({
    testOperatorPage: page,
  }) => {
    // en 상태 보장
    await page.goto('/settings/display');
    await page.waitForLoadState('load');
    await setLocaleViaApi(page, 'en');

    await page.goto('/settings/display');
    await page.waitForLoadState('load');

    const localeSelect = page.getByLabel(/^언어$|^Language$/);
    await expect(localeSelect).toBeVisible({ timeout: 10000 });
    await expect(localeSelect).toContainText('English', { timeout: 10000 });

    // 한국어로 변경
    await localeSelect.click();
    await page.getByRole('option', { name: '한국어' }).click();

    // 저장
    const saveBtn = page.getByRole('button', { name: /저장|Save/ });
    await expect(saveBtn).toBeEnabled();
    const [patchRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('me/preferences') && r.request().method() === 'PATCH'
      ),
      saveBtn.click(),
    ]);
    const patchBody = await patchRes.json();
    const patchData = patchBody?.data ?? patchBody;
    expect(patchData.locale, 'PATCH 응답 locale이 ko이어야 함').toBe('ko');

    // 한국어 UI로 전환 확인
    const localeSelectAfter = page.getByLabel(/^언어$|^Language$/);
    await expect(localeSelectAfter).toContainText('한국어', { timeout: 15000 });
  });
});

test.describe('표시 설정 - 기타 설정', () => {
  test('TC-04: 페이지당 항목 수 변경 후 저장하면 즉시 반영된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/settings/display');
    await page.waitForLoadState('load');

    // 페이지당 항목 수 필드 찾기
    const itemsSelect = page.getByLabel(/페이지당 항목 수|Items Per Page/);
    await expect(itemsSelect).toBeVisible({ timeout: 10000 });

    // 현재 값이 20인 경우 50으로 변경 (기본값이 20이라 항상 변경 가능)
    await itemsSelect.click();
    await page.getByRole('option', { name: /50/ }).click();

    const saveBtn = page.getByRole('button', { name: /저장|Save/ });
    await expect(saveBtn).toBeEnabled();

    const [patchRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('me/preferences') && r.request().method() === 'PATCH'
      ),
      saveBtn.click(),
    ]);
    expect(patchRes.status()).toBe(200);

    // 저장 후 Save 버튼 비활성화 확인
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // 복원: 20으로 되돌리기
    await itemsSelect.click();
    await page.getByRole('option', { name: /20/ }).click();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('me/preferences') && r.request().method() === 'PATCH'
      ),
      saveBtn.click(),
    ]);
  });
});
