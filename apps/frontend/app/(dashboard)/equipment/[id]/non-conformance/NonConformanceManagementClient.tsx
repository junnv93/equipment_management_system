'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import nonConformancesApi, { NonConformance } from '@/lib/api/non-conformances-api';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  getSemanticBadgeClasses,
  getSemanticContainerClasses,
  getSemanticContainerTextClasses,
  ncStatusToSemantic,
  NC_REPAIR_LINKED_TOKENS,
  TRANSITION_PRESETS,
} from '@/lib/design-tokens';
import {
  EquipmentStatusValues as ESVal,
  NonConformanceStatusValues as NCStatusVal,
  MANUAL_NC_TYPES,
  type NonConformanceType,
} from '@equipment-management/schemas';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import type { PaginatedResponse } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUB_PAGE_HEADER_TOKENS } from '@/lib/design-tokens';

/** NC 유형 enum → i18n 키 매핑 (UI 표시용 — i18n 키가 camelCase이므로 매핑 필요) */
const NC_TYPE_I18N_KEY: Record<string, string> = {
  damage: 'damage',
  malfunction: 'malfunction',
  calibration_failure: 'calibrationFailure',
  measurement_error: 'measurementError',
  other: 'other',
};

interface NonConformanceManagementClientProps {
  equipmentId: string;
  /** 서버 프리페치된 장비 데이터 (placeholderData로 사용) */
  initialEquipment?: Equipment;
  /** 서버 프리페치된 부적합 목록 (placeholderData로 사용) */
  initialNonConformances?: PaginatedResponse<NonConformance>;
}

