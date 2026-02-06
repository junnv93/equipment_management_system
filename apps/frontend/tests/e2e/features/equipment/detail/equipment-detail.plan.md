# Equipment Detail Page Test Plan

## Application Overview

This test plan covers the Equipment Detail page (`/equipment/[id]`) of the Laboratory Equipment Management System implementing UL-QP-18 procedures. The page displays comprehensive equipment information including basic details, status badges, calibration D-day indicators, and provides role-based actions such as checkout requests, equipment editing, and the critical 3-step disposal workflow.

**Key Components:**

- EquipmentHeader: Equipment name, model, management number, status badges, action buttons
- EquipmentTabs: 9 tabs (Basic Info, Calibration History, Calibration Factors, Checkout History, Location History, Maintenance, Incidents, Software, Attachments)
- DisposalProgressCard: Shows disposal workflow progress (pending_disposal status)
- DisposedBanner: Shows disposal completion info (disposed status)
- NonConformanceBanner: Warning for equipment with open non-conformance records
- SharedEquipmentBanner: Alert for shared/rental equipment

**Role Hierarchy:**

- test_engineer (Test Engineer): Basic operations, can request disposal
- technical_manager (Technical Manager): Approval authority, can review disposal
- lab_manager (Lab Manager): Full access, can approve disposal (self-approval)

**Test Credentials:**

- Lab Manager: admin@example.com / password123
- Technical Manager: manager@example.com / password123
- Test Engineer: user@example.com / password123

## Test Scenarios

### 1. Basic Information Display

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-basic-info.spec.ts`

#### 1.1. displays equipment header with name, model, and management number

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Login as Technical Manager (manager@example.com)
2. Navigate to equipment list page (/equipment)
3. Click on any equipment card to go to detail page
4. Verify equipment name is displayed in h1 heading
5. Verify model name is displayed with 'Model:' label
6. Verify management number is displayed in monospace font format (e.g., SUW-E0001)

**Expected Results:**

- Equipment name displayed as main heading (h1)
- Model name shown with proper label
- Management number follows format XXX-X0000 (site-classification-serial)

#### 1.2. displays serial number when available

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page for equipment with serial number
3. Verify serial number is displayed with 'S/N:' label

**Expected Results:**

- Serial number displayed in header section
- Serial number uses monospace font

#### 1.3. displays primary status badge correctly for available equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment list and filter by status=available
3. Click on an available equipment
4. Verify status badge shows 'Available' with green styling

**Expected Results:**

- Status badge shows 'Available'
- Badge has green background color (bg-green-100)
- CheckCircle icon is displayed

#### 1.4. displays status badge for in_use equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with in_use status
2. Verify status badge shows 'In Use' with blue styling

**Expected Results:**

- Status badge shows 'In Use'
- Badge has blue background styling

#### 1.5. displays status badge for checked_out equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with checked_out status
2. Verify status badge shows 'Checked Out'

**Expected Results:**

- Status badge shows 'Checked Out'
- FileOutput icon is displayed

#### 1.6. displays status badge for non_conforming equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with non_conforming status
2. Verify status badge shows 'Non-conforming' with red styling

**Expected Results:**

- Status badge shows 'Non-conforming'
- Badge has red/destructive styling

#### 1.7. displays status badge for spare equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with spare status
2. Verify status badge shows 'Spare'

**Expected Results:**

- Status badge shows 'Spare'
- Badge has gray styling

#### 1.8. displays status badge for retired equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with retired status
2. Verify status badge shows 'Retired'

**Expected Results:**

- Status badge shows 'Retired'
- Badge has gray/muted styling

#### 1.9. displays calibration D-day badge when calibration is due within 30 days

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with nextCalibrationDate within 30 days
2. Verify calibration badge shows 'X days until calibration' format

**Expected Results:**

- Calibration D-day badge is visible
- Badge shows countdown format (e.g., '7 days until calibration')
- Badge has yellow/orange styling based on urgency

#### 1.10. displays calibration overdue badge when calibration is past due

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with calibration_overdue status or past nextCalibrationDate
2. Verify calibration badge shows 'Calibration overdue (X days)' format

**Expected Results:**

- Calibration overdue badge is visible
- Badge shows overdue format with days count
- Badge has red styling and pulse animation

#### 1.11. does not display calibration badge for retired equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with retired status
2. Verify no calibration D-day badge is displayed

**Expected Results:**

- No calibration badge visible
- Only primary status badge (Retired) is shown

#### 1.12. displays shared equipment badge for isShared=true equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info.spec.ts`

