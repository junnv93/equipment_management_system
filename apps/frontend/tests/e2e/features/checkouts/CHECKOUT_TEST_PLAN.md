# Checkout/Rental E2E Test Plan

## 개요

이 테스트 플랜은 장비 반출입 시스템의 전체 비즈니스 프로세스를 검증합니다.

- **단순 UI 존재 확인이 아닌** 실제 백엔드 API + DB 상태 통합 검증
- **의존성 격리**: 병렬 가능한 테스트와 직렬 실행이 필요한 테스트를 명확히 분리
- **SSOT 준수**: 모든 상태/라벨은 `@equipment-management/schemas`에서 import

---

## 테스트 실행 전략

### 병렬 실행 가능 (Parallel)

- **Suite 01**: 조회 전용 (상태 변경 없음)
- **Suite 02**: 신규 생성 (ID 동적 할당)
- **Suite 11**: 권한 검증 (read-only API 호출)

### 직렬 실행 필수 (Serial within suite)

- **Suite 03-10**: 상태 변경 테스트 (각 스위트는 전용 ID 사용하므로 스위트 간은 병렬 가능)

### ID 격리 전략

| Suite    | IDs                                | 변경 여부                     |
| -------- | ---------------------------------- | ----------------------------- |
| Suite 01 | 015-018, 050-055, 056-061, 062-064 | ❌ Read-only                  |
| Suite 02 | 동적 생성                          | ✅ 신규 생성만                |
| Suite 03 | 001-003, 005                       | ✅ pending → approved         |
| Suite 04 | 004, 006-008                       | ✅ pending → rejected         |
| Suite 05 | 009-010, 013                       | ✅ approved → checked_out     |
| Suite 06 | 019-022                            | ✅ checked_out → returned     |
| Suite 07 | 042-044, 012                       | ✅ returned → return_approved |
| Suite 08 | 동적 생성                          | ✅ 전체 라이프사이클          |
| Suite 09 | 동적 생성                          | ✅ pending → canceled         |
| Suite 10 | 011, 014, 027, 030, 033, 036       | ✅ 대여 4단계 전이            |
| Suite 11 | API only                           | ❌ UI 프로빙만                |

---

## Suite 01: Read-Only Tests (병렬)

### s01-list-display.spec.ts - 반출 목록 조회

#### TEST-01-01: 반출 목록 페이지 로드 및 기본 구조 검증

**Priority**: P1
**Role**: technical_manager
**Execution**: parallel

**Steps:**

1. Navigate to `/checkouts`
2. Verify page heading visible (반출 관리 or 반출입 관리)
3. Verify tab buttons visible: "반출" and "반입"
4. Verify table headers visible
5. Verify filter controls present

**Verification:**

- **UI**: Heading, tabs, table structure
- **API**: `GET /api/checkouts` returns `meta.totalItems > 0`
- **DB**: N/A (read-only)

**Assertions:**

```typescript
await expect(page.getByRole('heading', { name: /반출.*관리/ })).toBeVisible();
await expect(page.getByRole('tab', { name: '반출' })).toBeVisible();
await expect(page.getByRole('tab', { name: '반입' })).toBeVisible();

// API verification
const response = await apiGet(page, '/api/checkouts');
expect(response.meta.totalItems).toBeGreaterThan(0);
```

---

#### TEST-01-02: 상태별 필터링 (pending, approved, checked_out)

**Priority**: P1
**Role**: technical_manager
**Execution**: parallel

**Steps:**

1. Navigate to `/checkouts`
2. Select status filter: "승인 대기" (pending)
3. Verify filtered results
4. Change filter to "승인됨" (approved)
5. Verify filtered results
6. Change filter to "반출 중" (checked_out)
7. Verify filtered results

**Verification:**

- **UI**: Filter dropdown changes, table updates
- **API**: `GET /api/checkouts?statuses=pending` → all items have `status=pending`
- **API**: `GET /api/checkouts?statuses=approved` → all items have `status=approved`
- **DB**: N/A (read-only)

**Assertions:**

```typescript
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';

// Test pending filter
await page.getByLabel('상태').selectOption('pending');
const pendingResponse = await apiGet(page, '/api/checkouts?statuses=pending');
expect(pendingResponse.items.every((item) => item.status === 'pending')).toBe(true);

// Test approved filter
await page.getByLabel('상태').selectOption('approved');
const approvedResponse = await apiGet(page, '/api/checkouts?statuses=approved');
expect(approvedResponse.items.every((item) => item.status === 'approved')).toBe(true);
```

---

#### TEST-01-03: 목적별 필터링 (calibration, repair, rental)

**Priority**: P2
**Role**: technical_manager
**Execution**: parallel

**Steps:**

1. API: `GET /api/checkouts?purpose=calibration`
2. Verify all results have `purpose=calibration`
3. API: `GET /api/checkouts?purpose=repair`
4. Verify all results have `purpose=repair`
5. API: `GET /api/checkouts?purpose=rental`
6. Verify all results have `purpose=rental`

**Verification:**

- **UI**: Optional (can test via API only for speed)
- **API**: Purpose filter returns correct results
- **DB**: N/A (read-only)

---

#### TEST-01-04: 페이지네이션 동작 검증

**Priority**: P2
**Role**: technical_manager
**Execution**: parallel

**Steps:**

1. API: `GET /api/checkouts?page=1&pageSize=20`
2. Verify `meta.totalItems`, `meta.currentPage`, `meta.totalPages`
3. If `totalPages > 1`: API: `GET /api/checkouts?page=2&pageSize=20`
4. Verify `meta.currentPage = 2`, `items.length > 0`
5. UI: Click "다음 페이지" button
6. Verify URL changes to `?page=2`

**Verification:**

- **UI**: Pagination buttons work
- **API**: Page parameter correctly applied
- **DB**: N/A (read-only)

---

### s01-detail-display.spec.ts - 반출 상세 조회

#### TEST-01-05: 완료된 반출 상세 정보 표시 (return_approved)

**Priority**: P1
**Role**: technical_manager
**Execution**: parallel
**Test Data**: `CHECKOUT_050_ID` (return_approved)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_050_ID}`
2. Verify heading "반출 상세" visible
3. Verify status badge shows "반입 승인" label
4. Verify all timestamps populated
5. Verify NO action buttons visible (workflow complete)

**Verification:**

- **UI**: Status badge, information cards, no action buttons
- **API**: `GET /api/checkouts/{id}` → `status=return_approved`
- **DB**: N/A (read-only)

**Assertions:**

```typescript
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';
import { CHECKOUT_050_ID } from '../shared/constants/test-checkout-ids';

await page.goto(`/checkouts/${CHECKOUT_050_ID}`);
await expect(page.getByRole('heading', { name: /반출.*상세/ })).toBeVisible();

// Status badge shows correct label
const statusBadge = page.getByTestId('status-badge');
await expect(statusBadge).toContainText(CHECKOUT_STATUS_LABELS.return_approved);

// No action buttons
await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
await expect(page.getByRole('button', { name: '반려' })).not.toBeVisible();

