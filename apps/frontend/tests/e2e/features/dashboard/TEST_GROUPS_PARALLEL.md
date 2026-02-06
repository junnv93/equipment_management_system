# Dashboard Test Parallel Execution Groups

## 분석 기준

### 병렬 실행 가능 조건

✅ **독립적인 읽기 전용 테스트** - 상태를 변경하지 않고 렌더링/API 응답만 검증
✅ **서로 다른 기능 테스트** - 같은 페이지지만 다른 독립적 기능
✅ **격리된 상태 관리** - 각 테스트가 독립적으로 로그인 + 페이지 초기화

### 순차 실행 필요 조건

❌ **상태 공유** - 한 테스트의 상태 변경이 다음 테스트에 영향
❌ **상태 의존성 체인** - Test A의 결과를 Test B가 전제로 함
❌ **탭 전환 시나리오** - 상태 지속성을 검증하기 위해 연속적 흐름 필요

---

## Parallel Group 1: 독립 읽기 전용 테스트 ⚡

**특징**: 상태 변경 없음, API 응답/렌더링만 검증, 완전 독립적

### 포함된 테스트 (8개)

| ID  | Test                       | Suite               | 독립성  | 비고                   |
| --- | -------------------------- | ------------------- | ------- | ---------------------- |
| 1.1 | disposed 라벨 검증         | Status Labels       | ✅ 독립 | 차트 렌더링만 확인     |
| 1.2 | pending_disposal 라벨 검증 | Status Labels       | ✅ 독립 | 차트 렌더링만 확인     |
| 1.3 | 전체 12개 라벨 검증        | Status Labels       | ✅ 독립 | 차트 렌더링만 확인     |
| 1.4 | Tooltip 한글 라벨 검증     | Status Labels       | ✅ 독립 | 마우스 hover만 수행    |
| 2.1 | 초기 상태 확인 (전체 팀)   | Basic Functionality | ✅ 독립 | 읽기만, 상태 변경 없음 |
| 5.1 | Tab 키 네비게이션          | Accessibility       | ✅ 독립 | 키보드 포커스만 이동   |
| 5.4 | Screen reader 속성 검증    | Accessibility       | ✅ 독립 | ARIA 속성 읽기만       |
| 4.4 | 페이지 리로드 상태 초기화  | Persistence         | ✅ 독립 | 독립적 시나리오        |

**실행 방법**:

```bash
# 모든 테스트가 병렬로 실행 가능 (workers=8)
npx playwright test \
  --grep "@parallel-group-1" \
  --workers=8
```

**테스트 파일 태그**:

```typescript
test.describe('독립 읽기 전용 테스트 @parallel-group-1', () => {
  // 1.1, 1.2, 1.3, 1.4, 2.1, 5.1, 5.4, 4.4
});
```

---

## Parallel Group 2: 독립 상태 변경 테스트 ⚡

**특징**: 상태 변경하지만 서로 다른 기능, 각 테스트가 독립적으로 초기화

### 포함된 테스트 (4개)

| ID  | Test                      | Suite           | 독립성  | 비고                      |
| --- | ------------------------- | --------------- | ------- | ------------------------- |
| 3.3 | Overdue calibrations API  | API Integration | ✅ 독립 | 팀 선택 → 특정 API만 검증 |
| 3.4 | Upcoming calibrations API | API Integration | ✅ 독립 | 팀 선택 → 특정 API만 검증 |
| 5.2 | Enter 키 선택             | Accessibility   | ✅ 독립 | 키보드 인터랙션만         |
| 5.3 | Space 키 선택             | Accessibility   | ✅ 독립 | 키보드 인터랙션만         |

**독립성 보장 방법**:

- 각 테스트는 `beforeEach`에서 페이지 새로 로드
- 서로 다른 팀 선택 (3.3: FCC EMC/RF, 3.4: SAR, 5.2: General EMC, 5.3: Automotive EMC)
- API 검증 후 상태 정리 불필요 (다음 테스트가 새로 초기화)

**실행 방법**:

```bash
# 병렬 실행 (workers=4)
npx playwright test \
  --grep "@parallel-group-2" \
  --workers=4
```

**테스트 파일 태그**:

```typescript
test.describe('독립 상태 변경 테스트 @parallel-group-2', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트마다 독립적으로 초기화
    await page.goto('/dashboard');
    await page.click('text=장비 현황');
  });

  // 3.3, 3.4, 5.2, 5.3
});
```

---

## Sequential Group 1: 팀 필터링 기본 흐름 🔄

**특징**: 상태 변경이 연속되며 다음 테스트가 이전 상태에 의존

