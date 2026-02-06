# 장비 상태 배지 실시간 업데이트 E2E 테스트

## 개요

이 테스트 스위트는 부적합 등록/종료 시 장비 상태 배지가 상세/목록 페이지에서 즉시 업데이트되는 기능을 검증합니다.

**검증 범위:**

- ✅ 사고이력 → 부적합 등록 → 상태 배지 즉시 업데이트
- ✅ 직접 부적합 등록 → 상태 배지 업데이트
- ✅ 부적합 종료 → 상태 복원
- ✅ Hydration 에러 없음 확인
- ✅ 목록-상세 페이지 동기화
- ✅ 전체 워크플로우 일관성

**구현된 기능 (검증 대상):**

- `EquipmentDetailClient.tsx` - `refetchOnMount: false` (Hydration 방지)
- `EquipmentListContent.tsx` - `staleTime: 0` (자동 갱신)
- `non-conformance/page.tsx` - `invalidateQueries() + refetchQueries()` 패턴
- `IncidentHistoryTab.tsx` - 사고 이력 생성 후 즉시 캐시 무효화

---

## 디렉토리 구조

```
status-badge-update/
├── README.md                           # 이 파일
├── TEST_GROUPS.md                      # 실행 전략
├── constants/
│   └── test-data.ts                    # SSOT 테스트 상수
├── helpers/
│   ├── status-verification.ts          # 배지 검증 헬퍼
│   ├── nc-workflow.ts                  # NC 생성/종료 헬퍼
│   └── navigation.ts                   # 페이지 네비게이션 헬퍼
├── group-a/                            # 사고→NC 워크플로우 (순차)
│   ├── incident-to-nc-badge-update.spec.ts
│   └── seed.spec.ts
├── group-b/                            # 직접 NC 등록 (순차)
│   ├── direct-nc-registration.spec.ts
│   └── seed.spec.ts
├── group-c/                            # NC 종료 (순차)
│   ├── nc-closure-status-restore.spec.ts
│   └── seed.spec.ts
├── group-d/                            # 목록 페이지 동기화 (병렬)
│   ├── list-detail-sync.spec.ts
│   └── list-refresh-on-nc.spec.ts
├── group-e/                            # Hydration 검증 (병렬)
│   ├── hydration-verification.spec.ts
│   └── console-error-check.spec.ts
└── group-f/                            # 전체 워크플로우 (순차)
    └── full-workflow-verification.spec.ts
```

---

## 빠른 시작

### 1. 전체 테스트 실행

```bash
# 순차 그룹 (Group A, B, C, F)
pnpm test:e2e tests/e2e/status-badge-update/group-{a,b,c,f} --workers=1

# 병렬 그룹 (Group D, E)
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

### 2. 그룹별 실행

```bash
# Group A: 사고→NC 워크플로우
pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1

# Group B: 직접 NC 등록
pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1

# Group C: NC 종료
pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1

# Group D: 목록 페이지 동기화 (병렬)
pnpm test:e2e tests/e2e/status-badge-update/group-d --workers=3

# Group E: Hydration 검증 (병렬)
pnpm test:e2e tests/e2e/status-badge-update/group-e --workers=2

# Group F: 전체 워크플로우
pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1
```

### 3. 개별 테스트 실행

```bash
# A-1: 사고→NC 등록 시 배지 즉시 변경
pnpm test:e2e tests/e2e/status-badge-update/group-a/incident-to-nc-badge-update.spec.ts --workers=1

# E-1: Hydration 검증
pnpm test:e2e tests/e2e/status-badge-update/group-e/hydration-verification.spec.ts
```

---

## 테스트 그룹 설명

### Group A: 사고→NC 워크플로우 (순차)

- **목적**: 사고 이력 → NC 생성 → 배지 즉시 업데이트 검증
- **Workers**: 1 (순차 실행)
- **예상 시간**: 3-4분
- **테스트**:
  - A-1: 사고→NC 등록 시 배지 즉시 변경
  - A-2: 페이지 reload 후 상태 유지

### Group B: 직접 NC 등록 (순차)

- **목적**: NC 관리 페이지에서 직접 등록 시 배지 업데이트 검증
- **Workers**: 1
- **예상 시간**: 2-3분
- **테스트**:
  - B-1: 직접 NC 등록 시 배지 업데이트
  - B-2: 모든 탭에서 배지 일관성

### Group C: NC 종료 (순차)

- **목적**: NC 종료 시 상태 "사용 가능"으로 복원 검증
- **Workers**: 1
- **예상 시간**: 3-4분
- **테스트**:
  - C-1: NC 종료 시 "사용 가능" 복원

### Group D: 목록 페이지 동기화 (병렬)

- **목적**: 상세 페이지 변경이 목록 페이지에 반영되는지 검증
- **Workers**: 3
- **예상 시간**: 2분
- **테스트**:
  - D-1: 목록-상세 페이지 동기화
  - D-2: staleTime: 0 자동 갱신

### Group E: Hydration 검증 (병렬)

- **목적**: Hydration 에러 없이 배지 표시 검증
- **Workers**: 2
- **예상 시간**: 2분
- **테스트**:
  - E-1: 상세 페이지 Hydration 검증
  - E-2: NC 워크플로우 중 콘솔 에러 없음

### Group F: 전체 워크플로우 (순차)

- **목적**: 모든 페이지에서 상태 일관성 검증
- **Workers**: 1
- **예상 시간**: 4-5분
- **테스트**:
  - F-1: 상세→목록→대시보드 일관성

**총 예상 시간**: 16-20분 (병렬 실행 최적화 시 12분)

---

## SSOT 패턴

이 테스트는 **Single Source of Truth** 원칙을 엄격히 준수합니다.

### ✅ CORRECT: Shared Packages에서 Import

```typescript
import { EquipmentStatus } from '@equipment-management/schemas';
import { STATUS_BADGE_LABELS } from '../constants/test-data';

