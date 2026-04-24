'use client';

import { useMemo } from 'react';

import { useSession } from 'next-auth/react';

import {
  getNextStep,
  NextStepDescriptorSchema,
  type NextStepDescriptor,
  type CheckoutStatus,
  type CheckoutPurpose,
} from '@equipment-management/schemas';
import { getPermissions, type UserRole } from '@equipment-management/shared-constants';

interface UseCheckoutNextStepInput {
  status: CheckoutStatus;
  purpose: CheckoutPurpose;
  dueAt?: string | null;
  /** 서버 응답의 nextStep 필드 — Zod 검증 통과 시 우선 사용, 스키마 드리프트 시 client-side fallback */
  nextStep?: NextStepDescriptor | null;
}

/**
 * FSM getNextStep을 React hook으로 래핑.
 * 세션 role → permissions 변환 담당. FSM 로직 재구현 없음.
 *
 * nextStep prop이 제공되면 Zod로 검증 후 사용.
 * 검증 실패(스키마 드리프트) 시 client-side getNextStep으로 fallback.
 */
export function useCheckoutNextStep({
  status,
  purpose,
  dueAt,
  nextStep,
}: UseCheckoutNextStepInput): NextStepDescriptor {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole | undefined) ?? 'test_engineer';
  const permissions = useMemo(() => getPermissions(role) as readonly string[], [role]);

  return useMemo(() => {
    if (nextStep) {
      const parsed = NextStepDescriptorSchema.safeParse(nextStep);
      if (parsed.success) return parsed.data;
      // 스키마 드리프트 → client-side fallback
    }
    return getNextStep({ status, purpose, dueAt }, permissions);
  }, [status, purpose, dueAt, nextStep, permissions]);
}