// API verification
const response = await apiGet(page, `/api/checkouts/${CHECKOUT_050_ID}`);
expect(response.status).toBe('return_approved');
expect(response.approvedAt).toBeTruthy();
expect(response.checkoutDate).toBeTruthy();
expect(response.actualReturnDate).toBeTruthy();
expect(response.returnApprovedAt).toBeTruthy();
```

---

#### TEST-01-06: 거절된 반출 상세 - 거절 사유 표시

**Priority**: P1
**Role**: technical_manager
**Execution**: parallel
**Test Data**: `CHECKOUT_017_ID` (rejected)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_017_ID}`
2. Verify status badge shows "거절됨" label
3. Verify rejection reason card visible
4. Verify rejection reason text is non-empty
5. Verify NO action buttons visible

**Verification:**

- **UI**: Status badge, rejection reason card
- **API**: `GET /api/checkouts/{id}` → `status=rejected`, `rejectionReason` non-empty
- **DB**: N/A (read-only)

**Assertions:**

```typescript
import { CHECKOUT_017_ID } from '../shared/constants/test-checkout-ids';

await page.goto(`/checkouts/${CHECKOUT_017_ID}`);

// Status badge
await expect(page.getByTestId('status-badge')).toContainText(CHECKOUT_STATUS_LABELS.rejected);

// Rejection reason visible
const rejectionCard = page.locator('text=거절 사유').locator('..');
await expect(rejectionCard).toBeVisible();

// API verification
const response = await apiGet(page, `/api/checkouts/${CHECKOUT_017_ID}`);
expect(response.status).toBe('rejected');
expect(response.rejectionReason).toBeTruthy();
expect(response.rejectionReason.length).toBeGreaterThan(0);
```

---

#### TEST-01-07: 기한 초과(overdue) 반출 표시

**Priority**: P2
**Role**: technical_manager
**Execution**: parallel
**Test Data**: `CHECKOUT_059_ID` (overdue)

**Steps:**

1. API: `GET /api/checkouts/{CHECKOUT_059_ID}`
2. Verify `status=overdue` OR `expectedReturnDate < now`
3. Navigate to detail page
4. Verify overdue visual indicator present

**Verification:**

- **UI**: Overdue badge or warning indicator
- **API**: Status or date confirms overdue
- **DB**: N/A (read-only)

---

#### TEST-01-08: 취소된 반출 상세 표시

**Priority**: P2
**Role**: technical_manager
**Execution**: parallel
**Test Data**: `CHECKOUT_062_ID` (canceled)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_062_ID}`
2. Verify status badge shows "취소됨" label
3. Verify NO action buttons visible

**Verification:**

- **UI**: Status badge
- **API**: `GET /api/checkouts/{id}` → `status=canceled`
- **DB**: N/A (read-only)

---

## Suite 02: Creation Tests (병렬)

### s02-form-validation.spec.ts - 폼 검증

#### TEST-02-01: 필수 필드 미입력 시 폼 검증

**Priority**: P1
**Role**: test_engineer
**Execution**: parallel

**Steps:**

1. Navigate to `/checkouts/create`
2. Attempt submit without selecting equipment
3. Verify validation error message
4. Select equipment
5. Leave other required fields empty (destination, reason, expectedReturnDate)
6. Attempt submit
7. Verify per-field validation errors

**Verification:**

- **UI**: Validation error messages displayed
- **API**: N/A (frontend validation blocks submission)
- **DB**: N/A (no submission)

**Assertions:**

```typescript
await page.goto('/checkouts/create');

// Try submit without equipment
const submitButton = page.getByRole('button', { name: '반출 신청' });
await submitButton.click();
await expect(page.getByText(/장비를.*선택/)).toBeVisible();

// Select equipment but leave other fields empty
await page.getByRole('row', { name: /SUW-E0001/ }).click();
await submitButton.click();

// Verify field-specific errors
await expect(page.getByText(/목적지.*입력/)).toBeVisible();
await expect(page.getByText(/사유.*입력/)).toBeVisible();
await expect(page.getByText(/반입.*예정일.*선택/)).toBeVisible();
```

---

#### TEST-02-02: 과거 날짜 반입 예정일 검증 (프론트엔드 + 백엔드)

**Priority**: P1
**Role**: test_engineer
**Execution**: parallel

**Steps:**

1. Navigate to `/checkouts/create`
2. Fill all fields with PAST `expectedReturnDate`
3. Attempt submit
4. Verify frontend validation error
5. (Fallback) If frontend allows, API call should return 400

**Verification:**

- **UI**: Date picker validation or error message
- **API**: `POST /api/checkouts` with past date → 400 "반입 예정일은 현재 시점보다 늦어야 합니다"
- **DB**: N/A (request blocked)

**Assertions:**

```typescript
await page.goto('/checkouts/create');

// Fill form with past date
await selectEquipment(page, SPECTRUM_ANALYZER_SUW_E);
await page.getByLabel('목적지').fill('Test Lab');
await page.getByLabel('사유').fill('Test calibration');
await page.getByLabel('목적').selectOption('calibration');

// Set past date
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 1);
await page.getByLabel('반입 예정일').fill(pastDate.toISOString().split('T')[0]);

// Attempt submit
const submitButton = page.getByRole('button', { name: '반출 신청' });
await submitButton.click();

// Verify validation (UI or API 400)
const errorVisible = await page.getByText(/날짜.*과거/).isVisible();
if (!errorVisible) {
  // If UI allows, verify API returns 400
  const response = await apiPost(page, '/api/checkouts', {
    equipmentIds: [SPECTRUM_ANALYZER_SUW_E],
    destination: 'Test Lab',
    reason: 'Test',
    purpose: 'calibration',
    expectedReturnDate: pastDate.toISOString(),
  });
  expect(response.status).toBe(400);
}
```

---

#### TEST-02-03: 부적합 장비 반출 차단 검증

**Priority**: P1
**Role**: test_engineer
**Execution**: parallel
**Test Data**: `POWER_METER_SUW_E` (status: non_conforming)

**Steps:**

1. Navigate to `/checkouts/create`
2. Verify non-conforming equipment is:
   - Unselectable (disabled) OR
   - Shows warning tooltip OR
   - Filtered out entirely
3. API: Attempt `POST /api/checkouts` with non-conforming equipment ID
4. Verify 400 error response

**Verification:**

- **UI**: Equipment selectability follows SSOT rules
- **API**: Backend validates equipment status → 400
- **DB**: N/A (request blocked)

**Business Rule Reference:**

- `packages/shared-constants/src/checkout-selectability.ts`
- `PURPOSE_ALLOWED_STATUSES`, `CHECKOUT_HIDDEN_STATUSES`

**Assertions:**

```typescript
import { POWER_METER_SUW_E } from '../shared/constants/test-equipment-ids';

await page.goto('/checkouts/create');

// Verify non-conforming equipment is not selectable
const nonConformingRow = page.getByRole('row', { name: new RegExp(POWER_METER_SUW_E) });
const checkbox = nonConformingRow.getByRole('checkbox');

// Should be disabled or have warning
const isDisabled = await checkbox.isDisabled();
const hasWarning = await nonConformingRow.getByRole('button', { name: /경고/ }).isVisible();

expect(isDisabled || hasWarning).toBe(true);

// API verification
const response = await apiPost(page, '/api/checkouts', {
  equipmentIds: [POWER_METER_SUW_E],
  destination: 'Test Lab',
  reason: 'Test',
  purpose: 'rental',
  expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
});

