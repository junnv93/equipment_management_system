'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';
import { DASHBOARD_SYSTEM_HEALTH_TOKENS as T } from '@/lib/design-tokens';
import {
  resolveSystemHealthGaugePct,
  resolveSystemHealthOverallTone,
  resolveSystemHealthTone,
  type SystemHealthMetric,
  type SystemHealthTone,
} from '@/lib/design-tokens/components/dday-tone';
import type { SystemHealthMetrics } from '@/lib/api/dashboard-api';
import type {
  SystemHealthStorageBackend,
  SystemHealthQueueBackend,
  SystemHealthErrorSource,
} from '@equipment-management/shared-constants';

type BackendKey = SystemHealthStorageBackend | SystemHealthQueueBackend | SystemHealthErrorSource;
type BackendCategory = 'storage' | 'queue' | 'error';

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

interface BackendBadgeProps {
  category: BackendCategory;
  backend: BackendKey;
}

/**
 * Transparency 배지 — 작은 ⓘ 트리거 + Tooltip으로 backend 식별자 의미 노출.
 * Radix Tooltip이 keyboard accessible + aria-describedby 자동 wiring.
 */
function BackendBadge({ category, backend }: BackendBadgeProps) {
  const t = useTranslations('dashboard.systemHealth');
  const tooltipText = t(`backend.${category}.${backend}`);
  const triggerLabel = t('backendInfoLabel');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={T.backendInfoTrigger}
          aria-label={`${triggerLabel}: ${tooltipText}`}
        >
          <Info className={T.backendInfoIcon} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

interface HealthRowProps {
  label: string;
  value: string;
  unit?: string;
  metric: SystemHealthMetric;
  rawValue: number;
  capacity?: number;
  /** dbMs 행은 임계값과 무관하게 info 톤(파랑)으로 표기 (명세서 §3.9). */
  forceInfoValueTone?: boolean;
  /** Transparency 배지 — backend 식별자 표시 (storage/queue/error). 미지정 시 배지 미렌더. */
  backendBadge?: { category: BackendCategory; backend: BackendKey };
  /** pg-database 같은 측정 불가 케이스에 inline "측정 불가" 라벨 표시. */
  unmeasuredLabel?: string;
  /** 측정 불가 sibling hint — 부분 측정 가능한 정보 노출 (예: pg-database 모드의 DB 크기). */
  unmeasuredHint?: string;
}

function HealthRow({
  label,
  value,
  unit,
  metric,
  rawValue,
  capacity,
  forceInfoValueTone,
  backendBadge,
  unmeasuredLabel,
  unmeasuredHint,
}: HealthRowProps) {
  const tone = resolveSystemHealthTone(metric, rawValue, capacity);
  const gaugePct = resolveSystemHealthGaugePct(metric, rawValue, capacity);
  const valueClass = forceInfoValueTone ? T.statusInfo : TONE_VALUE_CLASS[tone];

  return (
    <div className={T.statusItem}>
      <span className={T.statusLabel}>
        {label}
        {backendBadge ? (
          <>
            {' '}
            <BackendBadge category={backendBadge.category} backend={backendBadge.backend} />
          </>
        ) : null}
      </span>
      <span className={cn(T.statusValue, valueClass)}>
        {value}
        {unit ? <span className={T.statusUnit}>{unit}</span> : null}
        {unmeasuredLabel ? (
          <span className={T.backendUnmeasured} data-testid="health-row-unmeasured">
            {unmeasuredLabel}
          </span>
        ) : null}
        {unmeasuredHint ? (
          <span className={T.backendUnmeasuredHint} data-testid="health-row-unmeasured-hint">
            {unmeasuredHint}
          </span>
        ) : null}
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
    storageBackend: 'host-disk',
    queueBackend: 'pending-work-aggregate',
    errorSource: 'system-error-events',
    dbSizeBytes: 0,
  };
  const isStorageUnmeasured = safe.storageBackend === 'pg-database';

  const overallTone = resolveSystemHealthOverallTone(safe.overallStatus);
  const overallLabel =
    safe.overallStatus === 'healthy'
      ? t('statusHealthy')
      : safe.overallStatus === 'degraded'
        ? t('statusDegraded')
        : t('statusDown');

  return (
    <TooltipProvider delayDuration={150}>
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
            backendBadge={{ category: 'storage', backend: safe.storageBackend }}
            unmeasuredLabel={isStorageUnmeasured ? t('unmeasured') : undefined}
            unmeasuredHint={
              isStorageUnmeasured && safe.dbSizeBytes > 0
                ? t('dbSizeHint', { size: formatFileSize(safe.dbSizeBytes) })
                : undefined
            }
          />
          <HealthRow
            label={t('queue')}
            value={`${safe.queueSize}`}
            metric="queue"
            rawValue={safe.queueSize}
            backendBadge={{ category: 'queue', backend: safe.queueBackend }}
          />
        </div>

        <div className={T.footer}>
          <span className={T.footerLabel}>
            {t('errorsLast24h')} <BackendBadge category="error" backend={safe.errorSource} />
          </span>
          <span className={T.footerValue}>{t('errorsValue', { count: safe.errorCount24h })}</span>
        </div>
      </section>
    </TooltipProvider>
  );
}
