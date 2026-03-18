'use client';

import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_FORM_FIELDS,
} from '@equipment-management/shared-constants';
import { useTranslations } from 'next-intl';
import { SettingsToggleField } from '@/components/settings/SettingsToggleField';
import {
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_FORM_ITEM_TOKENS,
  SETTINGS_SPACING_TOKENS,
  getSettingsCardClasses,
  getSettingsCardHeaderClasses,
  getSettingsFormItemClasses,
} from '@/lib/design-tokens';

/**
 * 알림 설정 폼 스키마
 *
 * SSOT: 카테고리 필드는 NOTIFICATION_CATEGORY_FORM_FIELDS에서 자동 생성
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
    <div className={SETTINGS_SPACING_TOKENS.pageContent}>
      {[1, 2].map((i) => (
        <Card key={i} className={getSettingsCardClasses()}>
          <CardHeader className={getSettingsCardHeaderClasses()}>
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-72 mt-1" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {Array.from({ length: i === 1 ? 4 : 8 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * NotificationsContent — 데이터 페칭 레이어 (부모)
 *
 * useQuery로 preferences 로드 → 로딩 스켈레톤 / NotificationsForm에 위임
 * useEffect + isDirty guard 패턴 제거
 */
export default function NotificationsContent() {
  const { data: preferences, isLoading } = useNotificationPreferences();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 서버 데이터와 기본값 병합
  const categoryValues = Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((cat) => {
      const field = NOTIFICATION_CATEGORY_FORM_FIELDS[cat];
      return [field, (preferences as unknown as Record<string, unknown>)?.[field] ?? true];
    })
  ) as Record<string, boolean>;

  const mergedValues: NotificationFormValues = {
    emailEnabled: preferences?.emailEnabled ?? false,
    inAppEnabled: preferences?.inAppEnabled ?? true,
    ...categoryDefaults,
    ...categoryValues,
  };

  return <NotificationsForm initialPreferences={mergedValues} />;
}

/**
 * NotificationsForm — 폼 레이어 (자식)
 *
 * 부모가 isLoading=false 이후에만 마운트 → defaultValues 동기적으로 유효
 * useEffect 제거됨 — defaultValues만 사용
 */
function NotificationsForm({ initialPreferences }: { initialPreferences: NotificationFormValues }) {
  const t = useTranslations('settings');
  const tNotif = useTranslations('notifications');
  const categoryItems = useCategoryItems(tNotif);
  const updateMutation = useUpdateNotificationPreferences();

  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: initialPreferences,
  });

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
    [updateMutation, form, t]
  );

  return (
    <div className={SETTINGS_SPACING_TOKENS.pageContent}>
      {/* Card 1: 알림 채널 */}
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
            <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>
              {t('notifications.channelTitle')}
            </CardTitle>
            <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
              {t('notifications.channelDescription')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {/* 이메일 알림 (auto-save) */}
              <SettingsToggleField
                control={form.control}
                name="emailEnabled"
                label={t('notifications.emailEnabled')}
                description={t('notifications.emailDescription')}
                icon={Mail}
                isSaving={savingField === 'emailEnabled'}
                isSaved={savedField === 'emailEnabled'}
                onToggle={handleToggleChange}
              />

              {/* 앱 내 알림 (auto-save) */}
              <SettingsToggleField
                control={form.control}
                name="inAppEnabled"
                label={t('notifications.inAppEnabled')}
                description={t('notifications.inAppDescription')}
                icon={Bell}
                isSaving={savingField === 'inAppEnabled'}
                isSaved={savedField === 'inAppEnabled'}
                onToggle={handleToggleChange}
              />

              <Separator />

              {/* 알림 빈도 (준비중) */}
              <div
                className={getSettingsFormItemClasses({ disabled: true })}
                aria-disabled="true"
                role="group"
                aria-label={t('notifications.frequency')}
              >
                <div className={SETTINGS_FORM_ITEM_TOKENS.layout}>
                  <div className={SETTINGS_FORM_ITEM_TOKENS.labelSection.withIcon}>
                    <Clock className={SETTINGS_FORM_ITEM_TOKENS.labelIcon} aria-hidden="true" />
                    <div className={SETTINGS_FORM_ITEM_TOKENS.labelWrapper}>
                      <p className={SETTINGS_FORM_ITEM_TOKENS.label}>
                        {t('notifications.frequency')}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {t('notifications.comingSoon')}
                        </Badge>
                      </p>
                      <p className={SETTINGS_FORM_ITEM_TOKENS.description}>
                        {t('notifications.frequencyDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 알림 시간 (준비중) */}
              <div
                className={getSettingsFormItemClasses({ disabled: true })}
                aria-disabled="true"
                role="group"
                aria-label={t('notifications.digestTime')}
              >
                <div className={SETTINGS_FORM_ITEM_TOKENS.layout}>
                  <div className={SETTINGS_FORM_ITEM_TOKENS.labelSection.withIcon}>
                    <Clock className={SETTINGS_FORM_ITEM_TOKENS.labelIcon} aria-hidden="true" />
                    <div className={SETTINGS_FORM_ITEM_TOKENS.labelWrapper}>
                      <p className={SETTINGS_FORM_ITEM_TOKENS.label}>
                        {t('notifications.digestTime')}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {t('notifications.comingSoon')}
                        </Badge>
                      </p>
                      <p className={SETTINGS_FORM_ITEM_TOKENS.description}>
                        {t('notifications.digestTimeDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Card 2: 알림 유형 */}
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
            <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>
              {t('notifications.typeTitle')}
            </CardTitle>
            <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
              {t('notifications.typeDescription')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <SettingsToggleField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  label={item.label}
                  description={item.description}
                  isSaving={savingField === item.name}
                  isSaved={savedField === item.name}
                  onToggle={handleToggleChange}
                />
              ))}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