expect(response.status).toBe(400);
expect(response.message).toMatch(/부적합|사용.*불가|status/i);
```

---

### s02-create-success.spec.ts - 생성 성공

#### TEST-02-04: 교정 목적 반출 생성 성공 (API 중심)

**Priority**: P0
**Role**: test_engineer
**Execution**: parallel
**Test Data**: `SPECTRUM_ANALYZER_SUW_E` (available)

**Steps:**

1. API: `POST /api/checkouts` with:
   - `equipmentIds`: [SPECTRUM_ANALYZER_SUW_E]
   - `purpose`: 'calibration'
   - `destination`: 'Calibration Lab'
   - `reason`: 'Annual calibration check'
   - `expectedReturnDate`: tomorrow
2. Verify response: `status=pending`, `purpose=calibration`
3. API: `GET /api/checkouts/{id}` to confirm persistence

**Verification:**

- **UI**: Optional (can test API-only for speed)
- **API**: Creation returns 201, correct fields
- **DB**: Data persisted (verified via GET)

**Assertions:**

```typescript
const tomorrow = new Date(Date.now() + 86400000).toISOString();

const createResponse = await apiPost(page, '/api/checkouts', {
  equipmentIds: [SPECTRUM_ANALYZER_SUW_E],
  purpose: 'calibration',
  destination: 'Calibration Lab',
  reason: 'Annual calibration check',
  expectedReturnDate: tomorrow,
});

expect(createResponse.status).toBe(pending);
expect(createResponse.purpose).toBe('calibration');
expect(createResponse.equipmentIds).toContain(SPECTRUM_ANALYZER_SUW_E);

// Verify persistence
const getResponse = await apiGet(page, `/api/checkouts/${createResponse.id}`);
expect(getResponse.id).toBe(createResponse.id);
expect(getResponse.status).toBe('pending');
```

---

#### TEST-02-05: 수리 목적 반출 생성 성공

**Priority**: P1
**Role**: test_engineer
**Execution**: parallel
**Test Data**: `SIGNAL_GEN_SUW_E` (available)

**Steps:** Same as TEST-02-04 but with `purpose=repair`

---

#### TEST-02-06: 대여 목적 반출 생성 - 대여 전용 필드 검증

**Priority**: P1
**Role**: test_engineer
**Execution**: parallel
**Test Data**: `RECEIVER_UIW_W` (available, different team)

**Steps:**

1. API: `POST /api/checkouts` with:
   - `purpose`: 'rental'
   - `lenderTeamId`: (lending team UUID)
   - `lenderSiteId`: 'UIW'
   - Other required fields
2. Verify response includes `lenderTeamId`, `lenderSiteId`
3. API: `POST /api/checkouts` with `purpose=rental` WITHOUT `lenderTeamId`
4. Verify validation error (400 or successful creation with null)

**Verification:**

- **UI**: Optional
- **API**: Rental-specific fields required and persisted
- **DB**: Fields stored correctly

---

## Suite 03: Approval Workflow (직렬)

`test.describe.configure({ mode: 'serial' })` 적용

### s03-approval-workflow.spec.ts

**beforeAll:**

```typescript
await resetCheckoutToPending(CHECKOUT_001_ID);
await resetCheckoutToPending(CHECKOUT_002_ID);
await resetCheckoutToPending(CHECKOUT_003_ID);
await resetCheckoutToPending(CHECKOUT_005_ID);
```

#### TEST-03-01: 교정 반출 승인 + API 검증 (P0 CRITICAL)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_001_ID` (pending, calibration)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_001_ID}`
2. Verify status badge shows "승인 대기"
3. Verify "승인" and "반려" buttons visible
4. Click "승인" button
5. Wait for success message
6. Verify status badge changes to "승인됨"
7. Verify "승인/반려" buttons disappear
8. Verify "반출 시작" button appears

**Verification:**

- **UI**: Button visibility changes, status badge updates
- **API**: `GET /api/checkouts/{id}` after approval:
  - `status=approved`
  - `approverId` matches current user (server-side extraction)
  - `approvedAt` timestamp populated
- **DB**: Changes persisted (verified via API GET)

**Critical Security Check:**

- `approverId` must match session user, NOT any client-provided value
- Reference: Security fix applied 2026-02-05 (CHECKOUT_APPROVAL_FLOW_TESTS_FIX_SUMMARY.md)

**Assertions:**

```typescript
import { CHECKOUT_001_ID } from '../helpers/checkout-constants';
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';

await page.goto(`/checkouts/${CHECKOUT_001_ID}`);

// Initial state
await expect(page.getByTestId('status-badge')).toContainText(CHECKOUT_STATUS_LABELS.pending);
const approveButton = page.getByRole('button', { name: '승인' });
const rejectButton = page.getByRole('button', { name: '반려' });
await expect(approveButton).toBeVisible();
await expect(rejectButton).toBeVisible();

// Click approve
await approveButton.click();

// Wait for success
await waitForSuccessMessage(page);

// Verify UI changes
await expect(page.getByTestId('status-badge')).toContainText(CHECKOUT_STATUS_LABELS.approved);
await expect(approveButton).not.toBeVisible();
await expect(rejectButton).not.toBeVisible();
await expect(page.getByRole('button', { name: '반출 시작' })).toBeVisible();

// API verification
const response = await apiGet(page, `/api/checkouts/${CHECKOUT_001_ID}`);
expect(response.status).toBe('approved');
expect(response.approverId).toBeTruthy();
expect(response.approvedAt).toBeTruthy();

// CRITICAL: Verify approverId matches session user (server-side extraction)
const session = await page.evaluate(() => window.next.router.query);
expect(response.approverId).toBe(session.userId); // Server extracted, NOT client-provided
```

---

#### TEST-03-02: 수리 반출 승인 (P0)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_003_ID` (pending, repair)

**Steps:** Same pattern as TEST-03-01, verify `purpose=repair`

---

#### TEST-03-03: 대여 반출 승인 (P0)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_005_ID` (pending, rental)

**Steps:** Same pattern as TEST-03-01, verify `purpose=rental`, "대여" text visible

---

#### TEST-03-04: 승인 상태 페이지 새로고침 후 유지 (P0)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_002_ID` (pending)

**Steps:**

1. Navigate and approve (same as TEST-03-01)
2. **Reload page**: `await page.reload()`
3. Verify status still "승인됨"
4. Verify button state persists (no approve/reject, only "반출 시작")

**Verification:**

- **UI**: State persists after reload
- **API**: N/A (tested in previous test)
- **DB**: Persistence confirmed via page reload

**Purpose:** Ensures approval is stored in DB, not just frontend state

---

## Suite 04: Rejection Workflow (직렬)

`test.describe.configure({ mode: 'serial' })` 적용

### s04-rejection-workflow.spec.ts

**beforeAll:**

```typescript
await resetCheckoutToPending(CHECKOUT_004_ID);
await resetCheckoutToPending(CHECKOUT_006_ID);
await resetCheckoutToPending(CHECKOUT_007_ID);
await resetCheckoutToPending(CHECKOUT_008_ID);
```

