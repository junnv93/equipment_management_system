# Exec Plan: intermediate-inspection-nonCalib

**Date**: 2026-04-19
**Slug**: `intermediate-inspection-nonCalib`
**Mode**: 2 (architecture change across DB → service → frontend)
**Status**: active

## 0. Problem & Goal

### Problem
`intermediate_inspections.calibration_id`가 NOT NULL + `restrict` FK로 묶여 있어 **교정 기록이 있는 장비만** 중간점검이 가능하다.
하지만 도메인 확인 결과 **교정 비대상(비대상/관리 방법과 무관) 장비도 주기적으로 중간점검이 필요**하다 (예: 자체점검 장비 중 중간점검 대상인 경우, 또는 교정 계약이 끝났지만 점검 이력을 남겨야 하는 장비).

### Goal
`equipment.needsIntermediateCheck = true` 인 장비라면, 교정 기록 유무와 무관하게 (그리고 `managementMethod`와 무관하게) 중간점검을 생성/조회/승인/출력할 수 있도록 한다.

**비목표 (Non-goals)**:
- 기존 데이터 마이그레이션 (모든 기존 row는 `calibrationId`가 차 있음 — untouched)
- export/download 경로 수정 (calibrationId는 ExportData에 포함되지 않음 — 0 변경)
- UI 워크플로우 자체 재설계 (폼/승인 흐름은 그대로)
- 새로운 장비 필드 추가 — 기존 `needsIntermediateCheck` 재사용

---

## 1. Pre-read Verification (완료)

### 1.1 Schema field name — 중요 정정

요청서(prompt)는 `equipment.requiresIntermediateInspection` 필드가 존재한다고 명시했으나, **실제 스키마에는 해당 이름의 컬럼이 없다**. 현재 동일 의미로 존재하는 컬럼은:

```ts
// packages/db/src/schema/equipment.ts L89
needsIntermediateCheck: boolean('needs_intermediate_check').default(false),
```

- Zod: `packages/schemas/src/equipment.ts:71` — `needsIntermediateCheck: z.boolean().optional()`
- 프론트엔드 폼: `CalibrationInfoSection.tsx` L71/78/101 — 외부교정/자체점검 선택 시 자동 세팅
- Equipment `EquipmentResponse` 타입에 이미 포함됨 (SSOT 경유)

**결정**: 새 필드를 만들지 않고 **기존 `needsIntermediateCheck` 필드를 gate로 재사용**한다 (SSOT 준수, DB 마이그레이션 최소화).
본 플랜 내에서 "requiresIntermediateInspection" 언급은 모두 `needsIntermediateCheck`로 치환된다.

### 1.2 기타 확인 사항

| 항목 | 결과 |
|---|---|
| `intermediate_inspections.calibration_id` NOT NULL + FK restrict | ✅ L31~33 |
| `createByEquipment` 내부 `NO_ACTIVE_CALIBRATION` throw | ✅ L224~229 |
| `InspectionTab.tsx` — `managementMethod === 'external_calibration'` gate | ✅ L22 |
| `create-inspection.dto.ts` — `calibrationId`는 이미 optional | ✅ L30 |
| export service — `calibrationId` 미사용 | ✅ 변경 불필요 |
| 기존 모든 row는 `calibrationId` 채워져 있음 | ✅ seed & 운영 레코드 모두 기존 경로 경유 |
| 마이그레이션 파일명 규칙 | `apps/backend/drizzle/{NNNN}_{lower_snake}.sql` (최신 = 0031) |

---

## 2. Surgical Change Scope

### 2.1 변경 파일 (6)

| # | Path | 변경 성격 |
|---|------|-----------|
| F1 | `packages/db/src/schema/intermediate-inspections.ts` | `calibrationId` NOT NULL 제거 |
| F2 | `apps/backend/drizzle/0032_intermediate_inspection_calibration_nullable.sql` | **신규** (drizzle-kit generate 산출물) |
| F3 | `apps/backend/drizzle/meta/_journal.json` & `meta/0032_snapshot.json` | drizzle-kit 자동 갱신 |
| F4 | `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` | `createByEquipment`에서 gate 변경 + null calibrationId 허용 |
| F5 | `apps/frontend/components/equipment/InspectionTab.tsx` | `needsIntermediateCheck` 기반 분기 추가 |

