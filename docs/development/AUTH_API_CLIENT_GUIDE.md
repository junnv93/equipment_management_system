# 인증 API 클라이언트 완벽 가이드

**작성일**: 2026-01-22
**작성자**: Claude Sonnet 4.5
**버전**: 2.0.0

---

## 개요

이 문서는 Next.js 16 App Router 환경에서 Server Components와 Client Components에서 올바르게 인증된 API 호출을 수행하는 방법을 설명합니다.

**핵심 원칙**: NextAuth를 "단일 인증 소스(Single Source of Truth)"로 사용하여 Server/Client 컨텍스트에 맞는 API 클라이언트를 사용합니다.

---

## 문제 상황

### ❌ 이전 아키텍처의 문제점

```typescript
// ❌ 문제: api-client.ts가 getSession()을 사용
// getSession()은 Client Component에서만 동작
import { getSession } from 'next-auth/react'; // Client-side only!

export const apiClient = axios.create({...});

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession(); // Server Component에서 null 반환!
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});
```

```typescript
// ❌ 문제: Server Component에서 Client-only API 사용
// app/equipment/[id]/page.tsx (Server Component)
import equipmentApi from '@/lib/api/equipment-api'; // Client API!

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  const equipment = await equipmentApi.getEquipment(id); // ❌ 401 에러!
  return <div>{equipment.name}</div>;
}
```

**왜 실패하는가?**

1. `getSession()`은 React Context를 사용하므로 Server Component에서 동작하지 않음
2. Server Component는 브라우저 Context가 없으므로 Client-side session에 접근 불가
3. 결과: 토큰이 없음 → 401 Unauthorized 에러

---

## 해결 방법

### ✅ 새로운 아키텍처: 컨텍스트별 API 클라이언트

```
┌─────────────────────────────────────────────────────────┐
│                   NextAuth Session                      │
│         (Single Source of Truth - SSOT)                │
└─────────────────────────────────────────────────────────┘
              │                            │
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ Server Component │        │ Client Component │
    │                  │        │                  │
    │ getServerSession │        │   getSession()   │
    │      ↓           │        │       ↓          │
    │ server-api-      │        │   api-client.ts  │
    │   client.ts      │        │                  │
    │      ↓           │        │       ↓          │
    │ equipment-api-   │        │ equipment-api.ts │
    │   server.ts      │        │                  │
    └──────────────────┘        └──────────────────┘
```

---

## 파일 구조

```
apps/frontend/lib/api/
├── server-api-client.ts          # ✅ Server Component 전용 API 클라이언트
├── equipment-api-server.ts       # ✅ Server Component 전용 Equipment API
├── api-client.ts                 # ✅ Client Component 전용 API 클라이언트
├── equipment-api.ts              # ✅ Client Component 전용 Equipment API
└── utils/
    └── response-transformers.ts  # 공통 응답 변환 유틸리티
```

---

## 사용 방법

### 1. Server Component에서 API 호출

```typescript
// app/equipment/[id]/page.tsx
import * as equipmentApiServer from '@/lib/api/equipment-api-server';

// Next.js 16 PageProps 타입
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EquipmentDetailPage(props: PageProps) {
  // ✅ Next.js 16: params는 Promise
  const { id } = await props.params;

  // ✅ Server Component에서 직접 데이터 fetching
  // ✅ getServerSession()이 자동으로 호출되어 인증 토큰 주입
  const equipment = await equipmentApiServer.getEquipment(id);

  return <EquipmentDetailClient equipment={equipment} />;
}
```

**장점**:
- ✅ Server-side 렌더링으로 초기 로딩 빠름
- ✅ SEO 친화적 (검색 엔진이 데이터 볼 수 있음)
- ✅ NextAuth 세션에서 안전하게 토큰 가져옴
- ✅ Client-side JavaScript 번들 크기 감소

### 2. Client Component에서 API 호출

```typescript
// components/EquipmentList.tsx
'use client';

import { useEffect, useState } from 'react';
import equipmentApi from '@/lib/api/equipment-api'; // Client API

export function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEquipment() {
      try {
        // ✅ Client Component에서 API 호출
        // ✅ getSession()이 자동으로 호출되어 인증 토큰 주입
        const data = await equipmentApi.getEquipmentList();
        setEquipment(data.items);
      } catch (error) {
        console.error('Failed to load equipment:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEquipment();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {equipment.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

**장점**:
- ✅ 실시간 데이터 업데이트
- ✅ 사용자 인터랙션에 반응
- ✅ React Query와 함께 사용 가능
- ✅ Optimistic updates 구현 가능

### 3. Server Component에서 직접 fetch 사용

```typescript
// app/equipment/page.tsx
import { getServerAuthHeaders } from '@/lib/api/server-api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function EquipmentListPage() {
  // ✅ Server-side에서 인증 헤더 가져오기
  const headers = await getServerAuthHeaders();

  // ✅ Native fetch 사용
  const response = await fetch(`${API_BASE_URL}/api/equipment`, {
    headers,
    cache: 'no-store', // 항상 최신 데이터
  });

  if (!response.ok) {
    throw new Error('Failed to fetch equipment');
  }

  const data = await response.json();

  return <EquipmentTable equipment={data.items} />;
}
```

**사용 시나리오**:
- fetch 옵션 (cache, next.revalidate 등)을 직접 제어하고 싶을 때
- 간단한 GET 요청
- Axios 의존성을 피하고 싶을 때

### 4. Server Action에서 API 호출

```typescript
// app/actions/equipment.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerApiClient } from '@/lib/api/server-api-client';

