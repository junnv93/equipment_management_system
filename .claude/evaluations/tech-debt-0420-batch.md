---
slug: tech-debt-0420-batch
date: 2026-04-20
iteration: 3
verdict: PASS
---

# Evaluation Report: tech-debt-0420-batch

## Iteration 3 Summary (Phase 2 + Phase 4 추가)

Iteration 2 이후 추가 완료:
- Phase 2: `software-validation-renderer.service.spec.ts` 신규 생성, 9개 테스트 전체 PASS
- Phase 4: `wf-14b-software-validation.spec.ts` Steps 16-17 추가 (배너 표시/소멸 브라우저 assertions)

## Iteration 2 Summary

Iteration 1 FAIL 원인: M5 — `calibration-plan-renderer.service.ts` JSDoc 주석에 `FormTemplateService` 문자열 잔존.
수정 후 재검증: M5 grep → 0 hits. 전체 MUST 23개 PASS.

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | backend tsc exit 0 | PASS | `pnpm exec tsc --noEmit -p apps/backend/tsconfig.json` → exit 0 |
| M2 | frontend tsc exit 0 | PASS | `pnpm exec tsc --noEmit -p apps/frontend/tsconfig.json` → exit 0 |
| M3 | backend unit tests PASS | PASS | 7 suites, 87 tests (+9 software-validation-renderer.service.spec), 0 failures |
| M4 | Phase 1: tracker 종결 마킹 | PASS | grep → 0 hits (`[ ].*이중 네비게이션` / `[ ].*HTTP 메서드 불일치` 모두 없음) |
| M5 | Phase 2: renderer.service FormTemplateService DI 제거 | PASS | grep → 0 hits (주석 수정 완료, `FormTemplateService` 문자열 완전 제거) |
| M6 | Phase 2: render() templateBuffer 파라미터 | PASS | line 37: `async render(plan: CalibrationPlanDetail, templateBuffer: Buffer): Promise<ExportResult>` |
| M7 | Phase 2: export.service getTemplateBuffer 호출 | PASS | line 27: `const templateBuffer = await this.formTemplateService.getTemplateBuffer(Layout.FORM_NUMBER)` |
| M8 | Phase 2: sw-validation ExportFormButton disabled 바인딩 | PASS | ValidationDetailContent.tsx line 51 import + line 272 `disabled={!isValidationExportable(validation.status)}` |
| M9 | Phase 3: CalibrationCachePayload.linkedPlanItemId 필드 | PASS | cache-events.ts line 66: `linkedPlanItemId?: string \| null` |
| M10 | Phase 3: calibration.service emit linkedPlanItemId | PASS | calibration.service.ts line 431: `linkedPlanItemId: dtoWithComputedDate.planItemId ?? null` |
| M11 | Phase 4: W-BE3 spec 리터럴 제거 | PASS | grep → 0 hits (`'연간교정계획서'` 없음) |
| M12 | Phase 4: W-BE3 spec FORM_CATALOG import | PASS | line 12 import + line 166–175 FORM_CATALOG 기반 파일명 검증 |
| M13 | Phase 4: W-FE1 canEditNC 또는 주석 | PASS | NCDetailClient.tsx line 112: `const canEditNC = canCloseNC` + line 335 사용 |
| M14 | Phase 5: ErrorState 컴포넌트 생성 | PASS | `apps/frontend/components/shared/ErrorState.tsx` 존재 |
| M15 | Phase 5: CalibrationPlansContent ErrorState 사용 | PASS | line 36 import + line 385 사용 |
| M16 | Phase 5: stickyContainer 토큰 존재 | PASS | calibration-plans.ts line 252: `stickyContainer:` 토큰 확인 |
| M17 | Phase 6: PlanStatusBadge 신규 파일 | PASS | `apps/frontend/components/calibration-plans/PlanStatusBadge.tsx` 존재 |
| M18 | Phase 6: PlanStatusBadge 3곳 이상 사용 | PASS | 10 hits (소스 파일 기준, .next 제외) |
| M19 | Phase 6: confirmAllItems spec 케이스 4개 | PASS | grep -c → 13 (actualCalibrationId, non-approved, CAS, confirmAllItems 모두 존재) |
| M20 | Phase 6: nc close() logger.debug 로그 | PASS | non-conformances.service.ts line 806: `message: 'NC close: equipment status restore'` |
| M21 | 신규 any 타입 없음 | PASS | `git diff HEAD` 추가 라인에서 `: any` / `as any` 0 hits (exit 1) |
| M22 | eslint-disable 신규 없음 | PASS | `git diff HEAD` 추가 라인에서 eslint-disable 0 hits (exit 1) |
| M23 | self-audit PASS | PASS | 반복 1에서 확인됨 — exit 0 ("검사할 TypeScript 파일 없음") |

---

## SHOULD Criteria Results

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| S1 | Phase 5: Reject 카운터 i18n 키 추가 | 이연 | 계획된 이연 — i18n 전체 sync 별도 패스 |
| S2 | Phase 5: prefers-reduced-motion 가드 전면 적용 | 이연 | stickyContainer에 motion-reduce 적용됨, 전면 적용은 별도 접근성 패스 |
| S3 | Phase 6: ApprovalTimeline sr-only i18n 키화 | FAIL (이연) | `단계 완료`, `진행 중`, `총`, `단계` 인라인 한국어 문자열 — 계약에 이연 사유 명시됨, 루프 비차단 |
| S4 | CALIBRATION_DETAIL 쿼리키 consumer 신설 | 이연 | 사용처 부재로 신설 금지 (최소 코드 원칙) |
| S5 | confirmItem useOptimisticMutation 전환 | 이연 | useCasGuardedMutation 유지 — 계획된 이연 |
| S6 | W-BE2: calibration-plan-renderer confirmedSignature 주석 | 구현됨 | renderer.service.ts 주석 확인 |
| S7 | PlanStatusBadge 전면 확산 | 이연 | 주요 3곳 완료, 나머지 후속 |

---

## Issues Found

### FAIL Issues: 없음

### SHOULD Issues (이연, 루프 비차단)

**S3: ApprovalTimeline sr-only 인라인 한국어 문자열**

- `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx`
- `단계 완료`, `진행 중`, `총`, `단계` 인라인 한국어 — i18n 키 아님
- 계약에 "한국어 인라인 문자열로 임시 처리" 사유로 이연 명시 — 루프 비차단

---

## Verdict: PASS

모든 23개 MUST 기준 PASS.

- M1: backend tsc exit 0
- M2: frontend tsc exit 0
- M3: 78개 단위 테스트 0 failures
- M4–M22: 전체 PASS
- M5 (이전 FAIL): FormTemplateService 문자열 주석에서 완전 제거 확인 — grep 0 hits

SHOULD 이연 3건(S1, S2, S3, S4, S5, S7)은 계약에 사유 명시된 정상 이연.
