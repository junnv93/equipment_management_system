# E2E 테스트: 부적합-수리 워크플로우

## 📋 개요

부적합(Non-Conformance)-수리 이력(Repair History) 워크플로우의 전체 비즈니스 로직을 검증하는 포괄적인 E2E 테스트 모음입니다.

### 테스트 목표

- ✅ SSOT 원칙 100% 준수 (enums, labels, constants)
- ✅ Playwright Best Practices (UI 상태 검증, network 가로채기 금지)
- ✅ 실제 비즈니스 로직 검증 (단순 UI 존재 확인 아님)
- ✅ 백엔드-프론트엔드 통합 검증
- ✅ 병렬 실행 가능한 테스트 그룹화

## 🎯 테스트 범위

### 구현된 기능 (2026-02-03)

1. **수리 이력 등록 폼** (`RepairHistoryClient.tsx`)

   - 열린 부적합 드롭다운 선택
   - 부적합 연결 시 실시간 안내 메시지
   - 수리 완료 시 부적합 자동 상태 변경

2. **부적합 관리 페이지** (`non-conformance/page.tsx`)

   - 수리 기록 필요 안내 카드
   - 수리 없이 종료 시도 시 검증 다이얼로그
   - 수리 연결 상태 실시간 표시

3. **사고 이력 탭** (`IncidentHistoryTab.tsx`)
   - 부적합 생성 체크박스 설명 개선
   - 워크플로우 안내 카드

### 백엔드 비즈니스 로직

- **NC 생성**: 장비 상태 → `non_conforming` 자동 변경
- **수리 연결**: `nonConformanceId` 연결 → 1:1 관계 설정
- **자동 상태 전환**: 수리 완료 → NC `corrected` 자동 변경
- **종료 검증**: damage/malfunction 유형은 수리 필수
- **장비 복원**: 모든 NC 종료 시 → 장비 `available` 복원

## 📊 테스트 그룹 구조

### 병렬 실행 가능 그룹 (Read-Only)

**Group A - UI 요소 존재 확인**

- A-1: 수리 이력 폼 - 부적합 드롭다운 표시 (4 tests)
- A-2: 부적합 선택 시 자동 연동 안내 표시 (3 tests)
- A-3: 부적합 관리 - 수리 안내 카드 표시 (4 tests)
- A-4: 사고 이력 - 워크플로우 안내 카드 (5 tests)

**Group B - 권한 기반 UI 표시**

- B-1: 역할별 부적합 관리 권한 (6 tests)

**Group C - 반응형 & 접근성**

- C-1: 모바일/태블릿 레이아웃 (4 tests)
- C-2: ARIA 레이블 및 키보드 내비게이션 (6 tests)

### 순차 실행 필수 그룹 (State Changes)

**Group D - 전체 워크플로우 통합 테스트** (6 sequential tests)

1. 사고 발생 + 부적합 생성
2. 부적합 확인 및 수리 안내
3. 수리 이력 등록 + 부적합 연결
4. 자동 상태 전환 검증
5. 부적합 종료 승인
6. 장비 상태 복원 검증

**Group E - 검증 로직 테스트** (6 sequential tests)

1. 수리 없이 종료 시도 → 다이얼로그
2. 다이얼로그 확인 → 수리 페이지 이동
3. 이미 연결된 부적합 재연결 방지
4. 종료된 NC에 수리 연결 방지
5. damage/malfunction만 수리 필수 검증
6. NC 생성 시 장비 상태 자동 변경

## 🚀 실행 방법

### 전체 테스트 실행

```bash
# 병렬 그룹 먼저, 순차 그룹 나중에
pnpm test:e2e tests/e2e/nc-repair-workflow
```

### 그룹별 실행

```bash
# 병렬 그룹만 (빠른 피드백)
pnpm test:e2e tests/e2e/nc-repair-workflow/group-{a,b,c} --workers=3

# 순차 그룹만 (전체 워크플로우)
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d --workers=1
pnpm test:e2e tests/e2e/nc-repair-workflow/group-e --workers=1

# 특정 파일 실행
pnpm test:e2e tests/e2e/nc-repair-workflow/group-a/repair-nc-dropdown.spec.ts
```

