# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-12: 대여 관리 페이지

### 목적

시험소 내 장비 대여 신청 및 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 대여 관리 페이지를 구현해줘.

역할 참고:
- test_engineer: 대여 신청, 반납
- technical_manager: 소유 팀 장비 대여 승인

대여 상태 흐름:
pending → approved/rejected → active → returned

요구사항:
1. 대여 신청 페이지
   - 장비 선택 (팀 내 또는 타 팀 장비)
   - 대여 사유 입력
   - 대여 기간 설정 (시작일, 반납예정일)
   - 동일 팀 장비는 자동 승인 안내

2. 내 대여 목록
   - 내가 신청한 대여 목록
   - 상태별 필터 (신청중, 대여중, 반납완료)
   - 반납 버튼

3. 대여 관리 (기술책임자)
   - 팀 장비 대여 요청 목록
   - 승인/반려 버튼
   - 반려 사유 입력

4. 대여 현황 (전체)
   - 현재 대여 중인 장비 목록
   - 연체 장비 하이라이트
   - 대여 기록 통계

5. 반납 처리
   - 반납 버튼
   - 장비 상태 확인 체크박스
   - 반납 메모

파일:
- apps/frontend/app/rentals/page.tsx (내 대여 목록 - Server Component)
- apps/frontend/app/rentals/loading.tsx (목록 로딩 상태)
- apps/frontend/app/rentals/error.tsx (에러 핸들러 - 'use client')
- apps/frontend/app/rentals/create/page.tsx (대여 신청 - Server Component)
- apps/frontend/app/rentals/[id]/page.tsx (대여 상세 - Server Component, params Promise)
- apps/frontend/app/rentals/[id]/return/page.tsx (반납 처리)
- apps/frontend/app/rentals/manage/page.tsx (대여 관리 - Server Component)
- apps/frontend/components/rentals/RentalForm.tsx ('use client' - 폼 상호작용)
- apps/frontend/components/rentals/RentalListClient.tsx ('use client' - 필터/정렬)
- apps/frontend/components/rentals/RentalApprovalList.tsx ('use client' - 승인 액션)
- apps/frontend/components/rentals/ReturnForm.tsx ('use client' - 반납 폼)
- apps/frontend/components/rentals/RentalStatusStepper.tsx (상태 진행 표시)
- apps/frontend/components/rentals/DateRangePicker.tsx ('use client' - 캘린더)
- apps/frontend/lib/api/rental-api.ts (Client API)
- apps/frontend/lib/api/server/rental-api-server.ts (Server API)

Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용):
- 동적 라우트 [id]는 params: Promise<{ id: string }> 패턴 사용
- page.tsx는 Server Component로 초기 데이터 fetch
- 폼/필터/캘린더 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):
- Server Component에서 초기 목록 데이터 fetch (SEO, 초기 로드)
- 캘린더/날짜 선택기는 dynamic import로 지연 로딩
- 장비 선택 모달은 dynamic import로 지연 로딩
- 목록이 많을 경우 페이지네이션 또는 무한 스크롤
- 상태 변경 시 optimistic update 적용
- 아이콘 개별 import (lucide-react tree-shaking)

접근성 요구사항 (/web-design-guidelines 스킬 활용):
- 날짜 선택기: 키보드로 조작 가능, aria-label 적용
- 대여 상태 진행 표시: aria-current="step" 사용
- 연체 알림: role="alert"로 시각장애인에게 알림
- 승인/반려 버튼: aria-describedby로 대상 항목 연결
- 폼 에러 메시지: role="alert" aria-live="polite" 적용
- 상태 변경 알림: aria-live="polite"로 스크린리더에 알림
- 키보드 탐색: Tab 순서 논리적 구성
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 색상 대비: 연체 표시 시 색상만으로 구분하지 않고 아이콘/텍스트 함께 사용

