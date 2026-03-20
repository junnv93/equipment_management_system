# 현대적 아키텍처 패턴 (2026-02)

> **이 섹션의 목적**: 2026-02 현재 운영 중인 프로덕션급 아키텍처 패턴을 문서화하여, AI가 시니어급 사고력으로 시니어급 코드를 작성할 수 있도록 "왜(Why)"를 중심으로 설명합니다.

## 패턴 개요

이 프로젝트는 10가지 현대적 패턴으로 구성된 정교한 아키텍처를 갖추고 있습니다:

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

## Backend Pattern 1: Optimistic Locking (CAS)

### 문제 정의

**Lost Update Problem**: 두 사용자가 동시에 같은 엔티티를 조회 → 각자 수정 → 나중 요청이 먼저 요청을 덮어씀

```
User A: 조회(version: 1, status: pending) → 승인 → UPDATE SET status='approved'
User B: 조회(version: 1, status: pending) → 반려 → UPDATE SET status='rejected'
결과: B의 변경사항만 반영 (A의 승인 손실!) ← Lost Update
```

### 해결: Compare-And-Swap (CAS)

**핵심 파일**: `apps/backend/src/common/base/versioned-base.service.ts`

모든 엔티티에 `version` 필드 추가 → UPDATE 시 WHERE 절에 `version = expectedVersion` 조건

```typescript
// ✅ 올바른 패턴 - VersionedBaseService 상속
export class CheckoutsService extends VersionedBaseService {
  async approve(uuid: string, approverId: string, currentVersion: number) {
    return this.updateWithVersion(
      checkouts, uuid, currentVersion,
      { status: 'approved', approvedBy: approverId, approvedAt: new Date() },
      'checkout'
    );
    // SQL: UPDATE checkouts SET version = version + 1, status = 'approved', ...
    //      WHERE id = ? AND version = ?
    // → 0 rows affected? → 409 Conflict { code: 'VERSION_CONFLICT' }
  }
}
```

### DTO 규칙: versionedSchema 포함

**파일**: `apps/backend/src/common/dto/base-versioned.dto.ts`

```typescript
export const versionedSchema = { version: z.number().int().positive() };

export const approveCheckoutSchema = z.object({
  ...versionedSchema, // ← version 필드 필수
  comment: z.string().optional(),
});
```

### Cache Coherence: CAS 실패 시 캐시 삭제

```typescript
async updateCheckoutStatus(uuid: string, status: string, version: number) {
  const detailCacheKey = `checkout:detail:${uuid}`;
  try {
    return await this.updateWithVersion(checkouts, uuid, version, { status }, 'checkout');
  } catch (error) {
    if (error instanceof ConflictException) {
      this.cacheService.delete(detailCacheKey); // stale cache 방지
    }
    throw error;
  }
}
```

### 적용 엔티티 (8개)

| Table | Service | Key File |
|---|---|---|
| equipment | EquipmentService | `modules/equipment/equipment.service.ts` |
| checkouts | CheckoutsService | `modules/checkouts/checkouts.service.ts` |
| calibrations | CalibrationService | `modules/calibration/calibration.service.ts` |
| non_conformances | NonConformancesService | `modules/non-conformances/...service.ts` |
| disposal_requests | DisposalService | `modules/equipment/services/disposal.service.ts` |
| equipment_imports | EquipmentImportsService | `modules/equipment-imports/...service.ts` |
| equipment_requests | EquipmentService | `modules/equipment/equipment.service.ts` |
| software_history | SoftwareService | `modules/software/software.service.ts` |

---

## Backend Pattern 2: Token Refresh Architecture

**문제**: Access Token이 너무 길면(1일) 탈취 시 위험, 너무 짧으면(5분) UX 저하

**해결**: Access Token 짧게(15분) + Refresh Token 길게(7일) → 보안과 UX 균형

### Token 구조

- Access Token: `{ userId, email, role, site, teamId, type: 'access', exp: 15분 }`
- Refresh Token: `{ userId, type: 'refresh', exp: 7일, absoluteExpiry: 30일 }`

### 자동 갱신 로직

**파일**: `apps/frontend/app/api/auth/[...nextauth]/auth-config.ts`

JWT 콜백에서 만료 60초 전 자동 갱신. `SessionProvider refetchInterval={5 * 60}`.

### API 클라이언트 통합

**파일**: `apps/frontend/lib/api/api-client.ts`

매 요청마다 `getSession()`으로 최신 세션 조회 (JWT 콜백 트리거). 401 시 `getSession()` 재조회 → Refresh 실패 시 로그아웃.

