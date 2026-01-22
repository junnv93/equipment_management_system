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
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form.spec.ts

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
│       ├── equipment-form.spec.ts   # 장비 폼 테스트
│       ├── equipment-form-errors.spec.ts  # 에러 처리 테스트
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

## UI-8: 장비 등록/수정 폼

### 목적

장비 등록 및 수정을 위한 통합 폼 컴포넌트를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 장비 등록/수정 폼을 구현해줘.

역할 참고:
- test_engineer (시험실무자): 장비 등록/수정 요청 (승인 필요)
- technical_manager (기술책임자): 직접 등록/수정 (승인 불필요)
- lab_manager, system_admin: 전체 권한

요구사항:
1. 장비 기본 정보 입력
   - 장비명 (필수)
   - 모델명, 제조사, 시리얼넘버
   - 관리번호 (자동 생성 또는 수동 입력)
   - 사이트 선택 (suwon/uiwang)
   - 팀 선택 (사이트별 팀 필터링)
   - 장비 타입 (측정기, 보조장비 등)

2. 교정 관련 정보
   - 교정 방법 (자체교정/외부교정)
   - 교정 주기
   - 최근 교정일, 차기 교정일
   - 중간점검일정

3. 상태 및 위치
   - 장비 상태 (사용가능, 교정중, 수리중 등)
   - 현재 위치
   - 공용장비 여부

4. 파일 첨부
   - 이력카드 (기존 장비)
   - 검수보고서 (신규 장비)
   - 드래그앤드롭 지원
   - 파일 미리보기
   - 파일 삭제

5. 폼 상태 관리
   - 실시간 유효성 검증
   - 변경사항 감지 (수정 모드)
   - 저장 전 확인 모달
   - 역할별 안내 메시지 (승인 필요 여부)

6. 공용장비 등록 (별도 페이지)
   - 공유 사이트 선택 (다중)
   - 공유 팀 선택
   - 공용 장비 배지 표시

파일:
- apps/frontend/app/equipment/create/page.tsx
- apps/frontend/app/equipment/[id]/edit/page.tsx
- apps/frontend/app/equipment/create-shared/page.tsx
- apps/frontend/components/equipment/EquipmentForm.tsx (통합 폼)
- apps/frontend/components/equipment/BasicInfoSection.tsx
- apps/frontend/components/equipment/CalibrationInfoSection.tsx
- apps/frontend/components/equipment/StatusLocationSection.tsx
- apps/frontend/components/equipment/AttachmentSection.tsx
- apps/frontend/components/shared/FileUpload.tsx (개선)
- apps/frontend/lib/api/equipment-api.ts

디자인 요구사항 (/frontend-design 스킬 활용):
- 섹션별 카드 분리
- 필수 필드 별표(*) 표시
- 파일 업로드 드래그 영역 점선 테두리
- 진행 상태 표시 (파일 업로드)
- 역할별 안내 배너 (승인 필요 시)

제약사항:
- react-hook-form + Zod 사용
- 파일 크기 제한 (10MB)
- 파일 형식 제한 (PDF, 이미지, 문서)
- 수정 모드에서 변경된 필드만 전송

검증:
- 필수 필드 검증 테스트
- 파일 업로드 테스트
- 역할별 동작 테스트
- pnpm tsc --noEmit

Playwright 테스트:
- 필수 필드 미입력 시 에러 표시
- 파일 업로드 및 삭제 동작
- 폼 제출 성공/실패 처리

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
const response = await apiClient.post('/api/equipment', data);    // ✅ 올바름
const response = await apiClient.post('/equipment', data);        // ❌ /api 누락
const response = await apiClient.post('/api/api/equipment', data); // ❌ 중복
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

**배경**: 폼 제출 시 에러 처리가 미흡하여 사용자가 실패 원인 파악 불가

