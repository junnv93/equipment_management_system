'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Equipment } from '@/lib/api/equipment-api';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { TIMELINE_TOKENS } from '@/lib/design-tokens';
import { EquipmentTabFooterLink } from './EquipmentTabFooterLink';

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
        <EquipmentTabFooterLink
          href={FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS(equipmentId)}
          label={t('calibrationFactorsTab.viewAllLink')}
        />
      </CardContent>
    </Card>
  );
}
