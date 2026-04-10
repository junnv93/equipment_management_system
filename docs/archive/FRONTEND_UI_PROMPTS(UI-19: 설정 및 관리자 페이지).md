# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-19: 설정 및 관리자 페이지

### 목적

시스템 설정 및 관리자 기능 페이지를 구현합니다.

### 프롬프트

````
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 설정 및 관리자 페이지를 구현해줘.

요구사항:
1. 알림 설정 페이지
   - 경로: /settings/notifications
   - 알림 수신 설정 (이메일, 푸시)
   - 알림 유형별 on/off
   - 알림 빈도 설정

2. 감사 로그 페이지
   - 경로: /admin/audit-logs
   - 시스템 활동 로그 목록
   - 필터: 사용자, 액션 유형, 기간
   - 상세 보기

3. 시스템 설정 (system_admin)
   - 기본 설정 (교정 주기 기본값 등)
   - 알림 설정 (전역)

파일:
- apps/frontend/app/settings/notifications/page.tsx
- apps/frontend/app/settings/layout.tsx (설정 사이드바)
- apps/frontend/app/admin/audit-logs/page.tsx
- apps/frontend/app/admin/audit-logs/[id]/page.tsx (상세)
- apps/frontend/app/admin/system/page.tsx (시스템 설정)
- apps/frontend/components/settings/NotificationSettings.tsx
- apps/frontend/components/settings/SettingsSidebar.tsx
- apps/frontend/components/admin/AuditLogList.tsx
- apps/frontend/components/admin/AuditLogDetail.tsx
- apps/frontend/components/admin/SystemSettings.tsx
- apps/frontend/lib/api/settings-api.ts
- apps/frontend/lib/api/audit-api.ts
- apps/frontend/app/actions/settings.ts (Server Actions)

Next.js 16 필수 패턴:
1. searchParams Promise 패턴 (감사 로그 필터):
   ```typescript
   // apps/frontend/app/admin/audit-logs/page.tsx
   export default async function AuditLogsPage(props: {
     searchParams: Promise<{
       user?: string;
       action?: string;
       startDate?: string;
       endDate?: string;
       page?: string;
     }>;
   }) {
     const searchParams = await props.searchParams;
     const filters = {
       user: searchParams.user,
       action: searchParams.action,
       startDate: searchParams.startDate,
       endDate: searchParams.endDate,
       page: searchParams.page ?? '1',
     };

     return <AuditLogListClient initialFilters={filters} />;
   }
````

2. 동적 라우트 (로그 상세):

   ```typescript
   // apps/frontend/app/admin/audit-logs/[id]/page.tsx
   import { PageProps } from 'next';

   export default async function AuditLogDetailPage(
     props: PageProps<'/admin/audit-logs/[id]'>
   ) {
     const { id } = await props.params;  // ✅ params는 Promise
     const log = await getAuditLog(id);
     return <AuditLogDetailClient log={log} />;
   }
   ```

3. useActionState 설정 저장:

   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { updateNotificationSettings } from '@/app/actions/settings';

   export function NotificationSettings() {
     const [state, formAction, isPending] = useActionState(
       updateNotificationSettings,
       { success: false, error: null }
     );

     return (
       <form action={formAction}>
         {state.success && <Toast message="설정이 저장되었습니다" />}
         {state.error && <ErrorAlert error={state.error} />}
         {/* 설정 폼 */}
       </form>
     );
   }
   ```

성능 최적화 요구사항 (/vercel-react-best-practices):

1. **bundle-dynamic-imports**: diff 뷰어 동적 로딩

   ```typescript
   const DiffViewer = dynamic(() => import('./DiffViewer'), {
     loading: () => <Skeleton className="h-40" />,
     ssr: false  // diff 라이브러리는 클라이언트에서만
   });
   ```

2. **rerender-memo**: 감사 로그 아이템 메모이제이션

   ```typescript
   const MemoizedAuditLogItem = memo(AuditLogItem, (prev, next) => {
     return prev.log.id === next.log.id;
   });
   ```

3. **async-parallel**: 설정 페이지 데이터 병렬 로딩

   ```typescript
   const [userSettings, notificationTypes, systemDefaults] = await Promise.all([
     getUserSettings(),
     getNotificationTypes(),
     getSystemDefaults(),
   ]);
   ```

