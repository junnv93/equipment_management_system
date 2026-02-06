# 테스트 그룹 실행 가이드

## 🎯 그룹 분류 전략

### 병렬 실행 가능 (Read-Only)

이 그룹들은 데이터베이스 상태를 변경하지 않으므로 병렬 실행이 안전합니다.

#### Group A: UI 요소 존재 확인

**목적**: UI 컴포넌트가 올바르게 표시되는지 검증
**실행 시간**: ~2분
**Workers**: 3-4

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-a --workers=4
```

**테스트 파일**:

- `repair-nc-dropdown.spec.ts` (4 tests)
- `auto-link-guidance.spec.ts` (3 tests)
- `repair-guidance-card.spec.ts` (4 tests)
- `workflow-guidance-card.spec.ts` (5 tests)

#### Group B: 권한 기반 UI

**목적**: 역할별 UI 요소 가시성 검증
**실행 시간**: ~1분
**Workers**: 2-3

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-b --workers=3
```

**테스트 파일**:

- `nc-management-permissions.spec.ts` (6 tests)

#### Group C: 반응형 & 접근성

**목적**: 모바일/태블릿 레이아웃 및 ARIA 검증
**실행 시간**: ~2분
**Workers**: 2-3

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-c --workers=3
```

**테스트 파일**:

- `responsive-layout.spec.ts` (4 tests)
- `accessibility.spec.ts` (6 tests)

### 순차 실행 필수 (State Changes)

이 그룹들은 데이터베이스 상태를 변경하므로 반드시 순차 실행해야 합니다.

#### Group D: 전체 워크플로우 통합

**목적**: 사고 → NC → 수리 → 종료 → 복원 전체 플로우 검증
**실행 시간**: ~3-4분
**Workers**: 1 (필수)

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1
```

**테스트 순서** (test.describe.serial):

1. D-1: 사고 발생 및 부적합 생성
2. D-2: 부적합 확인 및 수리 안내
3. D-3: 수리 이력 등록 및 부적합 연결
4. D-4: 부적합 자동 상태 변경 검증
5. D-5: 부적합 종료 승인 (기술책임자)
6. D-6: 장비 상태 복원 검증

**중요**: 각 테스트는 이전 테스트의 결과에 의존합니다. 순서를 변경하거나 병렬 실행하면 안 됩니다.

#### Group E: 검증 로직

**목적**: 비즈니스 규칙 및 검증 로직 테스트
**실행 시간**: ~3-4분
**Workers**: 1 (필수)

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1
```

**테스트 순서** (test.describe.serial):

1. E-1: 수리 없이 부적합 종료 시도 → 다이얼로그
2. E-2: 다이얼로그 확인 클릭 → 수리 페이지 이동
3. E-3: 이미 연결된 부적합 재연결 방지
4. E-4: 종료된 NC에 수리 연결 방지
5. E-5: damage/malfunction 유형만 수리 필수 검증
6. E-6: 부적합 생성 시 장비 상태 자동 변경

## 📋 권장 실행 전략

### 1. 개발 중 (빠른 피드백)

UI 변경 시 빠르게 확인:

```bash
# 병렬 그룹만 실행 (빠름)
pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} --workers=4
```

### 2. 커밋 전 (로컬 검증)

전체 테스트 실행:

```bash
# 병렬 → 순차 순서로 실행
pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} --workers=4 && \
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1 && \
pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1
```

### 3. CI 환경

```yaml
# GitHub Actions 예시
- name: Run parallel E2E tests
  run: pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} --workers=4

- name: Run sequential E2E tests
  run: |
    pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1
    pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1
```

### 4. 디버깅

특정 테스트만 UI 모드로 실행:

```bash
# 전체 워크플로우 디버깅
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --ui --workers=1

# 특정 파일만
pnpm test:e2e tests/e2e/nc-repair-workflow/group-a/repair-nc-dropdown.spec.ts --ui
```

## ⚠️ 주의사항

### Group D, E 순차 실행 필수

❌ **절대 금지**:

```bash
# 병렬 실행하면 테스트 실패!
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=4
pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=4
```

✅ **올바른 실행**:

```bash
# workers=1로 순차 실행
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1
pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1
```

### Seed Data 재설정

순차 테스트 실행 전 seed data 재설정:

```bash
pnpm --filter backend run db:seed-test-new
pnpm test:e2e tests/e2e/nc-repair-workflow/group-{d,e} --workers=1
```

### 테스트 격리

각 그룹은 독립적으로 실행 가능하지만, Group D와 E는 서로 영향을 줄 수 있습니다.
완전한 격리를 위해 각 그룹 실행 전 seed data 재설정을 권장합니다.

## 📊 예상 실행 시간

| 그룹          | 테스트 수 | Workers | 예상 시간 |
| ------------- | --------- | ------- | --------- |
| Group A       | 16        | 4       | 2분       |
| Group B       | 6         | 3       | 1분       |
| Group C       | 10        | 3       | 2분       |
| **병렬 총계** | **32**    | **4**   | **~3분**  |
| Group D       | 6         | 1       | 4분       |
| Group E       | 6         | 1       | 4분       |
| **순차 총계** | **12**    | **1**   | **~8분**  |
| **전체**      | **44**    | -       | **~11분** |

## 🔄 CI/CD 파이프라인 예시

```yaml
name: NC-Repair Workflow E2E Tests

on: [push, pull_request]

jobs:
  e2e-parallel:
    name: E2E Tests (Parallel)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Start services
        run: |
          docker compose up -d
          pnpm --filter backend run db:migrate
          pnpm --filter backend run db:seed-test-new

      - name: Run parallel tests
        run: |
          pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} \
            --workers=4 \
            --reporter=html

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-parallel
          path: playwright-report/

  e2e-sequential:
    name: E2E Tests (Sequential)
    needs: e2e-parallel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... (동일한 setup)

      - name: Reset seed data
        run: pnpm --filter backend run db:seed-test-new

      - name: Run Group D
        run: pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1

      - name: Reset seed data
        run: pnpm --filter backend run db:seed-test-new

      - name: Run Group E
        run: pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-sequential
          path: playwright-report/
```

## 🎓 Best Practices

1. **로컬 개발**: 병렬 그룹만 자주 실행하여 빠른 피드백
2. **커밋 전**: 전체 테스트 실행하여 회귀 방지
3. **CI**: 병렬 → 순차 순서로 실행하여 빠른 실패 감지
4. **디버깅**: UI 모드 + 특정 파일만 실행
5. **Seed 재설정**: 순차 테스트 전 항상 재설정
