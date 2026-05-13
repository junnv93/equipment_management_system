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

### Atom-level i18n 금지 원칙

**원자 컴포넌트(`components/shared/`, `components/ui/`)는 `useTranslations` / `getTranslations`를 cross-cutting flat top-level 키에 사용하지 않는다.** 단, **atom-owned sub-namespace**(예: `common.fileUpload.*`, `common.equipmentCombobox.*`)는 허용 — atom 본인이 소유하는 i18n 영역이므로 캡슐화 위반 아님.

**Why:** atom은 가장 작은 재사용 단위로, **공유되는** flat top-level 키(예: `common.loading`)를 호출하면 도메인 결합이 발생하고 회귀 시 1줄짜리 silent break가 페이지 전체를 폭주시킨다. 반면 atom-owned sub-namespace는 atom 자체의 i18n 영역이므로 결합 우려 없음.

**위반 예시 (자기-모순):**

```tsx
// ❌ atom이 cross-cutting flat top-level 키 호출 — common.loading 누락 시 페이지 폭주
function NextStepPanel(props) {
  const tCommon = useTranslations('common');
  const loadingLabel = tCommon('loading'); // ← flat top-level 키 의존 (위험)
  // ...
}
```

**권장 1 (caller 주입 — cross-cutting 라벨):**

```tsx
// ✅ atom은 cross-cutting 라벨을 props로 받음
interface NextStepPanelProps {
  /** sr-only loading label injected by caller (e.g. tCommon('status.loading')). */
  loadingLabel: string; // required — TS 컴파일 게이트로 누락 차단
}

// caller (도메인 컴포넌트)
const tCommon = useTranslations('common');
<NextStepPanel loadingLabel={tCommon('status.loading')} />;
```

**권장 2 (atom-owned sub-namespace — atom 전용 라벨):**

```tsx
// ✅ atom 전용 i18n 영역 — common.fileUpload.* 는 FileUpload atom이 소유
function FileUpload(props) {
  const t = useTranslations('common.fileUpload');
  return <div>{t('dropHere')}</div>;
  // 또는 sub-namespace를 root에서 접근:
  // const t = useTranslations('common');
  // {t('fileUpload.dropHere')}
}
```

이 패턴은 안전하다 — `common.fileUpload`는 다른 atom과 공유되지 않는 *atom-owned 영역*이므로 결합 우려 없음.

**위치별 예외 정책:**

- **도메인 디렉토리** (`components/checkouts/`, `components/equipment/` 등): 해당 도메인 namespace 직접 호출 OK. 결합이 의도된 위치이므로 SSOT 위반이 아님.
- **`components/shared/`에 위치한 컴포넌트**: cross-cutting `common.*` 의존만 허용. 특정 도메인 namespace(`checkouts.*`, `equipment.*` 등)를 직접 사용하면 namespace 결합을 props로 분리해야 함 — "공유 컴포넌트가 특정 도메인을 알아야 한다"는 건 위치 오류 신호.
- **`common.*` namespace**: 위치 무관, props 주입 강제. atom이 `tCommon('someLabel')` 직접 호출 시 자기-모순 회귀 발생.

**위반 적발 (다층 게이트):**

```bash
# (1) 호출지 ↔ messages JSON parity
node scripts/check-i18n-call-sites.mjs --all
# (2) CROSS_CUTTING_NAMESPACES (common, errors) 구조 검증
#     root level에 string/array 발견 시 exit 1
```

**구조적 차단**: `messages/{ko,en}/common.json`의 root level은 sub-namespace(object) 만 허용. flat string/array가 추가되면 빌드 실패. 본 회귀(`tCommon('loading')`이 flat key 호출)의 메커니즘이 빌드 타임에 _애초에 만들어질 수 없도록_ 차단됨.

### `loading.tsx` Server Component i18n 패턴

Next.js 16 App Router의 `loading.tsx`는 **Server Component**이므로 `useTranslations` 사용 불가. **반드시 `getTranslations()` async 사용.**

```tsx
// ✅ 올바른 패턴
import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('common');
  return (
    <div role="status" aria-label={t('status.loading')}>
      {/* skeleton */}
    </div>
  );
}
```

**금지 사항:**

- 하드코딩 sr-only 텍스트 (예: `aria-label="로딩 중"`) — 로케일 무관 한국어 노출
- `aria-label={t('key', { name: '' })}` 패턴 — 빈 문자열로 ICU 변수를 채우면 SR이 "님의 …" 같은 깨진 라벨을 읽음

### i18n namespace SSOT

**SSOT:** `apps/frontend/i18n.ts`의 `namespaces` 배열이 단일 소스. 추가/제거 시 5단계 체크리스트:

1. `apps/frontend/messages/{ko,en}/<ns>.json` 양쪽 생성 (parity 필수)
2. `apps/frontend/i18n.ts`의 `namespaces` 배열에 추가
3. 호출지에서 `useTranslations('<ns>')` 사용
4. `node scripts/check-i18n-call-sites.mjs --all` PASS 확인
5. 한 라우트에서 직접 렌더링하여 `MISSING_MESSAGE` 0건 확인

**filesystem 자동 도출은 채택하지 않음:**

- 의도적 미존재 ns(점진 도입 중인 ns)를 명시적으로 표현 어려움
- Turbopack/webpack의 dynamic import codegen이 명시 배열에서 더 안정적
- namespace 추가는 빈도가 낮아 자동화 ROI가 낮음

**검증:**

