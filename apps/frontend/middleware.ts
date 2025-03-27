import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 로그인이 필요하지 않은 경로
const publicPaths = ['/login', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 인증 검사 건너뛰기
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // JWT 토큰 확인
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // 관리자 전용 페이지에 대한 접근 제어
  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

// 미들웨어를 적용할 경로 패턴 지정
export const config = {
  matcher: [
    // 미들웨어를 적용할 경로
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 