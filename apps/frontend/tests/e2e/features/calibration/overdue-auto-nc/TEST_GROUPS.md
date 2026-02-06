# Calibration Overdue Auto NC - Test Execution Groups

## 병렬 실행 전략

이 문서는 29개 테스트 케이스를 **병렬 실행 가능성**에 따라 그룹화합니다.

### 그룹화 원칙

✅ **병렬 실행 가능 (Parallel-Safe)**

- 각 테스트가 독립적인 장비 데이터를 사용
- DB 상태를 공유하지 않음
- 읽기 전용 작업 또는 격리된 데이터 수정
- 테스트 간 경쟁 조건(race condition) 없음

⚠️ **순차 실행 필요 (Sequential)**

- 같은 장비 ID를 사용하는 연속된 작업
- 이전 테스트의 결과에 의존
- 전역 상태 변경 (스케줄러, 캐시 등)
- 트랜잭션 롤백 테스트 (DB 모킹 필요)

---

## 실행 그룹 구성

### 🟢 Parallel Group A: API Manual Trigger - Independent Scenarios (7 tests)

**병렬 실행 가능 이유**: 각 테스트가 서로 다른 장비 데이터를 사용하며, API 엔드포인트만 호출

| Test ID | Test Name                                        | Equipment ID | Parallel Safe |
| ------- | ------------------------------------------------ | ------------ | ------------- |
| 1.1     | should successfully trigger manual overdue check | `equip-a1`   | ✅ Yes        |
| 1.2     | should require MANAGE_EQUIPMENT permission       | `equip-a2`   | ✅ Yes        |
| 1.3     | should detect equipment with overdue calibration | `equip-a3`   | ✅ Yes        |
| 1.4     | should skip equipment already in non_conforming  | `equip-a4`   | ✅ Yes        |
| 1.5     | should skip with existing calibration_overdue NC | `equip-a5`   | ✅ Yes        |
| 1.6     | should skip calibrationRequired != 'required'    | `equip-a6`   | ✅ Yes        |
| 1.7     | should skip disposed and retired equipment       | `equip-a7`   | ✅ Yes        |

**실행 방법**:

```bash
# 모든 테스트 동시 실행
npx playwright test tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts --workers=7
```

**Seed File**: `seed-manual-trigger.spec.ts`

```typescript
// 각 테스트용 독립적인 장비 생성
await createEquipment({ id: 'equip-a1', managementNumber: 'TEST-A1', ... });
await createEquipment({ id: 'equip-a2', managementNumber: 'TEST-A2', ... });
// ... 7개 장비
```

---

### 🟡 Parallel Group B: API NC Creation - Partially Independent (6 tests)

**병렬 실행 제약**: 일부 테스트는 DB 트랜잭션 또는 모킹이 필요하므로 하위 그룹으로 분리

#### Subgroup B1: Simple NC Creation (병렬 가능, 4 tests)

| Test ID | Test Name                                                | Equipment ID | Parallel Safe |
| ------- | -------------------------------------------------------- | ------------ | ------------- |
| 2.1     | should create non-conformance record with correct fields | `equip-b1`   | ✅ Yes        |
| 2.2     | should change equipment status to non_conforming         | `equip-b2`   | ✅ Yes        |
| 2.3     | should create incident history record                    | `equip-b3`   | ✅ Yes        |
| 2.4     | should create system notification                        | `equip-b4`   | ✅ Yes        |

**실행 방법**:

```bash
npx playwright test tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts \
  --grep "Subgroup B1" --workers=4
```

#### Subgroup B2: Transaction & Batch Tests (순차 실행, 2 tests)

| Test ID | Test Name                                    | Equipment ID   | Sequential Reason                 |
| ------- | -------------------------------------------- | -------------- | --------------------------------- |
| 2.5     | should execute all operations in transaction | `equip-b5`     | ⚠️ DB 모킹 필요 (격리)            |
| 2.6     | should process multiple overdue equipment    | `equip-b6-1~5` | ⚠️ 배치 처리 (5개 장비 동시 생성) |

**실행 방법**:

```bash
npx playwright test tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts \
  --grep "Subgroup B2" --workers=1
```

---

### 🟢 Parallel Group C: API Auto-Correction - Independent Scenarios (6 tests)

**병렬 실행 가능 이유**: 각 테스트가 독립적인 장비 + 교정 기록을 사용

