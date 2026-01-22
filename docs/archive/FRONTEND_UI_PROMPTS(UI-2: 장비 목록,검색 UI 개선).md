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

## UI-2: 장비 목록/검색 UI 개선

### 목적

고급 필터링 및 다양한 뷰 옵션을 제공하는 장비 목록 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 장비 목록/검색 UI를 개선해줘.

요구사항:
1. 다중 필터 시스템
   - 사이트 필터: 수원랩, 의왕랩
   - 팀 필터: RF팀, EMC팀, SAR팀 등
   - 상태 필터: 사용가능, 교정중, 수리중, 대여중, 반출중, 폐기
   - 교정방법 필터: 자체교정, 외부교정
   - 공용장비 필터: 공용, 비공용
   - 필터 조합 가능 (AND 조건)

2. 검색 기능
   - 통합 검색 (장비명, 모델명, 시리얼넘버, 관리번호)
   - 디바운스 적용 (300ms)
   - 검색어 하이라이팅

3. 정렬 옵션
   - 등록일순, 이름순, 교정일순, 상태순
   - 오름차순/내림차순 토글

4. 뷰 전환
   - 테이블 뷰: 상세 정보 표시, 열 정렬 가능
   - 카드 뷰: 시각적 그리드, 빠른 스캔
   - 뷰 상태 localStorage 저장

5. 페이지네이션
   - 페이지당 10/20/50개 선택
   - 페이지 번호 및 이전/다음 버튼
   - 총 개수 표시

6. URL 상태 관리
   - 필터/검색/정렬/페이지 상태를 쿼리 파라미터로 저장
   - 뒤로가기/새로고침 시 상태 유지
   - 공유 가능한 URL

파일:
- apps/frontend/app/equipment/page.tsx (개선)
- apps/frontend/components/equipment/EquipmentFilters.tsx (새 컴포넌트)
- apps/frontend/components/equipment/EquipmentSearchBar.tsx
- apps/frontend/components/equipment/EquipmentTable.tsx (개선)
- apps/frontend/components/equipment/EquipmentCardGrid.tsx (새 컴포넌트)
- apps/frontend/components/equipment/ViewToggle.tsx
- apps/frontend/components/equipment/Pagination.tsx
- apps/frontend/hooks/useEquipmentFilters.ts (필터 상태 관리 훅)

디자인 요구사항 (/frontend-design 스킬 활용):
- 필터는 사이드바 또는 상단 접이식 패널
- 테이블은 줄무늬(stripe) 스타일, hover 효과
- 카드는 그림자 효과, 상태별 색상 뱃지
- 빈 상태 UI (검색 결과 없음)
- 스켈레톤 로딩

제약사항:
- nuqs 또는 next/navigation useSearchParams 사용
- 서버 컴포넌트에서 초기 데이터 로드
- 필터 변경 시 URL 업데이트 및 데이터 재요청

검증:
- 필터 적용 후 결과 확인
- URL 공유 및 상태 복원 확인
- 뷰 전환 상태 유지 확인
- pnpm tsc --noEmit

Playwright 테스트:
- 필터 적용 후 결과 확인
- 페이지네이션 동작 확인
- 뷰 전환 상태 유지 확인
- URL 상태 복원 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

---

### 필수 가이드라인

아래 섹션들은 실제 발생한 버그와 코드 분석 결과를 반영한 필수 가이드라인입니다.

#### 1. API 호출 규칙 및 주의사항

**배경**: `/api/api/equipment` URL 중복 버그가 발생하여 404 에러 발생

**환경변수 규칙**:

```bash
# .env.local - 올바른 설정
NEXT_PUBLIC_API_URL=http://localhost:3001    # 호스트만, /api 미포함!

# 잘못된 설정 (절대 사용 금지)
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # /api가 포함되어 URL 중복 발생
```

**API 경로 규칙**:

