# E2E Checkout Gap Round 1 (s23 / s24 / s25) 구현 계획

## 메타
- 생성: 2026-04-09
- 모드: Mode 2 (3 spec files + helper/fixture 확장)
- Slug: e2e-checkout-gap-round1

## 설계 철학
RENTAL 승인의 크로스팀 경계, 취소 시 Equipment 상태 트랜잭션 복구, CAS 동시승인 후행자 처리 — 세 가지 보안/일관성 경계를 Playwright로 못박는다. `race-condition.spec.ts` + `s11-role-permissions.spec.ts` + `s09-cancel-flow.spec.ts` 패턴을 답습하고 신규 헬퍼는 최소로만 추가한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 테스트 방식 | API 드리븐 + s25만 UI assertion 1건 | 런타임/안정성 |
| 스위트 위치 | `features/checkouts/suite-23-cross-site-rbac` 등 | 기존 네이밍 규칙 |
| 크로스사이트 시드 | **seed 오염 금지 — 테스트 내 API 동적 생성** | 프로덕션 seed 고정 |
| storageState 재사용 | `auth.fixture.ts` 의 techManagerPage/labManagerPage | per-role 남용 방지 |
| CAS 재현 | `Promise.allSettled([req1, req2])`, setTimeout 금지 | race-condition.spec 선례 |
| SSOT | `@equipment-management/schemas`(enum), `@equipment-management/shared-constants`(API_ENDPOINTS, Permission) | 하드코딩 0 |
| 격리 | 각 테스트 자기 리소스 API 생성 + afterEach 정리 | 오염 방지 |
| parallel | s23/s24 parallel, s25는 serial | CAS 안정성 |

## Phase 1: 조사 참고 소스
- `apps/backend/src/modules/checkouts/checkouts.service.ts:1343-1370` — approve의 `approverTeamId !== checkout.lenderTeamId` (s23)
- `apps/backend/src/modules/checkouts/checkouts.service.ts` cancel 메서드 (s24) — Generator가 정확 라인 재확인
- `apps/backend/src/common/services/versioned-base.service.ts` — `updateWithVersion` + `onVersionConflict` (s25)
- `apps/frontend/tests/e2e/features/checkouts/race-condition.spec.ts` — CAS 템플릿
- `apps/frontend/tests/e2e/features/checkouts/suite-09-cancel/s09-cancel-flow.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-11-permissions/s11-role-permissions.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/helpers/checkout-helpers.ts` — `getBackendToken`, `resetEquipmentToAvailable`, `cancelAllActiveCheckoutsForEquipment`, `clearBackendCache`, `cleanupCheckoutPool` 재사용
- `apps/frontend/tests/e2e/shared/fixtures/auth.fixture.ts`
- `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts`
- `packages/shared-constants/src/api-endpoints.ts` — 빌더 존재 확인
- `packages/schemas/src/...` — `CheckoutStatusValues`, `EquipmentStatusValues`, 에러 코드 enum

## Generator가 확인할 사항
1. `API_ENDPOINTS` 빌더 존재 여부 — 없으면 `shared/constants/api-paths.ts` 로컬 생성
2. `VERSION_CONFLICT` 등 error.code 상수가 `packages/schemas` 혹은 `shared-constants`에서 export되는지
3. Equipment Import approve 엔드포인트 실제 경로 + 버전 필드명
4. 동적 site/team/user 생성 admin API 경로 — 부재 시 seed 내 기존 "다른 팀 기술책임자" 재사용
5. Phase 3 UI auto-retry 현황 — 미구현이면 s25-05 `test.fixme` + TODO

## Phase 2: 공용 헬퍼/상수 확장 (최소)
**수정 파일:**
- `apps/frontend/tests/e2e/features/checkouts/helpers/checkout-helpers.ts` — 아래 함수 시그니처 추가:
  - `createPendingRentalCheckout(page, token, opts): Promise<{id, version}>`
  - `createOtherTeamTechManagerToken(page): Promise<{token, teamId, userId}>`
  - `approveCheckoutAsUser(page, token, id, version): Promise<Response>`
  - `cancelCheckoutAsUser(page, token, id, version): Promise<Response>`
  - `getEquipmentStatus(page, token, equipmentId): Promise<string>`
  - `createPendingEquipmentImport(page, token): Promise<{id, version}>`
