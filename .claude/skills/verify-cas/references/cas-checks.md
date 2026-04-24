# CAS 검증 상세 체크리스트

## Step 1: CAS 적용 서비스 목록 확인

```bash
# VersionedBaseService 상속 서비스
grep -rn "extends VersionedBaseService" apps/backend/src/modules --include="*.service.ts"
```

**기대값:** 13개 (2026-04-09 기준). 현재 상속 서비스: checkouts, calibration, non-conformances, equipment-imports, disposal, equipment, calibration-factors, calibration-plans, cables, test-software, intermediate-inspections, software-validations, self-inspections. 숫자 drift 시 `grep -rl "extends VersionedBaseService" apps/backend/src/modules --include="*.service.ts" | wc -l` 로 갱신.

```bash
# 자체 CAS 구현(raw tx.update + createVersionConflictException 패턴) 탐지
# 기대값: 0 hit (2026-04-09 부로 전면 제거). 단 disposal.service.ts 의 DELETE-with-CAS 1 경로는 예외 — base class 가 update 만 지원해 유지.
grep -rn "createVersionConflictException" apps/backend/src/modules --include="*.service.ts" | grep -v "disposal.service.ts"
```

**기대값:** calibration-plans 는 `updateWithVersion(..., casColumnKey: 'casVersion')` 호출로 통과. `updatePlanWithCAS` private helper 는 제거됨.

## Step 2: 상태 변경 DTO에 version 필드 포함 여부

```bash
# versionedSchema 사용하는 DTO
grep -rn "versionedSchema" apps/backend/src/modules/*/dto --include="*.dto.ts"
```

**PASS 기준:** 모든 상태 변경 DTO(approve-*, reject-*, update-*, close-*)에 versionedSchema가 spread되어 있어야 함.

```bash
# 상태 변경 DTO 중 versionedSchema가 없는 파일 탐지
for f in $(find apps/backend/src/modules/*/dto -name "approve-*.dto.ts" -o -name "reject-*.dto.ts" -o -name "close-*.dto.ts" -o -name "update-status*.dto.ts" -o -name "cancel-*.dto.ts"); do
  grep -L "versionedSchema" "$f" 2>/dev/null
done
```

## Step 3: updateWithVersion 사용 검증

```bash
# CAS 서비스에서 직접 .update() 호출 탐지 (위반 가능)
grep -rn "\.update(" apps/backend/src/modules/checkouts/checkouts.service.ts apps/backend/src/modules/calibration/calibration.service.ts apps/backend/src/modules/non-conformances/non-conformances.service.ts apps/backend/src/modules/equipment-imports/equipment-imports.service.ts apps/backend/src/modules/equipment/services/disposal.service.ts apps/backend/src/modules/software/software.service.ts | grep -v "updateWithVersion\|// \|updateAt\|updatedAt\|cacheService"
```

**PASS 기준:** CAS 적용 서비스에서 `.update()` 직접 호출이 없어야 함 (updateWithVersion만 사용).

## Step 4: ConflictException 후 캐시 삭제

```bash
# ConflictException catch 블록에서 cacheService.delete 호출 확인
grep -rn "ConflictException" apps/backend/src/modules --include="*.service.ts" -A 8 | grep -E "ConflictException|cacheService\.delete"
```

**PASS 기준:** ConflictException을 catch하는 모든 블록에서 `cacheService.delete(detailCacheKey)` 호출.

## Step 5: 트랜잭션 내 CAS 사용 검증

```bash
# 트랜잭션 내부에서 updateWithVersion 호출 시 tx 전달 여부 확인
grep -rn "\.transaction" apps/backend/src/modules --include="*.service.ts" -A 20 | grep "updateWithVersion"
```

**PASS 기준:** `this.db.transaction(async (tx) => { ... updateWithVersion(..., tx) })` 형태로 tx 전달.

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

## Step 6: equipment 테이블 직접 업데이트 시 version bump 검증

```bash
# updateWithVersion을 사용하지 않는 직접 .update(equipment) 호출을 탐지
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -A 5 | grep -v "updateWithVersion"
```

```bash
# version bump 없는 equipment 상태 변경 탐지 (위반 패턴)
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -A 8 | grep -B 8 "\.where" | grep -v "version.*sql\|updateWithVersion"
```

**PASS 기준:** `equipment` 테이블을 직접 `.update()` 하는 모든 `.set({...})` 블록에 `version: sql\`version + 1\``이 포함되어야 함.

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

## Step 7: equipment 직접 업데이트 후 캐시 무효화

```bash
# equipment 직접 업데이트하는 서비스에서 CacheInvalidationHelper 사용 확인
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -l | xargs grep -l "cacheInvalidationHelper\|CacheInvalidationHelper"
```

```bash
# equipment 직접 업데이트하지만 CacheInvalidationHelper를 import하지 않는 서비스 탐지 (위반)
grep -rn "\.update(equipment)" apps/backend/src/modules --include="*.service.ts" --include="*.scheduler.ts" -l | xargs grep -L "CacheInvalidationHelper"
```

**PASS 기준:** `equipment` 테이블을 직접 업데이트하는 모든 서비스가 `CacheInvalidationHelper`를 주입하고, 상태 변경 후 적절한 메서드를 호출.

## Step 8: 보상 트랜잭션 패턴 검증

