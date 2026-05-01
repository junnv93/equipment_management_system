# Inspection Template Workflow — Phase 1A~1D

> **Owner**: kmjkds
> **Created**: 2026-05-01
> **Status**: Phase 0 완료(디자인 리뷰 의뢰), 디자인 리뷰 결과 도착 → 새 세션에서 매핑·구현 시작
> **Branch policy**: main 직접 작업 (35차 결정, `feedback_main_only_no_branches.md`)
> **Related memory**:
> - `project_inspection_prefill_gap_20260501.md`
> - `project_inspection_template_workflow_plan_20260501.md`
> - `project_inspection_industry_standards_20260501.md`
> - `reference_inspection_design_review_20260501.md`

---

## 0. 배경 — Why this plan exists

UL-QP-18-03 (중간점검) 작성 시, 같은 장비의 두 번째 점검부터 표 구조가 자동으로 재사용되어야 시험원 부담이 사라진다. 사용자 멘탈 모델은 이미 *그렇게 동작한다고 인식*하지만 실측 결과 80% 미구현 갭 존재.

**실측 갭** (`apps/frontend/components/inspections/InspectionFormDialog.tsx:201-230`):
- ✅ `items[].checkItem`, `checkCriteria`만 복사
- ✅ 각 item당 `title` 결과 섹션 자동 생성
- ❌ `resultSections[].richTableData/tableData` (**표 구조 자체**) 미복사
- ❌ `resultSections[].documentId/imageWidthCm/Height` (사진) 미복사
- ❌ `resultSections[].content` (텍스트) 미복사

**업계 표준 합류 방향**: LIMS의 *Template Snapshot + Soft Fork + Gallery* 3단 패턴 (LabWare/Veeva Vault/Beamex CMX). TipTap·Univer 같은 라이브러리 교체는 Phase 2로 후순위.

---

## 1. Phase 진행 체크리스트

### Phase 0 — 디자인 리뷰 의뢰 (완료)
- [x] 코드 스냅샷 53+ 파일 → `/mnt/c/Users/kmjkd/Downloads/중간점검,자체 점검 리뷰/`
- [x] REVIEW_PROMPT.md 625 lines (§1-6 컨텍스트, §K/L/M/N 평가, Section 5 wireframe 5종 산출물 명시)
- [x] 디자인 리뷰 결과 도착 (사용자 보고)
- [x] 디자인 리뷰 결과(`/mnt/c/Users/kmjkd/Downloads/_____.html` standalone, 1.4MB) 분석
- [x] 미세조정 plan: `/home/kmjkds/.claude/plans/ticklish-forging-rainbow.md` (rev 2)
  - 7-phase 매핑 (0A/0B/0C/1A/1B/1C/1D), 토큰 15종, wireframe 7종 채택

### Phase 0/1 진행 상태 (2026-05-01 세션)

✅ **완료된 commit 11개** (main):
- `628a04c5` Phase 0A — 데이터 안전성 (paste mode + outside-click + undo + 48px hit area)
- `207ca35b` Phase 0B-1 — STATUS_BADGE SSOT + focus ring + chip 균등화
- `d67e8274` Phase 0B-2 — KIND_BADGE + DialogHeader status + 반려 alert
- `935f6c93` Phase 0C — segmented control + 정합성 alert + preset prominent
- `e77254e8` Phase 1A-a — prefill 구조 확장 + banner + template-utils SSOT
- `d95e2d47` Phase 1A-b — InspectionFormContext (Context + provenance tracker, architecture)
- `c3b9644c` Phase 0A-ext — Destructive 안전망 통일 (cancel/X/Esc 가드 — useFormDialogClose hook)
- `52625b52` Phase 1A-c — Performance memoization (useMemo + shallow snapshot)
- `9b4040b3` Phase 1B-backend plan (별도 plan 파일 작성, mock-only 회피)
- `2bf87039` Cache event registry + analytics SSOT (1B-backend prep)

✅ **시니어 architecture 결정** (단편적 진행 X, 시스템 전반):
- **InspectionFormContext** (`lib/inspection/form-context.tsx`) — 분산 state SSOT 통합
- **useFormDialogClose** (`hooks/use-form-dialog-close.ts`) — destructive 안전망 SSOT
- **template-utils** (`lib/inspection/template-utils.ts`) — pure function SSOT (frontend/backend 공용)
- **analytics events** (`lib/analytics/events.ts`) — inspection.* 이벤트 6종 SSOT
- **cache event registry** (`apps/backend/src/common/cache/`) — 1B-backend 사전 등록
- **mock-only UI shell 안티패턴 회피** — 1B/1C/1D는 backend 통합 출시

