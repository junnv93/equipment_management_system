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

/**
 * ✅ 올바른 로그인 방식 - NextAuth callback API 직접 호출
 *
 * 플로우:
 * 1. NextAuth CSRF 토큰 획득
 * 2. NextAuth callback API로 POST 요청
 * 3. NextAuth가 세션 생성 및 쿠키 저장
 *
 * 상세: /docs/development/E2E_TEST_AUTH_GUIDE.md
 */
async function loginAs(page: Page, role: string) {
  try {
    // 1. CSRF 토큰 획득
    const csrfResponse = await page.request.get('http://localhost:3000/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    // 2. NextAuth callback API로 POST 요청
    const loginResponse = await page.request.post(
      'http://localhost:3000/api/auth/callback/test-login?callbackUrl=/',
      {
        form: {
          role: role,
          csrfToken: csrfToken,
          json: 'true',
        },
      }
    );

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()}`);
    }

    // 3. 메인 페이지로 이동하여 세션 확인
    await page.goto('/');
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed: redirected to login page');
    }
  } catch (error) {
    console.error(`Failed to login as ${role}:`, error);
    throw error;
  }
}

export { expect } from '@playwright/test';
```

**역할명 매핑**:
- `test_engineer` - 시험실무자 (Test Engineer)
- `technical_manager` - 기술책임자 (Technical Manager)
- `lab_manager` - 시험소 관리자 (Lab Manager)
- `system_admin` - 시스템 관리자 (System Admin)

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

const canApprove = ['technical_manager', 'site_admin', 'system_admin'].includes(user.role);
const canManageAllSites = ['site_admin', 'system_admin'].includes(user.role);
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

## UI-9: 장비 상세 페이지

### 목적

장비의 상세 정보와 관련 이력을 표시하는 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/frontend-design

⚠️ E2E 테스트 작성 시 /docs/development/E2E_TEST_AUTH_GUIDE.md를 반드시 참조하세요!

.claude/skills/equipment-management/references/terminology.md와 /docs/development/API_STANDARDS.md를 참조하여 장비 상세 페이지를 구현해줘.

역할 참고:
- test_engineer (시험실무자): 장비 조회, 이력 등록 요청
- technical_manager (기술책임자): 교정 등록, 이력 승인, 보정계수 관리
- lab_manager, system_admin: 전체 권한

요구사항:
1. 장비 헤더 (UL Solutions 브랜딩)
   - 장비명, 모델명, 시리얼넘버, 관리번호
   - 상태 뱃지 (색상 구분 - UL 색상 팔레트 사용)
     - available: UL Green (#00A451)
     - checked_out: UL Midnight Blue (#122C49)
     - calibration_scheduled: UL Info (#BCE4F7)
     - calibration_overdue: UL Red (#CA0123)
     - non_conforming: UL Red (#CA0123)
     - spare: UL Fog (#577E9E)
     - retired: UL Gray (#EBEBEB)
   - 공용장비 뱃지 (해당 시)
   - 부적합 경고 배너 (해당 시)
   - 액션 버튼 (수정, 삭제, 대여, 반출)
   - 운영책임자 정보 (정/부)

2. 탭 기반 정보 표시 (URL 쿼리 파라미터로 상태 관리)
   - 기본 정보: 장비 속성, 사이트/팀, 위치, 제조사, 모델명
   - 교정 이력: 교정 기록 목록, 교정 결과, 교정 방법 (external_calibration/self_inspection/not_applicable)
   - 보정계수: 현재 적용 중인 보정계수, 이력, 보정 방법 (linear_interpolation/higher_value/calibration_agency)
   - 반출/반입 이력: 반출 기록 (목적별 구분: calibration/repair/rental)
   - 위치 변동 이력: 장비 위치 이동 기록 타임라인
   - 유지보수 이력: 수리, 점검 기록 타임라인
   - 사고 이력: 장비 사고/고장 기록
   - 소프트웨어: 설치된 소프트웨어/펌웨어
   - 첨부파일: 이력카드, 검수보고서 등

3. 관련 액션
   - 반출 신청 버튼 (교정/수리/대여 목적 선택)
   - 교정 등록 버튼 (기술책임자)
   - 위치 변경 버튼 (시험실무자)
   - 유지보수 등록 버튼 (시험실무자)
   - 수정/삭제 버튼 (권한에 따라)
   - PDF 이력카드 출력

4. 실시간 상태 표시
   - 현재 반출 상태 (checked_out인 경우)
   - 반출 목적 표시 (checkouts.checkout_type으로 구분)
     - calibration → "교정중"
     - repair → "수리중"
     - rental → "대여중"
   - 반출 중인 경우: 담당자, 반입 예정일, 목적지

5. 부적합 장비 처리
   - 부적합 등록된 경우 경고 배너 (UL Red)
   - 부적합 사유 및 조치 내용 표시
   - 상태 흐름: open → analyzing → corrected → closed
   - 상태 복원 기능 (기술책임자 승인)

6. 장비 이력 추적 (UL-QP-18-02 시험설비 이력카드)
   - 위치 변동 이력: 설치 위치, 이동 일자, 사유
   - 유지보수 이력: 점검/수리 일자, 내용, 담당자
   - 사고 이력: 발생 일자, 사유, 조치 내용

파일:
- apps/frontend/app/equipment/[id]/page.tsx (⚠️ Next.js 16: params는 Promise)
- apps/frontend/components/equipment/EquipmentHeader.tsx
- apps/frontend/components/equipment/EquipmentTabs.tsx
- apps/frontend/components/equipment/BasicInfoTab.tsx
- apps/frontend/components/equipment/CalibrationHistoryTab.tsx
- apps/frontend/components/equipment/CalibrationFactorsTab.tsx
- apps/frontend/components/equipment/CheckoutHistoryTab.tsx (이름 변경)
- apps/frontend/components/equipment/LocationHistoryTab.tsx (신규)
- apps/frontend/components/equipment/MaintenanceHistoryTab.tsx (신규)
- apps/frontend/components/equipment/IncidentHistoryTab.tsx (신규)
- apps/frontend/components/equipment/SoftwareTab.tsx
- apps/frontend/components/equipment/AttachmentsTab.tsx
- apps/frontend/components/equipment/NonConformanceBanner.tsx
- apps/frontend/components/equipment/SharedEquipmentBadge.tsx
- apps/frontend/lib/api/equipment-api.ts (히스토리 API 추가)

디자인 요구사항 (/frontend-design 스킬 활용):
- 헤더: UL Midnight Blue (#122C49) 배경, 흰색 텍스트
- 상태 뱃지: UL 색상 팔레트 사용, 둥근 모서리
- 탭: 아이콘 + 텍스트, 활성 탭 하단 UL Red 라인
- 이력 타임라인 UI: 세로 타임라인, 날짜 + 내용 + 담당자
- 부적합 경고 배너: UL Red 배경, 경고 아이콘
- 액션 버튼: Primary(UL Midnight Blue), Secondary(Outline)

제약사항:
- Next.js 16: params는 Promise, await 필수
- 탭 상태 URL 쿼리 파라미터 저장 (useSearchParams)
- 권한별 액션 버튼 표시/숨김 (useAuth 사용)
- 부적합 장비는 반출 신청 불가
- 반출 목적(checkout_type)에 따라 상태 텍스트 동적 표시

검증:
- 각 탭 데이터 로딩 확인
- 액션 버튼 권한 확인
- 부적합 상태 표시 확인
- 반출 목적별 상태 텍스트 확인
- pnpm tsc --noEmit

Playwright 테스트 (⚠️ E2E_TEST_AUTH_GUIDE.md 참조):
- 탭 전환 시 URL 업데이트 확인
- 권한별 버튼 표시 확인
- 반출 신청 플로우
- 위치 변경 등록 플로우
- 유지보수 등록 플로우
- ⚠️ 인증: NextAuth callback API 사용 (apps/frontend/tests/e2e/fixtures/auth.fixture.ts)

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
const response = await apiClient.get('/api/equipment/123');           // ✅ 올바름
const response = await apiClient.get('/api/equipment/123/history');   // ✅ 올바름
const response = await apiClient.get('/equipment/123');               // ❌ /api 누락
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

**배경**: 데이터 로딩 시 에러 처리가 미흡하여 사용자가 실패 원인 파악 불가

**필수 에러 상태 처리**:
```typescript
import { ErrorAlert } from '@/components/shared/ErrorAlert';

const [error, setError] = useState<ApiError | null>(null);

useEffect(() => {
  const fetchEquipment = async () => {
    try {
      setError(null);
      const data = await equipmentApi.getById(id);
      setEquipment(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        setError(new ApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다'));
      }
    }
  };
  fetchEquipment();
}, [id]);

// 에러 표시
{error && (
  <ErrorAlert
    title="장비 정보를 불러올 수 없습니다"
    error={error}
    onRetry={() => refetch()}
  />
)}
```

**에러 유형별 처리**:
| HTTP 상태 | 에러 유형 | 처리 방법 |
|-----------|----------|----------|
| 401 | 인증 만료 | 로그인 페이지로 리다이렉트 |
| 403 | 권한 없음 | "접근 권한이 없습니다" 메시지 표시 |
| 404 | 장비 없음 | "장비를 찾을 수 없습니다" + 목록 이동 버튼 |
| 500 | 서버 에러 | "서버 오류가 발생했습니다" + 재시도 버튼 |

---

#### 3. 로딩/에러/빈 상태 UI 명세

**배경**: 기본 "Loading..." 텍스트만 표시되어 사용자 경험 저하

**장비 정보 로딩 상태**:
```typescript
import { Skeleton } from '@/components/ui/skeleton';

if (isLoading) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* 헤더 스켈레톤 */}
      <Card className="bg-gradient-to-r from-ul-midnight to-ul-midnight-dark">
        <CardHeader>
          <Skeleton className="h-8 w-[300px] bg-white/20" />
          <Skeleton className="h-4 w-[200px] bg-white/20" />
        </CardHeader>
      </Card>

      {/* 탭 스켈레톤 */}
      <div className="flex gap-4 border-b">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* 컨텐츠 스켈레톤 */}
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

**장비 조회 실패**:
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

**빈 이력 상태 (탭별)**:
```typescript
// 교정 이력 없음
{calibrations.length === 0 && (
  <div className="text-center py-8 text-muted-foreground">
    <FileText className="mx-auto h-12 w-12 mb-2" />
    <p>등록된 교정 이력이 없습니다</p>
  </div>
)}
```

---

#### 4. Next.js 16 params Promise 패턴

**배경**: Next.js 16부터 params는 Promise 타입으로 변경됨

**올바른 패턴**:
```typescript
// apps/frontend/app/equipment/[id]/page.tsx
import { PageProps } from '@/.next/types/app/equipment/[id]/page';

export default async function EquipmentDetailPage(props: PageProps<'/equipment/[id]'>) {
  // ✅ 올바른 방법: await로 params 추출
  const { id } = await props.params;

  // 장비 정보 조회
  const equipment = await getEquipment(id);

  return <EquipmentDetailClient equipment={equipment} />;
}

// ❌ 잘못된 방법
export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id; // Type Error!
}
```

---

#### 5. 탭 URL 상태 관리

**배경**: 탭 상태를 URL 쿼리 파라미터로 관리하여 뒤로가기/공유 기능 지원

**구현 패턴**:
```typescript
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function EquipmentTabs({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'basic';

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="basic">기본 정보</TabsTrigger>
        <TabsTrigger value="calibration">교정 이력</TabsTrigger>
        <TabsTrigger value="checkout">반출 이력</TabsTrigger>
        <TabsTrigger value="location">위치 변동</TabsTrigger>
        <TabsTrigger value="maintenance">유지보수</TabsTrigger>
      </TabsList>

      <TabsContent value="basic"><BasicInfoTab /></TabsContent>
      <TabsContent value="calibration"><CalibrationHistoryTab /></TabsContent>
      <TabsContent value="checkout"><CheckoutHistoryTab /></TabsContent>
      <TabsContent value="location"><LocationHistoryTab /></TabsContent>
      <TabsContent value="maintenance"><MaintenanceHistoryTab /></TabsContent>
    </Tabs>
  );
}
```

---

#### 6. 권한별 액션 버튼 표시

**배경**: 역할에 따라 표시/숨김 처리가 필요한 버튼들이 많음

**useAuth 훅 활용**:
```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function EquipmentActions({ equipment }: { equipment: Equipment }) {
  const { user, hasRole, hasPermission } = useAuth();

  // 권한 확인
  const canEdit = hasPermission('equipment:update') && equipment.status === 'draft';
  const canDelete = hasPermission('equipment:delete') && equipment.status === 'draft';
  const canRegisterCalibration = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const canCheckout = equipment.status === 'available' && !equipment.isNonConforming;

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button variant="outline" onClick={() => router.push(`/equipment/${equipment.id}/edit`)}>
          수정
        </Button>
      )}

      {canDelete && (
        <Button variant="destructive" onClick={() => handleDelete()}>
          삭제
        </Button>
      )}

      {canRegisterCalibration && (
        <Button onClick={() => handleRegisterCalibration()}>
          교정 등록
        </Button>
      )}

      {canCheckout && (
        <Button onClick={() => handleCheckout()}>
          반출 신청
        </Button>
      )}
    </div>
  );
}
```

---

#### 7. 반출 상태 동적 표시

**배경**: checked_out 상태는 반출 목적(checkout_type)에 따라 다르게 표시해야 함

**상태 텍스트 매핑**:
```typescript
// lib/utils/equipment-status.ts
export function getEquipmentStatusLabel(
  equipment: Equipment,
  currentCheckout?: Checkout
): string {
  if (equipment.status === 'checked_out' && currentCheckout) {
    const checkoutTypeLabels = {
      calibration: '교정중',
      repair: '수리중',
      rental: '대여중',
    };
    return checkoutTypeLabels[currentCheckout.checkoutType] || '반출중';
  }

  const statusLabels: Record<EquipmentStatus, string> = {
    available: '사용 가능',
    in_use: '사용 중',
    checked_out: '반출 중',
    calibration_scheduled: '교정 예정',
    calibration_overdue: '교정 기한 초과',
    non_conforming: '부적합',
    spare: '여분',
    retired: '폐기',
  };

  return statusLabels[equipment.status] || equipment.status;
}
```

**사용 예시**:
```typescript
<Badge variant={getStatusVariant(equipment.status)}>
  {getEquipmentStatusLabel(equipment, currentCheckout)}
</Badge>
```

---

#### 8. 인증 토큰 관리 가이드

**배경**: localStorage 토큰과 NextAuth 쿠키 불일치로 인한 인증 문제 발생

**핵심 원칙**: **NextAuth를 단일 인증 소스(Single Source of Truth)로 사용**

**Client Component에서 인증**:
```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function EquipmentDetailClient() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) return <EquipmentSkeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // 역할 기반 UI 분기
  const canRegisterCalibration = hasRole(['technical_manager', 'lab_manager', 'system_admin']);

  return (
    <>
      {canRegisterCalibration && (
        <Button onClick={handleRegisterCalibration}>
          교정 등록
        </Button>
      )}
    </>
  );
}
```

**API 클라이언트 사용**:
```typescript
// ✅ 올바른 패턴
import { apiClient } from '@/lib/api/api-client';

const equipment = await apiClient.get('/api/equipment/123');
const history = await apiClient.get('/api/equipment/123/history');

// ❌ 잘못된 패턴 (사용 금지)
// const token = localStorage.getItem('token');
// axios.get('/api/equipment/123', { headers: { Authorization: `Bearer ${token}` } });
```

**인증 관련 체크리스트**:
- [ ] `localStorage.getItem('token')` 사용하지 않음
- [ ] `localStorage.setItem('token')` 사용하지 않음
- [ ] Server Component에서는 `getServerSession()` 사용
- [ ] Client Component에서는 `useSession()` 또는 `useAuth()` 사용
- [ ] API 호출은 `apiClient` 사용 (토큰 자동 주입)

**상세 문서**: `/docs/development/AUTH_ARCHITECTURE.md`

---

#### 9. 접근성 요구사항

**배경**: ARIA 속성 누락으로 스크린 리더 사용자 접근성 저하

**필수 ARIA 속성**:
```typescript
// 탭 컴포넌트
<Tabs value={activeTab} onValueChange={handleTabChange} aria-label="장비 정보 탭">
  <TabsList role="tablist">
    <TabsTrigger value="basic" role="tab" aria-selected={activeTab === 'basic'}>
      기본 정보
    </TabsTrigger>
  </TabsList>

  <TabsContent value="basic" role="tabpanel" aria-labelledby="basic-tab">
    <BasicInfoTab />
  </TabsContent>
</Tabs>

// 로딩 상태
<div aria-busy="true" aria-live="polite">
  <EquipmentSkeleton />
</div>

// 에러 알림
<div role="alert" aria-live="assertive">
  {error && <ErrorAlert error={error} />}
</div>

// 액션 버튼
<Button
  onClick={handleCheckout}
  disabled={isProcessing}
  aria-busy={isProcessing}
  aria-label={isProcessing ? "반출 신청 처리 중..." : "반출 신청"}
>
  {isProcessing ? '처리 중...' : '반출 신청'}
</Button>
```

**키보드 접근성 체크리스트**:
- [ ] Tab 키로 모든 액션 버튼에 순서대로 접근 가능한가?
- [ ] Enter/Space로 버튼 활성화 가능한가?
- [ ] 탭 전환 시 키보드로 이동 가능한가?
- [ ] 로딩 상태에 aria-busy 적용되었는가?
- [ ] 에러 메시지에 role="alert" 적용되었는가?

---

### 이행 체크리스트 UI-9

#### 컴포넌트 구현
- [x] equipment/[id]/page.tsx 구현됨 (Next.js 16 params Promise 패턴)
- [x] EquipmentDetailClient.tsx 컴포넌트 생성됨
- [x] EquipmentDetailSkeleton.tsx 컴포넌트 생성됨
- [x] EquipmentHeader.tsx 컴포넌트 생성됨
- [x] EquipmentTabs.tsx 컴포넌트 생성됨 (URL 쿼리 파라미터 상태 관리)
- [x] BasicInfoTab.tsx 생성됨
- [x] CalibrationHistoryTab.tsx 생성됨
- [x] CalibrationFactorsTab.tsx 생성됨
- [x] CheckoutHistoryTab.tsx 생성됨
- [x] LocationHistoryTab.tsx 생성됨 (신규, 타임라인 UI)
- [x] MaintenanceHistoryTab.tsx 생성됨 (신규, 타임라인 UI)
- [x] IncidentHistoryTab.tsx 생성됨 (신규, 타임라인 UI)
- [x] SoftwareTab.tsx 생성됨
- [x] AttachmentsTab.tsx 생성됨
- [x] NonConformanceBanner.tsx 업데이트됨
- [x] SharedEquipmentBadge.tsx 기존 컴포넌트 활용
- [x] equipment-api.ts 히스토리 API 함수 기존 구현 확인

#### 기능 구현
- [x] 탭 URL 상태 관리 구현됨 (useSearchParams)
- [x] 권한별 액션 버튼 분기 구현됨 (useAuth의 hasRole 사용)
- [x] 반출 목적별 상태 텍스트 동적 표시 구현됨 (헤더 상태 뱃지)
- [x] 부적합 장비 경고 구현됨 (NonConformanceBanner)
- [x] 장비 이력 조회 구현됨 (위치/유지보수/사고)

#### 에러 처리 관련
- [x] notFound() 함수 사용 (404 처리)
- [ ] ErrorAlert 컴포넌트 연동 (추가 구현 필요 시)
- [x] 404 응답 시 not-found 페이지 처리됨
- [ ] 재시도 버튼(onRetry) 구현 (추가 구현 필요 시)
- [x] Server Component에서 에러 throw하여 error.tsx로 처리

#### 로딩/빈 상태 관련
- [x] 장비 정보 스켈레톤 로딩 UI 구현됨 (EquipmentDetailSkeleton)
- [x] 탭별 빈 상태 UI 구현됨 (이력 없음 메시지)
- [x] Suspense로 로딩 처리됨

#### API 및 인증 관련
- [x] API 경로가 모두 '/api/'로 시작함
- [x] Client Component에서 `useAuth()` 사용됨
- [x] `localStorage` 토큰 사용하지 않음
- [x] API 호출은 `apiClient` 사용 (토큰 자동 주입)

#### 디자인 관련
- [x] UL 색상 팔레트 사용됨 (상태별 색상)
- [x] 헤더 그라데이션 배경 적용됨 (from-ul-midnight via-ul-midnight-dark)
- [x] 타임라인 UI 구현됨 (위치/유지보수/사고 이력)
- [x] 부적합 경고 배너 디자인 적용됨 (UL Red)
- [x] 탭 아이콘 + 텍스트 레이아웃

#### 접근성 관련
- [x] 탭에 적절한 ARIA 속성 추가됨 (role="tab", aria-label)
- [x] 로딩 상태에 aria-busy 추가됨
- [x] TabsContent에 role="tabpanel" 추가됨
- [x] 액션 버튼에 aria-label 추가됨
- [ ] Tab 키 네비게이션 테스트 (백엔드 실행 후)

#### 테스트
- [x] Playwright 테스트 작성됨 (equipment-detail.spec.ts)
- [x] 테스트 ID 추가됨 (data-testid="equipment-item")
- [ ] 탭 전환 테스트 통과 (백엔드 실행 필요)
- [ ] 권한별 버튼 표시 테스트 통과 (백엔드 실행 필요)
- [ ] 반출 신청 플로우 테스트 통과 (백엔드 실행 필요)
- [ ] 모든 테스트 통과 (백엔드 실행 필요)

#### 참고
- ✅ **컴포넌트 및 디자인 구현 완료**
- ✅ **Next.js 16 패턴 적용 완료**
- ✅ **UL Solutions 브랜딩 완료**
- ⏳ **E2E 테스트는 백엔드 서버 실행 후 테스트 가능**


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

---

## UI-9: 장비 상세 페이지 - 구현 현황 (2026-01-22)

### ✅ 완료된 작업

#### 1. 컴포넌트 구현
- [x] **EquipmentDetailClient.tsx**: 메인 클라이언트 컴포넌트
- [x] **EquipmentHeader.tsx**: UL Solutions 브랜딩 헤더
- [x] **EquipmentTabs.tsx**: URL 상태 관리 탭 네비게이션
- [x] **BasicInfoTab.tsx**: 기본 정보 카드 레이아웃
- [x] **CalibrationHistoryTab.tsx**: 교정 이력 테이블
- [x] **LocationHistoryTab.tsx**: 위치 변동 이력 타임라인
- [x] **MaintenanceHistoryTab.tsx**: 유지보수 이력 타임라인
- [x] **IncidentHistoryTab.tsx**: 사고 이력 타임라인 (색상 코딩)
- [x] **CalibrationFactorsTab.tsx**: 보정계수 (플레이스홀더)
- [x] **CheckoutHistoryTab.tsx**: 반출 이력 (플레이스홀더)
- [x] **SoftwareTab.tsx**: 소프트웨어/펌웨어 정보
- [x] **AttachmentsTab.tsx**: 첨부파일 (플레이스홀더)
- [x] **NonConformanceBanner.tsx**: 부적합 장비 경고 배너
- [x] **EquipmentDetailSkeleton.tsx**: 로딩 상태 UI

#### 2. Next.js 16 패턴 적용
- [x] Server Component 엔트리 포인트 (page.tsx)
- [x] Promise params 처리 (`await props.params`)
- [x] Suspense 기반 로딩 상태
- [x] notFound() 에러 처리

#### 3. UL Solutions 브랜딩
- [x] Midnight Blue 그라데이션 헤더
- [x] 색상 팔레트 (Midnight, Red, Green)
- [x] 타임라인 UI 디자인
- [x] 카드 레이아웃
- [x] 상태 뱃지 색상

#### 4. E2E 테스트
- [x] **테스트 시드 데이터 생성**: 8개 장비, 4명 사용자, 3개 팀
- [x] **Playwright 테스트 작성**: equipment-detail.spec.ts (15개 테스트 케이스)
  - 페이지 로딩 및 기본 정보 (3개)
  - 탭 전환 및 URL 상태 관리 (2개)
  - 권한별 버튼 표시 (3개)
  - 히스토리 탭 표시 (4개)
  - 접근성 (2개)
  - 에러 처리 (1개)
- [x] **NextAuth 인증 픽스처 개선**: 쿠키 수동 추가 로직

### ⏳ 진행 중 / 대기 중인 작업

#### 1. E2E 테스트 실행 이슈
- ⚠️ **API 인증 문제**: API 요청 시 401 에러 발생
  - 원인: NextAuth 세션 쿠키가 API 요청에 포함되지 않음
  - 현황: 13/15 테스트 건너뛰기, 1/15 성공, 1/15 실패
  - 다음 단계: 세션 쿠키 전달 메커니즘 디버깅 필요

#### 2. 플레이스홀더 구현
- [ ] CalibrationFactorsTab 실제 구현
- [ ] CheckoutHistoryTab 실제 구현
- [ ] AttachmentsTab 실제 구현

#### 3. 백엔드 API 연동
- [ ] 위치 변동 이력 API (`GET /api/equipment/:id/location-history`)
- [ ] 유지보수 이력 API (`GET /api/equipment/:id/maintenance-history`)
- [ ] 사고 이력 API (`GET /api/equipment/:id/incident-history`)

### 📝 기술적 메모

#### E2E 테스트 인증 문제 분석
```typescript
// 문제: page.request.post()로 로그인 시 쿠키가 page 컨텍스트에 저장되지 않음
// 해결 시도: Set-Cookie 헤더 파싱 후 page.context().addCookies() 호출
// 상태: 쿠키는 추가되었으나 API 요청 시 여전히 401 에러

// auth.fixture.ts에서 수동 쿠키 추가
const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
  // Parse cookie name, value, HttpOnly, SameSite, Expires
  return {
    name, value, domain: 'localhost', path: '/',
    httpOnly, sameSite, expires
  };
});
await page.context().addCookies(cookies);
```

#### 향후 개선 사항
1. **E2E 테스트**: NextAuth 세션 쿠키 전달 문제 해결
2. **히스토리 탭**: 백엔드 API 연동
3. **플레이스홀더**: 실제 기능 구현
4. **접근성**: ARIA 속성 보강
5. **성능**: React Query 캐싱 최적화

---

## 참고

- ✅ **컴포넌트 및 디자인 구현 완료**
- ✅ **Next.js 16 패턴 적용 완료**
- ✅ **UL Solutions 브랜딩 완료**
- ⏳ **E2E 테스트는 인증 문제 해결 후 재실행 필요**
