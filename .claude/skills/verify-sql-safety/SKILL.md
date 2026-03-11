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
2. **escapeLike SSOT 유틸리티 사용** — 개별 이스케이프 대신 공유 유틸리티 함수를 사용하는지
3. **N+1 쿼리 패턴** — 루프 내 개별 DB 쿼리 대신 JOIN/배치 쿼리를 사용하는지

## When to Run

- 검색 기능을 추가하거나 수정한 후
- LIKE/ILIKE 쿼리를 포함하는 서비스를 변경한 후
- 목록/조회 API에서 관련 데이터를 추가 로딩하는 로직을 수정한 후
- 새로운 서비스 모듈을 추가한 후

## Related Files

| File                                                                          | Purpose                              |
| ----------------------------------------------------------------------------- | ------------------------------------ |
| `apps/backend/src/common/utils/sql-escape.ts`                                 | escapeLike SSOT 유틸리티 (생성 필요) |
| `apps/backend/src/modules/equipment/equipment.service.ts`                     | LIKE 검색 사용 (4건)                 |
| `apps/backend/src/modules/checkouts/checkouts.service.ts`                     | LIKE 검색 (3건) + N+1 쿼리 (1건)     |
| `apps/backend/src/modules/software/software.service.ts`                       | LIKE 검색 사용 (3건)                 |
| `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts`     | LIKE 검색 사용 (4건)                 |
| `apps/backend/src/modules/notifications/notifications.service.ts`             | ILIKE 검색 사용 (4건)                |
| `apps/backend/src/modules/users/users.service.ts`                             | ILIKE 검색 사용 (4건)                |
| `apps/backend/src/modules/teams/teams.service.ts`                             | ILIKE 검색 사용 (2건)                |
| `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` | ILIKE 검색 사용 (1건)                |
| `apps/backend/src/modules/non-conformances/non-conformances.service.ts`       | LIKE 검색 사용 (1건)                 |

## Workflow

### Step 1: LIKE/ILIKE 와일드카드 미이스케이프 탐지

사용자 입력이 LIKE/ILIKE 패턴에 이스케이프 없이 직접 삽입되는 패턴을 탐지합니다.

```bash
# 사용자 입력이 LIKE 패턴에 직접 삽입되는 패턴 탐지
grep -rn "like\|ilike" apps/backend/src/modules --include="*.service.ts" | grep -E "\`%\$\{|%\$\{" | grep -v "escapeLike\|// "
```

**PASS 기준:** 0개 결과 (모든 LIKE 패턴이 `escapeLike()` 유틸리티를 사용).

**FAIL 기준:** `` `%${search}%` `` 패턴에서 `search` 변수가 이스케이프되지 않으면 위반.

```typescript
// ❌ WRONG — 와일드카드 미이스케이프 (% 와 _ 인젝션 가능)
like(equipment.name, `%${search}%`);

// ✅ CORRECT — escapeLike SSOT 유틸리티 사용
import { escapeLike } from '@/common/utils/sql-escape';
like(equipment.name, `%${escapeLike(search)}%`);
```

### Step 2: escapeLike SSOT 유틸리티 존재 확인

중앙화된 이스케이프 유틸리티가 존재하는지 확인합니다.

```bash
# escapeLike 유틸리티 존재 확인
ls apps/backend/src/common/utils/sql-escape.ts 2>/dev/null || echo "MISSING: sql-escape.ts 유틸리티 파일 없음"
```

```bash
# escapeLike 함수 정의 확인
grep -rn "export.*function escapeLike\|export const escapeLike" apps/backend/src/common --include="*.ts"
```

**PASS 기준:** `escapeLike` 함수가 `common/utils/sql-escape.ts`에 정의되어 있고, `%` → `\%`, `_` → `\_` 변환을 수행.

**FAIL 기준:** 유틸리티 파일이 없거나, 각 서비스에서 인라인으로 이스케이프하면 위반.

**참고 — 표준 구현:**

```typescript
// apps/backend/src/common/utils/sql-escape.ts
/**
 * LIKE/ILIKE 패턴의 와일드카드 메타문자를 이스케이프합니다.
 * PostgreSQL 표준: % → \%, _ → \_
 */
export function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, (char) => `\\${char}`);
}
```

### Step 3: N+1 쿼리 패턴 탐지

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
| 2   | escapeLike SSOT 유틸리티   | PASS/FAIL | 유틸리티 존재 여부     |
| 3   | N+1 쿼리 패턴              | PASS/FAIL | N+1 패턴 위치 목록     |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **Enum 기반 LIKE 패턴** — `TEMP-SUW-%` 같이 프로그램이 생성한 고정 패턴(사용자 입력 아님)은 이스케이프 불필요
2. **Promise.all 병렬 독립 쿼리** — 서로 다른 테이블에 대한 독립적인 집계 쿼리를 병렬 실행하는 것은 N+1이 아님 (예: `Promise.all([countQuery, listQuery])`)
3. **배치 크기가 고정된 소규모 루프** — 최대 5개 이하의 고정 크기 루프는 성능 영향 미미
4. **관리자 전용 일회성 작업** — 시드/마이그레이션 스크립트의 루프 쿼리는 런타임 성능 무관
