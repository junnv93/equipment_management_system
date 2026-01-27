# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-13: 반출/반입 관리 페이지

### 목적

시험소 외부 반출 및 반입 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 반출/반입 관리 페이지를 구현해줘.

역할 참고:
- test_engineer: 반출 신청, 반입 등록
- technical_manager: 승인, 반입 최종 승인

반출 유형:
- internal_calibration: 외부 교정 목적
- internal_repair: 외부 수리 목적
- inter_site_rental: 시험소간 대여

상태 흐름 (모든 목적 통합 - 1단계 승인):
- 모든 목적: pending → approved → checked_out → returned → return_approved

요구사항:
1. 반출 신청 페이지
   - 장비 선택
   - 반출 유형 선택
   - 반출 사유 및 상세 정보
   - 반출 기간 (예정 반입일)
   - 시험소간 대여 시: 빌려가는 시험소/팀 선택

2. 내 반출 목록
   - 내가 신청한 반출 목록
   - 상태별 필터
   - 반입 신청 버튼

3. 반출 관리 (기술책임자)
   - 반출 요청 목록
   - 승인/반려 버튼
   - 모든 반출 유형: 1단계 승인으로 통합

4. 반입 처리
   - 반입 검사 폼
   - 검사 항목 체크 (유형별 필수 항목)
     - 교정 목적: 교정 완료 여부
     - 수리 목적: 수리 완료 여부
     - 공통: 정상 작동 여부
   - 검사 메모
   - 시험소간 대여: 빌려준 측 확인

5. 반입 승인 (기술책임자)
   - 반입 승인 목록
   - 승인 버튼
   - 장비 상태 자동 복원

파일:
- apps/frontend/app/checkouts/page.tsx (내 반출 목록 - Server Component)
- apps/frontend/app/checkouts/loading.tsx (목록 로딩 상태)
- apps/frontend/app/checkouts/error.tsx (에러 핸들러 - 'use client')
- apps/frontend/app/checkouts/create/page.tsx (반출 신청 - Server Component)
- apps/frontend/app/checkouts/[id]/page.tsx (반출 상세 - Server Component)
- apps/frontend/app/checkouts/[id]/return/page.tsx (반입 등록)
- apps/frontend/app/checkouts/manage/page.tsx (반출 관리 - Server Component)
- apps/frontend/app/admin/return-approvals/page.tsx (반입 승인 - Server Component)
- apps/frontend/components/checkouts/CheckoutForm.tsx ('use client' - 폼 상호작용)
- apps/frontend/components/checkouts/CheckoutListClient.tsx ('use client' - 필터/정렬)
- apps/frontend/components/checkouts/ReturnInspectionForm.tsx ('use client' - 검사 폼)
- apps/frontend/components/checkouts/CheckoutTypeSelector.tsx ('use client' - 선택 UI)
- apps/frontend/components/checkouts/CheckoutStatusStepper.tsx (상태 진행 표시)
- apps/frontend/lib/api/checkout-api.ts (Client API)
- apps/frontend/lib/api/server/checkout-api-server.ts (Server API)

Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용):
- 동적 라우트 [id]는 params: Promise<{ id: string }> 패턴 사용
- page.tsx는 Server Component로 초기 데이터 fetch
- 폼/필터 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):
- Server Component에서 초기 목록 데이터 fetch (SEO, 초기 로드)
- 목록이 많을 경우 가상화(virtualization) 또는 페이지네이션
- 장비 선택 모달은 dynamic import로 지연 로딩
- 상태 변경 시 optimistic update 적용
- 아이콘 개별 import (lucide-react tree-shaking)

접근성 요구사항 (/web-design-guidelines 스킬 활용):
- 반출 상태 진행 표시: aria-current="step" 사용
- 검사 항목 체크박스: 명확한 label 연결, 그룹화 (role="group")
- 상태 변경 알림: aria-live="polite"로 스크린리더에 알림
- 승인/반려 버튼: aria-describedby로 대상 항목 연결
- 폼 에러 메시지: role="alert" 적용
- 키보드 탐색: Tab 순서 논리적 구성
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 날짜 선택기: 키보드로 조작 가능해야 함

디자인 요구사항 (/frontend-design 스킬 활용):
- 반출 유형별 색상 구분 (Badge 컴포넌트)
- 상태 진행 표시기 (Stepper 컴포넌트)
- 검사 항목 체크리스트 UI (Checkbox + Card)
- 반응형: 모바일에서 카드 뷰, 데스크톱에서 테이블 뷰

