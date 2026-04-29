---
slug: e2e-infra-redesign
phase: Phase 1 (Harness Master Roadmap 2026-04-18)
---

# Contract — E2E 인프라 재설계 (Phase 1)

## MUST Criteria (전부 통과 필요)

| ID | 검증 기준 | 검증 명령 |
|----|-----------|-----------|
| M1 | `pnpm --filter backend exec tsc --noEmit` → exit 0 | CLI |
| M2 | spec 파일 내 `admin@example.com` 0건 (auth.e2e-spec.ts LEGACY_LOGIN_USERS 제외) | `grep -rn "admin@example.com" apps/backend/test/*.e2e-spec.ts` |
| M3 | `test-auth.ts` 에 하드코딩 이메일 리터럴 없음 | `grep -n "admin@example\|manager@example\|user@example" apps/backend/test/helpers/test-auth.ts` |
| M4 | `loginAs()` 가 `GET /auth/test-login?role=...` 사용 | `grep -n "test-login" apps/backend/test/helpers/test-auth.ts` |
| M5 | `jest-e2e.json` 에 `"maxWorkers": 1` 포함 | `grep "maxWorkers" apps/backend/test/jest-e2e.json` |
| M6 | `users.e2e-spec.ts` 에 하드코딩 DB URL fallback 없음 | `grep "postgresql://postgres:postgres" apps/backend/test/users.e2e-spec.ts` |
| M7 | `history-card-export.e2e-spec.ts` 에 `admin@example.com` 인라인 upsert 없음 | `grep "admin@example" apps/backend/test/history-card-export.e2e-spec.ts` |
| M8 | `TEST_USER_IDS` 가 프로덕션 UUID 사용 (`00000000-...`) | `grep "e2e00000" apps/backend/test/helpers/test-auth.ts` → 0 hit |
| M9 | `site-permissions.e2e-spec.ts` 에서 `loginWithCredentials` 미사용 | `grep "loginWithCredentials" apps/backend/test/site-permissions.e2e-spec.ts` → 0 hit |

## SHOULD Criteria (실패 시 루프 차단 없음 — tech-debt-tracker 등록)

| ID | 기준 |
|----|------|
| S1 | `jest-e2e.json` 에 `"testTimeout": 60000` 포함 |
| S2 | `calibration-plans.e2e-spec.ts` DATABASE_URL `as string` 타입 단언 → throw guard |

## 제외 사항 (false positive 방지)

- `auth.e2e-spec.ts` 내 `admin@example.com` — `/auth/login` 엔드포인트 테스트용 `LEGACY_LOGIN_USERS` 로컬 상수 허용
- `jest-global-setup.ts` PRODUCTION_USERS_SEED 내 `lab.manager@example.com` — DB 시딩용, SSOT 검사 제외
