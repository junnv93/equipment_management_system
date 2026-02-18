'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Equipment } from '@/lib/api/equipment-api';
import { TIMELINE_TOKENS } from '@/lib/design-tokens';

interface CalibrationFactorsTabProps {
  equipment: Equipment;
}

export function CalibrationFactorsTab({ equipment: _equipment }: CalibrationFactorsTabProps) {
  const t = useTranslations('equipment');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-ul-midnight" />
          {t('calibrationFactorsTab.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={TIMELINE_TOKENS.empty.container}>
          <Gauge className={TIMELINE_TOKENS.empty.icon} />
          <p className={TIMELINE_TOKENS.empty.text}>{t('calibrationFactorsTab.empty')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