**Steps:**

1. Navigate to equipment with isShared=true
2. Verify SharedEquipmentBadge is displayed in header

**Expected Results:**

- Shared equipment badge is visible
- Badge indicates shared source (Shared or Rental)

### 2. Basic Info Tab Content

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-basic-info-tab.spec.ts`

#### 2.1. displays equipment basic information card

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info-tab.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page
3. Verify 'Basic Info' tab is active by default
4. Verify 'Equipment Basic Info' card is visible

**Expected Results:**

- Basic Info tab is selected by default
- Equipment basic info card displays equipment name, model name, management number, serial number
- Manufacturer and purchase year are shown

#### 2.2. displays location and management information card

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info-tab.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Verify 'Location and Management Info' card is visible

**Expected Results:**

- Card shows site - Suwon/Uiwang/Pyeongtaek
- Card shows team name
- Card shows current location
- Card shows installation date

#### 2.3. displays calibration information card

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info-tab.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Verify 'Calibration Info' card is visible

**Expected Results:**

- Card shows calibration method
- Card shows calibration cycle in months
- Card shows last calibration date
- Card shows next calibration date
- Card shows calibration agency

#### 2.4. displays software/manual information card when available

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info-tab.spec.ts`

**Steps:**

1. Navigate to equipment with software version or firmware version
2. Verify 'Software/Manual Info' card is visible

**Expected Results:**

- Card shows software version when available
- Card shows firmware version when available
- Card shows manual location when available

#### 2.5. displays external identifier for shared equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/basic-info-tab.spec.ts`

**Steps:**

1. Navigate to shared equipment (isShared=true) with externalIdentifier
2. Verify 'Owner Original Number' field is displayed

**Expected Results:**

- External identifier field is visible only for shared equipment
- Field shows the original equipment number from the owning organization

### 3. Tab Navigation

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-tab-navigation.spec.ts`

#### 3.1. navigates between all available tabs

**File:** `apps/frontend/tests/e2e/equipment-detail/tab-navigation.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page
3. Verify all 9 tabs are visible: Basic Info, Calibration History, Calibration Factors, Checkout History, Location Changes, Maintenance, Incidents, Software, Attachments
4. Click on 'Calibration History' tab
5. Verify tab content changes to calibration history
6. Click on 'Checkout History' tab
7. Verify tab content changes to checkout history

**Expected Results:**

- All 9 tabs are visible in the tab list
- Clicking each tab loads corresponding content
- Active tab has visual distinction (UL Midnight Blue background)

#### 3.2. updates URL query parameter when switching tabs

**File:** `apps/frontend/tests/e2e/equipment-detail/tab-navigation.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Verify URL does not have tab query parameter (defaults to basic)
3. Click on 'Calibration History' tab
4. Verify URL updates to include ?tab=calibration
5. Click on 'Checkout History' tab
6. Verify URL updates to ?tab=checkout

**Expected Results:**

- URL query parameter reflects current tab
- Tab state is bookmarkable via URL

#### 3.3. loads correct tab from URL query parameter

**File:** `apps/frontend/tests/e2e/equipment-detail/tab-navigation.spec.ts`

**Steps:**

1. Navigate directly to equipment detail page with ?tab=calibration
2. Verify 'Calibration History' tab is active
3. Verify calibration history content is displayed

**Expected Results:**

- Page loads with correct tab active based on URL
- Tab content matches the URL parameter

#### 3.4. tabs are keyboard navigable

**File:** `apps/frontend/tests/e2e/equipment-detail/tab-navigation.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Focus on tab list using Tab key
3. Press Arrow Right to move to next tab
4. Press Enter to select the tab

