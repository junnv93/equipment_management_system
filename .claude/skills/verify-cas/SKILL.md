---
name: verify-cas
description: Verifies CAS (Optimistic Locking) pattern compliance — version field in DTOs, VersionedBaseService usage, cache invalidation on 409 conflict, frontend VERSION_CONFLICT error handling. Run after adding/modifying state-change endpoints.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# CAS (Optimistic Locking) 패턴 검증

## Purpose

상태 변경이 수반되는 백엔드 코드가 CAS 패턴을 올바르게 준수하는지 검증합니다:

1. **VersionedBaseService 상속** — 상태 변경 서비스가 VersionedBaseService를 상속하거나 자체 CAS 구현을 가지는지
2. **versionedSchema DTO** — 상태 변경 DTO에 `version` 필드가 포함되어 있는지
3. **updateWithVersion 사용** — `.update()` 대신 `updateWithVersion()`으로 상태를 변경하는지
4. **캐시 무효화** — ConflictException(409) 발생 시 detail 캐시를 삭제하는지
5. **프론트엔드 version 전달** — mutation에서 version 필드를 서버에 전달하는지

## When to Run

- 새로운 상태 변경 엔드포인트를 추가한 후
- 기존 서비스의 상태 변경 로직을 수정한 후
- 새로운 엔티티/모듈을 생성한 후
- CAS 관련 버그를 수정한 후
- PR 전 최종 점검 시

## Related Files

| File                                                                                 | Purpose                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `apps/backend/src/common/base/versioned-base.service.ts`                             | VersionedBaseService 베이스 클래스, createVersionConflictException SSOT 헬퍼 |
| `apps/backend/src/common/dto/base-versioned.dto.ts`                                  | versionedSchema 정의                                 |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts`                         | 캐시 무효화 헬퍼                                     |
| `apps/backend/src/modules/checkouts/checkouts.service.ts`                            | CAS 적용 서비스 예시                                 |
| `apps/backend/src/modules/calibration/calibration.service.ts`                        | CAS 적용 서비스 예시                                 |
| `apps/backend/src/modules/non-conformances/non-conformances.service.ts`              | CAS 적용 서비스 예시                                 |
| `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts`            | CAS 적용 서비스 예시                                 |
| `apps/backend/src/modules/equipment/services/disposal.service.ts`                    | CAS 적용 서비스 예시                                 |
| `apps/backend/src/modules/software/software.service.ts`                              | CAS 적용 서비스 예시                                 |
| `apps/backend/src/modules/equipment/equipment.service.ts`                            | CAS 적용 서비스 (VersionedBaseService 상속)          |
| `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`            | 자체 CAS 구현 (casVersion 필드)                      |
| `apps/backend/src/modules/equipment/services/equipment-history.service.ts`           | 시스템 내부 version bump (CAS WHERE 없이 version +1) |
| `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` | 스케줄러 시스템 내부 version bump                    |
| `apps/backend/src/modules/equipment/services/equipment-approval.service.ts`          | 승인 프로세스 (stale version 교체 패턴)              |
| `apps/backend/src/modules/equipment/utils/request-data-codec.ts`                     | requestData 직렬화/역직렬화 코덱                     |
| `apps/frontend/hooks/use-optimistic-mutation.ts`                                     | 프론트엔드 optimistic mutation 훅                    |

## Workflow

### Step 1: CAS 적용 서비스 목록 확인

현재 CAS를 사용하는 서비스를 확인합니다.

```bash
# VersionedBaseService 상속 서비스
grep -rn "extends VersionedBaseService" apps/backend/src/modules --include="*.service.ts"
```

**기대값:** checkouts, calibration, non-conformances, equipment-imports, disposal, software, equipment, calibration-factors, calibration-plans (9개)

```bash
# 자체 CAS 구현 서비스
grep -rn "updateWithVersion\|updatePlanWithCAS\|casVersion" apps/backend/src/modules --include="*.service.ts" | grep -v "extends VersionedBaseService" | grep "class\|updateWithVersion\|updatePlanWithCAS"
```

**기대값:** calibration-plans (VersionedBaseService 상속 + casVersion 필드 병용)

### Step 2: 상태 변경 DTO에 version 필드 포함 여부

상태 변경(approve, reject, update, close 등) DTO에 `versionedSchema`가 포함되어 있는지 확인합니다.

```bash
# versionedSchema 사용하는 DTO
grep -rn "versionedSchema" apps/backend/src/modules/*/dto --include="*.dto.ts"
```

**PASS 기준:** 모든 상태 변경 DTO(approve-_, reject-_, update-_, close-_)에 versionedSchema가 spread되어 있어야 함.

**FAIL 기준:** 상태 변경 DTO에 versionedSchema가 없으면 위반.

```bash
# 상태 변경 DTO 중 versionedSchema가 없는 파일 탐지
for f in $(find apps/backend/src/modules/*/dto -name "approve-*.dto.ts" -o -name "reject-*.dto.ts" -o -name "close-*.dto.ts" -o -name "update-status*.dto.ts" -o -name "cancel-*.dto.ts"); do
  grep -L "versionedSchema" "$f" 2>/dev/null
