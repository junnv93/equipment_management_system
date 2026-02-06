# Approvals Page - Disposal Workflow Test Plan

## Application Overview

This test plan covers the disposal approval workflow on the unified Approvals page (/admin/approvals). The page uses a tabbed interface (ApprovalsClient component) where different approval categories are displayed based on the logged-in user's role. This plan focuses on the `disposal_review` tab (visible to technical_manager) and `disposal_final` tab (visible to lab_manager).

**2-Stage Disposal Approval Workflow:**

1. Request: Any role with REQUEST_DISPOSAL permission requests equipment disposal
2. Review: technical_manager reviews pending requests from their own team (disposal_review tab) -- reviewStatus changes to 'reviewed' on approve, 'rejected' on reject
3. Final Approval: lab_manager approves reviewed requests from any team (disposal_final tab) -- equipment.status changes to 'disposed' on approve, reverts on reject

**Key UI Components:**

- ApprovalsClient: Tab container with role-based tab filtering (ROLE_TABS)
- ApprovalList: Renders list of pending items with count description
- ApprovalItemCard: Individual item with status badge, requester info, step indicator, and action buttons (approve/reject/detail)
- RejectModal: Dialog with 10-char minimum reason field and template selector
- ApprovalDetailModal: Read-only detail view with approve/reject actions
- BulkActionBar: Bulk approve/reject with select-all checkbox
- ApprovalStepIndicator: 3-step visual progress (Request -> Review -> Approval)

**API Layer:**

- Pending review list: GET /api/disposal-requests/pending-review (Permission: REVIEW_DISPOSAL)
- Pending approval list: GET /api/disposal-requests/pending-approval (Permission: APPROVE_DISPOSAL)
- Review action: POST /api/equipment/:id/disposal/review -- body: { decision, opinion }
- Approve action: POST /api/equipment/:id/disposal/approve -- body: { decision, comment? }

**Auth Fixture Roles:**

- techManagerPage: technical_manager (Suwon team) -- sees disposal_review tab
- siteAdminPage: lab_manager -- sees disposal_final tab
- testOperatorPage: test_engineer -- no approval access (redirect to dashboard)

**Technology:** Next.js 16 App Router, React 19, NextAuth, Playwright E2E

## Test Scenarios

### 1. Suite 1: Disposal Review Tab (technical_manager)

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 1.1. 1.1 - Review and approve same-team pending disposal request

**File:** `tests/e2e/approvals-disposal/review-approve-same-team.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role, Suwon team)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for page to load and verify heading '승인 관리' is visible
4. Verify the '폐기 검토' tab is visible and active in the tab list
5. Wait for the approval list to render (wait for '승인 대기 목록' heading in card)
6. Verify at least one approval item card is displayed (data-testid='approval-item')
7. Locate the first approval item card showing a Suwon team equipment disposal
8. Verify the item shows status badge '대기' (pending status with orange styling)
9. Verify the 3-step ApprovalStepIndicator is displayed (data-testid='step-indicator') showing disposal workflow steps
10. Verify requester name, team, and request date are displayed in the item card
11. Click the '검토완료' button (green, contains CheckCircle2 icon) on the first item
12. Verify the toast notification appears with text '승인 완료' and includes the item summary
13. Wait for React Query invalidation to complete (wait for list to refresh)
14. Verify the approved item has been removed from the pending list
15. Verify the list count description updates (e.g., count decreases by 1)

**Expected Results:**

- The '폐기 검토' tab is visible for technical_manager and shows a pending count badge
- Approval item cards show correct metadata: status badge, requester info, request date, step indicator
- Clicking '검토완료' button triggers the approval API call POST /api/equipment/:id/disposal/review with decision='approve'
- Toast notification '승인 완료' appears confirming the action
- The approved item disappears from the list immediately after the action
- The count in the tab badge and list description updates accordingly

#### 1.2. 1.2 - Review and reject same-team pending disposal request

**File:** `tests/e2e/approvals-disposal/review-reject-same-team.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role, Suwon team)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for the approval list to load with pending items
4. Locate a pending disposal review item from the Suwon team
5. Click the '반려' button (red/destructive, contains XCircle icon) on the item
6. Verify the RejectModal dialog opens with title '반려'
7. Verify the dialog description includes the item summary text
8. Verify the '사유 템플릿' dropdown selector is present with options: 직접 입력, 서류 미비, 정보 오류, 절차 미준수, 타당성 부족
9. Select the '타당성 부족' template from the dropdown
10. Verify the textarea is populated with the template text about insufficient justification
11. Click the '반려' submit button in the modal (red/destructive styling)
12. Verify the toast notification appears with text '반려 완료'
13. Verify the RejectModal dialog closes
14. Verify the rejected item disappears from the pending list
15. Verify the list count description updates

