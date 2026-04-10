# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-14: 보정계수 관리 페이지

### 목적

장비별 보정계수 등록 및 관리 페이지를 구현합니다.

### 프롬프트

````
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 보정계수 관리 페이지를 구현해줘.

역할 참고:
- test_engineer: 보정계수 변경 요청
- technical_manager: 보정계수 변경 승인

요구사항:
1. 장비별 보정계수 페이지
   - 경로: /equipment/[id]/calibration-factors
   - 현재 적용 중인 보정계수 목록
   - 보정계수 이력

2. 보정계수 목록
   - 보정계수 유형 (antenna_gain, cable_loss 등)
   - 값, 단위, 파라미터
   - 적용 기간
   - 승인 상태

3. 보정계수 등록/수정
   - 보정계수 유형 선택
   - 이름, 값, 단위 입력
   - 파라미터 입력 (JSON 또는 폼)
   - 적용 시작일, 만료일
   - 연결 교정 기록 선택 (선택)

4. 보정계수 대장 (전체)
   - 경로: /reports/calibration-factors
   - 전체 보정계수 목록
   - 필터: 장비, 유형, 기간
   - Excel 내보내기

파일:
- apps/frontend/app/equipment/[id]/calibration-factors/page.tsx
- apps/frontend/app/equipment/[id]/calibration-factors/create/page.tsx
- apps/frontend/app/equipment/[id]/calibration-factors/[factorId]/edit/page.tsx
- apps/frontend/app/reports/calibration-factors/page.tsx
- apps/frontend/components/calibration-factors/CalibrationFactorList.tsx
- apps/frontend/components/calibration-factors/CalibrationFactorForm.tsx
- apps/frontend/components/calibration-factors/ParameterEditor.tsx
- apps/frontend/components/calibration-factors/FactorHistoryTimeline.tsx
- apps/frontend/lib/api/calibration-factor-api.ts
- apps/frontend/app/actions/calibration-factors.ts (Server Actions)

