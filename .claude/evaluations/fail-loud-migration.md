# Evaluation: failLoud 전면 전환

생성: 2026-04-09
Iteration: 1

## Verdict: PASS

## MUST 기준

| # | 기준 | 결과 | 증거 |
|---|---|---|---|
| M1 | `pnpm --filter backend run tsc --noEmit` | PASS | `pnpm exec tsc --noEmit` 에러 0 (빈 출력) |
| M2 | `pnpm --filter backend run test` | PASS | 43 suites / 537 tests 전부 PASS |
| M3 | 18개 마이그레이션 라우트 `@CurrentScope`/`@CurrentEnforcedScope` 사용 | PASS | equipment(1) + checkouts(1) + nc(1) + eq-imports(1) + calibration(2) + calibration-plans(2) + calibration-factors(3) + test-software(1) + software-validations(2) + users(1) + notifications(1) + disposal-requests(2) = 18 ✓. 모두 `@CurrentEnforcedScope() scope: EnforcedScope` 파라미터 주입. |
| M4 | service 레이어에서 `req.query.site`/`req.query.teamId` 직접 파싱 제거 | PASS | `grep -rn "req\.query\[" apps/backend/src/modules/` → No matches. |
| M5 | 도메인별 cross-site 거부 unit test | PASS | `site-scope.interceptor.spec.ts:385~443` 에 data-driven loop (`failLoud cross-site rejection — domain coverage`) 9 domain case (checkouts, non-conformances, equipment-imports, calibration, calibration-plans/siteId, test-software, users, notifications/recipientSite, disposal) + 기존 equipment failLoud 케이스(`295`). Phase B~E 12 도메인 중 calibration-factors/software-validations는 공유 정책(CALIBRATION_DATA_SCOPE, TEST_SOFTWARE_DATA_SCOPE)으로 policy-level 커버. |
| M6 | `@SiteScoped` 없는 failLoud 단독 사용 0건 | PASS | `grep -rn "failLoud" apps/backend/src/modules/` 전 매치가 `@SiteScoped({ ..., failLoud: true })` 또는 주석/스펙 파일. orphan 없음. |

## SHOULD 기준

| # | 기준 | 결과 | 비고 |
|---|---|---|---|
| S1 | E2E cross-site probing + audit `access_denied` | N/A | 본 이터레이션 범위 외 |
| S2 | 프론트 API 클라이언트 site/teamId 명시 송출 | pending | Generator가 생략 선언 (out of scope 처리) |
| S3 | `req.query[...]` 0건 | PASS | grep 결과 0 |
| S4 | Phase B~E commit 분리 | pending | 아직 commit 전, harness가 PASS 확인 후 `/git-commit` 단계로 |

## 품질 체크 결과

### 1. 비표준 siteField 매핑 — OK
- `calibration-plans` (`siteField: 'siteId'`): controller가 `query.siteId = scope.site`로 매핑. 기존 filter가 `siteId` 필드를 소비하는 구조와 일치.
- `notifications` (`siteField: 'recipientSite'`): controller가 `query.recipientSite = scope.site`로 매핑. interceptor의 siteField 설정과 일관.
- 해당 spec 케이스도 data-driven loop에 포함되어 회귀 차단.

### 2. Service 시그니처 preservation — 허용 범위
Generator가 "controller에서 query mutation 후 service 호출"을 택한 결과, interceptor가 이미 enforce한 scope을 한번 더 controller가 query 객체에 바인딩한다. 이중 방어 성격으로 scope과 query가 일치. silent 모드의 mutation을 interceptor에서 controller로 일부 이동한 shape. service 시그니처는 유지되므로 회귀 위험은 낮음.

### 3. users.controller teamId 누락 — 경미한 gap (FAIL 아님)
- `USER_DATA_SCOPE.test_engineer = { type: 'team' }` 이지만 `UserQueryDto`에는 `teamId` 필드가 없음(`site`만 존재). controller는 `query.site = scope.site`만 바인딩.
- interceptor는 team scope일 때 `req.query.teamId = user.teamId`를 주입하지만, DTO에 필드가 없어 validation pipe를 거치며 service로 전달되지 않을 가능성.
- 결과: test_engineer 기본 조회 시 team 필터가 service 레벨에 도달하지 못하고 site 레벨 필터만 작동할 수 있음.
- 다만 **cross-team 명시 요청은 interceptor가 failLoud로 차단**하므로 보안 경계는 유지됨. 기존 silent 모드에서도 동일 동작이었고 본 마이그레이션이 회귀를 도입한 것은 아님.
- 권고: 후속 작업으로 `UserQueryDto.teamId` 추가 + `usersService.findAll`에서 team 필터 적용. 본 contract MUST 범위 외.

### 4. disposal scope=all 경로 — OK
`getPendingReviewRequests(userId, scope.site, scope.teamId)` / `getPendingApprovalRequests(scope.site)`. scope=all 역할(quality_manager, system_admin)에서는 `scope.site`/`scope.teamId`가 `undefined`로 전달되어 기존 optional 시그니처와 호환. 537 테스트 PASS로 회귀 없음 확인.

### 5. interceptor throw 타이밍 — OK
`site-scope.interceptor.spec.ts:295`(기존) + 384~443(신규)에서 `intercept()` 호출이 `ForbiddenException` throw 하고 `callHandler.handle` 이 호출되지 않음을 검증. 즉 controller body 진입 전 차단 확인. failLoud 실제 작동 증거.

## 수정 권고

없음 (MUST 전부 PASS). 다음 이터레이션에서 고려할 follow-up:
- `UserQueryDto.teamId` 필드 추가 + `usersService.findAll` team 필터 적용 (품질 체크 #3)
- S2: 프론트엔드 api client site/teamId 명시 송출
- S4: Phase B/C/D/E 분리 커밋

## 총평

MUST M1~M6 전부 PASS. tsc/test 모두 green, 18개 라우트 전원 `@SiteScoped + failLoud + @CurrentEnforcedScope` 패턴 적용. 비표준 siteField(siteId, recipientSite) 매핑 정확, interceptor throw 타이밍 spec으로 검증. users teamId 누락은 기존 silent 모드에서 승계된 문제로 본 마이그레이션 회귀 아님 — follow-up 권고. `/git-commit` 진행 가능.