**Expected Results:**

- The RejectModal opens correctly with proper ARIA attributes (role='dialog', aria-modal='true')
- Template selector populates the textarea with pre-defined rejection reasons
- Rejection API call POST /api/equipment/:id/disposal/review is sent with decision='reject' and the opinion text
- Toast notification '반려 완료' confirms the rejection
- The rejected item is removed from the list and count badge decrements
- Equipment status should revert to its original state (not pending_disposal)

#### 1.3. 1.3 - Rejection reason validation requires minimum 10 characters

**File:** `tests/e2e/approvals-disposal/review-reject-validation.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for the approval list to load with at least one pending item
4. Click the '반려' button on the first pending disposal item
5. Verify the RejectModal dialog opens
6. Leave the rejection reason textarea empty
7. Click the '반려' submit button in the modal
8. Verify an error message appears: '반려 사유는 10자 이상 입력해주세요.'
9. Verify the error has role='alert' and aria-live='assertive' for screen readers
10. Type '짧은 사유' (5 characters) into the reason textarea
11. Click the '반려' submit button again
12. Verify the error message still shows (5 chars < 10 minimum)
13. Clear the textarea and type '반려 사유를 충분히 작성합니다. 폐기 근거 부족합니다.' (10+ characters)
14. Click the '반려' submit button
15. Verify the dialog closes (indicating successful submission)
16. Verify toast notification '반려 완료' appears

**Expected Results:**

- Empty reason field triggers validation error '반려 사유는 10자 이상 입력해주세요.'
- Reason with fewer than 10 characters triggers the same validation error
- Error message has proper accessibility attributes (role='alert', aria-live='assertive')
- Once 10+ characters are entered, form submits successfully
- The modal closes and toast confirms rejection

#### 1.4. 1.4 - View item detail via ApprovalDetailModal before reviewing

**File:** `tests/e2e/approvals-disposal/review-detail-modal.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for the approval list to load
4. Click the '상세' button (outline variant, contains Eye icon) on a pending disposal item
5. Verify the ApprovalDetailModal opens (role='dialog', aria-modal='true')
6. Verify the modal title is '승인 요청 상세'
7. Verify the modal description says '요청 내용을 확인하고 승인 또는 반려를 진행하세요.'
8. Verify the status badge '대기' is shown in the modal header
9. Verify the item summary text is displayed prominently
10. Verify '요청자' name, '소속' team, and '요청일시' date are displayed
11. Verify the '승인 진행 상태' section with ApprovalStepIndicator is shown (disposal type, 3 steps)
12. Verify the '요청 상세' section shows disposal details (reason, reasonDetail, equipmentId)
13. Verify the footer has three buttons: '닫기' (outline), '검토완료' (green), '반려' (red)
14. Click the '검토완료' button in the modal footer
15. Verify the item is approved (toast '승인 완료' appears)
16. Verify the modal closes

**Expected Results:**

- ApprovalDetailModal displays all metadata: status, summary, requester info, team, date
- 3-step approval indicator shows correctly for disposal type (요청 -> 검토 -> 승인)
- Request detail section renders key-value pairs from the disposal request
- Approve action from the detail modal works the same as from the list
- Modal closes after successful action

### 2. Suite 2: Disposal Final Approval Tab (lab_manager)

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 2.1. 2.1 - Final approve a reviewed disposal request

