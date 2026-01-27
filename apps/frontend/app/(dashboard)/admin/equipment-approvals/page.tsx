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
import { apiClient } from '@/lib/api/api-client';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, FileText, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EquipmentRequest {
  uuid: string;
  requestType: 'create' | 'update' | 'delete';
  equipmentId?: number;
  requestedBy: string;
  requestedAt: string;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requestData?: string;
  requester?: {
    name: string;
    email: string;
  };
  equipment?: {
    name: string;
    managementNumber: string;
  };
  attachments?: Array<{
    uuid: string;
    fileName: string;
    originalFileName: string;
    attachmentType: string;
  }>;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  create: '등록',
  update: '수정',
  delete: '삭제',
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

export default function EquipmentApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 요청 목록 조회
  const { data: requests, isLoading } = useQuery<EquipmentRequest[]>({
    queryKey: ['equipment-requests', 'pending'],
    queryFn: async () => {
      const response = await apiClient.get('/api/equipment/requests/pending');
      return response.data || [];
    },
  });

  // 요청 상세 조회
  const { data: requestDetail } = useQuery<EquipmentRequest>({
    queryKey: ['equipment-request', selectedRequest?.uuid],
    queryFn: async () => {
      if (!selectedRequest) return null;
      const response = await apiClient.get(`/api/equipment/requests/${selectedRequest.uuid}`);
      return response.data;
    },
    enabled: !!selectedRequest,
  });

  // 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async (requestUuid: string) => {
      return apiClient.post(`/api/equipment/requests/${requestUuid}/approve`);
    },
    onSuccess: () => {
      toast({
        title: '승인 완료',
        description: '요청이 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setSelectedRequest(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '승인 실패',
        description: getErrorMessage(error, '요청 승인 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  // 반려 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({ requestUuid, reason }: { requestUuid: string; reason: string }) => {
      return apiClient.post(`/api/equipment/requests/${requestUuid}/reject`, {
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: '반려 완료',
        description: '요청이 반려되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
    },
    onError: (error: unknown) => {
      toast({
        title: '반려 실패',
        description: getErrorMessage(error, '요청 반려 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (request: EquipmentRequest) => {
    if (confirm('이 요청을 승인하시겠습니까?')) {
      approveMutation.mutate(request.uuid);
    }
  };

  const handleReject = (request: EquipmentRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
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
      requestUuid: selectedRequest.uuid,
      reason: rejectionReason,
    });
  };

  const requestData = requestDetail?.requestData ? JSON.parse(requestDetail.requestData) : null;

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
        <h1 className="text-3xl font-bold tracking-tight">장비 승인 관리</h1>
        <p className="text-muted-foreground">
          승인 대기 중인 장비 등록/수정/삭제 요청을 관리합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 요청</CardTitle>
          <CardDescription>
            총 {requests?.length || 0}개의 승인 대기 요청이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>승인 대기 중인 요청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.uuid} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={STATUS_COLORS[request.approvalStatus]}>
                            {STATUS_LABELS[request.approvalStatus]}
                          </Badge>
                          <Badge variant="outline">
                            {REQUEST_TYPE_LABELS[request.requestType]}
                          </Badge>
                          {request.equipment && (
                            <span className="text-sm font-medium">
                              {request.equipment.name} ({request.equipment.managementNumber})
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">요청자</p>
                            <p className="font-medium">
                              {request.requester?.name || request.requestedBy}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">요청일시</p>
                            <p className="font-medium">
                              {format(new Date(request.requestedAt), 'yyyy-MM-dd HH:mm')}
                            </p>
                          </div>
                          {request.attachments && request.attachments.length > 0 && (
                            <div>
                              <p className="text-muted-foreground">첨부 파일</p>
                              <p className="font-medium">{request.attachments.length}개</p>
                            </div>
                          )}
                        </div>

                        {requestData && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">요청 내용:</p>
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(requestData, null, 2)}
                            </pre>
                          </div>
                        )}
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

      {/* 반려 사유 입력 다이얼로그 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>요청 반려</DialogTitle>
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
