'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, X, Package, Undo2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import equipmentImportApi, { type EquipmentImport } from '@/lib/api/equipment-import-api';
import { EquipmentImportStatusBadge } from './EquipmentImportStatusBadge';
import {
  CLASSIFICATION_LABELS,
  EQUIPMENT_IMPORT_SOURCE_LABELS,
  type EquipmentImportStatus,
  type Classification,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  id: string;
}

/**
 * Equipment Import Detail Component - Unified for rental and internal shared
 *
 * Displays import details with conditional sections based on sourceType:
 * - Rental: Shows vendor information (vendorName, vendorContact, externalIdentifier)
 * - Internal Shared: Shows department information (ownerDepartment, internalContact, borrowingJustification)
 *
 * Action buttons adapt to status and user permissions.
 */
export default function EquipmentImportDetail({ id }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: equipmentImport, isLoading } = useQuery({
    queryKey: queryKeys.equipmentImports.detail(id),
    queryFn: () => equipmentImportApi.getOne(id),
  });

  // Breadcrumb dynamic label
  useEffect(() => {
    if (equipmentImport) {
      const sourceLabel = EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType];
      const classificationLabel =
        CLASSIFICATION_LABELS[equipmentImport.classification as Classification];
      const label = `${sourceLabel} ${classificationLabel} - ${equipmentImport.equipmentName}`;
      setDynamicLabel(id, label);
    }

    return () => {
      clearDynamicLabel(id);
    };
  }, [equipmentImport, id, setDynamicLabel, clearDynamicLabel]);

  const approveMutation = useMutation({
    mutationFn: () => equipmentImportApi.approve(id, equipmentImport?.version || 1), // ✅ Include version
    onSuccess: () => {
      toast({ title: '반입 신청이 승인되었습니다.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast({
        title: '승인 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      // ✅ 409 Conflict 시 자동 새로고침
      if (errorMessage.includes('다른 사용자가') || errorMessage.includes('VERSION_CONFLICT')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => equipmentImportApi.reject(id, equipmentImport?.version || 1, rejectionReason), // ✅ Include version
    onSuccess: () => {
      toast({ title: '반입 신청이 거절되었습니다.' });
      setShowRejectDialog(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast({
        title: '거절 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      // ✅ 409 Conflict 시 자동 새로고침
      if (errorMessage.includes('다른 사용자가') || errorMessage.includes('VERSION_CONFLICT')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
      }
    },
  });

  const initiateReturnMutation = useMutation({
    mutationFn: () => equipmentImportApi.initiateReturn(id),
    onSuccess: () => {
      toast({ title: '반납 프로세스가 시작되었습니다.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      toast({
        title: '반납 시작 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => equipmentImportApi.cancel(id, cancelReason),
    onSuccess: () => {
      toast({ title: '반입 신청이 취소되었습니다.' });
      setShowCancelDialog(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      toast({
        title: '취소 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">로딩 중...</div>
    );
  }

  if (!equipmentImport) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        반입 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const status = equipmentImport.status as EquipmentImportStatus;
  const isRequester = user?.id === equipmentImport.requesterId;
  const userRole = user?.roles?.[0];
  const canApprove = userRole === 'technical_manager' || userRole === 'lab_manager';

  const isRental = equipmentImport.sourceType === 'rental';
  const isInternalShared = equipmentImport.sourceType === 'internal_shared';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/checkouts?view=inbound')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{equipmentImport.equipmentName}</h1>
          <p className="text-muted-foreground">
            {EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType]} 반입 신청 상세
          </p>
        </div>
        <EquipmentImportStatusBadge status={status} />
      </div>

      {/* Equipment Information */}
      <Card>
        <CardHeader>
          <CardTitle>장비 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">장비명</dt>
              <dd className="font-medium">{equipmentImport.equipmentName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">분류</dt>
              <dd>
                {CLASSIFICATION_LABELS[equipmentImport.classification as Classification] ||
                  equipmentImport.classification}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">출처</dt>
              <dd>{EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType]}</dd>
            </div>
            {equipmentImport.modelName && (
              <div>
                <dt className="text-sm text-muted-foreground">모델명</dt>
                <dd>{equipmentImport.modelName}</dd>
              </div>
            )}
            {equipmentImport.manufacturer && (
              <div>
                <dt className="text-sm text-muted-foreground">제조사</dt>
                <dd>{equipmentImport.manufacturer}</dd>
              </div>
            )}
            {equipmentImport.serialNumber && (
              <div>
                <dt className="text-sm text-muted-foreground">일련번호</dt>
                <dd>{equipmentImport.serialNumber}</dd>
              </div>
            )}
            {equipmentImport.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">설명</dt>
                <dd>{equipmentImport.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Conditional Source Information Card */}
      {isRental && (
        <Card>
          <CardHeader>
            <CardTitle>렌탈 업체 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">업체명</dt>
                <dd className="font-medium">{equipmentImport.vendorName}</dd>
              </div>
              {equipmentImport.vendorContact && (
                <div>
                  <dt className="text-sm text-muted-foreground">연락처</dt>
                  <dd>{equipmentImport.vendorContact}</dd>
                </div>
              )}
              {equipmentImport.externalIdentifier && (
                <div>
                  <dt className="text-sm text-muted-foreground">업체 장비번호</dt>
                  <dd>{equipmentImport.externalIdentifier}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {isInternalShared && (
        <Card>
          <CardHeader>
            <CardTitle>소유 부서 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">소유 부서</dt>
                <dd className="font-medium">{equipmentImport.ownerDepartment}</dd>
              </div>
              {equipmentImport.internalContact && (
                <div>
                  <dt className="text-sm text-muted-foreground">담당자 연락처</dt>
                  <dd>{equipmentImport.internalContact}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Usage Period & Reason */}
      <Card>
        <CardHeader>
          <CardTitle>사용 기간 및 사유</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">사용 시작일</dt>
              <dd>
                {format(new Date(equipmentImport.usagePeriodStart), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">사용 종료일</dt>
              <dd>
                {format(new Date(equipmentImport.usagePeriodEnd), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">반입 사유</dt>
              <dd className="whitespace-pre-wrap">{equipmentImport.reason}</dd>
            </div>
            {isInternalShared && equipmentImport.borrowingJustification && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">상세 반입 사유</dt>
                <dd className="whitespace-pre-wrap">{equipmentImport.borrowingJustification}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Connected Equipment (after receiving) */}
      {equipmentImport.equipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>등록된 장비</CardTitle>
            <CardDescription>수령 시 자동 생성된 임시 장비</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                router.push(FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentImport.equipmentId!))
              }
            >
              장비 상세 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {equipmentImport.returnCheckoutId && (
        <Card>
          <CardHeader>
            <CardTitle>반납 반출</CardTitle>
            <CardDescription>반납 프로세스용 checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(equipmentImport.returnCheckoutId!))
              }
            >
              반출 상세 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {status === 'rejected' && equipmentImport.rejectionReason && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">거절 사유</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{equipmentImport.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Receiving Condition Results */}
      {equipmentImport.receivingCondition && (
        <Card>
          <CardHeader>
            <CardTitle>수령 상태점검 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">외관</dt>
                <dd>
                  {equipmentImport.receivingCondition.appearance === 'normal' ? '정상' : '이상'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">작동</dt>
                <dd>
                  {equipmentImport.receivingCondition.operation === 'normal' ? '정상' : '이상'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">부속품</dt>
                <dd>
                  {equipmentImport.receivingCondition.accessories === 'complete'
                    ? '완전'
                    : '불완전'}
                </dd>
              </div>
              {equipmentImport.receivingCondition.notes && (
                <div className="sm:col-span-3">
                  <dt className="text-sm text-muted-foreground">비고</dt>
                  <dd>{equipmentImport.receivingCondition.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* pending: approve/reject (technical_manager+), cancel (requester) */}
        {status === 'pending' && canApprove && (
          <>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              <Check className="mr-2 h-4 w-4" />
              승인
            </Button>
            <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
              <X className="mr-2 h-4 w-4" />
              거절
            </Button>
          </>
        )}
        {status === 'pending' && isRequester && (
          <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
            <Ban className="mr-2 h-4 w-4" />
            취소
          </Button>
        )}

        {/* approved: receive confirmation (team member), cancel */}
        {status === 'approved' && (
          <>
            <Button onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.RECEIVE(id))}>
              <Package className="mr-2 h-4 w-4" />
              수령 확인
            </Button>
            {isRequester && (
              <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                <Ban className="mr-2 h-4 w-4" />
                취소
              </Button>
            )}
          </>
        )}

        {/* received: initiate return */}
        {status === 'received' && (
          <Button
            onClick={() => initiateReturnMutation.mutate()}
            disabled={initiateReturnMutation.isPending}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            반납 시작
          </Button>
        )}

        {/* return_requested: view checkout details */}
        {status === 'return_requested' && equipmentImport.returnCheckoutId && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(equipmentImport.returnCheckoutId!))
            }
          >
            반납 진행 상황 보기
          </Button>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반입 신청 거절</DialogTitle>
            <DialogDescription>거절 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">거절 사유</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="거절 사유를 입력하세요."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              거절
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반입 신청 취소</DialogTitle>
            <DialogDescription>취소 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">취소 사유</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="취소 사유를 입력하세요."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
