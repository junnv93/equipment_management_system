# Calibration Overdue Auto Non-Conformance Test Plan

## Application Overview

This test plan covers the "Calibration Overdue Auto Non-Conformance" feature in the Laboratory Equipment Management System implementing UL-QP-18 procedures.

**Feature Overview:**
The system automatically detects equipment with overdue calibration dates and converts them to non-conforming status. This includes:

1. **Daily Scheduler** (00:00 UTC): Automatically checks for calibration overdue equipment
2. **Manual API Trigger**: `POST /api/notifications/trigger-overdue-check` for on-demand processing
3. **Auto-Resolution**: When calibration is approved, the `calibration_overdue` non-conformance is automatically marked as corrected

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

**Role Hierarchy:**

- `test_engineer`: Can view equipment details, register incidents, request calibration
- `technical_manager`: Can approve calibrations (triggers auto-correction), has MANAGE_EQUIPMENT permission
- `lab_manager`: Full access, can trigger manual overdue check

**Test Credentials:**

- Lab Manager: admin@example.com / password123
- Technical Manager: manager@example.com / password123
- Test Engineer: user@example.com / password123

**API Endpoints:**

- `POST /api/notifications/trigger-overdue-check` (Permission: MANAGE_EQUIPMENT)
- `POST /api/calibration/:id/approve` (Calibration approval, triggers auto-correction)
- `GET /api/equipment/:id/incident-history` (Incident history list)
- `POST /api/equipment/:id/incident-history` (Create incident with optional non-conformance)
- `GET /api/non-conformances?equipmentId=:id` (Non-conformance list for equipment)

---

## Test Suite 1: Backend API - Manual Overdue Check Trigger

**Seed File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-manual-trigger.spec.ts`

### 1.1. should successfully trigger manual overdue check with lab_manager role

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Login as Lab Manager (admin@example.com)
2. Send POST request to `/api/notifications/trigger-overdue-check`
3. Verify response returns status 200
4. Verify response contains `{ processed, created, skipped, details[] }`

**Expected Results:**

- API returns 200 OK status
- Response body contains `processed` count (total equipment checked)
- Response body contains `created` count (new non-conformances)
- Response body contains `skipped` count (already processed equipment)
- Response body contains `details` array with `equipmentId`, `managementNumber`, `action`

### 1.2. should require MANAGE_EQUIPMENT permission to trigger overdue check

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Login as Test Engineer (user@example.com) without MANAGE_EQUIPMENT permission
2. Send POST request to `/api/notifications/trigger-overdue-check`
3. Verify response returns status 403 Forbidden

**Expected Results:**

- API returns 403 Forbidden status
- Response contains error message about insufficient permissions
- No non-conformance records are created

### 1.3. should detect equipment with overdue calibration dates

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Setup test equipment with `nextCalibrationDate` = 7 days ago
2. Setup equipment with `calibrationRequired = 'required'`
3. Setup equipment with `status = 'available'` and `isActive = true`
4. Login as Lab Manager
5. Trigger manual overdue check via API
6. Verify the test equipment appears in details with `action='created'`

**Expected Results:**

- Test equipment is detected as overdue
- Equipment appears in response details array
- `action` field shows `'created'` for newly processed equipment
- Equipment `managementNumber` is included in response

### 1.4. should skip equipment already in non_conforming status

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Setup test equipment with `nextCalibrationDate` in the past
2. Set equipment `status` to `'non_conforming'`
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify the equipment is NOT processed (not in details)

**Expected Results:**

- Equipment with `non_conforming` status is excluded
- Equipment does not appear in response details
- No duplicate non-conformance is created

### 1.5. should skip equipment with existing open calibration_overdue non-conformance

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Setup test equipment with overdue calibration
2. Create existing non-conformance with `ncType='calibration_overdue'` and `status='open'`
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify the equipment is skipped with reason 'existing non-conformance'

**Expected Results:**

- Equipment is skipped in processing
- Details array shows `action='skipped'`
- Reason field explains 'existing calibration_overdue non-conformance exists'

### 1.6. should skip equipment with calibrationRequired != 'required'

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Setup test equipment with `calibrationRequired = 'not_required'`
2. Set `nextCalibrationDate` to past date
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify the equipment is not processed

**Expected Results:**

- Equipment with `calibrationRequired='not_required'` is excluded from check
- Equipment does not appear in processed or skipped counts

### 1.7. should skip disposed and retired equipment

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts`

**Steps:**

1. Setup test equipment with `status = 'disposed'`
2. Setup another equipment with `status = 'retired'`
3. Both have overdue calibration dates
4. Login as Lab Manager
5. Trigger manual overdue check via API
6. Verify neither equipment is processed

**Expected Results:**