제약사항:
- 유형별 필수 검사 항목 검증
- 시험소간 대여는 양측 확인 필수
- 반입 승인 시 장비 상태 자동 복원
- Next.js 16 App Router 패턴 준수

검증:
- 반출 유형별 플로우 테스트
- 검사 항목 검증 테스트
- 양측 확인 테스트 (시험소간)
- pnpm tsc --noEmit

Playwright 테스트 (/playwright-skill 활용):
- 반출 신청 → 승인 → 반입 → 승인 전체 플로우
- 유형별 검사 항목 표시 확인
- 시험소간 대여 양측 확인
- 키보드 탐색 테스트
- 상태 변경 시 aria-live 알림 확인
- axe-core 접근성 검사

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

- 반출 유형에 따라 필수 검사 항목이 달라짐
- 시험소간 대여는 빌려주는 측과 빌려가는 측 모두 확인 필요
- 반입 승인 시 장비 상태가 자동으로 정상으로 복원됨
- 반출 중인 장비는 대여 신청 불가

### 이행 체크리스트 UI-13

**파일 생성:**
- [ ] checkouts/page.tsx 구현됨 (Server Component)
- [ ] checkouts/loading.tsx 생성됨
- [ ] checkouts/error.tsx 생성됨 ('use client')
- [ ] checkouts/create/page.tsx 구현됨 (Server Component)
- [ ] checkouts/[id]/page.tsx 구현됨 (Server Component, params Promise 패턴)
- [ ] checkouts/[id]/return/page.tsx 구현됨
- [ ] checkouts/manage/page.tsx 구현됨 (Server Component)
- [ ] admin/return-approvals/page.tsx 구현됨 (Server Component)

**컴포넌트 생성:**
- [ ] CheckoutForm.tsx 생성됨 ('use client')
- [ ] CheckoutListClient.tsx 생성됨 ('use client')
- [ ] ReturnInspectionForm.tsx 개선됨 ('use client')
- [ ] CheckoutTypeSelector.tsx 생성됨 ('use client')
- [ ] CheckoutStatusStepper.tsx 생성됨 (상태 진행 표시)

**API 함수:**
- [ ] checkout-api.ts (Client) 생성됨
- [ ] checkout-api-server.ts (Server) 생성됨

**기능 구현:**
- [ ] 유형별 검사 항목 구현됨
- [ ] 시험소간 대여 양측 확인 구현됨
- [ ] 상태 진행 표시기 구현됨

**성능 최적화 (vercel-react-best-practices):**
- [ ] Server Component에서 초기 데이터 fetch 구현
- [ ] 장비 선택 모달 dynamic import 적용
- [ ] 목록 페이지네이션 또는 가상화 적용
- [ ] optimistic update 적용

**접근성 (web-design-guidelines):**
- [ ] 상태 진행 표시에 aria-current="step" 적용
- [ ] 검사 체크박스 label 연결 및 그룹화
- [ ] 상태 변경 시 aria-live 알림 구현
- [ ] 승인/반려 버튼 aria-describedby 연결
- [ ] 폼 에러 메시지 role="alert" 적용
- [ ] 키보드 탐색 가능 확인
- [ ] 포커스 표시 스타일 적용

