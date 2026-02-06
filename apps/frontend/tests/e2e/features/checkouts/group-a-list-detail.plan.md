# Group A: Checkout List/Detail Pages E2E Tests

## Application Overview

Comprehensive E2E test plan for the checkout management list and detail pages of the Equipment Management System. The checkout module handles equipment checkout requests for calibration, repair, and rental purposes (UL-QP-18 procedure). This test group covers read-only scenarios: list page loading, data display verification, search functionality, filter combinations, and detail page display correctness. All tests are independent and fully parallelizable since they only read existing seed data without modifications. The system has 68 seed checkout records across 13 statuses and 3 purposes (calibration/repair/rental). Auth fixtures provide techManagerPage (technical_manager) and testOperatorPage (test_engineer) with different permission levels.

## Test Scenarios

### 1. a1-list-basic: Checkout List Page Basic

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 1.1. A-1: Checkout list page loads successfully

**File:** `tests/e2e/checkouts/group-a/a1-list-basic.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the page to finish loading (networkidle)
4. Verify the page heading '반출 관리' is visible
5. Verify the page subtitle '장비 반출 요청 및 현황을 관리합니다.' is visible
6. Verify the '반출 신청' button is visible in the top right area
7. Verify the summary statistics cards are rendered (4 cards: 전체 반출, 승인 대기중, 반입 기한 초과, 오늘 반입 예정)
8. Verify the tab bar with '전체 반출', '기한 초과', '오늘 반입' tabs is visible
9. Verify the search input field with placeholder '장비 또는 사용자 검색' is present
10. Verify the status filter dropdown with label '상태' is present
11. Verify the location filter dropdown with label '반출지' is present
12. Verify the checkout table is displayed with 6 column headers: 장비, 신청자, 상태, 반출지, 반출일, 반입 예정일

**Expected Results:**

- Page heading '반출 관리' is visible
- Page subtitle text is visible
- '반출 신청' button is visible and clickable
- 4 summary statistics cards are rendered with correct titles
- Tab bar with 3 tabs is visible, '전체 반출' is selected by default
- Search input is visible and interactable
- Status filter dropdown is visible
- Location filter dropdown is visible
- Table has exactly 6 column headers matching expected labels
- Table body contains at least 1 data row (from 68 seed records)

#### 1.2. A-2: Checkout data is displayed correctly in the table

**File:** `tests/e2e/checkouts/group-a/a1-list-basic.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout data to load (table rows are visible)
4. Count the number of data rows in the table (excluding header)
5. Verify the first data row contains equipment name text (not '장비 정보 없음')
6. Verify the first data row contains a requester name (not '알 수 없는 사용자')
7. Verify the first data row contains a status badge (one of: 승인 대기중, 1차 승인, 최종 승인, 반출 중, 거부됨, 반입됨, 기한 초과)
8. Verify the first data row contains a destination text with the building icon
9. Verify the first data row shows a date in yyyy-MM-dd format in the checkout date column
10. Verify the first data row shows a date in yyyy-MM-dd format in the expected return date column
11. Verify the total checkout count in the '전체 반출' summary card matches or is close to 68
12. Fetch checkout list from backend API: GET /api/checkouts?pageSize=100
13. Compare the API response total count with the displayed '전체 반출' card value

**Expected Results:**

- Table contains multiple data rows populated from the 68 seed records
- Equipment name is shown (e.g., 'Spectrum Analyzer' or similar)
- Requester name is a valid user name, not the fallback text
- Status badge has appropriate color styling and Korean label
- Destination text is preceded by a building icon
- Date columns show valid dates in yyyy-MM-dd format
- Summary card '전체 반출' shows the correct total count matching API response
- API response total matches the displayed UI total

#### 1.3. A-3: Search by equipment name filters the list correctly

