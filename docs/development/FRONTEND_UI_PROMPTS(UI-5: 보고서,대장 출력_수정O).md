# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-5: 보고서/대장 출력

### 목적

PDF/Excel 출력 기능을 제공합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 보고서/대장 출력 기능을 구현해줘.

요구사항:
1. 교정계획서 PDF 출력
   - 페이지 경로: /reports/calibration-plan/[id]/print
   - 인쇄 최적화 스타일 (A4)
   - 헤더: 로고, 문서번호, 버전, 날짜
   - 내용: 교정 대상 장비 목록, 일정, 담당자
   - 서명란: 작성자, 검토자, 승인자

2. 보정계수 대장 Excel 내보내기
   - 장비별 보정계수 이력
   - 날짜 범위 필터
   - 열: 장비명, 측정항목, 보정계수, 등록일, 등록자
   - xlsx 파일 다운로드

3. 장비 이력카드 PDF 출력
   - 장비 기본 정보
   - 교정 이력
   - 수리 이력
   - 대여/반출 이력
   - QR 코드 (장비 상세 페이지 링크)

4. 인쇄 미리보기
   - 모달 또는 새 탭
   - 실제 인쇄 전 확인
   - 인쇄 버튼

파일:
- apps/frontend/app/reports/calibration-plan/[id]/print/page.tsx
- apps/frontend/app/reports/equipment-history/[id]/print/page.tsx
- apps/frontend/app/reports/calibration-factors/page.tsx (보정계수 대장)
- apps/frontend/app/actions/reports.ts (Server Actions)
- apps/frontend/components/reports/CalibrationPlanPrint.tsx
- apps/frontend/components/reports/EquipmentHistoryPrint.tsx
- apps/frontend/components/reports/CalibrationFactorsTable.tsx
- apps/frontend/components/reports/PrintLayout.tsx (공통 인쇄 레이아웃)
- apps/frontend/components/reports/ExportButton.tsx
- apps/frontend/components/reports/PrintPreviewModal.tsx
- apps/frontend/components/reports/QRCodeGenerator.tsx
- apps/frontend/lib/utils/export-utils.ts (Excel 생성)
- apps/frontend/lib/utils/pdf-utils.ts (PDF 생성)

Next.js 16 패턴 (필수):
1. PageProps 패턴 (동적 라우트)
   ```typescript
   // apps/frontend/app/reports/calibration-plan/[id]/print/page.tsx
   import { PageProps } from 'next';

   export default async function CalibrationPlanPrintPage(
     props: PageProps<'/reports/calibration-plan/[id]/print'>
   ) {
     const { id } = await props.params;  // ✅ params는 Promise
     const planData = await getCalibrationPlan(id);
     return <CalibrationPlanPrint data={planData} />;
   }
   ```

2. searchParams 패턴 (필터링)
   ```typescript
   // apps/frontend/app/reports/calibration-factors/page.tsx
   export default async function CalibrationFactorsReportPage(props: {
     searchParams: Promise<{ startDate?: string; endDate?: string; equipmentId?: string }>;
   }) {
     const { startDate, endDate, equipmentId } = await props.searchParams;  // ✅ searchParams도 Promise
     const factors = await getCalibrationFactors({ startDate, endDate, equipmentId });
     return <CalibrationFactorsTable data={factors} />;
   }
   ```