**Expected Results:**

- Tab list is focusable
- Arrow keys navigate between tabs
- Enter/Space activates the focused tab
- Focus ring is visible on focused tab

#### 3.5. tabs are horizontally scrollable on mobile

**File:** `apps/frontend/tests/e2e/equipment-detail/tab-navigation.spec.ts`

**Steps:**

1. Set viewport to mobile width (375px)
2. Navigate to equipment detail page
3. Verify tab list is horizontally scrollable
4. Scroll to see hidden tabs

**Expected Results:**

- Tab list container allows horizontal scrolling
- All tabs are accessible via scrolling

### 4. Calibration History Tab

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-calibration-tab.spec.ts`

#### 4.1. displays calibration history table with records

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page
3. Click on 'Calibration History' tab
4. Verify calibration history table is displayed

**Expected Results:**

- Table shows columns: Calibration Date, Next Calibration Date, Calibration Agency, Result, Approval Status, Notes
- Calibration records are displayed in rows
- Result badge shows Pass/Fail/Conditional with appropriate colors

#### 4.2. displays empty state when no calibration records exist

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Navigate to equipment without calibration history
2. Click on 'Calibration History' tab

**Expected Results:**

- Empty state message is displayed
- Calendar icon is shown
- Message indicates no calibration records exist

#### 4.3. shows calibration register button for test_engineer role

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Login as Test Engineer (user@example.com)
2. Navigate to equipment detail page
3. Click on 'Calibration History' tab
4. Verify 'Register Calibration' button is visible

**Expected Results:**

- Register calibration button is visible for test_engineer
- Button has Plus icon

#### 4.4. hides calibration register button for technical_manager role

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page
3. Click on 'Calibration History' tab
4. Verify 'Register Calibration' button is NOT visible

**Expected Results:**

- Register calibration button is hidden for technical_manager
- UL-QP-18 policy: only test_engineer can register (separation of duties)

#### 4.5. opens calibration registration dialog

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to equipment detail page
3. Click on 'Calibration History' tab
4. Click 'Register Calibration' button
5. Verify registration dialog opens

**Expected Results:**

- Dialog opens with title 'Calibration History Registration'
- Form contains fields: Calibration Date, Calibration Cycle, Next Calibration Date, Calibration Agency, Certificate Number, Calibration Result, File Upload, Notes
- Submit button shows 'Register (Request Approval)'

#### 4.6. validates calibration registration form

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Open calibration registration dialog
3. Attempt to submit without required fields
4. Verify validation messages appear

**Expected Results:**

- Validation error for empty Calibration Agency
- Validation error for empty Certificate Number
- Validation error for missing file attachment
- Submit button is disabled when form is invalid

#### 4.7. auto-calculates next calibration date when cycle changes

**File:** `apps/frontend/tests/e2e/equipment-detail/calibration-tab.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Open calibration registration dialog
3. Set calibration date to 2026-01-31
4. Change calibration cycle from 12 to 6 months
5. Verify next calibration date updates automatically

**Expected Results:**

- Next calibration date auto-updates to calibration date + cycle months
- Changing cycle recalculates the next date

