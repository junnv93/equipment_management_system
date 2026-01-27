# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-3: 승인 관리 통합 페이지

### 목적

모든 승인 항목을 한 곳에서 관리할 수 있는 통합 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

⚠️ E2E 테스트 작성 시 /docs/development/E2E_TEST_AUTH_GUIDE.md를 반드시 참조하세요!

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 승인 관리 통합 페이지를 구현해줘.

역할 참고:
- technical_manager: 팀 내 장비/교정/대여 승인
- lab_manager: 시험소 전체 장비/교정/대여/반출/교정계획서 승인
- system_admin: 모든 승인 권한

요구사항:
1. 탭 기반 카테고리 분리
   - 장비 승인 (등록/수정/삭제)
   - 교정 승인
   - 대여 승인 (시험소 내)
   - 반출 승인 (시험소 외부)
   - 보정계수 승인
   - 소프트웨어 승인
   - 교정계획서 승인 (lab_manager 이상)
   - 각 탭에 대기 개수 뱃지 표시

2. 역할별 자동 필터링
   - 기술책임자: 자신의 팀 관련 항목만
   - 시험소 관리자: 해당 시험소 전체
   - 시스템 관리자: 모든 항목

3. 승인 목록 UI
   - 요청자, 요청일시, 요청 내용 요약
   - 상세 보기 버튼 (모달 또는 확장)
   - 승인/반려 버튼

4. 일괄 처리 기능
   - 체크박스로 다중 선택
   - 일괄 승인 버튼
   - 일괄 반려 시 공통 사유 입력

5. 반려 모달
   - 반려 사유 입력 (필수, 최소 10자)
   - 사유 템플릿 선택 옵션
   - 확인/취소 버튼

6. 상세 보기 모달/패널
   - 요청 상세 정보
   - 변경 전/후 비교 (수정 요청 시)
   - 첨부 파일 미리보기/다운로드

파일:
- apps/frontend/app/admin/approvals/page.tsx (통합 승인 페이지 - Server Component)
- apps/frontend/app/admin/approvals/loading.tsx (로딩 상태)
- apps/frontend/app/admin/approvals/error.tsx (에러 핸들러 - 'use client')
- apps/frontend/app/admin/approvals/layout.tsx
- apps/frontend/components/approvals/ApprovalTabs.tsx ('use client' - 탭 상호작용)
- apps/frontend/components/approvals/ApprovalList.tsx ('use client' - 필터/정렬)
- apps/frontend/components/approvals/ApprovalItem.tsx
- apps/frontend/components/approvals/ApprovalDetailModal.tsx ('use client')
- apps/frontend/components/approvals/RejectModal.tsx ('use client')
- apps/frontend/components/approvals/BulkActionBar.tsx ('use client')
- apps/frontend/lib/api/approvals-api.ts (Client API)
- apps/frontend/lib/api/server/approvals-api-server.ts (Server API)

Next.js 16 패턴 요구사항 (/nextjs-16 스킬 활용):
- page.tsx는 Server Component로 초기 데이터 fetch
- 탭/필터/모달 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)
- 탭 상태는 URL 쿼리 파라미터로 관리 (?tab=equipment)

성능 최적화 요구사항 (/vercel-react-best-practices 스킬 활용):
- Server Component에서 초기 승인 목록 데이터 fetch
- 상세 보기 모달은 dynamic import로 지연 로딩
- 반려 모달은 dynamic import로 지연 로딩
- 승인/반려 시 Optimistic UI 업데이트 적용
- 목록이 많을 경우 페이지네이션 또는 무한 스크롤
- 아이콘 개별 import (lucide-react tree-shaking)
- 탭 전환 시 해당 탭 데이터만 fetch (불필요한 데이터 로드 방지)

접근성 요구사항 (/web-design-guidelines 스킬 활용):
- 탭: role="tablist", aria-selected, 키보드 좌/우 화살표 탐색
- 뱃지 개수: aria-label="대기 N건"으로 스크린리더에 알림
- 승인/반려 버튼: aria-describedby로 대상 항목 연결
- 모달: role="dialog", aria-modal="true", 포커스 트랩
- 일괄 선택: 전체 선택 체크박스에 aria-label 제공
- 토스트 알림: role="alert" aria-live="polite" 적용
- 폼 에러 메시지: role="alert" aria-live="assertive" 적용
- 키보드 탐색: Tab 순서 논리적 구성, Escape로 모달 닫기
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 색상 대비: 승인/반려 버튼 색상 외 아이콘도 함께 사용

