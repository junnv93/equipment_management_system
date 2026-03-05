'use client';

import { useEffect, useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, SlidersHorizontal, Mail, Clock, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_FORM_FIELDS,
  type NotificationCategory,
} from '@equipment-management/shared-constants';
import { useTranslations } from 'next-intl';

/**
 * 알림 설정 폼 스키마
 *
 * SSOT: 카테고리 필드는 NOTIFICATION_CATEGORY_FORM_FIELDS에서 자동 생성
 * frequency, digestTime은 준비중이므로 폼 관리 불필요 → 제거
 */
const categoryFieldsSchema = z.object(
  Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((cat) => [NOTIFICATION_CATEGORY_FORM_FIELDS[cat], z.boolean()])
  ) as Record<string, z.ZodBoolean>
);

const notificationFormSchema = z
  .object({
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
  })
  .merge(categoryFieldsSchema);

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const categoryDefaults = Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((cat) => [NOTIFICATION_CATEGORY_FORM_FIELDS[cat], true])
) as Record<string, boolean>;

const defaultValues: NotificationFormValues = {
  emailEnabled: false,
  inAppEnabled: true,
  ...categoryDefaults,
};

/** 카테고리 토글용 boolean 필드 타입 */
type BooleanFieldName = {
  [K in keyof NotificationFormValues]: NotificationFormValues[K] extends boolean ? K : never;
}[keyof NotificationFormValues];

/** SSOT: 카테고리 토글 항목을 i18n 메시지에서 생성 */
function useCategoryItems(tNotif: ReturnType<typeof useTranslations>) {
  return NOTIFICATION_CATEGORIES.map((cat) => ({
    name: NOTIFICATION_CATEGORY_FORM_FIELDS[cat] as BooleanFieldName,
    label: tNotif(`category.${cat}.label` as Parameters<typeof tNotif>[0]),
    description: tNotif(`category.${cat}.description` as Parameters<typeof tNotif>[0]),
  }));
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: i === 1 ? 4 : 8 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function NotificationsContent() {
  const t = useTranslations('settings');
  const tNotif = useTranslations('notifications');
  const categoryItems = useCategoryItems(tNotif);
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  });

  // 서버에서 설정을 로드한 후 폼에 반영 (isDirty 가드: 사용자 변경 중 리셋 방지)
  useEffect(() => {
    if (preferences && !form.formState.isDirty) {
      const categoryValues = Object.fromEntries(
        NOTIFICATION_CATEGORIES.map((cat) => {
          const field = NOTIFICATION_CATEGORY_FORM_FIELDS[cat];
          return [field, (preferences as unknown as Record<string, unknown>)[field] ?? true];
        })
      ) as Record<string, boolean>;

      form.reset({
        emailEnabled: preferences.emailEnabled,
        inAppEnabled: preferences.inAppEnabled,
        ...categoryValues,
      });
    }
  }, [preferences, form]);

  const handleToggleChange = useCallback(
    (fieldName: string, checked: boolean) => {
      setSavingField(fieldName);
      setSavedField(null);
      updateMutation.mutate(
        { [fieldName]: checked },
        {
          onSuccess: () => {
            setSavingField(null);
            setSavedField(fieldName);
            setTimeout(() => setSavedField((prev) => (prev === fieldName ? null : prev)), 2000);
          },
          onError: () => {
            setSavingField(null);
            // 토글 원복
            form.setValue(fieldName as keyof NotificationFormValues, !checked);
            toast.error(t('toasts.notificationSaveError'));
          },
        }
      );
    },
    [updateMutation, form]
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Card 1: 알림 채널 */}
      <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-[box-shadow] motion-safe:duration-300 motion-reduce:transition-none">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
              <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1.5">{t('notifications.channelTitle')}</CardTitle>
              <CardDescription>{t('notifications.channelDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {/* 이메일 알림 (auto-save) */}
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-[border-color,background-color] motion-safe:duration-200 motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Mail
                          className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div className="space-y-1.5">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            {t('notifications.emailEnabled')}
                          </FormLabel>
                          <FormDescription className="text-xs leading-relaxed">
                            {t('notifications.emailDescription')}
                          </FormDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {savingField === 'emailEnabled' && (
                          <Loader2
                            className="h-4 w-4 motion-safe:animate-spin text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        {savedField === 'emailEnabled' && (
                          <Check
                            className="h-4 w-4 text-green-500 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
                            aria-hidden="true"
                          />
                        )}
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              handleToggleChange('emailEnabled', checked);
                            }}
                          />
                        </FormControl>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* 앱 내 알림 (auto-save) */}
              <FormField
                control={form.control}
                name="inAppEnabled"
                render={({ field }) => (
                  <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-[border-color,background-color] motion-safe:duration-200 motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Bell
                          className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div className="space-y-1.5">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            {t('notifications.inAppEnabled')}
                          </FormLabel>
                          <FormDescription className="text-xs leading-relaxed">
                            {t('notifications.inAppDescription')}
                          </FormDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {savingField === 'inAppEnabled' && (
                          <Loader2
                            className="h-4 w-4 motion-safe:animate-spin text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        {savedField === 'inAppEnabled' && (
                          <Check
                            className="h-4 w-4 text-green-500 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
                            aria-hidden="true"
                          />
                        )}
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              handleToggleChange('inAppEnabled', checked);
                            }}
                          />
                        </FormControl>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Separator />

              {/* 알림 빈도 (정적 텍스트 + 준비중) */}
              <div className="group rounded-lg border-2 border-border/50 p-5 opacity-60">
                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold">
                      {t('notifications.frequency')}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {t('notifications.comingSoon')}
                      </Badge>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t('notifications.frequencyDescription')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 알림 시간 (정적 텍스트 + 준비중) */}
              <div className="group rounded-lg border-2 border-border/50 p-5 opacity-60">
                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold">
                      {t('notifications.digestTime')}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {t('notifications.comingSoon')}
                      </Badge>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t('notifications.digestTimeDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Card 2: 알림 유형 */}
      <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-[box-shadow] motion-safe:duration-300 motion-reduce:transition-none">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
              <SlidersHorizontal className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1.5">{t('notifications.typeTitle')}</CardTitle>
              <CardDescription>{t('notifications.typeDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-[border-color,background-color] motion-safe:duration-200 motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            {item.label}
                          </FormLabel>
                          <FormDescription className="text-xs leading-relaxed">
                            {item.description}
                          </FormDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {savingField === item.name && (
                            <Loader2
                              className="h-4 w-4 motion-safe:animate-spin text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                          {savedField === item.name && (
                            <Check
                              className="h-4 w-4 text-green-500 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
                              aria-hidden="true"
                            />
                          )}
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleToggleChange(item.name, checked);
                              }}
                            />
                          </FormControl>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
