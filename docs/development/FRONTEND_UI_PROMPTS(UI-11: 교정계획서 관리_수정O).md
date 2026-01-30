# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-11: 교정계획서 관리

### 목적

교정계획서 작성 및 3단계 승인 관리 페이지를 구현합니다.

### 프롬프트

````
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design
/playwright-skill

역할 참고:

요구사항:
1. 교정계획서 목록
   - 연도별/시험소별 계획서 목록
   - 상태 필터 (작성 중, 검토 대기, 승인 대기, 승인됨, 반려됨)
   - 버전 표시 (최신 버전 배지)

2. 교정계획서 작성
| 계획 연도 | 해당 연도 |
| 대상 장비 목록 | 외부교정 대상 장비 자동 로드 |
| 각 장비별 현재 교정일 | 스냅샷 저장 |
| 각 장비별 차기 교정월 | 스냅샷 저장 |
| 현재 교정기관 | 스냅샷 저장 |
| 예상 교정기관 | 계획 입력 |
| 작성자 | 기술책임자 |
| 작성일 | 계획서 작성일 |

3. 교정계획서 상세
   - 계획서 상세 보기
   - 3단계 승인 타임라인 (작성 → 확인 → 승인)
   - 인라인 편집 (draft 상태에서만)
   - 버전 히스토리 조회

4. 승인 프로세스 (3단계)
┌─────────────────────────────────────────────────────────────┐
│                연간 교정계획서 3단계 승인 프로세스             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [기술책임자]                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │ 1. 작성     │  - 외부교정 대상 장비 자동 로드             │
│  │             │  - 교정 일정 입력/수정                      │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 검토 요청    │  → 상태: 'pending_review'                 │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  [품질책임자]                                                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 2. 확인     │  - 계획 적정성 확인                         │
│  │             │  - 의견 추가 (선택)                         │
│  │             │  → 상태: 'pending_approval'                │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  [시험소장]                                                  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 3. 최종 승인 │                                           │
│  │             │  → 상태: 'approved'                        │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  계획 확정 (수정 불가)                                        │
│                                                             │
│  ※ 품질책임자/시험소장은 언제든 반려 가능                     │
│     → 상태: 'rejected', 사유 필수                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

5. 버전 관리
   - 승인된 계획서 수정 시 새 버전 자동 생성 (v2, v3, ...)
   - 작성 중/대기 중 계획서는 현재 버전 덮어쓰기
   - 버전 히스토리: 상세 페이지에서 이전 버전 조회 가능
   - 연도+시험소 unique 제약은 최신 버전에만 적용

6. PDF 출력
   - 교정계획서 HTML 출력 (브라우저 인쇄로 PDF 저장)
   - 서명란 포함
   - A4 인쇄 최적화

파일:
- apps/frontend/app/(dashboard)/calibration-plans/page.tsx (목록)
- apps/frontend/app/(dashboard)/calibration-plans/create/page.tsx (작성)
- apps/frontend/app/(dashboard)/calibration-plans/[uuid]/page.tsx (상세)
- apps/frontend/components/calibration/CalibrationPlanDetailClient.tsx
- apps/frontend/components/calibration/CalibrationPlansContent.tsx
- apps/frontend/components/calibration/VersionHistory.tsx (신규)
- apps/frontend/lib/api/calibration-plans-api.ts

