/**
 * Next.js Proxy — 인증 가드 + 로케일 쿠키 동기화 (SSOT)
 *
 * cacheComponents: true 아키텍처에서 레이아웃의 await를 제거하기 위한 핵심 인프라.
 * 레이아웃에서 getServerSession()을 await하면 모든 하위 라우트의 정적 셸 프리렌더가 차단됨.
 * Proxy는 렌더링 전에 실행되므로 레이아웃을 non-blocking으로 유지하면서 인증을 보장.
 *
 * 실행 순서:
 * 1. Proxy (여기): 세션 토큰 존재 확인 → 없으면 /login 리다이렉트
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
 * - error.tsx가 proxy 에러를 포착하지 못하므로 자체 방어 필수
 * - callbackUrl로 재로그인 후 원래 페이지 복귀 보장
 */
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@equipment-management/schemas';

/**
 * Per-request CSP nonce 생성 + strict-dynamic 정책 주입 (업계 표준 nonce-based CSP).
 *
 * 참고: Next.js 공식 가이드 — https://nextjs.org/docs/app/guides/content-security-policy
 *
 * 동작:
 * 1. 매 요청마다 crypto.randomUUID() → base64 nonce 생성
 * 2. CSP 헤더의 `script-src 'nonce-XXX' 'strict-dynamic'` → 이 nonce를 가진 스크립트만 실행
 * 3. Next.js SSR이 request 헤더의 CSP를 자동 파싱해 `<script>`/`<style>` 태그에 nonce 주입
 * 4. `x-nonce`를 request 헤더에 주입해 Server Component가 `headers()` 로 조회 가능
 *
 * 보안 모델:
 * - 'strict-dynamic' — nonce가 부착된 스크립트가 로드하는 child script도 자동 신뢰 (transitive)
 * - 'unsafe-inline' 의존 제거 — XSS 주입 시 nonce 없으면 실행 차단
 * - dev 전용 'unsafe-eval' — HMR/Turbopack eval 허용 (prod 제외)
 */
function buildCspHeader(nonce: string, isDev: boolean, reportEndpointPath: string): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // 주의: next/font + Tailwind는 런타임 inline style을 거의 생성하지 않지만,
    //       3rd-party 컴포넌트 회귀 최소화를 위해 nonce + 'unsafe-inline' 병기.
    //       'nonce' 존재 시 브라우저는 nonce 없는 inline을 차단하는 CSP3 브라우저에서만
    //       'unsafe-inline'이 무시됨 → defense-in-depth.
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `media-src 'self' blob: mediastream:`, // QR scanner MediaStream + blob PDF/QR
    isDev ? `connect-src 'self' ws: wss: http://localhost:*` : `connect-src 'self'`,
    `worker-src 'self' blob:`, // PWA SW + future pdf.js worker
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    // CSP violation 수집 (P1-B 엔드포인트)
    `report-uri ${reportEndpointPath}`,
    `report-to csp-endpoint`,
  ];
  if (!isDev) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // next-auth JWT 토큰 검증 (서명 확인 포함)
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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

    // CSP per-request nonce (Next.js 16 공식 패턴)
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const isDev = process.env.NODE_ENV === 'development';
    const cspHeader = buildCspHeader(nonce, isDev, '/api/security/csp-report');

    // x-next-intl-locale 헤더를 request에 주입
    // → i18n/request.ts가 cookies() 없이 requestLocale 파라미터로 locale을 읽을 수 있음
    // → RootLayout에서 Dynamic API가 제거되어 PPR 정적 셸 블로킹 해소
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-intl-locale', targetLocale);
    requestHeaders.set('x-nonce', nonce);
    // Next.js SSR이 이 헤더를 읽어 framework script/style에 자동으로 nonce 주입
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // 브라우저가 실행할 CSP는 response 헤더
    response.headers.set('Content-Security-Policy', cspHeader);
    // Report-To: report-to directive 보조 (레거시 report-uri와 병행)
    response.headers.set(
      'Report-To',
      JSON.stringify({
        group: 'csp-endpoint',
        max_age: 10886400,
        endpoints: [{ url: '/api/security/csp-report' }],
        include_subdomains: true,
      })
    );

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
    console.error('[Proxy] Auth verification failed:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Proxy 적용 경로
 *
 * /(dashboard)/* 하위 모든 라우트를 보호.
 * 제외: /login, /api/*, /_next/*, /favicon.ico 등 (matcher에 포함되지 않음)
 */
export const config = {
  matcher: [
    // (dashboard) 그룹의 모든 라우트
    // Next.js route group은 URL에 나타나지 않으므로 실제 경로 패턴 매칭
    '/((?!login|api|_next/static|_next/image|images|favicon.ico).*)',
  ],
};
