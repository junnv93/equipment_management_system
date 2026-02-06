# Calibration Overdue Automatic Non-Conformance Conversion Test Plan

## Application Overview

This test plan covers the comprehensive testing of the "Calibration Overdue Automatic Non-Conformance Conversion" feature in the Laboratory Equipment Management System implementing UL-QP-18 procedures.

**Feature Overview:**
The system automatically detects equipment with overdue calibration dates and converts them to non-conforming status. This includes:

1. **Hourly Scheduler** (Every hour at 00:00): Automatically checks for calibration overdue equipment
2. **Manual API Trigger**: `POST /api/notifications/trigger-overdue-check` for on-demand processing
3. **Auto-Resolution**: When calibration is approved, the `calibration_overdue` non-conformance is automatically marked as corrected with `resolutionType='recalibration'`

**Key Components:**

- `CalibrationOverdueScheduler`: Backend service at `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts`
- `CalibrationService`: Handles calibration approval and auto-correction at `apps/backend/src/modules/calibration/calibration.service.ts`
- `IncidentHistoryTab`: Frontend component at `apps/frontend/components/equipment/IncidentHistoryTab.tsx`
- `NonConformances` table: Schema at `packages/db/src/schema/non-conformances.ts`

**Equipment Filtering Criteria (for Overdue Detection):**

- `nextCalibrationDate < today`
- `calibrationRequired = 'required'`
- `isActive = true`
- `status NOT IN ('non_conforming', 'disposed', 'pending_disposal', 'retired', 'inactive')`
- No existing open/analyzing `calibration_overdue` non-conformance

**Database Entities Affected:**

- `equipment` (status changes to `non_conforming`)
- `non_conformances` (new record with `ncType='calibration_overdue'`)
- `equipment_incident_history` (new record with `incidentType='calibration_overdue'`)
- `notifications` (system notification for admin)

**Role Hierarchy (based on permissions):**

- `test_engineer`: Can view equipment details, register incidents, cannot trigger overdue check
- `technical_manager`: Has UPDATE_EQUIPMENT permission, can approve calibrations
- `lab_manager`: Full access, can trigger manual overdue check via UPDATE_EQUIPMENT permission

**Test Credentials:**

- Lab Manager: admin@example.com / admin123
- Technical Manager: manager@example.com / manager123
- Test Engineer: user@example.com / user123

**Authentication Method:**
Use NextAuth Credentials callback as documented in `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

**SSOT (Single Source of Truth):**

- All enums (`calibration_overdue`, `non_conforming`) from `@equipment-management/schemas`
- All permissions (`Permission.UPDATE_EQUIPMENT`) from `@equipment-management/shared-constants`
- Database schema shared via `@equipment-management/db`

**Base URLs:**

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Test Scenarios

### 1. Group 1: Backend API - Manual Overdue Check Trigger (Sequential)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-overdue-check.spec.ts`

#### 1.1. 1.1 should successfully trigger manual overdue check with lab_manager role

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Login as Lab Manager (admin@example.com) using NextAuth callback
2. Send POST request to http://localhost:3001/api/notifications/trigger-overdue-check with session token
3. Parse the JSON response body

**Expected Results:**

- API returns 200 OK status
- Response body contains 'processed' count (total equipment checked)
- Response body contains 'created' count (new non-conformances created)
- Response body contains 'skipped' count (already processed equipment)
- Response body contains 'details' array with equipmentId, managementNumber, action fields

#### 1.2. 1.2 should return 403 for test_engineer without UPDATE_EQUIPMENT permission

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Login as Test Engineer (user@example.com) using NextAuth callback
2. Send POST request to http://localhost:3001/api/notifications/trigger-overdue-check
3. Verify error response

**Expected Results:**

- API returns 403 Forbidden status
- Response body contains error message about insufficient permissions
- No non-conformance records are created in database

#### 1.3. 1.3 should detect and process equipment with overdue calibration dates

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Create test equipment via API with nextCalibrationDate = 7 days ago
2. Set calibrationRequired = 'required' and status = 'available' and isActive = true
3. Login as Lab Manager
4. Trigger manual overdue check via POST /api/notifications/trigger-overdue-check
5. Check response details array for the test equipment