done
```

**위반:** 위 명령에서 파일이 출력되면 해당 DTO에 `...versionedSchema` 추가 필요.

### Step 3: updateWithVersion 사용 검증

상태 변경 시 `.update()` 대신 `updateWithVersion()`을 사용하는지 확인합니다.

```bash
# CAS 서비스에서 직접 .update() 호출 탐지 (위반 가능)
grep -rn "\.update(" apps/backend/src/modules/checkouts/checkouts.service.ts apps/backend/src/modules/calibration/calibration.service.ts apps/backend/src/modules/non-conformances/non-conformances.service.ts apps/backend/src/modules/equipment-imports/equipment-imports.service.ts apps/backend/src/modules/equipment/services/disposal.service.ts apps/backend/src/modules/software/software.service.ts | grep -v "updateWithVersion\|// \|updateAt\|updatedAt\|cacheService"
```

**PASS 기준:** CAS 적용 서비스에서 `.update()` 직접 호출이 없어야 함 (updateWithVersion만 사용).

**FAIL 기준:** CAS 서비스에서 버전 체크 없이 `.update()`를 직접 호출.

### Step 4: ConflictException 후 캐시 삭제

CAS 실패(409) 시 stale cache를 방지하기 위해 detail 캐시를 삭제하는지 확인합니다.

```bash
# ConflictException catch 블록에서 cacheService.delete 호출 확인
grep -rn "ConflictException" apps/backend/src/modules --include="*.service.ts" -A 8 | grep -E "ConflictException|cacheService\.delete"
```

**PASS 기준:** ConflictException을 catch하는 모든 블록에서 `cacheService.delete(detailCacheKey)` 호출.

**FAIL 기준:** ConflictException catch 후 캐시 삭제 없이 `throw error`만 하는 경우.

### Step 5: 트랜잭션 내 CAS 사용 검증

다중 테이블 원자적 상태 변경 시 `updateWithVersion()`의 `tx` 파라미터를 사용하는지 확인합니다.

```bash
# 트랜잭션 내부에서 updateWithVersion 호출 시 tx 전달 여부 확인
grep -rn "\.transaction" apps/backend/src/modules --include="*.service.ts" -A 20 | grep "updateWithVersion"
```

**PASS 기준:** `this.db.transaction(async (tx) => { ... updateWithVersion(..., tx) })` 형태로 tx 전달.

**FAIL 기준:** 트랜잭션 블록 내에서 `updateWithVersion()`에 tx를 전달하지 않으면 트랜잭션 격리가 깨짐.

```typescript
// ❌ WRONG — 트랜잭션 내 tx 미전달
await this.db.transaction(async (tx) => {
  await this.updateWithVersion(table, id, version, data, 'Entity'); // this.db 사용됨
});

// ✅ CORRECT — tx 전달
await this.db.transaction(async (tx) => {
  await this.updateWithVersion(table, id, version, data, 'Entity', tx); // tx 사용
});
```

### Step 6: equipment 테이블 직접 업데이트 시 version bump 검증

`updateWithVersion()`을 거치지 않고 `equipment` 테이블을 직접 `.update()` 하는 모든 서비스에서 `version: sql\`version + 1\``을 포함하는지 확인합니다.
CAS WHERE 절(`AND version = ?`)은 시스템 내부 작업에서 불필요하지만, version 필드 증가는 필수입니다.

```bash
# 모든 서비스에서 equipment 테이블 직접 업데이트 + version bump 포함 여부 확인
# updateWithVersion을 사용하지 않는 직접 .update(equipment) 호출을 탐지
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -A 5 | grep -v "updateWithVersion"
```

탐지된 각 `.set({...})` 블록에서 `version: sql\`version + 1\``이 포함되어 있는지 확인합니다.

```bash
# version bump 없는 equipment 상태 변경 탐지 (위반 패턴)
# .update(equipment).set({...}) 블록에서 version 필드가 없는 경우
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -A 8 | grep -B 8 "\.where" | grep -v "version.*sql\|updateWithVersion"
```

**PASS 기준:** `equipment` 테이블을 직접 `.update()` 하는 모든 `.set({...})` 블록에 `version: sql\`version + 1\``이 포함되어야 함.

**FAIL 기준:** `version` 증가 없이 상태만 변경 → 후속 사용자 CAS 업데이트 시 stale version으로 인한 영구 409 발생.

