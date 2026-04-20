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
      {/* Hero Card — 전체 관리 장비 (1.8fr) */}
      <KpiCard type="total" staggerIndex={0}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.total')}</div>
          <div className={CALIBRATION_KPI.hero.value} data-testid="calibration-stat-total">
            {stats.total}
            <span className={CALIBRATION_KPI.hero.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
          <div className={CALIBRATION_KPI.hero.sub}>
            {t('content.stats.compliant')}{' '}
            <span className={CALIBRATION_KPI.hero.subOk}>{stats.compliant}</span>
            {' · '}
            {t('content.stats.overdue')}{' '}
            <span className={CALIBRATION_KPI.hero.subCritical}>{stats.overdue}</span>
            {' · '}
            {t('content.stats.upcoming')} {stats.upcoming}
          </div>
        </CardContent>
      </KpiCard>

      {/* Compact — 교정 적합 (링크 없음: total - overdue 파생값) */}
      <KpiCard type="compliant" staggerIndex={1}>
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

      {/* Compact — 기한 초과 */}
      <KpiCard type="overdue" staggerIndex={2}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.overdue')}</div>
          <div
            className={`${CALIBRATION_KPI.compact.value} ${CALIBRATION_STATS_TEXT.overdue}`}
            data-testid="calibration-stat-overdue"
          >
            {stats.overdue}
            <span className={CALIBRATION_KPI.compact.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
        </CardContent>
      </KpiCard>

      {/* Compact — 교정 예정 (30일) */}
      <KpiCard type="upcoming" staggerIndex={3}>
        <CardContent className="pt-5 pb-4">
          <div className={CALIBRATION_KPI.label}>{t('content.stats.upcoming')}</div>
          <div
            className={`${CALIBRATION_KPI.compact.value} ${CALIBRATION_STATS_TEXT.upcoming}`}
            data-testid="calibration-stat-upcoming"
          >
            {stats.upcoming}
            <span className={CALIBRATION_KPI.compact.unit}>{t('content.stats.unitSuffix')}</span>
          </div>
        </CardContent>
      </KpiCard>
    </div>
  );
}
