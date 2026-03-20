'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';

export interface InspectionFormData {
  calibrationChecked: boolean;
  repairChecked: boolean;
  workingStatusChecked: boolean;
  inspectionNotes: string;
}

interface ReturnInspectionFormProps {
  purpose: string; // 반출 목적: calibration, repair, rental
  onSubmit: (data: InspectionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ReturnInspectionForm({
  purpose,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReturnInspectionFormProps) {
  const t = useTranslations('checkouts');
  const [calibrationChecked, setCalibrationChecked] = useState(false);
  const [repairChecked, setRepairChecked] = useState(false);
  const [workingStatusChecked, setWorkingStatusChecked] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 필수 검사 항목 결정
  const isCalibrationRequired = purpose === CPVal.CALIBRATION;
  const isRepairRequired = purpose === CPVal.REPAIR;

  // 유효성 검증
  const validate = (): boolean => {
    // 모든 유형: workingStatusChecked 필수
    if (!workingStatusChecked) {
      setValidationError(t('returnInspection.validationWorking'));
      return false;
    }

    // 교정 목적: calibrationChecked 필수
    if (isCalibrationRequired && !calibrationChecked) {
      setValidationError(t('returnInspection.validationCalibration'));
      return false;
    }

    // 수리 목적: repairChecked 필수
    if (isRepairRequired && !repairChecked) {
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
      workingStatusChecked,
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

      <div className="space-y-4">
        {/* 교정 확인 (교정 목적 시 필수) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="calibrationChecked"
            checked={calibrationChecked}
            onCheckedChange={(checked) => setCalibrationChecked(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="calibrationChecked" className="flex items-center gap-2">
              {t('returnInspection.calibrationLabel')}
              {isCalibrationRequired && (
                <span className="text-xs text-destructive font-medium">
                  {t('returnInspection.required')}
                </span>
              )}
            </Label>
            <p className="text-sm text-muted-foreground">{t('returnInspection.calibrationDesc')}</p>
          </div>
        </div>

        {/* 수리 확인 (수리 목적 시 필수) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="repairChecked"
            checked={repairChecked}
            onCheckedChange={(checked) => setRepairChecked(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="repairChecked" className="flex items-center gap-2">
              {t('returnInspection.repairLabel')}
              {isRepairRequired && (
                <span className="text-xs text-destructive font-medium">
                  {t('returnInspection.required')}
                </span>
              )}
            </Label>
            <p className="text-sm text-muted-foreground">{t('returnInspection.repairDesc')}</p>
          </div>
        </div>

        {/* 작동 여부 확인 (모든 유형 필수) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="workingStatusChecked"
            checked={workingStatusChecked}
            onCheckedChange={(checked) => setWorkingStatusChecked(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="workingStatusChecked" className="flex items-center gap-2">
              {t('returnInspection.workingStatusLabel')}
              <span className="text-xs text-destructive font-medium">
                {t('returnInspection.required')}
              </span>
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('returnInspection.workingStatusDesc')}
            </p>
          </div>
        </div>
      </div>

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

      {/* 검사 상태 요약 */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-medium mb-2">{t('returnInspection.summaryTitle')}</p>
        <div className="space-y-1 text-sm">
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
          {(isCalibrationRequired || calibrationChecked) && (
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
          {(isRepairRequired || repairChecked) && (
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
