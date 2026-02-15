---
name: equipment-management
description: |
  장비 관리 시스템(Equipment Management System) 개발 가이드. UL-QP-18 장비 관리 절차서 기반의 시험소 장비 관리 시스템 구현을 위한 전문 스킬입니다.

  사용 시점:
  (1) 장비 등록/수정/삭제 API 또는 UI 개발 시
  (2) 시험설비이력카드(UL-QP-18-02) 관련 기능 구현 시
  (3) 교정(Calibration) 기록 관리 및 승인 프로세스 구현 시
  (4) 점검(중간점검/자체점검) 기능 구현 시
  (5) 대여(Rental) 또는 반출(Checkout) 기능 구현 시
  (6) 보정계수(Calibration Factor) 관리 기능 구현 시
  (7) 부적합 장비(Non-Conformance) 관리 기능 구현 시
  (8) 소프트웨어 관리대장(UL-QP-18-07) 기능 구현 시
  (9) 교정계획서 작성 및 승인 기능 구현 시
  (10) 사용자 역할 및 권한 체계 관련 개발 시
  (11) 프론트엔드 UI 개발 시 (Next.js 16 App Router 패턴)
  (12) 관리번호 체계 및 위치 코드 관련 개발 시
  (13) 인증/인가 관련 개발 시 (NextAuth 토큰 관리)
---

# 장비 관리 시스템 개발 가이드

**기준 문서**: UL-QP-18 장비 관리 절차서 (개정번호 15, 2026.01.14)

---

## ⚠️ 필독: 프로젝트 컨텍스트

**이 스킬을 사용하기 전에 반드시 읽으세요!**

### 프로젝트 특성

- **개발 환경**: 1인 개발자 (개발 + 테스트 동일인)
- **DB 구조**: **단일 DB 통합** (개발 DB = 테스트 DB)
- **데이터 중요도**: 개발 데이터 중요하지 않음

### 🔴 절대 금지

```
❌ "테스트 DB와 개발 DB를 분리해야..."
❌ "두 DB를 동기화하려면..."
❌ postgres_equipment_test (제거됨)
❌ localhost:5434 (사용 안함)
❌ equipment_management_test (사용 안함)
```

### ✅ 올바른 접근

```
✅ 단일 DB 사용: postgres_equipment (포트 5432)
✅ DB 명령어: pnpm db:migrate
✅ 테스트: 개발 DB에서 실행
✅ 환경: 개발 + 테스트 통합
```

**자세한 내용**: `/.claude/PROJECT_RULES.md` 참조

---

## 기술 스택

- **Backend**: NestJS, Drizzle ORM, PostgreSQL
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS
- **인증**: NextAuth.js (Azure AD + Credentials), JWT
- **Monorepo**: pnpm workspace
- **개발 환경**: Docker (PostgreSQL, Redis만) + 로컬 실행 (앱)

> **인증 아키텍처**: NextAuth를 단일 인증 소스로 사용. localStorage 토큰 사용 금지.
> 상세: [references/auth-architecture.md](references/auth-architecture.md)

---

## 개발 환경 설정

### 빠른 시작 (Phase 1: 로컬 개발)

```bash
# 1. 자동 설정 (처음 한 번만)
./scripts/setup-dev.sh

# 2. 개발 서버 시작
pnpm dev
# 또는
make dev
```

**접속 주소:**

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 개발 환경 원칙

**Phase 1 (현재 - 1인 개발):**

- ✅ **Docker**: PostgreSQL, Redis만
- ✅ **로컬 실행**: 백엔드, 프론트엔드
- ✅ 빠른 개발, hot-reload 지원

```bash
# Docker 인프라만 시작
docker compose up -d

# 앱은 로컬에서
pnpm dev
```

**Phase 2 (팀 확장 준비):**

- 하이브리드 접근 또는 계속 로컬
- 온보딩 자동화 강화

**Phase 3 (3인+ 팀):**

- 완전 컨테이너화 (선택)
- CI/CD 파이프라인

**상세 로드맵**: `/docs/development/TEAM_EXPANSION_ROADMAP.md`

### 주요 명령어

```bash
# Docker (DB/Redis만)
docker compose up -d     # 시작
docker compose down      # 중지

# 개발
pnpm dev                # 백엔드 + 프론트엔드
pnpm --filter backend run dev      # 백엔드만
pnpm --filter frontend run dev     # 프론트엔드만

# DB
pnpm --filter backend run db:migrate   # 스키마 변경 적용
pnpm --filter backend run db:studio    # Drizzle Studio

# 빌드 & 테스트
pnpm build              # 전체 빌드
pnpm test               # 테스트
```

### 트러블슈팅

**dist 폴더 권한 문제:**

```bash
sudo rm -rf apps/backend/dist
pnpm --filter backend run start:dev
```

**포트 충돌:**

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**상세 가이드**: `/docs/development/DEV_SETUP.md`

---

## 현대적 아키텍처 패턴 (2026-02)

> **이 섹션의 목적**: 2026-02 현재 운영 중인 프로덕션급 아키텍처 패턴을 문서화하여, AI가 시니어급 사고력으로 시니어급 코드를 작성할 수 있도록 "왜(Why)"를 중심으로 설명합니다.

### 패턴 개요

이 프로젝트는 12가지 현대적 패턴으로 구성된 정교한 아키텍처를 갖추고 있습니다:

**Backend (4 patterns)**:

1. Optimistic Locking (CAS) - 동시성 제어
2. Token Refresh - 보안 + UX 균형
3. Server-Driven UI - UI 로직 중앙화
4. Unified Error Handling - 표준화된 에러 응답

**Frontend (5 patterns)**:

5. Optimistic Update Hook - 즉시 UI 반응
6. Server/Client API Separation - 환경별 최적화
7. Cache Invalidation Strategies - 계층화된 캐시 전략
8. Discriminated Union APIs - 타입 안전한 다형성
9. Query Key Factory - 중앙화된 쿼리 키 관리

**Transaction (1 pattern)**:

10. Multi-Table Atomic Updates - 원자성 보장

---

### Backend Pattern 1: Optimistic Locking (CAS)

#### 문제 정의

**Lost Update Problem**: 두 사용자가 동시에 같은 엔티티를 조회 → 각자 수정 → 나중 요청이 먼저 요청을 덮어씀

```
User A: 조회(version: 1, status: pending) → 승인 → UPDATE SET status='approved'
User B: 조회(version: 1, status: pending) → 반려 → UPDATE SET status='rejected'
결과: B의 변경사항만 반영 (A의 승인 손실!) ← Lost Update
```

#### 해결: Compare-And-Swap (CAS)

**핵심 파일**: `apps/backend/src/common/base/versioned-base.service.ts`

모든 엔티티에 `version` 필드 추가 → UPDATE 시 WHERE 절에 `version = expectedVersion` 조건

```typescript
// ✅ 올바른 패턴 - VersionedBaseService 상속
export class CheckoutsService extends VersionedBaseService {
  async approve(uuid: string, approverId: string, currentVersion: number) {
    // version 체크와 함께 업데이트
    return this.updateWithVersion(
      checkouts,
      uuid,
      currentVersion,
      {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      'checkout'
    );
    // SQL: UPDATE checkouts
    //      SET version = version + 1, status = 'approved', ...
    //      WHERE id = ? AND version = ?
    // → 0 rows affected? → 409 Conflict { code: 'VERSION_CONFLICT' }
  }
}

// updateWithVersion 내부 로직 (VersionedBaseService)
protected async updateWithVersion<T>(
  table,
  id: string,
  expectedVersion: number,
  updateData: Record<string, unknown>,
  entityName: string
): Promise<T> {
  const [updated] = await this.db
    .update(table)
    .set({ ...updateData, version: sql`${table.version} + 1` })
    .where(and(eq(table.id, id), eq(table.version, expectedVersion)))
    .returning();

  if (!updated) {
    // 0 rows affected → 엔티티 없음 or 버전 충돌
    const existing = await this.db.query[table].findFirst({
      where: eq(table.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`${entityName} not found`);
    }

    // 버전 충돌 → 409 + 커스텀 코드
    throw new ConflictException({
      code: 'VERSION_CONFLICT',
      message: '다른 사용자가 먼저 처리했습니다',
      currentVersion: existing.version,
      expectedVersion,
    });
  }

  return updated as T;
}
```

#### DTO 규칙: versionedSchema 포함

**파일**: `apps/backend/src/common/dto/base-versioned.dto.ts`

```typescript
// Base Zod schema
export const versionedSchema = {
  version: z.number().int().positive(),
};

// 사용 예
export const approveCheckoutSchema = z.object({
  ...versionedSchema, // ← version 필드 필수
  comment: z.string().optional(),
});

export type ApproveCheckoutDto = z.infer<typeof approveCheckoutSchema>;
export const ApproveCheckoutPipe = new ZodValidationPipe(approveCheckoutSchema);

// Controller
@Patch(':uuid/approve')
@UsePipes(ApproveCheckoutPipe)
async approve(@Param('uuid') uuid: string, @Body() dto: ApproveCheckoutDto) {
  return this.service.approve(uuid, userId, dto.version); // ← version 전달
}
```

#### Cache Coherence: CAS 실패 시 캐시 삭제

**문제**: `findOne`이 `cacheService.getOrSet`으로 캐시 사용 → CAS 실패 후 stale cache 잔존 → 재시도도 계속 409

