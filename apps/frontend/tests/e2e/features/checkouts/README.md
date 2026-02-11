# Checkout E2E Tests

반출입(checkout/rental) E2E 테스트 스위트. UL-QP-18 절차서 기반의 비즈니스 로직을 프론트엔드↔백엔드↔DB 통합 검증.

## 디렉토리 구조

```
features/checkouts/
├── helpers/
│   ├── checkout-helpers.ts       # 재사용 유틸리티 (API, DB reset, navigation)
│   ├── assertions.ts             # SSOT 기반 검증 유틸
│   └── checkout-constants.ts     # 스위트별 전용 ID 할당
├── suite-01-readonly/            # 목록/상세 조회 (parallel)
├── suite-02-creation/            # 반출 생성 (parallel)
├── suite-03-approval/            # 승인 워크플로우 (serial)
├── suite-04-rejection/           # 반려 워크플로우 (serial)
├── suite-05-start/               # 반출 시작 + 장비 상태 전이 (serial)
├── suite-06-return/              # 반입 처리 + 검사 항목 (serial)
├── suite-07-return-approval/     # 반입 승인 + 장비 복원 (serial)
├── suite-08-lifecycle/           # P0 전체 라이프사이클 (serial)
├── suite-09-cancel/              # 취소 워크플로우 (serial)
├── suite-10-rental/              # 대여 4단계 condition-check (serial)
└── suite-11-permissions/         # 역할 권한 검증 (parallel)
```

## 실행 방법

```bash
# 전체 스위트 (Chromium)
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/ --project=chromium --workers=4

# P0 라이프사이클만
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/suite-08-lifecycle/ --project=chromium

# 대여 4단계만
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/suite-10-rental/ --project=chromium
```

## 핵심 원칙

1. **API 레벨 검증**: 단순 UI 확인이 아닌 API 응답으로 상태 전이 정합성 검증
2. **ID 격리**: 각 serial suite가 전용 checkout ID만 사용 (checkout-constants.ts)
3. **SSOT 준수**: 상태/라벨은 `@equipment-management/schemas`에서 import
4. **장비 상태 추적**: Suite 05/07/08/10에서 equipment status 변화 검증

## 상태 전이 다이어그램

```
교정/수리: pending → approved → checked_out → returned → return_approved
                                    ↑ equip=checked_out     ↑ equip=available

대여:     pending → approved → lender_checked → in_use → borrower_returned → lender_received
                                  ↑ equip=checked_out                           ↑ equip=available
```

## 문서

- **CHECKOUT_TEST_PLAN.md**: 전체 테스트 시나리오 상세 (47개 테스트, 코드 예시 포함)
- **CHECKOUT_TEST_PLAN.old.md**: 이전 버전 (백업)
