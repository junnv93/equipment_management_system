---
name: verify-sql-safety
description: Verifies SQL safety — LIKE wildcard escaping, N+1 query pattern detection, COUNT(DISTINCT) for fan-out JOINs, RBAC INNER JOIN enforcement. Run after adding/modifying search or list API endpoints.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# SQL 안전성 검증

## Purpose

백엔드 SQL 쿼리가 안전하고 효율적인 패턴을 따르는지 검증합니다:

1. **LIKE 와일드카드 이스케이프** — 사용자 입력이 LIKE/ILIKE 패턴에 사용될 때 `%`와 `_` 메타문자를 이스케이프하는지
2. **likeContains/likeStartsWith SSOT 유틸리티 사용** — 개별 이스케이프 대신 공유 유틸리티 함수를 사용하는지
3. **N+1 쿼리 패턴** — 루프 내 개별 DB 쿼리 대신 JOIN/배치 쿼리를 사용하는지

## When to Run

- 검색 기능을 추가하거나 수정한 후
- LIKE/ILIKE 쿼리를 포함하는 서비스를 변경한 후
- 목록/조회 API에서 관련 데이터를 추가 로딩하는 로직을 수정한 후
- 새로운 서비스 모듈을 추가한 후

## Related Files

| File                                                                          | Purpose                                                                                            |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/backend/src/common/utils/like-escape.ts`                                | SSOT 유틸리티 (escapeLikePattern, likeContains, likeStartsWith, likeEndsWith, safeIlike, safeLike) |
| `apps/backend/src/common/utils/like-escape.spec.ts`                           | 유틸리티 유닛 테스트 (13개)                                                                        |
| `apps/backend/src/common/utils/index.ts`                                      | 유틸리티 re-export barrel                                                                          |
| `apps/backend/src/modules/equipment/equipment.service.ts`                     | LIKE 검색 사용 (4건)                                                                               |
| `apps/backend/src/modules/checkouts/checkouts.service.ts`                     | LIKE 검색 사용 (3건)                                                                               |
| `apps/backend/src/modules/software/software.service.ts`                       | LIKE 검색 사용 (3건)                                                                               |
| `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts`     | LIKE 검색 사용 (4건)                                                                               |
| `apps/backend/src/modules/notifications/notifications.service.ts`             | ILIKE 검색 사용 (4건)                                                                              |
| `apps/backend/src/modules/users/users.service.ts`                             | ILIKE 검색 사용 (4건)                                                                              |
| `apps/backend/src/modules/teams/teams.service.ts`                             | ILIKE 검색 사용 (2건)                                                                              |
| `apps/backend/src/modules/calibration/calibration.service.ts`                 | ILIKE 검색 사용 (3건)                                                                              |
| `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` | ILIKE 검색 사용 (1건)                                                                              |
| `apps/backend/src/modules/non-conformances/non-conformances.service.ts`       | ILIKE 검색 사용 (1건)                                                                              |
| `apps/backend/src/modules/notifications/schedulers/digest-email-scheduler.ts` | fan-out JOIN (checkouts→checkoutItems→equipment) + Map dedup                                       |
| `apps/backend/src/modules/equipment/services/equipment-history.service.ts`   | COUNT(DISTINCT) + 페이지네이션 (DEFAULT_PAGE_SIZE/MAX_PAGE_SIZE SSOT), checkoutItems 경유 JOIN  |
| `packages/shared-constants/src/pagination.ts`                                 | SSOT 페이지네이션 상수 (DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE 등)                                    |
| `apps/backend/src/common/file-upload/document.service.ts`                     | CTE 재귀 쿼리 (개정 이력), inArray 배치 쿼리 (장비+교정 통합 문서), LIMIT 배치 purge (purgeDeletedDocuments) |
| `apps/backend/src/modules/checkouts/checkout-scope.util.ts`                   | Checkout 스코프 SSOT 헬퍼 — list/KPI/action 가드가 동일 3-case predicate 공유 (Step 6a 참조) |

## Workflow

> **검색 범위 주의:** grep 대상에 `apps/backend/src/modules`뿐만 아니라 `apps/backend/src/common`도 포함해야 합니다. `document.service.ts` 등 common 디렉토리의 서비스도 SQL 쿼리를 실행합니다.

### Step 1: LIKE/ILIKE 와일드카드 미이스케이프 탐지

사용자 입력이 LIKE/ILIKE 패턴에 이스케이프 없이 직접 삽입되는 패턴을 탐지합니다.

```bash
# 사용자 입력이 LIKE 패턴에 직접 삽입되는 패턴 탐지 (템플릿 리터럴 %${...}%)
grep -rn "ilike\|like" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" | grep -E "\`%\\\$\{|\`\\\$\{.*\}%" | grep -v "likeContains\|likeStartsWith\|likeEndsWith\|escapeLikePattern\|// "
```