### 포함된 테스트 (4개) - 순차 실행 필수

| 순서 | ID  | Test              | 의존성                   |
| ---- | --- | ----------------- | ------------------------ |
| 1    | 2.2 | 팀 선택 시 필터링 | - (초기 상태)            |
| 2    | 2.3 | 선택 상태 UI 검증 | 2.2의 팀 선택 상태       |
| 3    | 2.4 | 재클릭 시 해제    | 2.3의 선택된 팀          |
| 4    | 2.5 | 전체 팀 버튼      | 2.4 후 다시 팀 선택 필요 |

**순차 실행 이유**:

- **2.2 → 2.3**: 팀 선택 후 즉시 선택 상태 UI 확인 (상태 유지 필요)
- **2.3 → 2.4**: 선택된 팀을 재클릭하여 토글 동작 검증 (상태 이어받음)
- **2.4 → 2.5**: 다시 팀 선택 후 전체 팀 버튼으로 해제 (연속 시나리오)

**실행 방법**:

```bash
# 순차 실행 (workers=1)
npx playwright test \
  --grep "@sequential-group-1" \
  --workers=1 \
  --fully-parallel=false
```

**테스트 파일 구조**:

```typescript
test.describe.serial('팀 필터링 기본 흐름 @sequential-group-1', () => {
  // serial: 한 테스트 실패 시 나머지 skip
  let selectedTeamName: string;

  test('2.2: 팀 선택 시 필터링', async ({ page }) => {
    // 팀 선택
    selectedTeamName = 'FCC EMC/RF';
    await page.click(`text=${selectedTeamName}`);
  });

  test('2.3: 선택 상태 UI 검증', async ({ page }) => {
    // 이전 테스트에서 선택한 팀이 여전히 선택되어 있음
    await expect(page.locator(`text=${selectedTeamName}`)).toHaveClass(/bg-primary/);
  });

  test('2.4: 재클릭 시 해제', async ({ page }) => {
    // 같은 팀 다시 클릭
    await page.click(`text=${selectedTeamName}`);
  });

  test('2.5: 전체 팀 버튼', async ({ page }) => {
    // 다시 팀 선택 후 전체 팀 버튼으로 해제
    await page.click(`text=${selectedTeamName}`);
    await page.click('text=전체 팀');
  });
});
```

---

## Sequential Group 2: API 통합 검증 체인 🔄

**특징**: 팀 선택 후 여러 API를 순차적으로 검증

### 포함된 테스트 (3개) - 순차 실행 권장

| 순서 | ID  | Test                             | 의존성             |
| ---- | --- | -------------------------------- | ------------------ |
| 1    | 3.1 | Summary API with teamId          | - (팀 선택)        |
| 2    | 3.2 | Equipment status stats API       | 3.1의 팀 선택 상태 |
| 3    | 3.5 | 전체 API 비교 (filtered < total) | 여러 API 응답 비교 |

**순차 실행 이유**:

- **3.1 → 3.2**: 같은 팀 선택 상태에서 여러 API 검증 (재선택 오버헤드 제거)
- **3.5**: 모든 API의 필터링 전후 비교를 한 번에 수행 (테스트 효율성)

**실행 방법**:

```bash
npx playwright test \
  --grep "@sequential-group-2" \
  --workers=1
```

**테스트 파일 구조**:

```typescript
test.describe.serial('API 통합 검증 체인 @sequential-group-2', () => {
  let unfilteredData: any;
  let filteredData: any;
  const testTeamName = 'FCC EMC/RF';

  test('3.1: Summary API', async ({ page }) => {
    // Unfiltered
    const unfilteredResponse = await page.waitForResponse('/api/dashboard/summary');
    unfilteredData = { summary: await unfilteredResponse.json() };

    // 팀 선택
    await page.click(`text=${testTeamName}`);

    // Filtered
    const filteredResponse = await page.waitForResponse(
      (url) => url.includes('/api/dashboard/summary') && url.includes('teamId=')
    );
    filteredData = { summary: await filteredResponse.json() };
  });

  test('3.2: Equipment status stats API', async ({ page }) => {
    // 이미 팀이 선택된 상태, stats API 응답 검증
    const response = await page.waitForResponse('/api/dashboard/equipment-status-stats');
    const stats = await response.json();
    // 검증...
  });

  test('3.5: 전체 API 비교', async ({ page }) => {
    // unfilteredData와 filteredData 비교
    expect(filteredData.summary.totalEquipment).toBeLessThan(unfilteredData.summary.totalEquipment);
  });
});
```

---

## Sequential Group 3: 탭 전환 지속성 검증 🔄

**특징**: 상태 지속성을 위한 연속적인 탭 전환 시나리오

