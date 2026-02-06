# Group F: Permission Tests

## Application Overview

This test plan covers the role-based permission system and team-based access control in the equipment management system. The system enforces two layers of access control:

1. **Role-Based Permissions (RBAC)**: Each user role (test_engineer, technical_manager, quality_manager, lab_manager) has a predefined set of permissions defined in ROLE_PERMISSIONS (packages/shared-constants/src/role-permissions.ts). The PermissionsGuard on the backend checks these permissions on every API endpoint via the @RequirePermissions decorator. Error message: '이 작업을 수행할 권한이 없습니다.'

2. **Team-Based Constraints**: Equipment belongs to specific teams. The checkTeamPermission helper in checkouts.service.ts enforces that EMC-type team users cannot create or approve checkouts for RF-type team equipment. Error message: 'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다.'

**Key Architecture Details:**

- All test users are assigned to TEAM_FCC_EMC_RF_SUWON_ID (type=FCC_EMC_RF) via auth.controller.ts test-login
- RF team equipment is in Uiwang (TEAM_GENERAL_RF_UIWANG_ID, type=GENERAL_RF): EQUIP_RECEIVER_UIW_W_ID (UIW-W0001), EQUIP_TRANSMITTER_UIW_W_ID (UIW-W0002)
- FCC EMC/RF team equipment is in Suwon: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID (SUW-E0001), EQUIP_SIGNAL_GEN_SUW_E_ID (SUW-E0002)
- The team constraint: if userTeam.type.toUpperCase() === 'EMC' and equipmentTeam.type.toUpperCase() === 'RF', throws ForbiddenException
- Frontend ROLE_TABS: test_engineer=[], technical_manager=[8 tabs], quality_manager=[2 tabs], lab_manager=[2 tabs]
- Only lab_manager gets auto-approval on equipment creation (isLabManager check in equipment.controller.ts)
- UL-QP-18 separation of duties: CREATE_CALIBRATION is only for test_engineer (explicitly excluded from technical_manager)

**Auth Fixtures:**

- testOperatorPage: test_engineer (TEAM_FCC_EMC_RF_SUWON_ID)
- techManagerPage: technical_manager (TEAM_FCC_EMC_RF_SUWON_ID)
- siteAdminPage: lab_manager (TEAM_FCC_EMC_RF_SUWON_ID)

**Technology:** Next.js 16, React 19, NestJS, Playwright E2E, NextAuth

## Test Scenarios

### 1. Suite 1: Team Constraints - Checkout Creation and Approval

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 1.1. F-1: EMC team user cannot create checkout for RF team equipment

**File:** `tests/e2e/permissions/f1-team-constraints.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager, assigned to TEAM_FCC_EMC_RF_SUWON_ID, team type FCC_EMC_RF)
2. Navigate to /checkouts/create page
3. Verify the page loads with heading '장비 반출 신청'
4. In the equipment search area, type 'RF 수신기' or 'UIW-W' in the search input to find RF team equipment
5. Observe whether RF team equipment (UIW-W0001 'RF 수신기 (공용)') appears in the available equipment list
6. If the RF equipment appears, click the Plus icon button next to it to select it
7. Verify the selected equipment shows in the '선택된 장비' section
8. Fill in checkout form: select purpose '교정' from the dropdown, enter destination '외부 교정 기관' in the destination input, enter reason '정기 교정 의뢰' in the reason textarea
9. Select expectedReturnDate as 7 days from today using the date picker
10. Click the '반출 신청' submit button
11. Wait for the API response and verify an error toast appears
12. Verify the error toast message contains 'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다' or a related permission error
13. Verify the page does NOT redirect to /checkouts (remains on /checkouts/create)
14. Verify no success toast '반출 신청 완료' appears

**Expected Results:**

- The checkout creation page loads at /checkouts/create with heading '장비 반출 신청'
- RF team equipment may appear in the available list since the frontend queries all available equipment; the team constraint is enforced by the backend
- When the form is submitted with RF team equipment selected, the backend returns HTTP 403 Forbidden
- Error toast displays with message related to 'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다'
- The user remains on /checkouts/create page - no redirect occurs
- No checkout record is created in the system

#### 1.2. F-1 (positive): EMC team user CAN create checkout for same-team equipment

**File:** `tests/e2e/permissions/f1-team-constraints.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager, TEAM_FCC_EMC_RF_SUWON_ID)
2. Navigate to /checkouts/create page
3. Verify the page loads with heading '장비 반출 신청'
4. Search for same-team equipment by typing '스펙트럼 분석기' or 'SUW-E' in the search input
5. Verify that FCC EMC/RF team equipment (SUW-E0001 '스펙트럼 분석기') appears in the available equipment list
6. Click the Plus icon button next to the available equipment to select it
7. Verify the selected equipment appears in '선택된 장비 (1)' section with equipment name and management number
8. Fill in checkout form: purpose='교정', destination='한국표준과학연구원', reason='정기 교정 의뢰 - 연간 교정 계획', expectedReturnDate=14 days from today
9. Click the '반출 신청' submit button
10. Verify success toast '반출 신청 완료' appears with description '반출 신청이 성공적으로 접수되었습니다.'
11. Verify the page redirects to /checkouts

