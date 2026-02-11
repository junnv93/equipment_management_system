# Checkout/Rental E2E Integration Test Plan

## Application Overview

장비 관리 시스템의 대여/반출(Checkout) 전체 프로세스 E2E 테스트 플랜.

## 핵심 원칙

- **SSOT 준수**: 모든 상태값/라벨/ID는 @equipment-management/schemas, test-checkout-ids.ts에서 import
- **Backend+Frontend 통합 검증**: UI 변화와 함께 page.request.get()으로 API 직접 호출하여 DB 상태 검증
- **의존성 기반 그룹화**: 11개 독립 그룹이 서로 다른 Checkout ID를 사용하여 병렬 실행. 그룹 내 상태 변경 테스트는 serial

## Checkout ID 격리 전략

| 그룹                       | 사용 ID                   | 실행 모드 |
| -------------------------- | ------------------------- | --------- |
| Suite 1: 읽기 전용         | 015-018, 050-064 (읽기만) | parallel  |
| Suite 2: 폼 검증/생성      | 새로 생성 (격리)          | parallel  |
| Suite 3: 승인              | 001-003, 005              | serial    |
| Suite 4: 반려              | 004, 006-008              | serial    |
| Suite 5: 반출 처리         | 009-011                   | serial    |
| Suite 6: 반입 처리         | 019-022                   | serial    |
| Suite 7: 반입 승인         | 042-045                   | serial    |
| Suite 8: 전체 라이프사이클 | 새로 생성                 | serial    |
| Suite 9: 취소              | 새로 생성                 | serial    |
| Suite 10: 대여 4단계       | 027-041                   | serial    |
| Suite 11: 권한/보안        | 읽기만 + API 호출         | parallel  |

## 기술 스택

- Playwright + Custom Auth Fixtures (testOperatorPage, techManagerPage, siteAdminPage)
- SSOT: @equipment-management/schemas (CHECKOUT_STATUS_LABELS, CHECKOUT_PURPOSE_LABELS)
- Test Data: test-checkout-ids.ts, shared-test-data.ts
- Backend API: localhost:3001/api/checkouts/\*

## Test Scenarios

### 1. Suite 1: 읽기 전용 목록/상세 검증 (Parallel)

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 1.1. S1-01: 반출 목록 페이지 로드 및 데이터 표시

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-list-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts 네비게이션
2. 페이지 제목 heading 확인
3. 테이블에 데이터 행 1개 이상 존재 확인
4. 각 행에 장비명, 신청자, 상태 배지, 목적, 날짜 컬럼 확인
5. API 호출: GET /api/checkouts → meta.totalItems > 0 확인

**Expected Results:**

- 반출 목록 페이지가 200 상태로 로드
- 테이블에 시드 데이터 기반 반출 목록이 표시
- API 응답의 totalItems와 UI 테이블 행 수가 일치

#### 1.2. S1-02: 상태별 필터링 (pending/approved/checked_out)

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-list-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts 네비게이션
2. 상태 필터에서 CHECKOUT_STATUS_LABELS.pending 선택
3. 표시된 행의 상태 배지가 모두 해당 상태인지 확인
4. API: GET /api/checkouts?statuses=pending → items 모두 status=pending
5. 필터를 checked_out으로 변경 후 동일 검증

**Expected Results:**

- 필터 변경 시 UI가 즉시 업데이트
- UI에 표시된 결과가 API 응답과 일치
- SSOT 라벨 사용 확인

#### 1.3. S1-03: 목적별 필터링 (calibration/repair/rental)

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-list-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts 네비게이션
2. 목적 필터에서 CHECKOUT_PURPOSE_LABELS.calibration 선택
3. 행의 목적 컬럼이 모두 교정인지 확인
4. API: GET /api/checkouts?purpose=calibration → items 모두 purpose=calibration
5. 필터를 rental로 변경하여 대여만 표시 확인

**Expected Results:**

- 목적 필터가 정확히 해당 목적의 반출만 표시
- SSOT 라벨과 UI 표시 일치

#### 1.4. S1-04: 반출 상세 페이지 정보 표시

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-detail-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_050_ID 네비게이션
2. 반출 상세 heading 확인
3. 상태 배지: return_approved 라벨 표시 확인
4. 장비 목록, 신청자, 승인자, 반출일, 반입일 정보 표시 확인
5. API: GET /api/checkouts/CHECKOUT_050_ID → 데이터와 UI 일치