**테스트:**
- [ ] Playwright 테스트 작성됨 (checkouts.spec.ts)
- [ ] 키보드 탐색 테스트 추가됨
- [ ] aria-live 알림 테스트 추가됨
- [ ] axe-core 접근성 테스트 추가됨
- [ ] 모든 테스트 통과됨
- [ ] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/checkouts.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('반출/반입 관리', () => {
  test('외부 교정 반출 전체 플로우', async ({ testOperatorPage, techManagerPage }) => {
    // 시험실무자: 반출 신청
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.click('[data-testid="select-equipment"]');
    await testOperatorPage.click('[data-testid="equipment-1"]');
    await testOperatorPage.selectOption('[name="checkoutType"]', 'internal_calibration');
    await testOperatorPage.fill('[name="reason"]', '외부 교정 기관 교정');
    await testOperatorPage.fill('[name="expectedReturnDate"]', '2026-02-28');
    await testOperatorPage.click('[data-testid="submit-checkout"]');

    await expect(testOperatorPage.locator('[data-testid="status-pending"]')).toBeVisible();

    // 기술책임자: 승인
    await techManagerPage.goto('/checkouts/manage');
    await techManagerPage.click('[data-testid="pending-checkout-1"]');
    await techManagerPage.click('[data-testid="approve-button"]');

    await expect(techManagerPage.locator('[data-testid="status-approved"]')).toBeVisible();
  });

  test('반입 검사 및 승인', async ({ testOperatorPage, techManagerPage }) => {
    // 시험실무자: 반입 등록
    await testOperatorPage.goto('/checkouts');
    await testOperatorPage.click('[data-testid="checked-out-item-1"]');
    await testOperatorPage.click('[data-testid="register-return"]');

    // 교정 목적 필수 검사 항목
    await testOperatorPage.check('[data-testid="calibration-completed"]');
    await testOperatorPage.check('[data-testid="normal-operation"]');
    await testOperatorPage.fill('[name="inspectionNote"]', '교정 완료, 정상 작동 확인');
    await testOperatorPage.click('[data-testid="submit-return"]');

    await expect(testOperatorPage.locator('[data-testid="status-returned"]')).toBeVisible();

    // 기술책임자: 반입 승인
    await techManagerPage.goto('/admin/return-approvals');
    await techManagerPage.click('[data-testid="return-approval-1"]');
    await techManagerPage.click('[data-testid="approve-return"]');

    await expect(techManagerPage.locator('[data-testid="status-return-approved"]')).toBeVisible();
  });

  test('시험소간 대여 양측 확인', async ({ testOperatorPage, techManagerPage, siteAdminPage }) => {
    // 반출 신청 (시험소간 대여)
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.click('[data-testid="select-equipment"]');
    await testOperatorPage.click('[data-testid="equipment-2"]');
    await testOperatorPage.selectOption('[name="checkoutType"]', 'inter_site_rental');
    await testOperatorPage.selectOption('[name="targetSite"]', 'site-2');
    await testOperatorPage.selectOption('[name="targetTeam"]', 'team-3');
    await testOperatorPage.fill('[name="reason"]', '타 시험소 테스트 지원');
    await testOperatorPage.fill('[name="expectedReturnDate"]', '2026-03-15');
    await testOperatorPage.click('[data-testid="submit-checkout"]');

    // 빌려주는 측 승인
    await techManagerPage.goto('/checkouts/manage');
    await techManagerPage.click('[data-testid="inter-site-checkout-1"]');
    await techManagerPage.click('[data-testid="approve-button"]');

    // 빌려가는 측 확인 표시
    await expect(techManagerPage.locator('[data-testid="awaiting-receiver-confirmation"]')).toBeVisible();
  });

  test('유형별 검사 항목 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/checkouts/1/return');

    // 수리 목적인 경우 수리 완료 체크 필수
    await expect(testOperatorPage.locator('[data-testid="repair-completed"]')).toBeVisible();

    // 제출 시 필수 항목 검증
    await testOperatorPage.click('[data-testid="submit-return"]');
    await expect(testOperatorPage.locator('[data-testid="validation-error"]')).toBeVisible();
  });

  // 접근성 테스트 (web-design-guidelines)
  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/checkouts/create');

    // Tab으로 폼 요소 탐색
    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 포커스 표시 스타일 확인
    const hasRing = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.boxShadow.includes('rgb') || style.outlineStyle !== 'none';
    });
    expect(hasRing).toBeTruthy();
  });

  test('상태 진행 표시기 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/checkouts/1');

    // Stepper에 aria-current 속성 확인
    const currentStep = testOperatorPage.locator('[aria-current="step"]');
    await expect(currentStep).toBeVisible();
  });

  test('검사 체크박스 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/checkouts/1/return');

    // 체크박스 그룹화 확인
    const checkboxGroup = testOperatorPage.locator('[role="group"]');
    await expect(checkboxGroup).toBeVisible();

    // 각 체크박스에 label 연결 확인
    const checkbox = testOperatorPage.locator('input[type="checkbox"]').first();
    const checkboxId = await checkbox.getAttribute('id');
    const label = testOperatorPage.locator(`label[for="${checkboxId}"]`);
    await expect(label).toBeVisible();
  });

  test('상태 변경 시 aria-live 알림', async ({ techManagerPage }) => {
    await techManagerPage.goto('/checkouts/manage');

    // 승인 버튼 클릭
    await techManagerPage.click('[data-testid="approve-button"]');

    // aria-live 영역에 알림 표시 확인
    const liveRegion = techManagerPage.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/승인|완료/);
  });

  test('axe-core 접근성 검사', async ({ testOperatorPage }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;

    await testOperatorPage.goto('/checkouts');

    const results = await new AxeBuilder({ page: testOperatorPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```
