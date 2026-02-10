'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import rentalImportApi from '@/lib/api/rental-import-api';
import { RentalImportStatusBadge } from '@/components/rental-imports/RentalImportStatusBadge';
import {
  CLASSIFICATION_LABELS,
  type RentalImportStatus,
  type Classification,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  id: string;
}

export default function RentalImportDetailClient({ id }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: rentalImport, isLoading } = useQuery({
    queryKey: ['rental-import', id],
    queryFn: () => rentalImportApi.getOne(id),
  });

  // 브레드크럼 동적 라벨 설정
  useEffect(() => {
    if (rentalImport) {
      // 렌탈 반입 정보를 사용해서 의미있는 라벨 생성
      const classificationLabel =
        CLASSIFICATION_LABELS[rentalImport.classification as Classification];
      const label = `렌탈 ${classificationLabel} - ${rentalImport.equipmentName}`;
      setDynamicLabel(id, label);
    }

    // 컴포넌트 언마운트 시 라벨 제거
    return () => {
      clearDynamicLabel(id);
    };
  }, [rentalImport, id, setDynamicLabel, clearDynamicLabel]);

  const approveMutation = useMutation({
    mutationFn: () => rentalImportApi.approve(id),
    onSuccess: () => {
      toast({ title: '반입 신청이 승인되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['rental-import', id] });
    },
    onError: (error) => {
      toast({
        title: '승인 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rentalImportApi.reject(id, rejectionReason),
    onSuccess: () => {
      toast({ title: '반입 신청이 거절되었습니다.' });
      setShowRejectDialog(false);
      queryClient.invalidateQueries({ queryKey: ['rental-import', id] });
    },
    onError: (error) => {
      toast({
        title: '거절 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const initiateReturnMutation = useMutation({
    mutationFn: () => rentalImportApi.initiateReturn(id),
    onSuccess: () => {
      toast({ title: '반납 프로세스가 시작되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['rental-import', id] });
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
    mutationFn: () => rentalImportApi.cancel(id),
    onSuccess: () => {
      toast({ title: '반입 신청이 취소되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['rental-import', id] });
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

  if (!rentalImport) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        렌탈 반입 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const status = rentalImport.status as RentalImportStatus;
  const isRequester = user?.id === rentalImport.requesterId;
  const userRole = user?.roles?.[0];
  const canApprove = userRole === 'technical_manager' || userRole === 'lab_manager';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(FRONTEND_ROUTES.RENTAL_IMPORTS.LIST)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{rentalImport.equipmentName}</h1>
          <p className="text-muted-foreground">렌탈 반입 신청 상세</p>
        </div>
        <RentalImportStatusBadge status={status} />
      </div>

      {/* 장비 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>장비 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">장비명</dt>
              <dd className="font-medium">{rentalImport.equipmentName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">분류</dt>
              <dd>
                {CLASSIFICATION_LABELS[rentalImport.classification as Classification] ||
                  rentalImport.classification}
              </dd>
            </div>
            {rentalImport.modelName && (
              <div>
                <dt className="text-sm text-muted-foreground">모델명</dt>
                <dd>{rentalImport.modelName}</dd>
              </div>
            )}
            {rentalImport.manufacturer && (
              <div>
                <dt className="text-sm text-muted-foreground">제조사</dt>
                <dd>{rentalImport.manufacturer}</dd>
              </div>
            )}
            {rentalImport.serialNumber && (
              <div>
                <dt className="text-sm text-muted-foreground">일련번호</dt>
                <dd>{rentalImport.serialNumber}</dd>
              </div>
            )}
            {rentalImport.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">설명</dt>
                <dd>{rentalImport.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 렌탈 업체 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>렌탈 업체 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">업체명</dt>
              <dd className="font-medium">{rentalImport.vendorName}</dd>
            </div>
            {rentalImport.vendorContact && (
              <div>
                <dt className="text-sm text-muted-foreground">연락처</dt>
                <dd>{rentalImport.vendorContact}</dd>
              </div>
            )}
            {rentalImport.externalIdentifier && (
              <div>
                <dt className="text-sm text-muted-foreground">업체 장비번호</dt>
                <dd>{rentalImport.externalIdentifier}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 사용 기간 & 사유 */}
      <Card>
        <CardHeader>
          <CardTitle>사용 기간 및 사유</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">사용 시작일</dt>
              <dd>
                {format(new Date(rentalImport.usagePeriodStart), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">사용 종료일</dt>
              <dd>
                {format(new Date(rentalImport.usagePeriodEnd), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">반입 사유</dt>
              <dd className="whitespace-pre-wrap">{rentalImport.reason}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 연결 정보 (수령 이후) */}
      {rentalImport.equipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>등록된 장비</CardTitle>
            <CardDescription>수령 시 자동 생성된 임시 장비</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                router.push(FRONTEND_ROUTES.EQUIPMENT.DETAIL(rentalImport.equipmentId!))
              }
            >
              장비 상세 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {rentalImport.returnCheckoutId && (
        <Card>
          <CardHeader>
            <CardTitle>반납 반출</CardTitle>
            <CardDescription>반납 프로세스용 checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(rentalImport.returnCheckoutId!))
              }
            >
              반출 상세 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 거절 사유 */}
      {status === 'rejected' && rentalImport.rejectionReason && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">거절 사유</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{rentalImport.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* 수령 상태점검 결과 */}
      {rentalImport.receivingCondition && (
        <Card>
          <CardHeader>
            <CardTitle>수령 상태점검 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">외관</dt>
                <dd>{rentalImport.receivingCondition.appearance === 'normal' ? '정상' : '이상'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">작동</dt>
                <dd>{rentalImport.receivingCondition.operation === 'normal' ? '정상' : '이상'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">부속품</dt>
                <dd>
                  {rentalImport.receivingCondition.accessories === 'complete' ? '완전' : '불완전'}
                </dd>
              </div>
              {rentalImport.receivingCondition.notes && (
                <div className="sm:col-span-3">
                  <dt className="text-sm text-muted-foreground">비고</dt>
                  <dd>{rentalImport.receivingCondition.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {/* pending: 승인/거절 (기술책임자+), 취소 (신청자) */}
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
          <Button
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            <Ban className="mr-2 h-4 w-4" />
            취소
          </Button>
        )}

        {/* approved: 수령 확인 (팀원), 취소 */}
        {status === 'approved' && (
          <>
            <Button onClick={() => router.push(FRONTEND_ROUTES.RENTAL_IMPORTS.RECEIVE(id))}>
              <Package className="mr-2 h-4 w-4" />
              수령 확인
            </Button>
            {isRequester && (
              <Button
                variant="outline"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                <Ban className="mr-2 h-4 w-4" />
                취소
              </Button>
            )}
          </>
        )}

        {/* received: 반납 시작 */}
        {status === 'received' && (
          <Button
            onClick={() => initiateReturnMutation.mutate()}
            disabled={initiateReturnMutation.isPending}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            반납 시작
          </Button>
        )}

        {/* return_requested: checkout 상세로 이동 */}
        {status === 'return_requested' && rentalImport.returnCheckoutId && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(rentalImport.returnCheckoutId!))
            }
          >
            반납 진행 상황 보기
          </Button>
        )}
      </div>

      {/* 거절 다이얼로그 */}
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
    </div>
  );
}
