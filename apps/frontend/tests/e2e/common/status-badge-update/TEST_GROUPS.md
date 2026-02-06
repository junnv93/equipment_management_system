# 테스트 그룹 실행 전략

## 개요

이 문서는 `status-badge-update` 테스트 스위트의 그룹별 병렬/순차 실행 전략을 설명합니다.

---

## 실행 전략 요약

### 순차 실행 (Serial) 그룹

- **Group A**: 사고→NC 워크플로우
- **Group B**: 직접 NC 등록
- **Group C**: NC 종료
- **Group F**: 전체 워크플로우

**이유**: DB 상태 변경 (장비 상태, NC 생성/종료)

### 병렬 실행 (Parallel) 그룹

- **Group D**: 목록 페이지 동기화
- **Group E**: Hydration 검증

**이유**: 읽기 전용 작업, DB 변경 없음

---

## 그룹별 상세 설명

### Group A: 사고→NC 워크플로우 (순차)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1
```

**Workers**: 1 (순차 실행)
**예상 시간**: 3-4분
**의존성**: 없음 (독립 실행 가능)

**테스트**:

1. **A-1**: 사고→NC 등록 시 배지 즉시 변경

   - 장비 상태 `available` → `non_conforming`으로 변경
   - DB Write 작업 포함

2. **A-2**: 페이지 reload 후 상태 유지
   - A-1의 결과 상태 확인
   - **의존성**: A-1 완료 후 실행 필요

**순차 실행 이유**:

- A-2가 A-1의 DB 변경 결과에 의존
- `test.describe.configure({ mode: 'serial' })` 사용

---

### Group B: 직접 NC 등록 (순차)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1
```

**Workers**: 1
**예상 시간**: 2-3분
**의존성**: 없음

**테스트**:

1. **B-1**: 직접 NC 등록 시 배지 업데이트

   - 장비 상태 변경 (NC 생성)

2. **B-2**: 모든 탭에서 배지 일관성
   - B-1의 결과 상태 확인
   - **의존성**: B-1 완료 후 실행 필요

**순차 실행 이유**:

- B-2가 B-1의 DB 변경 결과에 의존

---

### Group C: NC 종료 (순차)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1
```

**Workers**: 1
**예상 시간**: 3-4분
**의존성**: 없음 (Seed 데이터에 미리 NC 상태 장비 준비)

**테스트**:

1. **C-1**: NC 종료 시 "사용 가능" 복원
   - 장비 상태 `non_conforming` → `available`으로 변경
   - DB Write 작업 포함

**순차 실행 이유**:

- DB 상태 변경 작업

---

### Group D: 목록 페이지 동기화 (병렬)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-d --workers=3
```

**Workers**: 3 (병렬 실행)
**예상 시간**: 2분
**의존성**: 없음 (읽기 전용)

**테스트**:

1. **D-1**: 목록-상세 페이지 동기화

   - 상태 확인만 수행 (Write 없음)

2. **D-2**: staleTime: 0 자동 갱신
   - 목록 페이지 갱신 동작 확인

**병렬 실행 가능 이유**:

- 읽기 전용 작업
- 서로 독립적
- DB 변경 없음

---

### Group E: Hydration 검증 (병렬)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-e --workers=2
```

**Workers**: 2 (병렬 실행)
**예상 시간**: 2분
**의존성**: 없음

**테스트**:

1. **E-1**: 상세 페이지 Hydration 검증

   - 콘솔 에러 모니터링
   - 읽기 전용

2. **E-2**: NC 워크플로우 중 콘솔 에러 없음
   - 콘솔 에러 모니터링
   - 읽기 전용

**병렬 실행 가능 이유**:

- 읽기 전용 작업
- 서로 독립적
- DB 변경 없음

---

### Group F: 전체 워크플로우 (순차)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1
```

**Workers**: 1
**예상 시간**: 4-5분
**의존성**: 없음

**테스트**:

1. **F-1**: 상세→목록→대시보드 일관성
   - 전체 페이지 네비게이션
   - 상태 확인 (읽기 전용)

**순차 실행 이유**:

- 단일 테스트이지만 여러 페이지 확인
- 일관성 검증을 위해 순차 실행

