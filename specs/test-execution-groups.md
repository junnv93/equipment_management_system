# 장비 상세 페이지 테스트 실행 그룹화

## 실행 전략

- **병렬 그룹**: 각 그룹 내 테스트들은 동시에 실행 가능 (독립적인 데이터, 읽기 전용)
- **순차 그룹**: 반드시 순서대로 실행해야 함 (상태 공유, 워크플로우 의존성)

---

## ✅ Group 1: 정보 표시 검증 (병렬 실행 가능)

**특징**: 읽기 전용, 각 테스트가 독립적인 장비 데이터 사용

| 테스트 ID | 테스트명                | 파일                              | 의존성 |
| --------- | ----------------------- | --------------------------------- | ------ |
| 1.1       | 기본 정보 표시          | `basic-information.spec.ts`       | 없음   |
| 1.2       | 교정 정보 및 D-day 뱃지 | `calibration-display.spec.ts`     | 없음   |
| 1.3       | 위치 및 관리 정보       | `location-info.spec.ts`           | 없음   |
| 1.4       | 공용장비 배너           | `shared-equipment-banner.spec.ts` | 없음   |
| 1.5       | 부적합 경고 배너        | `non-conformance-banner.spec.ts`  | 없음   |
| 1.6       | 404 에러 처리           | `not-found-handling.spec.ts`      | 없음   |

**실행 방법**:

```bash
# 모든 테스트 병렬 실행
npx playwright test tests/equipment-detail/basic-information.spec.ts \
                     tests/equipment-detail/calibration-display.spec.ts \
                     tests/equipment-detail/location-info.spec.ts \
                     tests/equipment-detail/shared-equipment-banner.spec.ts \
                     tests/equipment-detail/non-conformance-banner.spec.ts \
                     tests/equipment-detail/not-found-handling.spec.ts \
                     --workers=6
```

**데이터 요구사항**:

- 각 테스트별로 독립적인 장비 ID 필요
- 1.1: 기본 장비 (EQP-001)
- 1.2: 교정 예정 장비 (EQP-002, D-5), 교정 기한 초과 (EQP-003, D+61)
- 1.3: 완전한 위치 정보가 있는 장비 (EQP-004)
- 1.4: 공용장비 (EQP-005, isShared: true)
- 1.5: 부적합 장비 (EQP-006, non_conforming)
- 1.6: 존재하지 않는 ID (non-existent-id-12345)

---

## ✅ Group 2: 권한 검증 (병렬 실행 가능)

**특징**: 읽기 전용, 각 테스트가 다른 사용자 역할로 로그인

| 테스트 ID | 테스트명              | 파일                                    | 의존성 |
| --------- | --------------------- | --------------------------------------- | ------ |
| 2.1       | 시험실무자 권한       | `permissions-test-operator.spec.ts`     | 없음   |
| 2.2       | 기술책임자 권한       | `permissions-tech-manager.spec.ts`      | 없음   |
| 2.3       | 시험소장 권한         | `permissions-lab-manager.spec.ts`       | 없음   |
| 2.4       | 상태별 폐기 버튼 표시 | `disposal-button-visibility.spec.ts`    | 없음   |
| 2.5       | 공용장비 제약사항     | `shared-equipment-restrictions.spec.ts` | 없음   |

**실행 방법**:

```bash
npx playwright test tests/equipment-detail/permissions-*.spec.ts \
                     tests/equipment-detail/disposal-button-visibility.spec.ts \
                     tests/equipment-detail/shared-equipment-restrictions.spec.ts \
                     --workers=5
```

**데이터 요구사항**:

- 각 테스트별로 독립적인 장비와 사용자 사용
- 2.1-2.3: 동일한 장비 (EQP-010)로 테스트 가능 (읽기 전용)
- 2.4: 다양한 상태의 장비 (available, pending_disposal, disposed, checked_out, retired)
- 2.5: 공용장비 (EQP-005)

---

## ✅ Group 3: 탭 네비게이션 (병렬 실행 가능)

**특징**: 읽기 전용, UI 상호작용만 검증

| 테스트 ID | 테스트명           | 파일                              | 의존성 |
| --------- | ------------------ | --------------------------------- | ------ |
| 3.1       | 전체 탭 네비게이션 | `tab-navigation.spec.ts`          | 없음   |
| 3.2       | 교정 이력 탭 내용  | `calibration-history-tab.spec.ts` | 없음   |
| 3.3       | 반출 이력 탭 내용  | `checkout-history-tab.spec.ts`    | 없음   |
| 3.4       | 탭 상태 유지       | `tab-state-persistence.spec.ts`   | 없음   |
| 3.5       | 탭 로딩/에러 상태  | `tab-loading-error.spec.ts`       | 없음   |

**실행 방법**:

```bash
npx playwright test tests/equipment-detail/tab-*.spec.ts \
                     tests/equipment-detail/calibration-history-tab.spec.ts \
                     tests/equipment-detail/checkout-history-tab.spec.ts \
                     --workers=5
```

