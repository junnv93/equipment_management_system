'use client';

import dynamic from 'next/dynamic';
import { type Control } from 'react-hook-form';
import { type Site } from '@equipment-management/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TemporaryEquipmentSection,
  type TemporaryEquipmentSectionProps,
} from './TemporaryEquipmentSection';
import { type FormValues } from '../BasicInfoSection';

const StatusLocationSection = dynamic(
  () => import('../StatusLocationSection').then((mod) => mod.StatusLocationSection),
  { loading: () => <Skeleton className="h-48 w-full" />, ssr: false }
);

export interface StatusLocationStepProps {
  control: Control<FormValues>;
  isCreateMode: boolean;
  selectedSite?: Site;
  selectedTeamId?: number | string;
  /** Temporary equipment 섹션 표시 여부 (등록 + temporary 모드) */
  showTemporary: boolean;
  temporaryProps?: TemporaryEquipmentSectionProps;
}

export function StatusLocationStep({
  control,
  isCreateMode,
  selectedSite,
  selectedTeamId,
  showTemporary,
  temporaryProps,
}: StatusLocationStepProps) {
  return (
    <>
      <StatusLocationSection
        control={control}
        isCreateMode={isCreateMode}
        selectedSite={selectedSite}
        selectedTeamId={selectedTeamId}
      />
      {showTemporary && temporaryProps && <TemporaryEquipmentSection {...temporaryProps} />}
    </>
  );
}
