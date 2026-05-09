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

/**
 * 교정 인자 탭 — 장비 상세 내 요약 UI (ADR-0009 Option C).
 *
 * **역할**: 현재 교정 인자 목록 요약 표시. 집중 관리는 `CalibrationFactorsClient`(`/equipment/[id]/calibration-factors`).
 * 탭→서브라우트 진입점은 `EquipmentTabFooterLink` SSOT 단일 사용 — 직접 Link 금지.
 */
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