#### TEST-04-01: 교정 반출 반려 및 사유 저장 (P0 CRITICAL)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_007_ID` (pending, calibration)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_007_ID}`
2. Click "반려" button
3. Verify rejection dialog opens with title "반출 반려"
4. Fill rejection reason: "Equipment not available for calibration"
5. Click dialog submit button
6. Wait for success message
7. Verify dialog closes
8. Verify status badge shows "거절됨"
9. Verify rejection reason visible on page
10. Verify NO action buttons visible

**Verification:**

- **UI**: Dialog workflow, status update, reason display
- **API**: `GET /api/checkouts/{id}` after rejection:
  - `status=rejected`
  - `rejectionReason` contains entered text
- **DB**: Rejection persisted

**Assertions:**

```typescript
await page.goto(`/checkouts/${CHECKOUT_007_ID}`);

// Click reject
const rejectButton = page.getByRole('button', { name: '반려' });
await rejectButton.click();

// Verify dialog
const dialog = page.getByRole('dialog', { name: '반출 반려' });
await expect(dialog).toBeVisible();

// Fill reason
const reasonInput = dialog.getByLabel('반려 사유');
await reasonInput.fill('Equipment not available for calibration');

// Submit
await dialog.getByRole('button', { name: '반려' }).click();

// Wait for success and dialog close
await waitForSuccessMessage(page);
await expect(dialog).not.toBeVisible();

// Verify status change
await expect(page.getByTestId('status-badge')).toContainText(CHECKOUT_STATUS_LABELS.rejected);

// Verify reason visible
await expect(page.getByText('Equipment not available for calibration')).toBeVisible();

// Verify no action buttons
await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
await expect(page.getByRole('button', { name: '반려' })).not.toBeVisible();
await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();

// API verification
const response = await apiGet(page, `/api/checkouts/${CHECKOUT_007_ID}`);
expect(response.status).toBe('rejected');
expect(response.rejectionReason).toContain('Equipment not available');
```

---

#### TEST-04-02: 수리 반출 반려 (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_004_ID` (pending, repair)

**Steps:** Same pattern as TEST-04-01

---

#### TEST-04-03: 반려 사유 필수 검증 (이중 검증) (P2)

**Priority**: P2
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_008_ID` (pending)

**Steps:**

1. Navigate and open rejection dialog
2. Verify submit button is disabled when reason is empty
3. Type 1 character in reason field
4. Verify submit button becomes enabled
5. Clear reason field
6. Verify button disabled again
7. (API fallback) Try `PATCH /api/checkouts/{id}/reject` with empty reason
8. Verify 400 error

**Verification:**

- **UI**: Button disabled when reason empty (frontend validation)
- **API**: Backend also validates → 400 if reason empty
- **DB**: N/A (request blocked)

**Assertions:**

```typescript
await page.goto(`/checkouts/${CHECKOUT_008_ID}`);
await page.getByRole('button', { name: '반려' }).click();

const dialog = page.getByRole('dialog', { name: '반출 반려' });
const reasonInput = dialog.getByLabel('반려 사유');
const submitButton = dialog.getByRole('button', { name: '반려' });

// Initially disabled
await expect(submitButton).toBeDisabled();

// Type → enabled
await reasonInput.fill('Test');
await expect(submitButton).toBeEnabled();

// Clear → disabled
await reasonInput.clear();
await expect(submitButton).toBeDisabled();

// API verification (backend validation)
const response = await apiPatch(page, `/api/checkouts/${CHECKOUT_008_ID}/reject`, {
  reason: '',
});
expect(response.status).toBe(400);
expect(response.message).toMatch(/사유.*필수|reason.*required/i);
```

---

#### TEST-04-04: 대여 반출 반려 - 워크플로우 종료 (P0)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_006_ID` (pending, rental)

**Steps:** Same as TEST-04-01, additionally verify rental-specific buttons (e.g., "상태 확인") also disappear

---

#### TEST-04-05: 거절된 반출 수정 불가 (터미널 상태) (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_015_ID` (already rejected in seed)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_015_ID}`
2. Verify status badge shows "거절됨"
3. Verify NO action buttons visible
4. API: `PATCH /api/checkouts/{id}` with update
5. Verify 400 error "거절된 반출은 수정할 수 없습니다"

**Verification:**

- **UI**: No edit/action buttons
- **API**: Update blocked → 400
- **DB**: N/A (request blocked)

---

## Suite 05: Start Checkout (직렬) ★ 장비 상태 전이 핵심

`test.describe.configure({ mode: 'serial' })` 적용

### s05-start-checkout.spec.ts

**beforeAll:**

```typescript
await resetCheckoutToApproved(CHECKOUT_009_ID);
await resetCheckoutToApproved(CHECKOUT_013_ID);
await resetCheckoutToPending(CHECKOUT_010_ID); // For blocking test
```

#### TEST-05-01: 반출 시작 → 장비 상태 checked_out 전이 (P0 CRITICAL)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_009_ID` (approved, single equipment)

**Steps:**

1. API: Get equipment ID from checkout
2. API: `GET /api/equipment/{equipmentId}` → verify initial `status=available`
3. Navigate to `/checkouts/{CHECKOUT_009_ID}`
4. Verify "반출 시작" button visible
5. Click "반출 시작"
6. Verify confirmation dialog (optional, based on implementation)
7. Wait for success message
8. Verify button disappears or changes

**Verification (CRITICAL):**

- **UI**: Button state change
- **API 1**: `GET /api/checkouts/{id}` after start:
  - `status=checked_out`
  - `checkoutDate` timestamp populated
- **API 2**: `GET /api/equipment/{equipmentId}` after start:
  - ★ **`status=checked_out`** (THIS IS THE KEY VERIFICATION)
- **DB**: Both checkout status AND equipment status changed

**Assertions:**

```typescript
import { CHECKOUT_009_ID } from '../helpers/checkout-constants';

// Get equipment ID
const checkoutBefore = await apiGet(page, `/api/checkouts/${CHECKOUT_009_ID}`);
const equipmentId = checkoutBefore.equipment[0].id;

// Verify equipment initial state
const equipmentBefore = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentBefore.status).toBe('available');

// UI: Start checkout
await page.goto(`/checkouts/${CHECKOUT_009_ID}`);
const startButton = page.getByRole('button', { name: '반출 시작' });
await expect(startButton).toBeVisible();
await startButton.click();

// Handle confirmation dialog if present
const confirmDialog = page.getByRole('dialog', { name: /반출.*시작|확인/ });
if (await confirmDialog.isVisible({ timeout: 2000 })) {
  await confirmDialog.getByRole('button', { name: /확인|반출/ }).click();
}

await waitForSuccessMessage(page);

// ★ CRITICAL VERIFICATION 1: Checkout status changed
const checkoutAfter = await apiGet(page, `/api/checkouts/${CHECKOUT_009_ID}`);
expect(checkoutAfter.status).toBe('checked_out');
expect(checkoutAfter.checkoutDate).toBeTruthy();

// ★ CRITICAL VERIFICATION 2: Equipment status changed
const equipmentAfter = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentAfter.status).toBe('checked_out');

console.log(
  `✅ Equipment ${equipmentId} status: ${equipmentBefore.status} → ${equipmentAfter.status}`
);
```

---

