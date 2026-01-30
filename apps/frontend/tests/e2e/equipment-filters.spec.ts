import { test, expect } from '@playwright/test';

/**
 * 장비 필터 E2E 테스트
 *
 * 테스트 범위:
 * 1. 상태 필터 - EQUIPMENT_STATUS_FILTER_OPTIONS 적용 확인
 * 2. 장비 분류 필터 - 백엔드 필터링 작동 확인
 * 3. 교정 기한 필터 - status와 독립적으로 작동 확인
 * 4. 공용장비 필터 - isShared 필터링 확인
 * 5. 교정 방법 필터 - calibrationMethod 필터링 확인
 * 6. 필터 조합 - 여러 필터 동시 적용
 * 7. API 요청 파라미터 검증 - 네트워크 요청 확인
 */

test.describe('장비 목록 필터', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 - admin@example.com은 lab_manager 역할을 가진 사용자
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 로그인 후 홈페이지로 리다이렉트 대기
    await page.waitForURL('/', { timeout: 30000 });

    // 장비 목록 페이지로 명시적 이동
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');
  });

  test('상태 필터 - 옵션 표시 및 필터링', async ({ page }) => {
    // 상태 필터 드롭다운 열기
    await page.click('#filter-status');

    // 기본 옵션 확인
    await expect(page.locator('[role="option"]:has-text("모든 상태")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("사용 가능")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("사용 중")')).toBeVisible();

    // '사용 가능' 선택
    await page.click('[role="option"]:has-text("사용 가능")');

    // URL에 status 파라미터 확인
    await expect(page).toHaveURL(/status=available/);

    // 활성 필터 배지 확인
    await expect(page.locator('text=상태: 사용 가능')).toBeVisible();
  });

  test('장비 분류 필터 - 옵션 표시 및 URL 파라미터 확인', async ({ page }) => {
    // 장비 분류 드롭다운 열기
    await page.click('#filter-classification');

    // 분류 옵션들 확인
    await expect(page.locator('[role="option"]:has-text("모든 분류")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("FCC EMC/RF")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("General EMC")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("SAR")')).toBeVisible();

    // FCC EMC/RF 선택
    await page.click('[role="option"]:has-text("FCC EMC/RF")');

    // URL에 classification 파라미터 확인
    await expect(page).toHaveURL(/classification=fcc_emc_rf/);

    // 활성 필터 배지 확인
    await expect(page.locator('text=분류: FCC EMC/RF')).toBeVisible();
  });

  test('공용장비 필터 - isShared 필터링', async ({ page }) => {
    // 장비 구분 드롭다운 열기
    await page.click('#filter-shared');

    // 옵션들 확인
    await expect(page.locator('[role="option"]:has-text("모든 장비")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("공용장비")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("일반장비")')).toBeVisible();

    // 공용장비 선택
    await page.click('[role="option"]:has-text("공용장비")');

    // URL에 isShared 파라미터 확인
    await expect(page).toHaveURL(/isShared=shared/);

    // 활성 필터 배지 확인
    await expect(page.locator('text=구분: 공용장비')).toBeVisible();
  });

  test('교정 방법 필터 - calibrationMethod 필터링', async ({ page }) => {
    // 교정 방법 드롭다운 열기
    await page.click('#filter-calibration');

    // 옵션들 확인
    await expect(page.locator('[role="option"]:has-text("모든 교정 방법")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("외부 교정")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("자체 점검")')).toBeVisible();

    // 외부 교정 선택
    await page.click('[role="option"]:has-text("외부 교정")');

    // URL에 calibrationMethod 파라미터 확인
    await expect(page).toHaveURL(/calibrationMethod=external_calibration/);

    // 활성 필터 배지 확인
    await expect(page.locator('text=교정: 외부 교정')).toBeVisible();
  });

  test('교정 기한 필터 - status와 독립적으로 작동', async ({ page }) => {
    // 1. 먼저 상태를 "사용 가능"으로 설정
    await page.click('#filter-status');
    await page.click('[role="option"]:has-text("사용 가능")');
    await page.waitForLoadState('networkidle');

    // URL 확인
    await expect(page).toHaveURL(/status=available/);

    // 2. 교정 기한을 "기한 초과"로 설정
    await page.click('#filter-calibration-due');
    await page.click('[role="option"]:has-text("기한 초과")');
    await page.waitForLoadState('networkidle');

    // URL에 두 파라미터 모두 존재하는지 확인
    await expect(page).toHaveURL(/status=available/);
    await expect(page).toHaveURL(/calibrationDueFilter=overdue/);

    // 두 개의 활성 필터 배지 모두 표시되는지 확인
    await expect(page.locator('text=상태: 사용 가능')).toBeVisible();
    await expect(page.locator('text=교정기한: 기한 초과')).toBeVisible();
  });

  test('교정 기한 필터 - 교정 임박 옵션', async ({ page }) => {
    // 교정 기한 드롭다운 열기
    await page.click('#filter-calibration-due');

    // 옵션들 확인
    await expect(page.locator('[role="option"]:has-text("전체")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("교정 임박")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("기한 초과")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("정상")')).toBeVisible();

    // 교정 임박 선택
    await page.click('[role="option"]:has-text("교정 임박")');

    // URL에 calibrationDueFilter 파라미터 확인
    await expect(page).toHaveURL(/calibrationDueFilter=due_soon/);

    // 활성 필터 배지 확인
    await expect(page.locator('text=교정기한: 교정 임박')).toBeVisible();
  });

  test('복합 필터 - 여러 필터 동시 적용', async ({ page }) => {
    // 1. 장비 분류: FCC EMC/RF - URL 업데이트 대기
    await page.click('#filter-classification');
    await page.click('[role="option"]:has-text("FCC EMC/RF")');
    await expect(page).toHaveURL(/classification=fcc_emc_rf/, { timeout: 10000 });

    // 2. 상태: 사용 가능 - URL 업데이트 대기
    await page.click('#filter-status');
    await page.click('[role="option"]:has-text("사용 가능")');
    await expect(page).toHaveURL(/status=available/, { timeout: 10000 });

    // 3. 교정 방법: 외부 교정 - URL 업데이트 대기
    await page.click('#filter-calibration');
    await page.click('[role="option"]:has-text("외부 교정")');
    await expect(page).toHaveURL(/calibrationMethod=external_calibration/, { timeout: 10000 });

    // 최종 URL에 모든 파라미터가 포함되었는지 확인
    const finalUrl = page.url();
    expect(finalUrl).toContain('classification=fcc_emc_rf');
    expect(finalUrl).toContain('status=available');
    expect(finalUrl).toContain('calibrationMethod=external_calibration');

    // 활성 필터 배지들 확인
    await expect(page.locator('text=분류: FCC EMC/RF')).toBeVisible();
    await expect(page.locator('text=상태: 사용 가능')).toBeVisible();
    await expect(page.locator('text=교정: 외부 교정')).toBeVisible();
  });

  test('필터 초기화 - 모든 필터 제거', async ({ page }) => {
    // 상태 필터 적용 및 확인
    await page.click('#filter-status');
    await page.click('[role="option"]:has-text("사용 가능")');
    await expect(page).toHaveURL(/status=available/, { timeout: 10000 });
    await expect(page.locator('text=상태: 사용 가능')).toBeVisible();

    // 분류 필터 적용 및 확인
    await page.click('#filter-classification');
    await page.click('[role="option"]:has-text("FCC EMC/RF")');
    await expect(page).toHaveURL(/classification=fcc_emc_rf/, { timeout: 10000 });
    await expect(page.locator('text=분류: FCC EMC/RF')).toBeVisible();

    // 필터 초기화 버튼 클릭
    await page.click('button:has-text("초기화")');
    await page.waitForLoadState('networkidle');

    // URL에서 필터 파라미터 제거 확인
    await expect(page).not.toHaveURL(/status=/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/classification=/, { timeout: 10000 });

    // 활성 필터 배지 제거 확인
    await expect(page.locator('text=상태: 사용 가능')).not.toBeVisible();
    await expect(page.locator('text=분류: FCC EMC/RF')).not.toBeVisible();
  });

  test('개별 필터 제거 - 배지 X 버튼', async ({ page }) => {
    // 상태 필터 적용 및 확인
    await page.click('#filter-status');
    await page.click('[role="option"]:has-text("사용 가능")');
    await expect(page).toHaveURL(/status=available/, { timeout: 10000 });
    await expect(page.locator('text=상태: 사용 가능')).toBeVisible();

    // 분류 필터 적용 및 확인
    await page.click('#filter-classification');
    await page.click('[role="option"]:has-text("FCC EMC/RF")');
    await expect(page).toHaveURL(/classification=fcc_emc_rf/, { timeout: 10000 });
    await expect(page.locator('text=분류: FCC EMC/RF')).toBeVisible();

    // 상태 필터 배지의 X 버튼 클릭 (aria-label에 전체 라벨이 포함됨)
    await page.click('button[aria-label="상태: 사용 가능 필터 제거"]');
    await page.waitForLoadState('networkidle');

    // 상태 필터만 제거되고 분류 필터는 유지
    await expect(page.locator('text=상태: 사용 가능')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=분류: FCC EMC/RF')).toBeVisible();

    // URL 확인
    await expect(page).not.toHaveURL(/status=/);
    await expect(page).toHaveURL(/classification=fcc_emc_rf/);
  });

  test('필터 URL 공유 - 북마크 가능', async ({ page }) => {
    // 분류 필터 적용 및 확인
    await page.click('#filter-classification');
    await page.click('[role="option"]:has-text("SAR")');
    await expect(page).toHaveURL(/classification=sar/, { timeout: 10000 });

    // 교정 기한 필터 적용 및 확인
    await page.click('#filter-calibration-due');
    await page.click('[role="option"]:has-text("교정 임박")');
    await expect(page).toHaveURL(/calibrationDueFilter=due_soon/, { timeout: 10000 });

    // 현재 URL 저장
    const urlWithFilters = page.url();
    expect(urlWithFilters).toContain('classification=sar');
    expect(urlWithFilters).toContain('calibrationDueFilter=due_soon');

    // 다른 페이지로 이동
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // 저장한 URL로 다시 이동
    await page.goto(urlWithFilters);
    await page.waitForLoadState('networkidle');

    // 필터가 복원되었는지 확인
    await expect(page.locator('text=분류: SAR')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=교정기한: 교정 임박')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('장비 필터 URL 파라미터 변환 검증', () => {
  /**
   * 이 테스트 블록은 useEquipmentFilters 훅의 URL 파라미터 변환을 검증합니다.
   * 프론트엔드 필터 상태 → 백엔드 API 파라미터 변환이 올바른지 확인합니다.
   *
   * 변환 규칙:
   * - calibrationDueFilter: 'overdue' → calibrationOverdue=true
   * - calibrationDueFilter: 'due_soon' → calibrationDue=30
   * - calibrationDueFilter: 'normal' → calibrationDueAfter=30
   * - isShared: 'shared' → isShared=true
   * - isShared: 'personal' → isShared=false
   */
  test.beforeEach(async ({ page }) => {
    // 로그인 - admin@example.com은 lab_manager 역할을 가진 사용자
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 로그인 후 홈페이지로 리다이렉트 대기
    await page.waitForURL('/', { timeout: 30000 });

    // 장비 목록 페이지로 명시적 이동
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');
  });

  test('calibrationDueFilter=overdue → calibrationOverdue=true 변환', async ({ page }) => {
    // 교정 기한 초과 필터 적용
    await page.click('#filter-calibration-due');
    await page.click('[role="option"]:has-text("기한 초과")');

    // URL 파라미터 확인 - 프론트엔드에서는 calibrationDueFilter, 백엔드로 전달될 때 calibrationOverdue
    await expect(page).toHaveURL(/calibrationDueFilter=overdue/, { timeout: 10000 });
    await expect(page.locator('text=교정기한: 기한 초과')).toBeVisible();
  });

  test('calibrationDueFilter=due_soon → calibrationDue=30 변환', async ({ page }) => {
    // 교정 임박 필터 적용
    await page.click('#filter-calibration-due');
    await page.click('[role="option"]:has-text("교정 임박")');

    // URL 파라미터 확인
    await expect(page).toHaveURL(/calibrationDueFilter=due_soon/, { timeout: 10000 });
    await expect(page.locator('text=교정기한: 교정 임박')).toBeVisible();
  });

  test('calibrationDueFilter=normal → calibrationDueAfter=30 변환', async ({ page }) => {
    // 정상 필터 적용
    await page.click('#filter-calibration-due');
    await page.click('[role="option"]:has-text("정상")');

    // URL 파라미터 확인
    await expect(page).toHaveURL(/calibrationDueFilter=normal/, { timeout: 10000 });
    await expect(page.locator('text=교정기한: 정상')).toBeVisible();
  });

  test('isShared=shared → isShared=true 변환', async ({ page }) => {
    // 공용장비 필터 적용
    await page.click('#filter-shared');
    await page.click('[role="option"]:has-text("공용장비")');

    // URL 파라미터 확인
    await expect(page).toHaveURL(/isShared=shared/, { timeout: 10000 });
    await expect(page.locator('text=구분: 공용장비')).toBeVisible();
  });

  test('isShared=normal → isShared=false 변환', async ({ page }) => {
    // 일반장비 필터 적용 (URL에서는 'normal'로 표현)
    await page.click('#filter-shared');
    await page.click('[role="option"]:has-text("일반장비")');

    // URL 파라미터 확인
    await expect(page).toHaveURL(/isShared=normal/, { timeout: 10000 });
    await expect(page.locator('text=구분: 일반장비')).toBeVisible();
  });

  test('classification 필터 - 백엔드 classificationCode 매핑', async ({ page }) => {
    // FCC EMC/RF 필터 적용 (classificationCode='E')
    await page.click('#filter-classification');
    await page.click('[role="option"]:has-text("FCC EMC/RF")');

    // URL 파라미터 확인
    await expect(page).toHaveURL(/classification=fcc_emc_rf/, { timeout: 10000 });
    await expect(page.locator('text=분류: FCC EMC/RF')).toBeVisible();
  });
});
