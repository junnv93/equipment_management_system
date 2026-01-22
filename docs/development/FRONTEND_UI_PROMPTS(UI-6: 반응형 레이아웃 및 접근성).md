# 프론트엔드 UI 개발 프롬프트

## 스킬 참조 (필수)

각 프롬프트 실행 전 아래 스킬을 로드하세요:

| 스킬 명령어 | 설명 | 사용 시점 |
|------------|------|----------|
| `/equipment-management` | 역할 체계, 승인 프로세스, 장비 관리 도메인 지식 | 모든 UI 개발 시 |
| `/nextjs-16` | Next.js 16 App Router, PageProps, useActionState 패턴 | 페이지/레이아웃 개발 시 |
| `/frontend-design` | 고품질 프론트엔드 인터페이스 디자인, 컴포넌트 스타일링 | UI 컴포넌트 디자인 시 |
| `/playwright-skill` | Playwright 브라우저 자동화 및 테스트 | E2E 테스트 작성 시 |

### 스킬 로드 예시

```
/equipment-management
/nextjs-16
/frontend-design
```

---

## 문서 참조

- **API 표준**: `/docs/development/API_STANDARDS.md`
- **구현 프롬프트**: `/docs/development/PROMPTS_FOR_IMPLEMENTATION_v2.md`
- **프로젝트 상태**: `/docs/development/PROJECT_STATUS.md`
- **E2E 테스트 인증 가이드**: `/docs/development/E2E_TEST_AUTH_GUIDE.md` ⚠️ **필수 참조**

---

## Playwright 테스트 가이드

> **⚠️ 중요**: E2E 테스트 인증 처리 방법은 **반드시** [E2E_TEST_AUTH_GUIDE.md](E2E_TEST_AUTH_GUIDE.md)를 참조하세요!
>
> **핵심**: NextAuth의 정상적인 인증 플로우를 사용해야 합니다. 백엔드 JWT를 직접 쿠키에 저장하는 방식은 작동하지 않습니다.

### 테스트 환경 설정

```bash
# Playwright 설치 (최초 1회)
pnpm exec playwright install

# 테스트 실행
cd apps/frontend
NODE_ENV=test pnpm exec playwright test

# 특정 파일 테스트
NODE_ENV=test pnpm exec playwright test tests/e2e/dashboard.spec.ts

# UI 모드로 테스트
NODE_ENV=test pnpm exec playwright test --ui

# 디버그 모드
NODE_ENV=test pnpm exec playwright test --debug
```

### 테스트 파일 위치

```
apps/frontend/
├── tests/
│   └── e2e/
│       ├── fixtures/
│       │   └── auth.fixture.ts      # 역할별 로그인 픽스처
│       ├── dashboard.spec.ts        # 대시보드 테스트
│       ├── equipment.spec.ts        # 장비 목록 테스트
│       ├── approvals.spec.ts        # 승인 관리 테스트
│       ├── notifications.spec.ts    # 알림 테스트
│       ├── reports.spec.ts          # 보고서 테스트
│       └── accessibility.spec.ts    # 접근성 테스트
├── playwright.config.ts
```

### 역할별 로그인 픽스처

> **⚠️ 이 코드는 참고용입니다.** 실제 구현은 `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`를 사용하세요.
>
> **중요**: NextAuth의 정상적인 인증 플로우를 사용합니다. 상세한 설명은 [E2E_TEST_AUTH_GUIDE.md](E2E_TEST_AUTH_GUIDE.md)를 참조하세요.

```typescript
// tests/e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

interface AuthFixtures {
  testOperatorPage: Page;      // 시험실무자 (test_engineer)
  techManagerPage: Page;        // 기술책임자 (technical_manager)
  siteAdminPage: Page;          // 시험소 관리자 (lab_manager)
  systemAdminPage: Page;        // 시스템 관리자 (system_admin)
}

export const test = base.extend<AuthFixtures>({
  testOperatorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'test_engineer');  // ✅ 올바른 역할명
    await use(page);
    await context.close();
  },

  techManagerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'technical_manager');
    await use(page);
    await context.close();
  },

  siteAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'lab_manager');  // ✅ 올바른 역할명 (site_admin 아님)
    await use(page);
    await context.close();
  },

  systemAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'system_admin');
    await use(page);
    await context.close();
  },
});

async function loginAs(page: Page, role: string) {
  // 테스트 환경에서는 mock 인증 또는 테스트 계정 사용
  await page.goto('/api/auth/test-login?role=' + role);
  await page.waitForURL('/dashboard');
}

export { expect } from '@playwright/test';
```

