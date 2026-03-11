'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { queryKeys } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
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
import { ArrowLeft, Check, X, Package, Undo2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import equipmentImportApi from '@/lib/api/equipment-import-api';
import { EquipmentImportStatusBadge } from './EquipmentImportStatusBadge';
import {
  CLASSIFICATION_LABELS,
  EQUIPMENT_IMPORT_SOURCE_LABELS,
  type EquipmentImportStatus,
  type Classification,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';

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
  const { toast } = useToast();
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
      const sourceLabel = EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType];
      const classificationLabel =
        CLASSIFICATION_LABELS[equipmentImport.classification as Classification];
      const label = `${sourceLabel} ${classificationLabel} - ${equipmentImport.equipmentName}`;
      setDynamicLabel(id, label);
    }

    return () => {
      clearDynamicLabel(id);
    };
  }, [equipmentImport, id, setDynamicLabel, clearDynamicLabel]);

  const approveMutation = useMutation({
    mutationFn: () => equipmentImportApi.approve(id, equipmentImport?.version || 1),
    onSuccess: () => {
      toast({ title: t('equipmentImport.toasts.approveSuccess') });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast({
        title: t('equipmentImport.toasts.approveFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
      if (errorMessage.includes('다른 사용자가') || errorMessage.includes('VERSION_CONFLICT')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => equipmentImportApi.reject(id, equipmentImport?.version || 1, rejectionReason),
    onSuccess: () => {
      toast({ title: t('equipmentImport.toasts.rejectSuccess') });
      setShowRejectDialog(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast({
        title: t('equipmentImport.toasts.rejectFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
      if (errorMessage.includes('다른 사용자가') || errorMessage.includes('VERSION_CONFLICT')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
      }
    },
  });

  const initiateReturnMutation = useMutation({
    mutationFn: () => equipmentImportApi.initiateReturn(id),
    onSuccess: () => {
      toast({ title: t('equipmentImport.toasts.returnStarted') });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      toast({
        title: t('equipmentImport.toasts.returnFailed'),
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => equipmentImportApi.cancel(id, cancelReason),
    onSuccess: () => {
      toast({ title: t('equipmentImport.toasts.cancelSuccess') });
      setShowCancelDialog(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      toast({
        title: t('equipmentImport.toasts.cancelFailed'),
        description: getErrorMessage(error),
        variant: 'destructive',
      });
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
    userRole === 'technical_manager' || userRole === 'lab_manager' || userRole === 'system_admin';

  const isRental = equipmentImport.sourceType === 'rental';
  const isInternalShared = equipmentImport.sourceType === 'internal_shared';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/checkouts?view=inbound')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{equipmentImport.equipmentName}</h1>
          <p className="text-muted-foreground">
            {t('equipmentImport.detailSubtitle', {
              source: EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType],
            })}
          </p>
        </div>
        <EquipmentImportStatusBadge status={status} />
      </div>

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
              <dd>
                {CLASSIFICATION_LABELS[equipmentImport.classification as Classification] ||
                  equipmentImport.classification}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('equipmentImport.source')}</dt>
              <dd>{EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType]}</dd>
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
      {status === 'rejected' && equipmentImport.rejectionReason && (
        <Card className="border-brand-critical/40">
          <CardHeader>
            <CardTitle className="text-brand-critical">
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
        {status === 'pending' && canApprove && (
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
        {status === 'pending' && isRequester && (
          <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
            <Ban className="mr-2 h-4 w-4" />
            {t('equipmentImport.cancel')}
          </Button>
        )}

        {status === 'approved' && (
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

        {status === 'received' && (
          <Button
            onClick={() => initiateReturnMutation.mutate()}
            disabled={initiateReturnMutation.isPending}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            {t('equipmentImport.initiateReturn')}
          </Button>
        )}

        {status === 'return_requested' && equipmentImport.returnCheckoutId && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(equipmentImport.returnCheckoutId!))
            }
          >
            {t('equipmentImport.viewReturnProgress')}
          </Button>
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
