# Contract: E2E CI Auth Setup Fix

## 생성 시점
2026-04-02

## Context
CI 환경에서 Playwright auth.setup.ts 5개 역할 로그인 전부 실패.
Next.js가 `next start` 시 `NODE_ENV=production`을 강제하여:
1. DevLoginButtons 미렌더링 (`showDevAccounts=false`)
2. test-login NextAuth provider 미등록 (`isTest || isDevelopment` 모두 false)

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `ENABLE_TEST_AUTH` 환경변수로 test-login provider + DevLoginButtons 활성화 제어 (NODE_ENV 독립) | `lib/auth.ts`, `login/page.tsx` 코드 확인 |
| M2 | CI workflow e2e-test job에 `ENABLE_TEST_AUTH=true` 설정 (build + frontend start) | `main.yml` env 블록 확인 |
| M3 | `pnpm --filter frontend run tsc --noEmit` 통과 | 빌드 검증 |
| M4 | `pnpm --filter backend run tsc --noEmit` 통과 | 빌드 검증 |
| M5 | 기존 `ENABLE_LOCAL_AUTH` 패턴과 일관된 네이밍/사용법 | 코드 리뷰 |
| M6 | `.env.ci.example`에 `ENABLE_TEST_AUTH` 문서화 | 파일 확인 |
| M7 | `continue-on-error: true` 제거 | `main.yml` 확인 |
| M8 | 로컬 개발 환경 영향 없음 — NODE_ENV=development 시 기존대로 동작 | 로직 검증 |

## SHOULD Criteria

| # | Criterion | Note |
|---|-----------|------|
| S1 | `pnpm build` 성공 | 전체 빌드 통과 |
| S2 | auth.setup.ts 코드 변경 불필요 (기존 browser-native 흐름 유지) | 변경 범위 최소화 |
| S3 | SSOT 준수 — 환경변수 참조가 중앙 집중화 | verify-ssot |

## Out of Scope
- global-setup.ts 시드 로직 수정
- E2E 테스트 스펙 파일 수정
- Backend test-auth.controller.ts 수정

## 종료 조건
- M1-M8 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 수동 개입