**Expected Results:**

- 상세 페이지의 모든 필드가 API 응답과 일치
- 완료된 반출에는 액션 버튼 없음
- SSOT 상태 라벨 정확히 표시

#### 1.5. S1-05: 거절된 반출 상세 - 거절 사유 표시

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-detail-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_017_ID 네비게이션
2. 상태 배지: CHECKOUT_STATUS_LABELS.rejected 표시 확인
3. 거절 사유 텍스트가 페이지에 표시 확인
4. API: GET /api/checkouts/CHECKOUT_017_ID → rejectionReason 확인
5. 액션 버튼 모두 없는지 확인

**Expected Results:**

- 거절 사유가 명확히 표시
- 워크플로우가 종료되어 액션 불가
- API rejectionReason과 UI 일치

#### 1.6. S1-06: 기한 초과(overdue) 반출 표시

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-detail-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_059_ID 네비게이션
2. 기한 초과 관련 경고 또는 배지 표시 확인
3. 예상 반입일이 과거 날짜인지 확인
4. API: GET /api/checkouts/CHECKOUT_059_ID → expectedReturnDate < now 확인

**Expected Results:**

- 기한 초과 반출이 시각적으로 구분
- 예상 반입일이 과거 날짜로 표시

#### 1.7. S1-07: 페이지네이션 동작

**File:** `tests/e2e/features/checkouts/suite-1-readonly/s1-list-display.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts 네비게이션
2. 전체 반출 수 확인 (API meta.totalItems)
3. 다음 페이지 이동 후 데이터 변경 확인
4. 이전 페이지로 복귀 확인

**Expected Results:**

- 페이지네이션이 정상 동작
- API meta.currentPage가 페이지 전환에 따라 변경

### 2. Suite 2: 반출 신청 폼 검증 및 생성 (Parallel)

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 2.1. S2-01: 필수 필드 미입력 시 폼 검증

**File:** `tests/e2e/features/checkouts/suite-2-creation/s2-form-validation.spec.ts`

**Steps:**

1. testOperatorPage로 /checkouts/create 네비게이션
2. 장비 선택 없이 반출 신청 버튼 클릭
3. 에러 메시지 확인
4. 장비 1개 선택 후 목적/장소/사유 비우고 제출 시도
5. 각 필수 필드의 에러 메시지 확인

**Expected Results:**

- 장비 미선택 시 에러 표시
- 각 필수 필드 미입력 시 에러 메시지
- 폼이 제출되지 않고 에러 상태 유지

#### 2.2. S2-02: 과거 날짜 반입 예정일 검증

**File:** `tests/e2e/features/checkouts/suite-2-creation/s2-form-validation.spec.ts`

**Steps:**

1. testOperatorPage로 /checkouts/create 네비게이션
2. 모든 필수 필드 입력
3. 반입 예정일을 과거 날짜로 설정
4. 반출 신청 클릭
5. 에러 메시지 확인
6. Backend 검증: POST /api/checkouts에 과거 날짜 → 400 응답

**Expected Results:**

- 프론트엔드에서 과거 날짜 에러 표시
- 백엔드에서도 400 에러 (이중 검증)

#### 2.3. S2-03: 교정 목적 반출 생성 성공

**File:** `tests/e2e/features/checkouts/suite-2-creation/s2-create-success.spec.ts`

**Steps:**

1. testOperatorPage로 /checkouts/create 네비게이션
2. available 장비 선택
3. 목적: 교정 선택, 장소/사유 입력
4. 반출 신청 클릭
5. 리디렉트 URL에서 checkout ID 추출
6. API: GET /api/checkouts/{id} → status=pending, purpose=calibration 확인

**Expected Results:**

- 반출 생성 성공, 상세 페이지 또는 목록으로 리디렉트
- API에서 status=pending, purpose=calibration 확인
- requesterId가 로그인 사용자와 일치

#### 2.4. S2-04: 수리 목적 반출 생성 성공

**File:** `tests/e2e/features/checkouts/suite-2-creation/s2-create-success.spec.ts`

**Steps:**

1. testOperatorPage로 /checkouts/create 네비게이션
2. 장비 선택
3. 목적: 수리 선택, 장소/사유 입력
4. 반출 신청 → API 확인: purpose=repair

**Expected Results:**

- 수리 목적 반출 생성 성공
- API purpose=repair 확인

#### 2.5. S2-05: 대여 목적 반출 생성 - 대여 전용 필드 검증

**File:** `tests/e2e/features/checkouts/suite-2-creation/s2-create-rental.spec.ts`

**Steps:**

1. testOperatorPage로 /checkouts/create 네비게이션
2. 장비 선택
3. 목적: 대여 선택
4. 대여 전용 필드(대여 제공 팀, 사이트) 표시 확인
5. 미입력 시 에러 확인
6. 대여 전용 필드 입력 후 나머지 입력
7. 신청 → API: purpose=rental, lenderTeamId/lenderSiteId 존재

**Expected Results:**

- 대여 선택 시 추가 필드 동적 표시
- 대여 전용 필드 필수이며 미입력 시 에러
- API에 lenderTeamId, lenderSiteId 포함

#### 2.6. S2-06: 부적합 장비 반출 차단 검증

**File:** `tests/e2e/features/checkouts/suite-2-creation/s2-form-validation.spec.ts`

**Steps:**

1. testOperatorPage로 /checkouts/create 네비게이션
2. 부적합 장비가 선택 불가하거나 경고 표시 확인
3. API 직접 호출: POST /api/checkouts에 부적합 장비 ID → 400 에러
4. 에러 메시지: '부적합 상태입니다' 확인

**Expected Results:**

- UI에서 부적합 장비 선택 불가
- 백엔드에서 400 에러 (비즈니스 규칙)

### 3. Suite 3: 승인 워크플로우 (Serial) - IDs: 001-003, 005

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 3.1. S3-01: 교정 반출 승인 (pending → approved) + API 검증

**File:** `tests/e2e/features/checkouts/suite-3-approval/s3-approval-workflow.spec.ts`

**Steps:**

1. beforeAll: API로 CHECKOUT_001-003, 005를 pending으로 리셋
2. techManagerPage로 /checkouts/CHECKOUT_001_ID 네비게이션
3. 승인/반려 버튼 모두 visible 확인
4. 승인 클릭
5. 승인/반려 not.toBeVisible, 반출 시작 visible 확인
6. API: GET /api/checkouts/CHECKOUT_001_ID → status=approved, approverId != null, approvedAt != null

**Expected Results:**

- 승인 후 status=approved (API 검증)
- UI에서 버튼 전환 정확
- approverId가 서버사이드에서 설정

#### 3.2. S3-02: 수리 반출 승인

**File:** `tests/e2e/features/checkouts/suite-3-approval/s3-approval-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_003_ID 네비게이션
2. 승인 클릭
3. 반출 시작 버튼 visible 확인
4. API: status=approved, purpose=repair

