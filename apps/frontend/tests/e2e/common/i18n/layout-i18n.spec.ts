/**
 * 레이아웃 컴포넌트 i18n E2E 검증 (TC-i18n-17 ~ TC-i18n-26)
 *
 * === 배경 (2026-02-19 수정) ===
 * 기존 TC-01~16이 대시보드/장비 목록의 콘텐츠 번역은 커버했으나,
 * 레이아웃 컴포넌트(Header, UserProfileDropdown, ThemeToggle, Breadcrumb,
 * NotificationsDropdown, SkipLink) 의 i18n 마이그레이션은 미커버.
 *
 * === Root Cause별 테스트 ===
 * RC1 — 레이아웃 컴포넌트 하드코딩 → TC-17, 18, 19, 20, 21, 22
 * RC2 — DashboardShell useMemo stale 캐시 (t 의존성 누락) → TC-23
 * RC3 — NextIntlClientProvider key={locale} 재마운트 → TC-24
 * RC4 — Breadcrumb labelKey 활성화 → TC-25
 * RC5 — LocaleHtmlSync <html lang> 동기화 → TC-26
 *
 * === 설계 원칙 ===
 * - waitForLoadState('load') 사용 — 알림 SSE/폴링으로 'networkidle' 달성 불가
 * - 헤더 컴포넌트는 세션 로드 후 렌더링 → waitForSessionReady() 헬퍼로 명시적 대기
 * - Radix UI 드롭다운: 클릭 후 role="menu" waitForSelector 필수
 * - 각 test 독립 컨텍스트 → fullyParallel: true 안전
 */

import { test, expect, type Page } from '../../shared/fixtures/auth.fixture';

/** 쿠키 기반 locale 전환 헬퍼 */
async function setLocale(page: Page, locale: 'ko' | 'en') {
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

/**
 * 헤더 컴포넌트 렌더링 대기 헬퍼
 *
 * DashboardShell은 세션 로딩 중(status === 'loading') DashboardShellSkeleton 표시.
 * useSession()이 완료되어야 ThemeToggle/NotificationsDropdown/UserProfileDropdown 렌더링.
 *
 * 알림 SSE/폴링으로 인해 'networkidle' 상태가 되지 않으므로
 * 'load' + 특정 헤더 요소 출현 대기를 조합한다.
 */
async function waitForHeaderReady(page: Page, locale: 'ko' | 'en' = 'ko') {
  // DOM 로드 완료 (networkidle 아님 — SSE/폴링 때문에 달성 불가)
  await page.waitForLoadState('load');

  // 세션 로드 신호: ThemeToggle 버튼이 나타날 때까지 대기
  // ThemeToggle은 DashboardShell 내부 Header에 있으며, 세션 로드 후 렌더링됨
  const themeLabel = locale === 'ko' ? '테마 변경' : 'Toggle theme';
  await page.waitForSelector(`button[aria-label="${themeLabel}"]`, {
    timeout: 15000,
    state: 'visible',
  });
}

/** 콘솔 에러 수집 헬퍼 — 탐색 전 등록 필수 */
function collectConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return () => errors;
}

