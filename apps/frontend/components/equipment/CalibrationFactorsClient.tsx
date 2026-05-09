'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import RejectModal from '@/components/approvals/RejectModal';
import { mapCalibrationFactorErrorToToast } from '@/lib/errors/calibration-factor-errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import calibrationFactorsApi, {
  type CalibrationFactor,
  CalibrationFactorType,
  FACTOR_APPROVAL_STATUS_COLORS,
} from '@/lib/api/calibration-factors-api';
import { CalibrationFactorCacheInvalidation } from '@/lib/api/cache-invalidation';
import type { PaginatedResponse } from '@/lib/api/types';
import { CALIBRATION_FACTOR_TYPE_VALUES } from '@equipment-management/schemas';
import { queryKeys } from '@/lib/api/query-config';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { CalibrationFactorApprovalStatusValues as CFASVal } from '@equipment-management/schemas';
import {
  Permission,
  VALIDATION_RULES,
  DEFAULT_PAGE_SIZE,
} from '@equipment-management/shared-constants';
import { Plus, Calculator, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ErrorState } from '@/components/shared/ErrorState';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/api/error';
import {
  getPageContainerClasses,
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
  getCalibrationActionButtonClasses,
  CODE_INLINE_TOKENS,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

interface CalibrationFactorsClientProps {
  /**
   * Server Component에서 전달받은 장비 ID
   */
  equipmentId: string;
}

/**
 * 보정계수 관리 Client Component
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 equipmentId를 전달받음
 * - 모든 인터랙티브 로직(useState, useMutation)을 담당
 */
export function CalibrationFactorsClient({ equipmentId }: CalibrationFactorsClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const t = useTranslations('equipment.calibrationFactorsClient');
  const tCal = useTranslations('calibration');
  const tErrors = useTranslations('errors');
  const { fmtDate, fmtDateTime } = useDateFormatter();

  const canApprove = can(Permission.APPROVE_CALIBRATION_FACTOR);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [rejectingFactorId, setRejectingFactorId] = useState<string | null>(null);
  const [newFactor, setNewFactor] = useState({
    factorType: '' as CalibrationFactorType | '',
    factorName: '',
    factorValue: '',
    unit: '',
    effectiveDate: '',
    expiryDate: '',
    parameters: '',
  });

  // 장비별 보정계수 조회
  const {
    data: equipmentFactors,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.calibrationFactors.byEquipment(equipmentId),
    queryFn: () => calibrationFactorsApi.getEquipmentFactors(equipmentId),
    enabled: !!equipmentId,
  });

  // 전체 보정계수 조회 (대기 중인 것 포함)
  const { data: allFactors } = useQuery({
    queryKey: queryKeys.calibrationFactors.allByEquipment(equipmentId),
    queryFn: () => calibrationFactorsApi.getCalibrationFactors({ equipmentId }),
    enabled: !!equipmentId,
  });

  // 보정계수 승인 뮤테이션 (권한: APPROVE_CALIBRATION_FACTOR)
  const approveFactorMutation = useOptimisticMutation<
    CalibrationFactor,
    { id: string; version: number },
    PaginatedResponse<CalibrationFactor>
  >({
    mutationFn: ({ id, version }) =>
      calibrationFactorsApi.approveCalibrationFactor(id, { version }),
    queryKey: queryKeys.calibrationFactors.allByEquipment(equipmentId),
    optimisticUpdate: (old, { id }) => ({
      ...(old ?? {
        data: [],
        meta: {
          pagination: { total: 0, pageSize: DEFAULT_PAGE_SIZE, currentPage: 1, totalPages: 0 },
        },
      }),
      data: (old?.data ?? []).map((f) =>
        f.id === id ? { ...f, approvalStatus: CFASVal.APPROVED } : f
      ),
    }),
    invalidateKeys: [...CalibrationFactorCacheInvalidation.APPROVE_KEYS],
    successMessage: t('approveSuccess'),
  });

  // 보정계수 반려 뮤테이션 (권한: APPROVE_CALIBRATION_FACTOR)
  const rejectFactorMutation = useOptimisticMutation<
    CalibrationFactor,
    { id: string; version: number; rejectionReason: string },
    PaginatedResponse<CalibrationFactor>
  >({
    mutationFn: ({ id, version, rejectionReason }) =>
      calibrationFactorsApi.rejectCalibrationFactor(id, { version, rejectionReason }),
    queryKey: queryKeys.calibrationFactors.allByEquipment(equipmentId),
    optimisticUpdate: (old, { id }) => ({
      ...(old ?? {
        data: [],
        meta: {
          pagination: { total: 0, pageSize: DEFAULT_PAGE_SIZE, currentPage: 1, totalPages: 0 },
        },
      }),
      data: (old?.data ?? []).map((f) =>
        f.id === id ? { ...f, approvalStatus: CFASVal.REJECTED } : f
      ),
    }),
    invalidateKeys: [...CalibrationFactorCacheInvalidation.REJECT_KEYS],
    successMessage: t('rejectSuccess'),
    onErrorCallback: (error: unknown) => {
      const { title, description } = mapCalibrationFactorErrorToToast(error, tCal, tErrors);
      toast({ title, description, variant: 'destructive' });
    },
  });

  // 보정계수 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: calibrationFactorsApi.createCalibrationFactor,
    onSuccess: () => {
      toast({
        title: t('toastSuccess'),
        description: t('toastSuccessDesc'),
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({
        title: t('toastError'),
        description: getErrorMessage(error, t('toastErrorDesc')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.all });
    },
  });

  const resetForm = () => {
    setNewFactor({
      factorType: '',
      factorName: '',
      factorValue: '',
      unit: '',
      effectiveDate: '',
      expiryDate: '',
      parameters: '',
    });
  };

  const handleCreate = () => {
    if (
      !newFactor.factorType ||
      !newFactor.factorName ||
      !newFactor.factorValue ||
      !newFactor.unit ||
      !newFactor.effectiveDate
    ) {
      toast({
        title: t('toastValidationError'),
        description: t('toastRequiredFields'),
        variant: 'destructive',
      });
      return;
    }

    let parameters: Record<string, unknown> | undefined;
    if (newFactor.parameters) {
      try {
        parameters = JSON.parse(newFactor.parameters);
      } catch {
        toast({
          title: t('toastValidationError'),
          description: t('toastInvalidJson'),
          variant: 'destructive',
        });
        return;
      }
    }

    createMutation.mutate({
      equipmentId,
      factorType: newFactor.factorType as CalibrationFactorType,
      factorName: newFactor.factorName,
      factorValue: parseFloat(newFactor.factorValue),
      unit: newFactor.unit,
      effectiveDate: newFactor.effectiveDate,
      expiryDate: newFactor.expiryDate || undefined,
      parameters,
    });
  };

  const currentFactors = equipmentFactors?.factors || [];
  const pendingFactors =
    allFactors?.data?.filter((f) => f.approvalStatus === CFASVal.PENDING) || [];
  const rejectingFactor = rejectingFactorId
    ? (pendingFactors.find((f) => f.id === rejectingFactorId) ?? null)
    : null;
  const isFactorActionPending = approveFactorMutation.isPending || rejectFactorMutation.isPending;

  if (isLoading) {
    return null; // loading.tsx에서 처리
  }

  if (isError) {
    return (
      <div className={getPageContainerClasses()}>
        <ErrorState title={t('loadError')} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <PageHeader
          title={t('title')}
          subtitle={t('equipmentId', { id: equipmentId })}
          backUrl={`/equipment/${equipmentId}`}
          backLabel={t('backAriaLabel')}
          actions={
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('requestButton')}
              </Button>
            </DialogTrigger>
          }
        />
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('requestDialogTitle')}</DialogTitle>
            <DialogDescription>{t('requestDialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="factorType">{t('formFactorType')}</Label>
              <Select
                value={newFactor.factorType}
                onValueChange={(value) =>
                  setNewFactor({ ...newFactor, factorType: value as CalibrationFactorType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('formFactorTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CALIBRATION_FACTOR_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tCal(`factorType.${value}` as Parameters<typeof tCal>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="factorName">{t('formFactorName')}</Label>
              <Input
                id="factorName"
                placeholder={t('formFactorNamePlaceholder')}
                value={newFactor.factorName}
                onChange={(e) => setNewFactor({ ...newFactor, factorName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="factorValue">{t('formFactorValue')}</Label>
                <Input
                  id="factorValue"
                  type="number"
                  step="0.000001"
                  placeholder="12.5"
                  value={newFactor.factorValue}
                  onChange={(e) => setNewFactor({ ...newFactor, factorValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('formUnit')}</Label>
                <Input
                  id="unit"
                  placeholder={t('formUnitPlaceholder')}
                  value={newFactor.unit}
                  onChange={(e) => setNewFactor({ ...newFactor, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">{t('formEffectiveDate')}</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={newFactor.effectiveDate}
                  onChange={(e) => setNewFactor({ ...newFactor, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">{t('formExpiryDate')}</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newFactor.expiryDate}
                  onChange={(e) => setNewFactor({ ...newFactor, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parameters">{t('formParameters')}</Label>
              <Textarea
                id="parameters"
                placeholder='{"frequency": "3GHz", "temperature": "25C"}'
                value={newFactor.parameters}
                onChange={(e) => setNewFactor({ ...newFactor, parameters: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              loading={createMutation.isPending}
            >
              {createMutation.isPending ? t('requesting') : t('submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 대기 중인 요청 */}
      {pendingFactors.length > 0 && (
        <Card className={getSemanticContainerColorClasses('warning')}>
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${getSemanticContainerTextClasses('warning')}`}
            >
              <Clock className="h-5 w-5" />
              {t('pendingTitle')}
            </CardTitle>
            <CardDescription className={getSemanticContainerTextClasses('warning')}>
              {t('pendingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pendingTableType')}</TableHead>
                  <TableHead>{t('pendingTableName')}</TableHead>
                  <TableHead>{t('pendingTableValue')}</TableHead>
                  <TableHead>{t('pendingTableEffectiveDate')}</TableHead>
                  <TableHead>{t('pendingTableRequestDate')}</TableHead>
                  <TableHead>{t('pendingTableStatus')}</TableHead>
                  {canApprove && <TableHead>{t('pendingTableActions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {tCal(`factorType.${factor.factorType}` as Parameters<typeof tCal>[0])}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factor.factorName}</TableCell>
                    <TableCell>
                      {factor.factorValue} {factor.unit}
                    </TableCell>
                    <TableCell>{fmtDate(factor.effectiveDate)}</TableCell>
                    <TableCell>{fmtDateTime(factor.requestedAt)}</TableCell>
                    <TableCell>
                      <Badge className={FACTOR_APPROVAL_STATUS_COLORS[factor.approvalStatus]}>
                        {tCal(
                          `factorApprovalStatus.${factor.approvalStatus}` as Parameters<
                            typeof tCal
                          >[0]
                        )}
                      </Badge>
                    </TableCell>
                    {canApprove && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className={getCalibrationActionButtonClasses('approve')}
                            aria-label={t('approveButtonAriaLabel', { name: factor.factorName })}
                            disabled={isFactorActionPending}
                            loading={approveFactorMutation.isPending}
                            onClick={() =>
                              approveFactorMutation.mutate({
                                id: factor.id,
                                version: factor.version,
                              })
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {t('approveButton')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={getCalibrationActionButtonClasses('reject')}
                            aria-label={t('rejectButtonAriaLabel', { name: factor.factorName })}
                            disabled={isFactorActionPending}
                            loading={rejectFactorMutation.isPending}
                            onClick={() => setRejectingFactorId(factor.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {t('rejectButton')}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 현재 적용 중인 보정계수 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('currentTitle')}
          </CardTitle>
          <CardDescription>
            {t('currentDescription', { count: currentFactors.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFactors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('emptyTitle')}</p>
              <p className="text-sm mt-2">{t('emptyDescription')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('currentTableType')}</TableHead>
                  <TableHead>{t('currentTableName')}</TableHead>
                  <TableHead>{t('currentTableValue')}</TableHead>
                  <TableHead>{t('currentTableParameters')}</TableHead>
                  <TableHead>{t('currentTablePeriod')}</TableHead>
                  <TableHead>{t('currentTableApprovedDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {tCal(`factorType.${factor.factorType}` as Parameters<typeof tCal>[0])}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factor.factorName}</TableCell>
                    <TableCell className="font-mono">
                      {factor.factorValue} {factor.unit}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {factor.parameters ? (
                        <code className={CODE_INLINE_TOKENS.compact}>
                          {JSON.stringify(factor.parameters)}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {fmtDate(factor.effectiveDate)}
                      {factor.expiryDate && <> ~ {fmtDate(factor.expiryDate)}</>}
                    </TableCell>
                    <TableCell>{fmtDate(factor.approvedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canApprove && (
        <RejectModal
          mode="domain"
          isOpen={rejectingFactorId !== null}
          onClose={() => setRejectingFactorId(null)}
          onConfirm={async (reason: string) => {
            if (!rejectingFactor) return;
            await rejectFactorMutation.mutateAsync({
              id: rejectingFactor.id,
              version: rejectingFactor.version,
              rejectionReason: reason,
            });
          }}
          title={t('rejectTitle')}
          description={t('rejectDescription', {
            min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
          })}
        />
      )}
    </div>
  );
}
