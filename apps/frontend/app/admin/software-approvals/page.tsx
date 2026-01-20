'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import softwareApi, {
  SoftwareHistory,
  SOFTWARE_APPROVAL_STATUS_LABELS,
  SOFTWARE_APPROVAL_STATUS_COLORS,
} from '@/lib/api/software-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Monitor, ArrowRight, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SoftwareApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [selectedChange, setSelectedChange] = useState<SoftwareHistory | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 소프트웨어 변경 목록 조회
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['software-pending'],
    queryFn: () => softwareApi.getPendingSoftwareChanges(),
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
      return softwareApi.approveSoftwareChange(id, { approverId, approverComment });
    },
    onSuccess: () => {
      toast({
        title: '승인 완료',
        description: '소프트웨어 변경이 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['software-pending'] });
      queryClient.invalidateQueries({ queryKey: ['software-history'] });
      queryClient.invalidateQueries({ queryKey: ['software-registry'] });
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedChange(null);
    },
    onError: (error: Error) => {
      toast({
        title: '승인 실패',
        description: error.message || '소프트웨어 변경 승인 중 오류가 발생했습니다.',
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
      return softwareApi.rejectSoftwareChange(id, { approverId, rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: '반려 완료',
        description: '소프트웨어 변경이 반려되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['software-pending'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedChange(null);
    },
    onError: (error: Error) => {
      toast({
        title: '반려 실패',
        description: error.message || '소프트웨어 변경 반려 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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
        title: '코멘트 필요',
        description: '승인 시 검토 코멘트를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({
      id: selectedChange.id,
      approverId: session?.user?.id as string,
      approverComment: comment,
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedChange) return;
    if (!rejectionReason.trim()) {
      toast({
        title: '반려 사유 필요',
        description: '반려 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    rejectMutation.mutate({
      id: selectedChange.id,
      approverId: session?.user?.id as string,
      rejectionReason,
    });
  };

  const pendingChanges = pendingData?.data || [];

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
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">소프트웨어 변경 승인 관리</h1>
        <p className="text-muted-foreground">
          시험실무자가 요청한 소프트웨어 변경을 검토하고 승인합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 목록</CardTitle>
          <CardDescription>
            총 {pendingChanges.length}개의 승인 대기 요청이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingChanges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>승인 대기 중인 소프트웨어 변경 요청이 없습니다</p>
            </div>
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
                            장비 상세 보기
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">장비 ID</p>
                              <p className="font-medium font-mono text-xs">
                                {change.equipmentId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">버전 변경</p>
                              <p className="font-medium">
                                {change.previousVersion || '(신규)'} -&gt; {change.newVersion}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">변경일</p>
                              <p className="font-medium">
                                {format(new Date(change.changedAt), 'yyyy-MM-dd HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 검증 기록 */}
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">검증 기록</p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{change.verificationRecord}</p>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          요청일: {format(new Date(change.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(change)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(change)}
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
            <DialogTitle>소프트웨어 변경 승인</DialogTitle>
            <DialogDescription>
              소프트웨어 변경 요청을 검토한 후 승인 코멘트를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedChange && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>소프트웨어:</strong> {selectedChange.softwareName}
                </p>
                <p>
                  <strong>버전 변경:</strong> {selectedChange.previousVersion || '(신규)'} -&gt;{' '}
                  {selectedChange.newVersion}
                </p>
                <p>
                  <strong>검증 기록:</strong> {selectedChange.verificationRecord}
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
            <DialogTitle>소프트웨어 변경 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요. 반려 사유는 필수입니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedChange && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>소프트웨어:</strong> {selectedChange.softwareName}
                </p>
                <p>
                  <strong>버전 변경:</strong> {selectedChange.previousVersion || '(신규)'} -&gt;{' '}
                  {selectedChange.newVersion}
                </p>
                <p>
                  <strong>검증 기록:</strong> {selectedChange.verificationRecord}
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
