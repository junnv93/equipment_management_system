'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Filter, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { PageHeader } from '@/components/shared/PageHeader';
import CalibrationListTable from '@/components/calibration/CalibrationListTable';
import { useAuth } from '@/hooks/use-auth';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import calibrationApi, {
  type CalibrationHistory,
  type CalibrationApprovalStatus,
} from '@/lib/api/calibration-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  CALIBRATION_FILTER_BAR,
  CONTENT_TOKENS,
  getPageContainerClasses,
  getSemanticContainerClasses,
  getSemanticContainerTextClasses,
} from '@/lib/design-tokens';
import { Permission, SELECTOR_PAGE_SIZE } from '@equipment-management/shared-constants';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';

interface CalibrationHistoryClientProps {
  equipmentId: string;
  initialEquipment: Equipment;
}

type ApprovalFilter = '' | CalibrationApprovalStatus;
type ResultFilter = '' | 'pass' | 'fail' | 'conditional';

interface DerivedStats {
  total: number;
  overdue: number;
  upcoming: number;
  passed: number;
  failed: number;
}

const UPCOMING_DAYS = 30;

/**
 * 장비별 교정 이력 — `/equipment/[id]/calibration-history` sub-route Client.
 *
 * **역할 분리 (Option C — Tab vs Sub 중복 architecture closure)**:
 * - Tab(`?tab=calibration`)이 ``CalibrationHistoryTab`` 요약 노출 — equipment 컨텍스트 빠른 훑기.
 * - 본 Client는 *집중적 calibration 이력 관리* — 통계 + 필터 + full table 노출.
 * - ``CalibrationHistoryTab`` 직접 재사용 0건 — Tab과 다른 책임 명확.
 *
 * 데이터 SSOT 공유 패턴:
 * - 같은 backend endpoint(`getCalibrationHistory({ equipmentId })`)로 단일 장비 필터 결과 fetch.
 * - 표시 책임만 분리 (요약 카드 vs 통계 + 필터 + 풀 테이블).
 */
