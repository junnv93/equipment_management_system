# 프론트엔드 UI 개발 공통 가이드

> 이 문서는 모든 FRONTEND_UI_PROMPTS 문서에서 참조하는 공통 가이드라인입니다.

---

## 스킬 참조 (필수)

각 프롬프트 실행 전 아래 스킬을 로드하세요:

| 스킬 명령어                    | 설명                                                   | 사용 시점                   |
| ------------------------------ | ------------------------------------------------------ | --------------------------- |
| `/equipment-management`        | 역할 체계, 승인 프로세스, 장비 관리 도메인 지식        | 모든 UI 개발 시             |
| `/nextjs-16`                   | Next.js 16 App Router, PageProps, useActionState 패턴  | 페이지/레이아웃 개발 시     |
| `/vercel-react-best-practices` | React/Next.js 성능 최적화, 번들 크기, Core Web Vitals  | React 컴포넌트 작성/리뷰 시 |
| `/web-design-guidelines`       | UI 접근성(WCAG), UX best practices, 디자인 품질 검토   | UI 접근성 및 UX 검토 시     |
| `/frontend-design`             | 고품질 프론트엔드 인터페이스 디자인, 컴포넌트 스타일링 | UI 컴포넌트 디자인 시       |
| `/playwright-skill`            | Playwright 브라우저 자동화 및 테스트                   | E2E 테스트 작성 시          |

### 스킬 로드 예시

```
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design
```

---

## 문서 참조

- **API 표준**: `/docs/development/API_STANDARDS.md`
- **Next.js 16 가이드**: `/docs/development/NEXTJS_16_GUIDE.md`
- **성능 가이드**: `/docs/development/PERFORMANCE_GUIDE.md`
- **E2E 테스트 인증 가이드**: `/docs/development/E2E_TEST_AUTH_GUIDE.md` ⚠️ **필수 참조**

---

## 역할 체계

> ⚠️ **SSOT 참조**: 역할 enum 값은 `packages/schemas/src/enums.ts`의 `UserRoleEnum`에서 정의됩니다.

| 역할명              | 한국어        | 권한 수준 | 주요 업무                         |
| ------------------- | ------------- | --------- | --------------------------------- |
| `test_engineer`     | 시험실무자    | 1         | 기본 조작, 승인 요청              |
| `technical_manager` | 기술책임자    | 2         | 소유 팀 승인, 교정 관리           |
| `quality_manager`   | 품질책임자    | 3         | 교정계획서 검토, 소프트웨어 검토  |
| `lab_manager`       | 시험소장      | 4         | 최종 승인, 시험소 전체 관리       |
| `system_admin`      | 시스템 관리자 | 5         | 사용자/역할 관리 (승인 권한 없음) |

### 역할별 주요 권한

- **test_engineer**: 장비 조회, 이력 등록 요청, 반출 신청
- **technical_manager**: 교정 등록, 이력 승인, 보정계수 관리, 폐기 검토
- **quality_manager**: 교정계획서 검토, 소프트웨어 유효성 검토
- **lab_manager**: 폐기 최종 승인, 교정계획서 최종 승인, 해당 시험소 전체 관리
- **system_admin**: 전체 시스템 관리, 사용자 관리 (승인 권한 없음)

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
│       │   └── auth.fixture.ts              # 역할별 로그인 픽스처
│       ├── auth.spec.ts                     # 인증 테스트
│       ├── auth-token-sync.spec.ts          # 토큰 동기화 테스트
│       ├── dashboard.spec.ts                # 대시보드 테스트
│       ├── equipment-list.spec.ts           # 장비 목록 테스트
│       ├── equipment-detail.spec.ts         # 장비 상세 테스트
│       ├── equipment-form.spec.ts           # 장비 등록/수정 폼 테스트
│       ├── equipment-form-errors.spec.ts    # 폼 에러 처리 테스트
│       ├── equipment-history.spec.ts        # 장비 이력 테스트
│       ├── teams.spec.ts                    # 팀 관리 테스트
│       ├── navigation-breadcrumb.spec.ts    # 네비게이션/브레드크럼 테스트
│       ├── navigation-current-state.spec.ts # 네비게이션 상태 테스트
│       ├── accessibility.spec.ts            # 접근성 테스트
│       ├── calibration-filter.spec.ts       # 교정 필터 테스트
│       ├── team-filter.spec.ts              # 팀 필터 테스트
│       └── history-registration.spec.ts     # 이력 등록 테스트
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
    await loginAs(page, 'lab_manager'); // ✅ 올바른 역할명
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
 * ⚠️ 중요: Playwright의 page.request.post()는 Set-Cookie 헤더를 자동으로
 * 브라우저 컨텍스트에 저장하지 않습니다. 수동으로 쿠키를 파싱하여 추가해야 합니다.
 *
 * 플로우:
 * 1. NextAuth CSRF 토큰 획득
 * 2. NextAuth callback API로 POST 요청
 * 3. Set-Cookie 헤더를 파싱하여 브라우저 컨텍스트에 쿠키 추가
 * 4. NextAuth가 세션 생성 및 쿠키 저장
 *
 * 상세: /docs/development/E2E_TEST_AUTH_GUIDE.md
 */
