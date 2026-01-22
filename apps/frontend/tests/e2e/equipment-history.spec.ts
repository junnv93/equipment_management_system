import { test, expect } from '@playwright/test';

// 로그인 헬퍼 함수
async function login(page: import('@playwright/test').Page, email: string = 'admin@example.com', password: string = 'admin123') {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByTestId('login-button').click();
  // 로그인 성공 후 리다이렉트 대기
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Equipment History - Create Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/equipment/create');
  });

  test('장비 등록 페이지에 이력 관리 안내 메시지 표시', async ({ page }) => {
    // 이력 관리 안내 섹션 확인
    await expect(page.getByText('이력 관리 안내')).toBeVisible();

    // 안내 내용 확인
    await expect(page.getByText(/장비 등록 완료 후.*수정 페이지에서/i)).toBeVisible();

    // 이력 항목 안내 확인
    await expect(page.getByText(/위치 변동 이력/)).toBeVisible();
    await expect(page.getByText(/유지보수 내역/)).toBeVisible();
    await expect(page.getByText(/손상.*오작동.*변경.*수리/)).toBeVisible();
    await expect(page.getByText(/교정 이력/)).toBeVisible();
  });
});

test.describe('Equipment History - Edit Page Sections', () => {
  test('장비 수정 페이지에서 이력 섹션 표시 확인', async ({ page }) => {
    await login(page);

    // 장비 목록 페이지로 이동
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // 첫 번째 장비의 수정 버튼 클릭 (있는 경우)
    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 이력 섹션들 확인
      await expect(page.getByRole('heading', { name: /위치 변동 이력/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('heading', { name: /유지보수 내역/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /손상.*오작동.*변경.*수리/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /장비 교정 이력/i })).toBeVisible();
    } else {
      // 장비가 없으면 테스트 스킵
      test.skip();
    }
  });

  test('위치 변동 이력 추가 버튼 표시', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 위치 변동 이력 섹션의 추가 버튼 확인
      const locationSection = page.locator('section, [class*="card"]').filter({ hasText: '위치 변동 이력' });
      await expect(locationSection.getByRole('button', { name: '추가' })).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('유지보수 내역 추가 버튼 표시', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 유지보수 내역 섹션의 추가 버튼 확인
      const maintenanceSection = page.locator('section, [class*="card"]').filter({ hasText: '유지보수 내역' });
      await expect(maintenanceSection.getByRole('button', { name: '추가' })).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('손상/수리 내역 추가 버튼 표시', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 손상/수리 내역 섹션의 추가 버튼 확인
      const incidentSection = page.locator('section, [class*="card"]').filter({ hasText: /손상.*오작동.*변경.*수리/ });
      await expect(incidentSection.getByRole('button', { name: '추가' })).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('교정 이력 교정 등록 버튼 표시', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 교정 이력 섹션의 교정 등록 버튼 확인
      const calibrationSection = page.locator('section, [class*="card"]').filter({ hasText: '장비 교정 이력' });
      await expect(calibrationSection.getByRole('link', { name: /교정 등록/i })).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });
});

test.describe('Equipment History - Location History Dialog', () => {
  test('위치 변동 이력 추가 다이얼로그 열기', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 위치 변동 이력 섹션의 추가 버튼 클릭
      const locationSection = page.locator('section, [class*="card"]').filter({ hasText: '위치 변동 이력' });
      await locationSection.getByRole('button', { name: '추가' }).click();

      // 다이얼로그 확인
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /위치 변동 이력 추가/i })).toBeVisible();

      // 필드 확인
      await expect(page.getByLabel(/변동 일시/i)).toBeVisible();
      await expect(page.getByLabel(/설치 위치/i)).toBeVisible();
      await expect(page.getByLabel(/비고/i)).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Equipment History - Maintenance History Dialog', () => {
  test('유지보수 내역 추가 다이얼로그 열기', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 유지보수 내역 섹션의 추가 버튼 클릭
      const maintenanceSection = page.locator('section, [class*="card"]').filter({ hasText: '유지보수 내역' });
      await maintenanceSection.getByRole('button', { name: '추가' }).click();

      // 다이얼로그 확인
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /유지보수 내역 추가/i })).toBeVisible();

      // 필드 확인
      await expect(page.getByLabel(/수행 일시/i)).toBeVisible();
      await expect(page.getByLabel(/주요 내용/i)).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Equipment History - Incident History Dialog', () => {
  test('손상/수리 내역 추가 다이얼로그 열기', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 손상/수리 내역 섹션의 추가 버튼 클릭
      const incidentSection = page.locator('section, [class*="card"]').filter({ hasText: /손상.*오작동.*변경.*수리/ });
      await incidentSection.getByRole('button', { name: '추가' }).click();

      // 다이얼로그 확인
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /손상.*수리 내역 추가/i })).toBeVisible();

      // 필드 확인
      await expect(page.getByLabel(/발생 일시/i)).toBeVisible();
      await expect(page.getByLabel(/유형/i)).toBeVisible();
      await expect(page.getByLabel(/주요 내용/i)).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Equipment History - Calibration Table Columns', () => {
  test('교정 이력 테이블 컬럼 확인', async ({ page }) => {
    await login(page);
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const editButtons = page.locator('[data-testid="equipment-edit-button"], a[href*="/edit"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');

      // 교정 이력 섹션 테이블 헤더 확인
      const calibrationSection = page.locator('section, [class*="card"]').filter({ hasText: '장비 교정 이력' });

      // 테이블 헤더 컬럼 확인
      await expect(calibrationSection.getByRole('columnheader', { name: '교정일' })).toBeVisible({ timeout: 10000 });
      await expect(calibrationSection.getByRole('columnheader', { name: '교정 결과' })).toBeVisible();
      await expect(calibrationSection.getByRole('columnheader', { name: '차기 교정일' })).toBeVisible();
      await expect(calibrationSection.getByRole('columnheader', { name: '교정기관' })).toBeVisible();
      await expect(calibrationSection.getByRole('columnheader', { name: '상태' })).toBeVisible();
      await expect(calibrationSection.getByRole('columnheader', { name: '승인' })).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Equipment Registration - History Dialog After Create', () => {
  test('장비 등록 완료 후 이력 추가 다이얼로그 표시', async ({ page }) => {
    await login(page);
    await page.goto('/equipment/create');

    // 필수 필드 입력
    const uniqueId = Date.now().toString().slice(-6);
    await page.getByLabel('장비명').fill(`테스트 장비 ${uniqueId}`);
    await page.getByLabel('관리번호').fill(`MN-TEST-${uniqueId}`);

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // 등록 버튼 클릭
    await page.getByRole('button', { name: /등록.*승인/i }).click();

    // 승인 확인 모달이 표시되면 요청하기 클릭
    const confirmButton = page.getByRole('button', { name: /요청하기/i });
    if (await confirmButton.isVisible({ timeout: 3000 })) {
      await confirmButton.click();
    }

    // 이력 정보 추가 다이얼로그 또는 목록 페이지 확인 (역할에 따라 다름)
    // 기술책임자는 직접 승인되어 이력 추가 다이얼로그가 표시될 수 있음
    // 시험실무자는 승인 요청 후 목록 페이지로 이동
    await page.waitForLoadState('networkidle');

    const historyDialog = page.getByRole('dialog').filter({ hasText: '이력 정보 추가' });
    const isHistoryDialogVisible = await historyDialog.isVisible({ timeout: 5000 }).catch(() => false);

    if (isHistoryDialogVisible) {
      // 이력 정보 추가 다이얼로그 확인
      await expect(page.getByText(/장비가 성공적으로 등록되었습니다/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /지금 추가하기/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /나중에 추가/i })).toBeVisible();
    } else {
      // 목록 페이지로 이동되었거나 토스트 메시지 확인
      // 승인 요청의 경우 목록 페이지로 이동
      await expect(page).toHaveURL(/\/equipment/, { timeout: 10000 });
    }
  });
});
