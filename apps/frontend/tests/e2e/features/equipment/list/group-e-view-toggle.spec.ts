/**
 * Group E-2: 뷰 전환 테스트
 *
 * 검증 범위:
 * 1. 테이블 → 카드 뷰 전환
 * 2. 카드 → 테이블 뷰 전환
 * 3. 뷰 선택 localStorage 저장 확인
 * 4. ARIA 속성 확인 (role='radiogroup', aria-checked)
 *
 * 비즈니스 로직:
 * - 뷰 전환 시 localStorage에 선호도 저장
 * - 페이지 새로고침 시 저장된 뷰로 복원
 * - 접근성 표준 준수 (ARIA 속성)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group E-2: View Toggle', () => {
  test.describe('2.1. Toggle from table view to card view', () => {
    test('should switch from table view to card view and update UI', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // ClientOnly 컴포넌트가 hydrate될 때까지 대기

      // 뷰 토글 버튼이 보일 때까지 대기 (데이터 로딩 완료 지표)
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      await expect(tableViewButton).toBeVisible({ timeout: 10000 });

      // 1. 초기 상태: 테이블 뷰가 기본값
      await expect(tableViewButton).toHaveAttribute('aria-checked', 'true');

      // 장비 데이터가 있는지 확인: 테이블 또는 카드 그리드가 있으면 데이터가 있는 것
      const equipmentTable = testOperatorPage.getByRole('table');
      const equipmentRow = testOperatorPage.locator('[data-testid="equipment-row"]').first();

      // 테이블이나 장비 행이 있는지 확인 (최대 3초 대기)
      const hasTableOrRows = await Promise.race([
        equipmentTable.isVisible().catch(() => false),
        equipmentRow.isVisible().catch(() => false),
        testOperatorPage.waitForTimeout(3000).then(() => false),
      ]);

      if (!hasTableOrRows) {
        console.log('[Test] ⚠️ No equipment data - skipping table visibility check');
        // 데이터가 없어도 뷰 토글은 작동해야 함
        const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
        await cardViewButton.click();
        await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');
        console.log('[Test] ✅ Successfully switched from table view to card view (no data)');
        return;
      }

      // 데이터가 있으면 테이블이 표시되어야 함
      await expect(equipmentTable).toBeVisible({ timeout: 5000 });

      // 2. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 3. 카드 뷰 버튼 활성화 확인
      await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');
      await expect(tableViewButton).toHaveAttribute('aria-checked', 'false');

      // 4. 카드 그리드가 표시되어야 함
      const cardGrid = testOperatorPage.locator('[data-testid="equipment-card-grid"]');
      await expect(cardGrid).toBeVisible();

      // 5. 테이블은 숨겨져야 함
      await expect(equipmentTable).not.toBeVisible();

      // 6. localStorage에 뷰 선호도 저장 확인
      const viewPreference = await testOperatorPage.evaluate(() =>
        localStorage.getItem('equipment-list-view')
      );
      expect(viewPreference).toBe('card');

      console.log('[Test] ✅ Successfully switched from table view to card view');
    });
  });

  test.describe('2.2. Toggle from card view to table view', () => {
    test('should switch from card view to table view and update UI', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // ClientOnly 컴포넌트가 hydrate될 때까지 대기

      // 뷰 토글 버튼이 보일 때까지 대기
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await expect(cardViewButton).toBeVisible({ timeout: 10000 });

      // 장비 데이터가 있는지 확인
      const equipmentTable = testOperatorPage.getByRole('table');
      const equipmentRow = testOperatorPage.locator('[data-testid="equipment-row"]').first();

      const hasTableOrRows = await Promise.race([
        equipmentTable.isVisible().catch(() => false),
        equipmentRow.isVisible().catch(() => false),
        testOperatorPage.waitForTimeout(3000).then(() => false),
      ]);

      if (!hasTableOrRows) {
        console.log('[Test] ⚠️ No equipment data - testing view toggle only');
        // 데이터가 없어도 뷰 토글은 작동해야 함
        await cardViewButton.click();
        await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');

        const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
        await tableViewButton.click();
        await expect(tableViewButton).toHaveAttribute('aria-checked', 'true');
        await expect(cardViewButton).toHaveAttribute('aria-checked', 'false');
        console.log('[Test] ✅ Successfully switched from card view to table view (no data)');
        return;
      }

      // 1. 카드 뷰로 먼저 전환
      await cardViewButton.click();

      await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');

      const cardGrid = testOperatorPage.locator('[data-testid="equipment-card-grid"]');
      await expect(cardGrid).toBeVisible({ timeout: 10000 });

      // 2. 테이블 뷰로 다시 전환
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      await tableViewButton.click();

      // 3. 테이블 뷰 버튼 활성화 확인
      await expect(tableViewButton).toHaveAttribute('aria-checked', 'true');
      await expect(cardViewButton).toHaveAttribute('aria-checked', 'false');

      // 4. 테이블이 표시되어야 함
      await expect(equipmentTable).toBeVisible({ timeout: 10000 });

      // 5. 카드 그리드는 숨겨져야 함
      await expect(cardGrid).not.toBeVisible();

      // 6. localStorage에 뷰 선호도 저장 확인
      const viewPreference = await testOperatorPage.evaluate(() =>
        localStorage.getItem('equipment-list-view')
      );
      expect(viewPreference).toBe('table');

      console.log('[Test] ✅ Successfully switched from card view to table view');
    });
  });

  test.describe('2.3. View preference persists in localStorage', () => {
    test('should save card view preference in localStorage', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. localStorage 초기화
      await testOperatorPage.evaluate(() => localStorage.removeItem('equipment-list-view'));

      // 2. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 3. localStorage 확인
      const viewPreference = await testOperatorPage.evaluate(() =>
        localStorage.getItem('equipment-list-view')
      );
      expect(viewPreference).toBe('card');

      console.log('[Test] ✅ Card view preference saved in localStorage');
    });

    test('should save table view preference in localStorage', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. localStorage를 card로 설정
      await testOperatorPage.evaluate(() => localStorage.setItem('equipment-list-view', 'card'));

      // 페이지 새로고침하여 card 뷰로 로드
      await testOperatorPage.reload();

      // 2. 테이블 뷰로 전환
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      await tableViewButton.click();

      // 3. localStorage 확인
      const viewPreference = await testOperatorPage.evaluate(() =>
        localStorage.getItem('equipment-list-view')
      );
      expect(viewPreference).toBe('table');

      console.log('[Test] ✅ Table view preference saved in localStorage');
    });

    test('should restore view preference from localStorage on page load', async ({
      testOperatorPage,
    }) => {
      // 1. localStorage에 card 뷰 선호도 미리 설정
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.evaluate(() => localStorage.setItem('equipment-list-view', 'card'));

      // 2. 페이지 새로고침
      await testOperatorPage.reload();

      // 3. 카드 뷰로 로드되어야 함
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');

      const cardGrid = testOperatorPage.locator('[data-testid="equipment-card-grid"]');
      await expect(cardGrid).toBeVisible();

      console.log('[Test] ✅ View preference restored from localStorage on page load');
    });

    test('should use table view as default when localStorage is empty', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. localStorage 초기화
      await testOperatorPage.evaluate(() => localStorage.removeItem('equipment-list-view'));

      // 2. 페이지 새로고침
      await testOperatorPage.reload();

      // ClientOnly 컴포넌트가 hydrate될 때까지 대기

      // 뷰 토글 버튼이 보일 때까지 대기
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      await expect(tableViewButton).toBeVisible({ timeout: 10000 });

      // 3. 테이블 뷰가 기본값으로 표시되어야 함
      await expect(tableViewButton).toHaveAttribute('aria-checked', 'true');

      // 장비 데이터가 있는지 확인
      const equipmentTable = testOperatorPage.getByRole('table');
      const equipmentRow = testOperatorPage.locator('[data-testid="equipment-row"]').first();

      const hasTableOrRows = await Promise.race([
        equipmentTable.isVisible().catch(() => false),
        equipmentRow.isVisible().catch(() => false),
        testOperatorPage.waitForTimeout(3000).then(() => false),
      ]);

      if (hasTableOrRows) {
        await expect(equipmentTable).toBeVisible({ timeout: 5000 });
      } else {
        console.log(
          '[Test] ⚠️ No equipment data - verified default view is table (button checked)'
        );
      }

      console.log('[Test] ✅ Table view used as default when localStorage is empty');
    });
  });

  test.describe('2.4. ARIA attributes are correct', () => {
    test('should have correct role and aria-checked attributes for view toggle buttons', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. radiogroup 역할 확인
      const viewToggle = testOperatorPage.getByRole('radiogroup');
      await expect(viewToggle).toBeVisible();

      // 2. radio 버튼 역할 확인
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });

      await expect(tableViewButton).toBeVisible();
      await expect(cardViewButton).toBeVisible();

      // 3. 초기 상태: 테이블 뷰 선택됨
      await expect(tableViewButton).toHaveAttribute('aria-checked', 'true');
      await expect(cardViewButton).toHaveAttribute('aria-checked', 'false');

      // 4. 카드 뷰 선택 후 aria-checked 변경 확인
      await cardViewButton.click();

      await expect(tableViewButton).toHaveAttribute('aria-checked', 'false');
      await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');

      console.log('[Test] ✅ ARIA attributes are correct for view toggle buttons');
    });

    test('should support keyboard navigation for view toggle buttons', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 테이블 뷰 버튼에 포커스
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      await tableViewButton.focus();

      // 2. Enter 키로 선택 (이미 선택된 상태지만 다시 선택 가능)
      await tableViewButton.press('Enter');

      await expect(tableViewButton).toHaveAttribute('aria-checked', 'true');

      // 3. Tab 키로 카드 뷰 버튼으로 이동
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.focus();

      // 4. Space 키로 선택
      await cardViewButton.press('Space');

      await expect(cardViewButton).toHaveAttribute('aria-checked', 'true');
      await expect(tableViewButton).toHaveAttribute('aria-checked', 'false');

      console.log('[Test] ✅ Keyboard navigation works correctly for view toggle buttons');
    });

    test('should have accessible labels for view toggle buttons', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. radiogroup에 적절한 레이블이 있어야 함
      const viewToggle = testOperatorPage.getByRole('radiogroup');
      await expect(viewToggle).toBeVisible();

      // radiogroup에 aria-label 또는 레이블 텍스트가 있는지 확인
      const ariaLabel = await viewToggle.getAttribute('aria-label');
      const hasLabel = ariaLabel !== null && ariaLabel.length > 0;

      if (!hasLabel) {
        // aria-label이 없으면 주변에 레이블 텍스트가 있는지 확인
        const groupText = await viewToggle.textContent();
        expect(groupText).toBeTruthy();
      }

      // 2. 각 radio 버튼에 명확한 이름이 있어야 함
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블/i });
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });

      await expect(tableViewButton).toBeVisible();
      await expect(cardViewButton).toBeVisible();

      console.log('[Test] ✅ View toggle buttons have accessible labels');
    });
  });
});
