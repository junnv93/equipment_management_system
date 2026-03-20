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
 * 연결 생명주기:
 *   - AbortController.abort() → reader.read() Promise가 즉시 AbortError로 reject
 *   - 이전 fetch가 30초 heartbeat를 기다리며 블로킹되는 누수 방지
 *
 * 재연결 전략 (지수 백오프):
 *   - 연결 실패 → 1s → 2s → 4s → ... → 최대 30s
 *   - AbortError는 정상 cleanup → 재연결 안 함
 *   - accessToken 변경 → 재시도 카운트 리셋 + 즉시 재연결
 *
 * 보안: 토큰을 Authorization 헤더로 전송 (URL 노출 방지)
 */

const MAX_RETRY_DELAY_MS = 30_000;

export function useNotificationStream() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const accessToken = (session as unknown as { accessToken?: string } | null)?.accessToken;

  useEffect(() => {
    if (!accessToken) return;

    // 이전 재연결 타이머 정리
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // 새 토큰 → 재시도 카운트 리셋 (토큰 갱신은 "새 시작"으로 간주)
    retryCountRef.current = 0;

    const abortController = new AbortController();
    const streamUrl = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.STREAM}`;

    const connectStream = async () => {
      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        // 연결 성공 → 재시도 카운트 리셋
        retryCountRef.current = 0;

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        // ReadableStream 읽기 — abort 시 reader.read()가 즉시 AbortError를 throw
        while (true) {
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

                // 승인 변경 이벤트: approval counts 쿼리만 무효화 (toast 미표시)
                if (notification.title === '__approval_changed__') {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.approvals.countsAll,
                  });
                  continue;
                }

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
      } catch (error) {
        // AbortError: cleanup에 의한 정상 종료 — 재연결하지 않음
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // 기타 에러(네트워크 오류, 401 등): 지수 백오프 재연결
        if (!abortController.signal.aborted) {
          const retryDelay = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            MAX_RETRY_DELAY_MS
          );
          retryCountRef.current += 1;

          reconnectTimerRef.current = setTimeout(async () => {
            if (abortController.signal.aborted) return;
            try {
              // 세션 갱신 시도 → accessToken 변경 → useEffect 재실행 → 새 연결
              await updateSession();
            } catch {
              // 세션 갱신 실패 → SessionProvider refetchInterval(5분)이 최후 방어선
            }
          }, retryDelay);
        }
      }
    };

    connectStream();

    return () => {
      // AbortController.abort() → 진행 중인 fetch와 reader.read()를 즉시 취소
      // 이전 구현의 abortedRef 방식과 달리 30초 heartbeat를 기다리지 않음
      abortController.abort();

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [accessToken, queryClient, router, updateSession]);
}
