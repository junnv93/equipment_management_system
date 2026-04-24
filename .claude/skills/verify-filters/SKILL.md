---
name: verify-filters
description: Verifies URL-driven filter SSOT pattern compliance — filter-utils required exports, hook existence, page.tsx server-side parsing, no useState for filter state (URL params are SSOT). Run after adding/modifying list page filters.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 기능명 (equipment, calibration, teams 등)]'
---

# URL-driven 필터 SSOT 패턴 검증

## Purpose

목록 페이지의 필터가 URL-driven SSOT 3계층 아키텍처를 올바르게 준수하는지 검증합니다:

1. **filter-utils 파일 구조** — `{feature}-filter-utils.ts`가 필수 4개 함수를 모두 export하는지
2. **filter hook 존재** — `use-{feature}-filters.ts` 훅이 filter-utils를 소비하는지
3. **page.tsx 서버 파싱** — 서버 컴포넌트에서 `parseFiltersFromSearchParams(searchParams)` 호출하는지
4. **Content.tsx useState 금지** — 클라이언트 컴포넌트에서 필터 상태를 useState로 관리하지 않는지
5. **타입 일관성** — UI/API 필터 인터페이스 쌍이 모두 export되는지

## When to Run

- 새로운 목록 페이지에 필터를 추가한 후
- 기존 필터 유틸리티 함수를 수정한 후
- 필터 훅을 추가/수정한 후
- 목록 페이지의 필터 UI를 변경한 후

## Related Files

