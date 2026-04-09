# Contract: failLoud 전면 전환 마이그레이션

생성: 2026-04-09
Exec Plan: `.claude/exec-plans/active/2026-04-09-fail-loud-migration.md`

## Context

`@SiteScoped` silent 모드 18개 라우트를 `failLoud: true`로 전환.
기반 인프라(`scope-enforcer.ts`, `@CurrentScope()`, `@CurrentEnforcedScope()`) 완성.
선례: `reports.controller.ts` 13개 라우트 (완료).

---

## MUST 기준

| # | 기준 | 검증 방법 |
|---|---|---|
| M1 | `pnpm --filter backend run tsc --noEmit` 타입 에러 0 | CI 출력 |
| M2 | `pnpm --filter backend run test` 전체 PASS, 회귀 0 | 테스트 결과 |
| M3 | 마이그레이션된 라우트마다 `@CurrentScope()` 또는 `@CurrentEnforcedScope()` parameter decorator 사용 | `grep -n "@CurrentScope\|@CurrentEnforcedScope"` |
| M4 | service 레이어에서 `req.query.site` / `req.query.teamId` 직접 파싱 코드 제거 (마이그레이션 대상 한정) | 코드 리뷰 |
| M5 | cross-site 요청(scope=site, 다른 site 명시)이 HTTP 403 ForbiddenException으로 거부되는 unit test — 도메인별 최소 1건 | `--grep "cross.site\|CROSS_SITE"` |
| M6 | `@SiteScoped` 없이 `failLoud` 옵션이 달린 라우트 0건 | `grep -rn "failLoud" apps/backend/src/modules/` |

---

## SHOULD 기준

| # | 기준 |
|---|---|
| S1 | E2E spec에 cross-site probing 시나리오 — 403 + audit_logs `access_denied` 기록 검증 |
| S2 | 프론트엔드 API 클라이언트(`calibration-factors-api.ts`, `software-api.ts`, `notifications-api.ts`)에 site/teamId 파라미터 명시 송출 추가 (HIGH 위험 도메인) |
| S3 | `grep -rn "req\.query\[" apps/backend/src/modules/` 마이그레이션 대상 0건 |
| S4 | Phase B/C/D/E 각각 독립 커밋 분리 (회귀 추적) |

---

## Out of Scope

- reports.controller.ts 13개 기완료 라우트 재작업
- reports.controller.ts `exportAuditLogs` — 의도적 예외
- 기존 passing 테스트 스펙 수정 (회귀 수정 제외)
- 프론트엔드 UI/UX 변경
- 새 도메인 모듈 추가

---

## 종료 조건

- M1~M6 전체 PASS → 성공 → /git-commit
- 동일 M 기준 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → harness 중단