| Test ID | Test Name                                           | Equipment ID | Calibration ID | Parallel Safe      |
| ------- | --------------------------------------------------- | ------------ | -------------- | ------------------ |
| 3.1     | should auto-correct calibration_overdue NC          | `equip-c1`   | `cal-c1`       | ✅ Yes             |
| 3.2     | should update equipment calibration dates           | `equip-c2`   | `cal-c2`       | ✅ Yes             |
| 3.3     | should not fail if no NC exists                     | `equip-c3`   | `cal-c3`       | ✅ Yes             |
| 3.4     | should only auto-correct open/analyzing NC          | `equip-c4`   | `cal-c4`       | ✅ Yes             |
| 3.5     | should require pending_approval status              | `equip-c5`   | `cal-c5`       | ✅ Yes             |
| 3.6     | should handle auto-correction failure (best effort) | `equip-c6`   | `cal-c6`       | ✅ Yes (모킹 격리) |

**실행 방법**:

```bash
npx playwright test tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts --workers=6
```

**Seed File**: `seed-auto-correction.spec.ts`

```typescript
// 각 테스트용 장비 + 교정 기록 쌍 생성
await createEquipmentWithCalibration({
  equipmentId: 'equip-c1',
  calibrationId: 'cal-c1',
  ncType: 'calibration_overdue',
  ncStatus: 'open',
});
```

---

### 🟢 Parallel Group D: Frontend UI - Component Tests (8 tests)

**병렬 실행 가능 이유**: 각 테스트가 독립적인 브라우저 컨텍스트에서 실행

| Test ID | Test Name                                   | Equipment ID | Parallel Safe |
| ------- | ------------------------------------------- | ------------ | ------------- |
| 4.1     | should display calibration_overdue option   | `equip-d1`   | ✅ Yes        |
| 4.2     | should show non-conformance checkbox        | `equip-d2`   | ✅ Yes        |
| 4.3     | should show action plan field               | `equip-d3`   | ✅ Yes        |
| 4.4     | should hide checkbox for 'Change' type      | `equip-d4`   | ✅ Yes        |
| 4.5     | should successfully create incident with NC | `equip-d5`   | ✅ Yes        |
| 4.6     | should display incidents with purple badge  | `equip-d6`   | ✅ Yes        |
| 4.7     | should validate required fields             | `equip-d7`   | ✅ Yes        |
| 4.8     | should enforce content length limit         | `equip-d8`   | ✅ Yes        |

**실행 방법**:

```bash
npx playwright test tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts --workers=8
```

**장점**:

- 각 테스트가 새로운 브라우저 페이지 인스턴스 사용
- UI 렌더링만 테스트하므로 DB 경쟁 없음
- Playwright의 병렬 처리에 최적화됨

---

### 🔴 Sequential Group E: E2E Integration Workflows (5 tests)

**순차 실행 필요 이유**:

- 전체 워크플로우 테스트로 여러 단계가 연결됨
- 이전 단계의 결과를 다음 단계에서 사용
- 같은 장비의 상태가 지속적으로 변경됨

#### Subgroup E1: Main Workflow (순차 실행, 1 test)

| Test ID | Test Name                                            | Equipment ID | Sequential Reason      |
| ------- | ---------------------------------------------------- | ------------ | ---------------------- |
| 5.1     | should complete full overdue detection to resolution | `equip-e1`   | ⚠️ Multi-step workflow |

**Workflow Steps** (순차적으로 실행):

1. Setup equipment with overdue date
2. Trigger overdue check → status: `non_conforming`
3. Navigate to UI → verify banner
4. Create calibration record
5. Approve calibration → NC status: `corrected`
6. Verify all state changes

#### Subgroup E2: Data Consistency Tests (순차 실행, 2 tests)

| Test ID | Test Name                                                  | Equipment IDs                         | Sequential Reason          |
| ------- | ---------------------------------------------------------- | ------------------------------------- | -------------------------- |
| 5.2     | should maintain data consistency across multiple equipment | `equip-e2a`, `equip-e2b`, `equip-e2c` | ⚠️ 3개 장비 동시 처리 검증 |
| 5.3     | should handle multiple non-conformances                    | `equip-e3`                            | ⚠️ 같은 장비에 2개 NC      |

#### Subgroup E3: Concurrency Tests (병렬 가능, 2 tests)

| Test ID | Test Name                                      | Equipment ID | Parallel Safe           |
| ------- | ---------------------------------------------- | ------------ | ----------------------- |
| 5.4     | should verify UI updates after backend changes | `equip-e4`   | ✅ Yes (독립 장비)      |
| 5.5     | should handle rapid successive checks          | `equip-e5`   | ✅ Yes (중복 방지 검증) |

