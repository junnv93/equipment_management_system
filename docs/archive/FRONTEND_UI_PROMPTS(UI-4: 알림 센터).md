# 프론트엔드 UI 개발 프롬프트

## 스킬 참조 (필수)

각 프롬프트 실행 전 아래 스킬을 로드하세요:

| 스킬 명령어             | 설명                                                   | 사용 시점               |
| ----------------------- | ------------------------------------------------------ | ----------------------- |
| `/equipment-management` | 역할 체계, 승인 프로세스, 장비 관리 도메인 지식        | 모든 UI 개발 시         |
| `/nextjs-16`            | Next.js 16 App Router, PageProps, useActionState 패턴  | 페이지/레이아웃 개발 시 |
| `/frontend-design`      | 고품질 프론트엔드 인터페이스 디자인, 컴포넌트 스타일링 | UI 컴포넌트 디자인 시   |
| `/playwright-skill`     | Playwright 브라우저 자동화 및 테스트                   | E2E 테스트 작성 시      |

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
  testOperatorPage: Page; // 시험실무자 (test_engineer)
  techManagerPage: Page; // 기술책임자 (technical_manager)
  siteAdminPage: Page; // 시험소 관리자 (lab_manager)
  systemAdminPage: Page; // 시스템 관리자 (system_admin)
}

