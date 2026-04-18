'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { Plus, Trash2 } from 'lucide-react';
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
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
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

export default function SelfInspectionFormDialog({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? t('selfInspection.form.editTitle') : t('selfInspection.form.title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </DialogTitle>
          <DialogDescription>{t('selfInspection.form.description')}</DialogDescription>
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

          {/* 점검 항목 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('selfInspection.checkItem')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                {t('selfInspection.form.addItem')}
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                    {index + 1}
                  </span>
                  <Input
                    value={item.checkItem}
                    onChange={(e) => handleItemChange(index, 'checkItem', e.target.value)}
                    placeholder={t('selfInspection.form.itemNamePlaceholder')}
                    className="flex-1"
                  />
                  <Select
                    value={item.checkResult}
                    onValueChange={(v) => handleItemChange(index, 'checkResult', v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder={t('selfInspection.form.selectJudgment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">{t('selfInspection.judgment.pass')}</SelectItem>
                      <SelectItem value="fail">{t('selfInspection.judgment.fail')}</SelectItem>
                      <SelectItem value="na">{t('selfInspection.judgment.na')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('selfInspection.form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending
              ? t('selfInspection.form.saving')
              : isEdit
                ? t('selfInspection.form.update')
                : t('selfInspection.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