**Expected Results:**

- Same-team (FCC EMC/RF, Suwon) equipment is visible and selectable in the equipment list
- The checkout creation succeeds with HTTP 201 from the backend
- Success toast '반출 신청 완료' is displayed
- Page redirects to /checkouts after successful submission
- The new checkout appears in the checkout list with '승인 대기' status badge

#### 1.3. F-2: EMC team technical_manager cannot approve checkout containing RF team equipment

**File:** `tests/e2e/permissions/f1-team-constraints.spec.ts`

**Steps:**

1. Precondition: This test requires a pending checkout containing RF team equipment. Since all test users belong to the FCC EMC/RF team, a checkout for RF equipment may need to be created via direct API call to the backend with a custom team context. Document the expected behavior.
2. Option A - Direct API test: Using techManagerPage, make a PATCH request to /api/checkouts/{checkout-uuid}/approve for a checkout that contains RF equipment
3. Include the request body { "approverNotes": "Approved" }
4. Verify the API returns HTTP 403 with message 'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다'
5. Option B - UI flow: If a pending checkout with RF equipment exists in the approvals list, navigate to /admin/approvals and click the '반출' tab
6. Locate the pending checkout with RF equipment and click '승인'
7. Verify the approval fails and an error message appears
8. Verify the checkout status remains unchanged at 'pending' (승인 대기)

**Expected Results:**

- When a technical_manager from the EMC team tries to approve a checkout for RF team equipment, the backend checkTeamPermission check throws ForbiddenException
- The API returns HTTP 403 Forbidden with message 'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다'
- If tested via UI, an error toast appears and the checkout remains in pending status
- The team constraint applies to both checkout creation and approval - both are blocked for cross-team (EMC to RF) actions

#### 1.4. F-2 (positive): EMC team technical_manager CAN approve checkout for same-team equipment

**File:** `tests/e2e/permissions/f1-team-constraints.spec.ts`

**Steps:**

1. Step 1 (Setup - create a pending checkout): Log in as testOperatorPage (test_engineer)
2. Navigate to /checkouts/create page
3. Search for and select an available FCC EMC/RF equipment item (e.g., SUW-E0001 or SUW-E0002)
4. Fill in checkout form: purpose='교정', destination='외부 교정 기관', reason='정기 교정', expectedReturnDate=14 days
5. Submit the form and verify success toast and redirect to /checkouts
6. Note: the checkout is now in 'pending' status waiting for approval
7. Step 2 (Approve): Log in as techManagerPage (technical_manager)
8. Navigate to /admin/approvals page
9. Click on the '반출' (checkout) tab
10. Find the pending checkout created in Step 1 (identify by equipment name or management number)
11. Click the '승인' button on the checkout item
12. If an approval detail modal appears, click '승인' to confirm
13. Verify success toast indicating checkout approved
14. Verify the checkout status changes to '승인됨' (approved)
15. Navigate to /checkouts and verify the checkout now shows 'approved' status

**Expected Results:**

