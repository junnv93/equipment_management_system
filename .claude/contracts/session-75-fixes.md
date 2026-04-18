# 스프린트 계약: Session 75 Fixes (CSP SSOT + Security + Performance + Tests)

## 생성 시점
2026-04-18T08:45:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run lint` 에러 0
- [ ] `pnpm --filter frontend run lint` 에러 0, 워닝 0
- [ ] `pnpm --filter backend run test` 전체 통과
- [ ] `pnpm --filter backend run test:e2e --testPathPattern=non-conformances` 전체 통과
- [ ] verify-implementation (13 verify-* skills) 전체 PASS

### 권장 (SHOULD) — 실패 시 tech-debt-tracker에 기록
- [ ] review-architecture PASS (변경 범위에 대해)
- [ ] 하드코딩된 API 경로/에러 코드 0건 (verify-hardcoding)
- [ ] SSOT 위반 0건 (verify-ssot)

## 변경 범위
- proxy.ts: CSP SSOT (API_ENDPOINTS), connect-src dev WS
- nginx configs: proxy_hide_header Permissions-Policy 복원, CSP handoff 주석
- test-auth.controller.ts: NODE_ENV fail-closed
- NCDocumentsSection.tsx: IntersectionObserver lazy load, eslint-disable img
- non-conformances.e2e-spec.ts: MINIMAL_JPEG magic bytes
- api-endpoints.ts: SECURITY.CSP_REPORT 추가
- security.controller.ts: SSOT 주석 업데이트
- form-template-export.service.ts: unused import 제거
- NEW: security.controller.spec.ts (6 tests)
- NEW: test-auth-forge.spec.ts (10 tests)
