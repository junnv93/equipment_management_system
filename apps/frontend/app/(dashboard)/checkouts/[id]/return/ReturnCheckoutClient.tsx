'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { ArrowLeft, Package, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { queryKeys } from '@/lib/api/query-config';
import checkoutApi, { Checkout, ConditionCheck, ReturnCheckoutDto } from '@/lib/api/checkout-api';
import { CHECKOUT_RETURN_INVALIDATE_KEYS } from '@/lib/query-keys/checkout-keys';
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
  const t = useTranslations('checkouts');
  const formatter = useFormatter();

  // 반입 처리 mutation (cross-page invalidation: 반입 승인 대기 목록 등)
  const returnMutation = useMutation({
    mutationFn: (data: ReturnCheckoutDto) => checkoutApi.returnCheckout(checkout.id, data),
    onSuccess: () => {
      router.push(`/checkouts/${checkout.id}`);
      router.refresh();
    },
    onSettled: () => {
      Promise.all(
        CHECKOUT_RETURN_INVALIDATE_KEYS.map((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        )
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.detail(checkout.id) });
    },
  });

  // 제출 핸들러
  const handleSubmit = (data: InspectionFormData) => {
    const returnData: ReturnCheckoutDto = {
      version: checkout.version, // ✅ Phase 1: Optimistic Locking
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

  const formatDate = (dateStr: string) =>
    formatter.dateTime(new Date(dateStr), { dateStyle: 'long' });

  const conditionStatusLabel = (status: string) =>
    status === 'normal'
      ? t('condition.conditionStatus.normal')
      : t('condition.conditionStatus.abnormal');

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      {/* 헤더 */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={`/checkouts/${checkout.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('returnPage.backToDetail')}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('actions.processReturn')}</h1>
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
            {t('returnPage.overdueAlert', { date: formatDate(checkout.expectedReturnDate) })}
          </AlertDescription>
        </Alert>
      )}

      {/* 진행 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('detail.progressStatus')}</CardTitle>
          <CardDescription>
            {t('returnPage.currentStatus', {
              status: CHECKOUT_STATUS_LABELS[checkout.status] || checkout.status,
            })}
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
          <CardTitle className="text-lg">{t('detail.checkoutInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('detail.destination')}
            </span>
            <span className="font-medium">{checkout.destination}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('detail.checkoutDate')}
            </span>
            <span className="font-medium">
              {checkout.checkoutDate ? formatDate(checkout.checkoutDate) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('detail.expectedReturn')}</span>
            <span className={isOverdue ? 'font-medium text-red-600' : 'font-medium'}>
              {formatDate(checkout.expectedReturnDate)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('detail.equipmentList')}
            </span>
            <span className="font-medium">
              {checkout.equipment && checkout.equipment.length > 0
                ? `${checkout.equipment[0].name}${checkout.equipment.length > 1 ? ` ${t('returnPage.equipmentMore', { count: checkout.equipment.length - 1 })}` : ''}`
                : t('returnPage.noEquipmentInfo')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 대여 목적: 상태 확인 이력 */}
      {checkout.purpose === 'rental' && conditionChecks.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.conditionHistory')}</CardTitle>
              <CardDescription>{t('returnPage.conditionHistoryDesc')}</CardDescription>
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
                        {formatter.dateTime(new Date(check.checkedAt), {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={check.appearanceStatus === 'normal' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {t('returnPage.conditionAppearanceStatus', {
                          status: conditionStatusLabel(check.appearanceStatus),
                        })}
                      </Badge>
                      <Badge
                        variant={check.operationStatus === 'normal' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {t('returnPage.conditionOperationStatus', {
                          status: conditionStatusLabel(check.operationStatus),
                        })}
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
            {t('returnPage.returnError')}{' '}
            {returnMutation.error instanceof Error ? returnMutation.error.message : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* 반입 검사 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('returnPage.inspectionTitle')}</CardTitle>
          <CardDescription>{t('returnPage.inspectionDesc')}</CardDescription>
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
