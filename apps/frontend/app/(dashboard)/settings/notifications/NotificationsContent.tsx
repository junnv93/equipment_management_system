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
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CATEGORY_DESCRIPTIONS,
  NOTIFICATION_CATEGORY_FORM_FIELDS,
} from '@equipment-management/shared-constants';

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

/** SSOT: shared-constants에서 카테고리 정보를 가져와 설정 토글 항목 생성 */
const CATEGORY_ITEMS = NOTIFICATION_CATEGORIES.map((cat) => ({
  name: NOTIFICATION_CATEGORY_FORM_FIELDS[cat] as BooleanFieldName,
  label: NOTIFICATION_CATEGORY_LABELS[cat],
  description: NOTIFICATION_CATEGORY_DESCRIPTIONS[cat],
}));

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
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  });

  // 서버에서 설정을 로드한 후 폼에 반영
  useEffect(() => {
    if (preferences) {
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
            toast.error('설정 저장에 실패했습니다.');
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
      <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
              <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1.5">알림 채널</CardTitle>
              <CardDescription>알림을 수신하는 방법과 빈도를 설정합니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {/* 이메일 알림 (disabled + 준비중) */}
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-all motion-reduce:transition-none opacity-60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Mail
                          className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div className="space-y-1.5">
                          <FormLabel className="text-base font-semibold cursor-not-allowed">
                            이메일 알림
                            <Badge variant="secondary" className="ml-2 text-xs">
                              준비중
                            </Badge>
                          </FormLabel>
                          <FormDescription className="text-xs leading-relaxed">
                            중요한 알림을 이메일로 받습니다.
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              {/* 앱 내 알림 (auto-save) */}
              <FormField
                control={form.control}
                name="inAppEnabled"
                render={({ field }) => (
                  <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Bell
                          className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div className="space-y-1.5">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            앱 내 알림
                          </FormLabel>
                          <FormDescription className="text-xs leading-relaxed">
                            시스템 내에서 알림을 표시합니다.
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
                      알림 빈도
                      <Badge variant="secondary" className="ml-2 text-xs">
                        준비중
                      </Badge>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      현재 모든 알림은 즉시 발송됩니다. 향후 일간/주간 요약 기능이 추가됩니다.
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
                      요약 발송 시간
                      <Badge variant="secondary" className="ml-2 text-xs">
                        준비중
                      </Badge>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      일간/주간 요약 기능 활성화 시 발송 시간을 설정할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Card 2: 알림 유형 */}
      <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
              <SlidersHorizontal className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1.5">알림 유형</CardTitle>
              <CardDescription>수신할 알림 카테고리를 선택하세요.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {CATEGORY_ITEMS.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
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
