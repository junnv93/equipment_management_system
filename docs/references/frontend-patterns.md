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

**대형 page 컴포넌트 분리 — `_components/` private folder 패턴:**
page-specific 컴포넌트가 단일 책임(SRP)을 넘어 여러 관심사를 혼재할 때 `_components/` 폴더로 분리한다.
Next.js App Router에서 `_` 접두사 폴더는 라우트 세그먼트에서 제외되어 라우트 전용 sub-component임을 명시한다.

**분리 트리거 (줄 수가 아닌 관심사 기준):**

- 독립적으로 자체 API 쿼리/mutation을 가져야 하는 섹션 (예: 첨부파일 섹션)
- Dialog가 자체 폼 상태 + CAS mutation을 보유해 부모 prop-drilling이 발생하는 경우
- 특정 조건(validationType, status)에 따라 조건부로만 렌더되는 카드
- 명확하게 다른 도메인 개념을 표현하는 섹션 (기본정보 vs 공급자정보 vs 승인정보)

```
app/(dashboard)/software/[id]/validation/[validationId]/
├── page.tsx                          # 라우트 진입점
├── ValidationDetailContent.tsx       # 147줄 오케스트레이터
└── _components/
    ├── ValidationBasicInfoCard.tsx
    ├── ValidationVendorInfoCard.tsx
    ├── ValidationSelfTestInfoCard.tsx
    ├── ValidationApprovalInfoCard.tsx
    ├── ValidationDocumentsSection.tsx  # 자체 useQuery + mutation 보유
    └── ValidationEditDialog.tsx        # 자체 useCasGuardedMutation 보유
```

기준: 오케스트레이터 ≤150줄, sub-component ≤150줄(SHOULD). Dialog/Section은 자체 mutation을 보유해 부모 prop-drilling 제거.

### Dialog Form 초기화 — `useRef + [open]` 패턴

Dialog 내부에서 API 응답 데이터를 폼에 채울 때, `useEffect`의 의존성에 `data` 객체를 포함하면 `refetchOnWindowFocus: true` + MEDIUM staleTime(2분) 조합에서 background refetch 시 사용자 편집 내용이 초기화된다.

```typescript
// ❌ 금지 — background refetch 시 편집 내용 덮어씀
useEffect(() => {
  if (open) setForm({ name: data.name });
}, [open, data]); // data 변경 시 사용자 입력 리셋

// ✅ 올바른 패턴 — open 전환 시에만 초기화
const dataRef = useRef(data);
dataRef.current = data; // 항상 최신 값을 ref에 동기화

useEffect(() => {
  if (open) {
    const d = dataRef.current; // open 시점의 최신 값 캡처
    setForm({ name: d.name });
  } else {
    setForm(null);
  }
}, [open]); // data 미포함 — exhaustive-deps 경고 없음 (ref는 stable)
```

`useRef`는 stable (렌더 간 동일 객체)이므로 exhaustive-deps 경고가 발생하지 않는다. `// eslint-disable-line` 추가 불필요.

### useQuery isError 분기 필수

`useQuery`로 데이터를 가져오는 컴포넌트는 `isLoading`과 함께 `isError`도 처리해야 한다.
에러 상태를 누락하면 네트워크 오류 시 "빈 상태" UI가 표시되어 데이터 없음과 로드 실패를 구분할 수 없다.

```typescript
const { data = [], isLoading, isError } = useQuery({ ... });

if (isLoading) return <Skeleton />;
if (isError) return <ErrorMessage />;  // 빈 상태와 분리
if (data.length === 0) return <EmptyState />;
return <DataList data={data} />;
```

예외: 에러를 `error.tsx` Error Boundary로 bubble up하는 경우 `isError` 분기 생략 가능 (단, Error Boundary 존재 전제).

### Equipment Filters (URL-Driven State)

- **SSOT:** `equipment-filter-utils.ts` — 서버/클라이언트 공유 파싱/변환
- **역할별 기본 필터:** `page.tsx`에서 서버 사이드 리다이렉트 (useEffect 금지)
- **URL 파라미터가 유일한 진실의 소스** — useState로 필터 관리 금지

### API GET 응답 패턴 선택

표준 엔드포인트와 레거시 비-envelope 엔드포인트는 응답 구조가 다르므로 클라이언트 함수 구현 방식을 구분한다.

**표준 envelope 응답** (`{ data: T }` 또는 `{ data: T[], meta: {...} }`):

```typescript
// apiClient.get<T>() → api-response-transformer 를 통해 data 언래핑
const item = await apiClient.get<Equipment>(API_ENDPOINTS.EQUIPMENT.GET(id));
// → Equipment (data 자동 언래핑됨)

const list = await apiClient.get<PaginatedResponse<Equipment>>(API_ENDPOINTS.EQUIPMENT.LIST);
// → PaginatedResponse<Equipment>
```

**레거시 비-envelope 응답** (배열 또는 단일 객체를 직접 반환):

```typescript
// transformArrayResponse / transformSingleResponse 헬퍼 사용
import {
  transformArrayResponse,
  transformSingleResponse,
} from '@/lib/api/api-response-transformer';

const items = await apiClient.get(endpoint).then(transformArrayResponse<FormTemplate>);
const item = await apiClient.get(endpoint).then(transformSingleResponse<FormTemplate>);
```

**선택 기준:**

| 조건                         | 패턴                                                 |
| ---------------------------- | ---------------------------------------------------- |
| 백엔드가 `{ data: T }` 반환  | `apiClient.get<T>()`                                 |
| 백엔드가 배열/객체 직접 반환 | `transformArrayResponse` / `transformSingleResponse` |
| 새 엔드포인트 개발           | 반드시 `{ data: T }` envelope 방식 채택              |

> **anti-pattern:** 레거시 비-envelope 엔드포인트에 `apiClient.get<T[]>()` 를 그대로 사용하면 타입은 통과해도 런타임에서 배열 대신 응답 객체를 받게 된다.
