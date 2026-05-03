# 스프린트 계약: Quality Audit SSOT

## 생성 시점
2026-05-03T09:45:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `docs/operations/quality-audit-routes.json`이 존재하고 유효한 JSON이다.
- [ ] `.lighthouserc.js`가 `/login` 문자열 배열을 직접 소유하지 않고 `quality-audit-routes.json`에서 Lighthouse URL을 생성한다.
- [ ] `apps/frontend/playwright.a11y.config.ts`는 public-only 접근성 config이며 인증이 필요한 `calibration-plans.a11y.spec.ts`, `inspection-template.a11y.spec.ts`, `self-inspection.a11y.spec.ts`를 실행하지 않는다.
- [ ] 공개 a11y spec은 route path를 테스트 내부 하드코딩 배열로 관리하지 않고 `quality-audit-routes.json` loader를 사용한다.
- [ ] `docs/operations/performance-budgets.md`의 Monitored Routes는 `quality-audit-routes.json`을 SSOT로 지목한다.
- [ ] `pnpm --filter frontend run lint` 에러 0.
- [ ] `pnpm --filter frontend run type-check` 에러 0.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] public a11y Playwright spec 로컬 실행 PASS.
- [ ] `.lighthouserc.js`를 Node에서 require했을 때 public route URL 목록이 1개 이상 생성된다.
- [ ] 인증 라우트 Lighthouse 자동 로그인은 별도 tech-debt로 남기지 않는다. 현재 범위에서는 login redirect 감사보다 제외가 더 정확하다.

### 적용 verify 스킬
- `harness`
- `verify-implementation`
- `review-architecture`
- `web-design-guidelines` (a11y checklist)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제
- SHOULD 실패는 종료 조건에 영향 없음
