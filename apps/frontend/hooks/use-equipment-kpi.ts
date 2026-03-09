import { useQuery } from '@tanstack/react-query';
import equipmentApi from '@/lib/api/equipment-api';
import checkoutApi from '@/lib/api/checkout-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

/**
 * 장비 KPI 스트립 데이터 훅
 *
 * 반출/유지보수/사고 이력 카운트를 로드합니다.
 * query key를 탭 컴포넌트와 공유 → 탭 방문 후에는 캐시 재활용 (추가 요청 없음)
 */
export function useEquipmentKpiData(equipmentId: string) {
  const checkouts = useQuery({
    queryKey: queryKeys.equipment.checkoutHistory(equipmentId),
    queryFn: () => checkoutApi.getEquipmentCheckouts(equipmentId),
    select: (data) => ({
      total: data?.meta?.pagination?.total ?? 0,
      lastDate: data?.data?.[0]?.createdAt ?? null,
    }),
    staleTime: CACHE_TIMES.LONG,
    enabled: !!equipmentId,
  });

  const maintenance = useQuery({
    queryKey: queryKeys.equipment.maintenanceHistory(equipmentId),
    queryFn: () => equipmentApi.getMaintenanceHistory(equipmentId),
    select: (data) => ({
      total: data?.length ?? 0,
      lastDate: data?.[0]?.performedAt ?? null,
    }),
    staleTime: CACHE_TIMES.LONG,
    enabled: !!equipmentId,
  });

  const incidents = useQuery({
    queryKey: queryKeys.equipment.incidentHistory(equipmentId),
    queryFn: () => equipmentApi.getIncidentHistory(equipmentId),
    select: (data) => ({
      total: data?.length ?? 0,
      lastDate: data?.[0]?.occurredAt ?? null,
    }),
    staleTime: CACHE_TIMES.LONG,
    enabled: !!equipmentId,
  });

  return { checkouts, maintenance, incidents };
}
