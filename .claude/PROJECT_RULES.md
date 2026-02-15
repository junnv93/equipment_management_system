# 프로젝트 규칙 (Claude Code 필독)

**목적**: AI 어시스턴트가 동일한 실수를 반복하지 않도록 프로젝트 핵심 규칙 정의

---

## 🚨 중요: 이 파일을 먼저 읽으세요!

코드 작성, 테스트, DB 작업 전에 **반드시 이 파일을 읽고** 규칙을 준수하세요.

---

## 📊 프로젝트 컨텍스트

### 개발 환경

- **개발자**: 1인 개발자
- **개발 + 테스트**: 동일인
- **DB 환경**: **단일 DB (통합)**

### 핵심 결정 사항

```
✅ 개발 DB = 테스트 DB (통합됨)
✅ 포트: 5432
✅ 컨테이너: postgres_equipment
✅ 데이터베이스명: equipment_management
```

---

## 🔴 절대 금지 사항

### 1. 테스트 DB 언급 금지

```bash
❌ postgres_equipment_test
❌ localhost:5434
❌ equipment_management_test
❌ "테스트 DB와 개발 DB를 분리해야..."
```

**이유**:

- 1인 개발 환경
- 개발 데이터 중요하지 않음
- 불필요한 복잡도 제거됨
- **2026-01-22에 통합 완료**

### 2. DB 분리 제안 금지

```
❌ "테스트 격리를 위해 별도 DB를 사용하세요"
❌ "개발 데이터 보호를 위해 테스트 DB 필요"
❌ "두 개의 DB를 관리하면 더 안전합니다"
```

**대신 해야 할 것**:

```
✅ "단일 DB를 사용합니다"
✅ "pnpm db:push로 스키마를 동기화합니다"
✅ "테스트는 개발 DB에서 실행됩니다"
```

### 3. 복잡한 DB 관리 스크립트 작성 금지

```bash
❌ 두 DB에 마이그레이션 적용하는 스크립트
❌ DB별 환경 변수 분기 처리
❌ "모든 DB에 적용" 같은 표현
```

---

## ✅ 필수 규칙

### 1. DB 관련 작업

#### 스키마 변경 시

```bash
# 1. 스키마 파일 수정
vim packages/db/src/schema/equipment.ts

# 2. 단일 DB에 적용
pnpm db:push

# 끝!
```

#### 환경 변수

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/equipment_management
```

**절대로 5434 포트나 \_test 데이터베이스 사용하지 말 것!**

### 2. 테스트 관련 작업

#### E2E 테스트

```bash
# 개발 DB를 사용하여 테스트 실행
pnpm test:e2e
```

#### 테스트 DB 언급 방지

```
❌ "테스트 DB 초기화"
✅ "DB 초기화"

❌ "개발 DB와 테스트 DB 동기화"
✅ "DB 스키마 동기화"

❌ "두 DB에 적용"
✅ "DB에 적용"
```

### 3. 문서화

#### 올바른 표현

```markdown
# ✅ 올바름

- 데이터베이스: PostgreSQL (포트 5432)
- DB 관리: `pnpm db:push`
- 환경: 개발 + 테스트 통합 환경

# ❌ 잘못됨

- 개발 DB: 5432, 테스트 DB: 5434
- 두 DB를 동기화하려면...
- 테스트 격리를 위해 별도 DB 사용
```

---

## 🏗️ 현대적 아키텍처 패턴 (2026-02)

### 개요

이 섹션은 2026-02 현재 코드베이스에서 **실제 운영 중인** 12가지 아키텍처 패턴을 문서화합니다. 이 패턴들은 프로덕션에서 검증되었지만 기존 문서에 누락되어 있었습니다.

> **목표**: 시니어급 사고력으로 시니어급 코드를 작성할 수 있도록 "왜(Why)"를 중심으로 설명

---

### 백엔드 패턴

#### 1. Optimistic Locking (CAS - Compare-And-Swap)

**핵심 파일**: `apps/backend/src/common/base/versioned-base.service.ts`

**문제**: 다중 사용자가 동시에 같은 엔티티를 수정할 때 나중 요청이 먼저 요청을 덮어쓰는 Lost Update 문제

**해결**: 모든 엔티티에 `version` 필드 추가 → UPDATE 시 WHERE 절에 `version = expectedVersion` 조건 추가

```typescript
// ✅ 올바른 패턴 - VersionedBaseService 상속
export class EquipmentService extends VersionedBaseService {
  async approve(uuid: string, approverId: string, currentVersion: number) {
    return this.updateWithVersion(
      equipment,
      uuid,
      currentVersion,
      { status: 'approved', approvedBy: approverId },
      'equipment'
    );
    // → UPDATE equipment SET version = version + 1, ...
    //   WHERE id = ? AND version = ?
    // → 0 rows affected? → 409 Conflict (code: 'VERSION_CONFLICT')
  }
}

