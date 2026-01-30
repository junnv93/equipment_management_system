/**
 * ✅ Single Source of Truth: schemas 패키지 타입 사용
 *
 * 모든 타입은 @equipment-management/schemas 패키지에서 가져옵니다.
 *
 * @see packages/schemas/src/equipment.ts
 * @see docs/development/API_STANDARDS.md
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import type { EquipmentStatus } from '@equipment-management/schemas';
import equipmentApi, {
  type Equipment,
  type EquipmentQuery,
  type CreateEquipmentDto,
  type UpdateEquipmentDto,
} from '@/lib/api/equipment-api';
import { getErrorMessage } from '@/lib/api/error';

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

  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    initialData,
    staleTime: 0, // 항상 fresh하게 유지하여 캐시 갱신 즉시 반영
  });
}

/**
 * 장비 생성 훅
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, files }: { data: CreateEquipmentDto; files?: File[] }) =>
      equipmentApi.createEquipment(data, files),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });

      // 승인 요청인 경우 다른 메시지 표시
      if (response?.requestUuid) {
        toast({
          title: '요청 제출 완료',
          description: '장비 등록 요청이 제출되었습니다. 승인 대기 중입니다.',
        });
      } else {
        toast({
          title: '성공',
          description: '장비가 성공적으로 등록되었습니다.',
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: '오류',
        description: getErrorMessage(error, '장비 등록 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 장비 수정 훅
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, files }: { id: string; data: UpdateEquipmentDto; files?: File[] }) =>
      equipmentApi.updateEquipment(id, data, files),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });

      // 승인 요청인 경우 다른 메시지 표시
      if (response?.requestUuid) {
        toast({
          title: '요청 제출 완료',
          description: '장비 수정 요청이 제출되었습니다. 승인 대기 중입니다.',
        });
      } else {
        toast({
          title: '성공',
          description: '장비 정보가 성공적으로 수정되었습니다.',
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: '오류',
        description: getErrorMessage(error, '장비 수정 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 장비 삭제 훅
 */
export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => equipmentApi.deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      toast({
        title: '성공',
        description: '장비가 성공적으로 삭제되었습니다.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '오류',
        description: getErrorMessage(error, '장비 삭제 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 장비 상태 변경 훅
 */
export function useUpdateEquipmentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EquipmentStatus }) =>
      equipmentApi.updateEquipmentStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      toast({
        title: '성공',
        description: '장비 상태가 성공적으로 변경되었습니다.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '오류',
        description: getErrorMessage(error, '장비 상태 변경 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
}
