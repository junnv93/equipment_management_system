# Inspection Template Backend — Phase 1B/1C/1D 통합 Plan

> **Owner**: kmjkds
> **Created**: 2026-05-01
> **Status**: Plan 단계 — 1A-a/b/c + 0A-ext 완료 후 별도 phase로 분리
> **Related plan**: `.claude/exec-plans/active/2026-05-01-inspection-template-workflow.md` (frontend 1A 완료)
> **Branch policy**: main 직접 작업 (35차 결정)
> **이연 사유**: 1B/1C/1D를 mock-only UI shell로 진행하는 것은 LIMS 표준에서 안티패턴
> (사용자 혼란 + 유지보수 부담). backend + frontend 동시 출시가 정합.

---

## 0. 배경 — 왜 별도 plan으로 분리하는가

### 0-1. 1A 완료 시점 (2026-05-01)
- ✅ 1A-a: prefill 구조 확장 + banner + template-utils SSOT (`e77254e8`)
- ✅ 1A-b: InspectionFormContext (provenance + prefill SSOT, `d95e2d47`)
- ✅ 1A-c: useMemo + shallow snapshot performance (`52625b52`)
- ✅ 0A-ext: Destructive 안전망 통일 (`c3b9644c`)

현재 prefill source = "직전 *승인된* inspection". 사용자 멘탈 모델은 충족되지만:
- 직전이 *반려*면 prefill source 부재 (사용자 인지 가능 — noSourceNotice banner 적용)
- 사용자가 표 헤더를 바꾸면 *다음 점검의 prefill 구조*도 함께 변경 (의도치 않은 전파)
- ISO/IEC 17025 §7.5의 "양식 통제" 측면에서 prefill source가 *불안정*

### 0-2. LIMS 업계 표준 (LabWare / Veeva Vault / Beamex CMX)
- **Template Snapshot DB**: prefill source를 *전용 template entity*로 분리 → 안정·결정적
- **Soft Fork**: 표 구조 변경 시 "이번만 / 다음부터도 / 취소" 명시 분기
- **Template Gallery**: 신규 장비 첫 점검 시 비슷한 장비의 검증된 template 가져오기

이 3단 패턴이 **inspection_form_templates** entity로 구현되며 **1B/1C/1D 모두 같은 백엔드** 의존. **mock-only로 진행하면 데이터 흐름 분리 불가**.

### 0-3. CCM(`CLAUDE_CODE_MISSION.md`) 방침 재해석
CCM PR-5 명시: "Phase 1B/1C/1D는 UI shell + mock data + 준비 중 배지". 시니어 관점에서는:
- mock UI shell은 사용자 혼란 (왜 동작 안 하지?)
- 유지보수: shell ↔ backend 통합 시 두 번째 작업 필요
- LIMS 표준에서 antipattern

→ **CCM 방침을 시스템 전반 관점에서 재해석**: 1B/1C/1D는 **backend 통합 완성 후 동시 출시**.

---

## 1. Phase 진행 체크리스트 (1B-backend 단일 phase)

### 1B-1. DB Schema (Drizzle)

**신규 파일**: `packages/db/src/schema/inspection-form-templates.ts`

```typescript
export const inspectionFormTemplates = pgTable(
  'inspection_form_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    equipmentId: uuid('equipment_id')
      .references(() => equipment.id, { onDelete: 'cascade' })
      .notNull(),
    inspectionType: text('inspection_type', { enum: ['intermediate', 'self'] }).notNull(),
    /** 1부터 시작 — 각 (equipmentId, inspectionType) 별 monotonic */
    version: integer('version').notNull(),
    /** value-stripped 구조 (extractStructureFromInspection 결과 형태) */
    structure: jsonb('structure').notNull(),
    /** 첫 승인 시 trigger한 inspection — audit trail */
    sourceInspectionId: uuid('source_inspection_id'),
    /** 다음 version으로 superseded — version chain */
    supersededBy: uuid('superseded_by').references(() => inspectionFormTemplates.id),
    /** 첫 생성: 시스템 (auto-create on first approve), 이후 수정: admin */
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    uniqEquipTypeVersion: unique().on(t.equipmentId, t.inspectionType, t.version),
    /** equipment + inspectionType 별 *현재* template (supersededBy IS NULL AND deletedAt IS NULL) */
    idxCurrent: index().on(t.equipmentId, t.inspectionType).where(sql`superseded_by IS NULL AND deleted_at IS NULL`),
    /** gallery query 용 — equipmentTypeId + classification 매칭 (equipment join 필요) */
    idxInspectionType: index().on(t.inspectionType, t.deletedAt),
  })
);
```

