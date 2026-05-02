# Exec Plan — Inspection PR-2 + PR-3 시스템적 closure

**Slug:** `inspection-pr2-pr3-closure`
**Mode:** Harness Mode 2 — Strategic Planner → Generator
**Date:** 2026-05-02
**Mission SSOT:**
- `/mnt/c/Users/kmjkd/Downloads/중간점검,자체 점검 리뷰/CLAUDE_CODE_MISSION.md` PR-2 / PR-3
- `/mnt/c/Users/kmjkd/Downloads/중간점검,자체 점검 리뷰/REVIEW_PROMPT.md`

**Branch policy:** main 직접 작업 (35차 결정). DB 마이그레이션 포함이지만 1인 프로젝트 정책상 main 직접. pre-push hook이 게이트.

---

## 0. 현재 상태 실측 (Generator 시작 전 가드)

| 영역 | 상태 |
|---|---|
| `INSPECTION_STATUS_BADGE` 토큰 | 정의됨 (`inspection.ts:334-346`) |
| `getInspectionStatusBadgeClasses` helper | 정의됨 (`inspection.ts:348-355`) |
| 자체점검 status badge 적용 | **완료** (`SelfInspectionFormDialog.tsx:425-442`) |
| 중간점검 status badge 적용 | **누락** (`InspectionFormDialog.tsx:788-829` DialogHeader 영역) |
| 자체점검 items judgment | role=radiogroup 버튼 (semantic ToggleGroup, primitive 미사용) `SelfInspectionFormDialog.tsx:602-634` |
| 자체점검 종합결과 | `<Select>` `SelfInspectionFormDialog.tsx:483-494` (ToggleGroup 미적용) |
| 자체점검 row layout | `flex` `SelfInspectionFormDialog.tsx:586-646` (4-grid 미적용) |
| `measurement`/`criteria` 컬럼 | DB 부재 (`packages/db/src/schema/equipment-self-inspections.ts:147-165`) |
| `<ToggleGroup>` primitive | **부재** (`apps/frontend/components/ui/toggle-group.tsx` 없음) |
| RichCheckItem (자체점검) Zod | `selfInspectionItemSchema` (`apps/backend/src/modules/self-inspections/dto/create-self-inspection.dto.ts:10-15`) — measurement/criteria 부재 |
| 중간점검 InspectionItemFormShape | `packages/schemas/src/types/inspection-template.ts:39-45` — 별도 schema |

**스코프 결정**: Mission PR-3 명세는 `RichCheckItem`을 자체점검 items에 적용. 중간점검 InspectionItemFormShapeSchema(`checkCriteria` 이미 보유) 변경 없음. **본 sprint는 자체점검 레인 5-layer**.

---

## 1. 시스템 영향 분석

| 항목 | 영향 |
|---|---|
| Backward compat | `measurement?` / `criteria?` optional → 기존 row 안전. backfill 불필요 |
| 기존 e2e wf-19* | 영향 없음 (중간점검) |
| 기존 e2e wf-20* | row selector 변경 시 영향. spec 동시 수정 필요 |
| Backend service | mapping 변경 (선택 필드 read/write) |
| 성능 | ToggleGroup primitive는 client-only, 추가 cost 미미 |
| a11y | shadcn ToggleGroup 기본 keyboard nav 지원 (Radix) |
| 보안 | 권한 변경 없음. `casVersion` CAS 보호 유지 |

---

## Phase 0 — 사전 정찰 + 의존성 (Generator step 0)

- [ ] `pnpm list @radix-ui/react-toggle-group` — 설치 여부 확인
- [ ] 부재 시 `pnpm --filter frontend add @radix-ui/react-toggle-group`
- [ ] shadcn 공식 `toggle.tsx` + `toggle-group.tsx` reference 따라 생성:
  - `apps/frontend/components/ui/toggle.tsx` (cva variants)
  - `apps/frontend/components/ui/toggle-group.tsx` (ToggleGroup, ToggleGroupItem, context for size/variant 전파)
