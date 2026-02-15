'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

/**
 * SSE 알림 실시간 스트림 훅
 *
 * EventSource API로 `GET /api/notifications/stream?token=<jwt>` 연결.
 * 알림 수신 시:
 *   1. unreadCount 캐시 무효화 (배지 갱신)
 *   2. notification list 캐시 무효화 (드롭다운 갱신)
 *   3. toast 표시 (시각적 피드백)
 *
 * 재연결 전략 (3중 방어선):
 *   1. CLOSED 감지 → 3초 후 능동적 세션 갱신 (updateSession)
 *   2. 실패 시 → SessionProvider refetchInterval(5분)이 최후 방어선
 *   3. CONNECTING → EventSource 네이티브 자동 재연결
 *
 * 토큰 갱신: accessToken 변경 → useEffect 의존성 → 자동 재연결
 */
export function useNotificationStream() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessToken = (session as unknown as { accessToken?: string } | null)?.accessToken;

  useEffect(() => {
    if (!accessToken) return;

    // 이전 재연결 타이머 정리
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const streamUrl = `${baseUrl}${API_ENDPOINTS.NOTIFICATIONS.STREAM}?token=${encodeURIComponent(accessToken)}`;

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    // 알림 이벤트 수신
    eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data);

        // 1. 캐시 무효화 (unreadCount + list)
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });

        // 2. toast 표시
        toast(notification.title, {
          description: notification.content,
          action: notification.linkUrl
            ? {
                label: '확인',
                onClick: () => {
                  if (notification.linkUrl.startsWith('/')) {
                    router.push(notification.linkUrl);
                  } else {
                    window.location.href = notification.linkUrl;
                  }
                },
              }
            : undefined,
          duration: 5000,
        });
      } catch {
        // JSON 파싱 실패 시 무시 (heartbeat 등)
      }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        // 서버가 커넥션을 완전히 종료 (토큰 만료 등)
        eventSource.close();
        eventSourceRef.current = null;

        // 3초 후 능동적 세션 갱신 → JWT 콜백 트리거 → 새 accessToken 발급
        // accessToken 변경 시 useEffect 의존성에 의해 자동 재연결
        reconnectTimerRef.current = setTimeout(async () => {
          try {
            await updateSession();
          } catch {
            // 세션 갱신 실패 → SessionProvider refetchInterval(5분)이 최후 방어선
          }
        }, 3000);
      }
      // CONNECTING 상태: EventSource 네이티브 자동 재연결 → 별도 처리 불필요
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [accessToken, queryClient, router, updateSession]);
}