**Expected Results:**

- Test equipment appears in response details array
- action field shows 'created' for newly processed equipment
- Equipment managementNumber is included in response
- created count is incremented

#### 1.4. 1.4 should skip equipment already in non_conforming status

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Create test equipment with nextCalibrationDate in the past
2. Set equipment status to 'non_conforming'
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify the equipment is NOT in the processed details

**Expected Results:**

- Equipment with 'non_conforming' status is excluded from processing
- Equipment does not appear in response details array
- No duplicate non-conformance is created

#### 1.5. 1.5 should skip equipment with existing open calibration_overdue non-conformance

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Create test equipment with overdue calibration date
2. Create existing non-conformance with ncType='calibration_overdue' and status='open'
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Check response for skipped equipment

**Expected Results:**

- Equipment is skipped in processing
- Details array shows action='skipped'
- Reason field explains 'existing calibration_overdue non-conformance exists'
- skipped count includes this equipment

#### 1.6. 1.6 should skip equipment with calibrationRequired != 'required'

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Create test equipment with calibrationRequired = 'not_applicable'
2. Set nextCalibrationDate to past date
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify equipment is not processed

**Expected Results:**

- Equipment with calibrationRequired='not_applicable' is excluded from check
- Equipment does not appear in processed or skipped counts
- No non-conformance is created

#### 1.7. 1.7 should skip disposed, retired, pending_disposal, and inactive equipment

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-overdue-trigger.spec.ts`

**Steps:**

1. Create 4 test equipment with status values: 'disposed', 'retired', 'pending_disposal', 'inactive'
2. All have overdue calibration dates and calibrationRequired = 'required'
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify none of the equipment are processed

**Expected Results:**

- Disposed equipment is excluded from processing
- Retired equipment is excluded from processing
- pending_disposal equipment is excluded from processing
- inactive equipment is excluded from processing
- All EXCLUDED_STATUSES are correctly filtered

### 2. Group 2: Backend API - Non-Conformance Creation (Sequential)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-nc-creation.spec.ts`

#### 2.1. 2.1 should create non-conformance record with correct fields

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-nc-creation.spec.ts`

**Steps:**

1. Create test equipment with overdue calibration (nextCalibrationDate = yesterday)
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Query GET /api/non-conformances?equipmentId={equipmentId} for the equipment

**Expected Results:**

- Non-conformance record is created in database
- ncType = 'calibration_overdue'
- status = 'open'
- cause contains 'Calibration overdue' or '교정 기한 초과' and the next calibration date
- actionPlan = '교정 수행 필요'
- discoveredBy is null (system-generated)
- discoveryDate = today's date

#### 2.2. 2.2 should change equipment status to non_conforming

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-nc-creation.spec.ts`

**Steps:**

1. Create test equipment with status = 'available'
2. Equipment has overdue calibration date
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Query GET /api/equipment/{id} to verify equipment status

**Expected Results:**

- Equipment status changed from 'available' to 'non_conforming'
- updatedAt timestamp is updated
- Other equipment fields remain unchanged

#### 2.3. 2.3 should create incident history record automatically

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-nc-creation.spec.ts`

**Steps:**

1. Create test equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Query GET /api/equipment/{id}/incident-history for the equipment

**Expected Results:**

- Incident history record is created
- incidentType = 'calibration_overdue'
- content contains 'Auto non-conformance transition' or '자동 부적합 전환'
- content contains the non-conformance ID
- reportedBy is null (system-generated)
- occurredAt = today's date

#### 2.4. 2.4 should create system notification for administrators

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-nc-creation.spec.ts`

**Steps:**

1. Create test equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Query GET /api/notifications for recent system notifications

**Expected Results:**

- System notification is created
- title contains '교정 기한 초과 알림' (Calibration Overdue Alert)
- content contains equipment name and management number
- priority = 'high'

#### 2.5. 2.5 should execute all database operations in a transaction (atomicity)

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-nc-creation.spec.ts`

**Steps:**

1. Create test equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Verify all three records exist: non-conformance, equipment status, incident history

**Expected Results:**

- Non-conformance, equipment status change, and incident history are all created together
- If one operation would fail, all would be rolled back (verified by code review)
- No partial state exists in database

#### 2.6. 2.6 should process multiple overdue equipment in single API call

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-nc-creation.spec.ts`

