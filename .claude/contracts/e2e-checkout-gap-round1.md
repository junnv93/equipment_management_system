# 계약: E2E Checkout Gap Round 1 (s23 / s24 / s25)

생성: 2026-04-09

## 필수 (MUST) — 실패 시 루프 재진입

### 빌드/회귀
- [ ] `pnpm --filter frontend tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend tsc --noEmit` 에러 0 (회귀 감지)
- [ ] 기존 `race-condition.spec.ts`, `s09-cancel-flow.spec.ts`, `s11-role-permissions.spec.ts` 재실행 PASS

### 파일 존재
- [ ] `apps/frontend/tests/e2e/features/checkouts/suite-23-cross-site-rbac/s23-cross-site-rbac.spec.ts`
- [ ] `apps/frontend/tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery/s24-cancel-equipment-recovery.spec.ts`
- [ ] `apps/frontend/tests/e2e/features/checkouts/suite-25-cas-concurrent-approval/s25-cas-concurrent-approval.spec.ts`

### E2E PASS
- [ ] `pnpm --filter frontend run test:e2e -- suite-23-cross-site-rbac` 전체 PASS
- [ ] `pnpm --filter frontend run test:e2e -- suite-24-cancel-equipment-recovery` PASS (fixme 제외)
- [ ] `pnpm --filter frontend run test:e2e -- suite-25-cas-concurrent-approval` PASS (UI 케이스 fixme 허용)

### SSOT/하드코딩
- [ ] 하드코딩 0: checkout/equipment/site/team/user UUID, API path, role name 리터럴 모두 SSOT import
- [ ] status/purpose/error.code → `@equipment-management/schemas`
- [ ] 엔드포인트 → `@equipment-management/shared-constants` 빌더 또는 `api-paths.ts`
- [ ] Permission → `@equipment-management/shared-constants`
- [ ] 기존 헬퍼 3개 이상 재사용 (`getBackendToken`, `resetEquipmentToAvailable`, `cancelAllActiveCheckoutsForEquipment`, `clearBackendCache`, `cleanupCheckoutPool`, `auth.fixture`)
- [ ] seed 파일 수정 없음 (`apps/backend/src/database/seed*.ts`)
- [ ] 각 테스트 자기 리소스 생성/정리 (afterEach/afterAll)

### 도메인 MUST

**s23:**
- [ ] wrong-team approver approve → HTTP 403 + error code 필드
- [ ] 실패 후 재조회: checkout.status=PENDING, version 변화 없음, equipment.status=AVAILABLE
- [ ] 올바른 lender 팀 approver는 200 정상 (과도 차단 아님)
- [ ] RENTAL 아닌 purpose는 lenderTeamId 검사 우회 (회귀 방지)

**s24:**
- [ ] PENDING cancel 후 equipment.status=AVAILABLE
- [ ] CHECKED_OUT cancel 허용 시 → equipment.status=AVAILABLE 복구 (트랜잭션)
- [ ] stale version cancel 실패 시 equipment 상태 변화 없음 (롤백)
- [ ] cancel 후 동일 equipment 새 checkout 생성 가능 (stuck 방지)

**s25:**
- [ ] `Promise.allSettled` 두 approve → 정확히 1 success / 1 status=409
- [ ] 409 body = `{code: VERSION_CONFLICT, currentVersion: number, expectedVersion: number}`, code는 SSOT enum 비교
- [ ] 최종 version = initialVersion + 1 (정확히 1회)
- [ ] Equipment Import 동일 패턴 최소 1 테스트
- [ ] UI 케이스: 구현 시 후행자 toast/dialog 검증, 미구현 시 `test.fixme` + TODO 주석

## 권장 (SHOULD) — tech-debt 기록
- [ ] 3 스위트 총 런타임 < 90초 (로컬)
- [ ] s23/s24 parallel 실행 가능
- [ ] 신규 헬퍼 6개 이하
- [ ] console.log 디버그 출력 없음
- [ ] fixme/skip 시 TODO 주석 + 트래커 링크

## 적용 verify 스킬
verify-e2e, verify-hardcoding, verify-ssot, verify-security, verify-cas

## 종료 조건
- MUST 전부 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제, Planner 재진입
- 3회 반복 초과 → 수동 개입
- SHOULD 실패 → `tech-debt-tracker.md` 기록 후 통과
