/**
 * Dynamic Breadcrumb Metadata Hook
 *
 * 동적 라우트의 실제 이름을 가져오는 React Query 훅입니다.
 *
 * @module use-breadcrumb-metadata
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, usePathname } from 'next/navigation';
import equipmentApi from '@/lib/api/equipment-api';
import { extractDynamicParams, normalizeDynamicRoute } from './route-metadata';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

/**
 * 동적 라우트의 커스텀 라벨을 가져오는 훅
 *
 * @returns 동적 라벨 객체 (예: { 'abc-123': '디지털 멀티미터 DMM-2000' })
 *
 * @example
 * function MyComponent() {
 *   const dynamicLabels = useDynamicBreadcrumbLabels();
 *   return <Breadcrumb dynamicLabels={dynamicLabels} />;
 * }
 */
export function useDynamicBreadcrumbLabels(): Record<string, string> | undefined {
  const pathname = usePathname();
  const _params = useParams();

  const normalizedRoute = normalizeDynamicRoute(pathname);
  const dynamicParams = extractDynamicParams(pathname);

  // 동적 라우트가 아니면 undefined 반환
  const isDynamic = Object.keys(dynamicParams).length > 0;

  // 장비 상세 페이지
  const { data: equipmentLabel } = useQuery({
    queryKey: queryKeys.breadcrumbs.equipment(dynamicParams.id),
    queryFn: async () => {
      if (!dynamicParams.id) return null;

      try {
        const equipment = await equipmentApi.getById(dynamicParams.id);
        return {
          key: dynamicParams.id,
          label: equipment.name || equipment.managementNumber,
        };
      } catch (error) {
        console.error('Failed to fetch equipment name for breadcrumb:', error);
        return null;
      }
    },
    enabled: isDynamic && normalizedRoute.includes('/equipment/[id]'),
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
  });

  // 팀 상세 페이지 (필요시 추가)
  // const { data: teamLabel } = useQuery({
  //   queryKey: ['breadcrumb-team', dynamicParams.id],
  //   queryFn: async () => {
  //     const team = await teamApi.getById(dynamicParams.id);
  //     return { key: dynamicParams.id, label: team.name };
  //   },
  //   enabled: isDynamic && normalizedRoute.includes('/teams/[id]'),
  //   staleTime: 5 * 60 * 1000,
  // });

  // 교정계획서 상세 페이지 (필요시 추가)
  // const { data: calibrationPlanLabel } = useQuery({
  //   queryKey: ['breadcrumb-calibration-plan', dynamicParams.uuid],
  //   queryFn: async () => {
  //     const plan = await calibrationPlanApi.getById(dynamicParams.uuid);
  //     return { key: dynamicParams.uuid, label: plan.title };
  //   },
  //   enabled: isDynamic && normalizedRoute.includes('/calibration-plans/[uuid]'),
  //   staleTime: 5 * 60 * 1000,
  // });

  // 라벨 객체 병합
  const labels: Record<string, string> = {};

  if (equipmentLabel) {
    labels[equipmentLabel.key] = equipmentLabel.label;
  }

  // if (teamLabel) {
  //   labels[teamLabel.key] = teamLabel.label;
  // }

  // if (calibrationPlanLabel) {
  //   labels[calibrationPlanLabel.key] = calibrationPlanLabel.label;
  // }

  return Object.keys(labels).length > 0 ? labels : undefined;
}

/**
 * 특정 리소스의 브레드크럼 라벨을 가져오는 범용 훅
 *
 * @param resourceType - 리소스 타입 ('equipment', 'team', 'calibration-plan')
 * @param resourceId - 리소스 ID
 * @param fetchFn - 리소스 데이터를 가져오는 함수
 * @param labelExtractor - 라벨을 추출하는 함수
 * @returns 라벨 문자열 또는 undefined
 *
 * @example
 * const equipmentName = useBreadcrumbLabel(
 *   'equipment',
 *   'abc-123',
 *   () => equipmentApi.getById('abc-123'),
 *   (data) => data.name
 * );
 */
export function useBreadcrumbLabel<T>(
  resourceType: string,
  resourceId: string | undefined,
  fetchFn: () => Promise<T>,
  labelExtractor: (data: T) => string
): string | undefined {
  const { data } = useQuery({
    queryKey: queryKeys.breadcrumbs.resource(resourceType, resourceId),
    queryFn: async () => {
      try {
        const data = await fetchFn();
        return labelExtractor(data);
      } catch (error) {
        console.error(`Failed to fetch ${resourceType} label:`, error);
        return undefined;
      }
    },
    enabled: !!resourceId,
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
  });

  return data;
}

/**
 * 장비 이름을 브레드크럼 라벨로 가져오는 훅
 *
 * @param equipmentId - 장비 ID
 * @returns 장비 이름 또는 undefined
 *
 * @example
 * const equipmentName = useEquipmentBreadcrumbLabel('abc-123');
 * // "디지털 멀티미터 DMM-2000"
 */
export function useEquipmentBreadcrumbLabel(equipmentId: string | undefined): string | undefined {
  return useBreadcrumbLabel(
    'equipment',
    equipmentId,
    () => equipmentApi.getById(equipmentId!),
    (equipment) => equipment.name || equipment.managementNumber || '장비 상세'
  );
}
