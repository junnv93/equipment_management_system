'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import calibrationPlansApi, { type CalibrationPlan } from '@/lib/api/calibration-plans-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { CalibrationPlansCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/api/error';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { resolveDisplayName } from '@/lib/utils/display-name';
import {
  ArrowLeft,
  Send,
  Trash2,
  Download,
  XCircle,
  ClipboardCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useTranslations } from 'next-intl';
import {
  getActionButtonClasses,
  CALIBRATION_PLAN_STATUS_BADGE_COLORS,
  CALIBRATION_PLAN_DETAIL_HEADER_TOKENS,
  ACTION_BUTTON_TOKENS,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
import { ApprovalTimeline } from './ApprovalTimeline';
import { PlanItemsTable } from './PlanItemsTable';

interface CalibrationPlanDetailClientProps {
  /**
   * Server Component에서 전달받은 교정계획서 UUID
   */
  planUuid: string;
  /**
   * Server Component에서 프리페치한 초기 데이터
   * placeholderData로 사용 → 항상 stale 취급 → 백그라운드 refetch 보장
   */
  initialData?: CalibrationPlan;
}

/**
 * 교정계획서 상세 Client Component
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 planUuid를 전달받음
 * - 모든 인터랙티브 로직(useState, useMutation)을 담당
 *
 * 서브 컴포넌트 구조:
 * - ApprovalTimeline: 3단계 승인 타임라인 + QM 인라인 확인/반려
 * - PlanItemsTable: 항목 테이블 (W-1 진행률, W-2 컬럼그룹, W-3 접이식 버전이력)
 */
export function CalibrationPlanDetailClient({
  planUuid,
  initialData,
}: CalibrationPlanDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  useSession(); // 세션 상태 구독 유지 (인증 변경 시 리렌더)
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const t = useTranslations('calibration');
  const tEquip = useTranslations('equipment');
  const tCommon = useTranslations('common');
  const { fmtDate, fmtDateTime } = useDateFormatter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // ✅ queryKeys 팩토리 사용
  const planQueryKey = queryKeys.calibrationPlans.detail(planUuid);

  // 계획서 상세 조회
  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: planQueryKey,
    queryFn: () => calibrationPlansApi.getCalibrationPlan(planUuid),
    enabled: !!planUuid,
    // 서버 프리페치 데이터를 placeholderData로 사용
    // placeholderData는 항상 stale 취급 → 백그라운드에서 최신 데이터 refetch 보장
    placeholderData: initialData,
    ...QUERY_CONFIG.CALIBRATION_PLAN_DETAIL,
  });

  // 브레드크럼 동적 라벨 설정
  useEffect(() => {
    if (plan) {
      const siteLabel = plan.siteId
        ? tEquip(`siteLabel.${plan.siteId}` as Parameters<typeof tEquip>[0]) || plan.siteId
        : '';
      const yearLabel = plan.year ? t('planDetail.yearWithUnit', { year: plan.year }) : '';
      const label = `${siteLabel} ${yearLabel} ${t('planDetail.breadcrumbSuffix')}`.trim();

      setDynamicLabel(planUuid, label);
    }

    return () => {
      clearDynamicLabel(planUuid);
    };
  }, [plan, planUuid, setDynamicLabel, clearDynamicLabel, t, tEquip]);

  /**
   * 상태 변경 후 공통 캐시 무효화
   */
  const invalidateAfterChange = () =>
    CalibrationPlansCacheInvalidation.invalidateAfterStatusChange(queryClient, planUuid);

  /**
   * 최신 casVersion을 조회하여 반환 (Stale CAS 방지)
   * 다단계 승인(3-step)에서 각 단계마다 casVersion이 증가하므로,
   * 캐시된 plan?.casVersion이 stale일 수 있음 → 항상 최신 조회
   */
  const getLatestCasVersion = async (): Promise<number> => {
    const latest = await calibrationPlansApi.getCalibrationPlan(planUuid);
    return latest.casVersion;
  };

  /**
   * 공통 에러 핸들러 — VERSION_CONFLICT / 일반 에러 분기
   */
  const handleMutationError = (
    error: Error & { response?: { data?: { message?: string } } },
    errorTitleKey: string,
    errorDescKey: string
  ) => {
    if (isConflictError(error)) {
      toast({
        title: t('planDetail.toasts.versionConflict'),
        description: t('planDetail.toasts.versionConflictDesc'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t(errorTitleKey as Parameters<typeof t>[0]),
        description: error.response?.data?.message || t(errorDescKey as Parameters<typeof t>[0]),
        variant: 'destructive',
      });
    }
    invalidateAfterChange();
  };

  // 검토 요청 뮤테이션 (기술책임자 → 품질책임자)
  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const casVersion = await getLatestCasVersion();
      return calibrationPlansApi.submitForReview(planUuid, { casVersion });
    },
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.submitForReviewSuccess'),
        description: t('planDetail.toasts.submitForReviewSuccessDesc'),
      });
      invalidateAfterChange();
      setIsSubmitDialogOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) =>
      handleMutationError(
        error,
        'planDetail.toasts.submitForReviewError',
        'planDetail.toasts.submitForReviewErrorDesc'
      ),
  });

  // 최종 승인 뮤테이션 (시험소장)
  const approveMutation = useMutation({
    mutationFn: async () => {
      const casVersion = await getLatestCasVersion();
      return calibrationPlansApi.approveCalibrationPlan(planUuid, { casVersion });
    },
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.approveSuccess'),
        description: t('planDetail.toasts.approveSuccessDesc'),
      });
      invalidateAfterChange();
      setIsApproveDialogOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) =>
      handleMutationError(
        error,
        'planDetail.toasts.approveError',
        'planDetail.toasts.approveErrorDesc'
      ),
  });

  // 반려 뮤테이션 (품질책임자 또는 시험소장)
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const casVersion = await getLatestCasVersion();
      return calibrationPlansApi.rejectCalibrationPlan(planUuid, { casVersion, rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.rejectSuccess'),
        description: t('planDetail.toasts.rejectSuccessDesc'),
      });
      invalidateAfterChange();
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) =>
      handleMutationError(
        error,
        'planDetail.toasts.rejectError',
        'planDetail.toasts.rejectErrorDesc'
      ),
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => calibrationPlansApi.deleteCalibrationPlan(planUuid),
    onSuccess: async () => {
      await CalibrationPlansCacheInvalidation.invalidateAfterStatusChange(queryClient, planUuid);
      toast({
        title: t('planDetail.toasts.deleteSuccess'),
        description: t('planDetail.toasts.deleteSuccessDesc'),
      });
      router.push('/calibration-plans');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.deleteError'),
        description: error.response?.data?.message || t('planDetail.toasts.deleteErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const handleExportExcel = async () => {
    try {
      await calibrationPlansApi.downloadExcel(planUuid);
    } catch {
      toast({
        variant: 'destructive',
        description: tCommon('errors.downloadFailed'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className={getPageContainerClasses()}>
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className={getPageContainerClasses('list', '')}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('planDetail.error.title')}</AlertTitle>
          <AlertDescription>{t('planDetail.error.loadFailed')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ✅ SSOT 상태 상수 사용
  const isDraft = plan.status === CPStatus.DRAFT;
  const isRejected = plan.status === CPStatus.REJECTED;
  const isPendingReview = plan.status === CPStatus.PENDING_REVIEW;
  const isPendingApproval = plan.status === CPStatus.PENDING_APPROVAL;
  const isApproved = plan.status === CPStatus.APPROVED;

  // 액션 가능 여부 — 상태×Permission SSOT (role-permissions.ts 자동 반영)
  const canSubmitForReview = (isDraft || isRejected) && can(Permission.SUBMIT_CALIBRATION_PLAN);
  const canApprove = isPendingApproval && can(Permission.APPROVE_CALIBRATION_PLAN);
  const canReject =
    (isPendingApproval || isPendingReview) && can(Permission.REJECT_CALIBRATION_PLAN);
  const canDelete = isDraft && can(Permission.DELETE_CALIBRATION_PLAN);

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 — Design Token 적용 */}
      <div className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.container}>
        <div className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.titleArea}>
          <Button variant="ghost" size="icon" asChild aria-label={t('planDetail.backToList')}>
            <Link href="/calibration-plans">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.title}>
                {t('planDetail.yearWithUnit', { year: plan.year })}{' '}
                {tEquip(`siteLabel.${plan.siteId}` as Parameters<typeof tEquip>[0])}{' '}
                {t('planDetail.breadcrumbSuffix')}
              </h1>
              <Badge className={CALIBRATION_PLAN_STATUS_BADGE_COLORS[plan.status]}>
                {t(`planStatus.${plan.status}` as Parameters<typeof t>[0])}
              </Badge>
            </div>
            <p className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.meta}>
              {t('planDetail.header.author')}: {resolveDisplayName(plan.authorName, plan.createdBy)}{' '}
              | {t('planDetail.header.createdAt')}:{' '}
              <time dateTime={plan.createdAt}>{fmtDate(plan.createdAt)}</time>
            </p>
          </div>
        </div>
        <div className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.actionsGroup}>
          {isApproved && (
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className={getActionButtonClasses('ghost')}
            >
              <Download className={`${ACTION_BUTTON_TOKENS.ghost.iconSize} mr-2`} />
              {t('planDetail.actions.exportExcel')}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
              className={getActionButtonClasses('destructive')}
            >
              <Trash2 className={`${ACTION_BUTTON_TOKENS.destructive.iconSize} mr-2`} />
              {t('planDetail.actions.delete')}
            </Button>
          )}
          {canReject && (
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={rejectMutation.isPending}
              className={getActionButtonClasses('destructive')}
            >
              <XCircle className={`${ACTION_BUTTON_TOKENS.destructive.iconSize} mr-2`} />
              {t('planDetail.actions.reject')}
            </Button>
          )}
          {canSubmitForReview && (
            <Button
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={submitForReviewMutation.isPending}
              className={getActionButtonClasses('primary')}
            >
              <Send className={`${ACTION_BUTTON_TOKENS.primary.iconSize} mr-2`} />
              {t('planDetail.actions.submitForReview')}
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => setIsApproveDialogOpen(true)}
              disabled={approveMutation.isPending}
              className={getActionButtonClasses('primary')}
            >
              <UserCheck className={`${ACTION_BUTTON_TOKENS.primary.iconSize} mr-2`} />
              {t('planDetail.actions.finalApprove')}
            </Button>
          )}
        </div>
      </div>

      {/* 3단계 승인 타임라인 */}
      <ApprovalTimeline
        plan={plan}
        planUuid={planUuid}
        onRejectClick={() => setIsRejectDialogOpen(true)}
      />

      {/* 반려 사유 표시 */}
      {isRejected && plan.rejectionReason && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {t('planDetail.rejection.title')} (
            {plan.rejectionStage === 'review'
              ? t('planDetail.rejection.reviewStage')
              : t('planDetail.rejection.approvalStage')}
            )
          </AlertTitle>
          <AlertDescription>{plan.rejectionReason}</AlertDescription>
        </Alert>
      )}

      {/* 확인 의견 표시 */}
      {plan.reviewComment && (isPendingApproval || isApproved) && (
        <Alert>
          <ClipboardCheck className="h-4 w-4" />
          <AlertTitle>{t('planDetail.reviewComment')}</AlertTitle>
          <AlertDescription>{plan.reviewComment}</AlertDescription>
        </Alert>
      )}

      {/* 승인 정보 */}
      {plan.approvedAt && (
        <Card className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.cardElevation}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-sm">
              <span>
                {t('planDetail.approvalInfo.approver')}: {plan.approvedBy}
              </span>
              <span>
                {t('planDetail.approvalInfo.approvedAt')}:{' '}
                <time dateTime={plan.approvedAt}>{fmtDateTime(plan.approvedAt)}</time>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 항목 테이블 (W-1 진행률 + W-2 컬럼그룹 + W-3 접이식 버전이력) */}
      <PlanItemsTable plan={plan} planUuid={planUuid} />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('planDetail.dialogs.delete.title')}</DialogTitle>
            <DialogDescription>{t('planDetail.dialogs.delete.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('planDetail.actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {t('planDetail.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 검토 요청 확인 다이얼로그 (기술책임자 → 품질책임자) */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('planDetail.dialogs.submit.title')}</DialogTitle>
            <DialogDescription>{t('planDetail.dialogs.submit.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              {t('planDetail.actions.cancel')}
            </Button>
            <Button
              onClick={() => submitForReviewMutation.mutate()}
              disabled={submitForReviewMutation.isPending}
            >
              {t('planDetail.actions.submitForReview')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 최종 승인 다이얼로그 (시험소장) */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('planDetail.dialogs.approve.title')}</DialogTitle>
            <DialogDescription>{t('planDetail.dialogs.approve.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              {t('planDetail.actions.cancel')}
            </Button>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              {t('planDetail.actions.finalApprove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 (품질책임자/시험소장) */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('planDetail.dialogs.reject.title')}</DialogTitle>
            <DialogDescription>{t('planDetail.dialogs.reject.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              {t('planDetail.dialogs.reject.reasonLabel')}
            </label>
            <Textarea
              className="mt-2"
              rows={3}
              placeholder={t('planDetail.dialogs.reject.reasonPlaceholder')}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {t('planDetail.actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {t('planDetail.actions.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
