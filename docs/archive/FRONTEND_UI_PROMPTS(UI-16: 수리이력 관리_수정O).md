# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-16: 수리이력 관리

### 목적

장비 수리 이력 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 수리이력 관리 페이지를 구현해줘.

요구사항:
1. 장비별 수리이력 페이지
   - 경로: /equipment/[id]/repair-history
   - 수리 기록 목록
   - 수리 내용, 일시, 비용
   - 타임라인 형태 표시

2. 수리 등록
   - 수리 일시
   - 수리 유형 (내부수리/외부수리)
   - 수리 내용 상세
   - 수리 비용 (선택)
   - 수리 업체 (외부수리 시)
   - 첨부파일 (수리보고서)

3. 수리 중 상태 관리
   - 수리 시작 시 장비 상태 변경
   - 수리 완료 시 장비 상태 복원

파일:
- apps/frontend/app/equipment/[id]/repair-history/page.tsx (Server Component, params Promise)
- apps/frontend/app/maintenance/page.tsx (수리 목록 - Server Component)
- apps/frontend/app/maintenance/loading.tsx (목록 로딩 상태)
- apps/frontend/app/maintenance/error.tsx (에러 핸들러 - 'use client')
- apps/frontend/app/maintenance/create/page.tsx (수리 등록 - Server Component)
- apps/frontend/app/maintenance/[id]/page.tsx (수리 상세 - Server Component, params Promise)
- apps/frontend/components/repair/RepairHistoryTimeline.tsx (Server Component 가능)
- apps/frontend/components/repair/RepairHistoryClient.tsx ('use client' - 인터랙션)
- apps/frontend/components/repair/RepairForm.tsx ('use client' - 폼 상호작용)
- apps/frontend/lib/api/repair-api.ts (Client API)
- apps/frontend/lib/api/server/repair-api-server.ts (Server API)

Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용):
- 동적 라우트 [id]는 params: Promise<{ id: string }> 패턴 사용
- page.tsx는 Server Component로 초기 데이터 fetch, generateMetadata 추가
- 타임라인 표시만 필요한 경우 Server Component, 상호작용 시 Client Component
- RepairForm은 폼 상호작용이 필요하므로 'use client'
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):
- Server Component에서 초기 수리 이력 데이터 fetch (SEO, 초기 로드)
- 타임라인 항목이 많을 경우 가상화 또는 "더 보기" 버튼
- 첨부파일 업로드 컴포넌트는 dynamic import로 지연 로딩
- 상태 변경 시 optimistic update 적용
- 아이콘 개별 import (lucide-react tree-shaking)
- 비용 합계는 서버에서 계산하여 전달

접근성 요구사항 (/web-design-guidelines 스킬 활용):
- 타임라인: role="list"와 role="listitem"으로 구조화
- 각 타임라인 항목에 aria-label로 요약 정보 제공
- 수리 유형 아이콘에 aria-hidden="true", 텍스트 라벨 병행
- 수리 상태 변경 시 aria-live="polite"로 스크린리더 알림
- 폼 필드에 명확한 label 연결
- 필수 필드 표시: aria-required="true"
- 폼 에러 메시지: role="alert" aria-live="polite" 적용
- 키보드 탐색: Tab으로 타임라인 항목 간 이동 가능
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 비용 정보: 숫자 형식 외에 텍스트로도 접근 가능