---

## 공통 요구사항

모든 프론트엔드 UI 개발 시 아래 사항을 준수하세요:

### 디자인 원칙

- **일관성**: shadcn/ui 컴포넌트 라이브러리 사용
- **반응형**: 모바일(320px) ~ 데스크톱(1920px) 대응
- **접근성**: WCAG 2.1 AA 수준 준수
- **성능**: Core Web Vitals 기준 충족

### 기술 스택

```typescript
// 컴포넌트 구조
'use client'; // 클라이언트 컴포넌트 명시

import { useActionState } from 'react'; // Next.js 16 패턴
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

### 역할별 UI 분기

```typescript
// 역할에 따른 조건부 렌더링
const { user } = useAuth();

const canApprove = ['technical_manager', 'lab_manager', 'system_admin'].includes(user.role);
const canManageAllSites = ['lab_manager', 'system_admin'].includes(user.role);
```


---

## UI-6: 반응형 레이아웃 및 접근성

### 목적

모바일 최적화 및 접근성 개선을 수행합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 반응형 레이아웃 및 접근성을 개선해줘.

요구사항:
1. 모바일 네비게이션
   - 햄버거 메뉴 아이콘 (모바일에서만 표시)
   - 사이드 드로어 네비게이션
   - 현재 페이지 하이라이트
   - 외부 클릭 시 닫힘
   - 스와이프 제스처 (선택)

2. 반응형 테이블
   - 작은 화면: 수평 스크롤 또는 카드 변환
   - 중간 화면: 일부 열 숨김
   - 큰 화면: 전체 열 표시
   - 고정 헤더 (스크롤 시)

3. 브레이크포인트 정의
   - sm: 640px (모바일)
   - md: 768px (태블릿)
   - lg: 1024px (데스크톱)
   - xl: 1280px (대형 모니터)

4. 키보드 네비게이션
   - Tab 순서 논리적 구성
   - 포커스 표시 (outline)
   - Enter/Space로 버튼 활성화
   - Escape로 모달/드롭다운 닫기
   - 화살표 키로 목록 탐색

5. 접근성 (WCAG 2.1 AA)
   - 모든 이미지에 alt 텍스트
   - 폼 필드에 label 연결
   - 색상 대비 4.5:1 이상
   - 에러 메시지 명확히 연결
   - 스크린리더 지원 (ARIA)

6. ARIA 속성
   - role: button, dialog, navigation, main, etc.
   - aria-label: 아이콘 버튼
   - aria-expanded: 확장 가능 요소
   - aria-hidden: 장식 요소
   - aria-live: 동적 콘텐츠
   - aria-describedby: 에러 메시지

파일:
- apps/frontend/components/layout/MobileNav.tsx (새 컴포넌트)
- apps/frontend/components/layout/Sidebar.tsx (모바일 대응 수정)
- apps/frontend/components/layout/Header.tsx (햄버거 메뉴 추가)
- apps/frontend/components/ui/ResponsiveTable.tsx (새 컴포넌트)
- apps/frontend/components/ui/SkipLink.tsx (스킵 네비게이션)
- apps/frontend/styles/accessibility.css (접근성 스타일)
- 기존 컴포넌트에 ARIA 속성 추가

라이브러리:
- @axe-core/playwright: 접근성 자동 테스트

디자인 요구사항 (/frontend-design 스킬 활용):
- 모바일 드로어: 왼쪽에서 슬라이드
- 포커스 아웃라인: 파란색 2px
- 스킵 링크: 포커스 시만 표시
- 다크모드 지원

제약사항:
- 기존 UI 변경 최소화
- 점진적 개선 (기존 기능 유지)
- IE 지원 불필요 (모던 브라우저만)

검증:
- 다양한 뷰포트에서 레이아웃 확인
- 키보드만으로 전체 기능 사용 가능 확인
- axe-core로 접근성 검사

Playwright 테스트:
- 다양한 뷰포트에서 레이아웃 확인
- 키보드 탭 순서 확인
- axe-core 접근성 테스트

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-6

- [x] MobileNav.tsx 컴포넌트 생성됨
- [x] Sidebar.tsx 모바일 대응 수정됨
- [x] Header.tsx 햄버거 메뉴 추가됨
- [x] ResponsiveTable.tsx 컴포넌트 생성됨
- [x] SkipLink.tsx 컴포넌트 생성됨
- [x] accessibility.css 스타일 생성됨
- [x] 모바일 드로어 애니메이션 구현됨
- [x] 키보드 네비게이션 구현됨
- [x] ARIA 속성 추가됨
- [x] 색상 대비 검증됨 (4.5:1 이상)
- [x] 스크린리더 테스트 완료됨
- [x] axe-core 접근성 테스트 통과됨
- [x] Playwright 테스트 작성됨 (accessibility.spec.ts)
- [x] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from './fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('axe-core 접근성 검사', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page: testOperatorPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('키보드 네비게이션', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // Tab으로 첫 번째 인터랙티브 요소로 이동
    await testOperatorPage.keyboard.press('Tab');

    // 포커스된 요소 확인
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('모바일 네비게이션', async ({ testOperatorPage }) => {
    // 모바일 뷰포트 설정
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });
    await testOperatorPage.goto('/dashboard');

    // 햄버거 메뉴 클릭
    await testOperatorPage.getByRole('button', { name: '메뉴' }).click();

    // 사이드 드로어 표시 확인
    await expect(testOperatorPage.getByRole('navigation', { name: '메인 네비게이션' }))
      .toBeVisible();
  });

  test('반응형 테이블', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // 모바일 뷰포트
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });

    // 수평 스크롤 가능 또는 카드 뷰로 변환 확인
    const table = testOperatorPage.getByRole('table');
    const tableContainer = testOperatorPage.getByTestId('responsive-table');

    // 스크롤 가능 여부 또는 카드 뷰 확인
    const hasScroll = await tableContainer.evaluate(el => el.scrollWidth > el.clientWidth);
    const isCardView = await testOperatorPage.getByTestId('equipment-card-grid').isVisible()
      .catch(() => false);

    expect(hasScroll || isCardView).toBeTruthy();
  });
});
```

