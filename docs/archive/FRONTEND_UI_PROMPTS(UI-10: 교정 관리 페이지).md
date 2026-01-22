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
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts

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
│       ├── calibration.spec.ts      # 교정 관리 테스트
│       ├── calibration-errors.spec.ts  # 에러 처리 테스트
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

## UI-10: 교정 관리 페이지

### 목적

교정 기록 등록 및 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 교정 관리 페이지를 구현해줘.

역할 참고:
- test_engineer: 교정 기록 등록 (승인 필요)
- technical_manager: 직접 등록 (registrarComment 필수), 승인 권한

요구사항:
1. 교정 목록 페이지
   - 교정 기록 목록 테이블
   - 필터: 장비, 기간, 상태, 교정방법
   - 정렬: 교정일, 등록일
   - 페이지네이션

2. 교정 등록 페이지
   - 장비 선택 (검색/선택)
   - 교정 정보 입력
     - 교정일, 차기교정일
     - 교정방법 (자체/외부)
     - 교정결과 (합격/부적합/조건부합격)
     - 교정기관 (외부교정 시)
   - 역할별 UI 분기
     - 기술책임자: 등록자 코멘트 필수
     - 시험실무자: "승인 대기 상태로 등록됩니다" 안내
   - 첨부파일 (성적서)

3. 교정 상세/수정
   - 교정 기록 상세 보기
   - 승인 상태 표시
   - 수정 기능 (pending 상태에서만)

4. 중간점검 관리
   - 중간점검일 표시
   - 점검 예정 알림 목록

파일:
- apps/frontend/app/calibration/page.tsx (목록)
- apps/frontend/app/calibration/register/page.tsx (등록)
- apps/frontend/app/calibration/[id]/page.tsx (상세)
- apps/frontend/components/calibration/CalibrationForm.tsx
- apps/frontend/components/calibration/CalibrationList.tsx
- apps/frontend/components/calibration/CalibrationDetail.tsx
- apps/frontend/components/calibration/EquipmentSelector.tsx
- apps/frontend/lib/api/calibration-api.ts

디자인 요구사항 (/frontend-design 스킬 활용):
- 결과별 색상: 합격(green), 부적합(red), 조건부합격(orange)
- 역할별 안내 배너
- 장비 선택 검색 드롭다운

제약사항:
- 기술책임자 등록 시 registrarComment 필수
- 결과가 '부적합'인 경우 장비 상태 자동 변경 안내

검증:
- 역할별 등록 플로우 테스트
- 필수 필드 검증 테스트
- pnpm tsc --noEmit

Playwright 테스트:
- 역할별 UI 분기 확인
- 교정 등록 성공/실패 확인
- 목록 필터 동작 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

---

### 필수 가이드라인

아래 섹션들은 실제 발생한 버그와 코드 분석 결과를 반영한 필수 가이드라인입니다.

#### 1. API 호출 규칙 및 주의사항

**배경**: `/api/api/calibration` URL 중복 버그가 발생하여 404 에러 발생

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
const response = await apiClient.get('/api/calibrations'); // ✅ 올바름
const response = await apiClient.get('/calibrations'); // ❌ /api 누락
const response = await apiClient.get('/api/api/calibrations'); // ❌ 중복
```

**교정 관련 API 엔드포인트**:

```typescript
// 목록 조회
GET /api/calibrations?equipmentId={id}&startDate={date}&endDate={date}&status={status}&method={method}

// 상세 조회
GET /api/calibrations/:uuid

// 교정 등록 (승인 필요 여부는 역할에 따라 결정)
POST /api/calibrations

// 교정 수정 (pending 상태에서만 가능)
PATCH /api/calibrations/:uuid

// 교정 승인 (기술책임자 이상)
PATCH /api/calibrations/:uuid/approve

