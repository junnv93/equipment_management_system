# Contract: intermediate-inspection-nonCalib

**Mode**: 2 (architecture change — DB + service + frontend)
**Slug**: `intermediate-inspection-nonCalib`
**Date**: 2026-04-19
**Related exec-plan**: `.claude/exec-plans/active/2026-04-19-intermediate-inspection-nonCalib.md`

## Scope

`equipment.needsIntermediateCheck = true` 장비에 대해 **교정 기록 유무 및 `managementMethod`와 무관하게** 중간점검(UL-QP-18-03) 생성을 허용한다. 기존 외부교정 흐름은 regression 없이 유지된다.

> ⚠️ **Field name correction**: prompt가 언급한 `equipment.requiresIntermediateInspection`은 실제 스키마에 없음. 기존 필드 `equipment.needsIntermediateCheck` (boolean, default false)를 재사용한다. 새 필드를 만들지 않는다.

## Changed Files

1. `packages/db/src/schema/intermediate-inspections.ts`
2. `apps/backend/drizzle/0032_intermediate_inspection_calibration_nullable.sql` (신규, `db:generate` 산출)
3. `apps/backend/drizzle/meta/_journal.json` + `meta/0032_snapshot.json` (drizzle-kit 자동)
4. `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts`
5. `apps/frontend/components/equipment/InspectionTab.tsx`

## MUST Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| M1 | `intermediate_inspections.calibration_id` 컬럼이 NULLABLE | `docker compose exec postgres psql -U postgres -d equipment_management -c "\d intermediate_inspections"` → `calibration_id` 에 `not null` 없음 |
| M2 | FK `intermediate_inspections_calibration_id_calibrations_id_fk` + `onDelete: restrict` 유지 | `\d intermediate_inspections` → Foreign-key constraints 섹션에 REFERENCES ... ON DELETE RESTRICT |
| M3 | Drizzle schema L31~33에서 `.notNull()` 제거, `.references(..., { onDelete: 'restrict' })` 유지 | Read `packages/db/src/schema/intermediate-inspections.ts` |
| M4 | 마이그레이션 SQL이 `ALTER TABLE "intermediate_inspections" ALTER COLUMN "calibration_id" DROP NOT NULL;` 단일 문장 (외 drift 없음) | Read `apps/backend/drizzle/0032_*.sql` |
| M5 | `createByEquipment`가 `needsIntermediateCheck !== true`면 `INTERMEDIATE_INSPECTION_NOT_REQUIRED` 400 throw | Grep service + 수동 호출 |
| M6 | `createByEquipment`가 교정 기록 0건일 때도 성공하고 `calibrationId = null`로 insert | 수동 시나리오: 교정 없는 `needsIntermediateCheck=true` 장비에 POST → 201 + DB row의 `calibration_id IS NULL` |
| M7 | `InspectionTab.tsx`가 `equipment.needsIntermediateCheck === true`일 때 `IntermediateInspectionList`를 렌더 (managementMethod 무관) | Read file + 수동 UI 확인 |
| M8 | 기존 `calibrationId`가 채워진 row 전부 보존 (`SELECT COUNT(*) FROM intermediate_inspections WHERE calibration_id IS NULL` → 마이그레이션 후에도 0) | DB 쿼리 |
| M9 | `pnpm --filter backend run tsc --noEmit` PASS | Run tsc |
| M10 | `pnpm --filter frontend run tsc --noEmit` PASS | Run tsc |

## SHOULD Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| S1 | `create()` 시그니처가 `calibrationId: string \| null` 로 변경 & DB insert도 null 허용 | Read service |
| S2 | `createByCalibration()` 경로는 변경 없음 — calibrationId 필수 & `CALIBRATION_NOT_FOUND` throw 유지 | Read service |
| S3 | export/import service, IntermediateInspectionList 컴포넌트는 touch하지 않음 | `git diff --stat` |
| S4 | 외부교정 장비 regression 없음: 기존처럼 `needsIntermediateCheck=true` + `managementMethod=external_calibration` → IntermediateInspectionList 정상 노출 | 수동 UI |
| S5 | 비대상 장비 regression 없음: `needsIntermediateCheck=false` + `managementMethod ∉ {self_inspection}` → `inspection.notApplicable` 안내 | 수동 UI |
| S6 | 자체점검 전용 regression 없음: `needsIntermediateCheck=false` + `managementMethod=self_inspection` → `SelfInspectionTab` | 수동 UI |
| S7 | 새 에러 코드 `INTERMEDIATE_INSPECTION_NOT_REQUIRED` 는 리터럴 문자열로 service에만 등장 (쉐어 enum에 추가하지 않음 — 기존 `NO_ACTIVE_CALIBRATION` 패턴과 동일) | Grep |

## Out-of-scope (명시적 금지 — gold-plating 방지)

- ❌ `equipment` 스키마에 신규 필드 추가 (e.g. `requiresIntermediateInspection`) — 기존 `needsIntermediateCheck` 재사용
- ❌ `intermediate_inspections` 테이블에 `calibration_id IS NULL` 제약 트리거/partial index 추가
- ❌ 중간점검 폼 DTO/UI 변경 (`calibrationId`는 이미 optional)
- ❌ export / import 서비스 변경
- ❌ `IntermediateInspectionList` 내부 로직 수정
- ❌ `CalibrationInfoSection` (managementMethod ↔ needsIntermediateCheck 자동 연동) 수정
- ❌ 시드 데이터 확장
- ❌ 기존 `NO_ACTIVE_CALIBRATION` 에러 제거 (현 호출 경로가 사라지므로 자연히 dead code — cleanup은 별도 티켓)

## Validation Gate (merge 직전)

```bash
# 1. 타입
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# 2. 마이그레이션 재현성 검증 (로컬 ephemeral)
pnpm --filter backend run db:reset

# 3. 컬럼/제약 최종 확인
docker compose exec postgres psql -U postgres -d equipment_management \
  -c "\d intermediate_inspections"
# → calibration_id uuid (nullable), FK restrict 유지

# 4. 수동 시나리오
#    - 교정 없는 needsIntermediateCheck=true 장비에 POST /equipment/:uuid/intermediate-inspections
#    - needsIntermediateCheck=false 장비에 POST → 400
#    - 외부교정 장비 중간점검 탭 정상 표시
```

## Risk Acknowledgement

- 단일 DB (CLAUDE.md Rule 1 준수) — dev/prod 분리 DB 언급 금지
- pre-push hook(tsc + backend/frontend test)이 최종 게이트 — `--no-verify` 금지
- main 직접 작업 원칙(solo trunk-based) — 브랜치 불필요
