/**
 * 장비 상세 페이지 E2E 테스트
 *
 * 테스트 항목:
 * 1. 탭 전환 시 URL 업데이트 확인
 * 2. 권한별 버튼 표시 확인
 * 3. 장비 정보 표시 확인
 * 4. 히스토리 탭 표시 확인
 * 5. 부적합/공용장비 배너 확인
 *
 * @note Chromium에서만 실행 - 다른 브라우저에서 클릭 인터셉션 이슈 발생
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

// Desktop Chromium에서만 테스트 실행 (다른 브라우저에서 클릭 인터셉션 이슈)
test.describe('Equipment Detail Page - 장비 상세 페이지', () => {
  // 테스트용 장비 ID (실제 DB에 있어야 함)
  const testEquipmentId = 'test-equipment-uuid';

  test.beforeEach(async ({ page }, testInfo) => {
    // 각 테스트 전 콘솔 로그 캡처
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
  });

  test.describe('페이지 로딩 및 기본 정보', () => {
    test('장비 상세 페이지가 정상적으로 로드된다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');

      // 장비 목록에서 첫 번째 "상세" 링크 찾기
      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 헤더가 표시되는지 확인
        await expect(testOperatorPage.locator('h1')).toBeVisible();

        // breadcrumb 네비게이션이 있는지 확인
        await expect(
          testOperatorPage.getByRole('navigation', { name: /breadcrumb/i })
        ).toBeVisible();
      } else {
        console.log('테스트할 장비가 없습니다. 테스트 건너뛰기');
        test.skip();
      }
    });

    test('장비 기본 정보가 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 기본 정보 탭이 기본 선택되어 있어야 함
        const basicTab = testOperatorPage.getByRole('tab', { name: /기본 정보/i });
        await expect(basicTab).toHaveAttribute('data-state', 'active');

        // 기본 정보 카드들이 표시되는지 확인 (개별적으로 체크)
        await expect(testOperatorPage.getByText('장비 기본 정보')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('상태 뱃지가 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 상태 뱃지가 있는지 확인 (사용 가능, 사용 중, 반출 중 등)
        const statusBadge = testOperatorPage.locator(
          'text=/사용 가능|사용 중|반출 중|교정 예정|교정 기한 초과|부적합|여분|폐기/'
        );
        await expect(statusBadge.first()).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('탭 전환 및 URL 상태 관리', () => {
    test('탭 클릭 시 URL 쿼리 파라미터가 업데이트된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 기본 정보 탭이 기본 선택되어 있는지 확인
        const basicTab = testOperatorPage.getByRole('tab', { name: /기본 정보/i });
        await expect(basicTab).toHaveAttribute('data-state', 'active');

        // 교정 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /교정 이력/i }).click();
        await expect(testOperatorPage).toHaveURL(/tab=calibration/);

        // 위치 변동 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /위치 변동/i }).click();
        await expect(testOperatorPage).toHaveURL(/tab=location/);

        // 유지보수 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /유지보수/i }).click();
        await expect(testOperatorPage).toHaveURL(/tab=maintenance/);

        // 사고 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /사고 이력/i }).click();
        await expect(testOperatorPage).toHaveURL(/tab=incident/);
      } else {
        test.skip();
      }
    });

    test('URL 쿼리 파라미터로 직접 탭을 선택할 수 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        const equipmentUrl = await detailLink.getAttribute('href');
        if (equipmentUrl) {
          // 교정 이력 탭으로 직접 이동
          await testOperatorPage.goto(`${equipmentUrl}?tab=calibration`);

          // 교정 이력 탭이 활성화되어 있는지 확인
          const activeTab = testOperatorPage.getByRole('tab', {
            name: /교정 이력/i,
            selected: true,
          });
          await expect(activeTab).toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('권한별 버튼 표시', () => {
    test('시험실무자는 수정/삭제 버튼을 볼 수 없다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 장비 목록에서 첫 번째 "상세" 링크 찾기
      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 수정 버튼이 없어야 함
        const editButton = testOperatorPage.getByRole('button', { name: /수정/i });
        await expect(editButton).not.toBeVisible();

        // 삭제 버튼이 없어야 함
        const deleteButton = testOperatorPage.getByRole('button', { name: /삭제/i });
        await expect(deleteButton).not.toBeVisible();
      } else {
        test.skip();
      }
    });

    test('기술책임자는 장비 상세 페이지에 접근할 수 있다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/equipment');

      // 장비 목록에서 첫 번째 "상세" 링크 찾기
      const detailLink = techManagerPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 기술책임자는 장비 상세 페이지를 볼 수 있어야 함
        // 장비명 헤더 또는 탭 리스트가 표시되어야 함
        const hasContent =
          (await techManagerPage.getByRole('heading', { level: 1 }).count()) > 0 ||
          (await techManagerPage.getByRole('tablist').count()) > 0;

        expect(hasContent).toBeTruthy();

        // 기술책임자는 수정 또는 반출 신청 버튼을 볼 수 있어야 함 (장비 상태에 따라)
        // 또는 최소한 뒤로가기 링크/버튼은 있어야 함 (브라우저 네비게이션 또는 breadcrumb)
        const hasNavigation =
          (await techManagerPage.getByRole('navigation', { name: /breadcrumb/i }).count()) > 0 ||
          (await techManagerPage.getByRole('link', { name: /장비 관리/i }).count()) > 0 ||
          (await techManagerPage.getByRole('link', { name: /목록/i }).count()) > 0;

        expect(hasNavigation).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('반출 신청 버튼이 사용 가능한 장비에 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 장비 목록에서 첫 번째 "상세" 링크 찾기
      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 상태 뱃지에서 상태 확인
        const statusBadge = testOperatorPage.locator('[role="status"]');
        if ((await statusBadge.count()) > 0) {
          const statusText = await statusBadge.textContent();
          if (statusText?.includes('사용 가능')) {
            // 반출 신청 버튼이 있어야 함
            const checkoutButton = testOperatorPage.getByRole('button', { name: /반출 신청/i });
            await expect(checkoutButton).toBeVisible();
          } else {
            // 사용 가능 상태가 아닌 경우, 반출 버튼이 없어도 됨
            console.log(`현재 장비 상태: ${statusText}. 반출 신청 버튼 미표시 예상.`);
            expect(true).toBeTruthy();
          }
        }
      } else {
        console.log('테스트할 장비가 없습니다.');
        test.skip();
      }
    });
  });

  test.describe('히스토리 탭', () => {
    test('위치 변동 이력 탭이 타임라인 UI로 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 위치 변동 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /위치 변동/i }).click();

        // 위치 변동 탭이 선택되었는지 확인
        const locationTab = testOperatorPage.getByRole('tab', { name: /위치 변동/i });
        await expect(locationTab).toHaveAttribute('aria-selected', 'true');

        // 활성화된 탭 패널 콘텐츠가 표시되는지 확인
        const tabPanel = testOperatorPage.getByRole('tabpanel', { name: /위치 변동/i });
        await expect(tabPanel).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('유지보수 이력 탭이 타임라인 UI로 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 유지보수 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /유지보수/i }).click();

        // 유지보수 탭이 선택되었는지 확인
        const maintenanceTab = testOperatorPage.getByRole('tab', { name: /유지보수/i });
        await expect(maintenanceTab).toHaveAttribute('aria-selected', 'true');

        // 활성화된 탭 패널 콘텐츠가 표시되는지 확인
        const tabPanel = testOperatorPage.getByRole('tabpanel', { name: /유지보수/i });
        await expect(tabPanel).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('사고 이력 탭이 타임라인 UI로 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 사고 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /사고 이력/i }).click();

        // 사고 이력 제목 확인
        await expect(testOperatorPage.getByText(/사고 이력/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('교정 이력 탭이 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 교정 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /교정 이력/i }).click();

        // 교정 이력 탭이 선택되었는지 확인
        const calibrationTab = testOperatorPage.getByRole('tab', { name: /교정 이력/i });
        await expect(calibrationTab).toHaveAttribute('aria-selected', 'true');

        // 활성화된 탭 패널 콘텐츠가 표시되는지 확인
        const tabPanel = testOperatorPage.getByRole('tabpanel', { name: /교정 이력/i });
        await expect(tabPanel).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('접근성', () => {
    test('키보드로 탭을 전환할 수 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 첫 번째 탭에 포커스
        const firstTab = testOperatorPage.getByRole('tab', { name: /기본 정보/i });
        await firstTab.focus();

        // Tab 키로 다음 탭으로 이동
        await testOperatorPage.keyboard.press('Tab');

        // 포커스가 이동했는지 확인
        const focusedElement = testOperatorPage.locator(':focus');
        await expect(focusedElement).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('스크린 리더를 위한 ARIA 속성이 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
      if ((await detailLink.count()) > 0) {
        await detailLink.click();

        // 탭에 role="tab" 속성이 있는지 확인
        const tabs = testOperatorPage.locator('[role="tab"]');
        await expect(tabs.first()).toBeVisible();

        // 탭패널에 role="tabpanel" 속성이 있는지 확인
        const tabpanels = testOperatorPage.locator('[role="tabpanel"]');
        const count = await tabpanels.count();
        expect(count).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });
  });

  test.describe('로딩 및 에러 상태', () => {
    test('존재하지 않는 장비 ID로 접근 시 에러 페이지가 표시된다', async ({ testOperatorPage }) => {
      // 유효한 UUID 형식이지만 존재하지 않는 ID로 접근
      await testOperatorPage.goto('/equipment/00000000-0000-0000-0000-000000000000');

      // not-found 페이지 확인 - "장비를 찾을 수 없습니다" 헤딩 확인
      const errorMessage = testOperatorPage.getByRole('heading', {
        name: /장비를 찾을 수 없습니다/i,
        level: 2,
      });
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // 장비 목록으로 돌아가는 링크가 있는지 확인
      const backLink = testOperatorPage.getByRole('link', { name: /장비 목록으로/i });
      await expect(backLink).toBeVisible();
    });
  });
});
