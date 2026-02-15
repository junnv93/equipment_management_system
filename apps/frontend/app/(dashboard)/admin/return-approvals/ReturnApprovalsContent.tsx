'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { RETURN_APPROVAL_INVALIDATE_KEYS } from '@/lib/query-keys/checkout-keys';
import type { PaginatedResponse } from '@/lib/api/types';
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
import checkoutApi, { Checkout } from '@/lib/api/checkout-api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar, User, Building2, Package } from 'lucide-react';
import { ApprovalLoadingSkeleton } from '@/components/admin/ApprovalLoadingSkeleton';
import { ApprovalEmptyState } from '@/components/admin/ApprovalEmptyState';
import { useSession } from 'next-auth/react';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';

const PURPOSE_LABELS: Record<string, string> = {
  calibration: '교정',
  repair: '수리',
  rental: '외부 대여',
};

const PURPOSE_COLORS: Record<string, string> = {
  calibration: 'bg-blue-100 text-blue-800',
  repair: 'bg-orange-100 text-orange-800',
  rental: 'bg-purple-100 text-purple-800',
};

export default function ReturnApprovalsContent() {
  const { data: _session } = useSession();
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 검사 완료된 반입 목록 조회 (returned 상태)
  const { data: checkouts, isLoading } = useQuery({
    queryKey: queryKeys.checkouts.returnPending(),
    queryFn: async () => {
      return checkoutApi.getPendingReturnApprovals();
    },
    staleTime: CACHE_TIMES.SHORT,
  });

  // ✅ 반입 승인 뮤테이션 (Optimistic Update + Cross-page invalidation)
  const approveMutation = useOptimisticMutation<
    Checkout,
    { id: string; version: number; comment?: string },
    PaginatedResponse<Checkout>
  >({
    mutationFn: async ({ id, version, comment }) => {
      return checkoutApi.approveReturn(id, { version, comment });
    },
    queryKey: queryKeys.checkouts.returnPending(),
    optimisticUpdate: (old, { id }) => {
      if (!old)
        return {
          data: [],
          meta: { pagination: { total: 0, pageSize: 20, currentPage: 1, totalPages: 0 } },
        };
      return {
        ...old,
        data: old.data.filter((c) => c.id !== id),
        meta: {
          ...old.meta,
          pagination: {
            ...old.meta.pagination,
            total: Math.max(0, old.meta.pagination.total - 1),
          },
        },
      };
    },
    invalidateKeys: RETURN_APPROVAL_INVALIDATE_KEYS,
    successMessage: '반입이 최종 승인되었습니다. 장비 상태가 사용 가능으로 변경되었습니다.',
    errorMessage: '반입 승인 중 오류가 발생했습니다.',
    onSuccessCallback: () => {
      setIsApproveDialogOpen(false);
      setComment('');
      setSelectedCheckout(null);
    },
  });

  // ✅ 반입 반려 뮤테이션 (Optimistic Update + Cross-page invalidation)
  const rejectMutation = useOptimisticMutation<
    Checkout,
    { id: string; version: number; reason: string },
    PaginatedResponse<Checkout>
  >({
    mutationFn: async ({ id, version, reason }) => {
      return checkoutApi.rejectReturn(id, { version, reason });
    },
    queryKey: queryKeys.checkouts.returnPending(),
    optimisticUpdate: (old, { id }) => {
      if (!old)
        return {
          data: [],
          meta: { pagination: { total: 0, pageSize: 20, currentPage: 1, totalPages: 0 } },
        };
      return {
        ...old,
        data: old.data.filter((c) => c.id !== id),
        meta: {
          ...old.meta,
          pagination: {
            ...old.meta.pagination,
            total: Math.max(0, old.meta.pagination.total - 1),
          },
        },
      };
    },
    invalidateKeys: RETURN_APPROVAL_INVALIDATE_KEYS,
    successMessage: '반입이 반려되었습니다. 재검사 후 반입 처리가 필요합니다.',
    errorMessage: '반입 반려 중 오류가 발생했습니다.',
    onSuccessCallback: () => {
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setSelectedCheckout(null);
    },
  });

  const handleApprove = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedCheckout) return;
    approveMutation.mutate({
      id: selectedCheckout.id,
      version: selectedCheckout.version,
      comment: comment.trim() || undefined,
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedCheckout || !rejectReason.trim()) return;
    rejectMutation.mutate({
      id: selectedCheckout.id,
      version: selectedCheckout.version,
      reason: rejectReason.trim(),
    });
  };

  const pendingReturns = checkouts?.data || [];
  const isActionPending = approveMutation.isPending || rejectMutation.isPending;

  if (isLoading) {
    return <ApprovalLoadingSkeleton cardHeight="h-24" />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">반입 승인 관리</h1>
        <p className="text-muted-foreground">
          검사 완료된 반입 건을 검토하고 최종 승인하거나 반려합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>반입 승인 대기 목록</CardTitle>
          <CardDescription>
            총 {pendingReturns.length}개의 반입 승인 대기 건이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReturns.length === 0 ? (
            <ApprovalEmptyState message="승인 대기 중인 반입 건이 없습니다" />
          ) : (
            <div className="space-y-4">
              {pendingReturns.map((checkout) => (
                <Card key={checkout.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <CheckoutStatusBadge status={checkout.status} />
                          <Badge className={PURPOSE_COLORS[checkout.purpose] || 'bg-gray-100'}>
                            {PURPOSE_LABELS[checkout.purpose] || checkout.purpose}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">장비</p>
                              <p className="font-medium">
                                {checkout.equipment && checkout.equipment.length > 0
                                  ? `${checkout.equipment[0].name}${checkout.equipment.length > 1 ? ` 외 ${checkout.equipment.length - 1}건` : ''}`
                                  : '장비 정보 없음'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">반출지</p>
                              <p className="font-medium">{checkout.destination}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">반입일</p>
                              <p className="font-medium">
                                {checkout.actualReturnDate
                                  ? format(new Date(checkout.actualReturnDate), 'yyyy-MM-dd')
                                  : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">반입 처리자</p>
                              <p className="font-medium">{checkout.user?.name || '알 수 없음'}</p>
                            </div>
                          </div>
                        </div>

                        {/* 검사 결과 표시 */}
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">검사 결과</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`h-4 w-4 ${checkout.workingStatusChecked ? 'text-green-500' : 'text-gray-300'}`}
                              />
                              <span>
                                작동 확인: {checkout.workingStatusChecked ? '완료' : '미완료'}
                              </span>
                            </div>
                            {checkout.purpose === 'calibration' && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2
                                  className={`h-4 w-4 ${checkout.calibrationChecked ? 'text-green-500' : 'text-gray-300'}`}
                                />
                                <span>
                                  교정 확인: {checkout.calibrationChecked ? '완료' : '미완료'}
                                </span>
                              </div>
                            )}
                            {checkout.purpose === 'repair' && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2
                                  className={`h-4 w-4 ${checkout.repairChecked ? 'text-green-500' : 'text-gray-300'}`}
                                />
                                <span>수리 확인: {checkout.repairChecked ? '완료' : '미완료'}</span>
                              </div>
                            )}
                          </div>
                          {checkout.inspectionNotes && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">검사 비고: </span>
                              <span>{checkout.inspectionNotes}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          신청일: {format(new Date(checkout.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(checkout)}
                          disabled={isActionPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          반려
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(checkout)}
                          disabled={isActionPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          최종 승인
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
            <DialogTitle>반입 최종 승인</DialogTitle>
            <DialogDescription>
              검사 결과를 확인한 후 최종 승인합니다. 승인 시 장비 상태가 자동으로 사용 가능으로
              변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheckout && (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">반출 목적: </span>
                  <span className="font-medium">
                    {PURPOSE_LABELS[selectedCheckout.purpose] || selectedCheckout.purpose}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">반출지: </span>
                  <span className="font-medium">{selectedCheckout.destination}</span>
                </p>
                <div className="pt-2 border-t">
                  <p className="font-medium mb-1">검사 결과:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>작동 확인: {selectedCheckout.workingStatusChecked ? '완료' : '미완료'}</li>
                    {selectedCheckout.calibrationChecked && <li>교정 확인: 완료</li>}
                    {selectedCheckout.repairChecked && <li>수리 확인: 완료</li>}
                    {selectedCheckout.inspectionNotes && (
                      <li>비고: {selectedCheckout.inspectionNotes}</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="comment">승인 코멘트 (선택)</Label>
              <Textarea
                id="comment"
                placeholder="승인에 대한 코멘트를 입력하세요 (선택사항)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setComment('');
                setSelectedCheckout(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleApproveConfirm} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? '처리 중...' : '최종 승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반입 반려</DialogTitle>
            <DialogDescription>
              반입을 반려하면 반출 중 상태로 되돌아가며, 재검사 후 반입 처리가 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheckout && (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">반출 목적: </span>
                  <span className="font-medium">
                    {PURPOSE_LABELS[selectedCheckout.purpose] || selectedCheckout.purpose}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">장비: </span>
                  <span className="font-medium">
                    {selectedCheckout.equipment && selectedCheckout.equipment.length > 0
                      ? selectedCheckout.equipment[0].name
                      : '장비 정보 없음'}
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reject-reason">반려 사유 (필수)</Label>
              <Textarea
                id="reject-reason"
                placeholder="반려 사유를 입력하세요 (예: 검사 항목 미충족, 작동 확인 미완료 등)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason('');
                setSelectedCheckout(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
