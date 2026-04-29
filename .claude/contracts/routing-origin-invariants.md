---
slug: routing-origin-invariants
date: 2026-04-29
mode: Mode 1
---

# Contract: routing-origin-invariants

ADR-0006 Same-Origin Reverse-Proxy 회귀 방지 자동화

## Context

ADR-0006 세션에서 Evaluator가 "SHOULD: §J3 verify-routing-origin pre-commit hook 자동화"와
시니어 자기검토 #4 "api-routing.ts invariant 단위 테스트 부재"를 tech-debt에 등록.
본 세션에서 두 항목을 완전 구현.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `packages/shared-constants/__tests__/api-routing.spec.ts` 신설 | `ls` 확인 |
| M2 | BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅ 테스트 포함 | `grep "intersection\|∩\|disjoint\|filter.*includes"` |
| M3 | BACKEND_AUTH_PATHS 9개 경로 모두 `isBackendAuthPath=true` assert | `grep "test.each\|BACKEND_AUTH_PATHS"` |
| M4 | NEXTAUTH_HANDLER_PATHS 8개 경로 모두 `isNextAuthHandlerPath=true` assert | `grep "test.each\|NEXTAUTH_HANDLER_PATHS"` |
| M5 | `packages/shared-constants/jest.config.js` 신설 (ts-jest 프리셋) | `ls` 확인 |
| M6 | `packages/shared-constants/package.json`에 `test` 스크립트 추가 | `grep '"test"'` |
| M7 | `pnpm --filter @equipment-management/shared-constants run test` 실행 시 PASS | 실행 결과 |
| M8 | `scripts/verify-routing-origin.sh` 신설 (Steps 2-11 grep 검증) | `ls` + 실행 결과 |
| M9 | `bash scripts/verify-routing-origin.sh` 실행 시 0건 FAIL | 실행 결과 |
| M10 | `.husky/pre-push`에 path-based gate 추가 (routing 파일 변경 시 자동 실행) | `grep "routing\|verify-routing-origin"` |
| M11 | `pnpm tsc --noEmit` PASS | 실행 결과 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | trailing path 케이스 테스트 (callback/azure-ad, signin/ trailing slash) |
| S2 | 미분류 경로 네거티브 테스트 포함 |
| S3 | 스크립트 실패 시 복구 가이드 참조 메시지 출력 |

## Out of Scope

- §S1 legacy-sw-unregister-e2e (별도 Playwright sprint)
- §S3 docker-compose-lan-prod manual 검증 (배포 시)
- §S2 bundle-size-baseline 갱신 (LOW)
