# NC (Non-Conformance) Repair Workflow Test Plan

## Application Overview

This test plan covers the Non-Conformance (NC) and Repair Workflow integration in the Equipment Management System based on UL-QP-18 procedures. The NC workflow manages equipment defects from discovery through resolution, with tight integration to repair history for damage/malfunction types. The system enforces role-based permissions where test engineers can create NCs and repair records but cannot edit NC status, while technical managers and lab managers have full management capabilities including NC closure approval.

## Test Scenarios

### 1. Group A: NC Basic CRUD Operations

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 1.1. A-1. should create NC with all fields populated

**File:** `tests/e2e/nc-repair-workflow/group-a/create-nc-all-fields.spec.ts`

**Steps:**

1. Navigate to equipment detail page for available equipment
2. Click on 'Incident History' tab
3. Click 'Register Incident' button
4. Fill incident date with today's date
5. Select incident type 'damage' from dropdown
6. Enter incident content with detailed description (min 10 chars)
7. Check 'Register as Non-Conformance' checkbox
8. Fill optional action plan field
9. Click 'Save' button
10. Wait for success toast notification

**Expected Results:**

- NC record is created with status 'open'
- NC type badge displays 'damage' (SSOT: NON_CONFORMANCE_TYPE_LABELS)
- Equipment status changes to 'non_conforming'
- NC appears in the NC management list
- Discovery date matches today's date
- Action plan is saved correctly

#### 1.2. A-2. should create NC with minimal required fields only

**File:** `tests/e2e/nc-repair-workflow/group-a/create-nc-minimal.spec.ts`

**Steps:**

1. Navigate to equipment detail page
2. Click on 'Incident History' tab
3. Click 'Register Incident' button
4. Fill only required fields: date, type, content
5. Check 'Register as Non-Conformance' checkbox
6. Leave action plan empty
7. Click 'Save' button

**Expected Results:**

- NC record is created successfully
- Action plan field is null/undefined
- Equipment status changes to 'non_conforming'

#### 1.3. A-3. should display NC list with correct status badges

**File:** `tests/e2e/nc-repair-workflow/group-a/view-nc-list.spec.ts`

**Steps:**

1. Navigate to /equipment/{id}/non-conformance page
2. Wait for NC list to load
3. Verify each NC card displays required information

**Expected Results:**

- NC cards show status badges with correct colors (SSOT: NON_CONFORMANCE_STATUS_COLORS)
- Status labels match SSOT: NON_CONFORMANCE_STATUS_LABELS
- NC type badges are visible (SSOT: NON_CONFORMANCE_TYPE_LABELS)
- Discovery date is formatted as Korean locale
- Repair link badge shows for NCs with repair history connection

#### 1.4. A-4. should display NC details with all sections

**File:** `tests/e2e/nc-repair-workflow/group-a/view-nc-details.spec.ts`

**Steps:**

1. Navigate to NC management page for equipment with existing NCs
2. Locate NC card with corrected status
3. Verify all detail sections are present

**Expected Results:**

- Cause section displays NC cause text
- Action plan section displays if populated
- Analysis content section displays for analyzed NCs
- Correction content section displays for corrected NCs
- Correction date is shown in Korean locale format
- Resolution type badge shows (repair/recalibration/replacement/other)
- Repair history link is clickable when connected

#### 1.5. A-5. should show empty state when no NCs exist

**File:** `tests/e2e/nc-repair-workflow/group-a/nc-empty-state.spec.ts`

**Steps:**

1. Navigate to NC management page for equipment without NCs
2. Verify empty state message is displayed

**Expected Results:**

- Empty state message shows: 'No non-conformance records registered'
- Register NC button is visible if equipment is not already non_conforming

### 2. Group B: Role-Based Permission Verification

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 2.1. B-1. test_engineer can create NC but cannot see edit button

**File:** `tests/e2e/nc-repair-workflow/group-b/test-engineer-permissions.spec.ts`

**Steps:**

1. Login as test_engineer using testOperatorPage fixture
2. Navigate to NC management page for equipment with open NC
3. Verify 'Register NC' button is visible
4. Verify 'Edit Record' button is NOT visible for existing NCs

**Expected Results:**

- test_engineer can see NC list
- test_engineer can see 'Register NC' button
- test_engineer CANNOT see 'Edit Record' button (isManager() check)
- test_engineer CANNOT change NC status