**실행 방법**:

```bash
# Subgroup E1 & E2: 순차 실행
npx playwright test tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts \
  --grep "Subgroup E1|Subgroup E2" --workers=1

# Subgroup E3: 병렬 실행
npx playwright test tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts \
  --grep "Subgroup E3" --workers=2
```

---

## 최적 병렬 실행 전략

### 전체 실행 (4 stages)

```bash
# Stage 1: API Tests - High Parallelism (13 tests, ~2분)
npx playwright test \
  tests/e2e/calibration-overdue-auto-nc/manual-trigger.spec.ts \
  tests/e2e/calibration-overdue-auto-nc/auto-correction.spec.ts \
  --workers=13

# Stage 2: NC Creation Tests - Partial Parallelism (6 tests, ~1.5분)
# B1 병렬 (4 tests)
npx playwright test tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts \
  --grep "Subgroup B1" --workers=4

# B2 순차 (2 tests)
npx playwright test tests/e2e/calibration-overdue-auto-nc/nc-creation.spec.ts \
  --grep "Subgroup B2" --workers=1

# Stage 3: Frontend UI Tests - High Parallelism (8 tests, ~1분)
npx playwright test tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts \
  --workers=8

# Stage 4: E2E Integration - Mixed (5 tests, ~3분)
# E1 & E2 순차 (3 tests)
npx playwright test tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts \
  --grep "Subgroup E1|Subgroup E2" --workers=1

# E3 병렬 (2 tests)
npx playwright test tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts \
  --grep "Subgroup E3" --workers=2
```

**예상 총 실행 시간**: ~7.5분 (순차 실행 시 ~20분에서 62% 단축)

---

## Playwright 설정 예시

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true, // 병렬 실행 활성화
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined, // CI: 4 workers, Local: CPU cores

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'calibration-overdue-parallel-group-a',
      testMatch: '**/manual-trigger.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true, // 그룹 A: 완전 병렬
    },
    {
      name: 'calibration-overdue-parallel-group-b1',
      testMatch: '**/nc-creation.spec.ts',
      testIgnore: '**/Subgroup B2/**',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true, // 그룹 B1: 병렬
    },
    {
      name: 'calibration-overdue-sequential-group-b2',
      testMatch: '**/nc-creation.spec.ts',
      grep: /Subgroup B2/,
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: false, // 그룹 B2: 순차
      workers: 1,
    },
    {
      name: 'calibration-overdue-parallel-group-c',
      testMatch: '**/auto-correction.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true, // 그룹 C: 완전 병렬
    },
    {
      name: 'calibration-overdue-parallel-group-d',
      testMatch: '**/incident-history-ui.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true, // 그룹 D: 완전 병렬
    },
    {
      name: 'calibration-overdue-mixed-group-e',
      testMatch: '**/e2e-workflow.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: false, // 그룹 E: 혼합 (subgroup별 처리)
    },
  ],
});
```

---

## 테스트 파일 구조

```
tests/e2e/calibration-overdue-auto-nc/
├── TEST_GROUPS.md                      # 이 문서
├── seed-data/
│   ├── seed-manual-trigger.spec.ts     # Group A 데이터
│   ├── seed-nc-creation.spec.ts        # Group B 데이터
│   ├── seed-auto-correction.spec.ts    # Group C 데이터
│   ├── seed-incident-history.spec.ts   # Group D 데이터
│   └── seed-e2e-workflow.spec.ts       # Group E 데이터
│
├── manual-trigger.spec.ts              # Group A (7 tests, 병렬)
├── nc-creation.spec.ts                 # Group B (6 tests, 혼합)
├── auto-correction.spec.ts             # Group C (6 tests, 병렬)
├── incident-history-ui.spec.ts         # Group D (8 tests, 병렬)
└── e2e-workflow.spec.ts                # Group E (5 tests, 혼합)
```

---

## 데이터 격리 전략

### 1. 독립적인 Equipment ID 사용

```typescript
// ✅ GOOD: 각 테스트가 고유한 장비 사용
test('Test 1.1', async () => {
  const equipmentId = 'equip-a1-unique';
  await setupEquipment({ id: equipmentId, ... });
  // 테스트 로직
});

