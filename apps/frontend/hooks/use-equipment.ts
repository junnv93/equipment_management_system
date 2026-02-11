/**
 * ✅ Single Source of Truth: schemas 패키지 타입 사용
 *
 * 모든 타입은 @equipment-management/schemas 패키지에서 가져옵니다.
 *
 * @see packages/schemas/src/equipment.ts
 * @see docs/development/API_STANDARDS.md
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import type { EquipmentStatus } from '@equipment-management/schemas';
import equipmentApi, {
  type Equipment,
  type EquipmentQuery,
  type CreateEquipmentDto,
  type UpdateEquipmentDto,
} from '@/lib/api/equipment-api';

/**
 * 장비 목록 조회 훅
 */
export function useEquipmentList(query?: EquipmentQuery) {
  return useQuery({
    queryKey: ['equipment', 'list', query],
    queryFn: () => equipmentApi.getEquipmentList(query),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 장비 상세 조회 훅
 */
export function useEquipment(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getEquipment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * ✅ SSOT: Server Component 초기 데이터와 Client-Side 캐시 연동 훅
 *
 * @description
 * Server Component에서 props로 받은 초기 데이터를 React Query 캐시의 initialData로 사용하고,
 * 이후 클라이언트에서 mutation 후 캐시가 갱신되면 **즉시 UI에 반영**됩니다.
 *
 * 이 패턴은 다음 문제를 해결합니다:
 * - Server Component props는 정적이므로 mutation 후에도 이전 값 유지
 * - router.refresh()가 완료되기 전까지 UI가 stale 데이터 표시
 * - React Query 캐시와 Server Component props 간 불일치
 *
 * @example
 * ```tsx
 * // Server Component (page.tsx)
 * const equipment = await getEquipmentCached(id);
 * return <EquipmentDetailClient equipment={equipment} />;
 *
 * // Client Component (EquipmentHeader.tsx)
 * export function EquipmentHeader({ equipment: initialEquipment }: Props) {
 *   const { data: equipment } = useEquipmentWithInitialData(initialEquipment);
 *   // equipment.status가 mutation 후 즉시 반영됨
 * }
 * ```
 *
 * @param initialData - Server Component에서 받은 초기 장비 데이터 (Equipment 타입)
 * @returns React Query의 useQuery 반환값 (data는 항상 정의됨)
 *
 * @see IncidentHistoryTab - 부적합 등록 시 상태 변경 반영
 * @see packages/schemas/src/equipment.ts - Equipment 타입 정의
 */
export function useEquipmentWithInitialData(initialData: Equipment) {
  const equipmentId = String(initialData.id);

  const result = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    placeholderData: initialData,
    staleTime: 0, // 항상 fresh하게 유지하여 캐시 갱신 즉시 반영
  });

  // placeholderData는 타입상 data가 undefined일 수 있으므로,
  // initialData를 fallback으로 사용하여 항상 Equipment 타입 보장
  return { ...result, data: result.data ?? initialData };
}

/**
 * ✅ 장비 생성 훅 - Optimistic Update 패턴
 *
 * 장비 등록 시 즉시 목록에 추가하여 사용자 경험을 개선합니다.
 */
export function useCreateEquipment() {
  return useOptimisticMutation<
    Equipment | { requestUuid: string },
    { data: CreateEquipmentDto; files?: File[] },
    { data: Equipment[] }
  >({
    mutationFn: ({ data, files }) => equipmentApi.createEquipment(data, files),
    queryKey: ['equipment', 'list'],
    optimisticUpdate: (old, { data }) => {
      if (!old?.data) return { data: [] };

      // ✅ 새 장비 즉시 추가 (임시 ID 사용)
      const newEquipment: Equipment = {
        id: 'temp-' + Date.now(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Equipment;

      return {
        ...old,
        data: [newEquipment, ...old.data],
      };
    },
    invalidateKeys: [['equipment', 'list'], ['equipment-requests']],
    successMessage: (response) =>
      response && 'requestUuid' in response
        ? '장비 등록 요청이 제출되었습니다. 승인 대기 중입니다.'
        : '장비가 성공적으로 등록되었습니다.',
    errorMessage: '장비 등록 중 오류가 발생했습니다.',
  });
}

/**
 * ✅ 장비 수정 훅 - Optimistic Update 패턴
 *
 * 장비 수정 시 즉시 목록에 반영하여 사용자 경험을 개선합니다.
 */
export function useUpdateEquipment() {
  return useOptimisticMutation<
    Equipment | { requestUuid: string },
    { id: string; data: UpdateEquipmentDto; files?: File[] },
    { data: Equipment[] }
  >({
    mutationFn: ({ id, data, files }) => equipmentApi.updateEquipment(id, data, files),
    queryKey: ['equipment', 'list'],
    optimisticUpdate: (old, { id, data }) => {
      if (!old?.data) return { data: [] };

      // ✅ 수정된 장비 즉시 업데이트
      return {
        ...old,
        data: old.data.map((item) =>
          item.id === id
            ? ({
                ...item,
                ...data,
                updatedAt: new Date().toISOString(),
              } as Equipment)
            : item
        ),
      };
    },
    invalidateKeys: [['equipment', 'list'], ['equipment-requests']],
    successMessage: (response) =>
      response && 'requestUuid' in response
        ? '장비 수정 요청이 제출되었습니다. 승인 대기 중입니다.'
        : '장비 정보가 성공적으로 수정되었습니다.',
    errorMessage: '장비 수정 중 오류가 발생했습니다.',
  });
}

/**
 * ✅ 장비 삭제 훅 - Optimistic Update 패턴
 *
 * 장비 삭제 시 즉시 목록에서 제거하여 사용자 경험을 개선합니다.
 */
export function useDeleteEquipment() {
  return useOptimisticMutation<void, string, { data: Equipment[] }>({
    mutationFn: (id) => equipmentApi.deleteEquipment(id),
    queryKey: ['equipment', 'list'],
    optimisticUpdate: (old, id) => {
      if (!old?.data) return { data: [] };

      // ✅ 삭제된 장비 즉시 제거
      return {
        ...old,
        data: old.data.filter((item) => item.id !== id),
      };
    },
    invalidateKeys: [['equipment', 'list']],
    successMessage: '장비가 성공적으로 삭제되었습니다.',
    errorMessage: '장비 삭제 중 오류가 발생했습니다.',
  });
}

/**
 * ✅ 장비 상태 변경 훅 - Optimistic Update 패턴
 *
 * ✅ Phase 1: Equipment Module - 2026-02-11
 * ✅ Optimistic Locking: version 필드 추가
 *
 * 상태 변경을 즉시 UI에 반영하여 사용자 경험을 개선합니다.
 * 409 Conflict 발생 시 자동으로 서버에서 최신 데이터를 가져와 동기화합니다.
 */
export function useUpdateEquipmentStatus() {
  return useOptimisticMutation<
    Equipment,
    { id: string; status: EquipmentStatus; version: number },
    { data: Equipment[] }
  >({
    mutationFn: ({ id, status, version }) =>
      equipmentApi.updateEquipmentStatus(id, status, version),
    queryKey: ['equipment', 'list'],
    optimisticUpdate: (old, { id, status }) => {
      if (!old?.data) return { data: [] };

      // ✅ 변경된 장비만 즉시 업데이트
      return {
        ...old,
        data: old.data.map((item) => (item.id === id ? { ...item, status } : item)),
      };
    },
    invalidateKeys: [['equipment', 'list']], // 백그라운드 재검증
    successMessage: '장비 상태가 성공적으로 변경되었습니다.',
    // ✅ Version conflict는 useOptimisticMutation의 onError에서 자동 처리
    // - 서버에서 최신 데이터 가져오기 (invalidateQueries)
    // - 에러 토스트 표시: "다른 사용자가 이미 수정했습니다. 페이지가 자동으로 새로고침됩니다."
    errorMessage: '장비 상태 변경 중 오류가 발생했습니다.',
  });
}
