# Dashboard Team Filtering and Status Labels Test Plan

## Application Overview

Comprehensive test plan for Equipment Management Dashboard covering:

1. Status Label SSOT Integration - Verify disposed/pending_disposal equipment statuses display in Korean (폐기완료/폐기대기)
2. Team Filtering Full Stack Integration - Verify team card filtering triggers backend API calls with teamId parameter

Technical Context:

- Frontend: Next.js 16, React 19, React Query for data fetching
- Backend: NestJS API with 6 dashboard endpoints accepting optional teamId param
- SSOT: Status labels from @equipment-management/schemas (EQUIPMENT_STATUS_LABELS)
- Database: PostgreSQL with 32 equipment items, 6 teams, various statuses including disposed/pending_disposal
- Auth: NextAuth.js with role-based access (lab_manager recommended for full access)

API Endpoints to Test:

- GET /api/dashboard/summary?teamId={uuid}
- GET /api/dashboard/equipment-by-team?teamId={uuid}
- GET /api/dashboard/equipment-status-stats?teamId={uuid}
- GET /api/dashboard/overdue-calibrations?teamId={uuid}
- GET /api/dashboard/upcoming-calibrations?teamId={uuid}&days=30
- GET /api/dashboard/overdue-rentals?teamId={uuid}

SSOT Imports for Test Validation:

- import { EQUIPMENT_STATUS_LABELS } from '@equipment-management/schemas'
- Status keys: disposed -> '폐기완료', pending_disposal -> '폐기대기'

## Test Scenarios

### 1. Suite 1: Status Labels SSOT Validation

**Seed:** `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

#### 1.1. Test 1.1: Verify disposed status displays as '폐기완료' in chart legend

**File:** `apps/frontend/tests/e2e/dashboard/status-labels-ssot.spec.ts`

**Steps:**

1. Login as lab_manager using auth fixture (siteAdminPage)
2. Navigate to dashboard (http://localhost:3000/)
3. Wait for dashboard to load (networkidle)
4. Intercept API call to /api/dashboard/equipment-status-stats and capture response
5. Verify API response contains 'disposed' key if disposed equipment exists in DB
6. Locate Equipment Status Chart card (heading: '장비 상태')
7. Find chart legend items (role='listitem')
8. If API response has disposed > 0, verify legend contains text '폐기완료'
9. Verify NO legend item contains raw English key 'disposed'

**Expected Results:**

- Dashboard loads successfully
- API endpoint /api/dashboard/equipment-status-stats returns valid response
- Chart legend displays Korean label '폐기완료' for disposed status
- No English status keys visible in legend (disposed, pending_disposal, etc.)

#### 1.2. Test 1.2: Verify pending_disposal status displays as '폐기대기' in chart legend

**File:** `apps/frontend/tests/e2e/dashboard/status-labels-ssot.spec.ts`

**Steps:**

1. Login as lab_manager using auth fixture (siteAdminPage)
2. Navigate to dashboard
3. Intercept API call to /api/dashboard/equipment-status-stats
4. Capture and store API response JSON
5. If API response contains pending_disposal > 0:
6. - Locate chart legend and verify '폐기대기' label is present
7. - Verify NO legend item shows 'pending_disposal' in English
8. Extract all legend item texts using locator('[role="listitem"]')
9. Verify each legend text matches EQUIPMENT_STATUS_LABELS Korean values

**Expected Results:**

- API response properly identifies pending_disposal equipment
- Chart legend shows '폐기대기' for pending_disposal status
- No raw English keys visible in UI

#### 1.3. Test 1.3: Verify all 12 status labels are Korean (no English keys visible)

**File:** `apps/frontend/tests/e2e/dashboard/status-labels-ssot.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Wait for Equipment Status Chart to load
4. Collect all legend item texts from chart using: page.locator('[role="listitem"]').allTextContents()
5. Define SSOT validation set from EQUIPMENT_STATUS_LABELS: ['사용 가능', '사용 중', '반출 중', '교정 예정', '교정 기한 초과', '부적합', '여분', '폐기', '폐기대기', '폐기완료', '임시등록', '비활성']
6. Define forbidden English keys: ['available', 'in_use', 'checked_out', 'calibration_scheduled', 'calibration_overdue', 'non_conforming', 'spare', 'retired', 'pending_disposal', 'disposed', 'temporary', 'inactive']
7. For each legend text, verify it does NOT contain any forbidden English key
8. For each legend text, verify it contains a valid Korean status label
9. Take screenshot of chart legend for documentation