### Phase 1A — prefill 즉시 확장 (✅ 완료, commits e77254e8 + d95e2d47 + 52625b52)

**목표**: `InspectionFormDialog.tsx`의 prefill effect가 표/사진/텍스트 구조까지 복사하도록 확장. 값은 비움.

**변경 파일** (✅ 완료):
- [x] `apps/frontend/components/inspections/InspectionFormDialog.tsx:201-230`
  - prefill effect 매핑 로직 확장
  - `resultSections` 별도 매핑: `richTableData` headers 그대로 + rows 셀 value 빈 문자열, image 셀은 text 빈셀로 변환
  - photo: `imageWidthCm/Height` 복사, `documentId` 비움
  - text: `title` 복사, `content` 비움
- [x] 변환 로직 SSOT util 분리: `apps/frontend/lib/inspection/template-utils.ts` (신규)
  - `extractStructureFromInspection(inspection)` — 값 비운 구조 추출
  - 향후 Phase 1B에서 backend도 같은 로직 사용 가능하도록 pure function
- [ ] 안내 banner 추가 — "이전 점검에서 N개 표·M개 사진 구조를 가져왔습니다" inline notice
  - 토큰 신설: `INSPECTION_PREFILL_NOTICE` in `lib/design-tokens/components/inspection.ts`
  - `role="status"` + `aria-live="polite"`
- [ ] 셀 단위 image→text 변환 시 마이크로 hint (작은 카메라 아이콘 + tooltip)
- [ ] i18n 키 ko/en 추가:
  - `intermediateInspection.prefill.structureLoaded`
  - `intermediateInspection.prefill.structureLoadedDescription`
  - `intermediateInspection.prefill.imageCellConverted`
- [ ] 토글 OFF 시 destructive 경고 — 입력 중 데이터 삭제 confirmation toast 추가
  - 현재 `handleTogglePreviousInspection:237-245` 즉시 초기화 — confirmation 부재
- [ ] 테스트:
  - [ ] E2E: 두 번째 점검 진입 시 표 구조 보존, 셀 빈값
  - [ ] E2E: 토글 OFF 시 confirmation 동작
  - [ ] 기존 wf-19 시리즈 회귀

**검증 명령**:
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run test:e2e -- wf-19
```

### Phase 1B — Template Snapshot DB (P1, full-stack, ~4-6h)

**목표**: prefill source를 *latest inspection*에서 *전용 template DB*로 이동. 안정·결정적 prefill, ISO 17025 §7.5 양식 통제 audit 자연 부합.

**변경 파일**:
- [ ] `packages/db/src/schema/inspection-form-templates.ts` (신규)
  ```typescript
  export const inspectionFormTemplates = pgTable('inspection_form_templates', {
    id: uuid('id').primaryKey().defaultRandom(),
    equipmentId: uuid('equipment_id').references(() => equipment.id).notNull(),
    version: integer('version').notNull(),
    structure: jsonb('structure').notNull(),  // value-stripped result sections
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    supersededBy: uuid('superseded_by').references(() => inspectionFormTemplates.id),
    deletedAt: timestamp('deleted_at'),
  }, (t) => ({
    uniqEquipVersion: unique().on(t.equipmentId, t.version),
    idxCurrent: index().on(t.equipmentId).where(sql`superseded_by IS NULL AND deleted_at IS NULL`),
  }));
  ```
- [ ] Drizzle migration: `pnpm --filter backend run db:generate`
- [ ] `apps/backend/src/modules/inspection-form-templates/` (신규 모듈)
  - controller / service / dto / module
  - `GET /api/equipment/:id/inspection-template/latest`
  - `POST /api/equipment/:id/inspection-template` (admin only — auto-create는 service 내부)
- [ ] `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` approve hook
  - 첫 승인 시 template auto-create
  - 승인 시 구조 비교 → 변경 있으면 version+1 + supersededBy 체이닝 (Phase 1C에서 forkChoice로 분기)
- [ ] `apps/frontend/hooks/use-inspection-template.ts` (신규)
- [ ] `apps/frontend/components/inspections/InspectionFormDialog.tsx`
  - prefill source 변경: template 우선 → fallback latest inspection
- [ ] Backfill script: `apps/backend/scripts/backfill-inspection-templates.ts`
  - 모든 equipment에 대해 latest approved inspection을 template으로 추출 (idempotent)
- [ ] Cache event: `INSPECTION_TEMPLATE_UPDATED` emitAsync
  - listener는 같은 equipmentId의 InspectionFormDialog query invalidate
- [ ] CAS: template에 version 컬럼 (이미 schema에 있음, supersededBy로 체인)
- [ ] 권한:
  - template auto-create: 시스템 (첫 승인 trigger)
  - 명시 수정: admin only (Phase 1C는 forkChoice로 우회)
  - gallery 조회: 모든 인증 사용자
- [ ] 토큰 신설: `INSPECTION_TEMPLATE_VERSION_BADGE` (헤더 `📋 v3 · 2025-12-15 · 김OO`)
- [ ] i18n: `intermediateInspection.template.versionBadge` 등 ko/en
- [ ] 테스트:
  - [ ] backend unit: template auto-create on first approve, version+1 on structure change
  - [ ] E2E: 두 번째 점검이 template에서 prefill, latest inspection이 반려된 경우에도 정상
  - [ ] backfill script test (idempotent 검증)

**검증 명령**:
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run db:generate
pnpm --filter backend run db:migrate
pnpm --filter frontend run test:e2e
```