**해결**: CAS 실패(409) 시 detail 캐시 반드시 삭제

```typescript
// ✅ 올바른 패턴 - CheckoutsService.updateCheckoutStatus
async updateCheckoutStatus(uuid: string, status: string, version: number) {
  const detailCacheKey = `checkout:detail:${uuid}`;

  try {
    return await this.updateWithVersion(checkouts, uuid, version, { status }, 'checkout');
  } catch (error) {
    // CAS 실패 시 캐시 무효화 (stale cache 방지)
    if (error instanceof ConflictException) {
      this.cacheService.delete(detailCacheKey);
    }
    throw error;
  }
}
```

#### 적용 엔티티 (8개)

| Table              | Service                 | Key File                                         |
| ------------------ | ----------------------- | ------------------------------------------------ |
| equipment          | EquipmentService        | `modules/equipment/equipment.service.ts`         |
| checkouts          | CheckoutsService        | `modules/checkouts/checkouts.service.ts`         |
| calibrations       | CalibrationService      | `modules/calibration/calibration.service.ts`     |
| non_conformances   | NonConformancesService  | `modules/non-conformances/...service.ts`         |
| disposal_requests  | DisposalService         | `modules/equipment/services/disposal.service.ts` |
| equipment_imports  | EquipmentImportsService | `modules/equipment-imports/...service.ts`        |
| equipment_requests | EquipmentService        | `modules/equipment/equipment.service.ts`         |
| software_history   | SoftwareService         | `modules/software/software.service.ts`           |

---

### Backend Pattern 2: Token Refresh Architecture

#### 설계 원칙

**문제**: Access Token이 너무 길면(1일) 탈취 시 위험, 너무 짧으면(5분) UX 저하

**해결**: Access Token 짧게(15분) + Refresh Token 길게(7일) → 보안과 UX 균형

#### Token 구조

```typescript
// Access Token Payload
{
  userId: string,
  email: string,
  role: UserRole,
  site: string,
  teamId: string,
  type: 'access',
  iat: number,
  exp: number, // ← 15분 후
}

// Refresh Token Payload
{
  userId: string,
  type: 'refresh', // ← 타입 구분 중요
  iat: number,
  exp: number, // ← 7일 후
  absoluteExpiry: number, // ← 절대 만료 (30일)
}
```

#### 자동 갱신 로직

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

#### SessionProvider 설정

```typescript
// ✅ 5분마다 JWT 콜백 트리거 (자동 갱신 체크)
<SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
  {children}
</SessionProvider>
```

#### API 클라이언트 통합

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

---

### Backend Pattern 3: Server-Driven UI

#### 핵심 개념

**문제**: 권한 로직이 백엔드와 프론트엔드에 중복 → 정책 변경 시 양측 수정 필요 → 불일치 위험

**해결**: 백엔드가 각 엔티티의 **가능한 액션**을 계산하여 프론트엔드에 전달

#### Response 구조

```typescript
// Backend Response
{
  id: '123',
  status: 'pending',
  createdBy: 'user1',
  availableActions: ['approve', 'reject', 'cancel'], // ← 백엔드 계산
}

// Backend Service - 권한 로직 중앙화
calculateAvailableActions(checkout: Checkout, userId: string, userRole: string): string[] {
  const actions: string[] = [];

  if (checkout.status === 'pending') {
    // 기술책임자 이상 → 승인/반려 가능
    if (['technical_manager', 'lab_manager'].includes(userRole)) {
      actions.push('approve', 'reject');
    }
    // 본인 → 취소 가능
    if (checkout.createdBy === userId) {
      actions.push('cancel');
    }
  }

  if (checkout.status === 'approved') {
    // 시험실무자 이상 → 반출 시작 가능
    actions.push('start_checkout');
  }

  return actions;
}
```

#### Frontend 렌더링 - 단순 조건문

```typescript
// ✅ 프론트엔드 - 단순 렌더링만
export function CheckoutActions({ checkout }: Props) {
  const { availableActions } = checkout;

  return (
    <>
      {availableActions.includes('approve') && (
        <Button onClick={() => approve(checkout.id)}>승인</Button>
      )}
      {availableActions.includes('reject') && (
        <Button onClick={() => reject(checkout.id)}>반려</Button>
      )}
      {availableActions.includes('cancel') && (
        <Button onClick={() => cancel(checkout.id)}>취소</Button>
      )}
      {availableActions.includes('start_checkout') && (
        <Button onClick={() => startCheckout(checkout.id)}>반출 시작</Button>
      )}
    </>
  );
}

// ❌ 잘못된 패턴 - 프론트엔드에서 권한 로직 중복
export function CheckoutActions({ checkout, user }: Props) {
  const canApprove =
    checkout.status === 'pending' &&
    ['technical_manager', 'lab_manager'].includes(user.role);
  const canReject =
    checkout.status === 'pending' &&
    ['technical_manager', 'lab_manager'].includes(user.role);
  // → 백엔드 로직과 불일치 위험!
}
```

#### 장점

- ✅ 권한 로직 중복 제거 (백엔드 단일 소스)
- ✅ UI 일관성 보장 (조건 분기 최소화)
- ✅ 백엔드 정책 변경 시 프론트엔드 수정 불필요
- ✅ 테스트 용이 (백엔드만 테스트)

---

### Backend Pattern 4: Unified Error Handling

#### GlobalExceptionFilter

**파일**: `apps/backend/src/common/filters/error.filter.ts`

**처리 순서**: `AppError` → `ZodError` → `HttpException` → `unknown`

#### 표준 에러 응답

```typescript
// Response 형식 - 커스텀 code 필드 보존
{
  code: string,          // 'VERSION_CONFLICT', 'VALIDATION_ERROR', 커스텀 코드
  message: string,
  timestamp: string,
  currentVersion?: number, // CAS 실패 시 추가 필드
  expectedVersion?: number
}
```

#### 커스텀 에러 생성

```typescript
// ✅ 올바른 패턴 - code 필드로 에러 구분
throw new ConflictException({
  code: 'VERSION_CONFLICT',
  message: '다른 사용자가 먼저 처리했습니다',
  currentVersion: 5,
  expectedVersion: 4,
});

// Frontend에서
if (error.code === 'VERSION_CONFLICT') {
  toast.error('다른 사용자가 먼저 처리했습니다. 페이지를 새로고침합니다.', {
    duration: 3000,
  });
  await queryClient.refetchQueries({ queryKey: ['checkout', id] });
}
```

#### Error Code SSOT

**파일**: `apps/frontend/lib/errors/equipment-errors.ts`

```typescript
// Frontend Error Code Enum (21개)
export enum EquipmentErrorCode {
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  // ... 17 more codes
}

// Backend code → Frontend EquipmentErrorCode 매핑
export function mapBackendErrorCode(
  backendCode: string | undefined,
  httpStatus: number
): EquipmentErrorCode {
  // 1순위: Backend code 우선
  if (backendCode === 'VERSION_CONFLICT') {
    return EquipmentErrorCode.VERSION_CONFLICT;
  }

  // 2순위: HTTP status 폴백
  return httpStatusToErrorCode(httpStatus);
}
```

---

### Frontend Pattern 5: Optimistic Update Hook

#### 핵심 파일

`apps/frontend/hooks/use-optimistic-mutation.ts`

#### 전략: 서버 재검증 (Revalidation)

**잘못된 이해**: "에러 시 스냅샷 롤백"

**올바른 이해**: "에러 = 서버 상태 불일치 → 서버에서 최신 데이터 가져오기"

```typescript
// ✅ 올바른 패턴
const mutation = useOptimisticMutation({
  mutationFn: (vars) => checkoutApi.approve(vars),
  queryKey: queryKeys.checkouts.detail(id),
  optimisticUpdate: (old, vars) => ({ ...old, status: 'approved' }),
  invalidateKeys: [queryKeys.checkouts.lists()],
});

// Lifecycle:
// 1. onMutate: 즉시 UI 업데이트 (0ms 체감)
//    → setQueryData로 낙관적 업데이트
// 2. onSuccess: 서버 확정
//    → invalidateQueries로 관련 쿼리 무효화
// 3. onError: 스냅샷 롤백이 아닌 서버 재검증
//    → invalidateQueries로 서버 최신 데이터 가져오기
```

#### useOptimisticMutation 내부 구현

```typescript
export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  invalidateKeys,
}: Options<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });

      // 스냅샷 저장
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // 낙관적 업데이트
      if (optimisticUpdate && previousData) {
        queryClient.setQueryData<TData>(queryKey, (old) =>
          optimisticUpdate(old as TData, variables)
        );
      }

      return { previousData };
    },
    onSuccess: async () => {
      // 성공 → 관련 쿼리 무효화
      await Promise.all(
        invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
      );
    },
    onError: (error, variables, context) => {
      // ⚠️ 핵심: 스냅샷 롤백이 아닌 서버 재검증!
      queryClient.invalidateQueries({ queryKey });

      // VERSION_CONFLICT 특별 처리
      if (isConflictError(error)) {
        toast.error('다른 사용자가 먼저 처리했습니다. 페이지가 자동으로 새로고침됩니다.', {
          duration: 3000,
        });
      }
    },
  });
}
```

#### 왜 스냅샷 롤백이 아닌가?

**논리적 근거**:

1. 에러 = "내가 본 데이터가 최신이 아님"
2. 스냅샷 복원 = "stale state로 되돌리기" → 또 다른 stale state 생성
3. 올바른 접근 = "서버에서 최신 데이터 가져오기" (invalidateQueries)

**Vercel Best Practices 근거**:

- `client-swr-dedup`: 자동 revalidation으로 stale state 방지
- `async-parallel`: invalidateQueries + router.refresh() 병렬 실행

---

### Frontend Pattern 6: Server/Client API Separation

#### 3-Tier 구조

| Layer         | File                                        | Context                    | Use Case                        |
| ------------- | ------------------------------------------- | -------------------------- | ------------------------------- |
| Client-side   | `lib/api/api-client.ts`                     | `getSession()` interceptor | API hooks, mutations            |
| Context-based | `lib/api/authenticated-client-provider.tsx` | `useSession()` hook        | 세션 동기화 필요 시             |
| Server-side   | `lib/api/server-api-client.ts`              | `getServerAuthSession()`   | Server Component, Route Handler |

#### 왜 분리하는가?

**환경별 제약사항**:

| 함수                     | Server Component | Client Component |
| ------------------------ | ---------------- | ---------------- |
| `getSession()`           | ❌ 불가          | ✅ OK            |
| `getServerAuthSession()` | ✅ OK            | ❌ 불가          |
| `useSession()` hook      | ❌ 불가          | ✅ OK            |

#### Server Component에서 API 호출

```typescript
// ✅ 올바른 패턴 - server-api-client 사용
// app/equipment/page.tsx (Server Component)
import { equipmentApiServer } from '@/lib/api/server-api-client';

export default async function EquipmentPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const equipment = await equipmentApiServer.getEquipmentList(searchParams);
  // → getServerAuthSession()으로 서버 세션 읽기

  return <EquipmentListClient initialData={equipment} />;
}
```

#### Client Component에서 API 호출

```typescript
// ✅ 올바른 패턴 - api-client 사용
// components/equipment/EquipmentList.tsx ('use client')
import equipmentApi from '@/lib/api/equipment-api';

export function EquipmentList() {
  const { data } = useQuery({
    queryKey: ['equipmentList'],
    queryFn: () => equipmentApi.getEquipmentList(),
    // → getSession()으로 클라이언트 세션 읽기 (interceptor)
  });
}
```

---

### Frontend Pattern 7: Cache Invalidation Strategies

#### staleTime 계층화

**파일**: `apps/frontend/lib/api/query-config.ts`

| Preset    | staleTime | Use Case                 | Example                      |
| --------- | --------- | ------------------------ | ---------------------------- |
| SHORT     | 30s       | Dashboard, Notifications | `queryKeys.dashboard.all`    |
| MEDIUM    | 2min      | Detail pages             | `queryKeys.equipment.detail` |
| LONG      | 5min      | List pages               | `queryKeys.equipment.lists`  |
| VERY_LONG | 10min     | Rarely changing data     | Calibration history          |
| REFERENCE | 30min     | Teams, status codes      | `queryKeys.teams.all`        |

#### 교차 엔티티 무효화

**파일**: `apps/frontend/lib/api/cache-invalidation.ts`

```typescript
// ✅ 올바른 패턴 - 정적 메서드로 교차 엔티티 무효화
export class EquipmentCacheInvalidation {
  static async invalidateAfterNonConformanceCreation(
    queryClient: QueryClient,
    equipmentId: string
  ) {
    await Promise.all([
      // Equipment 관련
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] }),

      // Non-Conformances 관련
      queryClient.invalidateQueries({ queryKey: ['non-conformances', 'list'] }),

      // Dashboard 관련 (장비 상태 변경 → 통계 영향)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }

  static async invalidateAfterDisposal(queryClient: QueryClient, equipmentId: string) {
    await Promise.all([
      // Equipment 관련
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] }),

      // Checkouts 관련 (폐기 → 반출 취소)
      queryClient.invalidateQueries({ queryKey: ['checkouts', 'list'] }),

      // Dashboard 관련
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }
}

// ❌ 잘못된 패턴 - 수동으로 개별 무효화 (누락 위험)
await queryClient.invalidateQueries(['equipment', equipmentId]);
// → 다른 쿼리는 stale state 유지!
```

#### invalidateQueries vs refetchQueries

```typescript
// ✅ 즉시 refetch 필요 (현재 페이지에 표시 중)
await queryClient.refetchQueries({
  queryKey: ['equipment', id],
  type: 'active', // ← 마운트된 쿼리만
});

// ✅ 다음 접근 시 refetch (백그라운드, 다른 페이지)
await queryClient.invalidateQueries({
  queryKey: ['equipmentList'],
});
```

---

### Frontend Pattern 8: Discriminated Union APIs

#### 문제 정의

반출 목적(purpose)에 따라 필요한 필드가 다름:

- `calibration` → `calibrationAgency` 필수
- `repair` → `repairDescription` 필수
- `rental` → `borrowerSite`, `borrowerTeam` 필수

#### 해결: TypeScript Discriminated Union

```typescript
// ✅ 올바른 패턴 - Discriminated Union
type CheckoutRequest =
  | {
      purpose: 'calibration';
      calibrationAgency: string;
      expectedReturnDate: Date;
    }
  | {
      purpose: 'repair';
      repairDescription: string;
      expectedReturnDate: Date;
    }
  | {
      purpose: 'rental';
      borrowerSite: string;
      borrowerTeam: string;
      expectedReturnDate: Date;
    };

// TypeScript가 자동으로 타입 좁히기
function processCheckout(req: CheckoutRequest) {
  if (req.purpose === 'calibration') {
    console.log(req.calibrationAgency); // ✅ OK - 타입 안전
    console.log(req.repairDescription); // ❌ 컴파일 에러 (해당 필드 없음)
  }

  if (req.purpose === 'repair') {
    console.log(req.repairDescription); // ✅ OK
    console.log(req.borrowerSite); // ❌ 컴파일 에러
  }
}
```

#### Zod Schema 구현

```typescript
// Backend Zod schema
export const createCheckoutSchema = z.discriminatedUnion('purpose', [
  z.object({
    purpose: z.literal('calibration'),
    equipmentId: z.string().uuid(),
    calibrationAgency: z.string().min(1),
    expectedReturnDate: z.coerce.date(),
  }),
  z.object({
    purpose: z.literal('repair'),
    equipmentId: z.string().uuid(),
    repairDescription: z.string().min(10),
    expectedReturnDate: z.coerce.date(),
  }),
  z.object({
    purpose: z.literal('rental'),
    equipmentId: z.string().uuid(),
    borrowerSite: z.enum(['suwon', 'uiwang', 'pyeongtaek']),
    borrowerTeam: z.string().uuid(),
    expectedReturnDate: z.coerce.date(),
  }),
]);

export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
```

#### 장점

- ✅ 컴파일 타임에 타입 안전성 보장
- ✅ 필수 필드 누락 방지 (Zod 검증)
- ✅ 런타임 오류 제거

---

### Frontend Pattern 9: Query Key Factory

#### 문제

쿼리 키를 각 파일에서 하드코딩 → 타입 안전하지 않고, 무효화 시 누락 위험

```typescript
// ❌ 잘못된 패턴 - 하드코딩
useQuery({ queryKey: ['equipment', id] }); // 타입 안전하지 않음
queryClient.invalidateQueries(['equipment', 'list']); // 오타 위험
```

#### 해결: 중앙화된 팩토리

**파일**: `apps/frontend/lib/api/query-config.ts`

```typescript
// ✅ SSOT - Query Key Factory
export const queryKeys = {
  equipment: {
    all: () => ['equipment'] as const,
    lists: () => [...queryKeys.equipment.all(), 'list'] as const,
    list: (filters: EquipmentFilters) => [...queryKeys.equipment.lists(), filters] as const,
    details: () => [...queryKeys.equipment.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.equipment.details(), id] as const,
  },
  checkouts: {
    all: () => ['checkouts'] as const,
    lists: () => [...queryKeys.checkouts.all(), 'list'] as const,
    list: (filters: CheckoutFilters) => [...queryKeys.checkouts.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.checkouts.all(), 'detail', id] as const,
  },
  calibrations: {
    all: () => ['calibrations'] as const,
    lists: () => [...queryKeys.calibrations.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.calibrations.all(), 'detail', id] as const,
    history: (equipmentId: string) =>
      [...queryKeys.calibrations.all(), 'history', equipmentId] as const,
  },
  dashboard: {
    all: () => ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all(), 'stats'] as const,
    notifications: () => [...queryKeys.dashboard.all(), 'notifications'] as const,
  },
  // ... 다른 리소스
};

// 사용 예
useQuery({ queryKey: queryKeys.equipment.detail(id) });
// → ['equipment', 'detail', '123']

queryClient.invalidateQueries({ queryKey: queryKeys.equipment.lists() });
// → ['equipment', 'list']를 prefix로 갖는 모든 쿼리 무효화
// → ['equipment', 'list'], ['equipment', 'list', { site: 'suwon' }] 등
```

#### 계층적 무효화

```typescript
// 특정 장비 detail만 무효화
await queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail('123') });
// → ['equipment', 'detail', '123']만 무효화

// 모든 장비 목록 무효화 (필터 조합 포함)
await queryClient.invalidateQueries({ queryKey: queryKeys.equipment.lists() });
// → ['equipment', 'list', ...] 모든 변형 무효화

// 장비 관련 모든 쿼리 무효화
await queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all() });
// → ['equipment', ...] 모든 하위 쿼리 무효화
```

