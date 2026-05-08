'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Gauge } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Equipment } from '@/lib/api/equipment-api';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { TIMELINE_TOKENS } from '@/lib/design-tokens';

interface CalibrationFactorsTabProps {
  equipment: Equipment;
}

export function CalibrationFactorsTab({ equipment }: CalibrationFactorsTabProps) {
  const t = useTranslations('equipment');
  const equipmentId = String(equipment.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-brand-info" />
          {t('calibrationFactorsTab.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={TIMELINE_TOKENS.empty.container}>
          <Gauge className={TIMELINE_TOKENS.empty.icon} />
          <p className={TIMELINE_TOKENS.empty.text}>{t('calibrationFactorsTab.empty')}</p>
        </div>
        {/* Sub-route 진입점 — CalibrationFactorsClient full page (인자 등록/관리 워크플로) */}
        <div className="flex justify-end pt-3 border-t mt-3">
          <Link
            href={FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS(equipmentId)}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {t('calibrationFactorsTab.viewAllLink')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
