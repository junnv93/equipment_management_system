'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { getErrorMessage } from '@/lib/api/error';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import checkoutApi, { Checkout, ConditionCheck } from '@/lib/api/checkout-api';
import {
  CHECKOUT_DETAIL_TOKENS,
  CHECKOUT_INTERACTION_TOKENS,
  CONDITION_COMPARISON_TOKENS,
  CHECKOUT_PURPOSE_TOKENS,
  getPageContainerClasses,
  SUB_PAGE_HEADER_TOKENS,
} from '@/lib/design-tokens';
import {
  CheckoutStatus,
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
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
  checkout: initialCheckout,
  conditionChecks,
}: CheckoutDetailClientProps) {
  const t = useTranslations('checkouts');
  const router = useRouter();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const { can } = useAuth();
  // SSOT: 백엔드 @RequirePermissions(APPROVE_CHECKOUT)와 일치 (role-permissions.ts)
  const canApprove = can(Permission.APPROVE_CHECKOUT);

  // ✅ Single Source of Truth: useQuery가 유일한 상태 소스
  // placeholderData: SSR props를 초기 표시용으로 사용 (항상 stale 취급 → 백그라운드 refetch 보장)
  // invalidateQueries → 자동 refetch → UI 자동 갱신 (수동 동기화 불필요)
  const { data: checkout = initialCheckout } = useQuery({
    queryKey: queryKeys.checkouts.detail(initialCheckout.id),
    queryFn: () => checkoutApi.getCheckout(initialCheckout.id),
    placeholderData: initialCheckout,
    staleTime: CACHE_TIMES.SHORT, // 백엔드 캐시와 협력하여 불필요한 재호출 방지
    refetchOnMount: false, // Server Component이 이미 최신 데이터 제공
  });

  // 브레드크럼 동적 라벨 설정
  useEffect(() => {
    // 반출 정보를 사용해서 의미있는 라벨 생성
    const purposeLabel = t(`purpose.${checkout.purpose}`);
    const label = `${purposeLabel} - ${checkout.destination}`;
    setDynamicLabel(checkout.id, label);

    // 컴포넌트 언마운트 시 라벨 제거
    return () => {
      clearDynamicLabel(checkout.id);
    };
  }, [checkout.id, checkout.purpose, checkout.destination, setDynamicLabel, clearDynamicLabel, t]);

  // 다이얼로그 상태 (통합)
  const [dialogState, setDialogState] = useState({
    reject: false,
    start: false,
    approveReturn: false,
    rejectReturn: false,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [returnRejectReason, setReturnRejectReason] = useState('');

  // 장비별 반출 전 상태 기록 (Phase 3)
  const [itemConditionsBefore, setItemConditionsBefore] = useState<Record<string, string>>({});

  // 승인 mutation (approverId는 백엔드에서 세션으로부터 자동 추출)
  const approveMutation = useOptimisticMutation<Checkout, void, Checkout>({
    mutationFn: () => checkoutApi.approveCheckout(checkout.id, checkout.version),
    queryKey: queryKeys.checkouts.detail(checkout.id),
    optimisticUpdate: (old): Checkout =>
      ({
        ...old,
        status: CSVal.APPROVED as CheckoutStatus,
        approvedAt: new Date().toISOString(),
        version: (old?.version ?? checkout.version) + 1, // ✅ Optimistic version increment
      }) as Checkout,
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    successMessage: t('toasts.approveSuccess'),
    errorMessage: (error) => getErrorMessage(error, t('toasts.approveError')),
    onSuccessCallback: () => {
      router.refresh();
    },
  });

  // 반려 mutation
  const rejectMutation = useOptimisticMutation<Checkout, string, Checkout>({
    mutationFn: (reason: string) =>
      checkoutApi.rejectCheckout(checkout.id, checkout.version, reason),
    queryKey: queryKeys.checkouts.detail(checkout.id),
    optimisticUpdate: (old, reason): Checkout =>
      ({
        ...old,
        status: CSVal.REJECTED as CheckoutStatus,
        rejectionReason: reason,
        version: (old?.version ?? checkout.version) + 1, // ✅ Optimistic version increment
      }) as Checkout,
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    successMessage: t('toasts.rejectSuccess'),
    errorMessage: (error) => getErrorMessage(error, t('toasts.rejectError')),
    onSuccessCallback: () => {
      setDialogState((prev) => ({ ...prev, reject: false }));
      router.refresh();
    },
    onErrorCallback: () => {
      setDialogState((prev) => ({ ...prev, reject: false }));
    },
  });

  // 반출 시작 mutation (장비별 상태 기록 포함)
  const startMutation = useOptimisticMutation<Checkout, void, Checkout>({
    mutationFn: () => {
      const conditions = Object.entries(itemConditionsBefore)
        .filter(([, value]) => value.trim())
        .map(([equipmentId, conditionBefore]) => ({ equipmentId, conditionBefore }));
      return checkoutApi.startCheckout(
        checkout.id,
        checkout.version,
        conditions.length > 0 ? { itemConditions: conditions } : undefined
      );
    },
    queryKey: queryKeys.checkouts.detail(checkout.id),
    optimisticUpdate: (old): Checkout =>
      ({
        ...old,
        status: CSVal.CHECKED_OUT as CheckoutStatus,
        checkoutDate: new Date().toISOString(),
        version: (old?.version ?? checkout.version) + 1, // ✅ Optimistic version increment
      }) as Checkout,
    invalidateKeys: CheckoutCacheInvalidation.START_KEYS,
    successMessage: t('toasts.startSuccess'),
    errorMessage: (error) => getErrorMessage(error, t('toasts.startError')),
    onSuccessCallback: () => {
      router.refresh();
    },
    onErrorCallback: () => {
      setDialogState((prev) => ({ ...prev, start: false }));
    },
  });

  // 반입 승인 mutation
  const approveReturnMutation = useOptimisticMutation<Checkout, void, Checkout>({
    mutationFn: () => checkoutApi.approveReturn(checkout.id, { version: checkout.version }),
    queryKey: queryKeys.checkouts.detail(checkout.id),
    optimisticUpdate: (old): Checkout =>
      ({
        ...old,
        status: CSVal.RETURN_APPROVED as CheckoutStatus,
        returnApprovedAt: new Date().toISOString(),
        version: (old?.version ?? checkout.version) + 1, // ✅ Optimistic version increment
      }) as Checkout,
    invalidateKeys: CheckoutCacheInvalidation.RETURN_APPROVAL_KEYS,
    successMessage: t('toasts.returnApproveSuccess'),
    errorMessage: (error) => getErrorMessage(error, t('toasts.returnApproveError')),
    onSuccessCallback: () => {
      setDialogState((prev) => ({ ...prev, approveReturn: false }));
      router.refresh();
    },
    onErrorCallback: () => {
      setDialogState((prev) => ({ ...prev, approveReturn: false }));
    },
  });

  // 반입 반려 mutation
  const rejectReturnMutation = useOptimisticMutation<Checkout, string, Checkout>({
    mutationFn: (reason: string) =>
      checkoutApi.rejectReturn(checkout.id, { version: checkout.version, reason }),
    queryKey: queryKeys.checkouts.detail(checkout.id),
    optimisticUpdate: (old, _reason): Checkout =>
      ({
        ...old,
        status: CSVal.CHECKED_OUT as CheckoutStatus,
        version: (old?.version ?? checkout.version) + 1,
      }) as Checkout,
    invalidateKeys: CheckoutCacheInvalidation.RETURN_APPROVAL_KEYS,
    successMessage: t('toasts.returnRejectSuccess'),
    errorMessage: (error) => getErrorMessage(error, t('toasts.returnRejectError')),
    onSuccessCallback: () => {
      setDialogState((prev) => ({ ...prev, rejectReturn: false }));
      setReturnRejectReason('');
      router.refresh();
    },
    onErrorCallback: () => {
      setDialogState((prev) => ({ ...prev, rejectReturn: false }));
    },
  });

  // 목적 배지 렌더링
  const renderPurposeBadge = (purpose: string) => {
    return (
      <Badge
        variant="outline"
        className={
          CHECKOUT_PURPOSE_TOKENS[purpose as keyof typeof CHECKOUT_PURPOSE_TOKENS]?.badge ?? ''
        }
      >
        {t(`purpose.${purpose}`)}
      </Badge>
    );
  };

  // 승인 처리 (approverId는 백엔드에서 세션으로부터 자동 추출)
  const handleApprove = () => {
    approveMutation.mutate();
  };

  // 반려 처리
  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(rejectReason);
  };

  // 반출 시작 처리
  const handleStart = () => {
    startMutation.mutate();
    setDialogState((prev) => ({ ...prev, start: false }));
  };

  // 반입 승인 처리
  const handleApproveReturn = () => {
    approveReturnMutation.mutate();
  };

  // 반입 반려 처리
  const handleRejectReturn = () => {
    if (!returnRejectReason.trim()) return;
    rejectReturnMutation.mutate(returnRejectReason);
  };

  // 액션 버튼 결정 (역할 기반)
  const renderActions = () => {
    const buttons: React.ReactNode[] = [];

    // 승인 대기 상태 — technical_manager, lab_manager만 승인/반려 가능
    if (checkout.status === CSVal.PENDING && canApprove) {
      buttons.push(
        <Button
          key="approve"
          onClick={handleApprove}
          disabled={approveMutation.isPending}
          className={CHECKOUT_DETAIL_TOKENS.approveButton}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {t('actions.approve')}
        </Button>,
        <Button
          key="reject"
          variant="destructive"
          onClick={() => setDialogState((prev) => ({ ...prev, reject: true }))}
          disabled={rejectMutation.isPending}
        >
          <XCircle className="mr-2 h-4 w-4" />
          {t('actions.reject')}
        </Button>
      );
    }

    // 승인됨 상태 - 교정/수리만 반출 시작 가능 (대여는 상태 확인으로 진행)
    // technical_manager, lab_manager만 반출 시작 가능
    if (checkout.status === CSVal.APPROVED && checkout.purpose !== CPVal.RENTAL && canApprove) {
      buttons.push(
        <Button
          key="start"
          onClick={() => setDialogState((prev) => ({ ...prev, start: true }))}
          disabled={startMutation.isPending}
        >
          <Package className="mr-2 h-4 w-4" />
          {t('actions.startCheckout')}
        </Button>
      );
    }

    // 반출 중 상태 - 교정/수리만 반입 처리 가능 (대여는 4단계 상태 확인으로 진행)
    if (checkout.status === CSVal.CHECKED_OUT && checkout.purpose !== CPVal.RENTAL) {
      buttons.push(
        <Button key="return" asChild>
          <Link href={`/checkouts/${checkout.id}/return`}>
            <CheckCheck className="mr-2 h-4 w-4" />
            {t('actions.processReturn')}
          </Link>
        </Button>
      );
    }

    // 대여 목적 특수 상태 - 상태 확인 필요
    if (
      checkout.purpose === CPVal.RENTAL &&
      (
        [
          CSVal.APPROVED,
          CSVal.LENDER_CHECKED,
          CSVal.BORROWER_RECEIVED,
          CSVal.BORROWER_RETURNED,
        ] as CheckoutStatus[]
      ).includes(checkout.status)
    ) {
      buttons.push(
        <Button key="check" variant="outline" asChild>
          <Link href={`/checkouts/${checkout.id}/check`}>
            <FileText className="mr-2 h-4 w-4" />
            {t('actions.conditionCheck')}
          </Link>
        </Button>
      );
    }

    // 대여 목적 최종 단계 - lender_received 상태에서 반입 처리
    if (checkout.status === CSVal.LENDER_RECEIVED && checkout.purpose === CPVal.RENTAL) {
      buttons.push(
        <Button key="return" asChild>
          <Link href={`/checkouts/${checkout.id}/return`}>
            <CheckCheck className="mr-2 h-4 w-4" />
            {t('actions.processReturn')}
          </Link>
        </Button>
      );
    }

    // 반입 완료 상태 - 최종 승인/반려 가능 (technical_manager, lab_manager만)
    if (checkout.status === CSVal.RETURNED && canApprove) {
      buttons.push(
        <Button
          key="approve-return"
          onClick={() => setDialogState((prev) => ({ ...prev, approveReturn: true }))}
          disabled={approveReturnMutation.isPending}
          className={CHECKOUT_DETAIL_TOKENS.approveButton}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {t('actions.returnApprove')}
        </Button>,
        <Button
          key="reject-return"
          variant="destructive"
          onClick={() => setDialogState((prev) => ({ ...prev, rejectReturn: true }))}
          disabled={rejectReturnMutation.isPending}
        >
          <XCircle className="mr-2 h-4 w-4" />
          {t('actions.returnReject')}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/checkouts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('actions.backToList')}
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{t('detail.title')}</h1>
            <CheckoutStatusBadge status={checkout.status} />
            {renderPurposeBadge(checkout.purpose)}
          </div>
          <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>{checkout.destination}</p>
        </div>
        <div className="flex gap-2">{renderActions()}</div>
      </div>

      {/* 기한 초과 경고 */}
      {checkout.status === CSVal.OVERDUE && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{t('detail.overdueWarning')}</AlertDescription>
        </Alert>
      )}

      {/* 상태 진행 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.progressStatus')}</CardTitle>
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
            {checkout.address && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('detail.address')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium text-right max-w-[200px] truncate cursor-help">
                        {checkout.address}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{checkout.address}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            {checkout.phoneNumber && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('detail.contact')}
                </span>
                <span className="font-medium">{checkout.phoneNumber}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('detail.reason')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-right max-w-[200px] truncate cursor-help">
                      {checkout.reason}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{checkout.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* 일정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.scheduleInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('detail.requestDate')}
              </span>
              <span className="font-medium">
                {format(new Date(checkout.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
            {checkout.checkoutDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('detail.checkoutDate')}</span>
                <span className="font-medium">
                  {format(new Date(checkout.checkoutDate), 'yyyy년 MM월 dd일', { locale: ko })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('detail.expectedReturn')}
              </span>
              <span className="font-medium">
                {format(new Date(checkout.expectedReturnDate), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
            {checkout.actualReturnDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('detail.actualReturn')}</span>
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
          <CardTitle className="text-lg">{t('detail.staffInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('detail.requestedBy')}</p>
                <p className="font-medium">{checkout.user?.name || t('detail.unknownUser')}</p>
              </div>
            </div>
            {checkout.approvedBy && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-brand-ok" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('detail.approver')}</p>
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
          <CardTitle className="text-lg">{t('detail.equipmentList')}</CardTitle>
          <CardDescription>{t('detail.equipmentListDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {checkout.equipment && checkout.equipment.length > 0 ? (
            <div className="space-y-3">
              {checkout.equipment.map((equip) => (
                <div
                  key={equip.id}
                  className={`flex items-center justify-between p-4 ${CHECKOUT_INTERACTION_TOKENS.equipmentItem}`}
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
            <p className="text-muted-foreground text-center py-4">{t('detail.noEquipment')}</p>
          )}
        </CardContent>
      </Card>

      {/* 대여 목적: 상태 확인 기록 */}
      {checkout.purpose === CPVal.RENTAL && conditionChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.conditionHistory')}</CardTitle>
            <CardDescription>{t('detail.conditionHistoryDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conditionChecks.map((check) => (
                <div key={check.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary">{t(`condition.stepLabels.${check.step}`)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(check.checkedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('detail.appearanceStatus')}</span>
                      <Badge
                        variant={check.appearanceStatus === 'normal' ? 'default' : 'destructive'}
                      >
                        {t(`condition.conditionStatus.${check.appearanceStatus}`)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('detail.operationStatus')}</span>
                      <Badge
                        variant={check.operationStatus === 'normal' ? 'default' : 'destructive'}
                      >
                        {t(`condition.conditionStatus.${check.operationStatus}`)}
                      </Badge>
                    </div>
                    {check.accessoriesStatus && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('detail.accessoriesStatus')}
                        </span>
                        <Badge
                          variant={check.accessoriesStatus === 'complete' ? 'default' : 'secondary'}
                        >
                          {t(`condition.accessoriesStatusLabels.${check.accessoriesStatus}`)}
                        </Badge>
                      </div>
                    )}
                    {check.abnormalDetails && (
                      <div
                        className={`mt-2 p-2 rounded text-sm ${CHECKOUT_DETAIL_TOKENS.abnormalContent} ${CONDITION_COMPARISON_TOKENS.abnormalText}`}
                      >
                        <strong>{t('detail.abnormalContent')}</strong> {check.abnormalDetails}
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
      {checkout.purpose === CPVal.RENTAL && conditionChecks.length >= 2 && (
        <ConditionComparisonCard conditionChecks={conditionChecks} />
      )}

      {/* 반입 검사 정보 (반입 완료 후) */}
      {([CSVal.RETURNED, CSVal.RETURN_APPROVED] as CheckoutStatus[]).includes(checkout.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.returnInspection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {checkout.purpose === CPVal.CALIBRATION && (
                <div className="flex items-center gap-2">
                  {checkout.calibrationChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-ok" />
                  ) : (
                    <XCircle className="h-5 w-5 text-brand-critical" />
                  )}
                  <span>{t('detail.calibrationCheck')}</span>
                </div>
              )}
              {checkout.purpose === CPVal.REPAIR && (
                <div className="flex items-center gap-2">
                  {checkout.repairChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-ok" />
                  ) : (
                    <XCircle className="h-5 w-5 text-brand-critical" />
                  )}
                  <span>{t('detail.repairCheck')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {checkout.workingStatusChecked ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-ok" />
                ) : (
                  <XCircle className="h-5 w-5 text-brand-critical" />
                )}
                <span>{t('detail.operationCheck')}</span>
              </div>
            </div>
            {checkout.inspectionNotes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t('detail.inspectionNotes')}</p>
                <p className="mt-1">{checkout.inspectionNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 반려 사유 */}
      {checkout.status === CSVal.REJECTED && checkout.rejectionReason && (
        <Card className={CHECKOUT_DETAIL_TOKENS.rejectionCard}>
          <CardHeader>
            <CardTitle className={`text-lg ${CHECKOUT_DETAIL_TOKENS.rejectionTitle}`}>
              {t('detail.rejectionReason')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{checkout.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* 반출 시작 확인 다이얼로그 (장비별 상태 기록 포함) */}
      <Dialog
        open={dialogState.start}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, start: open }))}
      >
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('dialogs.startTitle')}</DialogTitle>
            <DialogDescription>{t('dialogs.startDescription')}</DialogDescription>
          </DialogHeader>
          {checkout.equipment && checkout.equipment.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {checkout.equipment.map((equip) => (
                <div key={equip.id} className="space-y-1">
                  <Label className="text-sm font-medium">
                    {equip.name} ({equip.managementNumber})
                  </Label>
                  <Textarea
                    placeholder={t('dialogs.startConditionPlaceholder')}
                    value={itemConditionsBefore[equip.id] || ''}
                    onChange={(e) =>
                      setItemConditionsBefore((prev) => ({
                        ...prev,
                        [equip.id]: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState((prev) => ({ ...prev, start: false }))}
            >
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleStart} disabled={startMutation.isPending}>
              {startMutation.isPending ? t('actions.processing') : t('actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반입 승인 확인 다이얼로그 */}
      <Dialog
        open={dialogState.approveReturn}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, approveReturn: open }))}
      >
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('dialogs.returnApproveTitle')}</DialogTitle>
            <DialogDescription>{t('dialogs.returnApproveDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState((prev) => ({ ...prev, approveReturn: false }))}
            >
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleApproveReturn} disabled={approveReturnMutation.isPending}>
              {approveReturnMutation.isPending ? t('actions.processing') : t('actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반입 반려 다이얼로그 */}
      <Dialog
        open={dialogState.rejectReturn}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, rejectReturn: open }))}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setTimeout(() => {
              document.getElementById('returnRejectReason')?.focus();
            }, 0);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('dialogs.returnRejectTitle')}</DialogTitle>
            <DialogDescription>{t('dialogs.returnRejectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="returnRejectReason">{t('dialogs.returnRejectReasonLabel')}</Label>
              <Textarea
                id="returnRejectReason"
                placeholder={t('dialogs.returnRejectReasonPlaceholder')}
                value={returnRejectReason}
                onChange={(e) => setReturnRejectReason(e.target.value)}
                rows={4}
                aria-required="true"
                aria-invalid={!returnRejectReason.trim()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState((prev) => ({ ...prev, rejectReturn: false }))}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectReturn}
              disabled={!returnRejectReason.trim() || rejectReturnMutation.isPending}
            >
              {rejectReturnMutation.isPending ? t('actions.processing') : t('actions.returnReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog
        open={dialogState.reject}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, reject: open }))}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Focus the textarea after dialog opens
            setTimeout(() => {
              document.getElementById('rejectReason')?.focus();
            }, 0);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('dialogs.rejectTitle')}</DialogTitle>
            <DialogDescription>{t('dialogs.rejectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">{t('dialogs.rejectReasonLabel')}</Label>
              <Textarea
                id="rejectReason"
                placeholder={t('dialogs.rejectReasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                aria-required="true"
                aria-invalid={!rejectReason.trim()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState((prev) => ({ ...prev, reject: false }))}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('actions.processing') : t('actions.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