**Expected Results:**

- All legend items display Korean status labels
- No forbidden English status keys appear in any legend item
- Each displayed status matches SSOT EQUIPMENT_STATUS_LABELS values

#### 1.4. Test 1.4: Verify chart tooltip uses Korean labels

**File:** `apps/frontend/tests/e2e/dashboard/status-labels-ssot.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Wait for Equipment Status Chart to render (.recharts-wrapper)
4. Hover over a pie chart segment using mouse position on .recharts-pie-sector
5. Wait for tooltip to appear (.recharts-tooltip-wrapper)
6. Capture tooltip text content
7. Verify tooltip displays Korean status label (not English key)
8. Verify tooltip shows count in format: 'N대 (X.X%)'

**Expected Results:**

- Tooltip appears on hover
- Tooltip displays Korean status label
- Tooltip shows equipment count and percentage

### 2. Suite 2: Team Filtering - Basic Functionality

**Seed:** `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

#### 2.1. Test 2.1: Initial state shows all equipment (전체 팀 selected)

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-basic.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click on '장비 현황' tab
4. Locate '전체 팀' button in team list
5. Verify '전체 팀' button has selected visual state (bg-primary/10 border-primary classes)
6. Verify Equipment Status Chart total matches expected seeded data (approximately 32 equipment)
7. Verify team list shows all 6 teams: FCC EMC/RF, General EMC, General RF, SAR, Automotive EMC, Software

**Expected Results:**

- '전체 팀' button shows selected state (blue background/border)
- Total equipment count reflects full database (~32 items)
- All 6 teams are visible in team list with their equipment counts

#### 2.2. Test 2.2: Clicking team card filters equipment count

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-basic.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab
4. Capture initial total equipment count from stats card or chart
5. Set up API response interceptor for /api/dashboard/summary
6. Click on first team card (e.g., 'FCC EMC/RF')
7. Wait for API response with teamId parameter
8. Capture API response JSON
9. Verify API URL includes teamId query parameter (UUID format)
10. Verify filtered totalEquipment in response < initial total
11. Verify chart total count updates to match filtered data

**Expected Results:**

- API call includes teamId parameter in query string
- API response totalEquipment is less than initial unfiltered count
- UI chart updates to show filtered equipment count
- Stats cards update to reflect filtered team data

#### 2.3. Test 2.3: Team card shows visual selection state

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-basic.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab
4. Click on a team card (e.g., 'General EMC')
5. Verify clicked team card has 'bg-primary/10 border-primary' classes
6. Verify '전체 팀' button no longer has selected state
7. Verify other team cards do not have selected state
8. Click on different team card (e.g., 'SAR')
9. Verify selection moves to new team card
10. Verify previous team card loses selection styling

**Expected Results:**

- Only one team card can be selected at a time
- Selected team card shows blue background (bg-primary/10) and blue border (border-primary)
- Non-selected team cards show default styling

#### 2.4. Test 2.4: Clicking same team again deselects (returns to 전체 팀)

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-basic.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Capture initial unfiltered equipment count
4. Click on a team card (e.g., 'FCC EMC/RF')
5. Verify team is selected and data is filtered
6. Set up API interceptor for /api/dashboard/summary
7. Click on the same team card again
8. Verify API call is made WITHOUT teamId parameter
9. Verify '전체 팀' button regains selected state
10. Verify team card loses selected styling
11. Verify equipment count returns to initial unfiltered value

**Expected Results:**

- Second click on same team deselects it
- API call after deselection does not include teamId
- '전체 팀' button becomes selected again
- Equipment counts return to unfiltered totals

#### 2.5. Test 2.5: '전체 팀' button resets filter

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-basic.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Click on a team card to filter data
4. Verify filtered state (reduced equipment count)
5. Set up API interceptor
6. Click '전체 팀' button
7. Verify API call made without teamId parameter
8. Verify all team cards lose selection styling
9. Verify '전체 팀' button gains selection styling
10. Verify equipment counts return to full totals

**Expected Results:**

- '전체 팀' button click clears team filter
- API called without teamId returns all equipment
- UI displays full equipment counts

### 3. Suite 3: Team Filtering - API Integration