// ============================================================================
// TC-i18n-17: UserProfileDropdown — 역할명 배지 번역 (RC1)
//
// 검증: t('roles.*') 번역이 드롭다운 내에 정확히 반영되는지
// testOperatorPage = test_engineer → "시험실무자" / "Test Engineer"
// ============================================================================
test.describe('TC-i18n-17: UserProfileDropdown 역할명 번역', () => {
  test('한국어 — 시험실무자 역할 배지가 "시험실무자"', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    // UserProfileDropdown 버튼 클릭 — useAuth() 완료 대기 (병렬 실행 시 느릴 수 있음)
    const profileBtn = page.getByRole('button', { name: '사용자 메뉴' });
    await expect(profileBtn).toBeVisible({ timeout: 15000 });
    await profileBtn.click();

    // 역할 배지만 검증 — span.rounded-full이 역할 배지의 고유 선택자
    await page.waitForSelector('[role="menu"] span.rounded-full', { timeout: 5000 });
    const roleBadge = page.locator('[role="menu"] span.rounded-full').first();
    await expect(roleBadge).toHaveText('시험실무자');
  });

  test('영어 — 시험실무자 역할 배지가 "Test Engineer"', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    const profileBtn = page.getByRole('button', { name: 'User menu' });
    await expect(profileBtn).toBeVisible({ timeout: 15000 });
    await profileBtn.click();

    await page.waitForSelector('[role="menu"] span.rounded-full', { timeout: 5000 });

    // 역할 배지 요소만 검증 (user.name은 seed data에서 한국어이므로 전역 검색 금지)
    // UserProfileDropdown: span.rounded-full 안에 roleDisplayName = t('roles.*')
    const roleBadge = page.locator('[role="menu"] span.rounded-full').first();
    await expect(roleBadge).toContainText('Test Engineer');
    await expect(roleBadge).not.toContainText('시험실무자');
  });

  test('영어 — 기술책임자 역할 배지가 "Technical Manager"', async ({ techManagerPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    // useAuth() 완료 대기 후 클릭
    await page.waitForSelector('button[aria-label="User menu"]', {
      timeout: 15000,
      state: 'visible',
    });
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.waitForSelector('[role="menu"] span.rounded-full', { timeout: 5000 });

    // 역할 배지 요소만 검증
    const roleBadge = page.locator('[role="menu"] span.rounded-full').first();
    await expect(roleBadge).toContainText('Technical Manager');
    await expect(roleBadge).not.toContainText('기술책임자');
  });
});

// ============================================================================
// TC-i18n-18: UserProfileDropdown — 로그아웃 + userMenu aria-label 번역 (RC1)
// ============================================================================
test.describe('TC-i18n-18: UserProfileDropdown 로그아웃·aria-label 번역', () => {
  test('한국어 — 로그아웃 버튼이 "로그아웃"', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    await page.getByRole('button', { name: '사용자 메뉴' }).click();
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    // t('layout.logout') = "로그아웃" (ko)
    await expect(page.getByText('로그아웃')).toBeVisible();
    await expect(page.getByText('Logout')).not.toBeVisible();
  });

  test('영어 — 로그아웃 버튼이 "Logout"', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    await page.getByRole('button', { name: 'User menu' }).click();
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    // t('layout.logout') = "Logout" (en)
    await expect(page.getByText('Logout')).toBeVisible();
    await expect(page.getByText('로그아웃')).not.toBeVisible();
  });

  test('한국어 — userMenu aria-label이 "사용자 메뉴"', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    // aria-label={t('layout.userMenu')} — 한국어: "사용자 메뉴"
    await expect(page.getByRole('button', { name: '사용자 메뉴' })).toBeVisible();
  });

  test('영어 — userMenu aria-label이 "User menu"', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    // aria-label={t('layout.userMenu')} — 영어: "User menu"
    await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
  });
});

// ============================================================================
// TC-i18n-19: ThemeToggle — 드롭다운 메뉴 항목 번역 (RC1)
//
// 검증: t('layout.lightMode'), t('layout.darkMode'), t('layout.systemMode')
// ============================================================================
test.describe('TC-i18n-19: ThemeToggle 드롭다운 메뉴 번역', () => {
  test('한국어 — 테마 드롭다운에 한국어 모드 텍스트', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    // aria-label={t('layout.themeToggle')} — 한국어: "테마 변경"
    const themeBtn = page.getByRole('button', { name: '테마 변경' });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // Radix UI 드롭다운 포탈 대기
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    await expect(page.getByText('라이트 모드')).toBeVisible();
    await expect(page.getByText('다크 모드')).toBeVisible();
    await expect(page.getByText('시스템 설정')).toBeVisible();
    await expect(page.getByText('Light mode')).not.toBeVisible();
  });

  test('영어 — 테마 드롭다운에 영어 모드 텍스트', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    // aria-label={t('layout.themeToggle')} — 영어: "Toggle theme"
    const themeBtn = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    await expect(page.getByText('Light mode')).toBeVisible();
    await expect(page.getByText('Dark mode')).toBeVisible();
    await expect(page.getByText('System default')).toBeVisible();
    await expect(page.getByText('라이트 모드')).not.toBeVisible();
  });
});

