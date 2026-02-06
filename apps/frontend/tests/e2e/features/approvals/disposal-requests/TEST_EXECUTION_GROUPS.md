# Approvals Disposal E2E Tests - Execution Groups

## 의존성 분석 및 병렬/순차 그룹화

### 병렬 실행 기준

- ✅ 서로 다른 장비 ID 사용
- ✅ 서로 다른 사용자 role 사용
- ✅ 독립적인 DB 상태 (상태 공유 없음)

### 순차 실행 기준

- ❌ 같은 장비 ID를 재사용하는 경우
- ❌ 한 장비의 상태가 단계별로 변경되는 워크플로우
- ❌ 이전 테스트의 결과가 다음 테스트의 전제조건인 경우

---

## Group 1: Suite 1 - Review Tab Tests (technical_manager)

**병렬 실행 가능** ✅ (각 테스트가 다른 장비 사용)

| Test                        | 장비 ID                | 상태    | 의존성                          |
| --------------------------- | ---------------------- | ------- | ------------------------------- |
| ✅ 1.1 Approve same-team    | EQUIP_DISPOSAL_PERM_A4 | pending | 독립                            |
| ✅ 1.2 Reject with template | EQUIP_DISPOSAL_REJ_C1  | pending | 독립                            |
| ✅ 1.3 Reject validation    | EQUIP_DISPOSAL_REJ_C3  | pending | 독립                            |
| ✅ 1.4 Detail modal approve | EQUIP_DISPOSAL_UI_E1   | pending | 독립                            |
| ⏳ 1.5 Detail modal reject  | EQUIP_DISPOSAL_REJ_C1  | pending | ⚠️ C1 재사용 (1.2 후 실행 권장) |

**실행 전략**:

- 1.1, 1.3, 1.4: 완전 병렬 가능
- 1.2, 1.5: C1을 공유하므로 순차 실행 권장 (또는 각각 다른 DB reset)

---

## Group 2: Suite 2 - Final Approval Tests (lab_manager)

**병렬 실행 가능** ✅ (각 테스트가 다른 장비 사용)

| Test                      | 장비 ID                | 상태     | 의존성           |
| ------------------------- | ---------------------- | -------- | ---------------- |
| ✅ 2.1 Final approve      | EQUIP_DISPOSAL_PERM_A5 | reviewed | 독립             |
| ⏳ 2.2 Final reject       | EQUIP_DISPOSAL_REJ_C2  | reviewed | 독립             |
| ⏳ 2.3 Cross-team approve | EQUIP_DISPOSAL_PERM_A7 | reviewed | 독립 (Uiwang 팀) |
| ⏳ 2.4 Detail modal       | EQUIP_DISPOSAL_UI_E2   | reviewed | 독립             |

**실행 전략**:

- 2.1, 2.2, 2.3, 2.4: 완전 병렬 가능 (모두 다른 장비 ID)

---

## Group 3: Suite 3 - Integrated Workflows

**순차 실행 필수** ❌ (같은 장비를 단계별로 재사용)

| Test                     | 장비 ID                 | 상태 변화                                             | 의존성            |
| ------------------------ | ----------------------- | ----------------------------------------------------- | ----------------- |
| ⏳ 3.1 Complete workflow | EQUIP_DISPOSAL_WORKFLOW | available → pending → reviewed → disposed             | 순차 1번          |
| ⏳ 3.2 Review rejection  | EQUIP_DISPOSAL_WORKFLOW | available → pending → rejected → available            | 순차 2번 (3.1 후) |
| ⏳ 3.3 Final rejection   | EQUIP_DISPOSAL_WORKFLOW | available → pending → reviewed → rejected → available | 순차 3번 (3.2 후) |

**실행 전략**:

- **반드시 순차 실행**: 3.1 → 3.2 → 3.3
- 각 테스트 전에 `resetEquipmentToAvailable()` 호출
- 한 파일에 3개 테스트를 순차적으로 작성하거나, 각 테스트가 이전 테스트 완료 후 실행되도록 보장

---

## Group 4: Suite 4 - Role-Based Access Control

**대부분 병렬 가능** ✅ (다른 role 사용)

| Test                          | Role                      | 장비 ID                         | 의존성                  |
| ----------------------------- | ------------------------- | ------------------------------- | ----------------------- |
| ⏳ 4.1 Tech manager tabs      | technical_manager         | N/A (탭 확인만)                 | 독립                    |
| ⏳ 4.2 Lab manager tabs       | lab_manager               | N/A (탭 확인만)                 | 독립                    |
| ⏳ 4.3 Test engineer redirect | test_engineer             | N/A (권한 없음)                 | 독립                    |
| ⏳ 4.4 Cross-team denied      | technical_manager (Suwon) | EQUIP_DISPOSAL_PERM_A7 (Uiwang) | ⚠️ A7 사용 (2.3과 공유) |

**실행 전략**:

- 4.1, 4.2, 4.3: 완전 병렬 가능 (UI만 확인)
- 4.4: 2.3 후 실행 또는 별도 DB reset 사용

