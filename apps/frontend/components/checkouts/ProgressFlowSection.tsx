'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type CheckoutStatus,
  type CheckoutPurpose,
  type NextStepDescriptor,
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
  /**
   * server-resolved NextStepDescriptor — currentStepIndex / availableToCurrentUser 권위.
   * "내 차례" 판정은 본 descriptor.availableToCurrentUser 단일 출처. viewer role을 별도 prop으로 받지 않음
   * (받아도 신청자 role과 의미가 다르고, descriptor가 이미 server-side 권한 평가 결과를 포함).
   */
  readonly descriptor: NextStepDescriptor;
}

// ============================================================================
// 컴포넌트
// ============================================================================

function ProgressFlowSection({ checkout, descriptor }: ProgressFlowSectionProps) {
  const t = useTranslations('checkouts');

  // late 판정 — 서버 descriptor.urgency 가 'critical' 이거나 status === overdue
  const isOverdue =
    descriptor.urgency === 'critical' || checkout.status === CSVal.OVERDUE;

  const steps = useCheckoutProgressSteps({
    status: checkout.status,
    purpose: checkout.purpose,
    descriptor,
    // requester.role 은 의미상 신청자 본인의 역할(시험실무자/시험책임자 등)이어야 함.
    // 현재 viewer role(`role` prop)은 신청자 role과 다를 수 있으므로 매핑하지 않음.
    // 정확한 신청자 역할은 Phase 11 audit log endpoint(`auditEvents[].actorRole`)에서 인입.
    requester: checkout.user ? { name: checkout.user.name, role: null } : null,
    requestedAt: checkout.createdAt,
    checkoutDate: checkout.checkoutDate,
    expectedReturnDate: checkout.expectedReturnDate,
    // Phase 11 에서 audit timeline endpoint 합류 시 여기에 events 주입
    auditEvents: undefined,
    currentUserCanAct: descriptor.availableToCurrentUser,
    isOverdue,
  });

  // current/late 단계 인덱스 — 서버 권위 사용 (1-based → 0-based). 단순 산술이라 메모 불필요.
  const currentIndex0 = Math.max(0, descriptor.currentStepIndex - 1);

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