#### 장점

- ✅ 타입 안전한 쿼리 키
- ✅ 계층적 무효화 (lists() → 모든 목록 무효화)
- ✅ 중복 방지 (단일 소스)
- ✅ 오타 방지 (IDE 자동완성)

---

### Transaction Pattern 10: Multi-Table Atomic Updates

#### 원칙

**다중 테이블 업데이트 → 트랜잭션 필수**

**CAS 단일 테이블 업데이트 → 트랜잭션 불필요**

#### 다중 테이블 → 트랜잭션

```typescript
// ✅ 올바른 패턴 - 트랜잭션으로 원자성 보장
await db.transaction(async (tx) => {
  // 1. 장비 상태 변경
  await tx.update(equipment).set({ status: 'disposed' }).where(eq(equipment.id, id));

  // 2. 감사 로그 기록
  await tx.insert(auditLogs).values({
    action: 'dispose',
    entityType: 'equipment',
    entityId: id,
    performedBy: userId,
  });

  // 3. 관련 반출 취소
  await tx
    .update(checkouts)
    .set({ status: 'canceled' })
    .where(and(eq(checkouts.equipmentId, id), eq(checkouts.status, 'pending')));
});

// → 3개 작업 모두 성공 or 모두 롤백 (원자성)
```

#### CAS 단일 테이블 → 트랜잭션 불필요

```typescript
// ✅ 올바른 패턴 - WHERE version = ? 자체가 원자성 보장
await db
  .update(equipment)
  .set({ status: 'approved', version: sql`${equipment.version} + 1` })
  .where(and(eq(equipment.id, id), eq(equipment.version, expectedVersion)));

// → 0 rows affected? → 충돌 감지 (409)
// → 트랜잭션 오버헤드 불필요!
```

#### 왜 CAS는 트랜잭션 불필요한가?

**논리적 근거**:

1. `WHERE version = ?` 조건 자체가 원자성 보장
2. 단일 UPDATE 문 = 원자 연산 (DB 엔진 보장)
3. 0 rows affected → 충돌 감지 (즉시 409 응답)
4. 트랜잭션 오버헤드 제거 → 성능 향상

**트랜잭션 오버헤드**:

- BEGIN/COMMIT 추가 왕복
- Lock 유지 시간 증가
- 동시성 저하

---

## 핵심 용어 (UL-QP-18 기준)

| 용어                     | 정의                                                         |
| ------------------------ | ------------------------------------------------------------ |
| **장비(Equipment)**      | 시험소에서 시험에 사용하는 설비와 장비 통칭                  |
| **점검(Inspection)**     | 장비/측정시스템에 대한 측정 오차를 줄이기 위한 업무          |
| **교정(Calibration)**    | 외부/내부 교정기관을 통한 장비 정밀도 검증                   |
| **중간점검**             | 교정 신뢰성 확인을 위한 교정 주기 사이 점검                  |
| **자체점검**             | 비교정 대상 장비에 대한 주기적 점검                          |
| **소급성(Traceability)** | 국가/국제 표준과 연결되는 측정 결과 특성                     |
| **공용장비**             | 안전인증 시험팀에서 관리, EMC-W 분야 시험에 사용 가능한 장비 |
| **미관리 장비**          | 상시 관리하지 않는 장비(여분 장비 등)                        |

**상세 용어**: [references/terminology.md](references/terminology.md)

---

## 역할 체계 (UL-QP-18 Section 4)

| 역할 코드           | 절차서 역할 | 영문              | 주요 권한                                                    |
| ------------------- | ----------- | ----------------- | ------------------------------------------------------------ |
| `test_engineer`     | 시험실무자  | Test Engineer     | 장비 운영/관리, 점검 실시, 이력카드 작성, 반출입 확인서 작성 |
| `technical_manager` | 기술책임자  | Technical Manager | 교정계획 수립, 점검 결과 확인, 반출입 승인, 보정인자 관리    |
| `lab_manager`       | 시험소장    | Lab Manager       | 교정계획 승인, 장비 폐기 승인, 시험소 전체 관리 (모든 권한)  |

**상세 역할/권한**: [references/roles.md](references/roles.md)

---

## 관리번호 체계 (UL-QP-18 Section 7.5)

```
XXX – X YYYY
 │    │  └── 일련번호 (4자리, 0001~9999)
 │    └───── 분류코드 (E/R/S/A/P) - 팀에서 결정
 └────────── 시험소코드 (SUW/UIW/PYT)
```

**시험소코드**: SUW(수원), UIW(의왕), PYT(평택)

**분류코드 (팀 이름 = 분류 이름)**:
| 코드 | 분류 (= 팀 이름) | 사이트 |
|------|------------------|--------|
| E | FCC EMC/RF | 수원 |
| R | General EMC | 수원 |
| W | General RF | 의왕 |
| S | SAR | 수원 |
| A | Automotive EMC | 수원, 평택 |
| P | Software Program | - |

> ✅ **팀 이름 = 분류 이름**: 팀 선택 시 분류 이름(FCC EMC/RF 등)으로 표시됩니다.

**상세 관리번호 및 위치코드**: [references/management-numbers.md](references/management-numbers.md)

---

## 팀-분류코드 매핑 및 Azure AD 그룹

**팀 이름 = 분류 이름 (통일):**

- 장비 등록/필터에서 팀 선택 시 분류 이름으로 표시
- 사이트 선택 시 해당 사이트의 팀만 드롭다운에 표시

### 사이트별 팀 구성

| 사이트     | 팀(분류)       | 분류코드 |
| ---------- | -------------- | -------- |
| 수원 (SUW) | FCC EMC/RF     | E        |
| 수원 (SUW) | General EMC    | R        |
| 수원 (SUW) | SAR            | S        |
| 수원 (SUW) | Automotive EMC | A        |
| 의왕 (UIW) | General RF     | W        |
| 평택 (PYT) | Automotive EMC | A        |

### Azure AD 그룹 매핑 (수원)

| Azure AD 그룹        | 테넌트 ID                              | 팀 이름 (분류)     |
| -------------------- | -------------------------------------- | ------------------ |
| `LST.SUW.RF`         | `7dc3b94c-82b8-488e-9ea5-4fe71bb086e1` | FCC EMC/RF (E)     |
| `LST.SUW.EMC`        | `bb6c860d-9d7c-4e2d-b289-2b2e416ec289` | General EMC (R)    |
| `LST.SUW.SAR`        | `7fd28076-fd5e-4d36-b051-bbf8a97b82db` | SAR (S)            |
| `LST.SUW.Automotive` | `f0a32655-00f9-4ecd-b43c-af4faed499b6` | Automotive EMC (A) |

### Azure AD 그룹 매핑 (의왕/평택)

| Azure AD 그룹        | 테넌트 ID                              | 팀 이름 (분류)     |
| -------------------- | -------------------------------------- | ------------------ |
| `LST.UIW.RF`         | `없음`                                 | General RF (W)     |
| `LST.PYT.Automotive` | `70115954-0ccd-45f0-87bd-03b2a3587569` | Automotive EMC (A) |

---

## 시험설비 이력카드 (UL-QP-18 Section 7.6-7.7)

시험실무자가 작성/갱신해야 하는 필수 항목:

| 항목                        | 설명                             |
| --------------------------- | -------------------------------- |
| 장비명(모델명)              | Equipment name (model name)      |
| 유형/고유 식별표시          | Type identification              |
| 제조업체/공급업체명         | Manufacturer, supplier           |
| 시방일치 여부               | Specification agreement          |
| 부속품/주요 기능            | Accessories and main functions   |
| 교정 필요 여부/주기         | Calibration necessity and period |
| 관련 소프트웨어/매뉴얼      | Related software and manuals     |
| 운영책임자(정, 부)          | Operating Officer                |
| 설치 위치/일자              | Installation location, date      |
| 이력(위치변동/교정/수리 등) | History records                  |

**상세 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)

---

## 코드 품질 규칙

> **목표**: 컴파일 타임에 실수를 방지하고, 코드 품질을 자동으로 강제

### 필수 (MUST)

1. **`any` 타입 사용 금지** - `unknown` 또는 구체적 타입 사용

   ```typescript
   // ❌ 금지
   const data: any = await fetch(...);

   // ✅ 권장
   const data: Equipment = await fetch(...).then(r => r.json());
   ```

2. **모든 타입은 SSOT에서 import**

   ```typescript
   // ❌ 금지: 로컬 타입 정의
   type UserRole = 'ADMIN' | 'USER'; // 잘못된 값!

   // ✅ 권장: schemas 패키지에서 import
   import { UserRole } from '@equipment-management/schemas';
   import { Permission } from '@equipment-management/shared-constants';
   ```

3. **API 파일에서 barrel import 금지** - 직접 import 사용

   ```typescript
   // ❌ 피해야 함 (bundle size 증가)
   import { equipmentApi, dashboardApi } from '@/lib/api';

   // ✅ 권장 (tree-shaking 가능)
   import equipmentApi from '@/lib/api/equipment-api';
   ```

