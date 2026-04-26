/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { MyActivityCard } from '../MyActivityCard';
import type { RecentActivity } from '@/lib/api/dashboard-api';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && 'name' in params) return `${key}:${params.name}`;
    return key;
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/lib/design-tokens', () => ({
  DASHBOARD_RECENT_ACTIVITIES_TOKENS: {
    item: 'item',
    iconContainer: 'iconContainer',
    iconContainerDefault: 'iconContainerDefault',
    content: 'content',
    meta: 'meta',
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
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(5);
    });
  });

  describe('빈 상태', () => {
    it('일치하는 활동이 없으면 empty 텍스트를 표시한다', () => {
      render(<MyActivityCard userId={USER_A} recentActivities={[]} />);
      expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('빈 상태는 role="status"를 가진다', () => {
      render(<MyActivityCard userId={USER_A} recentActivities={[]} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('다른 사용자 활동만 있어도 empty를 표시한다', () => {
      const activities = [makeActivity({ userId: USER_B })];
      render(<MyActivityCard userId={USER_A} recentActivities={activities} />);
      expect(screen.getByText('empty')).toBeInTheDocument();
    });
  });

  describe('kind별 아이콘', () => {
    it('calibration 타입에 ClipboardList 아이콘을 렌더한다', () => {
      const activity = makeActivity({ type: 'calibration_created', userId: USER_A });
      const { container } = render(
        <MyActivityCard userId={USER_A} recentActivities={[activity]} />
      );
      // lucide-react SVG 아이콘이 렌더되는지 확인 (aria-hidden)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });

    it('checkout 타입에 Truck 아이콘을 렌더한다', () => {
      const activity = makeActivity({ type: 'CHECKOUT_CREATED', userId: USER_A });
      const { container } = render(
        <MyActivityCard userId={USER_A} recentActivities={[activity]} />
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });
  });

  describe('접근성', () => {
    it('section 요소에 aria-label이 있다', () => {
      render(<MyActivityCard userId={USER_A} recentActivities={[]} />);
      const section = screen.getByRole('region', { hidden: false });
      expect(section).toHaveAttribute('aria-label');
    });

    it('활동 목록은 role="list"를 가진다', () => {
      const activities = [makeActivity({ userId: USER_A })];
      render(<MyActivityCard userId={USER_A} recentActivities={activities} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});