- test_engineer successfully creates a checkout for same-team equipment (pending status)
- technical_manager from the same team can view and approve the checkout
- Approval succeeds with a success toast message
- The checkout status transitions from '승인 대기' (pending) to '승인됨' (approved)
- This confirms that same-team checkout approval works correctly without team constraint violation

### 2. Suite 2: Role Permissions - test_engineer Boundaries

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 2.1. F-3a: test_engineer can view equipment list and detail pages

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as testOperatorPage fixture (test_engineer role)
2. Navigate to /equipment page
3. Verify the equipment list page loads successfully with heading containing '장비 목록' or similar
4. Verify at least one equipment item is visible in the list (either table row or card)
5. Click on the first equipment item to navigate to its detail page (/equipment/[id])
6. Verify the equipment detail page loads showing the equipment name, management number, status badge, and other details
7. Navigate back to /equipment using the browser back button or a navigation link
8. Verify the equipment list page loads again correctly

**Expected Results:**

- Equipment list page loads with equipment items visible (VIEW_EQUIPMENT permission is granted to test_engineer)
- Equipment detail page renders with complete information including name, management number, status, team, calibration info
- Navigation between list and detail works correctly
- This confirms test_engineer has VIEW_EQUIPMENT permission

#### 2.2. F-3b: test_engineer can create checkout requests

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as testOperatorPage fixture (test_engineer role)
2. Navigate to /checkouts/create page
3. Verify the page loads with heading '장비 반출 신청'
4. Search for an available equipment item in the search field
5. Select an available equipment item by clicking the Plus button
6. Fill in checkout form: purpose='교정', destination='교정 기관', reason='교정 의뢰', expectedReturnDate=7 days from now
7. Click '반출 신청' submit button
8. Verify success toast '반출 신청 완료' appears
9. Verify redirect to /checkouts page

**Expected Results:**

- Checkout creation page loads successfully (CREATE_CHECKOUT permission granted to test_engineer)
- The checkout is created with 'pending' status (test_engineer cannot self-approve)
- Success toast and redirect confirm successful creation
- This validates CREATE_CHECKOUT permission for test_engineer

#### 2.3. F-3c: test_engineer can create equipment registration requests (approval pending)

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as testOperatorPage fixture (test_engineer role)
2. Navigate to /equipment/create page
3. Verify the page loads and shows a permission/role banner indicating '시험실무자' and '승인 필요'
4. Check that the submit button text contains '승인 요청' rather than just '등록'
5. Fill in basic equipment information: name='권한테스트장비', select site 'suwon'
6. Select a team from the team dropdown after site selection
7. Enter serial number '9999' for the management number
8. Fill in model name='테스트 모델', manufacturer='테스트 제조사', serial number='SN-TEST-001'
9. Select calibration method '외부 교정' and fill calibration cycle=12
10. Click the submit button
11. If a confirmation modal appears, click the confirm button
12. Verify the response toast indicates '등록 요청 완료' or '장비 등록 요청이 생성되었습니다'
13. Verify the user is redirected to /equipment page

**Expected Results:**

- Equipment creation page shows role banner for test_engineer with '승인 필요' indicator
- Submit button text includes '승인 요청' (not direct registration)
- The form submission creates an equipment request, not a direct equipment record
- Toast message confirms the approval request was created
- The backend returns { message: '장비 등록 요청이 생성되었습니다.', requestUuid: '...' }
- The equipment does NOT immediately appear in the equipment list

#### 2.4. F-3d: test_engineer CANNOT access approval actions - no approval tabs on approvals page

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as testOperatorPage fixture (test_engineer role)
2. Navigate to /admin/approvals page
3. Observe the page content - verify there are no approval tabs visible
4. Verify there are no '승인' or '반려' action buttons anywhere on the page
5. Check that the page shows an empty state or an informational message about no available approval categories
6. Attempt to navigate to a specific approval tab URL like /admin/approvals?tab=checkout
7. Verify the tab does not activate or show any approval items

**Expected Results:**