#### 2.2. B-2. technical_manager can see and use edit button

**File:** `tests/e2e/nc-repair-workflow/group-b/tech-manager-permissions.spec.ts`

**Steps:**

1. Login as technical_manager using techManagerPage fixture
2. Navigate to NC management page for equipment with open NC
3. Verify 'Edit Record' button is visible
4. Click 'Edit Record' button
5. Verify edit form fields are accessible

**Expected Results:**

- technical_manager can see 'Edit Record' button
- Edit form shows analysis content textarea
- Edit form shows correction content textarea
- Edit form shows status dropdown with options
- Status dropdown includes: analyzing, corrected

#### 2.3. B-3. lab_manager has full NC management access

**File:** `tests/e2e/nc-repair-workflow/group-b/lab-manager-permissions.spec.ts`

**Steps:**

1. Login as lab_manager using siteAdminPage fixture
2. Navigate to NC management page
3. Verify all management buttons are accessible
4. Verify can edit any NC status

**Expected Results:**

- lab_manager can see 'Register NC' button
- lab_manager can see 'Edit Record' button
- lab_manager can change NC status
- lab_manager can close NC (same permissions as technical_manager)

#### 2.4. B-4. test_engineer can add repair history

**File:** `tests/e2e/nc-repair-workflow/group-b/test-engineer-repair-access.spec.ts`

**Steps:**

1. Login as test_engineer using testOperatorPage fixture
2. Navigate to repair history page /equipment/{id}/repair-history
3. Verify 'Add Repair History' button is visible
4. Click button to open dialog
5. Verify form fields are accessible

**Expected Results:**

- test_engineer can access repair history page
- test_engineer can see 'Add Repair History' button
- test_engineer can open repair history dialog
- test_engineer can fill and submit repair history form

#### 2.5. B-5. edit button visibility follows isManager() hook

**File:** `tests/e2e/nc-repair-workflow/group-b/edit-button-visibility.spec.ts`

**Steps:**

1. Compare edit button visibility across three role fixtures
2. testOperatorPage: verify edit button NOT visible
3. techManagerPage: verify edit button visible
4. siteAdminPage: verify edit button visible

**Expected Results:**

- useAuth().isManager() returns false for test_engineer
- useAuth().isManager() returns true for technical_manager
- useAuth().isManager() returns true for lab_manager
- Edit button renders conditionally based on isManager()

### 3. Group C: Repair History Form Validation

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 3.1. C-1. should validate required fields (repairDate, repairDescription)

**File:** `tests/e2e/nc-repair-workflow/group-c/required-field-validation.spec.ts`

**Steps:**

1. Navigate to repair history page
2. Click 'Add Repair History' button
3. Clear the pre-filled repair date
4. Leave repair description empty
5. Click 'Register' button
6. Verify validation errors appear

**Expected Results:**

- Form shows validation error for empty repair date
- Form shows validation error for empty repair description
- Submit button remains enabled but form does not submit
- Error messages match Zod schema messages

#### 3.2. C-2. should validate minimum length for repairDescription (10 chars)

**File:** `tests/e2e/nc-repair-workflow/group-c/min-length-validation.spec.ts`

**Steps:**

1. Navigate to repair history page
2. Click 'Add Repair History' button
3. Enter repair date
4. Enter repair description with only 5 characters
5. Click 'Register' button
6. Verify validation error for min length

**Expected Results:**

- Validation error shows: 'Repair description must be at least 10 characters'
- Form does not submit with invalid description
- Error clears when description reaches 10+ characters

#### 3.3. C-3. should submit successfully with optional fields empty

**File:** `tests/e2e/nc-repair-workflow/group-c/optional-fields-empty.spec.ts`

**Steps:**

1. Navigate to repair history page
2. Click 'Add Repair History' button
3. Fill only required fields: repairDate, repairDescription (10+ chars)
4. Leave optional fields empty: repairedBy, repairCompany, cost, repairResult, notes
5. Click 'Register' button

**Expected Results:**

- Form submits successfully
- Success toast appears
- Empty optional fields are converted to undefined (not empty strings)
- Backend accepts the submission without validation errors

#### 3.4. C-4. should validate cost field accepts only non-negative numbers

**File:** `tests/e2e/nc-repair-workflow/group-c/cost-validation.spec.ts`