// 교정 반려 (기술책임자 이상)
PATCH /api/calibrations/:uuid/reject
```

**흔한 실수 체크리스트**:

- [ ] `.env.local`의 `NEXT_PUBLIC_API_URL`에 `/api`가 포함되어 있지 않은가?
- [ ] API 파일 내 모든 경로가 `/api/`로 시작하는가?
- [ ] 개발자 도구 네트워크 탭에서 요청 URL이 올바른가?

**참고 파일**:

- `apps/frontend/lib/api/api-client.ts` - API 클라이언트 (경로 검증 로직 포함)
- `apps/frontend/lib/api/calibration-api.ts` - 교정 API 함수
- `docs/development/API_STANDARDS.md` - API 표준 문서

---

#### 2. 에러 처리 요구사항

**배경**: 폼 제출 시 에러 처리가 미흡하여 사용자가 실패 원인 파악 불가

**필수 에러 상태 처리**:

```typescript
import { ErrorAlert } from '@/components/shared/ErrorAlert';

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['calibrations', filters],
  queryFn: () => calibrationApi.getList(filters),
  retry: 3,  // 자동 재시도 3회
});

// 목록 조회 에러 처리
if (error) {
  return (
    <ErrorAlert
      title="교정 기록 로드 실패"
      message={error.message}
      onRetry={refetch}
    />
  );
}

// 폼 제출 에러 처리
const [submitError, setSubmitError] = useState<ApiError | null>(null);

const onSubmit = async (data: CalibrationFormData) => {
  try {
    setSubmitError(null);
    await calibrationApi.create(data);
    router.push('/calibration');
  } catch (error) {
    if (error instanceof ApiError) {
      setSubmitError(error);
    } else {
      setSubmitError(new ApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다'));
    }
  }
};
```

**에러 유형별 처리**:
| HTTP 상태 | 에러 유형 | 처리 방법 |
|-----------|----------|----------|
| 400 | 유효성 검증 실패 | 필드별 에러 메시지 표시, 해당 필드 포커스 |
| 401 | 인증 만료 | 로그인 페이지로 리다이렉트 |
| 403 | 권한 없음 | "교정 등록 권한이 없습니다" 메시지 표시 |
| 404 | 장비/교정 기록 없음 | "장비를 찾을 수 없습니다" + 목록으로 돌아가기 |
| 409 | 중복 교정 기록 | "해당 기간에 이미 교정 기록이 존재합니다" |
| 500 | 서버 에러 | "서버 오류가 발생했습니다" + 재시도 버튼 |

**기술책임자 코멘트 누락 에러**:

```typescript
// 기술책임자 등록 시 registrarComment 필수 검증
if (isTechnicalManager && !data.registrarComment) {
  form.setError('registrarComment', {
    type: 'required',
    message: '기술책임자는 등록 시 코멘트를 필수로 입력해야 합니다',
  });
  return;
}
```

---

#### 3. 로딩/에러/빈 상태 UI 명세

**배경**: 기본 "Loading..." 텍스트만 표시되어 사용자 경험 저하

**목록 스켈레톤 로딩**:

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

**폼 로딩 상태 (수정 모드)**:

```typescript
if (isLoadingCalibration) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />  {/* 장비 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />  {/* 교정일 */}
            <Skeleton className="h-10 w-full" />  {/* 차기교정일 */}
          </div>
          <Skeleton className="h-24 w-full" />   {/* 코멘트 */}
        </CardContent>
      </Card>
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
        {filters.equipmentId && <Badge variant="secondary">장비: {filters.equipmentId}</Badge>}
        {filters.status && <Badge variant="secondary">상태: {filters.status}</Badge>}
      </div>
      <Button variant="outline" className="mt-4" onClick={clearFilters}>
        필터 초기화
      </Button>
    </div>
  );
}

