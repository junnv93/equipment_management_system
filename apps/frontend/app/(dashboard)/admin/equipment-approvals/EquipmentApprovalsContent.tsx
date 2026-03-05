'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RejectReasonDialog } from '@/components/admin/RejectReasonDialog';
import { ApprovalLoadingSkeleton } from '@/components/admin/ApprovalLoadingSkeleton';
import { ApprovalEmptyState } from '@/components/admin/ApprovalEmptyState';
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';

interface EquipmentRequest {
  id: string;
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
    id: string;
    fileName: string;
    originalFileName: string;
    attachmentType: string;
  }>;
}

import {
  APPROVAL_STATUS_LABELS as STATUS_LABELS,
  APPROVAL_STATUS_COLORS as STATUS_COLORS,
} from '@/components/admin/approval-constants';

export default function EquipmentApprovalsContent() {
  const t = useTranslations('approvals');
  const _router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 승인 대기 요청 목록 조회
  const { data: requests, isLoading } = useQuery<EquipmentRequest[]>({
    queryKey: queryKeys.equipmentRequests.pending(),
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.PENDING);
      return response.data || [];
    },
  });

  // 요청 상세 조회
  const { data: requestDetail } = useQuery<EquipmentRequest>({
    queryKey: queryKeys.equipmentRequests.detail(selectedRequest?.id ?? ''),
    queryFn: async () => {
      if (!selectedRequest) return null;
      const response = await apiClient.get(
        API_ENDPOINTS.EQUIPMENT.REQUESTS.GET(selectedRequest.id)
      );
      return response.data;
    },
    enabled: !!selectedRequest,
  });

  // 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.APPROVE(requestId));
    },
    onSuccess: () => {
      toast({
        title: t('equipmentApprovals.toasts.approveSuccess'),
        description: t('equipmentApprovals.toasts.approveSuccessDesc'),
      });
      setSelectedRequest(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('equipmentApprovals.toasts.approveError'),
        description: getErrorMessage(error, t('equipmentApprovals.toasts.approveErrorFallback')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });

  // 반려 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      return apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.REJECT(requestId), {
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: t('equipmentApprovals.toasts.rejectSuccess'),
        description: t('equipmentApprovals.toasts.rejectSuccessDesc'),
      });
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('equipmentApprovals.toasts.rejectError'),
        description: getErrorMessage(error, t('equipmentApprovals.toasts.rejectErrorFallback')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentRequests.all });
    },
  });

  const handleApprove = (request: EquipmentRequest) => {
    if (confirm(t('confirm.approveDescription'))) {
      approveMutation.mutate(request.id);
    }
  };

  const handleReject = (request: EquipmentRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      requestId: selectedRequest.id,
      reason,
    });
  };

  const requestData = requestDetail?.requestData ? JSON.parse(requestDetail.requestData) : null;

  if (isLoading) {
    return <ApprovalLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('equipmentApprovals.title')}</h1>
        <p className="text-muted-foreground">{t('equipmentApprovals.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('equipmentApprovals.listTitle')}</CardTitle>
          <CardDescription>
            {t('list.countDescription', { count: requests?.length || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <ApprovalEmptyState />
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={STATUS_COLORS[request.approvalStatus]}>
                            {STATUS_LABELS[request.approvalStatus]}
                          </Badge>
                          <Badge variant="outline">
                            {t(`requestTypes.${request.requestType}` as Parameters<typeof t>[0])}
                          </Badge>
                          {request.equipment && (
                            <span className="text-sm font-medium">
                              {request.equipment.name} ({request.equipment.managementNumber})
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('item.requester')}</p>
                            <p className="font-medium">
                              {request.requester?.name || request.requestedBy}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('item.requestDate')}</p>
                            <p className="font-medium">
                              {format(new Date(request.requestedAt), 'yyyy-MM-dd HH:mm')}
                            </p>
                          </div>
                          {request.attachments && request.attachments.length > 0 && (
                            <div>
                              <p className="text-muted-foreground">{t('detail.attachments')}</p>
                              <p className="font-medium">{request.attachments.length}개</p>
                            </div>
                          )}
                        </div>

                        {requestData && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">
                              {t('equipmentApprovals.requestContent')}
                            </p>
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
                          {t('actions.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('actions.reject')}
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

      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isPending={rejectMutation.isPending}
      />
    </div>
  );
}
