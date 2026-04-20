# Exec Plan: nc-workflow-atomicity

**Date**: 2026-04-20  
**Slug**: `nc-workflow-atomicity`  
**Mode**: 2 (Backend + DB migration + SSOT refactor)  
**Status**: active

---

## 0. Problem & Goal

### Problem

교정 기한 초과 → NC 자동 생성 → 교정 승인 시 NC 자동 조치 → NC 종료 → 장비 상태 복원 전체 워크플로우에 7건의 구조적 결함이 있다:

1. **[CRITICAL] `approveCalibration` 원자성 붕괴** — `calibration.service.ts` 의 `updateWithVersion(calibrations, ...)` 와 `updateEquipmentCalibrationDates()` (내부 `db.transaction(...)`) 가 서로 다른 트랜잭션이다. 2단계가 실패하면 교정은 `approved` 인데 장비 `nextCalibrationDate` 와 NC `corrected` 전이가 누락되어 영구적 불일치 발생.
2. **[HIGH] NC 이벤트 페이로드 빈 문자열 하드코딩** — `non-conformances.service.ts` L794/843/988 에서 `equipmentName: ''`, `managementNumber: ''`, `reporterTeamId: ''` 가 하드코딩됨. 그러나 `findOne` 결과(`NonConformanceDetail`)는 이미 `equipment { name, managementNumber }` 를 포함. 알림/이메일이 빈값으로 발송되어 운영 가시성 손상.
3. **[HIGH] Scheduler dead code** — `calibration-overdue-scheduler.ts` L401-434 의 public `markCalibrationOverdueAsCorrected` 메서드는 외부 호출자 0건 (grep 완전 확인). 추가로 version bump 누락 — split-brain 위험까지 안고 dormant.
4. **[MEDIUM] `findOpenByEquipment`/`isEquipmentNonConforming` 시맨틱 불일치** — 두 메서드가 `status = 'open'` 만 체크. 그러나 `corrected` 도 "종료되지 않은 활성 NC" 임. `close()` 는 `ne(status, CLOSED)` 로 open+corrected 둘 다 "미종결" 로 취급 — 메서드 간 기준 불일치.
5. **[MEDIUM] `getOverdueCalibrations` EXCLUDED_STATUSES 미적용** — Scheduler는 non_conforming/disposed/pending_disposal/inactive 제외하지만, API `getOverdueCalibrations()` 는 필터 없음. 이미 NC 처리된/폐기된 장비가 overdue 목록에 노출됨. EXCLUDED_STATUSES 는 현재 `calibration-overdue-scheduler.ts` L49-54 에 로컬 상수 — SSOT 위반.
6. **[LOW] `requiresRepair` deprecated dead** — `non-conformances.service.ts` L1010-1016 의 `@deprecated` private 메서드. 호출자 0.
7. **[LOW] NC close 시 이전 장비 상태 복원 불가** — 장비가 `checking`, `rented`, `spare` 상태에서 NC 가 생성되면 무조건 `non_conforming` 으로 덮어쓰고, 종료 시 `available` 로 복원 → 원래 상태가 소실. 감사 추적 불가능.

### Goal

- 교정 승인 → 장비 교정일 갱신 → calibration_overdue NC → corrected 전이가 **단일 outer transaction 내에서 all-or-nothing** 으로 실행된다.
- NC 이벤트 페이로드는 `findOne()` 이 이미 JOIN 한 equipment relation 을 소비하여 빈값 제거.
- EXCLUDED_STATUSES 가 `@equipment-management/shared-constants` SSOT 로 승격되어 scheduler 와 calibration API 가 공유.
- NC close 시 생성 시점 장비 상태(`previousEquipmentStatus`) 를 복원 — 임의 `available` 로 강제 전이 금지.
- Dead code (scheduler `markCalibrationOverdueAsCorrected`, `requiresRepair`) 는 삭제.

### Non-goals