**Drizzle migration**:
- `pnpm --filter backend run db:generate` (자동)
- 검증: `pnpm --filter backend run db:migrate`

### 1B-2. Backend 모듈

**신규 디렉토리**: `apps/backend/src/modules/inspection-form-templates/`
- `inspection-form-templates.module.ts`
- `inspection-form-templates.controller.ts`
- `inspection-form-templates.service.ts`
- `dto/{create,update,gallery-query}.dto.ts`
- `inspection-form-templates.service.spec.ts`

**Endpoints**:
- `GET /api/equipment/:id/inspection-template/latest?type=intermediate|self`
  - 현재 template (supersededBy IS NULL) 조회. 부재 시 404.
- `POST /api/equipment/:id/inspection-template`
  - admin only — 명시 수정 (forkChoice='apply_forward' 시 1C에서 호출)
  - body: `{ structure, version, supersededBy, sourceInspectionId, forkChoice }`
- `GET /api/inspection-templates/gallery?modelName=&equipmentTypeId=&classification=`
  - 인증 사용자 — 1D TemplateGallery용
  - 매칭 우선순위: `modelName` → `equipmentTypeId` → `classification` fallback

**Auto-create hook** (`intermediate-inspections.service.ts` / `self-inspections.service.ts`):
- 첫 승인 시 (approve) — 해당 equipment+type template 부재 시 auto-create (시스템 권한)
- 이후 승인 시 — 구조 비교 (diffStructures pure function) → 변경 있으면 *forkChoice 별 분기*:
  - 1C SoftForkDialog가 frontend에서 결정 → backend에 forkChoice 전달
  - `apply_forward`: version+1 + supersededBy 체이닝
  - `this_only`: template 그대로, inspection만 다른 구조로 저장 (template ↔ inspection 분리)

### 1B-3. Backfill Script

**신규**: `apps/backend/scripts/backfill-inspection-templates.ts`
- 모든 equipment 순회
- `intermediate / self` 별로 가장 최근 *approved* inspection을 source로 추출
- `extractStructureFromInspection` (frontend SSOT — 백엔드로 이전 또는 packages/shared로 승격)
- idempotent: 이미 template 존재하면 skip
- dry-run 모드: `--dry-run` 플래그
- transaction wrap (실패 시 rollback)

**Drizzle SSOT 이전**: `packages/inspection-utils/template-utils.ts` (frontend + backend 공용)
- 또는 일단 frontend 함수를 backend로 import (`@/lib/inspection/template-utils`) — monorepo path 호환 필요
- 가장 깔끔: `packages/shared-constants` 또는 `packages/schemas`에 추가 (이미 frontend/backend 공용)

### 1B-4. Cache Event

**신규 event**: `INSPECTION_TEMPLATE_UPDATED`
- 발행: `inspection-form-templates.service.ts` (auto-create / 명시 수정 시)
- `emitAsync` 패턴 (verify-cache-events 표준)
- listener: 같은 equipmentId + type의 InspectionFormDialog query invalidate

**Listener 추가 위치**: `apps/backend/src/common/cache/inspection-cache.listener.ts`

### 1B-5. CAS (version chain)

- `version` 컬럼 + `supersededBy` chain
- 동시 수정 시 `version+1` 충돌 → unique constraint 위반 → 409 반환
- 호출자(frontend SoftForkDialog)가 재시도 또는 사용자에게 안내

### 1B-6. 권한

- **template auto-create**: 시스템 (첫 승인 trigger 내부 호출)
- **명시 수정** (POST /api/equipment/:id/inspection-template): admin only (Permission.MANAGE_INSPECTION_TEMPLATE 신설)
- **gallery 조회** (GET /api/inspection-templates/gallery): 모든 인증 사용자
- `packages/shared-constants/permissions.ts` 신규 Permission 추가

### 1B-7. Audit Log

- `audit_logs` 테이블 활용 (기존)
- 액션: `inspection_template.create`, `inspection_template.update`, `inspection_template.version_up`
- entity_type: `inspection_form_template`
- entity_id: template UUID
- diff: structure 변경 (added/removed/type-changed sections)