4. **Server Component에서 같은 데이터 중복 fetch 금지** - React.cache() 사용
   ```typescript
   // ❌ Page()와 generateMetadata()에서 각각 호출
   // ✅ 권장: cache() 래핑
   import { cache } from 'react';
   const getEquipmentCached = cache(async (id: string) => {
     return equipmentApiServer.getEquipment(id);
   });
   ```

### 권장 (SHOULD)

1. **무거운 컴포넌트는 dynamic import 사용**

   ```typescript
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     loading: () => <ChartSkeleton />,
   });
   ```

2. **useQuery 훅은 관련 컴포넌트 내부에서 호출** (탭별 데이터 분리)

3. **복잡한 계산은 useMemo로 메모이제이션**

### ESLint로 강제되는 규칙

| 규칙                                 | 레벨  | 설명                       |
| ------------------------------------ | ----- | -------------------------- |
| `@typescript-eslint/no-explicit-any` | error | any 타입 금지              |
| `@typescript-eslint/no-unused-vars`  | error | 미사용 변수 금지           |
| `react-hooks/exhaustive-deps`        | error | useEffect 의존성 누락 금지 |
| `no-restricted-imports`              | error | SSOT 위반 import 차단      |

### lint-staged 설정

- **max-warnings=0**: 모든 warning이 커밋을 차단
- pre-commit hook에서 자동 실행

---

## ✅ Vercel/React Best Practices 체크리스트

> **참조**: Vercel Engineering 팀의 React 성능 최적화 가이드라인
> **스킬**: `/vercel-react-best-practices` 스킬에서 상세 규칙 확인 가능

### 🔴 CRITICAL: Request Waterfall 제거

```typescript
// ❌ 순차 실행 (Waterfall)
const user = await getUser();
const posts = await getPosts();
const comments = await getComments();

// ✅ 병렬 실행
const [user, posts, comments] = await Promise.all([getUser(), getPosts(), getComments()]);
```

### 🔴 CRITICAL: Bundle Size 최적화

| 규칙                    | 설명                                                     |
| ----------------------- | -------------------------------------------------------- |
| **Barrel import 금지**  | `from '@/lib/api'` 대신 `from '@/lib/api/equipment-api'` |
| **Dynamic import 사용** | 무거운 컴포넌트는 `next/dynamic`으로 지연 로딩           |
| **ssr: false**          | 클라이언트 전용 탭/모달 컴포넌트에 적용                  |

```typescript
// ✅ 탭 컴포넌트는 ssr: false (사용자 상호작용 후에만 로드)
const CalibrationHistoryTab = dynamic(
  () => import('./CalibrationHistoryTab'),
  { loading: () => <TabSkeleton />, ssr: false }
);
```

### 🟠 HIGH: Server-Side 성능

| 규칙                      | 설명                                                    |
| ------------------------- | ------------------------------------------------------- |
| **React.cache()**         | generateMetadata와 Page에서 동일 데이터 중복 fetch 방지 |
| **Server Component 우선** | 데이터 fetch는 Server Component에서                     |
| **initialData 패턴**      | Server에서 fetch → Client의 useQuery에 전달             |

```typescript
// ✅ Server Component에서 초기 데이터 fetch
export default async function EquipmentPage(props: PageProps) {
  const initialData = await equipmentApiServer.getEquipmentList();
  return <EquipmentListContent initialData={initialData} />;
}
```

### 🟡 MEDIUM: Re-render 최적화

| 규칙                 | 설명                                                |
| -------------------- | --------------------------------------------------- |
| **useState 통합**    | 관련 상태는 하나의 객체로 관리 (또는 useQuery 사용) |
| **useMemo 사용**     | 복잡한 계산은 메모이제이션                          |
| **useCallback 사용** | 자식에 전달하는 콜백 함수 안정화                    |

```typescript
// ❌ 여러 useState로 다중 리렌더링
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// ✅ React Query로 상태 통합 (단일 리렌더링)
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});
```

### 🟢 LOW: 접근성 (Accessibility)

| 규칙            | 설명                                             |
| --------------- | ------------------------------------------------ |
| **아이콘 버튼** | `aria-label` 필수, 아이콘에 `aria-hidden="true"` |
| **폼 입력**     | `htmlFor` + `id` 매칭                            |
| **포커스**      | `:focus-visible` 스타일 적용                     |
| **SR-only**     | 스크린 리더 전용 안내 텍스트                     |

```typescript
// ✅ 접근성 있는 아이콘 버튼
<Button variant="ghost" size="icon" aria-label="장비 상세로 돌아가기">
  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
</Button>

// ✅ 스크린 리더 전용 안내
<span className="sr-only">Enter를 눌러 검색하세요</span>
```

### 커밋 전 체크리스트

```
□ any 타입 사용하지 않음
□ Barrel import 사용하지 않음 (직접 import)
□ Server Component에서 데이터 fetch
□ 독립적 Promise는 Promise.all()로 병렬화
□ 무거운 컴포넌트는 dynamic import 사용
□ 탭/모달 컴포넌트에 ssr: false 적용
□ 아이콘 버튼에 aria-label 추가
□ ESLint/TypeScript 오류 0개
```

---

## ❌ 반복되는 실수 패턴 (절대 금지)

> **목표**: Claude Code가 같은 실수를 반복하지 않도록 명시적으로 금지 패턴 정의

### 1. NestJS Controller에서 `@Req() req: any` 사용

```typescript
// ❌ 금지 - any 타입 사용
@Get(':uuid')
async findOne(@Param('uuid') uuid: string, @Req() req: any) {
  const userId = req.user?.userId; // 타입 안전하지 않음
}

// ✅ 권장 - AuthenticatedRequest 타입 사용
import { AuthenticatedRequest } from '../../types/common.types';

@Get(':uuid')
async findOne(@Param('uuid') uuid: string, @Req() req: AuthenticatedRequest) {
  const userId = req.user.userId; // 타입 안전
}
```

### 2. Multer 파일에 `file: any` 사용

```typescript
// ❌ 금지 - any 타입 사용
async uploadFile(file: any) {
  const buffer = file.buffer;  // 타입 안전하지 않음
}

// ✅ 권장 - Express.Multer.File 타입 사용
async uploadFile(file: Express.Multer.File) {
  const buffer = file.buffer;  // 타입 안전
}
```

### 3. generateMetadata와 Page에서 중복 fetch

```typescript
// ❌ 금지 - 동일 API 2번 호출 (네트워크 낭비)
export async function generateMetadata(props: PageProps) {
  const equipment = await getEquipment(id);  // 1번째 호출
  return { title: equipment.name };
}

export default async function Page(props: PageProps) {
  const equipment = await getEquipment(id);  // 2번째 호출 (중복!)
  return <Client equipment={equipment} />;
}

// ✅ 권장 - React.cache()로 메모이제이션
import { cache } from 'react';

const getEquipmentCached = cache(async (id: string) => {
  return getEquipment(id);
});

export async function generateMetadata(props: PageProps) {
  const equipment = await getEquipmentCached(id);  // 캐시
  return { title: equipment.name };
}

export default async function Page(props: PageProps) {
  const equipment = await getEquipmentCached(id);  // 재사용 (호출 안함)
  return <Client equipment={equipment} />;
}
```

### 4. Drizzle ORM에서 `as any` 캐스팅

```typescript
// ❌ 금지 - as any로 타입 체크 우회
const [record] = await db
  .insert(table)
  .values({
    name: 'test',
    status: 'active',
  } as any)
  .returning();

// ✅ 권장 - 올바른 타입으로 값 전달
const [record] = await db
  .insert(table)
  .values({
    name: 'test',
    status: 'active', // enum 타입이면 스키마에서 추론됨
  })
  .returning();
```

### 5. 로컬에서 타입/Enum 재정의

```typescript
// ❌ 금지 - 로컬에서 enum 재정의 (SSOT 위반)
type UserRole = 'ADMIN' | 'USER' | 'MANAGER'; // 잘못된 값!

// ✅ 권장 - 중앙 패키지에서 import
import { UserRole } from '@equipment-management/schemas';
```

### 6. optional 파라미터에 `| undefined` 누락

```typescript
// ❌ 금지 - req가 optional인데 타입에 반영 안됨
async update(@Req() req?: any) {
  const userId = req.user?.userId;  // req가 undefined일 수 있음
}

// ✅ 권장 - optional 파라미터 명시
async update(@Req() req?: AuthenticatedRequest) {
  const userId = req?.user?.userId;  // null 안전 체인
}
```

### 7. Optimistic Locking 없이 상태 변경

```typescript
// ❌ 금지 - version 체크 없이 UPDATE (Lost Update 위험)
async approve(uuid: string, approverId: string) {
  await db.update(checkouts)
    .set({ status: 'approved', approvedBy: approverId })
    .where(eq(checkouts.id, uuid));
  // → 다른 사용자의 변경사항 덮어쓰기 가능!
}

// ✅ 권장 - CAS 패턴 사용 (VersionedBaseService)
async approve(uuid: string, approverId: string, currentVersion: number) {
  return this.updateWithVersion(
    checkouts,
    uuid,
    currentVersion,
    { status: 'approved', approvedBy: approverId },
    'checkout'
  );
  // → WHERE version = ? 조건으로 동시성 제어
  // → 0 rows affected? → 409 Conflict
}
```

### 8. 수동 캐시 조작 (스냅샷 롤백)