---

## Group 5: Suite 5 - Bulk Actions

**병렬 실행 가능** ✅ (각 테스트가 여러 장비 사용하지만 겹치지 않음)

| Test                 | 사용 장비              | 의존성           |
| -------------------- | ---------------------- | ---------------- |
| ⏳ 5.1 Bulk approve  | A4, C1, E1 (3개)       | 독립             |
| ⏳ 5.2 Bulk reject   | C2, C3 (2개)           | 독립             |
| ⏳ 5.3 Empty state   | (모든 장비 approve 후) | 5.1 후 실행 권장 |
| ⏳ 5.4 Count updates | A5 (1개)               | 독립             |

**실행 전략**:

- 5.1, 5.2, 5.4: 병렬 가능
- 5.3: 5.1 또는 5.2 후 실행 (empty state 확인)

---

## Group 6: Suite 6 - Tab Navigation

**병렬 실행 가능** ✅ (UI 동작만 확인, 장비 상태 변경 없음)

| Test                               | 기능                     | 의존성 |
| ---------------------------------- | ------------------------ | ------ |
| ⏳ 6.1 Tab URL sync                | URL 쿼리 파라미터 동기화 | 독립   |
| ⏳ 6.2 Tab switch clears selection | 선택 상태 초기화         | 독립   |
| ⏳ 6.3 Pending count badges        | 배지 카운트 표시         | 독립   |

**실행 전략**:

- 6.1, 6.2, 6.3: 완전 병렬 가능 (읽기 전용)

---

## Group 7: Suite 7 - Database Verification

**병렬 실행 가능** ✅ (각 테스트가 다른 장비 사용)

| Test                     | 장비 ID                | DB 검증 내용                                | 의존성                  |
| ------------------------ | ---------------------- | ------------------------------------------- | ----------------------- |
| ⏳ 7.1 Review approve DB | EQUIP_DISPOSAL_PERM_A4 | reviewStatus='reviewed'                     | 독립 (1.1과 공유, 순차) |
| ⏳ 7.2 Final approve DB  | EQUIP_DISPOSAL_PERM_A5 | reviewStatus='approved', status='disposed'  | 독립 (2.1과 공유, 순차) |
| ⏳ 7.3 Review reject DB  | EQUIP_DISPOSAL_REJ_C1  | reviewStatus='rejected', status='available' | 독립 (1.2와 공유, 순차) |
| ⏳ 7.4 Final reject DB   | EQUIP_DISPOSAL_REJ_C2  | reviewStatus='rejected', status='available' | 독립 (2.2와 공유, 순차) |

**실행 전략**:

- DB 검증 테스트는 해당 Suite의 기능 테스트 후 실행
- 7.1은 1.1 후, 7.2는 2.1 후, 7.3은 1.2 후, 7.4는 2.2 후

---

## 최종 실행 순서 권장사항

### Phase 1: 기본 워크플로우 (순차)

1. **Suite 1** (Review Tab): 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (순차)
2. **Suite 2** (Final Approval): 2.1 → 2.2 → 2.3 → 2.4 (순차)

### Phase 2: 통합 워크플로우 (순차 필수)

3. **Suite 3** (Workflows): 3.1 → 3.2 → 3.3 (순차)

### Phase 3: 권한 및 UI (병렬 가능)

4. **Suite 4** (Role Access): 4.1, 4.2, 4.3 병렬 → 4.4 (순차)
5. **Suite 6** (Tab Navigation): 6.1, 6.2, 6.3 (병렬)

### Phase 4: 대량 작업 및 DB 검증 (순차)

6. **Suite 5** (Bulk Actions): 5.1 → 5.2 → 5.4 → 5.3 (순차)
7. **Suite 7** (DB Verification): 7.1 → 7.2 → 7.3 → 7.4 (순차)

---

## Playwright 병렬 실행 설정

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : 4, // CI에서는 순차, 로컬에서는 병렬

  projects: [
    {
      name: 'approvals-review',
      testMatch: /approvals-disposal\/review\/.*\.spec\.ts/,
      fullyParallel: true, // Suite 1 내부 병렬
    },
    {
      name: 'approvals-final',
      testMatch: /approvals-disposal\/final\/.*\.spec\.ts/,
      fullyParallel: true, // Suite 2 내부 병렬
    },
    {
      name: 'approvals-workflow',
      testMatch: /approvals-disposal\/workflow\/.*\.spec\.ts/,
      fullyParallel: false, // Suite 3 순차 실행
    },
  ],
});
```

---

## 주의사항

1. **DB 상태 격리**: 각 `beforeEach`에서 장비 상태를 명시적으로 reset
2. **Cache Busting**: 모든 navigation에 `&_=${Date.now()}` 추가
3. **Connection Pool**: 모든 suite의 `afterAll`에서 `cleanupPool()` 호출
4. **장비 ID 재사용**: 같은 장비 ID를 사용하는 테스트는 순차 실행 권장

---

**작성일**: 2026-02-04
**총 테스트**: 26개 (현재 5개 완료, 21개 남음)
