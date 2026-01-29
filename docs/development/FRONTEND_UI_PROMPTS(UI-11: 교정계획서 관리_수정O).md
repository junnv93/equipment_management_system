# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-11: 교정계획서 관리

### 목적

교정계획서 작성 및 승인 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

역할 참고:

요구사항:
1. 교정계획서 목록
   - 연도별 계획서 목록
   - 상태 필터 
   - 버전 관리

2. 교정계획서 작성
| 계획 연도 | 해당 연도 |
| 대상 장비 목록 | 외부교정 대상 장비 |
| 각 장비별 현재 교정일 | 
| 각 장비별 차기 교정월 | 
| 현재 교정기관 | 교정 수행 기관 |
| 예상 교정기관 | 교정 수행 예정 기관 |
| 작성자 | 기술책임자 |
| 작성일 | 계획서 작성일 |

3. 교정계획서 상세/수정
   - 계획서 상세 보기
   - 승인 상태에 따른 수정 가능 여부
   - 버전 이력 보기

4. 승인 프로세스
┌─────────────────────────────────────────────────────────────┐
│                연간 교정계획서 승인 프로세스                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [기술책임자]                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │ 계획서 작성  │  - 외부교정 대상 장비 선택                   │
│  │             │  - 교정 일정 입력                           │
│  │             │  - 시스템에서 계획서 자동 생성               │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 작성 완료    │  → 상태: '검토대기'                        │
│  │ (서명)      │                                            │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  [품질책임자]                                                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 검토        │  - 계획 적정성 확인                         │
│  │ (서명)      │  → 상태: '승인대기'                        │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  [시험소장]                                                  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 최종 승인    │                                           │
│  │ (서명)      │                                            │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  계획 확정                                                   │
│  - 상태: '승인완료'                                          │
│                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

5. PDF 출력
   - 교정계획서 PDF 생성
   - 서명란 포함
   - A4 인쇄 최적화

파일:
- apps/frontend/app/calibration-plans/page.tsx (목록)
- apps/frontend/app/calibration-plans/create/page.tsx (작성)
- apps/frontend/app/calibration-plans/[uuid]/page.tsx (상세)
- apps/frontend/app/calibration-plans/[uuid]/edit/page.tsx (수정)
- apps/frontend/app/calibration-plans/[uuid]/versions/page.tsx (버전 이력)
- apps/frontend/app/actions/calibration-plans.ts (Server Actions)
- apps/frontend/components/calibration-plans/CalibrationPlanForm.tsx
- apps/frontend/components/calibration-plans/EquipmentScheduleTable.tsx
- apps/frontend/components/calibration-plans/ScheduleGanttView.tsx (간트 차트)
- apps/frontend/components/calibration-plans/ScheduleCalendarView.tsx (캘린더 뷰)
- apps/frontend/components/calibration-plans/ApprovalStatus.tsx
- apps/frontend/components/calibration-plans/ApprovalTimeline.tsx
- apps/frontend/components/calibration-plans/VersionHistory.tsx
- apps/frontend/lib/api/calibration-plan-api.ts

Next.js 16 패턴 (필수):
1. PageProps 패턴 (동적 라우트)
   ```typescript
   // apps/frontend/app/calibration-plans/[uuid]/page.tsx
   import { PageProps } from 'next';

   export default async function CalibrationPlanDetailPage(
     props: PageProps<'/calibration-plans/[uuid]'>
   ) {
     const { uuid } = await props.params;  // ✅ params는 Promise
     const plan = await getCalibrationPlan(uuid);
     return <CalibrationPlanDetail plan={plan} />;
   }
   ```

2. searchParams 패턴 (필터링)
   ```typescript
   // apps/frontend/app/calibration-plans/page.tsx
   export default async function CalibrationPlansPage(props: {
     searchParams: Promise<{ year?: string; status?: string; page?: string }>;
   }) {
     const { year, status, page } = await props.searchParams;  // ✅ searchParams도 Promise
     const plans = await getCalibrationPlans({ year, status, page: page ? parseInt(page) : 1 });
     return <CalibrationPlanList plans={plans} />;
   }
   ```