**Expected Results:**

- 수리 반출도 동일한 1단계 승인 프로세스
- 상태 전이 정상

#### 3.3. S3-03: 대여 반출 승인

**File:** `tests/e2e/features/checkouts/suite-3-approval/s3-approval-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_005_ID 네비게이션
2. 대여 텍스트 확인
3. 승인 클릭
4. 반출 시작 버튼 visible 확인
5. API: status=approved, purpose=rental

**Expected Results:**

- 대여 반출도 통합 1단계 승인
- 승인 후 반출 시작 버튼 표시

#### 3.4. S3-04: 승인 상태 페이지 새로고침 후 유지 확인

**File:** `tests/e2e/features/checkouts/suite-3-approval/s3-approval-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_002_ID 승인
2. 반출 시작 visible 확인
3. page.reload()
4. 새로고침 후에도 반출 시작 visible, 승인 not.toBeVisible 확인
5. API: status=approved 유지 확인

**Expected Results:**

- 승인 상태가 DB에 영구 저장되어 새로고침 후 유지
- 프론트엔드 캐시가 아닌 실제 DB 반영

### 4. Suite 4: 반려 워크플로우 (Serial) - IDs: 004, 006-008

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 4.1. S4-01: 교정 반출 반려 및 사유 저장 (pending → rejected)

**File:** `tests/e2e/features/checkouts/suite-4-rejection/s4-rejection-workflow.spec.ts`

**Steps:**