**필수 에러 상태 처리**:
```typescript
import { ErrorAlert } from '@/components/shared/ErrorAlert';

const [submitError, setSubmitError] = useState<ApiError | null>(null);

const onSubmit = async (data: EquipmentFormData) => {
  try {
    setSubmitError(null);
    await equipmentApi.create(data);
    router.push('/equipment');
  } catch (error) {
    if (error instanceof ApiError) {
      setSubmitError(error);
    } else {
      setSubmitError(new ApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다'));
    }
  }
};

// 에러 표시
{submitError && (
  <ErrorAlert
    title="장비 등록 실패"
    error={submitError}
    onRetry={() => form.handleSubmit(onSubmit)()}
  />
)}
```

**에러 유형별 처리**:
| HTTP 상태 | 에러 유형 | 처리 방법 |
|-----------|----------|----------|
| 400 | 유효성 검증 실패 | 필드별 에러 메시지 표시, 해당 필드 포커스 |
| 401 | 인증 만료 | 로그인 페이지로 리다이렉트 |
| 403 | 권한 없음 | "접근 권한이 없습니다" 메시지 표시 |
| 409 | 중복 (관리번호 등) | "이미 등록된 관리번호입니다" + 기존 장비 링크 |
| 413 | 파일 크기 초과 | "파일 크기는 10MB 이하여야 합니다" |
| 500 | 서버 에러 | "서버 오류가 발생했습니다" + 재시도 버튼 |

**필드별 에러 표시**:
```typescript
// Zod 에러를 react-hook-form에 매핑
if (error.code === 'VALIDATION_ERROR' && error.details) {
  Object.entries(error.details).forEach(([field, message]) => {
    form.setError(field as keyof EquipmentFormData, {
      type: 'server',
      message: message as string,
    });
  });
}
```

---

#### 3. 로딩/에러/빈 상태 UI 명세

**배경**: 기본 "Loading..." 텍스트만 표시되어 사용자 경험 저하

**폼 로딩 상태 (수정 모드)**:
```typescript
import { Skeleton } from '@/components/ui/skeleton';

if (isLoading) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />  {/* 파일 업로드 영역 */}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
```

**제출 로딩 상태**:
```typescript
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      저장 중...
    </>
  ) : (
    '저장'
  )}
</Button>
```

**장비 조회 실패 (수정 모드)**:
```typescript
if (error) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
      <h3 className="mt-4 text-lg font-semibold">장비 정보를 불러올 수 없습니다</h3>
      <p className="text-muted-foreground">{error.message}</p>
      <div className="mt-4 flex gap-2 justify-center">
        <Button variant="outline" onClick={() => refetch()}>
          다시 시도
        </Button>
        <Button asChild>
          <Link href="/equipment">장비 목록으로</Link>
        </Button>
      </div>
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
  {/* 파일 업로드 버튼 - Dialog 열기 */}
  <Button type="button" onClick={() => setFileDialogOpen(true)}>
    파일 첨부
  </Button>

  {/* 섹션 추가 버튼 */}
  <Button type="button" onClick={addCalibrationHistory}>
    교정 이력 추가
  </Button>

  {/* 취소 버튼 */}
  <Button type="button" variant="outline" onClick={() => router.back()}>
    취소
  </Button>

  {/* 저장 버튼 - 폼 제출 */}
  <Button type="submit">저장</Button>
</form>

// Dialog 내부
<Dialog>
  <DialogContent>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        취소
      </Button>
      <Button type="button" onClick={handleConfirm}>
        확인
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// ❌ 잘못된 사용 - type 생략 시 기본값이 "submit"
<form>
  <Button onClick={addItem}>항목 추가</Button>  {/* submit 발생! */}
</form>
```

**버튼 타입 가이드**:
| type 속성 | 기본값 | 용도 |
|----------|--------|-----|
| `submit` | form 내 기본값 | 폼 제출 시에만 사용 |
| `button` | - | 일반 클릭 동작 (Dialog 열기, 항목 추가, 취소 등) |
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