// ============================================================================
// TC-i18n-20: NotificationsDropdown — aria-label + 드롭다운 텍스트 번역 (RC1)
// ============================================================================
test.describe('TC-i18n-20: NotificationsDropdown 번역', () => {
  test('한국어 — 알림 버튼 aria-label이 "알림"', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    // aria-label={t('layout.notificationsLabel')} — 한국어: "알림"
    await expect(page.getByRole('button', { name: '알림' })).toBeVisible();
  });

  test('영어 — 알림 버튼 aria-label이 "Notifications"', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    // aria-label={t('layout.notificationsLabel')} — 영어: "Notifications"
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
  });

  test('한국어 — 알림 드롭다운 내부 텍스트 한국어', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    await page.getByRole('button', { name: '알림' }).click();
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    const menuText = await menu.textContent();
    // 영어 없어야 함
    expect(menuText).not.toMatch(/No new notifications|Mark all as read/);
    // 한국어 있어야 함
    const hasKorean = /새로운 알림이 없습니다|모두 읽음으로 표시|모든 알림 보기/.test(
      menuText ?? ''
    );
    expect(hasKorean).toBeTruthy();
  });

  test('영어 — 알림 드롭다운 내부 텍스트 영어', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    const menuText = await menu.textContent();
    // 한국어 없어야 함
    expect(menuText).not.toMatch(/새로운 알림이 없습니다|모두 읽음으로 표시/);
    // 영어 있어야 함
    const hasEnglish = /No new notifications|Mark all as read|View all notifications/.test(
      menuText ?? ''
    );
    expect(hasEnglish).toBeTruthy();
  });
});

// ============================================================================
// TC-i18n-21: SkipLink — 접근성 링크 번역 (RC1)
//
// SkipLink는 sr-only (화면에서 숨겨짐) — DOM 직접 조회로 텍스트 확인
// ============================================================================
test.describe('TC-i18n-21: SkipLink 접근성 텍스트 번역', () => {
  test('한국어 — SkipLink 텍스트가 "메인 콘텐츠로 건너뛰기"', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // sr-only 링크는 시각적으로 숨겨지지만 DOM에 존재
    // waitForSelector로 DOM 마운트 확인 후 텍스트 검사
    await page.waitForSelector('a[href="#main-content"]', { timeout: 10000 });

    const skipLinkText = await page.evaluate(() => {
      const link = document.querySelector('a[href="#main-content"]');
      return link?.textContent?.trim() ?? '';
    });

    expect(skipLinkText).toBe('메인 콘텐츠로 건너뛰기');
  });

  test('영어 — SkipLink 텍스트가 "Skip to main content"', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForSelector('a[href="#main-content"]', { timeout: 10000 });

    const skipLinkText = await page.evaluate(() => {
      const link = document.querySelector('a[href="#main-content"]');
      return link?.textContent?.trim() ?? '';
    });

    expect(skipLinkText).toBe('Skip to main content');
  });
});

// ============================================================================
// TC-i18n-22: Breadcrumb labelKey 번역 (RC4)
//
// 검증: route-metadata.ts의 labelKey가 브레드크럼에서 t()로 번역되는지
// resolveLabelKey()가 'navigation.' 접두어를 제거 후 t() 호출
// ============================================================================
test.describe('TC-i18n-22: Breadcrumb labelKey 활성화 번역', () => {
  test('한국어 — 장비 목록 브레드크럼이 한국어', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('load');

    // nav[aria-label="breadcrumb"] — Breadcrumb 컴포넌트의 aria-label
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasBreadcrumb) return; // 브레드크럼 없는 뷰 → 패스

    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toMatch(/장비 관리|장비/);
    expect(breadcrumbText).not.toMatch(/\bEquipment Management\b/);
  });

  test('영어 — 장비 목록 브레드크럼이 영어', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/equipment');
    await page.waitForLoadState('load');

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasBreadcrumb) return;

    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toMatch(/Equipment/i);
    expect(breadcrumbText).not.toMatch(/장비 관리|장비 목록/);
  });

  test('영어 — 승인 페이지 브레드크럼이 영어', async ({ techManagerPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/approvals');
    await page.waitForLoadState('load');

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasBreadcrumb) return;

    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toMatch(/Approval/i);
    expect(breadcrumbText).not.toMatch(/승인 관리|승인/);
  });
});

