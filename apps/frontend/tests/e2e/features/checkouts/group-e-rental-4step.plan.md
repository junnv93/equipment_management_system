# Group E: Rental 4-Step Verification Tests

## Application Overview

Tests for the rental 4-step verification workflow in the Equipment Management System (UL-QP-18). Rental checkouts between laboratories require a 4-step bilateral verification process: (1) Lender pre-checkout check, (2) Borrower receipt check, (3) Borrower pre-return check, (4) Lender final return check. Each step involves condition assessment (appearance, operation, accessories) and enforces team-based permission constraints and strict sequential order. The UI is accessed via /checkouts/[id]/check which presents the EquipmentConditionForm for the appropriate step based on current checkout status.

## Test Scenarios

### 1. E1: Lender Pre-Checkout Check

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 1.1. E-1: Lender pre-checkout check (P0 - CRITICAL)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e1-lender-precheck.spec.ts`

**Steps:**

1. Login as technical_manager (Suwon) using techManagerPage fixture (lender team)
2. Navigate to /checkouts/CHECKOUT_013_ID (approved rental, Suwon lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID, destination: Uiwang)
3. Verify checkout status shows 'approved' (승인됨) badge via CHECKOUT_STATUS_LABELS.approved
4. Verify checkout purpose shows 'rental' (대여) badge via CHECKOUT_PURPOSE_LABELS.rental
5. Verify CheckoutStatusStepper shows rental 8-step flow with 'approved' step as current
6. Click the '상태 확인' button (visible for rental purpose in approved/checked_out/lender_checked/borrower_received/in_use/borrower_returned states)
7. Verify navigation to /checkouts/CHECKOUT_013_ID/check page
8. Verify page title shows '상태 확인' heading
9. Verify guidance message shows '장비를 반출하기 전에 현재 상태를 확인하고 기록해주세요' (lender_checkout step guidance)
10. Verify EquipmentConditionForm displays step label: '① 반출 전 확인 (빌려주는 측)' from CONDITION_CHECK_STEP_LABELS.lender_checkout
11. Verify the form contains: 외관 상태 radio group (normal/abnormal), 작동 상태 radio group (normal/abnormal), 부속품 상태 radio group (complete/incomplete), 추가 메모 textarea
12. Select '정상' (normal) for 외관 상태 (appearance)
13. Select '정상' (normal) for 작동 상태 (operation)
14. Select '완전' (complete) for 부속품 상태 (accessories)
15. Click '확인 완료' button to submit the condition check
16. Verify redirect back to /checkouts/CHECKOUT_013_ID detail page
17. Verify API response: POST /api/checkouts/CHECKOUT_013_ID/condition-check with step='lender_checkout', appearanceStatus='normal', operationStatus='normal'
18. Verify checkout status has transitioned to 'lender_checked' via API: GET /api/checkouts/CHECKOUT_013_ID returns status='lender_checked'
19. Verify status badge now shows '반출 전 확인 완료' (CHECKOUT_STATUS_LABELS.lender_checked)
20. Verify CheckoutStatusStepper shows 'lender_checked' step as current with 'approved' step completed (green checkmark)

**Expected Results:**

- Checkout status transitions from 'approved' to 'lender_checked'
- Condition check record is created with step='lender_checkout' and all normal statuses
- Status stepper updates to show lender_checked as the current step
- User is redirected back to checkout detail page after successful submission
- The '상태 확인' button remains visible for the next step (borrower_receive)

#### 1.2. E-2: Only lender technical_manager can pre-check (P1)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e1-lender-precheck.spec.ts`

**Steps:**

1. Login as technical_manager (Uiwang) - this is the BORROWER team's technical_manager, NOT the lender team
2. Navigate to /checkouts/CHECKOUT_013_ID (approved rental where lenderTeamId=TEAM_FCC_EMC_RF_SUWON_ID)
3. Verify the checkout detail page loads successfully showing status 'approved'
4. Attempt to click '상태 확인' button to navigate to the check page
5. Navigate to /checkouts/CHECKOUT_013_ID/check directly
6. Attempt to fill the condition check form and submit
7. Verify that the system rejects the submission with an error message indicating team permission violation
8. Alternatively, verify that the '상태 확인' button is not visible or disabled for the wrong team's technical_manager
9. Verify via API: POST /api/checkouts/CHECKOUT_013_ID/condition-check returns 403 Forbidden when called by Uiwang technical_manager for a lender_checkout step on a Suwon lender checkout
10. Login as test_engineer (Suwon) - correct team but wrong role
11. Navigate to /checkouts/CHECKOUT_013_ID
12. Verify that test_engineer cannot perform the lender pre-checkout check (button hidden/disabled or submission rejected)
13. Verify checkout status remains 'approved' (unchanged)

