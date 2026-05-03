# frontend-mapper-unit-test

## Goal

`disposal-errors.ts`와 `calibration-plan-errors.ts` mapper의 ErrorCode 매칭, error code 추출, fallback 동작을 unit test로 고정한다.

## Scope

- `apps/frontend/lib/errors/__tests__/disposal-errors.test.ts`
- `apps/frontend/lib/errors/__tests__/calibration-plan-errors.test.ts`
- tracker/registry/evaluation artifacts

## MUST

1. disposal mapper test가 `extractErrorCode()`의 direct code, nested axios response code, non-object fallback을 검증한다.
2. disposal mapper test가 `ErrorCode.DisposalRejectCommentRequired`와 `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` parameter 전달을 검증한다.
3. calibration-plan mapper test가 `ErrorCode.CalibrationPlanNotFound` i18n key routing을 검증한다.
4. calibration-plan mapper test가 `ErrorCode.CalibrationPlanRejectionReasonRequired`와 `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` parameter 전달을 검증한다.
5. 두 mapper 모두 unmapped `Error` fallback message를 검증한다.
6. focused frontend Jest가 PASS한다.
7. `pnpm --filter frontend run type-check`가 PASS한다.
8. 독립 evaluator가 contract 기준으로 PASS/FAIL을 기록한다.

## SHOULD

- mapper 구현 코드는 불필요하게 변경하지 않는다.
