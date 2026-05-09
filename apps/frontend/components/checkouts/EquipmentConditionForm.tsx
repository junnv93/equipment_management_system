'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, CheckCircle2, Eye, Cog, Package2 } from 'lucide-react';
import {
  ConditionCheckStep,
  ConditionStatus,
  AccessoriesStatus,
  DocumentTypeValues,
} from '@equipment-management/schemas';
import { DOCUMENT_FILE_RULES, FILE_UPLOAD_LIMITS } from '@equipment-management/shared-constants';
import type { CreateConditionCheckDto } from '@/lib/api/checkout-api';
import { documentApi } from '@/lib/api/document-api';
import { CHECKOUT_FORM_TOKENS } from '@/lib/design-tokens';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';

interface EquipmentConditionFormProps {
  /** 상태 확인 단계 */
  step: ConditionCheckStep;
  /** 제출 콜백 (version 필드 제외) */
  onSubmit: (data: Omit<CreateConditionCheckDto, 'version'>) => void;
  /** 취소 콜백 */
  onCancel: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 이전 확인 기록 (비교용) */
  previousCheck?: {
    appearanceStatus: ConditionStatus;
    operationStatus: ConditionStatus;
    accessoriesStatus?: AccessoriesStatus;
  };
}

/**
 * 장비 상태 확인 폼
 *
 * 대여 목적 반출 시 양측 4단계 확인을 위한 폼입니다.
 * - ① 반출 전 확인 (빌려주는 측)
 * - ② 인수 시 확인 (빌리는 측)
 * - ③ 반납 전 확인 (빌린 측)
 * - ④ 반입 시 확인 (빌려준 측)
 *
 * 각 단계에서 외관 상태, 작동 상태, 부속품 상태를 기록합니다.
 * 이상이 있는 경우 상세 내용을 기록해야 합니다.
 */