```bash
# updateWithVersion 호출 후 try-catch로 보상 로직이 있는지 확인
grep -rn "updateWithVersion" apps/backend/src/modules --include="*.service.ts" -A 20 | grep -E "catch|rollback|previous|compensat"
```

**PASS 기준:** `updateWithVersion()` 호출 후 후속 작업이 실패할 수 있는 경우:
1. 이전 상태를 저장 (`previousStatus`)
2. try-catch로 후속 작업 감싸기
3. catch 블록에서 이전 상태로 `updateWithVersion()` 역호출 (보상)

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

## Step 9: 프론트엔드 mutation에서 version 전달

```bash
# approve/reject API 함수에서 version 파라미터 확인
grep -rn "version" apps/frontend/lib/api/checkout-api.ts apps/frontend/lib/api/calibration-api.ts apps/frontend/lib/api/non-conformances-api.ts apps/frontend/lib/api/equipment-api.ts | grep -i "approve\|reject\|update"
```

**PASS 기준:** 상태 변경 API 함수에 version 파라미터가 포함되어 있어야 함.

## Step 10: 승인 프로세스의 CAS version 교체 검증

JSON 직렬화된 requestData에서 역직렬화된 DTO의 version은 요청 생성 시점의 값이므로, 승인 시점에는 stale합니다.

```bash
# 승인 서비스에서 deserializeRequestData('update') 후 version 교체 여부 확인
grep -n "deserializeRequestData\|requestData.version\|currentEquipment.version" apps/backend/src/modules/equipment/services/equipment-approval.service.ts
```

**PASS 기준:** `deserializeRequestData('update', ...)` 호출 후 `requestData.version = currentEquipment.version` 으로 현재 DB version을 주입.

```typescript
// ❌ WRONG — stale version 사용
const requestData = deserializeRequestData('update', request.requestData);
await this.equipmentService.update(equipmentId, requestData); // requestData.version이 stale

// ✅ CORRECT — 현재 DB version으로 교체
const requestData = deserializeRequestData('update', request.requestData);
requestData.version = currentEquipment.version; // 현재 DB version 주입
await this.equipmentService.update(currentEquipment.id, requestData);
```

## Step 11: updateWithVersion의 version 인자 출처 검증

`updateWithVersion(table, uuid, version, ...)`의 세 번째 인자(version)가 DB에서 방금 조회한 값이 아닌, 클라이언트 DTO에서 전달된 값인지 확인합니다.

```bash
# updateWithVersion 호출에서 existing/current/found 변수의 version을 직접 사용하는 패턴 탐지
grep -rn "updateWithVersion" apps/backend/src/modules --include="*.service.ts" | grep -E "existing\w*\.version|current\w*\.version|found\w*\.version" | grep -v "// "
```

**PASS 기준:** 위 grep 결과가 0건이거나, 모든 결과가 Exceptions에 해당.

```typescript
// ❌ WRONG — DB 조회 version 사용 (CAS 무력화)
const existing = await this.findOne(uuid);
await this.updateWithVersion(table, uuid, existing.version, updateData, '엔티티');

// ✅ CORRECT — 클라이언트 DTO version 사용 (진정한 CAS)
await this.updateWithVersion(table, uuid, dto.version, updateData, '엔티티');
```

**예외:** Step 10의 승인 프로세스처럼 stale requestData의 version을 현재 DB version으로 의도적으로 교체하는 경우는 정상.

## Step 13: 2-step Dialog AP-4 — confirm 진입 전 version 재조회 (2026-04-24 추가)

2-step 확인 다이얼로그(input→confirm)에서 confirm 단계 진입 직전에 최신 버전을 재조회하여
다른 탭/세션의 stale 상태를 감지하는 패턴. NC Phase 4(AP-4)에서 도입.

**필수 조건:**
- `handleNext` 또는 confirm 진입 핸들러에서 API 재조회 후 version 비교
- 불일치 시 toast + invalidateQueries + dialog 닫기

```tsx
// ✅ CORRECT — confirm 진입 직전 version 재확인
const handleNext = form.handleSubmit(async () => {
  const latest = await api.getEntity(entity.id);
  if (latest.version !== entity.version) {
    toast({ title: t('toasts.versionMismatch'), variant: 'destructive' });
    queryClient.invalidateQueries({ queryKey: queryKeys.entity.detail(entity.id) });
    onClose();
    return;
  }
  setStep('confirm');
});

// ❌ WRONG — version 확인 없이 confirm 진입
const handleNext = form.handleSubmit(async () => {
  setStep('confirm'); // stale 상태로 submit 위험
});
```

**탐지 명령어:**
```bash
# 2-step dialog (step state) 가 있는 컴포넌트에서 version 비교 패턴 확인
grep -rln "step.*'confirm'\|setStep.*confirm" apps/frontend/components --include="*.tsx" | \
  xargs grep -l "handleNext\|handleConfirm"
# 위 파일 각각에서 version 비교가 있는지 확인
# grep -n "\.version\s*!==\|!.*version" <file>
```

**PASS:** 2-step dialog의 confirm 진입 핸들러에서 version 비교 존재.
**FAIL:** `setStep('confirm')` 직전에 version 비교 없음.

**현재 적용:** `NCRepairDialog.tsx` (handleNext), `NCEditDialog.tsx` (useCasGuardedMutation 내부 처리).
**예외:** confirm 없이 단일 step으로 submit하는 dialog — 이 패턴 불필요.
