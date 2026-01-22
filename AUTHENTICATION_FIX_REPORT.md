# Authentication Architecture Fix Report

**날짜**: 2026-01-22
**작업자**: Claude Sonnet 4.5
**이슈**: E2E 테스트 및 Server Component에서 401 인증 오류

---

## 문제 요약

### 원인 분석

UI-9 장비 상세 페이지 E2E 테스트에서 발생한 401 인증 오류의 근본 원인:

```
┌─────────────────────────────────────────────────────────────┐
│  문제: Server Component에서 Client API 사용                  │
│                                                              │
│  app/equipment/[id]/page.tsx (Server Component)             │
│         ↓                                                    │
│  import equipmentApi from '@/lib/api/equipment-api'         │
│         ↓                                                    │
│  equipmentApi.getEquipment(id)                              │
│         ↓                                                    │
│  api-client.ts: await getSession() ← Client-side only!     │
│         ↓                                                    │
│  ❌ Server Component에서 null 반환 → 토큰 없음 → 401 에러   │
└─────────────────────────────────────────────────────────────┘
```

**핵심 문제**:
- `getSession()` (from `next-auth/react`)은 React Context를 사용하므로 **Client Component에서만 동작**
- Server Component는 브라우저 Context가 없어 Client-side session 접근 불가
- 결과: 인증 토큰이 API 요청에 포함되지 않음

---

## 해결 방안

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

## 구현 세부 사항

### 1. 새로운 파일 생성

#### `lib/api/server-api-client.ts`
- **목적**: Server Component 전용 API 클라이언트
- **인증 방식**: `getServerSession(authOptions)` 사용
- **특징**:
  - NextAuth 세션에서 직접 accessToken 가져오기
  - Server Component, Server Action, generateMetadata에서 사용
  - Axios 인스턴스 생성 시 토큰 자동 주입

```typescript
export async function createServerApiClient(): Promise<AxiosInstance> {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken;

  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  return client;
}
```

#### `lib/api/equipment-api-server.ts`
- **목적**: Server Component 전용 Equipment API
- **특징**:
  - 모든 함수가 `createServerApiClient()` 사용
  - Server Component에서 직접 await 가능
  - 타입은 기존 `equipment-api.ts`와 동일하게 유지

```typescript
export async function getEquipment(id: string | number): Promise<Equipment> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/${id}`);
  return transformSingleResponse<Equipment>(response);
}
```

### 2. 기존 파일 수정

#### `app/equipment/[id]/page.tsx`
- **변경 전**: Client API 사용 (`equipment-api.ts`)
- **변경 후**: Server API 사용 (`equipment-api-server.ts`)

```typescript
// ❌ Before
import equipmentApi from '@/lib/api/equipment-api';
const equipment = await equipmentApi.getEquipment(id);

// ✅ After
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
const equipment = await equipmentApiServer.getEquipment(id);
```

#### `lib/navigation/use-breadcrumb-metadata.ts`
- **수정**: Named export → Default export 변경
- **이유**: TypeScript 컴파일 에러 수정

---

## API 클라이언트 선택 가이드

| 컨텍스트 | 사용할 API | Import 경로 | 인증 방식 |
|---------|-----------|------------|----------|
| Server Component | `equipment-api-server.ts` | `@/lib/api/equipment-api-server` | `getServerSession()` |
| Client Component | `equipment-api.ts` | `@/lib/api/equipment-api` | `getSession()` |
| Server Action | `server-api-client.ts` | `@/lib/api/server-api-client` | `getServerSession()` |
| generateMetadata | `equipment-api-server.ts` | `@/lib/api/equipment-api-server` | `getServerSession()` |

### 간단한 판별법

```typescript
// 파일에 'use client'가 없음 → Server Component → server-api 사용
export default async function Page() { ... }

// 파일에 'use client'가 있음 → Client Component → api-client 사용
'use client';
export default function Page() { ... }

// 파일에 'use server'가 있음 → Server Action → server-api-client 사용
'use server';
export async function myAction() { ... }
```

---

## Next.js 16 Best Practices 적용

### ✅ 적용된 패턴

1. **params는 Promise 타입**
```typescript
type PageProps = {
  params: Promise<{ id: string }>; // ✅ Promise
};

export default async function Page(props: PageProps) {
  const { id } = await props.params; // ✅ await 필수
}
```

2. **Server Component 우선 사용**
```typescript
// ✅ Server Component에서 직접 데이터 fetching
export default async function Page() {
  const data = await equipmentApiServer.getEquipment(id);
  return <ClientComponent data={data} />;
}
```

3. **컨텍스트별 API 분리**
```typescript
// Server Component
import * as equipmentApiServer from '@/lib/api/equipment-api-server';

// Client Component
import equipmentApi from '@/lib/api/equipment-api';
```

---

## E2E 테스트 개선

### 현재 E2E 테스트 상태

**인증 부분은 이미 올바르게 구현됨**:
- ✅ NextAuth callback API 사용
- ✅ CSRF 토큰 포함
- ✅ 정상적인 인증 플로우

**이전 문제**:
- ❌ Server Component가 Client API를 사용하여 401 에러 발생

**해결 후**:
- ✅ Server Component가 Server API를 사용하여 정상 동작 예상

### E2E 테스트 실행 방법

```bash
# 프론트엔드 디렉토리로 이동
cd apps/frontend

# E2E 테스트 실행
npx playwright test tests/e2e/equipment-detail.spec.ts

# UI 모드로 실행 (디버깅)
npx playwright test tests/e2e/equipment-detail.spec.ts --ui