// 교정 기록이 전혀 없는 경우
if (data?.items.length === 0) {
  return (
    <div className="text-center py-12">
      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">등록된 교정 기록이 없습니다</h3>
      <p className="text-muted-foreground">첫 번째 교정 기록을 등록해보세요.</p>
      <Button className="mt-4" asChild>
        <Link href="/calibration/register">교정 등록</Link>
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
<form onSubmit={handleSubmit(onSubmit)}>
  {/* 장비 선택 버튼 - Dialog 열기 */}
  <Button type="button" onClick={() => setEquipmentDialogOpen(true)}>
    장비 선택
  </Button>

  {/* 파일 첨부 버튼 */}
  <Button type="button" onClick={() => fileInputRef.current?.click()}>
    성적서 첨부
  </Button>

  {/* 취소 버튼 */}
  <Button type="button" variant="outline" onClick={() => router.back()}>
    취소
  </Button>

  {/* 저장 버튼 - 폼 제출 */}
  <Button type="submit">저장</Button>
</form>

// 장비 선택 Dialog
<Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>장비 선택</DialogTitle>
    </DialogHeader>
    <EquipmentSelector onSelect={handleEquipmentSelect} />
    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setEquipmentDialogOpen(false)}>
        취소
      </Button>
      <Button type="button" onClick={confirmEquipmentSelection}>
        선택
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// ❌ 잘못된 사용 - type 생략 시 기본값이 "submit"
<form>
  <Button onClick={() => setEquipmentDialogOpen(true)}>장비 선택</Button>  {/* submit 발생! */}
</form>
```

**버튼 타입 가이드**:
| type 속성 | 기본값 | 용도 |
|----------|--------|-----|
| `submit` | form 내 기본값 | 폼 제출 시에만 사용 |
| `button` | - | 일반 클릭 동작 (Dialog 열기, 장비 선택, 취소 등) |
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

**Client Component에서 인증 및 역할 확인**:

```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function CalibrationForm() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) return <FormSkeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // 역할 기반 UI 분기 - 교정 관리 특화
  const isTechnicalManager = hasRole('technical_manager');
  const canDirectRegister = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const canApprove = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const needsApproval = hasRole('test_engineer');

  return (
    <>
      {/* 시험실무자: 승인 필요 안내 */}
      {needsApproval && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            시험실무자가 등록한 교정 기록은 기술책임자의 승인이 필요합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 기술책임자: 코멘트 필수 안내 */}
      {isTechnicalManager && (
        <Alert className="mb-4 border-yellow-500">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            기술책임자 직접 등록 시 등록자 코멘트는 필수입니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 폼 내용 */}
    </>
  );
}
```

**API 클라이언트 사용**:

```typescript
// apiClient는 자동으로 NextAuth 세션에서 토큰을 가져옴
import { apiClient } from '@/lib/api/api-client';

// ✅ 올바른 패턴
const response = await apiClient.post('/api/calibrations', data);

// ❌ 잘못된 패턴 (사용 금지)
// const token = localStorage.getItem('token');
// axios.post('/api/calibrations', data, { headers: { Authorization: `Bearer ${token}` } });
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
// 교정 목록 테이블
<table role="grid" aria-label="교정 기록 목록">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col" aria-sort="ascending">교정일</th>
      <th role="columnheader" scope="col">장비명</th>
      <th role="columnheader" scope="col">결과</th>
      <th role="columnheader" scope="col">상태</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-selected={isSelected}>
      <td role="gridcell">2025-01-15</td>
      <td role="gridcell">스펙트럼 분석기</td>
      <td role="gridcell">
        <Badge aria-label="교정 결과: 합격">합격</Badge>
      </td>
      <td role="gridcell">
        <Badge aria-label="승인 상태: 승인됨">승인됨</Badge>
      </td>
    </tr>
  </tbody>
</table>

// 결과 선택 라디오 그룹
<div role="radiogroup" aria-label="교정 결과 선택">
  <div className="flex items-center space-x-2">
    <RadioGroupItem
      value="passed"
      id="result-passed"
      aria-describedby="passed-description"
    />
    <Label htmlFor="result-passed">합격</Label>
    <span id="passed-description" className="sr-only">
      교정 결과가 기준을 충족함
    </span>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem
      value="failed"
      id="result-failed"
      aria-describedby="failed-description"
    />
    <Label htmlFor="result-failed">부적합</Label>
    <span id="failed-description" className="sr-only">
      교정 결과가 기준을 충족하지 못함. 장비 상태가 부적합으로 변경됩니다.
    </span>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem
      value="conditional"
      id="result-conditional"
      aria-describedby="conditional-description"
    />
    <Label htmlFor="result-conditional">조건부합격</Label>
    <span id="conditional-description" className="sr-only">
      특정 조건 하에서만 사용 가능
    </span>
  </div>
</div>

// 장비 선택 드롭다운
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
  <Input
    aria-label="장비 검색"
    aria-describedby="equipment-search-hint"
    placeholder="장비명 또는 관리번호로 검색"
  />
  <span id="equipment-search-hint" className="sr-only">
    검색어 입력 후 목록에서 장비를 선택하세요
  </span>
  <ul role="listbox" aria-label="장비 검색 결과">
    {searchResults.map((equipment) => (
      <li
        key={equipment.id}
        role="option"
        aria-selected={selectedEquipmentId === equipment.id}
      >
        {equipment.name} ({equipment.managementNumber})
      </li>
    ))}
  </ul>