Next.js 16 패턴 (필수):
1. PageProps 패턴 (동적 라우트)
   ```typescript
   // apps/frontend/app/(dashboard)/calibration-plans/[uuid]/page.tsx
   import type { PageProps } from '@/types/next';

   export default async function CalibrationPlanDetailPage(
     props: PageProps<'/calibration-plans/[uuid]'>
   ) {
     const { uuid } = await props.params;  // ✅ params는 Promise
     return <CalibrationPlanDetailClient planUuid={uuid} />;
   }
````

2. searchParams 패턴 (필터링)

   ```typescript
   // apps/frontend/app/(dashboard)/calibration-plans/page.tsx
   export default async function CalibrationPlansPage(props: {
     searchParams: Promise<{ year?: string; status?: string; page?: string }>;
   }) {
     const { year, status, page } = await props.searchParams;  // ✅ searchParams도 Promise
     const initialData = await getCalibrationPlans({ year, status, page });
     return <CalibrationPlansContent initialData={initialData} />;
   }
   ```

3. React Query useMutation 패턴 (상태 변경)

   ```typescript
   'use client';
   import { useMutation, useQueryClient } from '@tanstack/react-query';

   // ✅ React Query useMutation - 프로젝트 표준
   const reviewMutation = useMutation({
     mutationFn: () => calibrationPlansApi.reviewCalibrationPlan(uuid, data),
     onSuccess: () => {
       toast({ title: '확인 완료' });
       queryClient.invalidateQueries({ queryKey: ['calibration-plan', uuid] });
     },
     onError: (error) => {
       toast({ title: '오류', description: error.message, variant: 'destructive' });
     },
   });
   ```

성능 최적화 (/vercel-react-best-practices 적용):

1. `async-parallel`: 계획서 데이터 병렬 로딩
   ```typescript
   const [plan, versions] = await Promise.all([getCalibrationPlan(uuid), getPlanVersions(uuid)]);
   ```
2. `rerender-memo`: 장비 목록 컴포넌트 메모이제이션
3. `server-serialization`: 클라이언트에 전달하는 데이터 최소화

UL Solutions 브랜드 색상 (필수):

```typescript
// tailwind.config.js에 정의된 UL 브랜드 색상
const UL_COLORS = {
  'ul-green': '#00A451', // 승인, 완료 (메인 액션)
  'ul-orange': '#FF9D55', // 대기, 주의
  'ul-red': '#CA0123', // 반려, 오류
  'ul-fog': '#577E9E', // 정보, 중립
  'ul-midnight': '#122C49', // 텍스트, 헤더
  'ul-info': '#BCE4F7', // 배경 강조
};

// 상태별 색상 매핑 (UL 브랜드 적용)
export const CALIBRATION_PLAN_STATUS_COLORS: Record<CalibrationPlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-ul-orange/10 text-ul-orange border border-ul-orange/20',
  pending_approval: 'bg-ul-fog/10 text-ul-fog border border-ul-fog/20',
  approved: 'bg-ul-green/10 text-ul-green border border-ul-green/20',
  rejected: 'bg-ul-red/10 text-ul-red border border-ul-red/20',
};

