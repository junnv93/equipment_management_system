# Equipment List Page Comprehensive Test Plan

## Application Overview

This test plan covers the comprehensive E2E testing of the Equipment List page (/equipment) in the Equipment Management System.

**Target URL:** http://localhost:3000/equipment

**Technology Stack:**

- Frontend: Next.js 16 App Router, React 19, TailwindCSS, shadcn/ui
- Backend: NestJS (Port 3001), Drizzle ORM, PostgreSQL
- Authentication: NextAuth.js (Azure AD + Credentials)

**SSOT Principles:**

- Filter parsing: `lib/utils/equipment-filter-utils.ts`
- Permissions: `@equipment-management/shared-constants`
- Status values: `@equipment-management/schemas`

**Page Architecture:**

1. Server Component (page.tsx): Initial data fetch, URL searchParams parsing using SSOT utils
2. Client Component (EquipmentListContent.tsx): React Query, filters, search, sort, pagination
3. Backend API (GET /equipment): Permission-based filtering

**Role-based Data Access:**

- test_engineer: Own site only
- technical_manager: Own site only
- lab_manager: All sites

**Testing Approach:**

- Uses auth fixtures from `tests/e2e/fixtures/auth.fixture.ts`
- Tests full flow: UI interaction -> URL update -> API call -> Response -> UI update
- Network request interception for validation

## Test Scenarios

### 1. Basic UI Rendering

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 1.1. Page header elements are displayed correctly

**File:** `tests/e2e/equipment-list/basic-rendering.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Wait for page to load completely

**Expected Results:**

- Page title '장비 관리' is visible as h1 heading
- Subtitle '시험소 장비를 검색하고 관리합니다' is visible
- '장비 등록' button with Plus icon is visible
- '공용장비 등록' button is visible

#### 1.2. Filter panel is displayed with all filter options

**File:** `tests/e2e/equipment-list/basic-rendering.spec.ts`

**Steps:**

1. Login as siteAdminPage (lab_manager) fixture
2. Navigate to /equipment
3. Expand filter panel if collapsed

**Expected Results:**

- Filter panel card with '필터' title is visible
- Site filter dropdown (사이트) is visible for lab_manager
- Status filter dropdown (상태) is visible
- Calibration method filter (교정 방법) is visible
- Classification filter (장비 분류) is visible
- Shared equipment filter (장비 구분) is visible
- Calibration due filter (교정 기한) is visible
- Team filter (팀) is visible

#### 1.3. Search bar and view controls are displayed

**File:** `tests/e2e/equipment-list/basic-rendering.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Wait for content to load

**Expected Results:**

- Search bar with placeholder '장비명, 모델명, 관리번호로 검색' is visible
- Search bar has role='search' attribute
- View toggle buttons (테이블/카드) are visible
- Table view button has aria-checked='true' by default

#### 1.4. Equipment table is displayed with correct columns

**File:** `tests/e2e/equipment-list/basic-rendering.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Wait for table to load

**Expected Results:**

- Table with role='grid' and aria-label='장비 목록' is visible
- Column headers visible: 관리번호, 장비명, 모델명, 상태, 교정 기한, 위치, 상세
- Sortable columns have sort buttons with ArrowUpDown icons
- Equipment rows are displayed with data-testid='equipment-row'

#### 1.5. Pagination controls are displayed

**File:** `tests/e2e/equipment-list/basic-rendering.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Wait for data to load

**Expected Results:**

- Pagination navigation with aria-label='페이지 탐색' is visible
- Total items count display is visible (총 X개 중 Y-Z)
- Page size selector with options 10, 20, 50, 100 is visible
- First/Previous/Next/Last page buttons are visible
- Page number buttons are visible

### 2. Site Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 2.1. Site filter shows all options for lab_manager

**File:** `tests/e2e/equipment-list/filter-site.spec.ts`

**Steps:**

