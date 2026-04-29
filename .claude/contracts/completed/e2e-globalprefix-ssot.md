---
slug: e2e-globalprefix-ssot
type: contract
created: 2026-04-21
---

# Contract: e2e-globalprefix-ssot

## Scope

`createTestApp`에 `setGlobalPrefix('api')` 추가 → `toTestPath` 래퍼 전면 제거 → SSOT 달성.

## MUST Criteria

| # | 기준 | 검증 방법 |
|---|------|-----------|
| M1 | `createTestApp`에 `app.setGlobalPrefix('api')` 존재 | grep 검증 |
| M2 | `toTestPath` 참조 0건 (test-paths.ts 제외, 해당 파일 삭제 후) | grep -rn 검증 |
| M3 | `test-paths.ts` 파일 삭제됨 | ls 검증 |
| M4 | `pnpm --filter backend run tsc --noEmit` 에러 0 | tsc 실행 |
| M5 | `pnpm --filter backend run test:e2e` 기존 통과 테스트 전부 유지 | E2E 실행 |

## SHOULD Criteria

| # | 기준 |
|---|------|
| S1 | helper 파일들(test-auth, test-cleanup, test-fixtures) toTestPath import 제거됨 |
| S2 | 22개 spec 파일 import 줄 정리됨 (불필요한 빈 줄 없음) |
