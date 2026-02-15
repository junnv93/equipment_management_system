---
name: verify-cas
description: CAS(Optimistic Locking) 패턴 준수 여부를 검증합니다. 상태 변경 엔드포인트 추가/수정 후 사용.
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

| File                                                                      | Purpose                                     |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| `apps/backend/src/common/base/versioned-base.service.ts`                  | VersionedBaseService 베이스 클래스          |
| `apps/backend/src/common/dto/base-versioned.dto.ts`                       | versionedSchema 정의                        |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts`              | 캐시 무효화 헬퍼                            |
| `apps/backend/src/modules/checkouts/checkouts.service.ts`                 | CAS 적용 서비스 예시                        |
| `apps/backend/src/modules/calibration/calibration.service.ts`             | CAS 적용 서비스 예시                        |
| `apps/backend/src/modules/non-conformances/non-conformances.service.ts`   | CAS 적용 서비스 예시                        |
| `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` | CAS 적용 서비스 예시                        |
| `apps/backend/src/modules/equipment/services/disposal.service.ts`         | CAS 적용 서비스 예시                        |
| `apps/backend/src/modules/software/software.service.ts`                   | CAS 적용 서비스 예시                        |
| `apps/backend/src/modules/equipment/equipment.service.ts`                 | 자체 CAS 구현 (updateWithVersion 직접 정의) |
| `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` | 자체 CAS 구현 (casVersion 필드)             |
| `apps/frontend/hooks/use-optimistic-mutation.ts`                          | 프론트엔드 optimistic mutation 훅           |

## Workflow

### Step 1: CAS 적용 서비스 목록 확인

현재 CAS를 사용하는 서비스를 확인합니다.

```bash
# VersionedBaseService 상속 서비스
grep -rn "extends VersionedBaseService" apps/backend/src/modules --include="*.service.ts"
```

**기대값:** checkouts, calibration, non-conformances, equipment-imports, disposal, software (6개)

```bash
# 자체 CAS 구현 서비스
grep -rn "updateWithVersion\|updatePlanWithCAS\|casVersion" apps/backend/src/modules --include="*.service.ts" | grep -v "extends VersionedBaseService" | grep "class\|updateWithVersion\|updatePlanWithCAS"
```

**기대값:** equipment (updateWithVersion 직접 정의), calibration-plans (casVersion)

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
for f in $(find apps/backend/src/modules/*/dto -name "approve-*.dto.ts" -o -name "reject-*.dto.ts" -o -name "close-*.dto.ts" -o -name "update-status*.dto.ts"); do
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

### Step 5: 프론트엔드 mutation에서 version 전달

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
| 5   | 프론트엔드 version 전달   | PASS/FAIL | 누락 API 함수            |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **TeamsService, UsersService** — 관리자 전용 CRUD 작업으로 동시 수정 위험이 낮아 CAS 불필요
2. **DashboardService, ReportsService** — 읽기 전용 서비스로 상태 변경 없음
3. **NotificationsService** — append-only 작업으로 CAS 불필요
4. **CalibrationPlansService의 casVersion** — `version`이 아닌 `casVersion` 필드 사용은 의도적 설계 (plan revision과 CAS 버전 분리)
5. **Create 작업** — 새 레코드 생성은 CAS 불필요 (기존 레코드 없음)
6. **SettingsService** — 시스템 관리자 전용, 단일 사용자 동시 수정 시나리오 없음
