'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileText,
  User,
  Package,
  AlertTriangle,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import checkoutApi, { Checkout, ConditionCheck } from '@/lib/api/checkout-api';
import {
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_PURPOSE_LABELS,
  CONDITION_CHECK_STEP_LABELS,
  CONDITION_STATUS_LABELS,
  ACCESSORIES_STATUS_LABELS,
  CheckoutStatus,
} from '@equipment-management/schemas';
import CheckoutStatusStepper from '@/components/checkouts/CheckoutStatusStepper';
import ConditionComparisonCard from '@/components/checkouts/ConditionComparisonCard';

interface CheckoutDetailClientProps {
  checkout: Checkout;
  conditionChecks: ConditionCheck[];
}

/**
 * 반출 상세 Client Component
 *
 * 비즈니스 로직:
 * - 반출 상세 정보 표시
 * - 반출 유형별 상태 진행 표시
 * - 대여 목적: 양측 4단계 확인 이력 표시
 * - 역할별 액션 버튼
 */
export default function CheckoutDetailClient({
  checkout,
  conditionChecks,
}: CheckoutDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 다이얼로그 상태
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 승인 mutation
  const approveMutation = useMutation({
    mutationFn: (approverId: string) => checkoutApi.approveCheckout(checkout.id, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout', checkout.id] });
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      router.refresh();
    },
  });

  // 반려 mutation
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => checkoutApi.rejectCheckout(checkout.id, reason),
    onSuccess: () => {
      setShowRejectDialog(false);
      queryClient.invalidateQueries({ queryKey: ['checkout', checkout.id] });
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      router.refresh();
    },
  });

  // 반출 시작 mutation
  const startMutation = useMutation({
    mutationFn: () => {
      // start API가 없으면 직접 axios 호출
      return fetch(`/api/checkouts/${checkout.id}/start`, { method: 'POST' }).then((res) =>
        res.json()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout', checkout.id] });
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      router.refresh();
    },
  });

  // 상태 배지 렌더링
  const renderStatusBadge = (status: CheckoutStatus) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      checked_out: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      lender_checked: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      borrower_received: 'bg-teal-100 text-teal-800 border-teal-200',
      in_use: 'bg-purple-100 text-purple-800 border-purple-200',
      borrower_returned: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      lender_received: 'bg-lime-100 text-lime-800 border-lime-200',
      returned: 'bg-green-100 text-green-800 border-green-200',
      return_approved: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      canceled: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge variant="outline" className={statusStyles[status] || ''}>
        {CHECKOUT_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  // 목적 배지 렌더링
  const renderPurposeBadge = (purpose: string) => {
    const purposeStyles: Record<string, string> = {
      calibration: 'bg-blue-50 text-blue-700 border-blue-200',
      repair: 'bg-orange-50 text-orange-700 border-orange-200',
      rental: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    return (
      <Badge variant="outline" className={purposeStyles[purpose] || ''}>
        {CHECKOUT_PURPOSE_LABELS[purpose as keyof typeof CHECKOUT_PURPOSE_LABELS] || purpose}
      </Badge>
    );
  };

  // 승인 처리
  const handleApprove = () => {
    // TODO: 실제로는 현재 로그인 사용자 ID 사용
    const approverId = '00000000-0000-0000-0000-000000000001';
    approveMutation.mutate(approverId);
  };

  // 반려 처리
  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(rejectReason);
  };

  // 반출 시작 처리
  const handleStart = () => {
    startMutation.mutate();
  };

  // 액션 버튼 결정
  const renderActions = () => {
    const buttons: React.ReactNode[] = [];

    // 승인 대기 상태
    if (checkout.status === 'pending') {
      buttons.push(
        <Button
          key="approve"
          onClick={handleApprove}
          disabled={approveMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          승인
        </Button>,
        <Button
          key="reject"
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={rejectMutation.isPending}
        >
          <XCircle className="mr-2 h-4 w-4" />
          반려
        </Button>
      );
    }

    // 승인됨 상태 - 반출 시작 가능
    if (checkout.status === 'approved') {
      buttons.push(
        <Button key="start" onClick={handleStart} disabled={startMutation.isPending}>
          <Package className="mr-2 h-4 w-4" />
          반출 시작
        </Button>
      );
    }

    // 반출 중 상태 - 반입 처리 가능
    if (checkout.status === 'checked_out') {
      buttons.push(
        <Button key="return" asChild>
          <Link href={`/checkouts/${checkout.id}/return`}>
            <CheckCheck className="mr-2 h-4 w-4" />
            반입 처리
          </Link>
        </Button>
      );
    }

    // 대여 목적 특수 상태 - 상태 확인 필요
    if (
      checkout.purpose === 'rental' &&
      [
        'checked_out',
        'lender_checked',
        'borrower_received',
        'in_use',
        'borrower_returned',
      ].includes(checkout.status)
    ) {
      buttons.push(
        <Button key="check" variant="outline" asChild>
          <Link href={`/checkouts/${checkout.id}/check`}>
            <FileText className="mr-2 h-4 w-4" />
            상태 확인
          </Link>
        </Button>
      );
    }

    // 반입 완료 상태 - 최종 승인 가능
    if (checkout.status === 'returned') {
      buttons.push(
        <Button key="approve-return" className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          반입 승인
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/checkouts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">반출 상세</h1>
            {renderStatusBadge(checkout.status)}
            {renderPurposeBadge(checkout.purpose)}
          </div>
          <p className="text-muted-foreground mt-1">{checkout.destination}</p>
        </div>
        <div className="flex gap-2">{renderActions()}</div>
      </div>

      {/* 기한 초과 경고 */}
      {checkout.status === 'overdue' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            반입 예정일이 초과되었습니다. 빠른 반입 처리가 필요합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 상태 진행 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">진행 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutStatusStepper
            currentStatus={checkout.status}
            checkoutType={checkout.purpose as 'calibration' | 'repair' | 'rental'}
          />
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 반출 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">반출 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                반출지
              </span>
              <span className="font-medium">{checkout.destination}</span>
            </div>
            {checkout.address && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">주소</span>
                <span className="font-medium text-right max-w-[200px]">{checkout.address}</span>
              </div>
            )}
            {checkout.phoneNumber && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  연락처
                </span>
                <span className="font-medium">{checkout.phoneNumber}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">반출 사유</span>
              <span className="font-medium text-right max-w-[200px]">{checkout.reason}</span>
            </div>
          </CardContent>
        </Card>

        {/* 일정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">일정 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                신청일
              </span>
              <span className="font-medium">
                {format(new Date(checkout.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
            {checkout.checkoutDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">반출일</span>
                <span className="font-medium">
                  {format(new Date(checkout.checkoutDate), 'yyyy년 MM월 dd일', { locale: ko })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                반입 예정일
              </span>
              <span className="font-medium">
                {format(new Date(checkout.expectedReturnDate), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
            {checkout.actualReturnDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">실제 반입일</span>
                <span className="font-medium">
                  {format(new Date(checkout.actualReturnDate), 'yyyy년 MM월 dd일', { locale: ko })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 신청자/승인자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">담당자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">신청자</p>
                <p className="font-medium">{checkout.user?.name || '알 수 없음'}</p>
              </div>
            </div>
            {checkout.approvedBy && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">승인자</p>
                  <p className="font-medium">{checkout.approvedBy.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 장비 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">반출 장비</CardTitle>
          <CardDescription>이 반출에 포함된 장비 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {checkout.equipment && checkout.equipment.length > 0 ? (
            <div className="space-y-3">
              {checkout.equipment.map((equip) => (
                <div
                  key={equip.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Link href={`/equipment/${equip.id}`} className="font-medium hover:underline">
                        {equip.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{equip.managementNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{equip.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">장비 정보가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 대여 목적: 상태 확인 기록 */}
      {checkout.purpose === 'rental' && conditionChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상태 확인 이력</CardTitle>
            <CardDescription>대여 목적 양측 4단계 확인 기록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conditionChecks.map((check) => (
                <div key={check.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary">
                      {CONDITION_CHECK_STEP_LABELS[check.step] || check.step}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(check.checkedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">외관 상태</span>
                      <Badge
                        variant={check.appearanceStatus === 'normal' ? 'default' : 'destructive'}
                      >
                        {CONDITION_STATUS_LABELS[check.appearanceStatus]}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">작동 상태</span>
                      <Badge
                        variant={check.operationStatus === 'normal' ? 'default' : 'destructive'}
                      >
                        {CONDITION_STATUS_LABELS[check.operationStatus]}
                      </Badge>
                    </div>
                    {check.accessoriesStatus && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">부속품 상태</span>
                        <Badge
                          variant={check.accessoriesStatus === 'complete' ? 'default' : 'secondary'}
                        >
                          {ACCESSORIES_STATUS_LABELS[check.accessoriesStatus]}
                        </Badge>
                      </div>
                    )}
                    {check.abnormalDetails && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-red-800 text-sm">
                        <strong>이상 내용:</strong> {check.abnormalDetails}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 대여 목적: 전후 비교 */}
      {checkout.purpose === 'rental' && conditionChecks.length >= 2 && (
        <ConditionComparisonCard conditionChecks={conditionChecks} />
      )}

      {/* 반입 검사 정보 (반입 완료 후) */}
      {['returned', 'return_approved'].includes(checkout.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">반입 검사 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {checkout.purpose === 'calibration' && (
                <div className="flex items-center gap-2">
                  {checkout.calibrationChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>교정 확인</span>
                </div>
              )}
              {checkout.purpose === 'repair' && (
                <div className="flex items-center gap-2">
                  {checkout.repairChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>수리 확인</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {checkout.workingStatusChecked ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>작동 여부 확인</span>
              </div>
            </div>
            {checkout.inspectionNotes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">검사 비고</p>
                <p className="mt-1">{checkout.inspectionNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 반려 사유 */}
      {checkout.status === 'rejected' && checkout.rejectionReason && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800">반려 사유</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{checkout.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* 반려 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반출 반려</DialogTitle>
            <DialogDescription>반출 요청을 반려합니다. 반려 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">반려 사유</Label>
              <Textarea
                id="rejectReason"
                placeholder="반려 사유를 입력해주세요"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
