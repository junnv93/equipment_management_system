'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Check, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '@equipment-management/schemas';
import {
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_SUBMIT_TOKENS,
  SETTINGS_SAVE_INDICATOR_TOKENS,
  getSettingsCardClasses,
  getSettingsCardHeaderClasses,
  getSettingsSelectTriggerClasses,
  getSettingsSubmitButtonClasses,
  getSettingsTextareaClasses,
  SETTINGS_SPACING_TOKENS,
} from '@/lib/design-tokens';

const systemSettingsFormSchema = z.object({
  auditLogRetentionDays: z.string(),
  notificationRetentionDays: z.string(),
  maintenanceMessage: z.string().max(500),
});

type SystemSettingsForm = z.infer<typeof systemSettingsFormSchema>;

const DEFAULTS: SystemSettingsForm = {
  auditLogRetentionDays: String(DEFAULT_SYSTEM_SETTINGS.auditLogRetentionDays),
  notificationRetentionDays: String(DEFAULT_SYSTEM_SETTINGS.notificationRetentionDays),
  maintenanceMessage: DEFAULT_SYSTEM_SETTINGS.maintenanceMessage,
};

/**
 * 시스템 설정 컨테이너 (로딩 후 자식 마운트)
 *
 * DisplayPreferencesContent와 동일 패턴:
 * 부모에서 isLoading 처리 → 자식은 동기적 defaultValues로 마운트
 * → Radix Select 포털 렌더링 충돌 방지
 */
export default function SystemSettingsContent() {
  const { data, isLoading } = useQuery<SystemSettings>({
    queryKey: queryKeys.settings.system(),
    queryFn: async () => {
      const res = await apiClient.get<SystemSettings>(API_ENDPOINTS.SETTINGS.SYSTEM);
      return res.data;
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  if (isLoading) {
    return (
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-72 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const mergedSettings: SystemSettingsForm = {
    auditLogRetentionDays: String(
      data?.auditLogRetentionDays ?? DEFAULT_SYSTEM_SETTINGS.auditLogRetentionDays
    ),
    notificationRetentionDays: String(
      data?.notificationRetentionDays ?? DEFAULT_SYSTEM_SETTINGS.notificationRetentionDays
    ),
    maintenanceMessage: data?.maintenanceMessage ?? DEFAULT_SYSTEM_SETTINGS.maintenanceMessage,
  };

  return <SystemSettingsForm initialSettings={mergedSettings} />;
}

function SystemSettingsForm({ initialSettings }: { initialSettings: SystemSettingsForm }) {
  const t = useTranslations('settings');
  const queryClient = useQueryClient();

  const form = useForm<SystemSettingsForm>({
    resolver: zodResolver(systemSettingsFormSchema),
    defaultValues: initialSettings,
  });

  const mutation = useMutation({
    mutationFn: (formData: SystemSettingsForm) =>
      apiClient.patch(API_ENDPOINTS.SETTINGS.SYSTEM, {
        auditLogRetentionDays: parseInt(formData.auditLogRetentionDays, 10),
        notificationRetentionDays: parseInt(formData.notificationRetentionDays, 10),
        maintenanceMessage: formData.maintenanceMessage,
      }),
    onSuccess: (_, variables) => {
      toast.success(t('toasts.systemSaveSuccess'));
      form.reset(variables);
    },
    onError: () => {
      toast.error(t('toasts.systemSaveError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.system() });
    },
  });

  const selectTriggerClasses = getSettingsSelectTriggerClasses();

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert
        variant="default"
        className="border-warning/40 bg-warning/10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300"
      >
        <ShieldAlert className="h-5 w-5 text-warning-foreground" aria-hidden="true" />
        <AlertDescription className="text-sm font-medium leading-relaxed">
          <strong className="font-bold">{t('system.warningPrefix')}</strong> {t('system.warning')}
        </AlertDescription>
      </Alert>

      {/* Settings Card — Design Token SSOT */}
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
            <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>{t('system.title')}</CardTitle>
            <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
              {t('system.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
              className={SETTINGS_SPACING_TOKENS.formFields}
            >
              {/* Audit Log Retention */}
              <FormField
                control={form.control}
                name="auditLogRetentionDays"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('system.auditLogRetention')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">
                          <span className="font-mono">&#8734;</span>
                          <span className="ml-2">{t('system.unlimited')}</span>
                        </SelectItem>
                        <SelectItem value="90">
                          <span className="font-mono">90</span>
                          <span className="ml-2">{t('system.days')}</span>
                        </SelectItem>
                        <SelectItem value="180">
                          <span className="font-mono">180</span>
                          <span className="ml-2">
                            {t('system.days')} ({t('system.recommended')})
                          </span>
                        </SelectItem>
                        <SelectItem value="365">
                          <span className="font-mono">365</span>
                          <span className="ml-2">{t('system.days')}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      {t.rich('system.auditLogRetentionDescription', {
                        code: (chunks) => (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{chunks}</code>
                        ),
                      })}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Notification Retention */}
              <FormField
                control={form.control}
                name="notificationRetentionDays"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('system.notificationRetention')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">
                          <span className="font-mono">30</span>
                          <span className="ml-2">{t('system.days')}</span>
                        </SelectItem>
                        <SelectItem value="60">
                          <span className="font-mono">60</span>
                          <span className="ml-2">
                            {t('system.days')} ({t('system.recommended')})
                          </span>
                        </SelectItem>
                        <SelectItem value="90">
                          <span className="font-mono">90</span>
                          <span className="ml-2">{t('system.days')}</span>
                        </SelectItem>
                        <SelectItem value="180">
                          <span className="font-mono">180</span>
                          <span className="ml-2">{t('system.days')}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      {t('system.notificationRetentionDescription')}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Maintenance Message */}
              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('system.maintenanceMessage')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('system.maintenanceMessagePlaceholder')}
                        className={getSettingsTextareaClasses()}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs leading-relaxed">
                      {t('system.maintenanceMessageDescription')}{' '}
                      <span className="text-muted-foreground/70">({t('system.maxChars')})</span>
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className={SETTINGS_SUBMIT_TOKENS.section}>
                <p className={SETTINGS_SUBMIT_TOKENS.note}>
                  {t('system.changesAppliedImmediately')}
                </p>
                <Button
                  type="submit"
                  disabled={mutation.isPending || !form.formState.isDirty}
                  className={getSettingsSubmitButtonClasses()}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2
                        className={SETTINGS_SAVE_INDICATOR_TOKENS.saving}
                        aria-hidden="true"
                      />
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
