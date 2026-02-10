# 상태 배지 E2E 테스트 검증 가이드

## ✅ 구현 완료 항목

### 파일 구조

- ✅ `apps/frontend/tests/e2e/status-badge-update/` 디렉토리 생성
- ✅ 15개 TypeScript 파일 (11 spec + 3 helper + 1 constants)
- ✅ 3개 문서 파일 (README, TEST_GROUPS, QUICKSTART)
- ✅ 6개 테스트 그룹 (A-F)
- ✅ 928 LOC

### 테스트 케이스

- ✅ Group A: 2개 테스트 (사고→NC 워크플로우)
- ✅ Group B: 2개 테스트 (직접 NC 등록)
- ✅ Group C: 1개 테스트 (NC 종료)
- ✅ Group D: 2개 테스트 (목록 동기화)
- ✅ Group E: 2개 테스트 (Hydration 검증)
- ✅ Group F: 1개 테스트 (전체 워크플로우)
- ✅ **총 10개 테스트 케이스**

### 헬퍼 함수

- ✅ `status-verification.ts` (5개 함수)
- ✅ `nc-workflow.ts` (4개 함수)
- ✅ `navigation.ts` (5개 함수)

### SSOT 패턴

- ✅ `constants/test-data.ts`
  - ✅ 장비 ID (UUID constants)
  - ✅ 관리번호 매핑
  - ✅ 상태 배지 라벨 (한국어)
  - ✅ 타임아웃 값
  - ✅ 부적합 상태 라벨
  - ✅ 사고 유형

---

## 🧪 실행 전 검증

### 1. 파일 존재 확인

```bash
# 디렉토리 확인
ls -la apps/frontend/tests/e2e/status-badge-update/

# 예상 출력:
# drwxr-xr-x constants
# drwxr-xr-x group-a
# drwxr-xr-x group-b
# drwxr-xr-x group-c
# drwxr-xr-x group-d
# drwxr-xr-x group-e
# drwxr-xr-x group-f
# drwxr-xr-x helpers
# -rw-r--r-- README.md
# -rw-r--r-- TEST_GROUPS.md
# -rw-r--r-- QUICKSTART.md
```

### 2. TypeScript 컴파일 확인

```bash
cd apps/frontend
pnpm tsc --noEmit
```

**예상 결과**: 에러 없음

### 3. Import 확인

```bash
# SSOT import 확인
grep -r "@equipment-management/schemas" apps/frontend/tests/e2e/status-badge-update/

# 예상 출력: constants/test-data.ts에서 import 확인
```

---

## 🚀 첫 실행 가이드

### Step 1: 서비스 시작

```bash
# 터미널 1: 백엔드
cd apps/backend
pnpm dev

# 터미널 2: 프론트엔드
cd apps/frontend
pnpm dev

# 터미널 3: 테스트 실행
```

### Step 2: Seed 데이터 준비

```bash
pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
```

**확인 사항**:

- ✅ `eeee1001-0001-4001-8001-000000000001` 장비 존재 (available)
- ✅ `eeee1002-0002-4002-8002-000000000002` 장비 존재 (available)
- ✅ `eeee1004-0004-4004-8004-000000000004` 장비 존재 (non_conforming)

### Step 3: 빠른 테스트 (병렬 그룹만)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

**예상 시간**: 2분
**예상 결과**: 4 passed

### Step 4: 전체 테스트

```bash
# 순차 그룹
pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1

# 병렬 그룹
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

**예상 시간**: 12-16분
**예상 결과**: 10 passed

---

## ✅ 성공 기준

### 테스트 결과

- ✅ 10/10 테스트 통과
- ✅ Hydration 에러 0건
- ✅ React 에러 0건
- ✅ SSOT 위반 0건

### 기능 검증

- ✅ 사고→NC 등록 시 배지 즉시 변경
- ✅ 페이지 새로고침 없이 업데이트
- ✅ 페이지 reload 후 상태 지속
- ✅ 목록-상세 페이지 동기화
- ✅ 모든 탭에서 배지 일관성
- ✅ NC 종료 시 상태 복원
- ✅ 대시보드 통계 반영

### 성능

- ✅ 병렬 그룹: 2분 이내
- ✅ 전체 실행: 20분 이내

---

## 🐛 트러블슈팅 체크리스트

### 문제 1: TypeScript 컴파일 에러

**확인**:

```bash
pnpm --filter frontend run tsc --noEmit
```

**해결**:

- Import 경로 확인
- `@equipment-management/schemas` 패키지 설치 확인

### 문제 2: "장비를 찾을 수 없음"

**확인**:

```bash
# 백엔드 로그 확인
curl http://localhost:3001/api/equipment/eeee1001-0001-4001-8001-000000000001
```

**해결**:

- Seed 재실행
- 장비 ID가 uuid-constants.ts와 일치하는지 확인

### 문제 3: "배지를 찾을 수 없음"

**확인**:

```typescript
// constants/test-data.ts
STATUS_BADGE_LABELS.non_conforming === '부적합'; // true여야 함
```

**해결**:

- 라벨이 프론트엔드 UI와 일치하는지 확인
- Timeout 증가 (CACHE_INVALIDATION: 5000)

### 문제 4: Hydration 에러

**확인**:

```bash
grep "refetchOnMount" apps/frontend/components/equipment/EquipmentDetailClient.tsx
```

**기대값**: `refetchOnMount: false,`

### 문제 5: 목록 페이지 업데이트 안 됨

**확인**:

```bash
grep "staleTime" apps/frontend/components/equipment/EquipmentListContent.tsx
```

**기대값**: `staleTime: 0,`

---

## 📊 검증 완료 리포트 템플릿

```markdown
## Status Badge E2E 테스트 검증 완료

### 실행 환경

- Node.js: v20.x
- pnpm: v8.x
- Playwright: v1.x
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### 실행 결과

- Group A: ✅ 2/2 passed (3m 45s)
- Group B: ✅ 2/2 passed (2m 30s)
- Group C: ✅ 1/1 passed (3m 10s)
- Group D: ✅ 2/2 passed (1m 50s)
- Group E: ✅ 2/2 passed (1m 40s)
- Group F: ✅ 1/1 passed (4m 20s)
- **총합: ✅ 10/10 passed (17m 15s)**

### 검증 항목

- ✅ Hydration 에러 0건
- ✅ React 콘솔 에러 0건
- ✅ SSOT 패턴 준수
- ✅ 모든 페이지 배지 일관성
- ✅ Cache invalidation 동작 확인

### 실행자

- 이름: [Your Name]
- 날짜: 2026-02-04
```

---

## 📖 참고 문서

1. **빠른 시작**: `apps/frontend/tests/e2e/status-badge-update/QUICKSTART.md`
2. **상세 가이드**: `apps/frontend/tests/e2e/status-badge-update/README.md`
3. **실행 전략**: `apps/frontend/tests/e2e/status-badge-update/TEST_GROUPS.md`
4. **구현 요약**: `STATUS_BADGE_E2E_TEST_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 다음 단계

### 1. 첫 실행 및 검증

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

### 2. 리포트 작성

- 위 템플릿 사용하여 결과 기록

### 3. CI/CD 통합 (선택)

- `.github/workflows/e2e-status-badge.yml` 생성

### 4. 문서화

- 실패 케이스 및 해결 방법 추가

---

**검증 준비 완료!** 🚀

위 가이드를 따라 테스트를 실행하고 결과를 확인하세요.