Next.js 16 필수 패턴:
1. 동적 라우트 페이지 (PageProps + await params):
   ```typescript
   // apps/frontend/app/equipment/[id]/calibration-factors/page.tsx
   import { PageProps } from 'next';

   export default async function CalibrationFactorsPage(
     props: PageProps<'/equipment/[id]/calibration-factors'>
   ) {
     const { id } = await props.params;  // ✅ params는 Promise
     const equipment = await getEquipment(id);
     const factors = await getCalibrationFactors(id);
     return <CalibrationFactorListClient equipment={equipment} factors={factors} />;
   }
````

2. 중첩 동적 라우트 (factorId 수정 페이지):

   ```typescript
   // apps/frontend/app/equipment/[id]/calibration-factors/[factorId]/edit/page.tsx
   import { PageProps } from 'next';

   export default async function EditFactorPage(
     props: PageProps<'/equipment/[id]/calibration-factors/[factorId]/edit'>
   ) {
     const { id, factorId } = await props.params;  // ✅ 여러 params
     const factor = await getCalibrationFactor(factorId);
     return <CalibrationFactorForm mode="edit" factor={factor} equipmentId={id} />;
   }
   ```

3. useActionState 폼 처리:

   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { createCalibrationFactor } from '@/app/actions/calibration-factors';

   export function CalibrationFactorForm({ equipmentId }: { equipmentId: string }) {
     const [state, formAction, isPending] = useActionState(
       createCalibrationFactor.bind(null, equipmentId),
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

1. **bundle-dynamic-imports**: ParameterEditor 동적 로딩 (JSON 에디터 포함)

   ```typescript
   const ParameterEditor = dynamic(() => import('./ParameterEditor'), {
     loading: () => <Skeleton className="h-40 w-full" />,
     ssr: false  // JSON 에디터는 클라이언트에서만
   });
   ```

2. **async-parallel**: 장비 정보와 보정계수 병렬 로딩

   ```typescript
   const [equipment, factors, history] = await Promise.all([
     getEquipment(id),
     getCalibrationFactors(id),
     getFactorHistory(id),
   ]);
   ```

3. **rerender-memo**: 이력 타임라인 아이템 메모이제이션

   ```typescript
   const MemoizedHistoryItem = memo(HistoryItem);
   ```

4. **js-cache-function-results**: JSON 파싱 결과 캐싱
   ```typescript
   const parseParameters = useMemo(() => {
     try {
       return JSON.parse(parametersJson);
     } catch {
       return {};
     }
   }, [parametersJson]);
   ```

디자인 요구사항 (/frontend-design 스킬 활용):

- 파라미터 에디터:
  - JSON 모드 / 키-값 폼 모드 토글
  - JSON 에디터: 구문 강조, 에러 표시
  - 키-값 폼: 동적 행 추가/삭제
- 적용 기간 시각화:
  - 타임라인 형태로 이력 표시
  - 현재 적용 중: UL Green (#00A451) 테두리
  - 만료된 계수: UL Gray (#EBEBEB) 배경
- 만료 임박 경고:
  - 30일 이내: UL Orange (#FF9D55) 배경 + 경고 아이콘
  - 7일 이내: Brand Red (#CA0123) 테두리 + 긴급 배너
- 승인 상태 뱃지:
  - pending: UL Info (#BCE4F7) 배경
  - approved: UL Green (#00A451) 배경
  - rejected: Brand Red (#CA0123) 배경

접근성 요구사항 (/web-design-guidelines):

- JSON 에디터에 role="textbox" + aria-multiline="true" 추가
- 키-값 폼 행에 aria-label="파라미터 {index}" 추가
- 토글 버튼에 aria-pressed 상태 표시
- 만료 임박 경고에 role="alert" 추가
- 타임라인에 aria-label="보정계수 이력" + role="list" 추가
- 현재 적용 중인 계수에 aria-current="true" 추가
- 모든 입력 필드에 명시적 label 연결
- Tab 키로 JSON 에디터 내부 탐색 가능

제약사항:

- 보정계수 이력 영구 보관 (삭제 불가)
- 현재 적용 중인 계수 강조 (시각적 + aria-current)
- JSON 파라미터 유효성 검증 필수

검증:

- 보정계수 등록 플로우
- 승인 플로우
- Excel 내보내기 테스트
- pnpm tsc --noEmit

Playwright 테스트:

- 보정계수 등록/수정
- 승인 플로우
- Excel 다운로드

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.

````

### 필수 가이드라인

#### 1. 보정계수 관련 API 엔드포인트

```typescript
// 장비별 보정계수 목록
GET /api/equipment/:id/calibration-factors?status={status}&type={type}

// 보정계수 상세 조회
GET /api/calibration-factors/:uuid

// 보정계수 등록 (승인 필요 여부는 역할에 따라 결정)
POST /api/equipment/:id/calibration-factors

// 보정계수 수정 (pending 상태에서만)
PATCH /api/calibration-factors/:uuid

// 보정계수 승인 (기술책임자 이상)
PATCH /api/calibration-factors/:uuid/approve

// 보정계수 반려 (기술책임자 이상)
PATCH /api/calibration-factors/:uuid/reject

// 전체 보정계수 대장 (보고서)
GET /api/reports/calibration-factors?equipmentId={id}&type={type}&dateFrom={date}&dateTo={date}

// Excel 내보내기
GET /api/reports/calibration-factors/export?format=xlsx&...filters
````

---

#### 2. 역할별 UI 분기 - 보정계수 관리 특화

```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function CalibrationFactorForm() {
  const { hasRole } = useAuth();

  // 역할 기반 UI 분기
  const canDirectRegister = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const canApprove = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const needsApproval = hasRole('test_engineer');

  return (
    <>
      {/* 시험실무자: 승인 필요 안내 */}
      {needsApproval && (
        <Alert className="mb-4 bg-[#BCE4F7]/20 border-[#BCE4F7]">
          <Info className="h-4 w-4 text-[#577E9E]" />
          <AlertDescription>
            보정계수 변경은 기술책임자의 승인이 필요합니다.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
```

