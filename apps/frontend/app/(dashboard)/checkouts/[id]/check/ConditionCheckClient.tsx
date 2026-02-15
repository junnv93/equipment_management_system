'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { queryKeys } from '@/lib/api/query-config';
import checkoutApi, {
  Checkout,
  ConditionCheck,
  CreateConditionCheckDto,
} from '@/lib/api/checkout-api';
import {
  ConditionCheckStep,
  CONDITION_CHECK_STEP_LABELS,
  CHECKOUT_STATUS_LABELS,
} from '@equipment-management/schemas';
import EquipmentConditionForm from '@/components/checkouts/EquipmentConditionForm';
import CheckoutStatusStepper from '@/components/checkouts/CheckoutStatusStepper';

interface ConditionCheckClientProps {
  checkout: Checkout;
  nextStep: ConditionCheckStep;
  previousCheck?: ConditionCheck;
  conditionChecks: ConditionCheck[];
}

/**
 * 상태 확인 Client Component
 *
 * 대여 목적 반출 시 양측 4단계 확인을 위한 폼을 제공합니다.
 * - 현재 상태와 다음 확인 단계를 표시
 * - 이전 확인 기록과 비교 (④단계)
 * - 확인 완료 시 상태 전이
 */
export default function ConditionCheckClient({
  checkout,
  nextStep,
  previousCheck,
  conditionChecks,
}: ConditionCheckClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 상태 확인 제출 mutation
  const submitMutation = useMutation({
    mutationFn: (data: CreateConditionCheckDto) =>
      checkoutApi.submitConditionCheck(checkout.id, data),
    onSuccess: () => {
      router.push(`/checkouts/${checkout.id}`);
      router.refresh();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.detail(checkout.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.all });
    },
  });

  // 제출 핸들러
  const handleSubmit = (data: Omit<CreateConditionCheckDto, 'version'>) => {
    submitMutation.mutate({
      ...data,
      version: checkout.version, // ✅ Phase 1: Optimistic Locking
    });
  };

  // 취소 핸들러
  const handleCancel = () => {
    router.push(`/checkouts/${checkout.id}`);
  };

  // 단계별 안내 메시지
  const stepGuidance: Record<ConditionCheckStep, string> = {
    lender_checkout:
      '장비를 반출하기 전에 현재 상태를 확인하고 기록해주세요. 이 기록은 반입 시 비교 자료로 사용됩니다.',
    borrower_receive: '장비를 인수받으셨습니다. 인수 시점의 장비 상태를 확인하고 기록해주세요.',
    borrower_return:
      '장비를 반납하기 전에 현재 상태를 확인하고 기록해주세요. 인수 시 상태와 비교됩니다.',
    lender_return:
      '반납받은 장비의 상태를 확인해주세요. 반출 전 상태와 비교하여 변경 사항이 있다면 기록해주세요.',
  };

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
        <h1 className="text-2xl font-bold">상태 확인</h1>
        <p className="text-muted-foreground">{checkout.destination}</p>
      </div>

      {/* 진행 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">진행 상태</CardTitle>
          <CardDescription>
            현재 상태: {CHECKOUT_STATUS_LABELS[checkout.status] || checkout.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutStatusStepper currentStatus={checkout.status} checkoutType="rental" />
        </CardContent>
      </Card>

      {/* 안내 메시지 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{stepGuidance[nextStep]}</AlertDescription>
      </Alert>

      {/* 이전 확인 정보 (비교용) */}
      {previousCheck && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">이전 확인 기록</CardTitle>
            <CardDescription>
              {CONDITION_CHECK_STEP_LABELS[previousCheck.step]} 시 기록된 상태입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">외관 상태</span>
                <span>{previousCheck.appearanceStatus === 'normal' ? '정상' : '이상'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">작동 상태</span>
                <span>{previousCheck.operationStatus === 'normal' ? '정상' : '이상'}</span>
              </div>
              {previousCheck.accessoriesStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">부속품 상태</span>
                  <span>{previousCheck.accessoriesStatus === 'complete' ? '완전' : '불완전'}</span>
                </div>
              )}
              {previousCheck.abnormalDetails && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                  <strong>이상 내용:</strong> {previousCheck.abnormalDetails}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 에러 메시지 */}
      {submitMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            상태 확인 등록에 실패했습니다.{' '}
            {submitMutation.error instanceof Error ? submitMutation.error.message : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* 상태 확인 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>{CONDITION_CHECK_STEP_LABELS[nextStep]}</CardTitle>
          <CardDescription>장비의 현재 상태를 확인하고 기록해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentConditionForm
            step={nextStep}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={submitMutation.isPending}
            previousCheck={
              previousCheck
                ? {
                    appearanceStatus: previousCheck.appearanceStatus,
                    operationStatus: previousCheck.operationStatus,
                    accessoriesStatus: previousCheck.accessoriesStatus,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* 완료된 확인 기록 */}
      {conditionChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">완료된 확인 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conditionChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{CONDITION_CHECK_STEP_LABELS[check.step]}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(check.checkedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span
                      className={
                        check.appearanceStatus === 'normal' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      외관: {check.appearanceStatus === 'normal' ? '정상' : '이상'}
                    </span>
                    <span
                      className={
                        check.operationStatus === 'normal' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      작동: {check.operationStatus === 'normal' ? '정상' : '이상'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
