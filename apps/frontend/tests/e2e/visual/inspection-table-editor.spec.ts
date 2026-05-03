import { expect, test } from '@playwright/test';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '../.auth');
const FIXTURE_PATH = '/visual-fixtures/inspection-table';

test.use({
  storageState: path.join(AUTH_DIR, 'test-engineer.json'),
  colorScheme: 'light',
  trace: 'retain-on-failure',
});

const VIEWPORTS = [
  { name: 'desktop', width: 840, height: 360 },
  { name: 'mobile', width: 390, height: 560 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`inspection table editor visual fixture - ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(FIXTURE_PATH);

    const fixture = page.getByTestId('inspection-table-editor-fixture');
    await expect(fixture).toBeVisible();
    await expect(page.getByRole('button', { name: '열 추가' })).toBeVisible();
    await expect(page.getByRole('button', { name: '행 추가' })).toBeVisible();
    await page.getByRole('button', { name: '데이터 가져오기' }).click();
    await expect(page.getByRole('button', { name: 'CSV 파일 선택' })).toBeVisible();

    const deleteColumnButtons = page.getByRole('button', { name: '열 삭제' });
    await expect(deleteColumnButtons).toHaveCount(3);

    const firstHeader = page.getByRole('textbox', { name: '1번 열 헤더' });
    await firstHeader.hover();
    await expect(deleteColumnButtons.nth(0)).toBeVisible();

    const screenshotPath = testInfo.outputPath(`inspection-table-editor-${viewport.name}.png`);
    await fixture.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}

test('inspection table editor imports CSV as a table', async ({ page }) => {
  await page.goto(FIXTURE_PATH);
  await page.getByRole('button', { name: '데이터 가져오기' }).click();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'inspection-result.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('항목,기준,결과\n외관,흠집 없음,합격', 'utf-8'),
  });

  await expect(page.getByRole('textbox', { name: '1번 열 헤더' })).toHaveValue('항목');
  await expect(page.getByRole('textbox', { name: '2번 열 헤더' })).toHaveValue('기준');
  await expect(page.getByRole('textbox', { name: '3번 열 헤더' })).toHaveValue('결과');
  await expect(page.getByRole('textbox', { name: '1행 1열 셀' })).toHaveValue('외관');
  await expect(page.getByRole('textbox', { name: '1행 2열 셀' })).toHaveValue('흠집 없음');
  await expect(page.getByRole('textbox', { name: '1행 3열 셀' })).toHaveValue('합격');
});