async function loginAs(page: Page, role: string) {
  try {
    // 1. CSRF 토큰 획득
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    // 2. NextAuth callback API로 POST 요청
    const loginResponse = await page.request.post(
      `${baseURL}/api/auth/callback/test-login?callbackUrl=/`,
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

    // ⚠️ 핵심: Set-Cookie 헤더를 수동으로 파싱하여 브라우저 컨텍스트에 추가
    // Playwright는 API 요청의 Set-Cookie를 자동으로 브라우저에 저장하지 않음
    const setCookieHeaders = loginResponse.headers()['set-cookie'];
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
        const parts = cookieStr.split(';');
        const [name, ...valueParts] = parts[0].split('=');
        const value = valueParts.join('=');

        // Parse cookie attributes
        const attributes: Record<string, string> = {};
        for (let i = 1; i < parts.length; i++) {
          const attr = parts[i].trim();
          if (attr.includes('=')) {
            const [key, val] = attr.split('=');
            attributes[key.toLowerCase()] = val;
          }
        }

        return {
          name: name.trim(),
          value,
          domain: 'localhost',
          path: attributes['path'] || '/',
          httpOnly: parts.some((p) => p.trim().toLowerCase() === 'httponly'),
          sameSite: (attributes['samesite'] || 'Lax') as 'Lax' | 'Strict' | 'None',
          expires: attributes['expires']
            ? new Date(attributes['expires']).getTime() / 1000
            : undefined,
        };
      });
      await page.context().addCookies(cookies);
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

## Next.js 16 필수 패턴

### 1. params Promise 패턴 (동적 라우트)

```typescript
// apps/frontend/app/equipment/[id]/page.tsx
import { PageProps } from 'next';

export default async function EquipmentDetailPage(
  props: PageProps<{ id: string }>
) {
  // ✅ 올바른 방법: await로 params 추출
  const { id } = await props.params;

  const equipment = await getEquipment(id);
  return <EquipmentDetailClient equipment={equipment} />;
}

// ❌ 잘못된 방법
export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id; // Type Error!
}
```

### 2. searchParams Promise 패턴 (쿼리 파라미터)

```typescript
// apps/frontend/app/equipment/page.tsx
export default async function EquipmentListPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ✅ searchParams도 Promise
  const searchParams = await props.searchParams;
  const page = searchParams.page ?? '1';
  const status = searchParams.status;

  return <EquipmentListClient initialPage={page} initialStatus={status} />;
}
```

### 3. useActionState 패턴 (폼 처리)

```typescript
'use client';
import { useActionState } from 'react';

export function EquipmentForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await createEquipment(formData);
      return result;
    },
    { error: null, success: false }
  );

  return (
    <form action={formAction}>
      {/* 폼 내용 */}
      <Button type="submit" disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
```

---

## 성능 최적화 (Vercel Best Practices)

### 1. 이미지 최적화

```typescript
import Image from 'next/image';

// ✅ 올바른 사용
<Image
  src="/equipment-photo.jpg"
  alt="장비 사진"
  width={300}
  height={200}
  priority // LCP 이미지에 사용
  sizes="(max-width: 768px) 100vw, 300px"
/>

// ❌ 잘못된 사용
<img src="/equipment-photo.jpg" alt="장비 사진" />
```

### 2. 동적 import (Code Splitting)

```typescript
import dynamic from 'next/dynamic';

// 큰 컴포넌트는 동적 import
const EquipmentChart = dynamic(() => import('./EquipmentChart'), {
  loading: () => <Skeleton className="h-[300px]" />,
  ssr: false, // 클라이언트에서만 렌더링
});
```

### 3. 서버 컴포넌트 우선

```typescript
// ✅ 서버 컴포넌트 (기본값)
export default async function EquipmentPage() {
  const equipment = await fetchEquipment(); // 서버에서 데이터 fetch
  return <EquipmentList data={equipment} />;
}

// 'use client'는 필요한 곳에만 최소화
// 클라이언트 컴포넌트는 leaf에 배치
```

### 4. Barrel Exports 피하기

```typescript
// ❌ 피해야 할 패턴 (tree-shaking 방해)
export * from './Button';
export * from './Card';
export * from './Input';

// ✅ 권장 패턴 (직접 import)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

---

## 디자인 요구사항 (UL Solutions Corporate Professional)

### 색상 팔레트

| 용도          | 색상 코드 | 색상명          |
| ------------- | --------- | --------------- |
| Primary       | `#122C49` | Midnight Blue   |
| Primary Hover | `#0a1c30` | Darker Midnight |
| Secondary     | `#577E9E` | Fog             |
| Brand Accent  | `#CA0123` | Bright Red      |
| Error         | `#CA0123` | Bright Red      |
| Success       | `#00A451` | Bright Green    |
| Warning       | `#FF9D55` | Orange          |
| Info          | `#BCE4F7` | Light Blue      |
| Background    | `#EBEBEB` | UL Gray         |
| Surface       | `#FFFFFF` | White           |
| Border        | `#D8D9DA` | UL Gray 1       |
| Text Primary  | `#122C49` | Midnight Blue   |
| Text Muted    | `#577E9E` | Fog             |

### 장비 상태별 색상

| 상태                    | 색상                         | 설명           |
| ----------------------- | ---------------------------- | -------------- |
| `available`             | UL Green (`#00A451`)         | 사용 가능      |
| `in_use`                | UL Blue (`#577E9E`)          | 사용 중        |
| `checked_out`           | UL Midnight Blue (`#122C49`) | 반출 중        |
| `calibration_scheduled` | UL Info (`#BCE4F7`)          | 교정 예정      |
| `calibration_overdue`   | UL Red (`#CA0123`)           | 교정 기한 초과 |
| `non_conforming`        | UL Red (`#CA0123`)           | 부적합         |
| `spare`                 | UL Fog (`#577E9E`)           | 여분           |
| `retired`               | UL Gray (`#EBEBEB`)          | 폐기           |

### 반응형 브레이크포인트

| 브레이크포인트 | 크기   | 용도        |
| -------------- | ------ | ----------- |
| `sm`           | 640px  | 모바일      |
| `md`           | 768px  | 태블릿      |
| `lg`           | 1024px | 데스크톱    |
| `xl`           | 1280px | 대형 모니터 |

---

## API 호출 규칙

### 환경변수 규칙

```bash
# .env.local - 올바른 설정
NEXT_PUBLIC_API_URL=http://localhost:3001    # 호스트만, /api 미포함!

# 잘못된 설정 (절대 사용 금지)
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # /api가 포함되어 URL 중복 발생
```

### API 경로 규칙

```typescript
// 모든 API 경로는 '/api/'로 시작해야 함
const response = await apiClient.get('/api/equipment/123'); // ✅ 올바름
const response = await apiClient.get('/equipment/123'); // ❌ /api 누락
```

### 인증 토큰 관리

**핵심 원칙**: NextAuth를 단일 인증 소스(Single Source of Truth)로 사용

```typescript
// ✅ 올바른 패턴
import { apiClient } from '@/lib/api/api-client';
const equipment = await apiClient.get('/api/equipment/123');

// ❌ 잘못된 패턴 (사용 금지)
const token = localStorage.getItem('token');
axios.get('/api/equipment/123', { headers: { Authorization: `Bearer ${token}` } });
```

---

## 에러 처리 요구사항

### HTTP 상태별 처리

| HTTP 상태 | 에러 유형   | 처리 방법                                   |
| --------- | ----------- | ------------------------------------------- |
| 400       | 유효성 검증 | 필드별 에러 메시지 표시, 해당 필드 포커스   |
| 401       | 인증 만료   | 로그인 페이지로 리다이렉트                  |
| 403       | 권한 없음   | "접근 권한이 없습니다" 메시지 표시          |
| 404       | 리소스 없음 | "찾을 수 없습니다" + 목록으로 돌아가기 버튼 |
| 500       | 서버 에러   | "서버 오류가 발생했습니다" + 재시도 버튼    |

### 에러 표시 예시

```typescript
import { ErrorAlert } from '@/components/shared/ErrorAlert';

{error && (
  <ErrorAlert
    title="장비 정보를 불러올 수 없습니다"
    error={error}
    onRetry={() => refetch()}
  />
)}
```

---

## 접근성 요구사항 (WCAG 2.1 AA)

### 필수 ARIA 속성

```typescript
// 로딩 상태
<div aria-busy="true" aria-live="polite">
  <Skeleton />
</div>

// 에러 알림
<div role="alert" aria-live="assertive">
  {error && <ErrorAlert error={error} />}
</div>

// 액션 버튼
<Button
  onClick={handleAction}
  disabled={isProcessing}
  aria-busy={isProcessing}
  aria-label={isProcessing ? "처리 중..." : "액션 실행"}
>
  {isProcessing ? '처리 중...' : '실행'}
</Button>
```

### 키보드 접근성 체크리스트

- [ ] Tab 키로 모든 인터랙티브 요소에 접근 가능
- [ ] Enter/Space로 버튼 활성화 가능
- [ ] Escape로 모달/드롭다운 닫기 가능
- [ ] 포커스 순서가 시각적 순서와 일치
- [ ] 포커스 표시가 명확히 보임 (outline)

---

## form 내 버튼 사용 규칙

**핵심 규칙**: form 또는 Dialog 내부의 모든 Button에 type 속성 필수 명시!

```typescript
// ✅ 올바른 사용
<form onSubmit={handleSubmit(onSubmit)}>
  {/* 취소/선택 버튼 - type="button" 필수 */}
  <Button type="button" onClick={() => setDialogOpen(true)}>
    선택
  </Button>
  <Button type="button" variant="outline" onClick={() => router.back()}>
    취소
  </Button>

  {/* 저장 버튼 - 폼 제출 */}
  <Button type="submit">저장</Button>
</form>

// ❌ 잘못된 사용 - type 생략 시 기본값이 "submit"
<form>
  <Button onClick={() => setDialogOpen(true)}>선택</Button>  {/* submit 발생! */}
</form>
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

| 프롬프트         | equipment-management | nextjs-16         | vercel-react-best-practices | web-design-guidelines | frontend-design | playwright-skill   |
| ---------------- | -------------------- | ----------------- | --------------------------- | --------------------- | --------------- | ------------------ |
| UI-1 대시보드    | ✅ 역할 체계         | ✅ App Router     | ✅ 컴포넌트 최적화          | ✅ 대시보드 접근성    | ✅ 카드 디자인  | ✅ 역할별 테스트   |
| UI-2 장비 목록   | ✅ 장비 상태         | ✅ URL 상태       | ✅ 리스트 가상화            | ✅ 테이블 접근성      | ✅ 테이블/카드  | ✅ 필터 테스트     |
| UI-3 승인 관리   | ✅ 승인 프로세스     | ✅ Server Actions | ✅ 상태 관리                | ✅ 폼 접근성          | ✅ 탭/모달      | ✅ 승인 플로우     |
| UI-4 알림        | ✅ 알림 유형         | ✅ 클라이언트     | ✅ 리렌더 최적화            | ✅ 알림 ARIA          | ✅ 드롭다운     | ✅ 알림 테스트     |
| UI-5 보고서      | ✅ 교정계획서        | ✅ 동적 라우트    | ✅ 지연 로딩                | ✅ 인쇄 접근성        | ✅ 인쇄 스타일  | ✅ 다운로드        |
| UI-6 접근성      | -                    | ✅ 레이아웃       | ✅ 번들 분석                | ✅ WCAG 2.1 AA        | ✅ 반응형       | ✅ a11y 테스트     |
| UI-7 로그인      | ✅ 역할 체계         | ✅ NextAuth       | ✅ 초기 로드                | ✅ 폼 접근성          | ✅ 로그인 폼    | ✅ 인증 테스트     |
| UI-8 장비 폼     | ✅ 장비 필드         | ✅ 폼 처리        | ✅ 폼 최적화                | ✅ 폼 레이블/에러     | ✅ 폼 디자인    | ✅ 폼 테스트       |
| UI-9 장비 상세   | ✅ 장비 상태         | ✅ 탭 라우팅      | ✅ 데이터 프리페치          | ✅ 탭 키보드 탐색     | ✅ 탭/배너      | ✅ 상세 테스트     |
| UI-10 교정       | ✅ 교정 프로세스     | ✅ Server Actions | ✅ 폼 제출 최적화           | ✅ 날짜 입력 접근성   | ✅ 폼/목록      | ✅ 교정 테스트     |
| UI-11 교정계획서 | ✅ 교정계획서        | ✅ 동적 라우트    | ✅ 캘린더 최적화            | ✅ 일정 ARIA          | ✅ 일정 UI      | ✅ 계획서 테스트   |
| UI-12 대여       | ✅ 대여 프로세스     | ✅ Server Actions | ✅ 상태 동기화              | ✅ 캘린더 접근성      | ✅ 캘린더       | ✅ 대여 테스트     |
| UI-13 반출       | ✅ 반출 프로세스     | ✅ Server Actions | ✅ 폼 검증 최적화           | ✅ 단계별 폼 접근성   | ✅ 검사 폼      | ✅ 반출 테스트     |
| UI-14 보정계수   | ✅ 보정계수          | ✅ 동적 라우트    | ✅ JSON 파싱 최적화         | ✅ 복잡 폼 접근성     | ✅ JSON 에디터  | ✅ 보정계수 테스트 |
| UI-15 부적합     | ✅ 부적합 관리       | ✅ Server Actions | ✅ 타임라인 렌더링          | ✅ 상태 변화 알림     | ✅ 타임라인     | ✅ 부적합 테스트   |
| UI-16 수리이력   | ✅ 수리 관리         | ✅ 동적 라우트    | ✅ 이력 로딩 최적화         | ✅ 이력 탐색 접근성   | ✅ 타임라인     | ✅ 수리 테스트     |
| UI-17 소프트웨어 | ✅ 소프트웨어        | ✅ 동적 라우트    | ✅ 목록 가상화              | ✅ 라이선스 폼        | ✅ 라이선스 UI  | ✅ SW 테스트       |
| UI-18 팀 관리    | ✅ 팀 구조           | ✅ 동적 라우트    | ✅ 트리 최적화              | ✅ 조직도 접근성      | ✅ 팀 카드      | ✅ 팀 테스트       |
| UI-19 설정       | ✅ 시스템 설정       | ✅ Server Actions | ✅ 설정 저장 최적화         | ✅ 토글/체크 접근성   | ✅ 토글 UI      | ✅ 설정 테스트     |

---

## 검증 명령어

### 개발 환경

```bash
# 전체 개발 서버 시작
pnpm dev

# 프론트엔드만 시작
pnpm --filter frontend dev
```

### 타입 체크

```bash
# 전체 타입 체크
pnpm tsc --noEmit

# 프론트엔드만
pnpm --filter frontend tsc --noEmit
```

### Playwright 테스트

```bash
# 전체 테스트
pnpm --filter frontend exec playwright test

# 특정 파일 테스트
pnpm --filter frontend exec playwright test tests/e2e/dashboard.spec.ts

# UI 모드
pnpm --filter frontend exec playwright test --ui

# 접근성 테스트만
pnpm --filter frontend exec playwright test --grep @a11y
```

### 린트 및 포맷

```bash
# ESLint
pnpm --filter frontend lint

# Prettier
pnpm --filter frontend format
```
