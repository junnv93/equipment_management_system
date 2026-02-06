# 장비 등록 E2E 테스트 병렬 실행 그룹

## 병렬 실행 전략

### 의존성 분석 기준

1. **데이터 의존성**: 같은 장비 데이터를 생성/수정/조회하는 테스트는 순차 실행
2. **상태 의존성**: 승인 상태, 이력 데이터 등 상태를 공유하는 테스트는 순차 실행
3. **역할 독립성**: 서로 다른 역할(testOperator, techManager, siteAdmin)로 테스트하면 병렬 가능
4. **기능 독립성**: 파일 업로드, 폼 검증, 에러 처리 등은 독립적으로 병렬 가능
5. **DB 충돌 방지**: 각 테스트마다 고유한 관리번호 사용으로 충돌 방지

### Playwright 병렬 실행 구성

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true, // 모든 테스트 파일 병렬 실행
  workers: process.env.CI ? 2 : 4, // 워커 수 설정
});
```

---

## 병렬 그룹 1: 역할별 승인 워크플로우 (독립 실행)

**특징**: 각 테스트가 서로 다른 역할로 독립적인 장비를 생성하므로 **완전 병렬 가능**

### 파일: `approval-workflow-test-operator.spec.ts`

- **1.1. 시험실무자는 장비 등록 시 승인 요청을 생성한다**
- 역할: `testOperatorPage`
- 관리번호: `SUW-E 1001` (고유)
- 검증: requestUuid 반환, 승인 대기 상태

### 파일: `approval-workflow-tech-manager.spec.ts`

- **1.2. 기술책임자는 장비를 직접 등록할 수 있다**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 1002` (고유)
- 검증: uuid 반환, 즉시 등록

### 파일: `approval-workflow-lab-manager.spec.ts`

- **1.3. 시험소 관리자는 장비를 직접 등록할 수 있다**
- 역할: `siteAdminPage`
- 관리번호: `SUW-E 1003` (고유)
- 검증: uuid 반환, 즉시 등록

**의존성**: ❌ 없음 (각 테스트가 고유 데이터 사용)
**병렬 실행**: ✅ 가능 (3개 파일 동시 실행)

---

## 병렬 그룹 2: 폼 유효성 검사 (독립 실행)

**특징**: 각 테스트가 서로 다른 유효성 검사를 하므로 **완전 병렬 가능**

### 파일: `validation-required-fields.spec.ts`

- **2.1. 필수 필드 누락 시 유효성 검사 에러 표시**
- 역할: `techManagerPage`
- 동작: 등록 시도 없이 폼 검증만 수행
- 검증: 에러 메시지 표시

### 파일: `validation-management-number.spec.ts`

- **2.2. 관리번호 일련번호 형식 검증**
- 역할: `techManagerPage`
- 동작: 관리번호 형식 검증만 수행
- 검증: 형식 에러 메시지 표시

### 파일: `validation-calibration-conditional.spec.ts`

- **2.3. 교정 정보 조건부 필수 필드 검증**
- 역할: `techManagerPage`
- 동작: 교정 방법 선택에 따른 필드 활성화 검증
- 검증: 조건부 필수 필드 활성화

### 파일: `validation-duplicate-number.spec.ts`

- **2.4. 중복 관리번호 검증**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 2001` (seed 데이터로 미리 생성)
- 동작: 중복 관리번호로 등록 시도
- 검증: API 에러 응답

**의존성**: ⚠️ 2.4만 seed 데이터 필요
**병렬 실행**: ✅ 가능 (4개 파일 동시 실행, seed는 beforeAll에서 1회 생성)

---

## 병렬 그룹 3: 파일 업로드 (독립 실행)

**특징**: 각 테스트가 서로 다른 파일 업로드 시나리오를 테스트하므로 **완전 병렬 가능**

### 파일: `file-upload-single.spec.ts`

- **3.1. 검수보고서 파일 업로드 성공**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 3001` (고유)
- 검증: 단일 파일 업로드 및 DB 저장

### 파일: `file-upload-multiple.spec.ts`

