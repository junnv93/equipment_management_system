'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { CALIBRATION_STATS_TEXT, getKpiCounterClasses } from '@/lib/design-tokens';

interface Stats {
  total: number;
  compliant: number;
  overdue: number;
  upcoming: number;
}

interface Props {
  stats: Stats;
}

export default function CalibrationStatsCards({ stats }: Props) {
  const t = useTranslations('calibration');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('content.stats.total')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl ${getKpiCounterClasses()} ${CALIBRATION_STATS_TEXT.total}`}>
            {t('content.stats.unit', { count: stats.total })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('content.stats.compliant')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl ${getKpiCounterClasses()} ${CALIBRATION_STATS_TEXT.compliant}`}>
            {t('content.stats.unit', { count: stats.compliant })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('content.stats.overdue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl ${getKpiCounterClasses()} ${CALIBRATION_STATS_TEXT.overdue}`}>
            {t('content.stats.unit', { count: stats.overdue })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('content.stats.upcoming')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl ${getKpiCounterClasses()} ${CALIBRATION_STATS_TEXT.upcoming}`}>
            {t('content.stats.unit', { count: stats.upcoming })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