</div>

// 로딩/에러 상태
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>

// 결과별 색상 뱃지 접근성
<Badge
  className={cn(
    result === 'passed' && 'bg-green-100 text-green-800',
    result === 'failed' && 'bg-red-100 text-red-800',
    result === 'conditional' && 'bg-orange-100 text-orange-800'
  )}
  aria-label={`교정 결과: ${getResultLabel(result)}`}
>
  {getResultLabel(result)}
</Badge>
```

**키보드 접근성 체크리스트**:

- [ ] Tab 키로 모든 인터랙티브 요소에 접근 가능한가?
- [ ] Enter/Space로 버튼 활성화 가능한가?
- [ ] Escape로 모달/드롭다운 닫기 가능한가?
- [ ] 포커스 순서가 시각적 순서와 일치하는가?
- [ ] 결과 라디오 버튼에 화살표 키 탐색 가능한가?
- [ ] 장비 선택 드롭다운에서 키보드로 검색/선택 가능한가?

---

#### 7. 교정 결과별 UI 처리

**배경**: 교정 결과에 따라 장비 상태 변경 및 추가 안내가 필요함

**결과별 색상 및 처리**:

```typescript
const RESULT_CONFIG = {
  passed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: '합격',
    description: '교정 기준을 충족합니다.',
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: '부적합',
    description: '교정 기준을 충족하지 못합니다. 장비 상태가 "부적합"으로 변경됩니다.',
    warning: true,
  },
  conditional: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
    label: '조건부합격',
    description: '특정 조건 하에서만 사용 가능합니다. 조건을 명시해주세요.',
  },
};

// 결과 선택 시 경고 표시
{selectedResult === 'failed' && (
  <Alert variant="destructive" className="mt-4">
    <XCircle className="h-4 w-4" />
    <AlertTitle>장비 상태 변경 안내</AlertTitle>
    <AlertDescription>
      부적합 결과 등록 시 해당 장비의 상태가 자동으로 "부적합(사용중지)"으로 변경됩니다.
      장비에 사용중지 식별표를 부착해주세요.
    </AlertDescription>
  </Alert>
)}