**File:** `tests/e2e/checkouts/group-a/a1-list-basic.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Note the initial total number of table rows
5. Type 'Spectrum' into the search input field (placeholder: '장비 또는 사용자 검색')
6. Wait for the query to re-fetch (React Query debounce + network idle)
7. Count the number of data rows after filtering
8. Verify all visible rows contain equipment names that include 'Spectrum' (partial match)
9. Clear the search input
10. Wait for the list to reload with all items
11. Type a non-existent equipment name like 'ZZZNONEXISTENT' into the search field
12. Wait for the filtered results
13. Verify the empty state message '반출 정보가 없습니다' is displayed
14. Verify the '필터 초기화' button is displayed in the empty state

**Expected Results:**

- After typing 'Spectrum', the table only shows rows where equipment name contains 'Spectrum'
- The number of filtered results is less than the initial total
- All visible equipment names in filtered results contain the search term
- After clearing the search, the full list is restored
- When searching for a non-existent name, the empty state with '반출 정보가 없습니다' is shown
- The '필터 초기화' button is visible in the empty state

#### 1.4. A-4: Search by requester name filters the list correctly

**File:** `tests/e2e/checkouts/group-a/a1-list-basic.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Fetch the backend API to identify a known requester name: GET http://localhost:3001/api/checkouts?pageSize=5
5. Extract a requester name from the first checkout record (e.g., the user.name field)
6. Type the extracted requester name into the search input field
7. Wait for the query to re-fetch
8. Verify that filtered results include at least one row
9. Verify each visible row shows the searched requester name in the '신청자' column
10. Type a partial name (first 2 characters of the known name) and verify partial matching works
11. Clear the search and verify the full list reloads

**Expected Results:**

- After typing a valid requester name, the table filters to show only that requester's checkouts
- The filtered result count is greater than 0
- All visible requester names match (or contain) the search term
- Partial name matching works correctly
- Clearing search restores the full list

### 2. a2-list-filters: Checkout List Page Filters

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 2.1. A-5: Status filter correctly filters checkout list

**File:** `tests/e2e/checkouts/group-a/a2-list-filters.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Note the initial row count
5. Open the status filter dropdown (labeled '상태')
6. Select '승인 대기중' (value: 'pending')
7. Wait for the filtered results to load
8. Verify all visible rows have the '승인 대기중' status badge (yellow background)
9. Verify the API query includes status=pending by checking network requests
10. Count the visible rows and compare with API response for status=pending
11. Open the status filter dropdown again
12. Select '반출 중' (value: 'checked_out')
13. Wait for the filtered results
14. Verify all visible rows have the '반출 중' status badge (blue background)
15. Open the status filter dropdown again
16. Select '거부됨' (value: 'rejected')
17. Wait for the filtered results
18. Verify all visible rows show the '거부됨' status badge (red background)
19. Open the status filter dropdown again
20. Select '반입됨' (value: 'returned')
21. Wait for the filtered results
22. Verify all visible rows show the '반입됨' status badge (green background)
23. Open the status filter dropdown again
24. Select '기한 초과' (value: 'overdue')
25. Wait for the filtered results
26. Verify all visible rows show the '기한 초과' badge (dark red background)
27. Verify the overdue count matches seed data (6 overdue records)
28. Reset the filter to '전체' to show all records
29. Verify the full list is restored

**Expected Results:**

- Each status filter shows only checkouts matching that status
- Badge colors match the status (yellow for pending, blue for checked_out, red for rejected, green for returned, dark red for overdue)
- Pending filter shows approximately 8 records (from seed data: 8 pending + 1 extra)
- Checked_out filter shows approximately 8 records
- Rejected filter shows approximately 4 records
- Returned filter shows approximately 8 records
- Overdue filter shows approximately 6 records
- Resetting to '전체' restores the complete list

#### 2.2. A-6: Location filter correctly filters checkout list

**File:** `tests/e2e/checkouts/group-a/a2-list-filters.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Open the location filter dropdown (labeled '반출지')
5. Verify the dropdown contains options: 전체, 고객사, 협력사, 지사, 전시회, 기타
6. Select '고객사' (value: 'customer')
7. Wait for the filtered results
8. Verify the API query includes location=customer
9. Count the visible rows after filtering
10. Reset filter to '전체'
11. Select '지사' (value: 'branch')
12. Wait for the filtered results
13. Verify the filtered results show checkouts destined to branch offices
14. Reset filter to '전체'
15. Verify the full list is restored

