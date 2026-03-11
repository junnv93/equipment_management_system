'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  DEFAULT_CALIBRATION_ALERT_DAYS,
  CALIBRATION_ALERT_DAYS_OPTIONS,
} from '@equipment-management/schemas';
import {
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_SUBMIT_TOKENS,
  SETTINGS_SAVE_INDICATOR_TOKENS,
  getSettingsCardClasses,
  getSettingsCardHeaderClasses,
  getSettingsChipClasses,
  getSettingsChipIconClasses,
  getSettingsInfoBoxClasses,
  getSettingsSubmitButtonClasses,
  SETTINGS_SPACING_TOKENS,
  SETTINGS_TEXT_TOKENS,
  SETTINGS_INFO_BOX_TOKENS,
} from '@/lib/design-tokens';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

// 프론트엔드 로컬 Zod 스키마
const calibrationSettingsFormSchema = z.object({
  alertDays: z.array(z.number().int().min(0).max(365)).min(1).max(10),
});

type CalibrationSettingsForm = z.infer<typeof calibrationSettingsFormSchema>;

interface CalibrationSettings {
  alertDays: number[];
}

export default function CalibrationSettingsContent() {
  const t = useTranslations('settings');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CalibrationSettings>({
    queryKey: queryKeys.settings.calibration(),
    queryFn: async () => {
      const res = await apiClient.get<CalibrationSettings>(API_ENDPOINTS.SETTINGS.CALIBRATION);
      return res.data;
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  const form = useForm<CalibrationSettingsForm>({
    resolver: zodResolver(calibrationSettingsFormSchema),
    defaultValues: {
      alertDays: DEFAULT_CALIBRATION_ALERT_DAYS,
    },
  });

  // Sync form when server data arrives (with isDirty guard)
  useEffect(() => {
    if (data && !form.formState.isDirty) {
      form.reset({ alertDays: data.alertDays });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (formData: CalibrationSettingsForm) =>
      apiClient.patch(API_ENDPOINTS.SETTINGS.CALIBRATION, formData),
    onSuccess: (_, variables) => {
      toast.success(t('toasts.calibrationSaveSuccess'));
      form.reset(variables);
    },
    onError: () => {
      toast.error(t('toasts.calibrationSaveError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.calibration() });
    },
  });

  // useWatch: react-hook-form 권장 패턴 (안전한 값 구독)
  const alertDays = useWatch({
    control: form.control,
    name: 'alertDays',
    defaultValue: DEFAULT_CALIBRATION_ALERT_DAYS,
  });

  const toggleDay = (day: number) => {
    const currentDays = alertDays;
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => b - a);
    form.setValue('alertDays', updatedDays, { shouldDirty: true });
  };

  if (isLoading) {
    return (
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-80 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={getSettingsCardClasses()}>
      <CardHeader className={getSettingsCardHeaderClasses()}>
        <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
          <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>
            {t('calibration.title')}
          </CardTitle>
          <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
            {t('calibration.description')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className={cn('pt-6', SETTINGS_SPACING_TOKENS.cardContent)}>
        <div>
          <p className={cn(SETTINGS_TEXT_TOKENS.label, 'mb-3')}>{t('calibration.alertTiming')}</p>
          <div className={SETTINGS_SPACING_TOKENS.chipGroup}>
            {CALIBRATION_ALERT_DAYS_OPTIONS.map((day) => {
              const isSelected = alertDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={getSettingsChipClasses(isSelected)}
                  onClick={() => toggleDay(day)}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <X className={getSettingsChipIconClasses()} aria-hidden="true" />
                  ) : (
                    <Plus className={getSettingsChipIconClasses()} aria-hidden="true" />
                  )}
                  {day === 0 ? t('calibration.today') : t('calibration.dDay', { day })}
                </button>
              );
            })}
          </div>
          <p className={SETTINGS_TEXT_TOKENS.currentValue}>
            {t('calibration.currentSelection')}{' '}
            {alertDays.length > 0
              ? alertDays
                  .map((d) =>
                    d === 0 ? t('calibration.dayOnly') : t('calibration.dDay', { day: d })
                  )
                  .join(', ')
              : t('calibration.noSelection')}
          </p>
        </div>

        <div className={getSettingsInfoBoxClasses()}>
          <p className={SETTINGS_INFO_BOX_TOKENS.title}>{t('calibration.howItWorks')}</p>
          <ul className={SETTINGS_INFO_BOX_TOKENS.list}>
            <li>{t('calibration.howItWorksItems.timing')}</li>
            <li>{t('calibration.howItWorksItems.dedupe')}</li>
            <li>{t('calibration.howItWorksItems.overdue')}</li>
          </ul>
        </div>

        {/* Submit Section — 통일된 토큰 패턴 */}
        <div className={SETTINGS_SUBMIT_TOKENS.section}>
          <p className={SETTINGS_SUBMIT_TOKENS.note}>
            {t('calibration.currentSelection')}{' '}
            {alertDays.length > 0
              ? t('calibration.selectionCount', { count: alertDays.length })
              : t('calibration.noSelection')}
          </p>
          <Button
            onClick={() => mutation.mutate({ alertDays })}
            disabled={mutation.isPending || !form.formState.isDirty || alertDays.length === 0}
            className={getSettingsSubmitButtonClasses()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className={SETTINGS_SAVE_INDICATOR_TOKENS.saving} aria-hidden="true" />
                <span className="ml-2">{t('common.saving')}</span>
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('common.save')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
