'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
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
 * 새 카테고리 추가 시 shared-constants만 수정하면 자동 반영
 */
const categoryFieldsSchema = z.object(
  Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((cat) => [NOTIFICATION_CATEGORY_FORM_FIELDS[cat], z.boolean()])
  ) as Record<string, z.ZodBoolean>
);

const notificationFormSchema = z
  .object({
    // 기본 알림 설정
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly']),
    digestTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: '시간은 HH:MM 형식이어야 합니다 (예: 09:00).',
    }),
  })
  .merge(categoryFieldsSchema);

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const categoryDefaults = Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((cat) => [NOTIFICATION_CATEGORY_FORM_FIELDS[cat], true])
) as Record<string, boolean>;

const defaultValues: NotificationFormValues = {
  emailEnabled: false,
  inAppEnabled: true,
  frequency: 'immediate',
  digestTime: '09:00',
  ...categoryDefaults,
};

/** 카테고리 토글용 boolean 필드 타입 (frequency, digestTime 등 string 필드 제외) */
type BooleanFieldName = {
  [K in keyof NotificationFormValues]: NotificationFormValues[K] extends boolean ? K : never;
}[keyof NotificationFormValues];

/** SSOT: shared-constants에서 카테고리 정보를 가져와 설정 토글 항목 생성 */
const CATEGORY_ITEMS = NOTIFICATION_CATEGORIES.map((cat) => ({
  name: NOTIFICATION_CATEGORY_FORM_FIELDS[cat] as BooleanFieldName,
  label: NOTIFICATION_CATEGORY_LABELS[cat],
  description: NOTIFICATION_CATEGORY_DESCRIPTIONS[cat],
}));

export default function NotificationsContent() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

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
          return [field, (preferences as Record<string, unknown>)[field] ?? true];
        })
      ) as Record<string, boolean>;

      form.reset({
        emailEnabled: preferences.emailEnabled,
        inAppEnabled: preferences.inAppEnabled,
        frequency: preferences.frequency as 'immediate' | 'daily' | 'weekly',
        digestTime: preferences.digestTime,
        ...categoryValues,
      });
    }
  }, [preferences, form]);

  async function onSubmit(data: NotificationFormValues) {
    updateMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader title="알림 설정" subtitle="알림 수신 방법과 유형을 관리하세요." />
        <div className="mt-6 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader title="알림 설정" subtitle="알림 수신 방법과 유형을 관리하세요." />

      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">기본 설정</TabsTrigger>
          <TabsTrigger value="types">알림 유형</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>알림 기본 설정</CardTitle>
                  <CardDescription>알림을 수신하는 방법과 빈도를 설정합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-4">
                        <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="font-medium">이메일 알림</p>
                          <p className="text-sm text-muted-foreground">
                            중요한 알림을 이메일로 받습니다.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name="emailEnabled"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Badge variant="secondary" className="text-xs">
                          준비중
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-4">
                        <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="font-medium">앱 내 알림</p>
                          <p className="text-sm text-muted-foreground">
                            시스템 내에서 알림을 표시합니다.
                          </p>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="inAppEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>알림 빈도</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="알림 빈도 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">즉시</SelectItem>
                              <SelectItem value="daily">일간 요약</SelectItem>
                              <SelectItem value="weekly">주간 요약</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            알림을 받는 빈도를 설정합니다.
                            <Badge variant="secondary" className="ml-2 text-xs">
                              준비중
                            </Badge>
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="digestTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>알림 시간</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                              <Input {...field} type="time" className="w-24" disabled />
                              <Badge variant="secondary" className="text-xs">
                                준비중
                              </Badge>
                            </div>
                          </FormControl>
                          <FormDescription>
                            일간/주간 요약을 받을 시간을 설정합니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="types">
              <Card>
                <CardHeader>
                  <CardTitle>알림 유형 설정</CardTitle>
                  <CardDescription>수신할 알림 카테고리를 선택하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {CATEGORY_ITEMS.map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name={item.name}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>{item.label}</FormLabel>
                              <FormDescription>{item.description}</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    저장 중...
                  </>
                ) : (
                  '설정 저장'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
