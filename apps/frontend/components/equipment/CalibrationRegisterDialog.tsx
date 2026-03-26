'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import calibrationApi, { type CreateCalibrationDto } from '@/lib/api/calibration-api';
import { documentApi } from '@/lib/api/document-api';
import { CalibrationCacheInvalidation } from '@/lib/api/cache-invalidation';
import { addMonths } from 'date-fns';
import { formatDate, toDate } from '@/lib/utils/date';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { CalibrationResultEnum, CALIBRATION_RESULT_LABELS } from '@equipment-management/schemas';

const calibrationSchema = z.object({
  calibrationDate: z.string().min(1, '교정일을 입력하세요'),
  nextCalibrationDate: z.string().min(1, '다음 교정일을 입력하세요'),
  calibrationAgency: z.string().min(1, '교정 기관을 입력하세요').max(100),
  certificateNumber: z.string().min(1, '교정성적서 번호를 입력하세요').max(100),
  calibrationCycle: z.coerce.number().min(1, '교정 주기를 입력하세요 (최소 1개월)'),
  result: CalibrationResultEnum,
  notes: z.string().optional(),
});

type CalibrationFormData = z.infer<typeof calibrationSchema>;

// 폼 기본값 팩토리 — useForm defaultValues와 form.reset() 양쪽 SSOT
const getDefaultValues = (): CalibrationFormData => ({
  calibrationDate: formatDate(new Date(), 'yyyy-MM-dd'),
  nextCalibrationDate: formatDate(addMonths(new Date(), 12), 'yyyy-MM-dd'),
  calibrationAgency: '',
  certificateNumber: '',
  calibrationCycle: 12,
  result: undefined as unknown as CalibrationFormData['result'],
  notes: '',
});

interface CalibrationRegisterDialogProps {
  equipmentId: string;
}

export function CalibrationRegisterDialog({ equipmentId }: CalibrationRegisterDialogProps) {
  const t = useTranslations('equipment');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const form = useForm<CalibrationFormData>({
    resolver: zodResolver(calibrationSchema),
    defaultValues: getDefaultValues(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCalibrationDto) => calibrationApi.createCalibration(data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ calibrationId, file }: { calibrationId: string; file: File }) =>
      documentApi.uploadCalibrationDocuments(calibrationId, [file], ['calibration_certificate']),
  });

  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  const handleCalibrationDateChange = (date: string) => {
    const cycle = form.getValues('calibrationCycle') || 12;
    form.setValue(
      'nextCalibrationDate',
      formatDate(addMonths(toDate(date) ?? new Date(), cycle), 'yyyy-MM-dd')
    );
  };

  const handleCycleChange = (cycle: number) => {
    const date = form.getValues('calibrationDate');
    if (date) {
      form.setValue(
        'nextCalibrationDate',
        formatDate(addMonths(toDate(date) ?? new Date(), cycle), 'yyyy-MM-dd')
      );
    }
  };

  const handleSubmit = async (data: CalibrationFormData) => {
    if (!certificateFile) {
      toast({
        title: t('calibrationHistoryTab.toasts.fileRequired'),
        description: t('calibrationHistoryTab.toasts.fileRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const calibration = await createMutation.mutateAsync({
        equipmentId,
        calibrationDate: data.calibrationDate,
        nextCalibrationDate: data.nextCalibrationDate,
        calibrationAgency: data.calibrationAgency,
        certificateNumber: data.certificateNumber,
        result: data.result,
        notes: data.notes || undefined,
      });

      if (calibration?.id) {
        await uploadMutation.mutateAsync({ calibrationId: calibration.id, file: certificateFile });
      }

      await CalibrationCacheInvalidation.invalidateAfterCreate(queryClient, equipmentId);
      setIsOpen(false);
      setCertificateFile(null);
      form.reset(getDefaultValues());
      toast({
        title: t('calibrationHistoryTab.toasts.success'),
        description: t('calibrationHistoryTab.toasts.successDesc'),
      });
    } catch (error: unknown) {
      toast({
        title: t('calibrationHistoryTab.toasts.error'),
        description: getErrorMessage(error, t('calibrationHistoryTab.toasts.errorDesc')),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('calibrationHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('calibrationHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>{t('calibrationHistoryTab.dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calibrationHistoryTab.dialog.calibrationDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          handleCalibrationDateChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calibrationCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calibrationHistoryTab.dialog.calibrationCycle')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e);
                          handleCycleChange(parseInt(e.target.value) || 12);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nextCalibrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.nextCalibrationDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calibrationAgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.calibrationAgency')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('calibrationHistoryTab.dialog.calibrationAgencyPlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.certificateNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('calibrationHistoryTab.dialog.certificateNumberPlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.result')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('calibrationHistoryTab.dialog.resultPlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CalibrationResultEnum.options.map((value) => (
                        <SelectItem key={value} value={value}>
                          {CALIBRATION_RESULT_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>{t('calibrationHistoryTab.dialog.certificateFile')}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t('calibrationHistoryTab.dialog.certificateFileHint')}
              </p>
              {!certificateFile && (
                <p className="text-xs text-destructive">
                  {t('calibrationHistoryTab.dialog.certificateFileRequired')}
                </p>
              )}
            </FormItem>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('calibrationHistoryTab.dialog.notesPlaceholder')}
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {t('calibrationHistoryTab.dialog.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('calibrationHistoryTab.dialog.submitting')
                  : t('calibrationHistoryTab.dialog.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