**Expected Results:**

- Borrower team's technical_manager cannot perform the lender pre-checkout check
- Test engineer from the correct team cannot perform the check (requires technical_manager role)
- An appropriate error message or UI restriction prevents unauthorized verification
- Checkout status remains unchanged at 'approved'
- No condition check record is created for unauthorized attempts

#### 1.3. E-3: Cannot skip step order (lender -> borrower) (P1)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e1-lender-precheck.spec.ts`

**Steps:**

1. Login as technical_manager (Uiwang) who would be the borrower team's technical_manager
2. Navigate to /checkouts/CHECKOUT_013_ID (approved rental, Step 1 NOT yet completed)
3. Verify checkout status is 'approved' - Step 1 (lender pre-checkout) has NOT been done yet
4. Attempt to submit a condition check with step='borrower_receive' (trying to skip step 1)
5. Via API: POST /api/checkouts/CHECKOUT_013_ID/condition-check with step='borrower_receive'
6. Verify the server returns an error (400 Bad Request) because the lender_checkout step must be completed first
7. Navigate to /checkouts/CHECKOUT_013_ID/check page
8. Verify that the check page shows step='lender_checkout' as the next required step (not borrower_receive)
9. Verify the page guidance text shows the lender checkout step guidance, NOT the borrower receive guidance
10. Verify via getNextCheckStep logic that 'approved' status maps to 'lender_checkout' step only

**Expected Results:**

- Cannot submit borrower_receive check when checkout is still in 'approved' status
- Server returns error for out-of-order step submission
- The check page correctly identifies lender_checkout as the next required step
- The step order is enforced: approved -> lender_checked -> borrower_received
- No condition check record is created for the skipped step

### 2. E2: Borrower Receipt Check

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 2.1. E-4: Borrower receipt check (P0 - CRITICAL)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e2-borrower-receipt.spec.ts`

**Steps:**

1. Login as technical_manager (Uiwang) - this is the borrower team's technical_manager
2. Navigate to /checkouts/CHECKOUT_027_ID (lender_checked rental, Suwon->Uiwang, lenderTeamId=TEAM_FCC_EMC_RF_SUWON_ID)
3. Verify checkout status shows 'lender_checked' (반출 전 확인 완료) via CHECKOUT_STATUS_LABELS.lender_checked
4. Verify CheckoutStatusStepper shows rental flow with 'lender_checked' as current step, 'approved' step completed
5. Click '상태 확인' button to navigate to check page
6. Verify navigation to /checkouts/CHECKOUT_027_ID/check
7. Verify guidance message: '장비를 인수받으셨습니다. 인수 시점의 장비 상태를 확인하고 기록해주세요.' (borrower_receive guidance)
8. Verify form step label: '② 인수 시 확인 (빌리는 측)' from CONDITION_CHECK_STEP_LABELS.borrower_receive
9. Select '정상' (normal) for 외관 상태
10. Select '정상' (normal) for 작동 상태
11. Select '완전' (complete) for 부속품 상태
12. Enter optional note: '인수 시 상태 양호' in 추가 메모
13. Click '확인 완료' button
14. Verify redirect to /checkouts/CHECKOUT_027_ID detail page
15. Verify API: POST /api/checkouts/CHECKOUT_027_ID/condition-check with step='borrower_receive'
16. Verify checkout status transitions to 'borrower_received'
17. Verify status badge shows '인수 확인 완료' (CHECKOUT_STATUS_LABELS.borrower_received)
18. Verify stepper shows 'borrower_received' as current, previous steps completed

**Expected Results:**

- Checkout status transitions from 'lender_checked' to 'borrower_received'
- Condition check record created with step='borrower_receive' and normal statuses
- Status stepper reflects the new borrower_received state
- User redirected to detail page with updated status
- The condition check history section now shows the borrower receipt entry

#### 2.2. E-5: Only borrower technical_manager can receipt (P1)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e2-borrower-receipt.spec.ts`

**Steps:**

1. Login as technical_manager (Suwon) - this is the LENDER team's technical_manager, not the borrower
2. Navigate to /checkouts/CHECKOUT_028_ID (lender_checked rental, Uiwang->Suwon, lenderTeamId=TEAM_GENERAL_RF_UIWANG_ID)
3. Verify checkout status shows 'lender_checked'
4. Attempt to navigate to /checkouts/CHECKOUT_028_ID/check and submit borrower_receive check
5. Verify the system rejects: Suwon technical_manager should NOT be able to do a borrower receipt check on a checkout where Uiwang is the lender (the borrower team needs to confirm receipt)
6. Via API: POST /api/checkouts/CHECKOUT_028_ID/condition-check with step='borrower_receive' - should return 403 for Suwon team
7. Login as test_engineer (Uiwang) - correct borrower team but wrong role
8. Attempt to submit the borrower receipt check
9. Verify test_engineer cannot perform the check (requires technical_manager role)
10. Verify checkout status remains 'lender_checked' (unchanged)

