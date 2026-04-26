'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useEffect } from 'react';
import { ArrowLeft, Package, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import checkoutApi, { Checkout, ConditionCheck, ReturnCheckoutDto } from '@/lib/api/checkout-api';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { getErrorMessage } from '@/lib/api/error';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { queryKeys } from '@/lib/api/query-config';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import { useAuth } from '@/hooks/use-auth';
import ReturnInspectionForm, {
  InspectionFormData,
} from '@/components/checkouts/ReturnInspectionForm';
import CheckoutStatusStepper from '@/components/checkouts/CheckoutStatusStepper';
import ConditionComparisonCard from '@/components/checkouts/ConditionComparisonCard';
import { getPageContainerClasses, SUB_PAGE_HEADER_TOKENS } from '@/lib/design-tokens';

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
  const t = useTranslations('checkouts');
  const formatter = useFormatter();
  const { can } = useAuth();
  const canComplete = can(Permission.COMPLETE_CHECKOUT);

  // 반입 처리 mutation — useOptimisticMutation 패턴 (CheckoutDetailClient과 일관성)
  // 성공 시 onSettledCallback에서 네비게이션 (캐시 무효화 완료 후)
  const returnMutation = useOptimisticMutation<Checkout, ReturnCheckoutDto, Checkout>({
    mutationFn: (data: ReturnCheckoutDto) => checkoutApi.returnCheckout(checkout.id, data),
    queryKey: queryKeys.checkouts.resource.detail(checkout.id),
    optimisticUpdate: (old): Checkout =>
      ({
        ...old,
        status: 'returned',
        actualReturnDate: new Date().toISOString(),
        version: (old?.version ?? checkout.version) + 1,
      }) as Checkout,
    invalidateKeys: CheckoutCacheInvalidation.RETURN_KEYS,
    successMessage: t('toasts.returnSuccess'),
    errorMessage: (error) => getErrorMessage(error, t('toasts.returnError')),
    onSettledCallback: () => {
      router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(checkout.id));
    },
  });

  // UL-QP-18 직무분리: 권한 없는 역할은 상세 페이지로 리다이렉트 (hooks 이후)
  useEffect(() => {
    if (!canComplete) {
      router.replace(FRONTEND_ROUTES.CHECKOUTS.DETAIL(checkout.id));
    }
  }, [canComplete, router, checkout.id]);

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
    router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(checkout.id));
  };

  // 반입 예정일 초과 여부
  const isOverdue = new Date(checkout.expectedReturnDate) < new Date();

  const formatDate = (dateStr: string) =>
    formatter.dateTime(new Date(dateStr), { dateStyle: 'long' });

  const conditionStatusLabel = (status: string) =>
    status === 'normal'
      ? t('condition.conditionStatus.normal')
      : t('condition.conditionStatus.abnormal');

  if (!canComplete) return null;

  return (
    <div className={getPageContainerClasses('form')}>
      {/* 헤더 */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={FRONTEND_ROUTES.CHECKOUTS.DETAIL(checkout.id)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('returnPage.backToDetail')}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{t('actions.processReturn')}</h1>
          <Badge variant="outline">{t(`purpose.${checkout.purpose}`)}</Badge>
        </div>
        <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>{checkout.destination}</p>
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
              status: t(`status.${checkout.status}`),
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
            <span className={isOverdue ? 'font-medium text-brand-critical' : 'font-medium'}>
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
      {checkout.purpose === CPVal.RENTAL && conditionChecks.length > 0 && (
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
                      <p className="font-medium text-sm">{t(`conditionCheckStep.${check.step}`)}</p>
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