**Steps:**

1. Create 3 test equipment with overdue calibration dates
2. All equipment meet processing criteria (available, required calibration, active)
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify all equipment are processed

**Expected Results:**

- Response shows processed = 3 (or includes the 3 test equipment)
- Response shows created = 3 (for the test equipment)
- Details array contains 3 entries with action='created'
- Each equipment has its own non-conformance record
- Each equipment has its own incident history record

### 3. Group 3: Backend API - Calibration Approval Auto-Correction (Sequential)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-auto-correction.spec.ts`

#### 3.1. 3.1 should auto-correct calibration_overdue NC when calibration is approved

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-calibration-approval.spec.ts`

**Steps:**

1. Setup test equipment with calibration_overdue non-conformance (status='open')
2. Create pending calibration record for the equipment (approvalStatus='pending_approval')
3. Login as Technical Manager
4. Approve the calibration via POST /api/calibration/{id}/approve with approverComment
5. Query GET /api/non-conformances?equipmentId={id} for the equipment

**Expected Results:**

- Non-conformance status changes from 'open' to 'corrected'
- resolutionType = 'recalibration'
- calibrationId links to the approved calibration record
- correctionContent = '교정 완료로 인한 자동 조치 완료'
- correctionDate = today's date
- correctedBy = approver's user ID

#### 3.2. 3.2 should update equipment calibration dates when calibration is approved

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-calibration-approval.spec.ts`

**Steps:**

1. Setup test equipment with outdated calibration dates
2. Create pending calibration record with calibrationDate and nextCalibrationDate
3. Login as Technical Manager
4. Approve the calibration
5. Query GET /api/equipment/{id} for the test equipment

**Expected Results:**

- Equipment lastCalibrationDate updated to calibration date from record
- Equipment nextCalibrationDate updated to next calibration date from record
- Equipment updatedAt timestamp is updated

#### 3.3. 3.3 should not fail calibration approval if no calibration_overdue NC exists

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-calibration-approval.spec.ts`

**Steps:**

1. Setup test equipment without any non-conformance record
2. Create pending calibration record
3. Login as Technical Manager
4. Approve the calibration
5. Verify approval succeeds

**Expected Results:**

- Calibration approval succeeds with 200 status
- No error occurs from missing non-conformance
- Equipment calibration dates are still updated correctly
- API response shows approved calibration

#### 3.4. 3.4 should only auto-correct NC with status 'open' or 'analyzing'

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-calibration-approval.spec.ts`

**Steps:**

1. Setup test equipment with calibration_overdue NC (status='corrected')
2. Create pending calibration record
3. Login as Technical Manager
4. Approve the calibration
5. Query non-conformances for the equipment

**Expected Results:**

- Existing 'corrected' non-conformance is not modified
- Existing 'closed' non-conformance is not modified (tested separately)
- Only 'open' or 'analyzing' status non-conformances would be auto-corrected

#### 3.5. 3.5 should require pending_approval status for calibration approval

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-calibration-approval.spec.ts`

**Steps:**

1. Setup calibration record with approvalStatus='approved' (already approved)
2. Login as Technical Manager
3. Attempt to approve the calibration again via POST /api/calibration/{id}/approve
4. Verify error response

**Expected Results:**

- API returns 400 Bad Request
- Error message indicates 'Only pending_approval calibrations can be approved' or similar
- No changes occur to any records

#### 3.6. 3.6 should handle auto-correction failure gracefully (best effort)

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/api-calibration-approval.spec.ts`

**Steps:**

1. Setup test equipment with calibration_overdue NC
2. Create pending calibration record
3. Login as Technical Manager
4. Approve the calibration (auto-correction runs as best-effort)
5. Verify calibration approval succeeds even if logging shows warnings

**Expected Results:**

- Calibration approval succeeds (main operation)
- Equipment calibration dates are updated
- If auto-correction fails, it is logged as warning but does not block approval
- This is verified by code inspection: markCalibrationOverdueAsCorrected uses try-catch

### 4. Group 4: Frontend - Incident History Tab UI (Parallel OK)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-incident-ui.spec.ts`