---

#### 3. 보정계수 유형별 처리

```typescript
// UL Solutions 브랜드 색상 적용
const FACTOR_TYPE_CONFIG = {
  antenna_gain: {
    label: '안테나 이득',
    unit: 'dBi',
    color: 'bg-[#122C49]/10 text-[#122C49]',
    icon: Antenna,
  },
  cable_loss: {
    label: '케이블 손실',
    unit: 'dB',
    color: 'bg-[#577E9E]/10 text-[#577E9E]',
    icon: Cable,
  },
  amplifier_gain: {
    label: '증폭기 이득',
    unit: 'dB',
    color: 'bg-[#00A451]/10 text-[#00A451]',
    icon: Signal,
  },
  attenuation: {
    label: '감쇠량',
    unit: 'dB',
    color: 'bg-[#FF9D55]/10 text-[#FF9D55]',
    icon: TrendingDown,
  },
};
```

---

#### 4. 만료 상태 처리

```typescript
const getExpiryStatus = (effectiveTo: Date | null) => {
  if (!effectiveTo) return { status: 'permanent', label: '영구' };

  const daysUntilExpiry = differenceInDays(effectiveTo, new Date());

  if (daysUntilExpiry < 0) {
    return {
      status: 'expired',
      label: '만료됨',
      color: 'bg-[#EBEBEB] text-[#577E9E]',
    };
  }
  if (daysUntilExpiry <= 7) {
    return {
      status: 'critical',
      label: `${daysUntilExpiry}일 후 만료`,
      color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]',
      alert: true,
    };
  }
  if (daysUntilExpiry <= 30) {
    return {
      status: 'warning',
      label: `${daysUntilExpiry}일 후 만료`,
      color: 'bg-[#FF9D55]/10 text-[#FF9D55]',
      alert: true,
    };
  }
  return {
    status: 'active',
    label: '적용 중',
    color: 'bg-[#00A451]/10 text-[#00A451]',
  };
};
```

---

#### 5. 핵심 규칙

- 보정계수 이력은 영구 보관되며 삭제 불가
- 현재 적용 중인 보정계수는 시각적으로 강조 표시 + aria-current="true"
- 파라미터는 JSON 형식으로 저장되며, 사용자 친화적인 키-값 폼 제공
- 만료 임박(30일 이내) 보정계수는 경고 표시
- JSON 파라미터 유효성 검증 실패 시 저장 차단

---

### 이행 체크리스트 UI-14

#### 컴포넌트 구현

- [ ] equipment/[id]/calibration-factors/page.tsx 구현됨
- [ ] equipment/[id]/calibration-factors/create/page.tsx 구현됨
- [ ] equipment/[id]/calibration-factors/[factorId]/edit/page.tsx 구현됨
- [ ] reports/calibration-factors/page.tsx 구현됨
- [ ] CalibrationFactorList.tsx 컴포넌트 생성됨
- [ ] CalibrationFactorForm.tsx 컴포넌트 생성됨
- [ ] ParameterEditor.tsx 컴포넌트 생성됨
- [ ] FactorHistoryTimeline.tsx 컴포넌트 생성됨
- [ ] calibration-factor-api.ts API 함수 생성됨
- [ ] actions/calibration-factors.ts Server Actions 생성됨

#### Next.js 16 패턴

- [ ] 동적 라우트에서 PageProps 사용됨
- [ ] params를 await로 처리함 (중첩 동적 라우트 포함)
- [ ] useActionState 사용됨 (useFormState 아님)
- [ ] Server Actions가 적절히 분리됨

#### 성능 최적화 (Vercel Best Practices)

- [ ] ParameterEditor 동적 import 적용됨
- [ ] 이력 타임라인 아이템 메모이제이션됨
- [ ] 초기 데이터 Promise.all로 병렬 로딩됨
- [ ] JSON 파싱 결과 useMemo로 캐싱됨