```typescript
// ❌ 금지 - 에러 시 스냅샷 롤백 (또 다른 stale state 생성)
useMutation({
  onMutate: async (variables) => {
    const previousData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, optimisticUpdate(previousData, variables));
    return { previousData };
  },
  onError: (error, variables, context) => {
    // ❌ 스냅샷 복원 - stale state로 되돌림!
    queryClient.setQueryData(queryKey, context.previousData);
  },
});

// ✅ 권장 - 에러 시 서버 재검증 (invalidateQueries)
useMutation({
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, optimisticUpdate(previousData, variables));
    return { previousData };
  },
  onError: () => {
    // ✅ 서버에서 최신 데이터 가져오기
    queryClient.invalidateQueries({ queryKey });
  },
});
```

---

## 핵심 규칙

### 1. 승인 프로세스 공통 규칙

```typescript
// 반려 시 사유 필수 (최소 10자)
if (action === 'reject' && (!reason || reason.length < 10)) {
  throw new BadRequestException('반려 사유는 10자 이상 필수입니다');
}

// 다중 승인자 선착순 처리 (Optimistic Locking)
const updated = await db
  .update(requests)
  .set({ status: 'approved', approvedBy: userId, version: currentVersion + 1 })
  .where(and(eq(requests.uuid, uuid), eq(requests.version, currentVersion)));

if (updated.rowCount === 0) {
  throw new ConflictException('이미 처리된 요청입니다');
}
```

### 2. 팀별/사이트별 권한 제한

- EMC팀은 RF팀 장비 반출 신청/승인 불가
- 장비 등록 시 관리 팀(teamId) 및 시험소(site) 필수
- 조회는 전체 가능, 수정/승인은 권한 범위 내에서만

### 3. 교정 기록 등록/승인 분리 원칙 (엄격한 정책)

**등록 권한:**

- ✓ 시험실무자(test_engineer): 교정 기록 등록 가능 → 기술책임자 승인 필요
- ❌ 기술책임자(technical_manager): 등록 불가, 승인만 가능
- ❌ 시험소장(lab_manager): 등록 불가 (교정만 예외적으로 제한)

**승인 권한:**

- ✓ 기술책임자(technical_manager): 교정 기록 승인
- ✓ 시험소장(lab_manager): 교정 기록 승인

**정책 배경:**

- **등록/승인 완전 분리**: 견제 구조를 통한 품질 보증 (UL-QP-18)
- **시험소장 제한**: 교정 관리는 다른 기능과 달리 시험소장도 등록 불가
- **이중 검증**: 실무자가 등록, 책임자가 검증하는 2단계 프로세스 강제

> **원칙**: 교정 기록은 등록자와 승인자를 완전히 분리하여 견제 구조 유지 (UL-QP-18)

---

## 주요 기능별 프로세스

### 장비 등록/수정 (2단계 승인)

```
시험실무자 요청 → pending_approval → 기술책임자 승인 → approved
                                   ↘ 반려 → rejected
```

**예외**: 시험소 관리자(lab_manager)는 자체 승인 가능

### 교정 기록 등록 (엄격한 정책)

```
시험실무자 등록: pending_approval → 기술책임자/시험소장 승인 (approverComment 필수)
```

> ⚠️ **주의**: 교정 기록은 시험실무자만 등록 가능. 시험소장도 등록 불가 (등록/승인 완전 분리)

### 점검 프로세스 (UL-QP-18 Section 8)

- **중간점검**: 교정검사 신뢰성 확인용, 중간점검표(UL-QP-18-03) 기록
- **자체점검**: 비교정 대상 장비, 자체점검표(UL-QP-18-05) 기록

**상세 점검/교정**: [references/inspection-calibration.md](references/inspection-calibration.md)

### 반출/반입 프로세스 (모든 목적 1단계 승인 통합)

**모든 목적 (교정/수리/시험소간 대여)**:

```
pending → [기술책임자 승인] → approved → checked_out → returned → return_approved
```

**시험소간 대여 추가 사항**: 반입 시 양측 확인 필요

**상세 승인 프로세스**: [references/approval-processes.md](references/approval-processes.md)

---

## 부적합 장비 관리 (UL-QP-18 Section 9)

### 상태 흐름

```
[이상 발견] → open (장비: non_conforming, 사용중지 식별표)
    ↓
analyzing (원인 분석)
    ↓
corrected (조치 완료)
    ↓
[기술책임자 승인] → closed (장비: available)
```

### 필수 조치 사항

1. **사용중지 식별표** 부착 또는 격리 보관
2. 기술책임자에게 **즉시 보고**
3. 부적합 발생일 추적하여 **영향도 평가**
4. 필요시 **재시험 실시**
5. 시험설비 이력카드에 **기록**

---

## 소프트웨어 관리 (UL-QP-18 Section 14)

### 유효성 확인 (UL-QP-18-09)

- 데이터 수집/처리/제어용 소프트웨어 도입 전 유효성 확인 필수
- 공급자 검증 기록으로 대체 가능
- 자체 개발 소프트웨어: 기술책임자가 유효성 확인 실시

### 소프트웨어 관리대장 (UL-QP-18-07)

```typescript
{
  softwareName: string;
  version: string;
  purpose: string;            // 용도 (데이터 수집/처리/제어/기록)
  equipmentId?: string;       // 관련 장비
  validatedBy: string;        // 유효성 확인자
  validatedAt: Date;
  validationRecord: string;   // 검증 기록
}
```

---

## 보정계수 관리 (UL-QP-18 Section 10.4-10.6)

### 적용 규칙 (보정인자 및 파라미터 관리대장 UL-QP-18-11)

- 교정기관 제시 방법 우선
- 별도 방법 미제시 시: **선형 보간법** 또는 **큰 쪽 보정값** 활용
- 기술책임자가 최신화 관리

### 보정 방법 코드

```typescript
enum CorrectionMethodEnum {
  LINEAR_INTERPOLATION = 'linear_interpolation', // 선형 보간법
  HIGHER_VALUE = 'higher_value', // 큰 쪽 보정값
  CALIBRATION_AGENCY = 'calibration_agency', // 교정기관 제시
}
```

---

## 기록 보존 연한 (UL-QP-18 Section 15)

| 양식                | 양식번호    | 보존연한 |
| ------------------- | ----------- | -------- |
| 시험설비 관리대장   | UL-QP-18-01 | **영구** |
| 시험설비 이력카드   | UL-QP-18-02 | **영구** |
| 중간 점검표         | UL-QP-18-03 | 5년      |
| 자체 점검표         | UL-QP-18-05 | 5년      |
| 장비 반·출입 확인서 | UL-QP-18-06 | 5년      |
| 소프트웨어 관리대장 | UL-QP-18-07 | 5년      |
| 보정인자 관리대장   | UL-QP-18-11 | 5년      |

---

## 데이터베이스 스키마

### 장비 (equipment)

```typescript
{
  id: string;                         // uuid 타입 기본 키 (Drizzle ORM 표준)
  name: string;
  managementNumber: string;           // 관리번호 (XXX-XYYYY)
  site: 'suwon' | 'uiwang' | 'pyeongtaek';
  siteCode: 'SUW' | 'UIW' | 'PYT';
  classificationCode: 'E' | 'R' | 'W' | 'S' | 'A' | 'P';
  teamId: string;
  status: EquipmentStatusEnum;
  approvalStatus: ApprovalStatusEnum;

  // 교정 관련
  calibrationMethod: 'external_calibration' | 'self_inspection' | 'not_applicable';
  calibrationRequired: boolean;       // 교정 필요 여부
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  calibrationCycle?: number;          // 교정 주기 (월)

  // 점검 관련
  lastIntermediateCheckDate?: Date;   // 마지막 중간점검일
  lastSelfCheckDate?: Date;           // 마지막 자체점검일
  checkCycle?: number;                // 점검 주기 (월)

  // 공용장비 관련
  isShared: boolean;
  sharedSource?: 'safety_lab' | 'external';

  // 미관리 장비 플래그
  isUnmanaged: boolean;               // 미관리 장비 여부
  unmanagedReason?: string;           // 미관리 사유

  // 운영책임자
  primaryOperatorId: string;          // 운영책임자(정)
  secondaryOperatorId?: string;       // 운영책임자(부)

  // 첨부파일
  attachmentPath?: string;            // 검수보고서/이력카드 파일
  manualLocation?: string;            // 매뉴얼 보관 위치
}
```

### 장비 상태 Enum (SSOT)

> **⚠️ 중요**: 장비 상태 enum과 라벨은 `packages/schemas/src/enums.ts`에서 **단일 소스로 관리**됩니다.
> 프론트엔드 스타일은 `apps/frontend/lib/constants/equipment-status-styles.ts`에서 정의합니다.

```typescript
// packages/schemas/src/enums.ts (SSOT - Single Source of Truth)
type EquipmentStatus =
  | 'available' // 사용 가능
  | 'in_use' // 사용 중
  | 'checked_out' // 반출 중
  | 'calibration_scheduled' // 교정 예정
  | 'calibration_overdue' // 교정 기한 초과
  | 'non_conforming' // 부적합
  | 'spare' // 여분
  | 'retired'; // 폐기

// 한글 라벨 (packages/schemas)
const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  in_use: '사용 중',
  checked_out: '반출 중',
  calibration_scheduled: '교정 예정',
  calibration_overdue: '교정 기한 초과',
  non_conforming: '부적합',
  spare: '여분',
  retired: '폐기',
};
```

**상태 표시 규칙:**

