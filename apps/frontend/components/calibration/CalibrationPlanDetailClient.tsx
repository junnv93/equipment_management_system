'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import calibrationPlansApi, {
  type CalibrationPlan,
  type CalibrationPlanItem,
  CALIBRATION_PLAN_STATUS_COLORS,
} from '@/lib/api/calibration-plans-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { CalibrationPlansCacheInvalidation } from '@/lib/api/cache-invalidation';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { formatDate } from '@/lib/utils/date';
import {
  ArrowLeft,
  Send,
  Trash2,
  CheckCircle2,
  Edit2,
  Save,
  X,
  AlertCircle,
  FileText,
  Download,
  Circle,
  XCircle,
  ClipboardCheck,
  UserCheck,
  Loader2,
  Plus,
  ChevronUp,
  Check,
} from 'lucide-react';
import type { UserRole } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import {
  getCalibrationPlanTimelineNodeClasses,
  getCalibrationPlanTimelineConnectorClasses,
  getActionButtonClasses,
  getLoadingSpinnerClasses,
  CALIBRATION_PLAN_TIMELINE_TOKENS,
  ACTION_BUTTON_TOKENS,
  COLLAPSIBLE_TOKENS,
} from '@/lib/design-tokens';

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
 */
export function CalibrationPlanDetailClient({
  planUuid,
  initialData,
}: CalibrationPlanDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const t = useTranslations('calibration');
  const tEquip = useTranslations('equipment');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingAgency, setEditingAgency] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewComment, setShowReviewComment] = useState(false);
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
      // 교정 계획서 정보를 사용해서 의미있는 라벨 생성
      const siteLabel = plan.siteId
        ? tEquip(`siteLabel.${plan.siteId}` as Parameters<typeof tEquip>[0]) || plan.siteId
        : '';
      const yearLabel = plan.year ? t('planDetail.yearWithUnit', { year: plan.year }) : '';
      const label = `${siteLabel} ${yearLabel} ${t('planDetail.breadcrumbSuffix')}`.trim();

      setDynamicLabel(planUuid, label);
    }

    // 컴포넌트 언마운트 시 라벨 제거
    return () => {
      clearDynamicLabel(planUuid);
    };
  }, [plan, planUuid, setDynamicLabel, clearDynamicLabel, t, tEquip]);

  /**
   * 상태 변경 후 공통 캐시 무효화
   */
  const invalidateAfterChange = () =>
    CalibrationPlansCacheInvalidation.invalidateAfterStatusChange(queryClient, planUuid);

  // ✅ userId 제거 (서버에서 JWT 추출), casVersion 추가

  // 검토 요청 뮤테이션 (기술책임자 → 품질책임자)
  const submitForReviewMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.submitForReview(planUuid, {
        casVersion: plan?.casVersion ?? 0,
      }),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.submitForReviewSuccess'),
        description: t('planDetail.toasts.submitForReviewSuccessDesc'),
      });
      invalidateAfterChange();
      setIsSubmitDialogOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.submitForReviewError'),
        description:
          error.response?.data?.message || t('planDetail.toasts.submitForReviewErrorDesc'),
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 확인 완료 뮤테이션 (품질책임자)
  const reviewMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.reviewCalibrationPlan(planUuid, {
        casVersion: plan?.casVersion ?? 0,
        reviewComment: reviewComment || undefined,
      }),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.reviewSuccess'),
        description: t('planDetail.toasts.reviewSuccessDesc'),
      });
      invalidateAfterChange();
      setShowReviewComment(false);
      setReviewComment('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.reviewError'),
        description: error.response?.data?.message || t('planDetail.toasts.reviewErrorDesc'),
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 최종 승인 뮤테이션 (시험소장)
  const approveMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.approveCalibrationPlan(planUuid, {
        casVersion: plan?.casVersion ?? 0,
      }),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.approveSuccess'),
        description: t('planDetail.toasts.approveSuccessDesc'),
      });
      invalidateAfterChange();
      setIsApproveDialogOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.approveError'),
        description: error.response?.data?.message || t('planDetail.toasts.approveErrorDesc'),
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 반려 뮤테이션 (품질책임자 또는 시험소장)
  const rejectMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.rejectCalibrationPlan(planUuid, {
        casVersion: plan?.casVersion ?? 0,
        rejectionReason,
      }),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.rejectSuccess'),
        description: t('planDetail.toasts.rejectSuccessDesc'),
      });
      invalidateAfterChange();
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.rejectError'),
        description: error.response?.data?.message || t('planDetail.toasts.rejectErrorDesc'),
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => calibrationPlansApi.deleteCalibrationPlan(planUuid),
    onSuccess: () => {
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

  // 항목 수정 뮤테이션
  const updateItemMutation = useMutation({
    mutationFn: ({
      itemUuid,
      data,
    }: {
      itemUuid: string;
      data: { plannedCalibrationAgency?: string; notes?: string };
    }) => calibrationPlansApi.updatePlanItem(planUuid, itemUuid, data),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.updateItemSuccess'),
        description: t('planDetail.toasts.updateItemSuccessDesc'),
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
      setEditingItemId(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.updateItemError'),
        description: error.response?.data?.message || t('planDetail.toasts.updateItemErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  // 항목 확인 뮤테이션
  const confirmItemMutation = useMutation({
    mutationFn: (itemUuid: string) =>
      calibrationPlansApi.confirmPlanItem(planUuid, itemUuid, {
        casVersion: plan?.casVersion ?? 0,
      }),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.confirmItemSuccess'),
        description: t('planDetail.toasts.confirmItemSuccessDesc'),
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.confirmItemError'),
        description: error.response?.data?.message || t('planDetail.toasts.confirmItemErrorDesc'),
        variant: 'destructive',
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
    },
  });

  const handleStartEdit = (item: CalibrationPlanItem) => {
    setEditingItemId(item.id);
    setEditingAgency(item.plannedCalibrationAgency || '');
    setEditingNotes(item.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    updateItemMutation.mutate({
      itemUuid: editingItemId,
      data: {
        plannedCalibrationAgency: editingAgency,
        notes: editingNotes,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingAgency('');
    setEditingNotes('');
  };

  const handlePrintView = () => {
    calibrationPlansApi.openPrintView(planUuid);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
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
      <div className="container mx-auto py-6">
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
  const items = plan.items || [];

  // 사용자 역할 확인
  const userRole = session?.user?.role as UserRole | undefined;
  const isTechnicalManager = userRole === 'technical_manager';
  const isQualityManager = userRole === 'quality_manager';
  const isLabManager = userRole === 'lab_manager';
  const isSystemAdmin = userRole === 'system_admin';

  // 역할별 액션 가능 여부
  const canSubmitForReview =
    (isDraft || isRejected) && (isTechnicalManager || isLabManager || isSystemAdmin);
  const canReview = isPendingReview && (isQualityManager || isLabManager || isSystemAdmin);
  const canApprove = isPendingApproval && (isLabManager || isSystemAdmin);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calibration-plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('planDetail.yearWithUnit', { year: plan.year })}{' '}
                {tEquip(`siteLabel.${plan.siteId}` as Parameters<typeof tEquip>[0])}{' '}
                {t('planDetail.breadcrumbSuffix')}
              </h1>
              <Badge className={CALIBRATION_PLAN_STATUS_COLORS[plan.status]}>
                {t(`planStatus.${plan.status}` as Parameters<typeof t>[0])}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t('planDetail.header.author')}: {plan.createdBy} | {t('planDetail.header.createdAt')}
              : <time dateTime={plan.createdAt}>{formatDate(plan.createdAt, 'yyyy-MM-dd')}</time>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isApproved && (
            <Button
              variant="outline"
              onClick={handlePrintView}
              className={getActionButtonClasses('ghost')}
            >
              <Download className={`${ACTION_BUTTON_TOKENS.ghost.iconSize} mr-2`} />
              {t('planDetail.actions.printPdf')}
            </Button>
          )}
          {/* 작성 중/반려됨 상태: 삭제 및 검토 요청 (기술책임자/시험소장) */}
          {(isDraft || isRejected) && (
            <>
              {isDraft && (
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
              {canSubmitForReview && (
                <Button
                  onClick={() => setIsSubmitDialogOpen(true)}
                  disabled={submitForReviewMutation.isPending || !plan}
                  className={getActionButtonClasses('primary')}
                >
                  <Send className={`${ACTION_BUTTON_TOKENS.primary.iconSize} mr-2`} />
                  {t('planDetail.actions.submitForReview')}
                </Button>
              )}
            </>
          )}
          {/* 확인 대기 상태: 품질책임자는 타임라인에서 원클릭 확인 */}
          {/* 승인 대기 상태: 최종 승인/반려 (시험소장) */}
          {canApprove && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={rejectMutation.isPending || !plan}
                className={getActionButtonClasses('destructive')}
              >
                <XCircle className={`${ACTION_BUTTON_TOKENS.destructive.iconSize} mr-2`} />
                {t('planDetail.actions.reject')}
              </Button>
              <Button
                onClick={() => setIsApproveDialogOpen(true)}
                disabled={approveMutation.isPending || !plan}
                className={getActionButtonClasses('primary')}
              >
                <UserCheck className={`${ACTION_BUTTON_TOKENS.primary.iconSize} mr-2`} />
                {t('planDetail.actions.finalApprove')}
              </Button>
            </>
          )}
          {/* 승인 대기 상태에서 품질책임자도 반려 가능 */}
          {isPendingApproval && isQualityManager && !isLabManager && (
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={rejectMutation.isPending || !plan}
              className={getActionButtonClasses('destructive')}
            >
              <XCircle className={`${ACTION_BUTTON_TOKENS.destructive.iconSize} mr-2`} />
              {t('planDetail.actions.reject')}
            </Button>
          )}
        </div>
      </div>

      {/* 3단계 승인 타임라인 — Design Token v2 적용 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {/* 1단계: 작성 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={getCalibrationPlanTimelineNodeClasses(isDraft ? 'active' : 'completed')}
              >
                {isDraft ? <Circle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.title}>
                {t('planDetail.timeline.step1')}
              </span>
              <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.subtitle}>
                {t('planDetail.timeline.technicalManager')}
              </span>
              {plan.submittedAt && (
                <time
                  dateTime={plan.submittedAt}
                  className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.timestamp}
                >
                  {formatDate(plan.submittedAt, 'MM/dd HH:mm')}
                </time>
              )}
            </div>

            {/* 연결선 1-2 */}
            <div
              className={getCalibrationPlanTimelineConnectorClasses(
                isPendingReview || isPendingApproval || isApproved
              )}
            />

            {/* 2단계: 확인 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={getCalibrationPlanTimelineNodeClasses(
                  isPendingReview
                    ? 'active'
                    : isPendingApproval || isApproved
                      ? 'completed'
                      : isRejected && plan.rejectionStage === 'review'
                        ? 'rejected'
                        : 'pending'
                )}
              >
                {isPendingReview ? (
                  <Circle className="h-5 w-5" />
                ) : isPendingApproval || isApproved ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isRejected && plan.rejectionStage === 'review' ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.title}>
                {t('planDetail.timeline.step2')}
              </span>
              <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.subtitle}>
                {t('planDetail.timeline.qualityManager')}
              </span>
              {plan.reviewedAt && (
                <time
                  dateTime={plan.reviewedAt}
                  className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.timestamp}
                >
                  {formatDate(plan.reviewedAt, 'MM/dd HH:mm')}
                </time>
              )}

              {/* 품질책임자용 인라인 확인 버튼 — Design Token 적용 */}
              {canReview && (
                <div className="mt-3 flex flex-col items-center gap-1">
                  <Button
                    size="sm"
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewMutation.isPending || !plan}
                    className={`${ACTION_BUTTON_TOKENS.inline.size} w-24`}
                    aria-label={t('planDetail.timeline.ariaConfirmReview')}
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className={getLoadingSpinnerClasses()} aria-hidden="true" />
                    ) : (
                      <>
                        <Check className={ACTION_BUTTON_TOKENS.inline.iconSize} />
                        {t('planDetail.actions.confirmReview')}
                      </>
                    )}
                  </Button>

                  {/* 확장 가능한 의견란 — Collapsible Token 적용 */}
                  <Collapsible open={showReviewComment} onOpenChange={setShowReviewComment}>
                    <CollapsibleTrigger
                      className={`${COLLAPSIBLE_TOKENS.trigger.fontSize} ${COLLAPSIBLE_TOKENS.trigger.color} ${COLLAPSIBLE_TOKENS.trigger.gap} ${COLLAPSIBLE_TOKENS.trigger.focus} ${COLLAPSIBLE_TOKENS.trigger.transition} flex items-center mt-1`}
                    >
                      {showReviewComment ? (
                        <>
                          <ChevronUp className={COLLAPSIBLE_TOKENS.trigger.iconSize} />
                          {t('planDetail.actions.collapseComment')}
                        </>
                      ) : (
                        <>
                          <Plus className={COLLAPSIBLE_TOKENS.trigger.iconSize} />
                          {t('planDetail.actions.addComment')}
                        </>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className={COLLAPSIBLE_TOKENS.content.marginTop}>
                      <Input
                        placeholder={t('planDetail.placeholders.reviewComment')}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className={`${COLLAPSIBLE_TOKENS.content.input.width} ${COLLAPSIBLE_TOKENS.content.input.fontSize} ${COLLAPSIBLE_TOKENS.content.input.height}`}
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <button
                    type="button"
                    onClick={() => setIsRejectDialogOpen(true)}
                    className={`${COLLAPSIBLE_TOKENS.trigger.fontSize} text-muted-foreground hover:text-destructive underline mt-1 ${COLLAPSIBLE_TOKENS.trigger.transition} ${COLLAPSIBLE_TOKENS.trigger.focus}`}
                    disabled={rejectMutation.isPending || !plan}
                  >
                    {t('planDetail.actions.reject')}
                  </button>
                </div>
              )}
            </div>

            {/* 연결선 2-3 */}
            <div
              className={getCalibrationPlanTimelineConnectorClasses(
                isPendingApproval || isApproved
              )}
            />

            {/* 3단계: 승인 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={getCalibrationPlanTimelineNodeClasses(
                  isPendingApproval
                    ? 'active'
                    : isApproved
                      ? 'completed'
                      : isRejected && plan.rejectionStage === 'approval'
                        ? 'rejected'
                        : 'pending'
                )}
              >
                {isPendingApproval ? (
                  <Circle className="h-5 w-5" />
                ) : isApproved ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isRejected && plan.rejectionStage === 'approval' ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.title}>
                {t('planDetail.timeline.step3')}
              </span>
              <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.subtitle}>
                {t('planDetail.timeline.labManager')}
              </span>
              {plan.approvedAt && (
                <time
                  dateTime={plan.approvedAt}
                  className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.timestamp}
                >
                  {formatDate(plan.approvedAt, 'MM/dd HH:mm')}
                </time>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-sm">
              <span>
                {t('planDetail.approvalInfo.approver')}: {plan.approvedBy}
              </span>
              <span>
                {t('planDetail.approvalInfo.approvedAt')}:{' '}
                <time dateTime={plan.approvedAt}>
                  {formatDate(plan.approvedAt, 'yyyy-MM-dd HH:mm')}
                </time>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 항목 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('planDetail.items.title')}</CardTitle>
          <CardDescription>
            {t('planDetail.items.description', { count: items.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('planDetail.items.empty')}</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">
                      {t('planDetail.items.headers.sequence')}
                    </TableHead>
                    <TableHead>{t('planDetail.items.headers.managementNumber')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.equipmentName')}</TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      {t('planDetail.items.headers.snapshot')}
                    </TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      {t('planDetail.items.headers.plan')}
                    </TableHead>
                    <TableHead>{t('planDetail.items.headers.notes')}</TableHead>
                    {(isDraft || isApproved) && (
                      <TableHead className="w-[100px]">
                        {t('planDetail.items.headers.action')}
                      </TableHead>
                    )}
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead>{t('planDetail.items.headers.validityDate')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.calibrationCycle')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.calibrationAgency')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.plannedDate')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.plannedAgency')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.confirmation')}</TableHead>
                    <TableHead>{t('planDetail.items.headers.actualDate')}</TableHead>
                    {(isDraft || isApproved) && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: CalibrationPlanItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.sequenceNumber}</TableCell>
                      <TableCell className="font-mono">
                        {item.equipment?.managementNumber || '-'}
                      </TableCell>
                      <TableCell>{item.equipment?.name || '-'}</TableCell>
                      <TableCell>
                        {item.snapshotValidityDate
                          ? formatDate(item.snapshotValidityDate, 'yyyy-MM-dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.snapshotCalibrationCycle
                          ? t('planDetail.items.monthUnit', {
                              count: item.snapshotCalibrationCycle,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>{item.snapshotCalibrationAgency || '-'}</TableCell>
                      <TableCell>
                        {item.plannedCalibrationDate
                          ? formatDate(item.plannedCalibrationDate, 'yyyy-MM-dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            value={editingAgency}
                            onChange={(e) => setEditingAgency(e.target.value)}
                            className="w-[100px]"
                          />
                        ) : (
                          item.plannedCalibrationAgency || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.confirmedBy ? (
                          <Badge variant="outline" className="bg-brand-ok/10">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t('planDetail.items.confirmed')}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder={t('planDetail.placeholders.notes')}
                            className="w-[100px]"
                          />
                        ) : (
                          <>
                            {item.actualCalibrationDate
                              ? formatDate(item.actualCalibrationDate, 'yyyy-MM-dd')
                              : item.notes || '-'}
                          </>
                        )}
                      </TableCell>
                      {(isDraft || isApproved) && (
                        <TableCell>
                          {editingItemId === item.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateItemMutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {isDraft && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              {isApproved && !item.confirmedBy && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmItemMutation.mutate(item.id)}
                                  disabled={confirmItemMutation.isPending}
                                  title={t('planDetail.items.confirm')}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
            <textarea
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
