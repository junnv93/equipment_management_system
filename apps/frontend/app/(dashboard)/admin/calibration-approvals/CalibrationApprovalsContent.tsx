'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { CalibrationApprovalStatusValues as CASVal } from '@equipment-management/schemas';
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
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { queryKeys } from '@/lib/api/query-config';
import { CalibrationCacheInvalidation } from '@/lib/api/cache-invalidation';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, User, Building2 } from 'lucide-react';
import { CALIBRATION_RESULT_LABELS, type CalibrationResult } from '@equipment-management/schemas';

// Calibration 타입을 직접 사용 (CalibrationRequest는 Calibration의 별칭)
type CalibrationRequest = Calibration;

const getResultLabel = (result: string): string => {
  return CALIBRATION_RESULT_LABELS[result as CalibrationResult] || result;
};

// 결과 색상 (소문자 값만 지원 — 백엔드 정규화 완료)
const RESULT_SEMANTIC: Record<string, SemanticColorKey> = {
  pass: 'ok',
  fail: 'critical',
  conditional: 'warning',
};

import {
  APPROVAL_STATUS_LABELS as STATUS_LABELS,
  APPROVAL_STATUS_COLORS as STATUS_COLORS,
} from '@/components/admin/approval-constants';
import {
  getPageContainerClasses,
  APPROVAL_CARD_BORDER_TOKENS,
  getSemanticStatusClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

export default function CalibrationApprovalsContent() {
  const t = useTranslations('approvals.calibrationApprovals');
  const tActions = useTranslations('approvals.actions');
  const tCommon = useTranslations('common.actions');
  const [selectedRequest, setSelectedRequest] = useState<CalibrationRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: queryKeys.calibrations.pending(),
    queryFn: async () => {
      return calibrationApi.getPendingCalibrations();
    },
  });

  const approveMutation = useOptimisticMutation<
    Calibration,
    { id: string; version: number; approverComment?: string },
    { items: Calibration[] }
  >({
    mutationFn: ({ id, version, approverComment }) =>
      calibrationApi.approveCalibration(id, { version, approverComment }),
    queryKey: queryKeys.calibrations.pending(),
    optimisticUpdate: (old, { id }) => ({
      ...old,
      items: (old?.items ?? []).map((cal) =>
        cal.id === id ? { ...cal, approvalStatus: CASVal.APPROVED } : cal
      ),
    }),
    invalidateKeys: [...CalibrationCacheInvalidation.APPROVE_KEYS],
    successMessage: t('toasts.approveSuccess'),
    onSuccessCallback: () => {
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedRequest(null);
    },
  });

  const rejectMutation = useOptimisticMutation<
    Calibration,
    { id: string; version: number; rejectionReason: string },
    { items: Calibration[] }
  >({
    mutationFn: ({ id, version, rejectionReason }) =>
      calibrationApi.rejectCalibration(id, { version, rejectionReason }),
    queryKey: queryKeys.calibrations.pending(),
    optimisticUpdate: (old, { id }) => ({
      ...old,
      items: (old?.items ?? []).map((cal) =>
        cal.id === id ? { ...cal, approvalStatus: CASVal.REJECTED } : cal
      ),
    }),
    invalidateKeys: [...CalibrationCacheInvalidation.REJECT_KEYS],
    successMessage: t('toasts.rejectSuccess'),
    onSuccessCallback: () => {
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
    },
  });

  const handleApprove = (request: CalibrationRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (request: CalibrationRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      version: selectedRequest.version,
      approverComment: comment.trim() || undefined,
    });
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      id: selectedRequest.id,
      version: selectedRequest.version,
      rejectionReason: reason,
    });
  };

  const pendingRequests = requests?.items || [];

  if (isLoading) {
    return <ApprovalLoadingSkeleton />;
  }

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader title={t('title')} subtitle={t('description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('listTitle')}</CardTitle>
          <CardDescription>
            {t('listDescription', { count: pendingRequests.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <ApprovalEmptyState message={t('emptyState')} />
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className={APPROVAL_CARD_BORDER_TOKENS.pending}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge
                            className={
                              request.approvalStatus ? STATUS_COLORS[request.approvalStatus] : ''
                            }
                          >
                            {request.approvalStatus
                              ? STATUS_LABELS[request.approvalStatus]
                              : t('noStatus')}
                          </Badge>
                          <Badge
                            className={
                              request.result && RESULT_SEMANTIC[request.result]
                                ? getSemanticStatusClasses(RESULT_SEMANTIC[request.result!])
                                : getSemanticStatusClasses('neutral')
                            }
                          >
                            {request.result ? getResultLabel(request.result) : t('noResult')}
                          </Badge>
                          <span className="text-sm font-medium">
                            {t('fields.equipmentId')}: {request.equipmentId}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.calibrationDate')}</p>
                              <p className="font-medium">
                                {format(new Date(request.calibrationDate), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                {t('fields.nextCalibrationDate')}
                              </p>
                              <p className="font-medium">
                                {format(new Date(request.nextCalibrationDate), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                {t('fields.calibrationAgency')}
                              </p>
                              <p className="font-medium">{request.calibrationAgency}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.registrant')}</p>
                              <p className="font-medium">
                                {t(
                                  `fields.roles.${request.registeredByRole}` as
                                    | 'fields.roles.test_engineer'
                                    | 'fields.roles.technical_manager'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.intermediateCheckDate && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {t('fields.intermediateCheckDate')}{' '}
                            </span>
                            <span className="font-medium">
                              {format(new Date(request.intermediateCheckDate), 'yyyy-MM-dd')}
                            </span>
                          </div>
                        )}

                        {request.notes && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">{t('fields.notes')}</p>
                            <p className="text-sm">{request.notes}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {t('fields.registeredDate')}:{' '}
                          {format(new Date(request.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {tActions('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
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

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approveDialog.title')}</DialogTitle>
            <DialogDescription>{t('approveDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button onClick={handleApproveConfirm} disabled={approveMutation.isPending}>
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
      />
    </div>
  );
}
