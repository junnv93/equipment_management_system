# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-6: 반응형 레이아웃 및 접근성

### 목적

모바일 최적화 및 접근성 개선을 수행합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
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

5. 접근성 (WCAG 2.1 AA) - /web-design-guidelines 스킬 활용
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
- apps/frontend/app/layout.tsx (SkipLink 적용, 접근성 메타 추가)
- apps/frontend/components/layout/MobileNav.tsx (Client Component - 'use client')
- apps/frontend/components/layout/Sidebar.tsx (모바일 대응 수정 - 'use client')
- apps/frontend/components/layout/Header.tsx (햄버거 메뉴 추가 - 'use client')
- apps/frontend/components/ui/ResponsiveTable.tsx (새 컴포넌트)
- apps/frontend/components/ui/SkipLink.tsx (스킵 네비게이션)
- apps/frontend/styles/accessibility.css (접근성 스타일)
- 기존 컴포넌트에 ARIA 속성 추가

라이브러리:
- @axe-core/playwright: 접근성 자동 테스트

Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용):
- MobileNav, Sidebar, Header는 상호작용이 필요하므로 Client Component ('use client')
- ResponsiveTable은 데이터만 표시 시 Server Component 가능, 인터랙션 시 Client Component
- SkipLink는 포커스 이벤트 처리가 필요하므로 Client Component

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):
- MobileNav는 dynamic import로 지연 로딩 (모바일에서만 필요)
- CSS는 Tailwind 유틸리티 클래스 우선 사용 (번들 크기 최소화)
- 아이콘은 lucide-react에서 개별 import (tree-shaking)
- 불필요한 리렌더 방지: React.memo, useCallback 활용
- 미디어 쿼리는 CSS 우선, JS 감지는 최소화

디자인 요구사항 (/frontend-design 스킬 활용):
- 모바일 드로어: 왼쪽에서 슬라이드, 배경 오버레이
- 포커스 아웃라인: ring-2 ring-offset-2 ring-blue-500
- 스킵 링크: sr-only focus:not-sr-only 패턴
- 다크모드 지원: Tailwind dark: 접두사 활용
- 애니메이션: prefers-reduced-motion 미디어 쿼리 존중

제약사항:
- 기존 UI 변경 최소화
- 점진적 개선 (기존 기능 유지)
- IE 지원 불필요 (모던 브라우저만)
- Next.js 16 App Router 패턴 준수

검증:
- 다양한 뷰포트에서 레이아웃 확인
- 키보드만으로 전체 기능 사용 가능 확인
- axe-core로 접근성 검사
- pnpm tsc --noEmit

Playwright 테스트 (/playwright-skill 활용):
- 다양한 뷰포트에서 레이아웃 확인
- 키보드 탭 순서 확인
- axe-core 접근성 테스트 (WCAG 2.1 AA)
- 포커스 표시 스타일 확인
- 스크린리더 알림 (aria-live) 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-6

**파일 생성/수정:**

- [x] app/layout.tsx에 SkipLink 적용됨
- [x] MobileNav.tsx 컴포넌트 생성됨 ('use client')
- [x] Sidebar.tsx 모바일 대응 수정됨 ('use client')
- [x] Header.tsx 햄버거 메뉴 추가됨 ('use client')
- [x] ResponsiveTable.tsx 컴포넌트 생성됨
- [x] SkipLink.tsx 컴포넌트 생성됨 ('use client')
- [x] accessibility.css 스타일 생성됨

**반응형 레이아웃:**

- [x] 모바일 드로어 애니메이션 구현됨
- [x] 반응형 테이블 구현됨 (카드/스크롤 전환)
- [x] 브레이크포인트별 레이아웃 확인됨

**성능 최적화 (vercel-react-best-practices):**

- [x] MobileNav dynamic import 적용됨
- [x] 아이콘 개별 import 확인됨
- [x] 불필요한 리렌더 방지 적용됨
- [x] CSS 번들 크기 최적화됨

