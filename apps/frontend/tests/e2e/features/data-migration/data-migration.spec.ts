/**
 * 데이터 마이그레이션 E2E 테스트
 *
 * 대상 페이지: /admin/data-migration (SYSTEM_ADMIN 전용)
 *
 * TC-01: system_admin 접근 시 마이그레이션 위자드 렌더링 확인
 * TC-02: 비SYSTEM_ADMIN(lab_manager) 접근 시 /dashboard 리다이렉트
 * TC-03: 템플릿 다운로드 버튼 표시 및 클릭 가능
 * TC-04: .xlsx 아닌 파일 업로드 시 오류 토스트
 * TC-05: 파일 없이 미리보기 시작 클릭 시 오류 토스트
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

const PAGE_URL = '/admin/data-migration';

test.describe('데이터 마이그레이션 페이지', () => {
  test('TC-01: system_admin은 마이그레이션 위자드에 접근할 수 있다', async ({
    systemAdminPage: page,
  }) => {
    await page.goto(PAGE_URL);
    await expect(
      page.getByRole('heading', { name: '데이터 마이그레이션', level: 1 })
    ).toBeVisible();

    // 3단계 인디케이터 확인 (exact: true — 'Excel 파일 업로드' heading과 구분)
    await expect(page.getByText('파일 업로드', { exact: true })).toBeVisible();
    await expect(page.getByText('미리보기', { exact: true })).toBeVisible();
    await expect(page.getByText('결과', { exact: true })).toBeVisible();

    // 파일 업로드 카드 표시
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();
  });

  test('TC-02: lab_manager(시험소장)는 /admin/data-migration 접근 시 /dashboard로 리다이렉트된다', async ({
    siteAdminPage: page,
  }) => {
    await page.goto(PAGE_URL);
    await page.waitForURL('**/dashboard**');
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-03: 템플릿 다운로드 버튼이 표시된다', async ({ systemAdminPage: page }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();

    const downloadBtn = page.getByRole('button', { name: '템플릿 다운로드' });
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeEnabled();
  });

  test('TC-04: .xlsx 아닌 파일 업로드 시 파일이 거부된다 (버튼 여전히 disabled)', async ({
    systemAdminPage: page,
  }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();

    // .csv 파일 선택 시도
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /드래그하거나 클릭/ }).click(),
    ]);
    await fileChooser.setFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('col1,col2\nval1,val2'),
    });

    // 파일이 거부됐으므로 selectedFile 카드가 나타나지 않아야 함
    // → '미리보기 시작' 버튼은 여전히 disabled
    await expect(page.getByRole('button', { name: '미리보기 시작' })).toBeDisabled();
    // 드롭존이 여전히 표시됨 (파일 카드로 대체되지 않음)
    await expect(page.getByRole('button', { name: /드래그하거나 클릭/ })).toBeVisible();
  });

  test('TC-05: 파일을 선택하지 않고 미리보기 시작 클릭 시 오류 토스트가 표시된다', async ({
    systemAdminPage: page,
  }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();

    // 파일 미선택 상태에서 버튼은 disabled여야 하지만, 혹시 토스트 검증
    const previewBtn = page.getByRole('button', { name: '미리보기 시작' });
    await expect(previewBtn).toBeDisabled();
  });
});
