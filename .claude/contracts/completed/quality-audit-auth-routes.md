# 스프린트 계약: 인증 라우트 Lighthouse 감사 범위 정리

## 생성 시점
2026-05-03T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter frontend exec tsc --noEmit` 에러 0
- [ ] `.lighthouserc.js`는 `docs/operations/quality-audit-routes.json`의 `publicRoutes` 중 `lighthouse=true`만 수집한다
- [ ] `.lighthouserc.js`는 인증 라우트에 `lighthouse=true`가 설정되면 fail-fast 한다
- [ ] public a11y Playwright 설정은 `/login` 공개 라우트만 자동 대상으로 삼는다
- [ ] `authenticatedRoutes`의 `/`, `/equipment`, `/software`, `/software-validations`는 registry에 남아 있지만 `lighthouse=false`, `a11y=false`이다
- [ ] Lighthouse 자동 로그인 플로우나 인증 storageState 기반 audit 자동 실행을 새로 구현하지 않는다
- [ ] route 문자열은 Lighthouse/a11y config에 중복 하드코딩하지 않고 `quality-audit-routes.json`을 SSOT로 사용한다

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] `pnpm --filter frontend exec playwright test --config playwright.a11y.config.ts --list`가 `/login` 데스크톱/모바일만 나열한다
- [ ] 운영 문서는 인증 라우트가 registry-only 상태임을 명확히 설명한다

### 적용 verify 스킬
품질 감사 route SSOT, Lighthouse/public a11y 설정, 문서 정합성 수동 검증.

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제
- 3회 반복 초과 → 수동 개입 요청
