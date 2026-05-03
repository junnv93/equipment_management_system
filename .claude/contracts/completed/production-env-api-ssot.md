# 스프린트 계약: Production env/API endpoint SSOT drift 보강

## 생성 시점
2026-05-03T19:00:15+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `infra/compose/prod.override.yml`의 frontend `NEXT_PUBLIC_API_URL`은 빈 값이며 `/api`를 baseURL로 주입하지 않는다.
- [ ] `infra/compose/prod.override.yml` frontend env에 `NEXTAUTH_SECRET`이 주입된다.
- [ ] `infra/compose/prod.override.yml`, `infra/compose/lan.override.yml`, `.github/workflows/main.yml`, `.env.ci.example`에 `HANDOVER_TOKEN_SECRET`이 존재한다.
- [ ] `packages/shared-constants/src/api-endpoints.ts`에 실제 backend 라우트가 없는 `CHECKOUTS.COMPLETE`와 `CALIBRATION_PLANS.VERSIONS` 상수가 남아 있지 않다.
- [ ] `pnpm --filter backend run type-check` 에러 0
- [ ] `pnpm --filter frontend run type-check` 에러 0
- [ ] `pnpm --filter backend run test -- test-auth-forge` 통과

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 변경은 infra/env/API endpoint SSOT에만 국한된다.
- [ ] 하드코딩된 secret 기본값을 추가하지 않는다.

### 적용 verify 스킬
- verify-hardcoding
- verify-ssot
- review-architecture

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제로 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
