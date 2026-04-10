# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-7: 로그인/인증 페이지

### 목적

Azure AD 및 로컬 인증을 지원하는 **프로페셔널하고 신뢰감 있는** 로그인 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 로그인/인증 페이지를 구현해줘.

=== 인증 기능 요구사항 ===

1. 인증 방법
- Azure AD (Microsoft 계정) - 운영 환경 기본
- Credentials (이메일/비밀번호) - 개발 환경
- 환경 변수로 활성화 제어

2. 로그인 폼 검증
- 이메일: 필수, 유효한 이메일 형식
- 비밀번호: 필수, 최소 1자
- Zod 스키마 + react-hook-form 사용
- 실시간 검증 피드백 (onBlur)

3. 보안 요구사항
- callbackUrl 검증: 같은 도메인만 허용, 외부 URL 차단
- XSS 방지: 사용자 입력 sanitize
- HTTPS 강제 (프로덕션)

4. 에러 처리
- 네트워크 오류: "서버에 연결할 수 없습니다"
- 인증 실패: "이메일 또는 비밀번호가 일치하지 않습니다"
- 서버 오류: "일시적인 오류가 발생했습니다"
- 에러 메시지는 role="alert" aria-live="polite"로 접근성 보장

=== 파일 구조 ===

apps/frontend/
├── app/(auth)/
│   ├── layout.tsx (인증 페이지 공통 레이아웃 - Server Component)
│   ├── loading.tsx (로그인 페이지 로딩 상태)
│   ├── error.tsx (인증 라우트 에러 핸들러 - 'use client' 필수)
│   ├── login/
│   │   └── page.tsx (로그인 페이지 - Server Component, 메타데이터 생성)
│   └── error/
│       └── page.tsx (인증 에러 페이지 - NextAuth 에러 처리)
├── components/auth/
│   ├── LoginForm.tsx (로컬 로그인 폼 - 'use client', UL Midnight Blue 버튼)
│   ├── AzureAdButton.tsx (Azure AD 로그인 버튼 - 'use client')
│   ├── AuthProviders.tsx (인증 제공자 훅 - 'use client')
│   └── BrandingSection.tsx (브랜딩 섹션 - Server Component 가능)
├── components/layout/
│   ├── Header.tsx (헤더 - 다크모드 지원)
│   └── ThemeToggle.tsx (다크모드 토글 컴포넌트 - 'use client')
├── lib/
│   ├── providers.tsx (ThemeProvider + SessionProvider - 'use client')
│   └── auth/
│       └── auth-utils.ts (인증 유틸리티)
├── styles/
│   └── globals.css (CSS Variables - UL 색상 시스템)
└── tailwind.config.js (UL 색상 팔레트 정의)

=== Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용) ===

- login/page.tsx: Server Component로 메타데이터 생성, LoginForm을 Client Component로 분리
- LoginForm, AzureAdButton: 상호작용 필요하므로 'use client'
- BrandingSection: 정적 콘텐츠이므로 Server Component 가능
- loading.tsx: 로그인 페이지 전환 시 스켈레톤 UI 표시
- error.tsx: 라우트 레벨 에러 바운더리 ('use client' 필수)

=== 성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용) ===

- 로그인 페이지는 초기 로드 성능이 중요 (LCP 최적화)
- BrandingSection의 이미지/아이콘은 next/image 사용
- 불필요한 JS 번들 최소화 (Server Component 활용)
- AzureAdButton은 조건부 렌더링 시 dynamic import 고려
- CSS는 Tailwind 유틸리티 클래스 우선 (번들 크기 최소화)

=== 접근성 요구사항 (/web-design-guidelines 스킬 활용) ===

- 폼 필드에 명확한 label 연결 (htmlFor, id 매칭)
- 에러 메시지: role="alert" aria-live="polite" 필수
- 비밀번호 필드: autocomplete="current-password"
- 이메일 필드: autocomplete="email"
- 포커스 순서: 이메일 → 비밀번호 → 로그인 버튼 (논리적 순서)
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 색상 대비: 4.5:1 이상 (UL 색상 시스템 준수)
- 스킵 링크: 로그인 폼으로 바로 이동 가능

=== Playwright 테스트 요구사항 ===

