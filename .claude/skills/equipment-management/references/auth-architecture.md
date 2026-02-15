# 인증 아키텍처 가이드

## 개요

장비 관리 시스템은 **NextAuth.js를 단일 인증 소스(Single Source of Truth)**로 사용합니다.
localStorage 토큰과 NextAuth 쿠키의 불일치 문제를 방지하기 위해 모든 인증 토큰은 NextAuth 세션에서만 관리합니다.

## 핵심 원칙

### 1. 단일 인증 소스 (Single Source of Truth)

```
┌─────────────────────────────────────────────────────────────┐
│                     NextAuth 세션                            │
│              (httpOnly 쿠키에 JWT 저장)                      │
│                         │                                    │
│    ┌────────────────────┼────────────────────┐              │
│    ▼                    ▼                    ▼              │
│ Server Component   Client Component    API Client           │
│ getServerSession   useSession()        getSession()         │
└─────────────────────────────────────────────────────────────┘
```

### 2. localStorage 토큰 사용 금지

| 방식                             | 상태     | 이유                        |
| -------------------------------- | -------- | --------------------------- |
| `localStorage.getItem('token')`  | **금지** | NextAuth 세션과 동기화 불가 |
| `localStorage.setItem('token')`  | **금지** | 이중 인증 소스 발생         |
| `getSession().accessToken`       | **권장** | NextAuth 세션과 동기화      |
| `getServerSession().accessToken` | **권장** | 서버 사이드에서 안전        |

---

## 인증 플로우

### 로그인 플로우

```
1. 사용자가 /login 페이지에서 인증 정보 입력
2. NextAuth CredentialsProvider가 백엔드 /api/auth/login 호출
3. 백엔드가 JWT 토큰 반환
4. NextAuth가 토큰을 세션에 저장 (httpOnly 쿠키)
5. 클라이언트는 useSession() 또는 getSession()으로 세션 접근
```

### API 호출 플로우

```
1. apiClient 인터셉터가 getSession() 호출
2. 세션에서 accessToken 추출
3. Authorization 헤더에 Bearer 토큰 추가
4. 백엔드 API 호출
5. 401 에러 시 세션 재조회 후 재시도
```

### 로그아웃 플로우

```
1. useAuth().logout() 호출
2. clearTokenCache()로 API 클라이언트 캐시 초기화
3. signOut()으로 NextAuth 세션 종료
4. /login 페이지로 리다이렉트
```

---

## 코드 패턴

### Server Component에서 인증

```typescript
// app/equipment/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function EquipmentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // 서버에서 직접 API 호출 (권장)
  const response = await fetch(`${BACKEND_URL}/api/equipment`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  const equipment = await response.json();
  return <EquipmentList data={equipment} />;
}
```

### Client Component에서 인증

```typescript
// components/EquipmentForm.tsx
'use client'

import { useAuth } from '@/hooks/use-auth';

export function EquipmentForm() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <form>
      <p>사용자: {user?.name}</p>
      {/* ... */}
    </form>
  );
}
```

### API 클라이언트 사용

```typescript
// apiClient는 자동으로 NextAuth 세션에서 토큰을 가져옴
import { apiClient } from '@/lib/api/api-client';

// 올바른 패턴
const response = await apiClient.get('/api/equipment');

// 잘못된 패턴 (사용 금지)
// const token = localStorage.getItem('token');
// axios.get('/api/equipment', { headers: { Authorization: `Bearer ${token}` } });
```

### Server Action에서 인증

```typescript
// app/actions/equipment.ts
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createEquipment(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    throw new Error('인증이 필요합니다.');
  }

  const response = await fetch(`${BACKEND_URL}/api/equipment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Object.fromEntries(formData)),
  });

  if (!response.ok) {
    throw new Error('장비 생성 실패');
  }

  revalidatePath('/equipment');
}
```

---

## 파일 구조

```
apps/frontend/
├── lib/
│   ├── auth.ts                 # NextAuth 설정 (authOptions)
│   ├── auth/
│   │   └── auth-utils.ts       # 역할 확인 유틸리티
│   └── api/
│       └── api-client.ts       # Axios 클라이언트 (세션 토큰 자동 주입)
├── hooks/
│   └── use-auth.ts             # 인증 커스텀 훅
├── middleware.ts               # 라우트 보호 (getToken 사용)
└── types/
    └── next-auth.d.ts          # NextAuth 타입 확장
