'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Check, Monitor } from 'lucide-react';
import { toast } from 'sonner';
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

export default function DisplayPreferencesContent() {
  const t = useTranslations('settings');
  const currentLocale = useLocale();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: preferences, isLoading } = useQuery<DisplayPreferences>({
    queryKey: queryKeys.settings.preferences(),
    queryFn: async () => {
      const res = await apiClient.get<DisplayPreferences>(API_ENDPOINTS.USERS.PREFERENCES);
      return res.data;
    },
    ...QUERY_CONFIG.SETTINGS,
  });

  // values 옵션: 서버 데이터 동기화를 렌더 사이클과 동기화 (useEffect 타이밍 문제 해결)
  // resetOptions.keepDirtyValues: true → 사용자가 변경 중인 필드는 서버 refetch로 덮어쓰지 않음
  const form = useForm<DisplayPreferences>({
    resolver: zodResolver(displayPreferencesSchema),
    values: { ...DEFAULT_DISPLAY_PREFERENCES, ...(preferences ?? {}) },
    resetOptions: { keepDirtyValues: true },
  });

  const mutation = useMutation({
    mutationFn: (data: DisplayPreferences) =>
      apiClient.patch(API_ENDPOINTS.USERS.PREFERENCES, data),
    onSuccess: (_, variables) => {
      toast.success(t('toasts.saveSuccess'));
      // dirty 상태 즉시 초기화 (onSettled의 invalidate+refetch 완료 전에도 Save 버튼 비활성화)
      form.reset(variables);
      // 로케일이 실제로 변경된 경우에만 쿠키 동기화 + 페이지 재렌더
      if (variables.locale && variables.locale !== currentLocale) {
        setLocaleCookie(variables.locale);
        router.refresh();
      }
    },
    onError: () => {
      toast.error(t('toasts.saveError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.preferences() });
    },
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-[box-shadow] motion-safe:duration-300 motion-reduce:transition-none">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
            <Monitor className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1.5">{t('display.title')}</CardTitle>
            <CardDescription>{t('display.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
            {/* Language / Locale */}
            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">{t('display.language')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="motion-safe:transition-[border-color,box-shadow] motion-reduce:transition-none hover:border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
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
                      <SelectTrigger className="motion-safe:transition-[border-color,box-shadow] motion-reduce:transition-none hover:border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
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
                      <SelectTrigger className="motion-safe:transition-[border-color,box-shadow] motion-reduce:transition-none hover:border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
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
                      <SelectTrigger className="motion-safe:transition-[border-color,box-shadow] motion-reduce:transition-none hover:border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
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

            {/* Show Retired Equipment */}
            <FormField
              control={form.control}
              name="showRetiredEquipment"
              render={({ field }) => (
                <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-[border-color,background-color] motion-safe:duration-200 motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <FormLabel className="text-base font-semibold cursor-pointer">
                        {t('display.showRetiredEquipment')}
                      </FormLabel>
                      <FormDescription className="text-xs leading-relaxed">
                        {t('display.showRetiredDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary motion-safe:transition-colors motion-reduce:transition-none"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">{t('display.saveNote')}</p>
              <Button
                type="submit"
                disabled={mutation.isPending || !form.formState.isDirty}
                className="min-w-[120px] motion-safe:transition-[transform,background-color,opacity] motion-reduce:transition-none motion-safe:hover:scale-105 motion-safe:active:scale-95"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                    {t('common.saving')}
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
  );
}
