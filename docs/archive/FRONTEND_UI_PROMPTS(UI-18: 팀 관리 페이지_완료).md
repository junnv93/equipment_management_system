# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-18: 팀 관리 페이지

### 목적

팀 정보 관리 페이지를 구현합니다.

### 프롬프트

````
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

⚠️ E2E 테스트 작성 시 /docs/development/E2E_TEST_AUTH_GUIDE.md를 반드시 참조하세요!

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 팀 관리 페이지를 구현해줘.

역할 참고:
- lab_manager: 시험소 내 팀 관리
- system_admin: 전체 팀 관리

요구사항:
1. 팀 목록 페이지
   - 사이트별 팀 목록
   - 팀 정보: 이름, 유형, 소속 사이트
   - 팀원 수 표시

2. 팀 상세 페이지
   - 팀 기본 정보
   - 팀원 목록
   - 팀 장비 목록 (링크)

3. 팀 등록/수정 (관리자)
   - 팀 이름
   - 팀 유형 (RF, EMC, SAR 등)
   - 소속 사이트

파일:
- apps/frontend/app/teams/page.tsx (팀 목록 - Server Component)
- apps/frontend/app/teams/loading.tsx (로딩 상태)
- apps/frontend/app/teams/error.tsx (에러 핸들러 - 'use client')
- apps/frontend/app/teams/[id]/page.tsx (팀 상세 - Server Component, params Promise)
- apps/frontend/app/teams/[id]/loading.tsx
- apps/frontend/app/teams/[id]/error.tsx
- apps/frontend/app/teams/[id]/edit/page.tsx (팀 수정)
- apps/frontend/app/teams/create/page.tsx (팀 등록)
- apps/frontend/components/teams/TeamList.tsx ('use client' - 필터/정렬)
- apps/frontend/components/teams/TeamCard.tsx
- apps/frontend/components/teams/TeamDetail.tsx
- apps/frontend/components/teams/TeamForm.tsx ('use client' - 폼 상호작용)
- apps/frontend/components/teams/TeamMemberList.tsx
- apps/frontend/components/teams/DeleteTeamModal.tsx ('use client')
- apps/frontend/lib/api/team-api.ts (Client API)
- apps/frontend/lib/api/server/team-api-server.ts (Server API)

Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용):
- 동적 라우트 [id]는 params: Promise<{ id: string }> 패턴 사용
- page.tsx는 Server Component로 초기 데이터 fetch
- 폼/필터/모달 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)

