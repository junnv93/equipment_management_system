/**
 * Next.js 16 Proxy (구 Middleware)
 *
 * Best Practice:
 * 1. Proxy는 가볍게 유지 - 무거운 인증 로직 금지
 * 2. 쿠키 존재 여부만 낙관적으로 체크 (optimistic check)
 * 3. 실제 세션 검증은 Server Components에서 getServerSession()으로 수행
 *
 * 참고: /equipment-management 스킬 - references/auth-architecture.md
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요 없는 공개 경로
const PUBLIC_PATHS = ['/login', '/error', '/api/auth', '/api/monitoring'];

// 정적 파일 패턴
const STATIC_FILE_PATTERNS = ['/_next/', '/favicon.ico', '.'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 공개 경로는 통과
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. 정적 파일은 통과
  if (STATIC_FILE_PATTERNS.some((pattern) => pathname.includes(pattern))) {
    return NextResponse.next();
  }

  // 3. 낙관적 인증 체크: NextAuth 세션 쿠키 존재 여부만 확인
  //    (실제 세션 유효성은 Server Component에서 검증)
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    // 세션 쿠키가 없으면 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. 세션 쿠키가 있으면 통과 (세션 유효성은 Server Component에서 검증)
  return NextResponse.next();
}

// Proxy 적용 경로 설정
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 적용:
     * - api/auth (NextAuth API)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 파일 확장자가 있는 경로 (정적 자원)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