**데이터 요구사항**:

- 교정 이력이 있는 장비 (EQP-020)
- 반출 이력이 있는 장비 (EQP-021)
- 이력이 없는 장비 (EQP-022)

---

## 🔴 Group 4: 폐기 워크플로우 - 정상 흐름 (순차 실행 필수)

**특징**: 상태 변경, 연속된 워크플로우 (요청 → 검토 → 승인)

| 순서 | 테스트 ID | 테스트명               | 파일                                   | 의존성            |
| ---- | --------- | ---------------------- | -------------------------------------- | ----------------- |
| 1    | 4.1       | 폐기 요청 (시험실무자) | `disposal-request.spec.ts`             | **없음 (시작점)** |
| 2    | 4.2       | 폐기 진행 상태 확인    | `disposal-progress-view.spec.ts`       | **4.1의 결과**    |
| 3    | 4.3       | 검토 (기술책임자)      | `disposal-review-tech-manager.spec.ts` | **4.2의 결과**    |
| 4    | 4.5       | 최종 승인 (시험소장)   | `disposal-final-approval.spec.ts`      | **4.3의 결과**    |

**실행 방법**:

```bash
# 반드시 순차 실행 (--workers=1)
npx playwright test tests/equipment-detail/disposal-request.spec.ts \
                     tests/equipment-detail/disposal-progress-view.spec.ts \
                     tests/equipment-detail/disposal-review-tech-manager.spec.ts \
                     tests/equipment-detail/disposal-final-approval.spec.ts \
                     --workers=1
```

**데이터 요구사항**:

- 하나의 장비 (EQP-WORKFLOW-001, status: available)
- 워크플로우 전체에서 동일한 장비 사용
- 시험실무자 (user1), 기술책임자 (manager1), 시험소장 (admin1)

**주의사항**:

- 이 그룹은 절대 병렬 실행 불가
- 각 테스트가 이전 테스트의 상태 변경에 의존
- 4.1 → 4.2 → 4.3 → 4.5 순서 엄수

---

## ✅ Group 5: 폐기 워크플로우 - 독립 시나리오 (병렬 실행 가능)

**특징**: 각 테스트가 독립적인 장비 데이터 사용, 상태 변경하지만 서로 격리됨

| 테스트 ID | 테스트명       | 파일                                   | 의존성 | 필요 장비        |
| --------- | -------------- | -------------------------------------- | ------ | ---------------- |
| 4.4       | 반려 프로세스  | `disposal-reject-tech-manager.spec.ts` | 없음   | EQP-REJECT-001   |
| 4.6       | 요청 취소      | `disposal-cancel.spec.ts`              | 없음   | EQP-CANCEL-001   |
| 4.7       | 권한 검증      | `disposal-permissions.spec.ts`         | 없음   | EQP-PERM-001     |
| 4.8       | 첨부파일 지원  | `disposal-attachments.spec.ts`         | 없음   | EQP-ATTACH-001   |
| 4.9       | 폐기 완료 상태 | `disposal-completed.spec.ts`           | 없음   | EQP-DISPOSED-001 |

**실행 방법**:

```bash
npx playwright test tests/equipment-detail/disposal-reject-tech-manager.spec.ts \
                     tests/equipment-detail/disposal-cancel.spec.ts \
                     tests/equipment-detail/disposal-permissions.spec.ts \
                     tests/equipment-detail/disposal-attachments.spec.ts \
                     tests/equipment-detail/disposal-completed.spec.ts \
                     --workers=5
```

**데이터 요구사항**:

- 4.4: pending_disposal 상태의 장비 (EQP-REJECT-001)
- 4.6: pending_disposal 상태의 장비, 요청자 본인 (EQP-CANCEL-001)
- 4.7: pending_disposal 상태의 장비, 다른 팀 매니저 (EQP-PERM-001)
- 4.8: available 상태의 장비 (EQP-ATTACH-001)
- 4.9: disposed 상태의 장비 (EQP-DISPOSED-001)

**주의사항**:

- 각 테스트는 **완전히 독립적인 장비** 사용
- Seed 파일에서 각 시나리오별 전용 장비 생성 필요
- 동일한 장비를 여러 테스트에서 사용하면 병렬 실행 불가

---

## ✅ Group 6: 반응형 디자인 (병렬 실행 가능)

**특징**: 읽기 전용, 뷰포트 크기만 변경

| 테스트 ID | 테스트명             | 파일                               | 의존성 |
| --------- | -------------------- | ---------------------------------- | ------ |
| 5.1       | 모바일 뷰            | `responsive-mobile.spec.ts`        | 없음   |
| 5.2       | 태블릿 뷰            | `responsive-tablet.spec.ts`        | 없음   |
| 5.3       | 데스크톱 뷰          | `responsive-desktop.spec.ts`       | 없음   |
| 5.4       | 터치/마우스 인터랙션 | `touch-mouse-interactions.spec.ts` | 없음   |

