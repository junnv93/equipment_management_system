# Exec Plan: data-migration-batch

**Date**: 2026-04-14
**Mode**: 2 (main 직접 작업)
**Scope**: data-migration.service.ts 배치 INSERT 최적화 + SSOT chunk 상수 + 이력 헬퍼 통합

## Problem Summary

`data-migration.service.ts`에서 5가지 성능/코드 품질 이슈:

1. **개별 INSERT O(n) DB 왕복** — execute()와 executeMultiSheet() 모두 row별 `tx.insert().values(단건)` 호출
2. **chunkArray private 메서드** — 재사용 불가
3. **교정/수리/사고 이력 3종 copy-paste** — 테이블명·컬럼만 다른 ~40줄 블록 3회 반복
4. **validateAndGetUser N번 호출** — createLocationHistoryInternal이 per-row 호출되어 동일 userId로 N번 DB SELECT
5. **CHUNK_SIZE 하드코딩** — shared-constants SSOT에 없음

## Phase 1: Shared Infrastructure (2 files CREATE, 1 file MODIFY)

### 1-1. `apps/backend/src/common/utils/chunk-array.ts` (CREATE)

```typescript
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
```

### 1-2. `apps/backend/src/common/utils/index.ts` (MODIFY)

- `export * from './chunk-array';` 추가

### 1-3. `packages/shared-constants/src/business-rules.ts` (MODIFY)

- `BATCH_QUERY_LIMITS` 객체에 `MIGRATION_CHUNK_SIZE: 100` 추가

## Phase 2: equipment-history.service.ts (1 file MODIFY)

### 2-1. `createLocationHistoryBatch()` 메서드 신설

**위치**: `apps/backend/src/modules/equipment/services/equipment-history.service.ts`

```typescript
async createLocationHistoryBatch(
  entries: Array<{
    equipmentId: string;
    changedAt: string;
    newLocation: string;
    previousLocation: string | null;
    notes?: string;
  }>,
  userId: string,
  tx?: AppDatabase
): Promise<void>
```

**동작**:
1. `validateAndGetUser(userId)` — **1회만** 호출
2. entries에서 `.values([...])` 배열 생성
3. `(tx ?? this.db).insert(equipmentLocationHistory).values(batchValues)` — 단일 INSERT
4. entries가 비어있으면 early return

**주의**: `createLocationHistoryInternal` 단건 API 유지 — equipment.service.ts에서 2곳 호출 중

## Phase 3: data-migration.service.ts (1 file MODIFY, 대규모)

### 3-1. Import 교체

- `private chunkArray` 제거
- `import { chunkArray } from '../../../common/utils';` 추가 (기존 import 라인에 병합)
- `import { BATCH_QUERY_LIMITS } from '@equipment-management/shared-constants';` 추가
- `const CHUNK_SIZE = 100;` 제거 → `BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE` 직접 사용

### 3-2. execute() 배치 INSERT (Line 183-213)

**Before**: `for (const row of validRows)` 루프 내 개별 `tx.insert(equipment).values(entity).returning()`

**After**:
1. validRows를 CHUNK 단위로 분할
2. chunk별 `tx.insert(equipment).values(entities).returning()` — 배치 INSERT
3. `.returning({ id: equipment.id, managementNumber: equipment.managementNumber })`
4. 위치 이력이 필요한 row들을 수집 → `createLocationHistoryBatch()` 1회 호출
5. `createdCount = validRows.length` (에러 없이 INSERT 완료되면 전부 성공)

**핵심 로직**:
```
for each chunk of validRows:
  entities = chunk.map(row => buildEntityFromRow(row, userId))
  createdRows = await tx.insert(equipment).values(entities).returning({id, managementNumber})
  // 위치 이력 entries 수집
  locationEntries.push(...) // created.id + row.data.initialLocation
await createLocationHistoryBatch(locationEntries, userId, tx)
```

### 3-3. executeMultiSheet() 장비 시트 배치 INSERT (Line 431-466)

**Before**: chunk 이중 루프 (`for chunk`, `for row in chunk`) 내 개별 INSERT

**After**: chunk별 배치 INSERT + `.returning()` → managementNumber→id Map 갱신
- 동일 패턴: entities 배열 → 배치 INSERT → returning → mgmtNumToId.set
- 위치 이력 entries 수집 → `createLocationHistoryBatch()` 1회 호출