- 교정 승인 워크플로우 변경 (approve/reject 라우트, DTO, 권한)
- 알림 채널(SMS/이메일) 변경
- `actorName` 채우기 (별도 이슈)
- E2E 스펙 신규 작성
- UI 변경

---

## 1. Pre-read Verification (Planner 완료)

| 항목 | 위치 | 결과 |
|------|------|------|
| `updateWithVersion` 의 `tx?` 파라미터 | `versioned-base.service.ts:153,158` | O — executor = tx ?? this.db |
| `approveCalibration` → `updateWithVersion` (no tx) | `calibration.service.ts:1339-1349` | O — standalone update |
| `updateEquipmentCalibrationDates` → `db.transaction` | `calibration.service.ts:1430-1475` | O — 독립 tx |
| `markCalibrationOverdueAsCorrectedTx` 내 NC version bump | `calibration.service.ts:1530-1532` | O — `version + 1` |
| Scheduler dead method | `calibration-overdue-scheduler.ts:401-434` | O — grep self-reference 만 |
| 현재 EXCLUDED_STATUSES 정의 위치 | `calibration-overdue-scheduler.ts:49-54` | 로컬 상수 |
| `NonConformanceDetail` 타입이 `equipment` 포함 | `non-conformances.types.ts:16-26` | O |
| NC 이벤트 3곳 empty string | `non-conformances.service.ts:794-799, 843-849, 988-993` | O |
| `findOpenByEquipment` status 필터 | `non-conformances.service.ts:602-615` | `eq(status, OPEN)` only |
| `isEquipmentNonConforming` status 필터 | `non-conformances.service.ts:620-634` | `eq(status, OPEN)` only |
| `close()` 다른 미종결 NC 체크 | `non-conformances.service.ts:725-737` | `ne(status, CLOSED)` — open+corrected 둘 다 |
| `requiresRepair` deprecated | `non-conformances.service.ts:1013-1016` | @deprecated, 호출자 0 |
| `getOverdueCalibrations` 필터 | `calibration.service.ts:733-738` | EXCLUDED_STATUSES 없음 |
| 다음 migration idx | `apps/backend/drizzle/meta/_journal.json` | 40 (최신 0039) |
| NC 스키마에 `previousEquipmentStatus` 컬럼 | `packages/db/src/schema/non-conformances.ts` | **부재 — 신규 컬럼 필요** |
| NC create TX 내 이전 장비 상태 포착 가능 | `non-conformances.service.ts:186-198` | O — `currentEquip.status` 이미 select |
| Scheduler create TX 내 이전 장비 상태 | `calibration-overdue-scheduler.ts:197-265` | O — `equip.status` select |

---

## 2. Changed Files

| Phase | 파일 | 성격 |
|-------|------|------|
| 1 | `apps/backend/src/modules/calibration/calibration.service.ts` | approveCalibration 원자성 복원 (outer tx) |
| 1 | `apps/backend/src/modules/non-conformances/non-conformances.service.ts` | 이벤트 페이로드 enrichment + dead code 삭제 |
| 1 | `apps/backend/src/modules/non-conformances/non-conformances.types.ts` | equipment.teamId 추가 |
| 1 | `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` | dead method 삭제 |
| 2 | `packages/shared-constants/src/calibration-overdue.ts` | 신규: EXCLUDED_OVERDUE_EQUIPMENT_STATUSES SSOT |
| 2 | `packages/shared-constants/src/index.ts` | re-export |
| 2 | `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` | 로컬 상수 → SSOT import |
| 2 | `apps/backend/src/modules/calibration/calibration.service.ts` | `getOverdueCalibrations` EXCLUDED 필터 적용 |
| 2 | `apps/backend/src/modules/non-conformances/non-conformances.service.ts` | `findOpenByEquipment` + `isEquipmentNonConforming` open ∪ corrected |
| 3 | `packages/db/src/schema/non-conformances.ts` | `previousEquipmentStatus` 컬럼 추가 |
| 3 | `apps/backend/drizzle/0040_nc_previous_equipment_status.sql` | 신규 수동 마이그레이션 |
| 3 | `apps/backend/drizzle/rollback_0040_nc_previous_equipment_status.sql` | 롤백 SQL |
| 3 | `apps/backend/drizzle/meta/_journal.json` | idx 40 entry 추가 |
| 3 | `apps/backend/src/modules/non-conformances/non-conformances.service.ts` | `create` → previousStatus 저장, `close` → previousStatus 기반 복원 |
| 3 | `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` | NC insert 에 previousStatus 추가 |

