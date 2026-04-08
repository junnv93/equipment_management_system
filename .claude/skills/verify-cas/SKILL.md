---
name: verify-cas
description: Verifies CAS (Optimistic Locking) pattern compliance — version field in DTOs, VersionedBaseService usage, cache invalidation on 409 conflict, frontend VERSION_CONFLICT error handling. Run after adding/modifying state-change endpoints.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# CAS (Optimistic Locking) 패턴 검증

## Purpose

상태 변경이 수반되는 백엔드 코드가 CAS 패턴을 올바르게 준수하는지 검증합니다:

1. **VersionedBaseService 상속** — 상태 변경 서비스가 VersionedBaseService를 상속하는지
2. **versionedSchema DTO** — 상태 변경 DTO에 `version` 필드가 포함되어 있는지
3. **updateWithVersion 사용** — `.update()` 대신 `updateWithVersion()`으로 상태를 변경하는지
4. **캐시 무효화** — ConflictException(409) 발생 시 detail 캐시를 삭제하는지
5. **프론트엔드 version 전달** — mutation에서 version 필드를 서버에 전달하는지

## When to Run

- 새로운 상태 변경 엔드포인트를 추가한 후
- 기존 서비스의 상태 변경 로직을 수정한 후
- 새로운 엔티티/모듈을 생성한 후
- CAS 관련 버그를 수정한 후

## Related Files

| File | Purpose |
|---|---|
| `apps/backend/src/common/base/versioned-base.service.ts` | VersionedBaseService 베이스 클래스 + `onVersionConflict` 훅 |
| `apps/backend/src/common/base/__tests__/versioned-base.service.spec.ts` | hook 계약 회귀 테스트 (성공/NotFound/409+hook/hook fail/no-op) |
| `apps/backend/src/common/dto/base-versioned.dto.ts` | versionedSchema 정의 |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts` | 캐시 무효화 헬퍼 |
| `apps/frontend/hooks/use-optimistic-mutation.ts` | 프론트엔드 optimistic mutation 훅 |

## Workflow

### Step 1: CAS 적용 서비스 목록 확인

VersionedBaseService를 상속하는 서비스와 자체 CAS 구현 서비스를 확인합니다.
**기대값:** 9개 서비스 (checkouts, calibration, non-conformances, equipment-imports, disposal, software, equipment, calibration-factors, calibration-plans)

상세: [references/cas-checks.md](references/cas-checks.md) Step 1

### Step 2: 상태 변경 DTO에 version 필드 포함 여부

approve/reject/update/close DTO에 `versionedSchema`가 포함되어 있는지 확인합니다.
**PASS:** 모든 상태 변경 DTO에 versionedSchema spread. **FAIL:** 누락 DTO 발견.

상세: [references/cas-checks.md](references/cas-checks.md) Step 2

### Step 3: updateWithVersion 사용 검증

CAS 서비스에서 `.update()` 대신 `updateWithVersion()`을 사용하는지 확인합니다.
**PASS:** 직접 `.update()` 호출 없음. **FAIL:** 버전 체크 없는 `.update()` 사용.

상세: [references/cas-checks.md](references/cas-checks.md) Step 3

### Step 4: ConflictException 후 캐시 삭제 — `onVersionConflict` 훅 사용 권장

CAS 실패(409) 시 stale cache 를 방지하기 위해 detail 캐시를 삭제하는지 확인합니다.

**권장 패턴 (2026-04-08~):** `VersionedBaseService.onVersionConflict(id)` 훅을
서브클래스에서 override 하여 도메인별 캐시 무효화 정책을 단일 지점에 정의.
`updateWithVersion` 이 ConflictException throw 직전에 자동 호출되므로
호출 사이트마다 try/catch boilerplate 가 필요 없음.

```ts
// ✅ 권장 — 정책 한 곳, 호출 사이트는 깨끗
protected async onVersionConflict(id: string): Promise<void> {
  await this.cacheService.delete(this.buildCacheKey('detail', id));
}

// ❌ 안티패턴 — boilerplate 반복, 누락 시 stale 캐시 위험
try {
  await this.updateWithVersion(...);
} catch (error) {
  if (error instanceof ConflictException) {
    this.cacheService.delete(this.buildCacheKey('detail', id));
  }
  throw error;
}
```

**탐지 명령어:**
```bash
# updateWithVersion 호출이 있는 서비스에서 ConflictException 인스턴스 체크 패턴 잔존
grep -rln "updateWithVersion" apps/backend/src/modules/ | xargs grep -l "instanceof ConflictException"
```

**예외:** raw `tx.update` 로 CAS 를 수동 수행하는 경로(예: `equipment-imports.service.onReturnCompleted`)
는 훅을 우회하므로 인라인 catch 유지가 정당함.

**PASS:** updateWithVersion 호출 사이트에 boilerplate 없음 + 도메인이 캐시를 가지면 onVersionConflict override 존재.
**FAIL:** updateWithVersion 호출 후 inline `instanceof ConflictException` catch + cache.delete 잔존.

상세: [references/cas-checks.md](references/cas-checks.md) Step 4

### Step 5~11: 추가 CAS 검증

| Step | 검증 대상 |
|---|---|
| 5 | 트랜잭션 내 CAS tx 전달 |
| 6 | equipment 직접 업데이트 시 version bump |
| 7 | equipment 직접 업데이트 후 캐시 무효화 |
| 8 | 보상 트랜잭션 패턴 (Compensating Transaction) |
| 9 | 프론트엔드 mutation에서 version 전달 |
| 10 | 승인 프로세스의 CAS version 교체 (stale requestData) |
| 11 | updateWithVersion의 version 인자 출처 (DB 조회값 금지) |

상세: [references/cas-checks.md](references/cas-checks.md) Step 5~11

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
| 11  | version 인자 출처         | PASS/FAIL | DB 조회 version 사용     |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **TeamsService, UsersService** — 관리자 전용 CRUD, 동시 수정 위험 낮음
2. **DashboardService, ReportsService** — 읽기 전용
3. **NotificationsService** — append-only
4. **CalibrationPlansService의 casVersion** — 의도적 설계 (plan revision과 CAS 분리)
5. **Create 작업** — 새 레코드 생성은 CAS 불필요
6. **SettingsService** — 시스템 관리자 전용
7. **크로스 테이블 version bump (CAS WHERE 없이)** — 트랜잭션 내 시스템 자동 처리, 사용자 경합 없음. 단 version bump 자체는 필수
8. **CacheInvalidationHelper가 없는 읽기 전용 서비스** — version bump만 하고 캐시 무효화 불필요한 경우
9. **raw `tx.update` 수동 CAS 경로** — `updateWithVersion` 우회 구조라 `onVersionConflict` 훅이 호출되지 않으므로 인라인 catch 유지가 정당 (예: `equipment-imports.service.onReturnCompleted`)