### 5. Disposal Workflow - Request Phase

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-disposal-request.spec.ts`

#### 5.1. technical_manager can see disposal request button for available equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment with status=available
3. Verify 'Request Disposal' button is visible in header

**Expected Results:**

- Disposal request button is visible
- Button has Trash2 icon
- Button has red outline styling

#### 5.2. test_engineer can see disposal request button for available equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to equipment with status=available
3. Verify 'Request Disposal' button is visible

**Expected Results:**

- Disposal request button is visible for test_engineer
- Both test_engineer and technical_manager can request disposal

#### 5.3. disposal request button is hidden for shared equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment with isShared=true
3. Verify disposal request button is NOT visible

**Expected Results:**

- Disposal button is hidden for shared equipment
- Shared equipment cannot be disposed

#### 5.4. opens disposal request dialog with required fields

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to available equipment
3. Click 'Request Disposal' button
4. Verify disposal request dialog opens

**Expected Results:**

- Dialog title shows 'Equipment Disposal Request'
- Equipment name is displayed in description
- Disposal reason selector is visible (Obsolete, Damaged, Lost, Other)
- Detail reason textarea is visible with 10 character minimum
- File attachment section is visible (optional)
- Submit button shows 'Request Disposal'

#### 5.5. validates minimum 10 characters for detail reason

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Open disposal request dialog
2. Select a disposal reason
3. Enter less than 10 characters in detail reason
4. Verify submit button is disabled

**Expected Results:**

- Character count hint shows current count
- Submit button remains disabled until 10+ characters
- Entering 10+ characters enables submit button

#### 5.6. submits disposal request successfully

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to available equipment
3. Click 'Request Disposal' button
4. Select reason: Obsolete
5. Enter detail reason with 10+ characters
6. Click 'Request Disposal' submit button
7. Verify success toast appears

**Expected Results:**

- Success toast shows 'Disposal Request Complete'
- Dialog closes automatically
- Equipment status changes to pending_disposal
- DisposalProgressCard appears on page

#### 5.7. can attach files to disposal request

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-request.spec.ts`

**Steps:**

1. Open disposal request dialog
2. Click 'Select Files' button
3. Select one or more files
4. Verify selected files are listed
5. Click remove button on a file to remove it

**Expected Results:**

- File chooser opens when clicking button
- Selected files appear in list below button
- Each file has a remove button
- Files can be removed before submission

### 6. Disposal Workflow - Progress Display

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-disposal-progress.spec.ts`

#### 6.1. displays DisposalProgressCard for pending_disposal equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-progress.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment with status=pending_disposal
3. Verify DisposalProgressCard is displayed

**Expected Results:**

- Progress card shows 'Equipment Disposal In Progress' title
- Card has orange border-left styling
- 3-step progress stepper is visible

#### 6.2. shows step 1 status when review is pending

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-progress.spec.ts`

**Steps:**

1. Navigate to equipment with pending_disposal and reviewStatus=pending
2. Verify progress stepper shows step 1 as current

**Expected Results:**

- Step 1 (Disposal Request) is highlighted as completed
- Step 2 (Technical Manager Review) shows as current/pending
- Step 3 (Lab Manager Approval) shows as future
- Status text shows 'Awaiting Technical Manager Review'

#### 6.3. shows step 2 status when reviewed but not approved

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-progress.spec.ts`

**Steps:**

1. Navigate to equipment with pending_disposal and reviewStatus=reviewed
2. Verify progress stepper shows step 2 as current

**Expected Results:**

- Step 1 and 2 are highlighted as completed
- Step 3 shows as current/pending
- Status text shows 'Awaiting Lab Manager Approval'
- ReviewOpinionCard shows reviewer's opinion

#### 6.4. displays requester and request time information

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-progress.spec.ts`

**Steps:**

1. Navigate to equipment with pending_disposal
2. Verify requester information is displayed

**Expected Results:**

- Requester name is shown
- Request date/time is shown in Korean format

#### 6.5. shows View Details button that opens DisposalDetailDialog

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-progress.spec.ts`

**Steps:**

1. Navigate to equipment with pending_disposal
2. Click 'View Details' button on progress card
3. Verify detail dialog opens

**Expected Results:**

- Detail dialog opens
- Dialog shows complete disposal request information
- 3-step timeline is visible in dialog

#### 6.6. shows Cancel Request button only for the requester

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-progress.spec.ts`

**Steps:**

1. Login as the user who made the disposal request
2. Navigate to the pending_disposal equipment
3. Verify 'Cancel Request' button is visible

**Expected Results:**

- Cancel button is visible only for the original requester
- Other users do not see the cancel button

