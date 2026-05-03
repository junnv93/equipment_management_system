# frontend-error-enum-ssot-migration

## Goal

`apps/frontend/lib/errors/calibration-errors.ts`의 backend/API 1:1 에러 코드를 `packages/schemas` `ErrorCode`로 승격하고, `equipment-errors.ts`의 backend code routing도 schemas `ErrorCode`를 참조하도록 정리한다.

## Scope

- `packages/schemas/src/errors.ts`
- `apps/frontend/lib/errors/calibration-errors.ts`
- `apps/frontend/lib/errors/equipment-errors.ts`
- 관련 focused unit tests
- tracker/registry/evaluation artifacts

## MUST

1. `CalibrationErrorCode`는 로컬 string enum으로 backend code literal을 재정의하지 않는다.
2. calibration 에러 i18n mapping에서 사용하는 모든 backend code는 `ErrorCode`에서 온다.
3. schemas에 없는 calibration backend code는 `ErrorCode`와 `errorCodeToStatusCode`에 추가한다.
4. `equipment-errors.ts`의 `mapBackendErrorCode`는 이미 schemas에 존재하는 backend code에 대해 raw string key 대신 `ErrorCode.*` computed key를 사용한다.
5. `EquipmentErrorCode`는 프론트 전용 UI 분류 역할을 유지해 기존 specific routing과 fallback UX를 깨지 않는다.
6. 기존 public import/callsite compatibility를 유지한다.
7. focused frontend unit tests가 PASS한다.
8. `pnpm --filter frontend run type-check`가 PASS한다.
9. 독립 evaluator가 contract 기준으로 PASS/FAIL을 기록한다.

## SHOULD

- 새로 추가한 ErrorCode 상태 코드는 HTTP 의미에 맞게 400/404/409/500 중 명시한다.
- tracker 완료 기록은 실제 검증 결과와 파일 범위를 포함한다.

