/**
 * 인증 관련 유틸리티 함수 및 설정
 *
 * NextAuth Best Practice:
 * - 모든 콜백에 적절한 타입 정의 사용
 * - 모듈 확장(types/next-auth.d.ts)과 일관성 유지
 * - any 타입 사용 금지
 *
 * Token Refresh 아키텍처:
 * - Access Token: 15분 (단기, 보안 강화)
 * - Refresh Token: 7일 (장기, Rotation 적용)
 * - JWT 콜백에서 만료 60초 전 자동 갱신
 * - SessionProvider refetchInterval(5분)로 주기적 JWT 콜백 트리거
 * - Absolute Max Lifetime: 30일 초과 시 활동 여부와 무관하게 재로그인 강제
 */

import NextAuth, { CredentialsSignin } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Profile, User, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';

/**
 * 백엔드 서버 연결 불가 시 사용하는 커스텀 인증 에러
 * signIn({ redirect: false }) 결과의 code 필드에 'server_unavailable'이 설정되어
 * 프론트엔드에서 "인증 실패"와 "서버 다운"을 구분할 수 있음
 */
class ServerUnavailableError extends CredentialsSignin {
  code = AUTH_ERROR_CODE.SERVER_UNAVAILABLE;
}
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { UserRoleValues as URVal } from '@equipment-management/schemas';

/**
 * Azure AD 프로필 확장 타입
 * Azure AD에서 반환하는 추가 필드 정의
 */
interface AzureADProfile extends Profile {
  roles?: string[];
  department?: string;
}

/**
 * 인증된 사용자 정보 (Credentials Provider 반환값)
 * authorize 함수에서 반환하는 사용자 객체 타입
 */
interface AuthorizedUser extends User {
  role: string;
  roles: string[];
  department?: string;
  site?: 'suwon' | 'uiwang' | 'pyeongtaek';
  teamId?: string;
  locale?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
}

