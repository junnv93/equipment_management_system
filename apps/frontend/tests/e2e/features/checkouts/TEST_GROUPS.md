# Checkout E2E Test Groups - Dependency Analysis

## 의존성 분석 원칙

1. **병렬 실행 가능 조건**:

   - 서로 다른 checkout record 사용
   - 읽기 전용 작업 (조회, 검색, 필터)
   - 독립적인 데이터 생성 (새로운 checkout 생성)

2. **순차 실행 필요 조건**:

   - 같은 checkout record의 상태를 연속 변경
   - 이전 테스트 결과에 의존하는 테스트
   - Rental 4-step workflow (① → ② → ③ → ④)

3. **Seed Data 활용**:
   - 68개 checkout records를 테스트별로 할당
   - 각 테스트는 고유한 record 사용하여 격리

## 그룹 재편성 (의존성 기반)

### Group 1: Read-Only Tests (완전 병렬) - 18 scenarios

**특징**: 데이터 수정 없음, 완전히 독립적

#### Subgroup 1A: List Page Basic (4 scenarios)

- A-1: 반출 목록 페이지 로딩 ✓
- A-2: 반출 데이터 표시 확인 ✓
- A-7: 날짜순 정렬 ✓
- A-9: 반출 상세 페이지 로딩 ✓

**Seed Data**: CHECKOUT_001~004 (pending 상태)

#### Subgroup 1B: Search & Filter (5 scenarios)

- A-3: 장비명 검색 ✓
- A-4: 신청자명 검색 ✓
- A-5: 목적별 필터 (calibration/repair/rental) ✓
- A-6: 상태별 필터 (pending/approved/checked_out 등) ✓
- A-8: 페이지네이션 ✓

**Seed Data**: CHECKOUT_001~068 (전체 사용)

#### Subgroup 1C: Detail Page Display (3 scenarios)

- A-10: 목적 배지 표시 ✓
- A-11: Rental 대여자 정보 표시 ✓
- A-12: 장비 링크 네비게이션 ✓

**Seed Data**: CHECKOUT_005 (rental), CHECKOUT_001 (calibration)

#### Subgroup 1D: Permission Read-Only (4 scenarios)

- F-3: test_engineer 권한 확인 (조회 가능) ✓
- F-4: technical_manager 권한 확인 (조회 가능) ✓
- C-1: test_engineer cannot approve (버튼 숨김) ✓
- D-3: test_engineer cannot start checkout (버튼 숨김) ✓

**Seed Data**: CHECKOUT_009 (approved), CHECKOUT_019 (checked_out)

#### Subgroup 1E: Display Edge Cases (2 scenarios)

- A-9: Empty list display ✓
- D-11: Overdue checkout warning ✓

**Seed Data**: 없음 (빈 결과), CHECKOUT_056 (overdue)

---

### Group 2: Create Workflow (병렬) - 14 scenarios

**특징**: 각 테스트가 새 checkout 생성, 서로 독립적

#### Subgroup 2A: Validation Tests (5 scenarios)

- B-1: 폼 유효성 검사 (빈 필드) ✓
- B-6: 장비 가용성 확인 ✓
- B-7: 제출 전 취소 ✓
- C-13: Rejection reason required ✓
- D-12: Cannot return before checkout ✓

**새 데이터 생성**: 각 테스트마다 임시 checkout 생성

#### Subgroup 2B: Success Creation (6 scenarios)

- B-2: Calibration checkout 생성 ✓
- B-3: Repair checkout 생성 ✓
- B-4: Rental checkout 생성 (lenderTeamId 포함) ✓
- B-5: Multiple equipment checkout 생성 ✓
- C-14: Rejection notification ✓
- D-10: Return with notes ✓

**새 데이터 생성**: 각 테스트마다 고유 checkout 생성

#### Subgroup 2C: Creation Edge Cases (3 scenarios)

- B-8: Duplicate request prevention ✓
- C-8: Approve multiple equipment checkout ✓
- D-9: **CRITICAL - Full flow test** (순차적으로 별도 실행)

**새 데이터 생성**: 독립적인 checkout 생성

---

### Group 3: Approval Flow (부분 병렬) - 12 scenarios

**특징**: 서로 다른 pending checkout 사용, 병렬 가능

#### Subgroup 3A: Basic Approval (6 scenarios - 병렬)

- C-2: technical_manager can approve ✓ (CHECKOUT_001 사용)
- C-3: Approve calibration checkout ✓ (CHECKOUT_002 사용)
- C-4: Approve repair checkout ✓ (CHECKOUT_003 사용)
- C-5: Approve rental checkout ✓ (CHECKOUT_005 사용)
- C-6: Status transition after approval ✓ (CHECKOUT_006 사용)
- C-7: Rental approval by wrong team ✓ (CHECKOUT_007 사용)

