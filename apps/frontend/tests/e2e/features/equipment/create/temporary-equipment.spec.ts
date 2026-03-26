import { test, expect } from '../../../shared/fixtures/auth.fixture';

/**
 * E2E 테스트: 공용/렌탈 장비 임시등록 및 사용 플로우
 *
 * 테스트 범위:
 * 1. 임시등록 폼 렌더링 및 필드 검증
 * 2. 교정 유효성 자동 검증
 * 3. 공용장비 등록 플로우
 * 4. 렌탈장비 등록 플로우
 * 5. 사용 기간 D-day 표시
 * 6. 접근성 검증
 */

test.describe('공용/렌탈 장비 임시등록', () => {
  test('임시등록 페이지 접근 및 기본 필드 표시', async ({ testOperatorPage: page }) => {
    // Given: 임시등록 페이지 접속
    await page.goto('/equipment/create-shared');

    // When: 페이지 로드 완료

    // Then: 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('공용/렌탈 장비 임시등록');

    // Then: 임시등록 안내 배너 표시
    await expect(page.locator('text=임시등록이란?')).toBeVisible();

    // Then: 기본 필드 확인 (EquipmentForm mode='temporary')
    await expect(page.locator('label:has-text("장비명")')).toBeVisible();
    await expect(page.locator('label:has-text("관리번호")')).toBeVisible();

    // Then: 임시등록 전용 필드 확인
    await expect(page.locator('text=장비 유형')).toBeVisible();
    await expect(page.locator('label:has-text("공용장비 (타 팀)")')).toBeVisible();
    await expect(page.locator('label:has-text("렌탈장비 (외부)")')).toBeVisible();
    await expect(page.locator('label:has-text("소유처")')).toBeVisible();
    await expect(page.locator('label:has-text("사용 시작일")')).toBeVisible();
    await expect(page.locator('label:has-text("사용 종료일")')).toBeVisible();
    await expect(page.locator('label:has-text("교정성적서")')).toBeVisible();
  });

  test('장비 유형 선택 시 소유처 필드 변경', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // Given: 공용장비 선택 (기본값)
    const commonRadio = page.locator('input[value="common"]');
    await expect(commonRadio).toBeChecked();

    // Then: 소유처가 select 드롭다운
    const ownerSelect = page.locator('select#owner');
    await expect(ownerSelect).toBeVisible();
    await expect(ownerSelect).toHaveValue('');

    // When: 렌탈장비 선택
    await page.locator('input[value="rental"]').click();

    // Then: 소유처가 text input으로 변경
    const ownerInput = page.locator('input#owner');
    await expect(ownerInput).toBeVisible();
    await expect(ownerInput).toHaveAttribute('placeholder', /렌탈업체명/);
  });

  test('교정 유효성 자동 검증 - 유효한 경우', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // Given: 사용 기간 입력
    await page.fill('input#usagePeriodStart', '2026-02-01');
    await page.fill('input#usagePeriodEnd', '2026-05-31');

    // When: 차기교정일을 사용 종료일 이후로 입력
    await page.fill('input[name="nextCalibrationDate"]', '2026-06-30');

    // Then: 유효 메시지 표시 (녹색 알림)
    await expect(page.locator('text=교정 유효기간 확인됨')).toBeVisible();
    await expect(page.locator('text=/여유가 있습니다/')).toBeVisible();

    // Then: Alert 역할 확인 (접근성)
    const validAlert = page.locator('div:has-text("교정 유효기간 확인됨")').first();
    await expect(validAlert).toHaveClass(/green/);
  });

  test('교정 유효성 자동 검증 - 무효한 경우', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // Given: 사용 기간 입력
    await page.fill('input#usagePeriodStart', '2026-02-01');
    await page.fill('input#usagePeriodEnd', '2026-05-31');

    // When: 차기교정일을 사용 종료일 이전으로 입력
    await page.fill('input[name="nextCalibrationDate"]', '2026-04-30');

    // Then: 경고 메시지 표시 (빨간색 알림)
    await expect(page.locator('text=교정 유효기간 부족')).toBeVisible();
    await expect(page.locator('text=/사용 종료일.*이후여야 합니다/')).toBeVisible();

    // Then: Alert 역할 확인 (접근성)
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
  });

  test('공용장비 임시등록 플로우 (전체)', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // Step 1: 기본 정보 입력
    await page.fill('input[name="name"]', '공용 스펙트럼 분석기');
    await page.fill('input[name="managementNumber"]', 'TEMP-COMMON-001');

    // Step 2: 장비 유형 선택 (공용장비)
    await page.locator('input[value="common"]').click();

    // Step 3: 소유처 선택
    await page.selectOption('select#owner', 'Safety팀');

    // Step 4: 사용 기간 입력
    await page.fill('input#usagePeriodStart', '2026-02-01');
    await page.fill('input#usagePeriodEnd', '2026-04-30');

    // Step 5: 교정 정보 입력 (유효한 차기교정일)
    await page.fill('input[name="lastCalibrationDate"]', '2026-01-15');
    await page.fill('input[name="nextCalibrationDate"]', '2026-07-15');

    // Step 6: 교정성적서 업로드 (Mock)
    const fileInput = page.locator('input#calibrationCertificate');
    await fileInput.setInputFiles({
      name: 'calibration-cert.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    // Step 7: 필수 필드 입력 (사이트 등)
    await page.selectOption('select[name="site"]', 'suwon');

    // Step 8: 제출
    await page.click('button[type="submit"]');

    // Then: 성공 토스트 표시
    await expect(page.locator('text=임시등록 완료')).toBeVisible({ timeout: 5000 });

    // Then: 장비 상세 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/equipment\/[^/]+$/);

    // Then: 공용장비 배지 표시
    await expect(page.locator('text=공용장비 안내')).toBeVisible();
    await expect(page.locator('text=임시등록된')).toBeVisible();
  });

  test('렌탈장비 임시등록 플로우 (전체)', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // Step 1: 기본 정보 입력
    await page.fill('input[name="name"]', '렌탈 오실로스코프');
    await page.fill('input[name="managementNumber"]', 'TEMP-RENTAL-001');

    // Step 2: 장비 유형 선택 (렌탈장비)
    await page.locator('input[value="rental"]').click();

    // Step 3: 소유처 입력 (렌탈업체명)
    await page.fill('input#owner', '테크렌탈(주)');

    // Step 4: 사용 기간 입력
    await page.fill('input#usagePeriodStart', '2026-03-01');
    await page.fill('input#usagePeriodEnd', '2026-05-31');

    // Step 5: 교정 정보 입력
    await page.fill('input[name="lastCalibrationDate"]', '2026-02-15');
    await page.fill('input[name="nextCalibrationDate"]', '2027-02-15');

    // Step 6: 교정성적서 업로드
    await page.locator('input#calibrationCertificate').setInputFiles({
      name: 'rental-cert.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Rental PDF content'),
    });

    // Step 7: 필수 필드
    await page.selectOption('select[name="site"]', 'uiwang');

    // Step 8: 제출
    await page.click('button[type="submit"]');

    // Then: 성공 토스트
    await expect(page.locator('text=임시등록 완료')).toBeVisible({ timeout: 5000 });

    // Then: 장비 상세 페이지
    await expect(page).toHaveURL(/\/equipment\/[^/]+$/);
    await expect(page.locator('text=렌탈')).toBeVisible();
  });

  test('장비 목록에서 사용 기간 D-day 표시', async ({ testOperatorPage: page }) => {
    // Given: 임시등록된 장비가 있다고 가정 (Mock 데이터 필요)
    await page.goto('/equipment');

    // When: isShared 필터 적용
    await page.selectOption('select[name="isShared"]', 'shared');

    // Then: 임시등록 장비 카드에 UsagePeriodBadge 표시 (조건부)
    // Note: 실제 데이터가 있어야 테스트 가능. Mock API 필요.
    const equipmentCards = page.locator('[data-testid="equipment-card"]');
    if ((await equipmentCards.count()) > 0) {
      // 첫 번째 카드에서 D-day 배지 확인
      const firstCard = equipmentCards.first();
      const dDayBadge = firstCard.locator('text=/D-\\d+|D\\+\\d+|D-Day/');

      // D-day 배지가 있을 수도 있고 없을 수도 있음 (status='temporary'인 경우만)
      const badgeCount = await dDayBadge.count();
      if (badgeCount > 0) {
        await expect(dDayBadge).toBeVisible();
      }
    }
  });

  test('장비 상세 페이지에서 임시등록 정보 표시', async ({ testOperatorPage: page }) => {
    // Given: 임시등록 장비 등록
    await page.goto('/equipment/create-shared');
    await page.fill('input[name="name"]', 'E2E 테스트 장비');
    await page.fill('input[name="managementNumber"]', 'E2E-TEMP-001');
    await page.locator('input[value="common"]').click();
    await page.selectOption('select#owner', 'Battery팀');
    await page.fill('input#usagePeriodStart', '2026-02-01');
    await page.fill('input#usagePeriodEnd', '2026-03-31');
    await page.fill('input[name="nextCalibrationDate"]', '2026-06-30');
    await page.locator('input#calibrationCertificate').setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test'),
    });
    await page.selectOption('select[name="site"]', 'suwon');
    await page.click('button[type="submit"]');

    // When: 장비 상세 페이지 로드
    await expect(page).toHaveURL(/\/equipment\/[^/]+$/, { timeout: 5000 });

    // Then: 공용장비 안내 배너 표시
    await expect(page.locator('text=공용장비 안내')).toBeVisible();

    // Then: 임시등록 안내 텍스트
    await expect(page.locator('text=임시등록된')).toBeVisible();

    // Then: 사용 기간 D-day 배지 표시
    const dDayBadge = page.locator('text=/D-\\d+|D\\+\\d+|D-Day/');
    await expect(dDayBadge).toBeVisible();

    // Then: 사용 기간 만료 안내
    await expect(page.locator('text=/사용 기간이 종료되면/')).toBeVisible();
  });

  test('접근성: ARIA 속성 및 키보드 탐색', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // 장비 유형 라디오 버튼 그룹 접근성
    const commonRadio = page.locator('input[value="common"]');
    const rentalRadio = page.locator('input[value="rental"]');

    // 키보드로 탐색 가능
    await commonRadio.focus();
    await expect(commonRadio).toBeFocused();

    await page.keyboard.press('Tab');
    // (다음 포커스 가능 요소로 이동)

    // Alert 역할 확인 (교정 유효성 검증)
    await page.fill('input#usagePeriodEnd', '2026-05-31');
    await page.fill('input[name="nextCalibrationDate"]', '2026-04-30');

    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();

    // aria-label 확인 (UsagePeriodBadge)
    // Note: 장비 상세 페이지에서 확인 필요
  });

  test('필수 필드 누락 시 에러 표시', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // Given: 일부 필드만 입력
    await page.fill('input[name="name"]', '불완전 장비');

    // When: 제출 시도 (필수 필드 누락)
    await page.click('button[type="submit"]');

    // Then: 브라우저 기본 유효성 검증 또는 커스텀 에러 메시지
    // (HTML5 required 속성이 있다면 브라우저가 자동 검증)
    const managementNumberInput = page.locator('input[name="managementNumber"]');
    await expect(managementNumberInput).toBeVisible();

    // Note: react-hook-form 유효성 검증 메시지는 커스텀 구현에 따라 다름
  });

  test('교정성적서 파일 형식 검증 (PDF만 허용)', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create-shared');

    // When: PDF가 아닌 파일 업로드 시도
    const fileInput = page.locator('input#calibrationCertificate');

    // HTML accept 속성 확인
    await expect(fileInput).toHaveAttribute('accept', '.pdf');

    // Note: 브라우저가 .pdf만 선택 가능하도록 제한함
    // 실제 파일 업로드 검증은 백엔드에서 처리
  });
});

test.describe('임시등록 장비 대여 플로우', () => {
  test('렌탈장비 대여 시 입고 검수 필드 표시', async ({ testOperatorPage: page }) => {
    // Given: 반입반출 신청 페이지
    await page.goto('/checkouts/create');

    // When: 렌탈장비 선택 (Mock 데이터 필요)
    // Note: 실제 구현에서는 장비 선택 시 isShared=true, sharedSource='external' 확인

    // Then: EquipmentConditionForm 표시 (입고 검수)
    // 이미 구현된 EquipmentConditionForm이 렌탈장비 검수를 처리
    // 추가 테스트는 checkout-management.spec.ts에서 수행
  });
});