1. beforeAll: CHECKOUT_004, 006-008을 pending으로 리셋
2. techManagerPage로 /checkouts/CHECKOUT_007_ID 네비게이션
3. 반려 클릭 → dialog(name=반출 반려) 확인
4. 반려 사유 입력 → dialog 내 반려 버튼 클릭
5. 모든 액션 버튼 not.toBeVisible 확인
6. 거절 사유 텍스트 페이지에 표시 확인
7. API: status=rejected, rejectionReason 포함 확인

**Expected Results:**

- 반려 후 status=rejected (API 검증)
- rejectionReason 정확히 저장
- UI에 거절 사유 표시, 모든 액션 버튼 사라짐

#### 4.2. S4-02: 수리 반출 반려

**File:** `tests/e2e/features/checkouts/suite-4-rejection/s4-rejection-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_004_ID 네비게이션
2. 반려 → dialog에서 사유 입력 → 제출
3. API: status=rejected

**Expected Results:**

- 수리 반출 반려 성공, 사유 저장

#### 4.3. S4-03: 반려 사유 필수 검증 (빈 사유로 제출 불가)

**File:** `tests/e2e/features/checkouts/suite-4-rejection/s4-rejection-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_008_ID 네비게이션
2. 반려 클릭하여 dialog 오픈
3. dialog 내 반려 버튼이 disabled 확인 (사유 미입력)
4. 사유 입력 후 enabled 확인
5. 제출
6. Backend 검증: POST /api/checkouts/{id}/reject에 빈 reason → 400

**Expected Results:**

- 프론트엔드: 빈 사유 제출 방지 (버튼 disabled)
- 백엔드: 빈 사유 거부 (이중 검증)

#### 4.4. S4-04: 대여 반출 반려 - 대여 워크플로우 종료

**File:** `tests/e2e/features/checkouts/suite-4-rejection/s4-rejection-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_006_ID 네비게이션
2. 대여 텍스트 확인
3. 반려 → dialog → 사유 → 제출
4. 대여 전용 버튼(반출 전 확인 등) not.toBeVisible 확인
5. API: status=rejected

**Expected Results:**

- 대여 반출 반려 시 4단계 워크플로우 버튼도 모두 사라짐
- 워크플로우 완전 종료

#### 4.5. S4-05: 거절된 반출 수정 불가 확인

**File:** `tests/e2e/features/checkouts/suite-4-rejection/s4-rejection-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /checkouts/CHECKOUT_015_ID (시드 - rejected)
2. rejected 라벨 확인
3. 승인/반려/반출시작/수정 버튼 모두 없음 확인
4. Backend: PATCH /api/checkouts/CHECKOUT_015_ID → 400

**Expected Results:**

- 거절된 반출은 UI와 API 모두에서 수정 불가
- 워크플로우 종료 상태가 영구적

### 5. Suite 5: 반출 처리 (Serial) - IDs: 009-011

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 5.1. S5-01: 반출 시작 → 장비 상태 checked_out 전이

**File:** `tests/e2e/features/checkouts/suite-5-processing/s5-start-checkout.spec.ts`

**Steps:**

1. 사전 API: CHECKOUT_009_ID status=approved 확인
2. siteAdminPage로 /checkouts/CHECKOUT_009_ID 네비게이션
3. approved 배지 확인
4. 반출 시작 클릭 → 확인
5. 반출 중 배지 확인, 반입 처리 링크 visible
6. API: status=checked_out, checkoutDate != null
7. ★ API 장비 검증: equipment.status=checked_out

**Expected Results:**

- 반출 시작 후 checkout status=checked_out
- 장비 상태가 checked_out으로 변경 (핵심 비즈니스)
- checkoutDate 타임스탬프 설정

#### 5.2. S5-02: 승인되지 않은 반출 시작 차단 (API)

**File:** `tests/e2e/features/checkouts/suite-5-processing/s5-start-checkout.spec.ts`

**Steps:**

1. Backend 직접 호출: POST /api/checkouts/CHECKOUT_010_ID/start
2. approved가 아닌 상태에서 start 시도 → 400 확인
3. 에러: '승인된 반출만 반출할 수 있습니다'

**Expected Results:**

- pending 상태에서 직접 start 불가
- 400 BadRequest 응답

#### 5.3. S5-03: 다중 장비 반출 시작 → 모든 장비 일괄 변경

**File:** `tests/e2e/features/checkouts/suite-5-processing/s5-start-checkout.spec.ts`

**Steps:**

