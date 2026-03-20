'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
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
import { RejectReasonDialog } from '@/components/admin/RejectReasonDialog';
import { ApprovalLoadingSkeleton } from '@/components/admin/ApprovalLoadingSkeleton';
import { ApprovalEmptyState } from '@/components/admin/ApprovalEmptyState';
import softwareApi, {
  SoftwareHistory,
  SOFTWARE_APPROVAL_STATUS_LABELS,
} from '@/lib/api/software-api';
import {
  SOFTWARE_APPROVAL_BADGE_TOKENS,
  SOFTWARE_APPROVAL_PAGE_TOKENS as TOKENS,
} from '@/lib/design-tokens';
import { queryKeys } from '@/lib/api/query-config';
import type { PaginatedResponse } from '@/lib/api/types';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Monitor, ArrowRight, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

/** 승인/반려 후 무효화할 쿼리 키 — 승인 카운트 + 전체 소프트웨어 캐시 */
const SOFTWARE_APPROVAL_INVALIDATE_KEYS = [queryKeys.software.all, queryKeys.approvals.all];

export default function SoftwareApprovalsContent() {
  const { toast } = useToast();
  const t = useTranslations('approvals.softwareApprovals');
  const tActions = useTranslations('approvals.actions');
  const tCommon = useTranslations('common.actions');
  const [selectedChange, setSelectedChange] = useState<SoftwareHistory | null>(null);
  const [comment, setComment] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: pendingData, isLoading } = useQuery({
    queryKey: queryKeys.software.pending(),
    queryFn: () => softwareApi.getPendingSoftwareChanges(),
  });

  const approveMutation = useOptimisticMutation<
    SoftwareHistory,
    { id: string; approverComment: string; version: number },
    PaginatedResponse<SoftwareHistory>
  >({
    mutationFn: async ({ id, approverComment, version }) => {
      return softwareApi.approveSoftwareChange(id, { approverComment, version });
    },
    queryKey: queryKeys.software.pending(),
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
    invalidateKeys: SOFTWARE_APPROVAL_INVALIDATE_KEYS,
    successMessage: t('toasts.approveSuccessDesc'),
    errorMessage: t('toasts.approveError'),
    onSuccessCallback: () => {
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedChange(null);
    },
  });

  const rejectMutation = useOptimisticMutation<
    SoftwareHistory,
    { id: string; rejectionReason: string; version: number },
    PaginatedResponse<SoftwareHistory>
  >({
    mutationFn: async ({ id, rejectionReason, version }) => {
      return softwareApi.rejectSoftwareChange(id, { rejectionReason, version });
    },
    queryKey: queryKeys.software.pending(),
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
    invalidateKeys: SOFTWARE_APPROVAL_INVALIDATE_KEYS,
    successMessage: t('toasts.rejectSuccessDesc'),
    errorMessage: t('toasts.rejectError'),
    onSuccessCallback: () => {
      setIsRejectDialogOpen(false);
      setSelectedChange(null);
    },
  });

  const handleApprove = (change: SoftwareHistory) => {
    setSelectedChange(change);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (change: SoftwareHistory) => {
    setSelectedChange(change);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedChange) return;
    if (!comment.trim()) {
      toast({
        title: t('toasts.commentRequired'),
        description: t('toasts.commentRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({
      id: selectedChange.id,
      approverComment: comment,
      version: selectedChange.version,
    });
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedChange) return;
    rejectMutation.mutate({
      id: selectedChange.id,
      rejectionReason: reason,
      version: selectedChange.version,
    });
  };

  const pendingChanges = pendingData?.data || [];

  if (isLoading) {
    return <ApprovalLoadingSkeleton cardHeight="h-32" />;
  }

  return (
    <div className={TOKENS.container}>
      <div>
        <h1 className={TOKENS.header.title}>{t('title')}</h1>
        <p className={TOKENS.header.subtitle}>{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('listTitle')}</CardTitle>
          <CardDescription>
            {t('listDescription', { count: pendingChanges.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingChanges.length === 0 ? (
            <ApprovalEmptyState message={t('emptyState')} />
          ) : (
            <div className="space-y-4">
              {pendingChanges.map((change: SoftwareHistory) => (
                <Card key={change.id} className={TOKENS.card.base}>
                  <CardContent className={TOKENS.card.content}>
                    <div className={TOKENS.card.layout}>
                      <div className={TOKENS.card.body}>
                        <div className={TOKENS.cardHeader.container}>
                          <Badge className={SOFTWARE_APPROVAL_BADGE_TOKENS[change.approvalStatus]}>
                            {SOFTWARE_APPROVAL_STATUS_LABELS[change.approvalStatus]}
                          </Badge>
                          <span className={TOKENS.cardHeader.name}>{change.softwareName}</span>
                          <Link
                            href={`/equipment/${change.equipmentId}`}
                            className={TOKENS.cardHeader.link}
                          >
                            {t('viewEquipment')}
                          </Link>
                        </div>

                        <div className={TOKENS.infoGrid.container}>
                          <div className={TOKENS.infoGrid.item}>
                            <Monitor className={TOKENS.infoGrid.icon} />
                            <div>
                              <p className={TOKENS.infoGrid.label}>{t('fields.equipmentId')}</p>
                              <p className={TOKENS.infoGrid.monoValue}>
                                {change.equipmentId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className={TOKENS.infoGrid.item}>
                            <ArrowRight className={TOKENS.infoGrid.icon} />
                            <div>
                              <p className={TOKENS.infoGrid.label}>{t('fields.versionChange')}</p>
                              <p className={TOKENS.infoGrid.value}>
                                {change.previousVersion || t('fields.newVersion')} -&gt;{' '}
                                {change.newVersion}
                              </p>
                            </div>
                          </div>
                          <div className={TOKENS.infoGrid.item}>
                            <Clock className={TOKENS.infoGrid.icon} />
                            <div>
                              <p className={TOKENS.infoGrid.label}>{t('fields.changeDate')}</p>
                              <p className={TOKENS.infoGrid.value}>
                                {format(new Date(change.changedAt), 'yyyy-MM-dd HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={TOKENS.verificationBox.container}>
                          <div className={TOKENS.verificationBox.header}>
                            <FileText className={TOKENS.verificationBox.headerIcon} />
                            <p className={TOKENS.verificationBox.headerText}>
                              {t('fields.verificationRecord')}
                            </p>
                          </div>
                          <p className={TOKENS.verificationBox.content}>
                            {change.verificationRecord}
                          </p>
                        </div>

                        <div className={TOKENS.meta}>
                          {t('fields.requestDate')}:{' '}
                          {format(new Date(change.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className={TOKENS.actions}>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(change)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {tActions('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(change)}
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
            {selectedChange && (
              <div className={TOKENS.dialogSummary}>
                <p>
                  <strong>{t('approveDialog.software')}</strong> {selectedChange.softwareName}
                </p>
                <p>
                  <strong>{t('approveDialog.versionChange')}</strong>{' '}
                  {selectedChange.previousVersion || t('fields.newVersion')} -&gt;{' '}
                  {selectedChange.newVersion}
                </p>
                <p>
                  <strong>{t('approveDialog.verificationRecord')}</strong>{' '}
                  {selectedChange.verificationRecord}
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
        {selectedChange && (
          <div className={TOKENS.dialogSummary}>
            <p>
              <strong>{t('approveDialog.software')}</strong> {selectedChange.softwareName}
            </p>
            <p>
              <strong>{t('approveDialog.versionChange')}</strong>{' '}
              {selectedChange.previousVersion || t('fields.newVersion')} -&gt;{' '}
              {selectedChange.newVersion}
            </p>
            <p>
              <strong>{t('approveDialog.verificationRecord')}</strong>{' '}
              {selectedChange.verificationRecord}
            </p>
          </div>
        )}
      </RejectReasonDialog>
    </div>
  );
}
