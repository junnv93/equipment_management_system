# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-10: 교정 관리 페이지

### 목적

교정 기록 등록 및 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
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
- apps/frontend/app/calibration/[id]/edit/page.tsx (수정)
- apps/frontend/components/calibration/CalibrationForm.tsx
- apps/frontend/components/calibration/CalibrationList.tsx
- apps/frontend/components/calibration/CalibrationDetail.tsx
- apps/frontend/components/calibration/EquipmentSelector.tsx
- apps/frontend/lib/api/calibration-api.ts
- apps/frontend/app/actions/calibration.ts (Server Actions)

Next.js 16 필수 패턴:
1. 동적 라우트 페이지 (PageProps + await params):
   ```typescript
   // apps/frontend/app/calibration/[id]/page.tsx
   import { PageProps } from 'next';

   export default async function CalibrationDetailPage(
     props: PageProps<'/calibration/[id]'>
   ) {
     const { id } = await props.params;  // ✅ params는 Promise
     const calibration = await getCalibration(id);
     return <CalibrationDetailClient calibration={calibration} />;
   }
   ```

2. searchParams Promise 패턴 (목록 페이지):
   ```typescript
   // apps/frontend/app/calibration/page.tsx
   export default async function CalibrationListPage(props: {
     searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
   }) {
     const searchParams = await props.searchParams;
     const page = searchParams.page ?? '1';
     const status = searchParams.status;
     const method = searchParams.method;

     return <CalibrationListClient
       initialPage={page}
       initialStatus={status}
       initialMethod={method}
     />;
   }
   ```