**File:** `tests/e2e/approvals-disposal/final-approve.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture (lab_manager role)
2. Navigate to /admin/approvals?tab=disposal_final
3. Wait for page to load and verify heading '승인 관리' is visible
4. Verify the '폐기 승인' tab is visible and active in the tab list
5. Wait for the approval list to render with the '승인 대기 목록' card heading
6. Verify at least one item is displayed with status badge '검토 완료' (reviewed status with blue styling)
7. Verify the ApprovalStepIndicator shows step 2 (검토) as completed (green checkmark) and step 3 (승인) as current
8. Verify the action button text is '승인' (not '검토완료') as defined in TAB_META for disposal_final
9. Click the '승인' button (green, contains CheckCircle2 icon) on the first reviewed item
10. Verify toast notification appears with text '승인 완료' and includes item summary
11. Wait for React Query invalidation and list refresh
12. Verify the approved item is removed from the pending list
13. Verify the disposal_final tab count badge decrements or disappears

**Expected Results:**

- The '폐기 승인' tab is visible exclusively for lab_manager role (not visible to technical_manager)
- Items in the disposal_final tab show '검토 완료' status (already reviewed by technical_manager)
- The action button label is '승인' (final approval, not review)
- Clicking '승인' sends POST /api/equipment/:id/disposal/approve with decision='approve'
- Toast '승인 완료' confirms the action
- The item is removed from the list; equipment status changes to 'disposed' in the database

#### 2.2. 2.2 - Final reject a reviewed disposal request

**File:** `tests/e2e/approvals-disposal/final-reject.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture (lab_manager role)
2. Navigate to /admin/approvals?tab=disposal_final
3. Wait for the approval list to load with reviewed items
4. Click the '반려' button (red/destructive) on a reviewed disposal item
5. Verify the RejectModal dialog opens with title '반려'
6. Verify the dialog description references the item summary
7. Type a rejection reason with 10+ characters: '최종 승인 단계에서 반려합니다. 추가 검토가 필요합니다.'
8. Click the '반려' submit button in the modal
9. Verify toast notification '반려 완료' appears
10. Verify the dialog closes
11. Verify the rejected item disappears from the pending list
12. Verify the tab count badge updates

**Expected Results:**

- RejectModal opens with correct context for the selected item
- Rejection with 10+ char reason succeeds
- API call POST /api/equipment/:id/disposal/approve is sent with decision='reject' and comment
- Toast '반려 완료' confirms the rejection
- The item is removed from the list
- Equipment status should revert to its previous state (not disposed, not pending_disposal)

#### 2.3. 2.3 - Lab manager can approve disposal from any team (cross-team)