### 3-4. insertHistoryBatch 헬퍼 신설

```typescript
private async insertHistoryBatch<TRow extends MigrationRowPreview>(
  tx: AppDatabase,
  table: typeof calibrations | typeof repairHistory | typeof equipmentIncidentHistory,
  rows: TRow[],
  mgmtNumToId: Map<string, string>,
  buildValues: (row: TRow, equipmentId: string) => object
): Promise<{ createdCount: number; errors: MigrationRowPreview[] }>
```

**동작**:
1. rows를 순회하며 equipmentId 해석 (mgmtNumToId.get)
2. equipmentId 없는 row → errors 수집 (기존 EQUIPMENT_NOT_FOUND 로직 유지)
3. 유효한 rows를 CHUNK 단위로 `tx.insert(table).values(batchValues)` — 배치 INSERT
4. `{ createdCount, errors }` 반환

### 3-5. 교정/수리/사고 3종 통합 (Line 503-659)

**Before**: 교정(503-557), 수리(559-609), 사고(611-659) — 3개 거의 동일한 블록

**After**: 각 시트 타입별 `insertHistoryBatch()` 1회 호출

```typescript
// 교정 이력
const calResult = await this.insertHistoryBatch(tx, calibrations, validRows, mgmtNumToId,
  (row, equipmentId) => ({
    equipmentId,
    calibrationDate: row.data.calibrationDate as Date,
    // ... 나머지 필드
  })
);

// 수리 이력 — 동일 패턴
// 사고 이력 — 동일 패턴
```

각 호출 후 sheetSummaries.push / allErrors.push / totalCreated += 등 후처리는 그대로 유지.

## Phase 4: Verification

### 4-1. 타입 체크
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter @equipment-management/shared-constants run tsc --noEmit 2>/dev/null || pnpm tsc --noEmit
```

### 4-2. Lint
```bash
pnpm --filter backend run lint
```

### 4-3. 테스트
```bash
pnpm --filter backend run test
```

### 4-4. SSOT 검증
```bash
# chunkArray private 제거 확인
grep -n 'private chunkArray' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 결과 없어야 함

# CHUNK_SIZE 하드코딩 제거 확인
grep -n 'const CHUNK_SIZE' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 결과 없어야 함

# MIGRATION_CHUNK_SIZE SSOT 사용 확인
grep -n 'MIGRATION_CHUNK_SIZE' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 1+ 결과

# createLocationHistoryBatch 존재 확인
grep -n 'createLocationHistoryBatch' apps/backend/src/modules/equipment/services/equipment-history.service.ts
# → 1+ 결과

# createLocationHistoryInternal 단건 유지 확인
grep -n 'createLocationHistoryInternal' apps/backend/src/modules/equipment/services/equipment-history.service.ts
# → 1+ 결과

# insertHistoryBatch 헬퍼 존재 확인
grep -n 'insertHistoryBatch' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 1+ 결과
```

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| 배치 INSERT returning() 순서 보장 | Drizzle ORM은 values 배열 순서대로 returning — PostgreSQL INSERT ... VALUES 순서 보장 |
| 트랜잭션 시맨틱 변경 | 기존 tx 파라미터 패턴 그대로 유지, All-or-Nothing 동일 |
| createLocationHistoryInternal 외부 호출처 | equipment.service.ts 2곳 — 단건 API 유지하므로 영향 없음 |
| insertHistoryBatch 제네릭 타입 | Drizzle table 타입이 유니온으로 추론 가능 — 필요 시 `Parameters<typeof tx.insert>[0]` 등으로 처리 |

## Files Changed Summary

| File | Action | Lines Changed (est.) |
|------|--------|---------------------|
| `apps/backend/src/common/utils/chunk-array.ts` | CREATE | ~8 |
| `apps/backend/src/common/utils/index.ts` | MODIFY | +1 |
| `packages/shared-constants/src/business-rules.ts` | MODIFY | +2 |
| `apps/backend/src/modules/equipment/services/equipment-history.service.ts` | MODIFY | +25 |
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` | MODIFY | -120, +80 (net -40) |