디자인 요구사항 (/frontend-design 스킬 활용):
- 탭: 아이콘 + 텍스트 + 뱃지, 활성 탭 하단 UL Red 라인
- 상태별 색상 (UL 색상 팔레트):
  - 대기(pending): UL Warning (#FF9D55) - 노란색 뱃지/배경
  - 승인(approved): UL Green (#00A451) - 승인 버튼 색상
  - 반려(rejected): UL Red (#CA0123) - 반려 버튼 색상
- 승인 버튼: UL Green (#00A451) + 체크 아이콘
- 반려 버튼: UL Red (#CA0123) + X 아이콘
- 대기 뱃지: UL Warning (#FF9D55) 배경, 흰색 텍스트
- 모달: 오버레이 + slide-up 애니메이션
- 토스트 알림: 승인(초록), 반려(빨강), 에러(빨강)
- 애니메이션:
  - 탭 전환 시 콘텐츠 fade 트랜지션
  - 목록 아이템 stagger 애니메이션 (순차 등장)
  - 승인/반려 후 아이템 slide-out 제거 효과
  - 일괄 선택 시 체크박스 bounce 효과
  - 모달 열기/닫기 scale + fade 애니메이션
  - 뱃지 개수 변경 시 pulse 효과

에러 처리 요구사항:
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수, reset 함수 제공)
- API 에러 시 ErrorAlert 컴포넌트 표시 (재시도 버튼 포함)
- 승인 실패 시 Optimistic UI 롤백 및 토스트로 에러 표시
- 반려 사유 미입력/부족 시 필드 에러 메시지 표시 (role="alert")
- 401 응답 시 로그인 페이지 리다이렉트
- 403 응답 시 "권한이 없습니다" 메시지 표시
- 일괄 처리 중 일부 실패 시 실패 항목 목록 표시

제약사항:
- 반려 시 사유 필수 (10자 이상)
- Optimistic UI 업데이트
- 승인 실패 시 롤백 및 에러 표시
- 권한 없는 탭은 비활성화 또는 숨김

검증:
- 각 역할별 탭 표시 확인
- 승인/반려 동작 확인
- 일괄 처리 동작 확인
- 반려 사유 필수 검증 확인

Playwright 테스트:
- 탭 전환 시 해당 카테고리 항목 표시 확인
- 승인 버튼 클릭 후 목록에서 제거 확인
- 반려 시 사유 미입력 시 에러 메시지 확인
- 일괄 승인 동작 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 이행 체크리스트 UI-3

**파일 생성:**
- [ ] approvals/page.tsx 구현됨 (Server Component)
- [ ] approvals/loading.tsx 생성됨
- [ ] approvals/error.tsx 생성됨 ('use client')
- [ ] approvals/layout.tsx 생성됨

**컴포넌트 생성:**
- [ ] ApprovalTabs.tsx 생성됨 ('use client')
- [ ] ApprovalList.tsx 생성됨 ('use client')
- [ ] ApprovalItem.tsx 생성됨
- [ ] ApprovalDetailModal.tsx 생성됨 ('use client')
- [ ] RejectModal.tsx 생성됨 ('use client')
- [ ] BulkActionBar.tsx 생성됨 ('use client')

**API 함수:**
- [ ] approvals-api.ts (Client) 생성됨
- [ ] approvals-api-server.ts (Server) 생성됨

**기능 구현:**
- [ ] 역할별 탭 필터링 구현됨
- [ ] 탭 상태 URL 쿼리 파라미터 관리됨
- [ ] 일괄 승인/반려 구현됨
- [ ] 반려 사유 필수 검증 구현됨 (10자 이상)
- [ ] Optimistic UI 업데이트 구현됨
- [ ] 토스트 알림 구현됨

**디자인 관련:**
- [ ] UL 색상 팔레트 사용됨 (상태별 색상)
- [ ] 탭 활성 상태 UL Red 라인 적용됨
- [ ] 뱃지 개수 pulse 효과 적용됨
- [ ] 모달 scale + fade 애니메이션 적용됨
- [ ] 목록 아이템 stagger 애니메이션 적용됨
- [ ] 승인/반려 후 slide-out 효과 적용됨

**에러 처리 관련:**
- [ ] error.tsx 에러 핸들러 구현됨
- [ ] API 에러 시 ErrorAlert 표시됨
- [ ] 승인 실패 시 Optimistic UI 롤백됨
- [ ] 반려 사유 에러 메시지 표시됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트됨

**성능 최적화 (vercel-react-best-practices):**
- [ ] Server Component에서 초기 데이터 fetch 구현됨
- [ ] 상세 보기 모달 dynamic import 적용됨
- [ ] 반려 모달 dynamic import 적용됨
- [ ] Optimistic UI 업데이트 적용됨
- [ ] 아이콘 개별 import 적용됨

**접근성 (web-design-guidelines):**
- [ ] 탭에 role="tablist", aria-selected 적용됨
- [ ] 뱃지에 aria-label="대기 N건" 적용됨
- [ ] 모달에 role="dialog", aria-modal 적용됨
- [ ] 모달 포커스 트랩 구현됨
- [ ] 토스트에 role="alert" 적용됨
- [ ] 키보드 탐색 가능 확인 (Tab, Escape)
- [ ] 포커스 표시 스타일 적용됨
- [ ] 승인/반려 버튼에 아이콘 추가됨 (색상 외 구분)

**테스트:**
- [ ] Playwright 테스트 작성됨 (approvals.spec.ts)
- [ ] 역할별 탭 표시 테스트 추가됨
- [ ] 일괄 처리 테스트 추가됨
- [ ] 키보드 탐색 테스트 추가됨
- [ ] axe-core 접근성 테스트 추가됨
- [ ] 모든 테스트 통과됨
- [ ] pnpm tsc --noEmit 성공

### Playwright 테스트 예시

```typescript
// tests/e2e/approvals.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Approval Management - Basic', () => {
  test('탭 전환 및 항목 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 장비 탭 확인
    await expect(techManagerPage.getByRole('tab', { name: /장비/ })).toBeVisible();

    // 교정 탭으로 전환
    await techManagerPage.getByRole('tab', { name: /교정/ }).click();
    await expect(techManagerPage.getByTestId('approval-list')).toContainText('교정');

    // URL 쿼리 파라미터 확인
    await expect(techManagerPage).toHaveURL(/tab=calibration/);
  });

  test('승인 처리', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 첫 번째 항목 승인
    const firstItem = techManagerPage.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '승인' }).click();

    // 토스트 메시지 확인
    await expect(techManagerPage.getByRole('alert')).toContainText('승인되었습니다');

    // 항목이 목록에서 제거됨 (Optimistic UI)
    await expect(firstItem).not.toBeVisible();
  });

  test('반려 시 사유 필수', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 반려 버튼 클릭
    const firstItem = techManagerPage.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '반려' }).click();

    // 모달 열림 확인
    const modal = techManagerPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 사유 없이 확인 시도
    await modal.getByRole('button', { name: '확인' }).click();

    // 에러 메시지 확인 (role="alert")
    await expect(modal.getByRole('alert')).toContainText('반려 사유');
  });

  test('일괄 승인', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 전체 선택
    await techManagerPage.getByRole('checkbox', { name: /전체 선택/ }).check();

    // 일괄 승인 버튼 클릭
    await techManagerPage.getByRole('button', { name: '일괄 승인' }).click();

    // 확인 모달
    await techManagerPage.getByRole('button', { name: '확인' }).click();

    // 토스트 메시지 확인
    await expect(techManagerPage.getByRole('alert')).toContainText('승인되었습니다');
  });

  test('역할별 탭 표시 - 기술책임자', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 기술책임자는 교정계획서 탭 미표시
    await expect(techManagerPage.getByRole('tab', { name: /교정계획서/ })).not.toBeVisible();
  });

  test('역할별 탭 표시 - 시험소 관리자', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/admin/approvals');

    // 시험소 관리자는 교정계획서 탭 표시
    await expect(siteAdminPage.getByRole('tab', { name: /교정계획서/ })).toBeVisible();
  });
});

test.describe('Approval Management - Accessibility', () => {
  test('탭 키보드 탐색', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 탭에 포커스
    const tabList = techManagerPage.getByRole('tablist');
    await tabList.getByRole('tab').first().focus();

    // 화살표 키로 탭 탐색
    await techManagerPage.keyboard.press('ArrowRight');

    // 포커스가 다음 탭으로 이동
    const focusedTab = techManagerPage.locator('[role="tab"]:focus');
    await expect(focusedTab).toBeVisible();
  });

  test('모달 포커스 트랩', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 반려 모달 열기
    const firstItem = techManagerPage.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '반려' }).click();

    const modal = techManagerPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Tab 키로 탐색해도 모달 내부에 포커스 유지
    for (let i = 0; i < 10; i++) {
      await techManagerPage.keyboard.press('Tab');
    }
    const focusedElement = techManagerPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
    // 포커스가 모달 내부인지 확인
    await expect(modal.locator(':focus')).toBeVisible();
  });

  test('Escape로 모달 닫기', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 반려 모달 열기
    const firstItem = techManagerPage.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '반려' }).click();

    const modal = techManagerPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Escape로 닫기
    await techManagerPage.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('뱃지에 aria-label 제공', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');

    // 뱃지가 스크린리더에서 읽힐 수 있는지 확인
    const badge = techManagerPage.getByRole('tab', { name: /장비/ }).locator('[aria-label*="대기"]');
    await expect(badge).toBeVisible();
  });

  test('axe-core 접근성 검사', async ({ techManagerPage }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;

    await techManagerPage.goto('/admin/approvals');

    const results = await new AxeBuilder({ page: techManagerPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```
