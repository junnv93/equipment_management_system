# UI-14: 공용/렌탈장비 관리 페이지

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.

---

## 목적

타 팀 공용장비 및 외부 렌탈장비의 임시등록, 사용 신청, 반납 관리 페이지를 구현합니다.

**핵심 원칙:**

- 공용장비와 렌탈장비는 **임시등록** 후 사용
- 교정성적서 유효성 확인 필수
- 사용 완료 후 **비활성** 상태로 전환

---

## 비즈니스 로직 정의

### 공용장비 vs 렌탈장비 구분

| 구분      | 공용장비                                 | 렌탈장비                                                     |
| --------- | ---------------------------------------- | ------------------------------------------------------------ |
| 정의      | 타 팀(Safety 등)에서 관리하는 장비       | 외부 렌탈업체에서 대여한 장비                                |
| 소유처    | Safety팀, Battery팀 등                   | 렌탈업체명                                                   |
| 관련 양식 | 공용 장비 사용/반납 확인서 (UL-QP-18-10) | 장비 반·출입 확인서 (UL-QP-18-06) + 검수확인서 (UL-QP-06-05) |
| 위치      | 같은 시험소 내                           | 외부에서 반입                                                |

### 임시등록 필수 항목

| 항목           | 필수 | 설명                   |
| -------------- | ---- | ---------------------- |
| 장비명         | ✓    | 장비 명칭              |
| 모델명         | ✓    | 제조사 모델명          |
| 시리얼넘버     | ✓    | 고유 식별번호          |
| 소유처         | ✓    | Safety팀/렌탈업체명 등 |
| 교정성적서     | ✓    | 파일 첨부              |
| 교정일자       | ✓    | 최근 교정일            |
| 차기교정일     | ✓    | 교정 유효기간 확인용   |
| 사용 예정 기간 | ✓    | 시작일 ~ 종료일        |

### 상태 흐름

```
[공용장비]
임시등록 → 사용신청 → 기술책임자 승인 → 사용중 → 반납요청 → 반납승인 → 비활성

[렌탈장비]
임시등록 → 입고검수 → 기술책임자 확인 → 반입처리 → 사용가능 → (정규장비처럼 관리) → 반출처리 → 비활성
```

---

## 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 공용/렌탈장비 관리 페이지를 구현해줘.

역할 참고:
- test_engineer: 임시등록, 사용 신청, 반납 요청
- technical_manager: 사용 승인, 검수 확인, 반납 승인

장비 유형:
- common: 공용장비 (타 팀 장비)
- rental: 렌탈장비 (외부 대여)

상태 흐름:

공용장비:
- temporary → use_requested → in_use → return_requested → inactive

렌탈장비:
- temporary → inspection_pending → available → (정규 장비처럼 관리) → inactive

요구사항:

1. 임시등록 페이지
   - 장비 유형 선택 (공용/렌탈)
   - 기본 정보 입력 (장비명, 모델명, 시리얼넘버)
   - 소유처 입력
     - 공용: 팀 선택 (Safety, Battery 등)
     - 렌탈: 업체명 직접 입력
   - 교정 정보 입력 (교정성적서 첨부, 교정일자, 차기교정일)
   - 사용 예정 기간 입력
   - 교정 유효기간 자동 검증 (차기교정일이 사용 종료일 이후인지)

2. 공용장비 사용 신청
   - 임시등록된 공용장비 목록
   - 사용 신청 버튼
   - 신청 시 사용 목적 입력
   - 양식 자동 생성: 공용 장비 사용/반납 확인서 (UL-QP-18-10)

3. 렌탈장비 입고 검수
   - 임시등록된 렌탈장비 목록
   - 검수 폼
     - 기능/작동상태 확인
     - 외관 상태 확인
     - 교정 상태 확인
     - 부속품 확인
   - 양식 자동 생성: 검수확인서 (UL-QP-06-05)
   - 검수 완료 시 반입 처리 (장비 반·출입 확인서 생성)

4. 사용 현황 목록
   - 현재 사용 중인 공용/렌탈장비 목록
   - 사용 기간 표시 (D-day 또는 초과일수)
   - 상태별 필터 (사용중/반납대기/비활성)
   - 유형별 필터 (공용/렌탈)

5. 반납 처리
   - 공용장비: 반납 요청 → 기술책임자 승인 → 비활성
   - 렌탈장비: 반출 처리 → 기술책임자 승인 → 비활성
   - 장비 이상 여부 확인
   - 양식 자동 생성