### 1B-8. Frontend 1B (DialogHeader version badge)

- prefill source가 template DB로 이동 (현재 latestInspection → template.structure)
- DialogHeader에 `INSPECTION_TEMPLATE_VERSION_BADGE` 적용:
  - `📋 v{version} · {createdAt} · {createdBy 이름}`
  - 사용자가 표 구조 변경 시 `(분기 중)` suffix
- Hook: `apps/frontend/hooks/use-inspection-template.ts`
  - `useLatestTemplate(equipmentId, type)` — current template fetch
  - `useUpsertTemplate()` — POST 호출
- Context 활용: 1A-b의 InspectionFormContext에 `template: { version, supersededBy, ... }` 추가

### 1B-9. Frontend 1C (SoftForkDialog 통합)

- 표 구조 변경 감지: 제출 직전 `currentStructure ≠ templateStructure` (diffStructures)
- SoftForkDialog 노출: 3-radio (이번만 / 다음부터도 / 취소)
- 사용자 선택 시:
  - `apply_forward` → POST template (version+1) + 제출
  - `this_only` → 제출만 (template 그대로)
  - `cancel` → 폼 편집 복귀
- INSPECTION_TEMPLATE_DIFF 토큰 적용 (added/removed/type-changed 색)
- `forkChoice` 파라미터를 inspection submit DTO에 추가

### 1B-10. Frontend 1D (TemplateGallery 통합)

- 자동 노출 조건: 첫 점검 + template 부재 + gallery 결과 ≥1
- API: `GET /api/inspection-templates/gallery?modelName=...`
- 카드 grid (4-column) — 첫 카드 "빈 양식으로 시작", 나머지 매칭 template
- "다시 묻지 않기" — localStorage `inspection-gallery-skip-{equipmentTypeId}`
- 선택 시 → 해당 template structure로 prefill (extractStructureFromInspection 우회)
- INSPECTION_TEMPLATE_GALLERY_CARD 토큰 적용

### 1B-11. i18n

- `intermediateInspection.template.{versionBadge, divergenceSuffix, ...}`
- `intermediateInspection.softFork.{title, optionThisOnly, optionApplyForward, optionCancel, impactCaption, ...}`
- `intermediateInspection.gallery.{title, matchingReason, usesCount, lastUsed, blankStart, neverAskAgain, skip, ...}`
- selfInspection 동일 키 위계 (UL-QP-18-05도 template 적용)

### 1B-12. 테스트

- **backend unit**:
  - `inspection-form-templates.service`: auto-create on first approve, version+1 on structure change, 권한 가드
  - `diffStructures` (pure function): added/removed/type-changed 케이스
  - `extractStructureFromInspection` (이미 frontend, packages 이전 후 backend에서 사용)
- **backend integration**:
  - `intermediate-inspections.e2e-spec.ts` 확장: approve flow → template 자동 생성 검증
  - `inspection-form-templates.e2e-spec.ts` 신규: gallery query, 권한, CAS 409
- **backfill script**:
  - dry-run 모드 검증
  - idempotent 검증 (재실행 시 변경 없음)
- **frontend E2E (Playwright)**:
  - 첫 점검 + template 부재 → gallery 자동 노출 → 카드 선택 → prefill
  - 두 번째 점검 → template prefill (instead of latest inspection)
  - 표 구조 변경 → SoftForkDialog 노출 → 3옵션 동작
  - 직전 점검 반려 + template 존재 → template prefill (regression — 직전 inspection 의존 안 함)

