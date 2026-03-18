'use client';

import { ClipboardList, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { APPROVAL_KPI_STRIP_TOKENS, type ApprovalKpiVariant } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalKpiStripProps {
  totalPending: number;
  urgentCount: number;
  avgWaitDays: number;
  todayProcessed: number | null;
  isLoading?: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorVariant: ApprovalKpiVariant;
  isLoading?: boolean;
}

function KpiCard({ label, value, sub, icon: Icon, colorVariant, isLoading }: KpiCardProps) {
  const tokens = APPROVAL_KPI_STRIP_TOKENS;
  const isUrgent = colorVariant === 'urgent';
  const numValue = Number(value);
  return (
    <div
      className={cn(
        tokens.card.base,
        tokens.card.hover,
        tokens.card.hoverWash,
        tokens.card.focus,
        tokens.borderColors[colorVariant],
        tokens.hoverWashBg[colorVariant]
      )}
      tabIndex={0}
      role="group"
      aria-label={label}
    >
      {/* 긴급 KPI pulse dot — 0보다 클 때만 */}
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
          <Skeleton className="h-8 w-14 mt-0.5" />
        ) : (
          <div className={tokens.value}>
            {value === '0' || value === '-' ? (
              <span className={tokens.valueEmpty}>{value === '0' ? '–' : value}</span>
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
 * 승인 KPI 스트립 — 4개 핵심 지표
 *
 * 1. 전체 대기 (total pending across all tabs)
 * 2. 긴급 (8일+ 경과)
 * 3. 평균 대기일
 * 4. 오늘 처리 (v1: 미지원)
 */
export function ApprovalKpiStrip({
  totalPending,
  urgentCount,
  avgWaitDays,
  todayProcessed,
  isLoading,
}: ApprovalKpiStripProps) {
  const t = useTranslations('approvals');

  return (
    <div className={APPROVAL_KPI_STRIP_TOKENS.container}>
      <KpiCard
        label={t('kpi.totalPending')}
        value={String(totalPending)}
        icon={ClipboardList}
        colorVariant="total"
        isLoading={isLoading}
      />
      <KpiCard
        label={t('kpi.urgentCount')}
        value={String(urgentCount)}
        sub={urgentCount > 0 ? t('kpi.urgentSub') : undefined}
        icon={AlertTriangle}
        colorVariant="urgent"
        isLoading={isLoading}
      />
      <KpiCard
        label={t('kpi.avgWait')}
        value={avgWaitDays > 0 ? String(avgWaitDays) : '-'}
        sub={avgWaitDays > 0 ? t('kpi.dayUnit') : undefined}
        icon={Clock}
        colorVariant="avgWait"
        isLoading={isLoading}
      />
      <KpiCard
        label={t('kpi.todayProcessed')}
        value={todayProcessed !== null ? String(todayProcessed) : '-'}
        sub={todayProcessed === null ? t('kpi.comingSoon') : undefined}
        icon={CheckCircle2}
        colorVariant="processed"
        isLoading={isLoading}
      />
    </div>
  );
}
