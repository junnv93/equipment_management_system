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

/** actor 공통 shape — name + team 정보로 stepper role 문자열 구성 */
interface ActorLike {
  readonly name?: string | null;
  readonly teamName?: string | null;
  readonly teamSite?: string | null;
}

interface CheckoutLike {
  readonly id: string;
  readonly status: CheckoutStatus;
  readonly purpose: CheckoutPurpose;
  readonly createdAt: string | Date;
  readonly user?: {
    readonly name?: string | null;
    readonly team?: { readonly name?: string | null; readonly site?: string | null } | null;
  } | null;
  // timestamp 필드
  readonly checkoutDate?: string | Date | null;
  readonly expectedReturnDate?: string | Date | null;
  readonly borrowerApprovedAt?: string | null;
  readonly approvedAt?: string | null;
  readonly lenderConfirmedAt?: string | null;
  readonly actualReturnDate?: string | null;
  readonly returnApprovedAt?: string | null;
  // actor hydration 필드 (BE Phase 2 — 없으면 undefined/null, graceful degrade)
  readonly borrowerApprover?: ActorLike | null;
  readonly approver?: ActorLike | null;
  readonly approvedBy?: { readonly name?: string | null } | null;
  readonly lenderConfirmer?: ActorLike | null;
  readonly returner?: ActorLike | null;
  readonly returnApprover?: ActorLike | null;
}

/** "{teamName} ({teamSite})" 포맷 — stepper actorRole 표시용 */
function formatActorRole(teamName?: string | null, teamSite?: string | null): string | null {
  if (!teamName) return null;
  return teamSite ? `${teamName} (${teamSite})` : teamName;
}

/** ActorLike → { name, role } 변환 */
function toActorInput(actor: ActorLike | null | undefined) {
  if (!actor) return null;
  return {
    name: actor.name,
    role: formatActorRole(actor.teamName, actor.teamSite),
  };
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
    requester: checkout.user
      ? {
          name: checkout.user.name,
          role: formatActorRole(checkout.user.team?.name, checkout.user.team?.site),
        }
      : null,
    requestedAt: checkout.createdAt,
    borrowerApprovedAt: checkout.borrowerApprovedAt,
    borrowerApprover: toActorInput(checkout.borrowerApprover),
    approvedAt: checkout.approvedAt,
    // approver(Phase 2 배치) 우선, 없으면 approvedBy(기존 필드) fallback (name만 있고 team 없음)
    approver: checkout.approver
      ? toActorInput(checkout.approver)
      : checkout.approvedBy
        ? { name: checkout.approvedBy.name, role: null }
        : null,
    checkoutDate: checkout.checkoutDate,
    lenderConfirmedAt: checkout.lenderConfirmedAt,
    lenderConfirmer: toActorInput(checkout.lenderConfirmer),
    actualReturnDate: checkout.actualReturnDate,
    returner: toActorInput(checkout.returner),
    expectedReturnDate: checkout.expectedReturnDate,
    returnApprovedAt: checkout.returnApprovedAt,
    returnApprover: toActorInput(checkout.returnApprover),
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