6. 승인 관리 (기술책임자)
   - 공용장비 사용 승인
   - 렌탈장비 검수 확인
   - 반납/반출 승인
   - 교정 유효성 최종 확인

파일 구조:

pages:
- apps/frontend/app/(dashboard)/common-equipment/page.tsx (목록 - Server Component)
- apps/frontend/app/(dashboard)/common-equipment/loading.tsx
- apps/frontend/app/(dashboard)/common-equipment/error.tsx ('use client')
- apps/frontend/app/(dashboard)/common-equipment/register/page.tsx (임시등록)
- apps/frontend/app/(dashboard)/common-equipment/[id]/page.tsx (상세)
- apps/frontend/app/(dashboard)/common-equipment/[id]/request/page.tsx (사용 신청)
- apps/frontend/app/(dashboard)/common-equipment/[id]/inspection/page.tsx (입고 검수)
- apps/frontend/app/(dashboard)/common-equipment/[id]/return/page.tsx (반납 처리)
- apps/frontend/app/(dashboard)/admin/common-equipment-approvals/page.tsx (승인 관리)

components:
- apps/frontend/components/common-equipment/TemporaryRegistrationForm.tsx ('use client')
- apps/frontend/components/common-equipment/CommonEquipmentList.tsx ('use client')
- apps/frontend/components/common-equipment/EquipmentTypeSelector.tsx ('use client')
- apps/frontend/components/common-equipment/OwnerSelector.tsx ('use client')
- apps/frontend/components/common-equipment/CalibrationValidityChecker.tsx (유효성 검증)
- apps/frontend/components/common-equipment/InspectionForm.tsx ('use client')
- apps/frontend/components/common-equipment/UsageRequestForm.tsx ('use client')
- apps/frontend/components/common-equipment/ReturnForm.tsx ('use client')
- apps/frontend/components/common-equipment/UsagePeriodBadge.tsx (사용 기간 표시)

api:
- apps/frontend/lib/api/common-equipment-api.ts (Client)
- apps/frontend/lib/api/server/common-equipment-api-server.ts (Server)

타입 정의:

// 장비 유형
type CommonEquipmentType = 'common' | 'rental';

// 상태
type CommonEquipmentStatus =
  | 'temporary'           // 임시등록
  | 'use_requested'       // 사용 신청됨 (공용)
  | 'inspection_pending'  // 검수 대기 (렌탈)
  | 'available'           // 사용 가능
  | 'in_use'              // 사용 중
  | 'return_requested'    // 반납 요청됨
  | 'inactive';           // 비활성 (사용 완료)

// 임시등록 정보
interface TemporaryEquipment {
  id: string;
  type: CommonEquipmentType;
  name: string;
  modelName: string;
  serialNumber: string;
  owner: string;              // 소유처 (팀명 또는 업체명)
  calibrationCertificate: Attachment;
  calibrationDate: string;
  nextCalibrationDate: string;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  status: CommonEquipmentStatus;
  registeredBy: string;
  registeredAt: string;
}

// 입고 검수
interface InspectionRecord {
  equipmentId: string;
  functionalStatus: 'normal' | 'abnormal';
  appearanceStatus: 'normal' | 'abnormal';
  calibrationStatus: 'valid' | 'invalid';
  accessoriesStatus: 'complete' | 'incomplete';
  abnormalDetails?: string;
  inspectedBy: string;
  inspectedAt: string;
}

Next.js 16 패턴 요구사항:
- 동적 라우트 [id]는 params: Promise<{ id: string }> 패턴 사용
- page.tsx는 Server Component로 초기 데이터 fetch
- 폼/필터 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공

성능 최적화 요구사항:
- Server Component에서 초기 목록 데이터 fetch
- 교정성적서 미리보기는 dynamic import
- 목록 페이지네이션 적용
- 상태 변경 시 optimistic update

접근성 요구사항:
- 유형 선택: role="radiogroup" 사용
- 교정 유효성 경고: role="alert" 사용
- 사용 기간 초과 표시: aria-label로 상태 설명
- 폼 에러 메시지: role="alert" 적용
- 키보드 탐색 가능

디자인 요구사항:
- 장비 유형별 색상 구분 (Badge)
  - 공용: blue
  - 렌탈: purple
- 사용 기간 표시
  - 정상: green
  - D-7 이내: yellow
  - 초과: red
- 교정 유효성 경고 표시 (빨간색 Alert)
- 검수 체크리스트 UI

