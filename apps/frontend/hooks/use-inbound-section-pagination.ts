'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

/**
 * 반입 탭 섹션별 독립 페이지네이션 훅
 *
 * URL 파라미터:
 *   - ?rentalPage=N   → 외부 렌탈 섹션 페이지
 *   - ?internalPage=N → 내부 공용장비 섹션 페이지
 */
export function useInboundSectionPagination() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rentalPage = Math.max(1, Number(searchParams.get('rentalPage') ?? '1'));
  const internalPage = Math.max(1, Number(searchParams.get('internalPage') ?? '1'));

  const navigate = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    router.replace(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?${params.toString()}`, { scroll: false });
  };

  const setRentalPage = (page: number) => navigate({ rentalPage: String(page) });
  const setInternalPage = (page: number) => navigate({ internalPage: String(page) });

  return { rentalPage, internalPage, setRentalPage, setInternalPage };
}