디자인 요구사항 (/frontend-design 스킬 활용):
- 타임라인 UI (세로, 최신 기록 상단)
- 수리 유형별 색상 및 아이콘 (UL 색상 팔레트):
  - 내부수리: UL Midnight Blue (#122C49) + Wrench 아이콘
  - 외부수리: UL Fog (#577E9E) + Building 아이콘
- 수리 상태별 색상:
  - 진행중: UL Warning (#FF9D55)
  - 완료: UL Green (#00A451)
- 비용 합계 카드 표시 (통화 형식: KRW)
- 반응형: 모바일에서 간결한 타임라인, 데스크톱에서 상세 정보

에러 처리 요구사항:
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수, reset 함수 제공)
- API 에러 시 ErrorAlert 컴포넌트 표시 (재시도 버튼 포함)
- 폼 제출 실패 시 필드별 에러 메시지 표시 (role="alert")
- 401 응답 시 로그인 페이지 리다이렉트
- 403 응답 시 "권한이 없습니다" 메시지 표시

제약사항:
- 수리 중 장비 상태 자동 변경
- 수리 완료 시 상태 복원
- Next.js 16 App Router 패턴 준수

검증:
- 수리 등록 플로우
- 장비 상태 변경 확인
- pnpm tsc --noEmit

Playwright 테스트 (/playwright-skill 활용):
- 수리 등록 → 완료 플로우
- 타임라인 표시 확인
- 키보드 탐색 테스트
- 상태 변경 시 aria-live 알림 확인
- axe-core 접근성 검사

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

- 수리 타임라인은 세로 형태로 표시 (최신 기록이 상단)
- 수리 유형별 아이콘: 내부수리 (Wrench), 외부수리 (Building)
- 수리 중 상태일 때 장비 사용 불가 표시
- 비용 정보는 통화 형식으로 표시 (KRW)

### 이행 체크리스트 UI-16

**파일 생성:**

- [ ] equipment/[id]/repair-history/page.tsx 구현됨 (Server Component, params Promise)
- [ ] maintenance/page.tsx 구현됨 (Server Component)
- [ ] maintenance/loading.tsx 생성됨
- [ ] maintenance/error.tsx 생성됨 ('use client')
- [ ] maintenance/create/page.tsx 구현됨 (Server Component)
- [ ] maintenance/[id]/page.tsx 구현됨 (Server Component, params Promise)

**컴포넌트 생성:**

- [ ] RepairHistoryTimeline.tsx 개선됨 (Server Component)
- [ ] RepairHistoryClient.tsx 생성됨 ('use client')
- [ ] RepairForm.tsx 생성됨 ('use client')

**API 함수:**

- [ ] repair-api.ts (Client) 생성됨
- [ ] repair-api-server.ts (Server) 생성됨

**기능 구현:**

- [ ] 타임라인 UI 구현됨
- [ ] 장비 상태 변경 연동됨
- [ ] 비용 합계 표시 구현됨

**디자인 관련:**

- [ ] UL 색상 팔레트 사용됨 (수리 유형/상태별)
- [ ] 수리 유형별 아이콘 적용됨
- [ ] 반응형 타임라인 구현됨

**에러 처리 관련:**

- [ ] error.tsx 에러 핸들러 구현됨
- [ ] API 에러 시 ErrorAlert 표시됨
- [ ] 폼 제출 실패 시 필드별 에러 메시지 표시됨

**성능 최적화 (vercel-react-best-practices):**

- [ ] Server Component에서 초기 데이터 fetch 구현
- [ ] 첨부파일 업로드 컴포넌트 dynamic import 적용
- [ ] 타임라인 항목 많을 시 "더 보기" 또는 가상화 적용
- [ ] optimistic update 적용

**접근성 (web-design-guidelines):**

- [ ] 타임라인 role="list" 구조화됨
- [ ] 타임라인 항목에 aria-label 적용됨
- [ ] 아이콘에 aria-hidden 및 텍스트 라벨 병행
- [ ] 상태 변경 시 aria-live 알림 구현
- [ ] 폼 필드 label 연결됨
- [ ] 필수 필드 aria-required 적용됨
- [ ] 폼 에러 메시지 role="alert" 적용됨
- [ ] 키보드 탐색 가능 확인
- [ ] 포커스 표시 스타일 적용됨

**테스트:**

- [ ] Playwright 테스트 작성됨 (repair-history.spec.ts)
- [ ] 키보드 탐색 테스트 추가됨
- [ ] aria-live 알림 테스트 추가됨
- [ ] axe-core 접근성 테스트 추가됨
- [ ] 모든 테스트 통과됨
- [ ] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/repair-history.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('수리이력 관리', () => {
  test('수리 등록 및 완료 플로우', async ({ techManagerPage }) => {
    const page = techManagerPage;

    // 수리 등록 페이지 이동
    await page.goto('/maintenance/create');
    await expect(page.getByRole('heading', { name: '수리 등록' })).toBeVisible();

    // 장비 선택
    await page.getByLabel('장비').click();
    await page.getByRole('option').first().click();

    // 수리 정보 입력
    await page.getByLabel('수리 유형').selectOption('internal');
    await page.getByLabel('수리 내용').fill('센서 교체 및 캘리브레이션');
    await page.getByLabel('수리 비용').fill('150000');

    // 수리 시작
    await page.getByRole('button', { name: '수리 시작' }).click();
    await expect(page.getByText('수리가 시작되었습니다')).toBeVisible();

    // 장비 상태 확인
    await page.goto('/equipment');
    await expect(page.getByText('수리중')).toBeVisible();

    // 수리 완료
    await page.goto('/maintenance');
    await page.getByRole('button', { name: '수리 완료' }).click();
    await expect(page.getByText('수리가 완료되었습니다')).toBeVisible();
  });

  test('수리 이력 타임라인 표시', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/equipment/1/repair-history');
    await expect(page.getByRole('heading', { name: '수리 이력' })).toBeVisible();

    // 타임라인 항목 확인
    const timelineItems = page.locator('[data-testid="timeline-item"]');
    await expect(timelineItems.first()).toBeVisible();

    // 비용 합계 확인
    await expect(page.getByText('총 수리 비용')).toBeVisible();
  });

  // 접근성 테스트 (web-design-guidelines)
  test('타임라인 접근성 구조', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/equipment/1/repair-history');

    // 타임라인이 role="list"로 구조화되었는지 확인
    const timeline = page.locator('[role="list"]');
    await expect(timeline).toBeVisible();

    // 각 항목이 role="listitem"인지 확인
    const listItems = page.locator('[role="listitem"]');
    await expect(listItems.first()).toBeVisible();

    // 타임라인 항목에 aria-label이 있는지 확인
    const firstItem = listItems.first();
    await expect(firstItem).toHaveAttribute('aria-label');
  });

  test('키보드 탐색 가능', async ({ techManagerPage }) => {
    const page = techManagerPage;

    await page.goto('/maintenance/create');

    // Tab으로 폼 요소 탐색
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 포커스 표시 스타일 확인
    const hasRing = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.boxShadow.includes('rgb') || style.outlineStyle !== 'none';
    });
    expect(hasRing).toBeTruthy();
  });

  test('수리 상태 변경 시 aria-live 알림', async ({ techManagerPage }) => {
    const page = techManagerPage;

    await page.goto('/maintenance');

    // 수리 완료 버튼 클릭
    await page.getByRole('button', { name: '수리 완료' }).first().click();

    // aria-live 영역에 알림 표시 확인
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/완료|성공/);
  });

  test('수리 유형 아이콘 접근성', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/equipment/1/repair-history');

    // 아이콘이 aria-hidden="true"인지 확인
    const icon = page.locator('[data-testid="repair-type-icon"]').first();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');

    // 아이콘 옆에 텍스트 라벨이 있는지 확인
    const textLabel = page.locator('[data-testid="repair-type-label"]').first();
    await expect(textLabel).toBeVisible();
  });

  test('폼 에러 메시지 접근성', async ({ techManagerPage }) => {
    const page = techManagerPage;

    await page.goto('/maintenance/create');

    // 필수 필드 비워둔 채 제출
    await page.getByRole('button', { name: /수리 시작|등록/ }).click();

    // 에러 메시지에 role="alert" 확인
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('axe-core 접근성 검사', async ({ testOperatorPage }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;

    await testOperatorPage.goto('/equipment/1/repair-history');

    const results = await new AxeBuilder({ page: testOperatorPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```