---

## 3. Phase-Based Execution

### Phase 1 — Atomicity + Payload + Dead code 제거

**목표:** 원자성 깨진 approve 경로를 단일 tx 로 묶고, NC 이벤트를 enrichment 하고, dead code 를 삭제한다. DB 스키마 변경 없음.

#### 1.1 `approveCalibration` 을 단일 outer transaction 으로 감싸기

**파일: `calibration.service.ts`**

- `approveCalibration` 메서드 전체를 `this.db.transaction(async (tx) => { ... })` 로 감싼다.
- `updateWithVersion(schema.calibrations, id, approveDto.version, {...}, 'Calibration record', tx)` — 6번째 파라미터로 tx 전달.
- `approvedEquip` select 쿼리도 tx 로 실행 (일관된 snapshot).
- `updateEquipmentCalibrationDates` 시그니처에 `tx` 파라미터 추가 → 내부 `this.db.transaction` 제거, outer tx 공유.
  - 새 시그니처: `private async updateEquipmentCalibrationDates(tx, equipmentId, calibrationDate, calibrationId?, approverId?, preloadedCycle?)`
  - 내부의 `this.db.transaction(async (tx) => {...})` 블록을 제거하고 tx 직접 사용.
  - `markCalibrationOverdueAsCorrectedTx(tx, ...)` 는 이미 tx 파라미터를 받으므로 그대로.
- 캐시 무효화 / 이벤트 발행은 tx 커밋 성공 이후 (현재 순서 유지).
- `invalidateCalibrationCache` 호출은 tx 외부 유지.

#### 1.2 NC 이벤트 페이로드 enrichment

**파일: `non-conformances.service.ts`**

- `findOne` 의 `with.equipment.columns` 에 `teamId: true` 추가.
- `close()` L791-800, `markCorrected()` L984-994, `rejectCorrection()` L840-850 의 이벤트 payload:
  - `equipmentName: (nonConformance as NonConformanceDetail).equipment?.name ?? ''`
  - `managementNumber: (nonConformance as NonConformanceDetail).equipment?.managementNumber ?? ''`
  - `reporterTeamId: (nonConformance as NonConformanceDetail).equipment?.teamId ?? ''`
  - `actorName: ''` — 기존 유지 (별도 이슈)

**파일: `non-conformances.types.ts`**

- `NonConformanceDetail` 의 `equipment` Pick 에 `teamId` 추가.

#### 1.3 Dead code 삭제

**파일: `calibration-overdue-scheduler.ts`**

- L401-434 `markCalibrationOverdueAsCorrected` public 메서드 전체 삭제.
- L363-392 `findOpenCalibrationOverdueNc` 는 grep 확인 후 외부 호출자 0이면 함께 삭제.
  - 확인: `grep -rn "findOpenCalibrationOverdueNc" apps/backend/src`

**파일: `non-conformances.service.ts`**

- L1010-1016 `requiresRepair` private 메서드 전체 삭제.
- `REPAIR_REQUIRING_NC_TYPES` import 가 다른 곳에서 미사용이면 import도 정리.

**검증:**
```bash
grep -rn "markCalibrationOverdueAsCorrected\b" apps/backend/src/modules/notifications
# → 0건이어야 함

grep -rn "requiresRepair" apps/backend/src
# → 0건이어야 함

pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run lint
```

**커밋:** `fix(nc-workflow): phase 1 — atomic approveCalibration + NC event payload enrichment + dead code removal`

---

### Phase 2 — SSOT 승격 + 시맨틱 일관성