**Expected Results:**

- Location dropdown contains all 6 expected options
- Filtering by location correctly narrows down the results
- API requests include the location query parameter
- Resetting filter restores the full list
- If no checkouts match a location filter, the empty state is shown

#### 2.3. A-7: Tab switching filters checkout list (overdue tab, today tab)

**File:** `tests/e2e/checkouts/group-a/a2-list-filters.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load with the '전체 반출' tab active
4. Note the initial total row count
5. Click the '기한 초과' tab
6. Wait for the filtered results to load
7. Verify the table now shows only overdue checkouts
8. Verify all visible status badges show '기한 초과'
9. Count the rows and verify it matches seed data overdue count (approximately 6)
10. Click the '오늘 반입' tab
11. Wait for the filtered results
12. Verify the table shows checkouts with expected return dates of today
13. Click the '전체 반출' tab to return to the full list
14. Verify the full list is restored with the original row count

**Expected Results:**

- '기한 초과' tab shows only overdue checkouts (status='overdue') with '기한 초과' badges
- Overdue count matches seed data (approximately 6 records)
- '오늘 반입' tab shows checkouts where expectedReturnDate matches today
- '전체 반출' tab restores the complete unfiltered list
- Tab switching properly triggers new API queries with correct parameters

#### 2.4. A-8: Combined filters work correctly (status + search)

**File:** `tests/e2e/checkouts/group-a/a2-list-filters.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Select status filter '승인 대기중' (pending)
5. Wait for filtered results
6. Note the pending-only row count
7. While pending filter is active, type a search term from known seed data equipment name into the search input
8. Wait for the combined filter results
9. Verify the results are narrowed further: only pending checkouts matching the equipment name
10. Verify the row count is less than or equal to the pending-only count
11. Clear the search input
12. Verify results go back to all pending checkouts
13. Reset status filter to '전체'
14. Verify the full list is restored
15. Apply status filter '반출 중' (checked_out) and location filter simultaneously
16. Wait for the combined filter results
17. Verify results match both filter criteria
18. Click '필터 초기화' button if a combination yields no results, or manually reset both filters
19. Verify the full list is restored

**Expected Results:**

- Combined status + search filters apply simultaneously, narrowing results to intersection of both criteria
- Row count with combined filters is less than or equal to either filter alone
- Removing one filter while keeping the other correctly broadens results
- Resetting all filters restores the complete list
- Combined status + location filters also work correctly

#### 2.5. A-8b: Empty state and filter reset

