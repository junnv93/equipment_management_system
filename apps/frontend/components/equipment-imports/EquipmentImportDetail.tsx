'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { queryKeys } from '@/lib/api/query-config';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { EquipmentImportCacheInvalidation } from '@/lib/api/cache-invalidation';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Package, Undo2, Ban } from 'lucide-react';
import {
  getPageContainerClasses,
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import equipmentImportApi, { type EquipmentImport } from '@/lib/api/equipment-import-api';
import { EquipmentImportStatusBadge } from './EquipmentImportStatusBadge';
import {
  type EquipmentImportStatus,
  UserRoleValues as URVal,
  EquipmentImportStatusValues as EISVal,
  EquipmentImportSourceValues as EISrcVal,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { ExportFormButton } from '@/components/shared/ExportFormButton';

interface Props {
  id: string;
}

/**
 * Equipment Import Detail Component - Unified for rental and internal shared
 *
 * Displays import details with conditional sections based on sourceType:
 * - Rental: Shows vendor information (vendorName, vendorContact, externalIdentifier)
 * - Internal Shared: Shows department information (ownerDepartment, internalContact, borrowingJustification)
 *
 * Action buttons adapt to status and user permissions.
 */
export default function EquipmentImportDetail({ id }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const t = useTranslations('equipment');

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: equipmentImport, isLoading } = useQuery({
    queryKey: queryKeys.equipmentImports.detail(id),
    queryFn: () => equipmentImportApi.getOne(id),
  });

  // Breadcrumb dynamic label
  useEffect(() => {
    if (equipmentImport) {
      const sourceLabel = t(`importSource.${equipmentImport.sourceType}`);
      const classificationLabel = t(`classification.${equipmentImport.classification}`);
      const label = `${sourceLabel} ${classificationLabel} - ${equipmentImport.equipmentName}`;
      setDynamicLabel(id, label);
    }

    return () => {
      clearDynamicLabel(id);
    };
  }, [equipmentImport, id, setDynamicLabel, clearDynamicLabel, t]);

  const approveMutation = useOptimisticMutation<EquipmentImport, void, EquipmentImport>({
    mutationFn: async () => {
      const fresh = await equipmentImportApi.getOne(id);
      return equipmentImportApi.approve(id, fresh.version);
    },
    queryKey: queryKeys.equipmentImports.detail(id),
    optimisticUpdate: (old) => ({ ...old!, status: EISVal.APPROVED as EquipmentImportStatus }),
    invalidateKeys: [queryKeys.equipmentImports.lists()],
    successMessage: t('equipmentImport.toasts.approveSuccess'),
    errorMessage: t('equipmentImport.toasts.approveFailed'),
    onSuccessCallback: () => {
      EquipmentImportCacheInvalidation.invalidateAfterApprovalAction(queryClient, id);
    },
  });

  const rejectMutation = useOptimisticMutation<EquipmentImport, void, EquipmentImport>({
    mutationFn: async () => {
      const fresh = await equipmentImportApi.getOne(id);
      return equipmentImportApi.reject(id, fresh.version, rejectionReason);
    },
    queryKey: queryKeys.equipmentImports.detail(id),
    optimisticUpdate: (old) => ({ ...old!, status: EISVal.REJECTED as EquipmentImportStatus }),
    invalidateKeys: [queryKeys.equipmentImports.lists()],
    successMessage: t('equipmentImport.toasts.rejectSuccess'),
    errorMessage: t('equipmentImport.toasts.rejectFailed'),
    onSuccessCallback: () => {
      setShowRejectDialog(false);
      EquipmentImportCacheInvalidation.invalidateAfterApprovalAction(queryClient, id);
    },
  });

  const initiateReturnMutation = useOptimisticMutation<EquipmentImport, void, EquipmentImport>({
    mutationFn: async () => {
      const fresh = await equipmentImportApi.getOne(id);
      return equipmentImportApi.initiateReturn(id, fresh.version);
    },
    queryKey: queryKeys.equipmentImports.detail(id),
    optimisticUpdate: (old) => ({
      ...old!,
      status: EISVal.RETURN_REQUESTED as EquipmentImportStatus,
    }),
    invalidateKeys: [queryKeys.equipmentImports.lists()],
    successMessage: t('equipmentImport.toasts.returnStarted'),
    errorMessage: t('equipmentImport.toasts.returnFailed'),
    onSuccessCallback: () => {
      EquipmentImportCacheInvalidation.invalidateAfterInitiateReturn(queryClient, id);
    },
  });

  const cancelMutation = useOptimisticMutation<EquipmentImport, void, EquipmentImport>({
    mutationFn: async () => {
      const fresh = await equipmentImportApi.getOne(id);
      return equipmentImportApi.cancel(id, fresh.version, cancelReason || undefined);
    },
    queryKey: queryKeys.equipmentImports.detail(id),
    optimisticUpdate: (old) => ({ ...old!, status: EISVal.CANCELED as EquipmentImportStatus }),
    invalidateKeys: [queryKeys.equipmentImports.lists()],
    successMessage: t('equipmentImport.toasts.cancelSuccess'),
    errorMessage: t('equipmentImport.toasts.cancelFailed'),
    onSuccessCallback: () => {
      setShowCancelDialog(false);
      EquipmentImportCacheInvalidation.invalidateAfterCancel(queryClient, id);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t('equipmentImport.loading')}
      </div>
    );
  }

  if (!equipmentImport) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t('equipmentImport.notFound')}
      </div>
    );
  }

  const status = equipmentImport.status as EquipmentImportStatus;
  const isRequester = user?.id === equipmentImport.requesterId;
  const userRole = user?.roles?.[0];
  const canApprove =
    userRole === URVal.TECHNICAL_MANAGER ||
    userRole === URVal.LAB_MANAGER ||
    userRole === URVal.SYSTEM_ADMIN;

  const isRental = equipmentImport.sourceType === EISrcVal.RENTAL;
  const isInternalShared = equipmentImport.sourceType === EISrcVal.INTERNAL_SHARED;

  return (
    <div className={getPageContainerClasses('detail')}>
      <PageHeader
        title={equipmentImport.equipmentName}
        subtitle={t('equipmentImport.detailSubtitle', {
          source: t(`importSource.${equipmentImport.sourceType}`),
        })}
        onBack={() => router.push('/checkouts?view=inbound')}
        actions={<EquipmentImportStatusBadge status={status} />}
      />

      {/* Equipment Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('equipmentImport.equipmentInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('equipmentImport.equipmentName')}
              </dt>
              <dd className="font-medium">{equipmentImport.equipmentName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('equipmentImport.classificationLabel')}
              </dt>
              <dd>{t(`classification.${equipmentImport.classification}`)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('equipmentImport.source')}</dt>
              <dd>{t(`importSource.${equipmentImport.sourceType}`)}</dd>
            </div>
            {equipmentImport.modelName && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('equipmentImport.modelName')}</dt>
                <dd>{equipmentImport.modelName}</dd>
              </div>
            )}
            {equipmentImport.manufacturer && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('equipmentImport.manufacturer')}
                </dt>
                <dd>{equipmentImport.manufacturer}</dd>
              </div>
            )}
            {equipmentImport.serialNumber && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('equipmentImport.serialNumber')}
                </dt>
                <dd>{equipmentImport.serialNumber}</dd>
              </div>
            )}
            {equipmentImport.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('equipmentImport.description')}
                </dt>
                <dd>{equipmentImport.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Conditional Source Information Card */}
      {isRental && (
        <Card>
          <CardHeader>
            <CardTitle>{t('equipmentImport.rentalVendorInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t('equipmentImport.vendorName')}</dt>
                <dd className="font-medium">{equipmentImport.vendorName}</dd>
              </div>
              {equipmentImport.vendorContact && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('equipmentImport.vendorContact')}
                  </dt>
                  <dd>{equipmentImport.vendorContact}</dd>
                </div>
              )}
              {equipmentImport.externalIdentifier && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('equipmentImport.vendorEquipmentNumber')}
                  </dt>
                  <dd>{equipmentImport.externalIdentifier}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {isInternalShared && (
        <Card>
          <CardHeader>
            <CardTitle>{t('equipmentImport.ownerDepartmentInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('equipmentImport.ownerDepartment')}
                </dt>
                <dd className="font-medium">{equipmentImport.ownerDepartment}</dd>
              </div>
              {equipmentImport.internalContact && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('equipmentImport.internalContact')}
                  </dt>
                  <dd>{equipmentImport.internalContact}</dd>
                </div>
              )}
              {equipmentImport.externalIdentifier && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('equipmentImport.sourceIdentifier')}
                  </dt>
                  <dd>{equipmentImport.externalIdentifier}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Usage Period & Reason */}
      <Card>
        <CardHeader>
          <CardTitle>{t('equipmentImport.usagePeriodAndReason')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('equipmentImport.usagePeriodStart')}
              </dt>
              <dd>
                {format(new Date(equipmentImport.usagePeriodStart), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('equipmentImport.usagePeriodEnd')}
              </dt>
              <dd>
                {format(new Date(equipmentImport.usagePeriodEnd), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">{t('equipmentImport.importReason')}</dt>
              <dd className="whitespace-pre-wrap">{equipmentImport.reason}</dd>
            </div>
            {isInternalShared && equipmentImport.borrowingJustification && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('equipmentImport.detailedReason')}
                </dt>
                <dd className="whitespace-pre-wrap">{equipmentImport.borrowingJustification}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Connected Equipment (after receiving) */}
      {equipmentImport.equipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('equipmentImport.registeredEquipment')}</CardTitle>
            <CardDescription>{t('equipmentImport.registeredEquipmentDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                router.push(FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentImport.equipmentId!))
              }
            >
              {t('equipmentImport.viewEquipmentDetail')}
            </Button>
          </CardContent>
        </Card>
      )}

      {equipmentImport.returnCheckoutId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('equipmentImport.returnCheckout')}</CardTitle>
            <CardDescription>{t('equipmentImport.returnCheckoutDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(equipmentImport.returnCheckoutId!))
              }
            >
              {t('equipmentImport.viewCheckoutDetail')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {status === EISVal.REJECTED && equipmentImport.rejectionReason && (
        <Card className={getSemanticContainerColorClasses('critical')}>
          <CardHeader>
            <CardTitle className={getSemanticContainerTextClasses('critical')}>
              {t('equipmentImport.rejectionReason')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{equipmentImport.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Receiving Condition Results */}
      {equipmentImport.receivingCondition && (
        <Card>
          <CardHeader>
            <CardTitle>{t('equipmentImport.receivingCondition')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">{t('equipmentImport.appearance')}</dt>
                <dd>
                  {equipmentImport.receivingCondition.appearance === 'normal'
                    ? t('equipmentImport.conditionNormal')
                    : t('equipmentImport.conditionAbnormal')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('equipmentImport.operation')}</dt>
                <dd>
                  {equipmentImport.receivingCondition.operation === 'normal'
                    ? t('equipmentImport.conditionNormal')
                    : t('equipmentImport.conditionAbnormal')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('equipmentImport.accessories')}
                </dt>
                <dd>
                  {equipmentImport.receivingCondition.accessories === 'complete'
                    ? t('equipmentImport.accessoriesComplete')
                    : t('equipmentImport.accessoriesIncomplete')}
                </dd>
              </div>
              {equipmentImport.receivingCondition.notes && (
                <div className="sm:col-span-3">
                  <dt className="text-sm text-muted-foreground">{t('equipmentImport.notes')}</dt>
                  <dd>{equipmentImport.receivingCondition.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {status === EISVal.PENDING && canApprove && (
          <>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              <Check className="mr-2 h-4 w-4" />
              {t('equipmentImport.approve')}
            </Button>
            <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
              <X className="mr-2 h-4 w-4" />
              {t('equipmentImport.reject')}
            </Button>
          </>
        )}
        {status === EISVal.PENDING && isRequester && (
          <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
            <Ban className="mr-2 h-4 w-4" />
            {t('equipmentImport.cancel')}
          </Button>
        )}

        {status === EISVal.APPROVED && (
          <>
            <Button onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.RECEIVE(id))}>
              <Package className="mr-2 h-4 w-4" />
              {t('equipmentImport.receiveConfirm')}
            </Button>
            {isRequester && (
              <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                <Ban className="mr-2 h-4 w-4" />
                {t('equipmentImport.cancel')}
              </Button>
            )}
          </>
        )}

        {status === EISVal.RECEIVED && (
          <Button
            onClick={() => initiateReturnMutation.mutate()}
            disabled={initiateReturnMutation.isPending}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            {t('equipmentImport.initiateReturn')}
          </Button>
        )}

        {status === EISVal.RETURN_REQUESTED && equipmentImport.returnCheckoutId && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(equipmentImport.returnCheckoutId!))
            }
          >
            {t('equipmentImport.viewReturnProgress')}
          </Button>
        )}

        {/* 양식 분기: rental → QP-18-06(반출입확인서), internal_shared → QP-18-10(공용장비) */}
        {!([EISVal.PENDING, EISVal.REJECTED, EISVal.CANCELED] as EquipmentImportStatus[]).includes(
          status
        ) && (
          <ExportFormButton
            formNumber={isRental ? 'UL-QP-18-06' : 'UL-QP-18-10'}
            params={{ importId: id }}
            label={t('equipmentImport.exportForm')}
            errorToastDescription={t('equipmentImport.exportFormError')}
            size="default"
          />
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('equipmentImport.rejectDialog.title')}</DialogTitle>
            <DialogDescription>{t('equipmentImport.rejectDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">{t('equipmentImport.rejectDialog.reasonLabel')}</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder={t('equipmentImport.rejectDialog.reasonPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('equipmentImport.rejectDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {t('equipmentImport.rejectDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('equipmentImport.cancelDialog.title')}</DialogTitle>
            <DialogDescription>{t('equipmentImport.cancelDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">{t('equipmentImport.cancelDialog.reasonLabel')}</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder={t('equipmentImport.cancelDialog.reasonPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {t('equipmentImport.cancelDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {t('equipmentImport.cancelDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