1. siteAdminPage로 CHECKOUT_011_ID (다중 장비, approved)
2. 반출 시작 클릭 → 확인
3. API: status=checked_out
4. 각 checkout_item의 equipmentId에 대해 equipment.status=checked_out 확인

**Expected Results:**

- 다중 장비 반출 시 모든 장비가 일괄 checked_out
- 원자적 처리

### 6. Suite 6: 반입 처리 및 검사 (Serial) - IDs: 019-022

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 6.1. S6-01: 교정 반출 반입 처리 (calibrationChecked + workingStatusChecked 필수)

**File:** `tests/e2e/features/checkouts/suite-6-return/s6-return-inspections.spec.ts`

**Steps:**

1. 사전 API: CHECKOUT_019_ID status=checked_out, purpose=calibration
2. techManagerPage로 /checkouts/CHECKOUT_019_ID 네비게이션
3. 반입 처리 링크 또는 반입 신청 버튼 클릭
4. 교정 확인 체크 + 작동 상태 확인 체크 + 비고 입력
5. 반입 신청 제출
6. API: status=returned, calibrationChecked=true, workingStatusChecked=true
7. ★ API 장비: equipment.status=checked_out 유지 (반입 승인 전)

**Expected Results:**

- 반입 처리 후 status=returned
- 검사 항목 정확히 저장
- 장비 상태는 아직 checked_out 유지

#### 6.2. S6-02: 수리 반출 반입 처리 (repairChecked + workingStatusChecked 필수)

**File:** `tests/e2e/features/checkouts/suite-6-return/s6-return-inspections.spec.ts`

**Steps:**

1. 사전 API: CHECKOUT_020_ID status=checked_out, purpose=repair
2. 반입 신청 → 수리 확인 + 작동 확인 체크 → 제출
3. API: status=returned, repairChecked=true

**Expected Results:**

- 수리 반출은 repairChecked 필수
- 검사 항목 정확히 저장

#### 6.3. S6-03: 교정 반출에서 교정 확인 미체크 시 에러 (API)

**File:** `tests/e2e/features/checkouts/suite-6-return/s6-return-inspections.spec.ts`

**Steps:**

1. Backend: POST /api/checkouts/CHECKOUT_021_ID/return body: {workingStatusChecked:true, calibrationChecked:false}
2. 응답: 400 '교정 목적 반출의 경우 교정 확인은 필수입니다'
3. workingStatusChecked 미체크 테스트: {calibrationChecked:true, workingStatusChecked:false}
4. 응답: 400 '작동 여부 확인은 필수입니다'

**Expected Results:**

- 교정 반출: calibrationChecked + workingStatusChecked 모두 필수
- 필수 검사 누락 시 400 에러

#### 6.4. S6-04: checked_out이 아닌 상태에서 반입 차단 (API)

**File:** `tests/e2e/features/checkouts/suite-6-return/s6-return-inspections.spec.ts`

**Steps:**

1. Backend: POST /api/checkouts/{non_checked_out_id}/return
2. pending/approved 상태에서 반입 시도 → 400
3. 에러: '반출 중인 반출만 반입할 수 있습니다'

**Expected Results:**

- checked_out 상태에서만 반입 가능
- 비즈니스 규칙 백엔드 검증

### 7. Suite 7: 반입 승인 (Serial) - IDs: 042-045

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 7.1. S7-01: 반입 승인 → 장비 상태 available 복원 (핵심 비즈니스)

**File:** `tests/e2e/features/checkouts/suite-7-return-approval/s7-return-approval.spec.ts`

**Steps:**

1. 사전 API: CHECKOUT_042_ID status=returned
2. techManagerPage로 /checkouts/CHECKOUT_042_ID 네비게이션
3. 반입 승인 버튼 클릭 → 확인
4. return_approved 배지 확인
5. API: status=return_approved, returnApprovedBy != null, returnApprovedAt != null
6. ★★ API 핵심: equipment.status=available (복원!)

**Expected Results:**

- 반입 승인 후 status=return_approved
- ★ 핵심: 장비 상태가 available로 복원 (가장 중요한 비즈니스 로직)
- returnApprovedBy에 승인자 ID 설정

#### 7.2. S7-02: returned가 아닌 상태에서 반입 승인 차단 (API)

**File:** `tests/e2e/features/checkouts/suite-7-return-approval/s7-return-approval.spec.ts`