**Expected Results:**

- Lender team's technical_manager cannot perform borrower receipt check
- Test engineer from borrower team cannot perform the check (wrong role)
- Error message or UI restriction prevents unauthorized verification
- Checkout status remains unchanged at 'lender_checked'
- No unauthorized condition check records are created

#### 2.3. E-6: Cannot skip order (borrower receipt after lender check) (P1)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e2-borrower-receipt.spec.ts`

**Steps:**

1. Login as technical_manager (Uiwang) - borrower team
2. Navigate to /checkouts/CHECKOUT_013_ID (approved rental, Step 1 NOT completed - status is 'approved')
3. Attempt via API: POST /api/checkouts/CHECKOUT_013_ID/condition-check with step='borrower_receive'
4. Verify server returns 400 error: borrower receipt cannot happen before lender pre-checkout check
5. Navigate to /checkouts/CHECKOUT_013_ID/check page
6. Verify the check page shows 'lender_checkout' as next step (not 'borrower_receive')
7. Verify getNextCheckStep maps 'approved' -> 'lender_checkout', confirming the order enforcement
8. Also verify via the CHECKOUT_025_ID (checked_out rental) that the check page maps checked_out -> lender_checkout for rental purpose
9. Attempt to submit borrower_return or lender_return steps on a lender_checked checkout
10. Verify these out-of-order steps are rejected

**Expected Results:**

- Cannot perform borrower_receive before lender_checkout is completed
- Server enforces step ordering and returns appropriate error for out-of-order submissions
- The check page always shows the correct next step based on current status
- Status mapping: approved->lender_checkout, lender_checked->borrower_receive, borrower_received/in_use->borrower_return, borrower_returned->lender_return
- No condition check records created for skipped steps

### 3. E3: Borrower Pre-Return Check

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 3.1. E-7: Borrower pre-return check (P0 - CRITICAL)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e3-borrower-return.spec.ts`

**Steps:**

1. Login as technical_manager (Uiwang) - borrower team's technical_manager
2. Navigate to /checkouts/CHECKOUT_033_ID (in_use rental, Suwon->Uiwang, status='in_use')
3. Verify checkout status shows 'in_use' (사용 중) via CHECKOUT_STATUS_LABELS.in_use
4. Verify CheckoutStatusStepper shows rental flow with 'in_use' as current step, approved/lender_checked/borrower_received steps completed
5. Click '상태 확인' button
6. Verify navigation to /checkouts/CHECKOUT_033_ID/check
7. Verify guidance message: '장비를 반납하기 전에 현재 상태를 확인하고 기록해주세요. 인수 시 상태와 비교됩니다.' (borrower_return guidance)
8. Verify form step label: '③ 반납 전 확인 (빌린 측)' from CONDITION_CHECK_STEP_LABELS.borrower_return
9. Verify 이전 확인 기록 card is shown with the borrower_receive check data (if previous check exists, this step compares with borrower_receive)
10. Select '정상' (normal) for 외관 상태
11. Select '정상' (normal) for 작동 상태
12. Select '완전' (complete) for 부속품 상태
13. Click '확인 완료' button
14. Verify redirect to /checkouts/CHECKOUT_033_ID detail page
15. Verify API: POST /api/checkouts/CHECKOUT_033_ID/condition-check with step='borrower_return'
16. Verify checkout status transitions to 'borrower_returned'
17. Verify status badge shows '반납 전 확인 완료' (CHECKOUT_STATUS_LABELS.borrower_returned)
18. Verify stepper shows 'borrower_returned' as current step

**Expected Results:**

- Checkout status transitions from 'in_use' to 'borrower_returned'
- Condition check record created with step='borrower_return' and normal statuses
- If previous borrower_receive check exists, the comparison section is shown in the form
- Status stepper correctly reflects the borrower_returned state with all prior steps completed
- User is redirected to detail page with success feedback

#### 3.2. E-8: Only borrower technical_manager can pre-return (P1)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e3-borrower-return.spec.ts`

**Steps:**