```typescript
// apps/frontend/app/teams/[id]/page.tsx
export default async function TeamDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  // ✅ params는 Promise이므로 await 필수
  const { id } = await props.params;

  const team = await getTeam(id);
  return <TeamDetailClient team={team} />;
}
````

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):

- Server Component에서 초기 팀 목록/상세 데이터 fetch
- 팀 삭제 모달은 dynamic import로 지연 로딩
- 팀원 목록이 많을 경우 페이지네이션 또는 가상화
- 팀 카드 이미지(아바타)는 next/image 사용
- 아이콘 개별 import (lucide-react tree-shaking)

접근성 요구사항 (/web-design-guidelines 스킬 활용):

- 팀 카드: role="article", aria-labelledby로 팀 이름 연결
- 팀원 아바타 그리드: 각 아바타에 aria-label="팀원명" 제공
- "+N명 더보기" 버튼: aria-label="나머지 N명 보기"
- 삭제 모달: role="alertdialog", aria-modal="true", 포커스 트랩
- 폼 필드: aria-describedby로 도움말/에러 연결
- 키보드 탐색: Tab 순서 논리적 구성, Enter로 카드 상세 이동
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 팀 유형 색상: 색상 외 아이콘으로도 구분

디자인 요구사항 (/frontend-design 스킬 활용):

- 팀 유형별 아이콘/색상 (UL 색상 팔레트 기반):
  - RF: UL Midnight Blue (#122C49) + 📡 아이콘
  - EMC: UL Fog (#577E9E) + ⚡ 아이콘
  - SAR: UL Warning (#FF9D55) + 📱 아이콘
  - 기타: UL Gray (#EBEBEB) + 🔧 아이콘
- 팀원 아바타 그리드: 최대 5명 표시, 초과 시 "+N" 뱃지
- 팀 카드: 그림자 효과, hover 시 lift 효과
- 반응형: 모바일 1열, 태블릿 2열, 데스크톱 3열 그리드
- 애니메이션:
  - 팀 카드 hover 시 subtle lift 효과 (shadow + translateY)
  - 카드 목록 stagger 애니메이션 (순차 등장)
  - 삭제 모달 scale + fade 애니메이션
  - 팀 생성/수정 성공 시 success 토스트
  - 아바타 그리드 hover 시 tooltip 표시

에러 처리 요구사항:

- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수, reset 함수 제공)
- API 에러 시 ErrorAlert 컴포넌트 표시 (재시도 버튼 포함)
- 폼 제출 실패 시 필드별 에러 메시지 표시 (role="alert")
- 401 응답 시 로그인 페이지 리다이렉트
- 403 응답 시 "권한이 없습니다" 메시지 표시
- 팀 삭제 실패 시 사유 표시 (연관 장비/팀원 존재 등)
- 존재하지 않는 팀 접근 시 not-found.tsx 표시

제약사항:

- 팀 삭제 시 연관 데이터 확인 필요 (소속 장비/팀원 이동 안내)
- lab_manager는 자신의 시험소 팀만 관리 가능
- system_admin만 팀 삭제 가능

검증:

- 팀 관리 플로우
- 권한 확인
- pnpm tsc --noEmit

Playwright 테스트:

- 팀 목록/상세 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.

````

### 필수 가이드라인

#### 팀 유형별 색상 (UL 색상 팔레트)

| 팀 유형 | 색상 | 색상 코드 | 아이콘 |
|---------|------|-----------|--------|
| RF | UL Midnight Blue | #122C49 | 📡 Radio |
| EMC | UL Fog | #577E9E | ⚡ Zap |
| SAR | UL Warning | #FF9D55 | 📱 Smartphone |
| 기타 | UL Gray | #EBEBEB | 🔧 Wrench |

#### 비즈니스 규칙

- 팀원 아바타는 최대 5명까지 표시 후 "+N" 표시
- 팀 삭제 전 소속 장비/팀원 이동 안내 필요
- lab_manager는 자신의 시험소 팀만 관리 가능
- system_admin만 팀 삭제 가능

#### 접근성 요구사항 (WCAG 2.1 AA)

**필수 ARIA 속성**:

```typescript
// 팀 카드
<article
  role="article"
  aria-labelledby={`team-name-${team.id}`}
  className="cursor-pointer"
  onClick={() => router.push(`/teams/${team.id}`)}
  onKeyDown={(e) => e.key === 'Enter' && router.push(`/teams/${team.id}`)}
  tabIndex={0}
>
  <h3 id={`team-name-${team.id}`}>{team.name}</h3>
  {/* ... */}
</article>

// 아바타 그리드
<div role="group" aria-label="팀원 목록">
  {members.slice(0, 5).map((member) => (
    <Avatar key={member.id} aria-label={member.name} />
  ))}
  {members.length > 5 && (
    <button aria-label={`나머지 ${members.length - 5}명 보기`}>
      +{members.length - 5}
    </button>
  )}
</div>

// 삭제 모달
<AlertDialog>
  <AlertDialogContent role="alertdialog" aria-modal="true">
    <AlertDialogTitle>팀 삭제</AlertDialogTitle>
    <AlertDialogDescription>
      이 팀에 소속된 장비 N개와 팀원 M명이 있습니다.
    </AlertDialogDescription>
  </AlertDialogContent>
</AlertDialog>
````

**키보드 접근성 체크리스트**:

- [ ] Tab 키로 모든 팀 카드에 접근 가능한가?
- [ ] Enter 키로 팀 상세 페이지 이동 가능한가?
- [ ] Escape로 모달 닫기 가능한가?
- [ ] 포커스 표시가 명확히 보이는가?

**시각적 접근성 체크리스트**:

- [ ] 팀 유형이 색상뿐 아니라 아이콘으로도 구분되는가?
- [ ] 색상 대비 비율이 4.5:1 이상인가?

