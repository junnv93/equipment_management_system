# 인증 아키텍처 가이드

## 개요

이 프로젝트는 **NextAuth.js를 단일 인증 소스(Single Source of Truth)**로 사용합니다.
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
├── proxy.ts                    # 라우트 보호 (getToken 사용)
└── types/
    └── next-auth.d.ts          # NextAuth 타입 확장
```

## 역할 기반 접근 제어

### 역할 체계

> **참고**: 역할 코드는 `packages/schemas/src/enums.ts`의 `UserRoleEnum`을 Single Source of Truth로 사용

| 역할 코드           | 설명          | 권한 레벨 |
| ------------------- | ------------- | --------- |
| `test_operator`     | 시험실무자    | 1         |
| `technical_manager` | 기술책임자    | 2         |
| `site_admin`        | 시험소 관리자 | 3         |
| `system_admin`      | 시스템 관리자 | 4         |

### 역할별 권한

- **test_operator (시험실무자)**: 장비 등록/수정 요청, 대여/반출 신청, 교정 등록 (승인 필요)
- **technical_manager (기술책임자)**: 요청 승인/반려, 교정 직접 등록 (Comment 필수), 팀 내 관리
- **site_admin (시험소 관리자)**: 교정계획서 승인, 해당 시험소 전체 관리, 자체 승인 불가
- **system_admin (시스템 관리자)**: 전체 시스템 관리, 모든 시험소 접근, 자체 승인 가능

### 역할 확인 방법

```typescript
// Client Component
const { hasRole, isAdmin, isManager } = useAuth();

if (hasRole('technical_manager')) {
  // 기술책임자 이상 접근 가능
}

// Server Component
import { hasRole } from '@/lib/auth/auth-utils';

const session = await getServerSession(authOptions);
if (hasRole(session?.user?.roles, 'site_admin')) {
  // 시험소 관리자 이상 접근 가능
}
```

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

1. `lib/auth.ts`의 jwt/session 콜백 확인
2. accessToken이 올바르게 전달되는지 확인

```typescript
// lib/auth.ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.accessToken = user.accessToken; // ✅ 토큰 저장
    }
    return token;
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken; // ✅ 세션에 전달
    return session;
  },
}
```

### 문제: localStorage에 토큰이 남아있음

**원인**: 이전 코드에서 저장한 레거시 토큰

**해결**: 브라우저 localStorage 수동 삭제 또는 마이그레이션 코드 추가

```typescript
// 일회성 마이그레이션 (providers.tsx에 추가 가능)
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  console.warn('[Auth] 레거시 localStorage 토큰 발견. 삭제합니다.');
  localStorage.removeItem('token');
}
```

## 체크리스트

새로운 인증 관련 코드 작성 시 확인:

- [ ] `localStorage.getItem('token')` 사용하지 않음
- [ ] `localStorage.setItem('token')` 사용하지 않음
- [ ] Server Component에서는 `getServerSession()` 사용
- [ ] Client Component에서는 `useSession()` 또는 `useAuth()` 사용
- [ ] API 호출은 `apiClient` 사용 (토큰 자동 주입)
- [ ] 역할 확인은 `hasRole()` 또는 `useAuth().hasRole()` 사용

## 관련 파일

- `apps/frontend/lib/auth.ts` - NextAuth 설정
- `apps/frontend/lib/api/api-client.ts` - API 클라이언트
- `apps/frontend/hooks/use-auth.ts` - 인증 훅
- `apps/frontend/proxy.ts` - 라우트 보호
- `apps/frontend/types/next-auth.d.ts` - 타입 정의