1. Login as technical_manager (Suwon) - this is the LENDER team's technical_manager
2. Navigate to /checkouts/CHECKOUT_033_ID (in_use rental, Suwon->Uiwang lenderTeamId=TEAM_FCC_EMC_RF_SUWON_ID)
3. Verify checkout status shows 'in_use'
4. Attempt to navigate to /checkouts/CHECKOUT_033_ID/check
5. Attempt to submit a borrower_return condition check
6. Verify the system rejects: Suwon lender technical_manager cannot do the borrower pre-return check
7. Via API: POST /api/checkouts/CHECKOUT_033_ID/condition-check with step='borrower_return' returns 403 for Suwon team
8. Login as test_engineer (Uiwang) - correct borrower team but wrong role
9. Attempt to submit the borrower_return check
10. Verify test_engineer cannot perform the check
11. Verify checkout status remains 'in_use' (unchanged)

**Expected Results:**

- Lender team's technical_manager cannot perform borrower pre-return check (Step 3)
- Test engineer from borrower team cannot perform the check (wrong role)
- Error or UI restriction prevents unauthorized verification
- Checkout status remains 'in_use'
- No unauthorized condition check records created

### 4. E4: Lender Final Return Check

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 4.1. E-9: Lender final return check (P0 - CRITICAL)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e4-lender-final.spec.ts`

**Steps:**

1. Login as technical_manager (Suwon) - this is the lender team's technical_manager
2. Navigate to /checkouts/CHECKOUT_036_ID (borrower_returned rental, Suwon->Uiwang, lenderTeamId=TEAM_FCC_EMC_RF_SUWON_ID)
3. Verify checkout status shows 'borrower_returned' (반납 전 확인 완료) via CHECKOUT_STATUS_LABELS.borrower_returned
4. Verify CheckoutStatusStepper shows rental flow with 'borrower_returned' as current step, all prior steps completed
5. Click '상태 확인' button
6. Verify navigation to /checkouts/CHECKOUT_036_ID/check
7. Verify guidance message: '반납받은 장비의 상태를 확인해주세요. 반출 전 상태와 비교하여 변경 사항이 있다면 기록해주세요.' (lender_return guidance)
8. Verify form step label: '④ 반입 시 확인 (빌려준 측)' from CONDITION_CHECK_STEP_LABELS.lender_return
9. Verify 이전 확인 기록 card shows the lender_checkout (Step 1) check data for comparison (lender_return compares with lender_checkout)
10. Verify 이전 확인과 비교 textarea section is visible (needsComparison = true for lender_return step)
11. Select '정상' (normal) for 외관 상태
12. Select '정상' (normal) for 작동 상태
13. Select '완전' (complete) for 부속품 상태
14. Enter comparison note: '반출 전과 동일한 상태' in 이전 확인과 비교 field (optional when no changes)
15. Click '확인 완료' button
16. Verify redirect to /checkouts/CHECKOUT_036_ID detail page
17. Verify API: POST /api/checkouts/CHECKOUT_036_ID/condition-check with step='lender_return'
18. Verify checkout status transitions to 'lender_received'
19. Verify status badge shows '반입 확인 완료' (CHECKOUT_STATUS_LABELS.lender_received)
20. Verify stepper shows 'lender_received' as current with all prior steps completed
21. Verify condition check history section shows all 4 completed checks

**Expected Results:**

- Checkout status transitions from 'borrower_returned' to 'lender_received'
- Condition check record created with step='lender_return', normal statuses, and comparison notes
- The comparison section is shown with Step 1 (lender_checkout) data for reference
- Status stepper shows lender_received as current, all 7 prior steps completed
- All 4 condition check records are visible in the condition check history section
- The rental 4-step verification process is now complete

#### 4.2. E-10: Only lender technical_manager can final check (P1)

**File:** `apps/frontend/tests/e2e/checkouts/group-e/e4-lender-final.spec.ts`

**Steps:**

1. Login as technical_manager (Uiwang) - this is the BORROWER team's technical_manager
2. Navigate to /checkouts/CHECKOUT_036_ID (borrower_returned rental, Suwon->Uiwang, lenderTeamId=TEAM_FCC_EMC_RF_SUWON_ID)
3. Verify checkout status shows 'borrower_returned'
4. Attempt to navigate to /checkouts/CHECKOUT_036_ID/check
5. Attempt to submit a lender_return condition check
6. Verify the system rejects: Uiwang borrower technical_manager cannot do the lender final return check
7. Via API: POST /api/checkouts/CHECKOUT_036_ID/condition-check with step='lender_return' returns 403 for Uiwang team
8. Login as test_engineer (Suwon) - correct lender team but wrong role
9. Attempt to submit the lender_return check
10. Verify test_engineer cannot perform the check (requires technical_manager role)
11. Verify checkout status remains 'borrower_returned' (unchanged)

**Expected Results:**

- Borrower team's technical_manager cannot perform lender final return check (Step 4)
- Test engineer from lender team cannot perform the check (wrong role)
- Error or UI restriction prevents unauthorized final verification
- Checkout status remains 'borrower_returned'
- No unauthorized condition check records created