#### 4.1. 4.1 should display calibration_overdue option in incident type selector

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page at /equipment/{id}
3. Click on 'Incident History' (사고 이력) tab
4. Click 'Register Incident' (사고 등록) button to open dialog
5. Click on incident type dropdown (사고 유형)

**Expected Results:**

- Incident type dropdown shows 5 options
- Options include: 손상 (Damage), 오작동 (Malfunction), 변경 (Change), 수리 (Repair), 교정 기한 초과 (Calibration Overdue)
- 'Calibration Overdue' appears as '교정 기한 초과' in Korean

#### 4.2. 4.2 should show non-conformance checkbox for calibration_overdue incident type

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select '교정 기한 초과' (Calibration Overdue) as incident type
3. Verify non-conformance checkbox appears

**Expected Results:**

- Checkbox labeled '부적합으로 등록' appears
- Checkbox has yellow background styling visible
- Description explains 'Equipment status will change to Non-conforming' or '장비 상태가 부적합으로 변경됩니다'
- Checkbox is unchecked by default

#### 4.3. 4.3 should show action plan field when non-conformance checkbox is checked

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select '교정 기한 초과' incident type
3. Check '부적합으로 등록' checkbox
4. Verify action plan field appears

**Expected Results:**

- '조치 계획' (Action Plan) textarea field appears
- Field is marked as optional
- Placeholder suggests examples like '외부 수리 예정, 부품 교체 필요'

#### 4.4. 4.4 should hide non-conformance checkbox for 'Change' and 'Repair' incident types

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select '변경' (Change) as incident type
3. Verify non-conformance checkbox is not visible
4. Select '수리' (Repair) as incident type
5. Verify non-conformance checkbox is still not visible

**Expected Results:**

- Non-conformance checkbox is hidden for 'Change' type
- Non-conformance checkbox is hidden for 'Repair' type
- Only visible for: Damage (손상), Malfunction (오작동), Calibration Overdue (교정 기한 초과)

#### 4.5. 4.5 should successfully create incident with non-conformance for calibration_overdue

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page with status 'available'
3. Open incident registration dialog
4. Fill in occurred date: today
5. Select incident type: 교정 기한 초과
6. Enter content: '교정 기한 7일 초과됨'
7. Check '부적합으로 등록' checkbox
8. Enter action plan: '외부 교정기관 교정 예약'
9. Click Submit (저장) button

**Expected Results:**

- Success toast appears with '사고 이력 등록 완료' message
- Dialog closes automatically
- New incident appears in timeline with purple badge for calibration_overdue
- Incident shows '부적합 연결됨' badge
- Page refresh shows equipment status changed to 'Non-conforming' (부적합)

#### 4.6. 4.6 should display calibration_overdue incidents with correct badge styling

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Navigate to equipment with existing calibration_overdue incident history
2. Click on 'Incident History' (사고 이력) tab
3. Locate the calibration_overdue incident in timeline

**Expected Results:**

- Incident badge shows '교정 기한 초과' text
- Badge has purple background color (bg-purple-500)
- AlertTriangle icon is displayed in the timeline circle
- Timeline shows date and content

#### 4.7. 4.7 should validate required fields before submission

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Leave all fields empty (clear the default date)
3. Click Submit button
4. Verify validation errors appear

**Expected Results:**

- Validation error appears for empty occurred date: '발생 일시를 입력하세요'
- Validation error appears for empty incident type
- Validation error appears for empty content: '내용을 입력하세요'
- Form does not submit and dialog remains open

#### 4.8. 4.8 should enforce content length limit of 500 characters

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select any incident type
3. Enter content with more than 500 characters (e.g., 'a' repeated 501 times)
4. Attempt to submit the form

**Expected Results:**

- Validation error appears: '500자 이하로 입력하세요'
- Form cannot be submitted until content is shortened
- Error is visible near the content field

### 5. Group 5: Frontend - Equipment List Integration (Parallel OK)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-equipment-list.spec.ts`

#### 5.1. 5.1 should display D+X overdue badge for equipment with calibration overdue

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/equipment-list-ui.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Navigate to equipment list at /equipment
3. Locate equipment with calibration overdue in the grid
4. Check the calibration date column

