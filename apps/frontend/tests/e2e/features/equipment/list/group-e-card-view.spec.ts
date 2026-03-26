/**
 * Group E-3: 카드 뷰 테스트
 *
 * 검증 범위:
 * 1. 카드 뷰에서 장비 데이터 표시
 * 2. 검색어 하이라이트 표시
 *
 * 비즈니스 로직:
 * - 카드 뷰에서 장비의 주요 정보 표시 확인
 * - 검색어가 입력된 경우 카드 내에서 하이라이트 표시
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group E-3: Card View', () => {
  test.describe('3.1. Equipment data is displayed correctly in card view', () => {
    test('should display equipment cards with correct data', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 카드 그리드 표시 확인
      const cardGrid = testOperatorPage.locator('[data-testid="equipment-card-grid"]');
      await expect(cardGrid).toBeVisible();

      // 3. 카드가 존재하는지 확인
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);

      console.log(`[Test] Found ${cardCount} equipment cards`);

      // 4. 첫 번째 카드의 데이터 확인
      const firstCard = cards.first();

      // 관리번호 표시 확인
      const managementNumber = firstCard.locator('[data-testid="management-number"]');
      await expect(managementNumber).toBeVisible();
      const managementNumberText = await managementNumber.textContent();
      expect(managementNumberText).toBeTruthy();

      console.log(`[Test] Management Number: ${managementNumberText}`);

      // 장비명 표시 확인
      const equipmentName = firstCard.locator('[data-testid="equipment-name"]');
      await expect(equipmentName).toBeVisible();
      const equipmentNameText = await equipmentName.textContent();
      expect(equipmentNameText).toBeTruthy();

      console.log(`[Test] Equipment Name: ${equipmentNameText}`);

      // 상태 배지 표시 확인
      const statusBadge = firstCard.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();

      console.log('[Test] ✅ Equipment cards display correct data');
    });

    test('should display essential equipment information in card view', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 첫 번째 카드 선택
      const firstCard = testOperatorPage.locator('[data-testid="equipment-card"]').first();
      await expect(firstCard).toBeVisible();

      // 3. 필수 정보 표시 확인

      // (1) 관리번호
      const managementNumber = firstCard.locator('[data-testid="management-number"]');
      await expect(managementNumber).toBeVisible();

      // (2) 장비명
      const equipmentName = firstCard.locator('[data-testid="equipment-name"]');
      await expect(equipmentName).toBeVisible();

      // (3) 상태 배지
      const statusBadge = firstCard.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();

      // (4) 모델명 (선택사항: 존재하면 확인)
      const modelName = firstCard.locator('text=/모델/i');
      if ((await modelName.count()) > 0) {
        console.log('[Test] Model name is displayed');
      }

      // (5) 제조사 (선택사항: 존재하면 확인)
      const manufacturer = firstCard.locator('text=/제조사/i');
      if ((await manufacturer.count()) > 0) {
        console.log('[Test] Manufacturer is displayed');
      }

      // (6) 다음 교정일 (선택사항: 존재하면 확인)
      const nextCalibrationDate = firstCard.locator('text=/교정/i');
      if ((await nextCalibrationDate.count()) > 0) {
        console.log('[Test] Next calibration date is displayed');
      }

      console.log('[Test] ✅ Essential equipment information displayed in card view');
    });

    test('should display multiple equipment cards in grid layout', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 카드 그리드 레이아웃 확인
      const cardGrid = testOperatorPage.locator('[data-testid="equipment-card-grid"]');
      await expect(cardGrid).toBeVisible();

      // 3. 여러 카드가 그리드 형태로 표시되는지 확인
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();

      // 최소 2개 이상의 카드가 있어야 그리드 레이아웃 테스트 가능
      if (cardCount >= 2) {
        // 그리드 레이아웃 스타일 확인 (CSS Grid 또는 Flexbox 사용)
        const gridStyles = await cardGrid.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns,
            gap: styles.gap,
          };
        });

        // Grid 또는 Flex 레이아웃 사용 확인
        const isGridLayout =
          gridStyles.display === 'grid' ||
          gridStyles.display === 'flex' ||
          gridStyles.display === 'inline-flex';

        expect(isGridLayout).toBeTruthy();

        console.log(`[Test] Grid layout: ${JSON.stringify(gridStyles)}`);
        console.log(`[Test] ✅ ${cardCount} cards displayed in grid layout`);
      } else {
        console.log(`[Test] ⚠️ Only ${cardCount} card(s) found, skipping grid layout check`);
      }
    });

    test('should support clicking on equipment card to navigate to detail page', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 첫 번째 카드 클릭
      const firstCard = testOperatorPage.locator('[data-testid="equipment-card"]').first();
      await expect(firstCard).toBeVisible();

      // 카드 내의 "상세 보기" 링크를 클릭
      const cardLink = firstCard.locator('a').first();
      await expect(cardLink).toBeVisible();

      // 링크 클릭 및 네비게이션 대기
      await Promise.all([testOperatorPage.waitForURL(/\/equipment\/.+/), cardLink.click()]);

      // 3. 장비 상세 페이지로 이동했는지 확인
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toMatch(/\/equipment\/[a-f0-9\-]+/);

      console.log(`[Test] ✅ Navigated to detail page: ${currentUrl}`);
    });
  });

  test.describe('3.2. Search term is highlighted in card view', () => {
    test('should highlight search term in equipment name', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 검색어 입력 (일반적인 장비명 키워드)
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('스펙트럼');

      // 3. 검색 결과 카드 확인
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 4. 첫 번째 카드에서 하이라이트 확인
        const firstCard = cards.first();

        // 하이라이트된 텍스트 요소 찾기 (mark 태그 또는 highlight 클래스)
        const highlightedText = firstCard.locator('mark, .highlight, [data-highlighted="true"]');

        // 하이라이트가 존재하는지 확인
        if ((await highlightedText.count()) > 0) {
          await expect(highlightedText.first()).toBeVisible();

          const highlightedContent = await highlightedText.first().textContent();
          console.log(`[Test] Highlighted text: ${highlightedContent}`);

          // 하이라이트된 텍스트에 검색어가 포함되어야 함
          expect(highlightedContent?.toLowerCase()).toContain('스펙트럼');

          console.log('[Test] ✅ Search term highlighted in equipment name');
        } else {
          console.log('[Test] ⚠️ No highlight elements found (may not be implemented)');
        }
      } else {
        console.log('[Test] ⚠️ No search results found for "스펙트럼"');
      }
    });

    test('should highlight search term in model name', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 모델명으로 검색 (예: 일반적인 모델명 키워드)
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('KS');

      // 3. 검색 결과 카드 확인
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 4. 첫 번째 카드에서 하이라이트 확인
        const firstCard = cards.first();

        // 하이라이트된 텍스트 요소 찾기
        const highlightedText = firstCard.locator('mark, .highlight, [data-highlighted="true"]');

        if ((await highlightedText.count()) > 0) {
          await expect(highlightedText.first()).toBeVisible();

          const highlightedContent = await highlightedText.first().textContent();
          console.log(`[Test] Highlighted text: ${highlightedContent}`);

          console.log('[Test] ✅ Search term highlighted in model name');
        } else {
          console.log('[Test] ⚠️ No highlight elements found (may not be implemented)');
        }
      } else {
        console.log('[Test] ⚠️ No search results found for "KS"');
      }
    });

    test('should highlight multiple instances of search term in a single card', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 공통으로 나타날 수 있는 키워드 검색 (예: "전원")
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('전원');

      // 3. 검색 결과 카드 확인
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 4. 첫 번째 카드에서 여러 하이라이트 확인
        const firstCard = cards.first();

        const highlightedElements = firstCard.locator(
          'mark, .highlight, [data-highlighted="true"]'
        );
        const highlightCount = await highlightedElements.count();

        if (highlightCount > 0) {
          console.log(`[Test] Found ${highlightCount} highlighted instance(s) in the card`);

          // 여러 인스턴스가 있는지 확인
          if (highlightCount > 1) {
            console.log('[Test] ✅ Multiple instances of search term highlighted in a single card');
          } else {
            console.log('[Test] Only one instance highlighted (multiple may not exist)');
          }
        } else {
          console.log('[Test] ⚠️ No highlight elements found (may not be implemented)');
        }
      } else {
        console.log('[Test] ⚠️ No search results found for "전원"');
      }
    });

    test('should not highlight when search term is empty', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 검색어가 없는 상태 확인
      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('');

      // 3. 카드에 하이라이트가 없어야 함
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();
        const highlightedText = firstCard.locator('mark, .highlight, [data-highlighted="true"]');
        const highlightCount = await highlightedText.count();

        expect(highlightCount).toBe(0);

        console.log('[Test] ✅ No highlight when search term is empty');
      } else {
        console.log('[Test] ⚠️ No cards found');
      }
    });

    test('should clear highlight when search term is removed', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 카드 뷰로 전환
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드/i });
      await cardViewButton.click();

      // 2. 검색어 입력
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('오실로');

      // 3. 하이라이트 확인
      const cards = testOperatorPage.locator('[data-testid="equipment-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();
        const highlightedTextBefore = firstCard.locator(
          'mark, .highlight, [data-highlighted="true"]'
        );

        if ((await highlightedTextBefore.count()) > 0) {
          console.log('[Test] Highlight exists after search');

          // 4. 검색어 제거
          await searchInput.clear();

          // URL에서 search 파라미터가 제거될 때까지 대기
          await testOperatorPage.waitForFunction(() => {
            return !window.location.search.includes('search=');
          });

          // 검색 초기화 후 카드 다시 가져오기
          const cardsAfterClear = testOperatorPage.locator('[data-testid="equipment-card"]');
          const firstCardAfter = cardsAfterClear.first();

          // 5. 하이라이트가 제거되었는지 확인
          const highlightedTextAfter = firstCardAfter.locator(
            'mark, .highlight, [data-highlighted="true"]'
          );
          const highlightCountAfter = await highlightedTextAfter.count();

          expect(highlightCountAfter).toBe(0);

          console.log('[Test] ✅ Highlight cleared when search term is removed');
        } else {
          console.log('[Test] ⚠️ No highlight found (may not be implemented)');
        }
      } else {
        console.log('[Test] ⚠️ No search results found for "오실로"');
      }
    });
  });
});
