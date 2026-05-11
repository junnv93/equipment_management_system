'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Camera, CheckCircle2, Info } from 'lucide-react';
import {
  CheckoutPurposeValues as CPVal,
  type CheckoutPurpose,
  DocumentTypeValues,
} from '@equipment-management/schemas';
import { DOCUMENT_FILE_RULES, FILE_UPLOAD_LIMITS } from '@equipment-management/shared-constants';
import { documentApi } from '@/lib/api/document-api';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { StepperHeader } from './StepperHeader';
import { cn } from '@/lib/utils';

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
  calibrationCertificateExceptionReason: string;
  attachmentIds?: string[];
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
  const [calibrationCertificateExceptionReason, setCalibrationCertificateExceptionReason] =
    useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 사진 첨부 — pre-upload 패턴
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<string[]>([]);
  const submittedRef = useRef(false);

  // Orphan cleanup (qr-visual-redesign TASK 6) — 정상 제출이 아니면 unmount 시 pre-uploaded 정리
  useEffect(() => {
    const ids = uploadedDocumentIds;
    return () => {
      if (submittedRef.current) return;
      if (ids.length > 0) {
        void documentApi.deleteOrphan(ids);
      }
    };
  }, [uploadedDocumentIds]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentApi.uploadDocument(file, DocumentTypeValues.CONDITION_CHECK_PHOTO),
    onError: (error) => {
      console.error('Photo upload failed:', error);
    },
  });

  const handleAttachmentsChange = useCallback(
    async (updatedFiles: UploadedFile[]) => {
      // uuid 없음 = 아직 서버 업로드 전 신규 파일
      const newFiles = updatedFiles.filter(
        (f) => !f.uuid && !attachmentFiles.some((a) => a.file === f.file)
      );

      const withUploading = updatedFiles.map((f) =>
        newFiles.includes(f) ? { ...f, status: 'uploading' as const, progress: 50 } : f
      );
      setAttachmentFiles(withUploading);

      for (const uf of newFiles) {
        const targetFile = uf.file;
        try {
          const doc = await uploadMutation.mutateAsync(uf.file);
          setUploadedDocumentIds((prev) => [...prev, doc.id]);
          setAttachmentFiles((prev) =>
            prev.map((f) =>
              f.file === targetFile
                ? { ...f, status: 'success' as const, uuid: doc.id, progress: 100 }
                : f
            )
          );
        } catch {
          setAttachmentFiles((prev) =>
            prev.map((f) =>
              f.file === targetFile ? { ...f, status: 'error' as const, error: '업로드 실패' } : f
            )
          );
        }
      }

      const remainingUuids = new Set(updatedFiles.map((f) => f.uuid).filter(Boolean));
      setUploadedDocumentIds((prev) => prev.filter((id) => remainingUuids.has(id)));
    },
    [attachmentFiles, uploadMutation]
  );

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

    const successDocIds = uploadedDocumentIds.filter((id) =>
      attachmentFiles.some((f) => f.uuid === id && f.status === 'success')
    );

    submittedRef.current = true;
    onSubmit({
      calibrationChecked,
      repairChecked,
      // 대여: 상태확인 이력에서 도출된 값 사용 (사용자 체크박스 없음)
      workingStatusChecked: config.workingUserProvided
        ? workingStatusChecked
        : derivedWorkingStatusChecked,
      inspectionNotes,
      calibrationCertificateExceptionReason,
      ...(successDocIds.length > 0 && { attachmentIds: successDocIds }),
    });
  };

  /**
   * "모두 정상" 단축 — 필수 체크박스를 한 번에 체크 + 즉시 제출 (qr-visual-redesign TASK 5).
   * purpose 별 required 항목만 자동 체크 — 옵션 체크박스는 그대로.
   */
  const handleAllNormalSubmit = () => {
    const nextCalibration = config.calibrationRequired ? true : calibrationChecked;
    const nextRepair = config.repairRequired ? true : repairChecked;
    const nextWorking =
      config.workingRequired && config.workingUserProvided ? true : workingStatusChecked;
    setCalibrationChecked(nextCalibration);
    setRepairChecked(nextRepair);
    setWorkingStatusChecked(nextWorking);
    submittedRef.current = true;
    const successDocIds = uploadedDocumentIds.filter((id) =>
      attachmentFiles.some((f) => f.uuid === id && f.status === 'success')
    );
    onSubmit({
      calibrationChecked: nextCalibration,
      repairChecked: nextRepair,
      workingStatusChecked: config.workingUserProvided ? nextWorking : derivedWorkingStatusChecked,
      inspectionNotes: '',
      calibrationCertificateExceptionReason: '',
      ...(successDocIds.length > 0 && { attachmentIds: successDocIds }),
    });
  };

  return (
    <div className="space-y-5">
      {/* 4-step stepper — lender_return 위치 (반입 시 확인) */}
      <StepperHeader step="lender_return" />

      <div className="text-sm text-foreground/70">
        {t('returnInspection.purposeLabel')}{' '}
        <span className="font-medium text-foreground">{t(`purpose.${purpose}`)}</span>
      </div>

      {/* "모두 정상으로 제출" 단축 버튼 — 64px (qr-visual-redesign TASK 5) */}
      <Button
        type="button"
        onClick={handleAllNormalSubmit}
        disabled={isLoading}
        className={cn(
          'flex w-full items-center justify-center gap-2 bg-brand-ok text-white hover:bg-brand-ok/90'
        )}
        style={{ minHeight: '64px' }}
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-semibold label-ko">{t('condition.allNormalShortcut')}</span>
      </Button>

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

          {purpose === CPVal.CALIBRATION && (
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="calibrationCertificateExceptionReason">
                {t('returnInspection.certificateExceptionLabel')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('returnInspection.certificateExceptionDesc')}
              </p>
              <Textarea
                id="calibrationCertificateExceptionReason"
                placeholder={t('returnInspection.certificateExceptionPlaceholder')}
                value={calibrationCertificateExceptionReason}
                onChange={(e) => setCalibrationCertificateExceptionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      {/* 현장 사진 첨부 — 촬영/갤러리 분리 (qr-visual-redesign TASK 6) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-foreground/70" aria-hidden="true" />
          <Label>{t('condition.attachmentsLabel')}</Label>
        </div>
        <p className="text-sm text-foreground/70 label-ko">{t('condition.photoRecommendedHint')}</p>
        <div className="grid grid-cols-2 gap-2">
          <FileUpload
            files={attachmentFiles}
            onChange={handleAttachmentsChange}
            accept={DOCUMENT_FILE_RULES.condition_check_photo.accept}
            maxFiles={FILE_UPLOAD_LIMITS.MAX_ATTACHMENTS_PER_CONDITION_CHECK}
            capture="environment"
            label={t('condition.photoCaptureLabel')}
            description=""
            disabled={isLoading}
          />
          <FileUpload
            files={[]}
            onChange={handleAttachmentsChange}
            accept={DOCUMENT_FILE_RULES.condition_check_photo.accept}
            maxFiles={FILE_UPLOAD_LIMITS.MAX_ATTACHMENTS_PER_CONDITION_CHECK}
            label={t('condition.photoGalleryLabel')}
            description=""
            disabled={isLoading}
          />
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
          }}
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
