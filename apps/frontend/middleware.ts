/**
 * Next.js Middleware — 인증 가드 + 로케일 쿠키 동기화 (SSOT)
 *
 * cacheComponents: true 아키텍처에서 레이아웃의 await를 제거하기 위한 핵심 인프라.
 * 레이아웃에서 getServerSession()을 await하면 모든 하위 라우트의 정적 셸 프리렌더가 차단됨.
 * Middleware는 렌더링 전에 실행되므로 레이아웃을 non-blocking으로 유지하면서 인증을 보장.
 *
 * 실행 순서:
 * 1. Middleware (여기): 세션 토큰 존재 확인 → 없으면 /login 리다이렉트
 * 2. Layout (sync): DashboardShell 즉시 렌더 (await 없음)
 * 3. Page (async): Suspense 내에서 세션/데이터 fetch (blocking OK)
 *
 * 로케일 결정 우선순위:
 * 1순위: NEXT_LOCALE 쿠키 (사용자 명시적 선택 — settings 페이지에서 저장)
 * 2순위: JWT locale 클레임 (DB에 저장된 사용자 선호값)
 * 3순위: DEFAULT_LOCALE ('ko')
 *
 * 왜 쿠키 > JWT?
 * - DisplayPreferencesContent가 저장 후 setLocaleCookie()를 호출 → 쿠키가 최신 값
 * - test-login provider는 locale 클레임을 반환하지 않아 JWT = DEFAULT_LOCALE
 * - 쿠키 우선 시 E2E setLocale() 헬퍼와 실제 Settings UI 모두 정상 동작
 *
 * 보안:
 * - next-auth의 getToken()으로 JWT 유효성 검증 (쿠키 존재만이 아닌 서명 검증)
 * - 세션 만료/무효 → AuthSync(providers.tsx)에서 클라이언트 사이드 로그아웃 처리
 *
 * 에러 핸들링 (fail-closed):
 * - getToken() 예외 시 로그인 리다이렉트 (보수적 접근)
 * - error.tsx가 middleware 에러를 포착하지 못하므로 자체 방어 필수
 * - callbackUrl로 재로그인 후 원래 페이지 복귀 보장
 */
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@equipment-management/schemas';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // next-auth JWT 토큰 검증 (서명 확인 포함)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 인증되지 않은 사용자 → 로그인 리다이렉트
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 로케일 결정: NEXT_LOCALE 쿠키 → JWT locale → DEFAULT_LOCALE 폴백
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const tokenLocale = token.locale as string | undefined;
    const targetLocale =
      cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)
        ? cookieLocale
        : tokenLocale && (SUPPORTED_LOCALES as readonly string[]).includes(tokenLocale)
          ? tokenLocale
          : DEFAULT_LOCALE;

    // x-next-intl-locale 헤더를 request에 주입
    // → i18n/request.ts가 cookies() 없이 requestLocale 파라미터로 locale을 읽을 수 있음
    // → RootLayout에서 Dynamic API가 제거되어 PPR 정적 셸 블로킹 해소
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-intl-locale', targetLocale);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // 쿠키 동기화 유지 (클라이언트 사이드 locale 접근용)
    if (cookieLocale !== targetLocale) {
      response.cookies.set('NEXT_LOCALE', targetLocale, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    // Fail-closed: 인증 검증 실패 시 보수적으로 로그인 리다이렉트
    // 원인: NEXTAUTH_SECRET 미설정, 쿠키 파싱 오류, 네트워크 이슈 등
    console.error('[Middleware] Auth verification failed:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Middleware 적용 경로
 *
 * /(dashboard)/* 하위 모든 라우트를 보호.
 * 제외: /login, /api/*, /_next/*, /favicon.ico 등 (matcher에 포함되지 않음)
 */
export const config = {
  matcher: [
    // (dashboard) 그룹의 모든 라우트
    // Next.js route group은 URL에 나타나지 않으므로 실제 경로 패턴 매칭
    '/((?!login|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
