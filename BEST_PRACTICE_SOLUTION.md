# Best Practice: Authenticated API Client

## 문제

현재 `api-client.ts`는 axios interceptor에서 매 요청마다 `getSession()`을 호출합니다.

- `getSession()`은 `/api/auth/session`을 매번 fetch
- SessionProvider가 있는데도 context를 활용하지 못함
- 타이밍 이슈 발생 (초기화 전에 호출)

## Best Practice 해결책

### Option 1: React Context + useSession (★ 권장)

#### 1. Authenticated API Client Context 생성

```typescript
// lib/api/authenticated-client-provider.tsx
'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useSession } from 'next-auth/react';

const AuthenticatedClientContext = createContext<AxiosInstance | null>(null);

export function AuthenticatedClientProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // ✅ 세션이 변경될 때마다 axios 인스턴스 재생성
  const apiClient = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ✅ 세션이 있으면 모든 요청에 자동 포함
    if (session?.accessToken) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }

    return instance;
  }, [session?.accessToken]);

  return (
    <AuthenticatedClientContext.Provider value={apiClient}>
      {children}
    </AuthenticatedClientContext.Provider>
  );
}

export function useAuthenticatedClient() {
  const client = useContext(AuthenticatedClientContext);
  if (!client) {
    throw new Error('useAuthenticatedClient must be used within AuthenticatedClientProvider');
  }
  return client;
}
```

#### 2. Providers에 추가

```typescript
// lib/providers.tsx
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthenticatedClientProvider> {/* ✅ 추가 */}
            <AuthSync>{children}</AuthSync>
          </AuthenticatedClientProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

#### 3. API에서 사용

```typescript
// lib/api/approvals-api.ts
import { useAuthenticatedClient } from './authenticated-client-provider';

export function useApprovalsApi() {
  const client = useAuthenticatedClient();

  return {
    getPendingCounts: async (role?: UserRole) => {
      const response = await client.get<PendingCountsByCategory>(API_ENDPOINTS.APPROVALS.COUNTS);
      return response.data;
    },
    // ... 다른 메서드
  };
}
```

#### 4. Component에서 사용

```typescript
// components/approvals/ApprovalsClient.tsx
import { useApprovalsApi } from '@/lib/api/approvals-api';

export function ApprovalsClient({ userRole }: Props) {
  const approvalsApi = useApprovalsApi();

  const { data: pendingCounts } = useQuery({
    queryKey: ['approval-counts', userRole],
    queryFn: () => approvalsApi.getPendingCounts(userRole),
    // ✅ enabled 불필요! useSession이 준비되면 client도 준비됨
  });
}
```

---

### Option 2: TanStack Query 기본 헤더 설정

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export function createAuthenticatedQueryClient(accessToken: string) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const response = await fetch(`${API_URL}${queryKey[0]}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          return response.json();
        },
      },
    },
  });
}
```

---

## 현재 해결책 vs Best Practice 비교

| 항목            | 현재 (enabled)                  | Best Practice (Context)  |
| --------------- | ------------------------------- | ------------------------ |
| **근본 해결**   | ❌ 타이밍 우회                  | ✅ 아키텍처 개선         |
| **성능**        | ⚠️ 지연 발생                    | ✅ 최적화됨              |
| **유지보수**    | ⚠️ 모든 useQuery에 enabled 필요 | ✅ 한 번만 설정          |
| **타입 안전성** | ✅ 동일                         | ✅ 동일                  |
| **에러 처리**   | ⚠️ 세션 없으면 무한 대기        | ✅ Context 에러로 명확함 |
| **구현 난이도** | ✅ 쉬움                         | ⚠️ 리팩토링 필요         |

---

## 추천 로드맵

### 단기 (현재 유지)

```typescript
// ✅ 현재 해결책으로 일단 동작하게 함
enabled: isSessionReady;
```

### 중기 (Best Practice 적용)

```typescript
// ✅ Option 1 구현 (AuthenticatedClientProvider)
// - 전체 API를 점진적으로 마이그레이션
// - 레거시 api-client.ts는 병행 유지
```

### 장기 (성능 최적화)

```typescript
// ✅ React Query + Server Actions로 전환
// - Client Component API 호출 최소화
// - Server Component에서 데이터 prefetch
```

---

## 결론

**현재 해결책:**

- ✅ 빠르게 문제 해결
- ⚠️ 임시방편 (workaround)

**Best Practice 해결책:**

- ✅ 근본적인 아키텍처 개선
- ✅ 성능 및 유지보수성 향상
- ⚠️ 리팩토링 시간 필요 (2-3시간)

**추천:** 현재는 `enabled` 유지, 다음 스프린트에서 Option 1 적용