**PASS 기준:** 0개 결과 (모든 LIKE 패턴이 SSOT 유틸리티를 사용).

**FAIL 기준:** `` `%${search}%` `` 패턴에서 `search` 변수가 이스케이프되지 않으면 위반.

```typescript
// ❌ WRONG — 와일드카드 미이스케이프 (% 와 _ 인젝션 가능)
ilike(equipment.name, `%${search}%`);

// ❌ WRONG — likeContains 사용하지만 ESCAPE 절 누락
import { likeContains } from '../../common/utils/like-escape';
ilike(equipment.name, likeContains(search));

// ✅ CORRECT — safeIlike + likeContains (명시적 ESCAPE '!' 절 포함)
import { likeContains, safeIlike } from '../../common/utils/like-escape';
safeIlike(equipment.name, likeContains(search));
```

### Step 2: SSOT 유틸리티 존재 및 ESCAPE 문자 확인

중앙화된 이스케이프 유틸리티가 존재하고, 명시적 ESCAPE 절을 사용하는지 확인합니다.

```bash
# like-escape 유틸리티 존재 확인
ls apps/backend/src/common/utils/like-escape.ts 2>/dev/null || echo "MISSING: like-escape.ts 유틸리티 파일 없음"
```

```bash
# SSOT 함수 정의 확인 (6개 함수 모두 존재해야 함)
grep -rn "export function" apps/backend/src/common/utils/like-escape.ts
```

**PASS 기준:** `escapeLikePattern`, `likeContains`, `likeStartsWith`, `likeEndsWith`, `safeIlike`, `safeLike` 6개 함수가 정의되어 있고, `common/utils/index.ts`에서 re-export됨. 이스케이프 문자는 `!`이고 `LIKE_ESCAPE_CHAR` 상수로 정의.

