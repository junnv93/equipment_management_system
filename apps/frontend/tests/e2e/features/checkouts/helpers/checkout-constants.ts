/**
 * Checkout Test Constants - Suite-Specific ID Allocation
 *
 * ## 설계 원칙
 *
 * 1. **사이트 정합성**: techManagerPage/testOperatorPage/siteAdminPage는 Suwon 소속.
 *    이 fixture를 사용하는 스위트는 반드시 Suwon 소속 checkout만 참조해야 함.
 *    (SiteScopeInterceptor가 다른 사이트 접근을 403으로 차단)
 *
 * 2. **ID 격리**: Serial 스위트는 전용 ID 풀 사용. beforeAll에서 리셋하므로
 *    원래 상태(status)는 무관 — 사이트(site)와 목적(purpose)만 중요.
 *
 * 3. **Read-only 공유**: 상태 변경 없는 병렬 스위트는 ID 공유 허용.
 *
 * ## Fixture → Site 매핑
 *
 * | Fixture           | Role               | Site   | Scope       |
 * |-------------------|--------------------|--------|-------------|
 * | testOperatorPage  | test_engineer      | suwon  | team only   |
 * | techManagerPage   | technical_manager  | suwon  | team only   |
 * | siteAdminPage     | lab_manager        | suwon  | site (suwon)|
 * | qualityManagerPage| quality_manager    | suwon  | all (전체)  |
 *
 * ## 사이트별 시드 데이터 분포
 *
 * Suwon(40): 001-003,005,007,009,011,013,015,017,019,021-022,024-025,027,029-030,
 *            032-033,035-036,038-039,041-042,044,046,048,050,052,054,056,058-059,
 *            061-062,064-065,067
 * Uiwang(28): 004,006,008,010,012,014,016,018,020,023,026,028,031,034,037,040,
 *             043,045,047,049,051,053,055,057,060,063,066,068
 *
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts
 * @see apps/frontend/tests/e2e/shared/constants/test-checkout-ids.ts
 */

import {
  CHECKOUT_001_ID,
  CHECKOUT_002_ID,
  CHECKOUT_003_ID,
  CHECKOUT_005_ID,
  CHECKOUT_007_ID,
  CHECKOUT_009_ID,
  CHECKOUT_011_ID,
  CHECKOUT_013_ID,
  CHECKOUT_014_ID,
  CHECKOUT_015_ID,
  CHECKOUT_016_ID,
  CHECKOUT_017_ID,
  CHECKOUT_018_ID,
  CHECKOUT_019_ID,
  CHECKOUT_021_ID,
  CHECKOUT_022_ID,
  CHECKOUT_024_ID,
  CHECKOUT_025_ID,
  CHECKOUT_027_ID,
  CHECKOUT_029_ID,
  CHECKOUT_030_ID,
  CHECKOUT_032_ID,
  CHECKOUT_033_ID,
  CHECKOUT_035_ID,
  CHECKOUT_036_ID,
  CHECKOUT_038_ID,
  CHECKOUT_039_ID,
  CHECKOUT_041_ID,
  CHECKOUT_042_ID,
  CHECKOUT_044_ID,
  CHECKOUT_046_ID,
  CHECKOUT_048_ID,
  CHECKOUT_050_ID,
  CHECKOUT_052_ID,
  CHECKOUT_054_ID,
  CHECKOUT_056_ID,
  CHECKOUT_058_ID,
  CHECKOUT_059_ID,
  CHECKOUT_061_ID,
  CHECKOUT_062_ID,
  CHECKOUT_064_ID,
  CHECKOUT_065_ID,
  CHECKOUT_067_ID,
} from '../../../shared/constants/test-checkout-ids';

import { TEST_EQUIPMENT_IDS, TEST_USER_IDS } from '../../../shared/constants/shared-test-data';

// ============================================================================
// Suite 01: Read-Only (parallel) — techManagerPage (Suwon)
// 기존 시드 데이터 조회만, 상태 변경 없음
// ============================================================================
export const SUITE_01 = {
  RETURN_APPROVED: CHECKOUT_050_ID, // Suwon, return_approved, calibration
  REJECTED: CHECKOUT_017_ID, // Suwon, rejected, rental
  OVERDUE: CHECKOUT_059_ID, // Suwon, overdue, calibration
  CANCELED: CHECKOUT_062_ID, // Suwon, canceled, calibration
} as const;