{selectedResult === 'conditional' && (
  <div className="mt-4">
    <Label htmlFor="condition-note">
      조건 명시 <span className="text-destructive">*</span>
    </Label>
    <Textarea
      id="condition-note"
      placeholder="조건부합격 사유 및 사용 가능 조건을 명시하세요"
      {...register('conditionNote', { required: selectedResult === 'conditional' })}
    />
  </div>
)}
```

---

### 이행 체크리스트 UI-10

#### 컴포넌트 구현

- [ ] calibration/page.tsx 구현됨
- [ ] calibration/register/page.tsx 구현됨
- [ ] calibration/[id]/page.tsx 구현됨
- [ ] CalibrationForm.tsx 컴포넌트 생성됨
- [ ] CalibrationList.tsx 컴포넌트 생성됨
- [ ] CalibrationDetail.tsx 컴포넌트 생성됨
- [ ] EquipmentSelector.tsx 컴포넌트 개선됨
- [ ] calibration-api.ts API 함수 생성됨

#### 기능 구현

- [ ] 역할별 UI 분기 구현됨
- [ ] 기술책임자 코멘트 필수 검증됨
- [ ] 결과별 색상 표시 구현됨
- [ ] 부적합 결과 시 장비 상태 변경 안내 구현됨
- [ ] 필터 및 정렬 구현됨
- [ ] 페이지네이션 구현됨

#### 에러 처리 관련

- [ ] useQuery error 상태 처리 구현됨
- [ ] ErrorAlert 컴포넌트 연동됨
- [ ] 재시도 버튼(onRetry) 구현됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트 확인됨
- [ ] 필드별 에러 표시 구현됨

#### 로딩/빈 상태 관련

- [ ] 목록 스켈레톤 로딩 UI 구현됨
- [ ] 폼 스켈레톤 로딩 UI 구현됨
- [ ] 빈 상태 UI 구현됨 (검색 결과 없음)
- [ ] 빈 상태 UI 구현됨 (데이터 없음)
- [ ] 적용된 필터 Badge 표시됨
- [ ] 필터 초기화 기능 구현됨

#### API 및 인증 관련

- [ ] API 경로가 모두 '/api/'로 시작함
- [ ] Client Component에서 `useAuth()` 사용됨
- [ ] `localStorage` 토큰 사용하지 않음
- [ ] API 호출은 `apiClient` 사용 (토큰 자동 주입)

#### form 버튼 관련

- [ ] Dialog 내 모든 Button에 type 속성 명시됨
- [ ] form 내 취소/선택 버튼에 type="button" 적용됨
- [ ] 제출 버튼에만 type="submit" 적용됨

#### 접근성 관련

- [ ] 테이블에 ARIA 속성 추가됨 (role="grid", aria-label 등)
- [ ] 결과 라디오 그룹에 role="radiogroup" 추가됨
- [ ] 장비 선택에 role="combobox" 추가됨
- [ ] 로딩/에러 상태에 aria-live 추가됨
- [ ] 결과 뱃지에 aria-label 추가됨
- [ ] Tab 키 네비게이션 테스트 통과됨

#### 테스트

- [ ] Playwright 테스트 작성됨 (calibration.spec.ts)
- [ ] 에러 시나리오 테스트 통과됨
- [ ] 모든 테스트 통과됨

---

### Playwright 테스트 예시

```typescript
// tests/e2e/calibration.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Calibration List - Basic', () => {
  test('교정 기록 목록 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    // 테이블 표시 확인
    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
  });

  test('필터 적용 및 URL 상태', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    // 상태 필터 적용
    await testOperatorPage.getByLabel('상태').selectOption('approved');

    // URL에 필터 반영 확인
    await expect(testOperatorPage).toHaveURL(/status=approved/);
  });

  test('페이지네이션', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    // 다음 페이지로 이동
    await testOperatorPage.getByRole('button', { name: '다음' }).click();
    await expect(testOperatorPage).toHaveURL(/page=2/);
  });
});

test.describe('Calibration Register - Role Based UI', () => {
  test('시험실무자 - 승인 필요 안내 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    // 승인 필요 안내 메시지 확인
    await expect(testOperatorPage.getByText(/승인이 필요합니다/)).toBeVisible();
  });

  test('기술책임자 - 코멘트 필수 안내 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    // 코멘트 필수 안내 메시지 확인
    await expect(techManagerPage.getByText(/코멘트는 필수입니다/)).toBeVisible();
  });

  test('기술책임자 - 코멘트 없이 제출 시 에러', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    // 장비 선택
    await techManagerPage.getByRole('button', { name: '장비 선택' }).click();
    await techManagerPage.getByRole('option').first().click();

    // 필수 필드 입력 (코멘트 제외)
    await techManagerPage.getByLabel('교정일').fill('2025-01-15');
    await techManagerPage.getByLabel('차기교정일').fill('2026-01-15');
    await techManagerPage.getByRole('radio', { name: '합격' }).click();

    // 저장 시도
    await techManagerPage.getByRole('button', { name: '저장' }).click();

    // 코멘트 필수 에러 확인
    await expect(techManagerPage.getByText(/코멘트를 필수로 입력해야 합니다/)).toBeVisible();
  });

  test('결과 "부적합" 선택 시 경고 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    // 부적합 결과 선택
    await testOperatorPage.getByRole('radio', { name: '부적합' }).click();

    // 경고 메시지 확인
    await expect(testOperatorPage.getByText(/장비 상태 변경 안내/)).toBeVisible();
    await expect(testOperatorPage.getByText(/부적합.*사용중지/)).toBeVisible();
  });

  test('교정 등록 성공', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    // 장비 선택
    await techManagerPage.getByRole('button', { name: '장비 선택' }).click();
    await techManagerPage.getByRole('option').first().click();

    // 필수 필드 입력
    await techManagerPage.getByLabel('교정일').fill('2025-01-15');
    await techManagerPage.getByLabel('차기교정일').fill('2026-01-15');
    await techManagerPage.getByRole('radio', { name: '합격' }).click();
    await techManagerPage.getByLabel('등록자 코멘트').fill('정상 교정 완료');

    // 저장
    await techManagerPage.getByRole('button', { name: '저장' }).click();

    // 성공 후 목록 페이지로 이동 확인
    await expect(techManagerPage).toHaveURL('/calibration');
    await expect(techManagerPage.getByText('교정 기록이 등록되었습니다')).toBeVisible();
  });
});

