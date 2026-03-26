'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Plus, Wrench, Calendar, User } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, { type CreateMaintenanceHistoryInput } from '@/lib/api/equipment-api';
import { useTranslations } from 'next-intl';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleValues as URVal } from '@equipment-management/schemas';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import {
  TIMELINE_TOKENS,
  getTimelineCardClasses,
  TIMELINE_SKELETON_TOKENS,
} from '@/lib/design-tokens';

// 유지보수 이력 등록 스키마
function createMaintenanceHistorySchema(t: (key: string) => string) {
  return z.object({
    performedAt: z.string().min(1, t('maintenanceHistoryTab.validation.performedAtRequired')),
    content: z
      .string()
      .min(1, t('maintenanceHistoryTab.validation.contentRequired'))
      .max(500, t('maintenanceHistoryTab.validation.contentMax')),
  });
}
type MaintenanceHistoryFormData = z.infer<ReturnType<typeof createMaintenanceHistorySchema>>;

interface MaintenanceHistoryTabProps {
  equipment: Equipment;
}

/**
 * 유지보수 이력 탭 - 타임라인 UI
 */
export function MaintenanceHistoryTab({ equipment }: MaintenanceHistoryTabProps) {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const maintenanceHistorySchema = useMemo(() => createMaintenanceHistorySchema(t), [t]);

  // 폼 설정
  const form = useForm<MaintenanceHistoryFormData>({
    resolver: zodResolver(maintenanceHistorySchema),
    defaultValues: {
      performedAt: fmtDate(new Date()),
      content: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 유지보수 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.equipment.maintenanceHistory(equipmentId),
    queryFn: () => equipmentApi.getMaintenanceHistory(equipmentId),
    enabled: !!equipmentId,
  });

  // 유지보수 이력 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateMaintenanceHistoryInput) =>
      equipmentApi.createMaintenanceHistory(equipmentId, data),
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset({
        performedAt: fmtDate(new Date()),
        content: '',
      });
      toast({
        title: t('maintenanceHistoryTab.toasts.success'),
        description: t('maintenanceHistoryTab.toasts.successDesc'),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.maintenanceHistory(equipmentId),
      });
    },
    onError: (error: unknown) => {
      console.error('유지보수 이력 등록 실패:', error);
      toast({
        title: t('maintenanceHistoryTab.toasts.error'),
        description: getErrorMessage(error, t('maintenanceHistoryTab.toasts.errorDesc')),
        variant: 'destructive',
      });
    },
  });

  // 유지보수 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteMaintenanceHistory(historyId),
    onSuccess: () => {
      toast({
        title: t('maintenanceHistoryTab.toasts.deleteSuccess'),
        description: t('maintenanceHistoryTab.toasts.deleteSuccessDesc'),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.maintenanceHistory(equipmentId),
      });
    },
    onError: (error: unknown) => {
      console.error('유지보수 이력 삭제 실패:', error);
      toast({
        title: t('maintenanceHistoryTab.toasts.deleteError'),
        description: getErrorMessage(error, t('maintenanceHistoryTab.toasts.deleteErrorDesc')),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: MaintenanceHistoryFormData) => {
    createMutation.mutate({
      performedAt: data.performedAt,
      content: data.content,
    });
  };

  const handleDelete = async (historyId: string) => {
    if (confirm(t('maintenanceHistoryTab.deleteConfirm'))) {
      await deleteMutation.mutateAsync(historyId);
    }
  };

  // 등록 권한 확인
  const canCreate = hasRole([
    URVal.TEST_ENGINEER,
    URVal.TECHNICAL_MANAGER,
    URVal.LAB_MANAGER,
    URVal.SYSTEM_ADMIN,
  ]);
  const canDelete = hasRole([URVal.TECHNICAL_MANAGER, URVal.LAB_MANAGER, URVal.SYSTEM_ADMIN]);

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('maintenanceHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('maintenanceHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>{t('maintenanceHistoryTab.dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="performedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('maintenanceHistoryTab.dialog.performedAt')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('maintenanceHistoryTab.dialog.content')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('maintenanceHistoryTab.dialog.contentPlaceholder')}
                      rows={4}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('maintenanceHistoryTab.dialog.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t('maintenanceHistoryTab.dialog.saving')
                  : t('maintenanceHistoryTab.dialog.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('maintenanceHistoryTab.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className={`${TIMELINE_SKELETON_TOKENS.node} flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <Skeleton className={`${TIMELINE_SKELETON_TOKENS.line} w-3/4`} />
                <Skeleton className={`${TIMELINE_SKELETON_TOKENS.line} w-full`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // 빈 상태
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-brand-info" />
            {t('maintenanceHistoryTab.title')}
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className={TIMELINE_TOKENS.empty.container}>
            <Wrench className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('maintenanceHistoryTab.empty')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-brand-info" />
          {t('maintenanceHistoryTab.title')}
        </CardTitle>
        {canCreate && RegisterDialog}
      </CardHeader>
      <CardContent>
        <div className={`relative ${TIMELINE_TOKENS.spacing.itemGap}`}>
          <div className={`${TIMELINE_TOKENS.line.container} ${TIMELINE_TOKENS.line.color}`} />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              <div className="relative flex-shrink-0">
                <div
                  className={`${TIMELINE_TOKENS.node.container} bg-brand-ok text-white shadow-lg`}
                >
                  <Wrench className={TIMELINE_TOKENS.node.icon} />
                </div>
                {index === 0 && (
                  <Badge
                    className={`absolute -top-2 -right-2 ${TIMELINE_TOKENS.latestBadge.classes}`}
                  >
                    {t('maintenanceHistoryTab.latest')}
                  </Badge>
                )}
              </div>

              <div className="flex-1 pb-8">
                <Card className={getTimelineCardClasses()}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{fmtDate(item.performedAt)}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-foreground">{item.content}</h4>
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {t('maintenanceHistoryTab.delete')}
                          </Button>
                        )}
                      </div>

                      {(item.performedBy || item.performedByName) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {t('maintenanceHistoryTab.performedBy', {
                              name: item.performedByName || item.performedBy || '',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