**File:** `tests/e2e/approvals-disposal/final-approve-cross-team.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture (lab_manager role)
2. Navigate to /admin/approvals?tab=disposal_final
3. Wait for the approval list to load
4. Examine the list to find items from different teams (check '팀' field in each ApprovalItemCard)
5. If items from multiple teams exist, verify they are all visible (no team-based filtering for lab_manager)
6. Click the '상세' button on an item that shows a different team name (e.g., UIW or Uiwang team)
7. Verify the ApprovalDetailModal opens and shows the different team in '소속' field
8. Click '승인' button in the detail modal
9. Verify toast notification '승인 완료' appears (no permission error)
10. Verify the item is removed from the list

**Expected Results:**

- Lab manager (siteAdminPage) sees disposal requests from ALL teams in disposal_final tab
- There is no team-based filtering applied to the disposal_final list for lab_manager
- Cross-team approval succeeds without any 403 Forbidden error
- Toast confirms successful approval regardless of the equipment's team

### 3. Suite 3: Integrated Disposal Workflow (End-to-End)

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 3.1. 3.1 - Complete workflow: request -> review approve -> final approve

**File:** `tests/e2e/approvals-disposal/workflow-complete.spec.ts`

**Steps:**

1. Step 1 - Request disposal as test_engineer:
2. Login as testOperatorPage fixture (test_engineer role)
3. Navigate to the equipment detail page /equipment/{EQUIP_ID} for a known available equipment
4. Click the '폐기 요청' button on the equipment detail page
5. Verify the disposal request dialog opens
6. Select '노후화' (obsolete) as the disposal reason radio button
7. Fill in the reason detail textarea with 10+ characters: '통합 워크플로우 테스트용 폐기 요청입니다. 노후화 교체 필요.'
8. Click the '폐기 요청' submit button in the dialog
9. Verify the dialog closes (API success)
10. Wait for the equipment status to update to pending_disposal
11.
12. Step 2 - Review as technical_manager:
13. Login as techManagerPage fixture (technical_manager role, same team as equipment)
14. Navigate to /admin/approvals?tab=disposal_review
15. Wait for the approval list to load
16. Find the item matching the equipment from Step 1 (by summary text or equipment name)
17. Verify the item shows status '대기' and has the ApprovalStepIndicator at step 1 (요청 completed)
18. Click the '검토완료' button on the matching item
19. Verify toast '승인 완료' appears
20. Verify the item disappears from the disposal_review list
21.
22. Step 3 - Final approve as lab_manager:
23. Login as siteAdminPage fixture (lab_manager role)
24. Navigate to /admin/approvals?tab=disposal_final
25. Wait for the approval list to load
26. Find the item matching the equipment from Steps 1 and 2 (now showing '검토 완료' status)
27. Verify the ApprovalStepIndicator shows step 2 (검토) as completed
28. Click the '승인' button on the matching item
29. Verify toast '승인 완료' appears
30. Verify the item disappears from the disposal_final list
31.
32. Step 4 - Verify final state:
33. Navigate to /equipment/{EQUIP_ID} as siteAdminPage
34. Verify the equipment status shows '폐기' (disposed) or '폐기 완료'
35. Verify the '폐기 완료' button is visible and disabled

**Expected Results:**

- test_engineer can create a disposal request and equipment enters pending_disposal status
- The new disposal request appears in technical_manager's disposal_review tab
- technical_manager's review approve moves the item from disposal_review to disposal_final
- lab_manager sees the reviewed item in disposal_final tab
- lab_manager's final approval changes equipment status to 'disposed'
- The equipment detail page shows disposal completion with a disabled status button
- The entire 3-step workflow is traceable through the approval system

#### 3.2. 3.2 - Review rejection workflow: request -> review reject

**File:** `tests/e2e/approvals-disposal/workflow-review-reject.spec.ts`

**Steps:**

1. Step 1 - Request disposal as test_engineer:
2. Login as testOperatorPage fixture
3. Navigate to /equipment/{EQUIP_ID_2} for a different available equipment
4. Click '폐기 요청' button
5. Select '고장/파손' (broken) as disposal reason
6. Fill reason detail: '리뷰 반려 테스트용입니다. 고장으로 인한 폐기 요청합니다.'
7. Submit the request and verify dialog closes
8.
9. Step 2 - Reject at review stage as technical_manager:
10. Login as techManagerPage fixture
11. Navigate to /admin/approvals?tab=disposal_review
12. Wait for the approval list to load
13. Find the item matching the equipment from Step 1
14. Click the '반려' button on the matching item
15. Verify the RejectModal opens
16. Type rejection reason: '폐기 사유가 충분하지 않습니다. 수리 이력을 먼저 확인해주세요.'
17. Click the '반려' submit button
18. Verify toast '반려 완료' appears
19. Verify the item disappears from the list
20.
21. Step 3 - Verify equipment returns to normal:
22. Navigate to /equipment/{EQUIP_ID_2}
23. Verify the equipment status is no longer 'pending_disposal'
24. Verify the equipment shows a normal status (e.g., 'available')
25. Verify the '폐기 요청' button is visible again (no active disposal request)

**Expected Results:**

- Review rejection successfully reverts the equipment to its original status
- The rejected item is removed from the disposal_review list
- No item appears in the disposal_final tab (review was rejected, not approved)
- Equipment detail page shows the equipment is back to normal with '폐기 요청' button available

#### 3.3. 3.3 - Final rejection workflow: request -> review approve -> final reject

**File:** `tests/e2e/approvals-disposal/workflow-final-reject.spec.ts`

**Steps:**

1. Step 1 - Request disposal as test_engineer:
2. Login as testOperatorPage fixture
3. Navigate to /equipment/{EQUIP_ID_3} for another available equipment
4. Click '폐기 요청' button
5. Select '정확도 부적합' (inaccurate) as disposal reason
6. Fill reason detail: '최종 반려 테스트용입니다. 정확도가 기준 미달하여 폐기합니다.'
7. Submit the request and verify dialog closes
8.
9. Step 2 - Approve at review stage as technical_manager:
10. Login as techManagerPage fixture
11. Navigate to /admin/approvals?tab=disposal_review
12. Find the item matching the equipment from Step 1
13. Click the '검토완료' button
14. Verify toast '승인 완료' appears and item disappears from the list
15.
16. Step 3 - Reject at final approval stage as lab_manager:
17. Login as siteAdminPage fixture
18. Navigate to /admin/approvals?tab=disposal_final
19. Find the item matching the equipment (now with '검토 완료' status)
20. Click the '반려' button on the item
21. Verify the RejectModal opens
22. Type rejection reason: '최종 승인 단계에서 반려합니다. 장비를 다시 교정하여 사용 가능한지 확인 후 재요청 바랍니다.'
23. Click the '반려' submit button
24. Verify toast '반려 완료' appears
25. Verify the item disappears from the disposal_final list
26.
27. Step 4 - Verify equipment returns to normal:
28. Navigate to /equipment/{EQUIP_ID_3}
29. Verify the equipment status is NOT 'disposed'
30. Verify the equipment has returned to a usable status
31. Verify the '폐기 요청' button is visible again

**Expected Results:**

- Review approval moves the item to disposal_final tab
- Final rejection by lab_manager reverts the equipment to its original status
- The item is removed from the disposal_final list after rejection
- Equipment is not marked as 'disposed' and can have new disposal requests
- Equipment detail page shows normal status with '폐기 요청' button available

### 4. Suite 4: Data Validation, Role Access, and Bulk Actions

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 4.1. 4.1 - Role-based tab visibility and access control

**File:** `tests/e2e/approvals-disposal/role-access-control.spec.ts`

**Steps:**

1. Test A - technical_manager tabs:
2. Login as techManagerPage fixture (technical_manager role)
3. Navigate to /admin/approvals
4. Verify the following tabs are visible: 장비, 교정 기록, 중간점검, 반출, 반입, 공용/렌탈, 부적합 재개, 폐기 검토
5. Verify the '폐기 검토' tab is present with the Trash2 icon
6. Verify the '폐기 승인' tab is NOT visible (only for lab_manager)
7. Click the '폐기 검토' tab
8. Verify URL updates to include ?tab=disposal_review
9.
10. Test B - lab_manager tabs:
11. Login as siteAdminPage fixture (lab_manager role)
12. Navigate to /admin/approvals
13. Verify the following tabs are visible: 폐기 승인, 교정계획서 승인
14. Verify the '폐기 검토' tab is NOT visible (only for technical_manager)
15. Click the '폐기 승인' tab
16. Verify URL updates to include ?tab=disposal_final
17.
18. Test C - test_engineer access denied:
19. Login as testOperatorPage fixture (test_engineer role)
20. Navigate to /admin/approvals
21. Verify the user is redirected to /dashboard (test_engineer has no approval access)
22. Verify the approvals page content is NOT displayed

**Expected Results:**

- technical_manager sees exactly 8 tabs including '폐기 검토' but NOT '폐기 승인'
- lab_manager sees exactly 2 tabs: '폐기 승인' and '교정계획서 승인'
- test_engineer is redirected to /dashboard because their role is not in rolesWithApprovalAccess
- Tab URL synchronization works correctly via searchParams
- ROLE_TABS configuration is correctly applied per role

#### 4.2. 4.2 - Approve action removes item from list and updates count

**File:** `tests/e2e/approvals-disposal/approve-removes-item.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for the list to fully load
4. Record the initial item count from the list description text '총 N개의 승인 대기 요청이 있습니다'
5. Record the initial tab badge count (the orange Badge component showing pending count)
6. Click the '검토완료' button on the first item in the list
7. Wait for toast '승인 완료' to appear
8. Wait for the list to refresh (React Query invalidation)
9. Verify the new item count in the description is initial count minus 1
10. Verify the tab badge count has decremented by 1 (or disappeared if count reached 0)
11. Verify the specific item that was approved is no longer in the list

