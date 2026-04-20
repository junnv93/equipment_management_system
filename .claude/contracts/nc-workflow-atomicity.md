# Contract: nc-workflow-atomicity

**Mode**: 2  
**Slug**: `nc-workflow-atomicity`  
**Date**: 2026-04-20  
**Related exec-plan**: `.claude/exec-plans/active/2026-04-20-nc-workflow-atomicity.md`

---

## MUST Criteria

### Phase 1 — Atomicity / Payload / Dead code

| # | Criterion | Verify |
|---|-----------|--------|
| M1.1 | `approveCalibration` 이 `this.db.transaction(...)` 로 감싸져 있다 | Read `calibration.service.ts` |
| M1.2 | `updateWithVersion(schema.calibrations, ...)` 호출에 `tx` 6번째 인자 전달 | Read |
| M1.3 | `updateEquipmentCalibrationDates` 가 더 이상 내부 `db.transaction` 을 열지 않음 | Read |
| M1.4 | `markCalibrationOverdueAsCorrectedTx` 가 outer tx 로 실행됨 | Read |
| M1.5 | `NC_CLOSED` 이벤트 payload 에 `equipmentName`, `managementNumber`, `reporterTeamId` 빈 문자열 **아님** | Read |
| M1.6 | `markCorrected` / `rejectCorrection` 이벤트 payload 도 동일하게 enriched | Read |
| M1.7 | `findOne` 의 `with.equipment.columns` 에 `teamId: true` 포함 | Read |
| M1.8 | `NonConformanceDetail` 의 equipment Pick 에 `teamId` 포함 | Read `non-conformances.types.ts` |
| M1.9 | `calibration-overdue-scheduler.ts` 의 `markCalibrationOverdueAsCorrected` 삭제 | `grep -n "markCalibrationOverdueAsCorrected\b" apps/backend/src/modules/notifications` → 0 |
| M1.10 | `requiresRepair` 메서드 삭제 | `grep -rn "requiresRepair" apps/backend/src` → 0 |

### Phase 2 — SSOT + Semantics

| # | Criterion | Verify |
|---|-----------|--------|
| M2.1 | `packages/shared-constants/src/calibration-overdue.ts` 파일 존재 | ls |
| M2.2 | `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES` 가 shared-constants index 에서 re-export | Read |
| M2.3 | `calibration-overdue-scheduler.ts` 에 로컬 `EXCLUDED_STATUSES` 배열 없음 | Read |
| M2.4 | `getOverdueCalibrations` 에 `notInArray(equipment.status, EXCLUDED_OVERDUE_EQUIPMENT_STATUSES)` 적용 | Read |
| M2.5 | `findOpenByEquipment` 가 `inArray(status, [OPEN, CORRECTED])` 사용 | Read |
| M2.6 | `isEquipmentNonConforming` 가 `inArray(status, [OPEN, CORRECTED])` 사용 | Read |

### Phase 3 — previousEquipmentStatus

| # | Criterion | Verify |
|---|-----------|--------|
| M3.1 | `non_conformances.previous_equipment_status` 컬럼 존재 (varchar(30), nullable) | `\d non_conformances` |
| M3.2 | `apps/backend/drizzle/0040_nc_previous_equipment_status.sql` 존재 | ls |
| M3.3 | `_journal.json` 에 idx 40, tag `0040_nc_previous_equipment_status` 존재 | Read |
| M3.4 | rollback SQL 파일 존재 | ls |
| M3.5 | `create()` 가 `previousEquipmentStatus: currentEquip.status` insert | Read |
| M3.6 | Scheduler NC insert 에 `previousEquipmentStatus: equip.status` 포함 | Read |
| M3.7 | `close()` 가 `previousEquipmentStatus ?? 'available'` 로 복원 | Read |
| M3.8 | EXCLUDED 집합 교집합 시 `available` fallback 방어 로직 존재 | Read |
| M3.9 | `pnpm --filter backend run db:reset` PASS | 명령 |

### 공통

| # | Criterion | Verify |
|---|-----------|--------|
| MC.1 | `pnpm --filter backend run tsc --noEmit` PASS | 명령 |
| MC.2 | `pnpm --filter backend run test` PASS | 명령 |
| MC.3 | `pnpm --filter backend run lint` PASS | 명령 |
| MC.4 | 각 Phase 독립 커밋 (최소 3개) | `git log --oneline` |
| MC.5 | main 직접 작업 (브랜치 0) | git status |

---

## SSOT 요구사항

| 항목 | SSOT 위치 |
|------|-----------|
| EXCLUDED overdue 장비 상태 | `@equipment-management/shared-constants` → `EXCLUDED_OVERDUE_EQUIPMENT_STATUSES` |
| EquipmentStatus 값 | `@equipment-management/schemas` → `EquipmentStatusEnum` |
| NC 이벤트 페이로드 형상 | `notification-events.ts` (기존 유지) |
| CAS 업데이트 경로 | `VersionedBaseService.updateWithVersion` (tx 인자 경유) |

---

## SHOULD Criteria (루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | `findAll` 경로에도 `equipment.teamId` 일관 노출 |
| S2 | `close()` 복원 로그에 previousStatus + 실제 사용 status + fallback 여부 구조화 |
| S3 | `getSummary` overdueCount 에도 EXCLUDED 필터 적용 |
| S4 | `findOpenCalibrationOverdueNc` grep 0건이면 함께 삭제 |

---

## Out-of-scope

- approve/reject DTO 변경
- actorName 채우기
- 신규 이벤트/권한/역할 추가
- UI 변경
- E2E 스펙 신규 작성