**목표:** EXCLUDED_STATUSES 를 shared-constants 로 승격. overdue API 와 NC active 조회의 시맨틱을 워크플로우 실제와 일치시킴.

#### 2.1 EXCLUDED_OVERDUE_EQUIPMENT_STATUSES SSOT 승격

**파일 신규: `packages/shared-constants/src/calibration-overdue.ts`**

```typescript
// @equipment-management/schemas 에서 EquipmentStatusEnum import (단방향 의존성 OK)
import { EquipmentStatusEnum } from '@equipment-management/schemas';

export const EXCLUDED_OVERDUE_EQUIPMENT_STATUSES = [
  EquipmentStatusEnum.enum.non_conforming,
  EquipmentStatusEnum.enum.disposed,
  EquipmentStatusEnum.enum.pending_disposal,
  EquipmentStatusEnum.enum.inactive,
] as const;
```

**파일: `packages/shared-constants/src/index.ts`**

- `export { EXCLUDED_OVERDUE_EQUIPMENT_STATUSES } from './calibration-overdue';` 추가.

**파일: `calibration-overdue-scheduler.ts`**

- L49-54 로컬 `EXCLUDED_STATUSES` 배열 삭제.
- `@equipment-management/shared-constants` 에서 `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES` import.
- 사용처 rename: `EXCLUDED_STATUSES` → `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES`.

**파일: `calibration.service.ts`**

- `getOverdueCalibrations` L733-738 의 `whereConditions` 에 추가:
  `notInArray(schema.equipment.status, EXCLUDED_OVERDUE_EQUIPMENT_STATUSES)`
- `drizzle-orm` 에서 `notInArray` import (이미 있으면 재사용).
- `@equipment-management/shared-constants` 에서 `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES` import.
- `getSummary` L678-709 의 overdueCount FILTER 절도 동일 EXCLUDED 조건 추가 (과다 카운트 해소 — SHOULD S3).

#### 2.2 `findOpenByEquipment` / `isEquipmentNonConforming` 시맨틱 수정

**파일: `non-conformances.service.ts`**

- `findOpenByEquipment` L602-615:
  - `eq(nonConformances.status, NonConformanceStatus.OPEN)` →
    `inArray(nonConformances.status, [NonConformanceStatus.OPEN, NonConformanceStatus.CORRECTED])`
  - `drizzle-orm` 에서 `inArray` import (이미 있으면 재사용).
  - 메서드명 유지 (breaking change 최소화). JSDoc 에 "active unresolved = open + corrected" 명시.

- `isEquipmentNonConforming` L620-634:
  - 동일 수정.
  - 호출자 조사: `grep -rn "isEquipmentNonConforming" apps/backend/src` → 시맨틱 확장 영향 파악.

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run lint
pnpm --filter @equipment-management/shared-constants run build
```

**커밋:** `fix(nc-workflow): phase 2 — EXCLUDED_STATUSES SSOT + NC active semantics (open ∪ corrected)`

---

### Phase 3 — `previousEquipmentStatus` 복원 (DB 마이그레이션 포함)

**목표:** NC 생성 시점 장비 상태를 기록하고, 종료 시 이를 복원하여 상태 전환의 감사 추적성을 회복한다.

#### 3.1 스키마 + 마이그레이션

**파일: `packages/db/src/schema/non-conformances.ts`**

- 신규 컬럼 추가:
  ```typescript
  previousEquipmentStatus: varchar('previous_equipment_status', { length: 30 })
    .$type<EquipmentStatus>(),  // nullable (기존 레코드 호환)
  ```
- `EquipmentStatus` type import from `@equipment-management/schemas`.

**파일 신규: `apps/backend/drizzle/0040_nc_previous_equipment_status.sql`**

```sql
-- Migration: Add previous_equipment_status to non_conformances
-- Date: 2026-04-20
-- Purpose: NC close 시 장비를 임의 'available' 로 복원하지 않고, NC 생성 시점 장비 상태로 복원
-- Backward compat: nullable → 과거 레코드는 null, close 경로에서 fallback 'available'

