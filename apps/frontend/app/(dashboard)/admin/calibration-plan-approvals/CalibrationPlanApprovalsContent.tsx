'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, Building2, User, Eye } from 'lucide-react';

export default function CalibrationPlanApprovalsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

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
        title: '승인 완료',
        description: '교정계획서가 승인되었습니다.',
      });
      setIsApproveDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '승인 실패',
        description: getErrorMessage(error, '계획서 승인 중 오류가 발생했습니다.'),
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
        title: '반려 완료',
        description: '교정계획서가 반려되었습니다.',
      });
      setIsRejectDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '반려 실패',
        description: getErrorMessage(error, '계획서 반려 중 오류가 발생했습니다.'),
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">교정계획서 승인 관리</h1>
        <p className="text-muted-foreground">
          기술책임자가 요청한 교정계획서를 검토하고 승인합니다 (시험소장 전용)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 목록</CardTitle>
          <CardDescription>총 {pendingPlans.length}개의 승인 대기 요청이 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPlans.length === 0 ? (
            <ApprovalEmptyState message="승인 대기 중인 교정계획서가 없습니다" />
          ) : (
            <div className="space-y-4">
              {pendingPlans.map((plan: CalibrationPlan) => (
                <Card key={plan.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={CALIBRATION_PLAN_STATUS_COLORS[plan.status]}>
                            {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
                          </Badge>
                          <span className="text-lg font-semibold">
                            {plan.year}년 {SITE_LABELS[plan.siteId]} 교정계획서
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">연도</p>
                              <p className="font-medium">{plan.year}년</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">시험소</p>
                              <p className="font-medium">{SITE_LABELS[plan.siteId]}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">작성자</p>
                              <p className="font-medium">{plan.createdBy}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">작성일</p>
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
                          상세보기
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(plan)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(plan)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          반려
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
            <DialogTitle>교정계획서 승인</DialogTitle>
            <DialogDescription>이 교정계획서를 승인하시겠습니까?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPlan && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>연도:</strong> {selectedPlan.year}년
                </p>
                <p>
                  <strong>시험소:</strong> {SITE_LABELS[selectedPlan.siteId]}
                </p>
                <p>
                  <strong>작성자:</strong> {selectedPlan.createdBy}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleApproveConfirm} disabled={approveMutation.isPending}>
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isPending={rejectMutation.isPending}
        title="교정계획서 반려"
      >
        {selectedPlan && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p>
              <strong>연도:</strong> {selectedPlan.year}년
            </p>
            <p>
              <strong>시험소:</strong> {SITE_LABELS[selectedPlan.siteId]}
            </p>
            <p>
              <strong>작성자:</strong> {selectedPlan.createdBy}
            </p>
          </div>
        )}
      </RejectReasonDialog>
    </div>
  );
}