**Seed Data**: CHECKOUT_001~007 (모두 pending 상태, 서로 다른 record)

#### Subgroup 3B: Rejection Flow (6 scenarios - 순차)

**⚠️ 순차 실행 이유**: 같은 checkout을 reject하고 다시 검증하는 플로우

- C-9: Reject calibration checkout (CHECKOUT_015 사용)
- C-10: Reject repair checkout (CHECKOUT_016 사용)
- C-11: Status transition after rejection (위에서 reject한 record 검증)
- C-12: Cannot modify after approval (CHECKOUT_009 사용 - 이미 approved)
- C-13: Rejection reason required (새 checkout 생성)
- C-14: Rejection notification (새 checkout 생성)

**Seed Data**: CHECKOUT_015, 016 (pending), CHECKOUT_009 (approved)

---

### Group 4: Checkout Processing (부분 병렬) - 11 scenarios

**특징**: 서로 다른 approved checkout 사용

#### Subgroup 4A: Start Checkout (3 scenarios - 병렬)

- D-1: Start checkout → equipment status change ✓ (CHECKOUT_009 사용)
- D-2: technical_manager can start ✓ (CHECKOUT_010 사용)
- D-3: test_engineer cannot start (권한 확인) ✓ (CHECKOUT_011 사용)

**Seed Data**: CHECKOUT_009~011 (모두 approved 상태, 서로 다른 record)

#### Subgroup 4B: Return Processing (5 scenarios - 병렬)

- D-4: Return checkout with mandatory inspections ✓ (CHECKOUT_019 사용)
- D-5: Calibration inspection check ✓ (CHECKOUT_020 사용)
- D-6: Repair inspection check ✓ (CHECKOUT_022 사용)
- D-7: Working status check (always required) ✓ (CHECKOUT_021 사용)
- D-8: Approve return → restore to 'available' ✓ (CHECKOUT_042 사용)

**Seed Data**: CHECKOUT_019~022 (checked_out), CHECKOUT_042 (returned)

#### Subgroup 4C: Edge Cases (2 scenarios - 병렬)

- D-10: Return with notes ✓ (CHECKOUT_023 사용)
- D-11: Overdue checkout warning ✓ (CHECKOUT_056 사용)

**Seed Data**: CHECKOUT_023 (checked_out), CHECKOUT_056 (overdue)

#### Subgroup 4D: **CRITICAL Full Flow** (1 scenario - 순차, 별도 실행)

- D-9: Complete checkout→return flow validation 🔴
  - Create calibration checkout
  - Approve → status: 'approved'
  - Start checkout → equipment status: 'checked_out'
  - Return → status: 'returned'
  - Approve return → equipment status: 'available'

**새 데이터 생성**: 독립적인 checkout 생성하여 전체 플로우 검증

---

### Group 5: Rental 4-Step (완전 순차) - 10 scenarios

**특징**: 단일 rental checkout의 상태를 순차적으로 변경

#### Subgroup 5A: Sequential Flow (10 scenarios - 완전 순차)

**⚠️ 순차 실행 필수**: 같은 checkout record를 단계별로 진행

- E-1: Lender pre-checkout check (Step ①) (CHECKOUT_027 사용)
- E-2: Only lender technical_manager can pre-check (권한 검증)
- E-3: Cannot skip step order (lender → borrower)
- E-4: Borrower receipt check (Step ②) (E-1에서 진행한 CHECKOUT_027 사용)
- E-5: Only borrower technical_manager can receipt (권한 검증)
- E-6: Cannot skip order (borrower receipt after lender check)
- E-7: Borrower pre-return check (Step ③) (E-4에서 진행한 CHECKOUT_027 사용)
- E-8: Only borrower technical_manager can pre-return (권한 검증)
- E-9: Lender final return check (Step ④) (E-7에서 진행한 CHECKOUT_027 사용)
- E-10: Only lender technical_manager can final check (권한 검증)

**Seed Data**: CHECKOUT_027 (lender_checked 상태에서 시작)
**실행 방식**: 단일 spec 파일에 모든 시나리오를 순차적으로 배치

---

### Group 6: Team Constraints (병렬) - 2 scenarios

**특징**: 권한 검증, 읽기 전용

#### Subgroup 6A: Team Access Control (2 scenarios - 병렬)

- F-1: EMC team cannot access RF equipment (create) ✓
- F-2: EMC team cannot access RF equipment (approve) ✓