```

---

## 역할 확인 방법

### Client Component

```typescript
const { hasRole, isAdmin, isManager } = useAuth();

if (hasRole('technical_manager')) {
  // 기술책임자 이상 접근 가능
}
```

### Server Component

```typescript
import { hasRole } from '@/lib/auth/auth-utils';

const session = await getServerSession(authOptions);
if (hasRole(session?.user?.roles, 'lab_manager')) {
  // 시험소 관리자 이상 접근 가능
}
```

---

## Token Refresh 아키텍처 (Modern Pattern)

> **추가일**: 2026-02 | **패턴**: 보안과 UX 균형

### 설계 원칙

**문제**: Access Token이 너무 길면(1일) 탈취 시 위험, 너무 짧으면(5분) UX 저하

**해결**: Access Token 짧게(15분) + Refresh Token 길게(7일) → 보안과 UX 균형

### Token 구조

```typescript
// Access Token Payload
{
  userId: string,
  email: string,
  role: UserRole,
  site: string,
  teamId: string,
  type: 'access', // ← 토큰 타입
  iat: number,
  exp: number, // ← 15분 후
}

// Refresh Token Payload
{
  userId: string,
  type: 'refresh', // ← 타입 구분 중요!
  iat: number,
  exp: number, // ← 7일 후
  absoluteExpiry: number, // ← 절대 만료 (30일)
}
```

### 자동 갱신 로직

**파일**: `apps/frontend/app/api/auth/[...nextauth]/auth-config.ts`

```typescript
// JWT 콜백 - 매 세션 조회마다 실행
jwt: async ({ token, user, account }) => {
  // 초기 로그인
  if (account && user) {
    return {
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15분
      absoluteExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30일
      user,
    };
  }

  // 토큰 체크
  const now = Date.now();

  // 절대 만료 체크
  if (now > token.absoluteExpiry) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }

  // 60초 이내 만료 예정 → refresh
  const timeUntilExpiry = token.accessTokenExpires - now;
  if (timeUntilExpiry < 60 * 1000) {
    try {
      const newAccessToken = await refreshAccessToken(token.refreshToken);
      return {
        ...token,
        accessToken: newAccessToken,
        accessTokenExpires: Date.now() + 15 * 60 * 1000,
      };
    } catch {
      return { ...token, error: 'RefreshAccessTokenError' };
    }
  }

  return token;
};
```

### SessionProvider 설정

**파일**: `apps/frontend/app/providers.tsx`

```typescript
// ✅ 5분마다 JWT 콜백 트리거 (자동 갱신 체크)
<SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
  {children}
