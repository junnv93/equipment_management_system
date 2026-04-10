# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-1: 역할별 대시보드 페이지

### 목적

사용자 역할에 따른 맞춤형 대시보드를 제공합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 역할별 대시보드 페이지를 구현해줘.

역할 참고:
- test_engineer (시험실무자): 내 장비 현황, 내 요청 상태, 교정 예정 장비
- technical_manager (기술책임자): 승인 대기 항목, 팀 장비 현황, 교정 일정
- lab_manager (시험소 관리자): 시험소 전체 현황, 승인 대기, 교정계획서 관리
- system_admin (시스템 관리자): 전체 시스템 현황, 모든 승인 대기, 시스템 알림

요구사항:
1. 대시보드 레이아웃
   - 상단: 환영 메시지 및 빠른 액션 버튼
   - 중앙: 승인 대기 카운트 카드 (장비/교정/대여/반출)
   - 하단: 최근 활동 목록 (역할별 다른 항목)

2. 승인 대기 카드
   - 카테고리별 카운트 표시 (장비, 교정, 대여, 반출, 보정계수, 소프트웨어)
   - 클릭 시 해당 승인 페이지로 이동
   - 시험실무자는 자신의 요청만 표시
   - 기술책임자는 팀 내 대기 항목 표시
   - 관리자는 전체 대기 항목 표시

3. 최근 활동 목록
   - 최근 7일간 활동 표시
   - 역할별 관련 활동만 필터링
   - 무한 스크롤 또는 페이지네이션

4. 빠른 액션 버튼
   - 시험실무자: 장비 등록, 대여 신청, 반출 신청
   - 기술책임자: 승인 관리, 교정 등록
   - 관리자: 사용자 관리, 시스템 설정

파일:
- apps/frontend/app/dashboard/page.tsx (메인 대시보드 - Server Component)
- apps/frontend/app/dashboard/loading.tsx (로딩 상태)
- apps/frontend/app/dashboard/error.tsx (에러 핸들링 - 'use client' 필수)
- apps/frontend/components/dashboard/DashboardClient.tsx (Client Component)
- apps/frontend/components/dashboard/PendingApprovalCard.tsx
- apps/frontend/components/dashboard/RecentActivityList.tsx
- apps/frontend/components/dashboard/QuickActionButtons.tsx
- apps/frontend/components/dashboard/WelcomeHeader.tsx
- apps/frontend/lib/api/dashboard-api.ts

디자인 요구사항 (/frontend-design 스킬 활용):
- 카드 레이아웃은 그리드 시스템 사용 (2x3 또는 3x2)
- 승인 대기 카운트는 Badge 또는 숫자 강조
- 역할별 색상 구분 (시험실무자: blue, 기술책임자: green, 관리자: purple)
- 다크모드 지원

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):
- Server Component에서 초기 데이터 fetch, Client Component로 전달
- 큰 컴포넌트(차트, 통계 그래프)는 dynamic import로 지연 로딩
- next/image 사용하여 아이콘/이미지 최적화
- 불필요한 리렌더 방지 (React.memo, useMemo 적절히 활용)
- Barrel exports 피하기 - 직접 import 사용

접근성 요구사항 (/web-design-guidelines 스킬 활용):
- 모든 카드에 적절한 role 및 aria-label 속성 부여
- 승인 대기 카운트 변경 시 aria-live="polite"로 스크린 리더에 알림
- 키보드 탐색: Tab으로 모든 인터랙티브 요소 접근 가능
- 포커스 표시: focus-visible 스타일 명확히 적용
- 색상 대비: WCAG 2.1 AA 기준 4.5:1 이상 유지
- 빠른 액션 버튼에 aria-describedby로 설명 연결

제약사항:
- Next.js 16 App Router 패턴 사용
- Server Components 우선, 필요 시 Client Components
- API 호출은 Server Actions 또는 클라이언트 fetch
- 로딩 상태 및 에러 핸들링 필수 (loading.tsx, error.tsx)

검증:
- pnpm dev로 각 역할별 대시보드 확인
- pnpm tsc --noEmit
- Playwright 테스트 작성 및 실행

Playwright 테스트 (/playwright-skill 활용):
- 각 역할별 대시보드 렌더링 확인
- 승인 대기 카운트 클릭 시 페이지 이동 확인
- 빠른 액션 버튼 동작 확인
- 반응형 레이아웃 확인 (모바일/태블릿/데스크톱)
- 접근성 테스트: 키보드 탐색, ARIA 속성 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-1