// ❌ 잘못된 패턴 - version 체크 없이 UPDATE
async approve(uuid: string) {
  await db.update(equipment)
    .set({ status: 'approved' })
    .where(eq(equipment.id, uuid));
  // → 다른 사용자의 변경사항 덮어쓰기 가능!
}
```

**적용 엔티티**: equipment, checkouts, calibrations, non_conformances, disposal_requests, equipment_imports, software_history

**DTO 규칙**: 모든 상태 변경 DTO는 `versionedSchema` 포함 필수

```typescript
// common/dto/base-versioned.dto.ts
export const versionedSchema = { version: z.number().int().positive() };

// 사용 예
export const updateEquipmentSchema = z.object({
  name: z.string().min(1),
  ...versionedSchema, // ← version 필드 추가
});
```

**캐시 일관성**: CAS 실패(409) 시 detail 캐시 반드시 삭제

```typescript
// ✅ 올바른 패턴 - 409 시 캐시 무효화
catch (error) {
  if (error instanceof ConflictException) {
    this.cacheService.delete(detailCacheKey); // stale cache 방지
  }
  throw error;
}
```

#### 2. Token Refresh Architecture

**핵심 파일**: `apps/backend/src/modules/auth/auth.service.ts`

**설계 원칙**: Access Token 짧게(15분) + Refresh Token 길게(7일) → 보안과 UX 균형

```typescript
// JWT Payload 구조
{
  userId: string,
  role: string,
  type: 'access' | 'refresh', // ← 토큰 타입 구분
  iat: number,
  exp: number,
  absoluteExpiry: number, // ← 절대 만료 (30일)
}
```

**자동 갱신 로직** (`apps/frontend/app/api/auth/[...nextauth]/auth-config.ts`):

```typescript
// ✅ JWT 콜백에서 만료 60초 전 자동 갱신
jwt: async ({ token, user }) => {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = token.accessTokenExpires - now;

  if (timeUntilExpiry < 60) {
    // 60초 이내 만료 예정 → refresh
    const newAccessToken = await refreshAccessToken(token.refreshToken);
    return { ...token, accessToken: newAccessToken, accessTokenExpires: ... };
  }
  return token;
}
```

**SessionProvider 설정**:

```typescript
// ✅ 5분마다 JWT 콜백 트리거 (자동 갱신 체크)
<SessionProvider refetchInterval={5 * 60}>
```

**에러 전파**:

```typescript
// JWT 콜백에서 에러 발생 시
return { ...token, error: 'RefreshAccessTokenError' };

// → AuthSync에서 감지 → 자동 signOut
if (session?.error === 'RefreshAccessTokenError') {
  await signOut();
}
```

#### 3. Server-Driven UI

**핵심 개념**: 백엔드가 각 엔티티의 가능한 액션을 계산하여 프론트엔드에 전달 → UI 로직 중복 제거

**구조**:

```typescript
// Backend Response
{
  id: '123',
  status: 'pending',
  availableActions: ['approve', 'reject', 'cancel'], // ← 백엔드 계산
}

// Frontend - 단순 렌더링만
{availableActions.includes('approve') && <ApproveButton />}
{availableActions.includes('reject') && <RejectButton />}
```

**장점**:

- 권한 로직 중복 제거 (백엔드 단일 소스)
- UI 일관성 보장 (프론트엔드 조건 분기 최소화)
- 백엔드 정책 변경 시 프론트엔드 수정 불필요

#### 4. Unified Error Handling

**핵심 파일**: `apps/backend/src/common/filters/error.filter.ts`

**에러 응답 표준화**:

```typescript
// GlobalExceptionFilter 출력 형식
{
  code: string,          // 'VERSION_CONFLICT', 'VALIDATION_ERROR', 커스텀 코드
  message: string,
  timestamp: string,
  currentVersion?: number, // CAS 실패 시 추가 필드
  expectedVersion?: number
}
```

**처리 순서**: `AppError` → `ZodError` → `HttpException` → `unknown`

**커스텀 에러 생성**:

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
  toast.error('다른 사용자가 먼저 처리했습니다. 페이지를 새로고침합니다.');
}
```

---

### 프론트엔드 패턴

#### 5. Optimistic Update Hook

**핵심 파일**: `apps/frontend/hooks/use-optimistic-mutation.ts`

