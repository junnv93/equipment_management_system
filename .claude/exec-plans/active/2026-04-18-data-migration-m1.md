# Phase 2 — data-migration M1 실행 계획

**Slug**: data-migration-m1
**Date**: 2026-04-18
**Mode**: Mode 2

---

## 배경 / 현황 요약

M1 대부분은 이미 구현되어 있음. 남은 gap:

1. `MigrationSessionStatus`가 union type으로만 존재 — `as const` 객체 SSOT로 승격되지 않음
2. `data-migration.service.ts`의 session status 7곳이 문자열 리터럴(`'preview'`, `'executing'`, `'completed'`, `'failed'`)로 하드코딩 — SSOT 도입 시 해당 리터럴을 상수 참조로 교체 필요
3. M1의 모든 acceptance criteria (tsc/SSOT/state machine)를 실측으로 재검증 (grep + build + test)

이미 완료된 항목 (재확인용):
- `PERFORM_DATA_MIGRATION` — `permissions.ts:212`, `role-permissions.ts:304` (SYSTEM_ADMIN), controller 4곳
- `MIGRATION_SESSION_TTL_MS` — `business-rules.ts:123` (1_800_000 × 2 = 3_600_000ms)
- `MIGRATION_ROW_STATUS` / `INSERTABLE_STATUSES` / `MIGRATION_SHEET_TYPE` — `packages/schemas/src/data-migration.ts`
- `MultiSheetMigrationSession.status` field + state machine — `types/data-migration.types.ts`, `data-migration.service.ts:377-402`
- `fk-resolution.service.ts` — 298 lines, batch resolve 구현 완료
- 서비스 내 `'valid'/'warning'/'error'/'duplicate'` 문자열 리터럴 0건 (comment + `Exclude<MigrationSheetType, 'equipment'>` 타입 narrowing만 남음 — 둘 다 허용)

---

## 변경 파일 목록

### 1. `packages/schemas/src/data-migration.ts`
**Goal**: `MigrationSessionStatus` union type을 `as const` 객체 SSOT + type alias 패턴으로 승격.
- `MIGRATION_SESSION_STATUS` 상수 4개 값(PREVIEW/EXECUTING/COMPLETED/FAILED) export
- `MigrationSessionStatus` 타입은 기존과 동일한 string literal union으로 유지 (backward-compat)
- `MIGRATION_ROW_STATUS` 패턴과 동일한 구조

### 2. `apps/backend/src/modules/data-migration/types/data-migration.types.ts`
**Goal**: `MigrationSessionStatus` 로컬 정의 제거, schemas SSOT에서 import + re-export.
- 현재 line 77 `export type MigrationSessionStatus = 'preview' | 'executing' | 'completed' | 'failed';` 를 schemas에서 import하는 패턴으로 교체
- 다른 타입들과 동일한 re-export 패턴 (line 10-30) 유지

### 3. `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
**Goal**: session status 문자열 리터럴 7곳을 `MIGRATION_SESSION_STATUS.*` 상수 참조로 교체.
- 기존 import 라인(line 17-20)에 `MIGRATION_SESSION_STATUS` 추가
- 비교·할당 위치 7곳(line 329, 377, 383, 389, 397, 813, 847)을 상수 참조로 전환
- 동작/로직 변경 없음 (surgical substitution)

### 4. (검증만) `apps/backend/src/modules/data-migration/data-migration.controller.ts`
**No changes** — 이미 `PERFORM_DATA_MIGRATION` 4곳(line 56, 97, 122, 146) 적용되어 있음.

### 5. (검증만) `packages/shared-constants/src/permissions.ts`
**No changes** — `PERFORM_DATA_MIGRATION = 'perform:data:migration'` 이미 정의됨 (line 212).

### 6. (검증만) `packages/shared-constants/src/business-rules.ts`
**No changes** — `MIGRATION_SESSION_TTL_MS = 3_600_000` 이미 정의됨 (line 123).

### 7. (검증만) `apps/backend/src/modules/data-migration/services/fk-resolution.service.ts`
**No changes** — 존재 확인 완료 (298 lines).

### 8. (검증만) `apps/frontend/lib/navigation/nav-config.ts`
**No changes** — line 151에 `requiredPermission: Permission.PERFORM_DATA_MIGRATION` 이미 적용.

---

## 파일 범위 경계

- 위 3개 파일만 수정 대상. 그 외(frontend hooks/components, excel-parser, validators, controller, DTO, tests, migration mappings)는 **touch 금지**.
- 기존 테스트(`__tests__/`) 파일 수정 금지 — 상수 전환 시 테스트가 실패하면 구현 쪽 문제 (테스트 조정이 아니라 구현 재검토).

---

## 검증 명령어

```bash
# 1. 타입 체크 (3 workspace)
pnpm --filter backend run tsc --noEmit
pnpm --filter @equipment-management/schemas run tsc --noEmit  # 또는 루트 pnpm tsc로 대체
pnpm --filter @equipment-management/shared-constants run tsc --noEmit

# 2. 백엔드 유닛 테스트 (data-migration 모듈)
pnpm --filter backend run test -- data-migration

# 3. 문자열 리터럴 잔존 여부 확인 (M7/M10 확인용)
#    service.ts에 session status 리터럴이 남지 않았는지
rg -n "'preview'|'executing'|'completed'|'failed'" apps/backend/src/modules/data-migration/services/data-migration.service.ts

# 4. 권한 상수 사용 횟수 (M3 확인용: controller 내 PERFORM_DATA_MIGRATION 4건 기대)
rg -n "PERFORM_DATA_MIGRATION" apps/backend/src/modules/data-migration/data-migration.controller.ts

# 5. SESSION_TTL_MS 로컬 정의 잔존 여부 (M5 확인용)
rg -n "^const SESSION_TTL_MS|^\s*SESSION_TTL_MS\s*=" apps/backend/src/modules/data-migration

# 6. SSOT 상수 export 확인
rg -n "MIGRATION_ROW_STATUS|MIGRATION_SHEET_TYPE|MIGRATION_SESSION_STATUS" packages/schemas/src/data-migration.ts
```

---

## Out of Scope (후속 M2~)

- FK resolution 성능 최적화 / edge case 보강
- Frontend wizard 컴포넌트 리팩토링
- Excel parser 세분화 (feature 확장)
- Preview → Execute 트랜잭션 rollback 시나리오 보강
- 관련 E2E 테스트 추가
