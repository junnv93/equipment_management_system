# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-4: 알림 센터

### 목적

실시간 알림 관리 기능을 제공합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 알림 센터를 구현해줘.

요구사항:
1. 헤더 알림 아이콘
   - 종 모양 아이콘
   - 읽지 않은 알림 개수 뱃지 (빨간색)
   - 클릭 시 드롭다운 표시

2. 알림 드롭다운
   - 최근 알림 5개 미리보기
   - 알림 유형별 아이콘/색상 구분
     - 승인 요청: 노란색 (요청 아이콘)
     - 승인 완료: 초록색 (체크 아이콘)
     - 반려: 빨간색 (X 아이콘)
     - 교정 예정: 파란색 (캘린더 아이콘)
     - 시스템: 회색 (정보 아이콘)
   - "전체 보기" 링크

3. 전체 알림 페이지
   - 알림 목록 (무한 스크롤)
   - 유형별 필터
   - 읽음/안읽음 필터
   - 전체 읽음 처리 버튼
   - 개별 삭제 버튼

4. 알림 상호작용
   - 클릭 시 관련 페이지로 이동
   - 읽음 처리 자동 수행
   - 읽은 알림은 스타일 변경 (흐리게)

5. 실시간 업데이트 (선택)
   - SSE 또는 폴링 (30초)
   - 새 알림 시 뱃지 업데이트
   - 브라우저 알림 (허용 시)

파일:
- apps/frontend/components/layout/Header.tsx (수정: 알림 아이콘 추가)
- apps/frontend/components/layout/NotificationBell.tsx
- apps/frontend/components/notifications/NotificationDropdown.tsx
- apps/frontend/components/notifications/NotificationItem.tsx
- apps/frontend/components/notifications/NotificationList.tsx
- apps/frontend/app/notifications/page.tsx
- apps/frontend/lib/api/notifications-api.ts
- apps/frontend/hooks/useNotifications.ts
- apps/frontend/app/actions/notifications.ts (Server Actions)

Next.js 16 필수 패턴:
1. searchParams Promise 패턴 (전체 알림 페이지):
   ```typescript
   // apps/frontend/app/notifications/page.tsx
   export default async function NotificationsPage(props: {
     searchParams: Promise<{ type?: string; status?: string }>;
   }) {
     const searchParams = await props.searchParams;
     const type = searchParams.type;
     const status = searchParams.status ?? 'all';

     return <NotificationListClient initialType={type} initialStatus={status} />;
   }
   ```

2. 클라이언트 컴포넌트 (실시간 업데이트):
   ```typescript
   'use client';
   import { useEffect, useCallback } from 'react';
   import { useNotifications } from '@/hooks/useNotifications';

   export function NotificationBell() {
     const { unreadCount, notifications, markAsRead, refetch } = useNotifications();

     // 폴링 (30초마다)
     useEffect(() => {
       const interval = setInterval(refetch, 30000);
       return () => clearInterval(interval);
     }, [refetch]);

     return (
       <button
         aria-label={`알림 ${unreadCount}개`}
         aria-haspopup="true"
         aria-expanded={isOpen}
       >
         <Bell />
         {unreadCount > 0 && (
           <span aria-hidden="true" className="badge">
             {unreadCount > 99 ? '99+' : unreadCount}
           </span>
         )}
       </button>
     );
   }
   ```