test.describe('Calibration - Error Handling', () => {
  test('API 에러 시 ErrorAlert 표시', async ({ page }) => {
    // API 응답 모킹 - 500 에러
    await page.route('**/api/calibrations**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/calibration');

    // ErrorAlert 컴포넌트 표시 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('서버 오류')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('네트워크 오류 시 처리', async ({ page }) => {
    // 네트워크 요청 중단
    await page.route('**/api/calibrations**', (route) => route.abort());

    await page.goto('/calibration');

    // 네트워크 오류 메시지 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/네트워크|연결/)).toBeVisible();
  });

  test('인증 만료 시 로그인 페이지 이동', async ({ page }) => {
    // API 응답 모킹 - 401 에러
    await page.route('**/api/calibrations**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: '인증이 만료되었습니다' }),
      });
    });

    await page.goto('/calibration');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('빈 결과 시 빈 상태 UI 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration?equipmentId=non-existent');

    // 빈 상태 UI 확인
    await expect(testOperatorPage.getByText('검색 결과가 없습니다')).toBeVisible();
    await expect(testOperatorPage.getByRole('button', { name: '필터 초기화' })).toBeVisible();
  });

  test('다시 시도 버튼 클릭 시 재요청', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/calibrations**', (route) => {
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

    await page.goto('/calibration');

    // 에러 상태 확인
    await expect(page.getByRole('alert')).toBeVisible();

    // 다시 시도 버튼 클릭
    await page.getByRole('button', { name: '다시 시도' }).click();

    // 에러가 사라지고 콘텐츠 표시 확인
    await expect(page.getByRole('alert')).not.toBeVisible();
  });
});

test.describe('Calibration - Loading States', () => {
  test('로딩 중 스켈레톤 표시', async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route('**/api/calibrations**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({ status: 200, body: JSON.stringify({ items: [], total: 0 }) });
    });

    await page.goto('/calibration');

    // 스켈레톤 로딩 확인
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(page.locator('.animate-pulse, [class*="skeleton"]')).toBeVisible();
  });
});

test.describe('Calibration - Accessibility', () => {
  test('테이블에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    // role="grid" 또는 테이블 구조 확인
    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
    await expect(table).toHaveAttribute('aria-label');
  });

  test('결과 라디오 그룹 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    // radiogroup 역할 확인
    const radioGroup = testOperatorPage.getByRole('radiogroup');
    await expect(radioGroup).toBeVisible();
  });

  test('로딩 상태에 aria-live 적용', async ({ page }) => {
    await page.route('**/api/calibrations**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({ status: 200, body: JSON.stringify({ items: [], total: 0 }) });
    });

    await page.goto('/calibration');

    // aria-live 영역 확인
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  });

  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

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

test.describe('Calibration Detail - Approval', () => {
  test('기술책임자 - 승인 버튼 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/pending-record-id');

    // pending 상태의 기록에서 승인 버튼 확인
    await expect(techManagerPage.getByRole('button', { name: '승인' })).toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반려' })).toBeVisible();
  });

  test('시험실무자 - 승인 버튼 미표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/pending-record-id');

    // pending 상태의 기록에서 승인 버튼 미표시 확인
    await expect(testOperatorPage.getByRole('button', { name: '승인' })).not.toBeVisible();
  });

  test('반려 시 사유 입력 필수', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/pending-record-id');

    // 반려 버튼 클릭
    await techManagerPage.getByRole('button', { name: '반려' }).click();

    // 사유 없이 확인 시도
    await techManagerPage.getByRole('button', { name: '확인' }).click();

    // 에러 메시지 확인
    await expect(techManagerPage.getByText(/사유는 10자 이상/)).toBeVisible();
  });
});
```

#### 테스트 실행 방법

```bash
# 사전 조건: 백엔드와 프론트엔드 실행
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --project=chromium

# 에러 처리 테스트만 실행
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration-errors.spec.ts

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --debug

# UI 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --ui
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
