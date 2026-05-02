# Contract — Inspection PR-2 + PR-3 시스템적 closure

**Slug:** `inspection-pr2-pr3-closure`
**Mode:** Harness Mode 2
**Date:** 2026-05-02
**Exec plan:** `.claude/exec-plans/active/2026-05-02-inspection-pr2-pr3-closure.md`

## 검증 명령 (full sweep)

```bash
# 타입
pnpm tsc --noEmit
pnpm --filter @equipment-management/schemas run tsc --noEmit
pnpm --filter @equipment-management/db run tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# 빌드
pnpm --filter backend run build
pnpm --filter frontend run build

# 단위/통합 테스트
pnpm --filter backend run test
pnpm --filter frontend run test

# e2e (관련 시나리오)
pnpm --filter frontend run test:e2e -- --grep "wf-19|wf-20|inspection-template|self-inspection"

# verify-implementation 13 스킬
# (.claude/skills/verify-implementation/SKILL.md 참조)
```

---

## MUST (블로킹 — 모두 PASS 필수)

### M1: TypeScript 컴파일 통과
- `pnpm tsc --noEmit` (모든 패키지) 0 error

### M2: Backend 빌드
- `pnpm --filter backend run build` PASS

### M3: Frontend 빌드
- `pnpm --filter frontend run build` PASS

### M4: Backend 테스트 회귀 0
- `pnpm --filter backend run test` PASS — self-inspections.service spec 회귀 0

### M5: Frontend 테스트 회귀 0
- `pnpm --filter frontend run test` PASS — RTL test 회귀 0, ToggleGroup primitive 도입 시 새 RTL 1+ 추가

### M6: e2e 회귀
- `wf-19*` (중간점검) PASS
- `wf-20*` (자체점검) PASS — selector 변경 시 spec 동시 수정 후 PASS
- `inspection-template.a11y.spec.ts` PASS

### M7: a11y axe Critical+Serious 0
- 자체점검 DialogHeader status badge axe scan 0
- 자체점검 ToggleGroup (종합결과 + items judgment) axe scan 0
- 중간점검 DialogHeader status badge axe scan 0

### M8: ToggleGroup primitive 도입
- `apps/frontend/components/ui/toggle-group.tsx` 신설 (shadcn 공식 패턴)
- `apps/frontend/components/ui/toggle.tsx` 신설
- `@radix-ui/react-toggle-group` 설치
- `SelfInspectionFormDialog.tsx`에서 종합결과 `<Select>` → `<ToggleGroup>` 전환
- items judgment 영역 ToggleGroup 적용 — 기존 `role="radiogroup"` button 패턴은 ToggleGroup primitive로 대체

### M9: 4-grid row 적용
- `INSPECTION_CHECKITEM_ROW_GRID` 토큰 신설 (`apps/frontend/lib/design-tokens/components/inspection.ts`)
- `containerCols`에 `grid-cols-[28px_1.5fr_0.8fr_1fr_180px_28px]` 또는 동등 SSOT 표현
- `SelfInspectionFormDialog.tsx` items 영역 `flex` → grid 토큰 사용
- `grep -n "INSPECTION_CHECKITEM_ROW_GRID" apps/frontend/components/inspections/SelfInspectionFormDialog.tsx` ≥ 1

### M10: Status badge token SSOT 통일
- 자체점검: 이미 적용됨 (`SelfInspectionFormDialog.tsx:425-442`) — 회귀 보존 (size lg, edit 모드 DialogHeader)
- 중간점검: **list status cell**에 적용 (`IntermediateInspectionList.tsx:515-535`)
  - **rev-1 정정 (2026-05-02)**: contract 초안은 `InspectionFormDialog.tsx` DialogHeader 가정. 실제 dialog는 create-only이며 `initialData` props 부재 → DialogHeader status 시나리오 부재. 정합한 적용 위치는 list status cell (size sm)
  - `getInspectionStatusBadgeClasses(approvalStatus, 'sm')` 적용 — 기존 `getSemanticBadgeClasses`(중복 SSOT) 대체
  - aria-label `intermediateInspection.statusBadge.ariaLabel` 추가 (i18n 기존 키 재사용)
