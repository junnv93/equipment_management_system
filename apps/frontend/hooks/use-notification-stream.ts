'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { API_BASE_URL } from '@/lib/config/api-config';

/**
 * SSE 알림 실시간 스트림 훅
 *
 * fetch + ReadableStream으로 `GET /api/notifications/stream` 연결 (Authorization 헤더로 JWT 전송).
 * 알림 수신 시:
 *   1. unreadCount 캐시 무효화 (배지 갱신)
 *   2. notification list 캐시 무효화 (드롭다운 갱신)
 *   3. toast 표시 (시각적 피드백)
 *
 * 재연결 전략:
 *   1. 연결 실패 → 3초 후 능동적 세션 갱신 (updateSession)
 *   2. 실패 시 → SessionProvider refetchInterval(5분)이 최후 방어선
 *
 * 토큰 갱신: accessToken 변경 → useEffect 의존성 → 자동 재연결
 * 보안: 토큰을 Authorization 헤더로 전송 (URL 노출 방지)
 */
export function useNotificationStream() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortedRef = useRef(false);
  const accessToken = (session as unknown as { accessToken?: string } | null)?.accessToken;

  useEffect(() => {
    if (!accessToken) return;

    // 이전 재연결 타이머 정리
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // aborted 플래그 초기화
    abortedRef.current = false;

    const streamUrl = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.STREAM}`;

    const connectStream = async () => {
      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'text/event-stream',
          },
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        // ReadableStream 읽기
        while (!abortedRef.current) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            // SSE 형식: "event: notification\ndata: {...}\n\n"
            if (line.startsWith('data: ')) {
              try {
                const data = line.slice(6); // "data: " 제거
                const notification = JSON.parse(data);

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
            }
          }
        }
      } catch {
        // 연결 실패 시 3초 후 재연결 시도 (cleanup으로 인한 중단이 아닌 경우만)
        if (!abortedRef.current) {
          reconnectTimerRef.current = setTimeout(async () => {
            try {
              await updateSession();
            } catch {
              // 세션 갱신 실패 → SessionProvider refetchInterval(5분)이 최후 방어선
            }
          }, 3000);
        }
      }
    };

    connectStream();

    return () => {
      // ReadableStream 중단
      abortedRef.current = true;

      // 재연결 타이머 정리
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [accessToken, queryClient, router, updateSession]);
}
