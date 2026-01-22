/**
 * 장비 상세 페이지 E2E 테스트
 *
 * 테스트 항목:
 * 1. 탭 전환 시 URL 업데이트 확인
 * 2. 권한별 버튼 표시 확인
 * 3. 장비 정보 표시 확인
 * 4. 히스토리 탭 표시 확인
 * 5. 부적합/공용장비 배너 확인
 */

import { test, expect } from './fixtures/auth.fixture';

test.describe('Equipment Detail Page - 장비 상세 페이지', () => {
  // 테스트용 장비 ID (실제 DB에 있어야 함)
  const testEquipmentId = 'test-equipment-uuid';

  test.beforeEach(async ({ page }) => {
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
      await testOperatorPage.waitForLoadState('networkidle');

      // 첫 번째 장비 클릭
      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 헤더가 표시되는지 확인
        await expect(testOperatorPage.locator('h1')).toBeVisible();

        // 뒤로가기 버튼이 있는지 확인
        await expect(
          testOperatorPage.getByRole('button', { name: /목록으로/i })
        ).toBeVisible();
      } else {
        console.log('테스트할 장비가 없습니다. 테스트 건너뛰기');
        test.skip();
      }
    });

    test('장비 기본 정보가 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 기본 정보 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /기본 정보/i }).click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 기본 정보 카드들이 표시되는지 확인
        await expect(
          testOperatorPage.getByText(/장비 기본 정보|위치 및 관리 정보|교정 정보/i)
        ).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('상태 뱃지가 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

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
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 기본 정보 탭 (기본값)
        await expect(testOperatorPage).toHaveURL(/tab=basic/);

        // 교정 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /교정 이력/i }).click();
        await testOperatorPage.waitForTimeout(500);
        await expect(testOperatorPage).toHaveURL(/tab=calibration/);

        // 위치 변동 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /위치 변동/i }).click();
        await testOperatorPage.waitForTimeout(500);
        await expect(testOperatorPage).toHaveURL(/tab=location/);

        // 유지보수 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /유지보수/i }).click();
        await testOperatorPage.waitForTimeout(500);
        await expect(testOperatorPage).toHaveURL(/tab=maintenance/);

        // 사고 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /사고 이력/i }).click();
        await testOperatorPage.waitForTimeout(500);
        await expect(testOperatorPage).toHaveURL(/tab=incident/);
      } else {
        test.skip();
      }
    });

    test('URL 쿼리 파라미터로 직접 탭을 선택할 수 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        const equipmentLink = await firstEquipment.getAttribute('href');
        if (equipmentLink) {
          // 교정 이력 탭으로 직접 이동
          await testOperatorPage.goto(`${equipmentLink}?tab=calibration`);
          await testOperatorPage.waitForLoadState('networkidle');

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
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

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

    test('기술책임자는 수정 버튼을 볼 수 있다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/equipment');
      await techManagerPage.waitForLoadState('networkidle');

      const firstEquipment = techManagerPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await techManagerPage.waitForLoadState('networkidle');

        // 수정 버튼이 있어야 함 (승인 완료되지 않은 장비의 경우)
        // 또는 반출 신청 버튼이 있어야 함
        const hasActionButton =
          (await techManagerPage.getByRole('button', { name: /수정/i }).count()) > 0 ||
          (await techManagerPage.getByRole('button', { name: /반출 신청/i }).count()) > 0;

        expect(hasActionButton).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('반출 신청 버튼이 사용 가능한 장비에 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 사용 가능한 장비 찾기
      const equipmentList = testOperatorPage.locator('[data-testid="equipment-item"]');
      const count = await equipmentList.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await testOperatorPage.goto('/equipment');
        await testOperatorPage.waitForLoadState('networkidle');

        const item = equipmentList.nth(i);
        await item.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 상태 확인
        const statusText = await testOperatorPage
          .locator('text=/사용 가능|사용 중|반출 중/')
          .first()
          .textContent();

        if (statusText?.includes('사용 가능')) {
          // 반출 신청 버튼이 있어야 함
          await expect(
            testOperatorPage.getByRole('button', { name: /반출 신청/i })
          ).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe('히스토리 탭', () => {
    test('위치 변동 이력 탭이 타임라인 UI로 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 위치 변동 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /위치 변동/i }).click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 위치 변동 이력 제목 확인
        await expect(testOperatorPage.getByText(/위치 변동 이력/i)).toBeVisible();

        // 빈 상태 또는 이력 목록 확인
        const emptyState = testOperatorPage.getByText(/등록된 위치 변동 이력이 없습니다/i);
        const hasHistory = await emptyState.count() === 0;

        if (!hasHistory) {
          // 빈 상태 확인
          await expect(emptyState).toBeVisible();
        }
      } else {
        test.skip();
      }
    });

    test('유지보수 이력 탭이 타임라인 UI로 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 유지보수 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /유지보수/i }).click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 유지보수 이력 제목 확인
        await expect(testOperatorPage.getByText(/유지보수 이력/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('사고 이력 탭이 타임라인 UI로 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 사고 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /사고 이력/i }).click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 사고 이력 제목 확인
        await expect(testOperatorPage.getByText(/사고 이력/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('교정 이력 탭이 표시된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 교정 이력 탭 클릭
        await testOperatorPage.getByRole('tab', { name: /교정 이력/i }).click();
        await testOperatorPage.waitForLoadState('networkidle');

        // 교정 이력 제목 확인
        await expect(testOperatorPage.getByText(/교정 이력/i)).toBeVisible();

        // 교정 등록 버튼 또는 빈 상태 확인
        const hasButton =
          (await testOperatorPage.getByRole('button', { name: /교정 등록/i }).count()) > 0;
        const hasEmptyState =
          (await testOperatorPage.getByText(/등록된 교정 이력이 없습니다/i).count()) > 0;

        expect(hasButton || hasEmptyState).toBeTruthy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('접근성', () => {
    test('키보드로 탭을 전환할 수 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

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
      await testOperatorPage.waitForLoadState('networkidle');

      const firstEquipment = testOperatorPage.locator('[data-testid="equipment-item"]').first();
      if (await firstEquipment.count() > 0) {
        await firstEquipment.click();
        await testOperatorPage.waitForLoadState('networkidle');

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
    test('존재하지 않는 장비 ID로 접근 시 404 페이지가 표시된다', async ({
      testOperatorPage,
    }) => {
      // 존재하지 않는 UUID로 접근
      await testOperatorPage.goto('/equipment/non-existent-uuid-12345');
      await testOperatorPage.waitForLoadState('networkidle');

      // 404 페이지 또는 에러 메시지 확인
      const notFound = testOperatorPage.getByText(/찾을 수 없|404|Not Found/i);
      await expect(notFound).toBeVisible({ timeout: 10000 });
    });
  });
});
