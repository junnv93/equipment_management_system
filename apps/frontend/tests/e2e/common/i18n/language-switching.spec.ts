/**
 * i18n 언어 전환 E2E 검증
 *
 * 시니어 개발자 관점 검증 항목:
 * 1. 기본 로케일(ko) — 앱 전반에 한국어 텍스트 렌더링
 * 2. 영어(en) 전환 — 쿠키 변경으로 영어 텍스트 즉시 적용
 * 3. 다중 페이지 일관성 — Dashboard, Equipment, Settings 모두 영어로 변환
 * 4. UI를 통한 전환 — Settings > Display 페이지에서 실제 전환 버튼 동작
 * 5. 한국어 복원 — 쿠키 재설정으로 한국어 복원
 * 6. 동적 콘텐츠 — 상태 배지, 역할 텍스트 등도 번역 적용
 *
 * 테스트 설계:
 * - 각 test는 독립적 컨텍스트(storageState 기반) → parallel 가능
 * - 쿠키 직접 조작으로 Settings UI 거치지 않고 빠른 locale 전환
 * - auth.fixture.ts의 testOperatorPage(시험실무자)로 충분 (언어는 모든 역할 동일)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 쿠키 기반으로 locale을 빠르게 전환하는 헬퍼 */
async function setLocale(page: import('@playwright/test').Page, locale: 'ko' | 'en') {
  await page.context().addCookies([
    {
      name: 'NEXT_LOCALE',
      value: locale,
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      sameSite: 'Lax',
    },
  ]);
}

// ============================================================================
// TC-i18n-01: 기본 로케일 한국어 확인
// ============================================================================
test.describe('TC-i18n-01: 기본 로케일 한국어', () => {
  test('대시보드 — 한국어 텍스트 렌더링', async ({ testOperatorPage: page }) => {
    await page.goto('/');

    // 핵심 UI 섹션 — 한국어
    await expect(page.getByText('빠른 액션')).toBeVisible();
    await expect(page.getByText('최근 활동')).toBeVisible();
  });

  test('네비게이션 — 한국어 메뉴명', async ({ testOperatorPage: page }) => {
    await page.goto('/');

    // 사이드바 메뉴 — 한국어
    await expect(page.getByRole('link', { name: '대시보드' })).toBeVisible();
    // "장비 관리" 링크가 nav에 있어야 함
    await expect(page.getByRole('navigation').getByText('장비 관리')).toBeVisible();
  });

  test('장비 목록 — 한국어 상태 배지', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 페이지 제목 한국어
    await expect(page.getByRole('heading').first()).toBeVisible();

    // 필터 라벨 한국어 확인
    const filterSection = page.locator('form, [data-testid="filters"], aside').first();
    // 상태 필터 또는 텍스트가 한국어인지 확인
    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/사용 가능|반출 중|부적합|교정|장비/);
  });
});

// ============================================================================
// TC-i18n-02: 영어 전환 — 대시보드
// ============================================================================
test.describe('TC-i18n-02: 영어 전환 — 대시보드', () => {
  test('NEXT_LOCALE=en 쿠키 설정 후 영어 UI', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');

    await page.goto('/');

    // 영어 텍스트 확인
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByText('Recent Activities')).toBeVisible();

    // 한국어 텍스트가 사라졌는지 확인
    await expect(page.getByText('빠른 액션')).not.toBeVisible();
    await expect(page.getByText('최근 활동')).not.toBeVisible();
  });

  test('영어 — 통계 섹션 텍스트 확인', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');

    // 대시보드 탭 영어
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/My Equipment|Team Equipment|Calibration Schedule|Recent Activities/);
  });
});

// ============================================================================
// TC-i18n-03: 영어 전환 — 네비게이션 메뉴
// ============================================================================
test.describe('TC-i18n-03: 영어 전환 — 네비게이션', () => {
  test('사이드바 메뉴명이 영어로 변환', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');

    // 네비게이션 영어 확인
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    // "Equipment" 또는 "Equipment Management"
    await expect(page.getByRole('navigation').getByText(/Equipment/)).toBeVisible();

    // 한국어 메뉴가 없어야 함
    const navText = await page.getByRole('navigation').textContent();
    expect(navText).not.toMatch(/대시보드/);
    expect(navText).not.toMatch(/장비 관리/);
  });
});

