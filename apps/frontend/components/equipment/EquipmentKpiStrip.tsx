'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, MapPin, FileOutput, Wrench, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useEquipmentKpiData } from '@/hooks/use-equipment-kpi';
import type { Equipment } from '@/lib/api/equipment-api';
import { EQUIPMENT_KPI_STRIP_TOKENS, type KpiColorVariant } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';

interface EquipmentKpiStripProps {
  equipment: Equipment;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorVariant: KpiColorVariant;
  onClick: () => void;
  isLoading?: boolean;
  /** 숫자 카운트 값 여부 — true이면 font-mono tabular-nums 적용 */
  numeric?: boolean;
  /** 접근성: 해당 탭으로 이동함을 명시하는 aria-label */
  navigateLabel: string;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  colorVariant,
  onClick,
  isLoading,
  numeric = false,
  navigateLabel,
}: KpiCardProps) {
  const tokens = EQUIPMENT_KPI_STRIP_TOKENS;
  const valueClass = numeric ? tokens.numericValue : tokens.value;
  return (
    <button
      onClick={onClick}
      aria-label={navigateLabel}
      className={cn(
        tokens.card.base,
        tokens.card.hover,
        tokens.card.focus,
        tokens.borderColors[colorVariant]
      )}
      type="button"
    >
      <div className={cn(tokens.iconContainer, tokens.iconBg[colorVariant])}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={tokens.label}>{label}</div>
        {isLoading ? (
          <Skeleton className="h-6 w-12 mt-0.5" />
        ) : (
          <div className={valueClass}>{value}</div>
        )}
        {sub && !isLoading && <div className={tokens.sub}>{sub}</div>}
      </div>
    </button>
  );
}

/**
 * 장비 KPI 스트립 — 5개 핵심 지표 카드
 *
 * 1. 다음 교정일 (D-day)
 * 2. 현재 위치
 * 3. 반출 이력 카운트
 * 4. 유지보수 카운트
 * 5. 사고 이력 카운트
 *
 * 클릭 시 해당 탭으로 이동 (URL query param ?tab=xxx)
 */
export function EquipmentKpiStrip({ equipment }: EquipmentKpiStripProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const equipmentId = String(equipment.id);

  const { checkouts, maintenance, incidents } = useEquipmentKpiData(equipmentId);

  const navigateToTab = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  // 교정 D-day 계산
  const getCalibrationDisplay = (): { value: string; sub?: string; variant: KpiColorVariant } => {
    if (!equipment.calibrationRequired || equipment.calibrationMethod === 'not_applicable') {
      return { value: t('kpiStrip.notApplicable'), variant: 'neutral' };
    }
    if (!equipment.nextCalibrationDate) {
      return { value: '-', variant: 'neutral' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(equipment.nextCalibrationDate);
    next.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        value: t('kpiStrip.overdue', { days: Math.abs(diffDays) }),
        sub: fmtDate(equipment.nextCalibrationDate) ?? undefined,
        variant: 'warn',
      };
    }
    return {
      value: diffDays === 0 ? 'D-0' : t('kpiStrip.dday', { days: diffDays }),
      sub: fmtDate(equipment.nextCalibrationDate) ?? undefined,
      variant: diffDays <= 7 ? 'warn' : 'ok',
    };
  };

  const calibration = getCalibrationDisplay();

  // 현재 위치: 물리적 위치(value) + 팀명(sub) 분리
  const locationValue = equipment.location || '-';
  const locationSub = equipment.teamName || undefined;

  const formatCount = (count?: number) =>
    count !== undefined ? t('kpiStrip.count', { count }) : '-';

  const formatLastDate = (date?: string | Date | null) => {
    if (!date) return undefined;
    const dateStr = date instanceof Date ? date.toISOString() : date;
    return t('kpiStrip.lastDate', { date: fmtDate(dateStr) ?? dateStr });
  };

  return (
    <div className={EQUIPMENT_KPI_STRIP_TOKENS.container}>
      {/* 1. 다음 교정일 */}
      <KpiCard
        label={t('kpiStrip.nextCalibration')}
        value={calibration.value}
        sub={calibration.sub}
        icon={Calendar}
        colorVariant={calibration.variant}
        onClick={() => navigateToTab('calibration')}
        navigateLabel={t('kpiStrip.navigateTo', { label: t('kpiStrip.nextCalibration') })}
      />

      {/* 2. 현재 위치 — 물리적 위치(value) + 팀명(sub) */}
      <KpiCard
        label={t('kpiStrip.currentLocation')}
        value={locationValue}
        sub={locationSub}
        icon={MapPin}
        colorVariant="info"
        onClick={() => navigateToTab('location')}
        navigateLabel={t('kpiStrip.navigateTo', { label: t('kpiStrip.currentLocation') })}
      />

      {/* 3. 반출 이력 — 카운트 → numeric={true} (font-mono tabular-nums) */}
      <KpiCard
        label={t('kpiStrip.checkoutHistory')}
        value={formatCount(checkouts.data?.total)}
        sub={formatLastDate(checkouts.data?.lastDate)}
        icon={FileOutput}
        colorVariant="neutral"
        numeric
        onClick={() => navigateToTab('checkout')}
        isLoading={checkouts.isLoading}
        navigateLabel={t('kpiStrip.navigateTo', { label: t('kpiStrip.checkoutHistory') })}
      />

      {/* 4. 유지보수 — 카운트 → numeric={true} */}
      <KpiCard
        label={t('kpiStrip.maintenance')}
        value={formatCount(maintenance.data?.total)}
        sub={formatLastDate(maintenance.data?.lastDate)}
        icon={Wrench}
        colorVariant="neutral"
        numeric
        onClick={() => navigateToTab('maintenance')}
        isLoading={maintenance.isLoading}
        navigateLabel={t('kpiStrip.navigateTo', { label: t('kpiStrip.maintenance') })}
      />

      {/* 5. 사고 이력 — 카운트 → numeric={true} */}
      <KpiCard
        label={t('kpiStrip.incidentHistory')}
        value={formatCount(incidents.data?.total)}
        sub={
          (incidents.data?.total ?? 0) > 0
            ? formatLastDate(incidents.data?.lastDate)
            : t('kpiStrip.noRecord')
        }
        icon={AlertTriangle}
        colorVariant={(incidents.data?.total ?? 0) > 0 ? 'warn' : 'neutral'}
        numeric
        onClick={() => navigateToTab('incident')}
        isLoading={incidents.isLoading}
        navigateLabel={t('kpiStrip.navigateTo', { label: t('kpiStrip.incidentHistory') })}
      />
    </div>
  );
}