**변경하지 않는 파일** (스코프 외):
- `create-inspection.dto.ts` — 이미 `calibrationId` optional
- `IntermediateInspectionList.tsx` — 이미 `equipment` prop만 사용, 교정 의존 없음
- export service, audit log, 권한, 캐시 키 — 기존 흐름 유지
- 시드 데이터 — 기존 row는 모두 calibrationId 있으므로 untouched

### 2.2 변경하지 않는 것 (반 gold-plating 체크)
- `managementMethod` 관련 로직 (CalibrationInfoSection의 자동 플래그 연동) — 변경 금지
- 중간점검 폼(`InspectionFormDialog`)의 필드 — 변경 금지
- CAS/version/캐시 무효화 구조 — 변경 금지

---

## 3. Phase-Based Execution

### Phase A — Backend DB Schema & Migration

#### A1. `packages/db/src/schema/intermediate-inspections.ts` 수정
```ts
// BEFORE (L31~33)
calibrationId: uuid('calibration_id')
  .notNull()
  .references(() => calibrations.id, { onDelete: 'restrict' }),

// AFTER
calibrationId: uuid('calibration_id')
  .references(() => calibrations.id, { onDelete: 'restrict' }),
```
- FK 방향/정책(restrict)은 유지 — null인 row는 FK 검사 대상 제외 (PostgreSQL 기본)
- relations의 `one(calibrations, …)`은 Drizzle이 nullable 자동 처리 — 변경 불필요
- 인덱스 `intermediate_inspections_calibration_id_idx`는 유지 (null 다수 시 partial index 고려했으나 현 볼륨으로 불필요)

#### A2. 마이그레이션 생성
```bash
pnpm --filter backend run db:generate
# → apps/backend/drizzle/0032_<random_slug>.sql 생성 예상
```
**수동 검토 포인트**:
- 생성된 SQL이 `ALTER TABLE "intermediate_inspections" ALTER COLUMN "calibration_id" DROP NOT NULL;` 단일 문장인지 확인
- 다른 스키마 drift가 함께 포함되면 플랜 중단 & 리뷰
- 파일명이 의미 없는 slug면 `0032_intermediate_inspection_calibration_nullable.sql`로 rename
  - ⚠️ rename 시 `meta/_journal.json`의 `tag` 필드도 동일하게 수정

#### A3. 마이그레이션 적용 검증
```bash
pnpm --filter backend run db:migrate   # dev DB에 적용
# psql로 확인
docker compose exec postgres psql -U postgres -d equipment_management \
  -c "\d intermediate_inspections" | grep calibration_id
# → "calibration_id | uuid |" (no "not null")
```

#### A4. 기존 데이터 보존 확인
```bash
docker compose exec postgres psql -U postgres -d equipment_management \
  -c "SELECT COUNT(*) FROM intermediate_inspections WHERE calibration_id IS NULL;"
# → 0 (모든 기존 row는 값이 있어야 함 — 마이그레이션이 데이터를 건드리지 않음을 증명)
```

---

### Phase B — Backend Service Gate 변경

#### B1. `intermediate-inspections.service.ts` — `createByEquipment` 개편
기존 로직:
```ts
// 승인된 교정 우선 조회 → 없으면 최신 fallback → 그래도 없으면 NO_ACTIVE_CALIBRATION
```

