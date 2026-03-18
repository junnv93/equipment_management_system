'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getRepairHistoryByEquipment,
  createRepairHistory,
  updateRepairHistory,
  deleteRepairHistory,
  RepairHistory,
  CreateRepairHistoryDto,
} from '@/lib/api/repair-history-api';
import RepairHistoryTimeline from '@/components/equipment/RepairHistoryTimeline';
import { formatDate } from '@/lib/utils/date';
import { ArrowLeft, Plus, Wrench, Hash, Info } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/api/error';
import nonConformancesApi, { NON_CONFORMANCE_TYPE_LABELS } from '@/lib/api/non-conformances-api';
import { getPageContainerClasses } from '@/lib/design-tokens';

function createRepairHistoryFormSchema(t: (key: string) => string) {
  return z.object({
    repairDate: z.string().min(1, t('validationRepairDate')),
    repairDescription: z.string().min(10, t('validationDescriptionMin')),
    repairResult: z.enum(['completed', 'partial', 'failed']).optional(),
    notes: z.string().optional(),
    nonConformanceId: z.string().uuid().optional(),
  });
}
type RepairHistoryFormValues = z.infer<ReturnType<typeof createRepairHistoryFormSchema>>;

interface RepairHistoryClientProps {
  /**
   * Server Component에서 전달받은 장비 ID
   */
  equipmentId: string;
  /**
   * 부적합 페이지에서 전달된 NC ID (자동 선택용)
   */
  initialNcId?: string;
  /**
   * 다이얼로그 자동 오픈 여부
   */
  autoOpen?: boolean;
}

/**
 * 수리 이력 Client Component
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 equipmentId를 전달받음
 * - 모든 인터랙티브 로직(useState, useMutation)을 담당
 * - 부적합 페이지에서 넘어올 때 자동으로 NC 선택 및 다이얼로그 오픈
 */
