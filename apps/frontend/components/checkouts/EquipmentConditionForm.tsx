'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
  Cog,
  Package2,
  Image as ImageIcon,
} from 'lucide-react';
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
import { StepperHeader } from './StepperHeader';
import { CSS_VAR_NAMES, cssVar } from '@/lib/design-tokens/css-variables';
import { cn } from '@/lib/utils';

interface EquipmentConditionFormProps {
  step: ConditionCheckStep;
  onSubmit: (data: Omit<CreateConditionCheckDto, 'version'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  previousCheck?: {
    appearanceStatus: ConditionStatus;
    operationStatus: ConditionStatus;
    accessoriesStatus?: AccessoriesStatus;
  };
}

type ItemKind = 'appearance' | 'operation' | 'accessories';

/**
 * 장비 상태 확인 폼 (qr-visual-redesign TASK 5/6 재설계).
 *
 * UX 흐름 (현장 데이터 90%+ 정상 가정 — 정상 우선 흐름):
 * 1. 상단 4-step stepper로 현재 위치 항상 노출 (TASK 5)
 * 2. "모두 정상으로 제출" 64px 단축 버튼 한 번에 폼 제출 (brand-ok solid)
 * 3. 항목별 segmented control (정상/이상) — 이상 선택 시 같은 카드 내부에
 *    border-brand-critical + textarea + 촬영/갤러리 분리 + 사진 그리드 인라인 전개 (TASK 5/6)
 * 4. 폼 unmount/cancel 시 pre-upload된 orphan 사진 documentApi.deleteOrphan 호출 (TASK 6)
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
  const [appearanceStatus, setAppearanceStatus] = React.useState<ConditionStatus>('normal');
  const [operationStatus, setOperationStatus] = React.useState<ConditionStatus>('normal');
  const [accessoriesStatus, setAccessoriesStatus] = React.useState<AccessoriesStatus | undefined>(
    undefined
  );
  const [abnormalDetails, setAbnormalDetails] = React.useState('');
  const [comparisonWithPrevious, setComparisonWithPrevious] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // 사진 첨부 — pre-upload 패턴
  const [attachmentFiles, setAttachmentFiles] = React.useState<UploadedFile[]>([]);
  const [uploadedDocumentIds, setUploadedDocumentIds] = React.useState<string[]>([]);
  const submittedRef = React.useRef(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentApi.uploadDocument(file, DocumentTypeValues.CONDITION_CHECK_PHOTO),
    onError: (error) => {
      console.error('Photo upload failed:', error);
    },
  });

  const handleAttachmentsChange = React.useCallback(
    async (updatedFiles: UploadedFile[]) => {
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

  // 이상 여부
  const hasAbnormal =
    appearanceStatus === 'abnormal' ||
    operationStatus === 'abnormal' ||
    accessoriesStatus === 'incomplete';

  const isReturnStep = step === 'lender_return';
  const needsComparison = isReturnStep && previousCheck;

  // Orphan cleanup — submittedRef로 정상 제출 시 cleanup 회피
  React.useEffect(() => {
    const ids = uploadedDocumentIds;
    return () => {
      if (submittedRef.current) return;
      if (ids.length > 0) {
        void documentApi.deleteOrphan(ids);
      }
    };
  }, [uploadedDocumentIds]);

  // 유효성 검증
  const validate = (): boolean => {
    if (hasAbnormal && !abnormalDetails.trim()) {
      setValidationError(t('condition.validationAbnormalRequired'));
      return false;
    }
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

  const performSubmit = (
    appearance: ConditionStatus,
    operation: ConditionStatus,
    accessories: AccessoriesStatus | undefined,
    details: string,
    comparison: string,
    note: string,
    docIds: string[]
  ) => {
    const data: Omit<CreateConditionCheckDto, 'version'> = {
      step,
      appearanceStatus: appearance,
      operationStatus: operation,
      ...(accessories && { accessoriesStatus: accessories }),
      ...(details.trim() && { abnormalDetails: details.trim() }),
      ...(comparison.trim() && { comparisonWithPrevious: comparison.trim() }),
      ...(note.trim() && { notes: note.trim() }),
      ...(docIds.length > 0 && { attachmentIds: docIds }),
    };
    submittedRef.current = true;
    onSubmit(data);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const successDocIds = uploadedDocumentIds.filter((id) =>
      attachmentFiles.some((f) => f.uuid === id && f.status === 'success')
    );
    performSubmit(
      appearanceStatus,
      operationStatus,
      accessoriesStatus,
      abnormalDetails,
      comparisonWithPrevious,
      notes,
      successDocIds
    );
  };

  const handleAllNormalSubmit = () => {
    performSubmit('normal', 'normal', 'complete', '', '', '', []);
  };

  return (
    <div className="space-y-5">
      {/* 4-step stepper — 현장 위치 항상 노출 */}
      <StepperHeader step={step} />

      {/* 단계 안내 */}
      <div className="p-3 bg-muted/60 rounded-lg">
        <p className="font-medium text-foreground md:text-base">
          {t(`condition.stepLabels.${step}`)}
        </p>
        <p className="text-sm text-foreground/70 mt-1 label-ko">{t('condition.formGuide')}</p>
      </div>

      {/* "모두 정상으로 제출" 단축 버튼 — 64px brand-ok solid */}
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

      {/* 유효성 검증 에러 */}
      {validationError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* G-6: abnormal details + photo upload slot — 첫 abnormal 항목 카드 *내부*에 인라인 렌더.
       *
       * 우선순위: 외관 > 작동. abnormalDetails textarea + photo upload 는 단일 SSOT state 이지만
       * 시각적 위치만 첫 abnormal 항목 카드 안으로 이동하여 "이상 → 즉시 사진/메모" 인접성 확보.
       * 부속(accessories) 만 abnormal 인 경우 fallback 위치 유지 (별도 inline block — AccessoriesItemCard
       * 내부 슬롯 미지원). */}
      {(() => {
        const inlineSlot =
          hasAbnormal && (appearanceStatus === 'abnormal' || operationStatus === 'abnormal') ? (
            <AbnormalDetailsInlineSlot
              abnormalDetails={abnormalDetails}
              setAbnormalDetails={setAbnormalDetails}
              attachmentFiles={attachmentFiles}
              handleAttachmentsChange={handleAttachmentsChange}
              isLoading={isLoading}
            />
          ) : null;
        return (
          <>
            <ConditionItemCard
              kind="appearance"
              icon={Eye}
              titleKey="condition.appearance"
              descriptionKey="condition.appearanceDesc"
              value={appearanceStatus}
              onChange={setAppearanceStatus}
              previousValue={previousCheck?.appearanceStatus}
              abnormalSlot={appearanceStatus === 'abnormal' ? inlineSlot : undefined}
            />

            <ConditionItemCard
              kind="operation"
              icon={Cog}
              titleKey="condition.operation"
              descriptionKey="condition.operationDesc"
              value={operationStatus}
              onChange={setOperationStatus}
              previousValue={previousCheck?.operationStatus}
              abnormalSlot={
                operationStatus === 'abnormal' && appearanceStatus !== 'abnormal'
                  ? inlineSlot
                  : undefined
              }
            />

            <AccessoriesItemCard
              value={accessoriesStatus}
              onChange={setAccessoriesStatus}
              previousValue={previousCheck?.accessoriesStatus}
            />

            {/* fallback — 부속만 abnormal (외관/작동 모두 normal) 인 경우 카드 외부 영역 유지. */}
            {hasAbnormal && appearanceStatus !== 'abnormal' && operationStatus !== 'abnormal' && (
              <div className="space-y-3 rounded-lg border border-brand-critical/40 bg-brand-critical/5 p-4">
                <AbnormalDetailsInlineSlot
                  abnormalDetails={abnormalDetails}
                  setAbnormalDetails={setAbnormalDetails}
                  attachmentFiles={attachmentFiles}
                  handleAttachmentsChange={handleAttachmentsChange}
                  isLoading={isLoading}
                />
              </div>
            )}
          </>
        );
      })()}

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
          <p className="text-sm text-foreground/70">{t('condition.comparisonRequired')}</p>
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

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
        >
          {t('actions.cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
        >
          {isLoading ? t('actions.processing') : t('condition.confirmComplete')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Abnormal 인라인 슬롯 — abnormalDetails textarea + photo upload (G-6).
 * 카드 *내부* 또는 fallback 영역에 동일 컴포넌트로 렌더 (단일 SSOT state).
 */
function AbnormalDetailsInlineSlot({
  abnormalDetails,
  setAbnormalDetails,
  attachmentFiles,
  handleAttachmentsChange,
  isLoading,
}: {
  abnormalDetails: string;
  setAbnormalDetails: (v: string) => void;
  attachmentFiles: UploadedFile[];
  handleAttachmentsChange: (files: UploadedFile[]) => void;
  isLoading: boolean;
}) {
  const t = useTranslations('checkouts');
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="abnormalDetails" className="text-sm font-semibold">
          {t('condition.abnormalDetailsLabel')} <span className="text-brand-critical">*</span>
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
          className={cn('border-brand-critical/40', CHECKOUT_FORM_TOKENS.abnormalTextarea)}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4" aria-hidden="true" />
          {t('condition.attachmentsLabel')}
        </Label>
        <p className="text-xs text-foreground/70 label-ko">{t('condition.photoRecommendedHint')}</p>
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
        {attachmentFiles.filter((f) => f.status === 'success').length === 0 && (
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-brand-warning flex items-center gap-1.5"
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t('condition.abnormalPhotoSuggested')}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 항목 카드 (외관/작동) — segmented control + previous value chip.
 */
function ConditionItemCard({
  kind,
  icon: Icon,
  titleKey,
  descriptionKey,
  value,
  onChange,
  previousValue,
  abnormalSlot,
}: {
  kind: ItemKind;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
  value: ConditionStatus;
  onChange: (v: ConditionStatus) => void;
  previousValue?: ConditionStatus;
  /** G-6: abnormal 시 카드 *내부*에 인라인 렌더 — abnormalDetails textarea + photo upload 등. */
  abnormalSlot?: React.ReactNode;
}) {
  const t = useTranslations('checkouts');
  return (
    <Card className={cn(value === 'abnormal' && 'border-brand-critical/60 bg-brand-critical/5')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 label-ko">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {t(titleKey)}
        </CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent>
        <SegmentedConditionControl value={value} onChange={onChange} kindName={kind} />
        {previousValue && (
          <p className="text-sm text-foreground/70 mt-2 label-ko">
            {t('condition.previousCheck', {
              status: t(`condition.conditionStatus.${previousValue}`),
            })}
          </p>
        )}
        {/* abnormal 인라인 슬롯 — 항목 카드 내부에 textarea/photo 영역 위치. */}
        {value === 'abnormal' && abnormalSlot ? (
          <div className="mt-4 space-y-3 rounded-md border-t border-brand-critical/30 pt-3">
            {abnormalSlot}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AccessoriesItemCard({
  value,
  onChange,
  previousValue,
}: {
  value: AccessoriesStatus | undefined;
  onChange: (v: AccessoriesStatus | undefined) => void;
  previousValue?: AccessoriesStatus;
}) {
  const t = useTranslations('checkouts');
  return (
    <Card className={cn(value === 'incomplete' && 'border-brand-critical/60 bg-brand-critical/5')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 label-ko">
          <Package2 className="h-4 w-4" aria-hidden="true" />
          {t('condition.accessoriesLabel')}{' '}
          <span className="text-sm font-normal text-foreground/70">
            {t('condition.accessoriesOptional')}
          </span>
        </CardTitle>
        <CardDescription>{t('condition.accessoriesDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="group" aria-label={t('condition.accessoriesLabel')} className="flex gap-2">
          <SegmentedButton
            isActive={value === 'complete'}
            tone="ok"
            onClick={() => onChange('complete')}
            label={t('condition.accessoriesStatusLabels.complete')}
            icon={CheckCircle2}
          />
          <SegmentedButton
            isActive={value === 'incomplete'}
            tone="critical"
            onClick={() => onChange('incomplete')}
            label={t('condition.accessoriesStatusLabels.incomplete')}
            icon={AlertCircle}
          />
        </div>
        {previousValue && (
          <p className="text-sm text-foreground/70 mt-2 label-ko">
            {t('condition.previousCheck', {
              status: t(`condition.accessoriesStatusLabels.${previousValue}`),
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SegmentedConditionControl({
  value,
  onChange,
  kindName,
}: {
  value: ConditionStatus;
  onChange: (v: ConditionStatus) => void;
  kindName: string;
}) {
  const t = useTranslations('checkouts.condition.conditionStatus');
  return (
    <div role="group" aria-label={kindName} className="flex gap-2">
      <SegmentedButton
        isActive={value === 'normal'}
        tone="ok"
        onClick={() => onChange('normal')}
        label={t('normal')}
        icon={CheckCircle2}
      />
      <SegmentedButton
        isActive={value === 'abnormal'}
        tone="critical"
        onClick={() => onChange('abnormal')}
        label={t('abnormal')}
        icon={AlertCircle}
      />
    </div>
  );
}

function SegmentedButton({
  isActive,
  tone,
  onClick,
  label,
  icon: Icon,
}: {
  isActive: boolean;
  tone: 'ok' | 'critical';
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const baseInactive = 'border-border bg-card text-foreground/70 hover:bg-muted';
  const activeOk = 'border-brand-ok bg-brand-ok/10 text-brand-ok';
  const activeCritical = 'border-brand-critical bg-brand-critical/10 text-brand-critical';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors',
        isActive ? (tone === 'ok' ? activeOk : activeCritical) : baseInactive
      )}
      style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="label-ko">{label}</span>
    </button>
  );
}
