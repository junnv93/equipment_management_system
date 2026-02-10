'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, User, Building2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { CALIBRATION_RESULT_LABELS, type CalibrationResult } from '@equipment-management/schemas';

// Calibration 타입을 직접 사용 (CalibrationRequest는 Calibration의 별칭)
type CalibrationRequest = Calibration;

// 레거시 대문자 값 호환을 위한 매핑
const LEGACY_RESULT_MAP: Record<string, CalibrationResult> = {
  PASS: 'pass',
  FAIL: 'fail',
  CONDITIONAL: 'conditional',
};

const getResultLabel = (result: string): string => {
  const normalizedResult = LEGACY_RESULT_MAP[result] || result;
  return CALIBRATION_RESULT_LABELS[normalizedResult as CalibrationResult] || result;
};

// 결과 색상 (소문자 + 대문자 모두 지원)
const RESULT_COLORS: Record<string, string> = {
  pass: 'bg-green-100 text-green-800',
  PASS: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  FAIL: 'bg-red-100 text-red-800',
  conditional: 'bg-yellow-100 text-yellow-800',
  CONDITIONAL: 'bg-yellow-100 text-yellow-800',
};

import {
  APPROVAL_STATUS_LABELS as STATUS_LABELS,
  APPROVAL_STATUS_COLORS as STATUS_COLORS,
} from '@/components/admin/approval-constants';

export default function CalibrationApprovalsContent() {
  const _router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [selectedRequest, setSelectedRequest] = useState<CalibrationRequest | null>(null);
  const [comment, setComment] = useState('');
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
    onError: (error: unknown) => {
      toast({
        title: '승인 실패',
        description: getErrorMessage(error, '교정 승인 중 오류가 발생했습니다.'),
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
      setSelectedRequest(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '반려 실패',
        description: getErrorMessage(error, '교정 반려 중 오류가 발생했습니다.'),
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

  const handleRejectConfirm = (reason: string) => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      id: selectedRequest.id,
      approverId: session?.user?.id as string,
      rejectionReason: reason,
    });
  };

  const pendingRequests = requests?.items || [];

  if (isLoading) {
    return <ApprovalLoadingSkeleton />;
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
            <ApprovalEmptyState message="승인 대기 중인 교정 요청이 없습니다" />
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
                          <Badge
                            className={
                              RESULT_COLORS[request.calibrationResult] ||
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {getResultLabel(request.calibrationResult)}
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
                                {request.registeredByRole === 'test_engineer'
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

      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isPending={rejectMutation.isPending}
        title="교정 반려"
      />
    </div>
  );
}