| File                                                                      | Purpose                              |
| ------------------------------------------------------------------------- | ------------------------------------ |
| `apps/frontend/lib/utils/equipment-filter-utils.ts`                       | 참조 구현 (가장 완전한 패턴)         |
| `apps/frontend/lib/utils/calibration-filter-utils.ts`                     | 교정 필터 유틸리티                   |
| `apps/frontend/lib/utils/calibration-plans-filter-utils.ts`               | 교정계획 필터 유틸리티               |
| `apps/frontend/lib/utils/team-filter-utils.ts`                            | 팀 필터 유틸리티                     |
| `apps/frontend/lib/utils/notification-filter-utils.ts`                    | 알림 필터 유틸리티                   |
| `apps/frontend/lib/utils/role-filter-utils.ts`                            | 역할별 기본 필터 리다이렉트 유틸리티 |
| `apps/frontend/hooks/use-user-preferences.ts`                             | 클라이언트 사용자 설정 훅 (withPreferences 소스) |
| `apps/frontend/lib/api/preferences-server.ts`                             | 서버 사이드 사용자 설정 조회 (withPreferences 소스) |
| `apps/frontend/hooks/useEquipmentFilters.ts`                              | 장비 필터 훅 (레거시 이름 규칙)      |
| `apps/frontend/lib/utils/filter-select-utils.ts`                          | useFilterSelect 훅 — Radix Select spurious onValueChange 차단 (open 상태 ref 추적) |
| `apps/frontend/hooks/use-calibration-filters.ts`                          | 교정 필터 훅                         |
| `apps/frontend/hooks/use-calibration-plans-filters.ts`                    | 교정계획 필터 훅                     |
| `apps/frontend/hooks/use-team-filters.ts`                                 | 팀 필터 훅                           |
| `apps/frontend/hooks/use-notification-filters.ts`                         | 알림 필터 훅                         |
| `apps/frontend/lib/utils/audit-log-filter-utils.ts`                       | 감사 로그 필터 유틸리티              |
| `apps/frontend/lib/utils/checkout-filter-utils.ts`                        | 반출 필터 유틸리티                   |
| `apps/frontend/lib/utils/non-conformances-filter-utils.ts`                | 부적합 필터 유틸리티                 |
| `apps/frontend/lib/utils/software-filter-utils.ts`                        | 소프트웨어 필터 유틸리티 (hook 미존재 — 예외 #10) |
| `apps/frontend/lib/utils/reports-filter-utils.ts`                         | 보고서 필터 유틸리티 + `convertFiltersToApiParams` |
| `apps/frontend/hooks/use-nc-filters.ts`                                   | 부적합 필터 훅                       |
| `apps/frontend/hooks/use-reports-filters.ts`                              | 보고서 필터 훅                       |
| `apps/frontend/app/(dashboard)/equipment/page.tsx`                        | 서버 컴포넌트 파싱 참조 구현         |
| `apps/frontend/app/(dashboard)/checkouts/page.tsx`                        | 반출 페이지 서버 파싱                |
| `.claude/skills/equipment-management/references/filter-utils-template.md` | 필터 유틸리티 템플릿                 |

## Workflow

### Step 1: filter-utils 필수 export 확인

모든 `*-filter-utils.ts` 파일이 필수 4개 함수를 export하는지 확인합니다.

```bash
# 모든 filter-utils 파일 목록
ls apps/frontend/lib/utils/*-filter-utils.ts
```

각 파일에 대해 필수 export를 확인합니다:

```bash
# 필수 export 확인 (role-filter-utils.ts 제외 — 리다이렉트 전용)
for f in $(ls apps/frontend/lib/utils/*-filter-utils.ts | grep -v role-filter); do
  echo "=== $f ==="
  missing=""
  grep -q "parseFiltersFromSearchParams\|parse.*FiltersFromSearchParams" "$f" || missing="$missing parseFromSearchParams"
  grep -q "convertFiltersToApiParams\|convertToApiParams" "$f" || missing="$missing convertToApiParams"
  grep -q "countActiveFilters" "$f" || missing="$missing countActiveFilters"
  grep -q "DEFAULT_UI_FILTERS\|getDefaultUIFilters" "$f" || missing="$missing DEFAULT_UI_FILTERS"
  if [ -n "$missing" ]; then
    echo "MISSING:$missing"
  else
    echo "OK"
  fi
done
```

**PASS 기준:** 모든 filter-utils 파일에 4개 필수 export가 존재.

**FAIL 기준:** 하나라도 누락되면 해당 함수 추가 필요.

### Step 2: UI/API 필터 인터페이스 쌍 확인

각 filter-utils 파일이 `UI{Feature}Filters`와 `Api{Feature}Filters` 인터페이스 쌍을 export하는지 확인합니다.

```bash
# UI/API 필터 타입 쌍 확인
for f in $(ls apps/frontend/lib/utils/*-filter-utils.ts | grep -v role-filter); do
  echo "=== $f ==="
  ui=$(grep -c "export interface UI.*Filters\|export type UI.*Filters" "$f")
  api=$(grep -c "export interface Api.*Filters\|export type Api.*Filters" "$f")
  if [ "$ui" -eq 0 ] || [ "$api" -eq 0 ]; then
    echo "MISSING: UI=$ui, API=$api"
  else
    echo "OK: UI=$ui, API=$api"
  fi
done
```

**PASS 기준:** 모든 파일에 UI 및 API 필터 인터페이스가 존재.

### Step 3: filter hook 존재 및 구조 확인

각 filter-utils에 대응하는 filter hook이 존재하는지 확인합니다.

```bash
# filter-utils에 대응하는 hook 존재 확인
for f in $(ls apps/frontend/lib/utils/*-filter-utils.ts | grep -v role-filter); do
  feature=$(basename "$f" | sed 's/-filter-utils.ts//')
  # useEquipmentFilters는 레거시 이름 규칙
  hook=$(ls apps/frontend/hooks/use-${feature}-filters.ts apps/frontend/hooks/use${feature^}Filters.ts apps/frontend/hooks/useEquipmentFilters.ts 2>/dev/null | head -1)
  if [ -z "$hook" ]; then
    echo "MISSING HOOK for: $feature"
  else
    echo "OK: $feature → $hook"
  fi
done
```

```bash
# hook이 filter-utils를 import하는지 확인
grep -rn "from.*filter-utils\|from.*filter-utils" apps/frontend/hooks/use*-filters.ts apps/frontend/hooks/useEquipmentFilters.ts 2>/dev/null
```

**PASS 기준:** 모든 filter-utils에 대응하는 hook이 존재하고, hook이 utils를 import.

### Step 4: page.tsx 서버 사이드 파싱 확인

목록 페이지의 `page.tsx`가 서버 컴포넌트에서 searchParams를 파싱하는지 확인합니다.

```bash
# 주요 목록 페이지에서 parseFiltersFromSearchParams 호출 확인
grep -rn "parse.*FiltersFromSearchParams" apps/frontend/app --include="page.tsx"
```

**PASS 기준:** 필터가 있는 목록 페이지(equipment, calibration, calibration-plans, teams, checkouts)의 `page.tsx`에서 파싱 함수 호출.

### Step 5: Content.tsx에서 필터 useState 금지

목록 페이지의 클라이언트 컴포넌트가 필터 상태를 useState로 관리하지 않는지 확인합니다.

```bash
# 필터 관련 useState 탐지 (Content.tsx 파일)
grep -rn "useState.*site\|useState.*status\|useState.*team\|useState.*category\|useState.*search\|useState.*filter" apps/frontend/app --include="*Content.tsx" | grep -v "// \|selectedSite\|isSearch\|searchTerm\|filterOpen\|showFilter\|FilterDialog"
```

**참고:** `searchTerm`(검색어 입력), `filterOpen`(필터 UI 토글) 등 UI 전용 상태는 정상.

**PASS 기준:** Content.tsx에서 필터 파라미터(site, status, team, category)를 useState로 관리하지 않아야 함.

**FAIL 기준:** `useState<string>(site)`, `useState(selectedStatus)` 등 필터 값을 useState로 관리하면 URL 파라미터 SSOT 위반.

### Step 6: preference 기반 필터 주입 (withPreferences) 확인

filter-utils에 `withPreferences` 함수가 있는 경우, 서버(page.tsx)와 클라이언트(filter hook) 양쪽에서 동일하게 사용되는지 확인합니다.

```bash
# withPreferences 함수가 있는 filter-utils 확인
grep -rn "export function withPreferences" apps/frontend/lib/utils/*-filter-utils.ts
```

```bash
# withPreferences를 사용하는 서버/클라이언트 파일 확인
grep -rn "withPreferences" apps/frontend/app --include="page.tsx"
grep -rn "withPreferences" apps/frontend/hooks --include="*.ts"
```

**PASS 기준:** `withPreferences`가 정의된 경우, 대응하는 page.tsx(서버)와 filter hook(클라이언트)에서 모두 사용.

**FAIL 기준:** 서버 또는 클라이언트 한쪽에서만 사용하면 초기 fetch와 클라이언트 fetch 간 불일치 발생.

**참고:** `withPreferences`는 URL 필터가 아닌 사용자 설정(DisplayPreferences)을 API 파라미터에 병합하는 함수. `showRetired` 같은 preference 기반 필터에 사용.

### Step 7: subTab SSOT 파생 확인 (checkout-filter-utils 전용)

`checkout-filter-utils.ts`의 `SUBTAB_STATUS_GROUPS`가 `CHECKOUT_STATUS_VALUES.filter()`로 자동 파생되는지,
그리고 `getSubTabForStatus()`가 stat 카드 클릭 핸들러에서 사용되는지 확인합니다.

```bash
# SUBTAB_STATUS_GROUPS.inProgress가 CHECKOUT_STATUS_VALUES.filter()로 파생되는지 확인
# 문자열 리터럴 하드코딩이면 FAIL
grep -A3 "SUBTAB_STATUS_GROUPS" apps/frontend/lib/utils/checkout-filter-utils.ts | grep "inProgress"
```

**PASS 기준:** `inProgress: CHECKOUT_STATUS_VALUES.filter(...)` 형태로 파생됨.
**FAIL 기준:** `inProgress: ['pending', 'approved', ...]` 등 문자열 리터럴 직접 배열.

```bash
# getSubTabForStatus가 CheckoutsContent.tsx의 stat 카드 핸들러에서 사용되는지 확인
grep -n "getSubTabForStatus" \
  apps/frontend/app/\(dashboard\)/checkouts/CheckoutsContent.tsx
```

**PASS 기준:** `handleStatCardClick` 또는 `handleStatusChange` 내에서 `getSubTabForStatus` 호출 확인.
**FAIL 기준:** `getSubTabForStatus` 정의는 있으나 stat 카드 핸들러에서 미사용 → subTab 자동 정렬 누락.

### Step 6: URL 기반 섹션 독립 페이지네이션 훅

한 페이지 내 여러 독립 섹션이 각각 별도 URL 파라미터로 페이지네이션하는 경우,
URL이 유일한 진실의 소스(SSOT)여야 한다.

**올바른 패턴 (use-inbound-section-pagination.ts 기준):**
```typescript
// ✅ URL에서 파생, useState 없음
const rentalPage = Number(searchParams.get('rentalPage') ?? '1');
const setRentalPage = (page: number) => router.replace(`...?rentalPage=${page}`, { scroll: false });
```

**탐지:**
```bash
# 섹션 페이지네이션 훅에서 useState로 page 관리하는 패턴
grep -rn "useState.*Page\|Page.*useState" \
  apps/frontend/hooks/use-*pagination*.ts 2>/dev/null

# router.replace에 scroll: false 누락
grep -rn "router\.replace\|router\.push" \
  apps/frontend/hooks/use-*pagination*.ts | grep -v "scroll: false"

# FRONTEND_ROUTES SSOT 우회하는 인라인 URL
grep -rn "router\.replace.*'/checkouts\|router\.push.*'/checkouts" \
  apps/frontend/hooks --include="*.ts"
```

**PASS:** 섹션 페이지네이션 훅 전체가 URL searchParams 기반, `scroll: false`, `FRONTEND_ROUTES` SSOT 사용. **FAIL:** `useState` 페이지 이중 관리 또는 인라인 URL.

### Step 8: 필터 핸들러에서 filtersToSearchParams SSOT 우회 탐지

필터 값 변경 핸들러(handleXxxChange, handlePageChange, handleSubTabChange 등)에서 URL 파라미터를 직접 생성·편집하는 패턴은 `filtersToSearchParams` SSOT를 우회한다.
`filtersToSearchParams`는 기본값(inProgress/all/1 등)을 자동으로 omit하므로, 직접 URLSearchParams를 구성하면 기본값이 URL에 남아 라우팅 이력이 오염된다.

**올바른 패턴 (checkout-filter-utils.ts 기반):**
```typescript
// ✅ filtersToSearchParams SSOT 경유
const handlePageChange = (newPage: number) => {
  const params = filtersToSearchParams({ ...filters, page: newPage });
  const qs = params.toString();
  router.replace(qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST, { scroll: false });
};
```

**금지 패턴:**
```typescript
// ❌ new URLSearchParams(searchParams.toString()) 직접 조작
const handlePageChange = (newPage: number) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set('page', newPage.toString());
  router.replace(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?${params.toString()}`, { scroll: false });
};
```

**탐지:**
```bash
# 필터 핸들러에서 new URLSearchParams(searchParams.toString()) 직접 조작 패턴
grep -rn "new URLSearchParams(searchParams" \
  apps/frontend/app apps/frontend/components \
  --include="*.tsx" --include="*.ts"