#### TEST-05-02: 승인되지 않은 반출 시작 차단 (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_010_ID` (pending)

**Steps:**

1. API: `POST /api/checkouts/{CHECKOUT_010_ID}/start`
2. Verify 400 error "승인된 반출만 반출할 수 있습니다"

**Verification:**

- **UI**: Optional (button should not be visible on pending checkout)
- **API**: Backend guards status transition → 400
- **DB**: N/A (request blocked)

---

#### TEST-05-03: 다중 장비 반출 시작 (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_013_ID` (approved, multiple equipment)

**Steps:**

1. API: Get all equipment IDs from checkout
2. API: Verify all equipment initially `status=available`
3. Click "반출 시작"
4. API: Verify checkout `status=checked_out`
5. API: Loop through all equipment IDs, verify ALL are `status=checked_out`

**Verification:**

- **UI**: Single button click
- **API**: Atomic multi-equipment status change
- **DB**: All equipment statuses updated together

---

## Suite 06: Return Processing (직렬)

`test.describe.configure({ mode: 'serial' })` 적용

### s06-return-inspections.spec.ts

**beforeAll:**

```typescript
await resetCheckoutToCheckedOut(CHECKOUT_019_ID); // calibration
await resetCheckoutToCheckedOut(CHECKOUT_020_ID); // repair
await resetCheckoutToCheckedOut(CHECKOUT_021_ID); // calibration
await resetCheckoutToCheckedOut(CHECKOUT_022_ID); // calibration
```

#### TEST-06-01: 교정 반출 반입 (calibrationChecked + workingStatusChecked) (P0)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_019_ID` (checked_out, calibration)

**Steps:**

1. Navigate to `/checkouts/{CHECKOUT_019_ID}`
2. Verify status badge shows "반출 중"
3. Click "반입 처리" button/link
4. Verify return inspection form visible
5. Check "교정 확인" checkbox
6. Check "작동 상태 확인" checkbox
7. Fill "검사 메모" (optional): "Equipment in good condition"
8. Click submit
9. Wait for success message

**Verification:**

- **UI**: Form submission, success message
- **API**: `GET /api/checkouts/{id}` after return:
  - `status=returned`
  - `calibrationChecked=true`
  - `workingStatusChecked=true`
  - `inspectionNotes` contains text
  - `actualReturnDate` timestamp populated
- **API**: `GET /api/equipment/{id}`:
  - ★ **`status` STILL `checked_out`** (NOT available yet - awaits approval)
- **DB**: Return recorded but equipment not restored yet

**Assertions:**

```typescript
await page.goto(`/checkouts/${CHECKOUT_019_ID}`);

// Click return button
const returnButton = page.getByRole('link', { name: '반입 처리' }); // or button
await returnButton.click();

// Fill inspection form
await page.getByLabel('교정 확인').check();
await page.getByLabel('작동 상태 확인').check();
await page.getByLabel('검사 메모').fill('Equipment in good condition');

// Submit
await page.getByRole('button', { name: '반입 완료' }).click();
await waitForSuccessMessage(page);

// API: Verify checkout status changed to returned
const checkoutAfter = await apiGet(page, `/api/checkouts/${CHECKOUT_019_ID}`);
expect(checkoutAfter.status).toBe('returned');
expect(checkoutAfter.calibrationChecked).toBe(true);
expect(checkoutAfter.workingStatusChecked).toBe(true);
expect(checkoutAfter.inspectionNotes).toContain('good condition');
expect(checkoutAfter.actualReturnDate).toBeTruthy();

// API: Verify equipment STILL checked_out (not restored yet)
const equipmentId = checkoutAfter.equipment[0].id;
const equipmentAfter = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentAfter.status).toBe('checked_out'); // NOT available!
```

---

#### TEST-06-02: 수리 반출 반입 (repairChecked + workingStatusChecked) (P0)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_020_ID` (checked_out, repair)

**Steps:** Same as TEST-06-01, but check "수리 확인" instead of "교정 확인"

**Verification:** `repairChecked=true`, `workingStatusChecked=true`

---

#### TEST-06-03: 교정 확인 미체크 → 400 에러 (필수 검사 강제) (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_021_ID` (checked_out, calibration)

**Steps:**

1. API: `POST /api/checkouts/{CHECKOUT_021_ID}/return` with:
   - `calibrationChecked: false`
   - `workingStatusChecked: true`
2. Verify 400 error "교정 확인은 필수입니다"
3. API: `POST /api/checkouts/{CHECKOUT_021_ID}/return` with:
   - `calibrationChecked: true`
   - `workingStatusChecked: false`
4. Verify 400 error "작동 상태 확인은 필수입니다"

**Verification:**

- **UI**: Optional (can test via API only)
- **API**: Backend validates purpose-specific required checks
- **DB**: N/A (request blocked)

---

#### TEST-06-04: pending 상태에서 반입 차단 (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_022_ID` (need to reset to pending for this test)

**Steps:**

1. API: `POST /api/checkouts/{id}/return` on a pending checkout
2. Verify 400 error "반출 중인 상태에서만 반입할 수 있습니다"

**Verification:**

- **UI**: Button should not be visible on pending checkout
- **API**: Backend guards status → 400
- **DB**: N/A (request blocked)

---

## Suite 07: Return Approval (직렬) ★ 장비 상태 복원 핵심

`test.describe.configure({ mode: 'serial' })` 적용

### s07-return-approval.spec.ts

**beforeAll:**

```typescript
await resetCheckoutToReturned(CHECKOUT_042_ID);
await resetCheckoutToReturned(CHECKOUT_043_ID);
await resetCheckoutToReturned(CHECKOUT_044_ID); // multi-equipment
await resetCheckoutToApproved(CHECKOUT_012_ID); // For blocking test
```

#### TEST-07-01: 반입 승인 → 장비 available 복원 (P0 CRITICAL)

**Priority**: P0
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_042_ID` (returned, single equipment)

**Steps:**

1. API: Get equipment ID from checkout
2. API: `GET /api/equipment/{equipmentId}` → verify `status=checked_out`
3. Navigate to `/checkouts/{CHECKOUT_042_ID}`
4. Verify status badge shows "반입 완료"
5. Verify "반입 승인" button visible
6. Click "반입 승인"
7. Verify confirmation dialog (optional)
8. Wait for success message

**Verification (CRITICAL):**

- **UI**: Button state change
- **API 1**: `GET /api/checkouts/{id}` after approval:
  - `status=return_approved`
  - `returnApprovedBy` matches current user
  - `returnApprovedAt` timestamp populated
- **API 2**: `GET /api/equipment/{equipmentId}` after approval:
  - ★ **`status=available`** (RESTORED - THIS IS THE KEY VERIFICATION)
- **DB**: Both checkout status AND equipment status updated

**Assertions:**

```typescript
import { CHECKOUT_042_ID } from '../helpers/checkout-constants';

// Get equipment ID
const checkoutBefore = await apiGet(page, `/api/checkouts/${CHECKOUT_042_ID}`);
const equipmentId = checkoutBefore.equipment[0].id;

// Verify equipment initial state (should be checked_out)
const equipmentBefore = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentBefore.status).toBe('checked_out');

