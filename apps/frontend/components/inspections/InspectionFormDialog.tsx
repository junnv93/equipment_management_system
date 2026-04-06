'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import type { CreateInspectionDto } from '@/lib/api/calibration-api';
import type { InspectionJudgment, InspectionResult } from '@equipment-management/schemas';

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

  // Form state
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCycle, setInspectionCycle] = useState('');
  const [calibrationValidityPeriod, setCalibrationValidityPeriod] = useState('');
  const [overallResult, setOverallResult] = useState<InspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<InspectionItemForm[]>([]);

  const resetForm = () => {
    setInspectionDate('');
    setInspectionCycle('');
    setCalibrationValidityPeriod('');
    setOverallResult('');
    setRemarks('');
    setItems([]);
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
      // 교차 캐시 무효화: 점검 목록 + 교정 전체 + 장비 상세
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
      // NO_ACTIVE_CALIBRATION 에러 특별 처리
      const apiError = error as Error & { response?: { code?: string } };
      if (apiError.response?.code === 'NO_ACTIVE_CALIBRATION') {
        toast({
          variant: 'destructive',
          description: tEquip('inspection.noActiveCalibration'),
        });
        return;
      }
      // VERSION_CONFLICT 에러 처리
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

  const handleSubmit = () => {
    if (!inspectionDate) return;

    const dto: CreateInspectionDto = {
      inspectionDate,
      classification: 'calibrated' as const,
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
    };

    createMutation.mutate(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('intermediateInspection.formTitle')}</DialogTitle>
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

          {/* 점검 주기 + 교정 유효기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('intermediateInspection.inspectionCycle')}</Label>
              <Input
                value={inspectionCycle}
                onChange={(e) => setInspectionCycle(e.target.value)}
                placeholder={t('intermediateInspection.inspectionCyclePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('intermediateInspection.calibrationValidityPeriod')}</Label>
              <Input
                value={calibrationValidityPeriod}
                onChange={(e) => setCalibrationValidityPeriod(e.target.value)}
                placeholder={t('intermediateInspection.validityPeriodPlaceholder')}
              />
            </div>
          </div>

          {/* 점검 항목 동적 배열 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('intermediateInspection.items.title')}
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                {t('intermediateInspection.items.addItem')}
              </Button>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('intermediateInspection.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!inspectionDate || createMutation.isPending}>
            {createMutation.isPending
              ? t('intermediateInspection.saving')
              : t('intermediateInspection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