### 포함된 테스트 (3개) - 순차 실행 필수

| 순서 | ID  | Test              | 의존성            |
| ---- | --- | ----------------- | ----------------- |
| 1    | 4.1 | 교정 탭 전환      | 팀 선택 상태 유지 |
| 2    | 4.2 | 대여/반출 탭 전환 | 4.1의 상태 유지   |
| 3    | 4.3 | 장비 현황 복귀    | 4.2의 상태 유지   |

**순차 실행 이유**:

- **탭 전환 흐름**: 장비 현황 → 교정 → 대여/반출 → 장비 현황 (round-trip)
- **상태 지속성 검증**: 각 탭 전환 후 같은 teamId가 API에 전달되는지 확인
- **연속 시나리오**: 사용자의 실제 사용 패턴을 모방 (탭을 여러 번 전환)

**실행 방법**:

```bash
npx playwright test \
  --grep "@sequential-group-3" \
  --workers=1
```

**테스트 파일 구조**:

```typescript
test.describe.serial('탭 전환 지속성 검증 @sequential-group-3', () => {
  let selectedTeamId: string;

  test.beforeAll(async ({ page }) => {
    // 모든 테스트 전 팀 선택
    await page.goto('/dashboard');
    await page.click('text=장비 현황');

    const response = await page.waitForResponse(
      (url) => url.includes('/api/dashboard/summary') && url.includes('teamId=')
    );
    const url = response.url();
    selectedTeamId = new URL(url).searchParams.get('teamId')!;
  });

  test('4.1: 교정 탭 전환', async ({ page }) => {
    await page.click('text=교정');
    const response = await page.waitForResponse('/api/dashboard/upcoming-calibrations');
    expect(response.url()).toContain(`teamId=${selectedTeamId}`);
  });

  test('4.2: 대여/반출 탭 전환', async ({ page }) => {
    await page.click('text=대여/반출');
    const response = await page.waitForResponse('/api/dashboard/overdue-rentals');
    expect(response.url()).toContain(`teamId=${selectedTeamId}`);
  });

  test('4.3: 장비 현황 복귀', async ({ page }) => {
    await page.click('text=장비 현황');
    // 팀 카드가 여전히 선택되어 있는지 확인
    const selectedCard = page.locator('[role="button"]', {
      hasText: '(선택된 팀 이름)',
      has: page.locator('.bg-primary'),
    });
    await expect(selectedCard).toBeVisible();
  });
});
```

---

## Sequential Group 4: React Query 동작 검증 🔄

**특징**: React Query의 refetch 동작을 검증하기 위한 네트워크 추적

### 포함된 테스트 (1개) - 독립 실행 또는 순차

| ID  | Test                     | 이유                                             |
| --- | ------------------------ | ------------------------------------------------ |
| 3.6 | React Query refetch 검증 | 네트워크 이벤트 리스너가 다른 테스트와 충돌 가능 |

**독립 실행 권장 이유**:

- `page.on('response')` 이벤트 리스너를 사용하여 모든 네트워크 활동 추적
- 다른 테스트와 병렬 실행 시 이벤트 간섭 가능성
- 단독 실행으로 네트워크 추적 정확성 보장

**실행 방법**:

```bash
# 독립 실행
npx playwright test \
  --grep "3.6.*React Query" \
  --workers=1
```

---

## 실행 전략 요약

### 최적 병렬 실행 (추천)

```bash
# Phase 1: 병렬 그룹 1 (8 tests, ~2분)
npx playwright test --grep "@parallel-group-1" --workers=8

# Phase 2: 병렬 그룹 2 (4 tests, ~1분)
npx playwright test --grep "@parallel-group-2" --workers=4

# Phase 3: 순차 그룹들 (11 tests, ~5분)
npx playwright test --grep "@sequential" --workers=1 --fully-parallel=false
```

**총 예상 시간**: ~8분 (병렬 최적화)

### 순차 실행 (안전 모드)

```bash
# 모든 테스트 순차 실행 (디버깅용)
npx playwright test --workers=1 --fully-parallel=false
```

**총 예상 시간**: ~15분 (순차 실행)

### 속도 vs 안전성 트레이드오프

| 전략        | Workers | 시간  | 안정성  | 추천 상황             |
| ----------- | ------- | ----- | ------- | --------------------- |
| 전체 병렬   | 23      | ~3분  | ⚠️ 낮음 | 개발 중 빠른 피드백   |
| 그룹별 병렬 | 8/4/1   | ~8분  | ✅ 높음 | **CI/CD 추천**        |
| 전체 순차   | 1       | ~15분 | ✅ 최고 | 디버깅, 프로덕션 검증 |

