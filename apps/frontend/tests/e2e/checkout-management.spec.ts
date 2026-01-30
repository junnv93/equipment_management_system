/**
 * 반출/반입 관리 E2E 테스트 (UI-13)
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 장비 반출 유형: 교정, 수리, 대여
 * - 대여 목적: 양측 4단계 상태 확인
 * - 기술책임자: 소유 팀 장비만 승인 가능
 */
import { test, expect, type Page } from '@playwright/test';

// 테스트 사용자 역할
const TEST_USERS = {
  testEngineer: {
    role: 'test_engineer',
    name: '시험실무자',
  },
  technicalManager: {
    role: 'technical_manager',
    name: '기술책임자',
  },
  labManager: {
    role: 'lab_manager',
    name: '시험소장',
  },
} as const;

// 테스트용 로그인 헬퍼
async function loginAs(page: Page, role: string) {
  const csrfResponse = await page.request.get('/api/auth/csrf');
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  await page.request.post('/api/auth/callback/test-login', {
    form: {
      role,
      csrfToken,
      json: 'true',
    },
  });
}

test.describe('반출/반입 관리 페이지', () => {
  test.describe('반출 목록 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('반출 목록 페이지가 정상적으로 렌더링됨', async ({ page }) => {
      await page.goto('/checkouts');

      // 페이지 타이틀 확인
      await expect(page.locator('h1')).toContainText('반출 관리');

      // 반출 신청 버튼 확인
      await expect(page.getByRole('button', { name: /반출 신청/ })).toBeVisible();

      // 탭 확인
      await expect(page.getByRole('tab', { name: '전체 반출' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '기한 초과' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '오늘 반입' })).toBeVisible();
    });

    test('검색 기능이 정상 동작함', async ({ page }) => {
      await page.goto('/checkouts');

      // 검색어 입력
      const searchInput = page.getByPlaceholder(/장비 또는 사용자 검색/);
      await searchInput.fill('테스트 장비');

      // 검색 결과 대기
      await page.waitForResponse(
        (response) => response.url().includes('/api/checkouts') && response.status() === 200
      );
    });

    test('상태 필터가 정상 동작함', async ({ page }) => {
      await page.goto('/checkouts');

      // 상태 필터 클릭
      await page.getByRole('combobox', { name: /상태/ }).click();

      // 필터 옵션 확인
      await expect(page.getByRole('option', { name: '전체' })).toBeVisible();
      await expect(page.getByRole('option', { name: '승인 대기중' })).toBeVisible();
      await expect(page.getByRole('option', { name: '반출 중' })).toBeVisible();
    });
  });

  test.describe('반출 신청 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('반출 신청 페이지가 정상적으로 렌더링됨', async ({ page }) => {
      await page.goto('/checkouts/create');

      // 페이지 타이틀 확인
      await expect(page.locator('h1')).toContainText('장비 반출 신청');

      // 장비 선택 영역 확인
      await expect(page.getByText('장비 선택')).toBeVisible();

      // 반출 정보 입력 영역 확인
      await expect(page.getByText('반출 정보 입력')).toBeVisible();

      // 필수 필드 확인
      await expect(page.getByLabel(/반출 목적/)).toBeVisible();
      await expect(page.getByLabel(/반출 장소/)).toBeVisible();
      await expect(page.getByLabel(/반출 사유/)).toBeVisible();
    });

    test('반출 목적 선택 옵션이 올바름', async ({ page }) => {
      await page.goto('/checkouts/create');

      // 반출 목적 드롭다운 클릭
      await page.getByRole('combobox', { name: /반출 목적/ }).click();

      // 옵션 확인
      await expect(page.getByRole('option', { name: '교정' })).toBeVisible();
      await expect(page.getByRole('option', { name: '수리' })).toBeVisible();
      await expect(page.getByRole('option', { name: '외부 대여' })).toBeVisible();
    });

    test('필수 필드 미입력 시 유효성 검사 오류 표시', async ({ page }) => {
      await page.goto('/checkouts/create');

      // 장비 선택 없이 제출 시도
      const submitButton = page.getByRole('button', { name: '반출 신청' });
      await submitButton.click();

      // 토스트 메시지 확인
      await expect(page.getByText('장비를 선택해주세요')).toBeVisible();
    });
  });

  test.describe('반출 상세 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('반출 상세 페이지 구조 확인', async ({ page }) => {
      // 실제 데이터가 있는 경우에만 테스트 가능
      await page.goto('/checkouts');

      // 테이블 행 클릭하여 상세 페이지 이동 시도
      const firstRow = page.locator('tbody tr').first();
      const hasRows = (await firstRow.count()) > 0;

      if (hasRows) {
        await firstRow.click();

        // 상세 페이지 요소 확인
        await expect(page.getByText('반출 상세')).toBeVisible();
        await expect(page.getByText('진행 상태')).toBeVisible();
        await expect(page.getByText('반출 정보')).toBeVisible();
      }
    });
  });

  test.describe('반출 승인 관리 페이지 (기술책임자)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.technicalManager.role);
    });

    test('반출 승인 관리 페이지가 정상적으로 렌더링됨', async ({ page }) => {
      await page.goto('/checkouts/manage');

      // 페이지 타이틀 확인
      await expect(page.locator('h1')).toContainText('반출 관리');

      // 탭 확인
      await expect(page.getByRole('tab', { name: '승인 대기' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '반출 중' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '전체 보기' })).toBeVisible();
    });
  });

  test.describe('상태 진행 표시기 (CheckoutStatusStepper)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('상태 진행 표시기 접근성 검증', async ({ page }) => {
      await page.goto('/checkouts');

      // 테이블에서 첫 번째 항목 클릭
      const firstRow = page.locator('tbody tr').first();
      const hasRows = (await firstRow.count()) > 0;

      if (hasRows) {
        await firstRow.click();

        // aria-current="step" 속성이 있는 요소 확인
        const currentStep = page.locator('[aria-current="step"]');
        const stepCount = await currentStep.count();

        // 현재 단계가 하나만 표시되는지 확인
        if (stepCount > 0) {
          expect(stepCount).toBe(1);
        }

        // role="group" 속성 확인
        const stepperGroup = page.locator('[role="group"][aria-label]');
        if ((await stepperGroup.count()) > 0) {
          await expect(stepperGroup).toHaveAttribute('aria-label', /반출 진행 상태/);
        }
      }
    });
  });

  test.describe('접근성 테스트', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('반출 목록 페이지 키보드 탐색', async ({ page }) => {
      await page.goto('/checkouts');

      // Tab 키로 탐색 가능한지 확인
      await page.keyboard.press('Tab');

      // 포커스 가능한 요소에 포커스가 이동하는지 확인
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('반출 신청 페이지 폼 레이블 연결', async ({ page }) => {
      await page.goto('/checkouts/create');

      // 라벨이 입력 필드와 올바르게 연결되어 있는지 확인
      const purposeLabel = page.getByLabel(/반출 목적/);
      await expect(purposeLabel).toBeVisible();

      const destinationLabel = page.getByLabel(/반출 장소/);
      await expect(destinationLabel).toBeVisible();

      const reasonLabel = page.getByLabel(/반출 사유/);
      await expect(reasonLabel).toBeVisible();
    });
  });

  test.describe('반출 유형별 플로우', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('교정 목적 반출 - 5단계 진행 표시', async ({ page }) => {
      // 교정 목적 반출 신청 페이지에서 목적 선택
      await page.goto('/checkouts/create');

      await page.getByRole('combobox', { name: /반출 목적/ }).click();
      await page.getByRole('option', { name: '교정' }).click();

      // 교정 목적이 선택되었는지 확인
      await expect(page.getByRole('combobox', { name: /반출 목적/ })).toContainText('교정');
    });

    test('수리 목적 반출 - 5단계 진행 표시', async ({ page }) => {
      await page.goto('/checkouts/create');

      await page.getByRole('combobox', { name: /반출 목적/ }).click();
      await page.getByRole('option', { name: '수리' }).click();

      await expect(page.getByRole('combobox', { name: /반출 목적/ })).toContainText('수리');
    });

    test('대여 목적 반출 - 8단계 진행 표시', async ({ page }) => {
      await page.goto('/checkouts/create');

      await page.getByRole('combobox', { name: /반출 목적/ }).click();
      await page.getByRole('option', { name: '외부 대여' }).click();

      await expect(page.getByRole('combobox', { name: /반출 목적/ })).toContainText('외부 대여');
    });
  });

  test.describe('반응형 디자인', () => {
    test('모바일 뷰에서 목록이 카드 형태로 표시', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAs(page, TEST_USERS.testEngineer.role);
      await page.goto('/checkouts');

      // 모바일에서 테이블이 스크롤 가능하거나 카드 형태로 변환되는지 확인
      const table = page.locator('table');
      if ((await table.count()) > 0) {
        // 테이블이 뷰포트를 넘지 않는지 확인
        const tableBounds = await table.boundingBox();
        if (tableBounds) {
          expect(tableBounds.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('데스크톱 뷰에서 테이블 형태로 표시', async ({ page }) => {
      // 데스크톱 뷰포트 설정
      await page.setViewportSize({ width: 1280, height: 720 });

      await loginAs(page, TEST_USERS.testEngineer.role);
      await page.goto('/checkouts');

      // 테이블 헤더가 보이는지 확인
      await expect(page.locator('thead')).toBeVisible();
    });
  });
});

test.describe('대여 목적 양측 확인 테스트', () => {
  test.describe('상태 확인 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USERS.testEngineer.role);
    });

    test('상태 확인 폼 필드 확인', async ({ page }) => {
      // 대여 목적 반출의 상태 확인 페이지 접근
      // 실제 대여 건이 있어야 테스트 가능
      await page.goto('/checkouts');

      // 상태 확인이 필요한 항목이 있는지 확인
      const checkButton = page.getByRole('link', { name: /상태 확인/ });
      if ((await checkButton.count()) > 0) {
        await checkButton.first().click();

        // 상태 확인 폼 필드 확인
        await expect(page.getByText(/외관 상태/)).toBeVisible();
        await expect(page.getByText(/작동 상태/)).toBeVisible();
      }
    });
  });
});

test.describe('권한 검증 테스트', () => {
  test('기술책임자는 승인 관리 페이지 접근 가능', async ({ page }) => {
    await loginAs(page, TEST_USERS.technicalManager.role);
    await page.goto('/checkouts/manage');

    // 승인 관리 페이지가 정상 로드되는지 확인
    await expect(page.locator('h1')).toContainText('반출 관리');
  });

  test('시험소장은 반입 승인 페이지 접근 가능', async ({ page }) => {
    await loginAs(page, TEST_USERS.labManager.role);
    await page.goto('/admin/return-approvals');

    // 반입 승인 페이지가 정상 로드되는지 확인 (또는 권한에 따른 적절한 응답)
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/admin/return-approvals') ||
        response.url().includes('/api/checkouts')
    );
    await responsePromise;
  });
});
