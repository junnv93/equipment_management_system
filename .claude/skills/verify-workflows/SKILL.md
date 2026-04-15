---
name: verify-workflows
description: Verifies cross-feature workflow E2E test coverage against critical-workflows.md checklist. Checks WF-01~WF-35 coverage, step completeness, role correctness, side-effect verification, and status transition assertions. Run after adding workflow tests or before PR.
disable-model-invocation: true
argument-hint: '[선택사항: WF-03, WF-10 등 특정 워크플로우 번호]'
---

# 워크플로우 E2E 커버리지 검증

## Purpose

`docs/workflows/critical-workflows.md`에 정의된 크리티컬 워크플로우가 E2E 테스트로 올바르게 커버되는지 검증합니다:

1. **커버리지** — 각 워크플로우(WF-01~WF-16)에 대응하는 테스트 파일 존재 여부
2. **단계 완전성** — 워크플로우 문서의 모든 단계가 테스트에 포함되는지
3. **역할 정확성** — 각 단계에서 올바른 역할(TE/TM/QM/LM)이 사용되는지
4. **상태 전이 검증** — 장비/반출/NC 상태 전이 assertion 존재
5. **부수 효과 검증** — 교정일 갱신, NC 자동 조치, 캐시 무효화 등

## When to Run

- 워크플로우 E2E 테스트를 새로 작성하거나 수정한 후
- PR 전 워크플로우 커버리지 점검 시
- `docs/workflows/critical-workflows.md` 업데이트 후

## Related Files

| File | Purpose |
|------|---------|
| `docs/workflows/critical-workflows.md` | 워크플로우 체크리스트 SSOT |
| `apps/frontend/tests/e2e/workflows/` | 워크플로우 E2E 테스트 디렉토리 |
| `apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts` | 워크플로우 공통 헬퍼 |

## Workflow

### Step 1: 워크플로우 테스트 존재 여부

**검사:**
```bash
# workflows/ 디렉토리에서 WF 번호별 파일 존재 확인
for wf in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 25 33 35; do
  ls apps/frontend/tests/e2e/workflows/wf-${wf}-*.spec.ts 2>/dev/null
done
```

**PASS:** P0 워크플로우(WF-03, WF-10, WF-11) 100% 커버
**WARN:** P1 워크플로우(WF-07, WF-08, WF-12, WF-13) 일부 미커버. WF-13 cancel 롤백 경로 추가됨 (onReturnCanceled + suite-27 S27-08)
**INFO:** WF-20 자체점검 결재 워크플로우(P3): wf-20-self-inspection-confirmation.spec.ts, wf-20-self-inspection-ui.spec.ts, wf-20b-self-inspection-export.spec.ts 3파일 커버 (draft→submitted→approved, rejected→resubmit, export)

### Step 2: 단계 완전성

**검사:** 각 워크플로우 테스트 파일 내 `test('Step N:` 패턴으로 단계 수 확인.

```bash
# WF-03 예시: 문서에는 10단계, 테스트에서 Step 수 확인
grep -c "test('Step" apps/frontend/tests/e2e/workflows/wf-03-*.spec.ts
```

**PASS:** 테스트 Step 수 ≥ 문서 핵심 단계 수 (UI 확인 단계 합산 가능)
**WARN:** 50% 미만 단계 커버
**FAIL:** 핵심 상태 전이 단계 누락

### Step 3: 역할 정확성

**검사:** 각 Step에서 사용하는 fixture가 문서의 역할과 일치하는지 확인.

```bash
# TE 단계에 testOperatorPage, TM 단계에 techManagerPage 사용 확인
grep -n "testOperatorPage\|techManagerPage\|qualityManagerPage\|siteAdminPage" \
  apps/frontend/tests/e2e/workflows/*.spec.ts
```

**역할 매핑:**
| 문서 역할 | Fixture |
|-----------|---------|
| TE (시험실무자) | `testOperatorPage` |
| TM (기술책임자) | `techManagerPage` |
| QM (품질책임자) | `qualityManagerPage` |
| LM (시험소장) | `siteAdminPage` |

**PASS:** 모든 Step의 역할이 문서와 일치
**FAIL:** 역할 불일치 (예: TM 단계에서 testOperatorPage 사용)

### Step 4: 상태 전이 Assertion

**검사:** 장비 상태 변경이 있는 단계에서 `expectEquipmentStatus` 또는 유사 assertion 존재.

```bash
grep -n "expectEquipmentStatus\|expect.*status.*toBe" \
  apps/frontend/tests/e2e/workflows/*.spec.ts
```