### 7. Disposal Workflow - Review Phase

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-disposal-review.spec.ts`

#### 7.1. technical_manager can review disposal request from same team

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-review.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment with pending_disposal (same team, reviewStatus=pending)
3. Verify disposal dropdown shows 'Review Disposal' option

**Expected Results:**

- Disposal button shows dropdown menu
- Menu contains 'Review Disposal' option
- Option is enabled for same team equipment

#### 7.2. opens disposal review dialog

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-review.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to pending_disposal equipment
3. Click disposal dropdown button
4. Select 'Review Disposal'
5. Verify review dialog opens

**Expected Results:**

- Dialog title shows 'Disposal Review'
- Disposal request information card is visible
- Equipment history summary (collapsed) is visible
- Review opinion textarea is visible
- 'Complete Review' and 'Reject' buttons are visible

#### 7.3. shows disposal request details in review dialog

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-review.spec.ts`

**Steps:**

1. Open disposal review dialog
2. Verify request details are displayed

**Expected Results:**

- Disposal reason is shown
- Detail reason is shown
- Requester name and request time are shown
- Attached files are listed with download links

#### 7.4. expands equipment history summary

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-review.spec.ts`

**Steps:**

1. Open disposal review dialog
2. Click on 'Equipment History Summary' collapsible section
3. Verify history details expand

**Expected Results:**

- Collapsible section expands
- Shows total calibration count
- Shows total maintenance records
- Shows equipment age/purchase year

#### 7.5. submits review approval successfully

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-review.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Open disposal review dialog
3. Enter review opinion (10+ characters)
4. Click 'Complete Review' button

**Expected Results:**

- Success toast shows 'Review Complete'
- Dialog closes
- DisposalProgressCard updates to show step 2 complete
- Status changes to 'Awaiting Lab Manager Approval'

#### 7.6. submits review rejection with reason

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-review.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Open disposal review dialog
3. Enter rejection reason (10+ characters)
4. Click 'Reject' button
5. Verify rejection guidance message appears
6. Click 'Reject' button again to confirm

**Expected Results:**

- First click shows guidance message about providing reason
- Second click confirms rejection
- Toast shows 'Request Rejected'
- Equipment status reverts to 'available'
- Disposal request button reappears

### 8. Disposal Workflow - Approval Phase

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-disposal-approval.spec.ts`

#### 8.1. lab_manager can see final approval option after review

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Login as Lab Manager (admin@example.com)
2. Navigate to equipment with pending_disposal and reviewStatus=reviewed
3. Verify disposal dropdown shows 'Final Approval' option

**Expected Results:**

- Disposal dropdown menu shows 'Final Approval'
- Option is only visible after review is complete

#### 8.2. opens disposal approval dialog

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Navigate to reviewed pending_disposal equipment
3. Click disposal dropdown
4. Select 'Final Approval'
5. Verify approval dialog opens

**Expected Results:**

- Dialog title shows 'Disposal Final Approval'
- 3-step stepper shows all steps with progress
- Review opinion card shows reviewer's comment
- Approval comment textarea is visible (optional)
- 'Final Approval' and 'Reject' buttons are visible

#### 8.3. shows warning about irreversible action

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Open disposal approval dialog
2. Click 'Final Approval' button
3. Verify confirmation dialog appears

**Expected Results:**

- Confirmation dialog shows 'Confirm Final Approval'
- Warning message states 'This action cannot be undone'
- Final confirmation button is available

#### 8.4. completes disposal approval successfully

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Open disposal approval dialog
3. Optionally enter approval comment
4. Click 'Final Approval' button
5. Confirm in confirmation dialog

**Expected Results:**

- Success toast shows 'Final Approval Complete'
- Dialog closes
- Equipment status changes to 'disposed'
- DisposedBanner appears instead of DisposalProgressCard

#### 8.5. displays DisposedBanner for disposed equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Navigate to equipment with status=disposed
2. Verify DisposedBanner is displayed

**Expected Results:**

- Banner shows 'Equipment Disposal Complete'
- Banner has gray styling
- Shows disposal reason (Obsolete, Damaged, etc.)
- Shows approver name and approval date

#### 8.6. disposal button shows 'Disposal Complete' and is disabled for disposed equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Navigate to disposed equipment
2. Verify disposal button state

**Expected Results:**

