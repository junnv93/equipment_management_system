# Group 4: 폐기 워크플로우 - 정상 흐름

## 개요

이 테스트 그룹은 장비 폐기 워크플로우의 정상적인 흐름을 검증합니다. 4개의 테스트가 순차적으로 실행되며, 각 테스트는 이전 테스트의 상태 변경에 의존합니다.

## 테스트 구성

| 순서 | 테스트 파일                            | 역할              | 기능               | 상태 변화                    |
| ---- | -------------------------------------- | ----------------- | ------------------ | ---------------------------- |
| 1    | `disposal-request.spec.ts`             | test_engineer     | 폐기 요청          | available → pending_disposal |
| 2    | `disposal-progress-view.spec.ts`       | test_engineer     | 진행 상태 확인     | - (읽기 전용)                |
| 3    | `disposal-review-tech-manager.spec.ts` | technical_manager | 기술책임자 검토    | pending_disposal → reviewed  |
| 4    | `disposal-final-approval.spec.ts`      | lab_manager       | 시험소장 최종 승인 | reviewed → disposed          |

## 워크플로우 다이어그램

```
[EQP-WORKFLOW-001]
     │
     │ (Test 1) test_engineer: 폐기 요청
     ↓
[pending_disposal]
     │
     │ (Test 2) test_engineer: 진행 상태 확인 (읽기 전용)
     │
     │ (Test 3) technical_manager: 검토 완료
     ↓
[reviewed]
     │
     │ (Test 4) lab_manager: 최종 승인
     ↓
[disposed]
```

## 실행 방법

### 순차 실행 (필수)

이 테스트 그룹은 **반드시 순차적으로** 실행되어야 합니다.

```bash
# 전체 그룹 순차 실행
pnpm --filter frontend test:e2e tests/e2e/equipment-detail/group4-disposal-workflow/ --workers=1

# 개별 테스트 순차 실행 (디버깅용)
pnpm --filter frontend test:e2e \
  tests/e2e/equipment-detail/group4-disposal-workflow/disposal-request.spec.ts \
  tests/e2e/equipment-detail/group4-disposal-workflow/disposal-progress-view.spec.ts \
  tests/e2e/equipment-detail/group4-disposal-workflow/disposal-review-tech-manager.spec.ts \
  tests/e2e/equipment-detail/group4-disposal-workflow/disposal-final-approval.spec.ts \
  --workers=1
```

### 태그 기반 실행

```bash
# @sequential 태그가 붙은 모든 테스트 실행
pnpm --filter frontend test:e2e --grep "@sequential" --workers=1
```

## 데이터 요구사항

### 테스트 장비

- **ID**: EQP-WORKFLOW-001
- **초기 상태**: available
- **소속**: test_engineer와 technical_manager가 같은 팀
- **폐기 가능 상태**: checked_out, retired 등이 아닌 상태

### 테스트 사용자

| 역할       | fixture          | 권한                       |
| ---------- | ---------------- | -------------------------- |
| 시험실무자 | testOperatorPage | 폐기 요청, 진행 상태 확인  |
| 기술책임자 | techManagerPage  | 검토 승인/반려 (같은 팀만) |
| 시험소장   | siteAdminPage    | 최종 승인/반려 (모든 요청) |

## 주의사항

### 1. 실행 순서 엄수

```bash
# ❌ 잘못된 실행 (병렬)
pnpm test:e2e tests/e2e/equipment-detail/group4-disposal-workflow/ --workers=4

# ✅ 올바른 실행 (순차)
pnpm test:e2e tests/e2e/equipment-detail/group4-disposal-workflow/ --workers=1
```

### 2. 중간 테스트 실패 시

만약 Test 2가 실패하면, Test 3와 Test 4도 실패합니다. 왜냐하면:

- Test 3는 `pending_disposal` 상태를 기대
- Test 4는 `reviewed` 상태를 기대

해결 방법:

1. 실패한 테스트 수정
2. 처음부터 다시 실행 (Test 1부터)

### 3. 데이터 격리

이 그룹은 독립적인 장비 `EQP-WORKFLOW-001`을 사용합니다.

- Group 5 (폐기 워크플로우 - 독립 시나리오)와 다른 장비 사용
- 다른 테스트 그룹과 병렬 실행 가능

## 검증 항목

### Test 1: disposal-request.spec.ts

- ✅ 폐기 요청 다이얼로그 정상 열림
- ✅ 폐기 사유 선택 (노후화)
- ✅ 상세 사유 입력 (10자 이상)
- ✅ 문자 수 카운터 업데이트
- ✅ 제출 버튼 활성화/비활성화
- ✅ 폐기 요청 완료 토스트
- ✅ 버튼 텍스트 변경 (폐기 요청 → 폐기 진행 중)
- ✅ 상태 업데이트