**Client Component에서 인증**:
```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function EquipmentForm() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) return <FormSkeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // 역할 기반 UI 분기
  const needsApproval = hasRole('test_engineer');
  const canDirectSubmit = hasRole(['technical_manager', 'lab_manager', 'system_admin']);

  return (
    <>
      {needsApproval && (
        <Alert>
          <AlertDescription>
            시험실무자는 장비 등록 시 기술책임자의 승인이 필요합니다.
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
const response = await apiClient.post('/api/equipment', data);

// ❌ 잘못된 패턴 (사용 금지)
// const token = localStorage.getItem('token');
// axios.post('/api/equipment', data, { headers: { Authorization: `Bearer ${token}` } });
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
// 폼 전체
<form role="form" aria-label="장비 등록 폼" onSubmit={handleSubmit(onSubmit)}>
  {/* 섹션별 fieldset */}
  <fieldset>
    <legend className="sr-only">기본 정보</legend>
    {/* 필드들 */}
  </fieldset>

  {/* 입력 필드 */}
  <div>
    <Label htmlFor="name">
      장비명 <span className="text-destructive" aria-hidden="true">*</span>
      <span className="sr-only">(필수)</span>
    </Label>
    <Input
      id="name"
      aria-required="true"
      aria-invalid={!!errors.name}
      aria-describedby={errors.name ? "name-error" : undefined}
      {...register('name')}
    />
    {errors.name && (
      <p id="name-error" role="alert" className="text-destructive text-sm">
        {errors.name.message}
      </p>
    )}
  </div>

  {/* 파일 업로드 영역 */}
  <div
    role="region"
    aria-label="파일 업로드"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && openFileDialog()}
  >
    <p id="upload-hint">PDF, 이미지 파일을 드래그하거나 클릭하여 업로드</p>
    <input
      type="file"
      aria-describedby="upload-hint"
      accept=".pdf,.jpg,.jpeg,.png"
    />
  </div>
</form>

// 제출 버튼
<Button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
  aria-label={isSubmitting ? "저장 중..." : "장비 저장"}
>
  {isSubmitting ? '저장 중...' : '저장'}
</Button>

// 에러 알림
<div role="alert" aria-live="assertive">
  {submitError && <ErrorAlert error={submitError} />}
</div>
```

**키보드 접근성 체크리스트**:
- [ ] Tab 키로 모든 폼 필드에 순서대로 접근 가능한가?
- [ ] Enter/Space로 버튼 활성화 및 select 열기 가능한가?
- [ ] Escape로 모달/드롭다운 닫기 가능한가?
- [ ] 필수 필드에 aria-required="true" 적용되었는가?
- [ ] 에러 메시지에 role="alert" 또는 aria-live 적용되었는가?
- [ ] 포커스 순서가 시각적 순서와 일치하는가?

---

### 이행 체크리스트 UI-8

#### 컴포넌트 구현
- [x] equipment/create/page.tsx 구현됨
- [x] equipment/[id]/edit/page.tsx 구현됨
- [x] equipment/create-shared/page.tsx 구현됨
- [x] EquipmentForm.tsx 통합 폼 생성됨
- [x] BasicInfoSection.tsx 섹션 생성됨
- [x] CalibrationInfoSection.tsx 섹션 생성됨
- [x] StatusLocationSection.tsx 섹션 생성됨
- [x] AttachmentSection.tsx 섹션 생성됨
- [x] FileUpload.tsx 개선됨
- [x] equipment-api.ts API 함수 생성됨

#### 기능 구현
- [x] 유효성 검증 구현됨 (react-hook-form + Zod)
- [x] 파일 업로드/삭제 구현됨
- [x] 역할별 안내 메시지 구현됨
- [x] 변경사항 감지 구현됨 (수정 모드)