export async function updateEquipmentStatus(
  equipmentId: string,
  status: string
) {
  try {
    // ✅ Server Action에서 API 클라이언트 사용
    const apiClient = await createServerApiClient();

    await apiClient.patch(`/api/equipment/${equipmentId}/status`, {
      status,
    });

    // ✅ 캐시 갱신
    revalidatePath(`/equipment/${equipmentId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
```

```typescript
// components/EquipmentStatusForm.tsx
'use client';

import { useActionState } from 'react';
import { updateEquipmentStatus } from '@/app/actions/equipment';

export function EquipmentStatusForm({ equipmentId }: { equipmentId: string }) {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const status = formData.get('status') as string;
      return updateEquipmentStatus(equipmentId, status);
    },
    null
  );

  return (
    <form action={action}>
      <select name="status">
        <option value="operational">정상</option>
        <option value="maintenance">점검 중</option>
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

**장점**:
- ✅ Progressive Enhancement (JavaScript 없이도 동작)
- ✅ Next.js 16의 최신 패턴
- ✅ 자동 revalidation
- ✅ TypeScript 타입 안정성

---

## API 클라이언트 선택 가이드

| 컨텍스트 | 사용할 API 클라이언트 | Import 경로 |
|---------|---------------------|------------|
| Server Component | `equipment-api-server.ts` | `@/lib/api/equipment-api-server` |
| Client Component | `equipment-api.ts` | `@/lib/api/equipment-api` |
| Server Action | `server-api-client.ts` | `@/lib/api/server-api-client` |
| generateMetadata | `equipment-api-server.ts` | `@/lib/api/equipment-api-server` |

### 간단한 판별법

```typescript
// ✅ 파일 최상단에 'use client'가 없음 → Server Component
export default async function Page() {
  const data = await equipmentApiServer.getEquipment(id); // ✅
}

// ✅ 파일 최상단에 'use client'가 있음 → Client Component
'use client';
export default function Page() {
  const { data } = useQuery(() => equipmentApi.getEquipment(id)); // ✅
}

// ✅ 파일 최상단에 'use server'가 있음 → Server Action
'use server';
export async function myAction() {
  const apiClient = await createServerApiClient(); // ✅
}
```

---

## Next.js 16 패턴

### ✅ 올바른 패턴

```typescript
// ✅ Server Component + Server API
import * as equipmentApiServer from '@/lib/api/equipment-api-server';

type PageProps = {
  params: Promise<{ id: string }>; // ✅ Promise 타입
};

export default async function Page(props: PageProps) {
  const { id } = await props.params; // ✅ await 필수
  const equipment = await equipmentApiServer.getEquipment(id);
  return <div>{equipment.name}</div>;
}
```

```typescript
// ✅ Client Component + Client API + React Query
'use client';

import { useQuery } from '@tanstack/react-query';
import equipmentApi from '@/lib/api/equipment-api';

export default function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getEquipment(id),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
}
```

### ❌ 잘못된 패턴

```typescript
// ❌ Server Component에서 Client API 사용
import equipmentApi from '@/lib/api/equipment-api'; // Client API!

export default async function Page() {
  const equipment = await equipmentApi.getEquipment(id); // ❌ 401 에러!
}
```

```typescript
// ❌ Client Component를 async로 선언
'use client';

export default async function Page() { // ❌ Client Component는 async 불가!
  const data = await fetch(...);
}
```

```typescript
// ❌ params를 await 하지 않음
export default async function Page(props: PageProps) {
  const id = props.params.id; // ❌ Type Error in Next.js 16!
  // ✅ const { id } = await props.params;
}
```

---

## E2E 테스트

### Playwright 테스트에서 인증

E2E 테스트에서는 **NextAuth의 정상적인 인증 플로우**를 사용해야 합니다.

```typescript
// tests/e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

async function loginAs(page: Page, role: string) {
  // 1. CSRF 토큰 획득
  const csrfResponse = await page.request.get('http://localhost:3000/api/auth/csrf');
  const { csrfToken } = await csrfResponse.json();

  // 2. NextAuth callback API로 POST 요청
  const loginResponse = await page.request.post(
    'http://localhost:3000/api/auth/callback/test-login?callbackUrl=/',
    {
      form: {
        role: role,
        csrfToken: csrfToken,
        json: 'true',
      },
    }
  );

  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }

  // 3. 메인 페이지로 이동하여 세션 확인
  await page.goto('/');
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Login failed: redirected to login page');
  }
}

