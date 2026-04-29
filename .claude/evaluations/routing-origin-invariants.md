---
slug: routing-origin-invariants
iteration: 1
verdict: PASS
---

## MUST Criteria

| # | Criterion | Status |
|---|-----------|--------|
| M1 | `packages/shared-constants/__tests__/api-routing.spec.ts` 신설 | PASS |
| M2 | BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅ 테스트 포함 | PASS |
| M3 | BACKEND_AUTH_PATHS 9개 경로 모두 `isBackendAuthPath=true` assert | PASS |
| M4 | NEXTAUTH_HANDLER_PATHS 8개 경로 모두 `isNextAuthHandlerPath=true` assert | PASS |
| M5 | `packages/shared-constants/jest.config.js` 신설 (ts-jest 프리셋) | PASS |
| M6 | `packages/shared-constants/package.json`에 `test` 스크립트 추가 | PASS |
| M7 | `pnpm --filter @equipment-management/shared-constants run test` 실행 시 PASS | PASS |
| M8 | `scripts/verify-routing-origin.sh` 신설 (Steps 2-11 grep 검증) | PASS |
| M9 | `bash scripts/verify-routing-origin.sh` 실행 시 0건 FAIL | PASS |
| M10 | `.husky/pre-push`에 path-based gate 추가 (routing 파일 변경 시 자동 실행) | PASS |
| M11 | `pnpm tsc --noEmit` PASS | PASS |

## SHOULD Criteria

| # | Criterion | Status |
|---|-----------|--------|
| S1 | trailing path 케이스 테스트 (callback/azure-ad, signin/ trailing slash) | PASS |
| S2 | 미분류 경로 네거티브 테스트 포함 | PASS |
| S3 | 스크립트 실패 시 복구 가이드 참조 메시지 출력 | PASS |

## Issues Found

없음.

## Evidence Summary

**M7** — `pnpm --filter @equipment-management/shared-constants run test`: Tests: 34 passed, 34 total. 모든 suite (disjoint invariant / NEXTAUTH 8개 / BACKEND 9개 / regex trailing / negative) PASS.

**M9** — `bash scripts/verify-routing-origin.sh`: Steps 2–11 전체 ✔. 최종 "ALL PASS — ADR-0006 4-layer SSOT 정합" 출력 후 exit 0.

**M11** — `pnpm tsc --noEmit`: 출력 없음 (오류 0건).

**M2** — `filter(...includes(...))` + `expect(intersection).toHaveLength(0)` 패턴 확인. `∩` 심볼 describe 제목에도 명시.

**M3** — `test.each(BACKEND_AUTH_PATHS)` 내부 `expect(isBackendAuthPath(path)).toBe(true)` 확인. 실행 결과 9개 경로 전부 ✓.

**M4** — `test.each(NEXTAUTH_HANDLER_PATHS)` 내부 `expect(isNextAuthHandlerPath(path)).toBe(true)` 확인. 실행 결과 8개 경로 전부 ✓.

**M10** — `.husky/pre-push` 51-62행: `git diff --name-only origin/main..HEAD` 결과를 `grep -E "(infra/nginx/|apps/frontend/next\.config\.js|apps/frontend/proxy\.ts|packages/shared-constants/src/api-routing\.ts)"` 로 필터링 후 비어있지 않으면 `pnpm test --silent` + `bash scripts/verify-routing-origin.sh` 실행.

**S3** — 스크립트 실패 분기(exit 1)에서 `"복구 가이드: docs/references/api-routing-architecture.md"` 및 `"ADR: docs/adr/0006-frontend-backend-routing-model.md"` 두 줄 출력 확인.
