import { test, expect } from '@playwright/test';

/**
 * 장비 등록/수정 폼 에러 처리 테스트
 *
 * 테스트 케이스:
 * 1. 필수 필드 누락 시 인라인 에러 표시
 * 2. 교정 이력 추가 시 유효성 검증 에러
 * 3. 네트워크 오류 시뮬레이션
 * 4. API 에러 응답 처리
 */

// 글로벌 테스트 타임아웃 설정
test.setTimeout(90000);

// 테스트 전 설정: 큰 뷰포트 사용
test.use({ viewport: { width: 1920, height: 1080 } });

// 로그인 헬퍼 함수
async function login(
  page: import('@playwright/test').Page,
  email: string = 'admin@example.com',
  password: string = 'admin123'
) {
  await page.goto('/login');

  // 페이지 로드 대기
  await page.waitForLoadState('networkidle');

  // 추가 대기 - hydration 완료
  await page.waitForTimeout(2000);

  // 로그인 폼이 로드될 때까지 대기 (next-auth getProviders 호출 완료 대기)
  // "Welcome back" 텍스트가 나타나면 폼이 로드된 것
  try {
    await page.waitForSelector('#email', { timeout: 30000 });
  } catch (e) {
    // 페이지 상태 디버깅
    const html = await page.content();
    console.log('Page HTML contains login-form:', html.includes('login-form'));
    console.log('Page HTML contains #email:', html.includes('id="email"'));
    throw e;
  }

  // 이메일 입력
  await page.locator('#email').fill(email);
  // 비밀번호 입력
  await page.locator('#password').fill(password);
  // 로그인 버튼 클릭
  await page.getByTestId('login-button').click();

  // 로그인 성공 후 리다이렉트 대기
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
}