4. **server-serialization**: 감사 로그 목록 최소화
   ```typescript
   // 상세 데이터는 상세 페이지에서만 로드
   const logs = await getAuditLogs({ fields: ['id', 'action', 'user', 'createdAt'] });
   ```

디자인 요구사항 (/frontend-design 스킬 활용):

- 설정 레이아웃:
  - 왼쪽 사이드바: 설정 카테고리 메뉴
  - 현재 선택된 메뉴: UL Midnight Blue (#122C49) 배경
  - 메뉴 호버: #F5F5F5 배경
- 토글 스위치 UI:
  - 활성화: UL Green (#00A451) 배경
  - 비활성화: UL Gray (#EBEBEB) 배경
  - 전환 애니메이션: 150ms
  - 크기: 44px × 24px (터치 친화적)
- 감사 로그 타임라인:
  - 왼쪽 세로선: UL Gray 1 (#D8D9DA)
  - 액션별 아이콘 색상:
    - CREATE: UL Green (#00A451)
    - UPDATE: UL Info (#BCE4F7)
    - DELETE: Brand Red (#CA0123)
    - LOGIN: UL Fog (#577E9E)
  - 날짜 구분선: #EBEBEB 배경
- Diff 뷰어:
  - 추가된 줄: #00A451/10 배경
  - 삭제된 줄: #CA0123/10 배경
  - 변경된 값 강조: 노란색 하이라이트

접근성 요구사항 (/web-design-guidelines):

- 토글 스위치에 role="switch" + aria-checked 추가
- 설정 그룹에 role="group" + aria-labelledby 추가
- 토글 변경 시 aria-live 영역에 상태 알림
- 감사 로그 목록에 role="feed" 또는 role="log" 추가
- 로그 아이템에 aria-label="[사용자]가 [날짜]에 [액션] 수행" 추가
- 필터 변경 시 결과 영역에 aria-live="polite" 적용
- 모든 입력 필드에 명시적 label 연결
- Tab 키로 토글 간 이동 가능

제약사항:

- 감사 로그는 읽기 전용 (수정/삭제 불가)
- 관리자 권한 필수 (/admin/\* 경로)
- 설정 변경 시 자동 저장 + 토스트 알림
- 시스템 설정 변경 시 확인 모달 필수

검증:

- 설정 저장 테스트
- 감사 로그 조회 테스트
- pnpm tsc --noEmit

Playwright 테스트:

- 알림 설정 변경
- 감사 로그 조회

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.

````

### 필수 가이드라인

#### 1. 설정/관리자 관련 API 엔드포인트

```typescript
// 사용자 알림 설정 조회
GET /api/settings/notifications

// 사용자 알림 설정 업데이트
PATCH /api/settings/notifications

// 시스템 설정 조회 (관리자)
GET /api/admin/settings

// 시스템 설정 업데이트 (관리자)
PATCH /api/admin/settings

// 감사 로그 목록 조회 (관리자)
GET /api/admin/audit-logs?user={userId}&action={action}&startDate={date}&endDate={date}&page={page}

// 감사 로그 상세 조회 (관리자)
GET /api/admin/audit-logs/:id
````

---

#### 2. 알림 설정 유형

```typescript
// UL Solutions 브랜드 색상 적용
const NOTIFICATION_SETTING_CONFIG = {
  calibration_due: {
    label: '교정 만료 알림',
    description: '교정 기한 30일/7일 전 알림',
    icon: Calendar,
    color: 'text-[#BCE4F7]',
  },
  approval_requested: {
    label: '승인 요청 알림',
    description: '새로운 승인 요청 발생 시 알림',
    icon: Clock,
    color: 'text-[#FF9D55]',
  },
  approval_completed: {
    label: '승인 결과 알림',
    description: '승인/반려 결과 알림',
    icon: CheckCircle,
    color: 'text-[#00A451]',
  },
  equipment_status: {
    label: '장비 상태 변경 알림',
    description: '담당 장비 상태 변경 시 알림',
    icon: Settings,
    color: 'text-[#577E9E]',
  },
  system: {
    label: '시스템 알림',
    description: '시스템 공지 및 업데이트 알림',
    icon: Bell,
    color: 'text-[#122C49]',
  },
};
```

---

#### 3. 감사 로그 액션 유형

```typescript
const AUDIT_ACTION_CONFIG = {
  CREATE: {
    label: '생성',
    color: 'bg-[#00A451]/10 text-[#00A451] border-[#00A451]/20',
    icon: Plus,
  },
  UPDATE: {
    label: '수정',
    color: 'bg-[#BCE4F7]/20 text-[#122C49] border-[#BCE4F7]',
    icon: Edit,
  },
  DELETE: {
    label: '삭제',
    color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]/20',
    icon: Trash,
  },
  APPROVE: {
    label: '승인',
    color: 'bg-[#00A451]/10 text-[#00A451] border-[#00A451]/20',
    icon: Check,
  },
  REJECT: {
    label: '반려',
    color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]/20',
    icon: X,
  },
  LOGIN: {
    label: '로그인',
    color: 'bg-[#577E9E]/10 text-[#577E9E] border-[#577E9E]/20',
    icon: LogIn,
  },
  LOGOUT: {
    label: '로그아웃',
    color: 'bg-[#577E9E]/10 text-[#577E9E] border-[#577E9E]/20',
    icon: LogOut,
  },
};
```

---

#### 4. 토글 스위치 접근성 패턴

```typescript
// 접근 가능한 토글 스위치 구현
function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <label id={`${id}-label`}>{label}</label>
      <button
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-description`}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-[#00A451]' : 'bg-[#EBEBEB]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
      <p id={`${id}-description`} className="text-sm text-[#577E9E]">
        {description}
      </p>
    </div>
  );
}
```

---

#### 5. 핵심 규칙

- 알림 설정은 변경 즉시 자동 저장 (토스트 알림 표시)
- 감사 로그 필터는 URL 쿼리 파라미터와 동기화
- 로그 상세에서 변경 전/후 diff 표시 (가능한 경우)
- 시스템 설정 변경 시 확인 모달 필수
- 관리자 페이지 접근 시 권한 검증 필수

---

### 이행 체크리스트 UI-19

#### 컴포넌트 구현

- [ ] settings/notifications/page.tsx 구현됨
- [ ] settings/layout.tsx 구현됨 (사이드바)
- [ ] admin/audit-logs/page.tsx 구현됨
- [ ] admin/audit-logs/[id]/page.tsx 구현됨
- [ ] admin/system/page.tsx 구현됨
- [ ] NotificationSettings.tsx 컴포넌트 생성됨
- [ ] SettingsSidebar.tsx 컴포넌트 생성됨
- [ ] AuditLogList.tsx 컴포넌트 생성됨
- [ ] AuditLogDetail.tsx 컴포넌트 생성됨
- [ ] SystemSettings.tsx 컴포넌트 생성됨
- [ ] settings-api.ts API 함수 생성됨
- [ ] audit-api.ts API 함수 생성됨
- [ ] actions/settings.ts Server Actions 생성됨

#### Next.js 16 패턴

- [ ] searchParams를 await로 처리함 (감사 로그 필터)
- [ ] params를 await로 처리함 (로그 상세)
- [ ] useActionState 사용됨 (설정 저장)
- [ ] Server Actions가 적절히 분리됨

#### 성능 최적화 (Vercel Best Practices)

- [ ] DiffViewer 동적 import 적용됨
- [ ] 감사 로그 아이템 메모이제이션됨
- [ ] 설정 데이터 Promise.all로 병렬 로딩됨
- [ ] 감사 로그 목록 필드 최소화됨

#### 기능 구현

- [ ] 토글 스위치 UI 구현됨 (UL Solutions 브랜드)
- [ ] 알림 설정 자동 저장됨
- [ ] 감사 로그 필터 구현됨 (URL 동기화)
- [ ] 감사 로그 타임라인 구현됨
- [ ] Diff 뷰어 구현됨 (변경 전/후)
- [ ] 시스템 설정 확인 모달 구현됨
- [ ] 권한 검증 구현됨 (관리자 페이지)

#### 에러 처리 관련

- [ ] 설정 저장 실패 시 재시도 로직 구현됨
- [ ] ErrorAlert 컴포넌트 연동됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트 확인됨
- [ ] 403 응답 시 권한 없음 페이지 표시됨

#### 로딩/빈 상태 관련

- [ ] 설정 페이지 스켈레톤 로딩 구현됨
- [ ] 감사 로그 목록 스켈레톤 로딩 구현됨
- [ ] 빈 상태 UI 구현됨 (로그 없음)
- [ ] 필터 결과 빈 상태 UI 구현됨

#### form 버튼 관련

- [ ] 확인 모달 내 버튼에 type 속성 명시됨
- [ ] 필터 적용 버튼에 type="button" 적용됨
- [ ] 토글 버튼에 type="button" 적용됨

#### 접근성 관련 (WCAG 2.1 AA)

- [ ] 토글 스위치에 role="switch" + aria-checked 추가됨
- [ ] 설정 그룹에 role="group" + aria-labelledby 추가됨
- [ ] 토글 변경 시 aria-live 영역 업데이트됨
- [ ] 감사 로그 목록에 role="log" 추가됨
- [ ] 로그 아이템에 aria-label 추가됨
- [ ] 필터 변경 시 aria-live 적용됨
- [ ] 모든 입력 필드에 명시적 label 연결됨
- [ ] 포커스 표시 명확함 (outline 스타일 유지)
- [ ] Tab 키 네비게이션 테스트 통과됨

#### 테스트

- [ ] Playwright 테스트 작성됨 (settings.spec.ts)
- [ ] 접근성 테스트 통과됨
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/settings.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Settings - Notification Settings', () => {
  test('알림 설정 토글 변경', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/settings/notifications');

    await expect(testOperatorPage.getByRole('heading', { name: '알림 설정' })).toBeVisible();

    // 토글 스위치 확인 (role="switch")
    const emailToggle = testOperatorPage.getByRole('switch', { name: '이메일 알림' });
    const initialState = await emailToggle.getAttribute('aria-checked');

    await emailToggle.click();

    // 자동 저장 확인
    await expect(testOperatorPage.getByText('설정이 저장되었습니다')).toBeVisible();

    // 상태 변경 확인
    const newState = await emailToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('알림 유형별 설정', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/settings/notifications');

    // 알림 유형 그룹 확인
    await expect(testOperatorPage.getByText('교정 만료 알림')).toBeVisible();
    await expect(testOperatorPage.getByText('승인 요청 알림')).toBeVisible();
    await expect(testOperatorPage.getByText('장비 상태 변경 알림')).toBeVisible();

    // 각 유형별 토글 존재 확인
    const toggles = testOperatorPage.getByRole('switch');
    await expect(toggles).toHaveCount(await toggles.count());
  });

  test('설정 사이드바 네비게이션', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/settings/notifications');

    // 사이드바 메뉴 확인
    const sidebar = testOperatorPage.getByRole('navigation', { name: '설정 메뉴' });
    await expect(sidebar).toBeVisible();

    // 현재 선택된 메뉴 표시 확인
    const currentMenu = sidebar.getByRole('link', { name: '알림 설정' });
    await expect(currentMenu).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Settings - Admin Audit Logs', () => {
  test('감사 로그 조회 (관리자)', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/audit-logs');

    await expect(systemAdminPage.getByRole('heading', { name: '감사 로그' })).toBeVisible();

    // 로그 목록 확인 (role="log")
    const logList = systemAdminPage.getByRole('log');
    await expect(logList).toBeVisible();

    // 로그 아이템 확인
    const logItems = systemAdminPage.getByRole('article');
    await expect(logItems.first()).toBeVisible();
  });

  test('필터 적용 및 URL 동기화', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/audit-logs');

    // 액션 유형 필터
    await systemAdminPage.getByLabel('액션 유형').selectOption('CREATE');
    await expect(systemAdminPage).toHaveURL(/action=CREATE/);

    // 사용자 필터
    await systemAdminPage.getByLabel('사용자').fill('admin');
    await systemAdminPage.getByRole('button', { name: '검색' }).click();
    await expect(systemAdminPage).toHaveURL(/user=admin/);
  });

  test('감사 로그 기간 필터', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/audit-logs');

    // 기간 필터 설정
    await systemAdminPage.getByLabel('시작일').fill('2026-01-01');
    await systemAdminPage.getByLabel('종료일').fill('2026-12-31');
    await systemAdminPage.getByRole('button', { name: '검색' }).click();

    // URL 파라미터 확인
    await expect(systemAdminPage).toHaveURL(/startDate=2026-01-01/);
    await expect(systemAdminPage).toHaveURL(/endDate=2026-12-31/);
  });

  test('감사 로그 상세 보기', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/audit-logs');

    // 첫 번째 로그 클릭
    await systemAdminPage.getByRole('article').first().click();

    // 상세 페이지로 이동 확인
    await expect(systemAdminPage).toHaveURL(/\/admin\/audit-logs\/[a-z0-9-]+/);

    // 상세 정보 확인
    await expect(systemAdminPage.getByText('수행 사용자')).toBeVisible();
    await expect(systemAdminPage.getByText('수행 일시')).toBeVisible();
    await expect(systemAdminPage.getByText('변경 내역')).toBeVisible();
  });

  test('Diff 뷰어 표시', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/audit-logs');

    // UPDATE 액션 로그 찾기
    await systemAdminPage.getByLabel('액션 유형').selectOption('UPDATE');
    await systemAdminPage.getByRole('button', { name: '검색' }).click();

    // 첫 번째 로그 클릭
    const updateLog = systemAdminPage.getByRole('article').first();
    if (await updateLog.isVisible()) {
      await updateLog.click();

      // Diff 뷰어 확인
      const diffViewer = systemAdminPage.locator('[data-testid="diff-viewer"]');
      if (await diffViewer.isVisible()) {
        await expect(diffViewer).toBeVisible();
      }
    }
  });
});

