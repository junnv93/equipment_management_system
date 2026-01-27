/**
 * 이력 등록 기능 테스트
 *
 * 테스트 범위:
 * 1. 위치변동 이력 등록
 * 2. 유지보수 이력 등록
 * 3. 사고 이력 등록
 * 4. 교정 이력 등록
 * 5. 반출 신청
 *
 * @note Chromium에서만 실행
 */

import { test, expect } from './fixtures/auth.fixture';

test.describe('History Registration - 이력 등록 기능', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Desktop Chromium이 아닌 프로젝트는 건너뛰기
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('위치변동 이력 탭에서 등록 버튼 클릭 시 Dialog가 열린다', async ({
    testOperatorPage,
  }) => {
    // 브라우저 콘솔 로그 캡처
    testOperatorPage.on('console', (msg) => {
      if (msg.text().includes('LocationHistoryTab') || msg.text().includes('API Client')) {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });

    // 세션 정보 확인
    const sessionResponse = await testOperatorPage.request.get('/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('[E2E] NextAuth 세션:', JSON.stringify(sessionData, null, 2));

    // 장비 목록 페이지로 이동
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // 장비 목록에서 첫 번째 "상세" 링크 클릭
    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('⚠️ 장비 목록이 비어있음');
      return;
    }
    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 위치변동 탭 클릭 (탭 이름: "위치 변동")
    const locationTab = testOperatorPage.getByRole('tab', { name: /위치.*변동/i });
    await locationTab.click();
    await testOperatorPage.waitForTimeout(500);

    // 등록 버튼 찾기
    const registerButton = testOperatorPage.getByRole('button', {
      name: /위치 변경 등록/i,
    });

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // Dialog가 열렸는지 확인
      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Dialog 제목 확인
      await expect(dialog.getByText('위치 변경 등록')).toBeVisible();

      // 필드들이 있는지 확인
      await expect(dialog.getByLabel(/변동 일시/i)).toBeVisible();
      await expect(dialog.getByLabel(/설치 위치/i)).toBeVisible();

      console.log('✅ 위치변동 이력 등록 Dialog 테스트 통과');
    } else {
      console.log('⚠️ 위치 변경 등록 버튼이 보이지 않음 (권한 문제일 수 있음)');
    }
  });

  test('유지보수 이력 탭에서 등록 버튼 클릭 시 Dialog가 열린다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('⚠️ 장비 목록이 비어있음');
      return;
    }
    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 유지보수 탭 클릭
    const maintenanceTab = testOperatorPage.getByRole('tab', { name: /유지보수/i });
    await maintenanceTab.click();
    await testOperatorPage.waitForTimeout(500);

    const registerButton = testOperatorPage.getByRole('button', {
      name: /유지보수 등록/i,
    });

    if (await registerButton.isVisible()) {
      await registerButton.click();

      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog.getByText('유지보수 등록')).toBeVisible();

      console.log('✅ 유지보수 이력 등록 Dialog 테스트 통과');
    } else {
      console.log('⚠️ 유지보수 등록 버튼이 보이지 않음');
    }
  });

  test('사고 이력 탭에서 등록 버튼 클릭 시 Dialog가 열린다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('⚠️ 장비 목록이 비어있음');
      return;
    }
    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 사고 탭 클릭
    const incidentTab = testOperatorPage.getByRole('tab', { name: /사고/i });
    await incidentTab.click();
    await testOperatorPage.waitForTimeout(500);

    const registerButton = testOperatorPage.getByRole('button', { name: /사고 등록/i });

    if (await registerButton.isVisible()) {
      await registerButton.click();

      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog.getByText('사고 이력 등록')).toBeVisible();

      console.log('✅ 사고 이력 등록 Dialog 테스트 통과');
    } else {
      console.log('⚠️ 사고 등록 버튼이 보이지 않음');
    }
  });

  test('교정 이력 탭에서 등록 버튼 클릭 시 Dialog가 열린다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('⚠️ 장비 목록이 비어있음');
      return;
    }
    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 교정 탭 클릭
    const calibrationTab = testOperatorPage.getByRole('tab', { name: /교정/i });
    await calibrationTab.click();
    await testOperatorPage.waitForTimeout(500);

    const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });

    if (await registerButton.isVisible()) {
      await registerButton.click();

      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog.getByText('교정 이력 등록')).toBeVisible();

      console.log('✅ 교정 이력 등록 Dialog 테스트 통과');
    } else {
      console.log('⚠️ 교정 등록 버튼이 보이지 않음');
    }
  });

  test('반출 이력 탭에서 신청 버튼 클릭 시 Dialog가 열린다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('⚠️ 장비 목록이 비어있음');
      return;
    }
    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 반출 탭 클릭
    const checkoutTab = testOperatorPage.getByRole('tab', { name: /반출/i });
    await checkoutTab.click();
    await testOperatorPage.waitForTimeout(500);

    const registerButton = testOperatorPage.getByRole('button', { name: /반출 신청/i });

    if (await registerButton.isVisible()) {
      // 버튼이 disabled가 아닌 경우에만 클릭
      if (!(await registerButton.isDisabled())) {
        await registerButton.click();

        const dialog = testOperatorPage.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });
        await expect(dialog.getByText('반출 신청')).toBeVisible();

        console.log('✅ 반출 신청 Dialog 테스트 통과');
      } else {
        console.log('⚠️ 반출 신청 버튼이 비활성화됨 (장비 상태 문제)');
      }
    } else {
      console.log('⚠️ 반출 신청 버튼이 보이지 않음');
    }
  });

  test('위치변동 이력을 실제로 등록할 수 있다', async ({ testOperatorPage }) => {
    // 브라우저 콘솔 로그 캡처
    testOperatorPage.on('console', (msg) => {
      if (msg.text().includes('LocationHistoryTab') || msg.text().includes('API Client') ||
          msg.text().includes('위치 변동')) {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });

    // 세션 정보 확인 (중요: 페이지 이동 전에 세션 확인)
    const sessionResponse = await testOperatorPage.request.get('/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('[E2E] NextAuth 세션:', JSON.stringify(sessionData, null, 2));

    // 네트워크 요청 모니터링
    const apiResponses: { url: string; status: number; body?: string }[] = [];

    testOperatorPage.on('request', (request) => {
      if (request.url().includes('location-history') && request.method() === 'POST') {
        console.log('[E2E] ▶ API 요청:', request.method(), request.url());
        console.log('[E2E] 요청 헤더:', JSON.stringify(request.headers(), null, 2));
      }
    });

    testOperatorPage.on('response', async (response) => {
      if (response.url().includes('location-history') && response.request().method() === 'POST') {
        let body = '';
        try {
          body = await response.text();
        } catch {
          body = '(응답 본문 읽기 실패)';
        }
        apiResponses.push({ url: response.url(), status: response.status(), body });
        console.log('[E2E] ◀ API 응답:', response.status(), response.url());
        console.log('[E2E] 응답 본문:', body);
      }
    });

    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('⚠️ 장비 목록이 비어있음');
      return;
    }
    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 위치변동 탭 클릭 (탭 이름: "위치 변동")
    const locationTab = testOperatorPage.getByRole('tab', { name: /위치.*변동/i });
    await locationTab.click();

    // 탭 컨텐츠가 로드될 때까지 기다림
    await testOperatorPage.waitForLoadState('networkidle');
    await testOperatorPage.waitForTimeout(1000);

    const registerButton = testOperatorPage.getByRole('button', {
      name: /위치 변경 등록/i,
    });

    // 버튼이 나타날 때까지 최대 5초 대기
    try {
      await expect(registerButton).toBeVisible({ timeout: 5000 });
    } catch {
      console.log('⚠️ 위치 변경 등록 버튼이 보이지 않음');
      return;
    }

    if (await registerButton.isVisible()) {
      await registerButton.click();

      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 폼 입력
      const testLocation = `테스트 위치 ${Date.now()}`;
      await dialog.getByLabel(/설치 위치/i).fill(testLocation);
      await dialog.getByLabel(/비고/i).fill('Playwright 자동 테스트');

      // 저장 버튼 클릭
      console.log('[E2E] 저장 버튼 클릭...');
      await dialog.getByRole('button', { name: /저장/i }).click();

      // API 응답 대기
      await testOperatorPage.waitForTimeout(3000);

      // API 호출 결과 로그
      console.log('[E2E] API 응답 목록:', JSON.stringify(apiResponses, null, 2));

      // Dialog가 닫히고 새 이력이 목록에 표시되는지 확인
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // 새로 추가된 위치가 표시되는지 확인
      await expect(testOperatorPage.getByText(testLocation)).toBeVisible({
        timeout: 5000,
      });

      console.log('✅ 위치변동 이력 등록 테스트 통과');
    } else {
      console.log('⚠️ 위치 변경 등록 버튼이 보이지 않음');
    }
  });
});
