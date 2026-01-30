# UI-13: 반출/반입 관리 페이지

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## 목적

장비의 반출(교정/수리/대여) 및 반입 관리 페이지를 구현합니다.

**핵심 원칙:**

- 모든 외부 이동은 **동일한 반출/반입 프로세스** 기반
- 대여 목적인 경우 **양측 4단계 상태 확인** 추가
- 기술책임자는 **소유 팀 장비만** 승인 가능

---

## 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design
/playwright-skill
AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 반출/반입 관리 페이지를 구현해줘.

역할 참고:
- test_engineer: 반출 신청, 상태 확인 등록, 반입 등록
- technical_manager: 반출 승인, 반입 최종 승인 (소유 팀만)

반출 유형 (3가지):
- calibration: 외부 교정 목적
- repair: 외부 수리 목적
- rental: 대여 (같은 시험소 내 타팀 또는 타 시험소)

상태 흐름:

1. 교정/수리 목적 (단순 흐름):
   pending → approved → checked_out → returned → return_approved

2. 대여 목적 (양측 확인 흐름):
   pending → approved → lender_checked (①반출전확인)
   → borrower_received (②인수확인) → in_use
   → borrower_returned (③반납전확인) → lender_received (④반입확인)
   → return_approved

요구사항:

1. 반출 신청 페이지
   - 장비 선택 (검색/필터 지원, 전체 시험소 장비 조회 가능)
   - 반출 유형 선택 (교정/수리/대여)
   - 반출처 입력:
     - 교정: 교정기관명
     - 수리: 수리업체명
     - 대여: 시험소/팀 선택 (시스템이 같은 시험소/타 시험소 자동 판단)
   - 반출 사유
   - 반출 기간 (반출 예정일, 반입 예정일)
   - 담당자 연락처 (선택)

2. 내 반출 목록
   - 내가 신청한 반출 목록
   - 내가 확인해야 할 항목 (빌리는 측: 인수 확인, 반납 전 확인)
   - 상태별 필터
   - 각 상태에서 가능한 액션 버튼

3. 반출 승인 (기술책임자)
   - 반출 요청 목록 (내 팀 장비만 표시)
   - 승인/반려 버튼
   - 반려 시 사유 필수 입력

4. 상태 확인 등록 (대여 목적 - 4단계)

   ① 반출 전 상태 확인 (빌려주는 측 시험실무자)
      - 확인 항목: 외관 상태, 정상 작동 여부, 부속품 확인
      - 이상 시 상세 기록

   ② 인수 시 상태 확인 (빌리는 측 시험실무자)
      - 확인 항목: 외관 상태, 정상 작동 여부, 이상 유무
      - 이상 발견 시 즉시 기록 (책임 소재 명확화)

   ③ 반납 전 상태 확인 (빌린 측 시험실무자)
      - 확인 항목: 외관 상태, 정상 작동 여부, 사용 중 이상 발생 여부

   ④ 반입 시 상태 확인 (빌려준 측 시험실무자)
      - 확인 항목: 외관 상태, 정상 작동 여부
      - 대여 전 상태(①)와 비교 표시
      - 이상 발견 시 → 부적합 장비 프로세스 연계

5. 반입 처리 (교정/수리 목적)
   - 반입 검사 폼
   - 검사 항목:
     - 외관 상태 점검 결과 (필수)
     - 정상 작동 확인 결과 (필수)
     - 교정 수행 여부 (교정 목적 시 필수)
     - 수리 결과 (수리 목적 시 필수)
   - 이상 발견 시 상세 기록
   - 교정 목적 반입 완료 시 → 교정 기록 등록 화면으로 자동 이동

6. 반입 최종 승인 (기술책임자)
   - 반입 승인 대기 목록 (내 팀 장비만)
   - 상태 확인 기록 검토
   - 승인 시:
     - 정상: 장비 상태 → '사용가능'
     - 이상 발견: 장비 상태 → '사용중지', 부적합 프로세스 연계

파일 구조:

pages:
- apps/frontend/app/checkouts/page.tsx (내 반출 목록 - Server Component)
- apps/frontend/app/checkouts/loading.tsx (목록 로딩 상태)
- apps/frontend/app/checkouts/error.tsx (에러 핸들러 - 'use client')
- apps/frontend/app/checkouts/create/page.tsx (반출 신청 - Server Component)
- apps/frontend/app/checkouts/[id]/page.tsx (반출 상세 - Server Component)
- apps/frontend/app/checkouts/[id]/check/page.tsx (상태 확인 등록 - 대여)
- apps/frontend/app/checkouts/[id]/return/page.tsx (반입 등록 - 교정/수리)
- apps/frontend/app/checkouts/manage/page.tsx (반출 승인 관리 - Server Component)
- apps/frontend/app/checkouts/pending-checks/page.tsx (내가 확인해야 할 목록)
- apps/frontend/app/admin/return-approvals/page.tsx (반입 승인 - Server Component)

components:
- apps/frontend/components/checkouts/CheckoutRequestForm.tsx ('use client')
- apps/frontend/components/checkouts/CheckoutListClient.tsx ('use client')
- apps/frontend/components/checkouts/CheckoutTypeSelector.tsx ('use client')
- apps/frontend/components/checkouts/CheckoutStatusStepper.tsx (상태 진행 표시)
- apps/frontend/components/checkouts/EquipmentConditionForm.tsx ('use client' - 상태 확인)
- apps/frontend/components/checkouts/ReturnInspectionForm.tsx ('use client' - 반입 검사)
- apps/frontend/components/checkouts/ConditionComparisonCard.tsx (대여 전후 비교)
- apps/frontend/components/checkouts/PendingCheckBadge.tsx (확인 필요 뱃지)
- apps/frontend/components/checkouts/DestinationSelector.tsx ('use client' - 반출처 선택)

api:
- apps/frontend/lib/api/checkout-api.ts (Client API)
- apps/frontend/lib/api/server/checkout-api-server.ts (Server API)

Next.js 16 패턴 요구사항:
- 동적 라우트 [id]는 params: Promise<{ id: string }> 패턴 사용
- page.tsx는 Server Component로 초기 데이터 fetch
- 폼/필터 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)

성능 최적화 요구사항:
- Server Component에서 초기 목록 데이터 fetch
- 장비 선택 모달은 dynamic import로 지연 로딩
- 목록 페이지네이션 적용
- 상태 변경 시 optimistic update 적용
- 아이콘 개별 import (lucide-react tree-shaking)

접근성 요구사항:
- 반출 상태 진행 표시: aria-current="step" 사용
- 상태 확인 체크박스: 명확한 label 연결, 그룹화 (role="group")
- 상태 변경 알림: aria-live="polite"로 스크린리더에 알림
- 승인/반려 버튼: aria-describedby로 대상 항목 연결
- 폼 에러 메시지: role="alert" 적용
- 키보드 탐색: Tab 순서 논리적 구성
- 포커스 표시: ring-2 ring-offset-2 스타일 적용

디자인 요구사항:
- 반출 유형별 색상 구분 (Badge)
  - 교정: blue
  - 수리: orange
  - 대여: green
- 상태 진행 표시기 (Stepper)
  - 교정/수리: 5단계
  - 대여: 8단계 (양측 확인 포함)
- 상태 확인 폼 (Checkbox + Card)
- 대여 전후 상태 비교 카드
- 확인 필요 항목 강조 표시 (뱃지, 색상)
- 반응형: 모바일 카드 뷰, 데스크톱 테이블 뷰

제약사항:
- 대여 목적 시 양측 상태 확인 순서 강제
- 이전 단계 완료 전 다음 단계 진행 불가
- 기술책임자는 소유 팀 장비만 승인 가능
- 반입 승인 시 장비 상태 자동 복원
- 이상 발견 시 부적합 장비 프로세스 연계
- 교정 목적 반입 완료 시 교정 기록 등록 화면 연계

검증:
- 반출 유형별 플로우 테스트
- 대여 양측 확인 순서 테스트
- 권한 검증 테스트 (소유 팀만 승인)
- pnpm tsc --noEmit

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

---

## 타입 정의