**접근성 (web-design-guidelines):**

- [x] 키보드 네비게이션 구현됨
- [x] ARIA 속성 추가됨
- [x] 색상 대비 검증됨 (4.5:1 이상)
- [x] 스크린리더 테스트 완료됨
- [x] prefers-reduced-motion 미디어 쿼리 적용됨
- [x] 포커스 표시 스타일 (ring-2) 일관성 확인됨

**테스트:**

- [x] axe-core 접근성 테스트 통과됨
- [x] Playwright 테스트 작성됨 (accessibility.spec.ts)
- [x] 포커스 표시 테스트 추가됨
- [x] aria-live 알림 테스트 추가됨
- [x] 모든 테스트 통과됨
- [x] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from './fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('axe-core 접근성 검사 (WCAG 2.1 AA)', async ({ testOperatorPage }) => {
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
    await expect(
      testOperatorPage.getByRole('navigation', { name: '메인 네비게이션' })
    ).toBeVisible();

    // Escape로 닫기
    await testOperatorPage.keyboard.press('Escape');
    await expect(
      testOperatorPage.getByRole('navigation', { name: '메인 네비게이션' })
    ).not.toBeVisible();
  });

  test('반응형 테이블', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // 모바일 뷰포트
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });

    // 수평 스크롤 가능 또는 카드 뷰로 변환 확인
    const table = testOperatorPage.getByRole('table');
    const tableContainer = testOperatorPage.getByTestId('responsive-table');

    // 스크롤 가능 여부 또는 카드 뷰 확인
    const hasScroll = await tableContainer.evaluate((el) => el.scrollWidth > el.clientWidth);
    const isCardView = await testOperatorPage
      .getByTestId('equipment-card-grid')
      .isVisible()
      .catch(() => false);

    expect(hasScroll || isCardView).toBeTruthy();
  });

  // 포커스 표시 스타일 테스트 (web-design-guidelines)
  test('포커스 표시 스타일 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // Tab으로 포커스 이동
    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');

    // ring 스타일 또는 outline 확인
    const hasRing = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.boxShadow.includes('rgb') || // Tailwind ring
        style.outlineStyle !== 'none'
      );
    });

    expect(hasRing).toBeTruthy();
  });

  // 스킵 링크 테스트
  test('스킵 링크 동작', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // Tab으로 스킵 링크에 포커스
    await testOperatorPage.keyboard.press('Tab');

    // 스킵 링크가 보이는지 확인
    const skipLink = testOperatorPage.getByRole('link', { name: /본문으로|메인 콘텐츠/ });
    await expect(skipLink).toBeVisible();

    // Enter로 활성화
    await testOperatorPage.keyboard.press('Enter');

    // main 요소로 포커스 이동 확인
    const mainContent = testOperatorPage.getByRole('main');
    await expect(mainContent).toBeFocused();
  });

  // 색상 대비 테스트
  test('색상 대비 검증', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // axe-core의 color-contrast 규칙만 검사
    const contrastResults = await new AxeBuilder({ page: testOperatorPage })
      .withRules(['color-contrast'])
      .analyze();

    expect(contrastResults.violations).toEqual([]);
  });

  // prefers-reduced-motion 테스트
  test('모션 감소 설정 존중', async ({ testOperatorPage }) => {
    // 모션 감소 설정 에뮬레이션
    await testOperatorPage.emulateMedia({ reducedMotion: 'reduce' });
    await testOperatorPage.goto('/dashboard');

    // 모바일 뷰포트에서 드로어 열기
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });
    await testOperatorPage.getByRole('button', { name: '메뉴' }).click();

    // 애니메이션 없이 즉시 표시되어야 함 (transition-duration: 0)
    const drawer = testOperatorPage.getByRole('navigation', { name: '메인 네비게이션' });
    await expect(drawer).toBeVisible();
  });
});
```
