'use client';

import { useState } from 'react';
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
import { formatDate } from '@/lib/utils/date';
import { CheckCircle2, Circle, XCircle, Loader2, Plus, ChevronUp, Check } from 'lucide-react';
import type { UserRole } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import {
  getCalibrationPlanTimelineNodeClasses,
  getCalibrationPlanTimelineConnectorClasses,
  getLoadingSpinnerClasses,
  CALIBRATION_PLAN_TIMELINE_TOKENS,
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

  const [reviewComment, setReviewComment] = useState('');
  const [showReviewComment, setShowReviewComment] = useState(false);

  const isDraft = plan.status === CPStatus.DRAFT;
  const isRejected = plan.status === CPStatus.REJECTED;
  const isPendingReview = plan.status === CPStatus.PENDING_REVIEW;
  const isPendingApproval = plan.status === CPStatus.PENDING_APPROVAL;
  const isApproved = plan.status === CPStatus.APPROVED;

  const userRole = session?.user?.role as UserRole | undefined;
  const isQualityManager = userRole === 'quality_manager';
  const isLabManager = userRole === 'lab_manager';
  const isSystemAdmin = userRole === 'system_admin';
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

  return (
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

            {/* QM 인라인 액션 */}
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

                <Button
                  variant="link"
                  size="sm"
                  onClick={onRejectClick}
                  className={`${COLLAPSIBLE_TOKENS.trigger.fontSize} text-muted-foreground hover:text-destructive underline mt-1 h-auto p-0 ${COLLAPSIBLE_TOKENS.trigger.transition}`}
                  disabled={!plan}
                >
                  {t('planDetail.actions.reject')}
                </Button>
              </div>
            )}
          </div>

          {/* 연결선 2-3 */}
          <div
            className={getCalibrationPlanTimelineConnectorClasses(isPendingApproval || isApproved)}
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
  );
}