```typescript
// 모든 API 경로는 '/api/'로 시작해야 함
const response = await apiClient.get('/api/equipment'); // ✅ 올바름
const response = await apiClient.get('/equipment'); // ❌ /api 누락
const response = await apiClient.get('/api/api/equipment'); // ❌ 중복
```

**흔한 실수 체크리스트**:

- [ ] `.env.local`의 `NEXT_PUBLIC_API_URL`에 `/api`가 포함되어 있지 않은가?
- [ ] API 파일 내 모든 경로가 `/api/`로 시작하는가?
- [ ] 개발자 도구 네트워크 탭에서 요청 URL이 올바른가?

**참고 파일**:

- `apps/frontend/lib/api/api-client.ts` - API 클라이언트 (경로 검증 로직 포함)
- `docs/development/API_STANDARDS.md` - API 표준 문서

---

#### 2. 에러 처리 요구사항

**배경**: `useQuery`의 error 필드를 사용하지 않아 에러 시 빈 화면 표시

**필수 에러 상태 처리**:

```typescript
import { ErrorAlert } from '@/components/shared/ErrorAlert';

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['equipment', filters],
  queryFn: () => equipmentApi.getList(filters),
  retry: 3,  // 자동 재시도 3회
});

// 에러 상태 처리 필수!
if (error) {
  return (
    <ErrorAlert
      title="장비 목록 로드 실패"
      message={error.message}
      onRetry={refetch}  // 재시도 버튼
    />
  );
}
```

**에러 유형별 처리**:
| HTTP 상태 | 에러 유형 | 처리 방법 |
|-----------|----------|----------|
| 401 | 인증 만료 | 로그인 페이지로 리다이렉트 |
| 403 | 권한 없음 | "접근 권한이 없습니다" 메시지 표시 |
| 404 | 리소스 없음 | "데이터를 찾을 수 없습니다" + 목록으로 돌아가기 |
| 500 | 서버 에러 | "서버 오류가 발생했습니다" + 재시도 버튼 |
| Network | 네트워크 오류 | "네트워크 연결을 확인해주세요" + 재시도 버튼 |

---

#### 3. 로딩/에러/빈 상태 UI 명세

**배경**: 기본 "Loading..." 텍스트만 표시되어 사용자 경험 저하

**스켈레톤 로딩 필수 구현**:

```typescript
import { Skeleton } from '@/components/ui/skeleton';

if (isLoading) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />  {/* 필터 */}
        <Skeleton className="h-10 flex-1" />      {/* 검색바 */}
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />  {/* 테이블 행 */}
        ))}
      </div>
    </div>
  );
}
```

**빈 상태 UI 구분**:

```typescript
// 필터 적용 결과가 없는 경우
if (data?.items.length === 0 && hasActiveFilters) {
  return (
    <div className="text-center py-12">
      <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">검색 결과가 없습니다</h3>
      <p className="text-muted-foreground">다른 검색어나 필터를 시도해보세요.</p>
      <div className="mt-4 flex gap-2 justify-center">
        {/* 적용된 필터 Badge 표시 */}
        {filters.site && <Badge variant="secondary">사이트: {filters.site}</Badge>}
        {filters.status && <Badge variant="secondary">상태: {filters.status}</Badge>}
      </div>
      <Button variant="outline" className="mt-4" onClick={clearFilters}>
        필터 초기화
      </Button>
    </div>
  );
}

// 데이터가 전혀 없는 경우
if (data?.items.length === 0) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">등록된 장비가 없습니다</h3>
      <p className="text-muted-foreground">첫 번째 장비를 등록해보세요.</p>
      <Button className="mt-4" asChild>
        <Link href="/equipment/create">장비 등록</Link>
      </Button>
    </div>
  );
}
```

---

#### 4. form 내 버튼 사용 규칙

**배경**: Dialog 버튼에 `type="button"` 누락으로 form submit이 발생하여 페이지 새로고침 또는 의도치 않은 제출

**핵심 규칙**: form 또는 Dialog 내부의 모든 Button에 type 속성 필수 명시!