- **3.2. 다중 파일 업로드 (최대 10개)**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 3002` (고유)
- 검증: 5개 파일 동시 업로드

### 파일: `file-upload-size-limit.spec.ts`

- **3.3. 파일 크기 제한 검증 (10MB 초과)**
- 역할: `techManagerPage`
- 동작: 등록 시도 없이 파일 업로드만 검증
- 검증: 크기 제한 에러 메시지

### 파일: `file-upload-type-validation.spec.ts`

- **3.4. 허용되지 않은 파일 형식 검증**
- 역할: `techManagerPage`
- 동작: 등록 시도 없이 파일 형식만 검증
- 검증: 형식 에러 메시지

**의존성**: ❌ 없음
**병렬 실행**: ✅ 가능 (4개 파일 동시 실행)

---

## 병렬 그룹 4: 이력 데이터 병렬 저장 (순차 실행 필요)

**특징**: 이력 저장 로직 자체를 검증하므로 **순차 실행 권장** (하지만 각 파일은 고유 장비 사용으로 병렬 가능)

### 파일: `history-save-location.spec.ts`

- **4.1. 위치 변동 이력과 함께 장비 등록**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 4001` (고유)
- 검증: 위치 이력 3건 병렬 저장

### 파일: `history-save-multiple-types.spec.ts`

- **4.2. 다양한 이력 유형 병렬 저장**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 4002` (고유)
- 검증: 위치 2건 + 유지보수 1건 + 손상/수리 1건 + 교정 1건 병렬 저장

### 파일: `history-save-partial-failure.spec.ts`

- **4.3. 이력 부분 실패 시 에러 처리**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 4003` (고유)
- 동작: API 모킹으로 일부 이력 실패 시뮬레이션
- 검증: PartialSuccessAlert 표시

### 파일: `history-save-delete-temp.spec.ts`

- **4.4. 임시 이력 삭제 후 등록**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 4004` (고유)
- 검증: tempId 기반 삭제 후 나머지만 저장

**의존성**: ❌ 없음 (각 테스트가 고유 관리번호 사용)
**병렬 실행**: ✅ 가능 (4개 파일 동시 실행)

---

## 병렬 그룹 5: 공용/렌탈 장비 기본 기능 (독립 실행)

**특징**: 각 테스트가 서로 다른 공용/렌탈 장비 시나리오를 테스트하므로 **완전 병렬 가능**

### 파일: `shared-equipment-common.spec.ts`

- **5.1. 공용장비 임시등록 성공**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 5001` (고유)
- 검증: 공용장비 등록 (sharedSource: 'safety_lab')

### 파일: `shared-equipment-rental.spec.ts`

- **5.2. 렌탈장비 임시등록 성공**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 5002` (고유)
- 검증: 렌탈장비 등록 (sharedSource: 'external')

### 파일: `shared-equipment-validation-warning.spec.ts`

- **5.3. 교정 유효성 자동 검증 - 경고 표시**
- 역할: `techManagerPage`
- 동작: 등록 시도 없이 교정 유효성만 검증
- 검증: CalibrationValidityChecker 경고 표시

### 파일: `shared-equipment-validation-valid.spec.ts`

- **5.4. 교정 유효성 자동 검증 - 유효**
- 역할: `techManagerPage`
- 동작: 등록 시도 없이 교정 유효성만 검증
- 검증: 유효 메시지 표시

### 파일: `shared-equipment-certificate-required.spec.ts`

- **5.5. 교정성적서 필수 업로드 검증**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 5003` (고유)
- 검증: 교정성적서 없이 등록 불가

**의존성**: ❌ 없음
**병렬 실행**: ✅ 가능 (5개 파일 동시 실행)

---

## 병렬 그룹 6: 공용/렌탈 장비 역할별 동작 (독립 실행)

**특징**: 서로 다른 역할과 동작을 테스트하므로 **완전 병렬 가능**

### 파일: `shared-role-test-operator.spec.ts`

- **6.1. 시험실무자도 공용/렌탈 장비를 임시등록할 수 있다**
- 역할: `testOperatorPage`
- 관리번호: `SUW-E 6001` (고유)
- 검증: 시험실무자 직접 등록 가능

### 파일: `shared-navigation-link.spec.ts`

- **6.2. 일반 장비 등록 페이지에서 공용장비 등록 링크 확인**
- 역할: `techManagerPage`
- 동작: 네비게이션만 테스트 (등록 없음)
- 검증: 링크 클릭 시 페이지 이동

**의존성**: ❌ 없음
**병렬 실행**: ✅ 가능 (2개 파일 동시 실행)

---

## 병렬 그룹 7: 에러 처리 및 네트워크 에러 (독립 실행)

**특징**: API 모킹을 사용하므로 실제 DB에 영향 없이 **완전 병렬 가능**

### 파일: `error-handling-api-error.spec.ts`

- **7.1. API 에러 발생 시 사용자 친화적 에러 메시지 표시**
- 역할: `techManagerPage`
- 동작: API 응답 모킹 (500 Internal Server Error)
- 검증: ErrorAlert 표시

### 파일: `error-handling-timeout.spec.ts`