- Disposed equipment is excluded
- Retired equipment is excluded
- `pending_disposal` equipment is also excluded
- `inactive` equipment is also excluded

---

## Test Suite 2: Backend API - Non-Conformance Creation

**Seed File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-nc-creation.spec.ts`

### 2.1. should create non-conformance record with correct fields

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts`

**Steps:**

1. Setup test equipment with overdue calibration (`nextCalibrationDate = 2026-01-01`)
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Query `non_conformances` table for the equipment
5. Verify non-conformance record fields

**Expected Results:**

- Non-conformance record is created in database
- `ncType = 'calibration_overdue'`
- `status = 'open'`
- `cause` contains 'Calibration overdue' and the next calibration date
- `actionPlan = '교정 수행 필요'` (Calibration required)
- `discoveredBy` is null (system-generated)
- `discoveryDate` = today's date

### 2.2. should change equipment status to non_conforming

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts`

**Steps:**

1. Setup test equipment with `status = 'available'`
2. Equipment has overdue calibration
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Query `equipment` table for the test equipment
6. Verify equipment status

**Expected Results:**

- Equipment status changed from `'available'` to `'non_conforming'`
- `updatedAt` timestamp is updated
- Other equipment fields remain unchanged

### 2.3. should create incident history record

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts`

**Steps:**

1. Setup test equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Query `equipment_incident_history` table for the equipment
5. Verify incident history record

**Expected Results:**

- Incident history record is created
- `incidentType = 'calibration_overdue'`
- `content` contains 'Auto non-conformance transition due to calibration overdue'
- `content` contains the non-conformance ID
- `reportedBy` is null (system-generated)
- `occurredAt` = today's date

### 2.4. should create system notification for administrators

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts`

**Steps:**

1. Setup test equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Query notifications for system notifications
5. Verify notification content

**Expected Results:**

- System notification is created
- Notification type = 'system'
- Title contains 'Calibration Overdue Alert' (교정 기한 초과 알림)
- Content contains equipment name and management number
- Priority = 'high'

### 2.5. should execute all database operations in a transaction

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts`

**Steps:**

1. Setup test equipment with overdue calibration
2. Mock database to fail during incident history insert
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify rollback occurred

**Expected Results:**

- If any operation fails, entire transaction is rolled back
- Equipment status remains unchanged
- No partial non-conformance record exists
- No orphan incident history record exists
- Error is logged and returned in response

### 2.6. should process multiple overdue equipment in single call

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts`

**Steps:**

1. Setup 5 test equipment with overdue calibration dates
2. All equipment meet processing criteria
3. Login as Lab Manager
4. Trigger manual overdue check via API
5. Verify all equipment are processed

**Expected Results:**

- Response shows `processed = 5`
- Response shows `created = 5`
- Details array contains 5 entries with `action='created'`
- Each equipment has its own non-conformance record
- Each equipment has its own incident history record

---

## Test Suite 3: Backend API - Calibration Approval Auto-Correction

**Seed File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-auto-correction.spec.ts`

### 3.1. should auto-correct calibration_overdue non-conformance when calibration is approved

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts`

**Steps:**

1. Setup test equipment with `calibration_overdue` non-conformance (`status='open'`)
2. Create pending calibration record for the equipment
3. Login as Technical Manager
4. Approve the calibration via `POST /api/calibration/:id/approve`
5. Query `non_conformances` table for the equipment

**Expected Results:**

- Non-conformance status changes from `'open'` to `'corrected'`
- `resolutionType = 'recalibration'`
- `calibrationId` links to the approved calibration
- `correctionContent = '교정 완료로 인한 자동 조치 완료'` (Auto-corrected due to calibration completion)
- `correctionDate` = today's date
- `correctedBy` = approver's user ID

### 3.2. should update equipment calibration dates when calibration is approved

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts`

**Steps:**

1. Setup test equipment with outdated calibration dates
2. Create pending calibration record with new dates
3. Login as Technical Manager
4. Approve the calibration
5. Query `equipment` table for the test equipment

**Expected Results:**

- Equipment `lastCalibrationDate` updated to calibration date
- Equipment `nextCalibrationDate` updated to next calibration date
- Equipment `updatedAt` timestamp is updated

### 3.3. should not fail calibration approval if no calibration_overdue non-conformance exists

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts`

**Steps:**

1. Setup test equipment without any non-conformance
2. Create pending calibration record
3. Login as Technical Manager
4. Approve the calibration
5. Verify approval succeeds

**Expected Results:**

- Calibration approval succeeds
- No error occurs from missing non-conformance
- Equipment calibration dates are updated
- Log shows 'no open calibration_overdue non-conformance found'

### 3.4. should only auto-correct non-conformances with status 'open' or 'analyzing'

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts`

