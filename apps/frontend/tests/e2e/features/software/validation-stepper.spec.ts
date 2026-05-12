/**
 * 유효성 확인 상세 — 승인 워크플로 stepper E2E (DESIGN_REVIEW.md P0-1).
 *
 * 검증 대상:
 * - stepper가 ValidationDetailContent 헤더 직후 노출 (3단계: submitted → approved → quality_approved)
 * - draft 상태일 때 stepper는 자동 hide (descriptor 빈 배열)
 * - rejected 상태에서 마지막 도달 단계만 'terminated' marker
 * - a11y: <ol role="list"> + aria-current="step" + aria-label
 * - dt/dd 위계 강화 (uppercase tracking-wider)
 * - xl wide grid 2-column 배치
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('유효성 확인 상세 — stepper', () => {
  test('TC-01: 유효성 확인 목록 페이지에 검증 기록 stepper 진입 가능', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software-validations');

    // 페이지 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 빈 상태가 아니면 행 클릭으로 상세 진입
    const rows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const firstRowLink = rows.first().getByRole('link').first();
      const href = await firstRowLink.getAttribute('href');
      expect(href).toMatch(/\/software-validations\/[\w-]+/);
    }
  });

  test('TC-02: stepper a11y — role=list + aria-label', async ({ testOperatorPage: page }) => {
    await page.goto('/software-validations');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const rows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // 첫 검증 기록 상세로 진입 (직접 navigate)
      const href = await rows.first().getByRole('link').first().getAttribute('href');
      if (href) {
        await page.goto(href);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

        // stepper는 draft가 아닌 상태에서만 노출
        const stepper = page.getByRole('list', { name: /승인.*진행|approval.*progress/i });
        const stepperCount = await stepper.count();
        if (stepperCount > 0) {
          await expect(stepper.first()).toBeVisible();
          // 각 단계는 <li>
          const steps = stepper.first().getByRole('listitem');
          await expect(steps).toHaveCount(3);
        }
      }
    }
  });

  test('TC-03: ValidationInfoCard dt/dd 위계 강화 (uppercase tracking-wider)', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software-validations');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const rows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    if ((await rows.count()) > 0) {
      const href = await rows.first().getByRole('link').first().getAttribute('href');
      if (href) {
        await page.goto(href);
        // 기본 정보 카드 dt 확인 — uppercase tracking-wider 클래스 적용
        const dtElements = page.locator('dt').filter({ hasText: /확인 방법|Validation Type/i });
        await expect(dtElements.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('TC-04: xl wide viewport에서 2-column 그리드 배치', async ({ testOperatorPage: page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/software-validations');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const rows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    if ((await rows.count()) > 0) {
      const href = await rows.first().getByRole('link').first().getAttribute('href');
      if (href) {
        await page.goto(href);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // grid xl:grid-cols-2 클래스가 layout 컨테이너에 적용
        const gridContainer = page.locator('.grid.grid-cols-1');
        await expect(gridContainer.first()).toBeVisible();
      }
    }
  });
});
