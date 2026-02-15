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
import { Loader2, Check, ShieldAlert } from 'lucide-react';
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          시스템 설정은 전체 시스템에 영향을 미칩니다. 변경 시 주의하세요.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>시스템 설정</CardTitle>
          <CardDescription>시스템 전반에 적용되는 관리 설정을 변경합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
              <FormField
                control={form.control}
                name="auditLogRetentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>감사 로그 보관 기간</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">무제한</SelectItem>
                        <SelectItem value="90">90일</SelectItem>
                        <SelectItem value="180">180일</SelectItem>
                        <SelectItem value="365">365일</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      감사 로그를 보관할 기간입니다. 0은 무제한입니다.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationRetentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>알림 보관 기간</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30일</SelectItem>
                        <SelectItem value="60">60일</SelectItem>
                        <SelectItem value="90">90일</SelectItem>
                        <SelectItem value="180">180일</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>만료된 알림은 자동으로 정리됩니다.</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시스템 공지 메시지</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="시스템 점검 예정 등의 공지 사항을 입력하세요..."
                        className="resize-y"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      입력된 메시지는 대시보드 상단에 배너로 표시됩니다. 비워두면 배너가 표시되지
                      않습니다. (최대 500자)
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    저장
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