---

## 검증 명령어

### 개발 환경

```bash
# 전체 개발 서버 시작
pnpm dev

# 프론트엔드만 시작
pnpm --filter frontend dev

# 특정 포트로 시작
pnpm --filter frontend dev -- -p 3001
```

### 타입 체크

```bash
# 전체 타입 체크
pnpm tsc --noEmit

# 프론트엔드만
pnpm --filter frontend tsc --noEmit

# 워치 모드
pnpm --filter frontend tsc --noEmit --watch
```

### Playwright 테스트

```bash
# 테스트 전 설치 (최초 1회)
cd apps/frontend && pnpm exec playwright install

# 전체 테스트
pnpm --filter frontend exec playwright test

# 특정 파일 테스트
pnpm --filter frontend exec playwright test tests/e2e/dashboard.spec.ts

# UI 모드
pnpm --filter frontend exec playwright test --ui

# 디버그 모드
pnpm --filter frontend exec playwright test --debug

# 접근성 테스트만
pnpm --filter frontend exec playwright test --grep @a11y

# 시각적 회귀 테스트 (스냅샷 업데이트)
pnpm --filter frontend exec playwright test --update-snapshots

# 특정 브라우저
pnpm --filter frontend exec playwright test --project=chromium

# 리포트 확인
pnpm --filter frontend exec playwright show-report
```

### 린트 및 포맷

```bash
# ESLint
pnpm --filter frontend lint

# Prettier
pnpm --filter frontend format
```

---

## 프롬프트 실행 순서

권장 실행 순서:

### Phase 1: 기반 작업
1. **UI-6: 반응형 레이아웃 및 접근성** (기반 작업)
2. **UI-7: 로그인/인증 페이지** (인증 기반)

### Phase 2: 핵심 페이지
3. **UI-1: 역할별 대시보드** (메인 페이지)
4. **UI-8: 장비 등록/수정 폼** (장비 CRUD)
5. **UI-9: 장비 상세 페이지** (장비 상세)
6. **UI-2: 장비 목록/검색 UI 개선** (장비 목록)