3. useActionState 패턴 (내보내기 액션)
   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { exportToExcel } from '@/app/actions/reports';

   export function ExportButton({ filters }: { filters: ExportFilters }) {
     const [state, action, isPending] = useActionState(
       async (prevState: ExportState, formData: FormData) => {
         return await exportToExcel(formData);
       },
       { error: null, downloadUrl: null }
     );

     return (
       <form action={action}>
         <input type="hidden" name="filters" value={JSON.stringify(filters)} />
         <Button type="submit" disabled={isPending}>
           {isPending ? '생성 중...' : 'Excel 내보내기'}
         </Button>
       </form>
     );
   }
   ```

성능 최적화 (/vercel-react-best-practices 적용):
1. `bundle-dynamic-imports`: PDF/Excel 라이브러리 동적 import
   ```typescript
   const PDFDocument = dynamic(() => import('@react-pdf/renderer'), {
     loading: () => <Skeleton className="h-[800px]" />,
     ssr: false,
   });
   ```
2. `async-parallel`: 다중 데이터 병렬 로딩
   ```typescript
   const [equipment, calibrations, repairs] = await Promise.all([
     getEquipment(id),
     getCalibrations(id),
     getRepairs(id),
   ]);
   ```
3. `server-cache-react`: 보고서 데이터 캐싱
4. `js-cache-function-results`: Excel 생성 결과 캐싱

라이브러리:
- xlsx: Excel 파일 생성
- @react-pdf/renderer 또는 브라우저 print() API

디자인 요구사항 (/frontend-design 스킬 활용):
- UL Solutions 브랜드 색상 적용:
  - 헤더 배경: Midnight Blue (#122C49)
  - 테이블 헤더: #122C49, 텍스트 White (#FFFFFF)
  - 테이블 교대 행: #F5F5F5
  - 강조 텍스트: UL Green (#00A451)
  - 경고/오류: Brand Red (#CA0123)
  - 정보 배지: UL Info (#BCE4F7)
- 인쇄 스타일 (A4 최적화):
  ```css
  @media print {
    @page { size: A4; margin: 20mm; }
    .print-header { position: running(header); }
    .page-break { break-before: page; }
    .no-print { display: none !important; }
  }
  ```
- 표: 테두리 (#D8D9DA), 헤더 배경색 (#122C49)
- 버튼: 다운로드 아이콘 + 파일 형식 표시
  ```typescript
  <Button variant="outline" className="gap-2">
    <FileSpreadsheet className="h-4 w-4" />
    Excel 내보내기
  </Button>
  <Button variant="outline" className="gap-2">
    <FileText className="h-4 w-4" />
    PDF 다운로드
  </Button>
  ```
- 로딩 상태:
  ```typescript
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>생성 중...</span>
    <Progress value={progress} className="w-32" />
  </div>
  ```

접근성 요구사항 (/web-design-guidelines - WCAG 2.1 AA):
1. 버튼 접근성
   ```typescript
   <Button
     onClick={handlePrint}
     disabled={isPending}
     aria-busy={isPending}
     aria-label={isPending ? "PDF 생성 중..." : "PDF 다운로드"}
   >
     <FileText className="h-4 w-4" aria-hidden="true" />
     <span>{isPending ? '생성 중...' : 'PDF 다운로드'}</span>
   </Button>
   ```
2. 다운로드 진행 상태 알림
   ```typescript
   <div role="status" aria-live="polite">
     {isPending && <span className="sr-only">파일 생성 중입니다. 잠시 기다려주세요.</span>}
     {downloadReady && <span className="sr-only">파일이 준비되었습니다. 다운로드가 시작됩니다.</span>}
   </div>
   ```
3. 인쇄 미리보기 모달 접근성
   ```typescript
   <Dialog
     aria-labelledby="print-preview-title"
     aria-describedby="print-preview-description"
   >
     <DialogTitle id="print-preview-title">인쇄 미리보기</DialogTitle>
     <DialogDescription id="print-preview-description">
       문서를 확인하고 인쇄 버튼을 눌러 인쇄하세요.
     </DialogDescription>
   </Dialog>
   ```
4. 테이블 접근성
   ```typescript
   <table role="grid" aria-label="보정계수 대장">
     <thead>
       <tr>
         <th scope="col">장비명</th>
         <th scope="col">측정항목</th>
         <th scope="col">보정계수</th>
       </tr>
     </thead>
   </table>
   ```
5. 키보드 단축키
   - Ctrl+P: 인쇄 미리보기 열기
   - Escape: 모달 닫기
6. 스크린 리더 호환성
   - 다운로드 완료 알림: `aria-live="assertive"`
   - 진행률 표시: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

제약사항:
- PDF는 A4 크기 최적화
- Excel은 5000행 이하 권장
- 대용량 데이터는 서버 사이드 생성 고려

검증:
- PDF 다운로드 및 인쇄 확인
- Excel 파일 생성 및 내용 확인
- 인쇄 미리보기 동작 확인

Playwright 테스트:
- PDF 다운로드 트리거 확인
- Excel 파일 생성 확인 (다운로드 후 파일 검증)
- 인쇄 미리보기 모달 동작 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-5

#### 파일 생성
- [ ] calibration-plan/[id]/print/page.tsx 생성됨
- [ ] equipment-history/[id]/print/page.tsx 생성됨
- [ ] calibration-factors/page.tsx 생성됨
- [ ] app/actions/reports.ts 생성됨
- [ ] CalibrationPlanPrint.tsx 컴포넌트 생성됨
- [ ] EquipmentHistoryPrint.tsx 컴포넌트 생성됨
- [ ] CalibrationFactorsTable.tsx 컴포넌트 생성됨
- [ ] PrintLayout.tsx 공통 레이아웃 생성됨
- [ ] ExportButton.tsx 컴포넌트 생성됨
- [ ] PrintPreviewModal.tsx 컴포넌트 생성됨
- [ ] QRCodeGenerator.tsx 컴포넌트 생성됨
- [ ] export-utils.ts 유틸리티 생성됨
- [ ] pdf-utils.ts 유틸리티 생성됨

#### Next.js 16 패턴
- [ ] PageProps<'/reports/...'>로 타입 정의됨
- [ ] params를 await로 추출함
- [ ] searchParams를 await로 추출함 (필터링 페이지)
- [ ] useActionState로 내보내기 액션 처리함
- [ ] 'use client'는 필요한 곳에만 사용됨
- [ ] Server Actions로 파일 생성 처리됨

#### 기능 구현
- [ ] PDF 인쇄 스타일 구현됨 (A4 최적화)
- [ ] Excel 다운로드 구현됨
- [ ] 날짜 범위 필터 구현됨
- [ ] QR 코드 생성 구현됨
- [ ] 인쇄 미리보기 모달 구현됨
- [ ] 진행률 표시 구현됨

#### 성능 최적화
- [ ] PDF/Excel 라이브러리 동적 import 적용됨
- [ ] 다중 데이터 Promise.all로 병렬 로딩됨
- [ ] 대용량 데이터 페이지네이션 적용됨
- [ ] 파일 생성 결과 캐싱 적용됨

#### 디자인
- [ ] UL Solutions 브랜드 색상 적용됨
- [ ] @media print 스타일 적용됨
- [ ] 페이지 나눔 제어됨
- [ ] 로딩 상태 UI 구현됨
- [ ] 아이콘 + 텍스트 버튼 스타일 적용됨

#### 접근성 (WCAG 2.1 AA)
- [ ] 버튼에 aria-label 적용됨
- [ ] 다운로드 진행 상태 aria-live로 알림됨
- [ ] 모달에 aria-labelledby/describedby 적용됨
- [ ] 테이블에 role="grid", scope="col" 적용됨
- [ ] 키보드 단축키 지원됨 (Ctrl+P, Escape)
- [ ] 스크린 리더 호환성 확인됨

#### 테스트
- [ ] Playwright 테스트 작성됨 (reports.spec.ts)
- [ ] 접근성 테스트 작성됨
- [ ] 에러 핸들링 테스트 작성됨
- [ ] 권한 테스트 작성됨
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/reports.spec.ts
import { test, expect } from './fixtures/auth.fixture';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Reports', () => {
  test.describe('교정계획서 인쇄', () => {
    test('인쇄 미리보기 모달 열기', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/reports/calibration-plan/1');

      // 인쇄 버튼 클릭
      await siteAdminPage.getByRole('button', { name: '인쇄' }).click();

      // 미리보기 모달 표시 확인
      await expect(siteAdminPage.getByTestId('print-preview-modal')).toBeVisible();
    });

    test('미리보기 모달 접근성', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/reports/calibration-plan/1');
      await siteAdminPage.getByRole('button', { name: '인쇄' }).click();

      // 모달 접근성 확인
      const modal = siteAdminPage.getByRole('dialog');
      await expect(modal).toHaveAttribute('aria-labelledby');
      await expect(modal).toHaveAttribute('aria-describedby');

      // Escape로 모달 닫기
      await siteAdminPage.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test('PDF 다운로드 진행 상태 표시', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/reports/calibration-plan/1');

      // 다운로드 버튼 클릭
      const downloadPromise = siteAdminPage.waitForEvent('download');
      await siteAdminPage.getByRole('button', { name: 'PDF 다운로드' }).click();

      // 진행 상태 표시 확인
      await expect(siteAdminPage.getByRole('status')).toBeVisible();
      await expect(siteAdminPage.getByText('생성 중...')).toBeVisible();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/calibration-plan.*\.pdf$/);
    });
  });

  test.describe('보정계수 대장', () => {
    test('Excel 내보내기', async ({ techManagerPage }) => {
      const downloadPromise = techManagerPage.waitForEvent('download');

      await techManagerPage.goto('/reports/calibration-factors');
      await techManagerPage.getByRole('button', { name: 'Excel 내보내기' }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    });

    test('날짜 범위 필터링', async ({ techManagerPage }) => {
      await techManagerPage.goto('/reports/calibration-factors');

      // 날짜 필터 입력
      await techManagerPage.getByLabel('시작일').fill('2024-01-01');
      await techManagerPage.getByLabel('종료일').fill('2024-12-31');
      await techManagerPage.getByRole('button', { name: '필터 적용' }).click();

      // URL에 날짜 파라미터 확인
      await expect(techManagerPage).toHaveURL(/startDate=2024-01-01/);
      await expect(techManagerPage).toHaveURL(/endDate=2024-12-31/);
    });

    test('테이블 접근성', async ({ techManagerPage }) => {
      await techManagerPage.goto('/reports/calibration-factors');

      // 테이블 접근성 확인
      const table = techManagerPage.getByRole('grid', { name: '보정계수 대장' });
      await expect(table).toBeVisible();

      // 헤더 scope 확인
      const headers = table.locator('th');
      for (const header of await headers.all()) {
        await expect(header).toHaveAttribute('scope', 'col');
      }
    });
  });

  test.describe('장비 이력카드', () => {
    test('PDF 다운로드', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment/123');

      const downloadPromise = testOperatorPage.waitForEvent('download');
      await testOperatorPage.getByRole('button', { name: '이력카드 PDF' }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/equipment-history.*\.pdf$/);
    });

    test('QR 코드 포함 확인', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/reports/equipment-history/123/print');

      // QR 코드 이미지 확인
      const qrCode = testOperatorPage.getByTestId('qr-code');
      await expect(qrCode).toBeVisible();
      await expect(qrCode).toHaveAttribute('alt', /장비 상세 페이지 링크/);
    });
  });

  test.describe('에러 핸들링', () => {
    test('존재하지 않는 교정계획서', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/reports/calibration-plan/999999');

      // 404 또는 에러 메시지 표시
      await expect(siteAdminPage.getByRole('alert')).toBeVisible();
      await expect(siteAdminPage.getByText(/찾을 수 없습니다/)).toBeVisible();
    });

    test('파일 생성 실패 시 에러 표시', async ({ techManagerPage }) => {
      // 대용량 데이터로 실패 시뮬레이션
      await techManagerPage.goto('/reports/calibration-factors?limit=100000');
      await techManagerPage.getByRole('button', { name: 'Excel 내보내기' }).click();

      // 에러 메시지 확인
      await expect(techManagerPage.getByRole('alert')).toBeVisible();
    });
  });

  test.describe('권한 테스트', () => {
    test('시험실무자는 자신의 장비 이력카드만 접근', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/reports/equipment-history/123/print');
      await expect(testOperatorPage).not.toHaveURL(/login/);
    });

    test('기술책임자는 보정계수 대장 접근 가능', async ({ techManagerPage }) => {
      await techManagerPage.goto('/reports/calibration-factors');
      await expect(techManagerPage.getByRole('button', { name: 'Excel 내보내기' })).toBeVisible();
    });

    test('시험소 관리자는 교정계획서 인쇄 가능', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/reports/calibration-plan/1');
      await expect(siteAdminPage.getByRole('button', { name: '인쇄' })).toBeVisible();
      await expect(siteAdminPage.getByRole('button', { name: 'PDF 다운로드' })).toBeVisible();
    });
  });

  test.describe('키보드 접근성', () => {
    test('Ctrl+P로 인쇄 미리보기 열기', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/reports/calibration-plan/1');

      // Ctrl+P 단축키
      await siteAdminPage.keyboard.press('Control+p');

      // 미리보기 모달 열림 확인
      await expect(siteAdminPage.getByRole('dialog')).toBeVisible();
    });

    test('Tab으로 버튼 포커스 이동', async ({ techManagerPage }) => {
      await techManagerPage.goto('/reports/calibration-factors');

      // Tab으로 포커스 이동
      await techManagerPage.keyboard.press('Tab');
      await techManagerPage.keyboard.press('Tab');

      // 버튼에 포커스 확인
      const focusedElement = techManagerPage.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
```
