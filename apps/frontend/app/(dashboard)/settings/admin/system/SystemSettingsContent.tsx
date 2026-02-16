'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
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
import { Loader2, Check, ShieldAlert, Cog } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '@equipment-management/schemas';

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

export default function SystemSettingsContent() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SystemSettings>({
    queryKey: queryKeys.settings.system(),
    queryFn: () => apiClient.get(API_ENDPOINTS.SETTINGS.SYSTEM),
    staleTime: CACHE_TIMES.MEDIUM,
  });

  const form = useForm<SystemSettingsForm>({
    resolver: zodResolver(systemSettingsFormSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (data) {
      form.reset({
        auditLogRetentionDays: String(data.auditLogRetentionDays),
        notificationRetentionDays: String(data.notificationRetentionDays),
        maintenanceMessage: data.maintenanceMessage,
      });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (formData: SystemSettingsForm) =>
      apiClient.patch(API_ENDPOINTS.SETTINGS.SYSTEM, {
        auditLogRetentionDays: parseInt(formData.auditLogRetentionDays, 10),
        notificationRetentionDays: parseInt(formData.notificationRetentionDays, 10),
        maintenanceMessage: formData.maintenanceMessage,
      }),
    onSuccess: () => {
      toast.success('시스템 설정이 저장되었습니다.');
    },
    onError: () => {
      toast.error('설정 저장에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.system() });
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
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert
        variant="default"
        className="border-warning/40 bg-warning/10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300"
      >
        <ShieldAlert className="h-5 w-5 text-warning-foreground" aria-hidden="true" />
        <AlertDescription className="text-sm font-medium leading-relaxed">
          <strong className="font-bold">주의:</strong> 시스템 설정은 전체 시스템에 영향을 미칩니다.
          변경 시 신중하게 검토하세요.
        </AlertDescription>
      </Alert>

      {/* Settings Card */}
      <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
              <Cog className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1.5">시스템 설정</CardTitle>
              <CardDescription>시스템 전반에 적용되는 관리 설정을 변경합니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
              {/* Audit Log Retention */}
              <FormField
                control={form.control}
                name="auditLogRetentionDays"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">감사 로그 보관 기간</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">
                          <span className="font-mono">∞</span>
                          <span className="ml-2">무제한</span>
                        </SelectItem>
                        <SelectItem value="90">
                          <span className="font-mono">90</span>
                          <span className="ml-2">일</span>
                        </SelectItem>
                        <SelectItem value="180">
                          <span className="font-mono">180</span>
                          <span className="ml-2">일 (권장)</span>
                        </SelectItem>
                        <SelectItem value="365">
                          <span className="font-mono">365</span>
                          <span className="ml-2">일</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      감사 로그를 보관할 기간입니다.{' '}
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">0</code>은 무제한
                      보관을 의미합니다.
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
                    <FormLabel className="text-base font-semibold">알림 보관 기간</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">
                          <span className="font-mono">30</span>
                          <span className="ml-2">일</span>
                        </SelectItem>
                        <SelectItem value="60">
                          <span className="font-mono">60</span>
                          <span className="ml-2">일 (권장)</span>
                        </SelectItem>
                        <SelectItem value="90">
                          <span className="font-mono">90</span>
                          <span className="ml-2">일</span>
                        </SelectItem>
                        <SelectItem value="180">
                          <span className="font-mono">180</span>
                          <span className="ml-2">일</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs leading-relaxed">
                      만료된 알림은 자동으로 정리됩니다. 시스템 성능 최적화를 위해 적절한 기간을
                      설정하세요.
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
                    <FormLabel className="text-base font-semibold">시스템 공지 메시지</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="시스템 점검 예정 등의 공지 사항을 입력하세요…"
                        className="resize-y min-h-[100px] motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs leading-relaxed">
                      입력된 메시지는 대시보드 상단에 배너로 표시됩니다. 비워두면 배너가 표시되지
                      않습니다. <span className="text-muted-foreground/70">(최대 500자)</span>
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">변경 사항은 즉시 적용됩니다</p>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="min-w-[120px] motion-safe:transition-all motion-reduce:transition-none motion-safe:hover:scale-105 motion-safe:active:scale-95"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 motion-safe:animate-spin"
                        aria-hidden="true"
                      />
                      저장 중…
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                      저장
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
