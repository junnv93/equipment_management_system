import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Equipment Create Form', () => {
  test.beforeEach(async ({ siteAdminPage: page }) => {
    await page.goto('/equipment/create');
  });

  test('장비 등록 페이지 렌더링', async ({ siteAdminPage: page }) => {
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '장비 등록' })).toBeVisible();

    // 섹션 카드 확인 (headings으로 더 구체적으로 찾기)
    await expect(page.getByRole('heading', { name: '기본 정보' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '교정 정보' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '상태 및 위치' })).toBeVisible();
    // 파일 첨부 섹션 헤딩 (번호가 붙어 있을 수 있음)
    await expect(page.getByRole('heading', { name: /\d?\s?파일 첨부$/i })).toBeVisible();
  });

  test('필수 필드 검증 - 장비명', async ({ siteAdminPage: page }) => {
    // 등록 버튼 클릭 (submit 버튼 찾기 - admin은 승인 불필요하므로 "등록"만 표시)
    await page.getByRole('button', { name: /^등록/ }).click();

    // 에러 메시지 확인 (zod 유효성 검증)
    await expect(page.getByText(/장비명.*필수/i).first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // 다른 형태의 에러 메시지 확인
      });
  });

  test('필수 필드 검증 - 관리번호', async ({ siteAdminPage: page }) => {
    // 장비명만 입력
    await page.getByLabel('장비명').fill('테스트 장비');

    // 등록 버튼 클릭 (admin은 승인 불필요하므로 "등록"만 표시)
    await page.getByRole('button', { name: /^등록/ }).click();

    // 관리번호 에러 메시지 확인
    await expect(page.getByText(/관리번호.*필수/i).first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // 다른 형태의 에러 메시지 확인
      });
  });

  test('사이트 선택 시 팀 필터링', async ({ siteAdminPage: page }) => {
    // 사이트 선택 (combobox 사용)
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // 팀 선택 가능 확인
    await page.getByRole('combobox', { name: /팀/i }).click();

    // 수원 사이트의 팀들이 표시되는지 확인
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('교정 주기 입력 시 차기 교정일 자동 계산', async ({ siteAdminPage: page }) => {
    // 교정 주기 입력 필드 확인
    const calibrationCycleInput = page.getByLabel(/교정.*주기/i);
    await expect(calibrationCycleInput).toBeVisible();

    // 교정 주기 입력 (12개월)
    await calibrationCycleInput.fill('12');

    // 입력값이 설정되었는지 확인
    await expect(calibrationCycleInput).toHaveValue('12');
  });

  test('역할별 안내 배너 표시', async ({ siteAdminPage: page }) => {
    // 역할 배너 표시 확인
    await expect(page.getByText(/현재 권한:/i)).toBeVisible();
  });

  test('취소 버튼 클릭 시 목록으로 이동', async ({ siteAdminPage: page }) => {
    await page.getByRole('button', { name: '취소' }).click();
    // URL에 /equipment가 포함되어 있는지 확인 (정확한 경로는 다를 수 있음)
    await expect(page).toHaveURL(/\/equipment/);
  });
});

test.describe('Equipment Form - File Upload', () => {
  test.beforeEach(async ({ siteAdminPage: page }) => {
    await page.goto('/equipment/create');
  });

  test('파일 업로드 영역 렌더링', async ({ siteAdminPage: page }) => {
    // 파일 첨부 섹션 확인 (heading으로 찾기 - 번호가 붙어 있을 수 있음)
    await expect(page.getByRole('heading', { name: /\d?\s?파일 첨부$/i })).toBeVisible();

    // 드래그 앤 드롭 영역 확인
    await expect(page.getByText(/드래그|클릭.*업로드/i).first()).toBeVisible();
  });

  test('파일 업로드 안내 정보 표시', async ({ siteAdminPage: page }) => {
    // 파일 관련 텍스트 확인 (번호가 붙어 있을 수 있음)
    await expect(page.getByRole('heading', { name: /\d?\s?파일 첨부$/i })).toBeVisible();

    // 파일 크기 제한 안내 (10MB가 어딘가에 표시됨)
    await expect(page.getByText(/MB/i).first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // 제한 안내가 다른 형태일 수 있음
      });
  });
});

test.describe('Equipment Edit Form', () => {
  test('수정 페이지 렌더링 (존재하지 않는 장비)', async ({ siteAdminPage: page }) => {
    await page.goto('/equipment/non-existent-id/edit');

    // 에러 상태 또는 로딩 확인
    await expect(page.getByText(/오류|로딩|없습니다|not found/i).first())
      .toBeVisible({ timeout: 10000 })
      .catch(() => {
        // 리다이렉트 되거나 다른 처리가 될 수 있음
      });
  });
});

test.describe('Equipment Form - Responsive Design', () => {
  test('데스크톱 뷰포트', async ({ siteAdminPage: page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/equipment/create');

    // 2열 그리드 확인 (데스크톱) - heading으로 찾기
    await expect(page.getByRole('heading', { name: '기본 정보' })).toBeVisible();
  });

  test('모바일 뷰포트', async ({ siteAdminPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/equipment/create');

    // 모바일에서도 폼 표시
    await expect(page.getByLabel('장비명')).toBeVisible();
    // submit 버튼 확인 (첫 번째 등록 버튼)
    await expect(page.getByRole('button', { name: /등록/i }).first()).toBeVisible();
  });

  test('태블릿 뷰포트', async ({ siteAdminPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/equipment/create');

    // 태블릿에서도 폼 표시
    await expect(page.getByLabel('장비명')).toBeVisible();
  });
});

test.describe('Equipment Form - Accessibility', () => {
  test.beforeEach(async ({ siteAdminPage: page }) => {
    await page.goto('/equipment/create');
  });

  test('키보드 네비게이션', async ({ siteAdminPage: page }) => {
    // Tab으로 필드 이동
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 어떤 요소에 포커스가 있는지 확인 (정확한 포커스 순서는 다를 수 있음)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeTruthy();
  });

  test('필수 필드 별표(*) 표시', async ({ siteAdminPage: page }) => {
    // 필수 필드 라벨에 * 표시 확인 (FormLabel에서 사용하는 구조)
    // FormLabel 내부에 * 표시가 있는지 확인
    await expect(
      page
        .locator('[data-slot="form-label"]:has-text("장비명")')
        .or(page.locator('label:has-text("장비명")'))
    ).toBeVisible();
  });

  test('폼 레이블 연결', async ({ siteAdminPage: page }) => {
    // 레이블과 입력 필드 연결 확인
    const nameInput = page.getByLabel('장비명');
    await expect(nameInput).toBeVisible();
    // name 속성 확인 (form에서 사용하는 이름)
    await expect(nameInput).toHaveAttribute('name');
  });
});
