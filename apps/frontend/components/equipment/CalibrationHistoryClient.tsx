'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { CalibrationHistoryTab } from '@/components/equipment/CalibrationHistoryTab';
import { PageHeader } from '@/components/shared/PageHeader';

interface CalibrationHistoryClientProps {
  equipmentId: string;
  initialEquipment: Equipment;
}

export function CalibrationHistoryClient({
  equipmentId,
  initialEquipment,
}: CalibrationHistoryClientProps) {
  const tClient = useTranslations('equipment.calibrationHistoryClient');
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  const { data: equipment } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    placeholderData: initialEquipment,
    ...QUERY_CONFIG.EQUIPMENT_DETAIL,
  });

  const resolvedEquipment = equipment ?? initialEquipment;

  useEffect(() => {
    if (!resolvedEquipment) return;
    const label = `${resolvedEquipment.name} (${resolvedEquipment.managementNumber})`;
    setDynamicLabel(equipmentId, label);
    return () => clearDynamicLabel(equipmentId);
  }, [equipmentId, resolvedEquipment, setDynamicLabel, clearDynamicLabel]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tClient('title')}
        subtitle={`${resolvedEquipment.name} (${resolvedEquipment.managementNumber})`}
        backUrl={`/equipment/${equipmentId}`}
        backLabel={tClient('backAriaLabel')}
      />
      <CalibrationHistoryTab equipment={resolvedEquipment} />
    </div>
  );
}