1. Login as siteAdminPage (lab_manager) fixture
2. Navigate to /equipment
3. Click on site filter dropdown (#filter-site)

**Expected Results:**

- Dropdown displays '모든 사이트' option
- Dropdown displays '수원랩' (suwon) option
- Dropdown displays '의왕랩' (uiwang) option
- Dropdown displays '평택랩' (pyeongtaek) option

#### 2.2. Selecting site filter updates URL and displays results

**File:** `tests/e2e/equipment-list/filter-site.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture
2. Navigate to /equipment
3. Click site filter and select '수원랩'
4. Wait for network request to complete

**Expected Results:**

- URL contains 'site=suwon' parameter
- Active filter badge shows '사이트: 수원랩'
- Equipment list is filtered to show only Suwon site equipment
- API request includes site=suwon parameter

#### 2.3. Site filter is hidden for test_engineer

**File:** `tests/e2e/equipment-list/filter-site.spec.ts`

**Steps:**

1. Login as testOperatorPage (test_engineer) fixture
2. Navigate to /equipment
3. Check for site filter visibility

**Expected Results:**

- Site filter dropdown is NOT visible (hidden for non-managers)
- Equipment list automatically shows only user's own site equipment

#### 2.4. Removing site filter clears URL parameter

**File:** `tests/e2e/equipment-list/filter-site.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture
2. Navigate to /equipment?site=suwon
3. Click X button on '사이트: 수원랩' filter badge

**Expected Results:**

- URL no longer contains 'site=' parameter
- Filter badge is removed
- Equipment list shows all sites

### 3. Status Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 3.1. Status filter shows all EQUIPMENT_STATUS_FILTER_OPTIONS

**File:** `tests/e2e/equipment-list/filter-status.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click on status filter dropdown (#filter-status)

**Expected Results:**

- Dropdown displays '모든 상태' option
- Dropdown displays '사용 가능' (available) option
- Dropdown displays '사용 중' (in_use) option
- Dropdown displays '반출 중' (checked_out) option
- Dropdown displays '교정 예정' (calibration_scheduled) option
- Dropdown displays '교정 기한 초과' (calibration_overdue) option
- Dropdown displays '부적합' (non_conforming) option
- Dropdown displays '여분' (spare) option
- Dropdown displays '폐기' (retired) option

#### 3.2. Selecting status filter updates URL and results

**File:** `tests/e2e/equipment-list/filter-status.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click status filter and select '사용 가능'
4. Wait for network request

**Expected Results:**

- URL contains 'status=available' parameter
- Active filter badge shows '상태: 사용 가능'
- Only equipment with available status is displayed

#### 3.3. Status filter for calibration_overdue equipment

**File:** `tests/e2e/equipment-list/filter-status.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click calibration due filter and select '기한 초과'

**Expected Results:**

- URL contains 'calibrationDueFilter=overdue'
- Only overdue equipment is shown
- Equipment rows display D+N badge for overdue days

### 4. Calibration Method Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 4.1. Calibration method filter shows all options

**File:** `tests/e2e/equipment-list/filter-calibration-method.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click calibration method dropdown (#filter-calibration)

**Expected Results:**

- Dropdown displays '모든 교정 방법' option
- Dropdown displays '외부 교정' (external_calibration) option
- Dropdown displays '자체 점검' (internal_verification) option

#### 4.2. Selecting external calibration updates URL

**File:** `tests/e2e/equipment-list/filter-calibration-method.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select '외부 교정' from calibration method filter

**Expected Results:**

- URL contains 'calibrationMethod=external_calibration'
- Active filter badge shows '교정: 외부 교정'
- Only externally calibrated equipment is shown

### 5. Classification Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 5.1. Classification filter shows all options

**File:** `tests/e2e/equipment-list/filter-classification.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click classification dropdown (#filter-classification)

**Expected Results:**

- Dropdown displays '모든 분류' option
- Dropdown displays classification options based on CLASSIFICATION_LABELS
- Options include: FCC EMC/RF, General EMC, SAR, etc.

#### 5.2. Selecting classification updates URL and filters

**File:** `tests/e2e/equipment-list/filter-classification.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select 'FCC EMC/RF' from classification filter

**Expected Results:**

- URL contains 'classification=fcc_emc_rf'
- Active filter badge shows '분류: FCC EMC/RF'
- Only FCC EMC/RF classified equipment is displayed

### 6. Shared Equipment Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 6.1. Shared equipment filter shows all options

**File:** `tests/e2e/equipment-list/filter-shared.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click shared equipment dropdown (#filter-shared)

**Expected Results:**

- Dropdown displays '모든 장비' option
- Dropdown displays '공용장비' option
- Dropdown displays '일반장비' option

#### 6.2. Selecting shared equipment updates URL

**File:** `tests/e2e/equipment-list/filter-shared.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select '공용장비' from filter

**Expected Results:**

- URL contains 'isShared=shared'
- Active filter badge shows '구분: 공용장비'
- Only shared equipment (isShared=true) is displayed
- Equipment rows show SharedEquipmentBadge

#### 6.3. Normal equipment filter works correctly

**File:** `tests/e2e/equipment-list/filter-shared.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select '일반장비' from filter

**Expected Results:**

- URL contains 'isShared=normal'
- Active filter badge shows '구분: 일반장비'
- Only non-shared equipment is displayed

### 7. Calibration Due Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 7.1. Calibration due filter shows all options

**File:** `tests/e2e/equipment-list/filter-calibration-due.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click calibration due dropdown (#filter-calibration-due)

**Expected Results:**

- Dropdown displays '전체' option with '모든 장비' description
- Dropdown displays '교정 임박' with '30일 이내 교정 예정' description
- Dropdown displays '기한 초과' with '교정 기한이 지남' description
- Dropdown displays '정상' with '교정 기한 여유' description

#### 7.2. Due soon filter transforms to calibrationDue=30 API param

**File:** `tests/e2e/equipment-list/filter-calibration-due.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select '교정 임박' from calibration due filter
4. Intercept API request

**Expected Results:**

- URL contains 'calibrationDueFilter=due_soon'
- API request contains 'calibrationDue=30' parameter
- Active filter badge shows '교정기한: 교정 임박'
- Only equipment due within 30 days is shown

#### 7.3. Overdue filter transforms to calibrationOverdue=true API param

**File:** `tests/e2e/equipment-list/filter-calibration-due.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select '기한 초과' from filter
4. Intercept API request

**Expected Results:**

- URL contains 'calibrationDueFilter=overdue'
- API request contains 'calibrationOverdue=true' parameter
- Active filter badge shows '교정기한: 기한 초과'
- Only overdue equipment is shown

#### 7.4. Normal filter transforms to calibrationDueAfter=30 API param

**File:** `tests/e2e/equipment-list/filter-calibration-due.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select '정상' from filter
4. Intercept API request

**Expected Results:**

- URL contains 'calibrationDueFilter=normal'
- API request contains 'calibrationDueAfter=30' parameter
- Active filter badge shows '교정기한: 정상'
- Only equipment with due date > 30 days is shown

### 8. Team Filter

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 8.1. Team filter loads options dynamically from API

**File:** `tests/e2e/equipment-list/filter-team.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Wait for teams API to complete
4. Click team filter dropdown (#filter-team)

**Expected Results:**

- Dropdown displays '모든 팀' option
- Team options are loaded from /api/teams API
- Teams are filtered by user's site

#### 8.2. Selecting team filter updates URL

**File:** `tests/e2e/equipment-list/filter-team.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select a specific team from dropdown

**Expected Results:**

- URL contains 'teamId=<team-uuid>'
- Active filter badge shows '팀: <team-name>'
- Only equipment belonging to selected team is displayed

### 9. Combined Filters

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 9.1. Multiple filters can be applied simultaneously

**File:** `tests/e2e/equipment-list/filter-combined.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture
2. Navigate to /equipment
3. Apply site filter: 수원랩
4. Apply status filter: 사용 가능
5. Apply calibration method: 외부 교정

**Expected Results:**

- URL contains all three parameters: site=suwon&status=available&calibrationMethod=external_calibration
- Three filter badges are displayed
- Equipment list shows intersection of all filters

#### 9.2. Filter reset clears all filters

**File:** `tests/e2e/equipment-list/filter-combined.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture
2. Navigate to /equipment?site=suwon&status=available&classification=fcc_emc_rf
3. Click '초기화' button

**Expected Results:**

- URL becomes '/equipment' with no query parameters
- All filter badges are removed
- Filter dropdowns reset to default values
- Equipment list shows all equipment

#### 9.3. Individual filter removal preserves other filters

**File:** `tests/e2e/equipment-list/filter-combined.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?status=available&classification=fcc_emc_rf
3. Click X button on '상태: 사용 가능' badge

**Expected Results:**

- URL no longer contains 'status=available'
- URL still contains 'classification=fcc_emc_rf'
- '상태' filter badge is removed
- '분류' filter badge remains

#### 9.4. Calibration due filter works independently from status filter

**File:** `tests/e2e/equipment-list/filter-combined.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Select status: '사용 가능'
4. Select calibration due: '기한 초과'

**Expected Results:**

- URL contains both 'status=available' and 'calibrationDueFilter=overdue'
- Both filters are applied simultaneously
- Shows available equipment that is also overdue for calibration

### 10. Search Functionality

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 10.1. Search input debounces and updates URL

**File:** `tests/e2e/equipment-list/search.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Type '스펙트럼' in search input
4. Wait for 300ms debounce

**Expected Results:**

- URL contains 'search=%EC%8A%A4%ED%8E%99%ED%8A%B8%EB%9F%BC' (encoded Korean)
- Search input shows '스펙트럼'
- Loading indicator appears during search
- Equipment list filters to matching results

#### 10.2. Search by management number

**File:** `tests/e2e/equipment-list/search.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Type management number pattern (e.g., 'SUW-E') in search

**Expected Results:**

- URL contains encoded search parameter
- Equipment with matching management numbers are displayed
- Search term is highlighted in results

#### 10.3. Search with filters combined

**File:** `tests/e2e/equipment-list/search.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Apply status filter: 사용 가능
4. Type '분석기' in search input

**Expected Results:**

- URL contains both 'status=available' and 'search=' parameters
- Results show only available equipment matching '분석기'

#### 10.4. Clear search with X button

**File:** `tests/e2e/equipment-list/search.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?search=test
3. Click X button in search input

**Expected Results:**

- URL no longer contains 'search=' parameter
- Search input is cleared
- Full equipment list is restored

#### 10.5. Enter key triggers immediate search

**File:** `tests/e2e/equipment-list/search.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Type '장비' and press Enter immediately

**Expected Results:**

- Search executes immediately without waiting for debounce
- URL updates with search parameter

#### 10.6. Escape key clears search

**File:** `tests/e2e/equipment-list/search.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Type '장비' in search
4. Press Escape key

**Expected Results:**

- Search input is cleared
- URL search parameter is removed
- Focus remains on search input

### 11. Sorting Functionality

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 11.1. Sort by name ascending

**File:** `tests/e2e/equipment-list/sorting.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click '장비명' column header

**Expected Results:**

- URL contains 'sortBy=name&sortOrder=asc'
- Column header shows ArrowUp icon
- Sort badge appears: '정렬: 이름순 (오름차순)'
- Equipment list is sorted by name A-Z

#### 11.2. Toggle sort order by clicking same column

**File:** `tests/e2e/equipment-list/sorting.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?sortBy=name&sortOrder=asc
3. Click '장비명' column header again

**Expected Results:**

- URL changes to 'sortBy=name&sortOrder=desc'
- Column header shows ArrowDown icon
- Equipment list is sorted by name Z-A

#### 11.3. Sort by management number

**File:** `tests/e2e/equipment-list/sorting.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click '관리번호' column header

**Expected Results:**

- URL contains 'sortBy=managementNumber'
- Sort badge shows '정렬: 관리번호순'

#### 11.4. Sort by calibration due date

**File:** `tests/e2e/equipment-list/sorting.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click '교정 기한' column header

**Expected Results:**

- URL contains 'sortBy=nextCalibrationDate'
- Sort badge shows '정렬: 교정기한순'
- Equipment sorted by next calibration date

#### 11.5. Sort by status

**File:** `tests/e2e/equipment-list/sorting.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click '상태' column header

**Expected Results:**

- URL contains 'sortBy=status'
- Sort badge shows '정렬: 상태순'

### 12. Pagination

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 12.1. Navigate to next page

**File:** `tests/e2e/equipment-list/pagination.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click '다음 페이지' button

**Expected Results:**

- URL contains 'page=2'
- Page 2 button shows aria-current='page'
- Display range updates (e.g., '21-40 of 100')

#### 12.2. Navigate to specific page number

**File:** `tests/e2e/equipment-list/pagination.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click page number button '3'

**Expected Results:**

- URL contains 'page=3'
- Page 3 button shows active styling
- Correct equipment set is displayed

#### 12.3. Navigate to first and last page

**File:** `tests/e2e/equipment-list/pagination.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?page=3
3. Click '첫 페이지로' button
4. Click '마지막 페이지로' button

**Expected Results:**

- First button navigates to page 1
- Last button navigates to final page
- First/Last buttons are disabled on first/last pages

#### 12.4. Change page size

**File:** `tests/e2e/equipment-list/pagination.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click page size selector
4. Select '50'

**Expected Results:**

- URL contains 'pageSize=50'
- URL resets to 'page=1'
- Up to 50 items displayed
- Page size is saved to localStorage

#### 12.5. Pagination displays correct total count

**File:** `tests/e2e/equipment-list/pagination.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Observe pagination info

**Expected Results:**

- Total count matches API response meta.pagination.total
- Display shows correct range (e.g., '1-20 of X개')
- Total pages calculated correctly

#### 12.6. Filter resets pagination to page 1

**File:** `tests/e2e/equipment-list/pagination.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?page=3
3. Apply status filter

**Expected Results:**

- URL changes to 'page=1' after filter applied
- Page 1 is displayed

### 13. View Toggle

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 13.1. Switch from table to card view

**File:** `tests/e2e/equipment-list/view-toggle.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Click '카드' view button

**Expected Results:**

- Card view button shows aria-checked='true'
- Table view button shows aria-checked='false'
- Equipment displayed in card grid (data-testid='equipment-card-grid')
- Table is hidden

#### 13.2. Switch from card to table view

**File:** `tests/e2e/equipment-list/view-toggle.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Switch to card view
4. Click '테이블' view button

**Expected Results:**

- Table view button shows aria-checked='true'
- Equipment table is displayed
- Card grid is hidden

#### 13.3. View preference persists after page reload

**File:** `tests/e2e/equipment-list/view-toggle.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Switch to card view
4. Reload the page

**Expected Results:**

- Card view is still active after reload
- localStorage contains 'equipment-list-view': 'card'

#### 13.4. View toggle has proper ARIA attributes

**File:** `tests/e2e/equipment-list/view-toggle.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment

**Expected Results:**

- View toggle container has role='radiogroup'
- Buttons have role='radio'
- Active button has aria-checked='true'
- Buttons have proper aria-label

### 14. Role-based Data Access

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 14.1. test_engineer sees only own site equipment

**File:** `tests/e2e/equipment-list/role-access.spec.ts`

**Steps:**

1. Login as testOperatorPage (test_engineer from suwon) fixture
2. Navigate to /equipment
3. Observe equipment list

**Expected Results:**

- Only equipment from test_engineer's site is displayed
- Site filter is NOT visible
- All equipment has site matching user's site

#### 14.2. technical_manager sees only own site equipment

**File:** `tests/e2e/equipment-list/role-access.spec.ts`

**Steps:**

1. Login as techManagerPage fixture
2. Navigate to /equipment
3. Check site filter visibility

**Expected Results:**

- Site filter IS visible for technical_manager
- Equipment list initially shows all sites (manager can view all)

#### 14.3. lab_manager sees all sites equipment

**File:** `tests/e2e/equipment-list/role-access.spec.ts`

**Steps:**

1. Login as siteAdminPage (lab_manager) fixture
2. Navigate to /equipment

**Expected Results:**

- Equipment from all sites is displayed
- Site filter is visible
- Can filter by any site (SUW, UIW, PYT)

#### 14.4. Team filter respects site restrictions

**File:** `tests/e2e/equipment-list/role-access.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Open team filter dropdown

**Expected Results:**

- Only teams from user's site are shown
- Teams from other sites are not available

### 15. URL State Synchronization

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 15.1. URL parameters restore filter state on direct navigation

**File:** `tests/e2e/equipment-list/url-state.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture
2. Navigate directly to /equipment?site=suwon&status=available&search=테스트

**Expected Results:**

- Site filter shows '수원랩'
- Status filter shows '사용 가능'
- Search input contains '테스트'
- Filter badges display all three filters
- Equipment list is filtered accordingly

#### 15.2. Browser back button restores previous state

**File:** `tests/e2e/equipment-list/url-state.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Apply status filter: available
4. Apply classification filter: fcc_emc_rf
5. Click browser back button

**Expected Results:**

- Classification filter is removed
- Status filter remains
- URL matches previous history state

#### 15.3. Browser forward button restores next state

**File:** `tests/e2e/equipment-list/url-state.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Apply filter
4. Go back
5. Click browser forward button

**Expected Results:**

- Filter state is restored
- URL contains filter parameter

#### 15.4. Shareable URLs work correctly

**File:** `tests/e2e/equipment-list/url-state.spec.ts`

**Steps:**

1. Login as siteAdminPage fixture
2. Apply multiple filters
3. Copy URL
4. Navigate to different page
5. Paste and navigate to saved URL

**Expected Results:**

- All filters are restored from URL
- Equipment list matches filter criteria

#### 15.5. Invalid URL parameters are handled gracefully

**File:** `tests/e2e/equipment-list/url-state.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?status=invalid_status&page=-1

**Expected Results:**

- Invalid status is ignored, defaults to empty
- Invalid page defaults to 1
- No error is displayed
- Page loads normally

### 16. Empty States

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 16.1. No equipment data shows empty state

**File:** `tests/e2e/equipment-list/empty-states.spec.ts`

**Steps:**

1. Mock API to return empty data array
2. Login as testOperatorPage fixture
3. Navigate to /equipment

**Expected Results:**

- Empty state component is displayed
- Message '등록된 장비가 없습니다' is visible
- '장비 등록' link/button is visible

#### 16.2. No search results shows appropriate message

**File:** `tests/e2e/equipment-list/empty-states.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?search=존재하지않는장비XYZ123

**Expected Results:**

- SearchX icon is displayed
- Message '검색 결과가 없습니다' is visible
- Message includes the search term
- '필터 초기화' button is visible

#### 16.3. No filter results shows reset option

**File:** `tests/e2e/equipment-list/empty-states.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?status=retired&classification=fcc_emc_rf

**Expected Results:**

- Empty search results component is shown
- '필터 초기화' button is visible
- Clicking reset clears all filters

### 17. Error Handling

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 17.1. API error displays error alert

**File:** `tests/e2e/equipment-list/error-handling.spec.ts`

**Steps:**

1. Mock /api/equipment to return 500 error
2. Login (or use page without fixture)
3. Navigate to /equipment

**Expected Results:**

- ErrorAlert component is displayed
- Error title '장비 목록 로드 실패' is visible
- '다시 시도' button is visible

#### 17.2. Retry button refetches data

**File:** `tests/e2e/equipment-list/error-handling.spec.ts`

**Steps:**

1. Mock first request to fail, second to succeed
2. Navigate to /equipment
3. Click '다시 시도' button

**Expected Results:**

- Error alert disappears
- Equipment list is displayed
- API was called twice

#### 17.3. Network timeout is handled gracefully

**File:** `tests/e2e/equipment-list/error-handling.spec.ts`

**Steps:**

1. Mock API with very long delay
2. Navigate to /equipment

**Expected Results:**

- Loading state is shown
- Eventually error or timeout message appears
- Retry option is available

### 18. Loading States

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 18.1. Initial loading shows skeleton

**File:** `tests/e2e/equipment-list/loading-states.spec.ts`

**Steps:**

1. Mock API with 2 second delay
2. Navigate to /equipment

**Expected Results:**

- Skeleton loader is displayed (aria-busy='true')
- Filter skeleton is visible
- Search bar skeleton is visible
- Table row skeletons are visible
- Pagination skeleton is visible

#### 18.2. Filter change shows loading indicator

**File:** `tests/e2e/equipment-list/loading-states.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Wait for initial load
4. Mock slow response for next request
5. Apply filter

**Expected Results:**

- Loading spinner appears in search bar area
- Content area shows aria-busy='true'
- Previous data may still be visible (React Query)

#### 18.3. Search shows loading spinner

**File:** `tests/e2e/equipment-list/loading-states.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Type search query

**Expected Results:**

- Loader2 spinner replaces search icon during fetch
- Spinner animates (animate-spin class)

### 19. Calibration Date Display

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 19.1. D-day badge shows for upcoming calibration

**File:** `tests/e2e/equipment-list/calibration-display.spec.ts`

**Steps:**

1. Mock equipment with nextCalibrationDate 7 days from now
2. Navigate to /equipment

**Expected Results:**

- Date column shows date in YYYY-MM-DD format
- D-7 badge is displayed with orange styling
- Urgent indicator for items within 7 days

#### 19.2. Overdue badge shows D+N format

**File:** `tests/e2e/equipment-list/calibration-display.spec.ts`

**Steps:**

1. Mock equipment with nextCalibrationDate 5 days ago
2. Navigate to /equipment

**Expected Results:**

- D+5 badge is displayed
- Red styling indicates overdue
- Date is still shown

#### 19.3. No D-day badge for retired/non-conforming/spare equipment

**File:** `tests/e2e/equipment-list/calibration-display.spec.ts`

**Steps:**

1. Mock equipment with status=retired and valid calibration date
2. Navigate to /equipment

**Expected Results:**

- Calibration date column shows '-' for retired equipment
- No D-day badge is displayed
- shouldDisplayCalibrationStatus returns false

#### 19.4. Normal calibration date shows without special styling

**File:** `tests/e2e/equipment-list/calibration-display.spec.ts`

**Steps:**

1. Mock equipment with nextCalibrationDate 60 days from now
2. Navigate to /equipment

**Expected Results:**

- Date shown in YYYY-MM-DD format
- No D-day badge
- Normal text styling

### 20. Accessibility

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 20.1. Table has correct ARIA attributes

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment

**Expected Results:**

- Table has role='grid' and aria-label='장비 목록'
- Table rows have role='row'
- Table cells have role='gridcell'
- Column headers have role='columnheader' with scope='col'

#### 20.2. Search region has proper accessibility

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment

**Expected Results:**

- Search container has role='search'
- Search input has aria-label
- Input has aria-describedby pointing to hint text
- Screen reader hint 'Enter를 눌러 검색하거나...' exists

#### 20.3. Filter controls are keyboard accessible

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Tab through filter controls

**Expected Results:**

- All filters can be reached via Tab key
- Dropdowns open with Enter/Space
- Arrow keys navigate options
- Escape closes dropdowns

#### 20.4. Pagination has proper ARIA attributes

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment

**Expected Results:**

- Pagination has role='navigation' with aria-label='페이지 탐색'
- Page buttons have aria-label (e.g., '2 페이지로 이동')
- Current page has aria-current='page'
- Disabled buttons have disabled attribute

#### 20.5. Sort buttons have accessible labels

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Focus sort button

**Expected Results:**

- Sort buttons have descriptive aria-label
- Active sort state is announced
- Label includes current sort direction

#### 20.6. Filter badges have remove button accessibility

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Navigate to /equipment?status=available
2. Focus on filter badge remove button

**Expected Results:**

- Remove button has aria-label='상태: 사용 가능 필터 제거'
- Filter list has role='list' with aria-label='적용된 필터'

#### 20.7. Loading state is announced to screen readers

**File:** `tests/e2e/equipment-list/accessibility.spec.ts`

**Steps:**

1. Navigate to /equipment
2. Trigger data loading

**Expected Results:**

- Container has aria-busy='true' during loading
- Container has aria-live='polite'
- Skeleton has aria-busy attribute

### 21. Card View Specific

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 21.1. Card view displays equipment data correctly

**File:** `tests/e2e/equipment-list/card-view.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Switch to card view

**Expected Results:**

- Equipment cards are displayed in grid
- Each card shows: name, management number, status, model
- Shared equipment shows SharedEquipmentBadge
- '상세' button links to equipment detail page

#### 21.2. Search highlighting works in card view

**File:** `tests/e2e/equipment-list/card-view.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment
3. Switch to card view
4. Enter search term

**Expected Results:**

- Search term is highlighted in card content
- HighlightText component marks matches

### 22. SSOT Filter Utils Verification

**Seed:** `tests/e2e/fixtures/auth.fixture.ts`

#### 22.1. Server and client filter parsing produces same result

**File:** `tests/e2e/equipment-list/ssot-verification.spec.ts`

**Steps:**

1. Login as testOperatorPage fixture
2. Navigate to /equipment?site=suwon&status=available&calibrationDueFilter=due_soon
3. Verify initial server-rendered state
4. Verify client-side hydrated state

**Expected Results:**

- No hydration mismatch errors
- Filter UI matches URL parameters
- API query uses correct transformed parameters

#### 22.2. API params transform correctly from UI filters

**File:** `tests/e2e/equipment-list/ssot-verification.spec.ts`

**Steps:**

1. Navigate to /equipment?calibrationDueFilter=due_soon&isShared=shared
2. Intercept API request

**Expected Results:**

- API request has calibrationDue=30 (not calibrationDueFilter)
- API request has isShared=true (not 'shared' string)