test('Test 1.2', async () => {
  const equipmentId = 'equip-a2-unique';
  await setupEquipment({ id: equipmentId, ... });
  // 테스트 로직
});
```

### 2. Test Isolation with beforeEach

```typescript
test.describe('Parallel Group A', () => {
  let equipmentId: string;

  test.beforeEach(async ({ page }) => {
    // 각 테스트마다 새로운 장비 생성
    equipmentId = `equip-${Date.now()}-${Math.random().toString(36)}`;
    await setupEquipment({ id: equipmentId, ... });
  });

  test.afterEach(async () => {
    // 테스트 후 정리 (optional)
    await cleanupEquipment(equipmentId);
  });

  test('should detect overdue equipment', async ({ page }) => {
    // equipmentId는 이 테스트에만 고유함
  });
});
```

### 3. Database Transaction Isolation

```typescript
// Subgroup B2: 트랜잭션 롤백 테스트
test('should rollback on failure', async ({ page }) => {
  // 별도의 트랜잭션 컨텍스트에서 실행
  await db.transaction(async (tx) => {
    // 의도적 실패 시뮬레이션
    // 다른 테스트와 격리됨
  });
});
```

---

## 병렬 실행 시 주의사항

### ⚠️ Race Condition 방지

```typescript
// ❌ BAD: 같은 장비를 여러 테스트에서 사용
const SHARED_EQUIPMENT_ID = 'equip-shared';

test('Test A', async () => {
  await updateEquipment(SHARED_EQUIPMENT_ID, { status: 'available' });
});

test('Test B', async () => {
  await updateEquipment(SHARED_EQUIPMENT_ID, { status: 'non_conforming' });
  // Test A와 충돌 가능!
});

// ✅ GOOD: 각 테스트가 독립적인 장비 사용
test('Test A', async () => {
  const equipmentId = `equip-a-${Date.now()}`;
  await updateEquipment(equipmentId, { status: 'available' });
});

test('Test B', async () => {
  const equipmentId = `equip-b-${Date.now()}`;
  await updateEquipment(equipmentId, { status: 'non_conforming' });
});
```

### ⚠️ 전역 상태 변경

```typescript
// ❌ BAD: 스케줄러 설정 변경 (전역 상태)
test('Test A', async () => {
  await setSchedulerInterval('1 minute'); // 다른 테스트에 영향
});

// ✅ GOOD: 격리된 환경에서 테스트
test('Test A', async () => {
  // 별도의 스케줄러 인스턴스 사용 또는 모킹
  const mockScheduler = createMockScheduler();
  mockScheduler.setInterval('1 minute');
});
```

---

## 성능 최적화 팁

### 1. Worker 수 조정

```bash
# CPU 코어 수에 맞게 자동 조정 (추천)
npx playwright test --workers=auto

# 특정 수 지정 (CI 환경)
npx playwright test --workers=4

# 순차 실행 (디버깅 시)
npx playwright test --workers=1
```

### 2. Shard 분산 실행 (CI/CD)

```bash
# 전체 테스트를 4개 샤드로 분할
npx playwright test --shard=1/4  # Runner 1
npx playwright test --shard=2/4  # Runner 2
npx playwright test --shard=3/4  # Runner 3
npx playwright test --shard=4/4  # Runner 4
```

### 3. Selective Test Execution

```bash
# 변경된 파일과 관련된 테스트만 실행
npx playwright test --grep "@affected"

# 특정 그룹만 실행
npx playwright test --grep "Parallel Group [A-D]"
```

---

## 요약

| Group               | Tests  | Parallel      | Workers      | Est. Time  |
| ------------------- | ------ | ------------- | ------------ | ---------- |
| A: Manual Trigger   | 7      | ✅ Full       | 7            | ~2분       |
| B1: NC Creation     | 4      | ✅ Full       | 4            | ~1분       |
| B2: Transaction     | 2      | ⚠️ Sequential | 1            | ~0.5분     |
| C: Auto-Correction  | 6      | ✅ Full       | 6            | ~2분       |
| D: Frontend UI      | 8      | ✅ Full       | 8            | ~1분       |
| E1-E2: E2E Main     | 3      | ⚠️ Sequential | 1            | ~2분       |
| E3: E2E Concurrency | 2      | ✅ Partial    | 2            | ~1분       |
| **Total**           | **29** | **Mixed**     | **Variable** | **~7.5분** |

**병렬화 비율**: 24/29 테스트 (83%) 병렬 실행 가능

**성능 향상**: 순차 실행 대비 약 **62% 시간 단축** (20분 → 7.5분)