#### 에러 처리 관련
- [x] ApiError 클래스 활용됨
- [x] ErrorAlert 컴포넌트 연동됨
- [x] 필드별 에러 표시 구현됨
- [x] 재시도 버튼(onRetry) 구현됨
- [x] 401 응답 시 로그인 페이지 리다이렉트 확인됨
- [x] 409 응답 시 중복 에러 처리됨

#### 로딩/빈 상태 관련
- [x] 폼 스켈레톤 로딩 UI 구현됨 (수정 모드)
- [x] 제출 로딩 상태 구현됨 (버튼 비활성화 + 스피너)
- [x] 장비 조회 실패 시 에러 UI 구현됨

#### API 및 인증 관련
- [x] API 경로가 모두 '/api/'로 시작함
- [x] Client Component에서 `useAuth()` 사용됨
- [x] `localStorage` 토큰 사용하지 않음
- [x] API 호출은 `apiClient` 사용 (토큰 자동 주입)

#### form 버튼 관련
- [x] Dialog 내 모든 Button에 type 속성 명시됨
- [x] form 내 취소/추가 버튼에 type="button" 적용됨
- [x] 제출 버튼에만 type="submit" 적용됨

#### 접근성 관련
- [x] 폼에 적절한 ARIA 속성 추가됨 (role="form", aria-label 등)
- [x] 필수 필드에 aria-required 추가됨
- [x] 에러 메시지에 role="alert" 추가됨
- [x] 파일 업로드에 키보드 접근성 추가됨
- [x] Tab 키 네비게이션 테스트 통과됨

#### 테스트
- [x] Playwright 테스트 작성됨 (equipment-form.spec.ts)
- [x] 에러 시나리오 테스트 작성됨 (equipment-form-errors.spec.ts)
- [x] 모든 테스트 통과됨 (22/22 tests passed)

---

### 추가 구현: 상세 에러 처리 시스템

#### 구현된 파일

| 파일 | 설명 |
|------|------|
| `lib/errors/equipment-errors.ts` | 에러 코드, 메시지, 해결 방법 정의 |
| `lib/api/utils/response-transformers.ts` | ApiError 변환 함수 추가 |
| `lib/api/api-client.ts` | ApiError 반환하도록 수정 |
| `components/shared/ErrorAlert.tsx` | 상세 에러 표시 컴포넌트 |
| `components/equipment/EquipmentForm.tsx` | 이력 저장 에러 처리 개선 |
| `components/equipment/CalibrationHistorySection.tsx` | 인라인 에러 및 삭제 확인 다이얼로그 |
| `app/equipment/create/page.tsx` | ErrorAlert, PartialSuccessAlert 적용 |
| `app/equipment/[id]/edit/page.tsx` | ErrorAlert 적용 |
| `tests/e2e/equipment-form-errors.spec.ts` | 에러 처리 E2E 테스트 |

#### 에러 유형별 처리

| 에러 유형 | 코드 | 사용자 메시지 | 해결 방법 |
|----------|------|--------------|----------|
| 검증 에러 | `VALIDATION_ERROR` | 입력 값이 올바르지 않습니다 | 필수 필드 확인 |
| 관리번호 중복 | `DUPLICATE_MANAGEMENT_NUMBER` | 이미 등록된 관리번호입니다 | 다른 번호 사용, 기존 장비 확인 |
| 권한 없음 | `PERMISSION_DENIED` | 권한이 없습니다 | 관리자 문의 |
| 네트워크 에러 | `NETWORK_ERROR` | 서버와 연결할 수 없습니다 | 인터넷 확인, 재시도 |
| 서버 에러 | `SERVER_ERROR` | 서버 오류가 발생했습니다 | 잠시 후 재시도 |
| 파일 크기 초과 | `FILE_TOO_LARGE` | 파일 크기가 너무 큽니다 | 10MB 이하로 줄이기 |
| 이력 저장 실패 | `HISTORY_SAVE_FAILED` | 일부 이력 저장 실패 | 장비 상세에서 재시도 |

