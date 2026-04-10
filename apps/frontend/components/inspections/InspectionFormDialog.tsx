'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { Plus, Trash2, Info } from 'lucide-react';
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
import CheckItemPresetSelect from './CheckItemPresetSelect';
import InlineResultSectionsEditor from './InlineResultSectionsEditor';

interface InspectionItemForm {
  checkItem: string;
  checkCriteria: string;
  checkResult: string;
  judgment: InspectionJudgment | '';
}

interface InspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName?: string;
  calibrationId?: string;
}

/**
 * 교정유효기간을 "N년" 형식으로 계산
 * lastCalibrationDate ~ nextCalibrationDate 차이를 연 단위로 반올림
 */
function computeCalibrationValidityPeriod(
  lastCalDate: string | Date | null | undefined,
  nextCalDate: string | Date | null | undefined
): string | null {
  if (!lastCalDate || !nextCalDate) return null;
  const last = new Date(lastCalDate);
  const next = new Date(nextCalDate);
  const diffMs = next.getTime() - last.getTime();
  const diffYears = Math.round(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  if (diffYears <= 0) return null;
  return `${diffYears}년`;
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

    // 교정유효기간: lastCalibrationDate ~ nextCalibrationDate 기간 (예: "1년")
    if (!calibrationValidityPeriod) {
      const period = computeCalibrationValidityPeriod(
        equipment.lastCalibrationDate,
        equipment.nextCalibrationDate
      );
      if (period) {
        setCalibrationValidityPeriod(period);
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
    };

    createMutation.mutate(dto);
  };

  const renderPrefillBadge = (field: string) => {
    if (!prefilled[field]) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="ml-2 text-xs font-normal">
              <Info className="mr-1 h-3 w-3" />
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

        <div className="space-y-4">
          {/* 점검일 */}
          <div className="space-y-2">
            <Label>{t('intermediateInspection.inspectionDate')}</Label>
            <Input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              required
            />
          </div>

          {/* 종합 판정 */}
          <div className="space-y-2">
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

          {/* 점검 주기 + 교정 유효기간 (prefill) */}
          {isEquipmentLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
          <div className="space-y-3">
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
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('intermediateInspection.items.noItems')}
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('intermediateInspection.items.checkItem')}
                        </Label>
                        <Input
                          value={item.checkItem}
                          onChange={(e) => handleItemChange(index, 'checkItem', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('intermediateInspection.items.checkCriteria')}
                        </Label>
                        <Input
                          value={item.checkCriteria}
                          onChange={(e) => handleItemChange(index, 'checkCriteria', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('intermediateInspection.items.checkResult')}
                        </Label>
                        <Input
                          value={item.checkResult}
                          onChange={(e) => handleItemChange(index, 'checkResult', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
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

          {/* 비고 */}
          <div className="space-y-2">
            <Label>{t('intermediateInspection.remarks')}</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('intermediateInspection.remarksPlaceholder')}
              rows={3}
            />
          </div>

          {/* 측정 결과 데이터 인라인 */}
          <Separator />
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