import { DEFAULT_LOCALE, SITE_TO_LOCATION, type Site } from '@equipment-management/schemas';
import {
  ABSOLUTE_SESSION_MAX_AGE_SECONDS,
  AUTH_ERROR_CODE,
  REFRESH_BUFFER_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@equipment-management/shared-constants';
import { API_BASE_URL } from './config/api-config';
import { getInternalApiKeyHeaders } from './config/internal-headers';

// 환경 변수 확인
const isDevelopment = process.env.NODE_ENV === 'development';
const enableLocalAuth = process.env.ENABLE_LOCAL_AUTH === 'true' || isDevelopment;
const hasAzureAD = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

// 토큰 라이프사이클 상수는 @equipment-management/shared-constants/auth-token에서 import
// ABSOLUTE_SESSION_MAX_AGE_SECONDS, REFRESH_BUFFER_SECONDS, REFRESH_TOKEN_TTL_SECONDS

/**
 * Single-Flight 맵: 동일 refresh token에 대한 진행 중 Promise 공유
 *
 * 문제: 동시에 여러 요청이 만료 임박 토큰으로 getServerSession()을 호출하면
 * (예: 탭 2개 동시 오픈, 병렬 Server Component 렌더, Next.js 다중 인스턴스)
 * 각각 독립적으로 refreshAccessToken()을 호출하여 백엔드 rate limit(429) 유발
 *
 * 해결: 동일 refresh token에 대한 첫 번째 호출만 HTTP 요청을 실행하고
 * 동시에 들어온 나머지 호출은 해당 Promise를 공유(대기)하여 단일 HTTP 호출 보장
 *
 * cache()와의 역할 분리:
 * - React cache(): 단일 렌더 트리 내 getServerSession() 중복 호출 dedup
 * - refreshInFlight: 프로세스 레벨에서 동시 요청 간 refresh HTTP 호출 dedup
 */
const refreshInFlight = new Map<string, Promise<JWT>>();

/**
 * Refresh Token으로 새 Access Token 발급
 * 백엔드 /api/auth/refresh 엔드포인트 직접 호출
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshToken = token.refreshToken as string | undefined;

  // refresh token이 없으면 즉시 에러 반환 (in-flight 등록 불필요)
  if (!refreshToken) {
    return { ...token, error: AUTH_ERROR_CODE.REFRESH_TOKEN_EXPIRED };
  }

  // 동일 refresh token으로 진행 중인 요청이 있으면 해당 Promise 공유
  const inflight = refreshInFlight.get(refreshToken);
  if (inflight) {
    console.log('[Auth] Token refresh already in-flight, reusing:', token.email);
    return inflight;
  }

  const refreshPromise = (async (): Promise<JWT> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getInternalApiKeyHeaders() },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        // 401/403: refresh token이 실제로 만료/무효 → 재로그인 필요
        if (response.status === 401 || response.status === 403) {
          console.error('[Auth] Refresh token rejected by server:', response.status);
          return { ...token, error: AUTH_ERROR_CODE.REFRESH_TOKEN_EXPIRED };
        }
        // 5xx 등 서버 일시 장애 → 기존 토큰 유지, 다음 주기에 재시도
        console.warn('[Auth] Token refresh server error (retryable):', response.status);
        return token;
      }

      const data = await response.json();

      console.log('[Auth] Token refreshed successfully for:', token.email);

      return {
        ...token,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessTokenExpires: data.expires_at,
        error: undefined,
      };
    } catch (error) {
      // 네트워크 에러 (ECONNREFUSED 등): 백엔드 일시 다운
      // → 기존 토큰 유지, 다음 리프레시 주기(5분)에 재시도
      // → 세션을 파괴하지 않으므로 백엔드 복구 시 자동 복원
      console.warn('[Auth] Token refresh network error (backend may be down):', error);
      return token;
    } finally {
      // 성공/실패 관계없이 완료 시 맵에서 제거 (다음 refresh 주기 허용)
      refreshInFlight.delete(refreshToken);
    }
  })();

  refreshInFlight.set(refreshToken, refreshPromise);
  return refreshPromise;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    // Azure AD 로그인 (환경변수가 설정된 경우 우선 활성화)
    ...(hasAzureAD
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            ...(process.env.AZURE_AD_TENANT_ID && {
              issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
            }),
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
                  site: data.user.site,
                  teamId: data.user.teamId,
                  accessToken: data.access_token,
                  refreshToken: data.refresh_token,
                  accessTokenExpires: data.expires_at,
                };
              } catch (error) {
                console.error('[Auth] Login network error:', error);
                throw new ServerUnavailableError();
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
    // test-login provider는 항상 등록 — authorize 내부에서 런타임 환경 체크
    // Next.js가 빌드 시 process.env를 인라인하여 모듈 탑레벨 조건이 빌드타임에 고정되므로,
    // 런타임 환경변수(ENABLE_TEST_AUTH)는 authorize 함수 내부에서 체크해야 함
    CredentialsProvider({
      id: 'test-login',
      name: 'Test Login',
      credentials: {
        role: {
          label: 'Role',
          type: 'text',
          placeholder: 'test_engineer | technical_manager | lab_manager | system_admin',
        },
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'test.engineer@example.com (optional, overrides role)',
        },
      },
      async authorize(credentials) {
        // 런타임 환경 체크 — 백엔드도 별도로 NODE_ENV 가드가 있어 이중 보호
        const testAuthEnabled =
          process.env.ENABLE_TEST_AUTH === 'true' ||
          process.env.NODE_ENV === 'test' ||
          process.env.NODE_ENV === 'development';
        if (!testAuthEnabled) {
          console.error('[Test Auth] Test auth disabled in this environment');
          return null;
        }

        // email이 제공되면 email 우선, 아니면 role 사용
        const email = credentials?.email;
        const role = credentials?.role;

        if (!email && !role) {
          console.error('[Test Auth] Either email or role is required');
          return null;
        }

        try {
          // email이 있으면 email로, 없으면 role로 요청
          const params = new URLSearchParams();
          if (email) {
            params.set('email', email as string);
          } else if (role) {
            params.set('role', role as string);
          }

          const url = `${API_BASE_URL}/api/auth/test-login?${params.toString()}`;
          console.log('[Test Auth] Calling backend test-login:', url);

          // 백엔드 테스트 로그인 엔드포인트 호출
          const response = await fetch(url);

          if (!response.ok) {
            const text = await response.text();
            console.error('[Test Auth] Backend test-login failed:', response.status, text);
            console.error('[Test Auth] URL:', url);
            console.error('[Test Auth] API_BASE_URL:', API_BASE_URL);
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
            refreshToken: data.refresh_token,
            accessTokenExpires: data.expires_at,
          };
        } catch (error) {
          console.error('[Test Auth] Error during test login:', error);
          console.error('[Test Auth] API_BASE_URL:', API_BASE_URL);
          throw new ServerUnavailableError();
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: REFRESH_TOKEN_TTL_SECONDS, // Refresh Token 수명과 정렬 (@shared-constants)
  },
  callbacks: {
    /**
     * SignIn 콜백 - Provider별 분기 처리
     *
     * Provider 인식(provider-aware) 설계:
     * - credentials / test-login: 백엔드가 이미 DB에서 사용자를 검증했으므로
     *   추가 sync 불필요 → 즉시 승인
     * - azure-ad: AD에서 온 신규 사용자는 DB에 없을 수 있으므로
     *   POST /api/users/sync로 upsert 필요
     *
     * @param user - authorize에서 반환된 사용자 정보
     * @param account - OAuth 계정 정보 (provider 식별에 사용)
     * @param profile - OAuth 프로필 정보 (Azure AD 전용)
     * @returns 로그인 허용 여부 (true/false)
     */
    async signIn({ user, account, profile }): Promise<boolean> {
      // 사용자 정보가 없으면 차단
      if (!user?.email) {
        console.error('[SignIn] No user email provided');
        return false;
      }

      // credentials / test-login: 백엔드 DB에서 이미 검증됨 → sync 불필요
      if (account?.provider === 'credentials' || account?.provider === 'test-login') {
        return true;
      }

      // Azure AD: 신규 AD 사용자는 DB에 없을 수 있으므로 upsert 필요
      try {
        const azureProfile = profile as AzureADProfile | undefined;
        const authUser = user as AuthorizedUser;

        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role:
            authUser.role || (azureProfile?.roles && azureProfile.roles[0]) || URVal.TEST_ENGINEER,
          site: (authUser.site as Site | undefined) || 'suwon',
          location: SITE_TO_LOCATION[(authUser.site as Site | undefined) || 'suwon'],
          teamId: authUser.teamId,
          position: azureProfile?.department,
        };

        const internalApiKey = process.env.INTERNAL_API_KEY;
        if (!internalApiKey) {
          // Azure AD 환경에서 INTERNAL_API_KEY가 없으면 sync 불가 — 경고 후 로그인은 허용
          // (사용자가 DB에 이미 있을 경우 다음 로그인에서 복구)
          console.warn('[SignIn] INTERNAL_API_KEY not set — skipping Azure AD user sync');
          return true;
        }

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.SYNC}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Api-Key': internalApiKey,
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          // sync 실패해도 로그인은 허용 (가용성 우선, 이미 DB에 있는 사용자는 정상 접근)
          console.warn(`[SignIn] Azure AD user sync failed: ${response.status}`);
        } else {
          console.log(`[SignIn] Azure AD user synced: ${user.email}`);
        }

        return true;
      } catch (error) {
        console.error('[SignIn] Azure AD user sync error:', error);
        // 네트워크 오류 시에도 로그인 허용 (가용성 우선)
        return true;
      }
    },

    /**
     * JWT 콜백 - 토큰에 사용자 정보 저장 & 자동 갱신
     *
     * 초기 로그인: user + account 존재 → refreshToken, accessTokenExpires 저장
     * 후속 요청: 만료 60초 전 → refreshAccessToken() 호출
     * 마이그레이션: accessTokenExpires 없는 기존 세션 → 기존 동작 유지
     *
     * @param token - 기존 JWT 토큰
     * @param user - 최초 로그인 시 authorize에서 반환된 사용자 정보
     * @param account - OAuth 계정 정보 (provider, access_token 등)
     * @param profile - OAuth 프로필 정보 (Azure AD 등)
     */
    async jwt({ token, user, account, profile }): Promise<JWT> {
      // Azure AD 로그인 처리
      if (account?.provider === 'azure-ad') {
        if (user) {
          const azureProfile = profile as AzureADProfile | undefined;
          const authUser = user as AuthorizedUser;
          token.id = user.id;
          token.email = user.email ?? undefined;
          token.name = user.name ?? undefined;
          token.roles = azureProfile?.roles || ['USER'];
          token.role = token.roles[0] || 'USER';
          token.department = azureProfile?.department;
          token.site = authUser.site;
          token.teamId = authUser.teamId;
          token.accessToken = account.access_token ?? undefined;
          // Azure AD의 경우 refresh token은 별도 처리 (OAuth refresh)
          token.refreshToken = authUser.refreshToken;
          token.accessTokenExpires = authUser.accessTokenExpires;
          token.sessionStartedAt = Math.floor(Date.now() / 1000);
          token.locale = authUser.locale ?? DEFAULT_LOCALE;
        }
      }

      // 로컬 로그인 처리 (일반 Credentials + test-login Provider)
      if ((account?.provider === 'credentials' || account?.provider === 'test-login') && user) {
        const authUser = user as AuthorizedUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.roles = authUser.roles;
        token.department = authUser.department;
        token.site = authUser.site;
        token.teamId = authUser.teamId;
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.accessTokenExpires = authUser.accessTokenExpires;
        token.sessionStartedAt = Math.floor(Date.now() / 1000);
        token.locale = authUser.locale ?? DEFAULT_LOCALE;
      }

      // 절대 세션 만료 체크: 30일 초과 시 활동 여부와 무관하게 재로그인 강제
      if (token.sessionStartedAt) {
        const now = Math.floor(Date.now() / 1000);
        if (now - token.sessionStartedAt > ABSOLUTE_SESSION_MAX_AGE_SECONDS) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Absolute session lifetime exceeded (30d), forcing re-login', {
              email: token.email,
              sessionAgeDays: Math.floor((now - token.sessionStartedAt) / 86400),
            });
          }
          return { ...token, error: AUTH_ERROR_CODE.REFRESH_TOKEN_EXPIRED };
        }
      }

      // 후속 요청: 토큰 자동 갱신 체크
      // accessTokenExpires가 없는 기존 세션은 기존 동작 유지 (마이그레이션 호환)
      if (token.accessTokenExpires && token.refreshToken) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = token.accessTokenExpires - now;

        if (timeUntilExpiry < REFRESH_BUFFER_SECONDS) {
          console.log('[Auth] Access token expiring soon, refreshing...', {
            email: token.email,
            secondsLeft: timeUntilExpiry,
          });
          return refreshAccessToken(token);
        }
      }

      return token;
    },

    /**
     * Session 콜백 - 클라이언트에 전달할 세션 정보 구성
     *
     * @param session - 세션 객체
     * @param token - JWT 토큰 (strategy: 'jwt' 사용 시)
     */
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id ?? '';
        session.user.role = token.role ?? 'USER';
        session.user.roles = token.roles ?? ['USER'];
        session.user.department = token.department;
        session.user.site = token.site;
        session.user.teamId = token.teamId;
        session.user.locale = token.locale;
        session.accessToken = token.accessToken;
      }
      // error 전파 (RefreshAccessTokenError 등)
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
  // Auth.js v5는 AUTH_SECRET → NEXTAUTH_SECRET 순으로 자동 감지하므로 명시 불필요.
  // Next.js 빌드 시 process.env.NEXTAUTH_SECRET이 인라인될 수 있으므로 삭제.
});
