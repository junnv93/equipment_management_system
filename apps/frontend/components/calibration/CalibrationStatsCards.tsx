'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import {
  CALIBRATION_STATS_TEXT,
  CALIBRATION_KPI,
  getCalibrationKpiStaggerStyle,
  getCalibrationKpiAccentClasses,
  type CalibrationStatsType,
} from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface Stats {
  total: number;
  compliant: number;
  overdue: number;
  upcoming: number;
  completedThisQuarter: number;
}

interface Props {
  stats: Stats;
}

/**
 * KPI 카드별 네비게이션 목적지
 *
 * - total: 전체 장비 목록
 * - compliant: 네비게이션 없음 (total - overdue 파생값이므로 단일 필터 불가)
 * - overdue: 교정 기한 초과 장비 필터
 * - upcoming: 교정 예정 장비 필터
 */
const KPI_LINKS: Record<CalibrationStatsType, string | null> = {
  total: FRONTEND_ROUTES.EQUIPMENT.LIST,
  compliant: null,
  overdue: `${FRONTEND_ROUTES.EQUIPMENT.LIST}?calibrationDueFilter=overdue`,
  upcoming: `${FRONTEND_ROUTES.EQUIPMENT.LIST}?calibrationDueFilter=due_soon`,
};

function KpiCard({
  type,
  staggerIndex,
  children,
}: {
  type: CalibrationStatsType;
  staggerIndex: number;
  children: React.ReactNode;
}) {
  const href = KPI_LINKS[type];
  const cardClasses = `${CALIBRATION_KPI.card.base} ${getCalibrationKpiAccentClasses(type)} ${CALIBRATION_KPI.stagger}`;

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        <Card
          className={`${cardClasses} cursor-pointer`}
          style={getCalibrationKpiStaggerStyle(staggerIndex)}
        >
          {children}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClasses} style={getCalibrationKpiStaggerStyle(staggerIndex)}>
      {children}
    </Card>
  );
}

export default function CalibrationStatsCards({ stats }: Props) {
  const t = useTranslations('calibration');

  return (
    <div className={CALIBRATION_KPI.grid}>
      {/* Hero Card — 이번 달/30일 이내 도래 */}
      <KpiCard type="upcoming" staggerIndex={0}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.thisMonthDue')}</div>
          <div className={CALIBRATION_KPI.hero.value} data-testid="calibration-stat-upcoming">
            {stats.upcoming}
            <span className={CALIBRATION_KPI.hero.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
          <div className={CALIBRATION_KPI.hero.sub}>
            {t('content.stats.overdue')}{' '}
            <span className={CALIBRATION_KPI.hero.subCritical}>{stats.overdue}</span>
            {' · '}
            {t('content.stats.totalSmall')} {stats.total}
          </div>
        </CardContent>
      </KpiCard>

      {/* Compact — 기한 초과 */}
      <KpiCard type="overdue" staggerIndex={1}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.overdue')}</div>
          <div
            className={`${CALIBRATION_KPI.compact.value} ${CALIBRATION_STATS_TEXT.overdue}`}
            data-testid="calibration-stat-overdue"
          >
            {stats.overdue}
            <span className={CALIBRATION_KPI.compact.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
          <div className="text-xs text-muted-foreground">{t('content.stats.overdueHint')}</div>
        </CardContent>
      </KpiCard>

      {/* Compact — 정상 장비 */}
      <KpiCard type="compliant" staggerIndex={2}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.compliant')}</div>
          <div
            className={`${CALIBRATION_KPI.compact.value} ${CALIBRATION_STATS_TEXT.compliant}`}
            data-testid="calibration-stat-compliant"
          >
            {stats.compliant}
            <span className={CALIBRATION_KPI.compact.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
        </CardContent>
      </KpiCard>

      {/* Compact — 이번 분기 완료 대체 지표 */}
      <KpiCard type="total" staggerIndex={3}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.completedThisQuarter')}</div>
          <div
            className={`${CALIBRATION_KPI.compact.value} ${CALIBRATION_STATS_TEXT.compliant}`}
            data-testid="calibration-stat-completed-quarter"
          >
            {stats.completedThisQuarter}
            <span className={CALIBRATION_KPI.compact.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t('content.stats.approvedResultHint')}
          </div>
        </CardContent>
      </KpiCard>
    </div>
  );
}