- **7.2. 네트워크 타임아웃 에러 처리**
- 역할: `techManagerPage`
- 동작: 네트워크 지연 모킹 (30초 이상)
- 검증: 타임아웃 에러 메시지

### 파일: `error-handling-forbidden.spec.ts`

- **7.3. 권한 없음 에러 처리 (403 Forbidden)**
- 역할: `techManagerPage`
- 동작: API 응답 모킹 (403 Forbidden)
- 검증: 권한 에러 메시지

**의존성**: ❌ 없음 (API 모킹 사용)
**병렬 실행**: ✅ 가능 (3개 파일 동시 실행)

---

## 병렬 그룹 8: UI/UX 및 접근성 (독립 실행)

**특징**: UI 동작만 테스트하고 등록 없으므로 **완전 병렬 가능**

### 파일: `accessibility-section-order.spec.ts`

- **8.1. 폼 섹션 순차 표시 및 스크롤 동작**
- 역할: `techManagerPage`
- 동작: 섹션 순서 확인만 (등록 없음)
- 검증: 섹션 순서 및 번호 뱃지

### 파일: `accessibility-keyboard-navigation.spec.ts`

- **8.2. 키보드 네비게이션**
- 역할: `techManagerPage`
- 동작: Tab/Enter/Escape 키 테스트 (등록 없음)
- 검증: 키보드 네비게이션

### 파일: `accessibility-cancel-button.spec.ts`

- **8.3. 취소 버튼 클릭 시 이전 페이지로 이동**
- 역할: `techManagerPage`
- 동작: 취소 버튼 클릭 (등록 없음)
- 검증: 페이지 이동

### 파일: `accessibility-back-button.spec.ts`

- **8.4. 뒤로 가기 버튼 동작**
- 역할: `techManagerPage`
- 동작: 뒤로 가기 버튼 클릭 (등록 없음)
- 검증: 페이지 이동

**의존성**: ❌ 없음
**병렬 실행**: ✅ 가능 (4개 파일 동시 실행)

---

## 병렬 그룹 9: DB 검증 통합 테스트 (독립 실행)

**특징**: 각 테스트가 고유 장비 데이터를 생성하므로 **완전 병렬 가능**

### 파일: `db-verification-equipment.spec.ts`

- **9.1. 장비 등록 후 DB 데이터 검증**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 9001` (고유)
- 검증: 장비 데이터 DB 저장

### 파일: `db-verification-history.spec.ts`

- **9.2. 이력 데이터 DB 저장 검증**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 9002` (고유)
- 검증: 이력 데이터 DB 저장

### 파일: `db-verification-shared.spec.ts`

- **9.3. 공용장비 등록 후 DB 데이터 검증**
- 역할: `techManagerPage`
- 관리번호: `SUW-E 9003` (고유)
- 검증: 공용장비 전용 필드 DB 저장

### 파일: `db-verification-approval-request.spec.ts`

- **9.4. 승인 요청 DB 저장 검증 (시험실무자)**
- 역할: `testOperatorPage`
- 관리번호: `SUW-E 9004` (고유)
- 검증: 승인 요청 데이터 DB 저장

**의존성**: ❌ 없음 (각 테스트가 고유 관리번호 사용)
**병렬 실행**: ✅ 가능 (4개 파일 동시 실행)

---

## 병렬 실행 요약

### 전체 구조

```
apps/frontend/tests/e2e/equipment-create/
├── seed.spec.ts (beforeAll에서 1회 실행)
│
├── group-1-approval-workflow/         # 3개 파일 병렬
│   ├── test-operator.spec.ts
│   ├── tech-manager.spec.ts
│   └── lab-manager.spec.ts
│
├── group-2-validation/                # 4개 파일 병렬
│   ├── required-fields.spec.ts
│   ├── management-number.spec.ts
│   ├── calibration-conditional.spec.ts
│   └── duplicate-number.spec.ts
│
├── group-3-file-upload/               # 4개 파일 병렬
│   ├── single.spec.ts
│   ├── multiple.spec.ts
│   ├── size-limit.spec.ts
│   └── type-validation.spec.ts
│
├── group-4-history-save/              # 4개 파일 병렬
│   ├── location.spec.ts
│   ├── multiple-types.spec.ts
│   ├── partial-failure.spec.ts
│   └── delete-temp.spec.ts
│
├── group-5-shared-equipment/          # 5개 파일 병렬
│   ├── common.spec.ts
│   ├── rental.spec.ts
│   ├── validation-warning.spec.ts
│   ├── validation-valid.spec.ts
│   └── certificate-required.spec.ts
│
├── group-6-shared-role/               # 2개 파일 병렬
│   ├── test-operator.spec.ts
│   └── navigation-link.spec.ts
│
├── group-7-error-handling/            # 3개 파일 병렬
│   ├── api-error.spec.ts
│   ├── timeout.spec.ts
│   └── forbidden.spec.ts
│
├── group-8-accessibility/             # 4개 파일 병렬
│   ├── section-order.spec.ts
│   ├── keyboard-navigation.spec.ts
│   ├── cancel-button.spec.ts
│   └── back-button.spec.ts
│
└── group-9-db-verification/           # 4개 파일 병렬
    ├── equipment.spec.ts
    ├── history.spec.ts
    ├── shared.spec.ts
    └── approval-request.spec.ts
```

