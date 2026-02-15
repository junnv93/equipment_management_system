# 필터 유틸리티 SSOT 템플릿

**작성일**: 2026-02-14
**목적**: Equipment 패턴을 재사용 가능한 표준 템플릿으로 문서화

---

## 1. 파일 구조

```
apps/frontend/lib/utils/{feature}-filter-utils.ts
```

**예시**: `team-filter-utils.ts`, `calibration-filter-utils.ts`, `checkout-filter-utils.ts`

---

## 2. 인터페이스 정의

### UI{Feature}Filters

**목적**: UI에서 사용하는 필터 타입 (기본값 포함)

```typescript
export interface UI{Feature}Filters {
  search: string;              // 검색어
  site: Site | '';             // 사이트 ('' = 전체)
  // ... 기타 필터 필드
  page: number;                // 페이지 번호
  pageSize: number;            // 페이지 크기
}
```

**특징**:

- 모든 필드는 non-nullable (기본값 포함)
- "전체" 선택은 빈 문자열 (`''`) 또는 `'all'` 사용
- URL 파라미터와 1:1 대응

### Api{Feature}Filters

**목적**: 백엔드 API에 전달하는 쿼리 파라미터

```typescript
export interface Api{Feature}Filters {
  search?: string;             // undefined = 필터 미적용
  site?: Site;
  // ... 기타 필터 필드
  page: number;                // 필수 (페이지네이션)
  pageSize: number;            // 필수
}
```

**특징**:

- 필터 필드는 모두 optional (undefined 허용)
- undefined = 해당 필터 미적용
- 페이지네이션 필드는 필수

---

## 3. 필수 함수

### DEFAULT_UI_FILTERS 상수

```typescript
export const DEFAULT_UI_FILTERS: UI{Feature}Filters = {
  search: '',
  site: '',
  // ... 기타 기본값
  page: 1,
  pageSize: 20,
};
```

### parse{Feature}FiltersFromSearchParams()

**목적**: URLSearchParams → UI 필터 객체 변환

```typescript
export function parse{Feature}FiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UI{Feature}Filters {
  // URLSearchParams와 일반 객체 모두 지원
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0]; // Next.js 중복 파라미터 처리
    }
    return null;
  };

  const search = get('search') || DEFAULT_UI_FILTERS.search;
  const site = (get('site') || DEFAULT_UI_FILTERS.site) as Site | '';
  // ... 기타 필터 파싱

  return { search, site, /* ... */ };
}
```

**사용처**:

- Server Component (page.tsx)
- Client Hook (use{Feature}Filters.ts)

### convertFiltersToApiParams()

**목적**: UI 필터 → API 쿼리 파라미터 변환

```typescript
export function convertFiltersToApiParams(
  filters: UI{Feature}Filters
): Api{Feature}Filters {
  return {
    search: filters.search || undefined,  // 빈 문자열 → undefined
    site: filters.site || undefined,
    // ... 기타 필터 변환
    page: filters.page,
    pageSize: filters.pageSize,
  };
}
```

**변환 규칙**:

- 빈 문자열 (`''`) → `undefined` (필터 미적용)
- `'all'` → `undefined`
- UI 전용 필터는 백엔드 파라미터로 변환 (예: `calibrationDueFilter` → `calibrationDue`)

### countActiveFilters()

**목적**: 활성 필터 개수 계산 (UI 배지 표시용)

```typescript
export function countActiveFilters(filters: UI{Feature}Filters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.site) count++;
  // ... 기타 필터 카운팅
  return count;
}
```

---

## 4. 서버 컴포넌트 패턴 (page.tsx)

```typescript
import { parseTeamFiltersFromSearchParams, convertFiltersToApiParams } from '@/lib/utils/team-filter-utils';
import * as teamsApiServer from '@/lib/api/teams-api-server';

export default async function {Feature}Page(props: PageProps) {
  const searchParams = await props.searchParams;

  // 1️⃣ 역할별 기본 필터 리다이렉트
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildRoleBasedRedirectUrl('/{feature}', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // 2️⃣ 필터 파싱 (SSOT)
  const uiFilters = parse{Feature}FiltersFromSearchParams(searchParams);
  const apiFilters = convertFiltersToApiParams(uiFilters);

  // 3️⃣ 초기 데이터 서버 fetch
  const initialData = await {feature}ApiServer.get{Feature}List(apiFilters);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1>Title</h1>
      <Suspense fallback={<{Feature}Skeleton />}>
        <{Feature}Content initialData={initialData} initialFilters={uiFilters} />
      </Suspense>
    </div>
  );
}
```

---

## 5. 클라이언트 훅 패턴 (use{Feature}Filters.ts)

```typescript
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  UI{Feature}Filters,
  Api{Feature}Filters,
  parse{Feature}FiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  DEFAULT_UI_FILTERS,
} from '@/lib/utils/{feature}-filter-utils';

export function use{Feature}Filters(initialFilters?: UI{Feature}Filters) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 (URL SSOT)
  const currentFilters = useMemo(
    () => parse{Feature}FiltersFromSearchParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  // API 파라미터 변환
  const apiFilters = useMemo(
    () => convertFiltersToApiParams(currentFilters),
    [currentFilters]
  );

  // 활성 필터 개수
  const activeCount = useMemo(
    () => countActiveFilters(currentFilters),
    [currentFilters]
  );

  // 필터 업데이트 함수
  const updateFilters = (updates: Partial<UI{Feature}Filters>) => {
    const newFilters = { ...currentFilters, ...updates };
    const params = new URLSearchParams();

    // 기본값이 아닌 것만 URL에 추가
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.site) params.set('site', newFilters.site);
    // ... 기타 필터

    const queryString = params.toString();
    const newUrl = queryString ? `/{feature}?${queryString}` : '/{feature}';

    router.replace(newUrl, { scroll: false });
  };

  return {
    filters: currentFilters,
    apiFilters,
    activeCount,
    updateFilters,
  };
}
```