### 1B-13. 검증 명령

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run db:generate
pnpm --filter backend run db:migrate
pnpm --filter backend run test:e2e -- inspection-form-templates
pnpm --filter backend exec ts-node scripts/backfill-inspection-templates.ts --dry-run
pnpm --filter frontend run test:e2e -- template
```

---

## 2. Cross-cutting 결정 (모든 sub-step 공통)

| 영역 | 결정 |
|---|---|
| 권한 | template auto-create는 시스템(서비스 내부), 명시 수정은 `Permission.MANAGE_INSPECTION_TEMPLATE` |
| 캐시 | `INSPECTION_TEMPLATE_UPDATED` emitAsync (verify-cache-events 패턴) |
| CAS | template version + supersededBy chain — 충돌 시 409 |
| SSOT | `extractStructureFromInspection` / `diffStructures` 를 packages/shared로 승격 |
| i18n | ko/en parity 강제 (Plan §1B-11) |
| A11Y | SoftForkDialog `<RadioGroup role="radiogroup" aria-labelledby>`, focus trap |
| 신규 의존성 | 0 (TipTap·Univer 후순위 그대로) |
| Audit | template create/update/version_up 모두 audit_logs 기록 |
| 워크플로우 | 1B → 1C → 1D 순서 권장 (1C/1D는 1B의 template entity 의존) |
| 성능 | template fetch는 React Query 캐싱 + WebSocket invalidation (cache event) |
| 테스트 매트릭스 | backend unit + e2e + frontend e2e + backfill dry-run |
| 출시 전략 | 1B/1C/1D 동시 출시 (mock-only 회피) |

---

## 3. 트레이드오프 / 위험

- **Backfill 실패 시 데이터 불일치**: idempotent + dry-run + transaction wrap. 실패 시 manual rollback 가이드.
- **forkChoice 'this_only' 시점 데이터 분기**: inspection의 structure가 template와 다른 케이스 발생. inspection을 source-of-truth로 보존, template은 그대로.
- **gallery 매칭 false positive**: modelName이 generic ("멀티미터 X") 시 부정확한 매칭. UI에 "매칭 이유 chip" 명시로 사용자 판단 위임.
- **CAS 409 유저 경험**: SoftForkDialog 재시도 흐름 + i18n 카피 ("다른 사용자가 먼저 수정했습니다 — 새로고침 후 다시 시도").
- **Cache event 중복 발행**: emitAsync await + listener idempotency 보장.
- **Permission.MANAGE_INSPECTION_TEMPLATE 부재 시 auto-create**: service 내부 호출은 권한 우회 (시스템). 외부 호출은 명시 권한 검사.

---

## 4. 시간 견적 (~12-16h)

- 1B-1 DB schema + migration: ~1h
- 1B-2 Backend 모듈 + endpoints: ~3h
- 1B-3 Backfill script + SSOT 이전: ~2h
- 1B-4 Cache event: ~1h
- 1B-5/6/7 CAS + 권한 + Audit: ~1.5h
- 1B-8 Frontend 1B (version badge + hook): ~1.5h
- 1B-9 Frontend 1C (SoftForkDialog 통합): ~2h
- 1B-10 Frontend 1D (TemplateGallery 통합): ~2h
- 1B-11 i18n: ~0.5h
- 1B-12 테스트: ~2h
- 검증 + 회귀: ~1h

**총: ~17h** (단일 세션 X — 별도 세션 권장).

---

## 5. 진행 순서 권고

**별도 세션** 시작 시:
1. 본 plan을 read + sanity check
2. 0번 단계: 필요 시 plan 미세조정 (CCM/HANDOVER 충돌 검토)
3. 1B-1 DB schema부터 단계별 구현
4. 각 sub-step commit (1B-1/2/3/.../10)
5. 모든 sub-step 완료 후 통합 e2e + backfill dry-run
6. 사용자 dev server 검증 후 main 직접 commit

---

## 6. 충돌 시 진실의 원천

1. **코드 실측** (현재 repo 실제 파일)
2. **본 plan 파일**
3. `.claude/exec-plans/active/2026-05-01-inspection-template-workflow.md` (frontend 1A 완료 plan)
4. `/mnt/c/Users/kmjkd/Downloads/_____.html` (디자인리뷰 standalone, b6/b14/b15 reference)
5. CCM `CLAUDE_CODE_MISSION.md`

상위 source가 하위와 다르면 상위를 따르고, 메모리·exec-plan을 업데이트한다.

---

## 7. 1A 완료 commit 참조 (의존)

본 plan은 다음 commit 위에서 시작:
- `e77254e8` 1A-a prefill 구조 확장 + banner + template-utils SSOT
- `d95e2d47` 1A-b InspectionFormContext (provenance + prefill SSOT)
- `52625b52` 1A-c useMemo + shallow snapshot performance
- `c3b9644c` 0A-ext destructive 안전망 통일

`extractStructureFromInspection` 함수는 `apps/frontend/lib/inspection/template-utils.ts`에 이미 존재 — backend로 이전 시 *동일 로직* 재사용.