ALTER TABLE non_conformances
  ADD COLUMN IF NOT EXISTS previous_equipment_status varchar(30);
```

**파일 신규: `apps/backend/drizzle/rollback_0040_nc_previous_equipment_status.sql`**

```sql
-- Rollback Migration 0040
ALTER TABLE non_conformances
  DROP COLUMN IF EXISTS previous_equipment_status;
```

**파일: `apps/backend/drizzle/meta/_journal.json`**

- idx 40 entry 추가 (기존 39 이후):
  ```json
  {
    "idx": 40,
    "version": "7",
    "when": <current_unix_ms>,
    "tag": "0040_nc_previous_equipment_status",
    "breakpoints": true
  }
  ```

#### 3.2 NC 생성 경로 2곳에 previousStatus 기록

**파일: `non-conformances.service.ts`** — `create()` L222-232:

- 이미 `currentEquip.status` select 중 → `insert.values({..., previousEquipmentStatus: currentEquip.status })` 추가.

**파일: `calibration-overdue-scheduler.ts`** — `handleCalibrationOverdueCheck()` L223-238:

- NC insert values 에 `previousEquipmentStatus: equip.status` 추가.
- `equip` select 에 이미 `status` 포함됨 — 추가 쿼리 불필요.

#### 3.3 NC close 경로에서 previousStatus 기반 복원

**파일: `non-conformances.service.ts`** — `close()` L753-766:

- `status: EquipmentStatusEnum.enum.available` 하드코딩 →
  ```typescript
  const restoredStatus = (() => {
    const prev = nonConformance.previousEquipmentStatus;
    if (!prev) return EquipmentStatusEnum.enum.available;  // null fallback
    if ((EXCLUDED_OVERDUE_EQUIPMENT_STATUSES as readonly string[]).includes(prev)) {
      return EquipmentStatusEnum.enum.available;  // 비정상 이전 상태 방어
    }
    return prev as EquipmentStatus;
  })();
  ```
- `status: restoredStatus` 로 교체.
- `@equipment-management/shared-constants` 에서 `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES` import.
- 복원 로그: `this.logger.log(`NC ${id}: equipment ${nonConformance.equipmentId} status restored ${nonConformance.previousEquipmentStatus ?? 'null'} → ${restoredStatus}`)`.

**검증:**
```bash
pnpm --filter backend run db:migrate
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run lint

docker compose exec postgres psql -U postgres -d equipment_management -c "\d non_conformances" | grep previous_equipment_status
```

**커밋:** `feat(nc): phase 3 — preserve and restore previous equipment status on NC lifecycle`

---

## 4. Verification Gate (각 Phase 커밋 직전)

```bash
# 공통
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run lint

# DB 변경 Phase (3)
pnpm --filter backend run db:migrate
pnpm --filter backend run db:reset

# 최종
pnpm --filter backend run build
```

---

## 5. Risk & Rollback

| 위험 | 완화 |
|------|------|
| outer tx 도입 후 캐시 무효화/이벤트가 tx 내부에서 실행되면 커밋 전 이벤트 발생 | 이벤트/캐시는 tx 리턴 이후 실행 — 기존 순서 유지 |
| `updateEquipmentCalibrationDates` 의 다른 호출자가 tx 시그니처 변경에 영향 | grep 전수 확인 후 커밋 — `approveCalibration` 만 |
| `findOpenByEquipment` 시맨틱 확장이 checkout guard 등 breaking | 호출자 grep + integration test 통과 확인 |
| Phase 3 마이그레이션이 `db:reset` 시 실패 | nullable 컬럼이므로 reset 안전, rollback SQL 동반 |
| previousEquipmentStatus=null 인 과거 레코드 close | 명시적 null-coalescing fallback 'available' |
| EXCLUDED 교집합 previousStatus 복원 방어 | `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES` 포함 여부 검사 후 'available' fallback |