export function RepairHistoryClient({
  equipmentId,
  initialNcId,
  autoOpen,
}: RepairHistoryClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('equipment.repairHistory');
  const tCommon = useTranslations('equipment.common');
  const repairHistoryFormSchema = useMemo(() => createRepairHistoryFormSchema(t), [t]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairHistory | null>(null);

  // ✅ React Hook Form으로 폼 상태 관리
  const form = useForm<RepairHistoryFormValues>({
    resolver: zodResolver(repairHistoryFormSchema),
    defaultValues: {
      repairDate: formatDate(new Date(), 'yyyy-MM-dd'),
      repairDescription: '',
      repairResult: undefined,
      notes: '',
      nonConformanceId: undefined,
    },
  });

  // 수리 이력 조회
  const { data: repairData, isLoading } = useQuery({
    queryKey: queryKeys.equipment.repairHistory(equipmentId),
    queryFn: () => getRepairHistoryByEquipment(equipmentId, { sort: 'repairDate.desc' }),
    enabled: !!equipmentId,
  });

  // ✅ 수리 비용 요약 조회 제거 (비용 필드 제거됨)

  // Context-aware navigation: 부적합 페이지에서 자동 다이얼로그 오픈
  useEffect(() => {
    if (autoOpen && initialNcId) {
      form.reset({
        repairDate: formatDate(new Date(), 'yyyy-MM-dd'),
        repairDescription: '',
        repairResult: undefined,
        notes: '',
        nonConformanceId: initialNcId, // ✅ Pre-fill NC ID
      });
      setIsCreateDialogOpen(true);

      // Clean URL (remove query params)
      window.history.replaceState({}, '', `/equipment/${equipmentId}/repair-history`);
    }
  }, [autoOpen, initialNcId, equipmentId, form]);

  // 열린 부적합 목록 조회 (수리 이력 연결용)
  const { data: openNonConformances } = useQuery({
    queryKey: queryKeys.equipment.openNonConformances(equipmentId),
    queryFn: () => nonConformancesApi.getNonConformances({ equipmentId }),
    select: (data) => {
      // ✅ 방어적 코드: data가 undefined이거나 data.data가 없을 경우 빈 배열 반환
      if (!data || !data.data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data.filter(
        (nc) =>
          ['open', 'corrected'].includes(nc.status) &&
          ['damage', 'malfunction', 'calibration_failure', 'measurement_error'].includes(nc.ncType)
      );
    },
    enabled: !!equipmentId,
  });

  // 수리 이력 생성
  const createMutation = useMutation({
    mutationFn: (dto: CreateRepairHistoryDto) => createRepairHistory(equipmentId, dto),
    onSuccess: () => {
      toast({ title: t('toastSuccess'), description: t('toastCreateSuccess') });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.repairHistory(equipmentId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.openNonConformances(equipmentId),
      });
    },
    onError: (error: unknown) => {
      toast({
        title: t('toastError'),
        description: getErrorMessage(error, t('toastCreateError')),
        variant: 'destructive',
      });
    },
  });

  // 수리 이력 수정
  const updateMutation = useMutation({
    mutationFn: (params: { uuid: string; dto: Partial<CreateRepairHistoryDto> }) =>
      updateRepairHistory(params.uuid, params.dto),
    onSuccess: () => {
      toast({ title: t('toastSuccess'), description: t('toastUpdateSuccess') });
      setIsEditDialogOpen(false);
      setSelectedRepair(null);
      form.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.repairHistory(equipmentId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.openNonConformances(equipmentId),
      });
    },
    onError: (error: unknown) => {
      toast({
        title: t('toastError'),
        description: getErrorMessage(error, t('toastUpdateError')),
        variant: 'destructive',
      });
    },
  });

  // 수리 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteRepairHistory(uuid),
    onSuccess: () => {
      toast({ title: t('toastSuccess'), description: t('toastDeleteSuccess') });
      setIsDeleteDialogOpen(false);
      setSelectedRepair(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.repairHistory(equipmentId) });
    },
    onError: (error: unknown) => {
      toast({
        title: t('toastError'),
        description: getErrorMessage(error, t('toastDeleteError')),
        variant: 'destructive',
      });
    },
  });

  const handleOpenCreate = () => {
    // ✅ form.reset()으로 폼 초기화
    form.reset({
      repairDate: formatDate(new Date(), 'yyyy-MM-dd'),
      repairDescription: '',
      repairResult: undefined,
      notes: '',
      nonConformanceId: undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (repair: RepairHistory) => {
    setSelectedRepair(repair);
    // ✅ form.reset()으로 폼 초기화
    form.reset({
      repairDate: formatDate(repair.repairDate, 'yyyy-MM-dd'),
      repairDescription: repair.repairDescription,
      repairResult: repair.repairResult,
      notes: repair.notes || '',
      nonConformanceId: undefined, // 수정 시에는 부적합 변경 불가 (백엔드에서 처리)
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (repair: RepairHistory) => {
    setSelectedRepair(repair);
    setIsDeleteDialogOpen(true);
  };

  // ✅ form.handleSubmit 사용 - Zod가 자동으로 검증
  const handleCreate = form.handleSubmit(async (data) => {
    // ✅ 빈 문자열을 undefined로 변환
    const cleanData: CreateRepairHistoryDto = {
      repairDate: data.repairDate,
      repairDescription: data.repairDescription,
      repairResult: data.repairResult,
      notes: data.notes || undefined,
      nonConformanceId: data.nonConformanceId,
    };

    createMutation.mutate(cleanData);
  });

  // ✅ form.handleSubmit 사용 - Zod가 자동으로 검증
  const handleUpdate = form.handleSubmit(async (data) => {
    if (!selectedRepair) return;

    // ✅ 빈 문자열을 undefined로 변환
    const cleanData: CreateRepairHistoryDto = {
      repairDate: data.repairDate,
      repairDescription: data.repairDescription,
      repairResult: data.repairResult,
      notes: data.notes || undefined,
      nonConformanceId: data.nonConformanceId,
    };

    updateMutation.mutate({ uuid: selectedRepair.uuid, dto: cleanData });
  });

  const handleDelete = () => {
    if (!selectedRepair) return;
    deleteMutation.mutate(selectedRepair.uuid);
  };

  const repairs = repairData?.items || [];

  if (isLoading) {
    return null; // loading.tsx에서 처리
  }

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label={t('backAriaLabel')}>
            <Link href={`/equipment/${equipmentId}`}>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">{t('equipmentId', { id: equipmentId })}</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addButton')}
        </Button>
      </div>

      {/* 요약 카드 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summaryTitle')}</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{t('summaryCount', { count: repairs.length })}</div>
          <p className="text-xs text-muted-foreground mt-1">{t('summaryDescription')}</p>
        </CardContent>
      </Card>

      {/* 수리 이력 타임라인 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('timelineTitle')}
          </CardTitle>
          <CardDescription>{t('timelineDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RepairHistoryTimeline
            repairs={repairs}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            canEdit={true}
          />
        </CardContent>
      </Card>

      {/* 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
            <DialogDescription>{t('createDescription')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="repairDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formRepairDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formDescription')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('formDescriptionPlaceholder')}
                          className="min-h-[100px]"
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
                  name="repairResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formResult')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('formResultPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">{t('resultCompleted')}</SelectItem>
                          <SelectItem value="partial">{t('resultPartial')}</SelectItem>
                          <SelectItem value="failed">{t('resultFailed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nonConformanceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formNcLabel')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === '__none__' ? undefined : value);
                        }}
                        value={field.value ?? '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('formNcPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t('formNcNone')}</SelectItem>
                          {openNonConformances && openNonConformances.length === 0 && (
                            <SelectItem value="__empty__" disabled>
                              {t('formNcEmpty')}
                            </SelectItem>
                          )}
                          {openNonConformances?.map((nc) => (
                            <SelectItem key={nc.id} value={nc.id}>
                              [{NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}] {nc.cause.substring(0, 30)}
                              {nc.cause.length > 30 ? '...' : ''} (
                              {formatDate(nc.discoveryDate, 'yyyy-MM-dd')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t('formNcDescription')}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('nonConformanceId') && openNonConformances && (
                  <div className="rounded-md border p-3 bg-brand-info/10 border-brand-info">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-brand-info mt-0.5" />
                      <div className="text-sm text-brand-info">{t('formAutoLinkInfo')}</div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formNotes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('formNotesPlaceholder')}
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? tCommon('registering') : tCommon('register')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editDialogTitle')}</DialogTitle>
            <DialogDescription>{t('editDialogDescription')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="repairDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formRepairDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formDescription')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('formDescriptionPlaceholder')}
                          className="min-h-[100px]"
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
                  name="repairResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formResult')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('formResultPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">{t('resultCompleted')}</SelectItem>
                          <SelectItem value="partial">{t('resultPartial')}</SelectItem>
                          <SelectItem value="failed">{t('resultFailed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nonConformanceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formNcLabelReadonly')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === '__none__' ? undefined : value);
                        }}
                        value={field.value ?? '__none__'}
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('formNcPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t('formNcNone')}</SelectItem>
                          {openNonConformances?.map((nc) => (
                            <SelectItem key={nc.id} value={nc.id}>
                              [{NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}] {nc.cause.substring(0, 30)}
                              {nc.cause.length > 30 ? '...' : ''} (
                              {formatDate(nc.discoveryDate, 'yyyy-MM-dd')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('formNcReadonlyDescription')}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formNotes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('formNotesPlaceholder')}
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? tCommon('saving') : tCommon('edit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialogDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-brand-critical hover:bg-brand-critical/90"
            >
              {deleteMutation.isPending ? tCommon('deleting') : tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