- `calibration_scheduled`, `calibration_overdue`: 기본 상태 배지는 **"사용 가능"**으로 표시, 교정 상태는 **별도 D-day 배지**로 표시
- `checked_out`: 반출 레코드(checkouts 테이블)의 purpose 필드로 구분
- `spare`: 여분 장비로 따로 관리하지 않는 상태

---

## 장비 필터 관리 (SSOT)

### ⚠️ 중요: 과거 발생한 버그

**2026-01-30 발생한 버그**: 서버 컴포넌트(page.tsx)에서 URL searchParams를 파싱할 때 새 필터 파라미터를 누락하여 필터가 작동하지 않는 문제 발생.

**원인**: 클라이언트 훅과 서버 컴포넌트가 각각 다른 파싱 로직을 사용

**해결책**: `equipment-filter-utils.ts` 공유 유틸리티 생성

장비 목록 필터는 **공유 유틸리티**를 사용하여 클라이언트와 서버 간 일관성을 유지합니다.

### 🔴 절대 금지

```
❌ page.tsx에서 직접 searchParams 파싱하지 말 것
❌ useEquipmentFilters.ts에서 직접 필터 변환 로직 작성하지 말 것
❌ 새 필터 추가 시 equipment-filter-utils.ts 수정 없이 다른 파일만 수정하지 말 것
```

### ✅ 올바른 방법

```
✅ 항상 equipment-filter-utils.ts의 공유 함수 사용
✅ parseEquipmentFiltersFromSearchParams() - URL → UI 필터
✅ convertFiltersToApiParams() - UI 필터 → API 파라미터
✅ 새 필터 추가 시 equipment-filter-utils.ts 먼저 수정
```

### 🔴 필터 추가 시 체크리스트

**새로운 필터를 추가할 때 아래 파일들을 순서대로 수정하세요:**

| 순서 | 파일                                                       | 설명                                                                     |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | `lib/utils/equipment-filter-utils.ts`                      | **SSOT** - `UIEquipmentFilters`, `ApiEquipmentFilters` 타입 및 변환 함수 |
| 2    | `hooks/useEquipmentFilters.ts`                             | `EquipmentFilters` 타입 (필요시)                                         |
| 3    | `components/equipment/EquipmentFilters.tsx`                | UI 컴포넌트 (Select, 옵션 등)                                            |
| 4    | `packages/schemas/src/equipment.ts`                        | 백엔드 Zod 스키마 (필요시)                                               |
| 5    | `backend/src/modules/equipment/dto/equipment-query.dto.ts` | 백엔드 DTO                                                               |
| 6    | `backend/src/modules/equipment/equipment.service.ts`       | 백엔드 쿼리 로직                                                         |

### 핵심 파일: `equipment-filter-utils.ts`

```typescript
// ✅ SSOT: 클라이언트 훅과 서버 컴포넌트가 동일한 변환 로직 사용
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/equipment-filter-utils';

// Server Component (page.tsx)
const uiFilters = parseEquipmentFiltersFromSearchParams(searchParams);
const apiQuery = convertFiltersToApiParams(uiFilters);

// Client Hook (useEquipmentFilters.ts)
const queryFilters = useMemo(() => {
  return convertFiltersToApiParams(filters);
}, [filters]);
```

### 필터 변환 흐름

```
URL 파라미터 (사용자 친화적)     API 파라미터 (백엔드)
─────────────────────────────   ─────────────────────
isShared=shared            →    isShared=true
isShared=normal            →    isShared=false
calibrationDueFilter=due_soon →  calibrationDue=30
calibrationDueFilter=overdue  →  calibrationOverdue=true
calibrationDueFilter=normal   →  calibrationDueAfter=30
```

---

## 프론트엔드 개발 패턴

> **상세 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)

### 핵심 원칙

#### 1. Server Component 우선

| 상황               | Server  | Client  |
| ------------------ | ------- | ------- |
| 데이터 fetching    | ✅ 권장 | 가능    |
| 정적 UI 렌더링     | ✅ 권장 | 가능    |
| 이벤트 핸들러      | ❌ 불가 | ✅ 필수 |
| useState/useEffect | ❌ 불가 | ✅ 필수 |

#### 2. Server/Client 분리 패턴

```typescript
// ✅ 권장: Server에서 데이터 fetch → Client로 전달
// app/equipment/page.tsx (Server Component)
export default async function EquipmentPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialData = await equipmentApiServer.getEquipmentList(searchParams);

  return <EquipmentListClient initialData={initialData} />;
}

// components/equipment/EquipmentListClient.tsx ('use client')
export function EquipmentListClient({ initialData }) {
  const { data } = useQuery({
    queryKey: ['equipmentList'],
    initialData,  // ← Server 데이터로 hydration
  });
}
```

### 캐시 전략 (TanStack Query)

#### staleTime 계층화 원칙

**파일**: `apps/frontend/lib/api/query-config.ts`

| Resource Type           | staleTime         | Rationale                  | Example Queries                      |
| ----------------------- | ----------------- | -------------------------- | ------------------------------------ |
| Dashboard/Notifications | 30s (SHORT)       | 자주 변경, 실시간성 중요   | Dashboard stats, notification counts |
| Detail Pages            | 2min (MEDIUM)     | 자주 조회, 적당한 실시간성 | Equipment detail, checkout detail    |
| List Pages              | 5min (LONG)       | 필터 조합 다양, 캐시 효율  | Equipment list, checkout list        |
| Rarely Changing         | 10min (VERY_LONG) | 드물게 변경                | Calibration history                  |
| Reference Data          | 30min (REFERENCE) | 거의 불변                  | Teams, sites, status codes           |

#### Mutation vs Read-only Page 전략

**Mutation이 있는 페이지** (상세 페이지, 승인 페이지):

```typescript
// ✅ Server Component props + useQuery 연동 (SSOT)
const { data: equipment } = useQuery({
  queryKey: queryKeys.equipment.detail(id),
  queryFn: () => equipmentApi.getEquipment(id),
  initialData: serverPropsEquipment, // ← Server Component 초기 데이터
  staleTime: 0, // ← mutation 후 즉시 반영
});

// Mutation 후 자동 refetch
onSuccess: async () => {
  await queryClient.refetchQueries({ queryKey: queryKeys.equipment.detail(id) });
};
```

**Read-only Page** (목록 페이지):

```typescript
// ✅ 긴 staleTime으로 캐시 활용
const { data: equipmentList } = useQuery({
  queryKey: queryKeys.equipment.list(filters),
  queryFn: () => equipmentApi.getEquipmentList(filters),
  staleTime: CACHE_TIME.LONG, // ← 5분
});
```

#### Prefetching 전략

```typescript
// ✅ 목록 → 상세 이동 시 prefetch
<Link
  href={`/equipment/${equipment.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.equipment.detail(equipment.id),
      queryFn: () => equipmentApi.getEquipment(equipment.id),
    });
  }}
>
  {equipment.name}
</Link>
```

### 필수 규칙

1. **params/searchParams는 Promise** - 반드시 await 사용
2. **useActionState** 사용 (useFormState 아님)
3. **Form action은 void 반환** - revalidatePath 사용
4. **any 타입 금지**
5. **Mutation 페이지는 staleTime: 0** - 즉시 UI 반영
6. **Read-only 페이지는 적절한 staleTime** - 캐시 효율

```typescript
// ✅ Next.js 16 올바른 패턴
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  const equipment = await equipmentApiServer.getEquipment(id);
  return <EquipmentDetailClient equipment={equipment} />;
}
```

### 장비 상태 스타일 SSOT

프론트엔드에서 장비 상태 표시 시 **반드시** 중앙화된 스타일을 사용합니다.

#### 스타일 조회 (권장)

```typescript
import { getEquipmentStatusStyle } from '@/lib/constants/equipment-status-styles';

// 컴포넌트에서 사용
const style = getEquipmentStatusStyle(equipment.status);
<Badge className={style.className}>{style.label}</Badge>
```

#### 교정 상태 표시 여부 확인

```typescript
import { shouldDisplayCalibrationStatus } from '@/lib/constants/equipment-status-styles';

// 폐기/부적합/여분 장비는 D-day 배지 표시 안함
if (shouldDisplayCalibrationStatus(equipment.status)) {
  // D-day 배지 렌더링
}
```

#### SSOT 파일 구조

| 파일                                                     | 용도                                    |
| -------------------------------------------------------- | --------------------------------------- |
| `packages/schemas/src/enums.ts`                          | Enum 값 + 한글 라벨 정의 (SSOT)         |
| `apps/frontend/lib/constants/equipment-status-styles.ts` | UI 스타일 정의 (className, borderColor) |

> **❌ 금지**: 컴포넌트 내에서 상태별 라벨/스타일을 인라인으로 정의하지 마세요.
> **✅ 권장**: 항상 `getEquipmentStatusStyle()` 헬퍼 함수를 사용하세요.

### 라우트 파일 패턴

| 파일            | 용도                                     | 예시 위치                          |
| --------------- | ---------------------------------------- | ---------------------------------- |
| `loading.tsx`   | 라우트 전환 시 로딩 UI                   | `app/equipment/loading.tsx`        |
| `error.tsx`     | 라우트별 에러 처리 (`'use client'` 필수) | `app/equipment/error.tsx`          |
| `not-found.tsx` | 404 처리 (`notFound()` 호출 시)          | `app/equipment/[id]/not-found.tsx` |
| `layout.tsx`    | 공통 레이아웃 + 메타데이터 템플릿        | `app/equipment/layout.tsx`         |

### generateMetadata 패턴

```typescript
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const equipment = await equipmentApiServer.getEquipment(id);
    return { title: `${equipment.name} - 장비 상세` };
  } catch {
    return { title: '장비 상세' }; // 폴백
  }
}
```

---

## Server Component Props vs Client Cache 패턴 (SSOT)

### ⚠️ 중요: 과거 발생한 버그

**2026-01-30 발생한 버그**: 사고이력 탭에서 "부적합으로 등록" 후 상태 뱃지가 즉시 반영되지 않음 (새로고침 후에야 반영)

**원인**: Server Component에서 props로 받은 데이터는 정적이어서, mutation 후에도 `router.refresh()`가 완료될 때까지 이전 값 유지

**해결책**: `useEquipmentWithInitialData` 훅으로 Server Component 초기 데이터와 React Query 캐시 연동

### 문제 패턴

```
Server Component → props → Client Component
                           └─ mutation 후 props는 변하지 않음!