# 필터 핸들러에서 params.set/params.delete 직접 호출 (SSOT 우회 가능성)
grep -rn "params\.set\|params\.delete" \
  apps/frontend/app/\(dashboard\) \
  --include="*.tsx" | grep -v "filtersToSearchParams\|filter-utils\|\/\/"
```

**PASS:** 필터 핸들러에서 `new URLSearchParams(searchParams.toString())` 직접 조작 0건.
**FAIL:** 핸들러 내부에서 `new URLSearchParams`를 생성하거나 `params.set/delete`로 개별 키 조작 → `filtersToSearchParams({ ...filters, changedKey: value })` 패턴으로 교체.

### Step 9: 탭 컴포넌트 `countActiveFilters` SSOT 사용 확인

필터가 있는 목록 탭 컴포넌트(OutboundCheckoutsTab, InboundCheckoutsTab 등)에서
`filterActive` 판단 시 `countActiveFilters(filters)` SSOT를 사용하는지 확인합니다.
인라인 `statusFilter !== 'all' || !!searchTerm` 계산은 새 필터 추가 시 자동 동기화가 안 돼 EmptyState 분기 버그 발생.
(85차: InboundCheckoutsTab에서 인라인 계산으로 destination/purpose 필터 활성 상태를 놓침)

```bash
# 탭 컴포넌트에서 countActiveFilters 사용 여부 확인
grep -rn "filterActive" \
  apps/frontend/app/\(dashboard\)/checkouts/tabs/ \
  --include="*.tsx"