### Phase 1C — SoftForkDialog (P1, ~2-3h)

**목표**: 작성자가 표 구조 수정 시 "이번만 / 다음부터도(template v+1) / 취소" 분기.

**변경 파일**:
- [ ] `apps/frontend/components/inspections/SoftForkDialog.tsx` (신규)
  - 3-옵션 RadioGroup, default = "이번만" (보수적)
  - 변경 사항 diff visualization (추가 컬럼 green / 제거 red / 셀 타입 변경 warning)
- [ ] `apps/frontend/lib/inspection/template-utils.ts`에 `diffStructures(prev, next)` 추가
- [ ] 감지 로직: 제출 직전 `currentStructure ≠ templateStructure` deep-equal
- [ ] Backend POST template 시 `forkChoice: 'this_only' | 'apply_forward'` 파라미터
- [ ] 토큰 신설: `INSPECTION_TEMPLATE_DIFF` (diff highlight)
- [ ] A11Y: `<RadioGroup role="radiogroup" aria-labelledby>`, focus trap, esc는 cancel
- [ ] i18n: `intermediateInspection.softFork.*` ko/en, 라벨 길이 균형 검증
- [ ] 테스트:
  - [ ] E2E: 구조 미변경 시 다이얼로그 미노출
  - [ ] E2E: 3옵션 각각 동작 검증
  - [ ] A11Y: keyboard navigation + screen reader announce

### Phase 1D — TemplateGallery (P2, ~2-3h)

**목표**: 신규 장비 첫 점검 시 같은 모델·분류 장비의 template 가져오기.

**변경 파일**:
- [ ] Backend: `GET /api/inspection-templates/gallery?modelName=&classification=`
  - 정렬: 사용 빈도 desc, 마지막 사용일 desc
- [ ] `apps/frontend/components/inspections/TemplateGallery.tsx` (신규)
  - 카드 grid: 장비 모델 · 매칭 이유 · 사용 N건 · 마지막 사용일 · 미리보기 thumbnail
  - "빈 양식으로 시작" 카드 + "다시 묻지 않기" + skip
- [ ] 자동 노출 조건: 첫 점검 + template 부재 + gallery 결과 ≥1
- [ ] 토큰 신설: `INSPECTION_TEMPLATE_GALLERY_CARD`
- [ ] localStorage: `inspection-gallery-skip-{equipmentTypeId}` (다시 묻지 않기)
- [ ] i18n: `intermediateInspection.gallery.*` ko/en
- [ ] 테스트:
  - [ ] E2E: 첫 점검 + 매칭 template 있음 → gallery 노출
  - [ ] E2E: 매칭 template 없음 → gallery skip, 빈 양식 노출
  - [ ] E2E: "다시 묻지 않기" localStorage 동작

---

## 2. 디자인 리뷰 결과 매핑 절차 (새 세션에서 진행)

새 세션의 첫 작업:

