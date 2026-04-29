---
slug: tech-debt-0420-batch
date: 2026-04-20
iteration: 1
---

# Contract: tech-debt-0420-batch

## Scope
6 Phase 배치 — CRITICAL 확인 종결(2) + HIGH 아키텍처(2) + MEDIUM 캐시 이벤트(1) +
MEDIUM NC/CalPlan 경고(3) + MEDIUM CalPlan UX(4) + LOW 테스트·접근성(7)

---

## MUST Criteria (루프 차단)

| # | Criterion | Verification Command |
|---|-----------|----------------------|
| M1 | backend tsc exit 0 | `cd apps/backend && npx tsc --noEmit` |
| M2 | frontend tsc exit 0 | `cd apps/frontend && npx tsc --noEmit` |
| M3 | backend unit tests PASS | `cd apps/backend && npx jest --silent` → 0 failures |
| M4 | Phase 1: tracker 종결 마킹 | `grep -n "\[ \].*이중 네비게이션\|\[ \].*HTTP 메서드 불일치" .claude/exec-plans/tech-debt-tracker.md` → 0 hits |
| M5 | Phase 2: renderer.service FormTemplateService DI 제거 | `grep -n "FormTemplateService" apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts` → 0 hits |
| M6 | Phase 2: render() templateBuffer 파라미터 | `grep -n "render.*templateBuffer\|templateBuffer.*Buffer" apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts` → 1+ hits |
| M7 | Phase 2: export.service getTemplateBuffer 호출 | `grep -n "getTemplateBuffer" apps/backend/src/modules/calibration-plans/calibration-plans-export.service.ts` → 1+ hits |
| M8 | Phase 2: sw-validation ExportFormButton disabled 바인딩 | `grep -rn "isValidationExportable" apps/frontend/app/\(dashboard\)/software/` → 1+ hits |
| M9 | Phase 3: CalibrationCachePayload.linkedPlanItemId 필드 | `grep -n "linkedPlanItemId" apps/backend/src/common/cache/cache-events.ts` → 1+ hits |
| M10 | Phase 3: calibration.service emit linkedPlanItemId | `grep -n "linkedPlanItemId" apps/backend/src/modules/calibration/calibration.service.ts` → 1+ hits |
| M11 | Phase 4: W-BE3 spec 리터럴 제거 | `grep -n "'연간교정계획서'" apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts` → 0 hits |
| M12 | Phase 4: W-BE3 spec FORM_CATALOG import | `grep -n "FORM_CATALOG" apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts` → 1+ hits |
| M13 | Phase 4: W-FE1 canEditNC 또는 주석 | `grep -n "canEditNC\|편집 경계" apps/frontend/components/non-conformances/NCDetailClient.tsx` → 1+ hits |
| M14 | Phase 5: ErrorState 컴포넌트 생성 | `test -f apps/frontend/components/shared/ErrorState.tsx && echo exist` → "exist" |
| M15 | Phase 5: CalibrationPlansContent ErrorState 사용 | `grep -n "ErrorState" apps/frontend/app/\(dashboard\)/calibration-plans/CalibrationPlansContent.tsx` → 1+ hits |
| M16 | Phase 5: stickyContainer 토큰 존재 | `grep -n "stickyContainer" apps/frontend/lib/design-tokens/components/calibration-plans.ts` → 1+ hits |
| M17 | Phase 6: PlanStatusBadge 신규 파일 | `test -f apps/frontend/components/calibration-plans/PlanStatusBadge.tsx && echo exist` → "exist" |
| M18 | Phase 6: PlanStatusBadge 3곳 이상 사용 | `grep -rn "PlanStatusBadge" apps/frontend/` → 3+ hits |
| M19 | Phase 6: confirmAllItems spec 케이스 4개 | `grep -c "actualCalibrationId\|non-approved\|CAS\|confirmAllItems" apps/backend/src/modules/calibration-plans/__tests__/calibration-plans.service.spec.ts` → 4+ |
| M20 | Phase 6: nc close() logger.debug 로그 | `grep -n "NC close: equipment status restore\|previousEquipmentStatus.*restoreStatus" apps/backend/src/modules/non-conformances/non-conformances.service.ts` → 1+ hits |
| M21 | 신규 any 타입 없음 | `git diff --staged \| grep -E ": any\b\|as any\b"` → staged 신규 hits 0 |
| M22 | eslint-disable 신규 없음 | `git diff --staged \| grep "eslint-disable"` → 0 hits |
| M23 | self-audit PASS | `node scripts/self-audit.mjs --staged` → exit 0 |

---

## SHOULD Criteria (루프 비차단, tech-debt 이연)

| # | Criterion | 이연 사유 |
|---|-----------|-----------|
| S1 | Phase 5: Reject 카운터 i18n 키 추가 | MUST 스코프 축소 — i18n 전체 sync는 별도 패스 |
| S2 | Phase 5: prefers-reduced-motion 가드 전면 적용 | 별도 접근성 패스 (Phase 8) |
| S3 | Phase 6: ApprovalTimeline sr-only i18n 키화 | 한국어 인라인 문자열로 임시 처리 |
| S4 | CALIBRATION_DETAIL 쿼리키 consumer 신설 | 사용처 부재 — 신설은 최소 코드 원칙 위배 |
| S5 | confirmItem useOptimisticMutation 전환 | 기존 useCasGuardedMutation + optimisticConfirmedId 유지 |
| S6 | W-BE2: calibration-plan-renderer confirmedSignature 주석 | Phase 4에서 최소 주석으로 처리 |
| S7 | PlanStatusBadge 전면 확산 | Phase 6 주요 3곳만, 나머지는 후속 |

---

## Success Signals
1. `pnpm tsc --noEmit` → 3 workspace exit 0
2. `pnpm --filter backend test` → 신규 케이스 포함 0 failures
3. `node scripts/self-audit.mjs --staged` → exit 0
4. tech-debt-tracker Open 항목 10건 이상 종결