**FAIL 기준:** 유틸리티 파일이 없거나, `\` 이스케이프 사용하거나, 각 서비스에서 인라인으로 이스케이프하면 위반.

```bash
# re-export 확인
grep "like-escape" apps/backend/src/common/utils/index.ts
```

```bash
# ESCAPE 문자 확인 — '!' 사용해야 함 (\ 사용은 standard_conforming_strings 의존)
grep "LIKE_ESCAPE_CHAR" apps/backend/src/common/utils/like-escape.ts
```

```bash
# SSOT 일관성 확인 — LIKE_ESCAPE_CHAR가 export되고, escapeLikePattern에서 직접 참조하는지
# (하드코딩된 이스케이프 문자가 없어야 함)
grep -n "export const LIKE_ESCAPE_CHAR" apps/backend/src/common/utils/like-escape.ts
grep -n "const e = LIKE_ESCAPE_CHAR" apps/backend/src/common/utils/like-escape.ts
grep -n "sql.raw" apps/backend/src/common/utils/like-escape.ts
```

**추가 PASS 기준:** `LIKE_ESCAPE_CHAR`가 `export`되고, `escapeLikePattern` 내부에서 직접 참조하며, `safeIlike`/`safeLike`에서 `sql.raw()`를 통해 SQL 리터럴로 삽입됨 (파라미터 바인딩이 아닌 리터럴로 GIN 인덱스 plan-time 최적화 보장).

### Step 3: safeIlike 사용 확인 (drizzle-orm ilike 직접 사용 금지)

모든 서비스가 drizzle-orm의 `ilike()` 대신 `safeIlike()`를 사용하는지 확인합니다.

```bash
# drizzle-orm에서 ilike를 직접 import하는 서비스 탐지 (safeIlike만 허용)
grep -rn "from 'drizzle-orm'" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" | grep "ilike"
```

**PASS 기준:** drizzle-orm에서 `ilike`를 직접 import하는 서비스가 0개. 모든 ILIKE 쿼리가 `safeIlike()`를 사용.

```bash
# safeIlike import 확인
grep -rn "safeIlike" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" | head -20
```

**FAIL 기준:** `ilike`를 drizzle-orm에서 직접 import하거나, `likeContains()` 없이 `safeIlike()`를 호출하면 위반.

### Step 4: N+1 쿼리 패턴 탐지

루프 내에서 개별 DB 쿼리를 실행하는 N+1 패턴을 탐지합니다.

```bash
# Promise.all + map + 개별 DB 쿼리 패턴 탐지
grep -rn "Promise\.all" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" -A 5 | grep -E "\.map.*async.*=>|\.select\(|\.from\("
```

```bash
# for/forEach 루프 내 await db 쿼리 탐지
grep -rn "for.*of\|forEach" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" -A 5 | grep "await.*this\.db\.\|await.*db\."
```

**PASS 기준:** 관련 데이터 로딩이 JOIN 또는 배치 IN() 쿼리로 처리.

**FAIL 기준:** `Promise.all(items.map(async (item) => { await db.select().from(table).where(...) }))` 패턴 발견 시 위반.

```typescript
// ❌ WRONG — N+1 (N개 개별 쿼리)
const withRelated = await Promise.all(
  items.map(async (item) => {
    const [related] = await this.db.select().from(users).where(eq(users.id, item.userId));
    return { ...item, related };
  })
);

// ✅ CORRECT — 단일 JOIN 쿼리
const withRelated = await this.db
  .select({ ...getTableColumns(items), related: { id: users.id, name: users.name } })
  .from(itemsTable)
  .leftJoin(users, eq(itemsTable.userId, users.id))
  .where(conditions);
```

### Step 5: COUNT(DISTINCT) fan-out JOIN 탐지

다:다 관계 JOIN(예: checkouts → checkoutItems) 시 `count()` 사용은 item 수만큼 카운트 뻥튀기. `COUNT(DISTINCT)` 필수.

```bash
# count() + JOIN 조합 탐지 — COUNT(DISTINCT)가 아닌 count() 사용
grep -rn "count(" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" -B 5 | grep -E "Join.*Items|Join.*checkoutItems|Join.*checkout_items"
```

**PASS 기준:** fan-out JOIN이 있는 쿼리에서 `COUNT(DISTINCT table.id)` 또는 `sql<number>\`COUNT(DISTINCT ...)\`` 사용.

**FAIL 기준:** `count(table.id)` (drizzle `count()` 함수)를 다:다 JOIN과 함께 사용하면 카운트 뻥튀기.

### Step 6: RBAC scope 적용 시 INNER JOIN 사용 확인

RBAC scope 조건이 equipment 테이블 컬럼(`siteCode`, `teamId`)을 통해 적용되는 경우, `LEFT JOIN`은 NULL 행이 scope 필터를 우회할 수 있음. scope 적용 대상 테이블은 `INNER JOIN` 사용 필요.

**예외:** equipment 기준 쿼리(활용률 등)에서 반출 없는 장비도 표시하려면 `LEFT JOIN` 의도적 사용 가능. `teamsTable` JOIN은 팀 미배정 장비 표시를 위해 항상 `LEFT JOIN` 허용.

```bash
# LEFT JOIN + scopeConditions 조합 탐지
grep -rn "leftJoin.*equipmentTable" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" -B 3 | grep -v "teamsTable\|node_modules"
```

**PASS 기준:** scope 적용 대상 테이블(calibrations→equipment, repairHistory→equipment, checkouts→checkoutItems→equipment)은 `innerJoin` 사용. `teamsTable`과 활용률 쿼리의 `checkoutItems`/`checkouts` LEFT JOIN은 면제.

**FAIL 기준:** scope 조건이 적용되는 equipment 테이블에 `leftJoin` 사용 시 RBAC 우회 가능.

### Step 6a: Cross-cutting scope predicate SSOT (35차 추가)

같은 도메인의 list / KPI / action 가드가 site/team scope 조건을 **각자 인라인 SQL로** 작성하면 list↔action 비대칭이 발생한다 (33차 phantom row 버그). 한 번 SSOT 헬퍼로 추출했으면 모든 read/write site에서 해당 헬퍼만 호출해야 한다.

**현재 SSOT 헬퍼:**
- `apps/backend/src/modules/checkouts/checkout-scope.util.ts` — `buildCheckoutSiteCondition` / `buildCheckoutTeamCondition` / `buildCheckoutScopeFromResolved` / `buildCheckoutScopeForUser`. List, KPI, approval count 모두 이 헬퍼만 사용. 액션 가드 (`enforceScopeFromData`, `enforceScopeFromCheckout`)와 동일 정의.

**탐지 (positive presence — 헬퍼 호출 강제):**
```bash
# (1) 두 서비스 모두 SSOT 헬퍼 호출이 ≥1 건 존재해야 한다.
#     negative grep 은 lender 컬럼의 정당한 사용(approve action 가드, getAffectedTeamIds 등)
#     에서 noise 가 매우 크므로 positive presence 로 검사한다.
grep -nE "buildCheckoutScope(ForUser|FromResolved)|buildCheckoutSiteCondition|buildCheckoutTeamCondition" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  apps/backend/src/modules/approvals/approvals.service.ts

# (2) 안티패턴 정밀 가드 — list/count 쿼리에서 users 테이블을 requesterId 로 join 하면
#     33차 phantom row 버그 형태가 부활한 것 (helper 내부 inArray subquery 는 단일 컬럼
#     select 라 다음 grep 에 매칭되지 않는다).
grep -nE "innerJoin\(.*users.*requesterId|leftJoin\(.*users.*requesterId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  apps/backend/src/modules/approvals/approvals.service.ts
```

**PASS:**
- (1) 두 서비스 모두 헬퍼 호출 ≥1 건
- (2) requesterId↔users JOIN 0 건 (helper 내부 subquery 는 본 grep 에 매칭되지 않음)

**FAIL:** 헬퍼 호출이 사라지거나 users↔requesterId JOIN 이 list/count 메서드 본문에 다시 등장 → SSOT 헬퍼 호출로 교체.

**예외 (allowed):**
- 단일 checkout 의 site/team **ownership resolver** (e.g. `eq(checkouts.id, checkoutId)` 단일 행 쿼리에서 CASE/WHEN 으로 rental 분기 처리). 이는 action 가드 측 SSOT (`enforceScopeFromData` 와 동일 정의)이며 list filter 가 아니다. 현재 면제 위치: `apps/backend/src/modules/checkouts/checkouts.service.ts:2320-2335` (rental-aware ownership 추출).

**확장 시 규칙:** 다른 도메인(예: equipment-imports, calibrations)에서 동일한 list/action 비대칭이 발생하면 같은 패턴으로 `*-scope.util.ts` 헬퍼를 추출하고 본 Step 의 grep 대상에 추가한다.

### Step 7: 순환 의존성 (forwardRef) 모니터링

모듈 간 순환 의존성이 증가하는지 모니터링합니다. `forwardRef()`는 NestJS에서 순환 의존을 해결하는 기법이지만, 과도한 사용은 아키텍처 결합도 증가를 나타냅니다.

```bash
# forwardRef 사용 현황 확인
grep -rn "forwardRef" apps/backend/src/modules apps/backend/src/common --include="*.module.ts"
```

**PASS 기준:** `forwardRef()` 사용이 기존 알려진 순환 의존 쌍(Equipment↔NonConformances, Checkouts↔EquipmentImports, Notifications↔Calibration/Auth)에 한정. 새 `forwardRef()` 추가 시 WARNING.

**FAIL 기준:** 새로운 `forwardRef()` 추가 시 이슈로 보고 (순환 의존 해소 또는 의도적 설계인지 확인 필요).

### Step 8: 무제한 쿼리 결과 탐지

`findMany()` 또는 `.select().from()` 쿼리에 `.limit()`이 없는 목록 조회 패턴을 탐지합니다.

```bash
# findMany 호출에서 limit 없는 패턴 탐지 (public 메서드만)
grep -rn "findMany({" apps/backend/src/modules --include="*.service.ts" -A 10 | grep -v "limit:" | grep "findMany"
```

**PASS 기준:** 목록 조회 메서드(findAll, getList 등)에 `limit` 또는 페이지네이션 파라미터가 포함.

**FAIL 기준:** 공개 API에서 호출되는 findMany에 limit이 없으면 대량 데이터 반환 위험.

## Output Format

```markdown
| #   | 검사                       | 상태      | 상세                   |
| --- | -------------------------- | --------- | ---------------------- |
| 1   | LIKE 와일드카드 이스케이프 | PASS/FAIL | 미이스케이프 위치 목록 |
| 2   | SSOT 유틸리티 존재         | PASS/FAIL | 유틸리티 존재 여부     |
| 3   | SSOT import 확인           | PASS/FAIL | 누락 import 서비스     |
| 4   | N+1 쿼리 패턴              | PASS/FAIL | N+1 패턴 위치 목록     |
| 5   | COUNT(DISTINCT) fan-out    | PASS/FAIL | 뻥튀기 카운트 위치     |
| 6   | RBAC INNER JOIN            | PASS/FAIL | scope 우회 위치        |
| 7   | 순환 의존성 모니터링       | PASS/WARN | 새 forwardRef 추가 여부 |
| 8   | 무제한 쿼리 결과           | PASS/FAIL | limit 없는 목록 쿼리   |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **SSOT 상수 기반 LIKE 패턴** — `safeIlike(column, likeStartsWith(tempPrefix))` 처럼 SSOT 상수로 조합된 내부 패턴은 유틸리티를 사용하므로 안전
2. **Promise.all 병렬 독립 쿼리** — 서로 다른 테이블에 대한 독립적인 집계 쿼리를 병렬 실행하는 것은 N+1이 아님 (예: `Promise.all([countQuery, listQuery])`)
3. **배치 크기가 고정된 소규모 루프** — 최대 5개 이하의 고정 크기 루프는 성능 영향 미미
4. **관리자 전용 일회성 작업** — 시드/마이그레이션 스크립트의 루프 쿼리는 런타임 성능 무관
