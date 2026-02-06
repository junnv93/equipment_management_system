# Quick Start Guide - Status Badge Update Tests

## 🚀 빠른 시작 (1분 안에 실행)

### 첫 실행 (읽기 전용 테스트만)

```bash
# 병렬 그룹만 실행 (Hydration + 목록 동기화)
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

**예상 시간**: 2분
**테스트 수**: 4개
**DB 변경**: 없음 (안전)

---

## 📋 실행 전 체크리스트

### 1. 서비스 실행 확인

```bash
# 백엔드 실행 확인
curl http://localhost:3001/api/health

# 프론트엔드 실행 확인
curl http://localhost:3000

# 모두 실행 (필요시)
pnpm dev
```

### 2. Seed 데이터 확인

```bash
# Seed 실행
pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
```

**필요한 장비**:

- `eeee1001-0001-4001-8001-000000000001` (available)
- `eeee1002-0002-4002-8002-000000000002` (available)
- `eeee1004-0004-4004-8004-000000000004` (non_conforming)

---

## 🎯 실행 명령어 모음

### 개발 중 (빠른 피드백)

```bash
# 읽기 전용 테스트만 (2분)
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

### 커밋 전 (전체 검증)

```bash
# 순차 그룹 (12분)
pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1
pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1

# 병렬 그룹 (2분)
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

### 한 번에 실행 (전체)

```bash
# 순차 실행
pnpm test:e2e tests/e2e/status-badge-update/group-{a,b,c,f} --workers=1

# 그 다음 병렬 실행
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```

---

## 🔍 디버깅 명령어

### UI 모드 (시각적 디버깅)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-a --ui
```

### 헤드풀 모드 (브라우저 보기)

```bash
pnpm test:e2e tests/e2e/status-badge-update/group-a --headed
```

### 단일 테스트만 실행

```bash
# A-1만 실행
pnpm test:e2e tests/e2e/status-badge-update/group-a/incident-to-nc-badge-update.spec.ts

# E-1만 실행
pnpm test:e2e tests/e2e/status-badge-update/group-e/hydration-verification.spec.ts
```

---

## ⚡ 그룹별 실행 가이드

| 그룹 | 명령어                                  | 시간  | 설명                  |
| ---- | --------------------------------------- | ----- | --------------------- |
| A    | `pnpm test:e2e .../group-a --workers=1` | 3-4분 | 사고→NC 워크플로우    |
| B    | `pnpm test:e2e .../group-b --workers=1` | 2-3분 | 직접 NC 등록          |
| C    | `pnpm test:e2e .../group-c --workers=1` | 3-4분 | NC 종료               |
| D    | `pnpm test:e2e .../group-d --workers=3` | 2분   | 목록 동기화 (병렬)    |
| E    | `pnpm test:e2e .../group-e --workers=2` | 2분   | Hydration 검증 (병렬) |
| F    | `pnpm test:e2e .../group-f --workers=1` | 4-5분 | 전체 워크플로우       |

---

## 📊 예상 결과

### 성공 시

```
✅ A-1: 사고→NC 등록 시 배지 즉시 변경
✅ A-2: 페이지 reload 후 상태 유지
✅ B-1: 직접 NC 등록 시 배지 업데이트
✅ B-2: 모든 탭에서 배지 일관성
✅ C-1: NC 종료 시 "사용 가능" 복원
✅ D-1: 목록-상세 페이지 동기화
✅ D-2: staleTime: 0 자동 갱신
✅ E-1: 상세 페이지 Hydration 검증
✅ E-2: NC 워크플로우 중 콘솔 에러 없음
✅ F-1: 상세→목록→대시보드 일관성

10 passed (12-20m)
```

---

## 🚨 실패 시 체크리스트

### 1. "배지를 찾을 수 없음"

```bash
# 타임아웃 증가 필요
# constants/test-data.ts의 CACHE_INVALIDATION을 5000으로 증가
```

### 2. Hydration 에러

```bash
# refetchOnMount 확인
grep -n "refetchOnMount" apps/frontend/components/equipment/EquipmentDetailClient.tsx
# 기대값: refetchOnMount: false, (Line 69)
```

### 3. Seed 데이터 없음

```bash
# 시드 재실행
pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
```

### 4. 백엔드/프론트엔드 미실행

```bash
# 모든 서비스 시작
pnpm dev
```

---

## 📖 자세한 문서

- **사용 가이드**: `README.md`
- **실행 전략**: `TEST_GROUPS.md`
- **구현 요약**: `/STATUS_BADGE_E2E_TEST_IMPLEMENTATION_SUMMARY.md`

---

## 💡 팁

1. **빠른 확인**: 병렬 그룹만 실행 (2분)
2. **전체 검증**: 순차 → 병렬 순서로 실행 (12-20분)
3. **디버깅**: `--ui` 또는 `--headed` 모드 사용
4. **CI/CD**: 순차/병렬 그룹 분리 실행

---

**시작 명령어 (복사하여 실행)**:

```bash
# 빠른 확인
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3

# 전체 실행
pnpm test:e2e tests/e2e/status-badge-update/group-{a,b,c,f} --workers=1 && \
pnpm test:e2e tests/e2e/status-badge-update/group-{d,e} --workers=3
```