</SessionProvider>
```

### API 클라이언트 통합

**파일**: `apps/frontend/lib/api/api-client.ts`

```typescript
// ✅ 토큰 캐시 제거, 401 시 getSession() 재조회
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession(); // ← 매번 최신 세션 조회 (JWT 콜백 트리거)
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 401 → getSession() 재조회로 JWT 콜백 트리거
      const session = await getSession();
      if (session?.error === 'RefreshAccessTokenError') {
        // Refresh 실패 → 로그아웃
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 에러 전파

**파일**: `apps/frontend/components/auth/AuthSync.tsx`

```typescript
// AuthSync에서 RefreshAccessTokenError 감지 → 자동 signOut
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export function AuthSync() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      // Refresh 실패 → 자동 로그아웃
      signOut({ redirect: true, callbackUrl: '/login' });
    }
  }, [session]);

  return null;
}
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│  Access Token (15분)                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  0분      14분          15분 (만료)                    │    │
│  │  ├─────────┼──────────────┤                             │    │
│  │  │ 사용중  │ 60초 전 갱신 │                             │    │
│  │  │         ▼              ▼                             │    │
│  │  │    JWT 콜백 트리거 → refreshAccessToken() 호출      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Refresh Token (7일)                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  0일                                    7일 (만료)      │    │
│  │  ├─────────────────────────────────────┤               │    │
│  │  │  Access Token 갱신 가능               │               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  절대 만료 (30일)                                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  0일                                    30일 (만료)     │    │
│  │  ├─────────────────────────────────────┤               │    │
│  │  │  활동 여부 무관하게 재로그인 강제       │               │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 환경 변수

**파일**: `apps/backend/.env`

```bash
# JWT 시크릿 (필수)
JWT_SECRET=your-secret-key

# Refresh Token 시크릿 (선택, 미설정 시 JWT_SECRET + '_refresh' 폴백)
REFRESH_TOKEN_SECRET=your-refresh-secret-key

# Token 수명 (선택, 기본값 사용)
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ABSOLUTE_SESSION_MAX_AGE=30d
```

### 마이그레이션 호환성

```typescript
// JWT 콜백 내부 - 기존 세션 호환성 유지
jwt: async ({ token }) => {
  // accessTokenExpires가 없는 기존 세션
  if (!token.accessTokenExpires) {
    // 기존 동작 유지 (갱신 로직 스킵)
    return token;
  }

  // 새로운 세션 → 갱신 로직 적용
  // ...
};
```

### 체크리스트 (Token Refresh 구현 시)

- [ ] Access Token 수명: 15분 이하
- [ ] Refresh Token 수명: 7일 이상
- [ ] Refresh Token에 `type: 'refresh'` 클레임 추가
- [ ] JWT 콜백에서 만료 60초 전 자동 갱신
- [ ] SessionProvider `refetchInterval={5 * 60}` 설정
- [ ] 절대 만료 (30일) 구현
- [ ] `RefreshAccessTokenError` 에러 전파
- [ ] AuthSync에서 자동 signOut
- [ ] API 클라이언트 401 시 `getSession()` 재조회
- [ ] 환경 변수 `REFRESH_TOKEN_SECRET` 추가

---

## 트러블슈팅

### 문제: API 호출 시 401 에러

**원인**: 토큰 만료 또는 세션 불일치

**해결**:

1. 브라우저 개발자 도구에서 쿠키 확인 (`next-auth.session-token`)
2. `clearTokenCache()` 호출 후 재시도
3. 로그아웃 후 다시 로그인

### 문제: 세션은 있지만 API 호출 실패

**원인**: accessToken이 세션에 포함되지 않음

**해결**:
`lib/auth.ts`의 jwt/session 콜백 확인

```typescript
// lib/auth.ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.accessToken = user.accessToken; // 토큰 저장
    }
    return token;
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken; // 세션에 전달
    return session;
  },
}
```

### 문제: localStorage에 토큰이 남아있음

**원인**: 이전 코드에서 저장한 레거시 토큰

**해결**: `AuthSync` 컴포넌트가 자동으로 레거시 토큰 정리

---

## 체크리스트

새로운 인증 관련 코드 작성 시 확인:

- [ ] `localStorage.getItem('token')` 사용하지 않음
- [ ] `localStorage.setItem('token')` 사용하지 않음
- [ ] Server Component에서는 `getServerSession()` 사용
- [ ] Client Component에서는 `useSession()` 또는 `useAuth()` 사용
- [ ] API 호출은 `apiClient` 사용 (토큰 자동 주입)
- [ ] 역할 확인은 `hasRole()` 또는 `useAuth().hasRole()` 사용

---

## E2E 테스트

인증 토큰 동기화는 E2E 테스트로 검증됩니다:

**테스트 파일**: `apps/frontend/tests/e2e/auth-token-sync.spec.ts`

**테스트 항목**:

- localStorage에 토큰이 저장되지 않음
- NextAuth 세션 쿠키가 올바르게 설정/제거됨
- API 호출에 Authorization 헤더 포함
- 미인증 상태에서 보호된 페이지 접근 시 리다이렉트
- 세션 만료 시 로그인 페이지로 리다이렉트
- 다중 탭 동기화

**테스트 실행**:

```bash
cd apps/frontend
npx playwright test auth-token-sync.spec.ts
```
