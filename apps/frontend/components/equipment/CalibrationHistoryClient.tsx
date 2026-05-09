'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useEquipmentCalibrationHistory } from '@/hooks/use-equipment-calibrations';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { type CalibrationHistory } from '@/lib/api/calibration-api';
import {
  CALIBRATION_APPROVAL_STATUS_VALUES,
  CALIBRATION_RESULT_VALUES,
  type CalibrationApprovalStatus,
  type CalibrationResult,
} from '@equipment-management/schemas';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  CALIBRATION_FILTER_BAR,
  CALIBRATION_THRESHOLDS,
  CONTENT_TOKENS,
  getPageContainerClasses,
  getSemanticContainerClasses,
  getSemanticContainerTextClasses,
} from '@/lib/design-tokens';
import {
  FRONTEND_ROUTES,
  Permission,
  SELECTOR_PAGE_SIZE,
} from '@equipment-management/shared-constants';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';
import type { UICalibrationFilters } from '@/lib/utils/calibration-filter-utils';

interface CalibrationHistoryClientProps {
  equipmentId: string;
  initialEquipment: Equipment;
  initialFilters?: UICalibrationFilters;
}

type ApprovalFilter = '' | CalibrationApprovalStatus;
type ResultFilter = '' | CalibrationResult;

interface DerivedStats {
  total: number;
  overdue: number;
  upcoming: number;
  passed: number;
  failed: number;
}

/**
 * 장비별 교정 이력 — `/equipment/[id]/calibration-history` sub-route Client (ADR-0009 Option C).
 *
 * **역할 분리 (Tab vs Sub-route)**:
 * - Tab(`CalibrationHistoryTab`): 요약 + 빠른 컨텍스트 확인 전용.
 * - 본 Client: 집중적 교정 이력 관리 — 통계 카드 5종 + 날짜/승인상태/결과 필터 + 전체 목록.
 * - `CalibrationHistoryTab` 직접 재사용 0건 — Tab과 다른 책임 명확.
 *
 * 데이터 SSOT 공유 패턴:
 * - 같은 backend endpoint(`getCalibrationHistory({ equipmentId })`)로 단일 장비 필터 결과 fetch.
 * - 표시 책임만 분리 (요약 카드 vs 통계 + 필터 + 풀 테이블).
 */
export function CalibrationHistoryClient({
  equipmentId,
  initialEquipment,
  initialFilters,
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

  // 단일 장비 calibration history — hook SSOT (queryKey/queryFn/QUERY_CONFIG pairing 결빙)
  const {
    data: historyData,
    isLoading,
    isError,
  } = useEquipmentCalibrationHistory(equipmentId, {
    pageSize: SELECTOR_PAGE_SIZE,
  });
  const calibrations = useMemo<CalibrationHistory[]>(() => historyData?.data ?? [], [historyData]);

  // 필터 SSOT — URL 파라미터 (메인 `/calibration` 키 일관: approvalStatus/result/startDate/endDate)
  // 빈 값 + sentinel `_all` 모두 URL 미포함 (clean URLs). useFilterSelect 기본 sentinel `_all` 사용.
  // 메인 URL 호환: 사용자가 `?approvalStatus=_all` deep-link 진입 시 `_all` 을 빈 값 처리해 silent miss 차단.
  const router = useRouter();
  const searchParams = useSearchParams();
  const approvalRaw = searchParams.get('approvalStatus') ?? initialFilters?.approvalStatus ?? '';
  const approvalFilter: ApprovalFilter =
    approvalRaw === '_all' ? '' : (approvalRaw as ApprovalFilter);
  const resultRaw = searchParams.get('result') ?? initialFilters?.result ?? '';
  const resultFilter: ResultFilter = resultRaw === '_all' ? '' : (resultRaw as ResultFilter);
  const dateFrom = searchParams.get('startDate') ?? initialFilters?.startDate ?? '';
  const dateTo = searchParams.get('endDate') ?? initialFilters?.endDate ?? '';

  const updateFilter = useCallback(
    (key: 'approvalStatus' | 'result' | 'startDate' | 'endDate', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      // sentinel `_all` + 빈 값 모두 URL 에서 제거 (clean URLs + 메인 일관 sentinel 호환)
      if (value && value !== '_all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      const baseUrl = FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_HISTORY(equipmentId);
      router.replace(queryString ? `${baseUrl}?${queryString}` : baseUrl, { scroll: false });
    },
    [equipmentId, router, searchParams]
  );

  const setApprovalFilter = useCallback(
    (v: ApprovalFilter) => updateFilter('approvalStatus', v),
    [updateFilter]
  );
  const setResultFilter = useCallback(
    (v: ResultFilter) => updateFilter('result', v),
    [updateFilter]
  );
  const setDateFrom = useCallback((v: string) => updateFilter('startDate', v), [updateFilter]);
  const setDateTo = useCallback((v: string) => updateFilter('endDate', v), [updateFilter]);

  // sentinel `_all` — 메인 `/calibration` 일관 (`useFilterSelect` 기본값). 사용자가 메인 URL 의
  // `?approvalStatus=_all` 을 sub-route 에 paste 시 호환 (sentinel 불일치로 인한 silent filter miss 차단).
  const approvalSelect = useFilterSelect<ApprovalFilter>(approvalFilter, setApprovalFilter);
  const resultSelect = useFilterSelect<ResultFilter>(resultFilter, setResultFilter);

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
    const upcomingThreshold = new Date(
      now.getTime() + CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS * 86_400_000
    );
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
    <div className={getPageContainerClasses('list')}>
      <PageHeader
        title={t('title')}
        subtitle={`${resolvedEquipment.name} (${resolvedEquipment.managementNumber})`}
        backUrl={FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentId)}
        backLabel={t('backAriaLabel')}
      />

      {isError && (
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errorAlert.title')}</AlertTitle>
          <AlertDescription>{t('errorAlert.description')}</AlertDescription>
        </Alert>
      )}

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
            <SelectItem value="_all">{t('filters.approvalStatusAll')}</SelectItem>
            {CALIBRATION_APPROVAL_STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`filters.approvalOptions.${status}`)}
              </SelectItem>
            ))}
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
            <SelectItem value="_all">{t('filters.resultAll')}</SelectItem>
            {CALIBRATION_RESULT_VALUES.map((result) => (
              <SelectItem key={result} value={result}>
                {t(`filters.resultOptions.${result}`)}
              </SelectItem>
            ))}
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