**Steps:**

1. Setup test equipment with `calibration_overdue` non-conformance (`status='corrected'`)
2. Create pending calibration record
3. Login as Technical Manager
4. Approve the calibration
5. Query `non_conformances` table

**Expected Results:**

- Existing 'corrected' non-conformance is not modified
- Existing 'closed' non-conformance is not modified
- Only 'open' or 'analyzing' status non-conformances are auto-corrected

### 3.5. should require pending_approval status for calibration approval

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts`

**Steps:**

1. Setup calibration record with `approvalStatus='approved'`
2. Login as Technical Manager
3. Attempt to approve the calibration again
4. Verify error response

**Expected Results:**

- API returns 400 Bad Request
- Error message indicates 'Only pending_approval calibrations can be approved'
- No changes occur to non-conformance records

### 3.6. should handle auto-correction failure gracefully (best effort)

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts`

**Steps:**

1. Setup test equipment with `calibration_overdue` non-conformance
2. Mock non-conformance update to fail
3. Login as Technical Manager
4. Approve the calibration
5. Verify calibration approval still succeeds

**Expected Results:**

- Calibration approval succeeds despite auto-correction failure
- Equipment calibration dates are still updated
- Error is logged for failed auto-correction
- Non-conformance remains in original state (best effort operation)

---

## Test Suite 4: Frontend - Incident History Tab Integration

**Seed File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-incident-history.spec.ts`

### 4.1. should display calibration_overdue option in incident type selector

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page
3. Click on 'Incident History' (사고 이력) tab
4. Click 'Register Incident' (사고 등록) button to open dialog
5. Click on incident type dropdown

**Expected Results:**

- Incident type dropdown shows 5 options
- Options include: 손상 (Damage), 오작동 (Malfunction), 변경 (Change), 수리 (Repair), 교정 기한 초과 (Calibration Overdue)
- 'Calibration Overdue' appears as '교정 기한 초과' in Korean

### 4.2. should show non-conformance checkbox for calibration_overdue incident type

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select 'Calibration Overdue' (교정 기한 초과) as incident type
3. Verify non-conformance checkbox appears

**Expected Results:**

- Checkbox labeled '부적합으로 등록' (Register as Non-conformance) appears
- Checkbox has yellow background styling (`bg-yellow-50`)
- Description explains 'Equipment status will change to Non-conforming'
- Checkbox is unchecked by default

### 4.3. should show action plan field when non-conformance checkbox is checked

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select 'Calibration Overdue' incident type
3. Check '부적합으로 등록' checkbox
4. Verify action plan field appears

**Expected Results:**

- '조치 계획' (Action Plan) textarea field appears
- Field is marked as optional
- Placeholder suggests: '예: 외부 수리 예정, 부품 교체 필요 등'

### 4.4. should hide non-conformance checkbox for 'Change' incident type

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Select '변경' (Change) as incident type
3. Verify non-conformance checkbox is not visible

**Expected Results:**

- Non-conformance checkbox is hidden for 'Change' type
- Non-conformance checkbox is hidden for 'Repair' type
- Only visible for: Damage, Malfunction, Calibration Overdue

### 4.5. should successfully create incident with non-conformance for calibration_overdue

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Login as Technical Manager
2. Navigate to equipment detail page
3. Open incident registration dialog
4. Fill in occurred date: today
5. Select incident type: 교정 기한 초과 (Calibration Overdue)
6. Enter content: '교정 기한 7일 초과됨' (Calibration deadline exceeded by 7 days)
7. Check '부적합으로 등록'
8. Enter action plan: '외부 교정기관 교정 예약' (Schedule calibration with external agency)
9. Click Submit (저장) button

**Expected Results:**

- Success toast appears: '사고 이력 등록 완료'
- Dialog closes automatically
- New incident appears in timeline with purple badge (`calibration_overdue`)
- Incident shows '부적합 연결됨' badge
- Equipment status changes to 'Non-conforming' (refresh shows update)

### 4.6. should display calibration_overdue incidents with correct badge styling

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Navigate to equipment with `calibration_overdue` incident history
2. Click on 'Incident History' tab
3. Locate the `calibration_overdue` incident in timeline

**Expected Results:**

- Incident badge shows '교정 기한 초과' (Calibration Overdue)
- Badge has purple background color (`bg-purple-500`)
- AlertTriangle icon is displayed
- Timeline shows date and content

### 4.7. should validate required fields before submission

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Leave all fields empty
3. Click Submit button
4. Verify validation errors

**Expected Results:**

- Validation error for empty occurred date
- Validation error for empty incident type
- Validation error for empty content
- Submit button remains enabled but form does not submit

### 4.8. should enforce content length limit of 500 characters

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts`

**Steps:**