// UI: Approve return
await page.goto(`/checkouts/${CHECKOUT_042_ID}`);
const approveButton = page.getByRole('button', { name: '반입 승인' });
await expect(approveButton).toBeVisible();
await approveButton.click();

// Handle confirmation dialog if present
const confirmDialog = page.getByRole('dialog', { name: /반입.*승인|확인/ });
if (await confirmDialog.isVisible({ timeout: 2000 })) {
  await confirmDialog.getByRole('button', { name: /확인|승인/ }).click();
}

await waitForSuccessMessage(page);

// ★ CRITICAL VERIFICATION 1: Checkout status final
const checkoutAfter = await apiGet(page, `/api/checkouts/${CHECKOUT_042_ID}`);
expect(checkoutAfter.status).toBe('return_approved');
expect(checkoutAfter.returnApprovedBy).toBeTruthy();
expect(checkoutAfter.returnApprovedAt).toBeTruthy();

// ★ CRITICAL VERIFICATION 2: Equipment status RESTORED
const equipmentAfter = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentAfter.status).toBe('available');

console.log(
  `✅ Equipment ${equipmentId} status: ${equipmentBefore.status} → ${equipmentAfter.status}`
);
```

---

#### TEST-07-02: approved 상태에서 반입 승인 차단 (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_012_ID` (approved)

**Steps:**

1. API: `PATCH /api/checkouts/{CHECKOUT_012_ID}/approve-return`
2. Verify 400 error "반입 완료 상태에서만 반입 승인할 수 있습니다"

**Verification:**

- **UI**: Button should not be visible on approved checkout
- **API**: Backend guards status → 400
- **DB**: N/A (request blocked)

---

#### TEST-07-03: 다중 장비 반입 승인 → 모든 장비 available (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_044_ID` (returned, multiple equipment)

**Steps:**

1. API: Get all equipment IDs from checkout
2. API: Verify all equipment currently `status=checked_out`
3. Click "반입 승인"
4. API: Verify checkout `status=return_approved`
5. API: Loop through all equipment IDs, verify ALL are `status=available`

**Verification:**

- **UI**: Single button click
- **API**: Atomic multi-equipment restoration
- **DB**: All equipment statuses restored together

---

## Suite 08: Full Lifecycle (직렬) ★ P0 CRITICAL

`test.describe.configure({ mode: 'serial' })` 적용

### s08-calibration-lifecycle.spec.ts

**beforeAll:**

```typescript
// Reset equipment to available
await resetEquipmentToAvailable(SAR_PROBE_SUW_S);
```

#### TEST-08-01: 교정 반출 전체 라이프사이클 (P0 CRITICAL)

**Priority**: P0
**Roles**: test_engineer (create), technical_manager (approve/start/return/approve-return)
**Execution**: serial
**Test Data**: Dynamically created, Equipment: `SAR_PROBE_SUW_S`

**Steps:**

**Step 1: Create (test_engineer)**

```typescript
const createResponse = await apiPost(testEngineerPage, '/api/checkouts', {
  equipmentIds: [SAR_PROBE_SUW_S],
  purpose: 'calibration',
  destination: 'Calibration Lab',
  reason: 'Annual calibration check',
  expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
});
expect(createResponse.status).toBe('pending');
const checkoutId = createResponse.id;
```

**Step 2: Approve (technical_manager)**

```typescript
await apiPatch(techManagerPage, `/api/checkouts/${checkoutId}/approve`, {});
const afterApprove = await apiGet(techManagerPage, `/api/checkouts/${checkoutId}`);
expect(afterApprove.status).toBe('approved');
expect(afterApprove.approverId).toBeTruthy();
expect(afterApprove.approvedAt).toBeTruthy();
```

**Step 3: Start Checkout (technical_manager)**

```typescript
await apiPost(techManagerPage, `/api/checkouts/${checkoutId}/start`, {});
const afterStart = await apiGet(techManagerPage, `/api/checkouts/${checkoutId}`);
expect(afterStart.status).toBe('checked_out');
expect(afterStart.checkoutDate).toBeTruthy();

// ★ Verify equipment status changed
const equipmentAfterStart = await apiGet(techManagerPage, `/api/equipment/${SAR_PROBE_SUW_S}`);
expect(equipmentAfterStart.status).toBe('checked_out');
```

**Step 4: Return (technical_manager)**

```typescript
await apiPost(techManagerPage, `/api/checkouts/${checkoutId}/return`, {
  calibrationChecked: true,
  workingStatusChecked: true,
  inspectionNotes: 'Calibration complete, equipment working normally',
});
const afterReturn = await apiGet(techManagerPage, `/api/checkouts/${checkoutId}`);
expect(afterReturn.status).toBe('returned');
expect(afterReturn.calibrationChecked).toBe(true);
expect(afterReturn.workingStatusChecked).toBe(true);
expect(afterReturn.actualReturnDate).toBeTruthy();

// ★ Verify equipment STILL checked_out
const equipmentAfterReturn = await apiGet(techManagerPage, `/api/equipment/${SAR_PROBE_SUW_S}`);
expect(equipmentAfterReturn.status).toBe('checked_out');
```

**Step 5: Approve Return (technical_manager)**

```typescript
await apiPatch(techManagerPage, `/api/checkouts/${checkoutId}/approve-return`, {});
const final = await apiGet(techManagerPage, `/api/checkouts/${checkoutId}`);
expect(final.status).toBe('return_approved');
expect(final.returnApprovedBy).toBeTruthy();
expect(final.returnApprovedAt).toBeTruthy();

// ★ Verify equipment RESTORED to available
const equipmentFinal = await apiGet(techManagerPage, `/api/equipment/${SAR_PROBE_SUW_S}`);
expect(equipmentFinal.status).toBe('available');
```

**Verification Summary:**

- **5 status transitions**: pending → approved → checked_out → returned → return_approved
- **2 equipment transitions**: available → checked_out → available
- **Cross-role interaction**: test_engineer creates, technical_manager processes
- **All timestamps populated**: approvedAt, checkoutDate, actualReturnDate, returnApprovedAt
- **Inspection data persisted**: calibrationChecked, workingStatusChecked, inspectionNotes

---

### s08-repair-lifecycle.spec.ts

#### TEST-08-02: 수리 반출 전체 라이프사이클

**Priority**: P1
**Roles**: test_engineer (create), technical_manager (approve/start/return/approve-return)
**Execution**: serial
**Test Data**: Dynamically created, Equipment: `HARNESS_COUPLER_SUW_A`

**Steps:** Same as TEST-08-01 but:

- `purpose=repair`
- `repairChecked=true` instead of `calibrationChecked=true`

---

## Suite 09: Cancel Flow (직렬)

`test.describe.configure({ mode: 'serial' })` 적용

### s09-cancel-flow.spec.ts

#### TEST-09-01: pending 반출 취소 성공

**Priority**: P1
**Role**: test_engineer (requester)
**Execution**: serial
**Test Data**: Dynamically created

**Steps:**

1. API: Create new checkout (as test_engineer)
2. Verify `status=pending`
3. API: `PATCH /api/checkouts/{id}/cancel`
4. Verify `status=canceled`

**Verification:**

- **UI**: Optional
- **API**: Cancel endpoint works
- **DB**: Status updated to canceled

---