**Seed:** `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

#### 3.1. Test 3.1: Summary API called with teamId param when team selected

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-api.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab
4. Set up request listener: const requests = []; page.on('request', req => { if (req.url().includes('/api/dashboard/summary')) requests.push(req.url()); });
5. Click on a team card
6. Wait for network idle
7. Verify requests array contains URL with teamId parameter
8. Extract teamId from URL using regex
9. Verify teamId is valid UUID format: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

**Expected Results:**

- API request made to /api/dashboard/summary?teamId={uuid}
- teamId is valid UUID format
- Request completes successfully (status 200)

#### 3.2. Test 3.2: Equipment status stats API returns filtered data

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-api.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Intercept /api/dashboard/equipment-status-stats response (unfiltered)
4. Store unfiltered response: unfilteredStats = response.json()
5. Calculate unfiltered total: Object.values(unfilteredStats).reduce((a,b) => a+b, 0)
6. Click on a team card
7. Intercept /api/dashboard/equipment-status-stats?teamId={uuid} response
8. Store filtered response: filteredStats = response.json()
9. Calculate filtered total
10. Assert: filtered total < unfiltered total
11. Verify response structure has same status keys

**Expected Results:**

- Unfiltered API returns all equipment counts by status
- Filtered API returns reduced counts for selected team only
- Filtered total is less than unfiltered total
- Response structure is consistent (same keys)

#### 3.3. Test 3.3: Overdue calibrations API filters by team

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-api.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Set up response interceptor for /api/dashboard/overdue-calibrations
4. Capture unfiltered response (no teamId)
5. Store: unfilteredOverdue = await response.json()
6. Click '장비 현황' tab and select a team
7. Capture filtered response (with teamId)
8. Store: filteredOverdue = await response.json()
9. If unfilteredOverdue.length > 0 and filteredOverdue.length > 0:
10. - Verify filteredOverdue.length <= unfilteredOverdue.length
11. - Verify all items in filteredOverdue belong to selected team

**Expected Results:**

- Overdue calibrations API accepts teamId parameter
- Filtered results only include equipment from selected team
- Filtered count is less than or equal to unfiltered count

#### 3.4. Test 3.4: Upcoming calibrations API filters by team

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-api.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Intercept /api/dashboard/upcoming-calibrations?days=30 (unfiltered)
4. Capture unfiltered response array
5. Click '장비 현황' tab and select a team
6. Intercept /api/dashboard/upcoming-calibrations?days=30&teamId={uuid}
7. Capture filtered response array
8. Verify URL contains both days and teamId parameters
9. Compare array lengths: filteredCount <= unfilteredCount

**Expected Results:**

- Upcoming calibrations API accepts both days and teamId parameters
- Filtered results are subset of unfiltered results
- API returns proper array structure

#### 3.5. Test 3.5: Compare response data - filtered count < total count

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-api.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Capture all unfiltered API responses in parallel:
4. - summary (totalEquipment)
5. - equipment-status-stats (sum of all values)
6. - equipment-by-team (sum of all team counts)
7. Click on a team with equipment (verify count > 0 on team card)
8. Wait for React Query refetch (network activity)
9. Capture all filtered API responses
10. Compare each metric: filtered < unfiltered OR filtered == team-specific count
11. Log comparison results for debugging

**Expected Results:**

- All 6 dashboard APIs accept teamId filtering
- Filtered totalEquipment equals the selected team's equipment count
- Filtered equipment-status-stats sum matches team's total
- Data consistency across all endpoints when filtered

#### 3.6. Test 3.6: Verify React Query triggers refetch on team selection

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-api.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Wait for initial data load (all queries settled)
4. Set up network activity tracker: let apiCallCount = 0; page.on('response', res => { if (res.url().includes('/api/dashboard/')) apiCallCount++; });
5. Reset counter: apiCallCount = 0
6. Click on a team card
7. Wait for network idle
8. Verify apiCallCount >= 5 (summary, equipment-by-team, equipment-status-stats, overdue-calibrations, upcoming-calibrations, overdue-rentals)
9. Verify all calls include teamId parameter

**Expected Results:**

- Team selection triggers refetch of multiple queries
- At least 5-6 API calls made when team is selected
- All API calls include correct teamId parameter
- React Query queryKey includes selectedTeamId for cache invalidation

### 4. Suite 4: Team Filtering - Persistence

**Seed:** `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

#### 4.1. Test 4.1: Team selection persists when switching to 교정 tab

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-persistence.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab
4. Select a specific team (e.g., 'FCC EMC/RF')
5. Capture team's equipment count from card
6. Verify filter is applied (check API response includes teamId)
7. Click '교정' tab
8. Wait for tab content to load
9. Set up interceptor for /api/dashboard/upcoming-calibrations
10. Verify calibration data API call includes same teamId
11. Verify calibration list shows team-filtered data