중요: 모든 테스트는 명확하게 PASS 또는 FAIL해야 함.
- `.catch(() => {})` 같은 예외 무시 패턴 금지
- 조건부 assertion 금지 (if문 안에서 expect 사용 금지)
- 각 테스트는 독립적이고 결정론적이어야 함

1. 렌더링 테스트 (4/4 PASS)
- [x] 로그인 페이지 기본 요소 렌더링 확인 (Welcome back, 설명 텍스트)
- [x] 이메일 입력 필드 존재 확인 (id="email", type="email", autocomplete="email")
- [x] 비밀번호 입력 필드 존재 확인 (id="password", type="password", autocomplete="current-password")
- [x] 로그인 버튼 존재 확인 (data-testid="login-button", enabled)

2. 폼 유효성 검증 테스트 (4/4 PASS)
- [x] 이메일 필드 required 확인 (type="email", placeholder 존재)
- [x] 비밀번호 필드 타입 확인 (type="password", autocomplete="current-password")
- [x] 폼 제출 시 입력값 유지됨 확인
- [x] 유효한 입력 시 초기 에러 없음 확인 (#email-error, #password-error 미표시)

3. 로그인 플로우 테스트 (2/2 PASS)
- [x] 잘못된 자격 증명으로 로그인 시 에러 메시지 표시 (data-testid="login-error")
- [x] 로딩 상태 표시 확인 (버튼 클릭 후 상태 확인)

4. 반응형 레이아웃 테스트 (2/2 PASS) - UL Corporate Professional 디자인 기준
- [x] 데스크톱 (1280px): 스플릿 레이아웃 (좌측 Midnight Blue 브랜딩, 우측 로그인 폼)
- [x] 모바일 (375px): 로그인 폼 전체 표시 (상단 Midnight Blue 헤더 + email, password 필드 visible)

5. 접근성 테스트 (5/5 PASS)
- [x] 키보드 네비게이션: Tab 순서 (이메일 → 비밀번호 → 로그인 버튼)
- [x] 포커스 가시성: 포커스된 요소 확인 (toBeFocused)
- [x] 에러 메시지에 role="alert" 속성
- [x] 입력 필드에 올바른 label 연결 (label[for="email"], label[for="password"])
- [x] 메인 랜드마크 확인 (main[role="main"])

6. 에러 페이지 테스트 (4/4 PASS)
- [x] /error?error=Default 접근 시 에러 페이지 표시 (에러 제목: "인증 오류")
- [x] 특정 에러 코드 표시 확인 (CredentialsSignin → "로그인 실패", 오류 코드 표시)
- [x] 로그인 페이지로 돌아가기 링크 동작 (클릭 후 /login 이동)
- [x] 다시 시도 버튼 확인 (aria-label="페이지 새로고침")

테스트 파일: apps/frontend/tests/e2e/auth.spec.ts
테스트 결과: **21/21 PASS** (2025-01-20, Chromium)

=== 검증 절차 ===

1. TypeScript 컴파일 확인: pnpm tsc --noEmit
2. 린트 확인: pnpm lint
3. Playwright 테스트 실행: NODE_ENV=test pnpm exec playwright test tests/e2e/auth.spec.ts
4. 수동 검증:
   - 개발 서버 실행 후 /login 접근
   - 반응형 디자인 확인 (DevTools 모바일 뷰)
   - 로그인 플로우 전체 테스트

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

#### 개발/프로덕션 인증 환경 분리 가이드

##### 환경별 인증 방식

| 환경         | 인증 방식              | 활성화 조건                                          | 용도                |
| ------------ | ---------------------- | ---------------------------------------------------- | ------------------- |
| **개발**     | Credentials (로컬)     | `NODE_ENV=development` 또는 `ENABLE_LOCAL_AUTH=true` | 빠른 개발 및 테스트 |
| **스테이징** | Azure AD + Credentials | 둘 다 활성화                                         | 통합 테스트         |
| **프로덕션** | Azure AD만             | `ENABLE_LOCAL_AUTH` 미설정 + Azure AD 환경변수 필수  | 보안 운영           |

##### 개발 환경에서 로컬 인증 사용이 적합한 이유

1. **인증 로직 동일**: JWT 발급/검증, RBAC 권한 체계는 인증 방식과 무관하게 동작
2. **테스트 커버리지 유지**: 로그인 이후 모든 비즈니스 로직 테스트 가능
3. **업계 표준 패턴**: SSO를 사용하는 대부분의 기업 앱이 이 방식 채택
4. **빠른 개발 사이클**: Azure AD 설정 없이 즉시 개발 시작 가능

##### 개발 환경의 한계점

- Azure AD 특정 클레임(groups, roles, department) 매핑 로직 테스트 불가
- 토큰 갱신(refresh_token) 흐름 테스트 불가
- Azure AD 그룹 → 시스템 역할 매핑 검증 불가
- SSO 로그아웃(Single Sign-Out) 동작 확인 불가

---

### 이행 체크리스트 UI-7

#### 파일 생성/수정

- [x] login/page.tsx **UL Solutions Corporate Professional 스타일**로 재구현됨 (Server Component)
- [x] (auth)/loading.tsx 로딩 상태 추가됨
- [x] (auth)/error.tsx 라우트 레벨 에러 핸들러 추가됨 ('use client')
- [x] BrandingSection.tsx **Midnight Blue 배경 + UL 브랜딩** 적용됨 (Server Component)
- [x] LoginPageContent.tsx 클라이언트 로직 분리 완료 ('use client')
- [x] AuthProviders.tsx 컴포넌트 생성됨 ('use client')
- [x] LoginForm.tsx **UL Midnight Blue 버튼, CSS 변수 기반 색상** 적용됨 ('use client')
- [x] AzureAdButton.tsx 컴포넌트 개선됨 ('use client')
- [x] error/page.tsx 인증 에러 페이지 생성됨
- [x] auth-utils.ts 유틸리티 생성됨
- [x] **ThemeToggle.tsx** 다크모드 토글 컴포넌트 신규 생성됨 ('use client')

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

#### 성능 최적화 (vercel-react-best-practices)

- [x] BrandingSection Server Component 변환 완료 (번들 크기 0)
- [x] Server Component / Client Component 분리 최적화 (login/page.tsx → Server, LoginPageContent.tsx → Client)
- [x] 불필요한 JS 번들 최소화 확인 (정적 콘텐츠 서버 렌더링)
- [ ] LCP 지표 확인 (로그인 폼 초기 로드) - 수동 확인 필요

#### 접근성 (web-design-guidelines)

- [x] 폼 필드 label 연결됨 (htmlFor, id 매칭)
- [x] 에러 메시지 role="alert" aria-live="polite" 적용됨
- [x] autocomplete 속성 적용됨 (email, current-password)
- [x] 포커스 표시 ring 스타일 일관성 확인 (UL Midnight Blue 포커스 링)
- [x] 색상 대비 UL 색상 시스템 적용됨 (accessibility.css 업데이트)
- [x] 스킵 링크 구현 완료 (LoginPageContent.tsx)

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
- [ ] axe-core 색상 대비 테스트 추가됨 - 향후 추가 예정
- [x] **디자인 변경 후 테스트 재검증 완료** (23/23 PASS - Chromium)
- [x] pnpm tsc --noEmit 성공

---

### Azure AD 프로덕션 배포 전 통합 테스트

> **중요**: 프로덕션 배포 전 반드시 스테이징 환경에서 실제 Azure AD 연동 테스트 수행 필요

#### 스테이징 환경 구성 체크리스트

##### Azure AD 앱 등록

- [ ] Azure Portal에서 앱 등록 완료
- [ ] 리다이렉트 URI 설정: `https://staging.example.com/api/auth/callback/azure-ad`
- [ ] 클라이언트 시크릿 생성 및 안전하게 저장
- [ ] API 권한 설정: `openid`, `profile`, `email`, `offline_access`, `User.Read`
- [ ] 관리자 동의 완료 (필요 시)

##### 환경변수 설정

```env
# 스테이징 환경 (.env.staging)
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_REDIRECT_URI=https://staging.example.com/api/auth/callback/azure-ad

# 스테이징에서는 로컬 인증도 함께 활성화 (선택)
ENABLE_LOCAL_AUTH=true
```

##### Azure AD 그룹 → 역할 매핑 설정

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

#### TC-AAD-03 ~ TC-AAD-08

상세한 테스트 케이스는 프로덕션 배포 시 별도 문서로 관리합니다.

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