**Seed Data**: RF 장비 사용 (EQUIP_RECEIVER_UIW_W_ID 등)

---

## 실행 순서 및 전략

### Phase 1: Read-Only Tests (Group 1) - 18 scenarios

- 완전 병렬 실행 가능
- 실패 가능성 낮음 (데이터 수정 없음)
- 예상 실행 시간: 5-10분

### Phase 2: Create Workflow (Group 2) - 14 scenarios

- 병렬 실행 가능 (각 테스트가 새 데이터 생성)
- 유효성 검사 테스트 먼저, 생성 테스트 나중
- 예상 실행 시간: 10-15분

### Phase 3: Approval Flow (Group 3) - 12 scenarios

- Subgroup 3A: 병렬 (6 scenarios)
- Subgroup 3B: 순차 (6 scenarios)
- 예상 실행 시간: 10-15분

### Phase 4: Checkout Processing (Group 4) - 11 scenarios

- Subgroup 4A, 4B, 4C: 병렬 (10 scenarios)
- Subgroup 4D: 순차, 별도 실행 (1 scenario - CRITICAL)
- 예상 실행 시간: 10-15분

### Phase 5: Rental 4-Step (Group 5) - 10 scenarios

- 완전 순차 실행 (단일 spec 파일)
- 예상 실행 시간: 15-20분

### Phase 6: Team Constraints (Group 6) - 2 scenarios

- 병렬 실행
- 예상 실행 시간: 3-5분

---

## 테스트 파일 구조

```
apps/frontend/tests/e2e/checkouts/
├── group-1-read-only/
│   ├── 1a-list-basic.spec.ts          (4 scenarios, 병렬)
│   ├── 1b-search-filter.spec.ts       (5 scenarios, 병렬)
│   ├── 1c-detail-display.spec.ts      (3 scenarios, 병렬)
│   ├── 1d-permission-readonly.spec.ts (4 scenarios, 병렬)
│   └── 1e-display-edge.spec.ts        (2 scenarios, 병렬)
├── group-2-create/
│   ├── 2a-validation.spec.ts          (5 scenarios, 병렬)
│   ├── 2b-success-creation.spec.ts    (6 scenarios, 병렬)
│   └── 2c-creation-edge.spec.ts       (3 scenarios, 병렬)
├── group-3-approval/
│   ├── 3a-basic-approval.spec.ts      (6 scenarios, 병렬)
│   └── 3b-rejection-flow.spec.ts      (6 scenarios, 순차)
├── group-4-processing/
│   ├── 4a-start-checkout.spec.ts      (3 scenarios, 병렬)
│   ├── 4b-return-processing.spec.ts   (5 scenarios, 병렬)
│   ├── 4c-edge-cases.spec.ts          (2 scenarios, 병렬)
│   └── 4d-full-flow.spec.ts           (1 scenario, 순차) 🔴 CRITICAL
├── group-5-rental/
│   └── 5a-rental-4step.spec.ts        (10 scenarios, 완전 순차)
└── group-6-constraints/
    └── 6a-team-constraints.spec.ts    (2 scenarios, 병렬)
```

---

## 우선순위 기반 실행 계획

### 1차: 핵심 비즈니스 로직 검증 (P0)

- Group 4D: Full flow test (D-9) 🔴 **가장 중요**
- Group 5A: Rental 4-step workflow
- Group 3A: Basic approval flow
- Group 4A, 4B: Checkout/return processing

### 2차: 권한 및 제약 검증 (P1)

- Group 3B: Rejection flow
- Group 6A: Team constraints
- Group 1D: Permission read-only

### 3차: UI/UX 검증 (P2-P3)

- Group 1A, 1B, 1C: List/detail display
- Group 2A, 2B: Create workflow
- Group 1E, 4C: Edge cases

---

## 병렬 실행 설정 (playwright.config.ts)

```typescript
// Group 1, 2, 3A, 4A/B/C, 6: 병렬 실행
workers: 4, // 4개 워커 동시 실행

// Group 3B, 4D, 5: 순차 실행
fullyParallel: false, // 각 spec 파일 내에서 순차
```

---

## 총 시나리오 수: 68 scenarios

- Group 1 (Read-Only): 18 scenarios ✓ 병렬
- Group 2 (Create): 14 scenarios ✓ 병렬
- Group 3 (Approval): 12 scenarios (6 병렬 + 6 순차)
- Group 4 (Processing): 11 scenarios (10 병렬 + 1 순차)
- Group 5 (Rental 4-Step): 10 scenarios ✓ 순차
- Group 6 (Constraints): 2 scenarios ✓ 병렬

**예상 총 실행 시간**: 60-90분 (병렬 실행 포함)
