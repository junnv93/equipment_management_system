# Contract: data-migration-batch

**Date**: 2026-04-14
**Exec Plan**: `.claude/exec-plans/active/2026-04-14-data-migration-batch.md`

## MUST Criteria

### M1: chunkArray 공유 유틸리티

```bash
# chunk-array.ts 파일 존재
test -f apps/backend/src/common/utils/chunk-array.ts && echo "PASS" || echo "FAIL"

# export function chunkArray 시그니처
grep -q 'export function chunkArray' apps/backend/src/common/utils/chunk-array.ts && echo "PASS" || echo "FAIL"

# index.ts에서 re-export
grep -q 'chunk-array' apps/backend/src/common/utils/index.ts && echo "PASS" || echo "FAIL"

# data-migration.service.ts에서 private chunkArray 제거됨
! grep -q 'private chunkArray' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"
```

### M2: MIGRATION_CHUNK_SIZE SSOT 상수

```bash
# business-rules.ts에 MIGRATION_CHUNK_SIZE 존재
grep -q 'MIGRATION_CHUNK_SIZE' packages/shared-constants/src/business-rules.ts && echo "PASS" || echo "FAIL"

# data-migration.service.ts에서 const CHUNK_SIZE 하드코딩 제거
! grep -q 'const CHUNK_SIZE' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"

# BATCH_QUERY_LIMITS import 사용
grep -q 'BATCH_QUERY_LIMITS' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"
```

### M3: 배치 INSERT (개별 INSERT 루프 제거)

```bash
# execute() / executeMultiSheet()에서 .values([...]) 배치 패턴 사용
# 배치 INSERT는 values(entities) 또는 values(batchValues) 형태
grep -c '\.values(' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 개별 row INSERT 대신 chunk 단위 배치로 전환됨을 코드 리뷰로 확인

# equipment INSERT에서 .returning() 사용 (managementNumber→id Map 재구성)
grep -q '\.returning(' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"
```

### M4: insertHistoryBatch 헬퍼로 3종 통합

```bash
# insertHistoryBatch 메서드 존재
grep -q 'insertHistoryBatch' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"

# 교정/수리/사고 개별 INSERT 루프 제거 확인 — 기존에 3개였던 for-in-chunk-for-in-row 패턴 감소
# EQUIPMENT_NOT_FOUND 에러 처리가 헬퍼 내부에 통합됨
grep -c 'EQUIPMENT_NOT_FOUND' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 기존 3회 → 1회 (헬퍼 내부)
```

### M5: createLocationHistoryBatch 신설

```bash
# 메서드 존재
grep -q 'createLocationHistoryBatch' apps/backend/src/modules/equipment/services/equipment-history.service.ts && echo "PASS" || echo "FAIL"

# createLocationHistoryInternal 단건 API 유지
grep -q 'createLocationHistoryInternal' apps/backend/src/modules/equipment/services/equipment-history.service.ts && echo "PASS" || echo "FAIL"

# data-migration.service.ts에서 createLocationHistoryBatch 호출
grep -q 'createLocationHistoryBatch' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"

# validateAndGetUser가 batch 내에서 1회만 호출되는지 — batch 메서드 본문에 validateAndGetUser 1회
grep -c 'validateAndGetUser' apps/backend/src/modules/equipment/services/equipment-history.service.ts
# → createLocationHistoryInternal(1회) + createLocationHistoryBatch(1회) + 기존 호출처 = 확인
```

### M6: 트랜잭션 시맨틱 유지

```bash
# tx 파라미터 패턴 유지 — transaction 블록 존재
grep -c 'this.db.transaction' apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 2 (execute + executeMultiSheet)
```

### M7: TypeScript 컴파일

```bash
pnpm --filter backend run tsc --noEmit
# → exit 0
```

### M8: Lint 통과

```bash
pnpm --filter backend run lint
# → exit 0
```

### M9: 테스트 통과

```bash
pnpm --filter backend run test
# → exit 0
```

## SHOULD Criteria

### S1: `any` 타입 미사용
```bash
! grep -n ': any' apps/backend/src/common/utils/chunk-array.ts && echo "PASS" || echo "FAIL"
```

### S2: data-migration.service.ts에서 per-row createLocationHistoryInternal 호출 제거
```bash
! grep -q 'createLocationHistoryInternal' apps/backend/src/modules/data-migration/services/data-migration.service.ts && echo "PASS" || echo "FAIL"
# → data-migration에서는 Batch만 사용, Internal은 equipment.service.ts에서만
```

### S3: 코드 줄수 감소 (copy-paste 제거 효과)
```bash
wc -l apps/backend/src/modules/data-migration/services/data-migration.service.ts
# → 기존 873줄 대비 ~40줄 감소 예상 (830줄 이하)
```

## MUST NOT Criteria

### MN1: createLocationHistoryInternal 시그니처 변경 금지
```bash
# 기존 시그니처 유지: (equipmentId, data, userId?, tx?)
grep -A4 'createLocationHistoryInternal' apps/backend/src/modules/equipment/services/equipment-history.service.ts | head -5
# → 시그니처 변경 없음
```

### MN2: equipment.service.ts 변경 금지
```bash
git diff --name-only | grep -v 'equipment-history' | grep 'equipment.service.ts'
# → 결과 없어야 함 (equipment.service.ts는 변경 대상 아님)
```

### MN3: 테스트 파일 삭제/무시 금지
```bash
git diff --name-only | grep -v '\.spec\.' | grep -v '__tests__'
# → spec 파일은 mock 업데이트만 허용, 삭제 불가
```