#### TEST-09-02: approved 이후 취소 불가 (API)

**Priority**: P2
**Role**: technical_manager
**Execution**: serial
**Test Data**: Dynamically created

**Steps:**

1. API: Create checkout
2. API: Approve checkout
3. API: `PATCH /api/checkouts/{id}/cancel` → verify 400
4. API: Start checkout
5. API: `PATCH /api/checkouts/{id}/cancel` → verify 400
6. API: Return checkout
7. API: `PATCH /api/checkouts/{id}/cancel` → verify 400

**Verification:**

- **UI**: Cancel button should not be visible after approval
- **API**: Backend blocks cancel for non-pending statuses
- **DB**: N/A (request blocked)

---

## Suite 10: Rental 4-Step (직렬) ★ 신규 핵심

`test.describe.configure({ mode: 'serial' })` 적용

### s10-rental-4step.spec.ts

**beforeAll:**

```typescript
await resetRentalCheckoutToApproved(CHECKOUT_011_ID);
// 027, 030, 033, 036 are pre-seeded at specific states
```

#### TEST-10-01: Step 1 - 대여자 반출 전 확인 (approved → lender_checked) (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_011_ID` (approved, purpose=rental)

**Steps:**

1. API: `POST /api/checkouts/{CHECKOUT_011_ID}/condition-check` with:
   ```json
   {
     "step": "lender_checkout",
     "appearanceStatus": "normal",
     "operationStatus": "normal",
     "accessoriesStatus": "complete",
     "notes": "Equipment ready for shipment"
   }
   ```
2. Verify response contains condition check record

**Verification:**

- **API 1**: `GET /api/checkouts/{id}` after step 1:
  - `status=lender_checked`
  - `checkoutDate` timestamp populated
- **API 2**: `GET /api/equipment/{id}`:
  - ★ **`status=checked_out`** (equipment leaves inventory)
- **API 3**: `GET /api/checkouts/{id}/condition-checks`:
  - Array contains 1 record with `step=lender_checkout`

**Assertions:**

```typescript
import { CHECKOUT_011_ID } from '../helpers/checkout-constants';

const checkoutBefore = await apiGet(page, `/api/checkouts/${CHECKOUT_011_ID}`);
expect(checkoutBefore.status).toBe('approved');
expect(checkoutBefore.purpose).toBe('rental');
const equipmentId = checkoutBefore.equipment[0].id;

// Step 1: Lender checkout
const conditionResponse = await apiPost(page, `/api/checkouts/${CHECKOUT_011_ID}/condition-check`, {
  step: 'lender_checkout',
  appearanceStatus: 'normal',
  operationStatus: 'normal',
  accessoriesStatus: 'complete',
  notes: 'Equipment ready for shipment',
});
expect(conditionResponse.step).toBe('lender_checkout');

// Verify checkout status changed
const checkoutAfter = await apiGet(page, `/api/checkouts/${CHECKOUT_011_ID}`);
expect(checkoutAfter.status).toBe('lender_checked');
expect(checkoutAfter.checkoutDate).toBeTruthy();

// ★ Verify equipment status changed
const equipmentAfter = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentAfter.status).toBe('checked_out');

// Verify condition check recorded
const checks = await apiGet(page, `/api/checkouts/${CHECKOUT_011_ID}/condition-checks`);
expect(checks.length).toBe(1);
expect(checks[0].step).toBe('lender_checkout');
```

---

#### TEST-10-02: Step 2 - 차용자 수령 확인 (lender_checked → in_use) (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_027_ID` (seed: lender_checked)

**Steps:**

1. API: `POST /api/checkouts/{CHECKOUT_027_ID}/condition-check` with:
   ```json
   {
     "step": "borrower_receive",
     "appearanceStatus": "normal",
     "operationStatus": "normal",
     "accessoriesStatus": "complete",
     "notes": "Equipment received in good condition"
   }
   ```

**Verification:**

- **API 1**: `GET /api/checkouts/{id}` → `status=in_use`
- **API 2**: `GET /api/equipment/{id}` → `status` unchanged (still checked_out or in_use)
- **API 3**: Condition checks array has 2 records

---

#### TEST-10-03: Step 3 - 차용자 반납 전 확인 (in_use → borrower_returned) (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_033_ID` (seed: in_use)

**Steps:**

1. API: `POST /api/checkouts/{CHECKOUT_033_ID}/condition-check` with:
   ```json
   {
     "step": "borrower_return",
     "appearanceStatus": "normal",
     "operationStatus": "normal",
     "comparisonWithPrevious": "No changes compared to receipt",
     "notes": "Equipment ready to return"
   }
   ```

**Verification:**

- **API 1**: `GET /api/checkouts/{id}` → `status=borrower_returned`
- **API 2**: Equipment status unchanged
- **API 3**: Condition checks array has 3 records

---

#### TEST-10-04: Step 4 - 대여자 최종 확인 (borrower_returned → lender_received) (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_036_ID` (seed: borrower_returned)

**Steps:**

1. API: `POST /api/checkouts/{CHECKOUT_036_ID}/condition-check` with:
   ```json
   {
     "step": "lender_return",
     "appearanceStatus": "normal",
     "operationStatus": "normal",
     "comparisonWithPrevious": "Equipment returned in same condition as shipped",
     "notes": "Final inspection complete"
   }
   ```

**Verification (CRITICAL):**

- **API 1**: `GET /api/checkouts/{id}` → `status=lender_received`, `actualReturnDate` populated
- **API 2**: `GET /api/equipment/{id}`:
  - ★ **`status=available`** (equipment back in inventory!)
- **API 3**: Condition checks array has 4 records

**Assertions:**

```typescript
const checkoutBefore = await apiGet(page, `/api/checkouts/${CHECKOUT_036_ID}`);
expect(checkoutBefore.status).toBe('borrower_returned');
const equipmentId = checkoutBefore.equipment[0].id;

// Step 4: Lender final check
await apiPost(page, `/api/checkouts/${CHECKOUT_036_ID}/condition-check`, {
  step: 'lender_return',
  appearanceStatus: 'normal',
  operationStatus: 'normal',
  comparisonWithPrevious: 'Equipment returned in same condition',
  notes: 'Final inspection complete',
});

// Verify checkout status final
const checkoutAfter = await apiGet(page, `/api/checkouts/${CHECKOUT_036_ID}`);
expect(checkoutAfter.status).toBe('lender_received');
expect(checkoutAfter.actualReturnDate).toBeTruthy();

// ★ Verify equipment RESTORED to available
const equipmentAfter = await apiGet(page, `/api/equipment/${equipmentId}`);
expect(equipmentAfter.status).toBe('available');

// Verify all 4 condition checks recorded
const checks = await apiGet(page, `/api/checkouts/${CHECKOUT_036_ID}/condition-checks`);
expect(checks.length).toBe(4);
expect(checks.map((c) => c.step)).toEqual([
  'lender_checkout',
  'borrower_receive',
  'borrower_return',
  'lender_return',
]);
```

---

#### TEST-10-05: 대여 4단계 순서 위반 차단 (P2)

**Priority**: P2
**Role**: technical_manager
**Execution**: serial
**Test Data**: `CHECKOUT_014_ID` (reset to approved)

**Steps:**

