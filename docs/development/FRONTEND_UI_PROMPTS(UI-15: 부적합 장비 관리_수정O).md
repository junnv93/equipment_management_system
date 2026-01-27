# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-15: 부적합 장비 관리

### 목적

부적합 판정된 장비의 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

⚠️ E2E 테스트 작성 시 /docs/development/E2E_TEST_AUTH_GUIDE.md를 반드시 참조하세요!

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 부적합 장비 관리 페이지를 구현해줘.

역할 참고:
- test_engineer (시험실무자): 부적합 등록, 조치 계획 등록
- technical_manager (기술책임자): 조치 완료 검토/승인, 상태 복원
- lab_manager, system_admin: 전체 권한

요구사항:
1. 장비 부적합 등록 페이지
   - 경로: /equipment/[id]/non-conformance
   - 부적합 유형 선택
   - 부적합 사유 상세
   - 발견일, 발견자
   - 첨부파일

2. 조치 계획 등록
   - 조치 내용
   - 조치 예정일
   - 담당자

3. 조치 완료 및 상태 복원
   - 조치 결과 입력
   - 조치 완료일
   - 검토자 확인
   - 장비 상태 복원

4. 부적합 이력
   - 해당 장비의 부적합 이력
   - 조치 내용 타임라인

파일:
- apps/frontend/app/equipment/[id]/non-conformance/page.tsx
- apps/frontend/components/non-conformance/NonConformanceForm.tsx
- apps/frontend/components/non-conformance/ActionPlanForm.tsx
- apps/frontend/components/non-conformance/NonConformanceHistory.tsx
- apps/frontend/lib/api/non-conformance-api.ts