// ============================================================================
// Suite 03: Approval (serial) — techManagerPage (Suwon)
// pending → approved. beforeAll: resetToPending
// ============================================================================
export const SUITE_03 = {
  CALIBRATION: CHECKOUT_001_ID, // Suwon, pending, calibration
  REPAIR: CHECKOUT_003_ID, // Suwon, pending, repair
  RENTAL: CHECKOUT_005_ID, // Suwon, pending, rental
  PERSISTENCE: CHECKOUT_002_ID, // Suwon, pending, calibration (DB 영속성 체크)
} as const;

// ============================================================================
// Suite 04: Rejection (serial) — techManagerPage (Suwon)
// pending → rejected. beforeAll: resetToPending
// ============================================================================
export const SUITE_04 = {
  CALIBRATION: CHECKOUT_065_ID, // Suwon, pending, calibration
  REPAIR: CHECKOUT_024_ID, // Suwon, (seed: checked_out repair) → resetToPending
  EMPTY_REASON: CHECKOUT_007_ID, // Suwon, pending, calibration (빈 사유 테스트)
  RENTAL: CHECKOUT_054_ID, // Suwon, (seed: return_approved rental) → resetToPending
} as const;

// ============================================================================
// Suite 05: Start (serial) — techManagerPage (Suwon)
// approved → checked_out. beforeAll: resetToApproved
// ============================================================================
export const SUITE_05 = {
  APPROVED_CAL: CHECKOUT_009_ID, // Suwon, approved, calibration
  PENDING_BLOCK: CHECKOUT_056_ID, // Suwon, overdue (승인 차단 테스트)
  APPROVED_MULTI: CHECKOUT_032_ID, // Suwon, (seed: borrower_received) → resetToApproved
} as const;

// ============================================================================
// Suite 06: Return (serial) — techManagerPage (Suwon)
// checked_out → returned. beforeAll: resetToCheckedOut
// ============================================================================
export const SUITE_06 = {
  CALIBRATION: CHECKOUT_019_ID, // Suwon, checked_out, calibration
  REPAIR: CHECKOUT_022_ID, // Suwon, checked_out, repair
  MISSING_CHECK: CHECKOUT_021_ID, // Suwon, checked_out, calibration (필수항목 누락 테스트)
  WRONG_STATUS: CHECKOUT_015_ID, // Suwon, rejected (반입 불가 400 테스트)
} as const;

// ============================================================================
// Suite 07: Return Approval (serial) — techManagerPage (Suwon)
// returned → return_approved. beforeAll: resetToReturned
// ============================================================================
export const SUITE_07 = {
  CALIBRATION: CHECKOUT_042_ID, // Suwon, returned, calibration
  WRONG_STATUS: CHECKOUT_029_ID, // Suwon, lender_checked (반입승인 불가 400 테스트)
  MULTI: CHECKOUT_044_ID, // Suwon, returned, repair
} as const;

// ============================================================================
// Suite 10: Rental 4-Step (serial) — techManagerPage (Suwon)
// condition check API 상태 전이. beforeAll: resetRentalToApproved
// ⚠️ 대여는 크로스팀이지만, requester가 Suwon이어야 Suwon TM 접근 가능
// ============================================================================
export const SUITE_10 = {
  STEP1_LENDER: CHECKOUT_041_ID, // Suwon, (seed: lender_received rental) → resetToApproved
  STEP2_BORROWER: CHECKOUT_027_ID, // Suwon, lender_checked, rental
  STEP3_RETURN: CHECKOUT_033_ID, // Suwon, borrower_received, rental
  STEP4_FINAL: CHECKOUT_036_ID, // Suwon, borrower_returned, rental
  ORDER_VIOLATION: CHECKOUT_035_ID, // Suwon, (seed: borrower_received) → resetToApproved
  HISTORY: CHECKOUT_030_ID, // Suwon, borrower_received, rental (이력 조회)
} as const;

// ============================================================================
// Suite 13: Data Scope (parallel) — multi-role (의도적 크로스 사이트)
// 역할별 데이터 스코프 검증 — 읽기 전용
// ============================================================================
export const SUITE_13 = {
  SUWON_CHECKOUT: CHECKOUT_050_ID, // Suwon (공유: Suite 01)
  UIWANG_CHECKOUT: CHECKOUT_016_ID, // Uiwang (의도적 — 스코프 검증용)
  PYEONGTAEK_CHECKOUT: CHECKOUT_018_ID, // Uiwang (의도적 — 스코프 검증용)
} as const;

