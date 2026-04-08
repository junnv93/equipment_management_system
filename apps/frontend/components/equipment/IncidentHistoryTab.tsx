'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RepairResultEnum,
  RepairResultValues as RRVal,
  uuidString,
} from '@equipment-management/schemas';
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
import { useTranslations } from 'next-intl';
import { isBefore, startOfDay } from 'date-fns';
import { toDate } from '@/lib/utils/date';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import {
  IncidentTypeValues as ITVal,
  IncidentTypeEnum,
  NonConformanceStatusValues as NCStatusVal,
  INCIDENT_REPAIR_NC_TYPES,
  isNcCreatingIncidentType,
} from '@equipment-management/schemas';
import { useToast } from '@/components/ui/use-toast';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { createRepairHistory, type CreateRepairHistoryDto } from '@/lib/api/repair-history-api';
import nonConformancesApi from '@/lib/api/non-conformances-api';
import { EntityLinkCell } from '@/components/ui/entity-link-cell';
import {
  TIMELINE_TOKENS,
  getTimelineCardClasses,
  TIMELINE_SKELETON_TOKENS,
  getIncidentTypeNodeColor,
  getSemanticContainerClasses,
} from '@/lib/design-tokens';

// 사고 이력 등록 스키마
function createIncidentHistorySchema(t: (key: string) => string) {
  return z.object({
    occurredAt: z.string().min(1, t('incidentHistoryTab.validation.occurredAtRequired')),
    incidentType: IncidentTypeEnum,
    content: z
      .string()
      .min(1, t('incidentHistoryTab.validation.contentRequired'))
      .max(500, t('incidentHistoryTab.validation.contentMax')),
    // 부적합 생성 관련 필드
    createNonConformance: z.boolean().default(false),
    changeEquipmentStatus: z.boolean().default(false),
    actionPlan: z.string().max(500, t('incidentHistoryTab.validation.actionPlanMax')).optional(),
  });
}
type IncidentHistoryFormData = z.infer<ReturnType<typeof createIncidentHistorySchema>>;
type IncidentHistoryFormInput = z.input<ReturnType<typeof createIncidentHistorySchema>>;

// 수리 이력 등록 스키마 (사고 이력 탭용)
function createRepairHistorySchema(t: (key: string) => string) {
  return z.object({
    repairDate: z.string().min(1, t('incidentHistoryTab.validation.repairDateRequired')),
    repairDescription: z.string().min(10, t('incidentHistoryTab.validation.repairDescriptionMin')),
    repairResult: RepairResultEnum.optional(),
    notes: z.string().optional(),
    nonConformanceId: uuidString(t('incidentHistoryTab.validation.nonConformanceRequired')),
  });
}
type RepairHistoryFormData = z.infer<ReturnType<typeof createRepairHistorySchema>>;

// REPAIR_RESULT_OPTIONS labels are now provided via useTranslations

interface IncidentHistoryTabProps {
  equipment: Equipment;
}

// INCIDENT_TYPE_LABELS are now provided via useTranslations('equipment').incidentHistoryTab.types

/**
 * 사고 이력 탭 - 타임라인 UI
 */
