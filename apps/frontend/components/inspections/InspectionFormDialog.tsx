'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { Plus, Trash2, Info, ClipboardList, Wrench } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import equipmentApi from '@/lib/api/equipment-api';
import type { CreateInspectionDto, CreateResultSectionDto } from '@/lib/api/calibration-api';
import type { InspectionJudgment, InspectionResult } from '@equipment-management/schemas';
import {
  INSPECTION_SPACING,
  INSPECTION_ITEM_CARD,
  INSPECTION_EMPTY_STATE,
  INSPECTION_PREFILL,
  getJudgmentCardClasses,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { EquipmentCombobox } from '@/components/ui/equipment-combobox';
import type { Equipment } from '@/lib/api/equipment-api';
import CheckItemPresetSelect from './CheckItemPresetSelect';
import InlineResultSectionsEditor from './InlineResultSectionsEditor';

interface InspectionItemForm {
  checkItem: string;
  checkCriteria: string;
  checkResult: string;
  judgment: InspectionJudgment | '';
}

interface MeasurementEquipmentForm {
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  calibrationDate: string;
}

interface InspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName?: string;
  calibrationId?: string;
}

/**
 * 교정유효기간을 교정주기(개월)에서 파생
 * calibrationCycle은 개월 단위 → "N년" 또는 "N개월" 형식으로 변환
 */
function deriveCalibrationValidityPeriod(
  calibrationCycleMonths: number | string | null | undefined
): string | null {
  if (!calibrationCycleMonths) return null;
  const months = Number(calibrationCycleMonths);
  if (!months || months <= 0) return null;
  if (months % 12 === 0) return `${months / 12}년`;
  return `${months}개월`;
}

