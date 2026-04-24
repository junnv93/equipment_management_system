'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Check } from 'lucide-react';
import { ErrorState } from '@/components/shared/ErrorState';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  displayPreferencesSchema,
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
} from '@equipment-management/schemas';
import { setLocaleCookie } from '@/lib/i18n/locale-cookie';
import { useTranslations, useLocale } from 'next-intl';
import { SettingsToggleField } from '@/components/settings/SettingsToggleField';
import {
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_SUBMIT_TOKENS,
  SETTINGS_SAVE_INDICATOR_TOKENS,
  getSettingsCardClasses,
  getSettingsCardHeaderClasses,
  getSettingsSelectTriggerClasses,
  getSettingsSubmitButtonClasses,
  SETTINGS_SPACING_TOKENS,
} from '@/lib/design-tokens';

export default function DisplayPreferencesContent() {
  const t = useTranslations('settings');
  const {
    data: preferences,
    isLoading,
    isError,
    refetch,
  } = useQuery<DisplayPreferences>({
    queryKey: queryKeys.settings.preferences(),
    queryFn: async () => {
      const res = await apiClient.get<DisplayPreferences>(API_ENDPOINTS.USERS.PREFERENCES);
      return res.data;
    },
    ...QUERY_CONFIG.SETTINGS,
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={getSettingsCardClasses()}>
        <CardContent className="pt-12 pb-8">
          <ErrorState title={t('display.loadError')} onRetry={() => void refetch()} />
        </CardContent>
      </Card>
    );
  }

  // 로드 완료 후 타입 보장된 초기값을 자식에게 전달
  // 자식은 defaultValues만 사용 → 첫 렌더부터 동기적으로 올바른 값 보장
  // (values 옵션의 useEffect 비동기 sync는 Radix Select 포털 렌더링과 충돌)
  const mergedPreferences: DisplayPreferences = {
    ...DEFAULT_DISPLAY_PREFERENCES,
    ...(preferences ?? {}),
  };
  return <PreferencesForm initialPreferences={mergedPreferences} />;
}

/**
 * 부모가 isLoading=false 이후에만 렌더링 → initialPreferences는 항상 유효한 데이터.
 * defaultValues만 사용: Radix Select가 마운트 시점에 올바른 value로 초기화됨.
 * (values useEffect 없음 → 포털이 닫힌 상태에서의 item 텍스트 조회 문제 없음)
 */
function PreferencesForm({ initialPreferences }: { initialPreferences: DisplayPreferences }) {
  const t = useTranslations('settings');
  const { toast } = useToast();
  const currentLocale = useLocale();
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<DisplayPreferences>({
    resolver: zodResolver(displayPreferencesSchema),
    defaultValues: initialPreferences,
  });

  const mutation = useMutation({
    mutationFn: (data: DisplayPreferences) =>
      apiClient.patch(API_ENDPOINTS.USERS.PREFERENCES, data),
    onSuccess: (_, variables) => {
      toast({ description: t('toasts.saveSuccess') });
      // dirty 상태 즉시 초기화 (onSettled의 invalidate+refetch 완료 전에도 Save 버튼 비활성화)
      form.reset(variables);
      // 로케일이 실제로 변경된 경우에만 쿠키 동기화 + 페이지 재렌더
      if (variables.locale && variables.locale !== currentLocale) {
        setLocaleCookie(variables.locale);
        router.refresh();
      }
    },
    onError: () => {
      toast({ variant: 'destructive', description: t('toasts.saveError') });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.preferences() });
    },
  });

  const selectTriggerClasses = getSettingsSelectTriggerClasses();

  return (
    <Card className={getSettingsCardClasses()}>
      <CardHeader className={getSettingsCardHeaderClasses()}>
        <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
          <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>{t('display.title')}</CardTitle>
          <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
            {t('display.description')}
          </CardDescription>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          <CardContent className="pt-6">
            <div className={SETTINGS_SPACING_TOKENS.formFields}>
              {/* Language / Locale */}
              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('display.language')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ko">{t('display.languageOptions.ko')}</SelectItem>
                        <SelectItem value="en">{t('display.languageOptions.en')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      {t('display.languageDescription')}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Items Per Page */}
              <FormField
                control={form.control}
                name="itemsPerPage"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('display.itemsPerPage')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="10">{t('display.itemsPerPageOptions.10')}</SelectItem>
                        <SelectItem value="20">{t('display.itemsPerPageOptions.20')}</SelectItem>
                        <SelectItem value="50">{t('display.itemsPerPageOptions.50')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      {t('display.itemsPerPageDescription')}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Date Format */}
              <FormField
                control={form.control}
                name="dateFormat"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('display.dateFormat')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YYYY-MM-DD">
                          <span className="font-mono">2026-02-15</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({t('display.dateFormatOptions.iso')})
                          </span>
                        </SelectItem>
                        <SelectItem value="YYYY.MM.DD">
                          <span className="font-mono">2026.02.15</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({t('display.dateFormatOptions.korean')})
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      {t('display.dateFormatDescription')}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Default Equipment Sort */}
              <FormField
                control={form.control}
                name="defaultEquipmentSort"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      {t('display.equipmentSort')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="managementNumber">
                          {t('sortOptions.managementNumber')}
                        </SelectItem>
                        <SelectItem value="name">{t('sortOptions.name')}</SelectItem>
                        <SelectItem value="updatedAt">{t('sortOptions.updatedAt')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      {t('display.equipmentSortDescription')}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Show Retired Equipment — SettingsToggleField 사용 */}
              <SettingsToggleField
                control={form.control}
                name="showRetiredEquipment"
                label={t('display.showRetiredEquipment')}
                description={t('display.showRetiredDescription')}
              />
            </div>
          </CardContent>
          <CardFooter className={SETTINGS_SUBMIT_TOKENS.footer}>
            <p className={SETTINGS_SUBMIT_TOKENS.note}>{t('display.saveNote')}</p>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.formState.isDirty}
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
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
