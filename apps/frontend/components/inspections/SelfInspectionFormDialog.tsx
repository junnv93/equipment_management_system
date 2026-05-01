'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isConflictError, isNotFoundError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { Plus, Trash2, AlertCircle, Check, X as XIcon, Minus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import {
  INSPECTION_KIND_BADGE,
  INSPECTION_STATUS_BADGE,
  INSPECTION_CHECKITEM_ROW_STATE,
  INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS,
  getInspectionStatusBadgeClasses,
} from '@/lib/design-tokens';
import CheckItemPresetSelect from './CheckItemPresetSelect';
import { cn } from '@/lib/utils';
import { useFormDialogClose } from '@/hooks/use-form-dialog-close';
import { InspectionFormProvider, useInspectionForm } from '@/lib/inspection/form-context';
import { useLatestTemplate } from '@/hooks/use-inspection-template';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import {
  createSelfInspection,
  updateSelfInspection,
  type CreateSelfInspectionDto,
  type SelfInspection,
  type UpdateSelfInspectionDto,
} from '@/lib/api/self-inspection-api';
import type { Equipment } from '@/lib/api/equipment-api';
import type {
  EquipmentClassification,
  SelfInspectionItemJudgment,
  SelfInspectionResult,
} from '@equipment-management/schemas';
import { DEFAULT_SELF_INSPECTION_ITEMS } from '@equipment-management/schemas';

/**
 * equipment.calibrationRequired → EquipmentClassification 매핑.
 * 서버 로직(self-inspections.service.ts createSelfInspection)과 동일:
 *   dto.classification ?? (calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated')
 */
function deriveClassification(equipment?: Equipment): EquipmentClassification | '' {
  if (!equipment?.calibrationRequired) return '';
  return equipment.calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated';
}

interface SelfInspectionItemForm {
  checkItem: string;
  checkResult: SelfInspectionItemJudgment | '';
}

interface SpecialNoteForm {
  content: string;
  date: string;
}

interface SelfInspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  /** 장비 마스터 — create 모드에서 snapshot 초기값 derive에 사용 */
  equipment?: Equipment;
  /** edit 모드일 때 전달; 미전달이면 create 모드 */
  initialData?: SelfInspection;
}

/**
 * 외부 export — Provider wrap (시스템 전반 일관성, InspectionFormDialog와 동일 패턴).
 * 자체점검도 향후 prefill/template 적용 시 Context 활용.
 */
export default function SelfInspectionFormDialog(props: SelfInspectionFormDialogProps) {
  return (
    <InspectionFormProvider>
      <SelfInspectionFormDialogInner {...props} />
    </InspectionFormProvider>
  );
}