신규 로직:
```ts
async createByEquipment(
  equipmentId: string,
  dto: Omit<CreateInspectionInput, 'calibrationId'>,
  createdBy: string,
): Promise<IntermediateInspection> {
  // 1. 장비 존재 + needsIntermediateCheck 확인 (gate)
  const [eq] = await this.db
    .select({ id: equipment.id, needsIntermediateCheck: equipment.needsIntermediateCheck })
    .from(equipment)
    .where(eq(equipment.id, equipmentId))
    .limit(1);

  if (!eq) {
    throw new NotFoundException({ code: 'EQUIPMENT_NOT_FOUND', ... });
  }
  if (!eq.needsIntermediateCheck) {
    throw new BadRequestException({
      code: 'INTERMEDIATE_INSPECTION_NOT_REQUIRED',
      message: `Equipment ${equipmentId} is not flagged for intermediate inspection.`,
    });
  }

  // 2. 교정 기록 best-effort 조회 (approved 우선 → 최신 fallback → 없으면 null)
  let [calibration] = await this.db
    .select({ id: calibrations.id })
    .from(calibrations)
    .where(and(eq(calibrations.equipmentId, equipmentId), eq(calibrations.approvalStatus, 'approved')))
    .orderBy(desc(calibrations.createdAt))
    .limit(1);

  if (!calibration) {
    [calibration] = await this.db
      .select({ id: calibrations.id })
      .from(calibrations)
      .where(eq(calibrations.equipmentId, equipmentId))
      .orderBy(desc(calibrations.createdAt))
      .limit(1);
  }

  // 3. 생성 — calibrationId는 nullable
  return this.create({ ...dto, calibrationId: calibration?.id ?? null }, equipmentId, createdBy);
}
```

#### B2. `create()` 시그니처 & 로직 수정
```ts
// BEFORE:
async create(
  dto: CreateInspectionInput & { calibrationId: string },  // ← 필수
  equipmentId: string,
  createdBy: string,
)

// AFTER:
async create(
  dto: CreateInspectionInput & { calibrationId: string | null },
  equipmentId: string,
  createdBy: string,
)
```
- 서두의 `calibrationId 존재 확인` 블록을 **조건부**로: `if (dto.calibrationId) { … existing lookup … }` — null이면 skip
- `tx.insert(intermediateInspections).values({ calibrationId: dto.calibrationId, … })` — Drizzle이 null 허용 (scheme nullable 덕분)
- `createByCalibration()` 경로는 기존대로 (명시적 calibrationId 지정 → 반드시 존재해야 함)

#### B3. 에러 코드 등록 (필요 시)
- `INTERMEDIATE_INSPECTION_NOT_REQUIRED` — 신규. 서비스 내부 문자열 리터럴로 충분 (기존 `NO_ACTIVE_CALIBRATION`, `CALIBRATION_NOT_FOUND`도 리터럴)
- Audit log entityType(`intermediate_inspection`)는 변경 없음

#### B4. 캐시 키 / CAS
- `CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` prefix 유지 — calibration이 있든 없든 동일 (캐시 그룹 일관성)
- `calibrationId`로 조회하는 `findByCalibration`은 그대로 — 교정 없는 inspection은 이 경로로 보이지 않음 (의도된 동작)
- CAS version / `onVersionConflict` / `updateWithVersion` 경로 모두 변경 불필요

---

### Phase C — Frontend Gate 변경

#### C1. `apps/frontend/components/equipment/InspectionTab.tsx` 수정
```tsx
// BEFORE
if (equipment.managementMethod === 'external_calibration') {
  return <IntermediateInspectionList equipment={equipment} />;
}
if (equipment.managementMethod === 'self_inspection') {
  return <SelfInspectionTab equipment={equipment} />;
}

// AFTER — 우선순위: needsIntermediateCheck → self_inspection → not_applicable
if (equipment.needsIntermediateCheck) {
  return <IntermediateInspectionList equipment={equipment} />;
}
if (equipment.managementMethod === 'self_inspection') {
  return <SelfInspectionTab equipment={equipment} />;
}
// 이하 not_applicable 안내는 그대로
```
- `Equipment` 타입에 이미 `needsIntermediateCheck: boolean | undefined` 포함됨 (SchemaEquipmentResponse 경유) — 추가 타입 작업 불필요
- `IntermediateInspectionList`는 `equipment` prop만 받고 내부적으로 교정 기록 존재 여부에 의존하지 않음 — UI 경고/empty state는 기존 패턴 유지

#### C2. 비대상 edge 케이스
- `needsIntermediateCheck === true && managementMethod === 'self_inspection'` — 현재는 발생하지 않지만, 스펙상 허용됨. 이 경우 IntermediateInspectionList가 우선 (도메인 결정 — 중간점검 먼저).
  - 추후 양쪽 모두 필요한 장비가 나오면 탭 sub-nav로 확장. 본 스코프 외.