export const test = base.extend({
  testOperatorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'test_engineer');
    await use(page);
    await context.close();
  },
});
```

**절대 금지**:
- ❌ 백엔드 JWT를 직접 쿠키에 저장
- ❌ NextAuth를 우회하는 어떤 방법도 사용하지 않음
- ❌ localStorage에 토큰 저장

**참고**: `.claude/skills/equipment-management/references/e2e-test-auth.md`

---

## 트러블슈팅

### 문제 1: "401 Unauthorized" in Server Component

**증상**: Server Component에서 API 호출 시 401 에러

**원인**: Client API (`equipment-api.ts`)를 Server Component에서 사용

**해결**:
```typescript
// ❌ Before
import equipmentApi from '@/lib/api/equipment-api';

// ✅ After
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
```

### 문제 2: "getSession is not a function" in Server Component

**증상**: Server Component에서 `getSession()`이 undefined

**원인**: `next-auth/react`는 Client Component 전용

**해결**:
```typescript
// ❌ Client API 사용
import { getSession } from 'next-auth/react'; // Client only!

// ✅ Server API 사용
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
```

### 문제 3: E2E 테스트에서 로그인 실패

**증상**: Playwright 테스트에서 계속 로그인 페이지로 리다이렉트

**원인**: NextAuth 세션이 생성되지 않음

**해결**: NextAuth callback API를 사용하여 정상적인 인증 플로우 실행

참고: `docs/development/E2E_TEST_AUTH_GUIDE.md`

### 문제 4: Type Error - "params is Promise"

**증상**: Next.js 16에서 `params.id` 접근 시 타입 에러

**원인**: Next.js 16에서 params가 Promise로 변경됨

**해결**:
```typescript
// ❌ Before
const id = params.id;

// ✅ After
const { id } = await props.params;
```

---

## 체크리스트

새로운 페이지/컴포넌트 작성 시 확인:

**Server Component:**
- [ ] `equipment-api-server.ts` import
- [ ] `await props.params` 사용
- [ ] `async function` 선언
- [ ] 'use client' 없음

**Client Component:**
- [ ] `equipment-api.ts` import
- [ ] 'use client' 선언
- [ ] React Query 또는 useState/useEffect 사용
- [ ] async function 아님

**Server Action:**
- [ ] 'use server' 선언
- [ ] `createServerApiClient()` 사용
- [ ] `revalidatePath()` 또는 `revalidateTag()` 호출

**E2E 테스트:**
- [ ] NextAuth callback API 사용
- [ ] localStorage 토큰 사용 안 함
- [ ] CSRF 토큰 포함
- [ ] 세션 확인 후 테스트 진행

---

## 참고 자료

- **인증 아키텍처 가이드**: `docs/development/AUTH_ARCHITECTURE.md`
- **E2E 테스트 인증 가이드**: `docs/development/E2E_TEST_AUTH_GUIDE.md`
- **Next.js 16 Quick Reference**: `.claude/skills/nextjs-16/quick-reference.md`
- **NextAuth 공식 문서**: https://next-auth.js.org/getting-started/example
- **Next.js 16 공식 문서**: https://nextjs.org/docs

---

## 결론

### ✅ 핵심 원칙 요약

1. **단일 인증 소스 (SSOT)**: NextAuth만 사용, localStorage 금지
2. **컨텍스트별 API**: Server Component → server-api-client, Client Component → api-client
3. **Next.js 16 패턴**: params는 Promise, useActionState 사용, Server Component 우선
4. **E2E 테스트**: NextAuth 정상 플로우 사용, 우회 금지

### 🎯 Best Practices

- ✅ 가능하면 Server Component 사용 (SEO, 성능)
- ✅ 인터랙티브한 UI만 Client Component로
- ✅ Server Action으로 mutation 처리
- ✅ React Query로 Client-side 캐싱
- ✅ E2E 테스트는 실제 사용자 플로우 모방

이 가이드를 따르면 **Server/Client 컨텍스트에서 안전하고 일관된 인증 API 호출**이 가능합니다.

---

**최종 수정일**: 2026-01-22
**작성자**: Claude Sonnet 4.5
**버전**: 2.0.0