```typescript
// ✅ 올바른 사용
<form onSubmit={handleSubmit}>
  <Button type="button" onClick={handleCancel}>취소</Button>      {/* 단순 클릭 */}
  <Button type="button" onClick={handleOpenDialog}>추가</Button>  {/* Dialog 열기 */}
  <Button type="submit">저장</Button>                             {/* 폼 제출 */}
  <Button type="reset">초기화</Button>                            {/* 폼 리셋 */}
</form>

// ❌ 잘못된 사용 - type 생략 시 기본값이 "submit"
<form>
  <Button onClick={handleOpenDialog}>추가</Button>  {/* type 생략 → submit 발생! */}
</form>
```

**버튼 타입 가이드**:
| type 속성 | 기본값 | 용도 |
|----------|--------|-----|
| `submit` | form 내 기본값 | 폼 제출 시에만 사용 |
| `button` | - | 일반 클릭 동작 (Dialog 열기, 모달 닫기 등) |
| `reset` | - | 폼 초기화 |

---

#### 5. 인증 토큰 관리 가이드

**배경**: localStorage 토큰과 NextAuth 쿠키 불일치로 인한 인증 문제 발생

**핵심 원칙**: **NextAuth를 단일 인증 소스(Single Source of Truth)로 사용**

**인증 아키텍처**:

```
┌─────────────────────────────────────────────────────────────┐
│                     NextAuth 세션                            │
│              (httpOnly 쿠키에 JWT 저장)                      │
│                         │                                    │
│    ┌────────────────────┼────────────────────┐              │
│    ▼                    ▼                    ▼              │
│ Server Component   Client Component    API Client           │
│ getServerSession   useSession()        getSession()         │
└─────────────────────────────────────────────────────────────┘
```

**localStorage 토큰 사용 금지**:
| 방식 | 상태 | 이유 |
|------|------|------|
| `localStorage.getItem('token')` | **금지** | NextAuth 세션과 동기화 불가 |
| `localStorage.setItem('token')` | **금지** | 이중 인증 소스 발생 |
| `getSession().accessToken` | **권장** | NextAuth 세션과 동기화 |
| `getServerSession().accessToken` | **권장** | 서버 사이드에서 안전 |

**Server Component에서 인증**:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function EquipmentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // 서버에서 직접 API 호출 (권장)
  const response = await fetch(`${BACKEND_URL}/api/equipment`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  return <EquipmentList data={await response.json()} />;
}
```

**Client Component에서 인증**:

```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function EquipmentForm() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) return <Skeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // 역할 기반 UI 분기
  const canEdit = hasRole('technical_manager');

  return <EquipmentList canEdit={canEdit} />;
}
```

**API 클라이언트 사용**:

```typescript
// apiClient는 자동으로 NextAuth 세션에서 토큰을 가져옴
import { apiClient } from '@/lib/api/api-client';

// ✅ 올바른 패턴
const response = await apiClient.get('/api/equipment');

// ❌ 잘못된 패턴 (사용 금지)
// const token = localStorage.getItem('token');
// axios.get('/api/equipment', { headers: { Authorization: `Bearer ${token}` } });
```

**인증 관련 체크리스트**:

- [ ] `localStorage.getItem('token')` 사용하지 않음
- [ ] `localStorage.setItem('token')` 사용하지 않음
- [ ] Server Component에서는 `getServerSession()` 사용
- [ ] Client Component에서는 `useSession()` 또는 `useAuth()` 사용
- [ ] API 호출은 `apiClient` 사용 (토큰 자동 주입)
- [ ] 역할 확인은 `hasRole()` 또는 `useAuth().hasRole()` 사용

**상세 문서**: `/docs/development/AUTH_ARCHITECTURE.md`

---

#### 6. 접근성 요구사항

**배경**: ARIA 속성 누락으로 스크린 리더 사용자 접근성 저하

**필수 ARIA 속성**:

```typescript
// 테이블
<table role="grid" aria-label="장비 목록">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col" aria-sort="ascending">장비명</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-selected={isSelected}>
      <td role="gridcell">...</td>
    </tr>
  </tbody>
