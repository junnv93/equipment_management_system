# Contract: e2e-equipment-partitioning

## Context

S23-S27 checkout E2E suite가 병렬 실행 시 공용 장비 상태 충돌로 비결정적 실패.
업계표준 Test Data Partitioning 패턴으로 각 suite에 전용 장비 할당.

## MUST (pass criteria)

- [ ] 4개 신규 장비 UUID가 `uuid-constants.ts`에 추가됨 (S23/S24/S25/S26 전용)
- [ ] 4개 신규 장비가 `equipment.seed.ts`에 seed 항목으로 추가됨 (available 상태, Suwon FCC EMC/RF)
- [ ] S26 전용 장비는 `isShared: true, sharedSource: 'other_lab'` 설정
- [ ] `shared-test-data.ts`의 `TEST_EQUIPMENT_IDS`에 4개 신규 상수 추가됨
- [ ] S23/S24/S25/S26 spec 파일에서 장비 ID가 전용 장비로 교체됨
- [ ] 기존 장비 ID(eeee1001-eeee1008)는 변경 없음
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm --filter backend run test` exit 0

## SHOULD (non-blocking)

- [ ] UUID 패턴이 기존 `eeee1NNN` 연번과 일관됨
- [ ] seed 항목이 기존 `createEquipment()` 패턴과 동일 구조
- [ ] S26 NON_SHARED/UIWANG_SHARED_REF는 read-only 참조이므로 변경 없음

## Scope (touches only)

- `apps/backend/src/database/utils/uuid-constants.ts`
- `apps/backend/src/database/seed-data/core/equipment.seed.ts`
- `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-23-cross-site-rbac/s23-cross-site-rbac.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery/s24-cancel-equipment-recovery.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-25-cas-concurrent-approval/s25-cas-concurrent-approval.spec.ts`
- `apps/frontend/tests/e2e/features/checkouts/suite-26-shared-equipment/s26-shared-equipment.spec.ts`

## MUST NOT

- No changes to playwright.config.ts
- No changes to S27 (dynamic equipment)
- No changes to existing equipment UUIDs or seed entries
- No changes to checkout-constants.ts
- No "while I'm here" refactors