**전략**: 즉시 UI 업데이트(낙관적) → 서버 확정 → 에러 시 **서버 재검증** (스냅샷 롤백 아님)

```typescript
// ✅ 올바른 패턴
const mutation = useOptimisticMutation({
  mutationFn: (vars) => api.approve(vars),
  queryKey: queryKeys.checkouts.detail(id),
  optimisticUpdate: (old, vars) => ({ ...old, status: 'approved' }),
  invalidateKeys: [queryKeys.checkouts.lists()],
});

// Lifecycle:
// 1. onMutate: 즉시 UI 업데이트 (0ms 체감)
// 2. onSuccess: 서버 확정 → invalidateQueries (관련 쿼리 무효화)
// 3. onError: 스냅샷 롤백이 아닌 서버 재검증 (invalidateQueries)
//    → "에러 = 서버 상태 불일치" → 로컬 복원이 아닌 서버 동기화 필요
```

**에러 처리 (CAS 충돌)**:

```typescript
// useOptimisticMutation 내부
onError: (error) => {
  queryClient.invalidateQueries({ queryKey }); // 서버 재검증

  if (isConflictError(error)) {
    toast.error('다른 사용자가 먼저 처리했습니다. 페이지가 자동으로 새로고침됩니다.', {
      duration: 3000,
    });
  }
};
```

**왜 스냅샷 롤백이 아닌가?**

- 에러 = "내가 본 데이터가 최신이 아님" → 서버에서 최신 데이터 가져와야 함
- 스냅샷 복원은 또 다른 stale state 생성

#### 6. Server/Client API Separation

**3-Tier 구조**:

| Layer         | File                                        | Context                    | Use Case                        |
| ------------- | ------------------------------------------- | -------------------------- | ------------------------------- |
| Client-side   | `lib/api/api-client.ts`                     | `getSession()` interceptor | API hooks, mutations            |
| Context-based | `lib/api/authenticated-client-provider.tsx` | `useSession()` hook        | 세션 동기화 필요 시             |
| Server-side   | `lib/api/server-api-client.ts`              | `getServerAuthSession()`   | Server Component, Route Handler |

```typescript
// ✅ Server Component에서
import { equipmentApiServer } from '@/lib/api/server-api-client';

export default async function Page() {
  const equipment = await equipmentApiServer.getEquipment(id);
  // → getServerAuthSession()으로 서버 세션 읽기
}

// ✅ Client Component에서
import equipmentApi from '@/lib/api/equipment-api';

export function EquipmentList() {
  const { data } = useQuery({
    queryKey: ['equipmentList'],
    queryFn: () => equipmentApi.getEquipmentList(),
    // → getSession()으로 클라이언트 세션 읽기
  });
}
```

**왜 분리하는가?**

- Server Component에서 `getSession()` 호출 불가 (클라이언트 전용)
- Client Component에서 `getServerAuthSession()` 호출 불가 (서버 전용)
- 각 환경에 최적화된 인증 메커니즘 사용

#### 7. Cache Invalidation Strategies

**핵심 파일**: `apps/frontend/lib/api/cache-invalidation.ts`

**staleTime 계층화** (`lib/api/query-config.ts`):

| Preset    | staleTime | Use Case                 |
| --------- | --------- | ------------------------ |
| SHORT     | 30s       | Dashboard, Notifications |
| MEDIUM    | 2min      | Detail pages             |
| LONG      | 5min      | List pages               |
| VERY_LONG | 10min     | Rarely changing data     |
| REFERENCE | 30min     | Teams, status codes      |

**교차 엔티티 무효화**:

```typescript
// ✅ 올바른 패턴 - 정적 메서드로 교차 엔티티 무효화
await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(queryClient, equipmentId);
// → equipment detail 무효화
// → equipment list 무효화
// → dashboard 무효화
// → non-conformances list 무효화

// ❌ 잘못된 패턴 - 수동으로 개별 무효화 (누락 위험)
await queryClient.invalidateQueries(['equipment', equipmentId]);
// → 다른 쿼리는 stale state 유지!
```

**무효화 vs refetch**:

```typescript
// ✅ 즉시 refetch 필요한 경우
await queryClient.refetchQueries({ queryKey: ['equipment', id], type: 'active' });

// ✅ 다음 접근 시 refetch (백그라운드)
await queryClient.invalidateQueries({ queryKey: ['equipmentList'] });
```

#### 8. Discriminated Union APIs

**문제**: 반출 목적(purpose)에 따라 필요한 필드가 다름

**해결**: `sourceType` 기반 타입 좁히기