export const test = base.extend<AuthFixtures>({
  testOperatorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'test_engineer'); // ✅ 올바른 역할명
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
    await loginAs(page, 'lab_manager'); // ✅ 올바른 역할명 (site_admin 아님)
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

=== 1. 디자인 요구사항 (UL Solutions Corporate Professional) ===

1.1 브랜딩 섹션 (좌측, 데스크톱 전용)

- 배경: UL Midnight Blue (#122C49) 단색
- 미묘한 그리드 패턴 오버레이 (40px 간격)
- 로고 영역: 상단 좌측
  - UL Red (#CA0123) 배경의 Wrench 아이콘
  - "장비 관리 시스템" + "Equipment Management System" 텍스트
- 중앙: 메인 헤드라인
  - "효율적인 장비 관리를 통합 솔루션으로"
  - UL Info (#BCE4F7) 하이라이트 텍스트
- 하단: 3개의 기능 하이라이트 카드 (아이콘 + 짧은 설명)
  - 체계적인 장비 관리
  - 실시간 교정 추적
  - 역할 기반 승인
- 최하단: UL Solutions 브랜딩 ("UL Solutions | Quality & Safety")
- 부드러운 fade-in 애니메이션 (페이지 로드 시)

  1.2 로그인 폼 섹션 (우측)

- 배경: 흰색 (bg-white) / 다크모드 시 배경색 자동 적용
- 카드: 흰색, 부드러운 그림자 (shadow-lg), 둥근 모서리 (rounded-2xl)
- 상단: 환영 메시지 ("Welcome back", "계정에 로그인하여 시작하세요")
- Azure AD 버튼 우선 배치 (Microsoft 계정으로 로그인)
- "또는" 구분선 (Separator with text)
- 이메일/비밀번호 폼
- 폼 필드: 아이콘 prefix (Mail, Lock 아이콘)
- 로그인 버튼: UL Midnight Blue (#122C49), hover 시 darker
- 하단: 테스트 계정 정보 (개발 환경)

  1.3 반응형 디자인

- 모바일 (< 1024px): 브랜딩 섹션 숨김, 로그인 폼만 전체 화면
- 모바일 상단에 Midnight Blue 헤더 + UL Red 로고 아이콘
- 데스크톱 (≥ 1024px): 브랜딩 50%, 로그인 50% 스플릿 레이아웃

  1.4 인터랙션 & 애니메이션

- 입력 필드 포커스: Primary 색상 테두리 + ring 효과
- 버튼 hover: 배경색 진하게 (ul-midnight-dark) + 약간의 scale (1.01)
- 로딩 상태: 스피너 + 버튼 텍스트 변경 + 버튼 비활성화
- 에러 상태: shake 애니메이션 (폼 전체), UL Red 테두리
- 성공 시: UL Green 배경 + checkmark 애니메이션 후 리다이렉트

  1.5 색상 팔레트 (UL Solutions Brand)

- Primary: #122C49 (Midnight Blue) - 메인 버튼, 헤더, 사이드바
- Primary Hover: #0a1c30 (Darker Midnight)
- Secondary: #577E9E (Fog) - 보조 텍스트
- Brand Accent: #CA0123 (Bright Red) - 로고, CTA, 중요 배지
- Error: #CA0123 (Bright Red) - 오류, 부적합
- Success: #00A451 (Bright Green) - 정상, 승인 완료
- Warning: #FF9D55 (Orange) - 교정 예정, 주의
- Info: #BCE4F7 (Light Blue) - 정보 배경, 하이라이트
- Background: #EBEBEB (UL Gray) - 페이지 배경
- Surface: #FFFFFF - 카드, 모달 배경
- Border: #D8D9DA (UL Gray 1) - 테두리
- Text Primary: #122C49 (Midnight Blue)
- Text Muted: #577E9E (Fog)

  1.6 다크모드 지원

- next-themes 라이브러리 활용
- 헤더에 다크모드 토글 버튼 (Sun/Moon/Monitor 아이콘)
- 시스템 설정 자동 감지 + 수동 토글 지원
- CSS Variables 기반 색상 시스템으로 자동 전환

---

## UI-4: 알림 센터

### 목적

실시간 알림 관리 기능을 제공합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 알림 센터를 구현해줘.

요구사항:
1. 헤더 알림 아이콘
   - 종 모양 아이콘
   - 읽지 않은 알림 개수 뱃지 (빨간색)
   - 클릭 시 드롭다운 표시

2. 알림 드롭다운
   - 최근 알림 5개 미리보기
   - 알림 유형별 아이콘/색상 구분
     - 승인 요청: 노란색 (요청 아이콘)
     - 승인 완료: 초록색 (체크 아이콘)
     - 반려: 빨간색 (X 아이콘)
     - 교정 예정: 파란색 (캘린더 아이콘)
     - 시스템: 회색 (정보 아이콘)
   - "전체 보기" 링크

3. 전체 알림 페이지
   - 알림 목록 (무한 스크롤)
   - 유형별 필터
   - 읽음/안읽음 필터
   - 전체 읽음 처리 버튼
   - 개별 삭제 버튼

4. 알림 상호작용
   - 클릭 시 관련 페이지로 이동
   - 읽음 처리 자동 수행
   - 읽은 알림은 스타일 변경 (흐리게)

5. 실시간 업데이트 (선택)
   - SSE 또는 폴링 (30초)
   - 새 알림 시 뱃지 업데이트
   - 브라우저 알림 (허용 시)

파일:
- apps/frontend/components/layout/Header.tsx (수정: 알림 아이콘 추가)
- apps/frontend/components/layout/NotificationBell.tsx
- apps/frontend/components/notifications/NotificationDropdown.tsx
- apps/frontend/components/notifications/NotificationItem.tsx
- apps/frontend/app/notifications/page.tsx
- apps/frontend/lib/api/notifications-api.ts
- apps/frontend/hooks/useNotifications.ts

디자인 요구사항 (/frontend-design 스킬 활용):
- 드롭다운은 헤더 아래 오른쪽 정렬
- 알림 아이템은 호버 시 배경색 변경
- 읽지 않은 알림은 왼쪽 파란색 바 표시
- 애니메이션: 드롭다운 슬라이드, 뱃지 펄스

제약사항:
- 알림 클릭 시 관련 리소스 페이지로 이동
- 읽음 처리 실패 시 재시도 로직
- 알림 개수는 최대 99+로 표시

검증:
- 알림 드롭다운 동작 확인
- 알림 클릭 시 이동 및 읽음 처리 확인
- 전체 알림 페이지 필터 동작 확인

Playwright 테스트:
- 새 알림 발생 시 카운트 업데이트 확인
- 알림 클릭 시 해당 페이지로 이동 확인
- 읽음 처리 후 스타일 변경 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-4

- [ ] NotificationBell.tsx 컴포넌트 생성됨
- [ ] NotificationDropdown.tsx 컴포넌트 생성됨
- [ ] NotificationItem.tsx 컴포넌트 생성됨
- [ ] Header.tsx에 알림 아이콘 추가됨
- [ ] notifications/page.tsx 생성됨
- [ ] notifications-api.ts API 함수 생성됨
- [ ] useNotifications.ts 훅 생성됨
- [ ] 알림 유형별 아이콘/색상 구현됨
- [ ] 드롭다운 애니메이션 구현됨
- [ ] 읽음 처리 및 스타일 변경 구현됨
- [ ] 전체 알림 페이지 필터 구현됨
- [ ] 무한 스크롤 구현됨
- [ ] Playwright 테스트 작성됨 (notifications.spec.ts)
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/notifications.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Notifications', () => {
  test('알림 드롭다운 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // 알림 벨 클릭
    await testOperatorPage.getByTestId('notification-bell').click();

    // 드롭다운 표시 확인
    await expect(testOperatorPage.getByTestId('notification-dropdown')).toBeVisible();
  });

  test('알림 클릭 시 이동 및 읽음 처리', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');
    await testOperatorPage.getByTestId('notification-bell').click();

    // 첫 번째 알림 클릭
    const firstNotification = testOperatorPage.getByTestId('notification-item').first();
    await firstNotification.click();

    // 관련 페이지로 이동 확인
    await expect(testOperatorPage).not.toHaveURL('/dashboard');
  });

  test('전체 알림 페이지 필터', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 읽지 않은 알림 필터
    await testOperatorPage.getByLabel('읽지 않음').check();

    // 읽은 알림이 숨겨지는지 확인
    const readItems = testOperatorPage.getByTestId('notification-item.read');
    await expect(readItems).toHaveCount(0);
  });
});
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