#### ErrorAlert 컴포넌트 기능

- 에러 유형별 아이콘 및 색상 (error/warning/info)
- 해결 방법 목록 표시
- 액션 버튼 (재시도, 로그인, 장비 목록 이동 등)
- 접을 수 있는 상세 정보 섹션 (에러 코드, HTTP 상태, 타임스탬프)
- PartialSuccessAlert: 부분 성공 시 실패 항목 표시

---

### Playwright 테스트 예시

```typescript
// tests/e2e/equipment-form.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Equipment Form - Basic', () => {
  test('필수 필드 미입력 시 에러 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 저장 버튼 클릭 (필수 필드 미입력)
    await testOperatorPage.getByRole('button', { name: '저장' }).click();

    // 에러 메시지 표시 확인
    await expect(testOperatorPage.getByText('장비명은 필수입니다')).toBeVisible();
    await expect(testOperatorPage.getByText('사이트를 선택하세요')).toBeVisible();
  });

  test('파일 업로드 동작', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 파일 업로드
    const fileInput = testOperatorPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    // 업로드된 파일 표시 확인
    await expect(testOperatorPage.getByText('test-document.pdf')).toBeVisible();

    // 파일 삭제
    await testOperatorPage.getByRole('button', { name: '삭제' }).click();
    await expect(testOperatorPage.getByText('test-document.pdf')).not.toBeVisible();
  });

  test('역할별 안내 메시지 - 시험실무자', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 승인 필요 안내 메시지 확인
    await expect(
      testOperatorPage.getByText('시험실무자는 장비 등록 시 기술책임자의 승인이 필요합니다')
    ).toBeVisible();
  });

  test('역할별 안내 메시지 - 기술책임자', async ({ techManagerPage }) => {
    await techManagerPage.goto('/equipment/create');

    // 직접 등록 안내 메시지 확인 (승인 불필요)
    await expect(
      techManagerPage.getByText('기술책임자는 직접 장비를 등록할 수 있습니다')
    ).toBeVisible();
  });

  test('폼 제출 성공', async ({ techManagerPage }) => {
    await techManagerPage.goto('/equipment/create');

    // 필수 필드 입력
    await techManagerPage.getByLabel('장비명').fill('테스트 장비');
    await techManagerPage.getByLabel('사이트').selectOption('suwon');
    await techManagerPage.getByLabel('팀').selectOption('rf');

    // 저장
    await techManagerPage.getByRole('button', { name: '저장' }).click();

    // 성공 후 목록 페이지로 이동 확인
    await expect(techManagerPage).toHaveURL('/equipment');
    await expect(techManagerPage.getByText('장비가 등록되었습니다')).toBeVisible();
  });
});

test.describe('Equipment Form - Error Handling', () => {
  test('네트워크 오류 시 ErrorAlert 표시', async ({ page }) => {
    // API 요청 차단
    await page.route('**/api/equipment', (route) => route.abort());

    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('테스트 장비');
    await page.getByLabel('사이트').selectOption('suwon');
    await page.getByLabel('팀').selectOption('rf');

    // 저장
    await page.getByRole('button', { name: '저장' }).click();

    // ErrorAlert 표시 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/네트워크|연결/)).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('중복 관리번호 에러', async ({ page }) => {
    // API 응답 모킹 - 409 Conflict
    await page.route('**/api/equipment', (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'DUPLICATE_MANAGEMENT_NUMBER',
          message: '이미 등록된 관리번호입니다',
          details: { existingEquipmentId: 'eq-123' },
        }),
      });
    });

    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('테스트 장비');
    await page.getByLabel('관리번호').fill('SUW-E0001');
    await page.getByLabel('사이트').selectOption('suwon');

    // 저장
    await page.getByRole('button', { name: '저장' }).click();

    // 중복 에러 메시지 확인
    await expect(page.getByText('이미 등록된 관리번호입니다')).toBeVisible();
    await expect(page.getByRole('link', { name: '기존 장비 확인' })).toBeVisible();
  });

  test('파일 크기 초과 에러', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 큰 파일 업로드 시뮬레이션
    await testOperatorPage.evaluate(() => {
      // 파일 크기 검증 트리거
      const event = new CustomEvent('fileError', {
        detail: { code: 'FILE_TOO_LARGE', maxSize: '10MB' },
      });
      document.dispatchEvent(event);
    });

    // 에러 메시지 확인
    await expect(testOperatorPage.getByText('파일 크기는 10MB 이하여야 합니다')).toBeVisible();
  });

  test('서버 에러 시 재시도', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/equipment', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // 첫 번째 요청: 서버 에러
        route.fulfill({
          status: 500,
          body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
        });
      } else {
        // 두 번째 요청: 성공
        route.fulfill({
          status: 201,
          body: JSON.stringify({ id: 'eq-new', name: '테스트 장비' }),
        });
      }
    });

    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('테스트 장비');
    await page.getByLabel('사이트').selectOption('suwon');

    // 첫 번째 저장 시도 - 실패
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    // 재시도 - 성공
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(page).toHaveURL('/equipment');
  });
});

test.describe('Equipment Form - Loading States', () => {
  test('수정 모드 로딩 스켈레톤', async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route('**/api/equipment/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ id: 'eq-1', name: '테스트 장비' }),
      });
    });

    await page.goto('/equipment/eq-1/edit');

    // 스켈레톤 로딩 확인
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(page.locator('.animate-pulse, [class*="skeleton"]')).toBeVisible();
  });

  test('제출 버튼 로딩 상태', async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route('**/api/equipment', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({ status: 201, body: JSON.stringify({ id: 'eq-new' }) });
    });

    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('테스트 장비');
    await page.getByLabel('사이트').selectOption('suwon');

    // 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click();

    // 로딩 상태 확인
    const submitButton = page.getByRole('button', { name: /저장 중/ });
    await expect(submitButton).toBeDisabled();
    await expect(submitButton.locator('.animate-spin')).toBeVisible();
  });
});

test.describe('Equipment Form - Accessibility', () => {
  test('폼에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // role="form" 또는 form 태그 확인
    const form = testOperatorPage.getByRole('form').or(testOperatorPage.locator('form'));
    await expect(form).toBeVisible();
  });

  test('필수 필드 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 필수 필드에 aria-required 확인
    const nameInput = testOperatorPage.getByLabel(/장비명/);
    await expect(nameInput).toHaveAttribute('aria-required', 'true');
  });

  test('에러 메시지 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 저장 버튼 클릭 (필수 필드 미입력)
    await testOperatorPage.getByRole('button', { name: '저장' }).click();

    // 에러 메시지에 role="alert" 확인
    const errorMessage = testOperatorPage.getByRole('alert');
    await expect(errorMessage).toBeVisible();
  });

  test('키보드 탐색', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // Tab 키로 탐색
    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 여러 번 Tab 후에도 포커스 유지
    for (let i = 0; i < 10; i++) {
      await testOperatorPage.keyboard.press('Tab');
    }
    await expect(testOperatorPage.locator(':focus')).toBeVisible();
  });

  test('파일 업로드 키보드 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // Tab으로 파일 업로드 영역 포커스
    const uploadArea = testOperatorPage.getByRole('region', { name: /파일 업로드/ });
    await uploadArea.focus();

    // Enter 키로 파일 선택 다이얼로그 열기 가능 확인
    await expect(uploadArea).toBeFocused();
  });
});
```

#### 테스트 실행 방법

```bash
# 사전 조건: 백엔드와 프론트엔드 실행
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form.spec.ts --project=chromium

# 에러 처리 테스트만 실행
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form-errors.spec.ts

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form.spec.ts --debug

# UI 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form.spec.ts --ui
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
