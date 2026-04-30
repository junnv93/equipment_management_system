/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react';
import { MyActivityCard } from '../MyActivityCard';
import type { RecentActivity } from '@/lib/api/dashboard-api';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    if (params && 'userName' in params) return `${params.userName}님이`;
    return `${ns}.${key}`;
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/lib/design-tokens', () => ({
  DASHBOARD_MOTION: { instantBg: 'instantBg' },
  DASHBOARD_RECENT_ACTIVITIES_TOKENS: {
    item: 'item',
    iconContainer: 'iconContainer',
    iconContainerDefault: 'iconContainerDefault',
    iconContainerApproval: 'iconContainerApproval',
    iconContainerRejection: 'iconContainerRejection',
    rowApproval: 'rowApproval',
    rowRejection: 'rowRejection',
    content: 'content',
    meta: 'meta',
    viewDetailBtn: 'viewDetailBtn',
    scrollContainer: 'scrollContainer',
    scrollFade: 'scrollFade',
  },
  DASHBOARD_EMPTY_STATE_TOKENS: {
    neutral: { container: 'neutral-container', title: 'neutral-title' },
  },
}));

jest.mock('@/hooks/use-date-formatter', () => ({
  useDateFormatter: () => ({
    fmtDateTime: (date: string) => `formatted:${date}`,
  }),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="card" {...rest}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children, id }: React.PropsWithChildren<{ id?: string }>) => (
    <h2 id={id}>{children}</h2>
  ),
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

const mockCheckoutRoute = '/checkouts/entity-1';
const mockCalibrationRoute = '/calibration/entity-1';

jest.mock('@/lib/config/recent-activities-config', () => ({
  ACTIVITY_TYPES: {
    checkout_created: {
      icon: () => <svg data-testid="icon-checkout" />,
      labelKey: 'checkout_created',
      variant: 'outline',
      category: 'checkout',
    },
    calibration_created: {
      icon: () => <svg data-testid="icon-calibration" />,
      labelKey: 'calibration_created',
      variant: 'default',
      category: 'calibration',
    },
    checkout_approved: {
      icon: () => <svg data-testid="icon-checkout-approved" />,
      labelKey: 'checkout_approved',
      variant: 'default',
      category: 'checkout',
    },
    non_conformance_created: {
      icon: () => <svg data-testid="icon-nc" />,
      labelKey: 'non_conformance_created',
      variant: 'destructive',
      category: 'equipment',
    },
  },
  ACTIVITY_ROUTES: {
    calibration_created: () => mockCalibrationRoute,
    checkout_created: () => mockCheckoutRoute,
    checkout_approved: () => mockCheckoutRoute,
    // non_conformance_created: 라우트 없음 (의도적)
  },
  DEFAULT_ACTIVITY_META: {
    icon: () => <svg data-testid="icon-default" />,
    labelKey: 'other',
    variant: 'default',
    category: 'other',
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeActivity(override: Partial<RecentActivity> = {}): RecentActivity {
  return {
    id: 'act-1',
    type: 'checkout_created',
    entityId: 'entity-1',
    entityName: '오실로스코프 #1',
    equipmentId: 'equip-1',
    equipmentName: '오실로스코프',
    details: '반출 완료',
    userId: 'user-a',
    userName: '테스트 사용자',
    timestamp: '2026-04-26T10:00:00Z',
    ...override,
  };
}

const USER_A = 'user-a';
const USER_B = 'user-b';

beforeEach(() => mockPush.mockClear());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MyActivityCard', () => {
  describe('userId 필터', () => {
    it('userId가 일치하는 활동만 표시한다', () => {
      const activities: RecentActivity[] = [
        makeActivity({ id: 'a1', userId: USER_A, entityName: '내 활동 A' }),
        makeActivity({ id: 'a2', userId: USER_B, entityName: '타인 활동 B' }),
        makeActivity({ id: 'a3', userId: USER_A, entityName: '내 활동 C' }),
      ];
      render(<MyActivityCard userId={USER_A} recentActivities={activities} />);
      expect(screen.getByText('내 활동 A')).toBeInTheDocument();
      expect(screen.queryByText('타인 활동 B')).not.toBeInTheDocument();
      expect(screen.getByText('내 활동 C')).toBeInTheDocument();
    });

    it('최대 5개 항목만 표시한다', () => {
      const activities = Array.from({ length: 8 }, (_, i) =>
        makeActivity({ id: `a${i}`, userId: USER_A, entityName: `활동 ${i}` })
      );
      render(<MyActivityCard userId={USER_A} recentActivities={activities} />);
      // 각 항목은 entityName 텍스트로 확인
      expect(screen.getAllByText(/활동 \d/)).toHaveLength(5);
    });
  });

  describe('빈 상태', () => {
    it('일치하는 활동이 없으면 empty 텍스트를 표시한다', () => {
      render(<MyActivityCard userId={USER_A} recentActivities={[]} />);
      expect(screen.getByText('dashboard.myActivity.empty')).toBeInTheDocument();
    });

    it('다른 사용자 활동만 있어도 empty를 표시한다', () => {
      const activities = [makeActivity({ userId: USER_B })];
      render(<MyActivityCard userId={USER_A} recentActivities={activities} />);
      expect(screen.getByText('dashboard.myActivity.empty')).toBeInTheDocument();
    });
  });

  describe('Badge & 타임스탬프', () => {
    it('활동 타입에 맞는 Badge를 렌더한다', () => {
      const activity = makeActivity({ type: 'checkout_created', userId: USER_A });
      render(<MyActivityCard userId={USER_A} recentActivities={[activity]} />);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('타임스탬프를 포맷하여 표시한다', () => {
      const activity = makeActivity({ userId: USER_A, timestamp: '2026-04-26T10:00:00Z' });
      render(<MyActivityCard userId={USER_A} recentActivities={[activity]} />);
      expect(screen.getByText('formatted:2026-04-26T10:00:00Z')).toBeInTheDocument();
    });
  });

  describe('라우팅', () => {
    it('라우트가 있는 활동의 자세히 보기 버튼 클릭 시 router.push를 호출한다', () => {
      const activity = makeActivity({
        type: 'checkout_created',
        entityId: 'entity-1',
        userId: USER_A,
      });
      render(<MyActivityCard userId={USER_A} recentActivities={[activity]} />);
      fireEvent.click(screen.getByText('dashboard.activities.viewDetail'));
      expect(mockPush).toHaveBeenCalledWith(mockCheckoutRoute);
    });

    it('라우트가 없는 타입(non_conformance_created)은 자세히 보기 버튼을 렌더하지 않는다', () => {
      const activity = makeActivity({ type: 'non_conformance_created', userId: USER_A });
      render(<MyActivityCard userId={USER_A} recentActivities={[activity]} />);
      expect(screen.queryByText('dashboard.activities.viewDetail')).not.toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('region role과 aria-labelledby가 있다', () => {
      render(<MyActivityCard userId={USER_A} recentActivities={[]} />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'my-activity-title');
    });
  });
});
