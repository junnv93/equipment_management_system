'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DASHBOARD_SYSTEM_HEALTH_TOKENS as T } from '@/lib/design-tokens';
import {
  resolveSystemHealthGaugePct,
  resolveSystemHealthOverallTone,
  resolveSystemHealthTone,
  type SystemHealthMetric,
  type SystemHealthTone,
} from '@/lib/design-tokens/components/dday-tone';
import type { SystemHealthMetrics } from '@/lib/api/dashboard-api';

interface SystemHealthCardProps {
  metrics?: SystemHealthMetrics;
  loading?: boolean;
}

const TONE_VALUE_CLASS: Record<SystemHealthTone, string> = {
  ok: T.statusOk,
  warn: T.statusWarning,
  danger: T.statusCritical,
};

const TONE_FILL_CLASS: Record<SystemHealthTone, string> = {
  ok: T.gauge.fillOk,
  warn: T.gauge.fillWarn,
  danger: T.gauge.fillDanger,
};

const TONE_PILL_CLASS: Record<SystemHealthTone, string> = {
  ok: T.statusPill.ok,
  warn: T.statusPill.warn,
  danger: T.statusPill.danger,
};

interface HealthRowProps {
  label: string;
  value: string;
  unit?: string;
  metric: SystemHealthMetric;
  rawValue: number;
  capacity?: number;
  /** dbMs 행은 임계값과 무관하게 info 톤(파랑)으로 표기 (명세서 §3.9). */
  forceInfoValueTone?: boolean;
}

function HealthRow({
  label,
  value,
  unit,
  metric,
  rawValue,
  capacity,
  forceInfoValueTone,
}: HealthRowProps) {
  const tone = resolveSystemHealthTone(metric, rawValue, capacity);
  const gaugePct = resolveSystemHealthGaugePct(metric, rawValue, capacity);
  const valueClass = forceInfoValueTone ? T.statusInfo : TONE_VALUE_CLASS[tone];

  return (
    <div className={T.statusItem}>
      <span className={T.statusLabel}>{label}</span>
      <span className={cn(T.statusValue, valueClass)}>
        {value}
        {unit ? <span className={T.statusUnit}>{unit}</span> : null}
      </span>
      <div
        className={T.gauge.track}
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(gaugePct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className={cn(T.gauge.fillBase, TONE_FILL_CLASS[tone])}
          style={{ width: `${gaugePct}%` }}
        />
      </div>
    </div>
  );
}

export function SystemHealthCard({ metrics, loading = false }: SystemHealthCardProps) {
  const t = useTranslations('dashboard.systemHealth');

  if (loading) {
    return (
      <div className={T.container}>
        <div className={T.header}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className={T.statusGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={T.statusItem}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-1.5 w-full mt-1.5" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  // 백엔드 미연결 / 에러 시 fallback 0값으로 렌더 (CLS 방지) — Phase C2에서 hook 연결 후 자동 채워짐.
  const safe: SystemHealthMetrics = metrics ?? {
    overallStatus: 'healthy',
    activeUsers: 0,
    maxUsers: 0,
    dbResponseMs: 0,
    storagePct: 0,
    queueSize: 0,
    errorCount24h: 0,
  };

  const overallTone = resolveSystemHealthOverallTone(safe.overallStatus);
  const overallLabel =
    safe.overallStatus === 'healthy'
      ? t('statusHealthy')
      : safe.overallStatus === 'degraded'
        ? t('statusDegraded')
        : t('statusDown');

  return (
    <section className={T.container} role="region" aria-label={t('ariaLabel')}>
      <header className={T.header}>
        <div className="flex flex-col gap-0.5">
          <span className={T.title}>{t('title')}</span>
          <span className={T.subtitle}>{t('subtitle')}</span>
        </div>
        <span
          className={cn(T.statusPill.base, TONE_PILL_CLASS[overallTone])}
          aria-label={overallLabel}
        >
          <span aria-hidden="true">●</span>
          {overallLabel}
        </span>
      </header>

      <div className={T.statusGrid}>
        <HealthRow
          label={t('activeUsers')}
          value={`${safe.activeUsers} / ${safe.maxUsers}`}
          metric="activeUsers"
          rawValue={safe.activeUsers}
          capacity={safe.maxUsers}
        />
        <HealthRow
          label={t('dbResponseMs')}
          value={`${safe.dbResponseMs}`}
          unit={t('unitMs')}
          metric="dbMs"
          rawValue={safe.dbResponseMs}
          forceInfoValueTone
        />
        <HealthRow
          label={t('storage')}
          value={`${safe.storagePct}`}
          unit={t('unitPct')}
          metric="storage"
          rawValue={safe.storagePct}
        />
        <HealthRow
          label={t('queue')}
          value={`${safe.queueSize}`}
          metric="queue"
          rawValue={safe.queueSize}
        />
      </div>

      <div className={T.footer}>
        <span className={T.footerLabel}>{t('errorsLast24h')}</span>
        <span className={T.footerValue}>{t('errorsValue', { count: safe.errorCount24h })}</span>
      </div>
    </section>
  );
}