### 이행 체크리스트 UI-18

**파일 생성:**

- [x] teams/page.tsx 구현됨 (Server Component)
- [x] teams/loading.tsx 생성됨
- [x] teams/error.tsx 생성됨 ('use client')
- [x] teams/[id]/page.tsx 구현됨 (Server Component, params Promise)
- [x] teams/[id]/loading.tsx 생성됨
- [x] teams/[id]/error.tsx 생성됨
- [x] teams/[id]/edit/page.tsx 구현됨
- [x] teams/create/page.tsx 구현됨

**컴포넌트 생성:**

- [x] TeamList.tsx 생성됨 ('use client')
- [x] TeamCard.tsx 생성됨
- [x] TeamDetail.tsx 생성됨
- [x] TeamForm.tsx 생성됨 ('use client')
- [x] TeamMemberList.tsx 생성됨
- [x] DeleteTeamModal.tsx 생성됨 ('use client')

**API 함수:**

- [x] team-api.ts (Client) 생성됨
- [x] team-api-server.ts (Server) 생성됨

**기능 구현:**

- [x] 팀 목록/상세 조회 구현됨
- [x] 팀 등록/수정 구현됨
- [x] 팀 삭제 (연관 데이터 확인) 구현됨
- [x] 권한별 UI 분기 구현됨 (useAuth의 hasRole 사용)

**디자인 관련:**

- [x] 팀 유형별 색상/아이콘 구현됨 (UL 색상 팔레트)
- [x] 아바타 그리드 구현됨 (최대 5명 + "+N")
- [x] 팀 카드 hover lift 효과 적용됨
- [x] 카드 목록 stagger 애니메이션 적용됨
- [x] 삭제 모달 scale + fade 애니메이션 적용됨

**에러 처리 관련:**

- [x] error.tsx 에러 핸들러 구현됨
- [x] API 에러 시 ErrorAlert 표시됨
- [x] 폼 제출 실패 시 필드별 에러 메시지 표시됨
- [x] 401 응답 시 로그인 페이지 리다이렉트됨
- [x] 팀 삭제 실패 시 사유 표시됨

**성능 최적화 (vercel-react-best-practices):**

- [x] Server Component에서 초기 데이터 fetch 구현됨
- [x] params Promise 패턴 적용됨
- [x] 삭제 모달 dynamic import 적용됨
- [x] 아바타 이미지 next/image 사용됨
- [x] 아이콘 개별 import 적용됨

**접근성 (web-design-guidelines):**

- [x] 팀 카드에 role="article", aria-labelledby 적용됨
- [x] 아바타에 aria-label 적용됨
- [x] "+N" 버튼에 aria-label 적용됨
- [x] 삭제 모달에 role="alertdialog" 적용됨
- [x] 모달 포커스 트랩 구현됨
- [x] Enter 키로 카드 상세 이동 가능
- [x] 포커스 표시 스타일 적용됨
- [x] 팀 유형이 색상 + 아이콘으로 구분됨

**테스트:**