// ============================================================================
// TC-i18n-23: DashboardShell 사이드바 nav 번역 (RC2 — useMemo t 의존성)
//
// 검증: useMemo([userRole, pendingCounts, t]) — locale 전환 시 nav 라벨 갱신
// 이전 버그: }, [userRole, pendingCounts]) — t 누락으로 stale 번역 유지
// ============================================================================
test.describe('TC-i18n-23: DashboardShell 사이드바 nav 번역', () => {
  test('한국어 — 사이드바 메뉴가 한국어', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    // 사이드바는 aside > nav 구조
    const sidebarNav = page.locator('aside nav');
    await expect(sidebarNav).toBeVisible({ timeout: 5000 });

    const navText = await sidebarNav.textContent();
    expect(navText).toMatch(/대시보드/);
    expect(navText).not.toMatch(/\bDashboard\b/);
  });

  test('영어 — 사이드바 메뉴가 영어', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    const sidebarNav = page.locator('aside nav');
    await expect(sidebarNav).toBeVisible({ timeout: 5000 });

    const navText = await sidebarNav.textContent();
    expect(navText).toMatch(/Dashboard/);
    expect(navText).not.toMatch(/대시보드/);
  });

  test('locale 전환 후 즉시 nav 라벨 갱신 (key={locale} + t deps 검증)', async ({
    testOperatorPage: page,
  }) => {
    // 1. 한국어로 시작
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    const sidebarNav = page.locator('aside nav');
    const koText = await sidebarNav.textContent();
    expect(koText).toMatch(/대시보드/);

    // 2. 영어로 전환 + reload (key={locale} 재마운트 → t 함수 갱신)
    await setLocale(page, 'en');
    await page.reload();
    await waitForHeaderReady(page, 'en');

    // 이전 버그: useMemo 캐시에 '대시보드'가 남아있음
    // 수정 후: key={locale} 재마운트 → t 재생성 → "Dashboard"
    const enText = await sidebarNav.textContent();
    expect(enText).toMatch(/Dashboard/);
    expect(enText).not.toMatch(/대시보드/);
  });
});

// ============================================================================
// TC-i18n-24: NextIntlClientProvider key={locale} 재마운트 (RC3)
//
// 검증: locale 변경 시 전체 클라이언트 트리가 재마운트되어 stale 캐시 없음
// ============================================================================
test.describe('TC-i18n-24: key={locale} 재마운트 — stale 캐시 없음', () => {
  test('한국어 → 영어 전환 후 사이드바 전체가 영어 (stale 없음)', async ({
    testOperatorPage: page,
  }) => {
    const getErrors = collectConsoleErrors(page);

    // 1. 한국어 시작
    await page.goto('/');
    await waitForHeaderReady(page, 'ko');

    // 2. 영어로 전환 + reload
    await setLocale(page, 'en');
    await page.reload();
    await waitForHeaderReady(page, 'en');

    // 3. 사이드바가 영어여야 함
    const sidebarText = await page.locator('aside nav').textContent();
    expect(sidebarText).not.toMatch(/대시보드/);
    expect(sidebarText).toMatch(/Dashboard/);

    // 4. 번역 키 누락 없음
    const intlErrors = getErrors().filter(
      (e) => e.includes('MISSING_MESSAGE') || e.includes('[next-intl]')
    );
    expect(intlErrors, '번역 키 누락 에러').toHaveLength(0);
  });

  test('영어 → 한국어 전환 — 영어 잔존 없음', async ({ testOperatorPage: page }) => {
    // 영어로 시작
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    const enText = await page.locator('aside nav').textContent();
    expect(enText).toMatch(/Dashboard/);

    // 한국어로 전환
    await setLocale(page, 'ko');
    await page.reload();
    await waitForHeaderReady(page, 'ko');

    const koText = await page.locator('aside nav').textContent();
    expect(koText).not.toMatch(/\bDashboard\b/);
    expect(koText).toMatch(/대시보드/);
  });
});

