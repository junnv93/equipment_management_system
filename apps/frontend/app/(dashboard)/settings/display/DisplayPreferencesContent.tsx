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
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  displayPreferencesSchema,
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
} from '@equipment-management/schemas';
import { useEffect } from 'react';

export default function DisplayPreferencesContent() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery<DisplayPreferences>({
    queryKey: queryKeys.settings.preferences(),
    queryFn: () => apiClient.get(API_ENDPOINTS.USERS.PREFERENCES),
    staleTime: CACHE_TIMES.MEDIUM,
  });

  const form = useForm<DisplayPreferences>({
    resolver: zodResolver(displayPreferencesSchema),
    defaultValues: DEFAULT_DISPLAY_PREFERENCES,
  });

  // Sync form when server data arrives
  useEffect(() => {
    if (preferences) {
      form.reset({ ...DEFAULT_DISPLAY_PREFERENCES, ...preferences });
    }
  }, [preferences, form]);

  const mutation = useMutation({
    mutationFn: (data: DisplayPreferences) =>
      apiClient.patch(API_ENDPOINTS.USERS.PREFERENCES, data),
    onSuccess: () => {
      toast.success('표시 설정이 저장되었습니다.');
    },
    onError: () => {
      toast.error('설정 저장에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.preferences() });
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>표시 설정</CardTitle>
        <CardDescription>목록 페이지의 기본 표시 옵션을 설정합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            <FormField
              control={form.control}
              name="itemsPerPage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>페이지당 항목 수</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="10">10개</SelectItem>
                      <SelectItem value="20">20개</SelectItem>
                      <SelectItem value="50">50개</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>목록 페이지에서 기본으로 표시할 항목 수</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>날짜 형식</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">2026-02-15</SelectItem>
                      <SelectItem value="YYYY.MM.DD">2026.02.15</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>날짜가 표시되는 기본 형식</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultEquipmentSort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장비 기본 정렬</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="managementNumber">관리번호</SelectItem>
                      <SelectItem value="name">장비명</SelectItem>
                      <SelectItem value="updatedAt">최근 수정일</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>장비 목록의 기본 정렬 기준</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showRetiredEquipment"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">폐기/비활성 장비 표시</FormLabel>
                    <FormDescription>
                      장비 목록에서 폐기 및 비활성 상태의 장비를 기본으로 표시합니다
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
  );
}