- The approvals page renders but shows no approval tabs (ROLE_TABS[test_engineer] = [])
- No '승인' or '반려' buttons are visible
- The page may show a message like 'No approval categories available' or redirect to dashboard
- test_engineer has zero approval-related permissions (no APPROVE_CHECKOUT, APPROVE_EQUIPMENT, APPROVE_CALIBRATION, etc.)

#### 2.5. F-3e: test_engineer CANNOT approve checkouts via direct API call (backend enforcement)

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as testOperatorPage fixture (test_engineer role)
2. Obtain a valid checkout UUID (from seed data or a checkout created in a previous test)
3. Make a direct API request using page.request.fetch() or page.evaluate() to call PATCH http://localhost:3001/api/checkouts/{uuid}/approve with body { "approverNotes": "test" }
4. Include the current session's authorization headers (the session token from NextAuth)
5. Verify the response status code is 403 (Forbidden)
6. Parse the response JSON and verify the error message is '이 작업을 수행할 권한이 없습니다.'

**Expected Results:**

- The backend PermissionsGuard checks that APPROVE_CHECKOUT permission is required for the approve endpoint
- test_engineer does not have APPROVE_CHECKOUT permission (only technical_manager and lab_manager do)
- The API returns HTTP 403 Forbidden
- Response body contains { message: '이 작업을 수행할 권한이 없습니다.' }
- This confirms backend-level permission enforcement independent of the UI