#### 기능 구현

- [ ] 파라미터 에디터 구현됨 (JSON 모드 / 키-값 폼 모드)
- [ ] 만료 임박 경고 표시됨
- [ ] 현재 적용 중인 계수 강조됨
- [ ] 이력 타임라인 구현됨
- [ ] Excel 내보내기 구현됨
- [ ] 역할별 UI 분기 구현됨

#### 에러 처리 관련

- [ ] JSON 파라미터 유효성 검증됨
- [ ] ErrorAlert 컴포넌트 연동됨
- [ ] 재시도 버튼(onRetry) 구현됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트 확인됨
- [ ] 필드별 에러 표시 구현됨

#### 로딩/빈 상태 관련

- [ ] 목록 스켈레톤 로딩 UI 구현됨
- [ ] 폼 스켈레톤 로딩 UI 구현됨
- [ ] 빈 상태 UI 구현됨 (보정계수 없음)

#### form 버튼 관련

- [ ] Dialog 내 모든 Button에 type 속성 명시됨
- [ ] form 내 취소/파라미터 추가 버튼에 type="button" 적용됨
- [ ] 제출 버튼에만 type="submit" 적용됨

#### 접근성 관련 (WCAG 2.1 AA)

- [ ] JSON 에디터에 role="textbox" + aria-multiline="true" 추가됨
- [ ] 키-값 폼 행에 aria-label 추가됨
- [ ] 토글 버튼에 aria-pressed 상태 표시됨
- [ ] 만료 임박 경고에 role="alert" 추가됨
- [ ] 타임라인에 role="list" + aria-label 추가됨
- [ ] 현재 적용 중인 계수에 aria-current="true" 추가됨
- [ ] 모든 입력 필드에 명시적 label 연결됨
- [ ] 포커스 표시 명확함 (outline 스타일 유지)
- [ ] Tab 키 네비게이션 테스트 통과됨

#### 테스트

- [ ] Playwright 테스트 작성됨 (calibration-factors.spec.ts)
- [ ] 에러 시나리오 테스트 통과됨
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/calibration-factors.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Calibration Factors - Basic', () => {
  test('보정계수 등록 및 승인', async ({ testOperatorPage, techManagerPage }) => {
    // 시험실무자: 보정계수 등록 요청
    await testOperatorPage.goto('/equipment/1/calibration-factors');
    await testOperatorPage.getByRole('button', { name: '보정계수 추가' }).click();

    await testOperatorPage.getByLabel('유형').selectOption('antenna_gain');
    await testOperatorPage.getByLabel('이름').fill('안테나 이득 계수');
    await testOperatorPage.getByLabel('값').fill('2.5');
    await testOperatorPage.getByLabel('단위').fill('dBi');
    await testOperatorPage.getByLabel('적용 시작일').fill('2026-01-01');
    await testOperatorPage.getByLabel('적용 종료일').fill('2026-12-31');

    // 파라미터 입력
    await testOperatorPage.getByRole('button', { name: '파라미터 추가' }).click();
    await testOperatorPage.getByLabel('키').first().fill('frequency');
    await testOperatorPage.getByLabel('값').nth(1).fill('1000');

    await testOperatorPage.getByRole('button', { name: '저장' }).click();
    await expect(testOperatorPage.getByText('승인 대기')).toBeVisible();

    // 기술책임자: 승인
    await techManagerPage.goto('/equipment/1/calibration-factors');
    await techManagerPage.getByText('승인 대기').first().click();
    await techManagerPage.getByRole('button', { name: '승인' }).click();

    await expect(techManagerPage.getByText('승인됨')).toBeVisible();
  });

  test('현재 적용 중인 계수 강조', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors');

    // 현재 적용 중인 계수는 강조 표시 + aria-current
    const activeFactor = testOperatorPage.locator('[aria-current="true"]');
    await expect(activeFactor).toBeVisible();
    await expect(activeFactor).toHaveClass(/border-\[#00A451\]/);
  });

  test('만료 임박 경고', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors');

    // 만료 임박 계수는 경고 표시
    const expiryWarning = testOperatorPage.getByRole('alert').filter({ hasText: /만료/ });
    await expect(expiryWarning).toBeVisible();
  });
});

