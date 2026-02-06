# 🚀 Quick Start: NC-Repair Workflow E2E Tests

빠르게 테스트를 시작하는 가이드입니다.

## ✅ 사전 준비 (5분)

### 1. 서비스 시작

```bash
# 터미널 1: 백엔드 시작
cd equipment_management_system
pnpm --filter backend run dev

# 터미널 2: 프론트엔드 시작
pnpm --filter frontend run dev
```

### 2. Seed Data 설정

```bash
# 터미널 3
pnpm --filter backend run db:seed-test-new
```

### 3. 서비스 확인

```bash
# 백엔드 확인
curl http://localhost:3001/api/monitoring/health

# 프론트엔드 확인
curl http://localhost:3000
```

---

## 🧪 테스트 실행

### 옵션 1: 빠른 테스트 (병렬 그룹만, ~3분)

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} --workers=4
```

**장점**: 빠른 피드백, UI 변경 사항 빠르게 확인
**단점**: 전체 워크플로우 검증 안 됨

### 옵션 2: 전체 테스트 (권장, ~11분)

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow
```

또는:

```bash
# 병렬 그룹 먼저
pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} --workers=4

# 순차 그룹 (seed data 재설정 후)
pnpm --filter backend run db:seed-test-new
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1
pnpm --filter backend run db:seed-test-new
pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1
```

**장점**: 완전한 검증, 비즈니스 로직 전체 확인
**단점**: 실행 시간 김

### 옵션 3: UI 모드 (디버깅, 무제한)

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow --ui
```

**장점**: 시각적 디버깅, 스텝별 실행, 스크린샷
**용도**: 테스트 실패 원인 파악, 새 테스트 작성

---

## 🐛 문제 해결

### 테스트 실패 시

#### 1. "Backend not accessible" 에러

```bash
# 백엔드 재시작
pnpm --filter backend run dev

# 확인
curl http://localhost:3001/api/monitoring/health
```

#### 2. "Login failed" 에러

```bash
# Seed data 재설정
pnpm --filter backend run db:seed-test-new

# 백엔드 NODE_ENV 확인
echo $NODE_ENV  # "development" or "test"
```

#### 3. "Element not found" 에러

```bash
# 프론트엔드 재시작
pnpm --filter frontend run dev

# 캐시 클리어
rm -rf apps/frontend/.next
pnpm --filter frontend run dev
```

#### 4. "NC ID not found" 에러

```bash
# Seed data 재설정 (순차 테스트 전)
pnpm --filter backend run db:seed-test-new
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1
```

---

## 📖 테스트 그룹 설명

### Group A-C: 병렬 실행 (읽기 전용)

- **Group A** (16 tests): UI 요소 존재 확인
  - 드롭다운, 안내 메시지, 카드 표시
- **Group B** (6 tests): 권한 기반 UI
  - 역할별 버튼 가시성
- **Group C** (10 tests): 반응형/접근성
  - 모바일 레이아웃, ARIA 레이블

**특징**: 데이터 변경 없음, 병렬 실행 안전

### Group D-E: 순차 실행 (상태 변경)

- **Group D** (6 tests): 전체 워크플로우
  - 사고 → NC → 수리 → 종료 → 복원
- **Group E** (6 tests): 검증 로직
  - 비즈니스 규칙, 제약 조건

**특징**: 데이터 변경, `--workers=1` 필수

---

## 💡 팁

### 개발 중 워크플로우

1. **UI 변경 후**: Group A만 실행

   ```bash
   pnpm test:e2e tests/e2e/nc-repair-workflow/group-a --workers=4
   ```

2. **권한 변경 후**: Group B만 실행

   ```bash
   pnpm test:e2e tests/e2e/nc-repair-workflow/group-b --workers=3
   ```

3. **비즈니스 로직 변경 후**: Group D, E 실행
   ```bash
   pnpm --filter backend run db:seed-test-new
   pnpm test:e2e tests/e2e/nc-repair-workflow/group-{d,e} --workers=1
   ```

### 커밋 전 체크리스트

- [ ] 백엔드 서비스 실행 중
- [ ] 프론트엔드 서비스 실행 중
- [ ] Seed data 최신 상태
- [ ] 전체 테스트 실행 (44/44 통과)
- [ ] 테스트 리포트 확인

---

## 📊 성공 기준

모든 테스트 통과 시 다음과 같이 표시됩니다:

```
✓ tests/e2e/nc-repair-workflow/group-a/repair-nc-dropdown.spec.ts (4 tests)
✓ tests/e2e/nc-repair-workflow/group-a/auto-link-guidance.spec.ts (3 tests)
✓ tests/e2e/nc-repair-workflow/group-a/repair-guidance-card.spec.ts (4 tests)
✓ tests/e2e/nc-repair-workflow/group-a/workflow-guidance-card.spec.ts (5 tests)
✓ tests/e2e/nc-repair-workflow/group-b/nc-management-permissions.spec.ts (6 tests)
✓ tests/e2e/nc-repair-workflow/group-c/responsive-layout.spec.ts (4 tests)
✓ tests/e2e/nc-repair-workflow/group-c/accessibility.spec.ts (6 tests)
✓ tests/e2e/nc-repair-workflow/group-d/full-workflow.spec.ts (6 tests)
✓ tests/e2e/nc-repair-workflow/group-e/validation-logic.spec.ts (6 tests)

44 passed (11m 23s)
```

---

## 🔗 추가 문서

- [README.md](./README.md): 전체 개요 및 상세 가이드
- [TEST_GROUPS.md](./TEST_GROUPS.md): 그룹별 실행 전략
- [구현 보고서](/NC_REPAIR_WORKFLOW_E2E_TEST_IMPLEMENTATION.md): 전체 구현 내역

---

**Happy Testing! 🎉**