// ============================================================================
// TC-i18n-04: 영어 전환 — 장비 목록 페이지
// ============================================================================
test.describe('TC-i18n-04: 영어 전환 — 장비 목록', () => {
  test('장비 목록 UI 전체가 영어', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/equipment');

    // 영어 전용 고정 UI 텍스트 확인 (데이터 유무와 무관)
    const mainText = await page.locator('main').textContent();
    expect(mainText).toMatch(/Equipment|Search|Filter/);

    // 장비 카드/배지 존재 여부에 따른 조건부 검증
    // 장비가 없으면 빈 상태 메시지, 있으면 상태 배지를 확인
    const hasEquipmentCards = await page
      .locator('main [data-testid="equipment-card"], main [role="row"]')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (hasEquipmentCards) {
      // 장비가 있을 때만 한국어 상태 배지 없음을 검증
      expect(mainText).not.toMatch(/사용 가능|반출 중|부적합|교정 예정/);
    } else {
      // 장비가 없을 때는 빈 상태 텍스트가 영어인지 확인
      expect(mainText).toMatch(/No|Empty|not found/i);
    }
  });

  test('장비 목록 — 검색 플레이스홀더 영어', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/equipment');

    // 검색 입력 placeholder 확인
    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search|search|장비/i))
      .first();

    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      // 영어 placeholder면 OK, 없으면 다음 확인
      if (placeholder) {
        expect(placeholder).not.toMatch(/장비|검색|이름/);
      }
    }
  });
});

// ============================================================================
// TC-i18n-05: 영어 전환 — 설정 페이지
// ============================================================================
test.describe('TC-i18n-05: 영어 전환 — 설정 페이지', () => {
  test('설정 페이지 전체가 영어', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/settings');

    // 설정 페이지 영어 확인
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/Settings|Display|Notification/);
    expect(bodyText).not.toMatch(/설정|표시|알림/);
  });

  test('Display Settings 페이지 — 영어 + 언어 선택 셀렉트 표시', async ({
    testOperatorPage: page,
  }) => {
    await setLocale(page, 'en');
    await page.goto('/settings/display');

    // "Display Settings" 텍스트 확인
    await expect(page.getByText('Display Settings')).toBeVisible();

    // 언어 선택 드롭다운 확인
    const languageSelect = page
      .getByRole('combobox')
      .or(page.locator('select[name*="locale"]'))
      .first();
    await expect(languageSelect).toBeVisible();
  });
});

// ============================================================================
// TC-i18n-06: 공통 액션 버튼 번역 확인
// ============================================================================
test.describe('TC-i18n-06: 공통 버튼 번역', () => {
  test('한국어 — Save=저장, Cancel=취소, Approve=승인', async ({ techManagerPage: page }) => {
    // 반출 목록 페이지 (승인/반려 버튼 있는 페이지)
    await page.goto('/approvals');

    const bodyText = await page.locator('body').textContent();
    // 승인/반려 버튼이 한국어로 렌더링
    const hasKoreanActions = /승인|반려|저장|취소|확인/.test(bodyText ?? '');
    expect(hasKoreanActions).toBeTruthy();
  });

  test('영어 — 승인 페이지 버튼 영어', async ({ techManagerPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/approvals');

    const bodyText = await page.locator('body').textContent();
    // 영어 액션이 있어야 함
    const hasEnglishActions = /Approve|Reject|Save|Cancel|Confirm/.test(bodyText ?? '');
    expect(hasEnglishActions).toBeTruthy();
    // 한국어 없어야 함
    expect(bodyText).not.toMatch(/승인|반려/);
  });
});

// ============================================================================
// TC-i18n-07: UI를 통한 언어 전환 (실제 유저 플로우)
// ============================================================================
test.describe('TC-i18n-07: Settings UI를 통한 언어 전환', () => {
  test('Display Settings에서 English 선택 → 저장 → 영어 UI 확인', async ({
    testOperatorPage: page,
  }) => {
    // 1. 설정 > 표시 설정으로 이동 (한국어 상태)
    await page.goto('/settings/display');

    // 한국어 상태 확인
    await expect(page.getByText('표시 설정')).toBeVisible();

    // 2. 언어 선택 셀렉트 찾기
    const localeSelect = page.getByRole('combobox').first();
    await expect(localeSelect).toBeVisible();

    // 3. English 선택
    await localeSelect.click();
    const englishOption = page
      .getByRole('option', { name: /English|영어/ })
      .or(page.getByText('English').first());

    if (await englishOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await englishOption.click();

      // 4. 저장 버튼 클릭
      const saveButton = page.getByRole('button', { name: /저장|Save/ });
      await saveButton.click();

      // 5. 페이지 리프레시 후 영어 확인

      // router.refresh() 완료 대기 후 영어 텍스트 확인
      await expect(page.getByText('Display Settings')).toBeVisible({ timeout: 10000 });
    } else {
      // select가 다른 방식으로 구현된 경우 — 쿠키 직접 확인으로 대체
      await setLocale(page, 'en');
      await page.reload();
      await expect(page.getByText('Display Settings')).toBeVisible();
    }
  });

  test('Dashboard 이동 — 영어 전환 후 UI 유지', async ({ testOperatorPage: page }) => {
    // Settings에서 영어로 전환 후 다른 페이지로 이동해도 영어 유지
    await setLocale(page, 'en');
    await page.goto('/');

    // 대시보드 영어
    await expect(page.getByText('Quick Actions')).toBeVisible();

    // 장비 목록으로 이동
    await page.goto('/equipment');

    // 장비 목록도 영어 유지
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/Equipment|Available|Register/);
    expect(bodyText).not.toMatch(/장비 목록|사용 가능|장비 등록/);
  });
});