---

## 의존성 다이어그램

```
┌────────────┐
│  Group A   │  (순차, Workers: 1)
│  A-1 → A-2 │
└────────────┘

┌────────────┐
│  Group B   │  (순차, Workers: 1)
│  B-1 → B-2 │
└────────────┘

┌────────────┐
│  Group C   │  (순차, Workers: 1)
│    C-1     │
└────────────┘

┌────────────┐
│  Group D   │  (병렬, Workers: 3)
│  D-1 ║ D-2 │
└────────────┘

┌────────────┐
│  Group E   │  (병렬, Workers: 2)
│  E-1 ║ E-2 │
└────────────┘

┌────────────┐
│  Group F   │  (순차, Workers: 1)
│    F-1     │
└────────────┘

범례:
→  순차 실행 (의존성)
║  병렬 실행 (독립)
```

---

## 최적 실행 전략

### 개발 환경 (빠른 피드백)

```bash
# 병렬 그룹만 실행 (읽기 전용)
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

**예상 시간**: 2분
**목적**: 빠른 회귀 테스트 (Hydration, 목록 동기화)

---

### 커밋 전 (전체 검증)

```bash
# 1단계: 순차 그룹
pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1

# 2단계: 병렬 그룹 (동시 실행 가능)
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

**예상 시간**: 12-16분
**목적**: 전체 기능 검증

---

### CI/CD 파이프라인

```yaml
# .github/workflows/e2e-status-badge.yml

jobs:
  sequential-tests:
    name: Sequential Tests (A, B, C, F)
    runs-on: ubuntu-latest
    steps:
      - name: Run Group A
        run: pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1 --retries=1

      - name: Run Group B
        run: pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1 --retries=1

      - name: Run Group C
        run: pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1 --retries=1

      - name: Run Group F
        run: pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1 --retries=1

  parallel-tests:
    name: Parallel Tests (D, E)
    runs-on: ubuntu-latest
    steps:
      - name: Run Group D & E
        run: pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

---

## 실행 시간 벤치마크

| 그룹     | Workers | 테스트 수 | 예상 시간   | 실제 시간\* |
| -------- | ------- | --------- | ----------- | ----------- |
| A        | 1       | 2         | 3-4분       | TBD         |
| B        | 1       | 2         | 2-3분       | TBD         |
| C        | 1       | 1         | 3-4분       | TBD         |
| D        | 3       | 2         | 2분         | TBD         |
| E        | 2       | 2         | 2분         | TBD         |
| F        | 1       | 1         | 4-5분       | TBD         |
| **총합** | -       | **10**    | **16-20분** | **TBD**     |

\*실제 시간은 첫 실행 후 기록됩니다.

---

## 병렬 실행 최적화 팁

### 1. Seed 데이터 격리

각 그룹이 서로 다른 장비 ID를 사용하여 충돌 방지:

```typescript
// Group A: STATUS_UPDATE_TEST_EQUIPMENT_ID
// Group B: LIST_SYNC_TEST_EQUIPMENT_ID
// Group C: NC_CLOSURE_TEST_EQUIPMENT_ID
```

### 2. DB 트랜잭션 격리

- 순차 그룹: DB Write 작업 포함
- 병렬 그룹: 읽기 전용 작업만

### 3. 캐시 무효화 타임아웃

```typescript
export const TIMEOUTS = {
  CACHE_INVALIDATION: 3000, // React Query invalidate + refetch
};
```

---

## 문제 해결

### 병렬 실행 시 실패

**증상**: Group D/E가 간헐적으로 실패

**원인**: 다른 그룹의 DB 변경 영향

**해결**:

```bash
# 병렬 그룹만 독립 실행
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

### 순차 실행이 느림

**증상**: Group A-C 실행 시간이 너무 김

**해결**:

- `TIMEOUTS.CACHE_INVALIDATION`을 2000ms로 감소
- `waitForLoadState` 대신 `waitForResponse` 사용

---

## 참고 자료

- Playwright 병렬 실행: https://playwright.dev/docs/test-parallel
- React Query 캐시 전략: https://tanstack.com/query/latest/docs/react/guides/caching
- Next.js 16 패턴: `CLAUDE.md`
