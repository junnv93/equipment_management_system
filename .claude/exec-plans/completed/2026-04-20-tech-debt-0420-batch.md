---
slug: tech-debt-0420-batch
date: 2026-04-20
mode: 2
status: active
---

# 실행 계획: Tech Debt Batch 0420

## 메타
- 생성: 2026-04-20
- 모드: Mode 2
- 예상 변경: ~20 파일
- 슬러그: `tech-debt-0420-batch`
- 성격: 복합 배치 (CRITICAL 확인 종결 + HIGH 아키텍처 + MEDIUM 캐시/UX + LOW 테스트/접근성)

## 사전 실측 결과 (Planner 탐색)

| 항목 | 예상 | 실측 | 처리 |
|------|------|------|------|
| CalibrationPlansContent 이중 네비게이션 | 수정 필요 | 이미 수정됨 (router.push 없음) | tracker 종결만 |
| POST /checkouts/:id/return HTTP 불일치 | 수정 필요 | 이미 정합 (controller @Post, SSOT URL-only) | tracker 정리만 |
| sw-validation-exportability.ts | 생성 필요 | 이미 존재 | UI 연결만 |
| CALIBRATION_DETAIL 쿼리키 바인딩 | 바인딩 필요 | consumer 0건 → 신설은 범위 초과 | SHOULD 이연 |

## 아키텍처 결정

| # | 결정 |
|---|------|
| 1 | Phase 2: orchestrator(CalibrationPlansExportService)가 templateBuffer 주입 → renderer.render(plan, templateBuffer) 패턴 |
| 2 | Phase 2: sw-validation ExportFormButton에 isValidationExportable() disabled 바인딩 |
| 3 | Phase 3: CalibrationCachePayload.linkedPlanItemId optional 필드 추가 |
| 4 | Phase 4: W-BE3 spec 테스트 FORM_CATALOG 동적 import |
| 5 | Phase 4: W-FE1 canEditNC 별칭 + 주석 |
| 6 | Phase 5: CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.stickyContainer token 추가 |
| 7 | Phase 5: ErrorState 신규 컴포넌트 + CalibrationPlansContent 연결 |
| 8 | Phase 6: PlanStatusBadge 전용 컴포넌트 추출 (3곳 공유) |
| 9 | Phase 6: confirmAllItems 유닛 테스트 4 케이스 |
| 10 | Phase 6: nc close() logger.debug 구조화 로그 |

---

## Phase 1: CRITICAL 확인 + Tracker 정리

**목표:** 사전 실측에서 이미 수정 확인된 항목 2건을 tracker에서 종결 이관.

### 수정 파일
- `.claude/exec-plans/tech-debt-tracker.md` — P1-A, P1-B 항목을 [x]로 갱신

### 검증
```bash
grep -n "\[ \].*이중 네비게이션\|\[ \].*HTTP 메서드 불일치" .claude/exec-plans/tech-debt-tracker.md
# → 0 hits (종결됨)
```

---

## Phase 2: HIGH 아키텍처 개선

**목표:**
- calibration-plan-renderer: FormTemplateService DI 제거 → templateBuffer 외부 주입 패턴
- sw-validation: ExportFormButton disabled 바인딩

### 수정 파일
1. `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
   - constructor FormTemplateService 제거
   - `render(plan: CalibrationPlanDetail, templateBuffer: Buffer): Promise<ExportResult>` 시그니처
2. `apps/backend/src/modules/calibration-plans/calibration-plans-export.service.ts`
   - FormTemplateService 주입 추가
   - orchestrator에서 getTemplateBuffer → render(plan, buffer) 호출
3. `apps/backend/src/modules/calibration-plans/calibration-plans.module.ts`
   - 주석 갱신 ("FormTemplateService는 orchestrator 레벨에서 주입")
4. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts`
   - rendererService.render() mock 시그니처 갱신 (templateBuffer 파라미터 추가)
5. FE: `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/SoftwareValidationDetailContent.tsx` (경로 재확인)
   - isValidationExportable import + ExportFormButton disabled 연결