제약사항:
- 교정 유효기간이 사용 종료일 이전인 경우 등록 불가
- 검수 미완료 렌탈장비는 사용 불가
- 사용 기간 초과 시 알림 발송
- 반납 시 장비 이상 여부 확인 필수

검증:
- 공용장비 사용 신청 → 승인 → 사용 → 반납 플로우
- 렌탈장비 등록 → 검수 → 사용 → 반출 플로우
- 교정 유효성 검증 테스트
- 사용 기간 초과 알림 테스트

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

---

## 상태 흐름 다이어그램

### 공용장비

```
┌─────────────────────────────────────────────────────────────┐
│                    공용장비 사용 프로세스                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [시험실무자]                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │ 임시등록     │  - 장비 정보 입력                          │
│  │             │  - 교정성적서 첨부                          │
│  │             │  - 사용 예정 기간                          │
│  └──────┬──────┘                                           │
│         │ 상태: 'temporary'                                 │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 사용 신청    │  공용 장비 사용/반납 확인서                 │
│  │             │  (UL-QP-18-10)                            │
│  └──────┬──────┘                                           │
│         │ 상태: 'use_requested'                             │
│         ▼                                                   │
│  [기술책임자]                                                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 사용 승인    │  - 교정 유효성 확인                        │
│  └──────┬──────┘                                           │
│         │ 상태: 'in_use'                                    │
│         ▼                                                   │
│     사용 기간 중                                             │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 반납 요청    │  - 장비 이상 여부 확인                     │
│  └──────┬──────┘                                           │
│         │ 상태: 'return_requested'                          │
│         ▼                                                   │
│  [기술책임자] 반납 승인                                      │
│         │                                                   │
│         ▼                                                   │
│     상태: 'inactive'                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 렌탈장비

```
┌─────────────────────────────────────────────────────────────┐
│                    렌탈장비 사용 프로세스                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [시험실무자]                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │ 임시등록     │  - 장비 정보 입력                          │
│  │             │  - 교정성적서 첨부                          │
│  │             │  - 렌탈 기간                               │
│  └──────┬──────┘                                           │
│         │ 상태: 'temporary'                                 │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 입고 검수    │  검수확인서 (UL-QP-06-05) 작성             │
│  │             │  - 기능/작동상태 확인                       │
│  │             │  - 교정 상태 확인                          │
│  └──────┬──────┘                                           │
│         │ 상태: 'inspection_pending'                        │
│         ▼                                                   │
│  [기술책임자] 검수 확인                                       │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 반입 처리    │  장비 반·출입 확인서 (UL-QP-18-06)         │
│  └──────┬──────┘                                           │
│         │ 상태: 'available'                                 │
│         ▼                                                   │
│     정규 장비처럼 관리                                       │
│     (UL-QP-18 7항 적용)                                     │
│         │                                                   │
│         ▼                                                   │
│  [렌탈 종료 시]                                              │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 반출 처리    │  - 장비 상태 확인                          │
│  │             │  - 반출 확인서 작성                        │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  [기술책임자] 반출 승인                                       │
│         │                                                   │
│         ▼                                                   │
│     상태: 'inactive'                                        │
│     이력카드에 반납 기록                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 이행 체크리스트 UI-14

### 파일 생성

- [ ] common-equipment/page.tsx 구현됨 (Server Component)
- [ ] common-equipment/loading.tsx 생성됨
- [ ] common-equipment/error.tsx 생성됨 ('use client')
- [ ] common-equipment/register/page.tsx 구현됨 (임시등록)
- [ ] common-equipment/[id]/page.tsx 구현됨 (상세)
- [ ] common-equipment/[id]/request/page.tsx 구현됨 (사용 신청)
- [ ] common-equipment/[id]/inspection/page.tsx 구현됨 (입고 검수)
- [ ] common-equipment/[id]/return/page.tsx 구현됨 (반납 처리)
- [ ] admin/common-equipment-approvals/page.tsx 구현됨 (승인 관리)

### 컴포넌트 생성

- [ ] TemporaryRegistrationForm.tsx 생성됨 ('use client')
- [ ] CommonEquipmentList.tsx 생성됨 ('use client')
- [ ] EquipmentTypeSelector.tsx 생성됨 ('use client')
- [ ] OwnerSelector.tsx 생성됨 ('use client')
- [ ] CalibrationValidityChecker.tsx 생성됨
- [ ] InspectionForm.tsx 생성됨 ('use client')
- [ ] UsageRequestForm.tsx 생성됨 ('use client')
- [ ] ReturnForm.tsx 생성됨 ('use client')
- [ ] UsagePeriodBadge.tsx 생성됨