```typescript
// ✅ 올바른 패턴 - Discriminated Union
type CheckoutRequest =
  | { purpose: 'calibration'; calibrationAgency: string }
  | { purpose: 'repair'; repairDescription: string }
  | { purpose: 'rental'; borrowerSite: string; borrowerTeam: string };

// TypeScript가 자동으로 타입 좁히기
function processCheckout(req: CheckoutRequest) {
  if (req.purpose === 'calibration') {
    console.log(req.calibrationAgency); // ✅ OK - 타입 안전
    console.log(req.repairDescription); // ❌ 컴파일 에러
  }
}
```

**실제 사용**:

```typescript
// Zod schema
export const createCheckoutSchema = z.discriminatedUnion('purpose', [
  z.object({ purpose: z.literal('calibration'), calibrationAgency: z.string().min(1) }),
  z.object({ purpose: z.literal('repair'), repairDescription: z.string().min(1) }),
  z.object({ purpose: z.literal('rental'), borrowerSite: z.string(), borrowerTeam: z.string() }),
]);
```

#### 9. Query Key Factory

**핵심 파일**: `apps/frontend/lib/api/query-config.ts`

**문제**: 쿼리 키를 각 파일에서 하드코딩 → 타입 안전하지 않고, 무효화 시 누락 위험

**해결**: 중앙화된 팩토리 함수

```typescript
// ✅ SSOT - 쿼리 키 팩토리
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
  // ... 다른 리소스
};

// 사용 예
useQuery({ queryKey: queryKeys.equipment.detail(id) });
queryClient.invalidateQueries({ queryKey: queryKeys.equipment.lists() });
```

**장점**:

- 타입 안전한 쿼리 키
- 계층적 무효화 (lists() → 모든 목록 무효화)
- 중복 방지

---

### 트랜잭션 패턴

#### 10. Multi-Table Atomic Updates

**원칙**: 다중 테이블 업데이트 시 트랜잭션 필수, CAS 단일 테이블 업데이트는 불필요

```typescript
// ✅ 다중 테이블 → 트랜잭션
await db.transaction(async (tx) => {
  await tx.update(equipment).set({ status: 'disposed' });
  await tx.insert(auditLogs).values({ action: 'dispose', equipmentId });
  await tx.update(checkouts).set({ status: 'canceled' }).where(eq(checkouts.equipmentId, id));
});

// ✅ CAS 단일 테이블 → 트랜잭션 불필요 (WHERE version = ? 원자성 보장)
await db
  .update(equipment)
  .set({ status: 'approved', version: version + 1 })
  .where(and(eq(equipment.id, id), eq(equipment.version, version)));
```

**왜 CAS는 트랜잭션 불필요한가?**

- `WHERE version = ?` 조건 자체가 원자성 보장
- 0 rows affected → 충돌 감지 → 409 응답
- 트랜잭션 오버헤드 제거

---

### 패턴 적용 체크리스트

#### Backend 엔드포인트 추가 시

- [ ] 상태 변경 → CAS 패턴 적용 (`version` 필드 + `VersionedBaseService`)
- [ ] Zod schema + `versionedSchema` + `ZodValidationPipe`
- [ ] `@RequirePermissions()` 데코레이터
- [ ] `req.user.userId` 서버 사이드 추출 (body 신뢰 금지)
- [ ] `@AuditLog()` 데코레이터
- [ ] 캐시 무효화 전략 (`CacheInvalidationHelper`)
- [ ] 에러 응답에 `code` 필드 정의
- [ ] CAS 실패(409) 시 detail 캐시 삭제
- [ ] 다중 테이블 업데이트 → `db.transaction()`

#### Frontend 기능 추가 시

- [ ] 서버 상태 → TanStack Query (useState 금지)
- [ ] 상태 변경 → `useOptimisticMutation`
- [ ] `queryKeys` 팩토리 등록
- [ ] VERSION_CONFLICT 에러 특별 처리
- [ ] Loading / Error / Empty state
- [ ] 캐시 무효화 (`EquipmentCacheInvalidation` or `invalidateQueries`)
- [ ] Server Component props → `useQuery({ initialData })` 연동

---

## 📚 승인된 명령어

### DB 관리

```bash
pnpm db:push      # 스키마 자동 동기화 (권장)
pnpm db:sync      # 수동 마이그레이션 적용
```

### 테스트

```bash
pnpm test:e2e     # E2E 테스트 실행 (개발 DB 사용)
pnpm test         # 단위 테스트
```

### Docker