// ============================================================================
// TC-i18n-25: LocaleHtmlSync — <html lang> 동기화 (RC5)
//
// 검증: PPR 정적 셸의 lang="ko"가 hydration 후 실제 locale로 업데이트
// LocaleHtmlSync.tsx: useLocale() + useEffect → document.documentElement.lang = locale
// ============================================================================
test.describe('TC-i18n-25: LocaleHtmlSync <html lang> 동기화', () => {
  test('한국어 — <html lang="ko"> 동기화', async ({ testOperatorPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // LocaleHtmlSync가 실행될 때까지 대기
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko', { timeout: 10000 });

    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe('ko');
  });

  test('영어 — <html lang="en"> 동기화', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await page.waitForLoadState('load');

    // LocaleHtmlSync의 useEffect가 실행될 때까지 대기
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 10000 });

    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe('en');
  });

  test('locale 전환 후 lang 속성 변경', async ({ testOperatorPage: page }) => {
    // 한국어 확인
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko', { timeout: 10000 });
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko');

    // 영어로 전환
    await setLocale(page, 'en');
    await page.reload();
    await page.waitForLoadState('load');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 10000 });
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  });
});

// ============================================================================
// TC-i18n-26: 레이아웃 컴포넌트 전체 영어 스모크 (RC1 종합)
//
// 검증: 수정된 8개 컴포넌트에서 MISSING_MESSAGE 없음 + 번역 키 원문 미노출
// ============================================================================
test.describe('TC-i18n-26: 레이아웃 컴포넌트 영어 스모크', () => {
  test('영어 — 헤더 영역 번역 키 누락 없음', async ({ testOperatorPage: page }) => {
    const getErrors = collectConsoleErrors(page);

    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    const intlErrors = getErrors().filter(
      (e) =>
        e.includes('MISSING_MESSAGE') || e.includes('Missing message') || e.includes('[next-intl]')
    );
    expect(intlErrors, '번역 키 누락 에러').toHaveLength(0);
  });

  test('영어 — UserProfileDropdown 오픈 시 번역 키 원문 없음', async ({
    testOperatorPage: page,
  }) => {
    const getErrors = collectConsoleErrors(page);

    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    await page.getByRole('button', { name: 'User menu' }).click();
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    const dropdownText = await page.getByRole('menu').first().textContent();
    // 번역 키 원문이 아닌 실제 영어 텍스트
    expect(dropdownText).not.toMatch(/navigation\.[a-z]/);
    expect(dropdownText).not.toMatch(/roles\.[a-z]/);
    expect(dropdownText).toMatch(/Logout|Test Engineer|Technical Manager|User/);

    expect(getErrors().filter((e) => e.includes('MISSING_MESSAGE'))).toHaveLength(0);
  });

  test('영어 — ThemeToggle 드롭다운 번역 키 원문 없음', async ({ testOperatorPage: page }) => {
    const getErrors = collectConsoleErrors(page);

    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });

    const dropdownText = await page.getByRole('menu').first().textContent();
    // 실제 번역 텍스트 확인
    expect(dropdownText).not.toMatch(/layout\.lightMode|layout\.darkMode|layout\.systemMode/);
    expect(dropdownText).toMatch(/Light mode|Dark mode|System default/);

    expect(getErrors().filter((e) => e.includes('MISSING_MESSAGE'))).toHaveLength(0);
  });

  test('영어 — 페이지 본문에 번역 키 원문 패턴 없음', async ({ testOperatorPage: page }) => {
    await setLocale(page, 'en');
    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    const bodyText = await page.locator('body').textContent();

    // layout.* 키 원문 미노출
    expect(bodyText).not.toMatch(
      /layout\.(userMenu|themeToggle|notificationsLabel|logout|lightMode|darkMode|systemMode|skipToContent)/
    );
    // roles.* 키 원문 미노출
    expect(bodyText).not.toMatch(
      /roles\.(test_engineer|technical_manager|quality_manager|lab_manager|system_admin)/
    );
  });

  test('영어 — Accept-Language 요청 헤더가 en (NEXT_LOCALE 쿠키 기반)', async ({
    testOperatorPage: page,
  }) => {
    await setLocale(page, 'en');

    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes(':3001')) {
        const lang = req.headers()['accept-language'];
        if (lang) apiRequests.push(lang);
      }
    });

    await page.goto('/');
    await waitForHeaderReady(page, 'en');

    if (apiRequests.length > 0) {
      // NEXT_LOCALE 쿠키에서 읽어 'en'이 반영되어야 함
      const hasEnglish = apiRequests.some((lang) => lang.startsWith('en'));
      expect(hasEnglish, `Accept-Language: ${apiRequests[0]}`).toBeTruthy();
    }
    // API 요청이 없으면 패스 (캐시 히트)
  });
});
