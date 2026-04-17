/**
 * 관리번호 기반 장비 조회 훅 (QR 모바일 랜딩).
 *
 * @see apps/frontend/app/(dashboard)/e/[managementNumber]/page.tsx
 * @see packages/shared-constants/src/qr-access.ts
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { QRAllowedAction } from '@equipment-management/shared-constants';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { queryKeys, REFETCH_STRATEGIES } from '@/lib/api/query-config';

/**
 * 서버 응답 shape: Equipment + 서버 계산 allowedActions.
 * 프론트는 이 배열을 소비하여 CTA 렌더링.
 */
export type EquipmentQRLanding = Equipment & { allowedActions: QRAllowedAction[] };

/**
 * `useEquipmentByManagementNumber('SUW-E0001', initialData?)`.
 *
 * 관리번호 기반 장비 조회. Server Component에서 Hydrate한 initialData를 받아
 * TanStack Query 캐시에 시딩하고, window focus 시에만 재조회한다.
 *
 * - `staleTime`/`refetchOnWindowFocus` 등은 `REFETCH_STRATEGIES.NORMAL` SSOT 사용.
 * - `placeholderData`로 SSR 데이터를 즉시 표시 → 깜빡임 제거.
 * - 미지정 또는 빈 문자열의 경우 `enabled=false` (쿼리 미실행).
 */
export function useEquipmentByManagementNumber(
  managementNumber: string,
  initialData?: EquipmentQRLanding
) {
  return useQuery<EquipmentQRLanding>({
    queryKey: queryKeys.equipment.byManagementNumber(managementNumber),
    queryFn: () => equipmentApi.getEquipmentByManagementNumber(managementNumber),
    enabled: !!managementNumber && managementNumber.trim() !== '',
    ...REFETCH_STRATEGIES.NORMAL,
    placeholderData: initialData,
  });
}
