'use client';

import { useState } from 'react';
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
import { Plus, MapPin, Calendar, User, FileText, ArrowRight } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, { type CreateLocationHistoryInput } from '@/lib/api/equipment-api';
import { useTranslations } from 'next-intl';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleValues as URVal } from '@equipment-management/schemas';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { isConflictError } from '@/lib/errors/equipment-errors';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import {
  TIMELINE_TOKENS,
  getTimelineCardClasses,
  getSemanticSolidBgClasses,
  TIMELINE_SKELETON_TOKENS,
} from '@/lib/design-tokens';

// 위치 변동 이력 등록 스키마
const locationHistorySchema = z.object({
  changedAt: z.string().min(1, '변동 일시를 입력하세요'),
  newLocation: z.string().min(1, '설치 위치를 입력하세요').max(100, '100자 이하로 입력하세요'),
  notes: z.string().optional(),
});

type LocationHistoryFormData = z.infer<typeof locationHistorySchema>;

interface LocationHistoryTabProps {
  equipment: Equipment;
}

/**
 * 위치 변동 이력 탭 - 타임라인 UI
 *
 * UL Solutions 브랜딩:
 * - 타임라인: 세로 레이아웃, 날짜 + 내용 + 담당자
 * - 색상: UL Midnight Blue 포인트
 */
export function LocationHistoryTab({ equipment }: LocationHistoryTabProps) {
  const { hasRole, session, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();

  // 개발 환경에서만 세션 디버그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[LocationHistoryTab] 세션 상태:', {
      isAuthenticated,
      hasSession: !!session,
      user: session?.user,
      roles: session?.user?.roles,
      hasAccessToken: !!session?.accessToken,
    });
  }

  // 폼 설정
  const form = useForm<LocationHistoryFormData>({
    resolver: zodResolver(locationHistorySchema),
    defaultValues: {
      changedAt: fmtDate(new Date()),
      newLocation: '',
      notes: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장 (uuid 필드는 없음)
  const equipmentId = String(equipment.id);

  // 위치 변동 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.equipment.locationHistory(equipmentId),
    queryFn: () => equipmentApi.getLocationHistory(equipmentId),
    enabled: !!equipmentId,
  });

  // 위치 변동 이력 생성 (equipment.location 동기화 포함)
  const createMutation = useMutation({
    mutationFn: (data: CreateLocationHistoryInput) =>
      equipmentApi.createLocationHistory(equipmentId, data),
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset({
        changedAt: fmtDate(new Date()),
        newLocation: '',
        notes: '',
      });
      toast({
        title: t('locationHistoryTab.toasts.success'),
        description: t('locationHistoryTab.toasts.successDesc'),
      });
    },
    onSettled: async () => {
      // equipment.location이 변경되므로 장비 상세 + 목록 + 이력 모두 무효화
      await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.locationHistory(equipmentId) });
    },
    onError: (error: unknown) => {
      console.error('위치 변동 이력 등록 실패:', error);
      if (isConflictError(error)) {
        toast({
          title: '버전 충돌',
          description: '다른 사용자가 장비를 수정했습니다. 새로고침 후 다시 시도해주세요.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('locationHistoryTab.toasts.error'),
          description: getErrorMessage(error, t('locationHistoryTab.toasts.errorDesc')),
          variant: 'destructive',
        });
      }
    },
  });

  // 위치 변동 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteLocationHistory(historyId),
    onSuccess: () => {
      toast({
        title: t('locationHistoryTab.toasts.deleteSuccess'),
        description: t('locationHistoryTab.toasts.deleteSuccessDesc'),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.locationHistory(equipmentId) });
    },
    onError: (error: unknown) => {
      console.error('위치 변동 이력 삭제 실패:', error);
      toast({
        title: t('locationHistoryTab.toasts.deleteError'),
        description: getErrorMessage(error, t('locationHistoryTab.toasts.deleteErrorDesc')),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: LocationHistoryFormData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LocationHistoryTab] 위치 변동 등록 요청:', {
        equipmentId,
        data,
      });
    }
    createMutation.mutate({
      changedAt: data.changedAt,
      newLocation: data.newLocation,
      notes: data.notes || undefined,
      version: equipment.version,
    });
  };

  const handleDelete = async (historyId: string) => {
    if (confirm(t('locationHistoryTab.deleteConfirm'))) {
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

  // 개발 환경에서만 권한 체크 디버그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[LocationHistoryTab] 권한 체크:', {
      canCreate,
      canDelete,
      testHasRoles: {
        test_engineer: hasRole([URVal.TEST_ENGINEER]),
        technical_manager: hasRole([URVal.TECHNICAL_MANAGER]),
        lab_manager: hasRole([URVal.LAB_MANAGER]),
        system_admin: hasRole([URVal.SYSTEM_ADMIN]),
      },
    });
  }

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('locationHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('locationHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>{t('locationHistoryTab.dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="changedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('locationHistoryTab.dialog.changedAt')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('locationHistoryTab.dialog.newLocation')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('locationHistoryTab.dialog.newLocationPlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('locationHistoryTab.dialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('locationHistoryTab.dialog.notesPlaceholder')}
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
                {t('locationHistoryTab.dialog.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t('locationHistoryTab.dialog.saving')
                  : t('locationHistoryTab.dialog.save')}
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
            <MapPin className="h-5 w-5" />
            {t('locationHistoryTab.title')}
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
            <MapPin className="h-5 w-5 text-brand-info" />
            {t('locationHistoryTab.title')}
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className={TIMELINE_TOKENS.empty.container}>
            <MapPin className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('locationHistoryTab.empty')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-info" />
          {t('locationHistoryTab.title')}
        </CardTitle>
        {canCreate && RegisterDialog}
      </CardHeader>
      <CardContent>
        {/* 타임라인 */}
        <div className={`relative ${TIMELINE_TOKENS.spacing.itemGap}`}>
          {/* 타임라인 세로선 */}
          <div className={`${TIMELINE_TOKENS.line.container} ${TIMELINE_TOKENS.line.color}`} />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* 타임라인 점 */}
              <div className="relative flex-shrink-0">
                <div
                  className={`${TIMELINE_TOKENS.node.container} ${getSemanticSolidBgClasses('info')} shadow-lg`}
                >
                  <MapPin className={TIMELINE_TOKENS.node.icon} />
                </div>
                {index === 0 && (
                  <Badge
                    className={`absolute -top-2 -right-2 ${TIMELINE_TOKENS.latestBadge.classes}`}
                  >
                    {t('locationHistoryTab.latest')}
                  </Badge>
                )}
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 pb-8">
                <Card className={getTimelineCardClasses()}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더: 날짜 및 위치 */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{fmtDate(item.changedAt)}</span>
                          </div>
                          {item.previousLocation ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {item.previousLocation}
                              </span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <h4 className="text-lg font-semibold text-foreground">
                                {item.newLocation}
                              </h4>
                            </div>
                          ) : (
                            <h4 className="text-lg font-semibold text-foreground">
                              {item.newLocation}
                            </h4>
                          )}
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {t('locationHistoryTab.delete')}
                          </Button>
                        )}
                      </div>

                      {/* 비고 */}
                      {item.notes && (
                        <div className="flex items-start gap-2 text-sm text-foreground">
                          <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <p>{item.notes}</p>
                        </div>
                      )}

                      {/* 담당자 */}
                      {(item.changedBy || item.changedByName) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {t('locationHistoryTab.changedBy', {
                              name: item.changedByName || item.changedBy || '',
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