**Steps:**

1. Backend: PATCH /api/checkouts/{non_returned_id}/approve-return
2. 응답: 400 '검사 완료된(returned) 반입만 최종 승인 가능'

**Expected Results:**

- returned 상태에서만 반입 승인 가능
- 비즈니스 규칙 백엔드 검증

#### 7.3. S7-03: 다중 장비 반입 승인 → 모든 장비 available 복원

**File:** `tests/e2e/features/checkouts/suite-7-return-approval/s7-return-approval.spec.ts`

**Steps:**

1. CHECKOUT_044_ID (다중 장비, returned) 반입 승인
2. 각 checkout_item의 equipmentId에 대해 equipment.status=available 확인

**Expected Results:**

- 다중 장비 반입 승인 시 모든 장비가 일괄 available 복원

### 8. Suite 8: 전체 라이프사이클 (Serial) - 새로 생성

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 8.1. S8-01: 완전한 교정 반출 라이프사이클 (pending→approved→checked_out→returned→return_approved)

**File:** `tests/e2e/features/checkouts/suite-8-lifecycle/s8-full-lifecycle.spec.ts`

**Steps:**

1. STEP 1: testOperatorPage로 반출 생성 (교정, 장비 선택, 폼 입력, 제출)
2. API 검증: status=pending, equipment.status=available
3. STEP 2: techManagerPage로 승인
4. API: status=approved, approverId != null
5. STEP 3: 반출 시작 클릭
6. API: status=checked_out, ★ equipment.status=checked_out
7. STEP 4: 반입 처리 (교정확인+작동확인 체크, 비고 입력)
8. API: status=returned, ★ equipment.status=checked_out (유지)
9. STEP 5: 반입 승인
10. API: status=return_approved, ★★ equipment.status=available (복원!)
11. STEP 6: 장비 상세 페이지에서 사용가능 확인

**Expected Results:**

- 5단계 상태 전이 모두 성공
- 장비 상태: available → checked_out → available 완전 사이클
- 각 단계에서 적절한 타임스탬프와 사용자 ID 기록
- ★ 이 테스트는 전체 시스템의 핵심 비즈니스 로직을 E2E로 검증

#### 8.2. S8-02: 완전한 수리 반출 라이프사이클

**File:** `tests/e2e/features/checkouts/suite-8-lifecycle/s8-full-lifecycle.spec.ts`

**Steps:**

1. S8-01과 동일한 흐름이나 purpose=repair
2. STEP 4에서 repairChecked + workingStatusChecked 필수
3. 각 단계 API 검증 동일 수행

**Expected Results:**

- 수리 반출의 전체 라이프사이클 검증
- 교정과 다른 필수 검사 항목 확인

### 9. Suite 9: 취소 워크플로우 (Serial)

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 9.1. S9-01: pending 반출 취소 성공

**File:** `tests/e2e/features/checkouts/suite-9-cancel/s9-cancel-flow.spec.ts`

**Steps:**

1. testOperatorPage로 새 반출 생성
2. 생성된 반출 상세 페이지로 이동
3. 취소 버튼 또는 삭제 기능 클릭
4. 확인 dialog 처리
5. API: status=canceled

**Expected Results:**

- pending 상태 반출만 취소 가능
- 취소 후 status=canceled

#### 9.2. S9-02: approved 이후 취소 불가 (API)

**File:** `tests/e2e/features/checkouts/suite-9-cancel/s9-cancel-flow.spec.ts`

**Steps:**

1. Backend: PATCH /api/checkouts/{approved_id}/cancel
2. 응답: 400 '승인 전 반출만 취소할 수 있습니다'
3. checked_out, returned 상태에서도 동일 시도 → 400

**Expected Results:**

- pending 외 상태에서 취소 불가
- 비즈니스 규칙 백엔드 검증

### 10. Suite 10: 대여 4단계 워크플로우 (Serial) - IDs: 027-041

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 10.1. S10-01: 대여자 반출 전 확인 (Step ①)

**File:** `tests/e2e/features/checkouts/suite-10-rental/s10-rental-4step.spec.ts`

**Steps:**

1. 적절한 역할 페이지로 /checkouts/CHECKOUT_027_ID 네비게이션
2. 반출 전 확인 (대여자) 버튼 클릭 → 확인
3. API: 상태 전이 확인
4. CheckoutStatusStepper에서 Step ① 완료 표시