3. useActionState 패턴 (승인 처리)
   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { approvePlan, rejectPlan } from '@/app/actions/calibration-plans';

   export function ApprovalActions({ planId }: { planId: string }) {
     const [approveState, approveAction, isApproving] = useActionState(
       approvePlan, { error: null, success: false }
     );
     const [rejectState, rejectAction, isRejecting] = useActionState(
       rejectPlan, { error: null, success: false }
     );

     return (
       <div className="flex gap-2">
         <form action={approveAction}>
           <input type="hidden" name="planId" value={planId} />
           <Button type="submit" disabled={isApproving} className="bg-[#00A451]">
             {isApproving ? '승인 중...' : '승인'}
           </Button>
         </form>
         <form action={rejectAction}>
           <input type="hidden" name="planId" value={planId} />
           <Button type="submit" variant="destructive" disabled={isRejecting}>
             {isRejecting ? '처리 중...' : '반려'}
           </Button>
         </form>
       </div>
     );
   }
   ```

성능 최적화 (/vercel-react-best-practices 적용):
1. `bundle-dynamic-imports`: 간트 차트/캘린더 컴포넌트 동적 import
   ```typescript
   const ScheduleGanttView = dynamic(() => import('./ScheduleGanttView'), {
     loading: () => <Skeleton className="h-[400px]" />,
     ssr: false,
   });
   ```
2. `async-parallel`: 계획서 데이터 병렬 로딩
   ```typescript
   const [plan, equipment, versions] = await Promise.all([
     getCalibrationPlan(uuid),
     getPlanEquipment(uuid),
     getPlanVersions(uuid),
   ]);
   ```
3. `rerender-memo`: 장비 목록 컴포넌트 메모이제이션
4. `server-serialization`: 클라이언트에 전달하는 데이터 최소화

디자인 요구사항 (/frontend-design 스킬 활용):
- UL Solutions 브랜드 색상 적용:
  - 승인완료 배지: UL Green (#00A451)
  - 승인대기 배지: UL Orange (#FF9D55)
  - 작성중 배지: UL Fog (#577E9E)
  - 반려 배지: Brand Red (#CA0123)
  - 테이블 헤더: Midnight Blue (#122C49)
  - 간트 바: UL Info (#BCE4F7)
- 장비 일정 캘린더 또는 간트 뷰
  ```typescript
  // 상태별 색상 설정
  const STATUS_COLORS = {
    approved: { bg: 'bg-[#00A451]/10', text: 'text-[#00A451]', border: 'border-[#00A451]/20' },
    pending: { bg: 'bg-[#FF9D55]/10', text: 'text-[#FF9D55]', border: 'border-[#FF9D55]/20' },
    draft: { bg: 'bg-[#577E9E]/10', text: 'text-[#577E9E]', border: 'border-[#577E9E]/20' },
    rejected: { bg: 'bg-[#CA0123]/10', text: 'text-[#CA0123]', border: 'border-[#CA0123]/20' },
  };
  ```
- 드래그앤드롭 일정 조정
- 승인 상태 타임라인

접근성 요구사항 (/web-design-guidelines - WCAG 2.1 AA):
1. 캘린더/간트 뷰 접근성
   ```typescript
   <div
     role="application"
     aria-label="교정 일정 캘린더"
     aria-describedby="calendar-instructions"
   >
     <span id="calendar-instructions" className="sr-only">
       화살표 키로 날짜를 이동하고, Enter로 일정을 선택하세요.
     </span>
     {/* 캘린더 내용 */}
   </div>
   ```
2. 드래그앤드롭 대체 키보드 조작
   ```typescript
   <button
     draggable="true"
     role="button"
     aria-grabbed={isDragging}
     aria-describedby={`item-${id}-instructions`}
     onKeyDown={(e) => {
       if (e.key === ' ') startDrag();
       if (e.key === 'ArrowUp') moveItem(-1);
       if (e.key === 'ArrowDown') moveItem(1);
       if (e.key === 'Enter') dropItem();
       if (e.key === 'Escape') cancelDrag();
     }}
   >
     <span id={`item-${id}-instructions`} className="sr-only">
       Space로 드래그 시작, 화살표로 이동, Enter로 놓기, Escape로 취소
     </span>
   </button>
   ```
3. 승인 상태 변경 알림
   ```typescript
   <div role="status" aria-live="polite" aria-atomic="true">
     {status === 'approved' && <span>교정계획서가 승인되었습니다.</span>}
     {status === 'rejected' && <span>교정계획서가 반려되었습니다. 사유: {reason}</span>}
   </div>
   ```
4. 테이블 접근성
   ```typescript
   <table role="grid" aria-label="교정 대상 장비 목록">
     <thead>
       <tr>
         <th scope="col">장비명</th>
         <th scope="col">교정 예정일</th>
         <th scope="col">담당자</th>
       </tr>
     </thead>
   </table>
   ```
5. 승인 버튼 접근성
   ```typescript
   <Button
     onClick={handleApprove}
     disabled={isProcessing}
     aria-busy={isProcessing}
     aria-label={isProcessing ? "승인 처리 중..." : "교정계획서 승인"}
   >
     {isProcessing ? '승인 중...' : '승인'}
   </Button>
   ```
6. 버전 이력 네비게이션
   - 키보드로 버전 간 이동 (←/→)
   - 현재 버전 표시 `aria-current="true"`

제약사항:
- 승인완료 후 수정 불가
- 버전 관리 (수정 시 새 버전)
- PDF 생성 시 서버 사이드

검증:
- 계획서 작성 플로우
- 승인 프로세스
- PDF 출력 테스트
- pnpm tsc --noEmit

Playwright 테스트:
- 장비 선택 및 일정 설정
- 승인 요청 플로우
- PDF 다운로드

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

- 교정계획서는 연도별로 관리되며, 한 번 승인되면 수정 불가
- 버전 관리를 통해 수정 이력 추적
- PDF 출력 시 A4 규격에 맞춘 레이아웃 필수
- 장비별 교정 일정은 캘린더 또는 간트 뷰로 시각화

### 이행 체크리스트 UI-11

#### 파일 생성
- [ ] calibration-plans/page.tsx 구현됨
- [ ] calibration-plans/create/page.tsx 구현됨
- [ ] calibration-plans/[uuid]/page.tsx 구현됨
- [ ] calibration-plans/[uuid]/edit/page.tsx 구현됨
- [ ] calibration-plans/[uuid]/versions/page.tsx 구현됨
- [ ] app/actions/calibration-plans.ts 생성됨
- [ ] CalibrationPlanForm.tsx 컴포넌트 생성됨
- [ ] EquipmentScheduleTable.tsx 컴포넌트 생성됨
- [ ] ScheduleGanttView.tsx 컴포넌트 생성됨
- [ ] ScheduleCalendarView.tsx 컴포넌트 생성됨
- [ ] ApprovalStatus.tsx 컴포넌트 생성됨
- [ ] ApprovalTimeline.tsx 컴포넌트 생성됨
- [ ] VersionHistory.tsx 컴포넌트 생성됨
- [ ] calibration-plan-api.ts API 함수 생성됨

#### Next.js 16 패턴
- [ ] PageProps<'/calibration-plans/[uuid]'>로 타입 정의됨
- [ ] params를 await로 추출함
- [ ] searchParams를 await로 추출함 (목록 필터링)
- [ ] useActionState로 승인/반려 처리함
- [ ] 'use client'는 필요한 곳에만 사용됨
- [ ] Server Actions로 데이터 변경 처리됨

#### 기능 구현
- [ ] 장비 선택 및 일정 설정 구현됨
- [ ] 캘린더/간트 뷰 구현됨
- [ ] 드래그앤드롭 일정 조정 구현됨
- [ ] 승인 프로세스 구현됨
- [ ] 버전 관리 구현됨
- [ ] PDF 출력 구현됨

#### 성능 최적화
- [ ] 간트/캘린더 컴포넌트 동적 import 적용됨
- [ ] 다중 데이터 Promise.all로 병렬 로딩됨
- [ ] 장비 목록 컴포넌트 메모이제이션 적용됨
- [ ] 클라이언트 전달 데이터 최소화됨

#### 디자인
- [ ] UL Solutions 브랜드 색상 적용됨
- [ ] 상태별 배지 색상 구현됨
- [ ] 간트 차트 스타일 적용됨
- [ ] 승인 타임라인 UI 구현됨

#### 접근성 (WCAG 2.1 AA)
- [ ] 캘린더/간트 뷰에 role="application" 적용됨
- [ ] 드래그앤드롭 키보드 대체 조작 구현됨
- [ ] 승인 상태 변경 aria-live로 알림됨
- [ ] 테이블에 role="grid", scope="col" 적용됨
- [ ] 버튼에 aria-label, aria-busy 적용됨
- [ ] 버전 이력 키보드 네비게이션 구현됨

#### 테스트
- [ ] Playwright 테스트 작성됨 (calibration-plans.spec.ts)
- [ ] 접근성 테스트 작성됨
- [ ] 에러 핸들링 테스트 작성됨
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
      await techManagerPage.fill('[name="title"]', '2026년 교정계획서');
      await techManagerPage.selectOption('[name="year"]', '2026');

      // 장비 선택
      await techManagerPage.click('[data-testid="add-equipment"]');
      await techManagerPage.click('[data-testid="equipment-checkbox-1"]');
      await techManagerPage.click('[data-testid="confirm-selection"]');

      // 일정 설정
      await techManagerPage.fill('[data-testid="schedule-date-1"]', '2026-03-15');

      await techManagerPage.click('[data-testid="submit-plan"]');
      await expect(techManagerPage.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('필수 필드 검증', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/create');
      await techManagerPage.click('[data-testid="submit-plan"]');

      // 에러 메시지 확인
      await expect(techManagerPage.getByText('제목을 입력하세요')).toBeVisible();
      await expect(techManagerPage.getByText('장비를 선택하세요')).toBeVisible();
    });
  });

  test.describe('승인 프로세스', () => {
    test('승인 요청 및 승인', async ({ techManagerPage, siteAdminPage }) => {
      // 기술책임자: 승인 요청
      await techManagerPage.goto('/calibration-plans/1');
      await techManagerPage.click('[data-testid="request-approval"]');
      await expect(techManagerPage.locator('[data-testid="status-pending"]')).toBeVisible();

      // 시험소 관리자: 승인
      await siteAdminPage.goto('/calibration-plans');
      await siteAdminPage.click('[data-testid="pending-plan-1"]');
      await siteAdminPage.click('[data-testid="approve-button"]');

      // 승인 확인 (aria-live로 알림됨)
      await expect(siteAdminPage.getByRole('status')).toContainText('승인되었습니다');
      await expect(siteAdminPage.locator('[data-testid="status-approved"]')).toBeVisible();
    });

    test('반려 사유 입력', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/calibration-plans/1');
      await siteAdminPage.click('[data-testid="reject-button"]');

      // 반려 사유 입력 모달
      await expect(siteAdminPage.getByRole('dialog')).toBeVisible();
      await siteAdminPage.fill('[name="rejectReason"]', '일정 조정 필요');
      await siteAdminPage.click('[data-testid="confirm-reject"]');

      await expect(siteAdminPage.locator('[data-testid="status-rejected"]')).toBeVisible();
    });
  });

  test.describe('캘린더/간트 뷰', () => {
    test('간트 차트 표시', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1');
      await techManagerPage.click('[data-testid="view-gantt"]');

      const gantt = techManagerPage.locator('[data-testid="gantt-view"]');
      await expect(gantt).toBeVisible();
    });

    test('드래그앤드롭 일정 조정', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1/edit');

      const scheduleItem = techManagerPage.locator('[data-testid="schedule-item-1"]');
      const targetDate = techManagerPage.locator('[data-testid="calendar-date-2026-03-20"]');

      await scheduleItem.dragTo(targetDate);

      // 일정 변경 확인
      await expect(scheduleItem).toContainText('2026-03-20');
    });

    test('키보드로 일정 조정 (접근성)', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1/edit');

      const scheduleItem = techManagerPage.locator('[data-testid="schedule-item-1"]');
      await scheduleItem.focus();

      // Space로 드래그 시작
      await techManagerPage.keyboard.press('Space');
      await expect(scheduleItem).toHaveAttribute('aria-grabbed', 'true');

      // 화살표로 이동
      await techManagerPage.keyboard.press('ArrowRight');
      await techManagerPage.keyboard.press('Enter');

      // 일정 변경 확인
      await expect(scheduleItem).toHaveAttribute('aria-grabbed', 'false');
    });
  });

  test.describe('PDF 출력', () => {
    test('PDF 다운로드', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1');

      const downloadPromise = techManagerPage.waitForEvent('download');
      await techManagerPage.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/calibration-plan.*\.pdf$/);
    });
  });

  test.describe('버전 관리', () => {
    test('버전 이력 조회', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1/versions');

      const versions = techManagerPage.locator('[data-testid="version-item"]');
      await expect(versions).toHaveCount(3); // 예: 3개 버전
    });

    test('특정 버전 비교', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1/versions');

      await techManagerPage.click('[data-testid="compare-versions"]');
      await expect(techManagerPage.getByTestId('version-diff')).toBeVisible();
    });
  });

  test.describe('접근성', () => {
    test('캘린더 키보드 네비게이션', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/1');
      await techManagerPage.click('[data-testid="view-calendar"]');

      const calendar = techManagerPage.locator('[role="application"]');
      await expect(calendar).toHaveAttribute('aria-label', '교정 일정 캘린더');

      // 키보드로 날짜 이동
      await calendar.focus();
      await techManagerPage.keyboard.press('ArrowRight');
      await techManagerPage.keyboard.press('Enter');
    });

    test('승인 버튼 접근성', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/calibration-plans/1');

      const approveButton = siteAdminPage.getByRole('button', { name: /승인/ });
      await expect(approveButton).toHaveAttribute('aria-label');

      // 버튼 클릭 후 로딩 상태
      await approveButton.click();
      await expect(approveButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  test.describe('권한 테스트', () => {
    test('시험실무자는 계획서 조회만 가능', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/calibration-plans/1');

      // 승인 버튼 없음
      await expect(testOperatorPage.getByRole('button', { name: '승인' })).not.toBeVisible();
      await expect(testOperatorPage.getByRole('button', { name: '반려' })).not.toBeVisible();
    });

    test('기술책임자는 작성 및 승인요청 가능', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/create');
      await expect(techManagerPage.getByRole('heading', { name: '교정계획서 작성' })).toBeVisible();
    });

    test('시험소 관리자는 승인/반려 가능', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/calibration-plans/1');

      await expect(siteAdminPage.getByRole('button', { name: '승인' })).toBeVisible();
      await expect(siteAdminPage.getByRole('button', { name: '반려' })).toBeVisible();
    });
  });

  test.describe('에러 핸들링', () => {
    test('존재하지 않는 계획서', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/999999');

      await expect(techManagerPage.getByRole('alert')).toBeVisible();
      await expect(techManagerPage.getByText(/찾을 수 없습니다/)).toBeVisible();
    });

    test('승인완료 후 수정 시도', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans/approved-plan/edit');

      await expect(techManagerPage.getByRole('alert')).toBeVisible();
      await expect(techManagerPage.getByText(/수정할 수 없습니다/)).toBeVisible();
    });
  });
});
```