</table>

// 검색 영역
<div role="search" aria-label="장비 검색">
  <Input
    type="search"
    aria-label="장비명, 모델명, 관리번호 검색"
    aria-describedby="search-hint"
  />
  <span id="search-hint" className="sr-only">
    Enter를 눌러 검색하세요
  </span>
</div>

// 로딩/에러 상태
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>

// 페이지네이션
<nav aria-label="페이지 탐색">
  <Button aria-label="이전 페이지" aria-disabled={page === 1}>이전</Button>
  <span aria-current="page">2</span>
  <Button aria-label="다음 페이지">다음</Button>
</nav>
```

**키보드 접근성 체크리스트**:

- [ ] Tab 키로 모든 인터랙티브 요소에 접근 가능한가?
- [ ] Enter/Space로 버튼 활성화 가능한가?
- [ ] Escape로 모달/드롭다운 닫기 가능한가?
- [ ] 포커스 순서가 시각적 순서와 일치하는가?

---

### 이행 체크리스트 UI-2

#### 컴포넌트 구현

- [x] EquipmentFilters.tsx 컴포넌트 생성됨
- [x] EquipmentSearchBar.tsx 컴포넌트 생성됨
- [x] EquipmentTable.tsx 개선됨
- [x] EquipmentCardGrid.tsx 컴포넌트 생성됨
- [x] ViewToggle.tsx 컴포넌트 생성됨
- [x] Pagination.tsx 컴포넌트 생성됨
- [x] useEquipmentFilters.ts 훅 생성됨

#### 기능 구현

- [x] 다중 필터 조합 동작 확인됨
- [x] URL 쿼리 파라미터 상태 관리 구현됨
- [x] 뷰 전환 상태 localStorage 저장됨
- [x] 검색 디바운스 적용됨

#### 에러 처리 관련

- [x] useQuery error 상태 처리 구현됨
- [x] ErrorAlert 컴포넌트 연동됨
- [x] 재시도 버튼(onRetry) 구현됨
- [x] 401 응답 시 로그인 페이지 리다이렉트 확인됨

#### 로딩/빈 상태 관련

- [x] 스켈레톤 로딩 UI 구현됨
- [x] 빈 상태 UI 구현됨 (검색 결과 없음)
- [x] 빈 상태 UI 구현됨 (데이터 없음)
- [x] 적용된 필터 Badge 표시됨
- [x] 필터 초기화 기능 구현됨

#### API 및 인증 관련

- [x] API 경로가 모두 '/api/'로 시작함
- [x] Server Component에서 `getServerSession()` 사용됨
- [x] Client Component에서 `useAuth()` 또는 `useSession()` 사용됨
- [x] `localStorage` 토큰 사용하지 않음
- [x] API 호출은 `apiClient` 사용 (토큰 자동 주입)

#### form 버튼 관련

- [x] Dialog 내 모든 Button에 type 속성 명시됨
- [x] form 내 취소/닫기 버튼에 type="button" 적용됨

#### 접근성 관련

- [x] 테이블에 ARIA 속성 추가됨 (role="grid", aria-label 등)
- [x] 검색 영역에 role="search" 추가됨
- [x] 로딩/에러 상태에 aria-live 추가됨
- [x] 페이지네이션에 aria-label 추가됨
- [x] Tab 키 네비게이션 테스트 통과됨

#### 테스트

- [x] Playwright 테스트 작성됨 (equipment-list.spec.ts)
- [x] 에러 시나리오 테스트 통과됨
- [ ] 모든 테스트 통과됨 (서버 실행 후 테스트 필요)

### Playwright 테스트 예시

```typescript
// tests/e2e/equipment.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Equipment List - Basic', () => {
  test('필터 적용 및 URL 상태', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // 사이트 필터 적용
    await testOperatorPage.getByLabel('사이트').selectOption('suwon');

    // URL에 필터 반영 확인
    await expect(testOperatorPage).toHaveURL(/site=suwon/);

    // 결과에 수원 장비만 표시 확인
    const rows = testOperatorPage.getByRole('row');
    await expect(rows.first()).toContainText('수원');
  });

  test('뷰 전환', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // 카드 뷰로 전환
    await testOperatorPage.getByRole('button', { name: '카드 뷰' }).click();
    await expect(testOperatorPage.getByTestId('equipment-card-grid')).toBeVisible();

    // 새로고침 후 상태 유지
    await testOperatorPage.reload();
    await expect(testOperatorPage.getByTestId('equipment-card-grid')).toBeVisible();
  });

  test('페이지네이션', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // 다음 페이지로 이동
    await testOperatorPage.getByRole('button', { name: '다음' }).click();
    await expect(testOperatorPage).toHaveURL(/page=2/);
  });
});

