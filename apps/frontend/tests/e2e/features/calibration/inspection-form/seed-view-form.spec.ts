import { test } from '@playwright/test';

test('open inspection form for viewing', async ({ page }) => {
  // storageState로 인증
  const fs = await import('fs');
  const path = await import('path');
  const statePath = path.join(__dirname, '../../../.auth/test-engineer.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    if (state.cookies) {
      await page.context().addCookies(state.cookies);
    }
  }

  await page.goto(
    'http://localhost:3000/equipment/eeee1001-0001-4001-8001-000000000001?tab=inspection'
  );
  await page.waitForTimeout(3000);

  // 점검 기록 작성 버튼 클릭
  const btn = page.getByRole('button', { name: /점검 기록 작성/ });
  await btn.waitFor({ timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(1000);

  // 여기서 멈춤 - 브라우저에서 확인 가능
  await page.pause();
});
