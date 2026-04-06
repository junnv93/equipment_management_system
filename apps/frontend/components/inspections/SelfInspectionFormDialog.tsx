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
import { createSelfInspection, type CreateSelfInspectionDto } from '@/lib/api/self-inspection-api';
import type {
  SelfInspectionItemJudgment,
  SelfInspectionResult,
} from '@equipment-management/schemas';
import { DEFAULT_SELF_INSPECTION_ITEMS } from '@equipment-management/schemas';

interface SelfInspectionItemForm {
  checkItem: string;
  checkResult: SelfInspectionItemJudgment | '';
}

interface SelfInspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
}

export default function SelfInspectionFormDialog({
  open,
  onOpenChange,
  equipmentId,
}: SelfInspectionFormDialogProps) {
  const t = useTranslations('equipment');
  const tErrors = useTranslations('errors');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inspectionDate, setInspectionDate] = useState('');
  const [overallResult, setOverallResult] = useState<SelfInspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<SelfInspectionItemForm[]>(
    DEFAULT_SELF_INSPECTION_ITEMS.map((name) => ({ checkItem: name, checkResult: '' }))
  );

  const resetForm = () => {
    setInspectionDate('');
    setOverallResult('');
    setRemarks('');
    setItems(DEFAULT_SELF_INSPECTION_ITEMS.map((name) => ({ checkItem: name, checkResult: '' })));
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateSelfInspectionDto) => createSelfInspection(equipmentId, data),
    onSuccess: () => {
      toast({ description: t('selfInspection.form.createSuccess') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.selfInspections(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.detail(equipmentId),
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
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
        description: t('selfInspection.form.createError'),
      });
    },
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

    const dto: CreateSelfInspectionDto = {
      inspectionDate,
      overallResult: overallResult as SelfInspectionResult,
      items: items.map((item, idx) => ({
        itemNumber: idx + 1,
        checkItem: item.checkItem,
        checkResult: item.checkResult as SelfInspectionItemJudgment,
      })),
      ...(remarks ? { remarks } : {}),
    };

    createMutation.mutate(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('selfInspection.form.title')}</DialogTitle>
          <DialogDescription>{t('selfInspection.form.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 점검일 + 종합결과 */}
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('selfInspection.form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
            {createMutation.isPending
              ? t('selfInspection.form.saving')
              : t('selfInspection.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