- [ ] `wf-20*` spec 검색하여 변경 영향 시나리오 매핑:
  - `grep -rn "checkResult\|judgment.*pass\|judgment.*fail" apps/frontend/tests/e2e/workflows/wf-20*.spec.ts`
- [ ] `inspection-template.a11y.spec.ts` 영향 범위 확인 — 자체점검 시나리오 추가 위치 결정

---

## Phase 1 — Backend 5-layer (DB schema + Zod + DTO)

- [ ] **L1 Drizzle column 추가**: `packages/db/src/schema/equipment-self-inspections.ts` `selfInspectionItems` 테이블에 `measurement: varchar('measurement', { length: 100 })`, `criteria: varchar('criteria', { length: 200 })` (둘 다 nullable)
- [ ] **L2 Drizzle 마이그레이션**: drizzle-kit interactive prompt 회피 패턴 적용 (메모리: `feedback_drizzle_kit_interactive_prompt`)
  - 수동 SQL: `apps/backend/drizzle/<번호>_self_inspection_items_measurement_criteria.sql`
  - `_journal.json` append
  - `pnpm --filter backend run db:migrate` (또는 직접 SQL apply + drizzle tracking 동기화)
- [ ] **L3 Zod schema (DTO)**:
  - `apps/backend/src/modules/self-inspections/dto/create-self-inspection.dto.ts` `selfInspectionItemSchema`에 `measurement: z.string().trim().max(100).optional()`, `criteria: z.string().trim().max(200).optional()` 추가
  - `update-self-inspection.dto.ts` 도 동일
- [ ] **L4 Service mapping**: `apps/backend/src/modules/self-inspections/self-inspections.service.ts` create / update / read에서 measurement/criteria 통과
- [ ] **L5 Frontend type**: `apps/frontend/lib/api/self-inspection-api.ts` `SelfInspectionItem`, `SelfInspectionItemInput` 인터페이스에 `measurement?: string`, `criteria?: string` 추가

**검증 명령**:
```bash
pnpm --filter @equipment-management/db run tsc --noEmit
pnpm --filter @equipment-management/schemas run tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
```

---

## Phase 2 — 디자인 토큰 SSOT 보강 (`apps/frontend/lib/design-tokens/components/inspection.ts`)

