'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Plus, MapPin, Calendar, User, FileText } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, { type CreateLocationHistoryInput } from '@/lib/api/equipment-api';
import { formatDate } from '@/lib/utils/date';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';

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
      changedAt: formatDate(new Date(), 'yyyy-MM-dd'),
      newLocation: '',
      notes: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장 (uuid 필드는 없음)
  const equipmentId = String(equipment.id);

  // 위치 변동 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['location-history', equipmentId],
    queryFn: () => equipmentApi.getLocationHistory(equipmentId),
    enabled: !!equipmentId,
  });

  // 위치 변동 이력 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateLocationHistoryInput) =>
      equipmentApi.createLocationHistory(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-history', equipmentId] });
      setIsDialogOpen(false);
      form.reset({
        changedAt: formatDate(new Date(), 'yyyy-MM-dd'),
        newLocation: '',
        notes: '',
      });
      toast({
        title: '위치 변동 등록 완료',
        description: '위치 변동 이력이 성공적으로 등록되었습니다.',
      });
    },
    onError: (error: unknown) => {
      console.error('위치 변동 이력 등록 실패:', error);
      toast({
        title: '등록 실패',
        description: getErrorMessage(error, '위치 변동 이력 등록 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  // 위치 변동 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteLocationHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-history', equipmentId] });
      toast({
        title: '삭제 완료',
        description: '위치 변동 이력이 삭제되었습니다.',
      });
    },
    onError: (error: unknown) => {
      console.error('위치 변동 이력 삭제 실패:', error);
      toast({
        title: '삭제 실패',
        description: getErrorMessage(error, '위치 변동 이력 삭제 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: LocationHistoryFormData) => {
    console.log('[LocationHistoryTab] 위치 변동 등록 요청:', {
      equipmentId,
      data,
    });
    createMutation.mutate({
      changedAt: data.changedAt,
      newLocation: data.newLocation,
      notes: data.notes || undefined,
    });
  };

  const handleDelete = async (historyId: string) => {
    if (confirm('이 위치 변동 이력을 삭제하시겠습니까?')) {
      await deleteMutation.mutateAsync(historyId);
    }
  };

  // 등록 권한 확인
  const canCreate = hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']);
  const canDelete = hasRole(['technical_manager', 'lab_manager', 'system_admin']);

  // 개발 환경에서만 권한 체크 디버그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[LocationHistoryTab] 권한 체크:', {
      canCreate,
      canDelete,
      testHasRoles: {
        test_engineer: hasRole(['test_engineer']),
        technical_manager: hasRole(['technical_manager']),
        lab_manager: hasRole(['lab_manager']),
        system_admin: hasRole(['system_admin']),
      },
    });
  }

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          위치 변경 등록
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>위치 변경 등록</DialogTitle>
          <DialogDescription>장비의 위치 변동 정보를 입력하세요.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="changedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>변동 일시 *</FormLabel>
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
                  <FormLabel>설치 위치 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: RF1 Room, 2층 시험실 등"
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
                  <FormLabel>비고</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="변동 사유나 특이사항"
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
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '저장 중...' : '저장'}
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
            위치 변동 이력
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
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
            <MapPin className="h-5 w-5 text-ul-midnight" />
            위치 변동 이력
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 위치 변동 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-ul-midnight" />
          위치 변동 이력
        </CardTitle>
        {canCreate && RegisterDialog}
      </CardHeader>
      <CardContent>
        {/* 타임라인 */}
        <div className="relative space-y-6">
          {/* 타임라인 세로선 */}
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-800" />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* 타임라인 점 */}
              <div className="relative flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ul-midnight text-white shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-ul-red text-white px-1.5 py-0.5 text-xs">
                    최신
                  </Badge>
                )}
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 pb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더: 날짜 및 위치 */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(item.changedAt, 'yyyy-MM-dd')}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-ul-midnight dark:text-white">
                            {item.newLocation}
                          </h4>
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            삭제
                          </Button>
                        )}
                      </div>

                      {/* 비고 */}
                      {item.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <p>{item.notes}</p>
                        </div>
                      )}

                      {/* 담당자 */}
                      {(item.changedBy || item.changedByName) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>변경자: {item.changedByName || item.changedBy}</span>
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