**File:** `tests/e2e/checkouts/group-a/a2-list-filters.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Apply a status filter that has results (e.g., 'pending')
5. Then type a search term that does not match any pending checkout (e.g., 'ZZZNOEQUIPMENT')
6. Wait for the combined filter to apply
7. Verify the empty state is displayed with the message '반출 정보가 없습니다'
8. Verify the empty state includes the text '검색 조건에 맞는 반출 정보가 없습니다.'
9. Verify the '필터 초기화' button is visible
10. Click the '필터 초기화' button
11. Wait for the list to reload
12. Verify the search input is cleared (empty)
13. Verify the status filter is reset to '전체'
14. Verify the location filter is reset to '전체'
15. Verify the full checkout list is displayed again with all records

**Expected Results:**

- Empty state is shown when filters yield no results
- Empty state message '반출 정보가 없습니다' is visible
- Subtitle '검색 조건에 맞는 반출 정보가 없습니다.' is visible
- '필터 초기화' button resets all three filters (search, status, location) to defaults
- Full list reloads after filter reset

### 3. a3-detail-page: Checkout Detail Page

**Seed:** `apps/frontend/tests/e2e/checkouts/seed.spec.ts`

#### 3.1. A-9: Checkout detail page loads with all sections

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts to see the list
3. Click on the first checkout row to navigate to its detail page
4. Wait for the detail page to fully load
5. Verify the page heading '반출 상세' is visible
6. Verify the '목록으로' back navigation link is visible
7. Verify the status badge is displayed next to the heading (one of the CHECKOUT_STATUS_LABELS values)
8. Verify the purpose badge is displayed next to the heading (one of: 교정, 수리, 대여)
9. Verify the destination is shown below the heading
10. Verify the '진행 상태' (CheckoutStatusStepper) card is present
11. Verify the '반출 정보' card is present with destination, reason fields
12. Verify the '일정 정보' card is present with date fields
13. Verify the '담당자 정보' card shows at least the requester (신청자) name
14. Verify the '반출 장비' card is present with at least one equipment item
15. Navigate back to the list by clicking '목록으로'
16. Verify the checkout list page is displayed again

**Expected Results:**

- Detail page loads with heading '반출 상세'
- '목록으로' back link navigates back to /checkouts
- Status badge shows a valid Korean label from CHECKOUT_STATUS_LABELS
- Purpose badge shows a valid Korean label (교정, 수리, or 대여)
- Destination text is displayed below heading
- Status stepper card renders the progress visualization
- Checkout info card shows destination and reason
- Schedule info card shows application date and expected return date
- Personnel card shows at least the requester
- Equipment card lists at least one equipment with name and management number
- Back navigation returns to the list page

#### 3.2. A-10: Purpose badge displays correctly for each checkout type

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Fetch the checkout list from backend API to identify IDs for each purpose type: GET http://localhost:3001/api/checkouts?pageSize=100
3. From the API response, find a checkout with purpose='calibration' (e.g., CHECKOUT_001 - pending calibration)
4. Navigate to the detail page for the calibration checkout: /checkouts/{calibration-checkout-id}
5. Wait for the page to load
6. Verify the purpose badge shows '교정' with blue styling (bg-blue-50 text-blue-700)
7. Verify the status stepper shows a calibration-type flow (5-step: 신청 -> 승인 -> 반출 -> 반입 -> 승인)
8. Navigate back to the list
9. From the API response, find a checkout with purpose='repair' (e.g., CHECKOUT_003 - pending repair)
10. Navigate to the detail page for the repair checkout: /checkouts/{repair-checkout-id}
11. Wait for the page to load
12. Verify the purpose badge shows '수리' with orange styling (bg-orange-50 text-orange-700)
13. Navigate back to the list
14. From the API response, find a checkout with purpose='rental' (e.g., CHECKOUT_005 - pending rental)
15. Navigate to the detail page for the rental checkout: /checkouts/{rental-checkout-id}
16. Wait for the page to load
17. Verify the purpose badge shows '대여' with purple styling (bg-purple-50 text-purple-700)
18. Verify the status stepper shows a rental-type flow (8-step: includes lender/borrower verification steps)

**Expected Results:**

- Calibration checkout shows '교정' badge with blue color scheme
- Repair checkout shows '수리' badge with orange color scheme
- Rental checkout shows '대여' badge with purple color scheme
- Status stepper adapts its steps based on checkout type (calibration/repair: 5-step, rental: 8-step)
- All three badge variants render correctly with appropriate colors

#### 3.3. A-11: Rental checkout displays lender team and site information

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Fetch the checkout list from backend API: GET http://localhost:3001/api/checkouts?pageSize=100
3. From the API response, find a rental checkout that has lenderTeamId set (e.g., CHECKOUT_005 or CHECKOUT_013)
4. Navigate to the detail page for the rental checkout: /checkouts/{rental-checkout-id}
5. Wait for the page to load
6. Verify the purpose badge shows '대여'
7. Verify the destination shows the borrower site (e.g., '의왕 시험소' or '수원 시험소')
8. Verify the checkout info card displays the reason for the rental
9. Verify the status stepper shows the rental 8-step flow
10. If the rental checkout has conditionChecks, verify the '상태 확인 이력' card is present
11. If no conditionChecks exist (new rental), verify the condition check section is not shown
12. Navigate to a rental checkout in 'lender_checked' status (e.g., CHECKOUT_027)
13. Verify the status badge shows '반출 전 확인 완료'
14. Verify the status stepper highlights the first step as completed

**Expected Results:**

- Rental checkout shows '대여' purpose badge
- Destination shows the target site name
- Rental reason is displayed in the checkout info card
- Status stepper shows 8-step rental flow
- Condition checks section appears only when conditionChecks data exists
- 'lender_checked' status shows as '반출 전 확인 완료' with appropriate badge
- Status stepper correctly highlights completed steps

#### 3.4. A-12: Equipment link navigates to the equipment detail page

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Fetch a checkout with known equipment from API: GET http://localhost:3001/api/checkouts?pageSize=10
3. Pick a checkout that has at least one equipment item in its equipment array
4. Navigate to the checkout detail page: /checkouts/{checkout-id}
5. Wait for the page to load
6. Locate the '반출 장비' (Equipment) section card
7. Verify at least one equipment item is listed with its name and management number
8. Click on the equipment name link (it should be a link to /equipment/{equipment-id})
9. Wait for the equipment detail page to load
10. Verify the URL has changed to /equipment/{equipment-id}
11. Verify the equipment detail page shows the equipment name matching what was shown on the checkout page
12. Navigate back using browser back button
13. Verify we return to the checkout detail page

**Expected Results:**

- Equipment section shows at least one equipment with name and management number
- Equipment name is a clickable link
- Clicking the equipment link navigates to /equipment/{equipment-id}
- Equipment detail page loads with the correct equipment data
- Browser back navigation returns to the checkout detail page

#### 3.5. A-9b: Checkout detail page data accuracy (verify against API)

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Fetch a specific checkout from API: GET http://localhost:3001/api/checkouts/{CHECKOUT_019_ID}
3. Record the API response values: destination, reason, user.name, purpose, status, expectedReturnDate, checkoutDate
4. Navigate to the checkout detail page: /checkouts/{CHECKOUT_019_ID}
5. Wait for the page to load
6. Verify the status badge matches the API status (checked_out -> '반출 중')
7. Verify the purpose badge matches the API purpose (calibration -> '교정')
8. Verify the destination text on the page matches the API destination field
9. Verify the requester name shown on the page matches the API user.name field
10. Verify the expected return date on the page matches the API expectedReturnDate field (formatted as yyyy년 MM월 dd일)
11. Verify the checkout date on the page matches the API checkoutDate field (formatted as yyyy년 MM월 dd일)
12. Verify the reason text matches the API reason field
13. Verify the approver name is shown (since this is an approved/checked_out checkout)

**Expected Results:**

- Status badge text matches API status value mapped through CHECKOUT_STATUS_LABELS
- Purpose badge text matches API purpose value mapped through CHECKOUT_PURPOSE_LABELS
- Destination text exactly matches API destination value
- Requester name matches API user.name value
- Expected return date is correctly formatted from API value
- Checkout date is correctly formatted from API value
- Reason text matches API reason value
- Approver name is displayed for approved/checked-out checkouts
- All displayed data matches the backend API response, ensuring data accuracy

#### 3.6. A-9c: Checkout detail page for rejected checkout shows rejection reason

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to the detail page for a rejected checkout: /checkouts/{CHECKOUT_015_ID}
3. Wait for the page to load
4. Verify the status badge shows '거절됨' (rejected status)
5. Verify the '반려 사유' card is visible (Card with red border: border-red-200)
6. Verify the card title shows '반려 사유' in red text
7. Verify the rejection reason text matches the seed data: '인증되지 않은 교정기관입니다. 국가표준 인정기관을 이용해주세요.'
8. Navigate to another rejected checkout without a reason: /checkouts/{CHECKOUT_017_ID}
9. Wait for the page to load
10. Verify the status badge shows '거절됨'
11. Verify the rejection reason section is hidden (since rejectionReason is not set for this record)

**Expected Results:**

- Rejected checkout shows '거절됨' status badge
- Rejection reason card is visible with red border styling for checkouts that have a rejection reason
- Rejection reason text matches the seed data exactly
- Rejected checkout without rejection reason does not show the rejection reason card
- The absence of rejection reason does not cause UI errors

#### 3.7. A-9d: Checkout detail page for overdue checkout shows warning alert

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to the detail page for an overdue checkout: /checkouts/{CHECKOUT_056_ID}
3. Wait for the page to load
4. Verify the status badge shows '기한 초과'
5. Verify the overdue warning Alert is visible with destructive variant
6. Verify the alert contains the text '반입 예정일이 초과되었습니다. 빠른 반입 처리가 필요합니다.'
7. Verify the AlertTriangle icon is rendered within the alert
8. Navigate to a non-overdue checkout (e.g., a pending checkout /checkouts/{CHECKOUT_001_ID})
9. Wait for the page to load
10. Verify the overdue warning alert is NOT visible for non-overdue checkouts

**Expected Results:**

- Overdue checkout shows '기한 초과' status badge
- Destructive alert with warning text is visible only for overdue checkouts
- Alert text reads '반입 예정일이 초과되었습니다. 빠른 반입 처리가 필요합니다.'
- AlertTriangle icon is rendered in the alert
- Non-overdue checkouts do not show the warning alert

#### 3.8. A-9e: Checkout list row click navigates to detail page

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to /checkouts
3. Wait for the checkout list to fully load
4. Identify the first data row in the table
5. Note the equipment name shown in the first row
6. Click on the first data row (the entire row is clickable with cursor-pointer)
7. Wait for navigation to complete
8. Verify the URL has changed to /checkouts/{some-id}
9. Verify the '반출 상세' heading is visible
10. Verify the equipment shown on the detail page matches the name from the list row
11. Click '목록으로' link
12. Verify we return to /checkouts list page

**Expected Results:**

- Clicking a table row navigates to the checkout detail page
- URL contains the checkout ID
- Detail page heading '반출 상세' is visible
- Equipment name on detail page matches the list row
- '목록으로' back link returns to the list page

#### 3.9. A-10b: Multi-equipment checkout displays 'N건' suffix in list

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Fetch the checkout list from API to identify a multi-equipment checkout (e.g., CHECKOUT_007 has 2 items, CHECKOUT_065 has 3 items)
3. Navigate to /checkouts
4. Wait for the list to load
5. Find the row for a multi-equipment checkout in the list
6. Verify the equipment column shows the first equipment name followed by '외 N건' text (e.g., 'Power Meter 외 1건' for 2 items)
7. Click on this row to go to the detail page
8. Verify the '반출 장비' section lists all equipment items individually
9. Verify each equipment item shows its name and management number
10. Verify the equipment count matches the expected number (2 for CHECKOUT_007, 3 for CHECKOUT_065)

**Expected Results:**

- Multi-equipment checkout in list shows 'equipment_name 외 N건' format
- Detail page lists all individual equipment items
- Each equipment item displays name and management number
- Equipment count in detail matches the seed data

#### 3.10. A-12b: Returned checkout displays inspection results

**File:** `tests/e2e/checkouts/group-a/a3-detail-page.spec.ts`

**Steps:**

1. Login as technical_manager using the techManagerPage fixture
2. Navigate to the detail page for a returned calibration checkout with inspections: /checkouts/{CHECKOUT_042_ID}
3. Wait for the page to load
4. Verify the status badge shows '반입 완료'
5. Verify the '반입 검사 결과' card is visible
6. Verify '교정 확인' is shown with a green checkmark (CheckCircle2) since calibrationChecked is true
7. Verify '작동 여부 확인' is shown with a green checkmark since workingStatusChecked is true
8. Verify the inspection notes text '교정 완료, 정상 작동 확인' is displayed
9. Navigate to a returned repair checkout: /checkouts/{CHECKOUT_044_ID}
10. Verify '수리 확인' is shown with a green checkmark since repairChecked is true
11. Verify '작동 여부 확인' is shown with a green checkmark since workingStatusChecked is true
12. Verify the inspection notes text includes '수리 완료, 부품 교체됨, 정상 작동'
13. Navigate to a return_approved checkout: /checkouts/{CHECKOUT_050_ID}
14. Verify the inspection results section is also visible for return_approved status

**Expected Results:**

- Returned calibration checkout shows calibration check and working status check with green checkmarks
- Returned repair checkout shows repair check and working status check with green checkmarks
- Inspection notes are displayed correctly
- Return inspection section is visible for both 'returned' and 'return_approved' statuses
- Unchecked inspections show red X icons (XCircle)
