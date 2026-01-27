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
import { Skeleton } from '@/components/ui/skeleton';
import calibrationPlansApi, {
  CalibrationPlan,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Calendar, Building2, User, Eye } from 'lucide-react';

export default function CalibrationPlanApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [selectedPlan, setSelectedPlan] = useState<CalibrationPlan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 계획서 목록 조회
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['calibration-plans-pending'],
    queryFn: () => calibrationPlansApi.getPendingApprovalPlans(),
  });

  // 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async (planUuid: string) => {
      return calibrationPlansApi.approveCalibrationPlan(planUuid, {
        approvedBy: session?.user?.id as string,
      });
    },
    onSuccess: () => {
      toast({
        title: '승인 완료',
        description: '교정계획서가 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-plans-pending'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-plans'] });
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
  });

  // 반려 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason: string }) => {
      return calibrationPlansApi.rejectCalibrationPlan(uuid, {
        rejectedBy: session?.user?.id as string,
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: '반려 완료',
        description: '교정계획서가 반려되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-plans-pending'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-plans'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedPlan(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '반려 실패',
        description: getErrorMessage(error, '계획서 반려 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (plan: CalibrationPlan) => {
    setSelectedPlan(plan);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (plan: CalibrationPlan) => {
    setSelectedPlan(plan);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedPlan) return;
    approveMutation.mutate(selectedPlan.uuid);
  };

  const handleRejectConfirm = () => {
    if (!selectedPlan) return;
    if (!rejectionReason.trim()) {
      toast({
        title: '반려 사유 필요',
        description: '반려 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    rejectMutation.mutate({
      uuid: selectedPlan.uuid,
      reason: rejectionReason,
    });
  };

  const pendingPlans = pendingData?.data || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>승인 대기 중인 교정계획서가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPlans.map((plan: CalibrationPlan) => (
                <Card key={plan.uuid} className="border-l-4 border-l-yellow-500">
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
                          onClick={() => router.push(`/calibration-plans/${plan.uuid}`)}
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

      {/* 반려 다이얼로그 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교정계획서 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요. 반려 사유는 필수입니다.</DialogDescription>
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
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">반려 사유 *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="반려 사유를 입력하세요"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