**Steps:**

1. Navigate to repair history page
2. Click 'Add Repair History' button
3. Fill required fields
4. Enter negative number in cost field
5. Verify validation behavior
6. Enter valid positive number
7. Verify validation passes

**Expected Results:**

- Cost field has type='number' with min='0'
- Zod schema validates cost >= 0
- Negative values show validation error
- Zero and positive values are accepted

#### 3.5. C-5. should reset form after successful submission

**File:** `tests/e2e/nc-repair-workflow/group-c/form-reset-after-submit.spec.ts`

**Steps:**

1. Navigate to repair history page
2. Click 'Add Repair History' button
3. Fill all fields with test data
4. Submit the form
5. Wait for success toast
6. Click 'Add Repair History' button again
7. Verify form fields are reset to defaults

**Expected Results:**

- After successful submit, dialog closes
- New dialog shows form with default values
- repairDate defaults to today's date (format: yyyy-MM-dd)
- repairDescription is empty
- Optional fields are empty/undefined
- nonConformanceId shows 'None selected' placeholder

#### 3.6. C-6. should display NC dropdown with correct label format

**File:** `tests/e2e/nc-repair-workflow/group-c/nc-dropdown-format.spec.ts`

**Steps:**

1. Navigate to repair history page for equipment with open NCs
2. Click 'Add Repair History' button
3. Click on NC selection dropdown
4. Verify dropdown options format

**Expected Results:**

- Dropdown shows 'None selected' as first option
- NC options follow format: [TYPE_LABEL] cause_text (YYYY-MM-DD)
- TYPE_LABEL uses NON_CONFORMANCE_TYPE_LABELS from SSOT
- Only open/analyzing/corrected NCs appear (not closed)
- NCs already linked to repair do not appear

### 4. Group D: Full Workflow Integration (Sequential)

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 4.1. D-1. should change equipment status to non_conforming when NC is created

**File:** `tests/e2e/nc-repair-workflow/group-d/nc-creates-status-change.spec.ts`

**Steps:**

1. Navigate to equipment detail page for available equipment
2. Verify current status is 'available'
3. Create a damage type NC through incident registration
4. Wait for form submission to complete
5. Navigate back to equipment detail page
6. Verify equipment status

**Expected Results:**

- Equipment status changes from 'available' to 'non_conforming'
- Status badge shows red color for non_conforming
- NC banner appears on equipment detail page
- React Query cache is invalidated for equipmentList

#### 4.2. D-2. should create repair history with NC connection

**File:** `tests/e2e/nc-repair-workflow/group-d/repair-with-nc-connection.spec.ts`

**Steps:**

1. Navigate to repair history page for equipment with open NC
2. Click 'Add Repair History' button
3. Fill required fields: repairDate, repairDescription
4. Select NC from dropdown
5. Verify auto-link guidance appears
6. Select repair result as 'completed'
7. Submit the form

**Expected Results:**

- Repair history is created successfully
- NC is linked to repair history (repairHistoryId set)
- Auto-link guidance shows when NC is selected
- NC status automatically changes to 'corrected' when repair result is 'completed'

#### 4.3. D-3. should automatically update NC to corrected when repair is completed

**File:** `tests/e2e/nc-repair-workflow/group-d/nc-auto-corrected.spec.ts`

**Steps:**

1. Create repair history with NC connection and result='completed'
2. Navigate to NC management page
3. Find the connected NC

**Expected Results:**

- NC status badge shows 'corrected' (blue color)
- Resolution type badge shows 'repair'
- Repair history link badge is visible
- Success message shows: 'Repair record connected - closure approval available'

#### 4.4. D-4. should allow technical_manager to close NC after repair

**File:** `tests/e2e/nc-repair-workflow/group-d/tech-manager-closes-nc.spec.ts`

**Steps:**

1. Login as technical_manager
2. Navigate to NC management page
3. Find corrected NC with repair link
4. Verify NC can be closed (repair requirement satisfied)
5. Close NC via API call (PATCH /api/non-conformances/{id}/close)

**Expected Results:**

- NC status changes to 'closed'
- closedBy field is set to technical_manager ID
- closedAt timestamp is recorded
- closureNotes are saved if provided

#### 4.5. D-5. should restore equipment status to available when all NCs are closed

