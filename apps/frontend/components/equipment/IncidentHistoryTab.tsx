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
import { Plus, AlertTriangle, Calendar, User, Info } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, {
  type CreateIncidentHistoryInput,
  type IncidentType,
} from '@/lib/api/equipment-api';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { createRepairHistory, type CreateRepairHistoryDto } from '@/lib/api/repair-history-api';
import nonConformancesApi, { NON_CONFORMANCE_TYPE_LABELS } from '@/lib/api/non-conformances-api';
import { format } from 'date-fns';

// 사고 이력 등록 스키마
const incidentHistorySchema = z.object({
  occurredAt: z.string().min(1, '발생 일시를 입력하세요'),
  incidentType: z.enum(['damage', 'malfunction', 'change', 'repair', 'calibration_overdue']),
  content: z.string().min(1, '내용을 입력하세요').max(500, '500자 이하로 입력하세요'),
  // 부적합 생성 관련 필드
  createNonConformance: z.boolean().default(false),
  changeEquipmentStatus: z.boolean().default(false),
  actionPlan: z.string().max(500, '조치 계획은 500자 이하로 입력하세요').optional(),
});

type IncidentHistoryFormData = z.infer<typeof incidentHistorySchema>;

// 수리 이력 등록 스키마 (사고 이력 탭용)
const repairHistorySchema = z.object({
  repairDate: z.string().min(1, '수리 일자를 입력하세요'),
  repairDescription: z.string().min(10, '수리 내용은 최소 10자 이상 입력해야 합니다'),
  repairResult: z.enum(['completed', 'partial', 'failed']).optional(),
  notes: z.string().optional(),
  nonConformanceId: z.string().uuid('부적합을 선택해주세요'), // 필수
});

type RepairHistoryFormData = z.infer<typeof repairHistorySchema>;

const REPAIR_RESULT_OPTIONS = [
  { value: 'completed', label: '수리 완료' },
  { value: 'partial', label: '부분 수리' },
  { value: 'failed', label: '수리 실패' },
];

interface IncidentHistoryTabProps {
  equipment: Equipment;
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
  calibration_overdue: '교정 기한 초과',
};