3. useActionState 폼 처리:
   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { createCalibration } from '@/app/actions/calibration';

   export function CalibrationForm() {
     const [state, formAction, isPending] = useActionState(
       createCalibration,
       { error: null, success: false }
     );

     return (
       <form action={formAction}>
         {state.error && <ErrorAlert error={state.error} />}
         <Button type="submit" disabled={isPending}>
           {isPending ? '저장 중...' : '저장'}
         </Button>
       </form>
     );
   }
   ```

성능 최적화 요구사항 (/vercel-react-best-practices):
1. **bundle-dynamic-imports**: EquipmentSelector 동적 로딩
   ```typescript
   const EquipmentSelector = dynamic(() => import('./EquipmentSelector'), {
     loading: () => <Skeleton className="h-10 w-full" />,
     ssr: false
   });
   ```

2. **async-parallel**: 초기 데이터 병렬 로딩
   ```typescript
   const [equipment, methods, statuses] = await Promise.all([
     getEquipmentList(),
     getCalibrationMethods(),
     getCalibrationStatuses()
   ]);
   ```

3. **rerender-memo**: 목록 아이템 컴포넌트 메모이제이션
   ```typescript
   const MemoizedCalibrationRow = memo(CalibrationRow);
   ```

4. **server-serialization**: 클라이언트로 전달되는 데이터 최소화
   - 목록에서 필요한 필드만 선택적으로 전달
   - Date 객체는 ISO 문자열로 직렬화

디자인 요구사항 (/frontend-design 스킬 활용):
- 결과별 색상 (UL Solutions 브랜드):
  - 합격: UL Green (#00A451) 배경
  - 부적합: Brand Red (#CA0123) 배경
  - 조건부합격: UL Orange (#FF9D55) 배경
- 역할별 안내 배너:
  - test_engineer: Info 배너 (UL Info #BCE4F7 배경)
  - technical_manager: Warning 배너 (UL Orange #FF9D55 테두리)
- 장비 선택 검색 드롭다운:
  - Combobox 패턴 적용
  - 선택된 장비 명확히 표시
  - 검색 결과 없음 상태 처리
- 테이블 디자인:
  - 행 hover 효과 (#F5F5F5)
  - 상태별 뱃지 색상 적용
  - 정렬 가능 컬럼 표시 (화살표 아이콘)

접근성 요구사항 (/web-design-guidelines):
- 테이블에 role="grid" 및 aria-label 추가
- 결과 라디오 그룹에 role="radiogroup" + aria-labelledby 추가
- 장비 선택에 role="combobox" + aria-expanded 추가
- 로딩/에러 상태에 aria-live="polite" 추가
- 결과 뱃지에 aria-label 추가 (색맹 사용자 대응)
- 필터 변경 시 결과 영역에 aria-live="polite" 적용
- 키보드로 테이블 행 탐색 가능 (Arrow keys)

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

#### 1. 교정 관련 API 엔드포인트

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

---

#### 2. 역할별 UI 분기 - 교정 관리 특화

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

---

#### 3. 교정 결과별 UI 처리

**배경**: 교정 결과에 따라 장비 상태 변경 및 추가 안내가 필요함

**결과별 색상 및 처리 (UL Solutions 브랜드 적용)**:

```typescript
// UL Solutions 브랜드 색상 적용
const RESULT_CONFIG = {
  passed: {
    // UL Green: #00A451
    color: 'bg-[#00A451]/10 text-[#00A451] border-[#00A451]/20',
    icon: CheckCircle2,
    label: '합격',
    description: '교정 기준을 충족합니다.',
    ariaLabel: '교정 결과: 합격', // 접근성: 색맹 사용자 대응
  },
  failed: {
    // Brand Red: #CA0123
    color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]/20',
    icon: XCircle,
    label: '부적합',
    description: '교정 기준을 충족하지 못합니다. 장비 상태가 "부적합"으로 변경됩니다.',
    warning: true,
    ariaLabel: '교정 결과: 부적합 - 장비 사용 중지 필요',
  },
  conditional: {
    // UL Orange: #FF9D55
    color: 'bg-[#FF9D55]/10 text-[#FF9D55] border-[#FF9D55]/20',
    icon: AlertTriangle,
    label: '조건부합격',
    description: '특정 조건 하에서만 사용 가능합니다. 조건을 명시해주세요.',
    ariaLabel: '교정 결과: 조건부합격 - 사용 조건 확인 필요',
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
```

---

#### 4. 기술책임자 코멘트 필수 검증

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

### 이행 체크리스트 UI-10

#### 컴포넌트 구현

- [ ] calibration/page.tsx 구현됨
- [ ] calibration/register/page.tsx 구현됨
- [ ] calibration/[id]/page.tsx 구현됨
- [ ] calibration/[id]/edit/page.tsx 구현됨
- [ ] CalibrationForm.tsx 컴포넌트 생성됨
- [ ] CalibrationList.tsx 컴포넌트 생성됨
- [ ] CalibrationDetail.tsx 컴포넌트 생성됨
- [ ] EquipmentSelector.tsx 컴포넌트 개선됨
- [ ] calibration-api.ts API 함수 생성됨
- [ ] actions/calibration.ts Server Actions 생성됨

#### Next.js 16 패턴

- [ ] 동적 라우트에서 PageProps 사용됨
- [ ] params를 await로 처리함
- [ ] searchParams를 await로 처리함 (목록 페이지)
- [ ] useActionState 사용됨 (useFormState 아님)
- [ ] Server Actions가 적절히 분리됨

#### 성능 최적화 (Vercel Best Practices)

- [ ] EquipmentSelector 동적 import 적용됨
- [ ] 목록 행 컴포넌트 메모이제이션됨
- [ ] 초기 데이터 Promise.all로 병렬 로딩됨
- [ ] 클라이언트로 전달되는 데이터 최소화됨

#### 기능 구현

- [ ] 역할별 UI 분기 구현됨
- [ ] 기술책임자 코멘트 필수 검증됨
- [ ] 결과별 색상 표시 구현됨 (UL Solutions 브랜드)
- [ ] 부적합 결과 시 장비 상태 변경 안내 구현됨
- [ ] 필터 및 정렬 구현됨 (URL 상태 동기화)
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

#### form 버튼 관련

- [ ] Dialog 내 모든 Button에 type 속성 명시됨
- [ ] form 내 취소/선택 버튼에 type="button" 적용됨
- [ ] 제출 버튼에만 type="submit" 적용됨

#### 접근성 관련 (WCAG 2.1 AA)

- [ ] 테이블에 role="grid" 및 aria-label 추가됨
- [ ] 결과 라디오 그룹에 role="radiogroup" + aria-labelledby 추가됨
- [ ] 장비 선택에 role="combobox" + aria-expanded 추가됨
- [ ] 로딩/에러 상태에 aria-live="polite" 추가됨
- [ ] 결과 뱃지에 aria-label 추가됨 (색맹 사용자 대응)
- [ ] 필터 변경 시 결과 영역에 aria-live="polite" 적용됨
- [ ] 키보드로 테이블 행 탐색 가능함 (Arrow keys)
- [ ] 모든 입력 필드에 명시적 label 연결됨
- [ ] 포커스 표시 명확함 (outline 스타일 유지)
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

test.describe('Calibration List', () => {
  test('교정 기록 목록 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
  });

  test('필터 적용 및 URL 상태', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    await testOperatorPage.getByLabel('상태').selectOption('approved');
    await expect(testOperatorPage).toHaveURL(/status=approved/);
  });
});

test.describe('Calibration Register - Role Based UI', () => {
  test('시험실무자 - 승인 필요 안내 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    await expect(testOperatorPage.getByText(/승인이 필요합니다/)).toBeVisible();
  });

  test('기술책임자 - 코멘트 필수 안내 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    await expect(techManagerPage.getByText(/코멘트는 필수입니다/)).toBeVisible();
  });

  test('기술책임자 - 코멘트 없이 제출 시 에러', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    await techManagerPage.getByRole('button', { name: '장비 선택' }).click();
    await techManagerPage.getByRole('option').first().click();

    await techManagerPage.getByLabel('교정일').fill('2025-01-15');
    await techManagerPage.getByLabel('차기교정일').fill('2026-01-15');
    await techManagerPage.getByRole('radio', { name: '합격' }).click();

    await techManagerPage.getByRole('button', { name: '저장' }).click();

    await expect(techManagerPage.getByText(/코멘트를 필수로 입력해야 합니다/)).toBeVisible();
  });

  test('결과 "부적합" 선택 시 경고 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    await testOperatorPage.getByRole('radio', { name: '부적합' }).click();

    await expect(testOperatorPage.getByText(/장비 상태 변경 안내/)).toBeVisible();
  });
});

test.describe('Calibration - Error Handling', () => {
  test('API 에러 시 ErrorAlert 표시', async ({ page }) => {
    await page.route('**/api/calibrations**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/calibration');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('빈 결과 시 빈 상태 UI 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration?equipmentId=non-existent');

    await expect(testOperatorPage.getByText('검색 결과가 없습니다')).toBeVisible();
    await expect(testOperatorPage.getByRole('button', { name: '필터 초기화' })).toBeVisible();
  });
});

test.describe('Calibration - Accessibility', () => {
  test('테이블에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
  });

  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Calibration Detail - Approval', () => {
  test('기술책임자 - 승인 버튼 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/pending-record-id');

    await expect(techManagerPage.getByRole('button', { name: '승인' })).toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반려' })).toBeVisible();
  });

  test('시험실무자 - 승인 버튼 미표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/pending-record-id');

    await expect(testOperatorPage.getByRole('button', { name: '승인' })).not.toBeVisible();
  });
});
```

#### 테스트 실행 방법

```bash
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --project=chromium

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --debug
```
