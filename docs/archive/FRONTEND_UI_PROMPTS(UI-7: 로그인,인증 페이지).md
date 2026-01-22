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

---

## UI-7: 로그인/인증 페이지

### 목적

Azure AD 및 로컬 인증을 지원하는 **프로페셔널하고 신뢰감 있는** 로그인 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 로그인/인증 페이지를 구현해줘.

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

=== 2. 인증 기능 요구사항 ===

2.1 인증 방법
- Azure AD (Microsoft 계정) - 운영 환경 기본
- Credentials (이메일/비밀번호) - 개발 환경
- 환경 변수로 활성화 제어

2.2 로그인 폼 검증
- 이메일: 필수, 유효한 이메일 형식
- 비밀번호: 필수, 최소 1자
- Zod 스키마 + react-hook-form 사용
- 실시간 검증 피드백 (onBlur)

2.3 보안 요구사항
- callbackUrl 검증: 같은 도메인만 허용, 외부 URL 차단
- XSS 방지: 사용자 입력 sanitize
- HTTPS 강제 (프로덕션)

2.4 에러 처리
- 네트워크 오류: "서버에 연결할 수 없습니다"
- 인증 실패: "이메일 또는 비밀번호가 일치하지 않습니다"
- 서버 오류: "일시적인 오류가 발생했습니다"
- 에러 메시지는 role="alert" aria-live="polite"로 접근성 보장

=== 3. 파일 구조 ===

apps/frontend/
├── app/(auth)/
│   ├── layout.tsx (인증 페이지 공통 레이아웃)
│   ├── login/
│   │   └── page.tsx (로그인 페이지 - UL Corporate Professional 스타일)
│   └── error/
│       └── page.tsx (인증 에러 페이지)
├── components/auth/
│   ├── LoginForm.tsx (로컬 로그인 폼 - UL Midnight Blue 버튼)
│   ├── AzureAdButton.tsx (Azure AD 로그인 버튼)
│   ├── AuthProviders.tsx (인증 제공자 훅)
│   └── BrandingSection.tsx (브랜딩 섹션 - Midnight Blue 배경)
├── components/layout/
│   ├── Header.tsx (헤더 - 다크모드 지원)
│   └── ThemeToggle.tsx (다크모드 토글 컴포넌트)
├── lib/
│   ├── providers.tsx (ThemeProvider + SessionProvider)
│   └── auth/
│       └── auth-utils.ts (인증 유틸리티)
├── styles/
│   └── globals.css (CSS Variables - UL 색상 시스템)
└── tailwind.config.js (UL 색상 팔레트 정의)

=== 4. Playwright 테스트 요구사항 ===

중요: 모든 테스트는 명확하게 PASS 또는 FAIL해야 함.
- `.catch(() => {})` 같은 예외 무시 패턴 금지
- 조건부 assertion 금지 (if문 안에서 expect 사용 금지)
- 각 테스트는 독립적이고 결정론적이어야 함

4.1 렌더링 테스트 (4/4 PASS)
- [x] 로그인 페이지 기본 요소 렌더링 확인 (Welcome back, 설명 텍스트)
- [x] 이메일 입력 필드 존재 확인 (id="email", type="email", autocomplete="email")
- [x] 비밀번호 입력 필드 존재 확인 (id="password", type="password", autocomplete="current-password")
- [x] 로그인 버튼 존재 확인 (data-testid="login-button", enabled)

