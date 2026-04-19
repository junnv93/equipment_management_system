'use client';

import { useTranslations } from 'next-intl';
import type { Equipment } from '@/lib/api/equipment-api';
import { IntermediateInspectionList } from './IntermediateInspectionList';
import { SelfInspectionTab } from './SelfInspectionTab';

interface InspectionTabProps {
  equipment: Equipment;
}

/**
 * 통합 점검 탭 — 장비의 점검 대상 여부 및 관리 방법에 따라 적절한 점검 UI를 표시
 *
 * - needsIntermediateCheck=true → 중간점검 (UL-QP-18-03) — 관리방법 무관
 * - 자체점검 (self_inspection) → 자체점검 (UL-QP-18-05)
 * - 그 외 → 점검 불필요
 */
export function InspectionTab({ equipment }: InspectionTabProps) {
  const t = useTranslations('equipment');

  if (equipment.needsIntermediateCheck) {
    return <IntermediateInspectionList equipment={equipment} />;
  }

  if (equipment.managementMethod === 'self_inspection') {
    return <SelfInspectionTab equipment={equipment} />;
  }

  const methodLabel = t(`managementMethodLabel.${equipment.managementMethod}`);
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground text-sm">
        {t('inspection.notApplicable', { method: methodLabel })}
      </p>
    </div>
  );
}