```bash
docker ps                           # 컨테이너 확인 (postgres_equipment만 있어야 함)
docker exec postgres_equipment ...  # DB 작업
```

---

## 🎯 의사결정 가이드

### DB 관련 질문이 나올 때

#### Q: "테스트 DB를 별도로 만들까요?"

**A: 아니요. 단일 DB를 사용합니다. 1인 개발 환경이고 개발 데이터가 중요하지 않아서 통합했습니다.**

#### Q: "개발 DB와 테스트 DB를 동기화해야 하나요?"

**A: 테스트 DB는 없습니다. 단일 DB만 사용합니다.**

#### Q: "테스트 실행 시 개발 데이터가 삭제되지 않나요?"

**A: 1인 개발자이고 개발 데이터가 중요하지 않으므로 문제없습니다. 오히려 단순함이 더 중요합니다.**

#### Q: "CI/CD 환경에서는 어떻게 하나요?"

**A: CI/CD도 단일 DB를 사용합니다. 각 테스트 실행마다 새로운 컨테이너를 생성하므로 격리됩니다.**

---

## 🔍 코드 리뷰 체크리스트

코드 작성/수정 시 다음을 확인하세요:

- [ ] DATABASE_URL에 5434 포트나 \_test 사용하지 않았나?
- [ ] "테스트 DB"라는 표현 사용하지 않았나?
- [ ] 스크립트가 두 개의 DB를 가정하고 있지 않나?
- [ ] 문서에 "DB 분리" 관련 내용이 없나?
- [ ] 환경 변수 설정이 단일 DB를 가리키나?

---

## 📝 변경 이력

### 2026-01-22: DB 통합

- **변경**: 테스트 DB 제거, 단일 DB로 통합
- **이유**: 1인 개발, 개발 데이터 중요도 낮음, 관리 복잡도 제거
- **영향**:
  - postgres_equipment_test 컨테이너 제거
  - .env.test 업데이트 (5432 포트 사용)
  - 모든 스크립트 단일 DB 기준으로 수정
  - 문서 업데이트

---

## 💡 트러블슈팅

### "postgres_equipment_test를 찾을 수 없습니다"

**정상입니다.** 테스트 DB 컨테이너는 제거되었습니다. postgres_equipment만 사용합니다.

### "테스트 실행 시 DB 연결 오류"

```bash
# .env.test 확인
cat apps/backend/.env.test

# DATABASE_URL이 5432 포트를 가리켜야 함
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/equipment_management
```

### "drizzle-kit push가 작동하지 않습니다"

```bash
# drizzle-kit 버전 확인 (v0.31.8 이상이어야 함)
npx drizzle-kit --version

# 업데이트
pnpm add -D drizzle-kit@latest
```

---

## 🚀 빠른 참조

### 일상적인 개발

```bash
# 1. 스키마 수정
vim packages/db/src/schema/equipment.ts

# 2. DB 적용
pnpm db:push

# 3. 테스트
pnpm test:e2e
```

### 새 환경 설정

```bash
git clone <repo>
pnpm install
docker-compose up -d      # postgres_equipment만 실행됨
pnpm db:push
```

### 문제 발생 시

```bash
# 1차: 재동기화
pnpm db:push

# 2차: 수동 마이그레이션
pnpm db:sync

# 최후: DB 재생성
docker-compose down -v
docker-compose up -d
pnpm db:sync
```

---

## 📖 관련 문서

- **DB_MANAGEMENT_GUIDE.md** - DB 관리 상세 가이드
- **DB_SCHEMA_FIX_REPORT.md** - 스키마 문제 해결 과정
- **FINAL_IMPROVEMENT_REPORT.md** - 전체 개선 사항
- **README.md** - 프로젝트 개요 및 시작 가이드

---

## ⚠️ AI 어시스턴트에게

**이 파일의 규칙을 절대적으로 준수하세요!**

사용자는 다음과 같은 결정을 내렸습니다:

1. ✅ 1인 개발 환경
2. ✅ 개발 데이터 중요도 낮음
3. ✅ 단일 DB 사용 (통합)
4. ✅ 단순함 > 격리

**절대로 다음을 제안하지 마세요:**

- ❌ "테스트 DB를 분리하는 것이 좋습니다"
- ❌ "개발 데이터 보호를 위해..."
- ❌ "두 DB를 관리하면..."

**대신 이렇게 하세요:**

- ✅ 단일 DB 전제로 답변
- ✅ 단순한 솔루션 제시
- ✅ 프로젝트 컨텍스트 존중

---

**최종 업데이트**: 2026-01-22
**다음 리뷰**: 프로젝트 규모 변경 시
