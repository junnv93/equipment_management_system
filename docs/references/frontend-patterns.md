# Frontend Patterns

> 이 파일은 CLAUDE.md에서 분리된 상세 참조 문서입니다.

### Three-Tier API Client

| Layer         | File                                        | Context                    | Use Case                        |
| ------------- | ------------------------------------------- | -------------------------- | ------------------------------- |
| Client-side   | `lib/api/api-client.ts`                     | `getSession()` interceptor | API hooks, mutations            |
| Context-based | `lib/api/authenticated-client-provider.tsx` | `useSession()` hook        | 세션 동기화 필요 시             |
| Server-side   | `lib/api/server-api-client.ts`              | `getServerAuthSession()`   | Server Component, Route Handler |

### State Management: TanStack Query

**서버 상태는 반드시 TanStack Query 사용 (useState 금지)**

```typescript
// Query Key Factory — lib/api/query-config.ts
queryKeys.equipment.detail(id); // ['equipment', 'detail', id]
queryKeys.checkouts.list(filters); // ['checkouts', 'list', filters]
queryKeys.approvals.counts(role); // ['approval-counts', role]
```

**Cache Time Hierarchy:**

| Preset      | staleTime | Use Case                 |
| ----------- | --------- | ------------------------ |
| `SHORT`     | 30s       | Dashboard, Notifications |
| `MEDIUM`    | 2min      | Detail pages             |
| `LONG`      | 5min      | List pages               |
| `VERY_LONG` | 10min     | Rarely changing data     |
| `REFERENCE` | 30min     | Teams, status codes      |

### Optimistic Mutation Pattern

```typescript
// hooks/use-optimistic-mutation.ts
const mutation = useOptimisticMutation({
  mutationFn: (vars) => api.approve(vars),
  queryKey: queryKeys.checkouts.detail(id),
  optimisticUpdate: (old, vars) => ({ ...old, status: 'approved' }),
  invalidateKeys: [queryKeys.checkouts.lists()],
});

// Lifecycle:
// 1. onMutate: 즉시 UI 업데이트 (0ms)
// 2. onSuccess: 서버 확정 → invalidateQueries
// 3. onError: 스냅샷 롤백이 아닌 서버 재검증 (invalidateQueries)
//    → VERSION_CONFLICT 시 특별 토스트 메시지
```

### Error Handling

**Enum:** `EquipmentErrorCode` (21개) — `lib/errors/equipment-errors.ts`

**Key Utilities:**

| Function                    | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `mapBackendErrorCode(code)` | 백엔드 code → EquipmentErrorCode (HTTP status 폴백) |
| `isConflictError(error)`    | CAS 충돌 여부                                       |
| `isRetryableError(error)`   | 재시도 가능 여부                                    |
| `ApiError.getErrorInfo()`   | 한국어 제목/메시지/해결방안                         |

### Cache Invalidation (Frontend)

```typescript
// lib/api/cache-invalidation.ts — 정적 메서드로 교차 엔티티 무효화
await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(queryClient, equipmentId);
await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
await DashboardCacheInvalidation.invalidateAll(queryClient);
```

### Component Conventions

| Suffix          | Purpose                                        | Example                       |
| --------------- | ---------------------------------------------- | ----------------------------- |
| `*Client.tsx`   | 서버 데이터를 props로 받는 클라이언트 컴포넌트 | `EquipmentDetailClient.tsx`   |
| `*Content.tsx`  | 페이지 레벨 클라이언트 컴포넌트                | `CheckoutsContent.tsx`        |
| `*Skeleton.tsx` | 로딩 상태                                      | `EquipmentDetailSkeleton.tsx` |

디렉토리: 기능별 조직 (`components/equipment/`, `components/checkouts/`, `components/calibration/` 등)

### Equipment Filters (URL-Driven State)

- **SSOT:** `equipment-filter-utils.ts` — 서버/클라이언트 공유 파싱/변환
- **역할별 기본 필터:** `page.tsx`에서 서버 사이드 리다이렉트 (useEffect 금지)
- **URL 파라미터가 유일한 진실의 소스** — useState로 필터 관리 금지