3. useActionState 읽음 처리:
   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { markNotificationAsRead } from '@/app/actions/notifications';

   export function NotificationItem({ notification }) {
     const [state, formAction, isPending] = useActionState(
       markNotificationAsRead.bind(null, notification.id),
       { success: false }
     );

     return (
       <form action={formAction}>
         <button type="submit" disabled={isPending}>
           {/* 알림 내용 */}
         </button>
       </form>
     );
   }
   ```

성능 최적화 요구사항 (/vercel-react-best-practices):
1. **rerender-memo**: 개별 알림 아이템 메모이제이션
   ```typescript
   const MemoizedNotificationItem = memo(NotificationItem, (prev, next) => {
     return prev.notification.id === next.notification.id &&
            prev.notification.readAt === next.notification.readAt;
   });
   ```

2. **rerender-derived-state**: 읽지 않은 개수만 구독
   ```typescript
   // ❌ 전체 알림 배열 구독 (불필요한 리렌더)
   const notifications = useNotifications();
   const unreadCount = notifications.filter(n => !n.readAt).length;

   // ✅ 파생 값만 구독
   const unreadCount = useNotificationUnreadCount();
   ```

3. **client-event-listeners**: 전역 이벤트 리스너 중복 방지
   ```typescript
   // SSE 연결은 앱 레벨에서 한 번만
   useEffect(() => {
     const eventSource = new EventSource('/api/notifications/sse');
     // ...
     return () => eventSource.close();
   }, []); // 빈 의존성
   ```

4. **rendering-activity**: 드롭다운 show/hide 최적화
   ```typescript
   // 드롭다운이 닫혀있어도 DOM에 유지 (빠른 열기)
   <div className={isOpen ? 'block' : 'hidden'}>
     <NotificationDropdown />
   </div>
   ```

디자인 요구사항 (/frontend-design 스킬 활용):
- 알림 벨 아이콘:
  - 읽지 않은 알림 뱃지: Brand Red (#CA0123) 배경
  - 뱃지 펄스 애니메이션 (새 알림 시)
  - 아이콘 크기: 24px
- 드롭다운:
  - 헤더 아래 오른쪽 정렬
  - 최대 높이 400px, 스크롤
  - 그림자: shadow-lg
  - 슬라이드 다운 애니메이션 (150ms)
- 알림 아이템:
  - 호버 시 배경색 변경 (#F5F5F5)
  - 읽지 않은 알림: 왼쪽 파란색 바 (UL Info #BCE4F7, 4px)
  - 읽은 알림: 텍스트 흐리게 (opacity-60)
- 알림 유형별 색상 (UL Solutions 브랜드):
  - 승인 요청: UL Orange (#FF9D55) + Clock 아이콘
  - 승인 완료: UL Green (#00A451) + CheckCircle 아이콘
  - 반려: Brand Red (#CA0123) + XCircle 아이콘
  - 교정 예정: UL Info (#BCE4F7) + Calendar 아이콘
  - 시스템: UL Fog (#577E9E) + Info 아이콘

접근성 요구사항 (/web-design-guidelines):
- 알림 벨에 aria-label="알림 {count}개" 추가
- 드롭다운에 role="menu" + aria-labelledby 추가
- 개별 알림에 role="menuitem" 추가
- 읽지 않은 알림에 aria-label="읽지 않음" 추가
- 새 알림 도착 시 aria-live="polite" 영역에 알림
- Escape 키로 드롭다운 닫기
- 드롭다운 열릴 때 첫 번째 항목으로 포커스 이동
- Tab/Arrow 키로 알림 목록 탐색

제약사항:
- 알림 클릭 시 관련 리소스 페이지로 이동
- 읽음 처리 실패 시 재시도 로직
- 알림 개수는 최대 99+로 표시
- 실시간 업데이트: SSE 또는 폴링 (30초)

검증:
- 알림 드롭다운 동작 확인
- 알림 클릭 시 이동 및 읽음 처리 확인
- 전체 알림 페이지 필터 동작 확인

Playwright 테스트:
- 새 알림 발생 시 카운트 업데이트 확인
- 알림 클릭 시 해당 페이지로 이동 확인
- 읽음 처리 후 스타일 변경 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

#### 1. 알림 관련 API 엔드포인트

```typescript
// 알림 목록 조회
GET /api/notifications?type={type}&status={read|unread|all}&page={page}&limit={limit}

// 읽지 않은 알림 개수
GET /api/notifications/unread-count

// 알림 읽음 처리
PATCH /api/notifications/:id/read

// 전체 읽음 처리
PATCH /api/notifications/read-all