**파일 생성:**

- [x] dashboard/page.tsx 생성됨 (Server Component)
- [x] dashboard/error.tsx 생성됨 ('use client' 포함)
- [x] dashboard/loading.tsx 생성됨
- [x] DashboardClient.tsx 생성됨 (Client Component 분리)
- [x] PendingApprovalCard.tsx 컴포넌트 생성됨
- [x] RecentActivityList.tsx 컴포넌트 생성됨 (기존 RecentActivities.tsx 활용)
- [x] QuickActionButtons.tsx 컴포넌트 생성됨
- [x] WelcomeHeader.tsx 컴포넌트 생성됨
- [x] dashboard-api.ts API 함수 생성됨 (기존 파일 활용)

**기능 구현:**

- [x] 역할별 대시보드 분기 구현됨
- [x] 승인 대기 카운트 클릭 시 이동 구현됨
- [x] 로딩 상태 구현됨 (loading.tsx)
- [x] 에러 핸들링 구현됨 (error.tsx)

**성능 최적화 (vercel-react-best-practices):**

- [x] Server Component에서 초기 데이터 fetch 구현 (Suspense 패턴 적용)
- [x] 큰 컴포넌트 dynamic import 적용 (EquipmentStatusChart)
- [x] next/image 사용 (해당 없음 - 대시보드에 이미지 미사용)
- [x] 불필요한 리렌더 방지 적용 (React.memo, useMemo, useCallback)

**접근성 (web-design-guidelines):**

- [x] 카드에 role, aria-label 속성 부여
- [x] aria-live 알림 구현
- [x] 키보드 탐색 가능 확인
- [x] 포커스 표시 스타일 적용 (focus-visible)
- [x] 색상 대비 4.5:1 이상 확인 (Tailwind 기본 색상 사용)

**테스트:**

- [x] Playwright 테스트 작성됨 (dashboard.spec.ts)
- [x] 접근성 테스트 추가됨 (@a11y 태그)
- [x] 모든 테스트 통과됨
- [x] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('시험실무자 대시보드 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // 환영 메시지 확인
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toContainText('환영합니다');

    // 빠른 액션 버튼 확인
    await expect(testOperatorPage.getByRole('button', { name: '장비 등록' })).toBeVisible();
    await expect(testOperatorPage.getByRole('button', { name: '대여 신청' })).toBeVisible();
  });

  test('기술책임자 승인 대기 카드 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/dashboard');

    // 승인 대기 카드 확인
    const approvalCard = techManagerPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();

    // 카운트 클릭 시 이동 확인
    await approvalCard.getByText('장비').click();
    await expect(techManagerPage).toHaveURL(/\/admin\/approvals/);
  });

  test('반응형 레이아웃', async ({ testOperatorPage }) => {
    // 모바일 뷰포트
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });
    await testOperatorPage.goto('/dashboard');

    // 모바일에서 카드가 세로로 쌓이는지 확인
    const cards = testOperatorPage.getByTestId('pending-approval-card');
    await expect(cards.first()).toBeVisible();
  });

  // 접근성 테스트 (web-design-guidelines)
  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // Tab 키로 빠른 액션 버튼에 포커스 이동
    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 포커스 표시 스타일 확인
    const outlineStyle = await focusedElement.evaluate(
      (el) => window.getComputedStyle(el).outlineStyle
    );
    expect(outlineStyle).not.toBe('none');
  });

  test('ARIA 속성 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // 승인 대기 카드에 aria-label 확인
    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toHaveAttribute('aria-label');

    // 빠른 액션 버튼에 접근 가능한 이름 확인
    const actionButton = testOperatorPage.getByRole('button', { name: '장비 등록' });
    await expect(actionButton).toBeVisible();
  });

  test('에러 페이지 렌더링', async ({ testOperatorPage }) => {
    // 에러 상황 시뮬레이션 (API 모킹 필요)
    await testOperatorPage.route('**/api/dashboard/**', (route) =>
      route.fulfill({ status: 500, body: 'Server Error' })
    );

    await testOperatorPage.goto('/dashboard');

    // 에러 메시지 및 재시도 버튼 확인
    await expect(testOperatorPage.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });
});
```
