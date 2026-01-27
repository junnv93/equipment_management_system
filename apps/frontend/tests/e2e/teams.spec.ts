/**
 * 팀 관리 페이지 E2E 테스트
 *
 * @see docs/development/FRONTEND_UI_PROMPTS(UI-18: 팀 관리 페이지).md
 *
 * 테스트 범위:
 * - 팀 목록 조회
 * - 팀 상세 조회
 * - 팀 등록 (관리자)
 * - 팀 삭제 확인 모달
 * - 권한별 UI 분기
 * - 키보드 접근성
 * - 팀 유형 색상/아이콘
 */

import { test, expect } from './fixtures/auth.fixture';

test.describe('팀 관리 페이지 - Basic', () => {
  test('팀 목록 조회', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 페이지 헤더 확인
    await expect(page.getByRole('heading', { name: '팀 관리' })).toBeVisible();
    await expect(page.getByText('시험소 팀을 관리하고')).toBeVisible();

    // 팀 카드 확인 (백엔드에 4개 기본 팀 존재)
    const teamCards = page.locator('[data-testid="team-card"]');

    // 적어도 하나의 팀 카드가 보여야 함
    await expect(teamCards.first()).toBeVisible({ timeout: 10000 });

    // 팀원 수/장비 수 표시 확인
    await expect(page.getByText(/\d+명/)).toBeVisible();
    await expect(page.getByText(/\d+개/)).toBeVisible();

    // 팀 유형 아이콘 표시 확인
    await expect(page.locator('[data-testid="team-type-icon"]').first()).toBeVisible();
  });

  test('팀 상세 조회', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    // 팀 목록 페이지로 이동
    await page.goto('/teams');

    // 첫 번째 팀 카드 클릭
    const firstCard = page.locator('[data-testid="team-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // 팀 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/teams\/\w+/);

    // 팀 정보 섹션 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('팀 정보')).toBeVisible();

    // 탭 확인 (팀원, 장비)
    await expect(page.getByRole('tab', { name: /팀원/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /장비/ })).toBeVisible();
  });

  test('팀 검색 기능', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 검색 입력
    const searchInput = page.getByRole('searchbox', { name: '팀 검색' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('RF');

    // 검색 결과 대기 (디바운스)
    await page.waitForTimeout(500);

    // URL에 검색어 반영 확인
    await expect(page).toHaveURL(/search=RF/);
  });

  test('사이트 필터 기능', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 사이트 필터 선택
    const siteFilter = page.getByRole('combobox', { name: '사이트 필터' });
    await expect(siteFilter).toBeVisible();
    await siteFilter.click();

    // 수원 선택
    await page.getByRole('option', { name: '수원' }).click();

    // URL에 필터 반영 확인
    await expect(page).toHaveURL(/site=suwon/);
  });
});

test.describe('팀 관리 페이지 - 권한별 UI', () => {
  test('시험실무자는 팀 추가 버튼이 미표시된다', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams');

    // 팀 추가 버튼이 없어야 함
    const addButton = testOperatorPage.getByRole('button', { name: '팀 추가' });
    await expect(addButton).not.toBeVisible();
  });

  test('시험소 관리자는 팀 추가 버튼이 표시된다', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/teams');

    // 팀 추가 버튼이 있어야 함
    const addButton = siteAdminPage.getByRole('button', { name: '팀 추가' });
    await expect(addButton).toBeVisible();
  });

  test('일반 사용자는 삭제 버튼이 미표시된다', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams/rf');

    // 페이지 로딩 대기
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 삭제 버튼이 없어야 함
    const deleteButton = testOperatorPage.getByRole('button', { name: '삭제' });
    await expect(deleteButton).not.toBeVisible();
  });

  test('시스템 관리자는 삭제 버튼이 표시된다', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/teams/rf');

    // 페이지 로딩 대기
    await expect(systemAdminPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 삭제 버튼이 있어야 함
    const deleteButton = systemAdminPage.getByRole('button', { name: '삭제' });
    await expect(deleteButton).toBeVisible();
  });
});

test.describe('팀 관리 페이지 - 팀 등록', () => {
  test('팀 등록 페이지 접근', async ({ siteAdminPage }) => {
    const page = siteAdminPage;

    await page.goto('/teams');

    // 팀 추가 버튼 클릭
    await page.getByRole('button', { name: '팀 추가' }).click();

    // 팀 등록 페이지로 이동 확인
    await expect(page).toHaveURL('/teams/create');
    await expect(page.getByRole('heading', { name: '팀 등록' })).toBeVisible();
  });

  test('팀 등록 폼 필드 확인', async ({ siteAdminPage }) => {
    const page = siteAdminPage;

    await page.goto('/teams/create');

    // 필수 필드 확인
    await expect(page.getByLabel(/팀 ID/)).toBeVisible();
    await expect(page.getByLabel(/팀 이름/)).toBeVisible();
    await expect(page.getByLabel(/팀 유형/)).toBeVisible();
    await expect(page.getByLabel(/소속 사이트/)).toBeVisible();
    await expect(page.getByLabel(/팀 설명/)).toBeVisible();

    // 버튼 확인
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
    await expect(page.getByRole('button', { name: '생성' })).toBeVisible();
  });

  test('팀 등록 필수 필드 검증', async ({ siteAdminPage }) => {
    const page = siteAdminPage;

    await page.goto('/teams/create');

    // 빈 폼 제출 시도
    await page.getByRole('button', { name: '생성' }).click();

    // 필수 필드 에러 메시지 확인
    await expect(page.getByRole('alert')).toContainText(/필수/);
  });
});

