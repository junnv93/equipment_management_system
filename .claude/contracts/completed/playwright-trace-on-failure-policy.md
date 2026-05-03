# playwright-trace-on-failure-policy

## Scope

Sprint 4.5 시각 회귀 / fixture 기반 Playwright spec의 실패 디버깅 보존 정책을 명시한다.

## Acceptance Criteria

- `apps/frontend/tests/e2e/visual/dday-6level.spec.ts`는 파일 단위로 `trace: 'retain-on-failure'`를 사용한다.
- `apps/frontend/tests/e2e/features/checkouts/group-indeterminate.spec.ts`는 파일 단위로 `trace: 'retain-on-failure'`를 사용한다.
- 기존 인증 `storageState`, theme 설정, screenshot threshold, test titles는 변경하지 않는다.
- Playwright test discovery가 두 spec을 정상 인식한다.

## Verification

- `rg -n "trace: 'retain-on-failure'" apps/frontend/tests/e2e/visual/dday-6level.spec.ts apps/frontend/tests/e2e/features/checkouts/group-indeterminate.spec.ts`
- `pnpm --filter frontend exec playwright test tests/e2e/visual/dday-6level.spec.ts tests/e2e/features/checkouts/group-indeterminate.spec.ts --list`
