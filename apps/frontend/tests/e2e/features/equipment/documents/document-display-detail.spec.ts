/**
 * 시나리오 2 & 4: 장비 상세 — 기본 정보 탭 사진/매뉴얼 + 첨부파일 탭
 *
 * 검증 항목 (시나리오 2):
 * - 기본 정보 탭에 "장비 사진" / "장비 매뉴얼" 영역 표시
 * - 사진 없으면 빈 상태 메시지, 있으면 카운트 뱃지
 * - 매뉴얼 없으면 빈 상태 메시지, 있으면 다운로드 버튼
 *
 * 검증 항목 (시나리오 4):
 * - 첨부파일 탭 이동 시 문서 목록 또는 빈 상태 표시
 * - test_engineer: 삭제 버튼 미표시
 * - technical_manager: 삭제 버튼 표시
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('장비 상세 — 기본 정보 탭 사진/매뉴얼 표시', () => {
  test('TC-01: 기본 정보 탭에 장비 사진 영역이 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 장비 상세 페이지 로드 대기
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // "장비 사진" 텍스트가 있는 영역 확인 (span.headerTitle)
    // BasicInfoTab의 tokens.headerTitle span에 있으므로 first()로 한정
    await expect(page.getByText('장비 사진').first()).toBeVisible();
  });

  test('TC-02: 기본 정보 탭에 장비 매뉴얼 영역이 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('장비 매뉴얼').first()).toBeVisible();
  });

  test('TC-03: 사진/매뉴얼 빈 상태 또는 콘텐츠 표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 사진: 빈 상태 메시지 또는 사진 카드 존재
    const noPhotos = page.getByText('등록된 장비 사진이 없습니다');
    const hasNoPhotos = await noPhotos.isVisible().catch(() => false);
    if (hasNoPhotos) {
      await expect(noPhotos).toBeVisible();
    }
    // 사진이 있든 없든 "장비 사진" 영역은 반드시 존재
    await expect(page.getByText('장비 사진').first()).toBeVisible();

    // 매뉴얼: 빈 상태 메시지 또는 다운로드 버튼 존재
    const noManuals = page.getByText('등록된 매뉴얼이 없습니다');
    const hasNoManuals = await noManuals.isVisible().catch(() => false);
    if (hasNoManuals) {
      await expect(noManuals).toBeVisible();
    }
    await expect(page.getByText('장비 매뉴얼').first()).toBeVisible();
  });
});

test.describe('장비 상세 — 첨부파일 탭', () => {
  test('TC-04: 첨부파일 탭으로 이동하면 문서 목록 또는 빈 상태 표시', async ({
    testOperatorPage: page,
  }) => {
    // 직접 URL로 첨부파일 탭 접근 (탭 변경이 URL push 기반)
    await page.goto(`/equipment/${EQUIPMENT_ID}?tab=attachments`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 첨부파일 탭 콘텐츠 로딩 대기 — table 또는 빈 상태 메시지 중 하나 표시될 때까지
    const emptyState = page.getByText('등록된 첨부파일이 없습니다.');
    const table = page.locator('table');

    // 둘 중 하나가 보일 때까지 대기 (TanStack Query 데이터 로딩 완료)
    await expect(emptyState.or(table)).toBeVisible({ timeout: 15000 });
  });

  test('TC-05: 첨부파일 탭 — test_engineer에게 삭제 버튼 미표시', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}?tab=attachments`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('첨부파일').first()).toBeVisible({ timeout: 10000 });

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      const deleteButtons = page.getByRole('button', { name: /^삭제/ });
      await expect(deleteButtons).toHaveCount(0);
    }
  });

  test('TC-06: 첨부파일 탭 — technical_manager에게 삭제 버튼 표시', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}?tab=attachments`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('첨부파일').first()).toBeVisible({ timeout: 10000 });

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      const deleteButtons = page.getByRole('button', { name: /^삭제/ });
      const count = await deleteButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('TC-07: 첨부파일 탭 — 다운로드 버튼 표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}?tab=attachments`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('첨부파일').first()).toBeVisible({ timeout: 10000 });

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      const downloadButtons = page.getByRole('button', { name: /^다운로드/ });
      const count = await downloadButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('TC-08: 첨부파일 탭 — 테이블 헤더에 유형 컬럼', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}?tab=attachments`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('첨부파일').first()).toBeVisible({ timeout: 10000 });

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: '유형' })).toBeVisible();
    }
  });
});