```typescript
// 반출 유형
type CheckoutType = 'calibration' | 'repair' | 'rental';

// 반출 상태
type CheckoutStatus =
  | 'pending' // 승인 대기
  | 'approved' // 승인됨
  | 'rejected' // 반려됨
  | 'checked_out' // 반출됨 (교정/수리)
  | 'lender_checked' // ① 반출 전 확인 완료 (대여)
  | 'borrower_received' // ② 인수 확인 완료 (대여)
  | 'in_use' // 사용 중 (대여)
  | 'borrower_returned' // ③ 반납 전 확인 완료 (대여)
  | 'lender_received' // ④ 반입 확인 완료 (대여)
  | 'returned' // 반입됨 (교정/수리)
  | 'return_approved' // 반입 승인 완료
  | 'cancelled'; // 취소됨

// 상태 확인 단계 (대여 목적)
type ConditionCheckStep =
  | 'lender_checkout' // ① 반출 전 (빌려주는 측)
  | 'borrower_receive' // ② 인수 시 (빌리는 측)
  | 'borrower_return' // ③ 반납 전 (빌린 측)
  | 'lender_return'; // ④ 반입 시 (빌려준 측)

// 상태 확인 기록
interface ConditionCheck {
  id: string;
  checkoutId: string;
  step: ConditionCheckStep;
  checkedBy: string;
  checkedAt: string;
  appearanceStatus: 'normal' | 'abnormal';
  operationStatus: 'normal' | 'abnormal';
  accessoriesStatus?: 'complete' | 'incomplete';
  abnormalDetails?: string;
  comparisonWithPrevious?: string; // ④단계에서 사용
}

// 반입 검사 (교정/수리)
interface ReturnInspection {
  returnDate: string;
  appearanceStatus: 'normal' | 'abnormal';
  operationStatus: 'normal' | 'abnormal';
  calibrationCompleted?: boolean; // 교정 목적 시
  repairResult?: string; // 수리 목적 시
  abnormalDetails?: string;
}

// 반출 신청
interface CheckoutRequest {
  equipmentId: string;
  checkoutType: CheckoutType;
  destination: string; // 교정기관/수리업체/시험소+팀
  targetSiteId?: string; // 대여 시: 빌리는 측 시험소
  targetTeamId?: string; // 대여 시: 빌리는 측 팀
  reason: string;
  expectedCheckoutDate: string;
  expectedReturnDate: string;
  contactInfo?: string;
}
```

---

## 상태별 UI 표시 (대여 목적)

| 상태                       | 빌려주는 측 화면                | 빌리는 측 화면             |
| -------------------------- | ------------------------------- | -------------------------- |
| approved                   | "반출 전 상태 확인" 버튼 활성화 | 대기 중 표시               |
| lender_checked             | 대기 중 표시                    | "인수 확인" 버튼 활성화    |
| borrower_received / in_use | 대기 중 (사용 중)               | "반납 전 확인" 버튼 활성화 |
| borrower_returned          | "반입 확인" 버튼 활성화         | 대기 중 표시               |
| lender_received            | "반입 승인 대기" 알림           | 완료 대기 표시             |
| return_approved            | 완료                            | 완료                       |

---

## 상태 흐름 다이어그램

### 교정/수리 목적

```
[신청] → [승인대기] → [승인] → [반출] → [반입] → [반입승인] → [완료]
  │         │                              │
  │         └─[반려]                        └─[이상발견] → [부적합처리]
  │
  └─[취소]
```

### 대여 목적 (양측 확인)

```
[신청] → [승인대기] → [승인]
                        │
                        ▼
              ① [반출전확인] (빌려주는측)
                        │
                        ▼
              ② [인수확인] (빌리는측)
                        │
                        ▼
                    [사용중]
                        │
                        ▼
              ③ [반납전확인] (빌린측)
                        │
                        ▼
              ④ [반입확인] (빌려준측)
                        │
                        ▼
                  [반입승인] → [완료]
                        │
                        └─[이상발견] → [부적합처리]
```

---

## 필수 가이드라인

1. **프로세스 통합**: 교정/수리/대여 모두 동일한 반출/반입 프로세스 기반
2. **대여 시 양측 확인**: 4단계 상태 확인 필수, 순서 강제
3. **권한 제한**: 기술책임자는 소유 팀 장비만 승인 가능 (타 팀 신청은 가능)
4. **교정 연계**: 교정 목적 반입 완료 시 교정 기록 등록 화면으로 자동 이동
5. **부적합 연계**: 이상 발견 시 장비 상태 '사용중지' + 부적합 프로세스 연계

---

## 이행 체크리스트 UI-13

### 파일 생성