**Expected Results:**

- 대여자 반출 전 확인 완료
- 상태 전이 정확

#### 10.2. S10-02: 차용자 수령 확인 (Step ②)

**File:** `tests/e2e/features/checkouts/suite-10-rental/s10-rental-4step.spec.ts`

**Steps:**

1. /checkouts/CHECKOUT_030_ID (lender_checked) 네비게이션
2. 수령 확인 (차용자) 버튼 클릭 → 확인
3. API: 상태 전이 확인

**Expected Results:**

- 차용자 수령 확인 완료

#### 10.3. S10-03: 차용자 반입 전 확인 (Step ③)

**File:** `tests/e2e/features/checkouts/suite-10-rental/s10-rental-4step.spec.ts`

**Steps:**

1. /checkouts/CHECKOUT_033_ID (in_use) 네비게이션
2. 반입 전 확인 (차용자) 버튼 클릭 → 확인
3. API: 상태 전이 확인

**Expected Results:**

- 차용자 반입 전 확인 완료

#### 10.4. S10-04: 대여자 최종 확인 (Step ④)

**File:** `tests/e2e/features/checkouts/suite-10-rental/s10-rental-4step.spec.ts`

**Steps:**

1. /checkouts/CHECKOUT_036_ID (borrower_returned) 네비게이션
2. 반입 최종 확인 (대여자) 버튼 클릭 → 확인
3. API: status=lender_received 확인
4. Stepper 모든 4단계 완료 표시

**Expected Results:**

- 대여 4단계 워크플로우 완료
- 각 단계별 상태 전이 순서대로

#### 10.5. S10-05: 대여 4단계 순서 위반 차단 (API)

**File:** `tests/e2e/features/checkouts/suite-10-rental/s10-rental-4step.spec.ts`

**Steps:**

1. Step ① 완료 전에 Step ② 시도 (API 직접 호출)
2. 순서 위반 시 에러 응답 확인

**Expected Results:**

- 대여 4단계는 순서를 건너뛸 수 없음
- 비즈니스 규칙에 의해 순서 강제

### 11. Suite 11: 권한 및 보안 검증 (Parallel)

**Seed:** `tests/e2e/features/checkouts/seed.spec.ts`

#### 11.1. S11-01: test_engineer는 승인/반려 불가

**File:** `tests/e2e/features/checkouts/suite-11-permissions/s11-role-permissions.spec.ts`

**Steps:**

1. testOperatorPage로 pending 반출 상세 네비게이션
2. 승인/반려 버튼 not.toBeVisible 확인
3. Backend: PATCH approve (test_engineer JWT) → 403
4. Backend: PATCH reject → 403

**Expected Results:**

- test_engineer에게 승인/반려 버튼 미표시
- API에서도 403 Forbidden
- 이중 보안: UI + API

#### 11.2. S11-02: approverId 서버사이드 추출 검증

**File:** `tests/e2e/features/checkouts/suite-11-permissions/s11-role-permissions.spec.ts`

**Steps:**

1. techManagerPage로 승인 API 호출 시 body에 다른 사용자 ID 전송
2. 응답에서 approverId가 세션 사용자 ID인지 확인
3. 클라이언트 전송값이 무시되는지 확인

**Expected Results:**

- approverId가 req.user.userId에서 추출
- 클라이언트 위장 불가

#### 11.3. S11-03: EMC팀은 RF팀 장비 반출 차단

**File:** `tests/e2e/features/checkouts/suite-11-permissions/s11-role-permissions.spec.ts`

**Steps:**

1. EMC팀 사용자로 RF팀 장비 반출 생성 API 호출
2. 응답: 403 'EMC팀은 RF팀 장비 반출 권한 없음'

**Expected Results:**

- 팀 기반 접근 제어 동작
- EMC ↔ RF 크로스팀 반출 차단

#### 11.4. S11-04: lab_manager 자가 승인 가능

**File:** `tests/e2e/features/checkouts/suite-11-permissions/s11-role-permissions.spec.ts`

**Steps:**

1. siteAdminPage로 새 반출 생성
2. 동일 사용자가 승인
3. API: requesterId = approverId 확인

**Expected Results:**

- lab_manager는 자가 승인 가능
- UL-QP-18 역할 규칙 준수
