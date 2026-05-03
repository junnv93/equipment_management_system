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
    await expect(page.getByRole('button', { name: '붙여넣기' })).toBeVisible();

    const deleteColumnButtons = page.getByRole('button', { name: '열 삭제' });
    await expect(deleteColumnButtons).toHaveCount(3);

    const firstHeader = page.getByRole('textbox', { name: '1번 열 헤더' });
    await firstHeader.hover();
    await expect(deleteColumnButtons.first()).toBeVisible();

    const screenshotPath = testInfo.outputPath(`inspection-table-editor-${viewport.name}.png`);
    await fixture.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}
