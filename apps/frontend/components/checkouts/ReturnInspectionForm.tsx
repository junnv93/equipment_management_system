'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  CheckoutPurposeValues as CPVal,
  type CheckoutPurpose,
} from '@equipment-management/schemas';

// ============================================================================
// Purpose-specific inspection config — SSOT
// ============================================================================

interface PurposeInspectionConfig {
  readonly showCalibrationCheck: boolean;
  readonly showRepairCheck: boolean;
  readonly showWorkingCheck: boolean;
  readonly calibrationRequired: boolean;
  readonly repairRequired: boolean;
  readonly workingRequired: boolean;
  /** true = 작동 여부를 사용자가 직접 체크, false = 상태확인 이력에서 자동 도출 */
  readonly workingUserProvided: boolean;
}

export const RETURN_INSPECTION_PURPOSE_CONFIG = {
  [CPVal.CALIBRATION]: {
    showCalibrationCheck: true,
    showRepairCheck: false,
    showWorkingCheck: true,
    calibrationRequired: true,
    repairRequired: false,
    workingRequired: true,
    workingUserProvided: true,
  },
  [CPVal.REPAIR]: {
    showCalibrationCheck: false,
    showRepairCheck: true,
    showWorkingCheck: true,
    calibrationRequired: false,
    repairRequired: true,
    workingRequired: true,
    workingUserProvided: true,
  },
  [CPVal.RENTAL]: {
    showCalibrationCheck: false,
    showRepairCheck: false,
    showWorkingCheck: false,
    calibrationRequired: false,
    repairRequired: false,
    workingRequired: false,
    workingUserProvided: false,
  },
  [CPVal.RETURN_TO_VENDOR]: {
    showCalibrationCheck: false,
    showRepairCheck: false,
    showWorkingCheck: false,
    calibrationRequired: false,
    repairRequired: false,
    workingRequired: false,
    workingUserProvided: false,
  },
} as const satisfies Record<CheckoutPurpose, PurposeInspectionConfig>;

// ============================================================================
// Types
// ============================================================================

export interface InspectionFormData {
  calibrationChecked: boolean;
  repairChecked: boolean;
  workingStatusChecked: boolean;
  inspectionNotes: string;
}

interface ReturnInspectionFormProps {
  purpose: CheckoutPurpose;
  onSubmit: (data: InspectionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /**
   * 대여 목적 전용 — 상태확인 이력에서 도출한 workingStatusChecked.
   * purpose === 'rental' 일 때 RETURN_INSPECTION_PURPOSE_CONFIG.rental.workingUserProvided=false 이므로
   * 이 값이 폼 제출 시 자동으로 사용된다.
   */
  derivedWorkingStatusChecked?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function ReturnInspectionForm({
  purpose,
  onSubmit,
  onCancel,
  isLoading = false,
  derivedWorkingStatusChecked = false,
}: ReturnInspectionFormProps) {
  const t = useTranslations('checkouts');
  const config = RETURN_INSPECTION_PURPOSE_CONFIG[purpose];

  const [calibrationChecked, setCalibrationChecked] = useState(false);
  const [repairChecked, setRepairChecked] = useState(false);
  const [workingStatusChecked, setWorkingStatusChecked] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (config.workingRequired && config.workingUserProvided && !workingStatusChecked) {
      setValidationError(t('returnInspection.validationWorking'));
      return false;
    }
    if (config.calibrationRequired && !calibrationChecked) {
      setValidationError(t('returnInspection.validationCalibration'));
      return false;
    }
    if (config.repairRequired && !repairChecked) {
      setValidationError(t('returnInspection.validationRepair'));
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      calibrationChecked,
      repairChecked,
      // 대여: 상태확인 이력에서 도출된 값 사용 (사용자 체크박스 없음)
      workingStatusChecked: config.workingUserProvided
        ? workingStatusChecked
        : derivedWorkingStatusChecked,
      inspectionNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {t('returnInspection.purposeLabel')}{' '}
        <span className="font-medium">{t(`purpose.${purpose}`)}</span>
      </div>

      {validationError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* 대여: 체크박스 없음 — 상태확인 이력이 검사 기록 대체 */}
      {purpose === CPVal.RENTAL ? (
        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t('returnInspection.rentalConditionChecksNote')}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {/* 교정 확인 (교정 목적 전용) */}
          {config.showCalibrationCheck && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="calibrationChecked"
                checked={calibrationChecked}
                onCheckedChange={(checked) => setCalibrationChecked(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="calibrationChecked" className="flex items-center gap-2">
                  {t('returnInspection.calibrationLabel')}
                  {config.calibrationRequired && (
                    <span className="text-xs text-destructive font-medium">
                      {t('returnInspection.required')}
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('returnInspection.calibrationDesc')}
                </p>
              </div>
            </div>
          )}

          {/* 수리 확인 (수리 목적 전용) */}
          {config.showRepairCheck && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="repairChecked"
                checked={repairChecked}
                onCheckedChange={(checked) => setRepairChecked(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="repairChecked" className="flex items-center gap-2">
                  {t('returnInspection.repairLabel')}
                  {config.repairRequired && (
                    <span className="text-xs text-destructive font-medium">
                      {t('returnInspection.required')}
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">{t('returnInspection.repairDesc')}</p>
              </div>
            </div>
          )}

          {/* 작동 여부 확인 (교정/수리 목적 필수) */}
          {config.showWorkingCheck && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="workingStatusChecked"
                checked={workingStatusChecked}
                onCheckedChange={(checked) => setWorkingStatusChecked(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="workingStatusChecked" className="flex items-center gap-2">
                  {t('returnInspection.workingStatusLabel')}
                  {config.workingRequired && (
                    <span className="text-xs text-destructive font-medium">
                      {t('returnInspection.required')}
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('returnInspection.workingStatusDesc')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 검사 비고 */}
      <div className="space-y-2">
        <Label htmlFor="inspectionNotes">{t('returnInspection.notesLabel')}</Label>
        <Textarea
          id="inspectionNotes"
          placeholder={t('returnInspection.notesPlaceholder')}
          value={inspectionNotes}
          onChange={(e) => setInspectionNotes(e.target.value)}
          rows={4}
        />
      </div>

      {/* 검사 상태 요약 (교정/수리 목적 전용) */}
      {purpose !== CPVal.RENTAL && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">{t('returnInspection.summaryTitle')}</p>
          <div className="space-y-1 text-sm">
            {config.showWorkingCheck && (
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${workingStatusChecked ? 'text-brand-ok' : 'text-muted-foreground/30'}`}
                />
                <span>
                  {t('returnInspection.workingStatus', {
                    status: workingStatusChecked
                      ? t('returnInspection.checked')
                      : t('returnInspection.unchecked'),
                  })}
                </span>
              </div>
            )}
            {config.showCalibrationCheck && (
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${calibrationChecked ? 'text-brand-ok' : 'text-muted-foreground/30'}`}
                />
                <span>
                  {t('returnInspection.calibrationStatus', {
                    status: calibrationChecked
                      ? t('returnInspection.checked')
                      : t('returnInspection.unchecked'),
                  })}
                </span>
              </div>
            )}
            {config.showRepairCheck && (
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${repairChecked ? 'text-brand-ok' : 'text-muted-foreground/30'}`}
                />
                <span>
                  {t('returnInspection.repairStatus', {
                    status: repairChecked
                      ? t('returnInspection.checked')
                      : t('returnInspection.unchecked'),
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('actions.cancel')}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? t('actions.processing') : t('actions.processReturn')}
        </Button>
      </div>
    </div>
  );
}
