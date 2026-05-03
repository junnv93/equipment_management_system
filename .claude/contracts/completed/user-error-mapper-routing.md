# 스프린트 계약: user error mapper routing

## 생성 시점
2026-05-03T11:25:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `apps/frontend/lib/errors/user-errors.ts`의 `mapBackendErrorCode()`가 `USER_ERROR_I18N_KEYS`를 경유한다.
- [ ] 기존 public API는 유지한다: `mapBackendErrorCode(code?: string): string`.
- [ ] unknown/undefined fallback은 기존 동작과 호환되게 `'UNKNOWN_ERROR'`를 반환한다.
- [ ] `mapUserErrorToToast()`는 기존 i18n toast routing을 유지한다.
- [ ] focused frontend tests PASS: `pnpm --filter frontend test -- user-errors.test.ts`.
- [ ] frontend type-check PASS: `pnpm --filter frontend type-check`.
- [ ] verify-implementation 대상 정적 확인 PASS.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] `team-errors.ts` / `notification-errors.ts`의 동일 legacy helper도 후속 정리 여부를 평가한다.

### 적용 verify 스킬
- `verify-ssot`
- `verify-hardcoding`
- `verify-i18n`

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제로 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