function SelfInspectionFormDialogInner({
  open,
  onOpenChange,
  equipmentId,
  equipment,
  initialData,
}: SelfInspectionFormDialogProps) {
  const t = useTranslations('equipment');
  const tErrors = useTranslations('errors');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEdit = !!initialData;

  // Phase 1B-D: template state — UL-QP-18-05 양식 통제 표시 (DialogHeader version badge)
  // 자체점검 items는 DEFAULT_SELF_INSPECTION_ITEMS로 표준화 — items prefill 미적용,
  // version badge만 표시하여 사용자가 어느 버전 양식인지 인지하도록 한다 (M-12.3 / M-14.1).
  const { setTemplate, state: inspectionFormState } = useInspectionForm();
  const currentTemplate = inspectionFormState.template;
  const {
    data: latestTemplate,
    isError: isTemplateError,
    error: templateError,
  } = useLatestTemplate(equipmentId, 'self', { enabled: open && !isEdit });
  const isTemplateMissing = isTemplateError && isNotFoundError(templateError);

  useEffect(() => {
    if (!latestTemplate) return;
    setTemplate({
      id: latestTemplate.id,
      version: latestTemplate.version,
      createdAt: latestTemplate.createdAt,
      createdByName: latestTemplate.createdByName,
    });
    track(ANALYTICS_EVENTS.INSPECTION_TEMPLATE_VERSION_BADGE_VIEWED, {
      inspectionType: 'self',
      templateVersion: latestTemplate.version,
    });
  }, [latestTemplate, setTemplate]);

  const [inspectionDate, setInspectionDate] = useState('');
  const [overallResult, setOverallResult] = useState<SelfInspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [inspectionCycle, setInspectionCycle] = useState(6);
  const [specialNotes, setSpecialNotes] = useState<SpecialNoteForm[]>([]);
  const [items, setItems] = useState<SelfInspectionItemForm[]>(
    DEFAULT_SELF_INSPECTION_ITEMS.map((name) => ({ checkItem: name, checkResult: '' }))
  );
  // UL-QP-18-05 양식 헤더 snapshot — create 시 장비 마스터에서 derive, edit 시 기존값 복원
  const [classification, setClassification] = useState<EquipmentClassification | ''>('');
  const [calibrationValidityPeriod, setCalibrationValidityPeriod] = useState('');

  // useCallback: equipment가 바뀔 때만 새 참조 생성 → useEffect deps 안정성 보장
  const resetForm = useCallback(() => {
    setInspectionDate('');
    setOverallResult('');
    setRemarks('');
    setInspectionCycle(6);
    setSpecialNotes([]);
    setItems(DEFAULT_SELF_INSPECTION_ITEMS.map((name) => ({ checkItem: name, checkResult: '' })));
    setClassification(deriveClassification(equipment));
    setCalibrationValidityPeriod('');
  }, [equipment]);

  // Phase 0A-ext: cancel/X/Esc 작성 데이터 가드 — 정의 위치를 mutation 위로 이동 (markCommitted 호출용)
  const close = useFormDialogClose({
    isDirty: () => {
      // edit 모드는 의도적으로 열었으므로 dirty 간주
      if (initialData) return true;
      const hasUserInput =
        inspectionDate !== '' ||
        overallResult !== '' ||
        remarks !== '' ||
        specialNotes.length > 0 ||
        items.some((it) => it.checkResult !== '');
      return hasUserInput;
    },
    onConfirmClose: () => {
      // Phase 1A-c: confirm 시 analytics
      track(ANALYTICS_EVENTS.INSPECTION_FORM_CLOSE_GUARDED, {
        dialog: 'self_inspection_form',
        action: 'discard',
        itemCount: items.filter((i) => i.checkResult !== '').length,
        isEdit: !!initialData,
      });
      onOpenChange(false);
    },
  });

  // edit/create 모드: dialog가 열릴 때 데이터 채우기
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setInspectionDate(initialData.inspectionDate?.slice(0, 10) ?? '');
      setOverallResult(initialData.overallResult ?? '');
      setRemarks(initialData.remarks ?? '');
      setInspectionCycle(initialData.inspectionCycle ?? 6);
      setSpecialNotes(
        Array.isArray(initialData.specialNotes)
          ? initialData.specialNotes.map((n) => ({ content: n.content, date: n.date ?? '' }))
          : []
      );
      const seeded =
        initialData.items && initialData.items.length > 0
          ? initialData.items.map((it) => ({
              checkItem: it.checkItem,
              checkResult: it.checkResult,
            }))
          : DEFAULT_SELF_INSPECTION_ITEMS.map((name) => ({
              checkItem: name,
              checkResult: '' as const,
            }));
      setItems(seeded);
      // snapshot 복원: edit 시 기존 기록값 표시 (없으면 장비 마스터 derive)
      setClassification(initialData.classification ?? deriveClassification(equipment));
      setCalibrationValidityPeriod(initialData.calibrationValidityPeriod ?? '');
    } else {
      resetForm();
    }
  }, [open, initialData, resetForm, equipment]);

  const handleMutationError = (error: Error, fallbackKey: 'createError' | 'updateError') => {
    if (isConflictError(error)) {
      const conflictInfo = getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, tErrors);
      toast({
        title: conflictInfo.title,
        description: conflictInfo.message,
        variant: 'destructive',
      });
      // CAS 409: 상세 캐시 삭제 → 다음 열람 시 최신 version refetch
      queryClient.removeQueries({
        queryKey: queryKeys.equipment.selfInspections(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.selfInspections(equipmentId),
      });
      // Phase 0A-ext: CAS 409 강제 닫기 — confirm 우회 (사용자가 재시도 의도)
      close.markCommitted();
      onOpenChange(false);
      return;
    }
    toast({
      variant: 'destructive',
      description: t(`selfInspection.form.${fallbackKey}`),
    });
  };

  const invalidateAfterSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.equipment.selfInspections(equipmentId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.equipment.detail(equipmentId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateSelfInspectionDto) => createSelfInspection(equipmentId, data),
    onSuccess: () => {
      toast({ description: t('selfInspection.form.createSuccess') });
      invalidateAfterSuccess();
      // Phase 0A-ext: submit 성공 → 다음 requestClose에서 confirm 우회
      close.markCommitted();
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => handleMutationError(error, 'createError'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSelfInspectionDto) => {
      if (!initialData) throw new Error('updateMutation called without initialData');
      return updateSelfInspection(initialData.id, data);
    },
    onSuccess: () => {
      toast({ description: t('selfInspection.form.updateSuccess') });
      invalidateAfterSuccess();
      // Phase 0A-ext: submit 성공 → 다음 requestClose에서 confirm 우회
      close.markCommitted();
      onOpenChange(false);
    },
    onError: (error: Error) => handleMutationError(error, 'updateError'),
  });

  const handleAddItem = () => {
    setItems((prev) => [...prev, { checkItem: '', checkResult: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SelfInspectionItemForm, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const isValid =
    inspectionDate &&
    overallResult &&
    items.length > 0 &&
    items.every((item) => item.checkItem && item.checkResult);

  // Phase 0A-ext: close hook은 위에서 정의됨 (resetForm 직후) — markCommitted 호출 위해

  // Phase 0C: 종합결과↔항목결과 정합성 — 항목 fail 1+ 인데 종합 pass 면 alert
  const failCount = items.filter((it) => it.checkResult === 'fail').length;
  const showConsistencyAlert = failCount > 0 && overallResult === 'pass';

  // Phase 0C: 프리셋에서 새 항목 추가 — checkCriteria는 자체점검 type 미지원이므로 무시
  const handlePresetSelect = (checkItem: string) => {
    setItems((prev) => [...prev, { checkItem, checkResult: '' }]);
  };

  // Phase 0C: segmented control row 시각 — 합부 값에 따라 left border + bg tint
  const getRowStateClass = (judgment: string) => {
    if (judgment === 'pass') return INSPECTION_CHECKITEM_ROW_STATE.rowPass;
    if (judgment === 'fail') return INSPECTION_CHECKITEM_ROW_STATE.rowFail;
    if (judgment === 'na') return INSPECTION_CHECKITEM_ROW_STATE.rowNa;
    return INSPECTION_CHECKITEM_ROW_STATE.rowNone;
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const payload = {
      inspectionDate,
      overallResult: overallResult as SelfInspectionResult,
      inspectionCycle,
      items: items.map((item, idx) => ({
        itemNumber: idx + 1,
        checkItem: item.checkItem,
        checkResult: item.checkResult as SelfInspectionItemJudgment,
      })),
      ...(remarks ? { remarks } : {}),
      ...(specialNotes.length > 0
        ? { specialNotes: specialNotes.map((n) => ({ content: n.content, date: n.date || null })) }
        : {}),
      // UL-QP-18-05 헤더 snapshot — 명시적으로 전달하여 서버 auto-derive 대신 사용자 확인값 저장
      ...(classification ? { classification: classification as EquipmentClassification } : {}),
      ...(calibrationValidityPeriod ? { calibrationValidityPeriod } : {}),
    };

    if (isEdit && initialData) {
      updateMutation.mutate({ version: initialData.version, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) close.requestClose();
        else onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
        // Phase 0A: outside-click → form reset → 작성 중 데이터 손실 방지 (디자인 리뷰 b6)
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // Phase 0A-ext: Esc 키 작성 데이터 가드
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close.requestClose();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {isEdit ? t('selfInspection.form.editTitle') : t('selfInspection.form.title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
            {/* Phase 0B: 분류 시각 (intermediate vs self), 디자인 리뷰 b8 */}
            <span className={INSPECTION_KIND_BADGE.self}>{t('inspection.kindLabel.self')}</span>
            {/* Phase 1B-D: template version badge — create 모드에서만 표시 */}
            {!isEdit && currentTemplate ? (
              <span
                className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.container}
                aria-label={t('selfInspection.template.versionBadgeAria', {
                  version: currentTemplate.version,
                  date: currentTemplate.createdAt.slice(0, 10),
                  author:
                    currentTemplate.createdByName ?? t('selfInspection.template.systemAuthor'),
                })}
              >
                <ClipboardList
                  className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.icon}
                  aria-hidden="true"
                />
                <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.version}>
                  v{currentTemplate.version}
                </span>
                <span
                  className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.separator}
                  aria-hidden="true"
                >
                  ·
                </span>
                <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.meta}>
                  {currentTemplate.createdAt.slice(0, 10)}
                  {' · '}
                  {currentTemplate.createdByName ?? t('selfInspection.template.systemAuthor')}
                </span>
              </span>
            ) : !isEdit && isTemplateMissing ? (
              <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.missing}>
                {t('selfInspection.template.missingBadge')}
              </span>
            ) : null}
            {/* Phase 0B: status badge (isEdit 모드) — Nielsen IA-3 */}
            {isEdit && initialData?.approvalStatus && (
              <span
                className={getInspectionStatusBadgeClasses(initialData.approvalStatus, 'lg')}
                aria-label={t('selfInspection.statusBadge.ariaLabel', {
                  status: t(
                    `selfInspection.statusLabel.${initialData.approvalStatus}` as Parameters<
                      typeof t
                    >[0]
                  ),
                })}
              >
                {t(
                  `selfInspection.statusLabel.${initialData.approvalStatus}` as Parameters<
                    typeof t
                  >[0]
                )}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>{t('selfInspection.form.description')}</DialogDescription>
          {/* Phase 0B: 반려 사유 inline alert (role=status + aria-live=polite, 디자인 리뷰 b16) */}
          {isEdit && initialData?.approvalStatus === 'rejected' && initialData?.rejectionReason && (
            <div
              role="status"
              aria-live="polite"
              className={INSPECTION_STATUS_BADGE.rejectionAlert}
            >
              <div className="flex-1">
                <strong className="text-destructive">
                  {t('selfInspection.statusBadge.rejectionAlertTitle')}:
                </strong>{' '}
                <span className="text-muted-foreground">
                  {initialData.rejectionReason.slice(
                    0,
                    INSPECTION_STATUS_BADGE.rejectionExcerptMax
                  )}
                  {initialData.rejectionReason.length >
                    INSPECTION_STATUS_BADGE.rejectionExcerptMax && '…'}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* 점검일 + 종합결과 + 점검 주기 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('selfInspection.date')}</Label>
              <Input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('selfInspection.overallResult')}</Label>
              <Select
                value={overallResult}
                onValueChange={(v) => setOverallResult(v as SelfInspectionResult)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selfInspection.form.selectResult')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">{t('selfInspection.judgment.pass')}</SelectItem>
                  <SelectItem value="fail">{t('selfInspection.judgment.fail')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('selfInspection.inspectionCycle.label')}</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={inspectionCycle}
                onChange={(e) => setInspectionCycle(Number(e.target.value))}
              />
            </div>
          </div>

          {/* 양식 헤더 snapshot (UL-QP-18-05 T0 R0 C1: 분류 / T0 R3 C3: 교정유효기간) */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('selfInspection.form.snapshotSectionLabel')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('selfInspection.snapshotClassificationLabel')}</Label>
                <Select
                  value={classification}
                  onValueChange={(v) => setClassification(v as EquipmentClassification)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selfInspection.form.selectClassification')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calibrated">
                      {t('selfInspection.snapshotClassificationCalibrated')}
                    </SelectItem>
                    <SelectItem value="non_calibrated">
                      {t('selfInspection.snapshotClassificationNonCalibrated')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('selfInspection.snapshotCalibrationValidityPeriodLabel')}</Label>
                <Input
                  value={calibrationValidityPeriod}
                  onChange={(e) => setCalibrationValidityPeriod(e.target.value)}
                  placeholder={t('selfInspection.form.calibrationValidityPeriodPlaceholder')}
                  maxLength={50}
                />
              </div>
            </div>
          </div>

          {/* 점검 항목 — Phase 0C: 정합성 alert + segmented + preset prominent */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('selfInspection.checkItem')}</Label>
            </div>

            {/* Phase 0C: 종합↔항목 정합성 alert (role=alert, WCAG 4.1.3) */}
            {showConsistencyAlert && (
              <div role="alert" className={INSPECTION_CHECKITEM_ROW_STATE.consistencyAlert}>
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className={INSPECTION_CHECKITEM_ROW_STATE.consistencyAlertTitle}>
                    {t('selfInspection.consistencyAlert.title')}
                  </p>
                  <p className={INSPECTION_CHECKITEM_ROW_STATE.consistencyAlertBody}>
                    {t('selfInspection.consistencyAlert.body', { failCount })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-8"
                  onClick={() => setOverallResult('fail')}
                >
                  {t('selfInspection.consistencyAlert.quickFixCta')}
                </Button>
              </div>
            )}

            {/* Phase 0C: 프리셋 + 직접 추가 — prominent 위치 (디자인 리뷰 b8) */}
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <CheckItemPresetSelect onSelect={(checkItem) => handlePresetSelect(checkItem)} />
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                {t('selfInspection.preset.addCustomLabel')}
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    INSPECTION_CHECKITEM_ROW_STATE.rowBase,
                    getRowStateClass(item.checkResult)
                  )}
                >
                  <span className="text-xs text-muted-foreground w-6 text-right shrink-0 tabular-nums">
                    {index + 1}
                  </span>
                  <Input
                    value={item.checkItem}
                    onChange={(e) => handleItemChange(index, 'checkItem', e.target.value)}
                    placeholder={t('selfInspection.form.itemNamePlaceholder')}
                    className="flex-1"
                  />
                  {/* Phase 0C: segmented control (pass/fail/na) — 색·아이콘 강화 (디자인 리뷰 b6/b11) */}
                  <div
                    role="radiogroup"
                    aria-label={t('selfInspection.checkResult')}
                    className={INSPECTION_CHECKITEM_ROW_STATE.segGroup}
                  >
                    {(['pass', 'fail', 'na'] as const).map((value) => {
                      const active = item.checkResult === value;
                      const Icon = value === 'pass' ? Check : value === 'fail' ? XIcon : Minus;
                      const activeClass =
                        value === 'pass'
                          ? INSPECTION_CHECKITEM_ROW_STATE.segPass
                          : value === 'fail'
                            ? INSPECTION_CHECKITEM_ROW_STATE.segFail
                            : INSPECTION_CHECKITEM_ROW_STATE.segNa;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => handleItemChange(index, 'checkResult', value)}
                          className={cn(
                            INSPECTION_CHECKITEM_ROW_STATE.segItem,
                            active ? activeClass : INSPECTION_CHECKITEM_ROW_STATE.segInactive
                          )}
                        >
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          {t(`selfInspection.judgment.${value}` as Parameters<typeof t>[0])}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    aria-label={t('selfInspection.form.removeItem')}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 비고 */}
          <div className="space-y-2">
            <Label>{t('selfInspection.remarks')}</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('selfInspection.form.remarksPlaceholder')}
              rows={3}
            />
          </div>

          {/* 기타 특기사항 (QP-18-05 섹션 3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('selfInspection.specialNotes.label')}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSpecialNotes((prev) => [...prev, { content: '', date: '' }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('selfInspection.specialNotes.addButton')}
              </Button>
            </div>
            {specialNotes.length > 0 && (
              <div className="space-y-2">
                {specialNotes.map((note, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                      {index + 1}
                    </span>
                    <Input
                      value={note.content}
                      onChange={(e) =>
                        setSpecialNotes((prev) =>
                          prev.map((n, i) => (i === index ? { ...n, content: e.target.value } : n))
                        )
                      }
                      placeholder={t('selfInspection.specialNotes.contentPlaceholder')}
                      className="flex-1"
                    />
                    <Input
                      value={note.date}
                      onChange={(e) =>
                        setSpecialNotes((prev) =>
                          prev.map((n, i) => (i === index ? { ...n, date: e.target.value } : n))
                        )
                      }
                      placeholder={t('selfInspection.specialNotes.datePlaceholder')}
                      className="w-36"
                      type="date"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSpecialNotes((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button variant="outline" onClick={close.requestClose}>
            {t('selfInspection.form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending} loading={isPending}>
            {isPending
              ? t('selfInspection.form.saving')
              : isEdit
                ? t('selfInspection.form.update')
                : t('selfInspection.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Phase 0A-ext: cancel/X/Esc 작성 데이터 가드 */}
      <AlertDialog
        open={close.confirmOpen}
        onOpenChange={(o) => {
          if (!o) close.cancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('selfInspection.cancelConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('selfInspection.cancelConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close.cancel}>
              {t('selfInspection.cancelConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={close.confirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('selfInspection.cancelConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