**Expected Results:**

- The list description text updates from 'N' to 'N-1' pending requests
- The tab badge count decrements from its initial value
- If count reaches 0, the empty state message '승인 대기 중인 요청이 없습니다' appears with the Clock icon
- The approved item is immediately removed without requiring a page refresh

#### 4.3. 4.3 - Reject action removes item from list and updates count

**File:** `tests/e2e/approvals-disposal/reject-removes-item.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture (lab_manager role)
2. Navigate to /admin/approvals?tab=disposal_final
3. Wait for the list to fully load
4. Record the initial item count from '총 N개의 승인 대기 요청이 있습니다'
5. Record the initial tab badge count
6. Click the '반려' button on the first item
7. Verify the RejectModal opens
8. Type rejection reason with 10+ chars: '테스트 반려 사유입니다. 재검토 후 재요청 바랍니다.'
9. Click the '반려' submit button in the modal
10. Verify toast '반려 완료' appears
11. Wait for the list to refresh
12. Verify the new item count is initial count minus 1
13. Verify the tab badge count has decremented
14. Verify the rejected item is no longer visible in the list

**Expected Results:**

- Rejection removes the item from the list immediately
- List description and tab badge count both update correctly
- If all items are rejected, empty state message with Clock icon appears
- The rejected item does not reappear on subsequent tab switches or refreshes

#### 4.4. 4.4 - Bulk approve multiple disposal items

**File:** `tests/e2e/approvals-disposal/bulk-approve.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for the list to load with multiple pending items (at least 2)
4. Verify the BulkActionBar is visible showing '전체 선택 (0/N)'
5. Click the checkbox on the first approval item card (aria-label contains '선택')
6. Verify BulkActionBar updates to show '전체 선택 (1/N)'
7. Click the checkbox on the second approval item card
8. Verify BulkActionBar updates to show '전체 선택 (2/N)'
9. Verify the '일괄 검토완료' button is now enabled (was disabled with 0 selected)
10. Click the '일괄 검토완료' button
11. Verify the AlertDialog confirmation opens with title '일괄 검토완료'
12. Verify the dialog says '선택한 2개 항목을 검토완료하시겠습니까?'
13. Click the '검토완료' button in the AlertDialog to confirm
14. Wait for bulk processing to complete
15. Verify toast '일괄 승인 완료' appears with '2건이 승인되었습니다.'
16. Verify both items are removed from the list
17. Verify the selection count resets

