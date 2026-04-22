'use client';

import { useMemo } from 'react';

import { useSession } from 'next-auth/react';

import { getNextStep, type NextStepDescriptor } from '@equipment-management/schemas';
import { getPermissions, type UserRole } from '@equipment-management/shared-constants';

import type { CheckoutStatus, CheckoutPurpose } from '@equipment-management/schemas';

interface UseCheckoutNextStepInput {
  status: CheckoutStatus;
  purpose: CheckoutPurpose;
  dueAt?: string | null;
}

/**
 * FSM getNextStep을 React hook으로 래핑.
 * 세션 role → permissions 변환 담당. FSM 로직 재구현 없음.
 */
export function useCheckoutNextStep({
  status,
  purpose,
  dueAt,
}: UseCheckoutNextStepInput): NextStepDescriptor {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole | undefined) ?? 'test_engineer';
  const permissions = useMemo(() => getPermissions(role) as readonly string[], [role]);

  return useMemo(
    () => getNextStep({ status, purpose, dueAt }, permissions),
    [status, purpose, dueAt, permissions]
  );
}