```typescript
// ❌ WRONG — version bump 누락 (시스템 내부라도 필수)
await tx
  .update(equipment)
  .set({
    status: EquipmentStatusEnum.enum.non_conforming,
    updatedAt: new Date(),
  })
  .where(eq(equipment.id, equipmentUuid));

// ✅ CORRECT — version bump 포함
await tx
  .update(equipment)
  .set({
    status: EquipmentStatusEnum.enum.non_conforming,
    version: sql`version + 1`,
    updatedAt: new Date(),
  } as Record<string, unknown>)
  .where(eq(equipment.id, equipmentUuid));
```

### Step 7: equipment 직접 업데이트 후 캐시 무효화

`equipment` 테이블을 직접 `.update()` 하는 모든 서비스에서 `CacheInvalidationHelper`로 캐시를 무효화하는지 확인합니다.

```bash
# equipment 직접 업데이트하는 서비스에서 CacheInvalidationHelper 사용 확인
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -l | xargs grep -l "cacheInvalidationHelper\|CacheInvalidationHelper"
```

```bash
# equipment 직접 업데이트하지만 CacheInvalidationHelper를 import하지 않는 서비스 탐지 (위반)
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -l | xargs grep -L "CacheInvalidationHelper"
```

**PASS 기준:** `equipment` 테이블을 직접 업데이트하는 모든 서비스가 `CacheInvalidationHelper`를 주입하고, 상태 변경 후 `invalidateAfterEquipmentUpdate()` 또는 `invalidateAfterDisposal()` 등 적절한 메서드를 호출.

**FAIL 기준:** `SimpleCacheService.deleteByPattern()`으로 직접 캐시 삭제 (SSOT 위반) 또는 캐시 무효화 누락.

### Step 8: 보상 트랜잭션 패턴 검증 (Compensating Transaction)

`updateWithVersion()`이 트랜잭션 외부에서 호출되고, 후속 작업이 실패할 수 있는 경우 보상 트랜잭션 패턴이 적용되어 있는지 확인합니다.

```bash
# updateWithVersion 호출 후 try-catch로 보상 로직이 있는지 확인
grep -rn "updateWithVersion" apps/backend/src/modules --include="*.service.ts" -A 20 | grep -E "catch|rollback|previous|compensat"
```

**PASS 기준:** `updateWithVersion()` 호출 후 후속 작업이 실패할 수 있는 경우:

1. 이전 상태를 저장 (`previousStatus`)
2. try-catch로 후속 작업 감싸기
3. catch 블록에서 이전 상태로 `updateWithVersion()` 역호출 (보상)

**FAIL 기준:** 후속 작업 실패 시 이전 상태로 롤백하는 보상 로직 없음 → 데이터 불일치.

```typescript
// ✅ CORRECT — 보상 트랜잭션 패턴
const previousStatus = previousEquipment.status;
await this.updateWithVersion(equipment, id, version, { status: 'checked_out' }, 'Equipment');
try {
  await this.checkoutsService.create(checkoutData);
} catch (error) {
  // 보상: 장비 상태 원복
  await this.updateWithVersion(equipment, id, version + 1, { status: previousStatus }, 'Equipment');
  throw error;
}
```

### Step 9: 프론트엔드 mutation에서 version 전달

상태 변경 API 호출 시 version 필드를 전달하는지 확인합니다.

```bash
# approve/reject API 함수에서 version 파라미터 확인
grep -rn "version" apps/frontend/lib/api/checkout-api.ts apps/frontend/lib/api/calibration-api.ts apps/frontend/lib/api/non-conformances-api.ts apps/frontend/lib/api/equipment-api.ts | grep -i "approve\|reject\|update"
```

**PASS 기준:** 상태 변경 API 함수에 version 파라미터가 포함되어 있어야 함.

## Output Format

```markdown
| #   | 검사                      | 상태      | 상세                     |
| --- | ------------------------- | --------- | ------------------------ |
| 1   | VersionedBaseService 상속 | PASS/FAIL | 누락 서비스 목록         |
| 2   | versionedSchema DTO       | PASS/FAIL | 누락 DTO 목록            |
| 3   | updateWithVersion 사용    | PASS/FAIL | 직접 .update() 호출 위치 |
| 4   | 캐시 삭제 (409)           | PASS/FAIL | 누락 위치                |
| 5   | 트랜잭션 내 CAS tx 전달   | PASS/FAIL | tx 미전달 위치           |
| 6   | 시스템 내부 version bump  | PASS/FAIL | version 누락 위치        |
| 7   | 시스템 내부 캐시 무효화   | PASS/FAIL | 캐시 무효화 누락 위치    |
| 8   | 보상 트랜잭션 패턴        | PASS/FAIL | 보상 로직 누락 위치      |
| 9   | 프론트엔드 version 전달   | PASS/FAIL | 누락 API 함수            |
| 10  | 승인 CAS version 교체     | PASS/FAIL | stale version 사용 위치  |
```