React Query Cache → refetchQueries() → 캐시 갱신됨
                                        └─ 하지만 props를 구독하지 않는 컴포넌트는 반영 안됨
```

### 🔴 절대 금지

```
❌ Server Component props를 그대로 렌더링에 사용 (mutation이 있는 페이지에서)
❌ mutation 후 router.refresh()만 의존 (비동기 완료 전까지 stale UI)
❌ 각 컴포넌트에서 useQuery 직접 작성 (SSOT 위반)
```

### ✅ 올바른 방법

```typescript
// ✅ SSOT: hooks/use-equipment.ts의 공유 훅 사용
import { useEquipmentWithInitialData } from '@/hooks/use-equipment';

export function EquipmentHeader({ equipment: initialEquipment }: Props) {
  // Server Component 초기 데이터를 initialData로, 이후 캐시 구독
  const { data: equipment } = useEquipmentWithInitialData(initialEquipment);

  // equipment.status는 mutation 후 즉시 반영됨
  const statusConfig = getStatusConfig(equipment.status);
}
```

### SSOT 훅 사용 가이드

**파일 위치**: `apps/frontend/hooks/use-equipment.ts`

```typescript
/**
 * useEquipmentWithInitialData
 *
 * Server Component 초기 데이터와 Client-Side React Query 캐시를 연동합니다.
 * - initialData: SSR 데이터 → 초기 렌더링에 사용, SEO 최적화
 * - staleTime: 0 → 캐시 갱신 시 즉시 UI 반영
 * - queryKey: ['equipment', id] → mutation의 refetchQueries와 일치 필수
 */
export function useEquipmentWithInitialData(initialData: Equipment) {
  const equipmentId = String(initialData.id);
  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    initialData,
    staleTime: 0,
  });
}
```

### 적용 대상 컴포넌트

| 컴포넌트                | 적용 여부 | 이유                                       |
| ----------------------- | --------- | ------------------------------------------ |
| `EquipmentHeader`       | ✅ 적용   | 상태 뱃지가 mutation 후 즉시 반영되어야 함 |
| `EquipmentDetailClient` | ⚠️ 검토   | 하위 탭에서 mutation이 있으면 적용 필요    |
| `EquipmentTable` (목록) | ❌ 불필요 | 목록은 별도 쿼리 키 사용                   |

### Mutation 측에서의 쿼리 키 일치

```typescript
// IncidentHistoryTab.tsx - mutation onSuccess
onSuccess: async () => {
  await queryClient.refetchQueries({
    queryKey: ['equipment', equipmentId], // ← 이 키가 일치해야 함
    type: 'active',
  });
};
```

> **중요**: `queryKey`가 `useEquipmentWithInitialData`의 키와 **정확히 일치**해야 캐시가 갱신됩니다.

---

## E2E 테스트

> **중요**: Playwright E2E 테스트는 Setup Project + storageState 기반 인증을 사용합니다.

### 아키텍처

1. **`auth.setup.ts`** (Setup Project): 5개 역할에 대해 browser-native 로그인 수행 → `.auth/*.json` 저장
2. **`auth.fixture.ts`**: storageState 파일 로드 → 역할별 인증된 Page fixture 제공
3. **`playwright.config.ts`**: `setup` project + 모든 browser project에 `dependencies: ['setup']`

### 핵심 규칙

**절대 금지**:

- ❌ spec 파일에서 직접 로그인 (`loginAs`, `signIn`, `page.goto('/login')`)
- ❌ 수동 쿠키 파싱 (`Set-Cookie` 헤더 split)
- ❌ `waitForTimeout` (시간 기반 대기)
- ❌ `localStorage`에 토큰 저장

**권장 사항**:

- ✅ `auth.fixture.ts`의 fixture 사용 (`testOperatorPage`, `techManagerPage` 등)
- ✅ 새 역할 추가 시 `auth.setup.ts` ROLES + `auth.fixture.ts` STORAGE_STATE에 추가
- ✅ locator 기반 assertion (`waitForURL`, `expect(locator).toBeVisible()`)

### 테스트 작성 예제

```typescript
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Feature Name', () => {
  test('TC-01: 기술책임자가 승인한다', async ({ techManagerPage: page }) => {
    await page.goto('/target-page');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '승인' }).click();
    await expect(page.getByText('성공')).toBeVisible();
  });
});
```

**상세 가이드**: [references/e2e-test-auth.md](references/e2e-test-auth.md)

---

## API 엔드포인트 패턴

### CRUD 기본

```
GET    /[resource]           목록 조회 (필터 지원)
GET    /[resource]/:uuid     상세 조회
POST   /[resource]           생성 (pending_approval 상태)
PATCH  /[resource]/:uuid     수정 (draft 상태만)
DELETE /[resource]/:uuid     삭제 (draft 상태만)
```

### 승인 관련

```
PATCH  /[resource]/:uuid/approve   승인
PATCH  /[resource]/:uuid/reject    반려 (reason 필수)
DELETE /[resource]/:uuid/cancel    취소 (pending 상태만)
```

---

## 검증 명령어

```bash
pnpm tsc --noEmit   # 타입 체크
pnpm test           # 테스트
pnpm db:generate    # 마이그레이션 생성
pnpm db:migrate     # 마이그레이션 실행
pnpm dev            # 개발 서버
```

---

## 참조 문서

### 스킬 내 참조

- **용어 정의**: [references/terminology.md](references/terminology.md)
- **역할 체계 상세**: [references/roles.md](references/roles.md)
- **관리번호/위치코드**: [references/management-numbers.md](references/management-numbers.md)
- **시험설비 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)
- **점검/교정 프로세스**: [references/inspection-calibration.md](references/inspection-calibration.md)
- **승인 프로세스 상세**: [references/approval-processes.md](references/approval-processes.md)
- **프론트엔드 UI 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)
- **인증 아키텍처**: [references/auth-architecture.md](references/auth-architecture.md) - NextAuth 토큰 관리, localStorage 금지 정책
- **E2E 테스트 인증**: [references/e2e-test-auth.md](references/e2e-test-auth.md) - Playwright E2E 테스트에서 NextAuth 인증 처리, 잘못된 접근 vs 올바른 접근

### 아키텍처 패턴 파일

**Backend Patterns:**

- **Optimistic Locking**: `apps/backend/src/common/base/versioned-base.service.ts` - CAS 구현, updateWithVersion 메서드
- **Token Refresh**: `apps/backend/src/modules/auth/auth.service.ts` - Access/Refresh Token 발급 로직
- **Unified Error Handling**: `apps/backend/src/common/filters/error.filter.ts` - GlobalExceptionFilter

**Frontend Patterns:**

- **Optimistic Update Hook**: `apps/frontend/hooks/use-optimistic-mutation.ts` - 서버 재검증 전략
- **Server/Client API**: `apps/frontend/lib/api/server-api-client.ts`, `apps/frontend/lib/api/api-client.ts` - 환경별 API 클라이언트
- **Cache Invalidation**: `apps/frontend/lib/api/cache-invalidation.ts` - 교차 엔티티 무효화 헬퍼
- **Query Keys Factory**: `apps/frontend/lib/api/query-config.ts` - 중앙화된 쿼리 키 관리
- **Error Mapping**: `apps/frontend/lib/errors/equipment-errors.ts` - Backend code → Frontend EquipmentErrorCode 매핑

### 연관 스킬

- **Next.js 16 개발 가이드**: `/nextjs-16` - 프론트엔드 UI 개발 시 함께 사용

### 프로젝트 문서

- **장비 관리 절차서**: `/docs/development/장비관리절차서.md` (UL-QP-18)
- **API 표준**: `/docs/development/API_STANDARDS.md`
- **인증 아키텍처 상세**: `/docs/development/AUTH_ARCHITECTURE.md`
- **E2E 테스트 인증 가이드**: `/docs/development/E2E_TEST_AUTH_GUIDE.md` - Playwright E2E 테스트 인증 완벽 가이드
- **개발 환경 설정**: `/docs/development/DEV_SETUP.md` - 개발 환경 구축 가이드, 트러블슈팅
- **팀 확장 로드맵**: `/docs/development/TEAM_EXPANSION_ROADMAP.md` - Phase 1→2→3 단계별 전환 가이드