// 타임라인 원 색상
const TIMELINE_COLORS = {
  current: 'bg-ul-orange text-white animate-pulse', // 현재 단계
  completed: 'bg-ul-green text-white', // 완료된 단계
  rejected: 'bg-ul-red text-white', // 반려된 단계
  pending: 'bg-gray-300 text-gray-500', // 미진행 단계
};
```

접근성 요구사항 (WCAG 2.1 AA 필수):

1. 타임라인 접근성

   ```typescript
   <div
     className="flex items-stretch justify-between gap-4"
     role="navigation"
     aria-label="교정계획서 승인 진행 상황"
   >
     <div
       className="flex flex-col items-center flex-1"
       role="group"
       aria-label="1단계: 작성"
     >
       <div
         className={`w-10 h-10 rounded-full...`}
         aria-label={isDraft ? '현재 단계: 작성 중' : '완료된 단계: 작성'}
       >
         <FileText className="h-5 w-5" aria-hidden="true" />
       </div>
     </div>
   </div>
   ```

2. 버튼 접근성

   ```typescript
   <Button
     size="sm"
     onClick={handleReviewConfirm}
     disabled={reviewMutation.isPending}
     aria-label="교정계획서 확인 완료 (품질책임자)"
     aria-busy={reviewMutation.isPending}
   >
     {reviewMutation.isPending ? (
       <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
     ) : (
       <>
         <Check className="h-4 w-4 mr-1" aria-hidden="true" />
         확인 완료
       </>
     )}
   </Button>
   ```

3. 동적 콘텐츠 알림

   ```typescript
   <div aria-live="polite" aria-atomic="true" className="sr-only">
     {reviewMutation.isSuccess && '교정계획서 확인이 완료되었습니다'}
     {approveMutation.isSuccess && '교정계획서가 최종 승인되었습니다'}
     {rejectMutation.isSuccess && '교정계획서가 반려되었습니다'}
   </div>
   ```

4. 테이블 접근성

   ```typescript
   <Table role="grid" aria-label="교정 대상 장비 목록">
     <TableHeader>
       <TableRow>
         <TableHead scope="col">순번</TableHead>
         <TableHead scope="col">관리번호</TableHead>
         <TableHead scope="col">장비명</TableHead>
       </TableRow>
     </TableHeader>
   </Table>
   ```

5. 색상 대비 요구사항

   - 텍스트: 최소 4.5:1 대비율
   - UI 컴포넌트: 최소 3:1 대비율
   - 포커스 인디케이터: 2px solid ring

6. 키보드 네비게이션
   - Tab: 다음 요소로 이동
   - Shift+Tab: 이전 요소로 이동
   - Enter: 버튼 클릭, 링크 이동
   - Esc: 다이얼로그/모달 닫기

제약사항:

- 승인완료 후 직접 수정 불가 (새 버전 생성 필요)
- 버전 관리 (승인된 계획서 수정 시 새 버전)
- 연도+시험소당 최신 버전 1개만 활성

검증:

- 계획서 작성 플로우
- 3단계 승인 프로세스
- 버전 관리 동작
- PDF 출력 테스트
- pnpm tsc --noEmit
- WCAG 2.1 AA 접근성 검증

Playwright 테스트:

- 장비 선택 및 일정 설정
- 승인 요청/확인/최종 승인 플로우
- 반려 및 재제출 플로우
- PDF 다운로드
- 버전 히스토리 조회

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.

````

### 필수 가이드라인

- 교정계획서는 연도별로 관리되며, 한 번 승인되면 새 버전으로만 수정 가능
- 버전 관리를 통해 수정 이력 추적
- PDF 출력 시 A4 규격에 맞춘 레이아웃 필수
- UL Solutions 브랜드 색상 일관되게 적용

### 이행 체크리스트 UI-11

#### 파일 생성
- [x] calibration-plans/page.tsx 구현됨
- [x] calibration-plans/create/page.tsx 구현됨
- [x] calibration-plans/[uuid]/page.tsx 구현됨
- [ ] VersionHistory.tsx 컴포넌트 생성됨
- [x] CalibrationPlanDetailClient.tsx 컴포넌트 생성됨
- [x] CalibrationPlansContent.tsx 컴포넌트 생성됨
- [x] calibration-plans-api.ts API 함수 생성됨

#### Next.js 16 패턴
- [x] PageProps로 타입 정의됨
- [x] params를 await로 추출함
- [x] searchParams를 await로 추출함 (목록 필터링)
- [x] React Query useMutation으로 상태 변경 처리함
- [x] 'use client'는 필요한 곳에만 사용됨

#### 기능 구현
- [x] 장비 자동 로드 구현됨
- [x] 3단계 승인 프로세스 구현됨 (작성 → 확인 → 승인)
- [ ] 버전 관리 구현됨
- [x] PDF 출력 구현됨
- [x] 인라인 편집 구현됨

#### 성능 최적화
- [x] 다중 데이터 Promise.all로 병렬 로딩됨
- [x] 클라이언트 전달 데이터 최소화됨

#### 디자인
- [ ] UL Solutions 브랜드 색상 적용됨
- [ ] 상태별 배지 색상 구현됨 (UL 색상)
- [x] 승인 타임라인 UI 구현됨

#### 접근성 (WCAG 2.1 AA)
- [ ] 타임라인에 role/aria-label 적용됨
- [ ] 동적 콘텐츠 aria-live로 알림됨
- [ ] 테이블에 role="grid", scope="col" 적용됨
- [ ] 버튼에 aria-label, aria-busy 적용됨
- [ ] 키보드 네비게이션 지원됨

#### 테스트
- [ ] Playwright 테스트 작성됨 (calibration-plans.spec.ts)
- [ ] 접근성 테스트 작성됨
- [ ] 권한 테스트 작성됨
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/calibration-plans.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('교정계획서 관리', () => {
  test.describe('계획서 작성', () => {
    test('교정계획서 작성 플로우', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/create');
      await techManagerPage.selectOption('[name="year"]', '2026');
      await techManagerPage.selectOption('[name="siteId"]', 'suwon');

      // 장비 자동 로드 확인
      await expect(techManagerPage.locator('[data-testid="equipment-table"]')).toBeVisible();

      // 계획서 생성
      await techManagerPage.click('[data-testid="create-plan"]');
      await expect(techManagerPage.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('3단계 승인 프로세스', () => {
    test('기술책임자 → 품질책임자 → 시험소장 승인', async ({
      techManagerPage,
      qualityManagerPage,
      labManagerPage,
    }) => {
      // 1단계: 기술책임자 - 검토 요청
      await techManagerPage.goto('/calibration-plans/test-uuid');
      await techManagerPage.click('[data-testid="submit-for-review"]');
      await expect(techManagerPage.locator('[data-testid="status-pending_review"]')).toBeVisible();

      // 2단계: 품질책임자 - 확인
      await qualityManagerPage.goto('/calibration-plans/test-uuid');
      await qualityManagerPage.click('[data-testid="confirm-review"]');
      await expect(qualityManagerPage.locator('[data-testid="status-pending_approval"]')).toBeVisible();

      // 3단계: 시험소장 - 최종 승인
      await labManagerPage.goto('/calibration-plans/test-uuid');
      await labManagerPage.click('[data-testid="approve"]');
      await expect(labManagerPage.getByRole('status')).toContainText('승인되었습니다');
    });

    test('반려 및 재제출', async ({ techManagerPage, qualityManagerPage }) => {
      // 품질책임자: 반려
      await qualityManagerPage.goto('/calibration-plans/test-uuid');
      await qualityManagerPage.click('[data-testid="reject"]');
      await qualityManagerPage.fill('[name="rejectionReason"]', '일정 조정 필요');
      await qualityManagerPage.click('[data-testid="confirm-reject"]');

      // 기술책임자: 수정 후 재제출
      await techManagerPage.goto('/calibration-plans/test-uuid');
      await expect(techManagerPage.locator('[data-testid="rejection-reason"]')).toContainText('일정 조정 필요');
      await techManagerPage.click('[data-testid="submit-for-review"]');
    });
  });

  test.describe('버전 관리', () => {
    test('승인된 계획서 새 버전 생성', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/approved-uuid');
      await techManagerPage.click('[data-testid="create-new-version"]');

      // 새 버전 생성 확인
      await expect(techManagerPage.locator('[data-testid="version-badge"]')).toContainText('v2');
    });

    test('버전 히스토리 조회', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/test-uuid');

      const versionHistory = techManagerPage.locator('[data-testid="version-history"]');
      await expect(versionHistory).toBeVisible();
      await expect(versionHistory.locator('[role="listitem"]')).toHaveCount(2);
    });
  });

  test.describe('접근성', () => {
    test('타임라인 키보드 네비게이션', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/test-uuid');

      const timeline = techManagerPage.locator('[role="navigation"][aria-label="교정계획서 승인 진행 상황"]');
      await expect(timeline).toBeVisible();
    });

    test('승인 버튼 접근성', async ({ labManagerPage }) => {
      await labManagerPage.goto('/calibration-plans/pending-uuid');

      const approveButton = labManagerPage.getByRole('button', { name: /최종 승인/ });
      await expect(approveButton).toHaveAttribute('aria-label');

      // 클릭 후 로딩 상태
      await approveButton.click();
      await expect(approveButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  test.describe('권한 테스트', () => {
    test('시험실무자는 계획서 조회만 가능', async ({ testEngineerPage }) => {
      await testEngineerPage.goto('/calibration-plans/test-uuid');

      // 승인/반려 버튼 없음
      await expect(testEngineerPage.getByRole('button', { name: '검토 요청' })).not.toBeVisible();
      await expect(testEngineerPage.getByRole('button', { name: '확인 완료' })).not.toBeVisible();
    });

    test('기술책임자는 작성 및 검토요청 가능', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/create');
      await expect(techManagerPage.getByRole('heading', { name: '교정계획서 작성' })).toBeVisible();
    });

    test('품질책임자는 확인만 가능', async ({ qualityManagerPage }) => {
      await qualityManagerPage.goto('/calibration-plans/pending-review-uuid');

      await expect(qualityManagerPage.getByRole('button', { name: '확인 완료' })).toBeVisible();
      await expect(qualityManagerPage.getByRole('button', { name: '최종 승인' })).not.toBeVisible();
    });

    test('시험소장은 최종 승인 가능', async ({ labManagerPage }) => {
      await labManagerPage.goto('/calibration-plans/pending-approval-uuid');

      await expect(labManagerPage.getByRole('button', { name: '최종 승인' })).toBeVisible();
    });
  });
});
````