- 5상태(draft/submitted/reviewed/approved/rejected) 매핑은 `INSPECTION_STATUS_SEMANTIC_MAP` SSOT (`apps/frontend/lib/design-tokens/components/inspection.ts:320-326`)
- `grep -c "getInspectionStatusBadgeClasses" apps/frontend/components/equipment/IntermediateInspectionList.tsx` ≥ 1

### M11: measurement/criteria 5-layer 전파
- L1 Drizzle column: `selfInspectionItems.measurement` (varchar 100), `selfInspectionItems.criteria` (varchar 200) — `packages/db/src/schema/equipment-self-inspections.ts`에서 grep 검증
- L2 마이그레이션: `apps/backend/drizzle/<번호>_*.sql` 신규 파일 + `_journal.json` append (drizzle-kit interactive prompt 회피 패턴)
- L3 Zod schema: `selfInspectionItemSchema` (`create-self-inspection.dto.ts` + `update-self-inspection.dto.ts`) measurement/criteria optional 추가
- L4 Service mapping: `self-inspections.service.ts` create/update/read에서 필드 통과
- L5 Frontend type: `apps/frontend/lib/api/self-inspection-api.ts` `SelfInspectionItem` + `SelfInspectionItemInput` 인터페이스에 `measurement?: string`, `criteria?: string` 추가
- 5-layer grep 동시 검증 (모두 ≥ 1):
  ```bash
  grep -c "measurement" packages/db/src/schema/equipment-self-inspections.ts
  grep -c "measurement" apps/backend/src/modules/self-inspections/dto/create-self-inspection.dto.ts
  grep -c "measurement" apps/backend/src/modules/self-inspections/self-inspections.service.ts
  grep -c "measurement" apps/frontend/lib/api/self-inspection-api.ts
  grep -c "criteria" apps/frontend/components/inspections/SelfInspectionFormDialog.tsx
  ```

### M12: 디자인 토큰 SSOT
- 임의값 0건 (`text-[*]`, `bg-[#*]`, `mt-[*]`):
  ```bash
  grep -nE "text-\[|bg-\[#|mt-\[|w-\[|h-\[" \
    apps/frontend/components/inspections/SelfInspectionFormDialog.tsx \
    apps/frontend/components/inspections/InspectionFormDialog.tsx \
    apps/frontend/components/ui/toggle-group.tsx \
    apps/frontend/components/ui/toggle.tsx | wc -l
  ```
  결과 0 (단, `INSPECTION_CHECKITEM_ROW_GRID` 정의에서 grid-cols arbitrary는 토큰 SSOT 내부 1회 허용)
- `dark:bg-*` / `dark:text-*` 직접 사용 0건 (CSS 변수 자동 전환)
- `transition: all` 0건
- `focus-visible` 사용 (`focus:` 단독 X)

### M13: i18n ko/en parity
- 신규 키 `selfInspection.checkItem.measurementLabel`, `measurementPlaceholder`, `criteriaLabel`, `criteriaPlaceholder`, `selfInspection.overallResultToggle.ariaLabel` ko + en 양쪽 존재
- 중간점검 `intermediateInspection.statusLabel.{draft,submitted,reviewed,approved,rejected}` + `statusBadge.ariaLabel` + `statusBadge.rejectionAlertTitle` ko + en 양쪽 존재
- 검증: `grep -c '"measurementLabel"' apps/frontend/messages/ko/equipment.json` ≥ 1 AND en 동일

### M14: WCAG 2.1.1 (Keyboard) + 1.4.11 (Non-text Contrast)
- ToggleGroup keyboard nav 동작 (Tab + Arrow keys) — Radix primitive 기본 지원
- ToggleGroup 활성/비활성 contrast 3:1 (axe Serious 0)
- DialogHeader status badge contrast 3:1 (axe Serious 0)
- IME 가드: 신규 onKeyDown handler 도입 시 `e.nativeEvent.isComposing` 체크 (Radix는 click/space 이벤트라 영향 X)

### M15: ESLint + lint-staged + pre-push hook PASS
- `pnpm lint` PASS (any 0건, eslint-disable 0건 — verify-hardcoding)
- pre-push hook (lint + tsc + test) PASS

---

## SHOULD (블로킹 X — tech-debt 등록 가능)

### S1: 모바일 760px viewport e2e
- `page.setViewportSize({ width: 760, height: 1024 })` 1 시나리오 추가 (자체점검 row stack fallback)

