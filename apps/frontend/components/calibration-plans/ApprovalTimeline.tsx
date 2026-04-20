'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import calibrationPlansApi, { type CalibrationPlan } from '@/lib/api/calibration-plans-api';
import { CalibrationPlansCacheInvalidation } from '@/lib/api/cache-invalidation';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { CheckCircle2, Circle, XCircle, Loader2, Plus, ChevronUp, Check } from 'lucide-react';
import { type UserRole, UserRoleValues as URVal } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  getCalibrationPlanTimelineNodeClasses,
  getCalibrationPlanTimelineConnectorClasses,
  getCalibrationPlanTimelineVerticalConnectorClasses,
  getLoadingSpinnerClasses,
  CALIBRATION_PLAN_TIMELINE_TOKENS,
  CALIBRATION_PLAN_DETAIL_HEADER_TOKENS,
  ACTION_BUTTON_TOKENS,
  COLLAPSIBLE_TOKENS,
} from '@/lib/design-tokens';

interface ApprovalTimelineProps {
  plan: CalibrationPlan;
  planUuid: string;
  onRejectClick: () => void;
}

/**
 * 3단계 승인 타임라인 컴포넌트
 *
 * 작성(TM) → 확인(QM) → 승인(LM) 워크플로우 시각화
 * QM 인라인 확인/의견/반려 액션 포함
 */