- Button shows 'Disposal Complete'
- Button has CheckCircle2 icon
- Button is disabled
- Button has gray/muted styling

#### 8.7. lab_manager can reject during approval phase

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-approval.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Open disposal approval dialog
3. Enter rejection reason
4. Click 'Reject' button
5. Verify rejection guidance
6. Click 'Reject' again to confirm

**Expected Results:**

- Rejection is processed
- Toast shows 'Request Rejected'
- Equipment status reverts to 'available'
- Disposal request button reappears

### 9. Disposal Workflow - Permission Checks

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-disposal-permissions.spec.ts`

#### 9.1. test_engineer cannot review disposal requests

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-permissions.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to equipment with pending_disposal (reviewStatus=pending)
3. Verify review option is not available

**Expected Results:**

- Disposal dropdown does not show 'Review Disposal'
- Only 'View Details' option may be available

#### 9.2. test_engineer cannot approve disposal requests

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-permissions.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to equipment with pending_disposal (reviewStatus=reviewed)
3. Verify approval option is not available

**Expected Results:**

- Disposal dropdown does not show 'Final Approval'
- Only lab_manager/system_admin can approve

#### 9.3. technical_manager cannot approve without review being complete

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-permissions.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment with pending_disposal (reviewStatus=pending)
3. Verify approval option is not available

**Expected Results:**

- Approval option not shown until review is complete
- Only review option is available

#### 9.4. lab_manager can self-request and self-approve disposal

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-permissions.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Navigate to available equipment
3. Request disposal
4. Verify Lab Manager can proceed through all steps

**Expected Results:**

- Lab Manager can request disposal
- Lab Manager can review their own request (or skip review)
- Lab Manager can provide final approval
- Self-approval workflow is supported

#### 9.5. only requester can cancel pending disposal request

**File:** `apps/frontend/tests/e2e/equipment-detail/disposal-permissions.spec.ts`

**Steps:**

1. Login as user who is NOT the requester
2. Navigate to pending_disposal equipment requested by another user
3. Verify cancel option is not available

**Expected Results:**

- 'Cancel Request' button is not visible
- Only the original requester can cancel

### 10. Banner Display

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-banners.spec.ts`

#### 10.1. displays NonConformanceBanner for equipment with open non-conformance

**File:** `apps/frontend/tests/e2e/equipment-detail/banners.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment with non_conforming status or open non-conformance records
3. Verify NonConformanceBanner is displayed

**Expected Results:**

- Banner shows 'Non-conformance Status (N records)' title
- Banner has red/destructive styling
- Warning icon is displayed
- Message explains restrictions on checkout/rental
- Each non-conformance shows cause and discovery date
- 'Manage Non-conformance' button links to non-conformance page

#### 10.2. hides NonConformanceBanner when no open non-conformances exist

**File:** `apps/frontend/tests/e2e/equipment-detail/banners.spec.ts`

**Steps:**

1. Navigate to equipment with no open non-conformance records
2. Verify NonConformanceBanner is not displayed

**Expected Results:**

- Banner is not rendered
- Only equipment with open (not closed) non-conformances show banner

#### 10.3. displays SharedEquipmentBanner for shared equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/banners.spec.ts`

**Steps:**

1. Navigate to equipment with isShared=true
2. Verify shared equipment alert banner is displayed

**Expected Results:**

- Alert shows 'Shared Equipment Notice' title
- Alert has blue styling
- AlertTriangle icon is displayed
- Message explains edit/delete restrictions

#### 10.4. displays usage period D-day for temporary shared equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/banners.spec.ts`

**Steps:**

1. Navigate to temporary shared equipment (status=temporary, isShared=true)
2. Verify UsagePeriodBadge is displayed in banner

**Expected Results:**

- UsagePeriodBadge shows D-day countdown
- Message indicates automatic deactivation after period ends
- Badge indicates rental or shared from safety lab

#### 10.5. displays different message for permanent vs temporary shared equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/banners.spec.ts`

**Steps:**

1. Navigate to permanent shared equipment
2. Note the message about edit/delete restrictions
3. Navigate to temporary shared equipment
4. Note the different message about auto-deactivation

