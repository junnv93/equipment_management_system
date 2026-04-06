'use client';

import type { Equipment } from '@/lib/api/equipment-api';
import { IntermediateInspectionList } from './IntermediateInspectionList';
import { SelfInspectionTab } from './SelfInspectionTab';

interface InspectionTabProps {
  equipment: Equipment;
}

/**
 * 통합 점검 탭 — 장비의 교정 대상 여부에 따라 적절한 점검 UI를 표시
 *
 * - 교정 대상 장비 (calibrationRequired === 'required') → 중간점검 (UL-QP-18-03)
 * - 비교정 대상 장비 → 자체점검 (UL-QP-18-05)
 */
export function InspectionTab({ equipment }: InspectionTabProps) {
  const isCalibrated = equipment.calibrationRequired === 'required';

  if (isCalibrated) {
    return <IntermediateInspectionList equipment={equipment} />;
  }

  return <SelfInspectionTab equipment={equipment} />;
}