// ============================================================================
// Suite 14: Create Rules (parallel) — testOperatorPage (Suwon)
// API 레벨 검증, 동적 생성
// ============================================================================
export const SUITE_14 = {
  // 장비 ID 직접 사용 (checkout ID 불필요)
} as const;

// ============================================================================
// Suite 15: Return Rejection (serial) — techManagerPage (Suwon)
// returned → checked_out (반입 반려). beforeAll: resetToReturnedViaAPI
// ============================================================================
export const SUITE_15 = {
  CALIBRATION_RETURN: CHECKOUT_048_ID, // Suwon, returned, calibration (교정 반입 반려)
  REPAIR_RETURN: CHECKOUT_044_ID, // Suwon, returned, repair (수리 반입 반려)
  // ⚠️ 048은 Suite 18(read-only)과 공유, 044는 Suite 07과 공유
  // beforeAll이 resetToReturnedViaAPI로 복원하므로 안전
} as const;

// ============================================================================
// Suite 16: Rental UI Lifecycle (serial) — techManagerPage (Suwon)
// 대여 4단계 UI 플로우. beforeAll: resetRentalCheckoutToApproved
// ============================================================================
export const SUITE_16 = {
  RENTAL_APPROVED: CHECKOUT_038_ID, // Suwon, (seed: borrower_returned rental) → resetToApproved
  RENTAL_CHECKED_OUT_1: CHECKOUT_025_ID, // Suwon, checked_out, rental
  RENTAL_CHECKED_OUT_2: CHECKOUT_064_ID, // Suwon, (seed: canceled rental) → resetToCheckedOut if needed
  RENTAL_LENDER_CHECKED: CHECKOUT_058_ID, // Suwon, (seed: overdue rental) → reset if needed
  RENTAL_LENDER_RECEIVED: CHECKOUT_039_ID, // Suwon, lender_received, rental
} as const;

// ============================================================================
// Suite 17: Overdue (parallel) — techManagerPage (Suwon)
// 기한초과 시나리오 — 읽기 전용
// ============================================================================
export const SUITE_17 = {
  OVERDUE_PENDING: CHECKOUT_058_ID, // Suwon, overdue, rental (공유: Suite 16, 읽기 전용)
  OVERDUE_CHECKED_OUT: CHECKOUT_061_ID, // Suwon, overdue, rental
  OVERDUE_DETAIL: CHECKOUT_059_ID, // Suwon, overdue, calibration (공유: Suite 01)
} as const;

// ============================================================================
// Suite 18: QM Read-Only + Role Permissions (parallel) — multi-role
// 역할별 권한 종합 검증 — 읽기 전용
// ============================================================================
export const SUITE_18 = {
  PENDING: CHECKOUT_002_ID, // Suwon, pending, calibration (공유: Suite 03)
  APPROVED: CHECKOUT_013_ID, // Suwon, approved, rental
  CHECKED_OUT: CHECKOUT_067_ID, // Suwon, checked_out, calibration
  RETURNED: CHECKOUT_048_ID, // Suwon, returned, calibration
  RETURN_APPROVED: CHECKOUT_050_ID, // Suwon, return_approved, calibration (공유: Suite 01/13)
  CANCELED: CHECKOUT_062_ID, // Suwon, canceled, calibration (공유: Suite 01)
} as const;

// ============================================================================
// Suite 19: Equipment Imports (serial) — techManagerPage (Suwon)
// 외부 장비 반입 — 동적 생성
// ============================================================================
export const SUITE_19 = {
  // 동적 생성 — checkout ID 불필요
} as const;

// ============================================================================
// Suite 20: Cache Invalidation (serial) — techManagerPage (Suwon)
// 캐시 무효화 검증. beforeAll: 동적 checkout 생성
// ============================================================================
export const SUITE_20 = {
  PENDING_FOR_APPROVE: CHECKOUT_052_ID, // Suwon, return_approved, repair → reset to pending
  APPROVED_FOR_START: CHECKOUT_011_ID, // Suwon, approved, repair → reset to approved
} as const;

// ============================================================================
// Shared References
// ============================================================================
export const EQUIP = TEST_EQUIPMENT_IDS;
export const USERS = TEST_USER_IDS;

import { BASE_URLS } from '../../../shared/constants/shared-test-data';
export const BACKEND_URL = BASE_URLS.BACKEND;