export default function EquipmentConditionForm({
  step,
  onSubmit,
  onCancel,
  isLoading = false,
  previousCheck,
}: EquipmentConditionFormProps) {
  const t = useTranslations('checkouts');

  // 폼 상태
  const [appearanceStatus, setAppearanceStatus] = useState<ConditionStatus>('normal');
  const [operationStatus, setOperationStatus] = useState<ConditionStatus>('normal');
  const [accessoriesStatus, setAccessoriesStatus] = useState<AccessoriesStatus | undefined>(
    undefined
  );
  const [abnormalDetails, setAbnormalDetails] = useState('');
  const [comparisonWithPrevious, setComparisonWithPrevious] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 사진 첨부 상태 — pre-upload 패턴: 선택 즉시 업로드 → documentId 수집
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<string[]>([]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentApi.uploadDocument(file, DocumentTypeValues.CONDITION_CHECK_PHOTO),
    onError: (error, _file, _context) => {
      // 업로드 실패는 개별 파일 status='error'로 반영 — 폼 제출 차단 안 함
      console.error('Photo upload failed:', error);
    },
  });

  // 파일 선택 핸들러 — 새로 추가된 파일만 즉시 업로드
  const handleAttachmentsChange = useCallback(
    async (updatedFiles: UploadedFile[]) => {
      // uuid 없음 = 아직 서버 업로드 전 신규 파일
      const newFiles = updatedFiles.filter(
        (f) => !f.uuid && !attachmentFiles.some((a) => a.file === f.file)
      );

      // optimistic update — status를 uploading으로 즉시 반영
      const withUploading = updatedFiles.map((f) =>
        newFiles.includes(f) ? { ...f, status: 'uploading' as const, progress: 50 } : f
      );
      setAttachmentFiles(withUploading);

      // 신규 파일 순서대로 업로드
      for (const uf of newFiles) {
        const fileIndex = withUploading.indexOf(uf);
        try {
          const doc = await uploadMutation.mutateAsync(uf.file);
          setUploadedDocumentIds((prev) => [...prev, doc.id]);
          setAttachmentFiles((prev) =>
            prev.map((f, i) =>
              i === fileIndex
                ? { ...f, status: 'success' as const, uuid: doc.id, progress: 100 }
                : f
            )
          );
        } catch {
          setAttachmentFiles((prev) =>
            prev.map((f, i) =>
              i === fileIndex ? { ...f, status: 'error' as const, error: '업로드 실패' } : f
            )
          );
        }
      }

      // 삭제된 파일의 documentId 제거
      const remainingUuids = new Set(updatedFiles.map((f) => f.uuid).filter(Boolean));
      setUploadedDocumentIds((prev) => prev.filter((id) => remainingUuids.has(id)));
    },
    [attachmentFiles, uploadMutation]
  );

  // 이상 여부 확인
  const hasAbnormal =
    appearanceStatus === 'abnormal' ||
    operationStatus === 'abnormal' ||
    accessoriesStatus === 'incomplete';

  // 반입 확인 단계 (④단계) 여부
  const isReturnStep = step === 'lender_return';

  // 이전 확인과 비교 필요 여부
  const needsComparison = isReturnStep && previousCheck;

  // 유효성 검증
  const validate = (): boolean => {
    // 이상이 있는데 상세 내용이 없는 경우
    if (hasAbnormal && !abnormalDetails.trim()) {
      setValidationError(t('condition.validationAbnormalRequired'));
      return false;
    }

    // 반입 확인 시 이전과 비교 필요
    if (needsComparison) {
      const hasChange =
        previousCheck!.appearanceStatus !== appearanceStatus ||
        previousCheck!.operationStatus !== operationStatus ||
        (previousCheck!.accessoriesStatus &&
          accessoriesStatus &&
          previousCheck!.accessoriesStatus !== accessoriesStatus);

      if (hasChange && !comparisonWithPrevious.trim()) {
        setValidationError(t('condition.validationComparisonRequired'));
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  // 제출 핸들러
  const handleSubmit = () => {
    if (!validate()) return;

    const successDocIds = uploadedDocumentIds.filter((id) =>
      attachmentFiles.some((f) => f.uuid === id && f.status === 'success')
    );

    const data: Omit<CreateConditionCheckDto, 'version'> = {
      step,
      appearanceStatus,
      operationStatus,
      ...(accessoriesStatus && { accessoriesStatus }),
      ...(abnormalDetails.trim() && { abnormalDetails: abnormalDetails.trim() }),
      ...(comparisonWithPrevious.trim() && {
        comparisonWithPrevious: comparisonWithPrevious.trim(),
      }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(successDocIds.length > 0 && { attachmentIds: successDocIds }),
    };

    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      {/* 단계 안내 */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="font-medium">{t(`condition.stepLabels.${step}`)}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('condition.formGuide')}</p>
      </div>

      {/* 유효성 검증 에러 */}
      {validationError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* 외관 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t('condition.appearance')}
          </CardTitle>
          <CardDescription>{t('condition.appearanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={appearanceStatus}
            onValueChange={(value) => setAppearanceStatus(value as ConditionStatus)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="appearance-normal" />
              <Label htmlFor="appearance-normal" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-brand-ok" />
                {t('condition.conditionStatus.normal')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abnormal" id="appearance-abnormal" />
              <Label htmlFor="appearance-abnormal" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-brand-critical" />
                {t('condition.conditionStatus.abnormal')}
              </Label>
            </div>
          </RadioGroup>
          {previousCheck && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('condition.previousCheck', {
                status: t(`condition.conditionStatus.${previousCheck.appearanceStatus}`),
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 작동 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cog className="h-4 w-4" />
            {t('condition.operation')}
          </CardTitle>
          <CardDescription>{t('condition.operationDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={operationStatus}
            onValueChange={(value) => setOperationStatus(value as ConditionStatus)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="operation-normal" />
              <Label htmlFor="operation-normal" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-brand-ok" />
                {t('condition.conditionStatus.normal')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abnormal" id="operation-abnormal" />
              <Label htmlFor="operation-abnormal" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-brand-critical" />
                {t('condition.conditionStatus.abnormal')}
              </Label>
            </div>
          </RadioGroup>
          {previousCheck && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('condition.previousCheck', {
                status: t(`condition.conditionStatus.${previousCheck.operationStatus}`),
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 부속품 상태 (선택) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            {t('condition.accessoriesLabel')}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {t('condition.accessoriesOptional')}
            </span>
          </CardTitle>
          <CardDescription>{t('condition.accessoriesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={accessoriesStatus || ''}
            onValueChange={(value) =>
              setAccessoriesStatus(value ? (value as AccessoriesStatus) : undefined)
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="complete" id="accessories-complete" />
              <Label htmlFor="accessories-complete" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-brand-ok" />
                {t('condition.accessoriesStatusLabels.complete')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="incomplete" id="accessories-incomplete" />
              <Label htmlFor="accessories-incomplete" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-brand-warning" />
                {t('condition.accessoriesStatusLabels.incomplete')}
              </Label>
            </div>
          </RadioGroup>
          {previousCheck?.accessoriesStatus && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('condition.previousCheck', {
                status: t(`condition.accessoriesStatusLabels.${previousCheck.accessoriesStatus}`),
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 이상 내용 상세 */}
      {hasAbnormal && (
        <div className="space-y-2">
          <Label htmlFor="abnormalDetails">
            {t('condition.abnormalDetailsLabel')} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="abnormalDetails"
            placeholder={t('condition.abnormalDetailsPlaceholder')}
            value={abnormalDetails}
            onChange={(e) => setAbnormalDetails(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
            }}
            rows={3}
            className={`border-brand-critical/40 ${CHECKOUT_FORM_TOKENS.abnormalTextarea}`}
          />
        </div>
      )}

      {/* 이전 확인과 비교 (④단계) */}
      {needsComparison && (
        <div className="space-y-2">
          <Label htmlFor="comparisonWithPrevious">{t('condition.comparisonLabel')}</Label>
          <Textarea
            id="comparisonWithPrevious"
            placeholder={t('condition.comparisonPlaceholder')}
            value={comparisonWithPrevious}
            onChange={(e) => setComparisonWithPrevious(e.target.value)}
            rows={3}
          />
          <p className="text-sm text-muted-foreground">{t('condition.comparisonRequired')}</p>
        </div>
      )}

      {/* 추가 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('condition.additionalNotes')}</Label>
        <Textarea
          id="notes"
          placeholder={t('condition.additionalNotesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
          }}
          rows={2}
        />
      </div>

      {/* 현장 사진 첨부 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {t('condition.attachmentsLabel')}
          </CardTitle>
          <CardDescription>{t('condition.attachmentsHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 이상 상태인데 사진 없을 때 권유 (비차단) */}
          {hasAbnormal && attachmentFiles.filter((f) => f.status === 'success').length === 0 && (
            <Alert
              role="status"
              aria-live="polite"
              className="mb-3 border-brand-warning/40 bg-brand-warning/5"
            >
              <AlertCircle className="h-4 w-4 text-brand-warning" aria-hidden="true" />
              <AlertDescription className="text-brand-warning">
                {t('condition.abnormalPhotoSuggested')}
              </AlertDescription>
            </Alert>
          )}
          <FileUpload
            files={attachmentFiles}
            onChange={handleAttachmentsChange}
            accept={DOCUMENT_FILE_RULES.condition_check_photo.accept}
            maxFiles={FILE_UPLOAD_LIMITS.MAX_ATTACHMENTS_PER_CONDITION_CHECK}
            capture="environment"
            label=""
            description=""
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      {/* 상태 요약 */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">{t('condition.statusSummary')}</p>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            {appearanceStatus === 'normal' ? (
              <CheckCircle2 className="h-4 w-4 text-brand-ok" />
            ) : (
              <AlertCircle className="h-4 w-4 text-brand-critical" />
            )}
            <span>
              {t('condition.appearance')}: {t(`condition.conditionStatus.${appearanceStatus}`)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {operationStatus === 'normal' ? (
              <CheckCircle2 className="h-4 w-4 text-brand-ok" />
            ) : (
              <AlertCircle className="h-4 w-4 text-brand-critical" />
            )}
            <span>
              {t('condition.operation')}: {t(`condition.conditionStatus.${operationStatus}`)}
            </span>
          </div>
          {accessoriesStatus && (
            <div className="flex items-center gap-2">
              {accessoriesStatus === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 text-brand-ok" />
              ) : (
                <AlertCircle className="h-4 w-4 text-brand-warning" />
              )}
              <span>
                {t('condition.accessories')}:{' '}
                {t(`condition.accessoriesStatusLabels.${accessoriesStatus}`)}
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
          {isLoading ? t('actions.processing') : t('condition.confirmComplete')}
        </Button>
      </div>
    </div>
  );
}
