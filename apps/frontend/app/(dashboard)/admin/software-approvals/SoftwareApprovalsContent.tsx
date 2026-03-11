'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
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
import softwareApi, {
  SoftwareHistory,
  SOFTWARE_APPROVAL_STATUS_LABELS,
  SOFTWARE_APPROVAL_STATUS_COLORS,
} from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Monitor, ArrowRight, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SoftwareApprovalsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      return softwareApi.approveSoftwareChange(id, { approverComment, version });
    },
    onSuccess: () => {
      toast({
        title: t('toasts.approveSuccess'),
        description: t('toasts.approveSuccessDesc'),
      });
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedChange(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('toasts.approveError'),
        description: getErrorMessage(error, t('toasts.approveError')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.software.all });
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
      return softwareApi.rejectSoftwareChange(id, { rejectionReason, version });
    },
    onSuccess: () => {
      toast({
        title: t('toasts.rejectSuccess'),
        description: t('toasts.rejectSuccessDesc'),
      });
      setIsRejectDialogOpen(false);
      setSelectedChange(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('toasts.rejectError'),
        description: getErrorMessage(error, t('toasts.rejectError')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.software.pending() });
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
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
                <Card key={change.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={SOFTWARE_APPROVAL_STATUS_COLORS[change.approvalStatus]}>
                            {SOFTWARE_APPROVAL_STATUS_LABELS[change.approvalStatus]}
                          </Badge>
                          <span className="text-sm font-medium">{change.softwareName}</span>
                          <Link
                            href={`/equipment/${change.equipmentId}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {t('viewEquipment')}
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.equipmentId')}</p>
                              <p className="font-medium font-mono text-xs">
                                {change.equipmentId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.versionChange')}</p>
                              <p className="font-medium">
                                {change.previousVersion || t('fields.newVersion')} -&gt;{' '}
                                {change.newVersion}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t('fields.changeDate')}</p>
                              <p className="font-medium">
                                {format(new Date(change.changedAt), 'yyyy-MM-dd HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{t('fields.verificationRecord')}</p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{change.verificationRecord}</p>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {t('fields.requestDate')}:{' '}
                          {format(new Date(change.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
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
              <div className="p-4 bg-muted rounded-lg space-y-2">
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
          <div className="p-4 bg-muted rounded-lg space-y-2">
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