**Expected Results:**

- Equipment shows calibration date (e.g., '2025-12-18')
- D+X badge appears showing days overdue (e.g., 'D+46 (초과)')
- Badge has red/warning styling to indicate overdue status

#### 5.2. 5.2 should show 'non_conforming' status badge for converted equipment

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/equipment-list-ui.spec.ts`

**Steps:**

1. Navigate to equipment list at /equipment
2. Locate equipment that was converted to non-conforming due to calibration overdue
3. Check the status column

**Expected Results:**

- Equipment status badge shows '부적합'
- Badge has appropriate destructive/warning styling
- Equipment can still be viewed but operations may be restricted

#### 5.3. 5.3 should filter equipment by non_conforming status

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/equipment-list-ui.spec.ts`

**Steps:**

1. Navigate to equipment list at /equipment
2. Click on status filter dropdown (상태)
3. Select '부적합' (non_conforming) option
4. Verify filtered results

**Expected Results:**

- Equipment list filters to show only non_conforming equipment
- All displayed equipment have '부적합' status badge
- Equipment with calibration overdue NC are included
- Count updates to reflect filtered results

#### 5.4. 5.4 should filter equipment by calibration due status (overdue)

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/equipment-list-ui.spec.ts`

**Steps:**

1. Navigate to equipment list at /equipment
2. Click on calibration due filter dropdown (교정 기한)
3. Select overdue option if available
4. Verify filtered results

**Expected Results:**

- Equipment list filters to show calibration overdue equipment
- All displayed equipment have D+X (초과) badge
- Equipment includes those with calibration_overdue NC

### 6. Group 6: Frontend - Non-Conformance Banner (Parallel OK)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-nc-banner.spec.ts`

#### 6.1. 6.1 should display non-conformance banner on equipment detail page

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-banner-ui.spec.ts`

**Steps:**

1. Login as Lab Manager
2. Navigate to equipment detail page that has calibration_overdue NC
3. Verify non-conformance banner is visible

**Expected Results:**

- Alert banner appears with '부적합 상태' heading
- Banner shows count of non-conformances (e.g., '1건')
- Banner shows cause text: '교정 기한 초과 (다음 교정일: YYYY-MM-DD)'
- Banner shows discovery date
- Banner has warning/destructive styling

#### 6.2. 6.2 should show 부적합 관리 link to non-conformance management

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-banner-ui.spec.ts`

**Steps:**

1. Navigate to equipment detail page with NC
2. Locate the non-conformance banner
3. Click on '부적합 관리' button/link

**Expected Results:**

- '부적합 관리' button is visible in the banner
- Clicking navigates to /equipment/{id}/non-conformance page
- Non-conformance management page loads correctly

#### 6.3. 6.3 should display equipment status as 부적합 in header

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-banner-ui.spec.ts`

**Steps:**

1. Navigate to equipment detail page that has been converted to non_conforming
2. Verify status badges in header

**Expected Results:**

- Equipment status badge shows '부적합'
- Calibration status badge shows D+X (X일 초과)
- Both badges are visible in the equipment header section

### 7. Group 7: Permission Tests (Parallel OK)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-permissions.spec.ts`

#### 7.1. 7.1 should allow lab_manager to trigger manual overdue check

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/permissions.spec.ts`

**Steps:**

1. Login as Lab Manager (lab_manager role)
2. Send POST request to /api/notifications/trigger-overdue-check
3. Verify successful response

**Expected Results:**

- API returns 200 OK status
- Response contains processed, created, skipped counts
- Lab Manager has UPDATE_EQUIPMENT permission required for this endpoint

#### 7.2. 7.2 should allow technical_manager to trigger manual overdue check

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/permissions.spec.ts`

**Steps:**

1. Login as Technical Manager (technical_manager role)
2. Send POST request to /api/notifications/trigger-overdue-check
3. Verify successful response

**Expected Results:**

- API returns 200 OK status
- Technical Manager has UPDATE_EQUIPMENT permission
- Overdue check is triggered successfully