- `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts` — `CROSS_TEAM_RENTAL` 블록 추가
- (조건부) `apps/frontend/tests/e2e/shared/constants/api-paths.ts` — shared-constants 빌더 부재 시만 신규

**검증:** `pnpm --filter frontend tsc --noEmit`

## Phase 3: s23 — 크로스사이트/크로스팀 RBAC
**신규 파일:** `apps/frontend/tests/e2e/features/checkouts/suite-23-cross-site-rbac/s23-cross-site-rbac.spec.ts`

**커버 케이스:**
- S23-01: lender 팀 TM approve → 200, 장비 CHECKED_OUT
- S23-02: 다른 팀 TM(같은 사이트) approve → 403, status PENDING 유지
- S23-03: 다른 사이트 TM approve → 403
- S23-04: 다른 팀 TM reject → 403
- S23-05: RENTAL이 아닌 CALIBRATION은 lenderTeamId 검사 우회 회귀 방지
- S23-06: 권한 실패 후 올바른 lender TM 승인 정상 (상태 오염 없음)

**검증:** `pnpm --filter frontend run test:e2e -- suite-23-cross-site-rbac`

## Phase 4: s24 — 취소 시 Equipment 상태 복구
**신규 파일:** `apps/frontend/tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery/s24-cancel-equipment-recovery.spec.ts`

**커버 케이스:**
- S24-01: PENDING cancel → equipment.status AVAILABLE 유지
- S24-02: APPROVED cancel → AVAILABLE 유지
- S24-03: CHECKED_OUT 상태 cancel 허용 시 → AVAILABLE 복구 (도메인 규칙에 따라 fixme 분기)
- S24-04: 취소 후 동일 장비로 새 checkout 생성 가능 (stuck 방지)
- S24-05: 취소 실패(stale version) → equipment 상태 변화 없음 (트랜잭션 롤백)
- S24-06: 취소 후 status=CANCELLED, version 증가
- S24-07: 동일 장비 복수 PENDING 중 일부만 취소 → 나머지 영향 없음

**검증:** `pnpm --filter frontend run test:e2e -- suite-24-cancel-equipment-recovery`

## Phase 5: s25 — CAS 동시 승인 충돌
**신규 파일:** `apps/frontend/tests/e2e/features/checkouts/suite-25-cas-concurrent-approval/s25-cas-concurrent-approval.spec.ts`

**커버 케이스:**
- S25-01: TM + LM 동시 approve `Promise.allSettled` → 1 success / 1 409
- S25-02: 409 body `{code: VERSION_CONFLICT, currentVersion, expectedVersion}` 스키마 (code는 SSOT enum 비교)
- S25-03: 최종 DB version = initial+1 (정확히 1회)
- S25-04: Equipment Import 동일 시나리오
- S25-05: UI — 후행자 브라우저 toast/dialog 확인, 미구현 시 `test.fixme` + TODO
- S25-06: 순차 approve 2회 경계 케이스

**검증:** `pnpm --filter frontend run test:e2e -- suite-25-cas-concurrent-approval`

## Phase 6: 전체 검증
- `pnpm --filter frontend tsc --noEmit`
- `pnpm --filter backend tsc --noEmit`
- 3 스위트 실행 PASS
- verify-hardcoding, verify-ssot, verify-e2e, verify-security, verify-cas

## 의사결정 로그
- 2026-04-09: race-condition.spec은 CAS 템플릿으로만 사용, 테스트 케이스는 신규 (중복 회피). Equipment Import는 별도 describe.
- 2026-04-09: 크로스사이트 seed 오염 리스크 → 동적 생성 우선. seed 파일 수정 금지.
- 2026-04-09: UI assertion은 s25-05 1건만 — 런타임 <90s 목표.
