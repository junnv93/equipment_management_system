'use client';

import dynamic from 'next/dynamic';
import { type Control } from 'react-hook-form';
import { Skeleton } from '@/components/ui/skeleton';
import { type FormValues } from '../BasicInfoSection';

const CalibrationInfoSection = dynamic(
  () => import('../CalibrationInfoSection').then((mod) => mod.CalibrationInfoSection),
  { loading: () => <Skeleton className="h-64 w-full" />, ssr: false }
);

export interface CalibrationStepProps {
  control: Control<FormValues>;
}

export function CalibrationStep({ control }: CalibrationStepProps) {
  return <CalibrationInfoSection control={control} />;
}
