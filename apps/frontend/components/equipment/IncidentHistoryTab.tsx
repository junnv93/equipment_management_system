'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeleteMutation } from '@/hooks/use-mutation-with-refresh';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, AlertTriangle, Calendar, User } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, { type CreateIncidentHistoryInput, type IncidentType } from '@/lib/api/equipment-api';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';

// 사고 이력 등록 스키마
const incidentHistorySchema = z.object({
  occurredAt: z.string().min(1, '발생 일시를 입력하세요'),
  incidentType: z.enum(['damage', 'malfunction', 'change', 'repair']),
  content: z.string().min(1, '내용을 입력하세요').max(500, '500자 이하로 입력하세요'),
  // 부적합 생성 관련 필드
  createNonConformance: z.boolean().default(false),
  changeEquipmentStatus: z.boolean().default(false),
  actionPlan: z.string().max(500, '조치 계획은 500자 이하로 입력하세요').optional(),
});

type IncidentHistoryFormData = z.infer<typeof incidentHistorySchema>;

interface IncidentHistoryTabProps {
  equipment: Equipment;
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
};

const INCIDENT_TYPE_COLORS: Record<string, string> = {
  damage: 'bg-red-500',
  malfunction: 'bg-orange-500',
  change: 'bg-blue-500',
  repair: 'bg-green-500',
};

/**
 * 사고 이력 탭 - 타임라인 UI
 */
export function IncidentHistoryTab({ equipment }: IncidentHistoryTabProps) {
  const { hasRole } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // 폼 설정
  const form = useForm<IncidentHistoryFormData>({
    resolver: zodResolver(incidentHistorySchema),
    defaultValues: {
      occurredAt: dayjs().format('YYYY-MM-DD'),
      incidentType: undefined,
      content: '',
      createNonConformance: false,
      changeEquipmentStatus: false,
      actionPlan: '',
    },
  });

  // incidentType 값 감시
  const incidentType = form.watch('incidentType');
  const createNonConformance = form.watch('createNonConformance');

  // damage/malfunction이 아니면 체크박스 자동 해제
  useEffect(() => {
    if (incidentType && !['damage', 'malfunction'].includes(incidentType)) {
      form.setValue('createNonConformance', false);
    }
  }, [incidentType, form]);

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 사고 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['incident-history', equipmentId],
    queryFn: () => equipmentApi.getIncidentHistory(equipmentId),
    enabled: !!equipmentId,
  });

  // 사고 이력 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateIncidentHistoryInput) =>
      equipmentApi.createIncidentHistory(equipmentId, data),
    onSuccess: async () => {
      // 1. 클라이언트 캐시 즉시 갱신 (refetchQueries 사용)
      // invalidateQueries는 stale로만 표시하고 즉시 refetch하지 않을 수 있음
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['incident-history', equipmentId], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['non-conformances', 'equipment', equipmentId], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['equipment', equipmentId], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['equipmentList'], type: 'active' }),
      ]);

      setIsDialogOpen(false);
      form.reset({
        occurredAt: dayjs().format('YYYY-MM-DD'),
        incidentType: undefined,
        content: '',
        createNonConformance: false,
        changeEquipmentStatus: false,
        actionPlan: '',
      });
      toast({
        title: '사고 이력 등록 완료',
        description: '사고 이력이 성공적으로 등록되었습니다.',
      });
      // 2. Server Component 데이터 갱신 (Next.js Router Cache 무효화)
      router.refresh();
    },
    onError: (error: Error) => {
      console.error('사고 이력 등록 실패:', error);
      toast({
        title: '등록 실패',
        description: error.message || '사고 이력 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 사고 이력 삭제 (표준화된 mutation 훅 사용)
  const deleteMutation = useDeleteMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteIncidentHistory(historyId),
    resourceName: '사고 이력',
    // React Query 캐시 무효화 (Client Component 갱신)
    invalidateKeys: [
      ['incident-history', equipmentId],
      ['non-conformances', 'equipment', equipmentId],
      ['equipment', equipmentId],
      ['equipmentList'],
    ],
    // Server Component 캐시 갱신 (router.refresh)
    refreshServerCache: true,
  });

  const handleSubmit = (data: IncidentHistoryFormData) => {
    // 부적합 등록 시 장비 상태를 즉시 non_conforming으로 변경
    // (별도 확인 없이 바로 변경 - 비즈니스 요구사항)
    const changeEquipmentStatus = data.createNonConformance;

    // API 호출
    createMutation.mutate({
      occurredAt: data.occurredAt,
      incidentType: data.incidentType as IncidentType,
      content: data.content,
      createNonConformance: data.createNonConformance,
      changeEquipmentStatus: changeEquipmentStatus,
      actionPlan: data.actionPlan,
    });
  };

  const handleDelete = async (historyId: string) => {
    if (confirm('이 사고 이력을 삭제하시겠습니까?')) {
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
          사고 등록
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사고 이력 등록</DialogTitle>
          <DialogDescription>
            손상, 오작동, 변경, 수리 등의 이력을 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>발생 일시 *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="incidentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사고 유형 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="damage">손상</SelectItem>
                      <SelectItem value="malfunction">오작동</SelectItem>
                      <SelectItem value="change">변경</SelectItem>
                      <SelectItem value="repair">수리</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="사고 내용을 상세히 기록하세요"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 부적합 등록 체크박스 (damage/malfunction만) */}
            {incidentType && ['damage', 'malfunction'].includes(incidentType) && (
              <FormField
                control={form.control}
                name="createNonConformance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-yellow-50 dark:bg-yellow-950">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="font-medium cursor-pointer">
                        부적합으로 등록
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        부적합 기록이 생성되고 장비 상태가 &quot;부적합&quot;으로 변경됩니다.
                        기술책임자의 종료 승인 후 사용이 재개됩니다.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* 조치 계획 (부적합 체크 시만) */}
            {createNonConformance && (
              <FormField
                control={form.control}
                name="actionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>조치 계획 (선택)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="예: 외부 수리 예정, 부품 교체 필요 등"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
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
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
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
            <AlertTriangle className="h-5 w-5 text-ul-midnight" />
            사고 이력
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 사고 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-ul-midnight" />
            사고 이력
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6">
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-800" />

            {history.map((item, index) => (
              <div key={item.id} className="relative flex gap-4">
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${INCIDENT_TYPE_COLORS[item.incidentType] || 'bg-gray-500'} text-white shadow-lg`}
                  >
                    <AlertTriangle className="h-6 w-6" />
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
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {INCIDENT_TYPE_LABELS[item.incidentType] || item.incidentType}
                              </Badge>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{dayjs(item.occurredAt).format('YYYY-MM-DD')}</span>
                              </div>
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

                        {(item.reportedBy || item.reportedByName) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>보고자: {item.reportedByName || item.reportedBy}</span>
                          </div>
                        )}

                        {item.nonConformanceId && (
                          <Badge variant="destructive" className="text-xs">
                            부적합 연결됨
                          </Badge>
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
    </>
  );
}