### 병렬 실행 통계

- **총 테스트 파일**: 33개 (seed 제외 시 32개)
- **병렬 그룹**: 9개
- **완전 병렬 가능**: ✅ 모든 그룹
- **순차 실행 필요**: ❌ 없음

### 실행 시간 예상

```bash
# 순차 실행 (기존 방식)
총 32개 테스트 × 평균 30초 = 960초 (16분)

# 병렬 실행 (4 workers)
# - 그룹 1: 3개 파일 / 4 workers = 1 batch
# - 그룹 2: 4개 파일 / 4 workers = 1 batch
# - 그룹 3: 4개 파일 / 4 workers = 1 batch
# ... 총 9 batches
총 9 batches × 평균 30초 = 270초 (4.5분)

# 성능 향상: 약 72% 단축 (16분 → 4.5분)
```

### Playwright 설정

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true, // 모든 테스트 파일 병렬 실행
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4, // 로컬: 4 workers, CI: 2 workers

  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
  },

  // 각 그룹별 타임아웃 설정
  timeout: 60000, // 테스트당 60초
});
```

### 실행 명령어

```bash
# 전체 테스트 병렬 실행
pnpm --filter frontend run test:e2e apps/frontend/tests/e2e/equipment-create

# 특정 그룹만 실행
pnpm --filter frontend run test:e2e apps/frontend/tests/e2e/equipment-create/group-1-approval-workflow

# 디버그 모드 (순차 실행)
pnpm --filter frontend run test:e2e apps/frontend/tests/e2e/equipment-create --workers=1 --debug
```

---

## 핵심 병렬 실행 원칙

### ✅ 병렬 가능한 조건

1. **고유 데이터 사용**: 각 테스트가 고유한 관리번호 사용
2. **역할 독립성**: 서로 다른 역할(testOperator, techManager, siteAdmin) 사용
3. **기능 독립성**: 파일 업로드, 폼 검증, 에러 처리 등 독립적 기능
4. **API 모킹**: 실제 DB에 영향 없는 에러 시뮬레이션
5. **UI 전용 테스트**: 등록 없이 UI 동작만 검증

### ❌ 순차 실행 필요 조건

1. **데이터 의존성**: 같은 장비 데이터를 생성/수정/조회
2. **상태 공유**: 승인 상태, 이력 데이터 등 공유
3. **DB 충돌**: 같은 관리번호 사용
4. **트랜잭션 순서**: 생성 → 조회 → 수정 → 삭제 순서

### 🔑 고유 데이터 생성 패턴

```typescript
// ✅ GOOD: 각 테스트가 고유 관리번호 사용
test('시험실무자는 승인 요청 생성', async ({ testOperatorPage }) => {
  const uniqueNumber = `SUW-E 1001-${Date.now()}`; // 타임스탬프 추가
  await page.fill('[name="managementNumber"]', uniqueNumber);
});

// ✅ GOOD: 테스트 파일별 고유 번호 범위
// approval-workflow-test-operator.spec.ts → SUW-E 1001~1099
// approval-workflow-tech-manager.spec.ts → SUW-E 1100~1199

// ❌ BAD: 같은 관리번호 재사용
test('테스트 1', async ({ page }) => {
  await page.fill('[name="managementNumber"]', 'SUW-E 0001');
});
test('테스트 2', async ({ page }) => {
  await page.fill('[name="managementNumber"]', 'SUW-E 0001'); // 충돌!
});
```

---

## 병렬 실행 모니터링

### CI/CD 파이프라인

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [pull_request]

jobs:
  e2e-equipment-create:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4] # 4개 shard로 분산 실행
    steps:
      - name: Run E2E Tests
        run: pnpm test:e2e --shard=${{ matrix.shard }}/4
```

### 테스트 결과 리포트

```bash
# HTML 리포트 생성
pnpm playwright show-report

# 병렬 실행 통계
Test Files  33 passed (33)
     Tests  33 passed (33)
  Duration  4m 32s (순차: 16m 12s)
  Parallelized  9 groups
```