### UI 모드 (디버깅)

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow --ui
```

## 📁 파일 구조

```
nc-repair-workflow/
├── README.md                           # 이 파일
├── TEST_GROUPS.md                      # 그룹별 실행 순서 가이드
├── constants/
│   └── test-data.ts                    # 테스트 데이터 상수 (SSOT)
├── helpers/
│   ├── dialog-helper.ts                # 다이얼로그 열기 헬퍼
│   ├── nc-helper.ts                    # NC 관련 API 헬퍼
│   └── repair-helper.ts                # 수리 이력 헬퍼
├── group-a/                            # UI 요소 (병렬)
│   ├── repair-nc-dropdown.spec.ts
│   ├── auto-link-guidance.spec.ts
│   ├── repair-guidance-card.spec.ts
│   └── workflow-guidance-card.spec.ts
├── group-b/                            # 권한 (병렬)
│   └── nc-management-permissions.spec.ts
├── group-c/                            # 반응형/접근성 (병렬)
│   ├── responsive-layout.spec.ts
│   └── accessibility.spec.ts
├── group-d/                            # 전체 워크플로우 (순차)
│   └── full-workflow.spec.ts
└── group-e/                            # 검증 로직 (순차)
    └── validation-logic.spec.ts
```

## 🔧 SSOT 준수 체크리스트

### ✅ 반드시 Import해야 하는 항목

```typescript
// Enums & Labels
import {
  EquipmentStatus,
  NonConformanceStatus,
  NonConformanceType,
  RepairResult,
  NON_CONFORMANCE_TYPE_LABELS,
  NON_CONFORMANCE_STATUS_LABELS,
} from '@equipment-management/schemas';

// Permissions
import { Permission } from '@equipment-management/shared-constants';

// Test Constants
import { TEST_EQUIPMENT_ID, NC_WITHOUT_REPAIR_ID, NC_WITH_REPAIR_ID } from '../constants/test-data';
```

### ❌ 금지 사항

```typescript
// ❌ 하드코딩된 상태 문자열
await expect(page).toContainText('open');

// ✅ SSOT enum 사용
await expect(page).toContainText(NonConformanceStatus.open);

// ❌ 하드코딩된 라벨
await expect(page).toContainText('[손상]');

// ✅ SSOT 라벨 사용
await expect(page).toContainText(`[${NON_CONFORMANCE_TYPE_LABELS.damage}]`);
```

## 🧪 테스트 유지보수

### Seed Data 의존성

이 테스트는 다음 seed 데이터에 의존합니다:

- **NC_001** (`aaaa0001...`): malfunction, open, 수리 없음 → 수리 안내 카드 테스트
- **NC_002** (`aaaa0002...`): malfunction, analyzing, 수리 없음 → 드롭다운 필터링 테스트
- **NC_006** (`aaaa0006...`): calibration_failure, corrected, REPAIR_001 연결 → 성공 메시지 테스트
- **NC_004** (`aaaa0004...`): malfunction, closed → 종료된 NC 테스트

Seed 데이터 변경 시 `constants/test-data.ts` 업데이트 필요.

### 테스트 실패 시 점검 사항

1. **백엔드 서비스 가동 확인**

   ```bash
   curl http://localhost:3001/api/monitoring/health
   ```

2. **Seed 데이터 재실행**

   ```bash
   pnpm --filter backend run db:seed-test-new
   ```

3. **프론트엔드 서비스 확인**

   ```bash
   curl http://localhost:3000
   ```

4. **캐시 클리어**
   ```bash
   pnpm --filter frontend run clean
   rm -rf apps/frontend/.next
   ```

## 📊 테스트 커버리지

| 기능 영역       | 테스트 수 | 상태   |
| --------------- | --------- | ------ |
| UI 요소 표시    | 16        | ✅     |
| 권한 검증       | 6         | ✅     |
| 반응형/접근성   | 10        | ✅     |
| 전체 워크플로우 | 6         | ✅     |
| 검증 로직       | 6         | ✅     |
| **총계**        | **44**    | **✅** |

## ✅ 성공 기준

- [ ] 모든 테스트 통과 (44/44)
- [ ] SSOT 100% 준수 (하드코딩 0개)
- [ ] Group A-C 병렬 실행 < 3분
- [ ] Group D-E 순차 실행 < 5분
- [ ] Flaky test 0%
- [ ] CI 환경 100% 통과

## 🔗 관련 문서

- [Equipment Management Skill](/.claude/skills/equipment-management/SKILL.md)
- [E2E Test Auth Guide](/docs/development/E2E_TEST_AUTH_GUIDE.md)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