디자인 요구사항 (/frontend-design 스킬 활용):
- 대여 기간 캘린더 선택 (DateRangePicker)
- 상태별 색상 (UL 색상 팔레트):
  - pending: UL Warning (#FF9D55) - 승인대기
  - approved: UL Info (#BCE4F7) - 승인됨
  - active: UL Midnight Blue (#122C49) - 대여중
  - returned: UL Green (#00A451) - 반납완료
  - rejected: UL Fog (#577E9E) - 반려됨
  - overdue: UL Red (#CA0123) - 연체
- 연체 장비: UL Red 배경 + 경고 아이콘 + "연체" 텍스트
- 상태 진행 표시기 (Stepper 컴포넌트)
- 반응형: 모바일에서 카드 뷰, 데스크톱에서 테이블 뷰
- 애니메이션:
  - 상태 변경 시 배지 색상 트랜지션
  - 승인/반려 버튼 클릭 시 feedback 애니메이션
  - 목록 아이템 stagger 애니메이션 (순차 등장)
  - 연체 항목 subtle pulse 효과 (주의 환기)
  - 반납 완료 시 success 체크 애니메이션

에러 처리 요구사항:
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수, reset 함수 제공)
- API 에러 시 ErrorAlert 컴포넌트 표시 (재시도 버튼 포함)
- 폼 제출 실패 시 필드별 에러 메시지 표시 (role="alert")
- 401 응답 시 로그인 페이지 리다이렉트
- 403 응답 시 "권한이 없습니다" 메시지 표시
- 대여 불가 장비 선택 시 즉시 피드백 (부적합/반출 중 사유 표시)

제약사항:
- 동일 팀 대여는 auto_approved = true
- 반납 기한 초과 시 연체 표시
- 부적합/반출 중 장비는 대여 불가
- Next.js 16 App Router 패턴 준수

검증:
- 대여 신청 플로우
- 승인/반려 플로우
- 반납 처리 테스트
- pnpm tsc --noEmit

Playwright 테스트 (/playwright-skill 활용):
- 대여 신청 → 승인 → 반납 전체 플로우
- 자동 승인 확인 (동일 팀)
- 연체 표시 확인
- 키보드 탐색 테스트 (날짜 선택기 포함)
- 상태 변경 시 aria-live 알림 확인
- axe-core 접근성 검사

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

- 동일 팀 장비 대여 시 자동 승인 처리
- 타 팀 장비 대여 시 해당 팀 기술책임자 승인 필요
- 반납 기한 초과 시 연체 상태로 표시 (빨간색 하이라이트)
- 부적합 또는 반출 중인 장비는 대여 신청 불가

### 이행 체크리스트 UI-12

**파일 생성:**
- [ ] rentals/page.tsx 구현됨 (Server Component)
- [ ] rentals/loading.tsx 생성됨
- [ ] rentals/error.tsx 생성됨 ('use client')
- [ ] rentals/create/page.tsx 구현됨 (Server Component)
- [ ] rentals/[id]/page.tsx 구현됨 (Server Component, params Promise)
- [ ] rentals/[id]/return/page.tsx 구현됨
- [ ] rentals/manage/page.tsx 구현됨 (Server Component)

**컴포넌트 생성:**
- [ ] RentalForm.tsx 생성됨 ('use client')
- [ ] RentalListClient.tsx 생성됨 ('use client')
- [ ] RentalApprovalList.tsx 생성됨 ('use client')
- [ ] ReturnForm.tsx 생성됨 ('use client')
- [ ] RentalStatusStepper.tsx 생성됨 (상태 진행 표시)
- [ ] DateRangePicker.tsx 생성됨 ('use client')

**API 함수:**
- [ ] rental-api.ts (Client) 생성됨
- [ ] rental-api-server.ts (Server) 생성됨

**기능 구현:**
- [ ] 자동 승인 로직 구현됨 (동일 팀)
- [ ] 연체 표시 구현됨
- [ ] 상태 진행 표시기 구현됨

**디자인 관련:**
- [ ] UL 색상 팔레트 사용됨 (상태별 색상)
- [ ] 연체 항목 pulse 효과 적용됨
- [ ] 상태 변경 시 배지 트랜지션 적용됨
- [ ] 반납 완료 시 success 애니메이션 적용됨

**에러 처리 관련:**
- [ ] error.tsx 에러 핸들러 구현됨
- [ ] API 에러 시 ErrorAlert 표시됨
- [ ] 폼 제출 실패 시 필드별 에러 메시지 표시됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트됨
- [ ] 대여 불가 장비 선택 시 즉시 피드백 제공됨

**성능 최적화 (vercel-react-best-practices):**
- [ ] Server Component에서 초기 데이터 fetch 구현
- [ ] 캘린더/날짜 선택기 dynamic import 적용
- [ ] 장비 선택 모달 dynamic import 적용
- [ ] 목록 페이지네이션 또는 무한 스크롤 적용
- [ ] optimistic update 적용

**접근성 (web-design-guidelines):**
- [ ] 날짜 선택기 키보드 조작 가능 확인
- [ ] 상태 진행 표시에 aria-current="step" 적용
- [ ] 연체 알림 role="alert" 적용
- [ ] 승인/반려 버튼 aria-describedby 연결
- [ ] 폼 에러 메시지 role="alert" 적용
- [ ] 상태 변경 시 aria-live 알림 구현
- [ ] 키보드 탐색 가능 확인
- [ ] 포커스 표시 스타일 적용
- [ ] 연체 표시 색상 외 아이콘/텍스트 추가

**테스트:**
- [ ] Playwright 테스트 작성됨 (rentals.spec.ts)
- [ ] 키보드 탐색 테스트 추가됨
- [ ] aria-live 알림 테스트 추가됨
- [ ] axe-core 접근성 테스트 추가됨
- [ ] 모든 테스트 통과됨
- [ ] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/rentals.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('대여 관리', () => {
  test('타 팀 장비 대여 신청 및 승인 플로우', async ({ testOperatorPage, techManagerPage }) => {
    // 시험실무자: 대여 신청
    await testOperatorPage.goto('/rentals/create');
    await testOperatorPage.click('[data-testid="select-equipment"]');
    await testOperatorPage.click('[data-testid="other-team-equipment-1"]');
    await testOperatorPage.fill('[name="reason"]', '테스트 진행을 위한 장비 대여');
    await testOperatorPage.fill('[name="startDate"]', '2026-02-01');
    await testOperatorPage.fill('[name="expectedReturnDate"]', '2026-02-15');
    await testOperatorPage.click('[data-testid="submit-rental"]');

    await expect(testOperatorPage.locator('[data-testid="status-pending"]')).toBeVisible();

    // 기술책임자: 승인
    await techManagerPage.goto('/rentals/manage');
    await techManagerPage.click('[data-testid="pending-rental-1"]');
    await techManagerPage.click('[data-testid="approve-button"]');

    await expect(techManagerPage.locator('[data-testid="status-approved"]')).toBeVisible();
  });

  test('동일 팀 장비 자동 승인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals/create');
    await testOperatorPage.click('[data-testid="select-equipment"]');
    await testOperatorPage.click('[data-testid="same-team-equipment-1"]');
    await testOperatorPage.fill('[name="reason"]', '내부 테스트');
    await testOperatorPage.fill('[name="startDate"]', '2026-02-01');
    await testOperatorPage.fill('[name="expectedReturnDate"]', '2026-02-07');
    await testOperatorPage.click('[data-testid="submit-rental"]');

    // 동일 팀은 자동 승인
    await expect(testOperatorPage.locator('[data-testid="auto-approved-message"]')).toBeVisible();
    await expect(testOperatorPage.locator('[data-testid="status-active"]')).toBeVisible();
  });

  test('반납 처리', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals');
    await testOperatorPage.click('[data-testid="active-rental-1"]');
    await testOperatorPage.click('[data-testid="return-button"]');

    // 반납 폼
    await testOperatorPage.check('[data-testid="condition-check"]');
    await testOperatorPage.fill('[name="returnNote"]', '정상 상태로 반납');
    await testOperatorPage.click('[data-testid="confirm-return"]');

    await expect(testOperatorPage.locator('[data-testid="status-returned"]')).toBeVisible();
  });

  test('연체 장비 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals');

    // 연체 장비는 빨간색 배경 + 아이콘/텍스트
    const overdueItem = testOperatorPage.locator('[data-testid="overdue-rental"]');
    await expect(overdueItem).toHaveClass(/bg-red/);

    // 연체 알림이 role="alert"으로 표시되는지 확인
    const overdueAlert = overdueItem.locator('[role="alert"]');
    await expect(overdueAlert).toBeVisible();
  });

  // 접근성 테스트 (web-design-guidelines)
  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals/create');

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

  test('날짜 선택기 키보드 조작', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals/create');

    // 날짜 선택기에 포커스
    const datePicker = testOperatorPage.locator('[data-testid="start-date-picker"]');
    await datePicker.focus();

    // Enter로 캘린더 열기
    await testOperatorPage.keyboard.press('Enter');

    // 캘린더가 열렸는지 확인
    const calendar = testOperatorPage.locator('[role="dialog"], [role="grid"]');
    await expect(calendar).toBeVisible();

    // 화살표 키로 날짜 탐색
    await testOperatorPage.keyboard.press('ArrowRight');
    await testOperatorPage.keyboard.press('Enter');
  });

  test('상태 진행 표시기 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals/1');

    // Stepper에 aria-current 속성 확인
    const currentStep = testOperatorPage.locator('[aria-current="step"]');
    await expect(currentStep).toBeVisible();
  });

  test('상태 변경 시 aria-live 알림', async ({ techManagerPage }) => {
    await techManagerPage.goto('/rentals/manage');

    // 승인 버튼 클릭
    await techManagerPage.click('[data-testid="approve-button"]');

    // aria-live 영역에 알림 표시 확인
    const liveRegion = techManagerPage.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/승인|완료/);
  });

  test('axe-core 접근성 검사', async ({ testOperatorPage }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;

    await testOperatorPage.goto('/rentals');

    const results = await new AxeBuilder({ page: testOperatorPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('폼 에러 메시지 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/rentals/create');

    // 필수 필드 비워둔 채 제출
    await testOperatorPage.click('[data-testid="submit-rental"]');

    // 에러 메시지에 role="alert" 확인
    const errorMessage = testOperatorPage.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });
});
```