**Expected Results:**

- Permanent shared: 'Edit and delete are not allowed. Rental and checkout are possible.'
- Temporary shared: 'This is a temporarily registered shared/rental equipment. It will be automatically deactivated when the usage period ends.'

### 11. Action Buttons and Permissions

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-action-buttons.spec.ts`

#### 11.1. displays checkout button for available equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Login as any user
2. Navigate to available equipment
3. Verify 'Checkout Request' button is visible

**Expected Results:**

- Checkout button is visible with FileOutput icon
- Button links to /equipment/[id]/checkout
- Button has prominent white background styling

#### 11.2. hides checkout button for checked_out equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Navigate to equipment with checked_out status
2. Verify checkout button is not visible

**Expected Results:**

- Checkout button is hidden for already checked out equipment
- Also hidden for retired and in_use status

#### 11.3. displays edit button for non-shared, non-retired equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Navigate to available equipment that is not shared
2. Verify 'Edit' button is visible

**Expected Results:**

- Edit button is visible with Edit icon
- Button links to /equipment/[id]/edit
- Button has outline styling

#### 11.4. hides edit button for shared equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Navigate to shared equipment (isShared=true)
2. Verify edit button is not visible

**Expected Results:**

- Edit button is hidden for shared equipment
- Shared equipment cannot be modified

#### 11.5. hides edit button for retired equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Navigate to retired equipment
2. Verify edit button is not visible

**Expected Results:**

- Edit button is hidden for retired equipment
- Retired equipment is read-only

#### 11.6. displays delete button only for lab_manager on pending/rejected equipment

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Navigate to equipment with approvalStatus=pending_approval or rejected
3. Verify 'Delete' button is visible

**Expected Results:**

- Delete button visible for lab_manager/system_admin
- Only visible for pending_approval or rejected equipment
- Button has red outline styling

#### 11.7. hides delete button for non-admin users

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to any equipment
3. Verify delete button is not visible

**Expected Results:**

- Delete button is hidden for test_engineer and technical_manager
- Only lab_manager and system_admin can delete

#### 11.8. back button navigates to previous page

**File:** `apps/frontend/tests/e2e/equipment-detail/action-buttons.spec.ts`

**Steps:**

1. Navigate from equipment list to equipment detail
2. Click 'Back to List' button
3. Verify navigation back to list

**Expected Results:**

- Back button uses router.back()
- Returns to the previous page (usually equipment list)

### 12. Responsive Design

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-responsive.spec.ts`

#### 12.1. adapts layout for mobile viewport (375px)

**File:** `apps/frontend/tests/e2e/equipment-detail/responsive.spec.ts`

**Steps:**

1. Set viewport to 375px width
2. Navigate to equipment detail page
3. Verify mobile layout adjustments

**Expected Results:**

- Header stacks vertically (equipment info above action buttons)
- Action buttons wrap to multiple rows if needed
- Tab list is horizontally scrollable
- Basic info cards stack vertically (1 column)
- All content is accessible without horizontal overflow

#### 12.2. adapts layout for tablet viewport (768px)

**File:** `apps/frontend/tests/e2e/equipment-detail/responsive.spec.ts`

**Steps:**

1. Set viewport to 768px width
2. Navigate to equipment detail page
3. Verify tablet layout adjustments

**Expected Results:**

- Header may show side-by-side layout
- Basic info cards show in 2-column grid
- Tab list is partially visible with scroll

#### 12.3. optimal layout for desktop viewport (1440px)

**File:** `apps/frontend/tests/e2e/equipment-detail/responsive.spec.ts`

**Steps:**

1. Set viewport to 1440px width
2. Navigate to equipment detail page
3. Verify desktop layout

**Expected Results:**

- Header shows equipment info and actions side by side
- All tabs visible without scrolling
- Basic info cards in 2-column grid
- Maximum content width is constrained (max-w-7xl)

#### 12.4. status badges remain readable at all viewport sizes

**File:** `apps/frontend/tests/e2e/equipment-detail/responsive.spec.ts`

**Steps:**