### Test 2: disposal-progress-view.spec.ts

- ✅ DisposalProgressCard 표시
- ✅ 현재 단계 표시 (1. 폐기 요청)
- ✅ 요청자 및 요청일 표시
- ✅ 상세 보기 버튼 동작
- ✅ DisposalDetailDialog 열림
- ✅ 3단계 타임라인 표시
- ✅ 폐기 사유 표시
- ✅ 현재 단계 하이라이트
- ✅ 다이얼로그 닫기

### Test 3: disposal-review-tech-manager.spec.ts

- ✅ 폐기 검토하기 버튼 표시 (기술책임자만)
- ✅ 검토 다이얼로그 열림
- ✅ 폐기 요청 정보 표시
- ✅ 장비 이력 요약 아코디언
- ✅ 검토 의견 입력 (10자 이상)
- ✅ 문자 수 힌트 및 aria-describedby
- ✅ 검토 완료 토스트
- ✅ 진행 상태 업데이트 (시험소장 승인 대기)

### Test 4: disposal-final-approval.spec.ts

- ✅ 최종 승인하기 버튼 표시 (시험소장만)
- ✅ 최종 승인 다이얼로그 열림
- ✅ 3단계 스테퍼 표시
- ✅ 기술책임자 검토 의견 표시
- ✅ 승인 코멘트 입력 (선택사항)
- ✅ 확인 다이얼로그 표시
- ✅ 되돌릴 수 없음 경고 표시
- ✅ 최종 승인 완료 토스트
- ✅ 상태 변경 (disposed)
- ✅ 폐기 완료 버튼 표시 (비활성화)
- ✅ DisposedBanner 표시

## 디버깅

### 로그 확인

테스트 실행 시 상세 로그 출력:

```bash
DEBUG=pw:api pnpm test:e2e tests/e2e/equipment-detail/group4-disposal-workflow/ --workers=1
```

### 단계별 확인

특정 테스트만 실행:

```bash
# Test 1만 실행
pnpm test:e2e tests/e2e/equipment-detail/group4-disposal-workflow/disposal-request.spec.ts

# Test 1-2만 실행
pnpm test:e2e \
  tests/e2e/equipment-detail/group4-disposal-workflow/disposal-request.spec.ts \
  tests/e2e/equipment-detail/group4-disposal-workflow/disposal-progress-view.spec.ts \
  --workers=1
```

### UI 모드 실행

```bash
pnpm --filter frontend test:e2e tests/e2e/equipment-detail/group4-disposal-workflow/ --ui
```

**주의**: UI 모드에서도 순차 실행을 유지하세요.

## 참고 자료

- **Test Plan**: `/home/kmjkds/equipment_management_system/equipment-detail.plan.md` (Section 4)
- **Execution Groups**: `/home/kmjkds/equipment_management_system/specs/test-execution-groups.md` (Group 4)
- **Disposal Components**: `apps/frontend/components/equipment/disposal/`
- **Auth Fixture**: `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

## 관련 테스트

### Group 5: 폐기 워크플로우 - 독립 시나리오 (병렬 가능)

Group 4와 달리 독립적인 장비를 사용하여 병렬 실행 가능:

- `disposal-reject-tech-manager.spec.ts` (반려)
- `disposal-cancel.spec.ts` (요청 취소)
- `disposal-permissions.spec.ts` (권한 검증)
- `disposal-attachments.spec.ts` (첨부파일)
- `disposal-completed.spec.ts` (완료 상태)

## 문제 해결

### 인증 실패 (401)

```
Error: Login callback failed: 401
```

**원인**: NextAuth test-login Provider가 활성화되지 않음

**해결**:

1. 백엔드/프론트엔드 서버가 실행 중인지 확인
2. `apps/frontend/lib/auth.ts`에 test-login Provider 설정 확인
3. 환경변수 `NODE_ENV=test` 또는 `ENABLE_TEST_LOGIN=true` 확인

### 장비 없음 (404)

```
Error: Equipment not found: EQP-WORKFLOW-001
```

**원인**: 테스트 장비가 데이터베이스에 없음

**해결**:

1. 데이터베이스 시드 실행: `pnpm --filter backend db:seed`
2. 수동으로 장비 생성 (management_number: EQP-WORKFLOW-001)

### 상태 불일치

```
Expected status: pending_disposal, Actual: available
```

**원인**: 이전 테스트가 실패하여 상태 변경이 이루어지지 않음

**해결**:

1. 처음부터 다시 실행 (Test 1부터)
2. 데이터베이스 초기화 후 재실행

## 라이선스

이 테스트 파일은 Equipment Management System의 일부입니다.