- [ ] **`INSPECTION_CHECKITEM_ROW_GRID`** 신설 — Mission 명세 6-column (#/항목/측정값/기준/판정/삭제):
  - `containerCols: 'grid grid-cols-[28px_1.5fr_0.8fr_1fr_180px_28px] gap-2 items-center'`
  - 모바일 fallback (760px 이하): stack — `containerColsMobile` 또는 `@media` Tailwind variant
- [ ] **`INSPECTION_CHECKITEM_ROW_STATE.judgmentToggle`** 보강 — ToggleGroup primitive 호환 클래스:
  - `groupRoot`: ToggleGroup root용 (visual containment)
  - `itemPass`/`itemFail`/`itemNa` (data-state="on" 매핑)
  - 기존 `segGroup`/`segItem`은 backward compat 유지 (deprecated 주석)
- [ ] **`INSPECTION_OVERALL_RESULT_TOGGLE`** 신설 — 종합결과 전용 (size lg):
  - pass/fail 2개 옵션, h-10 minimum
- [ ] 검증: `dark:` prefix 0건, arbitrary value 0건 (단 grid-cols 토큰 SSOT 정의 1회 허용), `transition: all` 0건. 기존 `getSemanticBadgeClasses` reuse, 동적 보간 0건.

---

## Phase 3 — Frontend Self-Inspection 4-grid + ToggleGroup

파일: `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx`

- [ ] **종합결과**: `<Select>` (line 483-494) → `<ToggleGroup type="single" variant="outline" size="lg">` (pass/fail 2개)
  - aria-label 한국어, 각 ToggleGroupItem에 Check/X 아이콘 + 텍스트
- [ ] **items row container**: `flex` (line 586) → `INSPECTION_CHECKITEM_ROW_GRID.containerCols`
- [ ] **items row 6-cell**:
  1. `#` 인덱스 (28px)
  2. 항목명 `<Input>` (1.5fr)
  3. **측정값** `<Input>` (0.8fr) — `value={item.measurement ?? ''}` `onChange={...measurement}` 신설
  4. **기준** `<Input>` (1fr) — `value={item.criteria ?? ''}` `onChange={...criteria}` 신설
  5. 판정 `<ToggleGroup type="single" variant="outline">` (pass/fail/na, 180px)
  6. 삭제 버튼 (28px)
- [ ] `SelfInspectionItemForm` 인터페이스 (line 81-84) `measurement?: string`, `criteria?: string` 추가
- [ ] `handleItemChange` 시그니처 확장 (`field: keyof SelfInspectionItemForm`)
- [ ] `resetForm`에서 신규 필드 초기화
- [ ] `useEffect` initialData seed에서 measurement/criteria 복원
- [ ] `handleSubmit` payload에 measurement/criteria 포함
- [ ] `isValid`는 measurement/criteria optional이므로 변경 없음
- [ ] **중간점검 InspectionFormDialog의 items judgment**는 본 sprint 스코프 외 (Mission 명세 자체점검 한정)
- [ ] IME 가드: ToggleGroup은 click/space 이벤트라 isComposing 영향 없음 (확인용 가드만)

---

## Phase 4 — 중간점검 DialogHeader Status Badge (PR-2 진짜 갭)

파일: `apps/frontend/components/inspections/InspectionFormDialog.tsx`

- [ ] DialogHeader 영역(line 788-829)에 status badge 렌더 — DialogTitle `flex flex-wrap items-center gap-2` 안에 추가
  - `isEdit && initialData?.status`일 때만
  - `getInspectionStatusBadgeClasses(initialData.status, 'lg')` 적용
  - aria-label 한국어 명시 ("승인 대기 상태", "반려됨" 등)
- [ ] 반려 사유 inline alert 영역 추가 (자체점검과 동일 패턴):
  - `role="status"` + `aria-live="polite"`
  - `INSPECTION_STATUS_BADGE.rejectionAlert` 토큰
  - `rejectionReason.slice(0, INSPECTION_STATUS_BADGE.rejectionExcerptMax)` (이미 SSOT 80자)
- [ ] 중간점검 status enum: `draft / submitted / reviewed / approved / rejected` (5상태) — `InspectionStatusKey` 타입 확인

---

## Phase 5 — i18n ko/en parity

파일: `apps/frontend/messages/ko/equipment.json`, `apps/frontend/messages/en/equipment.json`

- [ ] **자체점검 신규 키**:
  - `selfInspection.checkItem.measurementLabel` / `measurementPlaceholder`
  - `selfInspection.checkItem.criteriaLabel` / `criteriaPlaceholder`
  - `selfInspection.judgment.pass/fail/na` (이미 있음 검증)
  - `selfInspection.overallResultToggle.ariaLabel`
- [ ] **중간점검 status badge i18n**:
  - `intermediateInspection.statusLabel.{draft,submitted,reviewed,approved,rejected}` (있으면 검증, 없으면 추가)
  - `intermediateInspection.statusBadge.ariaLabel` (params: status)
  - `intermediateInspection.statusBadge.rejectionAlertTitle`
- [ ] 검증: ko/en 양쪽 동일 키. `verify-i18n` 스킬 적용.

---

## Phase 6 — 회귀 검증 + e2e + a11y

- [ ] **e2e wf-20 자체점검 spec**: ToggleGroup 시나리오 보강
  - 기존 selector(`<select>`/role=combobox)가 깨지면 `getByRole('group', { name: ... })` + `getByRole('radio'/'button', { name: 'pass'|'합격' })` 등으로 변경
  - measurement/criteria 입력 1 시나리오 추가
- [ ] **a11y spec**: `apps/frontend/tests/e2e/a11y/inspection-template.a11y.spec.ts` 또는 신설 `self-inspection.a11y.spec.ts`
  - 자체점검 DialogHeader status badge axe scan
  - 자체점검 ToggleGroup axe scan (Critical+Serious 0)
  - 중간점검 status badge axe scan (Phase 4 산출)
- [ ] **모바일 760px viewport** 1 시나리오 (SHOULD): `page.setViewportSize({ width: 760, height: 1024 })`
- [ ] 회귀: 기존 wf-19* / wf-20* PASS 유지

**실행 명령**:
```bash
pnpm tsc --noEmit
pnpm --filter backend run build
pnpm --filter frontend run build
pnpm --filter backend run test
pnpm --filter frontend run test
pnpm --filter frontend run test:e2e -- --grep "wf-19|wf-20|inspection-template|self-inspection"
```

---

## Phase 7 — verify-implementation orchestrator

- [ ] `.claude/skills/verify-implementation/SKILL.md`의 13 verify 스킬 실행 (Evaluator 위임)
- [ ] 시니어 자기검토 3차 (메모리: `feedback_repeated_self_audit`):
  - 1차: SSOT / 하드코딩 / a11y / IME / arbitrary value
  - 2차: cross-domain (selfInspectionItems → service → frontend type)
  - 3차: 회귀 (wf-20, e2e, axe, dark mode, ko/en parity)

---

## 8. 실행 시퀀스

```
Phase 0 (정찰 + ToggleGroup primitive 설치)
   ↓
Phase 1 (DB column + Zod + DTO + frontend type) — backend 5-layer
   ↓ tsc 검증
Phase 2 (디자인 토큰)
   ↓
Phase 3 (자체점검 4-grid + ToggleGroup + measurement/criteria input)
   ↓ tsc + RTL test
Phase 4 (중간점검 status badge)
   ↓ tsc
Phase 5 (i18n ko/en parity)
   ↓ verify-i18n
Phase 6 (e2e + a11y 회귀)
   ↓ pre-push hook
Phase 7 (verify-implementation 13 스킬 + 시니어 3차 자기검토)
```

각 Phase 끝 `tsc --noEmit` 빠른 검증.

---

## 9. 위험 + 완화

| 위험 | 완화 |
|---|---|
| drizzle-kit interactive prompt | 수동 SQL + journal append + DB direct apply (메모리 패턴) |
| wf-20 selector 깨짐 | Phase 6에서 spec 동시 수정 |
| ToggleGroup primitive size variant 부재 | shadcn 공식 cva 패턴 따라 size sm/lg 자체 정의 |
| 중간점검 status badge 추가 시 i18n 누락 | Phase 5에서 ko/en 양쪽 동시 + verify-i18n 게이트 |
| measurement/criteria 글자 길이 SSOT | 100/200 char 제한 (Zod + DB varchar 동일) |
| 모바일 760px 6-grid 깨짐 | flex stack fallback 토큰 추가 (Phase 2) |

---

## 10. Out-of-scope (스코프 차단)

- 중간점검 items judgment ToggleGroup 적용 (Mission 명세 외)
- 중간점검 measurement/criteria DB 추가 (자체점검 한정)
- TipTap 에디터 (PR-1 / PR-4 / PR-5 별도 sprint)
- 백필 스크립트 (optional 필드라 불필요)
- TemplateGallery / SoftForkDialog (PR-5 별도 sprint, 1B-G에서 closure)

---

## 11. 완료 정의 (Definition of Done)

- 15 MUST 모두 PASS (contract 참조)
- 시니어 3차 자기검토 통과
- pre-push hook PASS
- e2e wf-20 + a11y 회귀 0
- contracts/inspection-pr2-pr3-closure.md → completed/ 이동
- exec-plan active/ → completed/ 이동
- REGISTRY Active 제거
