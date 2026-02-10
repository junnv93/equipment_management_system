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
import { Plus, Wrench, Calendar, User } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, { type CreateMaintenanceHistoryInput } from '@/lib/api/equipment-api';
import { formatDate } from '@/lib/utils/date';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';

// 유지보수 이력 등록 스키마
const maintenanceHistorySchema = z.object({
  performedAt: z.string().min(1, '수행 일시를 입력하세요'),
  content: z.string().min(1, '내용을 입력하세요').max(500, '500자 이하로 입력하세요'),
});

type MaintenanceHistoryFormData = z.infer<typeof maintenanceHistorySchema>;

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

  // 폼 설정
  const form = useForm<MaintenanceHistoryFormData>({
    resolver: zodResolver(maintenanceHistorySchema),
    defaultValues: {
      performedAt: formatDate(new Date(), 'yyyy-MM-dd'),
      content: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 유지보수 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['maintenance-history', equipmentId],
    queryFn: () => equipmentApi.getMaintenanceHistory(equipmentId),
    enabled: !!equipmentId,
  });

  // 유지보수 이력 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateMaintenanceHistoryInput) =>
      equipmentApi.createMaintenanceHistory(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-history', equipmentId] });
      setIsDialogOpen(false);
      form.reset({
        performedAt: formatDate(new Date(), 'yyyy-MM-dd'),
        content: '',
      });
      toast({
        title: '유지보수 등록 완료',
        description: '유지보수 내역이 성공적으로 등록되었습니다.',
      });
    },
    onError: (error: unknown) => {
      console.error('유지보수 이력 등록 실패:', error);
      toast({
        title: '등록 실패',
        description: getErrorMessage(error, '유지보수 내역 등록 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  // 유지보수 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteMaintenanceHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-history', equipmentId] });
      toast({
        title: '삭제 완료',
        description: '유지보수 내역이 삭제되었습니다.',
      });
    },
    onError: (error: unknown) => {
      console.error('유지보수 이력 삭제 실패:', error);
      toast({
        title: '삭제 실패',
        description: getErrorMessage(error, '유지보수 내역 삭제 중 오류가 발생했습니다.'),
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
    if (confirm('이 유지보수 이력을 삭제하시겠습니까?')) {
      await deleteMutation.mutateAsync(historyId);
    }
  };

  // 등록 권한 확인
  const canCreate = hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']);
  const canDelete = hasRole(['technical_manager', 'lab_manager', 'system_admin']);

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          유지보수 등록
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>유지보수 등록</DialogTitle>
          <DialogDescription>장비의 유지보수 내역을 입력하세요.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="performedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>수행 일시 *</FormLabel>
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
                  <FormLabel>내용 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="예: 정기 점검, 부품 교체, 청소 등"
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
            <Wrench className="h-5 w-5" />
            유지보수 이력
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
            <Wrench className="h-5 w-5 text-ul-midnight" />
            유지보수 이력
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 유지보수 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-ul-midnight" />
          유지보수 이력
        </CardTitle>
        {canCreate && RegisterDialog}
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-800" />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              <div className="relative flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ul-green text-white shadow-lg">
                  <Wrench className="h-6 w-6" />
                </div>
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-ul-red text-white px-1.5 py-0.5 text-xs">
                    최신
                  </Badge>
                )}
              </div>

              <div className="flex-1 pb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(item.performedAt, 'yyyy-MM-dd')}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-ul-midnight dark:text-white">
                            {item.content}
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

                      {(item.performedBy || item.performedByName) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>담당자: {item.performedByName || item.performedBy}</span>
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