**Expected Results:**

- Team selection state preserved when switching to 교정 tab
- Calibration API calls include previously selected teamId
- Calibration data reflects team-specific equipment only

#### 4.2. Test 4.2: Team selection persists when switching to 대여/반출 tab

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-persistence.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab and select a team
4. Store selected teamId from intercepted API call
5. Click '대여/반출' tab
6. Wait for tab content to load
7. Intercept /api/dashboard/overdue-rentals call
8. Verify request URL includes stored teamId
9. Verify checkouts data is team-filtered

**Expected Results:**

- Team selection persists across tab switches
- Overdue rentals API receives same teamId
- Checkout data is filtered by team

#### 4.3. Test 4.3: Team selection persists when returning to 장비 현황 tab

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-persistence.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab and select a team (e.g., 'SAR')
4. Note team card's selected visual state
5. Click '개요' tab
6. Click '교정' tab
7. Click '장비 현황' tab (return)
8. Verify selected team card still has selected styling
9. Verify '전체 팀' button does NOT have selected styling
10. Verify chart shows team-filtered data (not full totals)

**Expected Results:**

- Team card selection styling persists after tab round-trip
- Team filter state maintained in React state (selectedTeamId)
- Chart and stats show team-filtered data

#### 4.4. Test 4.4: Team selection resets on page reload (no URL persistence)

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-persistence.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab and select a team
4. Verify team is selected (filtered data)
5. Reload page (page.reload())
6. Wait for dashboard to load
7. Click '장비 현황' tab
8. Verify '전체 팀' button has selected state (default)
9. Verify no team cards have selected styling
10. Verify chart shows unfiltered total equipment

**Expected Results:**

- Page reload clears team selection state
- Default state is '전체 팀' (no filter)
- React Query fetches unfiltered data after reload
- Note: This is expected behavior (state not persisted to URL)

### 5. Suite 5: Team Filtering - Keyboard Accessibility

**Seed:** `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

#### 5.1. Test 5.1: Tab key navigation to team card

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-accessibility.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard
3. Click '장비 현황' tab
4. Focus on '전체 팀' button using keyboard (Tab key navigation)
5. Verify '전체 팀' button receives focus (document.activeElement check)
6. Press Tab key to move to first team card
7. Verify first team card receives focus
8. Verify focus ring is visible (focus-visible CSS state)
9. Continue Tab to navigate through all team cards

**Expected Results:**

- Team cards are focusable via Tab key
- Focus ring is visible when team card has focus
- Tab order follows visual order (전체 팀 -> teams in list order)

#### 5.2. Test 5.2: Enter key selects team

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-accessibility.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Tab navigate to a team card (e.g., second team)
4. Set up API interceptor for /api/dashboard/summary
5. Press Enter key
6. Verify team card gains selected styling
7. Verify API call made with teamId parameter
8. Verify chart data updates to filtered view

**Expected Results:**

- Enter key activates team selection
- Team card shows selected visual state
- Data filters correctly (API called with teamId)

#### 5.3. Test 5.3: Space key selects team

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-accessibility.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Tab navigate to a team card
4. Set up API interceptor
5. Press Space key (page.keyboard.press('Space'))
6. Verify team card gains selected styling
7. Verify API call includes teamId
8. Press Space key again on same card
9. Verify card is deselected (toggle behavior)
10. Verify API call made without teamId

**Expected Results:**

- Space key toggles team selection
- First Space press selects team
- Second Space press deselects team
- Keyboard interaction matches mouse click behavior

#### 5.4. Test 5.4: Screen reader accessible team cards

**File:** `apps/frontend/tests/e2e/dashboard/team-filtering-accessibility.spec.ts`

**Steps:**

1. Login as lab_manager
2. Navigate to dashboard and click '장비 현황' tab
3. Locate team card elements
4. Verify each team card has role='button' attribute
5. Verify each team card has tabindex='0'
6. Verify team name is accessible text content
7. Verify equipment count (e.g., '9대') is accessible
8. Check for aria-pressed attribute on selected card (optional enhancement)

**Expected Results:**

- Team cards have proper button role
- Team cards are keyboard focusable (tabindex=0)
- Team name and count are accessible to screen readers
- ARIA attributes properly communicate selection state