---

## 6. 서버 사이드 API 클라이언트 (lib/api/{feature}-api-server.ts)

```typescript
import { createServerApiClient } from './server-api-client';
import { transformPaginatedResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import type { {Feature}, {Feature}Query } from './{feature}-api';

export async function get{Feature}List(query: {Feature}Query = {}): Promise<PaginatedResponse<{Feature}>> {
  const apiClient = await createServerApiClient();
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `/api/{feature}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<{Feature}>(response);
}
```

---

## 7. 체크리스트 (새 필터 추가 시)

새로운 필터를 추가할 때는 다음 순서로 작업:

- [ ] 1. **SSOT 파일**: `UI{Feature}Filters` 인터페이스에 필드 추가
- [ ] 2. **SSOT 파일**: `Api{Feature}Filters` 인터페이스에 필드 추가 (필요시)
- [ ] 3. **SSOT 파일**: `DEFAULT_UI_FILTERS`에 기본값 추가
- [ ] 4. **SSOT 파일**: `parse{Feature}FiltersFromSearchParams()` 함수 업데이트
- [ ] 5. **SSOT 파일**: `convertFiltersToApiParams()` 함수 업데이트
- [ ] 6. **SSOT 파일**: `countActiveFilters()` 함수 업데이트
- [ ] 7. **훅**: `use{Feature}Filters.ts`의 `updateFilters` 함수 (필요시)
- [ ] 8. **UI**: 필터 컴포넌트 추가
- [ ] 9. **백엔드**: DTO Zod 스키마 업데이트 (필요시)
- [ ] 10. **백엔드**: Service 쿼리 로직 업데이트

---

## 8. "전체" 선택 표준화

**원칙**: 기본값과 같으면 URL에서 파라미터 제거

```typescript
// ✅ 전체 선택: /teams (파라미터 없음)
// ✅ 특정 선택: /teams?site=suwon

// updateFilters 구현 예시
if (newFilters.site !== DEFAULT_UI_FILTERS.site) {
  params.set('site', newFilters.site);
}
// site가 '' (기본값)이면 파라미터 제거됨
```

**이유**:

- 깔끔한 URL
- 기본 필터와 URL 상태 일치
- 서버 리다이렉트 로직 단순화

---

## 9. TanStack Query 통합

```typescript
// {Feature}Content.tsx
const { data, isLoading, isFetching, error } = useQuery({
  queryKey: queryKeys.{feature}.list(apiFilters),
  queryFn: () => {feature}Api.get{Feature}s(apiFilters),
  placeholderData: initialData,  // ✅ 서버 데이터를 stale로 처리
  ...QUERY_CONFIG.{FEATURE},
});
```

**`placeholderData` vs `initialData`**:

- `placeholderData`: 항상 stale 취급 → 백그라운드 refetch 보장
- `initialData`: fresh로 취급 → refetch 안 됨 (버그 위험)

---

## 10. 백엔드 DTO 타입 일치 검증

**중요**: 프론트엔드 `Api{Feature}Filters`와 백엔드 `{Feature}QueryDto`의 타입 일치 확인

```typescript
// apps/backend/src/modules/{feature}/dto/{feature}-query.dto.ts
export const {feature}QuerySchema = z.object({
  search: z.string().optional(),
  site: z.enum(['suwon', 'uiwang', 'pyeongtaek']).optional(),
  // ... API 파라미터와 동일한 필드
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export type {Feature}QueryDto = z.infer<typeof {feature}QuerySchema>;
```

---

## 참고 자료

- **성공 사례**: `apps/frontend/lib/utils/equipment-filter-utils.ts`
- **서버 컴포넌트**: `apps/frontend/app/(dashboard)/equipment/page.tsx`
- **클라이언트 훅**: `apps/frontend/hooks/use-equipment-filters.ts`
- **백엔드 DTO**: `apps/backend/src/modules/equipment/dto/equipment-query.dto.ts`

---

## 마이그레이션 체크리스트

기존 페이지를 SSOT 패턴으로 마이그레이션할 때:

- [ ] 1. `{feature}-filter-utils.ts` 작성 (이 템플릿 참조)
- [ ] 2. `{feature}-api-server.ts` 작성 (서버 API 클라이언트)
- [ ] 3. `page.tsx` 개선 (서버 fetch + 파싱 추가)
- [ ] 4. `use{Feature}Filters.ts` 훅 작성
- [ ] 5. `{Feature}Content.tsx` 리팩토링 (useState → useQuery)
- [ ] 6. 기존 파일 정리 (중복 로직 제거)
- [ ] 7. 수동 테스트 (TC-1 ~ TC-6)
- [ ] 8. 문서 업데이트 (CLAUDE.md)
