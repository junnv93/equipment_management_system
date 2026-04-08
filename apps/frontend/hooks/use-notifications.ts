'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import notificationsApi from '@/lib/api/notifications-api';
import type { NotificationQueryParams } from '@/lib/api/notifications-api';
import { queryKeys, QUERY_CONFIG, CACHE_TIMES } from '@/lib/api/query-config';

/**
 * 미읽음 알림 개수 조회 훅
 *
 * QUERY_CONFIG.NOTIFICATIONS: 30초 staleTime + 30초 refetchInterval
 * SSE 실시간 푸시 + 주기적 폴링으로 이중 보장
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    ...QUERY_CONFIG.NOTIFICATIONS,
    select: (data) => data.count,
  });
}

/**
 * 알림 목록 조회 훅
 */
export function useNotificationList(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params as Record<string, unknown> | undefined),
    queryFn: () => notificationsApi.list(params),
    ...QUERY_CONFIG.NOTIFICATIONS,
  });
}

/**
 * 알림 읽음 처리 뮤테이션
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSettled: () => {
      // SSOT: onSettled에서 캐시 무효화 (항상 실행)
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * 모든 알림 읽음 처리 뮤테이션
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast({ description: '모든 알림을 읽음으로 표시했습니다.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * 알림 삭제 뮤테이션
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => {
      toast({ description: '알림이 삭제되었습니다.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * 알림 설정 조회 훅
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: CACHE_TIMES.LONG,
  });
}

/**
 * 알림 설정 업데이트 뮤테이션
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: Parameters<typeof notificationsApi.updatePreferences>[0]) =>
      notificationsApi.updatePreferences(prefs),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });
}