**Expected Results:**

- BulkActionBar correctly tracks selected item count
- Bulk action buttons are disabled when no items are selected
- The confirmation AlertDialog shows the correct count of selected items
- Bulk approval processes all selected items sequentially
- Toast notification reports the number of successfully approved items
- All approved items are removed from the list after the bulk operation

#### 4.5. 4.5 - Select all and bulk reject with reason validation

**File:** `tests/e2e/approvals-disposal/bulk-reject.spec.ts`

**Steps:**

1. Login as techManagerPage fixture (technical_manager role)
2. Navigate to /admin/approvals?tab=disposal_review
3. Wait for the list to load with multiple items
4. Click the '전체 선택' checkbox in the BulkActionBar (id='select-all')
5. Verify all item checkboxes are checked
6. Verify BulkActionBar shows '전체 선택 (N/N)' matching total count
7. Click the '일괄 반려' button (red/destructive)
8. Verify the bulk rejection AlertDialog opens with title '일괄 반려'
9. Verify the dialog says '선택한 N개 항목을 반려합니다. 공통 반려 사유를 입력해주세요.'
10. Verify the Textarea for '반려 사유 (10자 이상 필수)' is present
11. Type '짧은' (2 characters) into the rejection reason
12. Verify the validation message appears: '반려 사유는 10자 이상 입력해주세요. (2/10)'
13. Verify the '반려' button is disabled (reason too short)
14. Clear and type a valid reason: '일괄 반려 테스트용 사유입니다. 모든 항목 재검토 필요합니다.'
15. Verify the validation message disappears and '반려' button becomes enabled
16. Click the '반려' button in the dialog
17. Wait for all rejections to process
18. Verify toast '일괄 반려 완료' with correct count
19. Verify all items are removed from the list
20. Verify the empty state '승인 대기 중인 요청이 없습니다' is displayed

**Expected Results:**

- Select all checkbox toggles all individual item checkboxes
- Bulk reject dialog validates minimum 10 character reason
- Live character count is displayed (N/10) when reason is between 1 and 9 chars
- Submit button is disabled until reason meets the 10-character minimum
- Bulk rejection processes all items and reports results in toast
- All items are removed and empty state is shown after bulk reject

#### 4.6. 4.6 - Empty state rendering when no pending items exist

**File:** `tests/e2e/approvals-disposal/empty-state.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture (lab_manager role)
2. Navigate to /admin/approvals?tab=disposal_final
3. Wait for the page to fully load
4. If items exist, approve or reject all items to clear the list
5. Verify the empty state is displayed when no items remain
6. Verify the Clock icon is visible in the empty state area
7. Verify the text '승인 대기 중인 요청이 없습니다' is visible
8. Verify the empty state area has role='status' and aria-live='polite' for accessibility
9. Verify the BulkActionBar is NOT rendered (totalCount is 0)
10. Verify the tab badge for '폐기 승인' shows no count or displays 0

**Expected Results:**

- Empty state is shown with appropriate icon and message when no pending items exist
- The empty state has correct accessibility attributes (role='status', aria-live='polite')
- BulkActionBar is hidden when there are no items
- Tab badge count is absent when there are 0 pending items