| 프롬프트         | equipment-management | nextjs-16         | frontend-design | playwright-skill   |
| ---------------- | -------------------- | ----------------- | --------------- | ------------------ |
| UI-1 대시보드    | ✅ 역할 체계         | ✅ App Router     | ✅ 카드 디자인  | ✅ 역할별 테스트   |
| UI-2 장비 목록   | ✅ 장비 상태         | ✅ URL 상태       | ✅ 테이블/카드  | ✅ 필터 테스트     |
| UI-3 승인 관리   | ✅ 승인 프로세스     | ✅ Server Actions | ✅ 탭/모달      | ✅ 승인 플로우     |
| UI-4 알림        | ✅ 알림 유형         | ✅ 클라이언트     | ✅ 드롭다운     | ✅ 알림 테스트     |
| UI-5 보고서      | ✅ 교정계획서        | ✅ 동적 라우트    | ✅ 인쇄 스타일  | ✅ 다운로드        |
| UI-6 접근성      | -                    | ✅ 레이아웃       | ✅ 반응형       | ✅ a11y 테스트     |
| UI-7 로그인      | ✅ 역할 체계         | ✅ NextAuth       | ✅ 로그인 폼    | ✅ 인증 테스트     |
| UI-8 장비 폼     | ✅ 장비 필드         | ✅ 폼 처리        | ✅ 폼 디자인    | ✅ 폼 테스트       |
| UI-9 장비 상세   | ✅ 장비 상태         | ✅ 탭 라우팅      | ✅ 탭/배너      | ✅ 상세 테스트     |
| UI-10 교정       | ✅ 교정 프로세스     | ✅ Server Actions | ✅ 폼/목록      | ✅ 교정 테스트     |
| UI-11 교정계획서 | ✅ 교정계획서        | ✅ 동적 라우트    | ✅ 일정 UI      | ✅ 계획서 테스트   |
| UI-12 대여       | ✅ 대여 프로세스     | ✅ Server Actions | ✅ 캘린더       | ✅ 대여 테스트     |
| UI-13 반출       | ✅ 반출 프로세스     | ✅ Server Actions | ✅ 검사 폼      | ✅ 반출 테스트     |
| UI-14 보정계수   | ✅ 보정계수          | ✅ 동적 라우트    | ✅ JSON 에디터  | ✅ 보정계수 테스트 |
| UI-15 부적합     | ✅ 부적합 관리       | ✅ Server Actions | ✅ 타임라인     | ✅ 부적합 테스트   |
| UI-16 수리이력   | ✅ 수리 관리         | ✅ 동적 라우트    | ✅ 타임라인     | ✅ 수리 테스트     |
| UI-17 소프트웨어 | ✅ 소프트웨어        | ✅ 동적 라우트    | ✅ 라이선스 UI  | ✅ SW 테스트       |
| UI-18 팀 관리    | ✅ 팀 구조           | ✅ 동적 라우트    | ✅ 팀 카드      | ✅ 팀 테스트       |
| UI-19 설정       | ✅ 시스템 설정       | ✅ Server Actions | ✅ 토글 UI      | ✅ 설정 테스트     |
