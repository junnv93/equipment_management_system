'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
import calibrationApi from '@/lib/api/calibration-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Calendar, User, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

interface CalibrationRequest {
  id: string;
  equipmentId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  calibrationResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  registeredBy?: string;
  approvedBy?: string;
  registeredByRole?: string;
  registrarComment?: string;
  approverComment?: string;
  rejectionReason?: string;
  intermediateCheckDate?: string;
  createdAt: string;
}

const RESULT_LABELS: Record<string, string> = {
  PASS: '적합',
  FAIL: '부적합',
  CONDITIONAL: '조건부 적합',
};

const RESULT_COLORS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  CONDITIONAL: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function CalibrationApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [selectedRequest, setSelectedRequest] = useState<CalibrationRequest | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 교정 목록 조회
  const { data: requests, isLoading } = useQuery({
    queryKey: ['calibration-pending'],
    queryFn: async () => {
      return calibrationApi.getPendingCalibrations();
    },
  });

  // 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      approverId,
      approverComment,
    }: {
      id: string;
      approverId: string;
      approverComment: string;
    }) => {
      return calibrationApi.approveCalibration(id, { approverId, approverComment });
    },
    onSuccess: () => {
      toast({
        title: '승인 완료',
        description: '교정 기록이 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-pending'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-history'] });
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: '승인 실패',
        description: error.message || '교정 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 반려 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      approverId,
      rejectionReason,
    }: {
      id: string;
      approverId: string;
      rejectionReason: string;
    }) => {
      return calibrationApi.rejectCalibration(id, { approverId, rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: '반려 완료',
        description: '교정 기록이 반려되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-pending'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: '반려 실패',
        description: error.message || '교정 반려 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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
    if (!comment.trim()) {
      toast({
        title: '코멘트 필요',
        description: '승인 시 검토 코멘트를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({
      id: selectedRequest.id,
      approverId: session?.user?.id as string,
      approverComment: comment,
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast({
        title: '반려 사유 필요',
        description: '반려 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    rejectMutation.mutate({
      id: selectedRequest.id,
      approverId: session?.user?.id as string,
      rejectionReason,
    });
  };

  const pendingRequests = requests?.items || [];

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
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">교정 승인 관리</h1>
        <p className="text-muted-foreground">시험실무자가 등록한 교정 기록을 검토하고 승인합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 목록</CardTitle>
          <CardDescription>
            총 {pendingRequests.length}개의 승인 대기 요청이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>승인 대기 중인 교정 요청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
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
                              : '상태 없음'}
                          </Badge>
                          <Badge className={RESULT_COLORS[request.calibrationResult]}>
                            {RESULT_LABELS[request.calibrationResult]}
                          </Badge>
                          <span className="text-sm font-medium">
                            장비 ID: {request.equipmentId}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">교정일</p>
                              <p className="font-medium">
                                {format(new Date(request.calibrationDate), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">다음 교정일</p>
                              <p className="font-medium">
                                {format(new Date(request.nextCalibrationDate), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">교정 기관</p>
                              <p className="font-medium">{request.calibrationAgency}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">등록자</p>
                              <p className="font-medium">
                                {request.registeredByRole === 'test_operator'
                                  ? '시험실무자'
                                  : '기술책임자'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.intermediateCheckDate && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">중간점검일: </span>
                            <span className="font-medium">
                              {format(new Date(request.intermediateCheckDate), 'yyyy-MM-dd')}
                            </span>
                          </div>
                        )}

                        {request.notes && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">비고:</p>
                            <p className="text-sm">{request.notes}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          등록일: {format(new Date(request.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
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
            <DialogTitle>교정 승인</DialogTitle>
            <DialogDescription>교정 기록을 검토한 후 승인 코멘트를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">검토 코멘트 *</Label>
              <Textarea
                id="comment"
                placeholder="검토 완료 내용을 입력하세요"
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
              취소
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={!comment.trim() || approveMutation.isPending}
            >
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교정 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요. 반려 사유는 필수입니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
