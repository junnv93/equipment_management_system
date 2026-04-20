'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { getErrorMessage } from '@/lib/api/error';
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { CalibrationCacheInvalidation } from '@/lib/api/cache-invalidation';
import {
  createCalibrationFormSchema,
  type CalibrationFormValues,
  type CalibrationFormOutput,
} from '@/lib/schemas/calibration-form-schema';
import { useCalibrationDateAutoCalc } from '@/hooks/use-calibration-date-auto-calc';
import {
  CalibrationResultEnum,
  CALIBRATION_RESULT_LABELS,
  DocumentTypeValues,
} from '@equipment-management/schemas';
import { FILE_UPLOAD_LIMITS } from '@equipment-management/shared-constants';
import { toDate, formatDate } from '@/lib/utils/date';
import { addMonths } from 'date-fns';

export interface CalibrationFormProps {
  mode: 'page' | 'dialog';
  equipmentId: string;
  /** plan item 실적 등록 시 전달 — 백엔드 auto-link 트리거 */
  planItemId?: string;
  defaultValues?: Partial<CalibrationFormValues>;
  onSuccess?: (calibration: Calibration) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const CERTIFICATE_ACCEPT = '.pdf,.jpg,.jpeg,.png';

function buildCalibrationFormData(values: CalibrationFormOutput, planItemId?: string): FormData {
  const fd = new FormData();

  const payload = {
    equipmentId: values.equipmentId,
    calibrationDate: formatDate(values.calibrationDate, 'yyyy-MM-dd'),
    nextCalibrationDate: formatDate(values.nextCalibrationDate, 'yyyy-MM-dd'),
    calibrationAgency: values.calibrationAgency,
    ...(values.certificateNumber ? { certificateNumber: values.certificateNumber } : {}),
    ...(values.result ? { result: values.result } : {}),
    ...(values.notes ? { notes: values.notes } : {}),
    ...(values.intermediateCheckDate
      ? { intermediateCheckDate: formatDate(values.intermediateCheckDate, 'yyyy-MM-dd') }
      : {}),
    ...(planItemId ? { planItemId } : {}),
  };

  fd.append('payload', JSON.stringify(payload));
  fd.append('files', values.certificateFile);
  fd.append('documentTypes', JSON.stringify([DocumentTypeValues.CALIBRATION_CERTIFICATE]));

  return fd;
}

export function CalibrationForm({
  mode,
  equipmentId,
  planItemId,
  defaultValues,
  onSuccess,
  onCancel,
  disabled = false,
}: CalibrationFormProps) {
  const t = useTranslations('calibration');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { calcDates } = useCalibrationDateAutoCalc();

  const schema = useMemo(() => createCalibrationFormSchema(t), [t]);

  const today = new Date();
  const form = useForm<CalibrationFormValues, unknown, CalibrationFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      equipmentId,
      calibrationDate: today,
      nextCalibrationDate: addMonths(today, 12),
      calibrationCycle: 12,
      calibrationAgency: '',
      certificateNumber: '',
      result: undefined as unknown as CalibrationFormOutput['result'],
      notes: '',
      ...defaultValues,
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => calibrationApi.createCalibrationWithFile(formData),
    onSuccess: async (response) => {
      await CalibrationCacheInvalidation.invalidateAfterCreate(queryClient, equipmentId);
      toast({ title: t('form.successTitle'), description: t('form.successDesc') });
      form.reset();
      onSuccess?.(response.calibration);
    },
    onError: (error: unknown) => {
      toast({
        title: t('form.errorTitle'),
        description: getErrorMessage(error, t('form.errorDesc')),
        variant: 'destructive',
      });
    },
  });

  const handleDateOrCycleChange = (
    calibrationDate: Date | undefined,
    cycle: number | undefined
  ) => {
    const rawDate = form.getValues('calibrationDate');
    const dateVal = calibrationDate ?? (rawDate instanceof Date ? rawDate : undefined);
    const rawCycle = form.getValues('calibrationCycle');
    const parsedCycle = typeof rawCycle === 'number' ? rawCycle : parseInt(String(rawCycle), 10);
    const cycleVal = cycle ?? (Number.isFinite(parsedCycle) ? parsedCycle : 12);
    if (!dateVal) return;
    const dateStr = formatDate(dateVal, 'yyyy-MM-dd');
    const { nextCalibrationDate, intermediateCheckDate } = calcDates(dateStr, cycleVal);
    form.setValue(
      'nextCalibrationDate',
      toDate(nextCalibrationDate) ?? addMonths(dateVal, cycleVal),
      {
        shouldDirty: false,
      }
    );
    if (intermediateCheckDate) {
      form.setValue('intermediateCheckDate', toDate(intermediateCheckDate) ?? undefined, {
        shouldDirty: false,
      });
    }
  };

  const onSubmit = (values: CalibrationFormOutput) => {
    mutation.mutate(buildCalibrationFormData(values, planItemId));
  };

  const isCompact = mode === 'dialog';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label={t('form.aria.label')}
      >
        {/* 교정 날짜 + 주기 */}
        <div
          className={isCompact ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}
        >
          <FormField
            control={form.control}
            name="calibrationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.calibrationDate')}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={disabled}
                    value={field.value ? formatDate(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = toDate(e.target.value);
                      field.onChange(date);
                      handleDateOrCycleChange(date ?? undefined, undefined);
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
                <FormLabel>{t('form.calibrationCycle')}</FormLabel>
                <Select
                  disabled={disabled}
                  value={String(field.value ?? 12)}
                  onValueChange={(v) => {
                    const cycle = parseInt(v, 10);
                    field.onChange(cycle);
                    handleDateOrCycleChange(undefined, cycle);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[3, 6, 12, 24, 36].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {t('form.cycleOption', { months: m })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 다음 교정 예정일 */}
        <FormField
          control={form.control}
          name="nextCalibrationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('form.nextCalibrationDate')}
                <span className="text-xs text-muted-foreground ml-1">
                  ({t('form.suggestedLabel')})
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  disabled={disabled}
                  value={field.value ? formatDate(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => field.onChange(toDate(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 교정 기관 */}
        <FormField
          control={form.control}
          name="calibrationAgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.calibrationAgency')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.calibrationAgencyPlaceholder')}
                  disabled={disabled}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 성적서 번호 */}
        <FormField
          control={form.control}
          name="certificateNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.certificateNumber')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.certificateNumberPlaceholder')}
                  disabled={disabled}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 교정 결과 */}
        <FormField
          control={form.control}
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.result')}</FormLabel>
              <Select disabled={disabled} value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.resultPlaceholder')} />
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

        {/* 교정성적서 파일 (필수) */}
        <FormField
          control={form.control}
          name="certificateFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.certificateFile')}</FormLabel>
              <FormControl>
                <FileUpload
                  files={field.value ? [{ file: field.value, status: 'pending' as const }] : []}
                  onChange={(uploadedFiles: UploadedFile[]) => {
                    field.onChange(uploadedFiles[0]?.file ?? null);
                  }}
                  accept={CERTIFICATE_ACCEPT}
                  maxSize={FILE_UPLOAD_LIMITS.MAX_FILE_SIZE}
                  maxFiles={1}
                  disabled={disabled}
                  label={t('form.certificateFileDrop')}
                  description={t('form.certificateFileHint')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 메모 */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.notesPlaceholder')}
                  rows={3}
                  disabled={disabled}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              {t('form.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={disabled || mutation.isPending}>
            {mutation.isPending ? t('form.submitting') : t('form.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