**실행 방법**:

```bash
npx playwright test tests/equipment-detail/responsive-*.spec.ts \
                     tests/equipment-detail/touch-mouse-interactions.spec.ts \
                     --workers=4
```

**데이터 요구사항**:

- 동일한 장비 (EQP-010)로 모든 테스트 가능

---

## ✅ Group 7: 접근성 (병렬 실행 가능)

**특징**: 읽기 전용, UI 접근성 검증

| 테스트 ID | 테스트명            | 파일                                  | 의존성 |
| --------- | ------------------- | ------------------------------------- | ------ |
| 6.1       | 키보드 네비게이션   | `accessibility-keyboard.spec.ts`      | 없음   |
| 6.2       | 스크린 리더 지원    | `accessibility-screen-reader.spec.ts` | 없음   |
| 6.3       | ARIA 레이블 및 역할 | `accessibility-aria.spec.ts`          | 없음   |
| 6.4       | 색상 대비 및 가독성 | `accessibility-contrast.spec.ts`      | 없음   |
| 6.5       | 폼 접근성           | `accessibility-forms.spec.ts`         | 없음   |

**실행 방법**:

```bash
npx playwright test tests/equipment-detail/accessibility-*.spec.ts --workers=5
```

**데이터 요구사항**:

- 동일한 장비 (EQP-010)로 모든 테스트 가능

---

## 전체 실행 전략

### 1. 최대 병렬 실행 (권장)

```bash
# Group 1-3, 5-7을 병렬 실행 (총 35개 테스트)
npx playwright test tests/equipment-detail/ \
  --grep-invert "@sequential" \
  --workers=8

# Group 4를 순차 실행 (4개 테스트)
npx playwright test tests/equipment-detail/ \
  --grep "@sequential" \
  --workers=1
```

### 2. 그룹별 실행

```bash
# 병렬 가능한 모든 그룹
pnpm test:parallel

# 순차 실행 필수 그룹
pnpm test:sequential
```

### 3. package.json 스크립트 예시

```json
{
  "scripts": {
    "test:detail:parallel": "playwright test tests/equipment-detail/ --grep-invert '@sequential' --workers=8",
    "test:detail:sequential": "playwright test tests/equipment-detail/ --grep '@sequential' --workers=1",
    "test:detail:all": "pnpm test:detail:parallel && pnpm test:detail:sequential"
  }
}
```

---

## 테스트 파일 태깅 전략

각 테스트 파일에 적절한 태그를 추가하여 실행 제어:

```typescript
// Group 4 테스트 파일에만 추가
test.describe('폐기 워크플로우 - 정상 흐름 @sequential', () => {
  // 순차 실행 필수
});

// 나머지 테스트 (기본값)
test.describe('정보 표시 검증', () => {
  // 병렬 실행 가능
});
```

---

## 실행 시간 예측

### 병렬 실행 (Group 1-3, 5-7)

- 총 테스트: 35개
- Workers: 8
- 예상 시간: **5-7분**

### 순차 실행 (Group 4)

- 총 테스트: 4개
- Workers: 1
- 예상 시간: **3-5분**

### 전체 실행 시간

- **총 8-12분** (병렬 + 순차)

---

## 데이터 격리 체크리스트

### ✅ 병렬 실행 가능 조건

- [ ] 각 테스트가 독립적인 장비 ID 사용
- [ ] 읽기 전용 작업만 수행
- [ ] 다른 테스트의 결과에 의존하지 않음
- [ ] 상태를 변경하지 않음

### 🔴 순차 실행 필요 조건

- [ ] 이전 테스트의 상태 변경 결과를 사용
- [ ] 연속된 워크플로우 (생성 → 수정 → 삭제)
- [ ] 같은 장비의 상태를 여러 번 변경
- [ ] 순서가 바뀌면 테스트 실패

---

## 요약

| 그룹                            | 테스트 수 | 실행 방식 | 예상 시간  |
| ------------------------------- | --------- | --------- | ---------- |
| Group 1: 정보 표시              | 6         | **병렬**  | 1-2분      |
| Group 2: 권한 검증              | 5         | **병렬**  | 1-2분      |
| Group 3: 탭 네비게이션          | 5         | **병렬**  | 1-2분      |
| Group 4: 폐기 워크플로우 (정상) | 4         | **순차**  | 3-5분      |
| Group 5: 폐기 워크플로우 (독립) | 5         | **병렬**  | 1-2분      |
| Group 6: 반응형                 | 4         | **병렬**  | 1분        |
| Group 7: 접근성                 | 5         | **병렬**  | 1-2분      |
| **합계**                        | **34**    | -         | **8-12분** |

**핵심 원칙**:

1. 읽기 전용 = 병렬 가능
2. 상태 변경 + 격리된 데이터 = 병렬 가능
3. 상태 변경 + 공유 데이터 = 순차 필수
4. 워크플로우 의존성 = 순차 필수