- [ ] checkouts/page.tsx 구현됨 (Server Component)
- [ ] checkouts/loading.tsx 생성됨
- [ ] checkouts/error.tsx 생성됨 ('use client')
- [ ] checkouts/create/page.tsx 구현됨 (Server Component)
- [ ] checkouts/[id]/page.tsx 구현됨 (Server Component, params Promise 패턴)
- [ ] checkouts/[id]/check/page.tsx 구현됨 (상태 확인 등록 - 대여)
- [ ] checkouts/[id]/return/page.tsx 구현됨 (반입 등록 - 교정/수리)
- [ ] checkouts/manage/page.tsx 구현됨 (Server Component)
- [ ] checkouts/pending-checks/page.tsx 구현됨 (확인 필요 목록)
- [ ] admin/return-approvals/page.tsx 구현됨 (Server Component)

### 컴포넌트 생성

- [ ] CheckoutRequestForm.tsx 생성됨 ('use client')
- [ ] CheckoutListClient.tsx 생성됨 ('use client')
- [ ] CheckoutTypeSelector.tsx 생성됨 ('use client')
- [ ] CheckoutStatusStepper.tsx 생성됨 (유형별 단계 표시)
- [ ] EquipmentConditionForm.tsx 생성됨 ('use client')
- [ ] ReturnInspectionForm.tsx 생성됨 ('use client')
- [ ] ConditionComparisonCard.tsx 생성됨 (전후 비교)
- [ ] PendingCheckBadge.tsx 생성됨 (확인 필요 표시)
- [ ] DestinationSelector.tsx 생성됨 ('use client')

### API 함수

- [ ] checkout-api.ts (Client) 생성됨
- [ ] checkout-api-server.ts (Server) 생성됨

### 기능 구현

- [ ] 반출 유형별 플로우 구현됨 (교정/수리/대여)
- [ ] 대여 양측 4단계 상태 확인 구현됨
- [ ] 상태 확인 순서 강제 구현됨 (이전 단계 미완료 시 다음 단계 불가)
- [ ] 상태 진행 표시기 구현됨 (유형별 단계 수 다름)
- [ ] 대여 전후 상태 비교 구현됨
- [ ] 교정 목적 반입 시 교정 기록 연계 구현됨
- [ ] 이상 발견 시 부적합 프로세스 연계 구현됨
- [ ] 소유 팀 장비만 승인 가능 권한 검증 구현됨

### 성능 최적화

- [ ] Server Component에서 초기 데이터 fetch 구현
- [ ] 장비 선택 모달 dynamic import 적용
- [ ] 목록 페이지네이션 적용
- [ ] optimistic update 적용

### 접근성

- [ ] 상태 진행 표시에 aria-current="step" 적용
- [ ] 상태 확인 체크박스 label 연결 및 그룹화
- [ ] 상태 변경 시 aria-live 알림 구현
- [ ] 승인/반려 버튼 aria-describedby 연결
- [ ] 폼 에러 메시지 role="alert" 적용
- [ ] 키보드 탐색 가능 확인
- [ ] 포커스 표시 스타일 적용

### 테스트

- [ ] Playwright 테스트 작성됨 (checkouts.spec.ts)
- [ ] 대여 양측 확인 테스트 추가됨
- [ ] 권한별 접근 제어 테스트 추가됨
- [ ] 키보드 탐색 테스트 추가됨
- [ ] axe-core 접근성 테스트 추가됨
- [ ] 모든 테스트 통과됨
- [ ] pnpm tsc --noEmit 성공

---

## Playwright 테스트 예시

