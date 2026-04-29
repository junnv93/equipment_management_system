'use client';

import { useMemo } from 'react';
import {
  getNextStep,
  type NextStepDescriptor,
  type CheckoutPurpose,
  type UserRole,
} from '@equipment-management/schemas';
import { getPermissions } from '@equipment-management/shared-constants';
import type { Checkout } from '@/lib/api/checkout-api';

/**
 * checkout 목록에 대해 getNextStep을 일괄 계산합니다.
 *
 * N+1 훅 방지: useMemo 한 번으로 모든 checkout의 descriptor를 계산해
 * checkoutId → NextStepDescriptor Map으로 반환합니다.
 *
 * Defense in depth: BE meta가 정상 동작하면 이 hook은 거의 안 타지만, BE 응답에
 * meta가 없거나 stale일 때 fallback. actorCtx를 받아 lender/borrower team identity
 * 검증까지 수행하므로 평택랩 TM이 잘못된 nextAction을 보지 않음.
 *
 * @param checkouts - 대상 반출 목록
 * @param userRole - 현재 사용자의 역할 (permissions 변환용)
 * @param userTeamId - (선택) 현재 사용자의 팀 ID — actor team identity 평가
 * @returns Map<checkoutId, NextStepDescriptor>
 *
 * @example
 * ```tsx
 * const descriptorMap = useCheckoutGroupDescriptors(group.checkouts, role, userTeamId);
 * const descriptor = descriptorMap.get(checkout.id);
 * ```
 */
export function useCheckoutGroupDescriptors(
  checkouts: Checkout[],
  userRole: UserRole,
  userTeamId?: string | null
): Map<string, NextStepDescriptor> {
  const permissions = useMemo(() => getPermissions(userRole) as readonly string[], [userRole]);

  return useMemo(() => {
    const map = new Map<string, NextStepDescriptor>();
    for (const checkout of checkouts) {
      const descriptor = getNextStep(
        {
          status: checkout.status,
          purpose: checkout.purpose as CheckoutPurpose,
          dueAt: checkout.expectedReturnDate ?? null,
        },
        permissions,
        {
          userTeamId: userTeamId ?? null,
          lenderTeamId: checkout.lenderTeamId ?? null,
          requesterTeamId: checkout.requesterTeamId ?? null,
        }
      );
      map.set(checkout.id, descriptor);
    }
    return map;
  }, [checkouts, permissions, userTeamId]);
}
