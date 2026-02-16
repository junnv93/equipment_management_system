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
    <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
            <Monitor className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1.5">표시 설정</CardTitle>
            <CardDescription>
              목록 페이지의 기본 표시 옵션을 사용자화할 수 있습니다.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
            {/* Items Per Page */}
            <FormField
              control={form.control}
              name="itemsPerPage"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">페이지당 항목 수</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="10">10개</SelectItem>
                      <SelectItem value="20">20개 (권장)</SelectItem>
                      <SelectItem value="50">50개</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs leading-relaxed">
                    목록 페이지에서 기본으로 표시할 항목 수를 설정합니다.
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
                  <FormLabel className="text-base font-semibold">날짜 형식</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">
                        <span className="font-mono">2026-02-15</span>
                        <span className="ml-2 text-xs text-muted-foreground">(ISO 표준)</span>
                      </SelectItem>
                      <SelectItem value="YYYY.MM.DD">
                        <span className="font-mono">2026.02.15</span>
                        <span className="ml-2 text-xs text-muted-foreground">(한국 관습)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs leading-relaxed">
                    시스템 전체에서 날짜가 표시되는 기본 형식을 선택합니다.
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
                  <FormLabel className="text-base font-semibold">장비 기본 정렬</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="managementNumber">관리번호 순</SelectItem>
                      <SelectItem value="name">장비명 순</SelectItem>
                      <SelectItem value="updatedAt">최근 수정일 순</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs leading-relaxed">
                    장비 목록 페이지에 처음 진입할 때 적용되는 정렬 기준입니다.
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Show Retired Equipment */}
            <FormField
              control={form.control}
              name="showRetiredEquipment"
              render={({ field }) => (
                <FormItem className="group rounded-lg border-2 border-border/50 p-5 motion-safe:transition-all motion-reduce:transition-none hover:border-primary/30 hover:bg-accent/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <FormLabel className="text-base font-semibold cursor-pointer">
                        폐기/비활성 장비 표시
                      </FormLabel>
                      <FormDescription className="text-xs leading-relaxed">
                        장비 목록에서 폐기 및 비활성 상태의 장비를 기본으로 표시합니다. 활성화하면
                        전체 장비 이력을 확인할 수 있습니다.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary motion-safe:transition-all motion-reduce:transition-none"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                설정은 즉시 적용되며 모든 목록 페이지에 반영됩니다
              </p>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="min-w-[120px] motion-safe:transition-all motion-reduce:transition-none motion-safe:hover:scale-105 motion-safe:active:scale-95"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
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
  );
}
