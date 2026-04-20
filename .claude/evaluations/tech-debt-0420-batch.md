---
slug: tech-debt-0420-batch
date: 2026-04-20
iteration: 1
verdict: FAIL
---

# Evaluation Report: tech-debt-0420-batch

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | backend tsc exit 0 | PASS | `pnpm exec tsc --noEmit -p apps/backend/tsconfig.json` → exit 0 |
| M2 | frontend tsc exit 0 | PASS | `pnpm exec tsc --noEmit -p apps/frontend/tsconfig.json` → exit 0 |
| M3 | backend unit tests PASS | PASS | 68 suites, 900 tests, 0 failures |
| M4 | Phase 1: tracker 종결 마킹 | PASS | grep → 0 hits (`[ ].*이중 네비게이션` / `[ ].*HTTP 메서드 불일치` 모두 없음) |
| M5 | Phase 2: renderer.service FormTemplateService DI 제거 | **FAIL** | grep 1 hit — line 35 JSDoc 주석: `renderer는 Buffer → Excel 변환만 담당 (FormTemplateService DI 불필요).` / 계약 검증 명령 결과는 0 hits 요구. 실제 DI 주입은 없으나 문자열 잔존으로 grep 조건 미충족 |
| M6 | Phase 2: render() templateBuffer 파라미터 | PASS | line 37: `async render(plan: CalibrationPlanDetail, templateBuffer: Buffer): Promise<ExportResult>` |
| M7 | Phase 2: export.service getTemplateBuffer 호출 | PASS | line 27: `const templateBuffer = await this.formTemplateService.getTemplateBuffer(Layout.FORM_NUMBER)` |
| M8 | Phase 2: sw-validation ExportFormButton disabled 바인딩 | PASS | ValidationDetailContent.tsx line 51 import + line 268 `disabled={!isValidationExportable(validation.status)}` |
| M9 | Phase 3: CalibrationCachePayload.linkedPlanItemId 필드 | PASS | cache-events.ts line 66: `linkedPlanItemId?: string \| null` |
| M10 | Phase 3: calibration.service emit linkedPlanItemId | PASS | calibration.service.ts line 431: `linkedPlanItemId: dtoWithComputedDate.planItemId ?? null` |
| M11 | Phase 4: W-BE3 spec 리터럴 제거 | PASS | grep → 0 hits (`'연간교정계획서'` 없음) |
| M12 | Phase 4: W-BE3 spec FORM_CATALOG import | PASS | line 12 import + line 163–169 FORM_CATALOG 기반 파일명 검증 |
| M13 | Phase 4: W-FE1 canEditNC 또는 주석 | PASS | NCDetailClient.tsx line 112: `const canEditNC = canCloseNC` + line 335 사용 |
| M14 | Phase 5: ErrorState 컴포넌트 생성 | PASS | `apps/frontend/components/shared/ErrorState.tsx` 존재 |
| M15 | Phase 5: CalibrationPlansContent ErrorState 사용 | PASS | line 43 import + line 392 사용 |
| M16 | Phase 5: stickyContainer 토큰 존재 | PASS | calibration-plans.ts line 252: `stickyContainer: 'sticky top-0 z-10 bg-background pb-3 transition-shadow motion-reduce:transition-none'` |
| M17 | Phase 6: PlanStatusBadge 신규 파일 | PASS | `apps/frontend/components/calibration-plans/PlanStatusBadge.tsx` 존재 |
| M18 | Phase 6: PlanStatusBadge 3곳 이상 사용 | PASS | 10 hits (CalibrationPlanDetailClient × 2, VersionHistory × 2, CalibrationPlansContent × 2, design-tokens × 2, index.ts × 1, PlanStatusBadge.tsx 자체 × 1) |
| M19 | Phase 6: confirmAllItems spec 케이스 4개 | PASS | grep -c → 13 (actualCalibrationId, non-approved, CAS, confirmAllItems 모두 존재) |
| M20 | Phase 6: nc close() logger.debug 로그 | PASS | non-conformances.service.ts line 806: `message: 'NC close: equipment status restore'` |
| M21 | 신규 any 타입 없음 | PASS | `git diff HEAD` 추가 라인에서 `: any` / `as any` 0 hits |
| M22 | eslint-disable 신규 없음 | PASS | `git diff HEAD` 추가 라인에서 eslint-disable 0 hits |
| M23 | self-audit PASS | PASS | `node scripts/self-audit.mjs --staged` → exit 0 ("검사할 TypeScript 파일 없음") |

---

## SHOULD Criteria Results

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| S1 | Phase 5: Reject 카운터 i18n 키 추가 | 이연 | 계획된 이연 — i18n 전체 sync 별도 패스 |
| S2 | Phase 5: prefers-reduced-motion 가드 전면 적용 | 이연 | stickyContainer에 motion-reduce 적용됨, 전면 적용은 별도 접근성 패스 |
| S3 | Phase 6: ApprovalTimeline sr-only i18n 키화 | FAIL (이연) | line 234–238: `단계 완료`, `진행 중`, `총`, `단계` 인라인 한국어 문자열 — 계약에 이연 사유 명시됨, 루프 비차단 |
| S4 | CALIBRATION_DETAIL 쿼리키 consumer 신설 | 이연 | 사용처 부재로 신설 금지 (최소 코드 원칙) |
| S5 | confirmItem useOptimisticMutation 전환 | 이연 | useCasGuardedMutation 유지 — 계획된 이연 |
| S6 | W-BE2: calibration-plan-renderer confirmedSignature 주석 | 구현됨 | renderer.service.ts line 72 주석 확인 |
| S7 | PlanStatusBadge 전면 확산 | 이연 | 주요 3곳 완료, 나머지 후속 |

---

## Issues Found

### FAIL Issues (루프 트리거)

**M5: `FormTemplateService` 문자열이 renderer.service.ts 주석에 잔존**

- 파일: `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
- Line 35 (JSDoc): `renderer는 Buffer → Excel 변환만 담당 (FormTemplateService DI 불필요).`
- 계약 검증 명령: `grep -n "FormTemplateService" <file>` → **0 hits 요구, 실제 1 hit 반환**
- 실제 DI 주입(`constructor`, `@Inject`, import 선언)은 존재하지 않음 — 기능적으로는 DI 제거 완료
- 그러나 계약은 검증 명령 결과를 기준으로 판정하므로 FAIL
- 수정: JSDoc 주석에서 `FormTemplateService` 문자열 제거 또는 우회 표현으로 변경

### SHOULD Issues (이연)

**S3: ApprovalTimeline sr-only 인라인 한국어 문자열**

- `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx` line 234–238
- `단계 완료`, `진행 중`, `총`, `단계` 인라인 한국어 — i18n 키 아님
- 계약에 "한국어 인라인 문자열로 임시 처리" 사유로 이연 명시 — 루프 비차단

---

## Verdict: FAIL

**차단 사유**: M5 — `calibration-plan-renderer.service.ts` JSDoc 주석에 `FormTemplateService` 문자열 잔존. 계약 검증 명령 `grep -n "FormTemplateService" <file>` 결과 1 hit 반환. 계약은 0 hits 요구.

M5를 제외한 22개 MUST 기준 모두 PASS. tsc 양쪽 exit 0, 900개 단위 테스트 PASS.