export function IncidentHistoryTab({ equipment }: IncidentHistoryTabProps) {
  const { can } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('equipment');
  const tNc = useTranslations('non-conformances');
  const { fmtDate } = useDateFormatter();
  const incidentHistorySchema = useMemo(() => createIncidentHistorySchema(t), [t]);
  const repairHistorySchema = useMemo(() => createRepairHistorySchema(t), [t]);

  // 사고 이력 폼 설정
  const form = useForm<IncidentHistoryFormInput, unknown, IncidentHistoryFormData>({
    resolver: zodResolver(incidentHistorySchema),
    defaultValues: {
      occurredAt: fmtDate(new Date()),
      incidentType: undefined,
      content: '',
      createNonConformance: false,
      changeEquipmentStatus: false,
      actionPlan: '',
    },
  });

  // 수리 이력 폼 설정 (incidentType이 ITVal.REPAIR일 때 사용)
  const repairForm = useForm<RepairHistoryFormData>({
    resolver: zodResolver(repairHistorySchema),
    defaultValues: {
      repairDate: fmtDate(new Date()),
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
    if (incidentType && !isNcCreatingIncidentType(incidentType)) {
      form.setValue('createNonConformance', false);
    }
  }, [incidentType, form]);

  // 과거 이력 여부 확인 (현재 날짜보다 이전)
  const isPastIncident =
    occurredAt &&
    (() => {
      const parsed = toDate(occurredAt);
      return parsed ? isBefore(startOfDay(parsed), startOfDay(new Date())) : false;
    })();

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
    queryKey: queryKeys.equipment.openNonConformances(equipmentId),
    queryFn: () => nonConformancesApi.getNonConformances({ equipmentId }),
    select: (data) => {
      if (!data || !data.data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data.filter(
        (nc) =>
          ([NCStatusVal.OPEN, NCStatusVal.CORRECTED] as string[]).includes(nc.status) &&
          (INCIDENT_REPAIR_NC_TYPES as readonly string[]).includes(nc.ncType)
      );
    },
    enabled: !!equipmentId,
  });

  // 사고 이력 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateIncidentHistoryInput) =>
      equipmentApi.createIncidentHistory(equipmentId, data),
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset({
        occurredAt: fmtDate(new Date()),
        incidentType: undefined,
        content: '',
        createNonConformance: false,
        changeEquipmentStatus: false,
        actionPlan: '',
      });
      toast({
        title: t('incidentHistoryTab.toasts.success'),
        description: t('incidentHistoryTab.toasts.successDesc'),
      });
      router.refresh();
    },
    onSettled: async () => {
      await EquipmentCacheInvalidation.invalidateAfterIncidentHistory(queryClient, equipmentId);
    },
    onError: (error: unknown) => {
      // API 에러 메시지 추출
      let errorMessage = t('incidentHistoryTab.toasts.errorDesc');

      if (error instanceof Error) {
        errorMessage = error.message;

        // Zod 검증 에러의 경우 상세 정보 포함
        if ('details' in error && Array.isArray((error as { details?: unknown[] }).details)) {
          const details = (error as { details: Array<{ path: string; message: string }> }).details;
          if (details.length > 0) {
            const fieldErrors = details.map((d) => `${d.path}: ${d.message}`).join('\n');
            errorMessage = `${t('incidentHistoryTab.toasts.validationError')}\n${fieldErrors}`;
          }
        }
      }

      toast({
        title: t('incidentHistoryTab.toasts.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // 수리 이력 생성 (incidentType === ITVal.REPAIR일 때 사용)
  const createRepairMutation = useMutation({
    mutationFn: (dto: CreateRepairHistoryDto) => createRepairHistory(equipmentId, dto),
    onSuccess: () => {
      toast({
        title: t('incidentHistoryTab.toasts.repairSuccess'),
        description: t('incidentHistoryTab.toasts.repairSuccessDesc'),
      });
      setIsDialogOpen(false);
      repairForm.reset();
      router.refresh();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.repairHistory(equipmentId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.openNonConformances(equipmentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.incidentHistory(equipmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: t('incidentHistoryTab.toasts.repairError'),
        description: error.message || t('incidentHistoryTab.toasts.repairErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  // 사고 이력 삭제 (표준화된 mutation 훅 사용)
  const deleteMutation = useDeleteMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteIncidentHistory(historyId),
    resourceName: t('incidentHistoryTab.title'),
    // React Query 캐시 무효화 (Client Component 갱신)
    invalidateKeys: [
      queryKeys.equipment.incidentHistory(equipmentId),
      queryKeys.nonConformances.byEquipment(equipmentId),
      queryKeys.equipment.detail(equipmentId),
      queryKeys.equipment.lists(),
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
    if (data.incidentType !== ITVal.CALIBRATION_OVERDUE) {
      payload.createNonConformance = data.createNonConformance;
      payload.changeEquipmentStatus = changeEquipmentStatus;
    }

    // actionPlan이 비어있지 않은 경우에만 추가
    if (data.actionPlan && data.actionPlan.trim().length > 0) {
      payload.actionPlan = data.actionPlan;
    }

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
    if (confirm(t('incidentHistoryTab.deleteConfirm'))) {
      await deleteMutation.mutateAsync(historyId);
    }
  };

  // SSOT: 백엔드 @RequirePermissions(UPDATE/DELETE_EQUIPMENT)와 일치 (equipment-history.controller.ts)
  const canCreate = can(Permission.UPDATE_EQUIPMENT);
  const canDelete = can(Permission.DELETE_EQUIPMENT);

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('incidentHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('incidentHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>
            {incidentType === ITVal.REPAIR
              ? t('incidentHistoryTab.dialog.descriptionRepair')
              : t('incidentHistoryTab.dialog.descriptionDefault')}
          </DialogDescription>
        </DialogHeader>

        {/* 사고 유형 선택은 항상 표시 */}
        <Form {...form}>
          <FormField
            control={form.control}
            name="incidentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('incidentHistoryTab.dialog.typeLabel')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('incidentHistoryTab.dialog.typePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ITVal.DAMAGE}>
                      {t('incidentHistoryTab.types.damage')}
                    </SelectItem>
                    <SelectItem value={ITVal.MALFUNCTION}>
                      {t('incidentHistoryTab.types.malfunction')}
                    </SelectItem>
                    <SelectItem value={ITVal.CHANGE}>
                      {t('incidentHistoryTab.types.change')}
                    </SelectItem>
                    <SelectItem value={ITVal.REPAIR}>
                      {t('incidentHistoryTab.types.repair')}
                    </SelectItem>
                    <SelectItem value={ITVal.CALIBRATION_OVERDUE}>
                      {t('incidentHistoryTab.types.calibration_overdue')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

        {/* incidentType이 선택되지 않았을 때 안내 */}
        {!incidentType && (
          <div className={getSemanticContainerClasses('info')}>
            <p className="text-sm text-muted-foreground">
              {t('incidentHistoryTab.dialog.typeSelectHint')}
            </p>
          </div>
        )}

        {/* incidentType === ITVal.REPAIR일 때: 수리 이력 폼 */}
        {incidentType === ITVal.REPAIR && (
          <Form {...repairForm}>
            <form onSubmit={handleRepairSubmit} className="space-y-4">
              {/* 수리 일자 */}
              <FormField
                control={repairForm.control}
                name="repairDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('incidentHistoryTab.repair.repairDate')}</FormLabel>
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
                    <FormLabel>{t('incidentHistoryTab.repair.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('incidentHistoryTab.repair.descriptionPlaceholder')}
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
                    <FormLabel>{t('incidentHistoryTab.repair.result')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('incidentHistoryTab.repair.resultPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RRVal.COMPLETED}>
                          {t('incidentHistoryTab.repair.resultCompleted')}
                        </SelectItem>
                        <SelectItem value={RRVal.PARTIAL}>
                          {t('incidentHistoryTab.repair.resultPartial')}
                        </SelectItem>
                        <SelectItem value={RRVal.FAILED}>
                          {t('incidentHistoryTab.repair.resultFailed')}
                        </SelectItem>
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
                    <FormLabel>{t('incidentHistoryTab.repair.ncRequired')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('incidentHistoryTab.repair.ncPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {openNonConformances && openNonConformances.length === 0 && (
                          <SelectItem value="__empty__" disabled>
                            {t('incidentHistoryTab.repair.ncEmpty')}
                          </SelectItem>
                        )}
                        {openNonConformances?.map((nc) => (
                          <SelectItem key={nc.id} value={nc.id}>
                            [{tNc(`type.${nc.ncType}`)}] {nc.cause.substring(0, 30)}
                            {nc.cause.length > 30 ? '...' : ''} ({fmtDate(nc.discoveryDate)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('incidentHistoryTab.repair.ncDescription')}
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
                    <FormLabel>{t('incidentHistoryTab.repair.notes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('incidentHistoryTab.repair.notesPlaceholder')}
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
                  {t('incidentHistoryTab.dialog.cancel')}
                </Button>
                <Button type="submit" disabled={createRepairMutation.isPending}>
                  {createRepairMutation.isPending
                    ? t('incidentHistoryTab.dialog.registering')
                    : t('incidentHistoryTab.dialog.register')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* incidentType !== ITVal.REPAIR && incidentType이 선택됨: 기존 사고 이력 폼 */}
        {incidentType && incidentType !== ITVal.REPAIR && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('incidentHistoryTab.dialog.occurredAt')}</FormLabel>
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
                    <FormLabel>{t('incidentHistoryTab.dialog.content')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('incidentHistoryTab.dialog.contentPlaceholder')}
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
              {incidentType === ITVal.CALIBRATION_OVERDUE && (
                <div className="space-y-3">
                  <div className={getSemanticContainerClasses('warning')}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-brand-warning mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-brand-warning">
                          {t('incidentHistoryTab.calibrationOverdue.autoNcTitle')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('incidentHistoryTab.calibrationOverdue.autoNcDescription')}
                          {!isPastIncident &&
                            t('incidentHistoryTab.calibrationOverdue.statusChangeNote')}
                          {t('incidentHistoryTab.calibrationOverdue.noDuplicateNote')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 과거 이력 경고 */}
                  {isPastIncident && (
                    <div className={getSemanticContainerClasses('info')}>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-brand-info mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <strong>{t('common.pastIncidentTitle')}</strong>{' '}
                          {t('incidentHistoryTab.calibrationOverdue.pastIncidentNote')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 부적합 등록 체크박스 (damage/malfunction만) */}
              {incidentType && isNcCreatingIncidentType(incidentType) && (
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="createNonConformance"
                    render={({ field }) => (
                      <FormItem
                        className={`flex flex-row items-start space-x-3 space-y-0 ${getSemanticContainerClasses('warning')}`}
                      >
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 mt-1 rounded border-border"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="font-medium cursor-pointer">
                            {t('incidentHistoryTab.nonConformance.registerAsNc')}
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t('incidentHistoryTab.nonConformance.ncWillBeCreated')}
                            {!isPastIncident &&
                              t('incidentHistoryTab.calibrationOverdue.statusChangeNote')}{' '}
                            <Link
                              href={`/equipment/${equipmentId}/repair-history`}
                              className="underline text-brand-info hover:text-brand-info/80"
                            >
                              {t('incidentHistoryTab.nonConformance.repairHistoryLink')}
                            </Link>
                            {t('incidentHistoryTab.nonConformance.connectRepairGuide')}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* 워크플로우 안내 */}
                  {createNonConformance && isNcCreatingIncidentType(incidentType) && (
                    <div className={getSemanticContainerClasses('info')}>
                      <h4 className="font-medium text-brand-info mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {t('incidentHistoryTab.nonConformance.workflowTitle')}
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside ml-1">
                        <li>{t('incidentHistoryTab.nonConformance.workflowStep1')}</li>
                        <li>{t('incidentHistoryTab.nonConformance.workflowStep2')}</li>
                        <li>{t('incidentHistoryTab.nonConformance.workflowStep3')}</li>
                        <li>{t('incidentHistoryTab.nonConformance.workflowStep4')}</li>
                      </ol>
                    </div>
                  )}

                  {/* 과거 이력 경고 (부적합 체크 시만 표시) */}
                  {isPastIncident && createNonConformance && (
                    <div className={getSemanticContainerClasses('info')}>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-brand-info mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <strong>{t('common.pastIncidentTitle')}</strong>{' '}
                          {t('incidentHistoryTab.calibrationOverdue.pastIncidentNote')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 조치 계획 (부적합 생성 시) */}
              {(createNonConformance || incidentType === ITVal.CALIBRATION_OVERDUE) && (
                <FormField
                  control={form.control}
                  name="actionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('incidentHistoryTab.nonConformance.actionPlan')}
                        {incidentType === ITVal.CALIBRATION_OVERDUE &&
                          t('incidentHistoryTab.nonConformance.actionPlanAutoSet')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            incidentType === ITVal.CALIBRATION_OVERDUE
                              ? t('incidentHistoryTab.nonConformance.actionPlanPlaceholderOverdue')
                              : t('incidentHistoryTab.nonConformance.actionPlanPlaceholderDefault')
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
                  {t('incidentHistoryTab.dialog.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? t('incidentHistoryTab.dialog.saving')
                    : t('incidentHistoryTab.dialog.save')}
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
              <Skeleton className={TIMELINE_SKELETON_TOKENS.node} />
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
            <AlertTriangle className="h-5 w-5 text-brand-info" />
            {t('incidentHistoryTab.title')}
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className={TIMELINE_TOKENS.empty.container}>
            <AlertTriangle className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('incidentHistoryTab.empty')}</p>
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
            <AlertTriangle className="h-5 w-5 text-brand-info" />
            {t('incidentHistoryTab.title')}
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
                    className={`${TIMELINE_TOKENS.node.container} ${getIncidentTypeNodeColor(item.incidentType)} text-white shadow-lg`}
                  >
                    <AlertTriangle className={TIMELINE_TOKENS.node.icon} />
                  </div>
                  {index === 0 && (
                    <Badge
                      className={`absolute -top-2 -right-2 ${TIMELINE_TOKENS.latestBadge.classes}`}
                    >
                      {t('incidentHistoryTab.latest')}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <Card className={getTimelineCardClasses()}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {t(`incidentHistoryTab.types.${item.incidentType}` as const)}
                              </Badge>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{fmtDate(item.occurredAt)}</span>
                              </div>
                            </div>
                            <h4 className="text-lg font-semibold text-foreground">
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
                              {t('incidentHistoryTab.delete')}
                            </Button>
                          )}
                        </div>

                        {(item.reportedBy || item.reportedByName) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>
                              {t('incidentHistoryTab.reporter', {
                                name: item.reportedByName || item.reportedBy || '',
                              })}
                            </span>
                          </div>
                        )}

                        {item.nonConformanceId && (
                          <EntityLinkCell
                            entityType="non_conformance"
                            entityId={item.nonConformanceId}
                            entityName={t('incidentHistoryTab.ncLinked')}
                            className="text-xs"
                          />
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