test.describe('팀 관리 페이지 - 삭제 모달', () => {
  test('팀 삭제 시 확인 모달이 표시된다', async ({ systemAdminPage }) => {
    const page = systemAdminPage;

    await page.goto('/teams/rf');

    // 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).click();

    // alertdialog 모달 표시 확인
    const modal = page.getByRole('alertdialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('팀 삭제');

    // 연관 데이터 안내 확인
    await expect(modal).toContainText(/팀원|장비/);
  });

  test('모달 취소 버튼으로 닫기', async ({ systemAdminPage }) => {
    const page = systemAdminPage;

    await page.goto('/teams/rf');
    await page.getByRole('button', { name: '삭제' }).click();

    const modal = page.getByRole('alertdialog');
    await expect(modal).toBeVisible();

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('Escape 키로 모달 닫기', async ({ systemAdminPage }) => {
    const page = systemAdminPage;

    await page.goto('/teams/rf');
    await page.getByRole('button', { name: '삭제' }).click();

    const modal = page.getByRole('alertdialog');
    await expect(modal).toBeVisible();

    // Escape 키로 닫기
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});

test.describe('팀 관리 페이지 - Accessibility', () => {
  test('팀 카드 키보드 탐색', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 카드가 로드될 때까지 대기
    const firstCard = page.locator('[data-testid="team-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Tab으로 첫 번째 카드에 포커스
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // 검색 필드 건너뛰기
    await page.keyboard.press('Tab'); // 사이트 필터 건너뛰기

    // 포커스된 카드 확인
    const focusedCard = page.locator('[data-testid="team-card"]:focus');

    // 포커스 표시 스타일 확인 (box-shadow 또는 outline)
    const hasRing = await focusedCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.boxShadow.includes('rgb') || style.outlineStyle !== 'none';
    });
    expect(hasRing).toBeTruthy();
  });

  test('Enter 키로 팀 상세 이동', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 카드가 로드될 때까지 대기
    const firstCard = page.locator('[data-testid="team-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // 첫 번째 카드에 포커스
    await firstCard.focus();

    // Enter로 상세 페이지 이동
    await page.keyboard.press('Enter');

    // 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/teams\/\w+/);
  });

  test('팀원 아바타에 aria-label 제공', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams/rf');

    // 페이지 로딩 대기
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 팀원 탭이 활성화되어 있으면 아바타 확인
    const avatar = page.locator('[data-testid="member-avatar"]').first();
    if (await avatar.isVisible()) {
      await expect(avatar).toHaveAttribute('aria-label');
    }
  });

  test('+N 버튼에 aria-label 제공', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 카드가 로드될 때까지 대기
    await expect(page.locator('[data-testid="team-card"]').first()).toBeVisible({ timeout: 10000 });

    // "+N" 버튼이 있는 경우 aria-label 확인
    const moreButton = page.locator('[data-testid="more-members-button"]').first();
    if (await moreButton.isVisible()) {
      await expect(moreButton).toHaveAttribute('aria-label', /나머지.*명/);
    }
  });

  test('삭제 모달 포커스 트랩', async ({ systemAdminPage }) => {
    const page = systemAdminPage;

    await page.goto('/teams/rf');

    // 삭제 버튼이 나타날 때까지 대기
    const deleteButton = page.getByRole('button', { name: '삭제' });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    const modal = page.getByRole('alertdialog');
    await expect(modal).toBeVisible();

    // Tab 키로 탐색해도 모달 내부에 포커스 유지
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // 포커스가 여전히 모달 내부에 있는지 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="alertdialog"]'));
    expect(focusedElement).not.toBeNull();
  });

  test('팀 유형이 색상과 아이콘으로 구분됨', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');

    // 카드가 로드될 때까지 대기
    const teamCard = page.locator('[data-testid="team-card"]').first();
    await expect(teamCard).toBeVisible({ timeout: 10000 });

    // 팀 유형 아이콘이 표시되는지 확인
    const typeIcon = teamCard.locator('[data-testid="team-type-icon"]');
    await expect(typeIcon).toBeVisible();

    // 아이콘 내부에 SVG가 있는지 확인 (아이콘 컴포넌트)
    const svg = typeIcon.locator('svg');
    await expect(svg).toBeVisible();
  });
});

test.describe('팀 관리 페이지 - 탭 네비게이션', () => {
  test('팀원 탭과 장비 탭 전환', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams/rf');

    // 페이지 로딩 대기
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 팀원 탭이 기본 선택됨
    const membersTab = page.getByRole('tab', { name: /팀원/ });
    await expect(membersTab).toHaveAttribute('aria-selected', 'true');

    // 장비 탭 클릭
    const equipmentTab = page.getByRole('tab', { name: /장비/ });
    await equipmentTab.click();

    // 장비 탭이 선택됨
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
    await expect(membersTab).toHaveAttribute('aria-selected', 'false');
  });

  test('장비 탭에서 전체 장비 보기 링크', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams/rf');

    // 장비 탭 클릭
    await page.getByRole('tab', { name: /장비/ }).click();

    // 전체 장비 보기 버튼 확인
    const viewAllButton = page.getByRole('link', { name: '전체 장비 보기' });
    await expect(viewAllButton).toBeVisible();

    // 링크 URL 확인
    await expect(viewAllButton).toHaveAttribute('href', /\/equipment\?teamId=rf/);
  });
});
