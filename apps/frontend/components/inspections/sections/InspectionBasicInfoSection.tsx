'use client';

import { useTranslations } from 'next-intl';
import { Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { InspectionResult } from '@equipment-management/schemas';
import {
  INSPECTION_PREFILL,
  INSPECTION_FORM_LAYOUT,
  INSPECTION_SPACING,
} from '@/lib/design-tokens';

export interface InspectionBasicInfoSectionProps {
  isEquipmentError: boolean;
  isEquipmentLoading: boolean;
  inspectionDate: string;
  onInspectionDateChange: (v: string) => void;
  overallResult: InspectionResult | '';
  onOverallResultChange: (v: InspectionResult) => void;
  inspectionCycle: string;
  onInspectionCycleChange: (v: string) => void;
  calibrationValidityPeriod: string;
  onCalibrationValidityPeriodChange: (v: string) => void;
  onRemoveMasterPrefilled: (field: string) => void;
  /** 부모(orchestrator)가 master prefill 여부를 계산해 전달 — section autonomy (props in, JSX out) */
  inspectionCycleIsPrefilled: boolean;
  /** 부모(orchestrator)가 master prefill 여부를 계산해 전달 */
  calibrationValidityPeriodIsPrefilled: boolean;
}

export function InspectionBasicInfoSection({
  isEquipmentError,
  isEquipmentLoading,
  inspectionDate,
  onInspectionDateChange,
  overallResult,
  onOverallResultChange,
  inspectionCycle,
  onInspectionCycleChange,
  calibrationValidityPeriod,
  onCalibrationValidityPeriodChange,
  onRemoveMasterPrefilled,
  inspectionCycleIsPrefilled,
  calibrationValidityPeriodIsPrefilled,
}: InspectionBasicInfoSectionProps) {
  const t = useTranslations('calibration');

  const renderPrefillBadge = (isPrefilled: boolean) => {
    if (!isPrefilled) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={INSPECTION_PREFILL.badge}>
              <Info className={INSPECTION_PREFILL.icon} />
              {t('intermediateInspection.prefill.auto')}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('intermediateInspection.prefill.tooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {isEquipmentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t('intermediateInspection.equipmentLoadError')}</AlertDescription>
        </Alert>
      )}

      <div className={INSPECTION_FORM_LAYOUT.twoColumn}>
        <div className={INSPECTION_SPACING.field}>
          <Label htmlFor="intermediate-inspection-date">
            {t('intermediateInspection.inspectionDate')}
          </Label>
          <Input
            id="intermediate-inspection-date"
            name="intermediateInspectionDate"
            type="date"
            autoComplete="off"
            value={inspectionDate}
            onChange={(e) => onInspectionDateChange(e.target.value)}
            required
          />
        </div>
        <div className={INSPECTION_SPACING.field}>
          <Label htmlFor="intermediate-inspection-overall-result">
            {t('intermediateInspection.overallResult')}
          </Label>
          <Select
            value={overallResult}
            onValueChange={(v) => onOverallResultChange(v as InspectionResult)}
          >
            <SelectTrigger id="intermediate-inspection-overall-result">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">{t('intermediateInspection.resultOptions.pass')}</SelectItem>
              <SelectItem value="fail">{t('intermediateInspection.resultOptions.fail')}</SelectItem>
              <SelectItem value="conditional">
                {t('intermediateInspection.resultOptions.conditional')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEquipmentLoading ? (
        <div className={INSPECTION_FORM_LAYOUT.twoColumn}>
          <div className={INSPECTION_SPACING.field}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className={INSPECTION_SPACING.field}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ) : (
        <div className={INSPECTION_FORM_LAYOUT.twoColumn}>
          <div className={INSPECTION_SPACING.field}>
            <div className="flex items-center">
              <Label htmlFor="intermediate-inspection-cycle">
                {t('intermediateInspection.inspectionCycle')}
              </Label>
              {renderPrefillBadge(inspectionCycleIsPrefilled)}
            </div>
            <Input
              id="intermediate-inspection-cycle"
              name="intermediateInspectionCycle"
              autoComplete="off"
              value={inspectionCycle}
              onChange={(e) => {
                onInspectionCycleChange(e.target.value);
                onRemoveMasterPrefilled('inspectionCycle');
              }}
              placeholder={t('intermediateInspection.inspectionCyclePlaceholder')}
            />
          </div>
          <div className={INSPECTION_SPACING.field}>
            <div className="flex items-center">
              <Label htmlFor="intermediate-inspection-calibration-validity-period">
                {t('intermediateInspection.calibrationValidityPeriod')}
              </Label>
              {renderPrefillBadge(calibrationValidityPeriodIsPrefilled)}
            </div>
            <Input
              id="intermediate-inspection-calibration-validity-period"
              name="intermediateInspectionCalibrationValidityPeriod"
              autoComplete="off"
              value={calibrationValidityPeriod}
              onChange={(e) => {
                onCalibrationValidityPeriodChange(e.target.value);
                onRemoveMasterPrefilled('calibrationValidityPeriod');
              }}
              placeholder={t('intermediateInspection.validityPeriodPlaceholder')}
            />
          </div>
        </div>
      )}
    </>
  );
}
