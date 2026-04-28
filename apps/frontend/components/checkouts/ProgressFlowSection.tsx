'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type CheckoutStatus,
  type CheckoutPurpose,
  type NextStepDescriptor,
  type UserRole,
  CheckoutStatusValues as CSVal,
} from '@equipment-management/schemas';

import { useCheckoutProgressSteps } from '@/hooks/use-checkout-progress-steps';
import CheckoutProgressStepper from './CheckoutProgressStepper';

// ============================================================================
// 입력 타입
// ============================================================================
//
// 본 컴포넌트는 CheckoutDetailClient 의 진행 흐름 영역을 캡슐화 — 헤더 + stepper.
// detail 페이지 내 상태 변화(useQuery refetch) 시 본 섹션만 재렌더되도록 React.memo.

interface CheckoutLike {
  readonly id: string;
  readonly status: CheckoutStatus;
  readonly purpose: CheckoutPurpose;
  readonly checkoutDate?: string | Date | null;
  readonly expectedReturnDate?: string | Date | null;
  readonly createdAt: string | Date;
  readonly user?: { readonly name?: string | null } | null;
  readonly approvedBy?: { readonly name?: string | null } | null;
}

interface ProgressFlowSectionProps {
  readonly checkout: CheckoutLike;
  /** server-resolved NextStepDescriptor — currentStepIndex/availableToCurrentUser 권위 */
  readonly descriptor: NextStepDescriptor;
  /** 현재 사용자 role — descriptor.availableToCurrentUser 와 함께 isYourTurn 결정 */
  readonly role?: UserRole;
}

// ============================================================================
// 컴포넌트
// ============================================================================

function ProgressFlowSection({ checkout, descriptor, role }: ProgressFlowSectionProps) {
  const t = useTranslations('checkouts');
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;

  // late 판정 — 서버 descriptor.urgency 가 'critical' 이거나 status === overdue
  const isOverdue =
    descriptor.urgency === 'critical' || checkout.status === CSVal.OVERDUE;

  const steps = useCheckoutProgressSteps({
    status: checkout.status,
    purpose: checkout.purpose,
    descriptor,
    requester: checkout.user
      ? { name: checkout.user.name, role: role ?? null }
      : null,
    requestedAt: checkout.createdAt,
    checkoutDate: checkout.checkoutDate,
    expectedReturnDate: checkout.expectedReturnDate,
    // Phase 11 에서 audit timeline endpoint 합류 시 여기에 events 주입
    auditEvents: undefined,
    currentUserCanAct: descriptor.availableToCurrentUser,
    isOverdue,
  });

  // current/late 단계 인덱스 — 서버 권위 사용 (1-based → 0-based)
  const currentIndex0 = useMemo(
    () => Math.max(0, descriptor.currentStepIndex - 1),
    [descriptor.currentStepIndex]
  );

  // sessionUserId 는 향후 ApprovalLineList(Phase 9) 와 함께 isYourTurn 정밀화에 활용 — 현재는 useQuery 안정화 핵 fallback
  void sessionUserId;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold tracking-tight">
            {t('detail.progressFlow')}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums shrink-0">
          {t('detail.progressFlowSubtitle', {
            current: currentIndex0 + 1,
            total: descriptor.totalSteps,
          })}
        </p>
      </CardHeader>
      <CardContent className="pt-2 pb-5">
        <CheckoutProgressStepper steps={steps} />
      </CardContent>
    </Card>
  );
}

export default memo(ProgressFlowSection);
