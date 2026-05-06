'use client';

/**
 * useCheckoutGroupAggregates — CheckoutGroupCard 의 6개 파생 값 SSOT.
 *
 * checkouts-approvals-srp-decomposition Phase C.2 (2026-05-06):
 * CheckoutGroupCard 내부 인라인 useMemo 6개 (pendingCount/yourTurnCount/canApproveBulk/
 * isRentalGroup/rentalStatus/rentalDescriptor) 단일 hook 으로 집약. 호출 측 readability
 * + 회귀 격리 (group/descriptorMap 의존 변경 시 단일 위치).
 */

import { useMemo } from 'react';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  type NextStepDescriptor,
} from '@equipment-management/schemas';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';

interface UseCheckoutGroupAggregatesParams {
  group: CheckoutGroup;
  /** checkout id → NextStepDescriptor 매핑 (`useCheckoutGroupDescriptors` 결과). */
  descriptorMap: ReadonlyMap<string, NextStepDescriptor>;
}

export interface CheckoutGroupAggregates {
  /** 그룹 내 PENDING 상태 checkout 개수 (마스터 체크박스 / KPI 표시). */
  pendingCount: number;
  /** 현재 사용자가 승인 가능한 checkout 개수 ("당신 차례" 배지). */
  yourTurnCount: number;
  /** 그룹 내 PENDING 중 canApprove=true 가 1개 이상 존재 (그룹 일괄 승인 가능 여부). */
  canApproveBulk: boolean;
  /** 그룹 purposes 에 RENTAL 포함 여부 (rental 전용 UI 분기). */
  isRentalGroup: boolean;
  /** rental checkout 상태 — 미존재 시 빈 문자열. */
  rentalStatus: string;
  /** rental checkout 의 NextStepDescriptor — phase indicator 용. */
  rentalDescriptor: NextStepDescriptor | undefined;
}

export function useCheckoutGroupAggregates({
  group,
  descriptorMap,
}: UseCheckoutGroupAggregatesParams): CheckoutGroupAggregates {
  const pendingCount = useMemo(
    () => group.checkouts.filter((co) => co.status === CSVal.PENDING).length,
    [group.checkouts]
  );

  const yourTurnCount = useMemo(() => {
    let count = 0;
    for (const co of group.checkouts) {
      if (descriptorMap.get(co.id)?.availableToCurrentUser === true) count++;
    }
    return count;
  }, [group.checkouts, descriptorMap]);

  const canApproveBulk = useMemo(
    () =>
      group.checkouts
        .filter((co) => co.status === CSVal.PENDING)
        .some((co) => co.meta?.availableActions?.canApprove ?? false),
    [group.checkouts]
  );

  const isRentalGroup = group.purposes.includes(CPVal.RENTAL as never);

  const rentalStatus = useMemo(
    () =>
      isRentalGroup
        ? (group.checkouts.find((co) => co.purpose === CPVal.RENTAL)?.status ?? '')
        : '',
    [isRentalGroup, group.checkouts]
  );

  const rentalDescriptor = useMemo(() => {
    const rentalCheckout = group.checkouts.find((co) => co.purpose === CPVal.RENTAL);
    if (!rentalCheckout) return undefined;
    return descriptorMap.get(rentalCheckout.id);
  }, [group.checkouts, descriptorMap]);

  return {
    pendingCount,
    yourTurnCount,
    canApproveBulk,
    isRentalGroup,
    rentalStatus,
    rentalDescriptor,
  };
}