```typescript
// tests/e2e/checkouts.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('반출/반입 관리', () => {
  test.describe('교정/수리 목적 반출', () => {
    test('외부 교정 반출 전체 플로우', async ({ testOperatorPage, techManagerPage }) => {
      // 시험실무자: 반출 신청
      await testOperatorPage.goto('/checkouts/create');
      await testOperatorPage.click('[data-testid="select-equipment"]');
      await testOperatorPage.click('[data-testid="equipment-1"]');
      await testOperatorPage.selectOption('[name="checkoutType"]', 'calibration');
      await testOperatorPage.fill('[name="destination"]', 'KOLAS 교정기관');
      await testOperatorPage.fill('[name="reason"]', '연간 교정');
      await testOperatorPage.fill('[name="expectedReturnDate"]', '2026-02-28');
      await testOperatorPage.click('[data-testid="submit-checkout"]');

      await expect(testOperatorPage.locator('[data-testid="status-pending"]')).toBeVisible();

      // 기술책임자: 승인
      await techManagerPage.goto('/checkouts/manage');
      await techManagerPage.click('[data-testid="pending-checkout-1"]');
      await techManagerPage.click('[data-testid="approve-button"]');

      await expect(techManagerPage.locator('[data-testid="status-approved"]')).toBeVisible();

      // 시험실무자: 반출 처리 (상태 확인)
      await testOperatorPage.goto('/checkouts/1');
      await testOperatorPage.click('[data-testid="process-checkout"]');
      await testOperatorPage.check('[data-testid="appearance-normal"]');
      await testOperatorPage.check('[data-testid="operation-normal"]');
      await testOperatorPage.click('[data-testid="confirm-checkout"]');

      await expect(testOperatorPage.locator('[data-testid="status-checked-out"]')).toBeVisible();
    });

    test('반입 처리 및 교정 기록 연계', async ({ testOperatorPage, techManagerPage }) => {
      // 시험실무자: 반입 등록
      await testOperatorPage.goto('/checkouts/1/return');
      await testOperatorPage.check('[data-testid="appearance-normal"]');
      await testOperatorPage.check('[data-testid="calibration-completed"]');
      await testOperatorPage.check('[data-testid="operation-normal"]');
      await testOperatorPage.click('[data-testid="submit-return"]');

      await expect(testOperatorPage.locator('[data-testid="status-returned"]')).toBeVisible();

      // 기술책임자: 반입 승인
      await techManagerPage.goto('/admin/return-approvals');
      await techManagerPage.click('[data-testid="return-approval-1"]');
      await techManagerPage.click('[data-testid="approve-return"]');

      // 교정 기록 등록 화면으로 자동 이동 확인
      await expect(techManagerPage).toHaveURL(/\/calibrations\/create\?equipmentId=/);
    });
  });

  test.describe('대여 목적 반출 (양측 확인)', () => {
    test('대여 전체 플로우 - 양측 4단계 확인', async ({
      borrowerOperatorPage, // 빌리는 측 시험실무자
      lenderTechManagerPage, // 빌려주는 측 기술책임자
      lenderOperatorPage, // 빌려주는 측 시험실무자
    }) => {
      // 1. 빌리는 측: 반출(대여) 신청
      await borrowerOperatorPage.goto('/checkouts/create');
      await borrowerOperatorPage.click('[data-testid="select-equipment"]');
      await borrowerOperatorPage.click('[data-testid="equipment-other-team"]');
      await borrowerOperatorPage.selectOption('[name="checkoutType"]', 'rental');
      await borrowerOperatorPage.fill('[name="reason"]', '시험 지원');
      await borrowerOperatorPage.fill('[name="expectedReturnDate"]', '2026-02-15');
      await borrowerOperatorPage.click('[data-testid="submit-checkout"]');

      // 2. 빌려주는 측 기술책임자: 승인
      await lenderTechManagerPage.goto('/checkouts/manage');
      await lenderTechManagerPage.click('[data-testid="pending-checkout-1"]');
      await lenderTechManagerPage.click('[data-testid="approve-button"]');

      // 3. ① 반출 전 상태 확인 (빌려주는 측)
      await lenderOperatorPage.goto('/checkouts/1/check');
      await expect(lenderOperatorPage.locator('[data-testid="check-step"]')).toContainText(
        '반출 전 상태 확인'
      );
      await lenderOperatorPage.check('[data-testid="appearance-normal"]');
      await lenderOperatorPage.check('[data-testid="operation-normal"]');
      await lenderOperatorPage.check('[data-testid="accessories-complete"]');
      await lenderOperatorPage.click('[data-testid="submit-check"]');

      await expect(
        lenderOperatorPage.locator('[data-testid="status-lender-checked"]')
      ).toBeVisible();

      // 4. ② 인수 시 상태 확인 (빌리는 측)
      await borrowerOperatorPage.goto('/checkouts/1/check');
      await expect(borrowerOperatorPage.locator('[data-testid="check-step"]')).toContainText(
        '인수 시 상태 확인'
      );
      await borrowerOperatorPage.check('[data-testid="appearance-normal"]');
      await borrowerOperatorPage.check('[data-testid="operation-normal"]');
      await borrowerOperatorPage.click('[data-testid="submit-check"]');

      await expect(borrowerOperatorPage.locator('[data-testid="status-in-use"]')).toBeVisible();

      // 5. ③ 반납 전 상태 확인 (빌린 측)
      await borrowerOperatorPage.goto('/checkouts/1/check');
      await expect(borrowerOperatorPage.locator('[data-testid="check-step"]')).toContainText(
        '반납 전 상태 확인'
      );
      await borrowerOperatorPage.check('[data-testid="appearance-normal"]');
      await borrowerOperatorPage.check('[data-testid="operation-normal"]');
      await borrowerOperatorPage.check('[data-testid="no-issue-during-use"]');
      await borrowerOperatorPage.click('[data-testid="submit-check"]');

      await expect(
        borrowerOperatorPage.locator('[data-testid="status-borrower-returned"]')
      ).toBeVisible();

      // 6. ④ 반입 시 상태 확인 (빌려준 측)
      await lenderOperatorPage.goto('/checkouts/1/check');
      await expect(lenderOperatorPage.locator('[data-testid="check-step"]')).toContainText(
        '반입 시 상태 확인'
      );

      // 대여 전 상태와 비교 카드 표시 확인
      await expect(
        lenderOperatorPage.locator('[data-testid="condition-comparison"]')
      ).toBeVisible();

      await lenderOperatorPage.check('[data-testid="appearance-normal"]');
      await lenderOperatorPage.check('[data-testid="operation-normal"]');
      await lenderOperatorPage.click('[data-testid="submit-check"]');

      await expect(
        lenderOperatorPage.locator('[data-testid="status-lender-received"]')
      ).toBeVisible();

      // 7. 기술책임자: 반입 최종 승인
      await lenderTechManagerPage.goto('/admin/return-approvals');
      await lenderTechManagerPage.click('[data-testid="return-approval-1"]');
      await lenderTechManagerPage.click('[data-testid="approve-return"]');

      await expect(
        lenderTechManagerPage.locator('[data-testid="status-return-approved"]')
      ).toBeVisible();
    });

    test('상태 확인 순서 강제 - 이전 단계 미완료 시 다음 단계 불가', async ({
      borrowerOperatorPage,
    }) => {
      // 승인 직후 상태에서 빌리는 측이 인수 확인 시도
      await borrowerOperatorPage.goto('/checkouts/1/check');

      // 아직 빌려주는 측의 반출 전 확인이 안 된 상태
      await expect(
        borrowerOperatorPage.locator('[data-testid="waiting-previous-step"]')
      ).toBeVisible();
      await expect(borrowerOperatorPage.locator('[data-testid="waiting-message"]')).toContainText(
        '빌려주는 측의 반출 전 상태 확인을 기다리고 있습니다'
      );
    });

    test('인수 시 이상 발견 - 즉시 기록', async ({ borrowerOperatorPage }) => {
      await borrowerOperatorPage.goto('/checkouts/1/check');

      // 이상 발견
      await borrowerOperatorPage.check('[data-testid="appearance-abnormal"]');
      await borrowerOperatorPage.fill('[data-testid="abnormal-details"]', '외관에 스크래치 발견');
      await borrowerOperatorPage.click('[data-testid="submit-check"]');

      // 이상 기록됨 확인
      await expect(borrowerOperatorPage.locator('[data-testid="issue-recorded"]')).toBeVisible();
    });

    test('반입 시 이상 발견 - 부적합 프로세스 연계', async ({
      lenderOperatorPage,
      lenderTechManagerPage,
    }) => {
      await lenderOperatorPage.goto('/checkouts/1/check');

      // 대여 전후 비교에서 이상 발견
      await lenderOperatorPage.check('[data-testid="operation-abnormal"]');
      await lenderOperatorPage.fill(
        '[data-testid="abnormal-details"]',
        '대여 전에는 정상이었으나 현재 작동 불량'
      );
      await lenderOperatorPage.click('[data-testid="submit-check"]');

      // 기술책임자 반입 승인 시 부적합 장비로 처리
      await lenderTechManagerPage.goto('/admin/return-approvals/1');
      await lenderTechManagerPage.click('[data-testid="approve-with-issue"]');

      // 장비 상태가 '사용중지'로 변경됨 확인
      await expect(lenderTechManagerPage.locator('[data-testid="equipment-status"]')).toContainText(
        '사용중지'
      );

      // 부적합 장비 프로세스로 연계됨 확인
      await expect(
        lenderTechManagerPage.locator('[data-testid="nonconformity-link"]')
      ).toBeVisible();
    });
  });

  test.describe('권한 검증', () => {
    test('기술책임자는 소유 팀 장비만 승인 가능', async ({ techManagerPage }) => {
      // RF팀 기술책임자가 SAR팀 장비 승인 시도
      await techManagerPage.goto('/checkouts/manage');

      // SAR팀 장비는 목록에 표시되지 않거나 승인 버튼 비활성화
      const sarEquipmentRow = techManagerPage.locator('[data-testid="checkout-sar-equipment"]');

      // 목록에 없거나
      const count = await sarEquipmentRow.count();
      if (count > 0) {
        // 있더라도 승인 버튼 비활성화
        await expect(sarEquipmentRow.locator('[data-testid="approve-button"]')).toBeDisabled();
      }
    });

    test('타 팀 장비 대여 신청은 가능', async ({ testOperatorPage }) => {
      // RF팀 시험실무자가 SAR팀 장비 대여 신청
      await testOperatorPage.goto('/checkouts/create');
      await testOperatorPage.click('[data-testid="select-equipment"]');

      // SAR팀 장비도 선택 가능
      await expect(testOperatorPage.locator('[data-testid="equipment-sar-team"]')).toBeVisible();
      await testOperatorPage.click('[data-testid="equipment-sar-team"]');

      // 대여 유형 선택 가능
      await testOperatorPage.selectOption('[name="checkoutType"]', 'rental');
      await expect(testOperatorPage.locator('[data-testid="submit-checkout"]')).toBeEnabled();
    });
  });

  test.describe('접근성', () => {
    test('대여 상태 진행 표시기 aria-current', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/checkouts/1');

      // 현재 단계에 aria-current="step" 확인
      const currentStep = testOperatorPage.locator('[aria-current="step"]');
      await expect(currentStep).toBeVisible();
    });

    test('상태 확인 체크박스 그룹화', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/checkouts/1/check');

      // 체크박스 그룹 확인
      const checkboxGroup = testOperatorPage.locator('[role="group"][aria-labelledby]');
      await expect(checkboxGroup).toBeVisible();
    });

    test('상태 변경 시 aria-live 알림', async ({ techManagerPage }) => {
      await techManagerPage.goto('/checkouts/manage');
      await techManagerPage.click('[data-testid="approve-button"]');

      const liveRegion = techManagerPage.locator('[aria-live="polite"]');
      await expect(liveRegion).toContainText(/승인|완료/);
    });

    test('axe-core 접근성 검사', async ({ testOperatorPage }) => {
      const AxeBuilder = (await import('@axe-core/playwright')).default;

      // 반출 신청 페이지
      await testOperatorPage.goto('/checkouts/create');
      let results = await new AxeBuilder({ page: testOperatorPage })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      // 상태 확인 페이지
      await testOperatorPage.goto('/checkouts/1/check');
      results = await new AxeBuilder({ page: testOperatorPage })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
```