1. Open incident registration dialog
2. Enter content with more than 500 characters
3. Verify validation error

**Expected Results:**

- Validation error appears: '500자 이하로 입력하세요'
- Form cannot be submitted until content is shortened

---

## Test Suite 5: End-to-End Integration - Complete Workflow

**Seed File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-e2e-workflow.spec.ts`

### 5.1. should complete full overdue detection to resolution workflow

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Setup test equipment with `nextCalibrationDate` = 7 days ago, `status = 'available'`
2. Login as Lab Manager
3. Trigger manual overdue check via API
4. Verify equipment status changed to `non_conforming`
5. Navigate to equipment detail page
6. Verify NonConformanceBanner is displayed
7. Login as Technical Manager
8. Create and approve calibration record
9. Verify non-conformance status changed to 'corrected'

**Expected Results:**

- Equipment detected and marked `non_conforming`
- Non-conformance banner visible with correct cause
- Calibration approval triggers auto-correction
- Non-conformance shows `resolutionType='recalibration'`
- Equipment calibration dates are updated
- Non-conformance linked to calibration record

### 5.2. should maintain data consistency across multiple overdue equipment

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Setup 3 equipment with overdue calibration:
   - Equipment A: available, no existing NC
   - Equipment B: available, existing open `calibration_overdue` NC
   - Equipment C: `non_conforming` status (different cause)
2. Trigger manual overdue check
3. Verify each equipment processed correctly

**Expected Results:**

- Equipment A: processed, NC created, status = `non_conforming`
- Equipment B: skipped (existing NC), status unchanged
- Equipment C: skipped (already `non_conforming`), no new NC
- Response correctly categorizes each equipment

### 5.3. should handle calibration approval for equipment with multiple non-conformances

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Setup equipment with two non-conformances:
   - `calibration_overdue` (status: open)
   - `damage` (status: analyzing)
2. Create pending calibration record
3. Login as Technical Manager
4. Approve calibration
5. Query non-conformances for equipment

**Expected Results:**

- Only `calibration_overdue` NC is auto-corrected
- Damage NC remains in 'analyzing' status
- Equipment may still have `non_conforming` status if other NC is open

### 5.4. should verify UI updates after backend state changes

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Open equipment detail page in browser
2. Trigger manual overdue check via API in separate request
3. Refresh the equipment detail page
4. Verify UI reflects new state

**Expected Results:**

- Equipment status badge updates to 'Non-conforming'
- NonConformanceBanner appears
- Incident History tab shows new `calibration_overdue` entry
- Checkout button becomes disabled/hidden

### 5.5. should handle rapid successive overdue checks without creating duplicates

**File:** `apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

**Steps:**

1. Setup equipment with overdue calibration
2. Login as Lab Manager
3. Trigger manual overdue check (first call)
4. Immediately trigger manual overdue check again (second call)
5. Query non-conformances for equipment

**Expected Results:**

- First call creates non-conformance successfully
- Second call skips equipment (existing NC detected)
- Only one non-conformance record exists
- Only one incident history record exists

---

## Summary

This test plan covers 29 comprehensive test cases across 5 test suites:

| Suite                                   | Test Count | Focus Area                                                |
| --------------------------------------- | ---------- | --------------------------------------------------------- |
| 1. Manual Overdue Check Trigger         | 7          | API trigger endpoint, permission checks, filtering logic  |
| 2. Non-Conformance Creation             | 6          | Database operations, transaction integrity, notifications |
| 3. Calibration Approval Auto-Correction | 6          | Auto-resolution workflow, status transitions              |
| 4. Incident History Tab Integration     | 8          | Frontend UI, form validation, user interactions           |
| 5. End-to-End Integration               | 5          | Complete workflows, data consistency                      |

**Key Files Referenced:**

- Backend Scheduler: `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts`
- Calibration Service: `apps/backend/src/modules/calibration/calibration.service.ts`
- Notifications Controller: `apps/backend/src/modules/notifications/notifications.controller.ts`
- Frontend Incident Tab: `apps/frontend/components/equipment/IncidentHistoryTab.tsx`
- Non-Conformances Schema: `packages/db/src/schema/non-conformances.ts`
- Enums (SSOT): `packages/schemas/src/enums.ts`

**SSOT Compliance:**

- All enum values (`calibration_overdue`) are sourced from `@equipment-management/schemas`
- API endpoints follow shared constants in `@equipment-management/shared-constants`
- Database schema is shared via `@equipment-management/db`

**Best Practices:**

- Transaction-based database operations
- Permission-based access control (RBAC)
- Best-effort error handling for non-critical operations
- Comprehensive validation (backend + frontend)
- Direct database verification alongside API/UI testing
- Edge case coverage (concurrent operations, null values, timezone handling)
