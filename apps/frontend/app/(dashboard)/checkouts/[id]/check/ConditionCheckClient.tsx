'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
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
import { ConditionCheckStep } from '@equipment-management/schemas';
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
  const t = useTranslations('checkouts');
  const formatter = useFormatter();
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

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      {/* 헤더 */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={`/checkouts/${checkout.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('conditionCheck.backToDetail')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('conditionCheck.title')}</h1>
        <p className="text-muted-foreground">{checkout.destination}</p>
      </div>

      {/* 진행 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('conditionCheck.progressTitle')}</CardTitle>
          <CardDescription>
            {t('conditionCheck.currentStatus', {
              status: t(`status.${checkout.status}` as Parameters<typeof t>[0]) || checkout.status,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutStatusStepper currentStatus={checkout.status} checkoutType="rental" />
        </CardContent>
      </Card>

      {/* 안내 메시지 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t(`conditionCheck.guidance.${nextStep}` as Parameters<typeof t>[0])}
        </AlertDescription>
      </Alert>

      {/* 이전 확인 정보 (비교용) */}
      {previousCheck && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('conditionCheck.previousCheckTitle')}</CardTitle>
            <CardDescription>
              {t('conditionCheck.previousCheckDesc', {
                step: t(`condition.stepLabels.${previousCheck.step}` as Parameters<typeof t>[0]),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('conditionCheck.appearanceLabel')}</span>
                <span>
                  {previousCheck.appearanceStatus === 'normal'
                    ? t('conditionCheck.statusNormal')
                    : t('conditionCheck.statusAbnormal')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('conditionCheck.operationLabel')}</span>
                <span>
                  {previousCheck.operationStatus === 'normal'
                    ? t('conditionCheck.statusNormal')
                    : t('conditionCheck.statusAbnormal')}
                </span>
              </div>
              {previousCheck.accessoriesStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('conditionCheck.accessoriesLabel')}
                  </span>
                  <span>
                    {previousCheck.accessoriesStatus === 'complete'
                      ? t('conditionCheck.accessoriesComplete')
                      : t('conditionCheck.accessoriesIncomplete')}
                  </span>
                </div>
              )}
              {previousCheck.abnormalDetails && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                  <strong>{t('conditionCheck.abnormalContent')}</strong>{' '}
                  {previousCheck.abnormalDetails}
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
            {t('conditionCheck.submitError')}{' '}
            {submitMutation.error instanceof Error ? submitMutation.error.message : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* 상태 확인 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>{t(`condition.stepLabels.${nextStep}` as Parameters<typeof t>[0])}</CardTitle>
          <CardDescription>{t('conditionCheck.formDescription')}</CardDescription>
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
            <CardTitle className="text-base">{t('conditionCheck.completedChecksTitle')}</CardTitle>
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
                      {t(`condition.stepLabels.${check.step}` as Parameters<typeof t>[0])}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatter.dateTime(new Date(check.checkedAt), {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span
                      className={
                        check.appearanceStatus === 'normal' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {t('conditionCheck.appearanceStatus', {
                        status:
                          check.appearanceStatus === 'normal'
                            ? t('conditionCheck.statusNormal')
                            : t('conditionCheck.statusAbnormal'),
                      })}
                    </span>
                    <span
                      className={
                        check.operationStatus === 'normal' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {t('conditionCheck.operationStatus', {
                        status:
                          check.operationStatus === 'normal'
                            ? t('conditionCheck.statusNormal')
                            : t('conditionCheck.statusAbnormal'),
                      })}
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