---

### Phase D — 검증 (Validation Gate)

#### D1. 타입 검사
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
```
- `NewIntermediateInspection` 추론 타입이 `calibrationId?: string | null`로 변경되므로 호출부 전체 검사 (`create()` / `createByEquipment` / `createByCalibration` / export service)

#### D2. 서비스 단위 시나리오 (수동/자동)
| 시나리오 | 기대 결과 |
|---|---|
| `needsIntermediateCheck=true` + calibration approved | inspection 생성, calibrationId=approved cal.id |
| `needsIntermediateCheck=true` + calibration pending only | inspection 생성, calibrationId=latest cal.id |
| `needsIntermediateCheck=true` + calibration 0건 | inspection 생성, calibrationId=**null** |
| `needsIntermediateCheck=false` | 400 `INTERMEDIATE_INSPECTION_NOT_REQUIRED` |
| equipment 없음 | 404 `EQUIPMENT_NOT_FOUND` |
| `createByCalibration(calId)` — calId 없음 | 404 `CALIBRATION_NOT_FOUND` (기존 동작 유지) |

#### D3. 프론트 수동 확인
- 외부교정 장비 → IntermediateInspectionList 표시 (regression)
- 자체점검 장비 중 `needsIntermediateCheck=true` → IntermediateInspectionList 표시 (신규)
- 자체점검 장비 중 `needsIntermediateCheck=false` → SelfInspectionTab 표시 (regression)
- 비대상 장비 → `inspection.notApplicable` 안내 (regression)

#### D4. 시드 검증
```bash
pnpm --filter backend run db:reset
```
- `verification.ts`의 `Intermediate Inspections count`가 SEED_DATA.length와 일치 (seed에 새 row 없으니 기존과 동일)
- 파손 없음 확인

---

## 4. Rollback Plan

DB 레벨:
```sql
ALTER TABLE "intermediate_inspections"
  ALTER COLUMN "calibration_id" SET NOT NULL;
```
단, `calibration_id IS NULL`인 row가 있으면 SET NOT NULL이 실패하므로 롤백 전에 해당 row 처리 필요(UPDATE로 placeholder 지정 or DELETE).
→ 운영 배포 전 rollback 시나리오는 "마이그레이션 파일 revert + db:reset"(dev)로 충분.

코드 레벨: git revert (5 파일 단위 revert 가능 — 독립성 높음).

---

## 5. Success Criteria (Plan → Contract 링크)

Contract MUST 항목 (M1~M7) 모두 PASS + SHOULD (S1~S3) 체크 시 완료.
→ `.claude/contracts/intermediate-inspection-nonCalib.md` 참조.

---

## 6. Risks & Trade-offs

| Risk | Mitigation |
|---|---|
| `createByCalibration` 경로를 쓰는 곳이 `calibrationId` 필수 가정 | 그대로 유지 — 해당 경로는 calibrationId가 URL 파라미터이므로 null 불가 |
| 프론트의 IntermediateInspectionList가 내부적으로 calibrations API 호출 | 확인 완료 — `calibrationApi` 임포트는 hook용. 교정 미존재가 UI 파괴 요인인지 별도 검증 필요 시 D3에서 확인 |
| SSOT drift: `needsIntermediateCheck`라는 기존 이름 vs prompt의 `requiresIntermediateInspection` | Section 1.1에 정정 기록. 새 필드 추가 금지(스코프 가드) |
| partial index 최적화 미적용 (null 다수 시 인덱스 비효율) | 현 데이터 볼륨에서 무의미. 추후 계측 기반 최적화는 별도 작업 |

---

## 7. Out-of-scope (명시적)

- export/import service 변경 (calibrationId 미사용)
- IntermediateInspectionList 내부 레이아웃 수정
- 중간점검 생성 UI에서 "교정 없음" 고지 문구 추가 — 추후 UX 요청 시 별도 티켓
- seed 데이터 확장 (교정 없는 intermediate inspection 예시 추가) — 별도 티켓
