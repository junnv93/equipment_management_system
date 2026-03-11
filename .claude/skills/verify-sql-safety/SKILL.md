---
name: verify-sql-safety
description: SQL 안전성 검증 — LIKE 와일드카드 이스케이프, N+1 쿼리 패턴 탐지. 검색/목록 API 추가/수정 후 사용.
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

## Workflow

### Step 1: LIKE/ILIKE 와일드카드 미이스케이프 탐지

사용자 입력이 LIKE/ILIKE 패턴에 이스케이프 없이 직접 삽입되는 패턴을 탐지합니다.

```bash
# 사용자 입력이 LIKE 패턴에 직접 삽입되는 패턴 탐지 (템플릿 리터럴 %${...}%)
grep -rn "ilike\|like" apps/backend/src/modules --include="*.service.ts" | grep -E "\`%\\\$\{|\`\\\$\{.*\}%" | grep -v "likeContains\|likeStartsWith\|likeEndsWith\|escapeLikePattern\|// "
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
grep -rn "from 'drizzle-orm'" apps/backend/src/modules --include="*.service.ts" | grep "ilike"
```

**PASS 기준:** drizzle-orm에서 `ilike`를 직접 import하는 서비스가 0개. 모든 ILIKE 쿼리가 `safeIlike()`를 사용.

```bash
# safeIlike import 확인
grep -rn "safeIlike" apps/backend/src/modules --include="*.service.ts" | head -20
```

**FAIL 기준:** `ilike`를 drizzle-orm에서 직접 import하거나, `likeContains()` 없이 `safeIlike()`를 호출하면 위반.

### Step 4: N+1 쿼리 패턴 탐지

루프 내에서 개별 DB 쿼리를 실행하는 N+1 패턴을 탐지합니다.

```bash
# Promise.all + map + 개별 DB 쿼리 패턴 탐지
grep -rn "Promise\.all" apps/backend/src/modules --include="*.service.ts" -A 5 | grep -E "\.map.*async.*=>|\.select\(|\.from\("
```

```bash
# for/forEach 루프 내 await db 쿼리 탐지
grep -rn "for.*of\|forEach" apps/backend/src/modules --include="*.service.ts" -A 5 | grep "await.*this\.db\.\|await.*db\."
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

## Output Format

```markdown
| #   | 검사                       | 상태      | 상세                   |
| --- | -------------------------- | --------- | ---------------------- |
| 1   | LIKE 와일드카드 이스케이프 | PASS/FAIL | 미이스케이프 위치 목록 |
| 2   | SSOT 유틸리티 존재         | PASS/FAIL | 유틸리티 존재 여부     |
| 3   | SSOT import 확인           | PASS/FAIL | 누락 import 서비스     |
| 4   | N+1 쿼리 패턴              | PASS/FAIL | N+1 패턴 위치 목록     |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **SSOT 상수 기반 LIKE 패턴** — `safeIlike(column, likeStartsWith(tempPrefix))` 처럼 SSOT 상수로 조합된 내부 패턴은 유틸리티를 사용하므로 안전
2. **Promise.all 병렬 독립 쿼리** — 서로 다른 테이블에 대한 독립적인 집계 쿼리를 병렬 실행하는 것은 N+1이 아님 (예: `Promise.all([countQuery, listQuery])`)
3. **배치 크기가 고정된 소규모 루프** — 최대 5개 이하의 고정 크기 루프는 성능 영향 미미
4. **관리자 전용 일회성 작업** — 시드/마이그레이션 스크립트의 루프 쿼리는 런타임 성능 무관