---

## Backend Pattern 3: Server-Driven UI

**문제**: 권한 로직이 백엔드와 프론트엔드에 중복 → 정책 변경 시 양측 수정 필요

**해결**: 백엔드가 각 엔티티의 **가능한 액션**을 계산하여 프론트엔드에 전달

```typescript
// Backend Response
{ id: '123', status: 'pending', availableActions: ['approve', 'reject', 'cancel'] }

// Frontend - 단순 렌더링만
{availableActions.includes('approve') && <Button>승인</Button>}
```

---

## Backend Pattern 4: Unified Error Handling

**파일**: `apps/backend/src/common/filters/error.filter.ts`

**처리 순서**: `AppError` → `ZodError` → `HttpException` → `unknown`

```typescript
// Response 형식
{ code: string, message: string, timestamp: string, currentVersion?: number, expectedVersion?: number }

// Frontend Error Code SSOT: apps/frontend/lib/errors/equipment-errors.ts (21개)
mapBackendErrorCode(backendCode, httpStatus) → EquipmentErrorCode
```

---

## Frontend Pattern 5: Optimistic Update Hook

**핵심 파일**: `apps/frontend/hooks/use-optimistic-mutation.ts`

**전략**: 에러 시 스냅샷 롤백이 아닌 **서버 재검증** (invalidateQueries)

```typescript
const mutation = useOptimisticMutation({
  mutationFn: (vars) => checkoutApi.approve(vars),
  queryKey: queryKeys.checkouts.detail(id),
  optimisticUpdate: (old, vars) => ({ ...old, status: 'approved' }),
  invalidateKeys: [queryKeys.checkouts.lists()],
});

// Lifecycle:
// 1. onMutate: 즉시 UI 업데이트 (0ms 체감) → setQueryData
// 2. onSuccess: 서버 확정 → invalidateQueries
// 3. onError: 서버 재검증 → invalidateQueries (스냅샷 롤백 아님!)
```

**왜 스냅샷 롤백이 아닌가?**
1. 에러 = "내가 본 데이터가 최신이 아님"
2. 스냅샷 복원 = "stale state로 되돌리기" → 또 다른 stale state 생성
3. 올바른 접근 = "서버에서 최신 데이터 가져오기"

---

## Frontend Pattern 6: Server/Client API Separation

### 3-Tier 구조

| Layer | File | Context | Use Case |
|---|---|---|---|
| Client-side | `lib/api/api-client.ts` | `getSession()` interceptor | API hooks, mutations |
| Context-based | `lib/api/authenticated-client-provider.tsx` | `useSession()` hook | 세션 동기화 필요 시 |
| Server-side | `lib/api/server-api-client.ts` | `getServerAuthSession()` | Server Component, Route Handler |

---

## Frontend Pattern 7: Cache Invalidation Strategies

### staleTime 계층화

**파일**: `apps/frontend/lib/api/query-config.ts`

| Preset | staleTime | Use Case |
|---|---|---|
| SHORT | 30s | Dashboard, Notifications |
| MEDIUM | 2min | Detail pages |
| LONG | 5min | List pages |
| VERY_LONG | 10min | Rarely changing data |
| REFERENCE | 30min | Teams, status codes |

### 교차 엔티티 무효화

**파일**: `apps/frontend/lib/api/cache-invalidation.ts` — 정적 메서드로 교차 엔티티 무효화

---

## Frontend Pattern 8: Discriminated Union APIs

반출 목적(purpose)에 따라 필요한 필드가 다름 → TypeScript Discriminated Union + `z.discriminatedUnion()`으로 타입 안전한 다형성.

---

## Frontend Pattern 9: Query Key Factory

**파일**: `apps/frontend/lib/api/query-config.ts`

```typescript
export const queryKeys = {
  equipment: {
    all: () => ['equipment'] as const,
    lists: () => [...queryKeys.equipment.all(), 'list'] as const,
    list: (filters) => [...queryKeys.equipment.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.equipment.all(), 'detail', id] as const,
  },
  // ...
};
```

계층적 무효화: `queryKeys.equipment.all()` → 모든 장비 쿼리 무효화.

---

## Transaction Pattern 10: Multi-Table Atomic Updates

**원칙**: 다중 테이블 업데이트 → 트랜잭션 필수 / CAS 단일 테이블 업데이트 → 트랜잭션 불필요

CAS의 `WHERE version = ?` 조건 자체가 원자성 보장이므로 트랜잭션 오버헤드 불필요.