await verifyDetailPageStatusBadge(page, 'non_conforming');
```

### ❌ WRONG: 하드코딩

```typescript
// ❌ 금지
await page.getByText('부적합').first(); // 하드코딩된 라벨
const status = 'non_conforming'; // 직접 문자열 사용
```

### SSOT 위치

| 데이터 타입 | SSOT 위치                       | 사용 예시                            |
| ----------- | ------------------------------- | ------------------------------------ |
| 장비 상태   | `@equipment-management/schemas` | `EquipmentStatus.non_conforming`     |
| 배지 라벨   | `constants/test-data.ts`        | `STATUS_BADGE_LABELS.non_conforming` |
| 장비 ID     | `constants/test-data.ts`        | `STATUS_UPDATE_TEST_EQUIPMENT_ID`    |
| 타임아웃    | `constants/test-data.ts`        | `TIMEOUTS.CACHE_INVALIDATION`        |

---

## 트러블슈팅

### 1. 테스트 실패: "배지를 찾을 수 없음"

**원인**: 캐시 무효화 타임아웃 부족

**해결**:

```typescript
// constants/test-data.ts
export const TIMEOUTS = {
  CACHE_INVALIDATION: 5000, // 3000 → 5000으로 증가
};
```

### 2. Hydration 에러 발생

**원인**: `refetchOnMount: true`로 잘못 설정

**확인**:

```typescript
// components/equipment/EquipmentDetailClient.tsx:69
const { data: equipment, isLoading } = useQuery({
  queryKey: ['equipment', id],
  queryFn: () => equipmentApi.getById(id),
  refetchOnMount: false, // ✅ 반드시 false
});
```

### 3. 목록 페이지가 업데이트되지 않음

**원인**: `staleTime`이 너무 길게 설정

**확인**:

```typescript
// components/equipment/EquipmentListContent.tsx:163
const { data, isLoading } = useQuery({
  queryKey: ['equipment', 'list', debouncedFilters],
  queryFn: () => equipmentApi.getAll(debouncedFilters),
  staleTime: 0, // ✅ 반드시 0
});
```

### 4. Seed 데이터 없음

**원인**: Global setup 실행 안 됨

**해결**:

```bash
# 수동 시드 실행
pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts

# 또는 global setup 재실행
pnpm test:e2e --global-setup apps/frontend/tests/e2e/global-setup.ts
```

---

## 성공 기준

- ✅ 모든 10개 테스트 통과 (100%)
- ✅ Hydration 에러 0건
- ✅ SSOT 위반 0건 (하드코딩 없음)
- ✅ 페이지 새로고침 없이 배지 업데이트
- ✅ 페이지 reload 후 상태 지속
- ✅ 목록-상세 페이지 동기화
- ✅ 대시보드 통계 반영
- ✅ 20분 이내 완료

---

## CI/CD 통합

### GitHub Actions 예시

```yaml
- name: Status Badge Tests - Sequential
  run: |
    pnpm test:e2e tests/e2e/status-badge-update/group-{a,b,c,f} --workers=1 --retries=1

- name: Status Badge Tests - Parallel
  run: |
    pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

---

## 참고 자료

### 구현 파일

- `apps/frontend/components/equipment/EquipmentDetailClient.tsx:69` - `refetchOnMount: false`
- `apps/frontend/components/equipment/EquipmentListContent.tsx:163` - `staleTime: 0`
- `apps/frontend/app/(dashboard)/equipment/[id]/non-conformance/page.tsx` - Cache invalidation
- `apps/frontend/components/equipment/IncidentHistoryTab.tsx:136-141` - `refetchQueries()`

### 기존 테스트 패턴

- `apps/frontend/tests/e2e/nc-repair-workflow/` - SSOT 패턴 참고
- `apps/frontend/tests/e2e/fixtures/auth.fixture.ts` - 인증 픽스처
- `apps/frontend/tests/e2e/global-setup.ts` - Seed 자동 로딩

---

## 라이센스

이 테스트는 Equipment Management System의 일부입니다.