### Phase 3: 교정 관리
7. **UI-10: 교정 관리 페이지** (교정 CRUD)
8. **UI-11: 교정계획서 관리** (교정계획서)
9. **UI-14: 보정계수 관리 페이지** (보정계수)

### Phase 4: 대여/반출 관리
10. **UI-12: 대여 관리 페이지** (대여)
11. **UI-13: 반출/반입 관리 페이지** (반출/반입)

### Phase 5: 부가 기능
12. **UI-15: 부적합 장비 관리** (부적합)
13. **UI-16: 수리이력 관리** (수리)
14. **UI-17: 소프트웨어 관리대장** (소프트웨어)

### Phase 6: 관리 기능
15. **UI-3: 승인 관리 통합 페이지** (승인 통합)
16. **UI-4: 알림 센터** (알림)
17. **UI-18: 팀 관리 페이지** (팀)
18. **UI-19: 설정 및 관리자 페이지** (설정)

### Phase 7: 출력 기능
19. **UI-5: 보고서/대장 출력** (출력)

각 프롬프트 완료 후 Playwright 테스트를 실행하여 기능을 검증하세요.

---

## 스킬 활용 요약

| 프롬프트 | equipment-management | nextjs-16 | frontend-design | playwright-skill |
|---------|---------------------|-----------|-----------------|------------------|
| UI-1 대시보드 | ✅ 역할 체계 | ✅ App Router | ✅ 카드 디자인 | ✅ 역할별 테스트 |
| UI-2 장비 목록 | ✅ 장비 상태 | ✅ URL 상태 | ✅ 테이블/카드 | ✅ 필터 테스트 |
| UI-3 승인 관리 | ✅ 승인 프로세스 | ✅ Server Actions | ✅ 탭/모달 | ✅ 승인 플로우 |
| UI-4 알림 | ✅ 알림 유형 | ✅ 클라이언트 | ✅ 드롭다운 | ✅ 알림 테스트 |
| UI-5 보고서 | ✅ 교정계획서 | ✅ 동적 라우트 | ✅ 인쇄 스타일 | ✅ 다운로드 |
| UI-6 접근성 | - | ✅ 레이아웃 | ✅ 반응형 | ✅ a11y 테스트 |
| UI-7 로그인 | ✅ 역할 체계 | ✅ NextAuth | ✅ 로그인 폼 | ✅ 인증 테스트 |
| UI-8 장비 폼 | ✅ 장비 필드 | ✅ 폼 처리 | ✅ 폼 디자인 | ✅ 폼 테스트 |
| UI-9 장비 상세 | ✅ 장비 상태 | ✅ 탭 라우팅 | ✅ 탭/배너 | ✅ 상세 테스트 |
| UI-10 교정 | ✅ 교정 프로세스 | ✅ Server Actions | ✅ 폼/목록 | ✅ 교정 테스트 |
| UI-11 교정계획서 | ✅ 교정계획서 | ✅ 동적 라우트 | ✅ 일정 UI | ✅ 계획서 테스트 |
| UI-12 대여 | ✅ 대여 프로세스 | ✅ Server Actions | ✅ 캘린더 | ✅ 대여 테스트 |
| UI-13 반출 | ✅ 반출 프로세스 | ✅ Server Actions | ✅ 검사 폼 | ✅ 반출 테스트 |
| UI-14 보정계수 | ✅ 보정계수 | ✅ 동적 라우트 | ✅ JSON 에디터 | ✅ 보정계수 테스트 |
| UI-15 부적합 | ✅ 부적합 관리 | ✅ Server Actions | ✅ 타임라인 | ✅ 부적합 테스트 |
| UI-16 수리이력 | ✅ 수리 관리 | ✅ 동적 라우트 | ✅ 타임라인 | ✅ 수리 테스트 |
| UI-17 소프트웨어 | ✅ 소프트웨어 | ✅ 동적 라우트 | ✅ 라이선스 UI | ✅ SW 테스트 |
| UI-18 팀 관리 | ✅ 팀 구조 | ✅ 동적 라우트 | ✅ 팀 카드 | ✅ 팀 테스트 |
| UI-19 설정 | ✅ 시스템 설정 | ✅ Server Actions | ✅ 토글 UI | ✅ 설정 테스트 |
