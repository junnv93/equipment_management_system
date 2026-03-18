'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import calibrationPlansApi, {
  CalibrationPlan,
  CALIBRATION_PLAN_STATUS_LABELS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, Building2, User, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CALIBRATION_PLAN_STATUS_BADGE_COLORS,
  getPageContainerClasses,
  APPROVAL_CARD_BORDER_TOKENS,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

export default function CalibrationPlanApprovalsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('calibration');
  const [selectedPlan, setSelectedPlan] = useState<CalibrationPlan | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 계획서 목록 조회
  const { data: pendingData, isLoading } = useQuery({
    queryKey: queryKeys.calibrationPlans.pending(),
    queryFn: () => calibrationPlansApi.getPendingApprovalPlans(),
  });

  // 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async (planUuid: string) => {
      // ✅ Prefetched detail cache에서 fresh casVersion 사용
      const cachedPlan = queryClient.getQueryData<CalibrationPlan>(
        queryKeys.calibrationPlans.detail(planUuid)
      );
      const casVersion = cachedPlan?.casVersion ?? 0;

      return calibrationPlansApi.approveCalibrationPlan(planUuid, { casVersion });
    },
    onSuccess: () => {
      toast({
        title: t('planApprovals.toasts.approveSuccess'),
        description: t('planApprovals.toasts.approveSuccessDesc'),
      });
      setIsApproveDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('planApprovals.toasts.approveError'),
        description: getErrorMessage(error, t('planApprovals.toasts.approveErrorDesc')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationPlans.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationPlans.all });
    },
  });

  // 반려 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason: string }) => {
      // ✅ Prefetched detail cache에서 fresh casVersion 사용
      const cachedPlan = queryClient.getQueryData<CalibrationPlan>(
        queryKeys.calibrationPlans.detail(uuid)
      );
      const casVersion = cachedPlan?.casVersion ?? 0;

      return calibrationPlansApi.rejectCalibrationPlan(uuid, {
        casVersion,
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: t('planApprovals.toasts.rejectSuccess'),
        description: t('planApprovals.toasts.rejectSuccessDesc'),
      });
      setIsRejectDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('planApprovals.toasts.rejectError'),
        description: getErrorMessage(error, t('planApprovals.toasts.rejectErrorDesc')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationPlans.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrationPlans.all });
    },
  });

  // ✅ Prefetch plan detail before opening modal (fresh casVersion)
  const handleApprove = async (plan: CalibrationPlan) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.calibrationPlans.detail(plan.id),
      queryFn: () => calibrationPlansApi.getCalibrationPlan(plan.id),
    });
    setSelectedPlan(plan);
    setIsApproveDialogOpen(true);
  };

  const handleReject = async (plan: CalibrationPlan) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.calibrationPlans.detail(plan.id),
      queryFn: () => calibrationPlansApi.getCalibrationPlan(plan.id),
    });
    setSelectedPlan(plan);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedPlan) return;
    approveMutation.mutate(selectedPlan.id);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedPlan) return;
    rejectMutation.mutate({
      uuid: selectedPlan.id,
      reason,
    });
  };

  const pendingPlans = pendingData?.data || [];

  if (isLoading) {
    return <ApprovalLoadingSkeleton cardHeight="h-24" />;
  }

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader title={t('planApprovals.title')} subtitle={t('planApprovals.description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('planApprovals.listTitle')}</CardTitle>
          <CardDescription>
            {t('planApprovals.listDescription', { count: pendingPlans.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPlans.length === 0 ? (
            <ApprovalEmptyState message={t('planApprovals.empty')} />
          ) : (
            <div className="space-y-4">
              {pendingPlans.map((plan: CalibrationPlan) => (
                <Card key={plan.id} className={APPROVAL_CARD_BORDER_TOKENS.pending}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={CALIBRATION_PLAN_STATUS_BADGE_COLORS[plan.status]}>
                            {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
                          </Badge>
                          <span className="text-lg font-semibold">
                            {t('planApprovals.planTitle', {
                              year: plan.year,
                              site: SITE_LABELS[plan.siteId],
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                {t('planApprovals.fields.year')}
                              </p>
                              <p className="font-medium">
                                {t('planApprovals.yearUnit', { year: plan.year })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                {t('planApprovals.fields.site')}
                              </p>
                              <p className="font-medium">{SITE_LABELS[plan.siteId]}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                {t('planApprovals.fields.author')}
                              </p>
                              <p className="font-medium">{plan.createdBy}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                {t('planApprovals.fields.createdAt')}
                              </p>
                              <p className="font-medium">
                                {format(new Date(plan.createdAt), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/calibration-plans/${plan.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('planApprovals.actions.viewDetail')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(plan)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t('planApprovals.actions.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(plan)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('planApprovals.actions.reject')}
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
            <DialogTitle>{t('planApprovals.approveDialog.title')}</DialogTitle>
            <DialogDescription>{t('planApprovals.approveDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPlan && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>{t('planApprovals.dialogLabels.year')}</strong>{' '}
                  {t('planApprovals.yearUnit', { year: selectedPlan.year })}
                </p>
                <p>
                  <strong>{t('planApprovals.dialogLabels.site')}</strong>{' '}
                  {SITE_LABELS[selectedPlan.siteId]}
                </p>
                <p>
                  <strong>{t('planApprovals.dialogLabels.author')}</strong> {selectedPlan.createdBy}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              {t('planApprovals.actions.cancel')}
            </Button>
            <Button onClick={handleApproveConfirm} disabled={approveMutation.isPending}>
              {t('planApprovals.actions.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isPending={rejectMutation.isPending}
        title={t('planApprovals.rejectDialogTitle')}
      >
        {selectedPlan && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p>
              <strong>{t('planApprovals.dialogLabels.year')}</strong>{' '}
              {t('planApprovals.yearUnit', { year: selectedPlan.year })}
            </p>
            <p>
              <strong>{t('planApprovals.dialogLabels.site')}</strong>{' '}
              {SITE_LABELS[selectedPlan.siteId]}
            </p>
            <p>
              <strong>{t('planApprovals.dialogLabels.author')}</strong> {selectedPlan.createdBy}
            </p>
          </div>
        )}
      </RejectReasonDialog>
    </div>
  );
}