4.2 폼 유효성 검증 테스트 (4/4 PASS)
- [x] 이메일 필드 required 확인 (type="email", placeholder 존재)
- [x] 비밀번호 필드 타입 확인 (type="password", autocomplete="current-password")
- [x] 폼 제출 시 입력값 유지됨 확인
- [x] 유효한 입력 시 초기 에러 없음 확인 (#email-error, #password-error 미표시)

4.3 로그인 플로우 테스트 (2/2 PASS)
- [x] 잘못된 자격 증명으로 로그인 시 에러 메시지 표시 (data-testid="login-error")
- [x] 로딩 상태 표시 확인 (버튼 클릭 후 상태 확인)

4.4 반응형 레이아웃 테스트 (2/2 PASS) - UL Corporate Professional 디자인 기준
- [x] 데스크톱 (1280px): 스플릿 레이아웃 (좌측 Midnight Blue 브랜딩, 우측 로그인 폼)
- [x] 모바일 (375px): 로그인 폼 전체 표시 (상단 Midnight Blue 헤더 + email, password 필드 visible)

4.5 접근성 테스트 (5/5 PASS)
- [x] 키보드 네비게이션: Tab 순서 (이메일 → 비밀번호 → 로그인 버튼)
- [x] 포커스 가시성: 포커스된 요소 확인 (toBeFocused)
- [x] 에러 메시지에 role="alert" 속성
- [x] 입력 필드에 올바른 label 연결 (label[for="email"], label[for="password"])
- [x] 메인 랜드마크 확인 (main[role="main"])

4.6 에러 페이지 테스트 (4/4 PASS)
- [x] /error?error=Default 접근 시 에러 페이지 표시 (에러 제목: "인증 오류")
- [x] 특정 에러 코드 표시 확인 (CredentialsSignin → "로그인 실패", 오류 코드 표시)
- [x] 로그인 페이지로 돌아가기 링크 동작 (클릭 후 /login 이동)
- [x] 다시 시도 버튼 확인 (aria-label="페이지 새로고침")

테스트 파일: apps/frontend/tests/e2e/auth.spec.ts
테스트 결과: **21/21 PASS** (2025-01-20, Chromium)

=== 5. 검증 절차 ===

1. TypeScript 컴파일 확인: pnpm tsc --noEmit
2. 린트 확인: pnpm lint
3. Playwright 테스트 실행: NODE_ENV=test pnpm exec playwright test tests/e2e/auth.spec.ts
4. 수동 검증:
   - 개발 서버 실행 후 /login 접근
   - 반응형 디자인 확인 (DevTools 모바일 뷰)
   - 로그인 플로우 전체 테스트

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-7

#### 컴포넌트 구현

- [x] login/page.tsx **UL Solutions Corporate Professional 스타일**로 재구현됨 (2025-01-21)
- [x] BrandingSection.tsx **Midnight Blue 배경 + UL 브랜딩** 적용됨
- [x] AuthProviders.tsx 컴포넌트 생성됨
- [x] LoginForm.tsx **UL Midnight Blue 버튼, CSS 변수 기반 색상** 적용됨
- [x] AzureAdButton.tsx 컴포넌트 개선됨
- [x] error/page.tsx 인증 에러 페이지 생성됨
- [x] auth-utils.ts 유틸리티 생성됨
- [x] **ThemeToggle.tsx** 다크모드 토글 컴포넌트 신규 생성됨

#### 디자인 구현 (UL Solutions Corporate Professional 스타일)

- [x] **스플릿 레이아웃**: 좌측 Midnight Blue 브랜딩 / 우측 흰색 로그인 폼
- [x] **UL 색상 시스템**: Midnight Blue (#122C49), Bright Red (#CA0123), Fog (#577E9E)
- [x] **브랜딩 섹션**: Midnight Blue 배경 + UL Red 로고 아이콘 + 기능 하이라이트 카드
- [x] **로그인 카드**: 흰색 배경, shadow-lg, rounded-2xl
- [x] **로그인 버튼**: UL Midnight Blue (hover 시 darker)
- [x] **입력 필드**: CSS 변수 기반 테두리/포커스 + 아이콘 prefix
- [x] **애니메이션 효과**: fade-in, shake (에러 시), scale-in (성공 시)
- [x] **반응형 레이아웃**: 모바일(폼만) / 데스크톱(50:50 스플릿)
- [x] **다크모드 지원**: ThemeProvider + ThemeToggle 구현됨

#### 색상 시스템 구현

- [x] tailwind.config.js에 UL 색상 팔레트 추가됨 (ul-midnight, ul-red, ul-green, ul-orange, ul-fog, ul-info, ul-gray)
- [x] globals.css CSS Variables UL 색상으로 업데이트됨
- [x] 다크모드 CSS Variables 정의됨
- [x] 세만틱 컬러 추가됨 (success, warning, info)

#### 기능 검증

- [x] Azure AD 로그인 플로우 동작 확인됨
- [x] 로컬 로그인 폼 유효성 검증됨 (Zod + react-hook-form)
- [x] 로그인 성공 시 리다이렉트 동작 확인됨
- [x] 로그인 실패 시 에러 메시지 표시됨 (shake 애니메이션 포함)
- [x] callbackUrl 보안 검증됨
- [x] **다크모드 토글** 동작 확인됨 (라이트/다크/시스템)

#### 테스트 검증

- [x] Playwright 테스트 작성됨 (auth.spec.ts)
- [x] 렌더링 테스트 통과 (4/4)
- [x] 폼 유효성 검증 테스트 통과 (4/4)
- [x] 로그인 플로우 테스트 통과 (2/2)
- [x] 반응형 레이아웃 테스트 통과 (2/2)
- [x] 접근성 테스트 통과 (5/5)
- [x] 에러 페이지 테스트 통과 (4/4)
- [ ] **디자인 변경 후 테스트 재검증 필요** (UL 스타일 적용으로 일부 selector 변경 가능)

---

## 개발/프로덕션 인증 환경 분리 가이드

### 환경별 인증 방식

| 환경         | 인증 방식              | 활성화 조건                                          | 용도                |
| ------------ | ---------------------- | ---------------------------------------------------- | ------------------- |
| **개발**     | Credentials (로컬)     | `NODE_ENV=development` 또는 `ENABLE_LOCAL_AUTH=true` | 빠른 개발 및 테스트 |
| **스테이징** | Azure AD + Credentials | 둘 다 활성화                                         | 통합 테스트         |
| **프로덕션** | Azure AD만             | `ENABLE_LOCAL_AUTH` 미설정 + Azure AD 환경변수 필수  | 보안 운영           |

### 개발 환경에서 로컬 인증 사용이 적합한 이유

1. **인증 로직 동일**: JWT 발급/검증, RBAC 권한 체계는 인증 방식과 무관하게 동작
2. **테스트 커버리지 유지**: 로그인 이후 모든 비즈니스 로직 테스트 가능
3. **업계 표준 패턴**: SSO를 사용하는 대부분의 기업 앱이 이 방식 채택
4. **빠른 개발 사이클**: Azure AD 설정 없이 즉시 개발 시작 가능

### 개발 환경의 한계점

- Azure AD 특정 클레임(groups, roles, department) 매핑 로직 테스트 불가
- 토큰 갱신(refresh_token) 흐름 테스트 불가
- Azure AD 그룹 → 시스템 역할 매핑 검증 불가
- SSO 로그아웃(Single Sign-Out) 동작 확인 불가

---

## Azure AD 프로덕션 배포 전 통합 테스트

> **중요**: 프로덕션 배포 전 반드시 스테이징 환경에서 실제 Azure AD 연동 테스트 수행 필요

### 스테이징 환경 구성 체크리스트

#### Azure AD 앱 등록

- [ ] Azure Portal에서 앱 등록 완료
- [ ] 리다이렉트 URI 설정: `https://staging.example.com/api/auth/callback/azure-ad`
- [ ] 클라이언트 시크릿 생성 및 안전하게 저장
- [ ] API 권한 설정: `openid`, `profile`, `email`, `offline_access`, `User.Read`
- [ ] 관리자 동의 완료 (필요 시)

#### 환경변수 설정

```env
# 스테이징 환경 (.env.staging)
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_REDIRECT_URI=https://staging.example.com/api/auth/callback/azure-ad

# 스테이징에서는 로컬 인증도 함께 활성화 (선택)
ENABLE_LOCAL_AUTH=true
```

#### Azure AD 그룹 → 역할 매핑 설정

- [ ] Azure AD 그룹 생성
  - `EMS-TestOperators` → `test_engineer`
  - `EMS-TechnicalManagers` → `technical_manager`
  - `EMS-SiteAdmins` → `lab_manager`
- [ ] 앱 매니페스트에서 `groupMembershipClaims` 설정: `"SecurityGroup"` 또는 `"All"`
- [ ] 테스트 사용자를 각 그룹에 할당

---

### Azure AD 통합 테스트 케이스

#### TC-AAD-01: 기본 로그인 플로우

| 항목            | 내용                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **목적**        | Azure AD를 통한 로그인 → 대시보드 리다이렉션 확인                                                                                                                                   |
| **사전조건**    | Azure AD에 등록된 테스트 계정                                                                                                                                                       |
| **테스트 단계** | 1. /login 페이지 접근<br>2. "Microsoft 계정으로 로그인" 클릭<br>3. Azure AD 로그인 페이지에서 자격 증명 입력<br>4. 동의 화면 확인 (최초 로그인 시)<br>5. 대시보드로 리다이렉션 확인 |
| **예상 결과**   | 로그인 성공 후 /dashboard로 이동, 사용자 정보 표시                                                                                                                                  |
| **검증 항목**   | - 세션 쿠키 생성됨<br>- JWT 토큰에 사용자 정보 포함<br>- 프로필에 이름/이메일 표시                                                                                                  |

#### TC-AAD-02: 역할 매핑 검증

| 항목            | 내용                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **목적**        | Azure AD 그룹이 시스템 역할로 올바르게 매핑되는지 확인                                                                                                                                                                                          |
| **사전조건**    | 각 역할 그룹에 속한 테스트 계정 3개                                                                                                                                                                                                             |
| **테스트 단계** | 1. `EMS-TestOperators` 그룹 사용자로 로그인<br>2. 역할 확인: `test_engineer`<br>3. `EMS-TechnicalManagers` 그룹 사용자로 로그인<br>4. 역할 확인: `technical_manager`<br>5. `EMS-SiteAdmins` 그룹 사용자로 로그인<br>6. 역할 확인: `lab_manager` |
| **예상 결과**   | 그룹 멤버십에 따라 올바른 역할 할당                                                                                                                                                                                                             |
| **검증 항목**   | - JWT payload의 `roles` 필드<br>- 대시보드 UI 역할별 분기<br>- API 권한 동작 (승인 버튼 등)                                                                                                                                                     |

#### TC-AAD-03: 클레임 매핑 검증

| 항목            | 내용                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **목적**        | Azure AD 클레임이 시스템 사용자 정보로 올바르게 매핑되는지 확인                                                                          |
| **사전조건**    | Azure AD 프로필에 department, jobTitle 등 설정된 계정                                                                                    |
| **테스트 단계** | 1. Azure AD 계정으로 로그인<br>2. /api/auth/profile 호출<br>3. 반환된 사용자 정보 확인                                                   |
| **예상 결과**   | 아래 클레임 매핑 정상 동작                                                                                                               |
| **검증 항목**   | - `oid` → `userId`<br>- `preferred_username` → `email`<br>- `name` → `name`<br>- `department` → `department`<br>- `groups[]` → `roles[]` |

#### TC-AAD-04: 토큰 갱신 (Refresh Token)

| 항목            | 내용                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **목적**        | 액세스 토큰 만료 후 자동 갱신 동작 확인                                                                                                      |
| **사전조건**    | 로그인된 세션, 토큰 만료 시간 경과 (또는 짧은 만료 시간 설정)                                                                                |
| **테스트 단계** | 1. 로그인 후 토큰 만료 시간 확인<br>2. 토큰 만료 시간까지 대기 (또는 테스트용으로 짧게 설정)<br>3. 보호된 API 호출<br>4. 토큰 자동 갱신 확인 |
| **예상 결과**   | 사용자 개입 없이 새 토큰 발급, 세션 유지                                                                                                     |
| **검증 항목**   | - 401 에러 없이 API 호출 성공<br>- 새 토큰 발급됨<br>- 사용자 경험 중단 없음                                                                 |

#### TC-AAD-05: 로그아웃 플로우

| 항목            | 내용                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **목적**        | 로그아웃 시 세션 및 Azure AD 세션 정리 확인                                                                                    |
| **테스트 단계** | 1. 로그인된 상태에서 로그아웃 클릭<br>2. 로컬 세션 삭제 확인<br>3. /dashboard 접근 시도<br>4. Azure AD 재로그인 필요 여부 확인 |
| **예상 결과**   | 로컬 세션 삭제, /login으로 리다이렉션                                                                                          |
| **검증 항목**   | - 세션 쿠키 삭제됨<br>- 보호된 페이지 접근 차단<br>- (선택) Azure AD Single Sign-Out 동작                                      |

#### TC-AAD-06: 인증 에러 처리

| 항목              | 내용                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **목적**          | Azure AD 인증 실패 시 적절한 에러 처리 확인                                                                                  |
| **테스트 케이스** | 1. 잘못된 자격 증명 입력<br>2. 권한 없는 사용자 (앱 접근 제한)<br>3. 만료된 토큰으로 API 호출<br>4. 네트워크 오류 시뮬레이션 |
| **예상 결과**     | 적절한 에러 메시지 표시, /error 페이지로 이동                                                                                |
| **검증 항목**     | - 에러 코드별 메시지 (AccessDenied, OAuthCallback 등)<br>- 사용자 친화적 에러 안내<br>- 재시도 옵션 제공                     |

#### TC-AAD-07: Callback URL 보안 검증

| 항목            | 내용                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **목적**        | 외부 URL로의 악의적 리다이렉션 차단 확인                                                        |
| **테스트 단계** | 1. `/login?callbackUrl=https://malicious.com` 접근<br>2. 로그인 수행<br>3. 리다이렉션 대상 확인 |
| **예상 결과**   | 외부 URL 무시, 기본 대시보드로 이동                                                             |
| **검증 항목**   | - 같은 도메인만 허용<br>- 외부 URL 차단<br>- 기본 fallback 동작                                 |

#### TC-AAD-08: 동시 세션 처리

| 항목            | 내용                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| **목적**        | 여러 브라우저/디바이스에서 동시 로그인 동작 확인                                         |
| **테스트 단계** | 1. 브라우저 A에서 로그인<br>2. 브라우저 B에서 동일 계정 로그인<br>3. 양쪽 세션 동작 확인 |
| **예상 결과**   | 정책에 따른 동작 (동시 허용 또는 기존 세션 종료)                                         |
| **검증 항목**   | - 세션 관리 정책 준수<br>- 사용자 알림 (필요 시)                                         |

---

### Azure AD 통합 체크리스트

#### 프로덕션 배포 전 필수 확인

**환경 설정**

- [ ] 프로덕션 Azure AD 앱 등록 완료
- [ ] 프로덕션 리다이렉트 URI 설정
- [ ] 클라이언트 시크릿 프로덕션 환경에 안전하게 설정
- [ ] `ENABLE_LOCAL_AUTH` 환경변수 제거 또는 `false` 설정
- [ ] HTTPS 강제 적용 확인

**기능 검증**

- [ ] TC-AAD-01: 기본 로그인 플로우 통과
- [ ] TC-AAD-02: 역할 매핑 검증 통과 (3개 역할 모두)
- [ ] TC-AAD-03: 클레임 매핑 검증 통과
- [ ] TC-AAD-04: 토큰 갱신 동작 확인
- [ ] TC-AAD-05: 로그아웃 플로우 통과
- [ ] TC-AAD-06: 인증 에러 처리 확인
- [ ] TC-AAD-07: Callback URL 보안 검증 통과
- [ ] TC-AAD-08: 동시 세션 처리 확인

**보안 검증**

- [ ] Azure AD 앱에 최소 권한 원칙 적용
- [ ] 클라이언트 시크릿 주기적 갱신 계획 수립
- [ ] 로그인 실패 로깅 및 모니터링 설정
- [ ] 의심스러운 로그인 시도 알림 설정 (선택)

**운영 준비**

- [ ] Azure AD 서비스 장애 시 대응 계획 수립
- [ ] 사용자 온보딩 문서 준비 (Azure AD 로그인 안내)
- [ ] 관리자용 Azure AD 그룹 관리 가이드 작성
- [ ] 로그인 문제 발생 시 지원 프로세스 정의

---

### 관련 파일 위치

#### 프론트엔드 인증/디자인 파일

| 구분            | 파일 경로                                           | 설명                                      |
| --------------- | --------------------------------------------------- | ----------------------------------------- |
| 로그인 페이지   | `apps/frontend/app/(auth)/login/page.tsx`           | UL Corporate Professional 스플릿 레이아웃 |
| 브랜딩 섹션     | `apps/frontend/components/auth/BrandingSection.tsx` | Midnight Blue 배경 + UL 브랜딩            |
| 로그인 폼       | `apps/frontend/components/auth/LoginForm.tsx`       | UL 색상 적용된 로그인 폼                  |
| 다크모드 토글   | `apps/frontend/components/layout/ThemeToggle.tsx`   | 라이트/다크/시스템 토글                   |
| 전역 프로바이더 | `apps/frontend/lib/providers.tsx`                   | ThemeProvider + SessionProvider           |
| Tailwind 설정   | `apps/frontend/tailwind.config.js`                  | UL 색상 팔레트 정의                       |
| 글로벌 스타일   | `apps/frontend/styles/globals.css`                  | CSS Variables (UL 색상, 다크모드)         |
| NextAuth 설정   | `apps/frontend/lib/auth.ts`                         | 프로바이더 조건부 활성화                  |
| 미들웨어        | `apps/frontend/middleware.ts`                       | JWT 토큰 검증                             |

#### 백엔드 인증 파일

| 구분          | 파일 경로                                                       | 설명                 |
| ------------- | --------------------------------------------------------------- | -------------------- |
| Azure AD 전략 | `apps/backend/src/modules/auth/strategies/azure-ad.strategy.ts` | 클레임 매핑 로직     |
| 테스트 계정   | `apps/backend/src/modules/auth/auth.service.ts`                 | 개발용 하드코딩 계정 |
| 역할 정의     | `apps/backend/src/modules/auth/rbac/roles.enum.ts`              | 시스템 역할          |
| 권한 매핑     | `apps/backend/src/modules/auth/rbac/role-permissions.ts`        | 역할별 권한          |

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
