/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from '@testing-library/react';
import { OutboundStatsGrid } from '../OutboundStatsGrid';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
import type { CheckoutSummary } from '@equipment-management/schemas';
import type { UICheckoutFilters } from '@/lib/utils/checkout-filter-utils';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="stat-card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  ClipboardList: () => <svg data-testid="icon-total" />,
  Clock: () => <svg data-testid="icon-pending" />,
  AlertTriangle: () => <svg data-testid="icon-overdue" />,
  PackageCheck: () => <svg data-testid="icon-returned" />,
  PackageOpen: () => <svg data-testid="icon-checked-out" />,
}));

jest.mock('@/components/checkouts/HeroKPI', () => ({
  HeroKPI: ({
    label,
    value,
    badge,
    meta,
  }: {
    label: string;
    value: number;
    badge?: React.ReactNode;
    meta?: React.ReactNode;
  }) => (
    <div data-testid="hero-kpi">
      {label}:{value}
      {badge}
      {meta}
    </div>
  ),
}));

jest.mock('@/components/checkouts/SparklineMini', () => ({
  SparklineMini: () => <svg data-testid="sparkline" />,
}));

const baseSummary: CheckoutSummary = {
  total: 100,
  pending: 5,
  inProgress: 30,
  overdue: 0,
  returnedToday: 10,
  avgDelayDays: 0,
  maxOverdueDays: 0,
  trends: {},
};

const baseFilters = {
  status: 'all',
  page: 1,
  search: '',
  destination: '',
  purpose: undefined,
  subTab: 'inProgress',
} as unknown as UICheckoutFilters;

describe('OutboundStatsGrid', () => {
  it('5개 카드 렌더링 (overdue=0이면 hero 미선택)', () => {
    render(
      <OutboundStatsGrid summary={baseSummary} filters={baseFilters} onStatActivate={jest.fn()} />
    );
    const cards = screen.getAllByTestId('stat-card');
    // hero 없을 때 5개 모두 일반 Card. overdue=0 → hero 미선택.
    expect(cards).toHaveLength(5);
    expect(screen.queryByTestId('hero-kpi')).not.toBeInTheDocument();
  });

  it('overdue > 0: hero 카드 + alertRing + priority 배지', () => {
    render(
      <OutboundStatsGrid
        summary={{ ...baseSummary, overdue: 7, avgDelayDays: 3, maxOverdueDays: 12 }}
        filters={baseFilters}
        onStatActivate={jest.fn()}
      />
    );
    expect(screen.getByTestId('hero-kpi')).toBeInTheDocument();
    expect(screen.getByText(/outbound.priorityBadge/)).toBeInTheDocument();
  });

  it('카드 클릭 → onStatActivate(filterStatus) 호출', () => {
    const onStatActivate = jest.fn();
    render(
      <OutboundStatsGrid
        summary={baseSummary}
        filters={baseFilters}
        onStatActivate={onStatActivate}
      />
    );
    // 첫 카드 (total) 클릭 → 'all'
    const cards = screen.getAllByTestId('stat-card');
    fireEvent.click(cards[0]);
    expect(onStatActivate).toHaveBeenCalledWith('all');
  });

  it('Enter 키 → onStatActivate (a11y 키보드 작동)', () => {
    const onStatActivate = jest.fn();
    render(
      <OutboundStatsGrid
        summary={baseSummary}
        filters={baseFilters}
        onStatActivate={onStatActivate}
      />
    );
    const cards = screen.getAllByTestId('stat-card');
    fireEvent.keyDown(cards[1], { key: 'Enter' });
    expect(onStatActivate).toHaveBeenCalledWith('pending');
  });

  it('현재 status 필터 → 매칭 카드 aria-pressed=true', () => {
    render(
      <OutboundStatsGrid
        summary={baseSummary}
        filters={{ ...baseFilters, status: CSVal.OVERDUE }}
        onStatActivate={jest.fn()}
      />
    );
    // overdue 필터 활성 → overdue 카드 aria-pressed=true
    // overdue 카드는 4번째 (total/pending/checkedOut/overdue/returned 순)
    const cards = screen.getAllByTestId('stat-card');
    expect(cards[3]).toHaveAttribute('aria-pressed', 'true');
  });

  it('필터 없음 (status=all) → all 카드 aria-pressed=true', () => {
    render(
      <OutboundStatsGrid summary={baseSummary} filters={baseFilters} onStatActivate={jest.fn()} />
    );
    const cards = screen.getAllByTestId('stat-card');
    // 첫 카드 (total/all) aria-pressed=true
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');
  });
});