test.describe('Settings - System Settings (Admin)', () => {
  test('시스템 설정 페이지 접근 (관리자)', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/system');

    await expect(systemAdminPage.getByRole('heading', { name: '시스템 설정' })).toBeVisible();
  });

  test('시스템 설정 변경 시 확인 모달', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/system');

    // 설정 변경
    await systemAdminPage.getByLabel('기본 교정 주기').fill('12');
    await systemAdminPage.getByRole('button', { name: '저장' }).click();

    // 확인 모달 표시
    const modal = systemAdminPage.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('시스템 설정을 변경하시겠습니까?')).toBeVisible();

    // 확인
    await modal.getByRole('button', { name: '확인' }).click();
    await expect(systemAdminPage.getByText('설정이 저장되었습니다')).toBeVisible();
  });

  test('비관리자 접근 차단', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/admin/system');

    // 403 또는 권한 없음 페이지
    await expect(
      testOperatorPage.getByText('접근 권한이 없습니다').or(testOperatorPage.locator('text=403'))
    ).toBeVisible();
  });
});

test.describe('Settings - Error Handling', () => {
  test('설정 저장 실패 시 에러 표시', async ({ testOperatorPage }) => {
    // API 실패 mock
    await testOperatorPage.route('**/api/settings/notifications', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 500 });
      } else {
        route.continue();
      }
    });

    await testOperatorPage.goto('/settings/notifications');

    const toggle = testOperatorPage.getByRole('switch').first();
    await toggle.click();

    // 에러 메시지 확인
    await expect(testOperatorPage.getByRole('alert')).toBeVisible();
  });

  test('감사 로그 로딩 실패', async ({ systemAdminPage }) => {
    await systemAdminPage.route('**/api/admin/audit-logs**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await systemAdminPage.goto('/admin/audit-logs');

    await expect(systemAdminPage.getByRole('alert')).toBeVisible();
    await expect(systemAdminPage.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });
});

test.describe('Settings - Accessibility', () => {
  test('토글 스위치 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/settings/notifications');

    // role="switch" 확인
    const toggle = testOperatorPage.getByRole('switch').first();
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked');

    // 키보드로 토글 가능
    await toggle.focus();
    await testOperatorPage.keyboard.press('Space');

    // aria-checked 변경 확인
    const newState = await toggle.getAttribute('aria-checked');
    expect(newState).toBeTruthy();
  });

  test('설정 그룹 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/settings/notifications');

    // role="group" 확인
    const group = testOperatorPage.getByRole('group').first();
    await expect(group).toBeVisible();
    await expect(group).toHaveAttribute('aria-labelledby');
  });

  test('감사 로그 목록 접근성', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/admin/audit-logs');

    // role="log" 확인
    const log = systemAdminPage.getByRole('log');
    await expect(log).toBeVisible();
  });

  test('키보드 탐색', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/settings/notifications');

    // Tab 키로 토글 간 이동
    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
```

#### 테스트 실행 방법

```bash
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/settings.spec.ts --project=chromium

# 관리자 테스트만 실행
NODE_ENV=test pnpm exec playwright test tests/e2e/settings.spec.ts --grep "Admin"

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/settings.spec.ts --debug
```
