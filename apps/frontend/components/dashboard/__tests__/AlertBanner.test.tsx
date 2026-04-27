/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { AlertBanner } from '../AlertBanner';
import type { DashboardScope } from '@/lib/utils/dashboard-scope';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && 'count' in params) return `${key}:${params.count}`;
    if (params && 'count' in params) return `${key}:${params.count}`;
    return key;
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/lib/design-tokens', () => ({
  DASHBOARD_ALERT_BANNER_TOKENS: {
    container: 'container',
    severityBorder: {
      critical: 'border-critical',
      warning: 'border-warning',
      info: 'border-info',
      none: 'border-none',
    },
    countCircle: 'countCircle',
    summaryText: 'summaryText',
    chips: 'chips',
    chipUrgent: 'chipUrgent',
    chipWarning: 'chipWarning',
    chipInfo: 'chipInfo',
    clearIcon: 'clearIcon',
    clearState: 'clearState',
    allClearCompact: 'allClearCompact',
    stackedContainer: 'stackedContainer',
    stackedRow: 'stackedRow',
    stackedRowCritical: 'stackedRowCritical',
    stackedRowWarning: 'stackedRowWarning',
    stackedRowInfo: 'stackedRowInfo',
    stackedRowNone: 'stackedRowNone',
    countPill: 'countPill',
    countPillCritical: 'countPillCritical',
    countPillWarning: 'countPillWarning',
    countPillInfo: 'countPillInfo',
  },
}));

jest.mock('@/lib/config/dashboard-config', () => ({
  ALERT_BANNER_STACKED_THRESHOLD: 10,
}));

jest.mock('@equipment-management/shared-constants', () => ({
  FRONTEND_ROUTES: {
    EQUIPMENT: { LIST: '/equipment' },
    CHECKOUTS: { LIST: '/checkouts' },
  },
}));

jest.mock('@equipment-management/schemas', () => ({
  EquipmentStatusValues: {
    NON_CONFORMING: 'non_conforming',
    AVAILABLE: 'available',
    CHECKED_OUT: 'checked_out',
  },
}));

jest.mock('@/lib/utils/dashboard-scope', () => ({
  buildScopedEquipmentUrl: (_scope: unknown, route: string, _status?: string) => route,
  buildScopedUrl: (_scope: unknown, route: string) => route,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SCOPE: DashboardScope = {
  teamId: undefined,
  displayMode: 'all',
  site: undefined,
};

const BASE_PROPS = {
  overdueCalibrationCount: 0,
  overdueCheckoutCount: 0,
  nonConformingCount: 0,
  upcomingCalibrationCount: 0,
  upcomingCheckoutReturnCount: 0,
  scope: SCOPE,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AlertBanner', () => {
  describe('allClear state', () => {
    it('모든 카운트가 0이면 allClear 텍스트를 렌더한다', () => {
      render(<AlertBanner {...BASE_PROPS} />);
      expect(screen.getByText('allClear')).toBeInTheDocument();
    });

    it('allClear 상태는 role="status"를 가진다', () => {
      render(<AlertBanner {...BASE_PROPS} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('info severity (upcoming only)', () => {
    it('overdue=0 + upcomingCalibration>0 이면 info 칩을 렌더한다', () => {
      render(<AlertBanner {...BASE_PROPS} upcomingCalibrationCount={3} />);
      expect(screen.getByText('info.upcomingCalibrations:3')).toBeInTheDocument();
    });

    it('info 상태는 role="alert"를 가진다', () => {
      render(<AlertBanner {...BASE_PROPS} upcomingCalibrationCount={3} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('inline variant', () => {
    it('nonConforming>0 이면 critical 칩을 렌더한다', () => {
      render(<AlertBanner {...BASE_PROPS} nonConformingCount={2} />);
      expect(screen.getByText('nonConforming:2')).toBeInTheDocument();
    });

    it('overdueCalibration>0 이면 warning 칩을 렌더한다', () => {
      render(<AlertBanner {...BASE_PROPS} overdueCalibrationCount={4} />);
      expect(screen.getByText('overdueCalibrations:4')).toBeInTheDocument();
    });

    it('totalCount < 10 이면 auto 모드에서 inline(role="alert")을 사용한다', () => {
      render(<AlertBanner {...BASE_PROPS} overdueCalibrationCount={9} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('trailingAction을 렌더한다', () => {
      render(
        <AlertBanner
          {...BASE_PROPS}
          overdueCalibrationCount={1}
          trailingAction={<span>view</span>}
        />
      );
      expect(screen.getByText('view')).toBeInTheDocument();
    });
  });

  describe('stacked variant (auto mode ≥ 10)', () => {
    it('totalCount >= 10 이면 auto 모드에서 stacked(role="region")을 사용한다', () => {
      render(<AlertBanner {...BASE_PROPS} overdueCalibrationCount={10} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('stacked 모드에서 각 severity row를 렌더한다', () => {
      render(
        <AlertBanner
          {...BASE_PROPS}
          nonConformingCount={2}
          overdueCalibrationCount={5}
          overdueCheckoutCount={5}
        />
      );
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText('stacked.criticalHeader')).toBeInTheDocument();
      expect(screen.getByText('stacked.warningHeader')).toBeInTheDocument();
    });

    it('variant="stacked" 명시 시 totalCount < 10이어도 stacked를 사용한다', () => {
      render(<AlertBanner {...BASE_PROPS} overdueCalibrationCount={3} variant="stacked" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('variant="inline" 명시 시 totalCount >= 10이어도 inline을 사용한다', () => {
      render(<AlertBanner {...BASE_PROPS} overdueCalibrationCount={15} variant="inline" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('countPill 99+ overflow', () => {
    it('count > 99이면 "99+"를 표시한다', () => {
      render(
        <AlertBanner
          {...BASE_PROPS}
          nonConformingCount={100}
          overdueCalibrationCount={50}
          overdueCheckoutCount={60}
        />
      );
      const pills = screen.getAllByText('99+');
      expect(pills.length).toBeGreaterThanOrEqual(1);
    });
  });
});
