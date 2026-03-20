'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import type { PaginatedResponse } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import checkoutApi, { Checkout } from '@/lib/api/checkout-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, User, Building2, Package } from 'lucide-react';
import { ApprovalLoadingSkeleton } from '@/components/admin/ApprovalLoadingSkeleton';
import { ApprovalEmptyState } from '@/components/admin/ApprovalEmptyState';
import { useSession } from 'next-auth/react';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import {
  getPageContainerClasses,
  APPROVAL_CARD_BORDER_TOKENS,
  getSemanticStatusClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

const PURPOSE_SEMANTIC: Record<string, SemanticColorKey> = {
  calibration: 'info',
  repair: 'repair',
  rental: 'purple',
};

export default function ReturnApprovalsContent() {
  const { data: _session } = useSession();
  const t = useTranslations('approvals.returnApprovals');
  const tCommon = useTranslations('common.actions');
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 검사 완료된 반입 목록 조회 (returned 상태)
  const { data: checkouts, isLoading } = useQuery({
    queryKey: queryKeys.checkouts.returnPending(),
    queryFn: async () => {
      return checkoutApi.getPendingReturnApprovals();
    },
    staleTime: CACHE_TIMES.SHORT,
  });

  const approveMutation = useOptimisticMutation<
    Checkout,
    { id: string; version: number; comment?: string },
    PaginatedResponse<Checkout>
  >({
    mutationFn: async ({ id, version, comment }) => {
      return checkoutApi.approveReturn(id, { version, comment });
    },
    queryKey: queryKeys.checkouts.returnPending(),
    optimisticUpdate: (old, { id }) => {
      if (!old)
        return {
          data: [],
          meta: {
            pagination: { total: 0, pageSize: DEFAULT_PAGE_SIZE, currentPage: 1, totalPages: 0 },
          },
        };
      return {
        ...old,
        data: old.data.filter((c) => c.id !== id),
        meta: {
          ...old.meta,
          pagination: {
            ...old.meta.pagination,
            total: Math.max(0, old.meta.pagination.total - 1),
          },
        },
      };
    },
    invalidateKeys: CheckoutCacheInvalidation.RETURN_APPROVAL_KEYS,
    successMessage: t('approveDialog.description'),
    errorMessage: t('actions.processing'),
    onSuccessCallback: () => {
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedCheckout(null);
    },
  });

  const rejectMutation = useOptimisticMutation<
    Checkout,
    { id: string; version: number; reason: string },
    PaginatedResponse<Checkout>
  >({
    mutationFn: async ({ id, version, reason }) => {
      return checkoutApi.rejectReturn(id, { version, reason });
    },
    queryKey: queryKeys.checkouts.returnPending(),
    optimisticUpdate: (old, { id }) => {
      if (!old)
        return {
          data: [],
          meta: {
            pagination: { total: 0, pageSize: DEFAULT_PAGE_SIZE, currentPage: 1, totalPages: 0 },
          },
        };
      return {
        ...old,
        data: old.data.filter((c) => c.id !== id),
        meta: {
          ...old.meta,
          pagination: {
            ...old.meta.pagination,
            total: Math.max(0, old.meta.pagination.total - 1),
          },
        },
      };
    },
    invalidateKeys: CheckoutCacheInvalidation.RETURN_APPROVAL_KEYS,
    successMessage: t('rejectDialog.description'),
    errorMessage: t('actions.processing'),
    onSuccessCallback: () => {
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setSelectedCheckout(null);
    },
  });

  const handleApprove = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedCheckout) return;
    approveMutation.mutate({
      id: selectedCheckout.id,
      version: selectedCheckout.version,
      comment: comment.trim() || undefined,
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedCheckout || !rejectReason.trim()) return;
    rejectMutation.mutate({
      id: selectedCheckout.id,
      version: selectedCheckout.version,
      reason: rejectReason.trim(),
    });
  };

  const pendingReturns = checkouts?.data || [];
  const isActionPending = approveMutation.isPending || rejectMutation.isPending;

  if (isLoading) {
    return <ApprovalLoadingSkeleton cardHeight="h-24" />;
  }

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader title={t('title')} subtitle={t('description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('listTitle')}</CardTitle>
          <CardDescription>
            {t('listDescription', { count: pendingReturns.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReturns.length === 0 ? (
            <ApprovalEmptyState message={t('emptyState')} />
          ) : (
            <div className="space-y-4">
              {pendingReturns.map((checkout) => (
                <Card key={checkout.id} className={APPROVAL_CARD_BORDER_TOKENS.pending}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <CheckoutStatusBadge status={checkout.status} />
                          <Badge
                            className={
                              PURPOSE_SEMANTIC[checkout.purpose]
                                ? getSemanticStatusClasses(PURPOSE_SEMANTIC[checkout.purpose])
                                : getSemanticStatusClasses('neutral')
                            }
                          >
                            {t(
                              `purpose.${checkout.purpose}` as
                                | 'purpose.calibration'
                                | 'purpose.repair'
                                | 'purpose.rental'
                            )}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.equipment')}</p>
                              <p className="font-medium">
                                {checkout.equipment && checkout.equipment.length > 0
                                  ? checkout.equipment.length > 1
                                    ? t('fields.equipmentCount', {
                                        name: checkout.equipment[0].name,
                                        count: checkout.equipment.length - 1,
                                      })
                                    : checkout.equipment[0].name
                                  : t('fields.noEquipment')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.destination')}</p>
                              <p className="font-medium">{checkout.destination}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.returnDate')}</p>
                              <p className="font-medium">
                                {checkout.actualReturnDate
                                  ? format(new Date(checkout.actualReturnDate), 'yyyy-MM-dd')
                                  : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.returnProcessor')}</p>
                              <p className="font-medium">
                                {checkout.user?.name || t('fields.unknown')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 검사 결과 표시 */}
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">{t('inspection.title')}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`h-4 w-4 ${checkout.workingStatusChecked ? 'text-brand-ok' : 'text-muted-foreground'}`}
                              />
                              <span>
                                {t('inspection.working')}:{' '}
                                {checkout.workingStatusChecked
                                  ? t('inspection.complete')
                                  : t('inspection.incomplete')}
                              </span>
                            </div>
                            {checkout.purpose === 'calibration' && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2
                                  className={`h-4 w-4 ${checkout.calibrationChecked ? 'text-brand-ok' : 'text-muted-foreground'}`}
                                />
                                <span>
                                  {t('inspection.calibration')}:{' '}
                                  {checkout.calibrationChecked
                                    ? t('inspection.complete')
                                    : t('inspection.incomplete')}
                                </span>
                              </div>
                            )}
                            {checkout.purpose === 'repair' && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2
                                  className={`h-4 w-4 ${checkout.repairChecked ? 'text-brand-ok' : 'text-muted-foreground'}`}
                                />
                                <span>
                                  {t('inspection.repair')}:{' '}
                                  {checkout.repairChecked
                                    ? t('inspection.complete')
                                    : t('inspection.incomplete')}
                                </span>
                              </div>
                            )}
                          </div>
                          {checkout.inspectionNotes && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {t('inspection.notes')}:{' '}
                              </span>
                              <span>{checkout.inspectionNotes}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {t('fields.requestDate')}:{' '}
                          {format(new Date(checkout.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(checkout)}
                          disabled={isActionPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('actions.reject')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(checkout)}
                          disabled={isActionPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t('actions.finalApprove')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승인 다이얼로그 */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approveDialog.title')}</DialogTitle>
            <DialogDescription>{t('approveDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheckout && (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">
                    {t('approveDialog.checkoutPurpose')}:{' '}
                  </span>
                  <span className="font-medium">
                    {t(
                      `purpose.${selectedCheckout.purpose}` as
                        | 'purpose.calibration'
                        | 'purpose.repair'
                        | 'purpose.rental'
                    )}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t('approveDialog.destination')}: </span>
                  <span className="font-medium">{selectedCheckout.destination}</span>
                </p>
                <div className="pt-2 border-t">
                  <p className="font-medium mb-1">{t('approveDialog.inspectionResults')}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      {t('approveDialog.workingCheck')}:{' '}
                      {selectedCheckout.workingStatusChecked
                        ? t('inspection.complete')
                        : t('inspection.incomplete')}
                    </li>
                    {selectedCheckout.calibrationChecked && (
                      <li>{t('approveDialog.calibrationCheck')}</li>
                    )}
                    {selectedCheckout.repairChecked && <li>{t('approveDialog.repairCheck')}</li>}
                    {selectedCheckout.inspectionNotes && (
                      <li>
                        {t('approveDialog.notesLabel')}: {selectedCheckout.inspectionNotes}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="comment">{t('approveDialog.commentLabel')}</Label>
              <Textarea
                id="comment"
                placeholder={t('approveDialog.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setComment('');
                setSelectedCheckout(null);
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleApproveConfirm} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? t('actions.processing') : t('actions.finalApprove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectDialog.title')}</DialogTitle>
            <DialogDescription>{t('rejectDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheckout && (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">
                    {t('rejectDialog.checkoutPurpose')}:{' '}
                  </span>
                  <span className="font-medium">
                    {t(
                      `purpose.${selectedCheckout.purpose}` as
                        | 'purpose.calibration'
                        | 'purpose.repair'
                        | 'purpose.rental'
                    )}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t('rejectDialog.equipment')}: </span>
                  <span className="font-medium">
                    {selectedCheckout.equipment && selectedCheckout.equipment.length > 0
                      ? selectedCheckout.equipment[0].name
                      : t('rejectDialog.noEquipment')}
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reject-reason">{t('rejectDialog.reasonLabel')}</Label>
              <Textarea
                id="reject-reason"
                placeholder={t('rejectDialog.reasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason('');
                setSelectedCheckout(null);
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? t('actions.processing') : t('actions.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