---

## 컴포넌트 상세 명세

### CheckoutStatusStepper

반출 유형에 따라 다른 단계 수를 표시합니다.

```typescript
// 교정/수리: 5단계
const calibrationRepairSteps = [
  { key: 'pending', label: '승인대기' },
  { key: 'approved', label: '승인' },
  { key: 'checked_out', label: '반출' },
  { key: 'returned', label: '반입' },
  { key: 'return_approved', label: '완료' },
];

// 대여: 8단계
const rentalSteps = [
  { key: 'pending', label: '승인대기' },
  { key: 'approved', label: '승인' },
  { key: 'lender_checked', label: '①반출전확인' },
  { key: 'borrower_received', label: '②인수확인' },
  { key: 'in_use', label: '사용중' },
  { key: 'borrower_returned', label: '③반납전확인' },
  { key: 'lender_received', label: '④반입확인' },
  { key: 'return_approved', label: '완료' },
];
```

### ConditionComparisonCard

대여 반입 시(④단계) 대여 전 상태(①단계)와 현재 상태를 비교 표시합니다.

```typescript
interface ConditionComparisonCardProps {
  beforeCheck: ConditionCheck; // ①단계 기록
  currentCheck?: Partial<ConditionCheck>; // 현재 입력 중인 값
}
```

### DestinationSelector

반출 유형에 따라 다른 입력 UI를 표시합니다.

```typescript
interface DestinationSelectorProps {
  checkoutType: CheckoutType;
  value: string;
  onChange: (value: string, siteId?: string, teamId?: string) => void;
}

// checkoutType별 UI:
// - calibration: 텍스트 입력 (교정기관명)
// - repair: 텍스트 입력 (수리업체명)
// - rental: 시험소 선택 → 팀 선택 (드롭다운)
```
