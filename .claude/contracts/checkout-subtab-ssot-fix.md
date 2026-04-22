# Contract: checkout-subtab-ssot-fix

PR-12 v2 후속 — SUBTAB_STATUS_GROUPS SSOT 강화 + stat 카드 subTab 정합성

## Slug
checkout-subtab-ssot-fix

## Scope
- apps/frontend/lib/utils/checkout-filter-utils.ts
- apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx

## Root Cause

1. **SUBTAB_STATUS_GROUPS.inProgress**가 문자열 리터럴 4개 하드코딩
   → 스키마에 새 상태 추가 시 자동 반영되지 않음 (취약한 SSOT)
   → 올바른 설계: completed를 명시, inProgress = CHECKOUT_STATUS_VALUES 나머지로 자동 파생

2. **handleStatCardClick**이 subTab을 리셋하지 않음
   → "완료" 탭에서 "기한초과" 카드 클릭 시 `subTab=completed&status=overdue` 불일치 URL 생성
   → getSubTabForStatus() 순수함수가 status 값으로부터 올바른 subTab 추론해야 함

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M1 | `pnpm --filter frontend run tsc --noEmit` exits 0 | CI |
| M2 | `pnpm --filter frontend run build` exits 0 | CI |
| M3 | `SUBTAB_STATUS_GROUPS.inProgress` = `CHECKOUT_STATUS_VALUES.filter(완료 제외)` — 문자열 리터럴 없음 | Grep |
| M4 | `SUBTAB_STATUS_GROUPS.completed` 는 명시적 terminal state 배열 (변경 없음) | Grep |
| M5 | `getSubTabForStatus(statusValue)` 순수함수 추가: `CheckoutSubTab \| null` 반환 | Grep |
| M6 | `getSubTabForStatus('all')` → `null` (toggle-off = 현재 탭 유지) | Code review |
| M7 | `getSubTabForStatus` — 단일 subTab에 속하면 해당 subTab, 혼합이면 null | Code review |
| M8 | `handleStatCardClick`이 `getSubTabForStatus`를 사용해 subTab 자동 정렬 | Grep |
| M9 | stat 카드 클릭 시 inProgress 전용 status → subTab=inProgress 전환 | Code review |
| M10 | stat 카드 클릭 시 completed 전용 status → subTab=completed 전환 | Code review |
| M11 | stat 카드 클릭 시 mixed status → 현재 subTab 유지 (null 처리) | Code review |
| M12 | 하드코딩된 CheckoutStatus 문자열 없음 (CHECKOUT_STATUS_VALUES 경유) | self-audit |

## SHOULD Criteria (루프 차단 없음)

| ID | Criterion |
|----|-----------|
| S1 | handleStatusChange(드롭다운)도 getSubTabForStatus 적용 |
| S2 | 필터 리셋(resetFilters)이 subTab도 DEFAULT로 초기화 (현재 이미 DEFAULT_UI_FILTERS 사용 → 확인만) |

## Design Invariant

```
completed = terminal states (명시 고정): return_approved, canceled, rejected
inProgress = CHECKOUT_STATUS_VALUES.filter(s => !completedSet.has(s)) [자동 파생]
→ 새 상태 추가 시 inProgress에 자동 포함됨
```