export function ApprovalTimeline({ plan, planUuid, onRejectClick }: ApprovalTimelineProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('calibration');
  const { fmtDate } = useDateFormatter();

  const [reviewComment, setReviewComment] = useState('');
  const [showReviewComment, setShowReviewComment] = useState(false);

  const isDraft = plan.status === CPStatus.DRAFT;
  const isRejected = plan.status === CPStatus.REJECTED;
  const isPendingReview = plan.status === CPStatus.PENDING_REVIEW;
  const isPendingApproval = plan.status === CPStatus.PENDING_APPROVAL;
  const isApproved = plan.status === CPStatus.APPROVED;

  const userRole = session?.user?.role as UserRole | undefined;
  const isQualityManager = userRole === URVal.QUALITY_MANAGER;
  const isLabManager = userRole === URVal.LAB_MANAGER;
  const isSystemAdmin = userRole === URVal.SYSTEM_ADMIN;
  const canReview = isPendingReview && (isQualityManager || isLabManager || isSystemAdmin);

  const invalidateAfterChange = () =>
    CalibrationPlansCacheInvalidation.invalidateAfterStatusChange(queryClient, planUuid);

  const reviewMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.reviewCalibrationPlan(planUuid, {
        casVersion: plan.casVersion ?? 0,
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

  // 단계별 상태 매핑 — 3단계 노드 렌더링에 필요한 데이터 구조
  // active: 현재 단계 (정적) — draft 작성 중
  // activeWaiting: 현재 단계 + pulse — 다른 역할의 액션을 기다리는 상태
  type StepState = 'active' | 'activeWaiting' | 'completed' | 'pending' | 'rejected';
  const steps: Array<{
    titleKey: string;
    subtitleKey: string;
    state: StepState;
    timestamp: string | null;
  }> = [
    {
      titleKey: 'planDetail.timeline.step1',
      subtitleKey: 'planDetail.timeline.technicalManager',
      state: isDraft ? 'active' : 'completed',
      timestamp: plan.submittedAt,
    },
    {
      titleKey: 'planDetail.timeline.step2',
      subtitleKey: 'planDetail.timeline.qualityManager',
      state: isPendingReview
        ? 'activeWaiting'
        : isPendingApproval || isApproved
          ? 'completed'
          : isRejected && plan.rejectionStage === 'review'
            ? 'rejected'
            : 'pending',
      timestamp: plan.reviewedAt,
    },
    {
      titleKey: 'planDetail.timeline.step3',
      subtitleKey: 'planDetail.timeline.labManager',
      state: isPendingApproval
        ? 'activeWaiting'
        : isApproved
          ? 'completed'
          : isRejected && plan.rejectionStage === 'approval'
            ? 'rejected'
            : 'pending',
      timestamp: plan.approvedAt,
    },
  ];

  const connectorCompleted = [
    isPendingReview || isPendingApproval || isApproved,
    isPendingApproval || isApproved,
  ];

  const iconMap: Record<StepState, React.ReactNode> = {
    active: <Circle className="h-5 w-5" />,
    activeWaiting: <Circle className="h-5 w-5" />,
    completed: <CheckCircle2 className="h-5 w-5" />,
    rejected: <XCircle className="h-5 w-5" />,
    pending: <Circle className="h-5 w-5" />,
  };

  /** QM 인라인 액션 (2단계에서만 표시) */
  const reviewActions = canReview ? (
    <div className="mt-3 flex flex-col items-center sm:items-center gap-1">
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

      <Collapsible open={showReviewComment} onOpenChange={setShowReviewComment}>
        <CollapsibleTrigger
          className={cn(
            COLLAPSIBLE_TOKENS.trigger.fontSize,
            COLLAPSIBLE_TOKENS.trigger.color,
            COLLAPSIBLE_TOKENS.trigger.gap,
            COLLAPSIBLE_TOKENS.trigger.focus,
            COLLAPSIBLE_TOKENS.trigger.transition,
            'flex items-center mt-1'
          )}
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
            className={cn(
              COLLAPSIBLE_TOKENS.content.input.width,
              COLLAPSIBLE_TOKENS.content.input.fontSize,
              COLLAPSIBLE_TOKENS.content.input.height
            )}
          />
        </CollapsibleContent>
      </Collapsible>

      <Button
        variant="link"
        size="sm"
        onClick={onRejectClick}
        className={cn(
          COLLAPSIBLE_TOKENS.trigger.fontSize,
          COLLAPSIBLE_TOKENS.trigger.transition,
          'text-muted-foreground hover:text-destructive underline mt-1 h-auto p-0'
        )}
        disabled={!plan}
      >
        {t('planDetail.actions.reject')}
      </Button>
    </div>
  ) : null;

  const layout = CALIBRATION_PLAN_TIMELINE_TOKENS.layout;

  return (
    <Card className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.cardElevation}>
      <CardContent className="pt-6">
        {/* ── Desktop: 수평 타임라인 (sm 이상) ── */}
        <div
          className={layout.horizontal}
          role={CALIBRATION_PLAN_TIMELINE_TOKENS.a11y.role}
          aria-label={t('planDetail.timeline.ariaLabel')}
        >
          {steps.map((step, idx) => (
            <React.Fragment key={step.titleKey}>
              {idx > 0 && (
                <div
                  className={getCalibrationPlanTimelineConnectorClasses(
                    connectorCompleted[idx - 1]
                  )}
                  aria-hidden="true"
                />
              )}
              <div
                className="flex flex-col items-center flex-1"
                aria-current={
                  step.state === 'active' || step.state === 'activeWaiting'
                    ? CALIBRATION_PLAN_TIMELINE_TOKENS.a11y.currentStep
                    : undefined
                }
              >
                <div
                  className={getCalibrationPlanTimelineNodeClasses(step.state)}
                  aria-hidden="true"
                >
                  {iconMap[step.state]}
                </div>
                <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.title}>
                  {t(step.titleKey as Parameters<typeof t>[0])}
                </span>
                <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.subtitle}>
                  {t(step.subtitleKey as Parameters<typeof t>[0])}
                </span>
                {step.timestamp && (
                  <time
                    dateTime={step.timestamp}
                    className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.timestamp}
                  >
                    {fmtDate(step.timestamp, 'MM/dd HH:mm')}
                  </time>
                )}
                {idx === 1 && reviewActions}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── Mobile: 수직 타임라인 (sm 미만) ── */}
        <div
          className={layout.vertical}
          role={CALIBRATION_PLAN_TIMELINE_TOKENS.a11y.role}
          aria-label={t('planDetail.timeline.ariaLabel')}
        >
          {steps.map((step, idx) => (
            <React.Fragment key={step.titleKey}>
              {idx > 0 && (
                <div className={layout.verticalConnectorWrap} aria-hidden="true">
                  <div
                    className={getCalibrationPlanTimelineVerticalConnectorClasses(
                      connectorCompleted[idx - 1]
                    )}
                  />
                </div>
              )}
              <div
                className={layout.verticalStep}
                aria-current={
                  step.state === 'active' || step.state === 'activeWaiting'
                    ? CALIBRATION_PLAN_TIMELINE_TOKENS.a11y.currentStep
                    : undefined
                }
              >
                <div
                  className={cn(getCalibrationPlanTimelineNodeClasses(step.state), 'shrink-0')}
                  aria-hidden="true"
                >
                  {iconMap[step.state]}
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-sm font-medium">
                    {t(step.titleKey as Parameters<typeof t>[0])}
                  </span>
                  <span className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.subtitle}>
                    {t(step.subtitleKey as Parameters<typeof t>[0])}
                  </span>
                  {step.timestamp && (
                    <time
                      dateTime={step.timestamp}
                      className={CALIBRATION_PLAN_TIMELINE_TOKENS.label.timestamp}
                    >
                      {fmtDate(step.timestamp, 'MM/dd HH:mm')}
                    </time>
                  )}
                  {idx === 1 && reviewActions}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
