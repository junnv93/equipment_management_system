'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage, isConflictError } from '@/lib/api/error';
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
import { RejectReasonDialog } from '@/components/admin/RejectReasonDialog';
import { ApprovalLoadingSkeleton } from '@/components/admin/ApprovalLoadingSkeleton';
import { ApprovalEmptyState } from '@/components/admin/ApprovalEmptyState';
import calibrationFactorsApi, {
  CalibrationFactor,
  FACTOR_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  FACTOR_APPROVAL_STATUS_COLORS,
} from '@/lib/api/calibration-factors-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calculator, Calendar } from 'lucide-react';
import { getPageContainerClasses, APPROVAL_CARD_BORDER_TOKENS } from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

export default function CalibrationFactorApprovalsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('approvals.calibrationFactorApprovals');
  const tActions = useTranslations('approvals.actions');
  const tCommon = useTranslations('common.actions');
  const [selectedFactor, setSelectedFactor] = useState<CalibrationFactor | null>(null);
  const [comment, setComment] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: pendingData, isLoading } = useQuery({
    queryKey: queryKeys.calibrationFactors.pending(),
    queryFn: () => calibrationFactorsApi.getPendingCalibrationFactors(),
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      approverComment,
      version,
    }: {
      id: string;
      approverComment: string;
      version: number;
    }) => {
      return calibrationFactorsApi.approveCalibrationFactor(id, {
        approverComment,
        version,
      });
    },
    onSuccess: () => {
      toast({
        title: t('toasts.approveSuccess'),
        description: t('toasts.approveSuccessDesc'),
      });
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedFactor(null);
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        toast({
          title: t('toasts.conflictError'),
          description: t('toasts.conflictErrorDesc'),
          variant: 'destructive',
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.pending() });
        return;
      }
      toast({
        title: t('toasts.approveError'),
        description: getErrorMessage(error, t('toasts.approveError')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.all });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
      version,
    }: {
      id: string;
      rejectionReason: string;
      version: number;
    }) => {
      return calibrationFactorsApi.rejectCalibrationFactor(id, {
        rejectionReason,
        version,
      });
    },
    onSuccess: () => {
      toast({
        title: t('toasts.rejectSuccess'),
        description: t('toasts.rejectSuccessDesc'),
      });
      setIsRejectDialogOpen(false);
      setSelectedFactor(null);
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        toast({
          title: t('toasts.conflictError'),
          description: t('toasts.conflictErrorDesc'),
          variant: 'destructive',
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.pending() });
        return;
      }
      toast({
        title: t('toasts.rejectError'),
        description: getErrorMessage(error, t('toasts.rejectError')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationFactors.all });
    },
  });

  const handleApprove = (factor: CalibrationFactor) => {
    setSelectedFactor(factor);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (factor: CalibrationFactor) => {
    setSelectedFactor(factor);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedFactor) return;
    if (!comment.trim()) {
      toast({
        title: t('toasts.commentRequired'),
        description: t('toasts.commentRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({
      id: selectedFactor.id,
      approverComment: comment,
      version: selectedFactor.version,
    });
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedFactor) return;
    rejectMutation.mutate({
      id: selectedFactor.id,
      rejectionReason: reason,
      version: selectedFactor.version,
    });
  };

  const pendingFactors = pendingData?.data || [];

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
            {t('listDescription', { count: pendingFactors.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingFactors.length === 0 ? (
            <ApprovalEmptyState message={t('emptyState')} />
          ) : (
            <div className="space-y-4">
              {pendingFactors.map((factor) => (
                <Card key={factor.id} className={APPROVAL_CARD_BORDER_TOKENS.pending}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={FACTOR_APPROVAL_STATUS_COLORS[factor.approvalStatus]}>
                            {APPROVAL_STATUS_LABELS[factor.approvalStatus]}
                          </Badge>
                          <Badge variant="outline">{FACTOR_TYPE_LABELS[factor.factorType]}</Badge>
                          <span className="text-sm font-medium">
                            {t('fields.equipmentId')}: {factor.equipmentId}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.factorName')}</p>
                              <p className="font-medium">{factor.factorName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.value')}</p>
                              <p className="font-medium font-mono">
                                {factor.factorValue} {factor.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.effectiveDate')}</p>
                              <p className="font-medium">
                                {format(new Date(factor.effectiveDate), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.expiryDate')}</p>
                              <p className="font-medium">
                                {factor.expiryDate
                                  ? format(new Date(factor.expiryDate), 'yyyy-MM-dd')
                                  : t('fields.noExpiry')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {factor.parameters && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">
                              {t('fields.additionalParams')}
                            </p>
                            <code className="text-sm">{JSON.stringify(factor.parameters)}</code>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {t('fields.requestDate')}:{' '}
                          {format(new Date(factor.requestedAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(factor)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {tActions('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(factor)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {tActions('reject')}
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
            {selectedFactor && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>{t('approveDialog.name')}</strong> {selectedFactor.factorName}
                </p>
                <p>
                  <strong>{t('approveDialog.value')}</strong> {selectedFactor.factorValue}{' '}
                  {selectedFactor.unit}
                </p>
                <p>
                  <strong>{t('approveDialog.type')}</strong>{' '}
                  {FACTOR_TYPE_LABELS[selectedFactor.factorType]}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="comment">{t('approveDialog.commentLabel')}</Label>
              <Textarea
                id="comment"
                placeholder={t('approveDialog.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setComment('');
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={!comment.trim() || approveMutation.isPending}
            >
              {tActions('approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isPending={rejectMutation.isPending}
        title={t('rejectTitle')}
      >
        {selectedFactor && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p>
              <strong>{t('approveDialog.name')}</strong> {selectedFactor.factorName}
            </p>
            <p>
              <strong>{t('approveDialog.value')}</strong> {selectedFactor.factorValue}{' '}
              {selectedFactor.unit}
            </p>
            <p>
              <strong>{t('approveDialog.type')}</strong>{' '}
              {FACTOR_TYPE_LABELS[selectedFactor.factorType]}
            </p>
          </div>
        )}
      </RejectReasonDialog>
    </div>
  );
}