# 브라우저 표시하며 실행
npx playwright test tests/e2e/equipment-detail.spec.ts --headed
```

---

## 문서 업데이트

### 새로 작성된 문서

1. **`docs/development/AUTH_API_CLIENT_GUIDE.md`**
   - 완벽한 인증 API 클라이언트 가이드
   - Server/Client Component별 사용법
   - Next.js 16 패턴
   - 트러블슈팅
   - 체크리스트

2. **`AUTHENTICATION_FIX_REPORT.md`** (이 문서)
   - 문제 분석 및 해결 방안
   - 구현 세부 사항
   - 변경 사항 요약

### 업데이트된 문서

1. **`.claude/skills/equipment-management/references/e2e-test-auth.md`**
   - Server Component API 사용 트러블슈팅 추가
   - 새로운 AUTH_API_CLIENT_GUIDE 참조 추가

---

## 테스트 체크리스트

### 수동 테스트

```bash
# 1. 백엔드 시작
cd apps/backend
npm run start:dev

# 2. 프론트엔드 시작
cd apps/frontend
npm run dev

# 3. 브라우저에서 테스트
# - http://localhost:3000/login
# - 로그인 (test.engineer@example.com / password123)
# - http://localhost:3000/equipment
# - 장비 클릭하여 상세 페이지 진입
# - 데이터가 정상적으로 로드되는지 확인
```

### E2E 테스트

```bash
# E2E 테스트 실행
cd apps/frontend
npx playwright test tests/e2e/equipment-detail.spec.ts

# 예상 결과: 15/15 테스트 통과
```

### TypeScript 검증

```bash
cd apps/frontend
npx tsc --noEmit --skipLibCheck
# 예상 결과: 타입 에러 없음
```

---

## 영향 범위

### ✅ 영향받는 파일 (수정됨)

1. **`apps/frontend/lib/api/server-api-client.ts`** (신규)
   - Server Component 전용 API 클라이언트

2. **`apps/frontend/lib/api/equipment-api-server.ts`** (신규)
   - Server Component 전용 Equipment API

3. **`apps/frontend/app/equipment/[id]/page.tsx`** (수정)
   - Server API import로 변경

4. **`apps/frontend/lib/navigation/use-breadcrumb-metadata.ts`** (수정)
   - Import 구문 수정

5. **`docs/development/AUTH_API_CLIENT_GUIDE.md`** (신규)
   - 완벽한 가이드 문서

6. **`.claude/skills/equipment-management/references/e2e-test-auth.md`** (업데이트)
   - 트러블슈팅 추가

### ⚠️ 영향받지 않는 파일

**Client Components는 기존 API 계속 사용**:
- `app/equipment/page.tsx` ('use client')
- `app/calibration/register/page.tsx` ('use client')
- 기타 모든 'use client' 컴포넌트

이들은 `equipment-api.ts`를 계속 사용하며 변경 불필요.

---

## 마이그레이션 가이드

### 다른 Server Component 페이지를 수정할 때

1. **파일이 Server Component인지 확인**
   - 'use client'가 없음 → Server Component
   - async function으로 선언됨

2. **Import 변경**
```typescript
// Before
import equipmentApi from '@/lib/api/equipment-api';

// After
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
```

3. **함수 호출 변경 (필요시)**
```typescript
// Before
const data = await equipmentApi.getEquipment(id);

// After
const data = await equipmentApiServer.getEquipment(id);
```

4. **TypeScript 검증**
```bash
npx tsc --noEmit
```

---

## 향후 개선 사항

### 1. 다른 API 모듈도 Server 버전 추가

현재는 Equipment API만 Server 버전을 만들었지만, 필요시 다른 API도 추가:

- `calibration-api-server.ts`
- `checkout-api-server.ts`
- `dashboard-api-server.ts`
- 등등...

### 2. Server Action 활용 확대

파일 업로드 등 복잡한 mutation은 Server Action으로 이동:

```typescript
// app/actions/equipment.ts
'use server';

export async function createEquipment(formData: FormData) {
  const apiClient = await createServerApiClient();
  // ... 구현
  revalidatePath('/equipment');
}
```

### 3. React Query 최적화

Client Component에서 React Query 사용 시 더 나은 캐싱 전략:

```typescript
export const equipmentQueries = {
  all: () => ['equipment'],
  lists: () => [...equipmentQueries.all(), 'list'],
  list: (filters: EquipmentQuery) => [...equipmentQueries.lists(), filters],
  details: () => [...equipmentQueries.all(), 'detail'],
  detail: (id: string) => [...equipmentQueries.details(), id],
};
```

---

## 결론

### ✅ 달성한 목표

1. **근본 원인 해결**: Server Component에서 올바른 API 사용
2. **아키텍처 개선**: 컨텍스트별 API 클라이언트 분리
3. **Next.js 16 Best Practices**: 최신 패턴 적용
4. **문서화**: 완벽한 가이드 작성
5. **SSOT 원칙 유지**: NextAuth만 사용, localStorage 금지

### 🎯 기대 효과

1. **E2E 테스트 통과**: Server Component에서 정상적인 인증
2. **개발자 경험 향상**: 명확한 API 선택 가이드
3. **유지보수성 개선**: 컨텍스트별 명확한 책임 분리
4. **타입 안정성**: TypeScript로 컴파일 타임 에러 방지
5. **성능 최적화**: Server Component에서 직접 데이터 fetching

### 📚 참고 자료

- **완벽 가이드**: `docs/development/AUTH_API_CLIENT_GUIDE.md`
- **인증 아키텍처**: `docs/development/AUTH_ARCHITECTURE.md`
- **E2E 테스트**: `.claude/skills/equipment-management/references/e2e-test-auth.md`
- **Next.js 16**: `.claude/skills/nextjs-16/quick-reference.md`

---

**작성 완료**: 2026-01-22
**상태**: ✅ 구현 완료, 테스트 대기중
**다음 단계**: E2E 테스트 실행 및 검증