#### 7.3. 7.3 should deny test_engineer from triggering manual overdue check

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/permissions.spec.ts`

**Steps:**

1. Login as Test Engineer (test_engineer role)
2. Send POST request to /api/notifications/trigger-overdue-check
3. Verify forbidden response

**Expected Results:**

- API returns 403 Forbidden status
- Test Engineer does not have UPDATE_EQUIPMENT permission
- Error message indicates insufficient permissions

#### 7.4. 7.4 should allow test_engineer to register incidents with NC checkbox

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/permissions.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to equipment detail page
3. Open incident registration dialog
4. Verify ability to register incident with non-conformance

**Expected Results:**

- Test Engineer can access incident history tab
- Test Engineer can open registration dialog
- Test Engineer can select calibration_overdue type
- Test Engineer can check non-conformance checkbox
- Test Engineer can submit incident successfully

#### 7.5. 7.5 should require technical_manager+ role to delete incidents

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/permissions.spec.ts`

**Steps:**

1. Login as Test Engineer
2. Navigate to equipment detail with incident history
3. Verify delete button visibility
4. Login as Technical Manager
5. Verify delete button is visible

**Expected Results:**

- Test Engineer cannot see delete button for incidents
- Technical Manager can see delete button for incidents
- Lab Manager can see delete button for incidents
- Delete button respects hasRole(['technical_manager', 'lab_manager', 'system_admin']) check

### 8. Group 8: End-to-End Integration - Complete Workflows (Sequential)

**Seed:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-e2e-workflow.spec.ts`

#### 8.1. 8.1 should complete full overdue detection to resolution workflow

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Create test equipment with nextCalibrationDate = 7 days ago, status = 'available'
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Verify equipment status changed to 'non_conforming' via API
5. Navigate to equipment detail page in browser
6. Verify NonConformanceBanner is displayed
7. Create pending calibration record for the equipment
8. Login as Technical Manager
9. Approve the calibration via API
10. Query non-conformance to verify status changed to 'corrected'

**Expected Results:**

- Equipment is detected and status changes to 'non_conforming'
- Non-conformance banner is visible in UI with correct cause
- Calibration approval triggers auto-correction
- Non-conformance shows resolutionType='recalibration'
- Non-conformance is linked to calibration record (calibrationId set)
- Equipment calibration dates are updated

#### 8.2. 8.2 should maintain data consistency across multiple overdue equipment

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Create Equipment A: available, no existing NC, overdue calibration
2. Create Equipment B: available, existing open calibration_overdue NC, overdue calibration
3. Create Equipment C: non_conforming status (damage NC), overdue calibration
4. Login as Lab Manager
5. Trigger manual overdue check
6. Verify each equipment is processed correctly

**Expected Results:**

- Equipment A: processed, NC created, status = 'non_conforming', action='created'
- Equipment B: skipped (existing NC), status unchanged, action='skipped' with reason
- Equipment C: skipped (already non_conforming), no new NC created
- API response correctly categorizes each equipment in details array

#### 8.3. 8.3 should handle calibration approval for equipment with multiple NCs

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Create equipment with two non-conformances: calibration_overdue (status: open) and damage (status: analyzing)
2. Create pending calibration record
3. Login as Technical Manager
4. Approve calibration
5. Query all non-conformances for the equipment

**Expected Results:**

- Only calibration_overdue NC is auto-corrected (status='corrected')
- Damage NC remains in 'analyzing' status unchanged
- Equipment may still have non_conforming status if other NC is not closed
- Each NC type is handled independently

#### 8.4. 8.4 should verify UI updates after backend state changes

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Open equipment detail page in browser (status: available)
2. In a separate API call, trigger manual overdue check
3. Refresh the equipment detail page
4. Verify UI reflects new state

**Expected Results:**

- Equipment status badge updates to '부적합' (Non-conforming)
- NonConformanceBanner appears showing calibration_overdue cause
- Incident History tab shows new calibration_overdue entry
- D+X badge appears in calibration date area

#### 8.5. 8.5 should handle rapid successive overdue checks without creating duplicates

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Create equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check (first call)
4. Immediately trigger manual overdue check again (second call)
5. Query non-conformances for equipment

**Expected Results:**

- First call creates non-conformance successfully (action='created')
- Second call skips equipment (existing NC detected, action='skipped')
- Only one non-conformance record exists in database
- Only one incident history record exists
- No race condition or duplicate entries