**File:** `tests/e2e/nc-repair-workflow/group-d/equipment-status-restored.spec.ts`

**Steps:**

1. Ensure all NCs for equipment are closed
2. Navigate to equipment detail page
3. Verify equipment status

**Expected Results:**

- Equipment status returns to 'available'
- Status badge shows green color
- NC banner is no longer displayed
- Equipment can be used for operations again

#### 4.6. D-6. should verify complete workflow from incident to resolution

**File:** `tests/e2e/nc-repair-workflow/group-d/complete-workflow-verification.spec.ts`

**Steps:**

1. Verify equipment was initially available
2. Verify NC was created with correct type and status
3. Verify repair was registered with NC connection
4. Verify NC auto-transitioned to corrected
5. Verify NC was closed by authorized manager
6. Verify equipment status was restored

**Expected Results:**

- Complete audit trail is maintained
- All status transitions followed UL-QP-18 procedures
- Equipment, NC, and repair records are consistent
- No orphaned records or broken references

### 5. Group E: Data Integrity and Business Rules

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 5.1. E-1. should show repair warning for damage/malfunction NC types

**File:** `tests/e2e/nc-repair-workflow/group-e/repair-warning-damage-type.spec.ts`

**Steps:**

1. Navigate to NC management page for equipment with damage type NC (no repair)
2. Find NC card with ncType = damage or malfunction
3. Verify warning card is displayed

**Expected Results:**

- Yellow warning card appears with text 'Repair record required'
- Warning explains that damage/malfunction types require repair before closure
- Link to repair history page is provided
- Warning does NOT appear for calibration_failure, measurement_error, or other types

#### 5.2. E-2. should block NC closure without repair for damage/malfunction

**File:** `tests/e2e/nc-repair-workflow/group-e/block-closure-without-repair.spec.ts`

**Steps:**

1. Login as technical_manager
2. Navigate to NC management page with damage NC without repair
3. Click 'Edit Record' button
4. Try to change status to 'corrected'
5. Verify dialog appears

**Expected Results:**

- Browser confirm dialog appears with warning message
- Dialog message mentions repair requirement
- Clicking Cancel prevents status change
- Clicking OK redirects to repair history page

#### 5.3. E-3. should show success message when repair is connected to NC

**File:** `tests/e2e/nc-repair-workflow/group-e/repair-connected-success.spec.ts`

**Steps:**

1. Navigate to NC management page for equipment with corrected NC + repair
2. Find NC card with repairHistoryId populated

**Expected Results:**

- Green success text shows: 'Repair record connected - closure approval available'
- Clickable link to repair history page is visible
- Yellow warning card is NOT displayed
- NC can proceed to closure

#### 5.4. E-4. should prevent already-linked NC from appearing in repair dropdown

**File:** `tests/e2e/nc-repair-workflow/group-e/prevent-double-link.spec.ts`

**Steps:**

1. Navigate to repair history page for equipment with linked NC
2. Click 'Add Repair History' button
3. Open NC selection dropdown
4. Verify linked NC does not appear

**Expected Results:**

- NCs already linked to repair history are filtered out
- 1:1 relationship between NC and repair is enforced
- Only unlinked open/analyzing/corrected NCs appear in dropdown

#### 5.5. E-5. should prevent closed NC from appearing in repair dropdown

**File:** `tests/e2e/nc-repair-workflow/group-e/prevent-closed-nc-link.spec.ts`

**Steps:**

1. Navigate to repair history page for equipment with closed NC
2. Click 'Add Repair History' button
3. Open NC selection dropdown
4. Verify closed NC does not appear

**Expected Results:**

- Closed NCs are not available for repair linking
- Only open, analyzing, corrected status NCs appear
- Prevents modification of historical closed records

#### 5.6. E-6. should not require repair for calibration_failure or measurement_error types

**File:** `tests/e2e/nc-repair-workflow/group-e/no-repair-required-other-types.spec.ts`

**Steps:**

1. Navigate to NC management page with calibration_failure NC
2. Verify no repair warning card appears
3. Attempt to change status to corrected
4. Verify no confirmation dialog appears

**Expected Results:**

- calibration_failure and measurement_error types do not show repair warning
- These types can be corrected without repair
- resolutionType can be 'recalibration' instead of 'repair'
- Technical manager can close without repair requirement