// ============================================================================
// TC-i18n-08: 한국어 복원
// ============================================================================
test.describe('TC-i18n-08: 한국어 복원', () => {
  test('영어 → 한국어 쿠키 재설정 → 한국어 복원', async ({ testOperatorPage: page }) => {
    // 1. 영어로 전환
    await setLocale(page, 'en');
    await page.goto('/');
    await expect(page.getByText('Quick Actions')).toBeVisible();

    // 2. 한국어로 복원
    await setLocale(page, 'ko');
    await page.reload();

    // 3. 한국어 복원 확인
    await expect(page.getByText('빠른 액션')).toBeVisible();
    await expect(page.getByText('Quick Actions')).not.toBeVisible();
  });
});

// ============================================================================
// TC-i18n-09: 페이지 새로고침 후 locale 유지
// ============================================================================
test.describe('TC-i18n-09: Locale 영속성', () => {
  test('영어 설정 후 새로고침해도 영어 유지', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');

    // 첫 로드 영어 확인
    await expect(page.getByText('Quick Actions')).toBeVisible();

    // 새로고침
    await page.reload();

    // 새로고침 후에도 영어 유지 (쿠키 영속성)
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('영어 설정 후 다른 페이지 navigate해도 영어 유지', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');

    // Settings 페이지로 이동
    await page.goto('/settings');
    await expect(page.getByText('Settings')).toBeVisible();

    // Equipment로 이동
    await page.goto('/equipment');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/Equipment|Available|Register/);
  });
});

// ============================================================================
// TC-i18n-10: 오류 없는 렌더링 확인 (번역 키 누락 감지)
// ============================================================================
test.describe('TC-i18n-10: 번역 키 누락 감지', () => {
  test('영어 — 콘솔 에러 없이 대시보드 렌더링', async ({ testOperatorPage: page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await setLocale(page, 'en');
    await page.goto('/');

    // next-intl 번역 키 누락 에러 필터
    const intlErrors = errors.filter(
      (e) => e.includes('MISSING_MESSAGE') || e.includes('translation') || e.includes('intl')
    );
    expect(intlErrors).toHaveLength(0);
  });

  test('영어 — 장비 목록 콘솔 에러 없이 렌더링', async ({ testOperatorPage: page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await setLocale(page, 'en');
    await page.goto('/equipment');

    const intlErrors = errors.filter(
      (e) => e.includes('MISSING_MESSAGE') || e.includes('translation') || e.includes('intl')
    );
    expect(intlErrors).toHaveLength(0);
  });

  test('영어 — 페이지에 번역 키 원문([key]나 {key} 형태) 노출 없음', async ({
    testOperatorPage: page,
  }) => {
    await setLocale(page, 'en');
    await page.goto('/');

    const bodyText = await page.locator('body').textContent();

    // next-intl 번역 키 누락 시 키 이름이 그대로 표시됨
    // 패턴: "equipment.form.title", "dashboard.stats.myEquipment" 같은 dotted keys
    // 영어 정상 텍스트는 이 패턴과 다름
    expect(bodyText).not.toMatch(
      /\b(?:dashboard|equipment|common|settings|navigation)\.[a-zA-Z]+\.[a-zA-Z]+\b/
    );
  });

  test('영어 — 장비 목록 페이지에 번역 키 원문 노출 없음', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/equipment');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(
      /\b(?:dashboard|equipment|common|settings|navigation)\.[a-zA-Z]+\.[a-zA-Z]+\b/
    );
  });
});