### S2: NVDA 한국어 매뉴얼 검증 가이드
- `docs/development/inspection-a11y-manual-checklist.md` 추가 또는 기존 문서 append

### S3: ToggleGroup keyboard 매뉴얼 시나리오
- Tab 진입 → Arrow Right/Left 이동 → Space 활성화 매뉴얼 체크리스트

### S4: measurement/criteria 도메인 용어 placeholder
- 시험원 도메인 용어 (예: "44.12 dB", "45 ± 2.5 dB") placeholder 사용자 검증

### S5: 시니어 자기검토 3차 라운드
- 1차: SSOT/하드코딩/a11y/IME 표면 점검
- 2차: cross-domain 의존성 (DB → Service → API → Frontend → Component)
- 3차: 회귀 시스템적 (wf-20, axe, ko/en parity, dark mode)

---

## 변경 파일 추정 (18-22)

### Backend (5-7)
- `packages/db/src/schema/equipment-self-inspections.ts` — column 2개 추가
- `apps/backend/drizzle/<번호>_self_inspection_items_measurement_criteria.sql` — 마이그레이션 신규
- `apps/backend/drizzle/meta/_journal.json` — append
- `apps/backend/src/modules/self-inspections/dto/create-self-inspection.dto.ts`
- `apps/backend/src/modules/self-inspections/dto/update-self-inspection.dto.ts`
- `apps/backend/src/modules/self-inspections/self-inspections.service.ts` — mapping

### Frontend Type / API (1-2)
- `apps/frontend/lib/api/self-inspection-api.ts`

### Frontend Component (4-5)
- `apps/frontend/components/ui/toggle.tsx` — 신규
- `apps/frontend/components/ui/toggle-group.tsx` — 신규
- `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx`
- `apps/frontend/components/equipment/IntermediateInspectionList.tsx` — status cell SSOT 토큰 통일 (rev-1: `InspectionFormDialog.tsx` 가정 정정)

### 디자인 토큰 (1)
- `apps/frontend/lib/design-tokens/components/inspection.ts`

### i18n (2)
- `apps/frontend/messages/ko/equipment.json`
- `apps/frontend/messages/en/equipment.json`

### e2e / a11y (2-3)
- `apps/frontend/tests/e2e/a11y/inspection-template.a11y.spec.ts` (확장) 또는 `self-inspection.a11y.spec.ts` (신설)
- `apps/frontend/tests/e2e/workflows/wf-20-*.spec.ts` (selector 보정)

### 의존성 (1)
- `apps/frontend/package.json` — `@radix-ui/react-toggle-group` 추가

**총 예상: 18-22 파일**

---

## 시니어 자기검토 체크리스트 (커밋 전 필수)

- [ ] SSOT 경유: 디자인 토큰 100% (임의값 0건)
- [ ] i18n ko/en parity (verify-i18n PASS)
- [ ] `dark:` prefix 0건 (CSS 변수 자동 전환)
- [ ] `transition: all` 0건, `focus-visible` 사용
- [ ] arbitrary value 0건 (토큰 SSOT 정의 내부 1회 제외)
- [ ] IME `isComposing` 가드 (해당 시)
- [ ] `role="alert"` (정합성 alert) vs `role="status"` (반려 사유) 정확
- [ ] aria-label 한국어 NVDA 친화
- [ ] WCAG SC 2.1.1 + 1.4.11 axe 자동 검증
- [ ] Backend 5-layer 동시 변경 (단편 처리 X)
- [ ] DB 마이그레이션 prompt 회피 패턴 적용
- [ ] e2e wf-20 selector 보정 동시 진행
- [ ] CAS version 변경 영향 0 (기존 selfInspectionItem 행 안전)
- [ ] 회귀 테스트: tsc + build + test + e2e + axe 5중

---

## 완료 후 후속 처리

- contract `.claude/contracts/inspection-pr2-pr3-closure.md` → `completed/`로 이동
- exec-plan `.claude/exec-plans/active/2026-05-02-inspection-pr2-pr3-closure.md` → `completed/`로 이동
- REGISTRY Active에서 제거
- `.claude/projects/.../memory/MEMORY.md` 진행 중 작업 섹션 업데이트