```bash
node scripts/check-i18n-call-sites.mjs --all   # 호출지 ↔ 메시지 parity
node scripts/check-i18n-keys.mjs --all         # 필수 키 contract (FSM 등)
```

두 스크립트는 책임이 다르므로 공존한다 — `check-i18n-keys.mjs`는 known-critical 키의 부재를 강하게 보장, `check-i18n-call-sites.mjs`는 호출지에서 사용한 모든 키를 자동 검증.

### Row with Secondary Action Pattern

**문제:** 한 행(row)에 (a) 행 전체 클릭 → 메인 라우트, (b) 보조 영역 클릭 → 필터 뷰/세부 액션 두 동선이 모두 필요할 때, 부모 `<a>` 안에 자식 `<a>`(또는 `<button onClick=router.push>`)를 넣으면 다음이 깨진다.

- HTML Interactive Content Model 위반 — `<a>`/`<button>`은 다른 interactive content를 자손으로 가질 수 없음 (W3C HTML5 §4.5)
- React 19 hydration error: `In HTML, <a> cannot be a descendant of <a>` 콘솔 폭주
- Tab 순서/SR 안내가 비결정적 (브라우저가 자동 교정한 DOM과 SSR 마크업이 달라짐)

**해결 패턴 (업계 표준 — GitHub Inbox row, Stripe Dashboard, Linear Issue row):**

행 컨테이너(`<div>` 또는 `<li>`) 안에 **형제 anchor 2개**를 둔다.

```tsx
// ✅ NavRowWithSecondaryAction.tsx 의 expanded + secondaryAction 분기
<div className={SIDEBAR_ROW_TOKENS.container}>
  <Link
    href={href} // 메인 라우트
    className={getSidebarRowPrimaryClasses(isActive)}
    aria-current={isActive ? 'page' : undefined}
  >
    <Icon /> <span>{label}</span>
  </Link>
  <Link
    href={secondaryAction.href} // 보조 라우트 (필터 뷰 등)
    className={getSidebarRowSecondaryClasses()}
    aria-label={secondaryAriaLabel} // 명시적 SR 안내
  >
    <NavBadge count={badge} srLabel={secondaryAriaLabel} />
  </Link>
</div>
```

```tsx
// ❌ 안티패턴 — Link 안 Link
<Link href={href}>
  <Icon /> <span>{label}</span>
  <Link href={secondaryHref}>{badge}</Link>     // hydration error
</Link>

// ❌ 안티패턴 — Link 안 button(onClick=router.push)
<Link href={href}>
  <Icon /> <span>{label}</span>
  <button onClick={() => router.push(secondaryHref)}>{badge}</button>
  // WCAG 4.1.1 Parsing 위반 + 우클릭 새 탭 손실 + URL 공유 손실
</Link>
```

**데이터 모델: optional prop 분기 → discriminated union**

caller가 `secondaryHref?: string` 같은 optional prop을 받아 분기하는 패턴은 silent break 위험 (메모리 교훈: GuidanceCallout `ctaKind` 사례). 명시적 union으로 강제:

```ts
// nav-config.ts
export type NavItemBadgeConfig =
  | { kind: 'count'; sourceKey: BadgeSourceKey }
  | {
      kind: 'count-with-action';
      sourceKey: BadgeSourceKey;
      action: { queryParam: string; queryValue: string; ariaKey: string };
    };
```

`queryParam`/`queryValue`는 SSOT 상수(`CHECKOUT_QUERY_PARAMS` 등)에서 온다 — 하드코딩 0.

**접근성 (WCAG 2.1 AA):**

- 2.4.3 Focus Order: DOM 순서 = Tab 순서 (메인 → 보조 → 다음 row item)
- 4.1.2 Name, Role, Value: 메인은 label 텍스트, 보조는 명시 `aria-label` (i18n 키 경유)
- NavBadge는 시각만 담당 (`<span>`만 렌더). 링크 의미는 caller가 부모 anchor 클래스 + aria-label로 부여 → 단일 책임 원칙

**회귀 차단:**

- ESLint `no-restricted-syntax` `NESTED_LINK_RULE` / `NESTED_ANCHOR_RULE` (apps/frontend/eslint.config.mjs)
- Playwright e2e: `tests/e2e/features/layout/sidebar-nav-action.spec.ts` — 콘솔 hydration 에러 0건 + DOM `a > a` 0건 + Tab 순서 검증

**적용 사례:**

- `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` — 사이드바 nav 행 (메인 라우트 + 선택적 yourTurn 필터 동선)

### React Context 안전 등급 선택 (ADR-0013)

신규 Context 작성 시 **두 패턴 중 하나를 명시적으로 선택**한다.

| 패턴                            | 구현                             | 적용 조건                                     |
| ------------------------------- | -------------------------------- | --------------------------------------------- |
| **Graceful No-Op** (ADR-0013-A) | `useContext(Ctx) ?? NO_OP_VALUE` | 장식적/보강적 Context — 없어도 핵심 기능 동작 |
| **Fail-Fast** (ADR-0013-B)      | `if (!v) throw new Error(...)`   | 필수 인프라 Context — 없으면 항상 버그        |

**보안/인증 Context에는 Graceful No-Op 절대 사용 금지** — Provider 부재 시 권한 검사 우회 가능.

정규 사례: `lib/inspection/form-context.tsx` (Graceful No-Op), `lib/api/authenticated-client-provider.tsx` (Fail-Fast)

> 상세: [docs/adr/0013-graceful-no-op-context-consumer.md](../adr/0013-graceful-no-op-context-consumer.md)
