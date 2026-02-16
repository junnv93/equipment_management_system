/**
 * Next.js Middleware — 인증 가드 (SSOT)
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

    return NextResponse.next();
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