---

## Playwright Config 설정 예시

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'dashboard-parallel-group-1',
      testMatch: /.*\.spec\.ts/,
      grep: /@parallel-group-1/,
      fullyParallel: true,
      workers: 8,
    },
    {
      name: 'dashboard-parallel-group-2',
      testMatch: /.*\.spec\.ts/,
      grep: /@parallel-group-2/,
      fullyParallel: true,
      workers: 4,
    },
    {
      name: 'dashboard-sequential',
      testMatch: /.*\.spec\.ts/,
      grep: /@sequential/,
      fullyParallel: false,
      workers: 1,
    },
  ],
});
```

**실행**:

```bash
# 특정 프로젝트만 실행
npx playwright test --project=dashboard-parallel-group-1

# 모든 프로젝트 순차적으로
npx playwright test --project=dashboard-parallel-group-1 \
                    --project=dashboard-parallel-group-2 \
                    --project=dashboard-sequential
```

---

## 테스트 파일별 태그 배치

### status-labels-ssot.spec.ts

- Test 1.1, 1.2, 1.3, 1.4 → `@parallel-group-1`

### team-filtering-basic.spec.ts

- Test 2.1 → `@parallel-group-1`
- Test 2.2, 2.3, 2.4, 2.5 → `@sequential-group-1`

### team-filtering-api.spec.ts

- Test 3.1, 3.2, 3.5 → `@sequential-group-2`
- Test 3.3, 3.4 → `@parallel-group-2`
- Test 3.6 → (독립 실행, 태그 없음)

### team-filtering-persistence.spec.ts

- Test 4.1, 4.2, 4.3 → `@sequential-group-3`
- Test 4.4 → `@parallel-group-1`

### team-filtering-accessibility.spec.ts

- Test 5.1, 5.4 → `@parallel-group-1`
- Test 5.2, 5.3 → `@parallel-group-2`

---

## 그룹화 결정 로직 다이어그램

```
테스트 분석
    │
    ├─ 상태 변경 없음? ──YES→ Parallel Group 1 (읽기 전용)
    │       │
    │       NO
    │       ↓
    ├─ 독립적 기능? ──YES→ Parallel Group 2 (독립 상태 변경)
    │       │
    │       NO
    │       ↓
    ├─ 상태 의존 체인? ──YES→ Sequential Group 1/2 (기본 흐름/API 체인)
    │       │
    │       NO
    │       ↓
    └─ 탭 전환 흐름? ──YES→ Sequential Group 3 (지속성 검증)
```

---

## 의존성 매트릭스

| Test | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | 3.6 | 4.1 | 4.2 | 4.3 | 4.4 | 5.1 | 5.2 | 5.3 | 5.4 | 1.x |
| ---- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2.2  |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| 2.3  |     | 🔗  |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| 2.4  |     |     | 🔗  |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| 2.5  |     | 🔗  |     | 🔗  |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| 3.2  |     |     |     |     |     | 🔗  |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| 3.5  |     |     |     |     |     | 🔗  | 🔗  |     |     |     |     |     |     |     |     |     |     |     |     |     |
| 4.2  |     |     |     |     |     |     |     |     |     |     |     | 🔗  |     |     |     |     |     |     |     |     |
| 4.3  |     |     |     |     |     |     |     |     |     |     |     |     | 🔗  |     |     |     |     |     |     |     |

🔗 = 의존성 있음 (순차 실행 필요)
공백 = 독립적 (병렬 실행 가능)

---

## 권장 CI/CD 파이프라인

```yaml
# .github/workflows/e2e-dashboard.yml
name: Dashboard E2E Tests

on: [push, pull_request]

jobs:
  parallel-group-1:
    runs-on: ubuntu-latest
    steps:
      - name: Run parallel group 1 (8 tests)
        run: npx playwright test --grep "@parallel-group-1" --workers=8

  parallel-group-2:
    runs-on: ubuntu-latest
    steps:
      - name: Run parallel group 2 (4 tests)
        run: npx playwright test --grep "@parallel-group-2" --workers=4

  sequential-tests:
    runs-on: ubuntu-latest
    needs: [parallel-group-1, parallel-group-2] # 병렬 테스트 후 실행
    steps:
      - name: Run sequential tests (11 tests)
        run: npx playwright test --grep "@sequential" --workers=1
```

**이점**:

- 병렬 그룹은 동시 실행 (총 8분 → 2분으로 단축)
- 순차 테스트는 병렬 테스트 성공 후에만 실행 (리소스 절약)
- 전체 파이프라인 시간: ~7분 (병렬 2분 + 순차 5분)