1. API: Try `POST /condition-check` with `step=borrower_receive` on approved checkout
2. Verify 400 error "이전 단계를 먼저 완료해야 합니다"
3. API: Try `POST /condition-check` with `step=lender_return` on approved checkout
4. Verify 400 error

**Verification:**

- **API**: Backend enforces step order
- **DB**: N/A (request blocked)

---

#### TEST-10-06: condition-check 이력 조회 (P2)

**Priority**: P2
**Role**: technical_manager
**Execution**: parallel (read-only)
**Test Data**: `CHECKOUT_030_ID` (seed: borrower_received, should have 2 checks)

**Steps:**

1. API: `GET /api/checkouts/{CHECKOUT_030_ID}/condition-checks`
2. Verify response is an array
3. Verify each entry has: `id`, `step`, `checkedBy`, `checkedAt`, `appearanceStatus`, `operationStatus`

**Verification:**

- **API**: History retrieval works
- **DB**: N/A (read-only)

---

## Suite 11: Permissions (병렬)

### s11-role-permissions.spec.ts

#### TEST-11-01: test_engineer는 승인/반려 불가 (P1)

**Priority**: P1
**Roles**: test_engineer + technical_manager
**Execution**: parallel
**Test Data**: Any pending checkout (read-only)

**Steps:**

1. (As test_engineer) Navigate to pending checkout detail
2. Verify "승인" button NOT visible
3. Verify "반려" button NOT visible
4. API: `PATCH /api/checkouts/{id}/approve` as test_engineer
5. Verify 403 Forbidden
6. API: `PATCH /api/checkouts/{id}/reject` as test_engineer
7. Verify 403 Forbidden

**Verification:**

- **UI**: Role-based button visibility
- **API**: Permission guard blocks unauthorized actions
- **DB**: N/A (request blocked)

---

#### TEST-11-02: approverId 서버사이드 추출 검증 (P1)

**Priority**: P1
**Role**: technical_manager
**Execution**: parallel
**Test Data**: Dynamically created

**Steps:**

1. API: Create new checkout
2. API: `PATCH /api/checkouts/{id}/approve` with body:
   ```json
   {
     "approverId": "fake-uuid-12345"
   }
   ```
3. API: `GET /api/checkouts/{id}`
4. Verify `approverId` matches session user UUID, NOT "fake-uuid-12345"

**Verification:**

- **Security**: Server extracts approverId from `req.user.userId`, ignores client value
- **Reference**: Security fix applied 2026-02-05

**Assertions:**

```typescript
const createResponse = await apiPost(techManagerPage, '/api/checkouts', { ... });
const checkoutId = createResponse.id;

// Try to spoof approverId
await apiPatch(techManagerPage, `/api/checkouts/${checkoutId}/approve`, {
  approverId: 'fake-uuid-12345',
});

// Verify server-side extraction
const final = await apiGet(techManagerPage, `/api/checkouts/${checkoutId}`);
expect(final.approverId).not.toBe('fake-uuid-12345');
expect(final.approverId).toBe(SESSION_TECH_MANAGER_USER_ID); // From session
```

---

#### TEST-11-03: EMC팀 RF팀 장비 반출 차단 (P2)

**Priority**: P2
**Role**: test_engineer (EMC team)
**Execution**: parallel
**Test Data**: RF team equipment

**Steps:**

1. Identify EMC team user and RF team equipment
2. API: `POST /api/checkouts` with EMC user for RF equipment
3. Verify 403 Forbidden "EMC 팀은 RF 팀 장비를 반출할 수 없습니다"

**Verification:**

- **API**: Team-based access control
- **DB**: N/A (request blocked)

---

#### TEST-11-04: lab_manager 자가 승인 가능 (P2)

**Priority**: P2
**Role**: lab_manager
**Execution**: parallel
**Test Data**: Dynamically created

**Steps:**

1. API: Create checkout as lab_manager
2. API: Approve same checkout as lab_manager
3. API: `GET /api/checkouts/{id}`
4. Verify `requesterId = approverId`

**Verification:**

- **API**: Self-approval allowed for lab_manager role
- **DB**: Same user ID in both fields

---

## Test Execution Commands

### Run All Checkouts Tests

```bash
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/ --workers=4
```

### Run by Suite

```bash
# Read-only tests (fast, parallel)
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/suite-01-readonly/

# Critical lifecycle tests
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/suite-08-lifecycle/

# Rental 4-step tests
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/suite-10-rental/
```

### Run P0 Critical Tests Only

```bash
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/ --grep "P0|CRITICAL"
```

### Debug Single Test

```bash
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/suite-03-approval/s03-approval-workflow.spec.ts --debug
```

### UI Mode (Visual)

```bash
pnpm --filter frontend exec npx playwright test tests/e2e/features/checkouts/ --ui
```

---

## Test Data Requirements

### Seed Data (backend)

- 68 checkout IDs with known states (CHECKOUT_001 - CHECKOUT_068)
- 15+ test equipment IDs across teams/sites
- 3 test users (test_engineer, technical_manager, lab_manager)

### Environment

- Backend: `http://localhost:3001` (NestJS)
- Frontend: `http://localhost:3000` (Next.js 16)
- DB: PostgreSQL on port 5432

---

## Success Criteria

### Test Coverage

- ✅ 47 test scenarios across 11 suites
- ✅ All checkout statuses covered (pending → return_approved, rejected, canceled)
- ✅ All purposes covered (calibration, repair, rental)
- ✅ Equipment status transitions verified (available ↔ checked_out)
- ✅ Rental 4-step workflow fully tested

### Quality Metrics

- ✅ 100% SSOT compliance (all enums/labels from packages)
- ✅ Triple verification (UI + API + DB state)
- ✅ Security validation (server-side approverId, permission guards)
- ✅ Cross-role interactions tested
- ✅ No ID collisions between serial suites

### Performance

- ✅ Parallel suites complete in < 3 minutes
- ✅ Serial suites complete in < 10 minutes total
- ✅ Full test suite < 15 minutes

---

## Known Issues & Workarounds

### Issue 1: Server Component Authentication (401)

**Status:** Documented in `CHECKOUT_APPROVAL_FLOW_TESTS_FIX_SUMMARY.md`
**Impact:** `/checkouts/[id]/page.tsx` may return 401 in tests
**Workaround:** Tests use API verification primarily, UI verification is secondary

### Issue 2: Permission-Based Button Visibility

**Status:** Not yet implemented
**Impact:** All users see approve/reject buttons
**Workaround:** Tests verify API permission guards work correctly

---

## Maintenance

### When to Update Tests

1. **Business logic changes:** Update corresponding suite
2. **New status added:** Add to Suite 01 read-only tests
3. **API endpoint changes:** Update API calls in all affected tests
4. **UI redesign:** Update selectors in test files

### How to Add New Test

1. Identify correct suite (read-only vs state-modifying)
2. Allocate unique checkout ID if state-modifying
3. Follow triple verification pattern (UI + API + DB)
4. Import enums/labels from SSOT packages
5. Add to appropriate `.spec.ts` file

---

**Test Plan Version:** 1.0
**Last Updated:** 2026-02-10
**Author:** Claude Code (Sonnet 4.5)
**Status:** Ready for Implementation
