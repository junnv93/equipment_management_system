/**
 * 인증 관련 유틸리티 함수 및 설정
 */

import { getSession } from 'next-auth/react';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';

// 백엔드 API 베이스 URL (호스트만 포함, /api는 각 엔드포인트에서 지정)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 환경 변수 확인
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const enableLocalAuth = process.env.ENABLE_LOCAL_AUTH === 'true' || isDevelopment;
const hasAzureAD = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

/**
 * NextAuth 설정 옵션
 * 서버 사이드에서 사용하기 위해 export
 */
export const authOptions = {
  providers: [
    // Azure AD 로그인 (환경변수가 설정된 경우 우선 활성화)
    ...(hasAzureAD
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
              params: {
                scope: 'openid profile email offline_access User.Read',
              },
            },
          }),
        ]
      : []),

    // 이메일/비밀번호 로그인 - 개발 환경에서만 활성화
    ...(enableLocalAuth
      ? [
          CredentialsProvider({
            name: 'Credentials',
            credentials: {
              email: { label: '이메일', type: 'email' },
              password: { label: '비밀번호', type: 'password' },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              try {
                // 백엔드 인증 API 호출
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                  }),
                });

                if (!response.ok) {
                  return null;
                }

                const data = await response.json();

                // 백엔드에서 받은 사용자 정보 반환
                return {
                  id: data.user.id,
                  name: data.user.name,
                  email: data.user.email,
                  role: data.user.roles?.[0] || 'USER',
                  roles: data.user.roles || ['USER'],
                  department: data.user.department,
                  accessToken: data.access_token,
                };
              } catch (error) {
                console.error('인증 오류:', error);
                return null;
              }
            },
          }),
        ]
      : []),

    /**
     * E2E 테스트 전용 Provider
     *
     * ⚠️ 중요: E2E 테스트에서 인증을 처리하는 올바른 방법
     *
     * 문제: 백엔드 JWT를 직접 쿠키에 저장하면 NextAuth가 인식하지 못함
     * - NextAuth는 자체 세션 토큰(next-auth.session-token)을 사용
     * - 직접 저장한 쿠키(auth-token)는 NextAuth 인증 플로우를 우회
     * - Middleware, Server Components가 인증 실패로 판단
     *
     * 해결: NextAuth의 정상적인 인증 플로우 사용
     * - CredentialsProvider를 통해 백엔드 test-login 호출
     * - NextAuth가 세션 생성 및 쿠키 관리
     * - 모든 Next.js 컴포넌트에서 세션 인식
     *
     * 아키텍처 원칙:
     * - NextAuth = 단일 인증 소스 (Single Source of Truth)
     * - localStorage 토큰 사용 금지
     * - 모든 인증은 NextAuth 세션을 통해서만 처리
     *
     * 참고: /equipment-management 스킬 - references/auth-architecture.md
     */
    ...(isTest || isDevelopment
      ? [
          CredentialsProvider({
            id: 'test-login',
            name: 'Test Login',
            credentials: {
              role: {
                label: 'Role',
                type: 'text',
                placeholder: 'test_engineer | technical_manager | lab_manager | system_admin'
              },
            },
            async authorize(credentials) {
              if (!credentials?.role) {
                console.error('[Test Auth] Role is required');
                return null;
              }

              try {
                // 백엔드 테스트 로그인 엔드포인트 호출
                const response = await fetch(
                  `${API_BASE_URL}/api/auth/test-login?role=${credentials.role}`
                );

                if (!response.ok) {
                  const text = await response.text();
                  console.error('[Test Auth] Backend test-login failed:', response.status, text);
                  return null;
                }

                const data = await response.json();

                // NextAuth 세션에 저장할 사용자 정보 반환
                // 이 정보는 jwt 콜백에서 token에 저장되고, session 콜백에서 session에 전달됨
                // 백엔드는 roles 배열을 반환하므로 roles[0]으로 role 설정
                const userRole = data.user.roles?.[0] || data.user.role || 'user';
                return {
                  id: data.user.id || data.user.uuid,
                  name: data.user.name,
                  email: data.user.email,
                  role: userRole,
                  roles: data.user.roles || [userRole],
                  department: data.user.department,
                  site: data.user.site,
                  teamId: data.user.teamId,
                  accessToken: data.access_token,
                };
              } catch (error) {
                console.error('[Test Auth] Error during test login:', error);
                return null;
              }
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account, profile }: any) {
      // Azure AD 로그인 처리
      if (account?.provider === 'azure-ad') {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.roles = (profile as any)?.roles || ['USER'];
          token.role = token.roles[0] || 'USER';
          token.department = (profile as any)?.department;
          token.accessToken = account.access_token;
        }
      }

      // 로컬 로그인 처리 (일반 Credentials + test-login Provider)
      if ((account?.provider === 'credentials' || account?.provider === 'test-login') && user) {
        token.id = user.id;
        token.role = user.role;
        token.roles = user.roles;
        token.department = user.department;
        token.site = (user as any).site;
        token.teamId = (user as any).teamId;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.department = token.department as string | undefined;
        session.user.site = token.site as string | undefined;
        session.user.teamId = token.teamId as string | undefined;
        (session as any).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  // NEXTAUTH_SECRET은 JWT 서명/검증에 필수
  // 반드시 .env.local에 설정해야 함 (하드코딩 금지)
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * 클라이언트 사이드에서 현재 사용자의 세션 정보 가져오기
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * 사용자 역할 확인
 */
export function hasRole(userRoles: string[] | undefined, requiredRole: string): boolean {
  if (!userRoles) return false;
  return userRoles.includes(requiredRole) || userRoles.includes(requiredRole.toUpperCase());
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, 'ADMIN') || hasRole(userRoles, 'admin');
}

/**
 * 매니저 권한 확인
 */
export function isManager(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, 'MANAGER') || hasRole(userRoles, 'manager') || isAdmin(userRoles);
}