1. `/mnt/c/Users/kmjkd/Downloads/중간점검,자체 점검 리뷰/` 폴더의 디자인 리뷰 결과(`review-result-*.md` 또는 본문) + wireframe HTML 5개를 Read
2. **Section 3 Top 22 우선순위 항목**을 Phase 1A~1D 각각에 매핑:
   - §K (결과 섹션 작성 워크플로) 항목 → Phase 1A 또는 별도 backlog
   - §L (표 편집기 인터랙션) 항목 → 대부분 Phase 후순위 (TipTap Phase 2 영역)
   - §M (자체점검 체크리스트) 항목 → 별도 backlog (자체점검 plan은 미정)
   - §N (Build-Once 워크플로) 항목 → **Phase 1A~1D에 직접 매핑**
3. **Section 4 토큰 제안**을 Phase별로 분배:
   - `INSPECTION_PREFILL_NOTICE` → Phase 1A
   - `INSPECTION_CELL_PROVENANCE` → Phase 1A 또는 1B
   - `INSPECTION_TEMPLATE_VERSION_BADGE` → Phase 1B
   - `INSPECTION_TEMPLATE_DIFF` → Phase 1C
   - `INSPECTION_TEMPLATE_GALLERY_CARD` → Phase 1D
4. **Section 5 Wireframe HTML 5종**을 reference 디자인으로 채택 여부 결정 (전체/부분/대안)
5. 미세조정 결과를 이 exec-plan 파일에 직접 반영 (체크박스·세부사항 갱신)
6. 사용자 승인 후 Phase 1A부터 구현 시작

---

## 3. Cross-cutting 결정 (모든 Phase 공통)

| 영역 | 결정 |
|---|---|
| 권한 | template auto-create는 시스템, 명시 수정은 admin only |
| 캐시 | `INSPECTION_TEMPLATE_UPDATED` emitAsync (verify-cache-events 패턴) |
| CAS | template version 컬럼 + supersededBy 체인 |
| SSOT | `lib/inspection/template-utils.ts` 단일 — frontend/backend 모두 사용 |
| i18n | ko/en parity 강제 — `intermediateInspection.{template,softFork,gallery,prefill}.*` |
| A11Y | SoftForkDialog radiogroup + focus trap, prefill 적용 시 SR announce |
| 신규 의존성 | 0 (TipTap·Univer 미도입, Phase 2로 후순위) |
| 다크 모드 | semantic.ts의 ok/critical 토큰 사용, 별도 dark variant 정의 금지 |
| 마이그레이션 | 1A는 0건, 1B는 1건 (drizzle generate + backfill script) |
| 테스트 매트릭스 | 1A E2E only / 1B backend unit + e2e + backfill / 1C e2e + a11y / 1D e2e |
| 관측성 | audit log: template create/update/version up |
| 분석 (선택) | track.ts에 `inspection.template.{prefill_used, soft_fork, gallery_selected}` 이벤트 |

---

## 4. 트레이드오프 / 위험

- **Phase 1B의 backfill 스크립트 실패**: 기존 inspection 데이터가 손상될 위험. → idempotent + dry-run 모드 + transaction wrap
- **Phase 1B의 동시 작성 race**: 두 작성자가 같은 장비를 동시 점검하면 첫 승인 시 template auto-create가 중복 시도 가능. → unique constraint `(equipmentId, version)` + `ON CONFLICT DO NOTHING` 또는 SELECT FOR UPDATE
- **Phase 1C 다이얼로그의 사용자 마찰**: 매번 구조 변경 감지 시 다이얼로그 노출 → 사용자 짜증. → 정확한 deep-equal로 *진짜* 변경만 감지, 노출 빈도 측정 후 임계값 조정
- **Phase 1D의 "비슷한 장비" 정의**: modelName 일치만으로는 너무 좁음, equipmentTypeId만으로는 너무 넓음. → 2단계 fallback (modelName → equipmentTypeId) + 카드에 매칭 이유 표시
- **TipTap 미도입 결정**: VisualTableEditor의 cell type system 부재가 ISO 17025 §7.11 audit trail per cell 미충족. → Phase 4(미정) 또는 별도 plan으로 분리

---

## 5. 충돌 시 진실의 원천

1. **코드 실측** (현재 repo의 실제 파일)
2. **이 exec-plan 파일**
3. `HANDOVER.md` (디자인 리뷰 폴더)
4. MEMORY.md의 project memory 4건

상위 source가 하위와 다르면 상위를 따르고, 메모리·exec-plan을 업데이트한다.