export default function InspectionFormDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  calibrationId,
}: InspectionFormDialogProps) {
  const t = useTranslations('calibration');
  const tEquip = useTranslations('equipment');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state — classification은 항상 "교정기기"로 고정 (중간점검은 교정기기 전용)
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCycle, setInspectionCycle] = useState('');
  const [calibrationValidityPeriod, setCalibrationValidityPeriod] = useState('');
  const [overallResult, setOverallResult] = useState<InspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<InspectionItemForm[]>([]);
  const [resultSections, setResultSections] = useState<CreateResultSectionDto[]>([]);
  const [measurementEquipment, setMeasurementEquipment] = useState<MeasurementEquipmentForm[]>([]);
  const [prefilled, setPrefilled] = useState<Record<string, boolean>>({});

  // Fetch equipment data for prefill
  const { data: equipment, isLoading: isEquipmentLoading } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    enabled: open,
  });

  // Prefill from equipment master data when dialog opens
  useEffect(() => {
    if (!open || !equipment) return;

    const newPrefilled: Record<string, boolean> = {};

    // 점검주기: 중간점검 주기 (intermediateCheckCycle) 사용, fallback으로 교정주기의 절반
    if (!inspectionCycle) {
      if (equipment.intermediateCheckCycle) {
        setInspectionCycle(`${equipment.intermediateCheckCycle}개월`);
        newPrefilled.inspectionCycle = true;
      } else if (equipment.calibrationCycle) {
        const halfCycle = Math.round(Number(equipment.calibrationCycle) / 2);
        setInspectionCycle(`${halfCycle}개월`);
        newPrefilled.inspectionCycle = true;
      }
    }

    // 교정유효기간: calibrationCycle에서 자동 파생, 수정 가능
    if (!calibrationValidityPeriod) {
      const derived = deriveCalibrationValidityPeriod(equipment.calibrationCycle);
      if (derived) {
        setCalibrationValidityPeriod(derived);
        newPrefilled.calibrationValidityPeriod = true;
      }
    }

    setPrefilled(newPrefilled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, equipment]);

  const resetForm = () => {
    setInspectionDate('');
    setInspectionCycle('');
    setCalibrationValidityPeriod('');
    setOverallResult('');
    setRemarks('');
    setItems([]);
    setResultSections([]);
    setMeasurementEquipment([]);
    setPrefilled({});
  };

  const tErrors = useTranslations('errors');

  const createMutation = useMutation({
    mutationFn: (data: CreateInspectionDto) => {
      if (calibrationId) {
        return calibrationApi.intermediateInspections.create(calibrationId, data);
      }
      return calibrationApi.intermediateInspections.createByEquipment(equipmentId, data);
    },
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.createSuccess') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.detail(equipmentId),
      });
      if (calibrationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.calibrations.all,
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const apiError = error as Error & { response?: { code?: string } };
      if (apiError.response?.code === 'NO_ACTIVE_CALIBRATION') {
        toast({
          variant: 'destructive',
          description: tEquip('inspection.noActiveCalibration'),
        });
        return;
      }
      if (isConflictError(error)) {
        const conflictInfo = getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, tErrors);
        toast({
          title: conflictInfo.title,
          description: conflictInfo.message,
          variant: 'destructive',
        });
        // CAS 409: stale 캐시 제거 → 다음 열람 시 최신 version refetch
        queryClient.removeQueries({
          queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
        });
        if (calibrationId) {
          queryClient.removeQueries({
            queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
          });
        }
        onOpenChange(false);
        return;
      }
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.createError'),
      });
    },
  });

  const handleAddPresetItem = (checkItem: string, checkCriteria: string) => {
    setItems((prev) => [...prev, { checkItem, checkCriteria, checkResult: '', judgment: '' }]);
    // 프리셋 항목 추가 시 해당 제목으로 결과 섹션 자동 생성 (title 타입 — 사용자가 결과 형식 선택)
    if (checkItem) {
      setResultSections((prev) => [
        ...prev,
        { sortOrder: prev.length, sectionType: 'title', title: checkItem },
      ]);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { checkItem: '', checkCriteria: '', checkResult: '', judgment: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── 측정 장비 리스트 ──

  const handleAddMeasurementEquipment = (equipmentId: string | undefined) => {
    if (!equipmentId) return;
    // 중복 방지
    if (measurementEquipment.some((me) => me.equipmentId === equipmentId)) return;

    // 장비 정보 fetch
    equipmentApi.getEquipment(equipmentId).then((eq: Equipment) => {
      setMeasurementEquipment((prev) => [
        ...prev,
        {
          equipmentId: String(eq.id),
          equipmentName: eq.name,
          managementNumber: eq.managementNumber ?? '',
          calibrationDate: eq.lastCalibrationDate
            ? String(eq.lastCalibrationDate).slice(0, 10)
            : '',
        },
      ]);
    });
  };

  const handleRemoveMeasurementEquipment = (index: number) => {
    setMeasurementEquipment((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InspectionItemForm, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const hasInvalidItems = items.some(
    (item) => !item.checkItem.trim() || !item.checkCriteria.trim()
  );

  const handleSubmit = () => {
    if (!inspectionDate || hasInvalidItems) return;

    const dto: CreateInspectionDto = {
      inspectionDate,
      classification: 'calibrated',
      ...(inspectionCycle ? { inspectionCycle } : {}),
      ...(calibrationValidityPeriod ? { calibrationValidityPeriod } : {}),
      ...(overallResult ? { overallResult } : {}),
      ...(remarks ? { remarks } : {}),
      ...(items.length > 0
        ? {
            items: items.map((item, idx) => ({
              itemNumber: idx + 1,
              checkItem: item.checkItem,
              checkCriteria: item.checkCriteria,
              ...(item.checkResult ? { checkResult: item.checkResult } : {}),
              ...(item.judgment ? { judgment: item.judgment as InspectionJudgment } : {}),
            })),
          }
        : {}),
      ...(resultSections.length > 0 ? { resultSections } : {}),
      ...(measurementEquipment.length > 0
        ? {
            measurementEquipment: measurementEquipment.map((me) => ({
              equipmentId: me.equipmentId,
              ...(me.calibrationDate ? { calibrationDate: me.calibrationDate } : {}),
            })),
          }
        : {}),
    };

    createMutation.mutate(dto);
  };

  const renderPrefillBadge = (field: string) => {
    if (!prefilled[field]) return null;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('intermediateInspection.formTitle')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-03'].name} />
          </DialogTitle>
          {equipmentName && <DialogDescription>{equipmentName}</DialogDescription>}
        </DialogHeader>

        <div className={INSPECTION_SPACING.section}>
          {/* 점검일 + 종합 판정 */}
          <div className="grid grid-cols-2 gap-4">
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('intermediateInspection.inspectionDate')}</Label>
              <Input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
              />
            </div>
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('intermediateInspection.overallResult')}</Label>
              <Select
                value={overallResult}
                onValueChange={(v) => setOverallResult(v as InspectionResult)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">
                    {t('intermediateInspection.resultOptions.pass')}
                  </SelectItem>
                  <SelectItem value="fail">
                    {t('intermediateInspection.resultOptions.fail')}
                  </SelectItem>
                  <SelectItem value="conditional">
                    {t('intermediateInspection.resultOptions.conditional')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 점검 주기 + 교정 유효기간 */}
          {isEquipmentLoading ? (
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className={INSPECTION_SPACING.field}>
                <div className="flex items-center">
                  <Label>{t('intermediateInspection.inspectionCycle')}</Label>
                  {renderPrefillBadge('inspectionCycle')}
                </div>
                <Input
                  value={inspectionCycle}
                  onChange={(e) => {
                    setInspectionCycle(e.target.value);
                    setPrefilled((prev) => ({ ...prev, inspectionCycle: false }));
                  }}
                  placeholder={t('intermediateInspection.inspectionCyclePlaceholder')}
                />
              </div>
              <div className={INSPECTION_SPACING.field}>
                <div className="flex items-center">
                  <Label>{t('intermediateInspection.calibrationValidityPeriod')}</Label>
                  {renderPrefillBadge('calibrationValidityPeriod')}
                </div>
                <Input
                  value={calibrationValidityPeriod}
                  onChange={(e) => {
                    setCalibrationValidityPeriod(e.target.value);
                    setPrefilled((prev) => ({ ...prev, calibrationValidityPeriod: false }));
                  }}
                  placeholder={t('intermediateInspection.validityPeriodPlaceholder')}
                />
              </div>
            </div>
          )}

          {/* 점검 항목 동적 배열 */}
          <div className={INSPECTION_SPACING.group}>
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('intermediateInspection.items.title')}
              </Label>
              <div className="flex gap-2">
                <CheckItemPresetSelect onSelect={handleAddPresetItem} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  aria-label={t('intermediateInspection.items.addItem')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('intermediateInspection.items.addItem')}
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className={INSPECTION_EMPTY_STATE.container}>
                <ClipboardList className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
                <p className={INSPECTION_EMPTY_STATE.title}>
                  {t('intermediateInspection.items.noItems')}
                </p>
                <p className={INSPECTION_EMPTY_STATE.description}>
                  {t('intermediateInspection.items.noItemsDescription')}
                </p>
              </div>
            ) : (
              <div className={INSPECTION_SPACING.group}>
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      INSPECTION_ITEM_CARD.base,
                      INSPECTION_SPACING.group,
                      getJudgmentCardClasses(item.judgment),
                      ANIMATION_PRESETS.slideUpFade,
                      'motion-safe:duration-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={INSPECTION_ITEM_CARD.number}>#{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        aria-label={t('intermediateInspection.items.removeItem')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className={INSPECTION_ITEM_CARD.fieldGrid}>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.checkItem')}
                        </Label>
                        <Input
                          value={item.checkItem}
                          onChange={(e) => handleItemChange(index, 'checkItem', e.target.value)}
                        />
                      </div>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.checkCriteria')}
                        </Label>
                        <Input
                          value={item.checkCriteria}
                          onChange={(e) => handleItemChange(index, 'checkCriteria', e.target.value)}
                        />
                      </div>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.checkResult')}
                        </Label>
                        <Input
                          value={item.checkResult}
                          onChange={(e) => handleItemChange(index, 'checkResult', e.target.value)}
                        />
                      </div>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.judgment')}
                        </Label>
                        <Select
                          value={item.judgment}
                          onValueChange={(v) => handleItemChange(index, 'judgment', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">
                              {t('intermediateInspection.items.judgmentOptions.pass')}
                            </SelectItem>
                            <SelectItem value="fail">
                              {t('intermediateInspection.items.judgmentOptions.fail')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 측정 장비 리스트 */}
          <div className={INSPECTION_SPACING.group}>
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('intermediateInspection.measurementEquipment.title')}
              </Label>
              <EquipmentCombobox
                value={undefined}
                onChange={handleAddMeasurementEquipment}
                placeholder={t('intermediateInspection.measurementEquipment.searchPlaceholder')}
                excludeIds={measurementEquipment.map((me) => me.equipmentId)}
              />
            </div>

            {measurementEquipment.length === 0 ? (
              <div className={INSPECTION_EMPTY_STATE.container}>
                <Wrench className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
                <p className={INSPECTION_EMPTY_STATE.title}>
                  {t('intermediateInspection.measurementEquipment.empty')}
                </p>
                <p className={INSPECTION_EMPTY_STATE.description}>
                  {t('intermediateInspection.measurementEquipment.emptyDescription')}
                </p>
              </div>
            ) : (
              <div className="rounded border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-xs">
                      <th className="text-left px-3 py-2 font-medium">#</th>
                      <th className="text-left px-3 py-2 font-medium">
                        {t('intermediateInspection.measurementEquipment.managementNumber')}
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        {t('intermediateInspection.measurementEquipment.equipmentName')}
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        {t('intermediateInspection.measurementEquipment.calibrationDate')}
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {measurementEquipment.map((me, idx) => (
                      <tr key={me.equipmentId} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-xs">
                          {me.managementNumber}
                        </td>
                        <td className="px-3 py-2">{me.equipmentName}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-xs">
                          {me.calibrationDate || '—'}
                        </td>
                        <td className="px-1 py-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMeasurementEquipment(idx)}
                            aria-label={t('intermediateInspection.items.removeItem')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 비고 */}
          <div className={INSPECTION_SPACING.field}>
            <Label>{t('intermediateInspection.remarks')}</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('intermediateInspection.remarksPlaceholder')}
              rows={3}
            />
          </div>

          {/* 측정 결과 데이터 인라인 */}
          <Separator className={INSPECTION_SPACING.divider} />
          <InlineResultSectionsEditor sections={resultSections} onChange={setResultSections} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('intermediateInspection.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!inspectionDate || hasInvalidItems || createMutation.isPending}
          >
            {createMutation.isPending
              ? t('intermediateInspection.saving')
              : t('intermediateInspection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
