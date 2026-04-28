'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type CheckoutStatus,
  type CheckoutPurpose,
  type NextStepDescriptor,
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

  // hook이 isOverdue/currentUserCanAct/termination 모두 descriptor에서 직접 도출 — SSOT 강화.
  const steps = useCheckoutProgressSteps({
    status: checkout.status,
    purpose: checkout.purpose,
    descriptor,
    // requester.role 은 신청자 본인의 역할이어야 함 (viewer role과 다름). 정확한 role은 Phase 11
    // audit log endpoint(`auditEvents[].actorRole`)에서 인입. 그 전까지는 null.
    requester: checkout.user ? { name: checkout.user.name, role: null } : null,
    requestedAt: checkout.createdAt,
    checkoutDate: checkout.checkoutDate,
    expectedReturnDate: checkout.expectedReturnDate,
    auditEvents: undefined,
  });

  // 표시용 current/total — descriptor.currentStepIndex 1-based 그대로 + 클램프.
  // hook과 동일 클램프 정책으로 헤더와 stepper 인덱스 일치 보장.
  const totalSteps = Math.max(1, descriptor.totalSteps);
  const displayCurrent = Math.min(totalSteps, Math.max(1, descriptor.currentStepIndex));

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
            current: displayCurrent,
            total: totalSteps,
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