test.describe('Calibration Factors - Parameter Editor', () => {
  test('JSON 모드와 폼 모드 전환', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors/create');

    // JSON 모드로 전환
    const toggleButton = testOperatorPage.getByRole('button', { name: 'JSON 모드' });
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    const jsonEditor = testOperatorPage.locator('[role="textbox"][aria-multiline="true"]');
    await expect(jsonEditor).toBeVisible();

    await jsonEditor.fill('{"frequency": 1000, "temperature": 25}');

    // 다시 폼 모드로 전환 시 값 유지
    await testOperatorPage.getByRole('button', { name: '폼 모드' }).click();
    await expect(testOperatorPage.getByDisplayValue('1000')).toBeVisible();
  });

  test('유효하지 않은 JSON 입력 시 에러', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors/create');

    await testOperatorPage.getByRole('button', { name: 'JSON 모드' }).click();

    const jsonEditor = testOperatorPage.locator('[role="textbox"][aria-multiline="true"]');
    await jsonEditor.fill('{ invalid json }');

    await testOperatorPage.getByRole('button', { name: '저장' }).click();
    await expect(testOperatorPage.getByText(/JSON 형식이 올바르지 않습니다/)).toBeVisible();
  });
});

test.describe('Calibration Factors - Reports', () => {
  test('Excel 내보내기', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/reports/calibration-factors');

    // 필터 설정
    await testOperatorPage.getByLabel('유형').selectOption('antenna_gain');
    await testOperatorPage.getByLabel('시작일').fill('2026-01-01');
    await testOperatorPage.getByLabel('종료일').fill('2026-12-31');
    await testOperatorPage.getByRole('button', { name: '필터 적용' }).click();

    // Excel 다운로드
    const downloadPromise = testOperatorPage.waitForEvent('download');
    await testOperatorPage.getByRole('button', { name: 'Excel 내보내기' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.xlsx');
  });
});

test.describe('Calibration Factors - Error Handling', () => {
  test('API 에러 시 ErrorAlert 표시', async ({ page }) => {
    await page.route('**/api/equipment/*/calibration-factors**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/equipment/1/calibration-factors');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });
});

test.describe('Calibration Factors - Accessibility', () => {
  test('타임라인에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors');

    const timeline = testOperatorPage.getByRole('list', { name: '보정계수 이력' });
    await expect(timeline).toBeVisible();
  });

  test('키보드 탐색', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors');

    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('토글 버튼 aria-pressed 상태', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors/create');

    const jsonToggle = testOperatorPage.getByRole('button', { name: 'JSON 모드' });
    await expect(jsonToggle).toHaveAttribute('aria-pressed', 'false');

    await jsonToggle.click();
    await expect(jsonToggle).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Calibration Factors - Role Based UI', () => {
  test('시험실무자 - 승인 필요 안내 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/calibration-factors/create');

    await expect(testOperatorPage.getByText(/승인이 필요합니다/)).toBeVisible();
  });

  test('기술책임자 - 승인/반려 버튼 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/equipment/1/calibration-factors');

    // pending 상태인 항목 선택
    const pendingItem = techManagerPage.getByText('승인 대기').first();
    if (await pendingItem.isVisible()) {
      await pendingItem.click();
      await expect(techManagerPage.getByRole('button', { name: '승인' })).toBeVisible();
      await expect(techManagerPage.getByRole('button', { name: '반려' })).toBeVisible();
    }
  });
});
```

#### 테스트 실행 방법

```bash
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration-factors.spec.ts --project=chromium

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration-factors.spec.ts --debug
```