export default function NonConformanceManagementClient({
  equipmentId,
  initialEquipment,
  initialNonConformances,
}: NonConformanceManagementClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const { toast } = useToast();
  const canCreateNC = can(Permission.CREATE_NON_CONFORMANCE);
  const canEditNC = can(Permission.CLOSE_NON_CONFORMANCE);
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  // React Query로 데이터 조회
  // 서버 프리페치 데이터를 placeholderData로 사용 → 즉시 표시 + 백그라운드 refetch
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    placeholderData: initialEquipment,
    staleTime: CACHE_TIMES.MEDIUM,
  });

  const {
    data: nonConformancesData,
    isLoading: ncLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    queryFn: () => nonConformancesApi.getNonConformances({ equipmentId }),
    placeholderData: initialNonConformances,
    staleTime: CACHE_TIMES.LONG,
  });

  const nonConformances = nonConformancesData?.data || [];
  const loading = equipmentLoading || ncLoading;

  // 브레드크럼 동적 라벨 설정 (EquipmentDetailClient와 동일 패턴)
  useEffect(() => {
    if (!equipment) return;
    const label = `${equipment.name} (${equipment.managementNumber})`;
    setDynamicLabel(equipmentId, label);
    return () => clearDynamicLabel(equipmentId);
  }, [equipmentId, equipment, setDynamicLabel, clearDynamicLabel]);

  // 부적합 등록 폼 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    cause: '',
    ncType: 'other' as NonConformanceType,
    actionPlan: '',
  });
  // 업데이트 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({
    correctionContent: '',
    status: '' as 'open' | 'corrected' | '',
  });

  // 부적합 등록 mutation - Optimistic Update 패턴
  const createMutation = useOptimisticMutation<
    NonConformance,
    {
      equipmentId: string;
      discoveryDate: string;
      cause: string;
      ncType: NonConformanceType;
      actionPlan?: string;
    },
    { data: NonConformance[] }
  >({
    mutationFn: (data) => nonConformancesApi.createNonConformance(data),
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    optimisticUpdate: (old, data) => {
      const newItem: NonConformance = {
        id: 'temp-' + Date.now(),
        ...data,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as NonConformance;

      return {
        data: [...(old?.data || []), newItem],
      };
    },
    invalidateKeys: [queryKeys.equipment.detail(equipmentId)],
    successMessage: t('nonConformanceManagement.toasts.createSuccess'),
    errorMessage: t('nonConformanceManagement.toasts.createError'),
    onSuccessCallback: () => {
      setShowCreateForm(false);
      setCreateForm({ cause: '', ncType: 'other', actionPlan: '' });
      // 교차 엔티티 캐시 무효화 (장비 목록, NC 전체 목록, 대시보드 KPI)
      EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(queryClient, equipmentId);
    },
  });

  const handleCreate = () => {
    if (!createForm.cause.trim()) {
      toast({ title: t('nonConformanceManagement.form.causeRequired'), variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      equipmentId,
      discoveryDate: new Date().toISOString().split('T')[0],
      cause: createForm.cause,
      ncType: createForm.ncType,
      actionPlan: createForm.actionPlan || undefined,
    });
  };

  // 부적합 수정 mutation - Optimistic Update + CAS 패턴
  const updateMutation = useOptimisticMutation<
    NonConformance,
    {
      id: string;
      updateData: {
        version: number;
        correctionContent?: string;
        correctionDate?: string;
        correctedBy?: string;
        status?: 'open' | 'corrected';
      };
    },
    { data: NonConformance[] }
  >({
    mutationFn: ({ id, updateData }) => nonConformancesApi.updateNonConformance(id, updateData),
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    optimisticUpdate: (old, { id, updateData }) => {
      if (!old?.data) return { data: [] };

      return {
        data: old.data.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updateData,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      };
    },
    invalidateKeys: [queryKeys.equipment.detail(equipmentId)],
    successMessage: t('nonConformanceManagement.toasts.updateSuccess'),
    errorMessage: t('nonConformanceManagement.toasts.updateError'),
    onSuccessCallback: () => {
      setEditingId(null);
      setUpdateForm({ correctionContent: '', status: '' });
      // 교차 엔티티 캐시 무효화 (상태 변경 시 장비 목록/대시보드 갱신)
      EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(queryClient, equipmentId);
    },
  });

  const handleUpdate = (id: string) => {
    const nc = nonConformances.find((n) => n.id === id);
    if (!nc) return;

    if (
      ['damage', 'malfunction'].includes(nc.ncType) &&
      !nc.repairHistoryId &&
      updateForm.status === NCStatusVal.CORRECTED
    ) {
      const userChoice = window.confirm(t('nonConformanceManagement.confirm.repairRequired'));

      if (userChoice) {
        router.push(`/equipment/${equipmentId}/repair-history`);
        return;
      } else {
        return;
      }
    }

    const updateData: {
      version: number;
      correctionContent?: string;
      correctionDate?: string;
      status?: 'open' | 'corrected';
    } = { version: nc.version };
    if (updateForm.correctionContent) {
      updateData.correctionContent = updateForm.correctionContent;
      updateData.correctionDate = new Date().toISOString().split('T')[0];
      // correctedBy는 서버에서 JWT 토큰으로 추출 (Rule 2: 서버 사이드 userId 추출)
    }
    if (updateForm.status) updateData.status = updateForm.status;

    updateMutation.mutate({ id, updateData });
  };

  const startEditing = (nc: NonConformance) => {
    setEditingId(nc.id);
    setUpdateForm({
      correctionContent: nc.correctionContent || '',
      status: '',
    });
  };

  const getStatusIcon = (status: string) => {
    const cls = `h-5 w-5 ${getSemanticContainerTextClasses(ncStatusToSemantic(status))}`;
    switch (status) {
      case 'open':
        return <AlertTriangle className={cls} aria-hidden="true" />;
      case 'corrected':
        return <Clock className={cls} aria-hidden="true" />;
      case 'closed':
        return <CheckCircle className={cls} aria-hidden="true" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-32 ml-auto" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6 bg-destructive/10 border-destructive/20 dark:bg-destructive/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {t('nonConformanceManagement.loadError')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('nonConformanceManagement.loadErrorDesc')}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              {t('nonConformanceManagement.retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/equipment/${equipmentId}`}
          className={`inline-flex items-center text-muted-foreground hover:text-foreground mb-4 ${TRANSITION_PRESETS.fastColor}`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          {t('nonConformanceManagement.backToEquipment')}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{t('nonConformanceManagement.title')}</h1>
            {equipment && (
              <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>
                {equipment.name} ({equipment.managementNumber})
              </p>
            )}
          </div>
          {canCreateNC && equipment?.status !== ESVal.NON_CONFORMING && (
            <Button variant="destructive" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('nonConformanceManagement.register')}
            </Button>
          )}
        </div>
      </div>

      {/* 부적합 등록 폼 */}
      {showCreateForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4">
            {t('nonConformanceManagement.register')}
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nc-type">
                {t('nonConformanceManagement.form.ncType')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={createForm.ncType}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, ncType: v as NonConformanceType })
                }
              >
                <SelectTrigger id="nc-type" className="mt-1.5">
                  <SelectValue placeholder={t('nonConformanceManagement.form.ncTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_NC_TYPES.map((ncType) => (
                    <SelectItem key={ncType} value={ncType}>
                      {t(`nonConformanceManagement.form.${NC_TYPE_I18N_KEY[ncType]}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                {t('nonConformanceManagement.form.ncTypeHint')}
              </p>
            </div>
            <div>
              <Label htmlFor="nc-cause">
                {t('nonConformanceManagement.form.cause')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="nc-cause"
                value={createForm.cause}
                onChange={(e) => setCreateForm({ ...createForm, cause: e.target.value })}
                rows={3}
                className="mt-1.5"
                placeholder={t('nonConformanceManagement.form.causePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="nc-action-plan">
                {t('nonConformanceManagement.form.actionPlan')}
              </Label>
              <Textarea
                id="nc-action-plan"
                value={createForm.actionPlan}
                onChange={(e) => setCreateForm({ ...createForm, actionPlan: e.target.value })}
                rows={2}
                className="mt-1.5"
                placeholder={t('nonConformanceManagement.form.actionPlanPlaceholder')}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? t('nonConformanceManagement.form.registering')
                  : t('nonConformanceManagement.form.register')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ cause: '', ncType: 'other', actionPlan: '' });
                }}
              >
                {t('nonConformanceManagement.form.cancel')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 부적합 목록 */}
      <div className="space-y-4">
        {nonConformances.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="inline-block motion-safe:animate-gentle-bounce">
              <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">
              {t('nonConformanceManagement.empty')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {t('nonConformanceManagement.emptyDesc')}
            </p>
          </Card>
        ) : (
          nonConformances.map((nc, index) => (
            <Card
              key={nc.id}
              data-testid="nc-card"
              className="p-6 motion-safe:animate-[staggerFadeIn_0.3s_ease-out_forwards]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {getStatusIcon(nc.status)}
                  </div>
                  <span className={getSemanticBadgeClasses(ncStatusToSemantic(nc.status))}>
                    {t(`nonConformanceManagement.ncStatus.${nc.status}` as Parameters<typeof t>[0])}
                  </span>
                </div>
                <time dateTime={nc.discoveryDate} className="text-sm text-muted-foreground">
                  {t('nonConformanceManagement.discoveryDate', {
                    date: fmtDate(nc.discoveryDate),
                  })}
                </time>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                    {t(`nonConformanceManagement.ncType.${nc.ncType}` as Parameters<typeof t>[0])}
                  </span>
                  {nc.resolutionType && (
                    <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                      {t('nonConformanceManagement.resolution', {
                        type: t(
                          `nonConformanceManagement.resolutionType.${nc.resolutionType}` as Parameters<
                            typeof t
                          >[0]
                        ),
                      })}
                    </span>
                  )}
                  {nc.repairHistoryId && (
                    <Link
                      href={`/equipment/${equipmentId}/repair-history`}
                      className={NC_REPAIR_LINKED_TOKENS.badge}
                    >
                      {t('nonConformanceManagement.repairLinked')}
                    </Link>
                  )}
                </div>

                {/* 반려 사유 배너 */}
                {nc.status === NCStatusVal.OPEN && nc.rejectionReason && (
                  <div className={getSemanticContainerClasses('critical')}>
                    <div className="flex items-start gap-3">
                      <XCircle
                        className={`h-5 w-5 ${getSemanticContainerTextClasses('critical')} mt-0.5 flex-shrink-0`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className={`font-medium ${getSemanticContainerTextClasses('critical')}`}>
                          {t('nonConformanceManagement.rejectionTitle')}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {nc.rejectionReason}
                        </p>
                        {nc.rejectedAt && (
                          <time
                            dateTime={nc.rejectedAt}
                            className={`text-xs ${getSemanticContainerTextClasses('critical')} mt-1 block`}
                          >
                            {t('nonConformanceManagement.rejectionDate', {
                              date: fmtDate(nc.rejectedAt),
                            })}
                          </time>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('nonConformanceManagement.causeLabel')}
                  </h4>
                  <p className="text-foreground mt-1 leading-relaxed">{nc.cause}</p>
                </div>

                {nc.actionPlan && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('nonConformanceManagement.actionPlanLabel')}
                    </h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.actionPlan}</p>
                  </div>
                )}

                {nc.correctionContent && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('nonConformanceManagement.correctionLabel')}
                    </h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.correctionContent}</p>
                    {nc.correctionDate && (
                      <time
                        dateTime={nc.correctionDate}
                        className="text-sm text-muted-foreground mt-1 block"
                      >
                        {t('nonConformanceManagement.correctionDate', {
                          date: fmtDate(nc.correctionDate),
                        })}
                      </time>
                    )}
                  </div>
                )}

                {nc.closureNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('nonConformanceManagement.closureNotesLabel')}
                    </h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.closureNotes}</p>
                    {nc.closedAt && (
                      <time
                        dateTime={nc.closedAt}
                        className="text-sm text-muted-foreground mt-1 block"
                      >
                        {t('nonConformanceManagement.closureDate', {
                          date: fmtDate(nc.closedAt),
                        })}
                      </time>
                    )}
                  </div>
                )}
              </div>

              {/* 수리 안내 카드 */}
              {nc.status !== 'closed' && ['damage', 'malfunction'].includes(nc.ncType) && (
                <div className="mt-4 pt-4 border-t border-border">
                  {!nc.repairHistoryId ? (
                    <div
                      data-testid="nc-repair-warning"
                      className={getSemanticContainerClasses('warning')}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 ${getSemanticContainerTextClasses('warning')} mt-0.5`}
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <p
                            className={`font-medium ${getSemanticContainerTextClasses('warning')}`}
                          >
                            {t('nonConformanceManagement.repairNeeded')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {t('nonConformanceManagement.repairNeededDesc', {
                              type: t(
                                `nonConformanceManagement.ncType.${nc.ncType}` as Parameters<
                                  typeof t
                                >[0]
                              ),
                            })}
                          </p>
                          <Button variant="default" size="sm" className="mt-3" asChild>
                            <Link
                              href={`/equipment/${equipmentId}/repair-history?ncId=${nc.id}&autoOpen=true`}
                            >
                              <Wrench className="h-4 w-4 mr-2" aria-hidden="true" />
                              {t('nonConformanceManagement.registerRepair')}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div data-testid="nc-repair-linked" className={NC_REPAIR_LINKED_TOKENS.text}>
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      {t('nonConformanceManagement.repairLinkedApproval')}
                      <Link
                        href={`/equipment/${equipmentId}/repair-history`}
                        className="text-primary hover:underline ml-2"
                      >
                        {t('nonConformanceManagement.viewRepairHistory')}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 수정 폼 */}
              {editingId === nc.id && nc.status !== 'closed' && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div>
                    <Label htmlFor={`correction-${nc.id}`}>
                      {t('nonConformanceManagement.update.correction')}
                    </Label>
                    <Textarea
                      id={`correction-${nc.id}`}
                      value={updateForm.correctionContent}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, correctionContent: e.target.value })
                      }
                      rows={2}
                      className="mt-1.5"
                      placeholder={t('nonConformanceManagement.update.correctionPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`status-${nc.id}`}>
                      {t('nonConformanceManagement.update.statusChange')}
                    </Label>
                    <Select
                      value={updateForm.status || '_keep'}
                      onValueChange={(v) =>
                        setUpdateForm({
                          ...updateForm,
                          status: v === '_keep' ? '' : (v as 'open' | 'corrected'),
                        })
                      }
                    >
                      <SelectTrigger id={`status-${nc.id}`} className="mt-1.5">
                        <SelectValue
                          placeholder={t('nonConformanceManagement.update.keepStatus')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_keep">
                          {t('nonConformanceManagement.update.keepStatus')}
                        </SelectItem>
                        <SelectItem value="corrected">
                          {t('nonConformanceManagement.update.corrected')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleUpdate(nc.id)} disabled={updateMutation.isPending}>
                      {updateMutation.isPending
                        ? t('nonConformanceManagement.update.saving')
                        : t('nonConformanceManagement.update.save')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setUpdateForm({ correctionContent: '', status: '' });
                      }}
                    >
                      {t('nonConformanceManagement.update.cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {nc.status !== 'closed' && editingId !== nc.id && canEditNC && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="secondary" size="sm" onClick={() => startEditing(nc)}>
                    <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t('nonConformanceManagement.editRecord')}
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
