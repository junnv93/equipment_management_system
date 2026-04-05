'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import cablesApi, { type CreateMeasurementDto } from '@/lib/api/cables-api';
import { queryKeys } from '@/lib/api/query-config';

interface DataPointRow {
  frequencyMhz: string;
  lossDb: string;
}

interface MeasurementFormDialogProps {
  cableId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasurementFormDialog({ cableId, open, onOpenChange }: MeasurementFormDialogProps) {
  const t = useTranslations('cables');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [dataPoints, setDataPoints] = useState<DataPointRow[]>([{ frequencyMhz: '', lossDb: '' }]);
  const [bulkText, setBulkText] = useState('');

  const resetForm = () => {
    setMeasurementDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setDataPoints([{ frequencyMhz: '', lossDb: '' }]);
    setBulkText('');
  };

  const addRow = () => {
    setDataPoints([...dataPoints, { frequencyMhz: '', lossDb: '' }]);
  };

  const removeRow = (index: number) => {
    if (dataPoints.length <= 1) return;
    setDataPoints(dataPoints.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof DataPointRow, value: string) => {
    const updated = [...dataPoints];
    updated[index] = { ...updated[index], [field]: value };
    setDataPoints(updated);
  };

  const parseBulk = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const parsed: DataPointRow[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        parsed.push({ frequencyMhz: parts[0], lossDb: parts[1] });
      }
    }
    if (parsed.length > 0) {
      setDataPoints(parsed);
      setBulkText('');
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateMeasurementDto) => cablesApi.addMeasurement(cableId, data),
    onSuccess: () => {
      toast({ title: t('measurement.success') });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: t('measurement.error'), description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.detail(cableId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.measurements(cableId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.lists() });
    },
  });

  const handleSubmit = () => {
    const validPoints = dataPoints
      .filter((dp) => dp.frequencyMhz && dp.lossDb)
      .map((dp) => ({
        frequencyMhz: Number(dp.frequencyMhz),
        lossDb: dp.lossDb,
      }));

    if (validPoints.length === 0 || !measurementDate) return;

    const dto: CreateMeasurementDto = {
      measurementDate,
      notes: notes || undefined,
      dataPoints: validPoints,
    };
    createMutation.mutate(dto);
  };

  const hasValidData = dataPoints.some((dp) => dp.frequencyMhz && dp.lossDb) && measurementDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('measurement.formTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>{t('measurement.date')}</Label>
            <Input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('measurement.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('measurement.notesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Bulk Paste */}
          <div className="space-y-2">
            <Label>{t('measurement.bulkPaste')}</Label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={t('measurement.bulkPastePlaceholder')}
              rows={3}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={parseBulk}
              disabled={!bulkText.trim()}
            >
              {t('measurement.parseBulk')}
            </Button>
          </div>

          {/* Data Points */}
          <div className="space-y-2">
            <Label>{t('measurement.dataPoints')}</Label>
            <div className="space-y-2">
              {dataPoints.map((dp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={dp.frequencyMhz}
                    onChange={(e) => updateRow(idx, 'frequencyMhz', e.target.value)}
                    placeholder={t('measurement.frequency')}
                    className="flex-1 font-mono text-sm"
                  />
                  <Input
                    value={dp.lossDb}
                    onChange={(e) => updateRow(idx, 'lossDb', e.target.value)}
                    placeholder={t('measurement.loss')}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(idx)}
                    disabled={dataPoints.length <= 1}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-3 w-3" />
              {t('measurement.addRow')}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!hasValidData || createMutation.isPending}>
            {createMutation.isPending ? t('measurement.saving') : t('measurement.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
