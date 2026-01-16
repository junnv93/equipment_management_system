'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import equipmentApi, {
  Equipment,
  EquipmentQuery,
  CreateEquipmentDto,
  UpdateEquipmentDto,
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
 * 장비 생성 훅
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateEquipmentDto) => equipmentApi.createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      toast({
        title: '성공',
        description: '장비가 성공적으로 등록되었습니다.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.response?.data?.message || '장비 등록 중 오류가 발생했습니다.',
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
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentDto }) =>
      equipmentApi.updateEquipment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      toast({
        title: '성공',
        description: '장비 정보가 성공적으로 수정되었습니다.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.response?.data?.message || '장비 수정 중 오류가 발생했습니다.',
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
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.response?.data?.message || '장비 삭제 중 오류가 발생했습니다.',
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
    mutationFn: ({ id, status }: { id: string; status: Equipment['status'] }) =>
      equipmentApi.updateEquipmentStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
      toast({
        title: '성공',
        description: '장비 상태가 성공적으로 변경되었습니다.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.response?.data?.message || '장비 상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });
}