#### 2.6. F-3f: test_engineer CANNOT approve equipment requests via direct API call

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as testOperatorPage fixture (test_engineer role)
2. Make a direct API request to approve an equipment request (e.g., PATCH http://localhost:3001/api/equipment/requests/{uuid}/approve)
3. Include the current session's authorization headers
4. Verify the response status code is 403 (Forbidden)
5. Verify the error message is '이 작업을 수행할 권한이 없습니다.'

**Expected Results:**

- The API returns HTTP 403 Forbidden
- The error confirms test_engineer lacks APPROVE_EQUIPMENT permission
- This validates backend-level role enforcement for equipment approval

### 3. Suite 3: Role Permissions - technical_manager Capabilities and Boundaries

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 3.1. F-4a: technical_manager can access approvals page with exactly 8 tabs

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals page
3. Verify the page loads successfully with the approvals layout
4. Count the number of visible tabs in the TabsList component
5. Verify the following 8 tabs are present by their labels: '장비', '교정 기록', '중간점검', '반출', '반입', '공용/렌탈', '부적합 재개', '폐기 검토'
6. Click on the '반출' tab and verify the content area updates
7. Click on the '장비' tab and verify the content area updates
8. Click on the '교정 기록' tab and verify the content area updates
9. Verify that '폐기 승인' tab is NOT present (that's for lab_manager)
10. Verify that '교정계획서 승인' tab is NOT present (that's for lab_manager)
11. Verify that '교정계획서 검토' tab is NOT present (that's for quality_manager)

**Expected Results:**

- The approvals page loads with exactly 8 tabs matching ROLE_TABS[technical_manager]
- All 8 tabs are clickable and load their respective approval list content
- The '폐기 승인' (disposal_final), '교정계획서 승인' (plan_final), '교정계획서 검토' (plan_review), and '소프트웨어' (software) tabs are NOT visible
- This confirms the role-based tab filtering logic in ApprovalsClient component

#### 3.2. F-4b: technical_manager can approve equipment registration requests

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Precondition: A pending equipment registration request should exist (created by test_engineer in F-3c or from seed data)
2. Log in as techManagerPage fixture (technical_manager role)
3. Navigate to /admin/approvals page
4. Click on the '장비' (equipment) tab
5. Look for pending equipment registration requests in the approval list
6. If a pending request is found, click '상세' or '승인' button on it
7. In the detail modal, review the equipment information
8. Click '승인' to approve the equipment request
9. Verify success toast message indicating approval was successful
10. Verify the item moves out of the pending list

**Expected Results:**

- The '장비' tab shows pending equipment requests (if any exist)
- technical_manager can approve equipment requests (APPROVE_EQUIPMENT permission)
- After approval, the equipment is created with 'approved' status and becomes visible in the equipment list
- Success toast confirms the approval action

#### 3.3. F-4c: technical_manager can approve and reject checkout requests

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals page
3. Click on the '반출' (checkout) tab
4. If pending checkout requests exist (from same team), click '승인' on one
5. Verify the approval succeeds with success toast
6. Navigate back to '반출' tab
7. If another pending checkout exists, click '반려' to reject it
8. In the RejectModal, enter a rejection reason with at least 10 characters: '장비 상태 확인이 필요합니다. 재확인 후 재신청 바랍니다.'
9. Submit the rejection
10. Verify the rejection succeeds with success toast

**Expected Results:**

- technical_manager has APPROVE_CHECKOUT and REJECT_CHECKOUT permissions
- Checkout approval changes status from 'pending' to 'approved'
- Checkout rejection changes status from 'pending' to 'rejected' with reason stored
- The RejectModal requires minimum 10 characters for the rejection reason

#### 3.4. F-4d: technical_manager CANNOT create calibration records (UL-QP-18 separation of duties)

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager role)
2. Navigate to an equipment detail page: /equipment/{EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}
3. Observe the equipment detail page for any calibration creation button or link
4. Verify that no '교정 등록' or '교정 기록 등록' button is visible for technical_manager
5. Make a direct API call: POST http://localhost:3001/api/calibrations with a calibration record payload
6. Include authorization headers from the current session
7. Verify the API returns HTTP 403 Forbidden
8. Verify the error message is '이 작업을 수행할 권한이 없습니다.'

**Expected Results:**

- The technical_manager does not have CREATE_CALIBRATION permission (explicitly excluded per UL-QP-18 policy)
- The UI hides or disables calibration creation controls for technical_manager
- Direct API call returns HTTP 403 Forbidden
- This enforces separation of duties: test_engineer creates calibration records, technical_manager approves them
- The API response confirms: { message: '이 작업을 수행할 권한이 없습니다.' }

#### 3.5. F-4e: technical_manager CANNOT perform lab_manager-only actions (final disposal approval, final plan approval)

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals page
3. Verify that '폐기 승인' (disposal_final) tab is NOT visible in the tabs list
4. Verify that '교정계획서 승인' (plan_final) tab is NOT visible in the tabs list
5. Make a direct API call to POST http://localhost:3001/api/equipment/{equipment-id}/disposal/approve with body { "decision": "approve" }
6. Verify the API returns HTTP 403 Forbidden
7. Make a direct API call to approve a calibration plan as final approver
8. Verify the API returns HTTP 403 Forbidden
9. Navigate to /admin/approvals?tab=disposal_final directly via URL
10. Verify the tab does not activate or shows no content

**Expected Results:**

- The '폐기 승인' and '교정계획서 승인' tabs are not rendered for technical_manager
- Direct API calls to final approval endpoints return HTTP 403
- This confirms the role hierarchy boundary: disposal final approval (APPROVE_DISPOSAL) and plan final approval (APPROVE_CALIBRATION_PLAN) require lab_manager role
- technical_manager has disposal_review (REVIEW_DISPOSAL) but not disposal approval (APPROVE_DISPOSAL)

#### 3.6. F-4f: technical_manager CAN approve calibration records but CANNOT create them

**File:** `tests/e2e/permissions/f2-role-permissions.spec.ts`

**Steps:**

1. Log in as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals page and click on '교정 기록' (calibration) tab
3. Verify the tab is accessible and shows pending calibration approval requests (if any exist)
4. If a pending calibration record exists, click '승인' to approve it
5. Verify the approval succeeds, confirming APPROVE_CALIBRATION permission
6. Then verify that creating a calibration record is not possible: attempt POST /api/calibrations via direct API call
7. Confirm the creation attempt returns HTTP 403

**Expected Results:**

- technical_manager has APPROVE_CALIBRATION and VIEW_CALIBRATION_REQUESTS permissions
- technical_manager can view and approve pending calibration records
- technical_manager does NOT have CREATE_CALIBRATION permission
- This validates the UL-QP-18 principle: registration and approval are completely separated
- test_engineer registers calibration records, technical_manager approves them