// 알림 삭제
DELETE /api/notifications/:id

// SSE 연결 (실시간)
GET /api/notifications/sse
```

---

#### 2. 알림 유형별 처리

```typescript
// UL Solutions 브랜드 색상 적용
const NOTIFICATION_TYPE_CONFIG = {
  approval_requested: {
    label: '승인 요청',
    // UL Orange
    color: 'bg-[#FF9D55]/10 text-[#FF9D55] border-[#FF9D55]/20',
    icon: Clock,
    getLink: (data) => `/approvals/${data.requestId}`,
  },
  approval_approved: {
    label: '승인 완료',
    // UL Green
    color: 'bg-[#00A451]/10 text-[#00A451] border-[#00A451]/20',
    icon: CheckCircle,
    getLink: (data) => data.resourceType === 'equipment'
      ? `/equipment/${data.resourceId}`
      : `/calibration/${data.resourceId}`,
  },
  approval_rejected: {
    label: '반려',
    // Brand Red
    color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]/20',
    icon: XCircle,
    getLink: (data) => `/approvals/${data.requestId}`,
  },
  calibration_due: {
    label: '교정 예정',
    // UL Info
    color: 'bg-[#BCE4F7]/20 text-[#122C49] border-[#BCE4F7]',
    icon: Calendar,
    getLink: (data) => `/equipment/${data.equipmentId}`,
  },
  calibration_overdue: {
    label: '교정 기한 초과',
    // Brand Red
    color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]/20',
    icon: AlertTriangle,
    getLink: (data) => `/equipment/${data.equipmentId}`,
  },
  system: {
    label: '시스템',
    // UL Fog
    color: 'bg-[#577E9E]/10 text-[#577E9E] border-[#577E9E]/20',
    icon: Info,
    getLink: () => '/notifications',
  },
};
```

---

#### 3. 실시간 업데이트 구현

```typescript
// SSE를 통한 실시간 알림 수신
export function useNotificationSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/sse');

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);

      // 캐시 업데이트
      queryClient.setQueryData(['notifications'], (old) => ({
        ...old,
        items: [notification, ...(old?.items || [])],
      }));

      // 읽지 않은 개수 증가
      queryClient.setQueryData(['notifications', 'unreadCount'], (old) => (old || 0) + 1);

      // 브라우저 알림 (허용된 경우)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png',
        });
      }
    };

    eventSource.onerror = () => {
      // 폴백: 30초 폴링
      eventSource.close();
    };

    return () => eventSource.close();
  }, [queryClient]);
}
```

---

#### 4. 읽음 처리 낙관적 업데이트

```typescript
const markAsRead = useMutation({
  mutationFn: (id: string) => notificationsApi.markAsRead(id),
  onMutate: async (id) => {
    // 낙관적 업데이트
    await queryClient.cancelQueries(['notifications']);

    const previous = queryClient.getQueryData(['notifications']);

    queryClient.setQueryData(['notifications'], (old) => ({
      ...old,
      items: old.items.map(n =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      ),
    }));

    queryClient.setQueryData(['notifications', 'unreadCount'], (old) =>
      Math.max(0, (old || 0) - 1)
    );

    return { previous };
  },
  onError: (err, id, context) => {
    // 롤백
    queryClient.setQueryData(['notifications'], context.previous);
    toast.error('읽음 처리에 실패했습니다. 다시 시도해주세요.');
  },
});
```

---

### 이행 체크리스트 UI-4

#### 컴포넌트 구현

- [ ] NotificationBell.tsx 컴포넌트 생성됨
- [ ] NotificationDropdown.tsx 컴포넌트 생성됨
- [ ] NotificationItem.tsx 컴포넌트 생성됨
- [ ] NotificationList.tsx 컴포넌트 생성됨
- [ ] Header.tsx에 알림 아이콘 추가됨
- [ ] notifications/page.tsx 생성됨
- [ ] notifications-api.ts API 함수 생성됨
- [ ] useNotifications.ts 훅 생성됨
- [ ] actions/notifications.ts Server Actions 생성됨

#### Next.js 16 패턴

- [ ] searchParams를 await로 처리함 (전체 알림 페이지)
- [ ] useActionState 사용됨 (읽음 처리)
- [ ] Server Actions가 적절히 분리됨

#### 성능 최적화 (Vercel Best Practices)

- [ ] NotificationItem 메모이제이션됨
- [ ] 읽지 않은 개수만 구독 (파생 상태)
- [ ] SSE/폴링 리스너 중복 방지됨
- [ ] 드롭다운 show/hide 최적화됨

#### 기능 구현

- [ ] 알림 유형별 아이콘/색상 구현됨 (UL Solutions 브랜드)
- [ ] 드롭다운 애니메이션 구현됨 (슬라이드 + 펄스)
- [ ] 읽음 처리 및 스타일 변경 구현됨
- [ ] 전체 알림 페이지 필터 구현됨 (URL 상태 동기화)
- [ ] 무한 스크롤 구현됨
- [ ] 실시간 업데이트 구현됨 (SSE 또는 폴링)
- [ ] 브라우저 알림 구현됨 (허용 시)

#### 에러 처리 관련

- [ ] 읽음 처리 실패 시 재시도 로직 구현됨
- [ ] 낙관적 업데이트 롤백 구현됨
- [ ] ErrorAlert 컴포넌트 연동됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트 확인됨

#### 로딩/빈 상태 관련

- [ ] 드롭다운 로딩 스켈레톤 구현됨
- [ ] 전체 목록 로딩 스켈레톤 구현됨
- [ ] 빈 상태 UI 구현됨 (알림 없음)
- [ ] 필터 결과 빈 상태 UI 구현됨

#### form 버튼 관련

- [ ] 드롭다운 토글 버튼에 type="button" 적용됨
- [ ] 전체 읽음 버튼에 type="button" 적용됨
- [ ] 삭제 버튼에 type="button" 적용됨

#### 접근성 관련 (WCAG 2.1 AA)

- [ ] 알림 벨에 aria-label="알림 {count}개" 추가됨
- [ ] 드롭다운에 role="menu" + aria-labelledby 추가됨
- [ ] 개별 알림에 role="menuitem" 추가됨
- [ ] 읽지 않은 알림에 aria-label 추가됨
- [ ] 새 알림 도착 시 aria-live 영역 업데이트됨
- [ ] Escape 키로 드롭다운 닫기 구현됨
- [ ] 드롭다운 열릴 때 포커스 이동됨
- [ ] Tab/Arrow 키 탐색 구현됨
- [ ] 포커스 표시 명확함 (outline 스타일 유지)

#### 테스트

- [ ] Playwright 테스트 작성됨 (notifications.spec.ts)
- [ ] 접근성 테스트 통과됨
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/notifications.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Notifications - Dropdown', () => {
  test('알림 드롭다운 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // 알림 벨 클릭
    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    await bell.click();

    // 드롭다운 표시 확인
    const dropdown = testOperatorPage.getByRole('menu', { name: '알림 목록' });
    await expect(dropdown).toBeVisible();
  });

  test('알림 클릭 시 이동 및 읽음 처리', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    await bell.click();

    // 첫 번째 알림 클릭
    const firstNotification = testOperatorPage.getByRole('menuitem').first();
    await firstNotification.click();

    // 관련 페이지로 이동 확인
    await expect(testOperatorPage).not.toHaveURL('/dashboard');
  });

  test('Escape 키로 드롭다운 닫기', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    await bell.click();

    const dropdown = testOperatorPage.getByRole('menu', { name: '알림 목록' });
    await expect(dropdown).toBeVisible();

    // Escape 키 누르기
    await testOperatorPage.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });

  test('읽지 않은 알림 뱃지 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    // aria-label에 개수가 포함되어 있는지 확인
    await expect(bell).toHaveAttribute('aria-label', /알림 \d+개/);
  });
});

test.describe('Notifications - Full Page', () => {
  test('전체 알림 페이지 필터', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 읽지 않은 알림 필터
    await testOperatorPage.getByRole('radio', { name: '읽지 않음' }).click();

    // URL에 상태 반영 확인
    await expect(testOperatorPage).toHaveURL(/status=unread/);
  });

  test('유형별 필터', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 승인 요청 필터
    await testOperatorPage.getByLabel('알림 유형').selectOption('approval_requested');

    // URL에 상태 반영 확인
    await expect(testOperatorPage).toHaveURL(/type=approval_requested/);
  });

  test('전체 읽음 처리', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 전체 읽음 버튼 클릭
    await testOperatorPage.getByRole('button', { name: '전체 읽음' }).click();

    // 확인 다이얼로그
    await testOperatorPage.getByRole('button', { name: '확인' }).click();

    // 성공 메시지 확인
    await expect(testOperatorPage.getByText('모든 알림을 읽음 처리했습니다')).toBeVisible();
  });

  test('무한 스크롤', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 스크롤하여 더 많은 알림 로드
    await testOperatorPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // 로딩 인디케이터 또는 새 항목 확인
    await expect(
      testOperatorPage.getByRole('listitem').or(testOperatorPage.getByText('로딩 중'))
    ).toBeVisible();
  });
});

test.describe('Notifications - Error Handling', () => {
  test('API 에러 시 ErrorAlert 표시', async ({ page }) => {
    await page.route('**/api/notifications**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/notifications');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('읽음 처리 실패 시 롤백', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 읽음 처리 API mock (실패)
    await testOperatorPage.route('**/api/notifications/*/read', (route) => {
      route.fulfill({ status: 500 });
    });

    // 첫 번째 알림 클릭
    const firstNotification = testOperatorPage.getByRole('listitem').first();
    await firstNotification.click();

    // 에러 메시지 확인
    await expect(testOperatorPage.getByText('읽음 처리에 실패했습니다')).toBeVisible();
  });
});

test.describe('Notifications - Accessibility', () => {
  test('알림 벨에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    await expect(bell).toHaveAttribute('aria-haspopup', 'true');

    await bell.click();
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
  });

  test('키보드 탐색', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    await bell.click();

    // 드롭다운 열리면 첫 번째 항목으로 포커스 이동
    const firstItem = testOperatorPage.getByRole('menuitem').first();
    await expect(firstItem).toBeFocused();

    // Arrow Down으로 다음 항목 이동
    await testOperatorPage.keyboard.press('ArrowDown');
    const secondItem = testOperatorPage.getByRole('menuitem').nth(1);
    await expect(secondItem).toBeFocused();
  });

  test('알림 유형 아이콘에 접근성 레이블', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/notifications');

    // 알림 유형 아이콘에 aria-label이 있는지 확인
    const typeIcon = testOperatorPage.locator('[aria-label="승인 요청"]').first();
    if (await typeIcon.isVisible()) {
      await expect(typeIcon).toBeVisible();
    }
  });

  test('새 알림 도착 시 aria-live 업데이트', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    // aria-live 영역 존재 확인
    const liveRegion = testOperatorPage.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeVisible();
  });
});

test.describe('Notifications - Real-time', () => {
  test('폴링으로 새 알림 수신', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/dashboard');

    const bell = testOperatorPage.getByRole('button', { name: /알림/ });
    const initialLabel = await bell.getAttribute('aria-label');

    // 새 알림 API mock
    await testOperatorPage.route('**/api/notifications/unread-count', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 10 }),
      });
    });

    // 폴링 대기 (테스트 환경에서는 짧게)
    await testOperatorPage.waitForTimeout(1000);

    // 뱃지 업데이트 확인 (실제로는 mock 데이터에 따라 다름)
    // 이 테스트는 실제 환경에서 적절히 조정 필요
  });
});
```

#### 테스트 실행 방법

```bash
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/notifications.spec.ts --project=chromium

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/notifications.spec.ts --debug
```