**필수 상태 전이 검증 (워크플로우별):**

| WF | 필수 검증 |
|----|----------|
| WF-03 | available → checked_out → available |
| WF-10 | non_conforming → checked_out → available |
| WF-11 | available → non_conforming → checked_out → available |
| WF-07 | available → in_use → available |
| WF-12 | available → pending_disposal → disposed |

**PASS:** 모든 필수 상태 전이에 assertion 존재
**FAIL:** 핵심 전이 assertion 누락

### Step 5: 부수 효과 검증

**검사:** 워크플로우별 부수 효과가 테스트에 포함되는지.

| WF | 부수 효과 | 검증 방법 |
|----|----------|----------|
| WF-03 | 교정일 갱신 | `getEquipmentCalibrationDates` 호출 |
| WF-10 | NC 자동 CORRECTED | NC 상태 확인 assertion |
| WF-11 | 수리이력 연결 필수 | `repairHistoryId` 전달 |
| WF-15 | 다건 NC → 마지막 종결 시만 복원 | 중간 단계 non_conforming 유지 확인 |

```bash
# WF-03: 교정일 갱신 검증 존재
grep -c "getEquipmentCalibrationDates\|lastCalibrationDate\|nextCalibrationDate" \
  apps/frontend/tests/e2e/workflows/wf-03-*.spec.ts

# WF-10: NC 자동 조치 검증 존재
grep -c "corrected" apps/frontend/tests/e2e/workflows/wf-10-*.spec.ts
```

**PASS:** 핵심 부수 효과 검증 존재
**WARN:** 일부 부수 효과 미검증 (대시보드 카운트 등 보조 검증)

### Step 6: serial 모드 설정

**검사:** 워크플로우 테스트는 반드시 `mode: 'serial'`이어야 함.

```bash
grep -L "mode.*serial" apps/frontend/tests/e2e/workflows/*.spec.ts
```

**PASS:** 모든 워크플로우 테스트에 serial 모드 설정
**FAIL:** serial 모드 미설정 파일 존재

### Step 7: DB 리셋 + 캐시 클리어

**검사:** `beforeAll`에서 장비 리셋, `afterAll`에서 정리.

```bash
grep -n "beforeAll\|afterAll\|resetEquipmentForWorkflow\|cleanupSharedPool" \
  apps/frontend/tests/e2e/workflows/*.spec.ts
```

**PASS:** 모든 파일에 beforeAll 리셋 + afterAll 정리 존재
**FAIL:** 리셋/정리 누락 (다른 테스트에 부수 효과 전파 위험)

## Output Format

```markdown
## 워크플로우 E2E 커버리지 검증 결과

### 커버리지 요약

| 우선순위 | 워크플로우 | 테스트 파일 | 상태 |
|---------|-----------|-----------|------|
| P0 | WF-03 교정 반출 | wf-03-*.spec.ts | ✅ |
| P0 | WF-10 교정기한초과 | wf-10-*.spec.ts | ✅ |
| P0 | WF-11 부적합→수리 | wf-11-*.spec.ts | ✅ |
| P1 | WF-07 대여 반출 | - | ❌ 미구현 |
| ... | ... | ... | ... |

### 상세 검증

| # | 검사 | 상태 | 상세 |
|---|------|------|------|
| 1 | 워크플로우 테스트 존재 | PASS/WARN | P0 3/3, P1 0/4 |
| 2 | 단계 완전성 | PASS/WARN | WF-03: 9/10 steps |
| 3 | 역할 정확성 | PASS/FAIL | 불일치 위치 |
| 4 | 상태 전이 Assertion | PASS/FAIL | 누락 전이 |
| 5 | 부수 효과 검증 | PASS/WARN | 미검증 항목 |
| 6 | serial 모드 | PASS/FAIL | 미설정 파일 |
| 7 | DB 리셋 + 캐시 | PASS/FAIL | 누락 위치 |

### Action Items

- [ ] P1 워크플로우 테스트 추가: WF-07, WF-08, WF-12, WF-13
- [ ] WF-03 Step 4 UI 검증 강화
```

## Exceptions

1. **P3 워크플로우** — 개별 기능 테스트로 충분히 커버되는 경우 워크플로우 테스트 불필요
2. **시스템 자동 실행 단계** (CalibrationOverdueScheduler) — DB 직접 세팅으로 시뮬레이션 허용
3. **대시보드 카운트 연동** (WF-16) — 보조 검증이므로 WARN 수준