const INCIDENT_TYPE_COLORS: Record<string, string> = {
  damage: 'bg-red-500',
  malfunction: 'bg-orange-500',
  change: 'bg-blue-500',
  repair: 'bg-green-500',
  calibration_overdue: 'bg-purple-500',
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

  // 사고 이력 폼 설정
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

  // 수리 이력 폼 설정 (incidentType이 'repair'일 때 사용)
  const repairForm = useForm<RepairHistoryFormData>({
    resolver: zodResolver(repairHistorySchema),
    defaultValues: {
      repairDate: format(new Date(), 'yyyy-MM-dd'),
      repairDescription: '',
      repairResult: undefined,
      notes: '',
      nonConformanceId: undefined,
    },
  });

  // incidentType 값 감시
  const incidentType = form.watch('incidentType');
  const createNonConformance = form.watch('createNonConformance');
  const occurredAt = form.watch('occurredAt');

  // damage/malfunction이 아니면 체크박스 자동 해제
  // 백엔드 검증: 부적합은 손상 또는 오작동 유형에서만 생성 가능
  useEffect(() => {
    if (incidentType && !['damage', 'malfunction'].includes(incidentType)) {
      form.setValue('createNonConformance', false);
    }
  }, [incidentType, form]);

  // 과거 이력 여부 확인 (현재 날짜보다 이전)
  const isPastIncident = occurredAt && dayjs(occurredAt).isBefore(dayjs(), 'day');

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 사고 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.equipment.incidentHistory(equipmentId), // ✅ 표준화된 키
    queryFn: () => equipmentApi.getIncidentHistory(equipmentId),
    enabled: !!equipmentId,
  });

  // 열린 부적합 목록 조회 (수리 이력 연결용)
  const { data: openNonConformances } = useQuery({
    queryKey: ['open-non-conformances', equipmentId],
    queryFn: () => nonConformancesApi.getNonConformances({ equipmentId }),
    select: (data) => {
      if (!data || !data.data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data.filter(
        (nc) =>
          ['open', 'analyzing', 'corrected'].includes(nc.status) &&
          ['damage', 'malfunction', 'calibration_failure', 'measurement_error'].includes(nc.ncType)
      );
    },
    enabled: !!equipmentId,
  });

  // 사고 이력 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateIncidentHistoryInput) =>
      equipmentApi.createIncidentHistory(equipmentId, data),
    onSuccess: async () => {
      // ✅ 중앙화된 캐시 무효화 헬퍼 사용
      // - 사고 이력 목록 무효화
      // - 장비 상세 + 목록 무효화 (사고로 상태 변경 가능)
      await EquipmentCacheInvalidation.invalidateAfterIncidentHistory(queryClient, equipmentId);

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
    onError: (error: unknown) => {
      console.error('🔴 사고 이력 등록 실패:', error);

      // ✅ ApiError 타입 체크 및 상세 정보 로깅
      if (error && typeof error === 'object' && 'details' in error) {
        console.error('📋 에러 상세:', (error as { details?: unknown }).details);
      }

      // API 에러 메시지 추출
      let errorMessage = '사고 이력 등록 중 오류가 발생했습니다.';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Zod 검증 에러의 경우 상세 정보 포함
        if ('details' in error && Array.isArray((error as { details?: unknown[] }).details)) {
          const details = (error as { details: Array<{ path: string; message: string }> }).details;
          if (details.length > 0) {
            const fieldErrors = details.map((d) => `${d.path}: ${d.message}`).join('\n');
            errorMessage = `입력 데이터 검증 실패:\n${fieldErrors}`;
          }
        }
      }

      toast({
        title: '등록 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // 수리 이력 생성 (incidentType === 'repair'일 때 사용)
  const createRepairMutation = useMutation({
    mutationFn: (dto: CreateRepairHistoryDto) => createRepairHistory(equipmentId, dto),
    onSuccess: () => {
      toast({ title: '성공', description: '수리 이력이 등록되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['repair-history', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['non-conformances', 'equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['open-non-conformances', equipmentId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.incidentHistory(equipmentId) });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipmentList'] });
      setIsDialogOpen(false);
      repairForm.reset();
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: '오류',
        description: error.message || '수리 이력 등록 중 오류가 발생했습니다.',
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

    // API 호출 - 빈 문자열을 undefined로 변환
    const payload: CreateIncidentHistoryInput = {
      occurredAt: data.occurredAt,
      incidentType: data.incidentType as IncidentType,
      content: data.content,
    };

    // 교정 기한 초과가 아닌 경우에만 createNonConformance 추가
    if (data.incidentType !== 'calibration_overdue') {
      payload.createNonConformance = data.createNonConformance;
      payload.changeEquipmentStatus = changeEquipmentStatus;
    }

    // actionPlan이 비어있지 않은 경우에만 추가
    if (data.actionPlan && data.actionPlan.trim().length > 0) {
      payload.actionPlan = data.actionPlan;
    }

    // 🔍 디버깅: 전송할 데이터 로깅
    console.log('📤 사고 이력 등록 요청:', {
      equipmentId: equipmentId,
      payload,
      formData: data,
    });

    createMutation.mutate(payload);
  };

  // 수리 이력 제출 핸들러
  const handleRepairSubmit = repairForm.handleSubmit(async (data) => {
    const cleanData: CreateRepairHistoryDto = {
      repairDate: data.repairDate,
      repairDescription: data.repairDescription,
      repairResult: data.repairResult,
      notes: data.notes || undefined,
      nonConformanceId: data.nonConformanceId,
    };

    createRepairMutation.mutate(cleanData);
  });

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>사고 이력 등록</DialogTitle>
          <DialogDescription>
            {incidentType === 'repair'
              ? '수리 이력을 상세히 입력하세요. 부적합 연결은 필수입니다.'
              : '손상, 오작동, 변경, 수리 등의 이력을 입력하세요.'}
          </DialogDescription>
        </DialogHeader>

        {/* 사고 유형 선택은 항상 표시 */}
        <Form {...form}>
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
                    <SelectItem value="calibration_overdue">교정 기한 초과</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

        {/* incidentType이 선택되지 않았을 때 안내 */}
        {!incidentType && (
          <div className="rounded-md border p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>안내:</strong> 사고 유형을 선택하면 해당 유형에 맞는 입력 폼이 표시됩니다.{' '}
              "수리"를 선택하면 부적합 연결이 필수인 상세 수리 이력 폼이 표시됩니다.
            </p>
          </div>
        )}

        {/* incidentType === 'repair'일 때: 수리 이력 폼 */}
        {incidentType === 'repair' && (
          <Form {...repairForm}>
            <form onSubmit={handleRepairSubmit} className="space-y-4">
              {/* 수리 일자 */}
              <FormField
                control={repairForm.control}
                name="repairDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수리 일자 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 수리 내용 */}
              <FormField
                control={repairForm.control}
                name="repairDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수리 내용 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="수리 내용을 자세히 입력하세요 (최소 10자)"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 수리 결과 */}
              <FormField
                control={repairForm.control}
                name="repairResult"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수리 결과</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="수리 결과 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REPAIR_RESULT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 부적합 연결 (필수) */}
              <FormField
                control={repairForm.control}
                name="nonConformanceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연결된 부적합 (필수) *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="부적합 선택 (필수)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {openNonConformances && openNonConformances.length === 0 && (
                          <SelectItem value="__empty__" disabled>
                            열린 부적합이 없습니다
                          </SelectItem>
                        )}
                        {openNonConformances?.map((nc) => (
                          <SelectItem key={nc.id} value={nc.id}>
                            [{NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}] {nc.cause.substring(0, 30)}
                            {nc.cause.length > 30 ? '...' : ''} (
                            {format(new Date(nc.discoveryDate), 'yyyy-MM-dd')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      수리 이력은 반드시 부적합과 연결되어야 합니다. 수리 완료 시 부적합 상태가
                      자동으로 업데이트됩니다.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 비고 */}
              <FormField
                control={repairForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비고</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="추가 메모"
                        className="min-h-[80px]"
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
                <Button type="submit" disabled={createRepairMutation.isPending}>
                  {createRepairMutation.isPending ? '등록 중...' : '등록'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* incidentType !== 'repair' && incidentType이 선택됨: 기존 사고 이력 폼 */}
        {incidentType && incidentType !== 'repair' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>발생 일시 *</FormLabel>
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
                        placeholder="사고 내용을 상세히 기록하세요"
                        rows={4}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 교정 기한 초과 자동 부적합 안내 */}
              {incidentType === 'calibration_overdue' && (
                <div className="space-y-3">
                  <div className="rounded-md border p-4 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-orange-900 dark:text-orange-100">
                          자동 부적합 처리
                        </p>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          교정 기한 초과는 자동으로 부적합으로 등록됩니다.
                          {!isPastIncident && ' 장비 상태가 "부적합"으로 변경됩니다.'} 이미 부적합이
                          생성된 경우 중복 생성되지 않습니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 과거 이력 경고 */}
                  {isPastIncident && (
                    <div className="rounded-md border p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>과거 이력 등록:</strong> 부적합 기록은 생성되지만, 현재 장비
                          상태는 변경되지 않습니다.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 부적합 등록 체크박스 (damage/malfunction만) */}
              {incidentType && ['damage', 'malfunction'].includes(incidentType) && (
                <div className="space-y-3">
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
                            부적합 기록이 생성됩니다.
                            {!isPastIncident && ' 장비 상태가 "부적합"으로 변경됩니다.'} 이후{' '}
                            <Link
                              href={`/equipment/${equipmentId}/repair-history`}
                              className="underline text-blue-600 hover:text-blue-800"
                            >
                              수리 이력 페이지
                            </Link>
                            에서 수리 기록을 연결하세요.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* 워크플로우 안내 */}
                  {createNonConformance && ['damage', 'malfunction'].includes(incidentType) && (
                    <div className="rounded-md border p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        처리 워크플로우
                      </h4>
                      <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1.5 list-decimal list-inside ml-1">
                        <li>사고 이력 등록 + 부적합 생성 (현재 단계)</li>
                        <li>수리 이력 페이지에서 수리 기록 작성 및 부적합 연결</li>
                        <li>수리 완료 시 부적합 자동으로 "조치 완료" 상태 변경</li>
                        <li>기술책임자가 부적합 종료 승인 → 장비 상태 복원</li>
                      </ol>
                    </div>
                  )}

                  {/* 과거 이력 경고 (부적합 체크 시만 표시) */}
                  {isPastIncident && createNonConformance && (
                    <div className="rounded-md border p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>과거 이력 등록:</strong> 부적합 기록은 생성되지만, 현재 장비
                          상태는 변경되지 않습니다.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 조치 계획 (부적합 생성 시) */}
              {(createNonConformance || incidentType === 'calibration_overdue') && (
                <FormField
                  control={form.control}
                  name="actionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        조치 계획 (선택)
                        {incidentType === 'calibration_overdue' &&
                          ' - 미입력 시 "교정 수행 필요"로 자동 설정'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            incidentType === 'calibration_overdue'
                              ? '예: 외부 교정 예정 (2024-02-15), 내부 점검 후 교정 결정 등'
                              : '예: 외부 수리 예정, 부품 교체 필요 등'
                          }
                          rows={2}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
        )}
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