1. Test at 375px, 768px, and 1440px viewports
2. Verify status badges are visible and readable

**Expected Results:**

- Badges do not get cut off
- Icon and text remain visible
- Badges wrap to new line if needed on mobile

### 13. Error Handling

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-error-handling.spec.ts`

#### 13.1. shows 404 page for non-existent equipment ID

**File:** `apps/frontend/tests/e2e/equipment-detail/error-handling.spec.ts`

**Steps:**

1. Navigate to /equipment/non-existent-uuid
2. Verify 404 not found page is displayed

**Expected Results:**

- Not found page is rendered
- User is not redirected to error page
- Appropriate message indicates equipment not found

#### 13.2. handles network error gracefully during data fetch

**File:** `apps/frontend/tests/e2e/equipment-detail/error-handling.spec.ts`

**Steps:**

1. Simulate network failure
2. Navigate to equipment detail page
3. Verify error state is displayed

**Expected Results:**

- Error boundary catches the error
- Error page shows appropriate message
- User can retry or navigate away

#### 13.3. shows loading skeleton while data is fetching

**File:** `apps/frontend/tests/e2e/equipment-detail/error-handling.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Observe loading state before content appears

**Expected Results:**

- Loading skeleton (EquipmentDetailSkeleton) is displayed
- Skeleton provides visual feedback during loading

#### 13.4. handles disposal request API error gracefully

**File:** `apps/frontend/tests/e2e/equipment-detail/error-handling.spec.ts`

**Steps:**

1. Mock disposal API to return error
2. Attempt to submit disposal request
3. Verify error is handled

**Expected Results:**

- Error toast is displayed
- Dialog remains open for retry
- Form state is preserved

### 14. Accessibility

**Seed:** `apps/frontend/tests/e2e/equipment-detail/seed-accessibility.spec.ts`

#### 14.1. status badges have proper aria labels

**File:** `apps/frontend/tests/e2e/equipment-detail/accessibility.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Inspect status badges for aria attributes

**Expected Results:**

- Status badge has role='status'
- aria-label describes the status
- Icon has aria-hidden='true'

#### 14.2. tabs have proper ARIA attributes

**File:** `apps/frontend/tests/e2e/equipment-detail/accessibility.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Inspect tab list and tab panels

**Expected Results:**

- TabsList has aria-label='Equipment detail info tabs'
- Each TabTrigger has aria-label describing the tab
- Each TabsContent has role='tabpanel'
- TabsContent has aria-labelledby pointing to trigger

#### 14.3. dialogs are properly labeled and modal

**File:** `apps/frontend/tests/e2e/equipment-detail/accessibility.spec.ts`

**Steps:**

1. Open disposal request dialog
2. Inspect dialog accessibility attributes

**Expected Results:**

- Dialog has role='dialog'
- Dialog has aria-modal='true'
- Dialog title is properly associated
- Focus is trapped within dialog

#### 14.4. form fields have associated labels

**File:** `apps/frontend/tests/e2e/equipment-detail/accessibility.spec.ts`

**Steps:**

1. Open calibration registration dialog
2. Inspect form field labels

**Expected Results:**

- Each input has an associated label
- Required fields are marked with asterisk
- Error messages are associated via aria-describedby

#### 14.5. banners have appropriate alert roles

**File:** `apps/frontend/tests/e2e/equipment-detail/accessibility.spec.ts`

**Steps:**

1. Navigate to equipment with non-conformance
2. Inspect NonConformanceBanner accessibility

**Expected Results:**

- Alert component has proper variant
- DisposedBanner has role='status'
- Important warnings are announced to screen readers

#### 14.6. all interactive elements are keyboard accessible

**File:** `apps/frontend/tests/e2e/equipment-detail/accessibility.spec.ts`

**Steps:**

1. Navigate using only keyboard
2. Tab through all interactive elements
3. Activate buttons and links with Enter/Space

**Expected Results:**

- All buttons, links, tabs are reachable via Tab key
- Focus is visible on focused elements
- Enter/Space activates focused elements
- Dialog can be closed with Escape key