test.describe('Equipment List - Error Handling', () => {
  test('API 에러 시 ErrorAlert 표시', async ({ page }) => {
    // API 응답 모킹 - 500 에러
    await page.route('**/api/equipment**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/equipment');

    // ErrorAlert 컴포넌트 표시 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('서버 오류')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('네트워크 오류 시 처리', async ({ page }) => {
    // 네트워크 요청 중단
    await page.route('**/api/equipment**', (route) => route.abort());

    await page.goto('/equipment');

    // 네트워크 오류 메시지 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/네트워크|연결/)).toBeVisible();
  });

  test('인증 만료 시 로그인 페이지 이동', async ({ page }) => {
    // API 응답 모킹 - 401 에러
    await page.route('**/api/equipment**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: '인증이 만료되었습니다' }),
      });
    });

    await page.goto('/equipment');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('빈 결과 시 빈 상태 UI 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment?search=존재하지않는장비');

    // 빈 상태 UI 확인
    await expect(testOperatorPage.getByText('검색 결과가 없습니다')).toBeVisible();
    await expect(testOperatorPage.getByRole('button', { name: '필터 초기화' })).toBeVisible();
  });

  test('다시 시도 버튼 클릭 시 재요청', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/equipment**', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // 첫 번째 요청: 에러
        route.fulfill({ status: 500, body: JSON.stringify({ message: '에러' }) });
      } else {
        // 두 번째 요청: 성공
        route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], total: 0 }),
        });
      }
    });

    await page.goto('/equipment');

    // 에러 상태 확인
    await expect(page.getByRole('alert')).toBeVisible();

    // 다시 시도 버튼 클릭
    await page.getByRole('button', { name: '다시 시도' }).click();

    // 에러가 사라지고 콘텐츠 표시 확인
    await expect(page.getByRole('alert')).not.toBeVisible();
  });
});

test.describe('Equipment List - Loading States', () => {
  test('로딩 중 스켈레톤 표시', async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route('**/api/equipment**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({ status: 200, body: JSON.stringify({ items: [], total: 0 }) });
    });

    await page.goto('/equipment');

    // 스켈레톤 로딩 확인
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(page.locator('.animate-pulse, [class*="skeleton"]')).toBeVisible();
  });
});

test.describe('Equipment List - Accessibility', () => {
  test('테이블에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // role="grid" 또는 테이블 구조 확인
    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
    await expect(table).toHaveAttribute('aria-label');
  });

  test('검색 영역에 role="search"', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // 검색 영역 ARIA 확인
    const searchRegion = testOperatorPage.getByRole('search');
    await expect(searchRegion).toBeVisible();
  });

  test('로딩 상태에 aria-live 적용', async ({ page }) => {
    await page.route('**/api/equipment**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({ status: 200, body: JSON.stringify({ items: [], total: 0 }) });
    });

    await page.goto('/equipment');

    // aria-live 영역 확인
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  });

  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');

    // Tab 키로 탐색
    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 여러 번 Tab 후에도 포커스 유지
    for (let i = 0; i < 5; i++) {
      await testOperatorPage.keyboard.press('Tab');
    }
    await expect(testOperatorPage.locator(':focus')).toBeVisible();
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