- [x] Playwright 테스트 작성됨 (teams.spec.ts)
- [x] 권한별 UI 테스트 추가됨
- [x] 키보드 탐색 테스트 추가됨
- [x] axe-core 접근성 테스트 추가됨
- [x] 모든 테스트 통과됨 (24 passed)
- [x] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/teams.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('팀 관리 페이지 - Basic', () => {
  test('팀 목록 조회', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');
    await expect(page.getByRole('heading', { name: '팀 관리' })).toBeVisible();

    // 팀 카드 확인
    const teamCards = page.locator('[data-testid="team-card"]');
    await expect(teamCards.first()).toBeVisible();

    // 팀원 수 표시 확인
    await expect(page.getByText(/\d+명/)).toBeVisible();

    // 팀 유형 아이콘 표시 확인
    await expect(page.locator('[data-testid="team-type-icon"]').first()).toBeVisible();
  });

  test('팀 상세 조회', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/teams');
    await page.locator('[data-testid="team-card"]').first().click();

    // 팀 상세 정보 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('팀원')).toBeVisible();
    await expect(page.getByText('소속 장비')).toBeVisible();
  });

  test('팀 등록 (관리자)', async ({ siteAdminPage }) => {
    const page = siteAdminPage;

    await page.goto('/teams');
    await page.getByRole('button', { name: '팀 추가' }).click();

    // 팀 정보 입력
    await page.getByLabel('팀 이름').fill('신규 RF 팀');
    await page.getByLabel('팀 유형').selectOption('RF');
    await page.getByLabel('소속 사이트').selectOption({ index: 0 });

    // 저장
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('alert')).toContainText('생성되었습니다');
  });

  test('팀 삭제 시 확인 모달', async ({ systemAdminPage }) => {
    const page = systemAdminPage;

    await page.goto('/teams/1');
    await page.getByRole('button', { name: '삭제' }).click();

    // alertdialog 모달 표시
    const modal = page.getByRole('alertdialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('소속 장비');

    // 취소
    await page.getByRole('button', { name: '취소' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('권한별 UI - 일반 사용자는 삭제 버튼 미표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams/1');
    await expect(testOperatorPage.getByRole('button', { name: '삭제' })).not.toBeVisible();
  });

  test('권한별 UI - 시스템 관리자는 삭제 버튼 표시', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/teams/1');
    await expect(systemAdminPage.getByRole('button', { name: '삭제' })).toBeVisible();
  });
});

test.describe('팀 관리 페이지 - Accessibility', () => {
  test('팀 카드 키보드 탐색', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams');

    // Tab으로 첫 번째 카드에 포커스
    await testOperatorPage.keyboard.press('Tab');
    const focusedCard = testOperatorPage.locator('[data-testid="team-card"]:focus');
    await expect(focusedCard).toBeVisible();

    // 포커스 표시 스타일 확인
    const hasRing = await focusedCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.boxShadow.includes('rgb') || style.outlineStyle !== 'none';
    });
    expect(hasRing).toBeTruthy();
  });

  test('Enter 키로 팀 상세 이동', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams');

    // 첫 번째 카드에 포커스
    await testOperatorPage.keyboard.press('Tab');

    // Enter로 상세 페이지 이동
    await testOperatorPage.keyboard.press('Enter');

    // 상세 페이지로 이동 확인
    await expect(testOperatorPage).toHaveURL(/\/teams\/\d+/);
  });

  test('아바타에 aria-label 제공', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams/1');

    // 팀원 아바타에 aria-label 확인
    const avatar = testOperatorPage.locator('[data-testid="member-avatar"]').first();
    await expect(avatar).toHaveAttribute('aria-label');
  });

  test('+N 버튼에 aria-label 제공', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams');

    // "+N" 버튼이 있는 경우 aria-label 확인
    const moreButton = testOperatorPage.locator('[data-testid="more-members-button"]').first();
    if (await moreButton.isVisible()) {
      await expect(moreButton).toHaveAttribute('aria-label', /나머지.*명/);
    }
  });

  test('삭제 모달 포커스 트랩', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/teams/1');
    await systemAdminPage.getByRole('button', { name: '삭제' }).click();

    const modal = systemAdminPage.getByRole('alertdialog');
    await expect(modal).toBeVisible();

    // Tab 키로 탐색해도 모달 내부에 포커스 유지
    for (let i = 0; i < 10; i++) {
      await systemAdminPage.keyboard.press('Tab');
    }
    await expect(modal.locator(':focus')).toBeVisible();
  });

  test('Escape로 모달 닫기', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/teams/1');
    await systemAdminPage.getByRole('button', { name: '삭제' }).click();

    const modal = systemAdminPage.getByRole('alertdialog');
    await expect(modal).toBeVisible();

    // Escape로 닫기
    await systemAdminPage.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('팀 유형이 색상과 아이콘으로 구분됨', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/teams');

    // 팀 유형 아이콘이 표시되는지 확인
    const teamCard = testOperatorPage.locator('[data-testid="team-card"]').first();
    const typeIcon = teamCard.locator('[data-testid="team-type-icon"]');
    await expect(typeIcon).toBeVisible();
  });

  test('axe-core 접근성 검사', async ({ testOperatorPage }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;

    await testOperatorPage.goto('/teams');

    const results = await new AxeBuilder({ page: testOperatorPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```