### Step 10: 승인 프로세스의 CAS version 교체 검증

JSON 직렬화된 requestData에서 역직렬화된 DTO의 version은 요청 생성 시점의 값이므로, 승인 시점에는 stale합니다.
승인 서비스에서 현재 DB의 version으로 교체하는지 확인합니다.

```bash
# 승인 서비스에서 deserializeRequestData('update') 후 version 교체 여부 확인
grep -n "deserializeRequestData\|requestData.version\|currentEquipment.version" apps/backend/src/modules/equipment/services/equipment-approval.service.ts
```

**PASS 기준:** `deserializeRequestData('update', ...)` 호출 후 `requestData.version = currentEquipment.version` 으로 현재 DB version을 주입.

**FAIL 기준:** JSON에서 파싱된 stale version을 그대로 `equipmentService.update()`에 전달 → 승인 시 항상 409 CAS 충돌.

```typescript
// ❌ WRONG — stale version 사용
const requestData = deserializeRequestData('update', request.requestData);
await this.equipmentService.update(equipmentId, requestData); // requestData.version이 stale

// ✅ CORRECT — 현재 DB version으로 교체
const requestData = deserializeRequestData('update', request.requestData);
requestData.version = currentEquipment.version; // 현재 DB version 주입
await this.equipmentService.update(currentEquipment.id, requestData);
```

### Step 11: updateWithVersion의 version 인자 출처 검증

`updateWithVersion(table, uuid, version, ...)`의 세 번째 인자(version)가 DB에서 방금 조회한 값이 아닌, 클라이언트 DTO에서 전달된 값인지 확인합니다. DB 조회 version을 사용하면 CAS가 항상 성공하여 동시 수정을 감지할 수 없습니다.

```bash
# updateWithVersion 호출에서 existing/current/found 변수의 version을 직접 사용하는 패턴 탐지
grep -rn "updateWithVersion" apps/backend/src/modules --include="*.service.ts" | grep -E "existing\w*\.version|current\w*\.version|found\w*\.version" | grep -v "// "
```

**PASS 기준:** 위 grep 결과가 0건이거나, 모든 결과가 Exceptions에 해당.

**FAIL 기준:** `updateWithVersion(table, id, existingEntity.version, ...)` 패턴 발견 — DB에서 방금 읽은 version을 CAS에 사용하면 동시 수정 감지 불가.

```typescript
// ❌ WRONG — DB 조회 version 사용 (CAS 무력화)
const existing = await this.findOne(uuid);
await this.updateWithVersion(table, uuid, existing.version, updateData, '엔티티');

// ✅ CORRECT — 클라이언트 DTO version 사용 (진정한 CAS)
await this.updateWithVersion(table, uuid, dto.version, updateData, '엔티티');
```

**예외:** Step 10의 승인 프로세스처럼 stale requestData의 version을 현재 DB version으로 의도적으로 교체하는 경우는 정상 (예: `requestData.version = currentEquipment.version`).

## Exceptions

다음은 **위반이 아닙니다**:

1. **TeamsService, UsersService** — 관리자 전용 CRUD 작업으로 동시 수정 위험이 낮아 CAS 불필요
2. **DashboardService, ReportsService** — 읽기 전용 서비스로 상태 변경 없음
3. **NotificationsService** — append-only 작업으로 CAS 불필요
4. **CalibrationPlansService의 casVersion** — `version`이 아닌 `casVersion` 필드 사용은 의도적 설계 (plan revision과 CAS 버전 분리)
5. **Create 작업** — 새 레코드 생성은 CAS 불필요 (기존 레코드 없음)
6. **SettingsService** — 시스템 관리자 전용, 단일 사용자 동시 수정 시나리오 없음
7. **크로스 테이블 version bump (CAS WHERE 없이)** — `CalibrationOverdueScheduler`, `EquipmentHistoryService`, `DisposalService`, `NonConformancesService`, `CalibrationService`, `EquipmentImportsService` 등에서 `equipment` 테이블을 직접 `.update()` 하면서 `version: sql\`version + 1\``을 CAS WHERE 절 없이 사용하는 것은 정상. 트랜잭션 내 시스템 자동 처리이므로 사용자 경합이 없고, version 필드 증가만으로 후속 CAS 업데이트와의 일관성을 보장. **단, version bump 자체는 필수** — 누락 시 위반
8. **CacheInvalidationHelper가 없는 읽기 전용 서비스** — version bump만 하고 캐시 무효화를 하지 않는 서비스가 읽기 전용이면 정상 (예: 조회만 하는 헬퍼)