```

**PASS 기준:**
- `filterActive`를 계산하는 모든 탭 컴포넌트가 `countActiveFilters(filters) > 0` 형태 사용
- `countActiveFilters` import가 `checkout-filter-utils`에서 옴

**FAIL 기준:**
- `statusFilter !== 'all' || !!searchTerm` 등 인라인 계산 패턴 → `countActiveFilters(filters) > 0`으로 교체

```bash
# 인라인 filterActive 계산 패턴 탐지
grep -rn "filterActive.*!==\|filterActive.*!!" \
  apps/frontend/app/\(dashboard\)/checkouts/tabs/ \
  --include="*.tsx"
```

## Output Format

```markdown
| #   | 검사                      | 상태      | 상세                 |
| --- | ------------------------- | --------- | -------------------- |
| 1   | filter-utils 필수 export  | PASS/FAIL | 누락 함수 목록       |
| 2   | UI/API 인터페이스 쌍      | PASS/FAIL | 누락 인터페이스 목록 |
| 3   | filter hook 존재          | PASS/FAIL | 누락 hook 목록       |
| 4   | page.tsx 서버 파싱        | PASS/FAIL | 누락 page.tsx 목록   |
| 5   | Content.tsx useState 금지 | PASS/FAIL | 위반 위치 목록       |
| 6   | 섹션 독립 페이지네이션    | PASS/FAIL | useState 이중관리 훅 목록 |
| 7   | subTab SSOT 파생 (checkout) | PASS/FAIL | inProgress 하드코딩 여부 |
| 8   | filtersToSearchParams SSOT | PASS/FAIL | new URLSearchParams 직접 조작 위치 |
| 9   | 탭 컴포넌트 countActiveFilters SSOT | PASS/FAIL | 인라인 filterActive 계산 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **role-filter-utils.ts** — 역할별 기본 필터 리다이렉트 전용 유틸리티로, 4개 필수 함수 패턴 불필요
2. **useEquipmentFilters.ts** — 레거시 이름 규칙 (camelCase). 새 훅은 `use-{feature}-filters.ts` (kebab-case) 사용
3. **approval-count-utils.ts** — 승인 카운트 유틸리티로, 필터 유틸리티가 아님
4. **Content.tsx의 searchTerm useState** — 검색어 입력 디바운스용 UI 상태. `useSearchParams`와 별개로 입력 중간값 관리
5. **Content.tsx의 filterOpen/showFilter useState** — 필터 패널 열기/닫기 토글 UI 상태
6. **calibration-plans-filter-utils.ts의 getDefaultUIFilters()** — 연도 기반 동적 기본값이므로 상수 대신 함수 사용
7. **notification-filter-utils.ts의 buildNotificationFilterUrl()** — 추가 유틸리티 함수, 필수는 아니지만 패턴 일관성을 위해 권장
8. **audit-log-filter-utils.ts에 대응하는 hook 미존재** — 감사 로그 필터는 `page.tsx`에서 직접 서버 파싱 후 Content에 props 전달하는 패턴. 별도 클라이언트 hook 불필요 (admin 전용 페이지, URL 직접 조작 없음)
9. **checkout-filter-utils.ts에 대응하는 hook 미존재** — 반출 필터는 `CheckoutsContent.tsx`가 `useSearchParams()`로 직접 파싱하는 패턴 (`parseCheckoutFiltersFromSearchParams(searchParams)` 사용). 별도 hook 불필요 (탭 전환 시 필터 리셋 로직이 Content에 포함됨)
10. **software-filter-utils.ts에 대응하는 hook 미존재** — 소프트웨어 필터는 `TestSoftwareListContent.tsx`가 `useSearchParams()`로 직접 파싱하는 패턴 (`parseTestSoftwareFiltersFromSearchParams(searchParams)` 사용). 별도 hook 불필요 (단일 목록 페이지, 필터 리셋 로직이 Content에 포함됨)
11. **checkout-filter-utils.ts의 `ApiCheckoutParams` 타입명** — `Api*Filters` 패턴 불일치이나 의도적 명명. API 파라미터임을 명시하는 `Params` 접미사 사용. Step 2 grep 패턴에서 false negative 발생 가능하나 실제 `ApiCheckoutParams` export 존재 확인으로 대체.
