'use client';

import { AlertTriangle, ClipboardList, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { APPROVAL_KPI_STRIP_TOKENS, type ApprovalKpiVariant } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalKpiStripProps {
  totalPending: number;
  /** null = 데이터 준비 중 ("–"), 0 = 실제 0건 ("0 긴급 없음") */
  urgentCount: number | null;
  avgWaitDays: number;
  isLoading?: boolean;
}

interface KpiCardProps {
  label: string;
  /** null = 준비 중, string = 렌더링 값 */
  value: string | null;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorVariant: ApprovalKpiVariant;
  testId: string;
  isLoading?: boolean;
  onClick?: () => void;
  ariaLive?: 'polite' | 'off';
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  colorVariant,
  testId,
  isLoading,
  onClick,
  ariaLive,
}: KpiCardProps) {
  const tokens = APPROVAL_KPI_STRIP_TOKENS;
  const isUrgent = colorVariant === 'urgent';
  const numValue = value ? Number(value) : 0;

  return (
    <div
      className={cn(
        tokens.card.base,
        tokens.card.hover,
        tokens.card.hoverWash,
        tokens.card.focus,
        tokens.borderColors[colorVariant],
        tokens.hoverWashBg[colorVariant],
        onClick && 'cursor-pointer'
      )}
      tabIndex={0}
      role={onClick ? 'button' : 'region'}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* 긴급 pulse dot — 실제 긴급 건 있을 때만 */}
      {isUrgent && !isLoading && numValue > 0 && (
        <div className={cn(tokens.pulseDot.container, tokens.contentZ)}>
          <div className={tokens.pulseDot.dot} />
          <div className={tokens.pulseDot.ring} />
        </div>
      )}
      <div className={cn(tokens.iconContainer, tokens.iconBg[colorVariant], tokens.contentZ)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className={cn('flex-1 min-w-0', tokens.contentZ)}>
        <div className={tokens.label}>{label}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-14 mt-0.5" data-testid="kpi-skeleton" />
        ) : (
          <div className={tokens.value} aria-live={ariaLive} data-testid={testId}>
            {value === null ? (
              <span className={tokens.valueNotReady}>–</span>
            ) : value === '0' ? (
              <span className={tokens.valueZero}>{value}</span>
            ) : (
              value
            )}
          </div>
        )}
        {sub && !isLoading && <div className={tokens.sub}>{sub}</div>}
      </div>
    </div>
  );
}

/**
 * 승인 KPI 스트립 — 3개 핵심 지표 (AP-01)
 *
 * Tier 1: 긴급 (urgentCount) — 최우선 시각 비중, pulse dot
 * Tier 2: 전체 대기 (totalPending)
 * Tier 3: 평균 대기일 (avgWaitDays)
 *
 * 0 vs null 분기:
 * - urgentCount === null: 데이터 준비 중 → "–" + "준비 중"
 * - urgentCount === 0: 실제 0건 → "0" (muted) + "긴급 없음"
 * - urgentCount > 0: 긴급 → 값 + pulse dot
 */
export function ApprovalKpiStrip({
  totalPending,
  urgentCount,
  avgWaitDays,
  isLoading,
}: ApprovalKpiStripProps) {
  const t = useTranslations('approvals');
  const router = useRouter();

  const urgentSub =
    urgentCount === null
      ? t('kpi.empty.notReady')
      : urgentCount === 0
        ? t('kpi.noUrgent')
        : t('kpi.urgentSub');

  return (
    <div className={APPROVAL_KPI_STRIP_TOKENS.container}>
      {/* Tier 1: 긴급 — 클릭 시 ?filter=urgent 필터 */}
      <KpiCard
        label={t('kpi.urgent')}
        value={urgentCount === null ? null : String(urgentCount)}
        sub={urgentSub}
        icon={AlertTriangle}
        colorVariant="urgent"
        testId="kpi-value-urgent"
        isLoading={isLoading}
        onClick={() => router.push('?filter=urgent')}
        ariaLive="polite"
      />
      {/* Tier 2: 전체 대기 */}
      <KpiCard
        label={t('kpi.totalPending')}
        value={String(totalPending)}
        icon={ClipboardList}
        colorVariant="total"
        testId="kpi-value-total"
        isLoading={isLoading}
      />
      {/* Tier 3: 평균 대기일 */}
      <KpiCard
        label={t('kpi.avgWait')}
        value={avgWaitDays > 0 ? String(avgWaitDays) : '0'}
        sub={avgWaitDays > 0 ? t('kpi.dayUnit') : undefined}
        icon={Clock}
        colorVariant="avgWait"
        testId="kpi-value-avgWait"
        isLoading={isLoading}
      />
    </div>
  );
}
