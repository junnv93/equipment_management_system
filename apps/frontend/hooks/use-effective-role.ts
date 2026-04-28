/**
 * useEffectiveRole — 시뮬레이션 모드 + 실제 역할 결정 (대시보드 개선안 §A.19.3).
 *
 * SYSTEM_ADMIN이 `?simulateRole=test_engineer`로 접근 시 UI에서 시뮬 역할로 동작.
 * - 실제 역할(actualRole): 세션에 저장된 본인 역할 (API 권한 가드는 항상 이걸 사용).
 * - 효과 역할(effectiveRole): 시뮬 활성 시 시뮬 역할, 그 외 실제 역할.
 * - simulating: 시뮬 활성 여부.
 *
 * 시뮬레이션 모드 종료: 쿼리에서 `simulateRole` 파라미터 제거.
 */

'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRoleEnum, UserRoleValues, type UserRole } from '@equipment-management/schemas';

const SIMULATE_QUERY_KEY = 'simulateRole';

export interface EffectiveRoleResult {
  /** 세션에 저장된 본인 역할. API 권한 가드는 항상 이 값을 따른다. */
  actualRole: UserRole | undefined;
  /** UI 렌더에 사용할 역할 (시뮬 모드 active 시 시뮬 역할). */
  effectiveRole: UserRole | undefined;
  /** 시뮬 모드 활성 여부 — banner 노출 트리거. */
  simulating: boolean;
  /** 시뮬 모드 종료. URL에서 simulateRole 쿼리 제거. */
  exitSimulation: () => void;
}

export function useEffectiveRole(): EffectiveRoleResult {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const actualRole = session?.user?.role as UserRole | undefined;

  const { effectiveRole, simulating } = useMemo(() => {
    const raw = searchParams.get(SIMULATE_QUERY_KEY);
    const simRole = raw ? UserRoleEnum.safeParse(raw) : undefined;

    // SYSTEM_ADMIN만 시뮬 가능. 그 외 사용자는 query 무시.
    if (
      simRole?.success &&
      actualRole === UserRoleValues.SYSTEM_ADMIN &&
      simRole.data !== UserRoleValues.SYSTEM_ADMIN
    ) {
      return { effectiveRole: simRole.data, simulating: true };
    }
    return { effectiveRole: actualRole, simulating: false };
  }, [searchParams, actualRole]);

  const exitSimulation = () => {
    if (!simulating) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(SIMULATE_QUERY_KEY);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return { actualRole, effectiveRole, simulating, exitSimulation };
}