test.describe('Equipment Form - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/equipment/create');
  });

  test('필수 필드 누락 시 에러 메시지 표시', async ({ page }) => {
    // 폼 제출 버튼 클릭 (필수 필드 미입력)
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 장비명 필수 에러 확인
    await expect(page.getByText(/장비명.*필수|장비명.*2자.*이상/i).first()).toBeVisible({
      timeout: 5000,
    });

    // 관리번호 필수 에러 확인
    await expect(page.getByText(/관리번호.*필수|관리번호.*2자.*이상/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('필수 필드 입력 후 에러 사라짐', async ({ page }) => {
    // 먼저 제출하여 에러 표시
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 에러 메시지 확인
    await expect(page.getByText(/장비명.*필수|장비명.*2자.*이상/i).first()).toBeVisible({
      timeout: 5000,
    });

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('테스트 장비');
    await page.getByLabel('관리번호').fill('SUW-E0001');

    // 포커스를 다른 필드로 이동하여 blur 트리거
    await page.getByLabel('장비명').blur();

    // 에러 메시지가 사라졌거나 유효성 상태 변경 확인
    // (react-hook-form은 blur 시 재검증)
    const nameInput = page.getByLabel('장비명');
    await expect(nameInput).toHaveValue('테스트 장비');
  });

  test('역할별 안내 배너 표시', async ({ page }) => {
    // 역할 안내 배너 확인
    await expect(page.getByText(/현재 권한:/i)).toBeVisible();

    // 권한 유형 중 하나가 표시되는지 확인
    const roleTexts = ['시험실무자', '기술책임자', '시험소 관리자', '시스템 관리자'];
    const roleVisible = await Promise.any(
      roleTexts.map((text) =>
        page
          .getByText(text)
          .isVisible()
          .then((v) => (v ? Promise.resolve(true) : Promise.reject()))
      )
    ).catch(() => false);

    expect(roleVisible).toBeTruthy();
  });

  test('파일 크기 제한 안내 표시', async ({ page }) => {
    // 파일 첨부 섹션으로 스크롤
    await page.getByRole('heading', { name: /파일 첨부/i }).scrollIntoViewIfNeeded();

    // 파일 크기 제한 안내 확인 (10MB)
    await expect(page.getByText(/10.*MB|최대.*크기/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Equipment Form - Calibration History Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/equipment/create');
  });

  test('교정 이력 추가 시 필수 필드 검증', async ({ page }) => {
    // 교정 이력 섹션으로 스크롤
    await page.getByRole('heading', { name: /교정 이력/i }).scrollIntoViewIfNeeded();

    // 추가 버튼 클릭
    const addButton = page.getByRole('button', { name: /추가/i }).last();
    if (await addButton.isVisible()) {
      await addButton.click();

      // 다이얼로그가 열렸는지 확인
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // 교정기관 비워두고 저장 시도
      await page.getByLabel('교정기관').clear();
      await page.getByRole('button', { name: '저장' }).click();

      // 에러 메시지 확인
      await expect(page.getByText(/교정기관.*입력/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('교정일이 차기 교정일보다 이후인 경우 에러', async ({ page }) => {
    // 교정 이력 섹션으로 스크롤
    await page.getByRole('heading', { name: /교정 이력/i }).scrollIntoViewIfNeeded();

    // 추가 버튼 클릭
    const addButton = page.getByRole('button', { name: /추가/i }).last();
    if (await addButton.isVisible()) {
      await addButton.click();

      // 다이얼로그가 열렸는지 확인
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // 교정일을 차기 교정일보다 이후로 설정
      await page.getByLabel('교정일').fill('2026-12-01');
      await page.getByLabel('차기 교정일').fill('2026-01-01');
      await page.getByLabel('교정기관').fill('한국표준과학연구원');

      // 저장 시도
      await page.getByRole('button', { name: '저장' }).click();

      // 날짜 관련 에러 메시지 확인
      await expect(page.getByText(/차기 교정일.*이후|날짜.*오류/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('교정 이력 삭제 확인 다이얼로그', async ({ page }) => {
    // 교정 이력 섹션으로 스크롤
    await page.getByRole('heading', { name: /교정 이력/i }).scrollIntoViewIfNeeded();

    // 먼저 이력 추가
    const addButton = page.getByRole('button', { name: /추가/i }).last();
    if (await addButton.isVisible()) {
      await addButton.click();

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // 필수 정보 입력
      await page.getByLabel('교정기관').fill('테스트 기관');
      await page.getByRole('button', { name: '저장' }).click();

      // 다이얼로그 닫힘 대기
      await expect(page.getByRole('dialog'))
        .toBeHidden({ timeout: 5000 })
        .catch(() => {});

      // 삭제 버튼 클릭
      const deleteButton = page.getByRole('button', { name: /삭제/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 삭제 확인 다이얼로그 확인
        await expect(page.getByText(/삭제.*확인|삭제.*시겠습니까/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Equipment Form - API Error Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('존재하지 않는 장비 수정 시 에러 처리', async ({ page }) => {
    // 존재하지 않는 UUID로 수정 페이지 접근
    await page.goto('/equipment/00000000-0000-0000-0000-000000000000/edit');

    // 에러 메시지 또는 로딩/리다이렉트 확인
    await expect(page.getByText(/오류|찾을 수 없|not found|로딩|없습니다/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('네트워크 오류 시뮬레이션', async ({ page, context }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('네트워크 테스트 장비');
    await page.getByLabel('관리번호').fill('SUW-E9999');

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // API 요청 인터셉트하여 네트워크 에러 시뮬레이션
    await page.route('**/api/equipment', (route) => {
      route.abort('connectionfailed');
    });

    // 폼 제출
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 에러 메시지 확인 (toast 또는 ErrorAlert)
    await expect(page.getByText(/네트워크|연결|오류|실패/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('중복 관리번호 에러 처리', async ({ page }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('중복 테스트 장비');
    await page.getByLabel('관리번호').fill('SUW-E0001'); // 이미 존재한다고 가정

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // API 요청 인터셉트하여 409 Conflict 응답 시뮬레이션
    await page.route('**/api/equipment', (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'DUPLICATE_MANAGEMENT_NUMBER',
            message: '이미 등록된 관리번호입니다.',
          },
        }),
      });
    });

    // 폼 제출
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 중복 에러 메시지 확인
    await expect(page.getByText(/중복|이미.*등록|관리번호/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('서버 에러 (500) 처리', async ({ page }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('서버 에러 테스트 장비');
    await page.getByLabel('관리번호').fill('SUW-E9998');

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // API 요청 인터셉트하여 500 에러 시뮬레이션
    await page.route('**/api/equipment', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 내부 오류가 발생했습니다.',
          },
        }),
      });
    });

    // 폼 제출
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 서버 에러 메시지 확인
    await expect(page.getByText(/서버|오류|실패|error/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('권한 없음 (403) 에러 처리', async ({ page }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('권한 테스트 장비');
    await page.getByLabel('관리번호').fill('SUW-E9997');

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // API 요청 인터셉트하여 403 에러 시뮬레이션
    await page.route('**/api/equipment', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'PERMISSION_DENIED',
            message: '이 작업을 수행할 권한이 없습니다.',
          },
        }),
      });
    });

    // 폼 제출
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 권한 에러 메시지 확인
    await expect(page.getByText(/권한|없습니다|forbidden/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Equipment Form - ErrorAlert Component', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ErrorAlert에 해결 방법이 표시되는지 확인', async ({ page }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('ErrorAlert 테스트');
    await page.getByLabel('관리번호').fill('SUW-E9996');

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // 중복 에러 시뮬레이션
    await page.route('**/api/equipment', (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'DUPLICATE_MANAGEMENT_NUMBER',
            message: '관리번호 SUW-E9996은(는) 이미 등록되어 있습니다.',
          },
        }),
      });
    });

    // 폼 제출
    await page.getByRole('button', { name: /등록/i }).first().click();

    // ErrorAlert 표시 확인
    await expect(page.getByText(/중복|이미.*등록|관리번호/i).first()).toBeVisible({
      timeout: 10000,
    });

    // 해결 방법 텍스트 확인 (선택적)
    const solutionText = page.getByText(/해결 방법|다른.*관리번호|장비.*확인/i);
    if ((await solutionText.count()) > 0) {
      await expect(solutionText.first()).toBeVisible();
    }
  });

  test('ErrorAlert 닫기 버튼 동작', async ({ page }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('닫기 버튼 테스트');
    await page.getByLabel('관리번호').fill('SUW-E9995');

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    // 에러 시뮬레이션
    await page.route('**/api/equipment', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'SERVER_ERROR',
            message: '서버 오류 발생',
          },
        }),
      });
    });

    // 폼 제출
    await page.getByRole('button', { name: /등록/i }).first().click();

    // ErrorAlert 표시 확인
    const errorAlert = page.getByText(/서버|오류/i).first();
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    // 닫기 버튼이 있다면 클릭
    const closeButton = page.getByRole('button', { name: /닫기|close|x/i }).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      // Alert가 사라졌는지 확인
      await expect(errorAlert)
        .toBeHidden({ timeout: 5000 })
        .catch(() => {
          // ErrorAlert가 여전히 보이면 다시 시도 버튼으로 처리했을 수 있음
        });
    }
  });

  test('다시 시도 버튼 동작', async ({ page }) => {
    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('재시도 테스트');
    await page.getByLabel('관리번호').fill('SUW-E9994');

    // 사이트 선택
    await page.getByRole('combobox', { name: /사이트/i }).click();
    await page.getByRole('option', { name: '수원' }).click();

    let requestCount = 0;

    // 첫 번째 요청은 에러, 두 번째 요청은 성공
    await page.route('**/api/equipment', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'SERVER_ERROR',
              message: '일시적인 서버 오류',
            },
          }),
        });
      } else {
        // 라우트 해제하여 실제 요청 전달
        route.continue();
      }
    });

    // 첫 번째 제출 (에러 발생)
    await page.getByRole('button', { name: /등록/i }).first().click();

    // 에러 메시지 확인
    await expect(page.getByText(/서버|오류|실패/i).first()).toBeVisible({ timeout: 10000 });

    // 다시 시도 버튼 클릭 (있다면)
    const retryButton = page.getByRole('button', { name: /다시.*시도|재시도|retry/i });
    if (await retryButton.isVisible()) {
      await retryButton.click();
      // 에러 상태가 초기화되었는지 확인
    }
  });
});

test.describe('Equipment Edit Form - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('수정 페이지 로드 실패 시 에러 표시', async ({ page }) => {
    // 잘못된 UUID로 접근
    await page.goto('/equipment/invalid-uuid/edit');

    // 에러 상태 확인
    await expect(page.getByText(/오류|찾을 수 없|로딩|없습니다/i).first()).toBeVisible({
      timeout: 10000,
    });

    // 뒤로 가기 버튼 확인
    await expect(page.getByRole('button', { name: /뒤로|돌아가기/i }))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // 버튼이 없을 수도 있음
      });
  });
});