### 검증
```bash
cd apps/backend && npx tsc --noEmit
cd apps/backend && npx jest calibration-plans --silent
cd apps/frontend && npx tsc --noEmit
```

---

## Phase 3: MEDIUM 캐시 이벤트 payload 보강

**목표:** CACHE_EVENTS.CALIBRATION_CREATED payload에 linkedPlanItemId 포함

### 수정 파일
1. `apps/backend/src/common/cache/cache-events.ts`
   - `CalibrationCachePayload`에 `linkedPlanItemId?: string | null` 추가
2. `apps/backend/src/modules/calibration/calibration.service.ts`
   - emit payload에 `linkedPlanItemId: dtoWithComputedDate.planItemId ?? null` 추가
3. `apps/backend/src/common/cache/cache-event.registry.ts`
   - CALIBRATION_CREATED 핸들러 확인 (linkedPlanItemId 기반 plan 캐시 무효화 필요 여부 검토)

### 검증
```bash
cd apps/backend && npx tsc --noEmit
cd apps/backend && npx jest calibration.service --silent
```

---

## Phase 4: MEDIUM NC/CalPlan 아키텍처 경고

**목표:** W-FE1 주석, W-BE2 주석, W-BE3 테스트 SSOT

### 수정 파일
1. `apps/frontend/components/non-conformances/NCDetailClient.tsx` — canEditNC 별칭 + 주석
2. `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts:72` — confirmedBy 비즈니스 규칙 주석
3. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts:175` — '연간교정계획서' 리터럴 → FORM_CATALOG 동적 import

### 검증
```bash
cd apps/backend && npx tsc --noEmit
cd apps/backend && npx jest calibration-plans-export.service --silent
cd apps/frontend && npx tsc --noEmit
```

---

## Phase 5: MEDIUM CalibrationPlan Phase 2 UX

**목표:** Sticky 토큰, ErrorState 컴포넌트, Reject 카운터 i18n

### 수정 파일
1. `apps/frontend/lib/design-tokens/components/calibration-plans.ts` — stickyContainer/stickyStuck 토큰
2. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — sticky 클래스 토큰 경유 + prefers-reduced-motion
3. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx:519` — textarea minLength=10 + i18n 카운터
4. `apps/frontend/components/shared/ErrorState.tsx` — 신규 컴포넌트
5. `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` — ErrorState 연결
6. `apps/frontend/messages/ko/calibration.json` — planDetail.dialogs.reject.counter 키
7. `apps/frontend/messages/en/calibration.json` — 동일

### 검증
```bash
cd apps/frontend && npx tsc --noEmit
cd apps/frontend && npx next lint
```

---

## Phase 6: LOW 테스트 + 접근성

**목표:** confirmAllItems spec, renderer 셀 assert, nc close() 로그, PlanStatusBadge, sr-only

### 수정 파일
1. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans.service.spec.ts` — confirmAllItems 4 케이스
2. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts` — confirmedByName 셀 assert
3. `apps/backend/src/modules/non-conformances/non-conformances.service.ts` — close() logger.debug
4. `apps/frontend/components/calibration-plans/PlanStatusBadge.tsx` — 신규
5. `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` — PlanStatusBadge 교체
6. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — PlanStatusBadge 교체
7. `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx` — sr-only 요약

### 검증
```bash
cd apps/backend && npx tsc --noEmit && npx jest calibration-plans --silent && npx jest non-conformances --silent
cd apps/frontend && npx tsc --noEmit
```

---

## 전체 최종 검증
```bash
pnpm tsc --noEmit
pnpm --filter backend test
node scripts/self-audit.mjs --staged
```

## Out of Scope
- CALIBRATION_DETAIL 쿼리키 consumer 신설 (사용처 부재)
- wf-14b E2E (별도 세션)
- Phase 3 KPI aria-pressed (이미 적용됨, tracker 종결)
- Lighthouse/axe CI gate
