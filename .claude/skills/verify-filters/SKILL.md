---
name: verify-filters
description: URL-driven 필터 SSOT 패턴 준수 여부를 검증합니다. 목록 페이지 필터 추가/수정 후 사용.
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
| `apps/frontend/hooks/useEquipmentFilters.ts`                              | 장비 필터 훅 (레거시 이름 규칙)      |
| `apps/frontend/hooks/use-calibration-filters.ts`                          | 교정 필터 훅                         |
| `apps/frontend/hooks/use-calibration-plans-filters.ts`                    | 교정계획 필터 훅                     |
| `apps/frontend/hooks/use-team-filters.ts`                                 | 팀 필터 훅                           |
| `apps/frontend/hooks/use-notification-filters.ts`                         | 알림 필터 훅                         |
| `apps/frontend/app/(dashboard)/equipment/page.tsx`                        | 서버 컴포넌트 파싱 참조 구현         |
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

**PASS 기준:** 필터가 있는 목록 페이지(equipment, calibration, calibration-plans, teams)의 `page.tsx`에서 파싱 함수 호출.

### Step 5: Content.tsx에서 필터 useState 금지

목록 페이지의 클라이언트 컴포넌트가 필터 상태를 useState로 관리하지 않는지 확인합니다.

```bash
# 필터 관련 useState 탐지 (Content.tsx 파일)
grep -rn "useState.*site\|useState.*status\|useState.*team\|useState.*category\|useState.*search\|useState.*filter" apps/frontend/app --include="*Content.tsx" | grep -v "// \|selectedSite\|isSearch\|searchTerm\|filterOpen\|showFilter\|FilterDialog"
```

**참고:** `searchTerm`(검색어 입력), `filterOpen`(필터 UI 토글) 등 UI 전용 상태는 정상.

**PASS 기준:** Content.tsx에서 필터 파라미터(site, status, team, category)를 useState로 관리하지 않아야 함.

**FAIL 기준:** `useState<string>(site)`, `useState(selectedStatus)` 등 필터 값을 useState로 관리하면 URL 파라미터 SSOT 위반.

## Output Format

```markdown
| #   | 검사                      | 상태      | 상세                 |
| --- | ------------------------- | --------- | -------------------- |
| 1   | filter-utils 필수 export  | PASS/FAIL | 누락 함수 목록       |
| 2   | UI/API 인터페이스 쌍      | PASS/FAIL | 누락 인터페이스 목록 |
| 3   | filter hook 존재          | PASS/FAIL | 누락 hook 목록       |
| 4   | page.tsx 서버 파싱        | PASS/FAIL | 누락 page.tsx 목록   |
| 5   | Content.tsx useState 금지 | PASS/FAIL | 위반 위치 목록       |
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
