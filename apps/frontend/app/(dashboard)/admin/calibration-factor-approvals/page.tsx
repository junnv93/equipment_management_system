'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import calibrationFactorsApi, {
  CalibrationFactor,
  FACTOR_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/lib/api/calibration-factors-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Calculator, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

export default function CalibrationFactorApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [selectedFactor, setSelectedFactor] = useState<CalibrationFactor | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 보정계수 목록 조회
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['calibration-factors-pending'],
    queryFn: () => calibrationFactorsApi.getPendingCalibrationFactors(),
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
      return calibrationFactorsApi.approveCalibrationFactor(id, { approverId, approverComment });
    },
    onSuccess: () => {
      toast({
        title: '승인 완료',
        description: '보정계수가 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-factors-pending'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-factors'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-factors'] });
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedFactor(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '승인 실패',
        description: getErrorMessage(error, '보정계수 승인 중 오류가 발생했습니다.'),
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
      return calibrationFactorsApi.rejectCalibrationFactor(id, { approverId, rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: '반려 완료',
        description: '보정계수가 반려되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-factors-pending'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedFactor(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '반려 실패',
        description: getErrorMessage(error, '보정계수 반려 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
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
        title: '코멘트 필요',
        description: '승인 시 검토 코멘트를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({
      id: selectedFactor.id,
      approverId: session?.user?.id as string,
      approverComment: comment,
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedFactor) return;
    if (!rejectionReason.trim()) {
      toast({
        title: '반려 사유 필요',
        description: '반려 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    rejectMutation.mutate({
      id: selectedFactor.id,
      approverId: session?.user?.id as string,
      rejectionReason,
    });
  };

  const pendingFactors = pendingData?.data || [];

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
        <h1 className="text-3xl font-bold tracking-tight">보정계수 승인 관리</h1>
        <p className="text-muted-foreground">
          시험실무자가 요청한 보정계수 변경을 검토하고 승인합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 목록</CardTitle>
          <CardDescription>
            총 {pendingFactors.length}개의 승인 대기 요청이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingFactors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>승인 대기 중인 보정계수 변경 요청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingFactors.map((factor) => (
                <Card key={factor.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={APPROVAL_STATUS_COLORS[factor.approvalStatus]}>
                            {APPROVAL_STATUS_LABELS[factor.approvalStatus]}
                          </Badge>
                          <Badge variant="outline">{FACTOR_TYPE_LABELS[factor.factorType]}</Badge>
                          <span className="text-sm font-medium">장비 ID: {factor.equipmentId}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">보정계수 이름</p>
                              <p className="font-medium">{factor.factorName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">값</p>
                              <p className="font-medium font-mono">
                                {factor.factorValue} {factor.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">적용 시작일</p>
                              <p className="font-medium">
                                {format(new Date(factor.effectiveDate), 'yyyy-MM-dd')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">만료일</p>
                              <p className="font-medium">
                                {factor.expiryDate
                                  ? format(new Date(factor.expiryDate), 'yyyy-MM-dd')
                                  : '없음'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {factor.parameters && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">추가 파라미터:</p>
                            <code className="text-sm">{JSON.stringify(factor.parameters)}</code>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          요청일: {format(new Date(factor.requestedAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(factor)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(factor)}
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
            <DialogTitle>보정계수 승인</DialogTitle>
            <DialogDescription>
              보정계수 변경 요청을 검토한 후 승인 코멘트를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedFactor && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>이름:</strong> {selectedFactor.factorName}
                </p>
                <p>
                  <strong>값:</strong> {selectedFactor.factorValue} {selectedFactor.unit}
                </p>
                <p>
                  <strong>타입:</strong> {FACTOR_TYPE_LABELS[selectedFactor.factorType]}
                </p>
              </div>
            )}
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
            <DialogTitle>보정계수 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요. 반려 사유는 필수입니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedFactor && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>이름:</strong> {selectedFactor.factorName}
                </p>
                <p>
                  <strong>값:</strong> {selectedFactor.factorValue} {selectedFactor.unit}
                </p>
                <p>
                  <strong>타입:</strong> {FACTOR_TYPE_LABELS[selectedFactor.factorType]}
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