export function CalibrationHistoryClient({
  equipmentId,
  initialEquipment,
}: CalibrationHistoryClientProps) {
  const t = useTranslations('equipment.calibrationHistoryClient');
  const { can } = useAuth();
  const canCreate = can(Permission.CREATE_CALIBRATION);
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  // 장비 정보 (placeholderData로 server prefetch hydrate)
  const { data: equipment } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    placeholderData: initialEquipment,
    ...QUERY_CONFIG.EQUIPMENT_DETAIL,
  });
  const resolvedEquipment = equipment ?? initialEquipment;

  useEffect(() => {
    const label = `${resolvedEquipment.name} (${resolvedEquipment.managementNumber})`;
    setDynamicLabel(equipmentId, label);
    return () => clearDynamicLabel(equipmentId);
  }, [equipmentId, resolvedEquipment, setDynamicLabel, clearDynamicLabel]);

  // 단일 장비 calibration history (`equipmentId` filter — 같은 endpoint, cache key 분리)
  const historyParams = useMemo(
    () => ({ equipmentId, pageSize: SELECTOR_PAGE_SIZE }),
    [equipmentId]
  );
  const { data: historyData, isLoading } = useQuery({
    queryKey: queryKeys.calibrations.historyList(historyParams),
    queryFn: () => calibrationApi.getCalibrationHistory(historyParams),
    ...QUERY_CONFIG.CALIBRATION_LIST,
  });
  const calibrations = useMemo<CalibrationHistory[]>(() => historyData?.data ?? [], [historyData]);

  // 필터 state — useState (URL 동기화는 후속 sprint trigger)
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const approvalSelect = useFilterSelect<ApprovalFilter>(approvalFilter, setApprovalFilter, 'all');
  const resultSelect = useFilterSelect<ResultFilter>(resultFilter, setResultFilter, 'all');

  // Frontend filter
  const filtered = useMemo(() => {
    return calibrations.filter((c) => {
      if (approvalFilter && c.approvalStatus !== approvalFilter) return false;
      if (resultFilter && c.result !== resultFilter) return false;
      if (dateFrom && c.calibrationDate < dateFrom) return false;
      if (dateTo && c.calibrationDate > dateTo) return false;
      return true;
    });
  }, [calibrations, approvalFilter, resultFilter, dateFrom, dateTo]);

  // Derived stats — 단일 장비 컨텍스트 read-only 표시
  const stats: DerivedStats = useMemo(() => {
    const now = new Date();
    const upcomingThreshold = new Date(now.getTime() + UPCOMING_DAYS * 86_400_000);
    let overdue = 0;
    let upcoming = 0;
    let passed = 0;
    let failed = 0;
    for (const c of calibrations) {
      const next = c.nextCalibrationDate ? new Date(c.nextCalibrationDate) : null;
      if (next) {
        if (next < now) overdue += 1;
        else if (next <= upcomingThreshold) upcoming += 1;
      }
      if (c.result === 'pass') passed += 1;
      else if (c.result === 'fail') failed += 1;
    }
    return { total: calibrations.length, overdue, upcoming, passed, failed };
  }, [calibrations]);

  const isOverdue =
    resolvedEquipment.nextCalibrationDate != null &&
    new Date(resolvedEquipment.nextCalibrationDate) < new Date();

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader
        title={t('title')}
        subtitle={`${resolvedEquipment.name} (${resolvedEquipment.managementNumber})`}
        backUrl={`/equipment/${equipmentId}`}
        backLabel={t('backAriaLabel')}
      />

      {isOverdue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('overdueAlert.title')}</AlertTitle>
          <AlertDescription>{t('overdueAlert.description')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={t('stats.total')}
          value={stats.total}
          tone="info"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label={t('stats.overdue')}
          value={stats.overdue}
          tone={stats.overdue > 0 ? 'critical' : 'info'}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t('stats.upcoming')}
          value={stats.upcoming}
          tone={stats.upcoming > 0 ? 'warning' : 'info'}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={t('stats.passed')}
          value={stats.passed}
          tone="success"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label={t('stats.failed')}
          value={stats.failed}
          tone={stats.failed > 0 ? 'critical' : 'info'}
        />
      </div>

      <div className={CALIBRATION_FILTER_BAR.container}>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label={t('filters.dateFrom')}
          className="h-8 w-[140px] text-xs"
        />
        <span className="text-muted-foreground text-xs" aria-hidden>
          ~
        </span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label={t('filters.dateTo')}
          className="h-8 w-[140px] text-xs"
        />

        <div className={CALIBRATION_FILTER_BAR.divider} aria-hidden="true" />

        <Select {...approvalSelect}>
          <SelectTrigger
            className="h-8 w-[120px] text-xs"
            aria-label={t('filters.approvalStatusLabel')}
          >
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder={t('filters.approvalStatusLabel')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.approvalStatusAll')}</SelectItem>
            <SelectItem value="pending_approval">
              {t('filters.approvalOptions.pending_approval')}
            </SelectItem>
            <SelectItem value="approved">{t('filters.approvalOptions.approved')}</SelectItem>
            <SelectItem value="rejected">{t('filters.approvalOptions.rejected')}</SelectItem>
          </SelectContent>
        </Select>

        <Select {...resultSelect}>
          <SelectTrigger className="h-8 w-[110px] text-xs" aria-label={t('filters.resultLabel')}>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder={t('filters.resultLabel')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.resultAll')}</SelectItem>
            <SelectItem value="pass">{t('filters.resultOptions.pass')}</SelectItem>
            <SelectItem value="fail">{t('filters.resultOptions.fail')}</SelectItem>
            <SelectItem value="conditional">{t('filters.resultOptions.conditional')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CalibrationListTable data={filtered} isLoading={isLoading} canRegister={canCreate} />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'info' | 'success' | 'warning' | 'critical';
}

function StatCard({ icon, label, value, tone }: StatCardProps) {
  const containerClass = getSemanticContainerClasses(tone);
  const textClass = getSemanticContainerTextClasses(tone);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-1 pt-3">
        <span className={`${textClass}`} aria-hidden>
          {icon}
        </span>
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className={`pt-0 pb-3 ${containerClass}`}>
        <p className={`text-2xl font-bold ${CONTENT_TOKENS.numeric.tabular} ${textClass}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