### API 함수

- [ ] common-equipment-api.ts (Client) 생성됨
- [ ] common-equipment-api-server.ts (Server) 생성됨

### 기능 구현

- [ ] 공용/렌탈 구분 임시등록 구현됨
- [ ] 교정 유효성 자동 검증 구현됨
- [ ] 공용장비 사용 신청/승인 구현됨
- [ ] 렌탈장비 입고 검수 구현됨
- [ ] 반납/반출 처리 구현됨
- [ ] 사용 기간 초과 알림 구현됨
- [ ] 양식 자동 생성 구현됨

### 접근성

- [ ] 유형 선택 role="radiogroup" 적용됨
- [ ] 교정 유효성 경고 role="alert" 적용됨
- [ ] 사용 기간 상태 aria-label 적용됨
- [ ] 키보드 탐색 가능 확인됨

### 테스트

- [ ] Playwright 테스트 작성됨
- [ ] 공용장비 전체 플로우 테스트됨
- [ ] 렌탈장비 전체 플로우 테스트됨
- [ ] 교정 유효성 검증 테스트됨
- [ ] pnpm tsc --noEmit 성공

---

## Playwright 테스트 예시

```typescript
// tests/e2e/common-equipment.spec.ts
import { test, expect, Page } from '@playwright/test';

async function loginAs(page: Page, role: 'test_engineer' | 'technical_manager') {
  await page.goto('/api/auth/signin');
  const csrfToken = await page.locator('input[name="csrfToken"]').inputValue();
  await page.request.post('/api/auth/callback/test-login', {
    form: { role, csrfToken, json: 'true' },
  });
  await page.reload();
}

test.describe('공용장비 관리', () => {
  test('공용장비 임시등록 및 사용 신청', async ({ page }) => {
    await loginAs(page, 'test_engineer');
    await page.goto('/common-equipment/register');

    // 유형 선택
    await page.getByRole('radio', { name: '공용장비' }).check();

    // 기본 정보 입력
    await page.fill('[name="name"]', '파워미터');
    await page.fill('[name="modelName"]', 'N1912A');
    await page.fill('[name="serialNumber"]', 'MY12345678');

    // 소유처 선택
    await page.selectOption('[name="owner"]', 'Safety팀');

    // 교정 정보
    await page.setInputFiles('[name="calibrationCertificate"]', 'test-files/cert.pdf');
    await page.fill('[name="calibrationDate"]', '2025-01-01');
    await page.fill('[name="nextCalibrationDate"]', '2026-01-01');

    // 사용 기간
    await page.fill('[name="usagePeriodStart"]', '2025-02-01');
    await page.fill('[name="usagePeriodEnd"]', '2025-02-28');

    await page.click('[data-testid="submit-registration"]');

    // 등록 완료 확인
    await expect(page.getByText('임시등록이 완료되었습니다')).toBeVisible();
  });

  test('교정 유효기간 검증 - 사용 종료일 이후여야 함', async ({ page }) => {
    await loginAs(page, 'test_engineer');
    await page.goto('/common-equipment/register');

    await page.getByRole('radio', { name: '공용장비' }).check();
    await page.fill('[name="name"]', '파워미터');

    // 차기교정일이 사용 종료일 이전
    await page.fill('[name="nextCalibrationDate"]', '2025-02-15');
    await page.fill('[name="usagePeriodEnd"]', '2025-02-28');

    // 경고 메시지 표시
    await expect(page.getByRole('alert')).toContainText('교정 유효기간');
  });
});

test.describe('렌탈장비 관리', () => {
  test('렌탈장비 입고 검수', async ({ page }) => {
    await loginAs(page, 'test_engineer');
    await page.goto('/common-equipment/1/inspection');

    // 검수 항목 확인
    await page.check('[data-testid="functional-normal"]');
    await page.check('[data-testid="appearance-normal"]');
    await page.check('[data-testid="calibration-valid"]');
    await page.check('[data-testid="accessories-complete"]');

    await page.click('[data-testid="submit-inspection"]');

    await expect(page.getByText('검수가 완료되었습니다')).toBeVisible();
  });

  test('기술책임자 검수 확인 및 반입 처리', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/common-equipment-approvals');

    // 검수 대기 항목 확인
    const item = page.getByTestId('inspection-pending-1');
    await item.getByRole('button', { name: '검수 확인' }).click();

    // 반입 처리 자동 진행
    await expect(page.getByText('반입 처리가 완료되었습니다')).toBeVisible();
  });
});
```
