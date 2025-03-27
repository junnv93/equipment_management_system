import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Reservation, 
  CreateReservationData, 
  UpdateReservationData 
} from '@/lib/types/reservation';
import * as api from '@/lib/api/client/reservations';

// 예약 목록 조회 훅
export function useReservations(params?: Record<string, any>) {
  return useQuery<Reservation[]>({
    queryKey: ['reservations', params],
    queryFn: () => api.getReservations(params),
  });
}

// 특정 예약 조회 훅
export function useReservation(id: string) {
  return useQuery<Reservation>({
    queryKey: ['reservations', id],
    queryFn: () => api.getReservation(id),
    enabled: !!id,
  });
}

// 예약 생성 훅
export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateReservationData) => 
      api.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// 예약 수정 훅
export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservationData }) => 
      api.updateReservation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// 예약 삭제 훅
export function useDeleteReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      api.deleteReservation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// 예약 승인 훅
export function useApproveReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      api.approveReservation(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// 예약 거부 훅
export function useRejectReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      api.rejectReservation(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// 예약 취소 훅
export function useCancelReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      api.cancelReservation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// 예약 완료 훅 (장비 반납)
export function useCompleteReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      api.completeReservation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
} 