'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Database,
  Globe,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MONITORING_THRESHOLDS } from '@equipment-management/shared-constants';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { monitoringApi } from '@/lib/api/monitoring-api';
import {
  ELEVATION_TOKENS,
  DASHBOARD_ENTRANCE,
  getDashboardStaggerDelay,
  DASHBOARD_MOTION,
  FONT,
} from '@/lib/design-tokens';
import type {
  MonitoringMetrics,
  MonitoringStatus,
  MonitoringHttpStats,
  MonitoringCacheStats,
} from '@/lib/api/monitoring-api';

// ============================================================================
// Helpers
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * ms 단위 시간 포맷터.
 *
 * `null` 입력은 "미측정" 으로 해석하여 em-dash 를 반환한다 — pg Pool 레벨에서
 * 측정 불가한 DB 메트릭(avgQueryTime 등)이 프론트엔드에 nullable 로 노출됨.
 */
/** 백엔드 인프라 상태 문자열 — HealthStatus API 응답값 */
type ServiceStatus =
  | 'ok'
  | 'up'
  | 'healthy'
  | 'connected'
  | 'running'
  | 'operational'
  | 'warning'
  | 'degraded'
  | 'critical'
  | 'down'
  | 'error'
  | (string & Record<never, never>); // 미래 확장 허용 (string 낙타 대비)

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatusColor(
  status: ServiceStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'ok':
    case 'up':
    case 'healthy':
    case 'connected':
    case 'running':
    case 'operational':
      return 'default';
    case 'warning':
    case 'degraded':
      return 'secondary';
    case 'critical':
    case 'down':
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusIcon(status: ServiceStatus) {
  switch (status.toLowerCase()) {
    case 'ok':
    case 'up':
    case 'healthy':
    case 'connected':
    case 'running':
    case 'operational':
      return <CheckCircle2 className="h-4 w-4 text-brand-ok" />;
    case 'warning':
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-brand-warning" />;
    case 'critical':
    case 'down':
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

/** Gauge 바 색상 — brand 토큰 사용 */
function getGaugeColor(
  percentage: number,
  criticalThreshold: number,
  warningThreshold: number
): string {
  if (percentage >= criticalThreshold) return 'bg-destructive';
  if (percentage >= warningThreshold) return 'bg-brand-warning';
  return 'bg-brand-ok';
}

/** KPI 숫자 텍스트 색상 — brand 토큰 사용 */
function getKpiTextColor(
  value: number,
  criticalThreshold: number,
  warningThreshold: number
): string {
  if (value >= criticalThreshold) return 'text-destructive';
  if (value >= warningThreshold) return 'text-brand-warning';
  return 'text-brand-ok';
}

/** 백엔드 상태 문자열 → i18n 키 매핑 */
function getStatusTranslationKey(status: ServiceStatus): string {
  const map: Record<string, string> = {
    ok: 'ok',
    up: 'up',
    healthy: 'up',
    connected: 'up',
    running: 'up',
    operational: 'up',
    warning: 'warning',
    degraded: 'degraded',
    critical: 'critical',
    down: 'down',
    error: 'down',
  };
  return map[status.toLowerCase()] ?? status;
}

// ============================================================================
// Sub-components
// ============================================================================

function GaugeBar({
  value,
  label,
  icon,
  criticalThreshold = MONITORING_THRESHOLDS.CPU_PERCENT,
  warningThreshold = MONITORING_THRESHOLDS.RESOURCE_WARNING_PERCENT,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  criticalThreshold?: number;
  warningThreshold?: number;
}) {
  const percentage = Math.min(100, Math.max(0, value));
  const color = getGaugeColor(percentage, criticalThreshold, warningThreshold);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={`${FONT.mono} font-medium text-foreground`}>{percentage.toFixed(1)}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SimulatedBadge({ t }: { t: (key: string) => string }) {
  return (
    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
      {t('simulated')}
    </Badge>
  );
}

function SectionError({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
      <AlertTriangle className="h-6 w-6" />
      <p className="text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {retryLabel}
      </button>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

function HeroKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Section: Hero KPI Strip
// ============================================================================

function HeroKpiStrip({
  metrics,
  httpStats,
}: {
  metrics: MonitoringMetrics | undefined;
  httpStats: MonitoringHttpStats | undefined;
}) {
  const t = useTranslations('monitoring');

  const cpuValue = metrics?.cpu.usage ?? 0;
  const memValue = metrics?.memory.percentage ?? 0;
  const totalRequests = httpStats?.totalRequests ?? 0;
  const errorRate = httpStats?.errorRate ?? 0;

  const kpis = [
    {
      label: t('metrics.cpu'),
      value: `${cpuValue.toFixed(1)}%`,
      icon: <Cpu className="h-4 w-4" />,
      colorClass: getKpiTextColor(
        cpuValue,
        MONITORING_THRESHOLDS.CPU_PERCENT,
        MONITORING_THRESHOLDS.RESOURCE_WARNING_PERCENT
      ),
    },
    {
      label: t('metrics.memory'),
      value: `${memValue.toFixed(1)}%`,
      icon: <MemoryStick className="h-4 w-4" />,
      colorClass: getKpiTextColor(
        memValue,
        MONITORING_THRESHOLDS.MEMORY_PERCENT,
        MONITORING_THRESHOLDS.RESOURCE_WARNING_PERCENT
      ),
    },
    {
      label: t('http.totalRequests'),
      value: totalRequests.toLocaleString(),
      icon: <TrendingUp className="h-4 w-4" />,
      colorClass: 'text-brand-info',
    },
    {
      label: t('http.errorRate'),
      value: `${errorRate.toFixed(2)}%`,
      icon: <AlertTriangle className="h-4 w-4" />,
      colorClass: getKpiTextColor(
        errorRate,
        MONITORING_THRESHOLDS.ERROR_RATE_PERCENT,
        MONITORING_THRESHOLDS.ERROR_RATE_WARNING_PERCENT
      ),
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
      role="group"
      aria-label={t('sections.systemResources')}
    >
      {kpis.map((kpi, index) => (
        <div
          key={kpi.label}
          className={`rounded-lg border bg-card p-4 ${ELEVATION_TOKENS.shadow.medium} ${DASHBOARD_ENTRANCE.base} ${DASHBOARD_MOTION.statsCard}`}
          style={{ animationDelay: getDashboardStaggerDelay(index, 'grid') }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            {kpi.icon}
            <span className="text-xs font-medium" id={`kpi-label-${index}`}>
              {kpi.label}
            </span>
          </div>
          <p
            className={`mt-1 text-3xl font-bold ${FONT.kpi} ${kpi.colorClass}`}
            aria-labelledby={`kpi-label-${index}`}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Section: System Resources
// ============================================================================

function SystemResourcesSection({ data }: { data: MonitoringMetrics }) {
  const t = useTranslations('monitoring');

  return (
    <Card className={ELEVATION_TOKENS.shadow.subtle}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-4 w-4" />
          {t('sections.systemResources')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GaugeBar
          value={data.cpu.usage}
          label={t('metrics.cpu')}
          icon={<Cpu className="h-3.5 w-3.5" />}
        />
        <GaugeBar
          value={data.memory.percentage}
          label={`${t('metrics.memory')} (${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)})`}
          icon={<MemoryStick className="h-3.5 w-3.5" />}
          criticalThreshold={MONITORING_THRESHOLDS.MEMORY_PERCENT}
        />
        <GaugeBar
          value={
            data.storage.diskTotal > 0 ? (data.storage.diskUsage / data.storage.diskTotal) * 100 : 0
          }
          label={`${t('metrics.disk')} (${formatBytes(data.storage.diskUsage)} / ${formatBytes(data.storage.diskTotal)})`}
          icon={<HardDrive className="h-3.5 w-3.5" />}
        />

        {(data.storage.isSimulated || data.network.isSimulated) && <SimulatedBadge t={t} />}

        <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
          <div>
            <span className="text-muted-foreground">{t('metrics.uptime')}</span>
            <p className={`${FONT.mono} font-medium`}>{formatUptime(data.uptime)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('metrics.hostname')}</span>
            <p className={`${FONT.mono} font-medium truncate`} title={data.hostname}>
              {data.hostname}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('metrics.platform')}</span>
            <p className={`${FONT.mono} font-medium`}>
              {data.platform} ({data.arch})
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('metrics.nodeVersion')}</span>
            <p className={`${FONT.mono} font-medium`}>{data.nodeVersion}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Section: Service Health
// ============================================================================

function ServiceHealthSection({ data }: { data: MonitoringStatus }) {
  const t = useTranslations('monitoring');

  const services = [
    {
      key: 'database',
      label: t('services.database'),
      status: data.services.database.status,
      icon: Database,
    },
    { key: 'system', label: t('services.system'), status: data.services.system.status, icon: Cpu },
    { key: 'api', label: t('services.api'), status: data.services.api.status, icon: Globe },
    {
      key: 'logging',
      label: t('services.logging'),
      status: data.services.logging.status,
      icon: Activity,
    },
    { key: 'cache', label: t('services.cache'), status: data.services.cache.status, icon: Zap },
  ];

  return (
    <Card className={ELEVATION_TOKENS.shadow.subtle}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          {t('sections.serviceHealth')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((svc) => (
            <div key={svc.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svc.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{svc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(svc.status)}
                <Badge variant={getStatusColor(svc.status)} className="text-xs">
                  {t(`status.${getStatusTranslationKey(svc.status)}`)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="sr-only">{t('lastChecked')}:</span>
            {t('lastChecked')}: {new Date(data.lastChecked).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Section: HTTP Stats
// ============================================================================

function HttpStatsSection({ data }: { data: MonitoringHttpStats }) {
  const t = useTranslations('monitoring');

  return (
    <Card className={ELEVATION_TOKENS.shadow.subtle}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4" />
          {t('sections.httpStats')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-md border p-3 ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('http.totalRequests')}</p>
            <p className={`text-2xl font-bold ${FONT.kpi}`}>
              {data.totalRequests.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-md border p-3 ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('http.errorRate')}</p>
            <p
              className={`text-2xl font-bold ${FONT.kpi} ${getKpiTextColor(data.errorRate, MONITORING_THRESHOLDS.ERROR_RATE_PERCENT, MONITORING_THRESHOLDS.ERROR_RATE_WARNING_PERCENT)}`}
            >
              {data.errorRate.toFixed(2)}%
            </p>
          </div>
          <div className={`rounded-md border p-3 ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('http.successRequests')}</p>
            <p className={`text-2xl font-bold ${FONT.kpi} text-brand-ok`}>
              {data.successRequests.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-md border p-3 ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('http.errorRequests')}</p>
            <p
              className={`text-2xl font-bold ${FONT.kpi} ${data.errorRequests > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {data.errorRequests.toLocaleString()}
            </p>
          </div>
        </div>

        {data.topEndpoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('http.topEndpoints')}</h4>
            <div className="space-y-1">
              {data.topEndpoints.slice(0, 5).map((ep) => (
                <div key={ep.endpoint} className="flex items-center justify-between text-xs">
                  <span className={`${FONT.mono} truncate max-w-[60%]`} title={ep.endpoint}>
                    {ep.endpoint}
                  </span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{ep.count}x</span>
                    <span className={FONT.mono}>{formatMs(ep.avgResponseTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Section: Cache Performance
// ============================================================================

function CachePerformanceSection({ data }: { data: MonitoringCacheStats }) {
  const t = useTranslations('monitoring');
  const hitRatePercent = data.hitRate * 100;

  return (
    <Card className={ELEVATION_TOKENS.shadow.subtle}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          {t('sections.cachePerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GaugeBar
          value={hitRatePercent}
          label={t('cache.hitRate')}
          icon={<Zap className="h-3.5 w-3.5" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-md border p-3 ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('cache.hits')}</p>
            <p className={`text-2xl font-bold ${FONT.kpi} text-brand-ok`}>
              {data.hits.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-md border p-3 ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('cache.misses')}</p>
            <p className={`text-2xl font-bold ${FONT.kpi} text-brand-warning`}>
              {data.misses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">{t('cache.size')}</span>
            <p className={`${FONT.mono} font-medium`}>{data.size}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('cache.maxSize')}</span>
            <p className={`${FONT.mono} font-medium`}>{data.maxSize}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Section: Database Status
// ============================================================================

function DatabaseStatusSection({ data }: { data: MonitoringStatus }) {
  const t = useTranslations('monitoring');
  const db = data.services.database;

  return (
    <Card className={ELEVATION_TOKENS.shadow.subtle}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          {t('sections.dbStatus')}
          {db.isSimulated && <SimulatedBadge t={t} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(db.status)}
          <Badge variant={getStatusColor(db.status)}>
            {t(`status.${getStatusTranslationKey(db.status)}`)}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className={`rounded-md border p-3 text-center ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('db.connectionsAcquired')}</p>
            <p className={`text-lg font-bold ${FONT.kpi}`}>
              {db.metrics.connectionsAcquired.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-md border p-3 text-center ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('db.queriesFailed')}</p>
            <p
              className={`text-lg font-bold ${FONT.kpi} ${db.metrics.queriesFailed > 0 ? 'text-destructive' : 'text-brand-ok'}`}
            >
              {db.metrics.queriesFailed.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-md border p-3 text-center ${ELEVATION_TOKENS.shadow.subtle}`}>
            <p className="text-xs text-muted-foreground">{t('db.avgQueryTime')}</p>
            <p className={`text-lg font-bold ${FONT.kpi}`}>{formatMs(db.metrics.avgQueryTime)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
          <div>
            <span className="text-muted-foreground">{t('db.connectionsCreated')}</span>
            <p className={`${FONT.mono} font-medium`}>
              {db.metrics.connectionsCreated.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('db.connectionErrors')}</span>
            <p
              className={`${FONT.mono} font-medium ${db.metrics.connectionErrors > 0 ? 'text-destructive' : ''}`}
            >
              {db.metrics.connectionErrors.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MonitoringDashboardClient() {
  const t = useTranslations('monitoring');

  const metricsQuery = useQuery({
    queryKey: queryKeys.monitoring.metrics(),
    queryFn: () => monitoringApi.getMetrics(),
    ...QUERY_CONFIG.MONITORING,
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.monitoring.status(),
    queryFn: () => monitoringApi.getStatus(),
    ...QUERY_CONFIG.MONITORING,
  });

  const httpStatsQuery = useQuery({
    queryKey: queryKeys.monitoring.httpStats(),
    queryFn: () => monitoringApi.getHttpStats(),
    ...QUERY_CONFIG.MONITORING,
  });

  const cacheStatsQuery = useQuery({
    queryKey: queryKeys.monitoring.cacheStats(),
    queryFn: () => monitoringApi.getCacheStats(),
    ...QUERY_CONFIG.MONITORING,
  });

  const isHeroLoading = metricsQuery.isLoading || httpStatsQuery.isLoading;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">{t('autoRefresh')}</p>

      {/* Hero KPI Strip — elevated, larger numbers */}
      {isHeroLoading ? (
        <HeroKpiSkeleton />
      ) : (
        <HeroKpiStrip metrics={metricsQuery.data} httpStats={httpStatsQuery.data} />
      )}

      {/* Detail Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* System Resources */}
        <div
          className={`md:row-span-2 ${DASHBOARD_ENTRANCE.stagger.row1}`}
          style={{ animationDelay: getDashboardStaggerDelay(0, 'grid') }}
        >
          {metricsQuery.isLoading ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <SectionSkeleton />
              </CardContent>
            </Card>
          ) : metricsQuery.isError ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardContent>
                <SectionError
                  message={t('error.fetchFailed')}
                  retryLabel={t('error.retry')}
                  onRetry={() => metricsQuery.refetch()}
                />
              </CardContent>
            </Card>
          ) : metricsQuery.data ? (
            <SystemResourcesSection data={metricsQuery.data} />
          ) : null}
        </div>

        {/* Service Health */}
        <div
          className={DASHBOARD_ENTRANCE.stagger.row1}
          style={{ animationDelay: getDashboardStaggerDelay(1, 'grid') }}
        >
          {statusQuery.isLoading ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <SectionSkeleton />
              </CardContent>
            </Card>
          ) : statusQuery.isError ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardContent>
                <SectionError
                  message={t('error.fetchFailed')}
                  retryLabel={t('error.retry')}
                  onRetry={() => statusQuery.refetch()}
                />
              </CardContent>
            </Card>
          ) : statusQuery.data ? (
            <ServiceHealthSection data={statusQuery.data} />
          ) : null}
        </div>

        {/* Cache Performance */}
        <div
          className={DASHBOARD_ENTRANCE.stagger.row2}
          style={{ animationDelay: getDashboardStaggerDelay(2, 'grid') }}
        >
          {cacheStatsQuery.isLoading ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <SectionSkeleton />
              </CardContent>
            </Card>
          ) : cacheStatsQuery.isError ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardContent>
                <SectionError
                  message={t('error.fetchFailed')}
                  retryLabel={t('error.retry')}
                  onRetry={() => cacheStatsQuery.refetch()}
                />
              </CardContent>
            </Card>
          ) : cacheStatsQuery.data ? (
            <CachePerformanceSection data={cacheStatsQuery.data} />
          ) : null}
        </div>

        {/* HTTP Stats */}
        <div
          className={DASHBOARD_ENTRANCE.stagger.row2}
          style={{ animationDelay: getDashboardStaggerDelay(3, 'grid') }}
        >
          {httpStatsQuery.isLoading ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <SectionSkeleton />
              </CardContent>
            </Card>
          ) : httpStatsQuery.isError ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardContent>
                <SectionError
                  message={t('error.fetchFailed')}
                  retryLabel={t('error.retry')}
                  onRetry={() => httpStatsQuery.refetch()}
                />
              </CardContent>
            </Card>
          ) : httpStatsQuery.data ? (
            <HttpStatsSection data={httpStatsQuery.data} />
          ) : null}
        </div>

        {/* Database Status */}
        <div
          className={DASHBOARD_ENTRANCE.stagger.row3}
          style={{ animationDelay: getDashboardStaggerDelay(4, 'grid') }}
        >
          {statusQuery.isLoading ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <SectionSkeleton />
              </CardContent>
            </Card>
          ) : statusQuery.isError ? (
            <Card className={ELEVATION_TOKENS.shadow.subtle}>
              <CardContent>
                <SectionError
                  message={t('error.fetchFailed')}
                  retryLabel={t('error.retry')}
                  onRetry={() => statusQuery.refetch()}
                />
              </CardContent>
            </Card>
          ) : statusQuery.data ? (
            <DatabaseStatusSection data={statusQuery.data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