디자인 요구사항 (/frontend-design, /web-design-guidelines 스킬 활용):
- 부적합 경고 색상: UL Red (#CA0123)
- 상태별 색상:
  - open: UL Red (#CA0123) - 미조치
  - analyzing: UL Warning (#FF9D55) - 분석중
  - corrected: UL Info (#BCE4F7) - 조치완료 (검토대기)
  - closed: UL Green (#00A451) - 종결
- 조치 상태 진행 표시기 (Stepper UI)
- 타임라인 UI: 세로 타임라인, 날짜 + 내용 + 담당자
- 부적합 배너: UL Red 배경, 경고 아이콘, pulse 효과
- 애니메이션:
  - 상태 변경 시 배지 색상 트랜지션
  - 타임라인 아이템 stagger 애니메이션 (순차 등장)
  - 진행 표시기 단계 전환 slide 효과
  - 조치 완료 시 success 애니메이션 (체크 아이콘)

제약사항:
- Next.js 16: params는 Promise, await 필수 (아래 예시 참조)
- 부적합 장비는 대여/반출 불가
- 조치 완료 시 검토자(기술책임자 이상) 확인 필수
- 권한별 액션 버튼 표시/숨김 (useAuth 사용)

Next.js 16 params 패턴 (필수):
```typescript
// apps/frontend/app/equipment/[id]/non-conformance/page.tsx
export default async function NonConformancePage(props: {
  params: Promise<{ id: string }>;
}) {
  // ✅ params는 Promise이므로 await 필수
  const { id } = await props.params;

  const equipment = await getEquipment(id);
  const nonConformances = await getNonConformances(id);

  return <NonConformanceClient equipment={equipment} nonConformances={nonConformances} />;
}
```

성능 최적화 (Vercel Best Practices):
- 타임라인 목록에 가상화 또는 content-visibility 적용 검토
- 폼 컴포넌트는 next/dynamic으로 동적 import
- 첨부파일 업로드 시 이미지 미리보기는 next/image 사용
- barrel import 피하기 (직접 import 권장)

에러 처리:
- API 에러 시 ErrorAlert 컴포넌트 표시
- 폼 제출 실패 시 필드별 에러 메시지 표시
- 401 응답 시 로그인 페이지 리다이렉트
- 403 응답 시 "권한이 없습니다" 메시지 표시

검증:
- 부적합 등록 → 조치 → 복원 플로우
- 장비 상태 변경 확인
- pnpm tsc --noEmit

Playwright 테스트:
- 전체 부적합 관리 플로우

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

#### 비즈니스 규칙

- 부적합 장비는 빨간색 경고 표시로 시각적 구분
- 부적합 상태의 장비는 대여 및 반출 신청 불가
- 조치 완료 시 반드시 검토자(기술책임자 이상) 확인 필요
- 장비 상태 복원은 조치 완료 승인 후 자동 처리

#### 접근성 요구사항 (WCAG 2.1 AA)

**필수 ARIA 속성**:

```typescript
// 진행 표시기 (Stepper)
<ol role="list" aria-label="부적합 처리 진행 상태">
  <li aria-current={currentStep === 'open' ? 'step' : undefined}>
    <span aria-label="현재 단계: 미조치">미조치</span>
  </li>
  {/* ... */}
</ol>

// 타임라인
<div role="feed" aria-label="부적합 처리 이력">
  <article role="article" aria-labelledby="timeline-item-1">
    <time dateTime="2026-01-20">2026-01-20</time>
    <p id="timeline-item-1">부적합 등록</p>
  </article>
</div>

// 경고 배너
<div role="alert" aria-live="assertive">
  <AlertTriangle aria-hidden="true" />
  <span>이 장비는 부적합 상태입니다</span>
</div>

// 폼 에러
<form aria-describedby="form-error">
  {error && <div id="form-error" role="alert">{error}</div>}
</form>
```

**키보드 접근성 체크리스트**:

- [ ] Tab 키로 모든 인터랙티브 요소에 접근 가능한가?
- [ ] Enter/Space로 버튼 활성화 가능한가?
- [ ] 폼 필드 간 Tab 순서가 논리적인가?
- [ ] 포커스 표시가 명확히 보이는가?

**시각적 접근성 체크리스트**:

- [ ] 상태별 색상이 WCAG 2.1 AA 대비 비율(4.5:1) 충족하는가?
- [ ] 색상만으로 상태를 구분하지 않고 텍스트/아이콘도 함께 사용하는가?
- [ ] 비활성화된 버튼에 툴팁으로 이유 표시되는가?

### 이행 체크리스트 UI-15

#### 컴포넌트 구현

- [ ] equipment/[id]/non-conformance/page.tsx 구현됨 (Next.js 16 params Promise 패턴)
- [ ] NonConformanceClient.tsx 컴포넌트 생성됨
- [ ] NonConformanceForm.tsx 컴포넌트 생성됨
- [ ] ActionPlanForm.tsx 컴포넌트 생성됨
- [ ] NonConformanceHistory.tsx 컴포넌트 생성됨 (타임라인 UI)
- [ ] NonConformanceStepper.tsx 진행 표시기 생성됨
- [ ] non-conformance-api.ts API 함수 생성됨

#### 기능 구현

- [ ] 부적합 등록 → 조치 → 복원 전체 플로우 구현됨
- [ ] 권한별 액션 버튼 분기 구현됨 (useAuth의 hasRole 사용)
- [ ] 장비 상태 복원 구현됨
- [ ] 첨부파일 업로드 구현됨

#### 디자인 관련

- [ ] UL 색상 팔레트 사용됨 (상태별 색상)
- [ ] 조치 상태 진행 표시기 구현됨 (Stepper UI)
- [ ] 타임라인 UI 구현됨
- [ ] 부적합 경고 배너 pulse 효과 적용됨

#### 에러 처리 관련

- [ ] API 에러 시 ErrorAlert 표시됨
- [ ] 폼 제출 실패 시 필드별 에러 메시지 표시됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트됨

#### 접근성 관련

- [ ] 진행 표시기에 ARIA 속성 추가됨 (role="list", aria-current)
- [ ] 타임라인에 role="feed" 추가됨
- [ ] 경고 배너에 role="alert" 추가됨
- [ ] 폼 에러에 aria-describedby 연결됨
- [ ] 포커스 표시 명확함 (outline/ring)
- [ ] 상태별 색상 대비 비율 4.5:1 충족
- [ ] 색상 외 텍스트/아이콘으로 상태 구분

#### 성능 최적화 관련

- [ ] params Promise 패턴 적용됨
- [ ] 타임라인 가상화/content-visibility 검토됨
- [ ] 폼 컴포넌트 동적 import 적용됨

#### 테스트

- [ ] Playwright 테스트 작성됨 (non-conformance.spec.ts)
- [ ] 전체 플로우 테스트 통과됨
- [ ] 권한별 버튼 표시 테스트 통과됨
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/non-conformance.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('부적합 장비 관리', () => {
  test('부적합 등록부터 복원까지 전체 플로우', async ({ testOperatorPage, techManagerPage }) => {
    // 시험실무자: 부적합 등록
    await testOperatorPage.goto('/equipment/1/non-conformance');
    await testOperatorPage.click('[data-testid="register-non-conformance"]');

    await testOperatorPage.selectOption('[name="ncType"]', 'calibration_failure');
    await testOperatorPage.fill('[name="description"]', '교정 결과 허용 범위 초과');
    await testOperatorPage.fill('[name="discoveredDate"]', '2026-01-20');
    await testOperatorPage.click('[data-testid="submit-nc"]');

    await expect(testOperatorPage.locator('[data-testid="nc-registered"]')).toBeVisible();

    // 장비 상태가 부적합으로 변경됨
    await testOperatorPage.goto('/equipment/1');
    await expect(testOperatorPage.locator('[data-testid="status-non-conforming"]')).toBeVisible();
    await expect(testOperatorPage.locator('[data-testid="status-badge"]')).toHaveClass(/bg-red/);
  });

  test('조치 계획 등록', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/non-conformance');
    await testOperatorPage.click('[data-testid="active-nc-1"]');
    await testOperatorPage.click('[data-testid="add-action-plan"]');

    await testOperatorPage.fill('[name="actionDescription"]', '외부 수리 의뢰');
    await testOperatorPage.fill('[name="plannedDate"]', '2026-02-01');
    await testOperatorPage.selectOption('[name="assignee"]', 'user-1');
    await testOperatorPage.click('[data-testid="submit-action-plan"]');

    await expect(testOperatorPage.locator('[data-testid="action-plan-added"]')).toBeVisible();
  });

  test('조치 완료 및 검토자 확인', async ({ testOperatorPage, techManagerPage }) => {
    // 시험실무자: 조치 완료 등록
    await testOperatorPage.goto('/equipment/1/non-conformance');
    await testOperatorPage.click('[data-testid="active-nc-1"]');
    await testOperatorPage.click('[data-testid="complete-action"]');

    await testOperatorPage.fill('[name="actionResult"]', '수리 완료, 정상 작동 확인');
    await testOperatorPage.fill('[name="completedDate"]', '2026-02-05');
    await testOperatorPage.click('[data-testid="submit-completion"]');

    await expect(testOperatorPage.locator('[data-testid="awaiting-review"]')).toBeVisible();

    // 기술책임자: 검토 및 승인
    await techManagerPage.goto('/equipment/1/non-conformance');
    await techManagerPage.click('[data-testid="pending-review-1"]');
    await techManagerPage.click('[data-testid="approve-completion"]');

    await expect(techManagerPage.locator('[data-testid="nc-resolved"]')).toBeVisible();

    // 장비 상태가 정상으로 복원됨
    await techManagerPage.goto('/equipment/1');
    await expect(techManagerPage.locator('[data-testid="status-normal"]')).toBeVisible();
  });

  test('부적합 장비 대여/반출 불가', async ({ testOperatorPage }) => {
    // 부적합 상태의 장비
    await testOperatorPage.goto('/equipment/1');
    await expect(testOperatorPage.locator('[data-testid="status-non-conforming"]')).toBeVisible();

    // 대여 버튼 비활성화
    await expect(testOperatorPage.locator('[data-testid="rental-button"]')).toBeDisabled();

    // 반출 버튼 비활성화
    await expect(testOperatorPage.locator('[data-testid="checkout-button"]')).toBeDisabled();

    // 툴팁으로 이유 표시
    await testOperatorPage.hover('[data-testid="rental-button"]');
    await expect(testOperatorPage.locator('[data-testid="disabled-tooltip"]')).toContainText('부적합');
  });

  test('부적합 이력 타임라인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/non-conformance');

    // 타임라인 표시 확인
    const timeline = testOperatorPage.locator('[data-testid="nc-timeline"]');
    await expect(timeline).toBeVisible();

    // 이력 항목들
    await expect(timeline.locator('[data-testid="timeline-item"]')).toHaveCount(3);

    // 최신 항목이 상단에
    const firstItem = timeline.locator('[data-testid="timeline-item"]').first();
    await expect(firstItem).toContainText('조치 완료');
  });

  test('첨부파일 업로드', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/1/non-conformance');
    await testOperatorPage.click('[data-testid="register-non-conformance"]');

    // 파일 업로드
    const fileInput = testOperatorPage.locator('[data-testid="file-upload"]');
    await fileInput.setInputFiles({
      name: 'evidence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content')
    });

    await expect(testOperatorPage.locator('[data-testid="uploaded-file"]')).toContainText('evidence.pdf');
  });
});
```
