'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Package, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import checkoutApi, { Checkout, ConditionCheck, ReturnCheckoutDto } from '@/lib/api/checkout-api';
import {
  CHECKOUT_PURPOSE_LABELS,
  CHECKOUT_STATUS_LABELS,
  CONDITION_CHECK_STEP_LABELS,
} from '@equipment-management/schemas';
import ReturnInspectionForm, {
  InspectionFormData,
} from '@/components/checkouts/ReturnInspectionForm';
import CheckoutStatusStepper from '@/components/checkouts/CheckoutStatusStepper';
import ConditionComparisonCard from '@/components/checkouts/ConditionComparisonCard';

interface ReturnCheckoutClientProps {
  checkout: Checkout;
  conditionChecks: ConditionCheck[];
}

/**
 * 반입 처리 Client Component
 *
 * 비즈니스 로직:
 * - 교정/수리: 직접 검사 항목 확인 후 반입
 * - 대여: 양측 4단계 확인 이력 확인 후 반입
 * - 반입 후 상태: returned (기술책임자 승인 대기)
 */
export default function ReturnCheckoutClient({
  checkout,
  conditionChecks,
}: ReturnCheckoutClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 반입 처리 mutation
  const returnMutation = useMutation({
    mutationFn: (data: ReturnCheckoutDto) => checkoutApi.returnCheckout(checkout.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout', checkout.id] });
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      router.push(`/checkouts/${checkout.id}`);
      router.refresh();
    },
  });

  // 제출 핸들러
  const handleSubmit = (data: InspectionFormData) => {
    const returnData: ReturnCheckoutDto = {
      calibrationChecked: data.calibrationChecked,
      repairChecked: data.repairChecked,
      workingStatusChecked: data.workingStatusChecked,
      inspectionNotes: data.inspectionNotes || undefined,
    };

    returnMutation.mutate(returnData);
  };

  // 취소 핸들러
  const handleCancel = () => {
    router.push(`/checkouts/${checkout.id}`);
  };

  // 반입 예정일 초과 여부
  const isOverdue = new Date(checkout.expectedReturnDate) < new Date();

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      {/* 헤더 */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={`/checkouts/${checkout.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            상세로 돌아가기
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">반입 처리</h1>
          <Badge variant="outline">
            {CHECKOUT_PURPOSE_LABELS[checkout.purpose as keyof typeof CHECKOUT_PURPOSE_LABELS] ||
              checkout.purpose}
          </Badge>
        </div>
        <p className="text-muted-foreground">{checkout.destination}</p>
      </div>

      {/* 기한 초과 경고 */}
      {isOverdue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            반입 예정일(
            {format(new Date(checkout.expectedReturnDate), 'yyyy년 MM월 dd일', { locale: ko })})이
            초과되었습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 진행 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">진행 상태</CardTitle>
          <CardDescription>
            현재 상태: {CHECKOUT_STATUS_LABELS[checkout.status] || checkout.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutStatusStepper
            currentStatus={checkout.status}
            checkoutType={checkout.purpose as 'calibration' | 'repair' | 'rental'}
          />
        </CardContent>
      </Card>

      {/* 반출 정보 요약 */}
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
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              반출일
            </span>
            <span className="font-medium">
              {checkout.checkoutDate
                ? format(new Date(checkout.checkoutDate), 'yyyy년 MM월 dd일', { locale: ko })
                : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">반입 예정일</span>
            <span className={isOverdue ? 'font-medium text-red-600' : 'font-medium'}>
              {format(new Date(checkout.expectedReturnDate), 'yyyy년 MM월 dd일', { locale: ko })}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              반출 장비
            </span>
            <span className="font-medium">
              {checkout.equipment && checkout.equipment.length > 0
                ? `${checkout.equipment[0].name}${checkout.equipment.length > 1 ? ` 외 ${checkout.equipment.length - 1}건` : ''}`
                : '장비 정보 없음'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 대여 목적: 상태 확인 이력 */}
      {checkout.purpose === 'rental' && conditionChecks.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상태 확인 이력</CardTitle>
              <CardDescription>대여 기간 동안 기록된 상태 확인입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conditionChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {CONDITION_CHECK_STEP_LABELS[check.step]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(check.checkedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={check.appearanceStatus === 'normal' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        외관: {check.appearanceStatus === 'normal' ? '정상' : '이상'}
                      </Badge>
                      <Badge
                        variant={check.operationStatus === 'normal' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        작동: {check.operationStatus === 'normal' ? '정상' : '이상'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 전후 비교 */}
          {conditionChecks.length >= 2 && (
            <ConditionComparisonCard conditionChecks={conditionChecks} />
          )}
        </>
      )}

      {/* 에러 메시지 */}
      {returnMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            반입 처리에 실패했습니다.{' '}
            {returnMutation.error instanceof Error ? returnMutation.error.message : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* 반입 검사 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">반입 검사</CardTitle>
          <CardDescription>
            장비 반입 전 검사 항목을 확인해주세요. 검사 완료 후 기술책임자 승인이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReturnInspectionForm
            purpose={checkout.purpose}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={returnMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
