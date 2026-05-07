/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { SystemHealthCard } from '../SystemHealthCard';
import type { SystemHealthMetrics } from '@/lib/api/dashboard-api';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && Object.keys(params).length > 0) {
      return `${key}:${Object.values(params).join(',')}`;
    }
    return key;
  },
}));

// Tooltip 모킹 — Radix Portal 렌더 회피 + content 항상 인라인 노출.
// 실제 a11y(Radix-built aria-describedby)는 e2e에서 검증.
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipTrigger: ({
    children,
    asChild: _asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <span data-testid="tooltip-trigger">{children}</span>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  ),
}));

// Skeleton 의존 회피
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <span data-testid="skeleton" className={className} />
  ),
}));

// lucide-react Info icon 단순화
jest.mock('lucide-react', () => ({
  Info: ({ className }: { className?: string }) => (
    <svg data-testid="info-icon" className={className} />
  ),
}));

const baseMetrics: SystemHealthMetrics = {
  overallStatus: 'healthy',
  activeUsers: 12,
  maxUsers: 50,
  dbResponseMs: 80,
  storagePct: 35,
  queueSize: 5,
  errorCount24h: 2,
  storageBackend: 'host-disk',
  queueBackend: 'pending-work-aggregate',
  errorSource: 'system-error-events',
  dbSizeBytes: 1024 * 1024 * 1024 * 5,
};

describe('SystemHealthCard — transparency badges', () => {
  it('정상 케이스: 3개 backend tooltip trigger 렌더 (storage + queue + error)', () => {
    render(<SystemHealthCard metrics={baseMetrics} />);
    const triggers = screen.getAllByTestId('tooltip-trigger');
    // storage row + queue row + footer error = 3 개
    expect(triggers).toHaveLength(3);
  });

  it('정상 케이스: tooltip content 가 backend i18n key 를 노출', () => {
    render(<SystemHealthCard metrics={baseMetrics} />);
    expect(screen.getByText('backend.storage.host-disk')).toBeInTheDocument();
    expect(screen.getByText('backend.queue.pending-work-aggregate')).toBeInTheDocument();
    expect(screen.getByText('backend.error.system-error-events')).toBeInTheDocument();
  });

  it('storageBackend=pg-database: inline "측정 불가" 라벨 표시 + storage tooltip 변경', () => {
    render(
      <SystemHealthCard
        metrics={{ ...baseMetrics, storageBackend: 'pg-database', storagePct: 0 }}
      />
    );
    expect(screen.getByTestId('health-row-unmeasured')).toBeInTheDocument();
    expect(screen.getByTestId('health-row-unmeasured')).toHaveTextContent('unmeasured');
    expect(screen.getByText('backend.storage.pg-database')).toBeInTheDocument();
  });

  it('storageBackend=pg-database + dbSizeBytes>0: DB 크기 hint 노출 (transparency 보강)', () => {
    render(
      <SystemHealthCard
        metrics={{
          ...baseMetrics,
          storageBackend: 'pg-database',
          storagePct: 0,
          dbSizeBytes: 1024 * 1024 * 1024 * 5, // 5 GB
        }}
      />
    );
    expect(screen.getByTestId('health-row-unmeasured-hint')).toBeInTheDocument();
    expect(screen.getByTestId('health-row-unmeasured-hint')).toHaveTextContent('5.0 GB');
  });

  it('storageBackend=pg-database + dbSizeBytes=0: hint 미노출 (CLS 방지)', () => {
    render(
      <SystemHealthCard
        metrics={{
          ...baseMetrics,
          storageBackend: 'pg-database',
          storagePct: 0,
          dbSizeBytes: 0,
        }}
      />
    );
    expect(screen.getByTestId('health-row-unmeasured')).toBeInTheDocument();
    expect(screen.queryByTestId('health-row-unmeasured-hint')).not.toBeInTheDocument();
  });

  it('storageBackend=host-disk: 측정 불가 라벨 미노출', () => {
    render(<SystemHealthCard metrics={baseMetrics} />);
    expect(screen.queryByTestId('health-row-unmeasured')).not.toBeInTheDocument();
    expect(screen.queryByTestId('health-row-unmeasured-hint')).not.toBeInTheDocument();
  });

  it('a11y: Tooltip trigger button 은 aria-label 보유 (스크린리더 backend 의미 노출)', () => {
    render(<SystemHealthCard metrics={baseMetrics} />);
    const triggers = screen.getAllByRole('button', { name: /backendInfoLabel/ });
    expect(triggers.length).toBeGreaterThanOrEqual(3);
    // backendInfoLabel + tooltip text 합성
    expect(triggers[0]).toHaveAttribute(
      'aria-label',
      'backendInfoLabel: backend.storage.host-disk'
    );
  });

  it('a11y: section role=region + aria-label 유지', () => {
    render(<SystemHealthCard metrics={baseMetrics} />);
    expect(screen.getByRole('region', { name: 'ariaLabel' })).toBeInTheDocument();
  });

  it('queueBackend=bullmq: queue tooltip text 변경', () => {
    render(<SystemHealthCard metrics={{ ...baseMetrics, queueBackend: 'bullmq' }} />);
    expect(screen.getByText('backend.queue.bullmq')).toBeInTheDocument();
  });

  it('errorSource=audit-rejection-proxy: footer tooltip text 변경 (legacy fallback 명시)', () => {
    render(<SystemHealthCard metrics={{ ...baseMetrics, errorSource: 'audit-rejection-proxy' }} />);
    expect(screen.getByText('backend.error.audit-rejection-proxy')).toBeInTheDocument();
  });

  it('metrics undefined: fallback 값으로도 transparency 배지 렌더 (CLS 방지)', () => {
    render(<SystemHealthCard />);
    // host-disk (storage) + pending-work-aggregate (queue) + system-error-events (error) fallback
    expect(screen.getByText('backend.storage.host-disk')).toBeInTheDocument();
    expect(screen.queryByTestId('health-row-unmeasured')).not.toBeInTheDocument();
  });

  it('loading: backend 배지 미렌더 (skeleton 만)', () => {
    render(<SystemHealthCard loading />);
    expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
