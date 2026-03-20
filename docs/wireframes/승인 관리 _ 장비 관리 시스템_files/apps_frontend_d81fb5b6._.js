(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === 'object' ? document.currentScript : undefined,
  '[project]/apps/frontend/components/ui/skeleton.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Skeleton', () => Skeleton]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    function Skeleton({ className, ...props }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('motion-safe:animate-pulse rounded-md bg-primary/10', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/skeleton.tsx',
          lineNumber: 5,
          columnNumber: 5,
        },
        this
      );
    }
    _c = Skeleton;
    var _c;
    __turbopack_context__.k.register(_c, 'Skeleton');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-notification-stream.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useNotificationStream', () => useNotificationStream]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$config$2f$api$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/config/api-config.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
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
     */ const MAX_RETRY_DELAY_MS = 30_000;
    function useNotificationStream() {
      _s();
      const { data: session, update: updateSession } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      const queryClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQueryClient'
      ])();
      const router = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRouter'
      ])();
      const reconnectTimerRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(null);
      const retryCountRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(0);
      const accessToken = session?.accessToken;
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'useNotificationStream.useEffect': () => {
            if (!accessToken) return;
            // 이전 재연결 타이머 정리
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = null;
            }
            // 새 토큰 → 재시도 카운트 리셋 (토큰 갱신은 "새 시작"으로 간주)
            retryCountRef.current = 0;
            const abortController = new AbortController();
            const streamUrl = `${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$config$2f$api$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_BASE_URL']}${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].NOTIFICATIONS.STREAM}`;
            const connectStream = {
              'useNotificationStream.useEffect.connectStream': async () => {
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
                    const chunk = decoder.decode(value, {
                      stream: true,
                    });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                      // SSE 형식: "event: notification\ndata: {...}\n\n"
                      if (line.startsWith('data: ')) {
                        try {
                          const data = line.slice(6); // "data: " 제거
                          const notification = JSON.parse(data);
                          // 1. 캐시 무효화 (unreadCount + list)
                          queryClient.invalidateQueries({
                            queryKey:
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'queryKeys'
                              ].notifications.all,
                          });
                          // 2. toast 표시
                          (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'toast'
                          ])(notification.title, {
                            description: notification.content,
                            action: notification.linkUrl
                              ? {
                                  label: '확인',
                                  onClick: {
                                    'useNotificationStream.useEffect.connectStream': () => {
                                      if (notification.linkUrl.startsWith('/')) {
                                        router.push(notification.linkUrl);
                                      } else {
                                        window.location.href = notification.linkUrl;
                                      }
                                    },
                                  }['useNotificationStream.useEffect.connectStream'],
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
                    reconnectTimerRef.current = setTimeout(
                      {
                        'useNotificationStream.useEffect.connectStream': async () => {
                          if (abortController.signal.aborted) return;
                          try {
                            // 세션 갱신 시도 → accessToken 변경 → useEffect 재실행 → 새 연결
                            await updateSession();
                          } catch {
                            // 세션 갱신 실패 → SessionProvider refetchInterval(5분)이 최후 방어선
                          }
                        },
                      }['useNotificationStream.useEffect.connectStream'],
                      retryDelay
                    );
                  }
                }
              },
            }['useNotificationStream.useEffect.connectStream'];
            connectStream();
            return {
              'useNotificationStream.useEffect': () => {
                // AbortController.abort() → 진행 중인 fetch와 reader.read()를 즉시 취소
                // 이전 구현의 abortedRef 방식과 달리 30초 heartbeat를 기다리지 않음
                abortController.abort();
                if (reconnectTimerRef.current) {
                  clearTimeout(reconnectTimerRef.current);
                  reconnectTimerRef.current = null;
                }
              },
            }['useNotificationStream.useEffect'];
          },
        }['useNotificationStream.useEffect'],
        [accessToken, queryClient, router, updateSession]
      );
    }
    _s(useNotificationStream, 'o6uXUKH7bhqyBrQ8+Iih0HsPfms=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQueryClient'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRouter'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/sheet.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Sheet',
      () => Sheet,
      'SheetClose',
      () => SheetClose,
      'SheetContent',
      () => SheetContent,
      'SheetDescription',
      () => SheetDescription,
      'SheetFooter',
      () => SheetFooter,
      'SheetHeader',
      () => SheetHeader,
      'SheetOverlay',
      () => SheetOverlay,
      'SheetPortal',
      () => SheetPortal,
      'SheetTitle',
      () => SheetTitle,
      'SheetTrigger',
      () => SheetTrigger,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const Sheet =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ];
    const SheetTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Trigger'
      ];
    const SheetClose =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Close'
      ];
    const SheetPortal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Portal'
      ];
    const SheetOverlay =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](({ className, ...props }, ref) =>
        /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Overlay'
          ],
          {
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'cn'
            ])(
              'fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              className
            ),
            ...props,
            ref: ref,
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
            lineNumber: 22,
            columnNumber: 3,
          },
          ('TURBOPACK compile-time value', void 0)
        )
      );
    _c = SheetOverlay;
    SheetOverlay.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Overlay'
      ].displayName;
    const sheetVariants = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'cva'
    ])(
      'fixed z-50 gap-4 bg-background shadow-lg motion-safe:transition-transform motion-safe:ease-out motion-safe:duration-300 motion-reduce:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out',
      {
        variants: {
          side: {
            top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
            bottom:
              'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
            right:
              'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
          },
        },
        defaultVariants: {
          side: 'right',
        },
      }
    );
    const SheetContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c1 = ({ side = 'right', className, children, hideClose = false, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            SheetPortal,
            {
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  SheetOverlay,
                  {},
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
                    lineNumber: 64,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Content'
                  ],
                  {
                    ref: ref,
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      sheetVariants({
                        side,
                      }),
                      className
                    ),
                    ...props,
                    children: [
                      !hideClose &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Close'
                          ],
                          {
                            className:
                              'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background motion-safe:transition-[opacity] motion-safe:duration-150 motion-reduce:transition-none hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary',
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__[
                                  'X'
                                ],
                                {
                                  className: 'h-4 w-4',
                                },
                                void 0,
                                false,
                                {
                                  fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
                                  lineNumber: 68,
                                  columnNumber: 11,
                                },
                                ('TURBOPACK compile-time value', void 0)
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'span',
                                {
                                  className: 'sr-only',
                                  children: 'Close',
                                },
                                void 0,
                                false,
                                {
                                  fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
                                  lineNumber: 69,
                                  columnNumber: 11,
                                },
                                ('TURBOPACK compile-time value', void 0)
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
                            lineNumber: 67,
                            columnNumber: 9,
                          },
                          ('TURBOPACK compile-time value', void 0)
                        ),
                      children,
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
                    lineNumber: 65,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
              lineNumber: 63,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c2 = SheetContent;
    SheetContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Content'
      ].displayName;
    const SheetHeader = ({ className, ...props }) =>
      /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex flex-col space-y-2 text-center sm:text-left', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
          lineNumber: 79,
          columnNumber: 3,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    _c3 = SheetHeader;
    SheetHeader.displayName = 'SheetHeader';
    const SheetFooter = ({ className, ...props }) =>
      /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
          lineNumber: 84,
          columnNumber: 3,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    _c4 = SheetFooter;
    SheetFooter.displayName = 'SheetFooter';
    const SheetTitle =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c5 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Title'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-lg font-semibold text-foreground', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
              lineNumber: 95,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c6 = SheetTitle;
    SheetTitle.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Title'
      ].displayName;
    const SheetDescription =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c7 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Description'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-sm text-muted-foreground', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/sheet.tsx',
              lineNumber: 107,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c8 = SheetDescription;
    SheetDescription.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Description'
      ].displayName;
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
    __turbopack_context__.k.register(_c, 'SheetOverlay');
    __turbopack_context__.k.register(_c1, 'SheetContent$React.forwardRef');
    __turbopack_context__.k.register(_c2, 'SheetContent');
    __turbopack_context__.k.register(_c3, 'SheetHeader');
    __turbopack_context__.k.register(_c4, 'SheetFooter');
    __turbopack_context__.k.register(_c5, 'SheetTitle$React.forwardRef');
    __turbopack_context__.k.register(_c6, 'SheetTitle');
    __turbopack_context__.k.register(_c7, 'SheetDescription$React.forwardRef');
    __turbopack_context__.k.register(_c8, 'SheetDescription');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/components/mobile-nav.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'MOBILE_NAV_DRAWER_TOKENS',
      () => MOBILE_NAV_DRAWER_TOKENS,
      'MOBILE_NAV_SECTION_TOKENS',
      () => MOBILE_NAV_SECTION_TOKENS,
      'MOBILE_NAV_TOKENS',
      () => MOBILE_NAV_TOKENS,
      'getMobileNavItemClasses',
      () => getMobileNavItemClasses,
    ]);
    /**
     * Mobile Nav Component Tokens (Layer 3)
     *
     * 모바일 드로어 — 라이트 테마이므로 사이드바와 다른 토큰
     * SSOT: 모바일 네비게이션의 모든 스타일은 여기서만 정의
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    const MOBILE_NAV_DRAWER_TOKENS = {
      /**
       * SheetContent className 오버라이드
       *
       * Sheet 기본값(w-3/4, sm:max-w-sm) 대신
       * 모바일 네비 드로어 크기/테마 적용.
       */ content: ['w-72 sm:max-w-72 p-0', 'bg-background', 'shadow-xl'].join(' '),
      background: 'bg-background',
      shadow: 'shadow-xl',
      border: 'border-r border-border',
      headerBorder: 'border-b border-border',
      text: 'text-foreground',
    };
    const MOBILE_NAV_TOKENS = {
      active: {
        base: 'text-primary bg-primary/10 font-medium',
      },
      inactive: {
        base: 'text-muted-foreground hover:text-foreground hover:bg-muted',
      },
      badge: {
        background: 'bg-destructive/10',
        text: 'text-destructive',
      },
      transition:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastBgColor,
      focus:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'FOCUS_TOKENS'
        ].classes.default,
    };
    const MOBILE_NAV_SECTION_TOKENS = {
      label: 'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider',
      spacing: 'px-3 pt-4 pb-1',
      firstSpacing: 'px-3 pb-1',
      divider: 'border-t border-border mt-2',
    };
    function getMobileNavItemClasses(isActive) {
      const stateBase = isActive ? MOBILE_NAV_TOKENS.active.base : MOBILE_NAV_TOKENS.inactive.base;
      return [
        'flex items-center gap-3 rounded-lg px-3 py-3 relative',
        stateBase,
        MOBILE_NAV_TOKENS.transition,
        MOBILE_NAV_TOKENS.focus,
      ].join(' ');
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/utils/permission-helpers.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'hasAdminPermissions',
      () => hasAdminPermissions,
      'hasApprovalPermissions',
      () => hasApprovalPermissions,
    ]);
    /**
     * 권한 체크 유틸리티
     *
     * 사용자 역할 기반 권한 확인 함수들
     * ⚠️ SSOT: 역할 상수는 @equipment-management/shared-constants에서 import
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/roles.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    // Fallback values in case of module resolution issues during HMR
    const FALLBACK_APPROVAL_ROLES = [
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'UserRoleValues'
      ].TECHNICAL_MANAGER,
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'UserRoleValues'
      ].QUALITY_MANAGER,
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'UserRoleValues'
      ].LAB_MANAGER,
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'UserRoleValues'
      ].SYSTEM_ADMIN,
    ];
    const FALLBACK_ADMIN_ROLES = [
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'UserRoleValues'
      ].LAB_MANAGER,
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'UserRoleValues'
      ].SYSTEM_ADMIN,
    ];
    function hasApprovalPermissions(userRole) {
      if (!userRole) return false;
      const roles =
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'APPROVAL_ROLES'
        ] ?? FALLBACK_APPROVAL_ROLES;
      return roles.includes(userRole.toLowerCase());
    }
    function hasAdminPermissions(userRole) {
      if (!userRole) return false;
      const roles =
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ADMIN_ROLES'
        ] ?? FALLBACK_ADMIN_ROLES;
      return roles.includes(userRole.toLowerCase());
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/calibration-api.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    // 교정 API 객체
    const calibrationApi = {
      // 교정 이력 목록 조회
      getCalibrationHistory: async (query = {}) => {
        const params = new URLSearchParams();
        // 쿼리 파라미터 설정
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].CALIBRATIONS.HISTORY_LIST}${params.toString() ? `?${params.toString()}` : ''}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        // ✅ CRITICAL FIX: axios returns AxiosResponse, need to access response.data
        // Transform backend format { items, meta } to frontend format { data, meta.pagination }
        const responseData = response.data;
        if (responseData && 'items' in responseData) {
          return {
            data: responseData.items,
            meta: {
              pagination: {
                total: responseData.meta?.totalItems || 0,
                pageSize: responseData.meta?.itemsPerPage || 20,
                currentPage: responseData.meta?.currentPage || 1,
                totalPages: responseData.meta?.totalPages || 1,
              },
            },
          };
        }
        return responseData;
      },
      // 장비별 교정 이력 조회
      // ✅ transformArrayResponse: 다양한 백엔드 응답 형태 자동 처리
      getEquipmentCalibrations: async (equipmentId) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.HISTORY(equipmentId)
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformArrayResponse'
        ])(response);
      },
      // 교정 상세 조회
      getCalibration: async (id) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.GET(id)
          );
        return response.data;
      },
      // 교정 정보 등록
      createCalibration: async (data) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.CREATE,
            data
          );
        return response.data;
      },
      // 교정 정보 수정
      updateCalibration: async (id, data) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.UPDATE(id),
            data
          );
        return response.data;
      },
      // 교정 정보 삭제
      deleteCalibration: async (id) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].delete(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.DELETE(id)
          );
        return response.data;
      },
      // 교정 요약 통계
      getCalibrationSummary: async (teamId, site) => {
        const params = new URLSearchParams();
        if (teamId) params.set('teamId', teamId);
        if (site) params.set('site', site);
        const qs = params.toString();
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].CALIBRATIONS.SUMMARY}${qs ? `?${qs}` : ''}`
          );
        return response.data;
      },
      // 교정 기한 초과 장비
      getOverdueCalibrations: async (teamId, site) => {
        const params = new URLSearchParams();
        if (teamId) params.set('teamId', teamId);
        if (site) params.set('site', site);
        const qs = params.toString();
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].CALIBRATIONS.OVERDUE}${qs ? `?${qs}` : ''}`
          );
        return response.data;
      },
      // 곧 교정이 필요한 장비
      getUpcomingCalibrations: async (days = 30, teamId, site) => {
        const params = new URLSearchParams();
        if (teamId) params.set('teamId', teamId);
        if (site) params.set('site', site);
        const qs = params.toString();
        const baseUrl =
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].CALIBRATIONS.UPCOMING(days);
        const separator = baseUrl.includes('?') ? '&' : '?';
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(`${baseUrl}${qs ? `${separator}${qs}` : ''}`);
        return response.data;
      },
      // 승인 대기 교정 목록 조회
      getPendingCalibrations: async () => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.PENDING
          );
        return response.data;
      },
      // 교정 승인
      approveCalibration: async (id, data) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.APPROVE(id),
            data
          );
        return response.data;
      },
      // 교정 반려
      rejectCalibration: async (id, data) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.REJECT(id),
            data
          );
        return response.data;
      },
      // 전체 중간점검 목록 조회 (팀/사이트 필터 지원)
      getAllIntermediateChecks: async (teamId, site) => {
        const params = new URLSearchParams();
        if (teamId) params.set('teamId', teamId);
        if (site) params.set('site', site);
        const qs = params.toString();
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].CALIBRATIONS.INTERMEDIATE_CHECKS.ALL}${qs ? `?${qs}` : ''}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        return response.data;
      },
      // 중간점검 예정 조회
      getUpcomingIntermediateChecks: async (days = 7) => {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CALIBRATIONS.INTERMEDIATE_CHECKS.LIST(days)
          );
        return response.data;
      },
      // 교정성적서 파일 업로드
      uploadCertificate: async (calibrationId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].post(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].CALIBRATIONS.CERTIFICATE(calibrationId),
          formData
        );
      },
    };
    const __TURBOPACK__default__export__ = calibrationApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/checkout-api.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    const checkoutApi = {
      /**
       * 반출 목록을 조회합니다.
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async getCheckouts(query = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].CHECKOUTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        // ✅ 공통 유틸리티 사용: 백엔드 응답을 프론트엔드 형식으로 변환
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformPaginatedResponse'
        ])(response);
      },
      /**
       * 특정 반출 정보를 조회합니다.
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async getCheckout(id) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.GET(id)
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 특정 사용자의 반출 이력을 조회합니다.
       */ async getUserCheckouts(userId, query = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].USERS.CHECKOUTS(userId)}?${queryParams.toString()}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        return response.data;
      },
      /**
       * 특정 장비의 반출 이력을 조회합니다.
       */ async getEquipmentCheckouts(equipmentId, query = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].EQUIPMENT.CHECKOUTS(equipmentId)}?${queryParams.toString()}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        return response.data;
      },
      /**
       * 새 반출 요청을 생성합니다.
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async createCheckout(data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.CREATE,
            data
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반출 정보를 업데이트합니다.
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async updateCheckout(id, data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.UPDATE(id),
            data
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반출 승인을 처리합니다 (1단계 승인 통합).
       * 모든 목적(교정/수리/외부 대여)에 대해 1단계 승인으로 통합되었습니다.
       * approverId는 백엔드에서 세션으로부터 자동 추출됩니다.
       * ✅ Phase 1: Optimistic Locking - version 필수
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async approveCheckout(id, version, notes) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.APPROVE(id),
            {
              version,
              notes,
            }
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반출 요청을 거부합니다.
       * ✅ Phase 1: Optimistic Locking - version 필수
       * ✅ Rule 2: approverId는 서버에서 추출 (클라이언트 미전송)
       */ async rejectCheckout(id, version, reason) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.REJECT(id),
            {
              version,
              reason,
            }
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반출을 시작합니다.
       * 상태: approved → checked_out
       * 장비 상태도 checked_out으로 자동 변경됩니다.
       * ✅ Phase 1: Optimistic Locking - version 필수
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async startCheckout(id, version, data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.START(id),
            {
              version,
              ...data,
            }
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반출지 목록을 조회합니다.
       * DB에서 사용된 실제 반출지 값들을 반환합니다.
       */ async getDestinations() {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.DESTINATIONS
          );
        return response.data?.data || response.data || [];
      },
      /**
       * 장비 반입(반납)을 처리합니다.
       * 상태: checked_out → returned (검사 완료, 기술책임자 승인 대기)
       * ✅ Phase 1: Optimistic Locking - version은 data에 포함
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async returnCheckout(id, data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.RETURN(id),
            data
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반입 최종 승인을 처리합니다 (기술책임자).
       * 상태: returned → return_approved
       * 장비 상태: available로 자동 복원
       * ✅ Phase 1: Optimistic Locking - version은 data에 포함
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async approveReturn(id, data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.APPROVE_RETURN(id),
            data
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 반입을 반려합니다 (기술책임자).
       * 상태: returned → checked_out (재검사/재반입 필요)
       * ✅ Phase 1: Optimistic Locking - version은 data에 포함
       * ✅ Rule 2: approverId는 서버에서 추출 (DTO에 미포함)
       */ async rejectReturn(id, data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.REJECT_RETURN(id),
            data
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 검사 완료된 반입 건 목록 조회 (기술책임자 승인 대기)
       * ✅ 공통 메서드 재사용: 중복 제거
       */ async getPendingReturnApprovals(query = {}) {
        return this.getCheckouts({
          ...query,
          statuses: 'returned',
        });
      },
      /**
       * 반출 요약 정보를 조회합니다.
       * ⚠️ 백엔드에 엔드포인트가 없음 - findAll로 대체하거나 백엔드에 구현 필요
       */ async getCheckoutSummary() {
        // ✅ 백엔드에 summary 엔드포인트가 없으므로 findAll로 대체
        const response = await this.getCheckouts({
          pageSize: 1,
        });
        // 간단한 요약 정보 생성 (실제로는 백엔드에서 제공해야 함)
        return {
          total: response.meta.pagination.total,
          pending: 0,
          approved: 0,
          overdue: 0,
          returnedToday: 0,
        };
      },
      /**
       * 기한이 지난 반출 목록을 조회합니다.
       * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
       * ✅ 공통 메서드 재사용: 중복 제거
       */ async getOverdueCheckouts(query = {}) {
        return this.getCheckouts({
          ...query,
          statuses: 'overdue',
        });
      },
      /**
       * 오늘 반입 예정인 반출 목록을 조회합니다.
       * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
       * ✅ 공통 메서드 재사용: 중복 제거
       */ async getTodayReturns(query = {}) {
        const today = new Date().toISOString().split('T')[0];
        return this.getCheckouts({
          ...query,
          endDate: today,
        });
      },
      // ============================================================================
      // 대여 목적 양측 4단계 확인 API
      // ============================================================================
      /**
       * 상태 확인을 등록합니다 (대여 목적).
       * 대여 목적 반출 시 양측 4단계 확인을 위한 API입니다.
       * ✅ Phase 1: Optimistic Locking - version은 data에 포함
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async submitConditionCheck(checkoutId, data) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.CONDITION_CHECK(checkoutId),
            data
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      },
      /**
       * 특정 반출의 상태 확인 기록을 조회합니다.
       * 대여 목적 반출의 양측 4단계 확인 이력을 조회합니다.
       */ async getConditionChecks(checkoutId) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].CHECKOUTS.CONDITION_CHECKS(checkoutId)
          );
        return response.data?.data || response.data || [];
      },
      /**
       * 확인 필요 목록을 조회합니다.
       * 현재 사용자가 확인해야 할 대여 건 목록을 조회합니다.
       * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
       */ async getPendingChecks(query = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].CHECKOUTS.PENDING_CHECKS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformPaginatedResponse'
        ])(response);
      },
    };
    const __TURBOPACK__default__export__ = checkoutApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/non-conformances-api.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    // ✅ SSOT: schemas 패키지에서 라벨 import
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    // 부적합 API 객체
    const nonConformancesApi = {
      // 부적합 목록 조회
      getNonConformances: async (query = {}) => {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].NON_CONFORMANCES.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .get(url)
          .then((res) =>
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'transformPaginatedResponse'
            ])(res)
          );
      },
      // 부적합 상세 조회
      getNonConformance: async (id) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.GET(id)
          )
          .then((res) => res.data);
      },
      // 장비별 열린 부적합 조회
      getEquipmentNonConformances: async (equipmentUuid) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.EQUIPMENT(equipmentUuid)
          )
          .then((res) => res.data);
      },
      // 부적합 등록
      createNonConformance: async (data) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.CREATE,
            data
          )
          .then((res) => res.data);
      },
      // 부적합 업데이트 (원인분석/조치 기록)
      updateNonConformance: async (id, data) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.UPDATE(id),
            data
          )
          .then((res) => res.data);
      },
      // 부적합 종료 (기술책임자)
      closeNonConformance: async (id, data) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.CLOSE(id),
            data
          )
          .then((res) => res.data);
      },
      // 부적합 조치 반려 (기술책임자: corrected → open)
      rejectCorrection: async (id, data) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.REJECT_CORRECTION(id),
            data
          )
          .then((res) => res.data);
      },
      // 부적합 삭제 (소프트 삭제)
      deleteNonConformance: async (id) => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .delete(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NON_CONFORMANCES.DELETE(id)
          )
          .then((res) => res.data);
      },
      // 종료 대기 중인 부적합 목록 (corrected 상태)
      getPendingCloseNonConformances: async () => {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ]
          .get(
            `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].NON_CONFORMANCES.LIST}?status=corrected`
          )
          .then((res) =>
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'transformPaginatedResponse'
            ])(res)
          );
      },
    };
    const __TURBOPACK__default__export__ = nonConformancesApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/equipment-import-api.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    // ============================================================================
    // API Client Methods
    // ============================================================================
    /**
     * Equipment Import API Client
     */ class EquipmentImportApi {
      /**
       * Get list of equipment imports with optional filters
       *
       * @param query - Query parameters including sourceType filter
       * @returns Paginated list of equipment imports
       *
       * @example
       * // Get all imports
       * const all = await equipmentImportApi.getList();
       *
       * // Get only rental imports
       * const rentals = await equipmentImportApi.getList({ sourceType: 'rental' });
       *
       * // Get only internal shared imports
       * const internal = await equipmentImportApi.getList({ sourceType: 'internal_shared' });
       */ async getList(query) {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', String(query.page));
        if (query?.limit) params.append('limit', String(query.limit));
        if (query?.sourceType) params.append('sourceType', query.sourceType);
        if (query?.status) params.append('status', query.status);
        if (query?.site) params.append('site', query.site);
        if (query?.teamId) params.append('teamId', query.teamId);
        if (query?.search) params.append('search', query.search);
        if (query?.sortBy) params.append('sortBy', query.sortBy);
        if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
        const queryString = params.toString();
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].EQUIPMENT_IMPORTS.LIST}${queryString ? `?${queryString}` : ''}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        return response.data;
      }
      /**
       * Get a single equipment import by ID
       *
       * @param id - Equipment import UUID
       * @returns Equipment import details (rental or internal shared)
       */ async getOne(id) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.GET(id)
          );
        return response.data;
      }
      /**
       * Create a new equipment import
       *
       * Supports both rental and internal shared imports through discriminated union.
       * The backend validates conditional fields based on sourceType.
       *
       * @param dto - Create DTO (rental or internal shared)
       * @returns Created equipment import
       *
       * @example
       * // Create rental import
       * const rental = await equipmentImportApi.create({
       *   sourceType: 'rental',
       *   equipmentName: 'Test Equipment',
       *   vendorName: 'ABC Rental',
       *   classification: 'fcc_emc_rf',
       *   usagePeriodStart: '2026-03-01T00:00:00Z',
       *   usagePeriodEnd: '2026-06-01T00:00:00Z',
       *   reason: 'For EMC testing',
       * });
       *
       * // Create internal shared import
       * const internal = await equipmentImportApi.create({
       *   sourceType: 'internal_shared',
       *   equipmentName: 'Spectrum Analyzer',
       *   ownerDepartment: 'Safety Lab',
       *   classification: 'fcc_emc_rf',
       *   usagePeriodStart: '2026-03-01T00:00:00Z',
       *   usagePeriodEnd: '2026-06-01T00:00:00Z',
       *   reason: 'For special EMC testing',
       * });
       */ async create(dto) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.CREATE,
            dto
          );
        return response.data;
      }
      /**
       * Approve an equipment import
       *
       * Approver is extracted from the authenticated session (backend).
       * Works for both rental and internal shared imports.
       *
       * @param id - Equipment import UUID
       * @param version - Version for optimistic locking
       * @param comment - Optional approval comment
       * @returns Updated equipment import
       */ async approve(id, version, comment) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.APPROVE(id),
            {
              version,
              comment,
            }
          );
        return response.data;
      }
      /**
       * Reject an equipment import
       *
       * Works for both rental and internal shared imports.
       *
       * @param id - Equipment import UUID
       * @param version - Version for optimistic locking
       * @param reason - Rejection reason (required)
       * @returns Updated equipment import
       */ async reject(id, version, reason) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.REJECT(id),
            {
              version,
              rejectionReason: reason,
            }
          );
        return response.data;
      }
      /**
       * Receive equipment (auto-create equipment record)
       *
       * After receiving:
       * - Rental imports: equipment.sharedSource = 'external'
       * - Internal shared imports: equipment.sharedSource = 'internal_shared'
       *
       * Equipment owner is set to:
       * - Rental: vendorName
       * - Internal shared: ownerDepartment
       *
       * @param id - Equipment import UUID
       * @param dto - Receiving condition and calibration info
       * @returns Updated equipment import
       */ async receive(id, dto) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.RECEIVE(id),
            dto
          );
        return response.data;
      }
      /**
       * Initiate return process (create return checkout)
       *
       * Return destination is determined by sourceType:
       * - Rental: vendorName
       * - Internal shared: ownerDepartment
       *
       * @param id - Equipment import UUID
       * @returns Created checkout ID for return tracking
       */ async initiateReturn(id) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.INITIATE_RETURN(id)
          );
        return response.data;
      }
      /**
       * Cancel an equipment import
       *
       * Only allowed for 'pending' status.
       * Works for both rental and internal shared imports.
       *
       * @param id - Equipment import UUID
       * @param reason - Cancellation reason (required)
       * @returns Updated equipment import
       */ async cancel(id, reason) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT_IMPORTS.CANCEL(id),
            {
              reason,
            }
          );
        return response.data;
      }
    }
    // Export singleton instance
    const equipmentImportApi = new EquipmentImportApi();
    const __TURBOPACK__default__export__ = equipmentImportApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/disposal-api.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'approveDisposal',
      () => approveDisposal,
      'cancelDisposalRequest',
      () => cancelDisposalRequest,
      'default',
      () => __TURBOPACK__default__export__,
      'getCurrentDisposalRequest',
      () => getCurrentDisposalRequest,
      'requestDisposal',
      () => requestDisposal,
      'reviewDisposal',
      () => reviewDisposal,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    async function requestDisposal(equipmentId, data) {
      if (data.attachments && data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('reason', data.reason);
        formData.append('reasonDetail', data.reasonDetail);
        data.attachments.forEach((file) => formData.append('attachments', file));
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].post(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT.DISPOSAL.REQUEST(equipmentId),
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      }
      const response =
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].post(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].EQUIPMENT.DISPOSAL.REQUEST(equipmentId),
          {
            reason: data.reason,
            reasonDetail: data.reasonDetail,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'transformSingleResponse'
      ])(response);
    }
    async function reviewDisposal(equipmentId, data) {
      const response =
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].post(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].EQUIPMENT.DISPOSAL.REVIEW(equipmentId),
          data
        );
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'transformSingleResponse'
      ])(response);
    }
    async function approveDisposal(equipmentId, data) {
      const response =
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].post(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].EQUIPMENT.DISPOSAL.APPROVE(equipmentId),
          data
        );
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'transformSingleResponse'
      ])(response);
    }
    async function cancelDisposalRequest(equipmentId) {
      const response =
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].delete(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].EQUIPMENT.DISPOSAL.CANCEL(equipmentId)
        );
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'transformSingleResponse'
      ])(response);
    }
    async function getCurrentDisposalRequest(equipmentId) {
      try {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].EQUIPMENT.DISPOSAL.CURRENT(equipmentId)
          );
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'transformSingleResponse'
        ])(response);
      } catch (error) {
        // 404 is expected when there's no disposal request - return null
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    }
    const disposalApi = {
      requestDisposal,
      reviewDisposal,
      approveDisposal,
      cancelDisposalRequest,
      getCurrentDisposalRequest,
    };
    const __TURBOPACK__default__export__ = disposalApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'APPROVAL_SECTIONS',
      () => APPROVAL_SECTIONS,
      'REJECTION_MIN_LENGTH',
      () => REJECTION_MIN_LENGTH,
      'ROLE_TABS',
      () => ROLE_TABS,
      'TAB_META',
      () => TAB_META,
      'approvalsApi',
      () => approvalsApi,
      'default',
      () => __TURBOPACK__default__export__,
    ]);
    /**
     * 통합 승인 관리 API
     *
     * ⚠️ SSOT: 이 파일은 기존 개별 API들을 통합하여 승인 관리 페이지에서 사용합니다.
     * - 기존 API 파일들을 재사용 (calibration-api, checkout-api 등)
     * - 역할별 필터링 로직 포함
     *
     * @see docs/development/FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지_수정O).md
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$calibration$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/calibration-api.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/checkout-api.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$non$2d$conformances$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/non-conformances-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/equipment-import-api.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/disposal-api.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    const ROLE_TABS = {
      test_engineer: [],
      technical_manager: [
        'outgoing',
        'incoming',
        'equipment',
        'calibration',
        'inspection',
        'nonconformity',
        'disposal_review',
        'software',
      ],
      quality_manager: ['plan_review'],
      lab_manager: ['disposal_final', 'plan_final', 'incoming'],
      system_admin: [],
    };
    const APPROVAL_SECTIONS = {
      checkout: {
        labelKey: 'sections.checkout',
        order: 0,
      },
      equipment: {
        labelKey: 'sections.equipment',
        order: 1,
      },
      management: {
        labelKey: 'sections.management',
        order: 2,
      },
    };
    const REJECTION_MIN_LENGTH = 10;
    const TAB_META = {
      // Direction-based (checkout section)
      outgoing: {
        labelKey: 'tabMeta.outgoing.label',
        icon: 'ArrowUpFromLine',
        actionKey: 'tabMeta.outgoing.action',
        section: 'checkout',
      },
      incoming: {
        labelKey: 'tabMeta.incoming.label',
        icon: 'ArrowDownToLine',
        actionKey: 'tabMeta.incoming.action',
        section: 'checkout',
      },
      // Equipment section
      equipment: {
        labelKey: 'tabMeta.equipment.label',
        icon: 'Package',
        actionKey: 'tabMeta.equipment.action',
        section: 'equipment',
      },
      calibration: {
        labelKey: 'tabMeta.calibration.label',
        icon: 'FileCheck',
        actionKey: 'tabMeta.calibration.action',
        section: 'equipment',
      },
      inspection: {
        labelKey: 'tabMeta.inspection.label',
        icon: 'ClipboardCheck',
        actionKey: 'tabMeta.inspection.action',
        section: 'equipment',
      },
      nonconformity: {
        labelKey: 'tabMeta.nonconformity.label',
        icon: 'AlertTriangle',
        actionKey: 'tabMeta.nonconformity.action',
        section: 'equipment',
      },
      // Management section
      disposal_review: {
        labelKey: 'tabMeta.disposal_review.label',
        icon: 'Trash2',
        actionKey: 'tabMeta.disposal_review.action',
        commentRequired: true,
        commentDialogTitleKey: 'tabMeta.disposal_review.commentDialogTitle',
        commentPlaceholderKey: 'tabMeta.disposal_review.commentPlaceholder',
        multiStep: true,
        multiStepType: 'disposal',
        section: 'management',
      },
      disposal_final: {
        labelKey: 'tabMeta.disposal_final.label',
        icon: 'Trash2',
        actionKey: 'tabMeta.disposal_final.action',
        multiStep: true,
        multiStepType: 'disposal',
        section: 'management',
      },
      plan_review: {
        labelKey: 'tabMeta.plan_review.label',
        icon: 'Calendar',
        actionKey: 'tabMeta.plan_review.action',
        multiStep: true,
        multiStepType: 'calibration_plan',
        section: 'management',
      },
      plan_final: {
        labelKey: 'tabMeta.plan_final.label',
        icon: 'Calendar',
        actionKey: 'tabMeta.plan_final.action',
        multiStep: true,
        multiStepType: 'calibration_plan',
        section: 'management',
      },
      software: {
        labelKey: 'tabMeta.software.label',
        icon: 'Code',
        actionKey: 'tabMeta.software.action',
        section: 'management',
      },
    };
    // ============================================================================
    // 승인 관리 API
    // ============================================================================
    class ApprovalsApi {
      /**
       * 카테고리별 승인 대기 목록 조회
       */ async getPendingItems(category, teamId) {
        switch (category) {
          // Direction-based (consolidated)
          case 'outgoing':
            return this.getPendingOutgoing(teamId);
          case 'incoming':
            return this.getPendingIncoming(teamId);
          // Specialized
          case 'equipment':
            return this.getPendingEquipmentApprovals(teamId);
          case 'calibration':
            return this.getPendingCalibrations(teamId);
          case 'inspection':
            return this.getPendingInspections();
          case 'nonconformity':
            return this.getPendingNonConformities();
          case 'disposal_review':
            return this.getPendingDisposalReviews();
          case 'disposal_final':
            return this.getPendingDisposalFinals();
          case 'plan_review':
            return this.getPendingPlanReviews();
          case 'plan_final':
            return this.getPendingPlanFinals();
          case 'software':
            return this.getPendingSoftwareApprovals();
          default:
            return [];
        }
      }
      /**
       * 반출 승인 대기 목록 조회 (통합)
       *
       * Combines:
       * - Regular checkouts (calibration, repair, rental, etc.)
       * - Equipment being returned to vendors (purpose='return_to_vendor')
       *
       * 팀 필터링: 백엔드에서 역할 기반 자동 필터링 (technical_manager → teamId, others → site)
       */ async getPendingOutgoing(_teamId) {
        try {
          const [regularCheckouts, vendorReturns] = await Promise.all([
            // Regular checkouts - backend filters by team/site automatically
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getCheckouts({
              statuses: 'pending',
            }),
            // Vendor returns - backend filters by team/site automatically
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getCheckouts({
              statuses: 'pending',
              purpose: 'return_to_vendor',
            }),
          ]);
          const regularItems = (regularCheckouts.data || []).map((item) =>
            this.mapCheckoutToApprovalItem(item, 'outgoing')
          );
          const vendorReturnItems = (vendorReturns.data || []).map((item) =>
            this.mapCheckoutToApprovalItem(item, 'outgoing')
          );
          return [...regularItems, ...vendorReturnItems];
        } catch {
          return [];
        }
      }
      /**
       * 반입 승인 대기 목록 조회 (통합)
       *
       * Combines:
       * - Equipment returning from calibration/repair
       * - Rental equipment arriving from vendors
       * - Shared equipment arriving from other teams
       *
       * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
       */ async getPendingIncoming(_teamId) {
        try {
          const [returns, rentalImports, sharedImports] = await Promise.all([
            // Equipment returning - backend filters automatically
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getPendingReturnApprovals(),
            // Rental equipment arriving - backend filters by site (equipmentImports.site)
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getList({
              status: 'pending',
              sourceType: 'rental',
            }),
            // Shared equipment arriving - backend filters by site
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getList({
              status: 'pending',
              sourceType: 'internal_shared',
            }),
          ]);
          const returnItems = (returns.data || []).map((item) =>
            this.mapCheckoutToApprovalItem(item, 'incoming')
          );
          const rentalItems = (rentalImports.items || []).map((item) =>
            this.mapEquipmentImportToApprovalItem(item, 'incoming')
          );
          const sharedItems = (sharedImports.items || []).map((item) =>
            this.mapEquipmentImportToApprovalItem(item, 'incoming')
          );
          return [...returnItems, ...rentalItems, ...sharedItems];
        } catch {
          return [];
        }
      }
      /**
       * 교정 승인 대기 목록 조회
       */ async getPendingCalibrations(_teamId) {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$calibration$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getPendingCalibrations();
          // getPendingCalibrations returns { items: Calibration[] }
          const items = response.items || [];
          // Note: teamId 필터링은 별도 장비 조회가 필요하므로 현재는 생략
          return items.map((item) => this.mapCalibrationToApprovalItem(item));
        } catch {
          return [];
        }
      }
      /**
       * 반출 승인 대기 목록 조회
       *
       * @deprecated Use getPendingOutgoing() instead (consolidates checkouts + vendor returns)
       *
       * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
       */ async getPendingCheckouts(_teamId) {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getCheckouts({
              statuses: 'pending',
            });
          // PaginatedResponse uses 'data' field
          const items = response.data || [];
          return items.map((item) => this.mapCheckoutToApprovalItem(item, 'outgoing'));
        } catch {
          return [];
        }
      }
      /**
       * 반입 승인 대기 목록 조회
       *
       * @deprecated Use getPendingIncoming() instead (consolidates returns + imports)
       *
       * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
       */ async getPendingReturns(_teamId) {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getPendingReturnApprovals();
          // PaginatedResponse uses 'data' field
          const items = response.data || [];
          return items.map((item) => this.mapCheckoutToApprovalItem(item, 'incoming'));
        } catch {
          return [];
        }
      }
      /**
       * 교정계획서 검토 대기 목록 조회 (품질책임자)
       */ async getPendingPlanReviews() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATION_PLANS.PENDING_REVIEW
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          return items.map((item) => this.mapPlanToApprovalItem(item, 'plan_review'));
        } catch {
          return [];
        }
      }
      /**
       * 교정계획서 최종 승인 대기 목록 조회 (시험소장)
       */ async getPendingPlanFinals() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATION_PLANS.PENDING_APPROVAL
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          return items.map((item) => this.mapPlanToApprovalItem(item, 'plan_final'));
        } catch {
          return [];
        }
      }
      /**
       * 장비 승인 대기 목록 조회
       */ async getPendingEquipmentApprovals(_teamId) {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].EQUIPMENT.REQUESTS.PENDING
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          return items.map((item) => this.mapEquipmentRequestToApprovalItem(item));
        } catch {
          return [];
        }
      }
      /**
       * 소프트웨어 승인 대기 목록 조회
       */ async getPendingSoftwareApprovals() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].SOFTWARE.PENDING
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          return items.map((item) => this.mapSoftwareToApprovalItem(item));
        } catch {
          return [];
        }
      }
      /**
       * 부적합 재개 승인 대기 목록 조회
       */ async getPendingNonConformities() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$non$2d$conformances$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].getPendingCloseNonConformances();
          // PaginatedResponse uses 'data' field
          const items = response.data || [];
          return items
            .filter((item) => {
              // damage/malfunction 유형은 수리 기록이 필요
              const requiresRepair = ['damage', 'malfunction'].includes(item.ncType);
              if (requiresRepair && !item.repairHistoryId) {
                console.warn(`부적합 ${item.id}는 수리 기록이 없어 승인할 수 없습니다.`);
                return false; // 목록에서 제외
              }
              return true;
            })
            .map((item) => this.mapNonConformanceToApprovalItem(item));
        } catch {
          return [];
        }
      }
      /**
       * 중간점검 승인 대기 목록 조회
       */ async getPendingInspections() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATIONS.INTERMEDIATE_CHECKS.ALL
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          // 완료되지 않은 중간점검만 필터링
          const pendingItems = items.filter((item) => !item.completed);
          return pendingItems.map((item) => this.mapInspectionToApprovalItem(item));
        } catch {
          return [];
        }
      }
      /**
       * 공용/렌탈장비 사용 승인 대기 목록 조회
       *
       * @deprecated Use getPendingOutgoing() instead (consolidated into outgoing category)
       */ async getPendingCommonEquipment() {
        // 공용/렌탈장비는 체크아웃 시스템을 사용하므로 체크아웃 목록과 동일
        // 타입 필터링이 필요하면 추가
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getCheckouts({
              statuses: 'pending',
            });
          const items = response.data || [];
          return items.map((item) => this.mapCheckoutToApprovalItem(item, 'outgoing'));
        } catch {
          return [];
        }
      }
      /**
       * 폐기 검토 대기 목록 조회 (기술책임자)
       */ async getPendingDisposalReviews() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].EQUIPMENT.DISPOSAL.PENDING_REVIEW
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          return items.map((item) => this.mapDisposalToApprovalItem(item, 'disposal_review'));
        } catch {
          return [];
        }
      }
      /**
       * 폐기 최종 승인 대기 목록 조회 (시험소장)
       */ async getPendingDisposalFinals() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].EQUIPMENT.DISPOSAL.PENDING_APPROVAL
            );
          const items = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'transformArrayResponse'
          ])(response);
          return items.map((item) => this.mapDisposalToApprovalItem(item, 'disposal_final'));
        } catch {
          return [];
        }
      }
      /**
       * 렌탈 반입 승인 대기 목록 조회
       *
       * @deprecated Use getPendingIncoming() instead (consolidated into incoming category)
       */ async getPendingRentalImports() {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getList({
              status: 'pending',
              sourceType: 'rental',
            });
          const items = response.items || [];
          return items.map((item) => this.mapEquipmentImportToApprovalItem(item, 'incoming'));
        } catch {
          return [];
        }
      }
      /**
       * 카테고리별 대기 개수 조회
       *
       * ✅ SSOT: 백엔드 통합 API 사용
       * 기존 13개 별도 API 호출 → 1개 통합 API 호출
       *
       * Performance:
       * - Before: 13 serial API calls (~1.3s)
       * - After: 1 API call (~100ms)
       * - Improvement: 92% faster
       */ async getPendingCounts(_role) {
        try {
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].APPROVALS.COUNTS
            );
          return response.data || this.getEmptyCounts();
        } catch (error) {
          console.error('Failed to fetch approval counts:', error);
          return this.getEmptyCounts();
        }
      }
      /**
       * 승인 KPI 조회 — 서버 사이드 집계
       *
       * @param category - 카테고리 (urgentCount/avgWaitDays 집계 대상)
       */ async getKpi(category) {
        try {
          const params = category ? `?category=${encodeURIComponent(category)}` : '';
          const response =
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].get(
              `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].APPROVALS.KPI}${params}`
            );
          return (
            response.data || {
              todayProcessed: 0,
              urgentCount: 0,
              avgWaitDays: 0,
            }
          );
        } catch {
          return {
            todayProcessed: 0,
            urgentCount: 0,
            avgWaitDays: 0,
          };
        }
      }
      /**
       * 빈 카운트 객체 반환 (fallback)
       */ getEmptyCounts() {
        return {
          outgoing: 0,
          incoming: 0,
          equipment: 0,
          calibration: 0,
          inspection: 0,
          nonconformity: 0,
          disposal_review: 0,
          disposal_final: 0,
          plan_review: 0,
          plan_final: 0,
          software: 0,
        };
      }
      /**
       * 승인 처리
       */ async approve(category, id, approverId, comment, equipmentId, originalData) {
        switch (category) {
          // Direction-based (consolidated)
          case 'outgoing': {
            // ✅ Optimized: use version from originalData, fallback to fetch
            const outgoingVersion =
              this.extractVersion(originalData) ??
              (
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'default'
                ].getCheckout(id)
              ).version;
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].approveCheckout(id, outgoingVersion, comment);
            break;
          }
          case 'incoming':
            // Incoming can be: checkout return OR equipment import
            // Determine type from originalData
            if (this.isCheckout(originalData)) {
              const incomingVersion =
                this.extractVersion(originalData) ??
                (
                  await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'default'
                  ].getCheckout(id)
                ).version;
              await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ].approveReturn(id, {
                version: incomingVersion,
                comment,
              });
            } else if (this.isEquipmentImport(originalData)) {
              const importVersion =
                this.extractVersion(originalData) ??
                (
                  await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'default'
                  ].getOne(id)
                ).version;
              await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ].approve(id, importVersion, comment);
            } else {
              throw new Error('Unknown incoming item type');
            }
            break;
          // Specialized
          case 'equipment':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].post(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].EQUIPMENT.REQUESTS.APPROVE(id)
            );
            break;
          case 'calibration': {
            const calVersion =
              this.extractVersion(originalData) ??
              (
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$calibration$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'default'
                ].getCalibration(id)
              ).version;
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$calibration$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].approveCalibration(id, {
              version: calVersion,
              approverComment: comment || undefined,
            });
            break;
          }
          case 'inspection':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].post(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(id),
              {
                comment,
              }
            );
            break;
          case 'nonconformity': {
            const ncVersion =
              this.extractVersion(originalData) ??
              (
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$non$2d$conformances$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'default'
                ].getNonConformance(id)
              ).version;
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$non$2d$conformances$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].closeNonConformance(id, {
              version: ncVersion,
              closureNotes: comment,
            });
            break;
          }
          case 'disposal_review': {
            if (!equipmentId) throw new Error('equipmentId is required for disposal review');
            const reviewVersion =
              this.extractVersion(originalData) ??
              (
                await (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getCurrentDisposalRequest'
                ])(equipmentId)
              )?.version;
            if (reviewVersion === undefined) throw new Error('Disposal request not found');
            await (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'reviewDisposal'
            ])(equipmentId, {
              version: reviewVersion,
              decision: 'approve',
              opinion: comment || '승인합니다',
            });
            break;
          }
          case 'disposal_final': {
            if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
            const finalVersion =
              this.extractVersion(originalData) ??
              (
                await (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getCurrentDisposalRequest'
                ])(equipmentId)
              )?.version;
            if (finalVersion === undefined) throw new Error('Disposal request not found');
            await (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'approveDisposal'
            ])(equipmentId, {
              version: finalVersion,
              decision: 'approve',
              comment: comment || '승인합니다',
            });
            break;
          }
          case 'plan_review':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].patch(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATION_PLANS.REVIEW(id),
              {
                comment,
              }
            );
            break;
          case 'plan_final':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].patch(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATION_PLANS.APPROVE(id),
              {
                comment,
              }
            );
            break;
          case 'software':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].patch(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].SOFTWARE.APPROVE(id),
              {
                comment,
              }
            );
            break;
          default:
            throw new Error(`Unsupported category: ${category}`);
        }
      }
      /**
       * 반려 처리
       */ async reject(category, id, approverId, reason, equipmentId, originalData) {
        switch (category) {
          // Direction-based (consolidated)
          case 'outgoing': {
            const outgoingVersion =
              this.extractVersion(originalData) ??
              (
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'default'
                ].getCheckout(id)
              ).version;
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].rejectCheckout(id, outgoingVersion, reason);
            break;
          }
          case 'incoming':
            if (this.isCheckout(originalData)) {
              const incomingVersion =
                this.extractVersion(originalData) ??
                (
                  await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'default'
                  ].getCheckout(id)
                ).version;
              await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$checkout$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ].rejectReturn(id, {
                version: incomingVersion,
                reason,
              });
            } else if (this.isEquipmentImport(originalData)) {
              const importVersion =
                this.extractVersion(originalData) ??
                (
                  await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'default'
                  ].getOne(id)
                ).version;
              await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$equipment$2d$import$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ].reject(id, importVersion, reason);
            } else {
              throw new Error('Unknown incoming item type');
            }
            break;
          // Specialized
          case 'equipment':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].post(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].EQUIPMENT.REQUESTS.REJECT(id),
              {
                rejectionReason: reason,
              }
            );
            break;
          case 'calibration': {
            const calVersion =
              this.extractVersion(originalData) ??
              (
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$calibration$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'default'
                ].getCalibration(id)
              ).version;
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$calibration$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].rejectCalibration(id, {
              version: calVersion,
              rejectionReason: reason,
            });
            break;
          }
          case 'inspection':
            throw new Error('중간점검은 반려할 수 없습니다.');
          case 'nonconformity': {
            const ncRejectVersion =
              this.extractVersion(originalData) ??
              (
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$non$2d$conformances$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'default'
                ].getNonConformance(id)
              ).version;
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$non$2d$conformances$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].rejectCorrection(id, {
              version: ncRejectVersion,
              rejectionReason: reason,
            });
            break;
          }
          case 'disposal_review': {
            if (!equipmentId) throw new Error('equipmentId is required for disposal review');
            const reviewVersion =
              this.extractVersion(originalData) ??
              (
                await (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getCurrentDisposalRequest'
                ])(equipmentId)
              )?.version;
            if (reviewVersion === undefined) throw new Error('Disposal request not found');
            await (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'reviewDisposal'
            ])(equipmentId, {
              version: reviewVersion,
              decision: 'reject',
              opinion: reason || '반려합니다',
            });
            break;
          }
          case 'disposal_final': {
            if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
            const finalVersion =
              this.extractVersion(originalData) ??
              (
                await (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getCurrentDisposalRequest'
                ])(equipmentId)
              )?.version;
            if (finalVersion === undefined) throw new Error('Disposal request not found');
            await (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$disposal$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'approveDisposal'
            ])(equipmentId, {
              version: finalVersion,
              decision: 'reject',
              comment: reason || '반려합니다',
            });
            break;
          }
          case 'plan_review':
          case 'plan_final':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].patch(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].CALIBRATION_PLANS.REJECT(id),
              {
                reason,
              }
            );
            break;
          case 'software':
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'apiClient'
            ].patch(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'API_ENDPOINTS'
              ].SOFTWARE.REJECT(id),
              {
                reason,
              }
            );
            break;
          default:
            throw new Error(`Unsupported category: ${category}`);
        }
      }
      /**
       * 일괄 승인 처리
       *
       * Note: For disposal categories and consolidated categories (outgoing/incoming),
       * we need to fetch the items first to get equipmentId or originalData
       */ async bulkApprove(category, ids, approverId, comment) {
        const success = [];
        const failed = [];
        // For disposal categories and consolidated categories, fetch items first
        let itemsMap;
        if (
          category === 'disposal_review' ||
          category === 'disposal_final' ||
          category === 'outgoing' ||
          category === 'incoming'
        ) {
          const items = await this.getPendingItems(category);
          itemsMap = new Map(items.map((item) => [item.id, item]));
        }
        for (const id of ids) {
          try {
            let equipmentId;
            let originalData;
            if (itemsMap) {
              const item = itemsMap.get(id);
              equipmentId = item?.details?.equipmentId;
              originalData = item?.originalData;
            }
            await this.approve(category, id, approverId, comment, equipmentId, originalData);
            success.push(id);
          } catch {
            failed.push(id);
          }
        }
        return {
          success,
          failed,
        };
      }
      /**
       * 일괄 반려 처리
       *
       * Note: For disposal categories and consolidated categories (outgoing/incoming),
       * we need to fetch the items first to get equipmentId or originalData
       */ async bulkReject(category, ids, approverId, reason) {
        const success = [];
        const failed = [];
        // For disposal categories and consolidated categories, fetch items first
        let itemsMap;
        if (
          category === 'disposal_review' ||
          category === 'disposal_final' ||
          category === 'outgoing' ||
          category === 'incoming'
        ) {
          const items = await this.getPendingItems(category);
          itemsMap = new Map(items.map((item) => [item.id, item]));
        }
        for (const id of ids) {
          try {
            let equipmentId;
            let originalData;
            if (itemsMap) {
              const item = itemsMap.get(id);
              equipmentId = item?.details?.equipmentId;
              originalData = item?.originalData;
            }
            await this.reject(category, id, approverId, reason, equipmentId, originalData);
            success.push(id);
          } catch {
            failed.push(id);
          }
        }
        return {
          success,
          failed,
        };
      }
      // ============================================================================
      // 헬퍼 메서드
      // ============================================================================
      /**
       * Extract version from originalData (avoids extra fetch when version is already available)
       */ extractVersion(data) {
        if (data && typeof data === 'object' && 'version' in data) {
          const v = data.version;
          return typeof v === 'number' ? v : undefined;
        }
        return undefined;
      }
      /**
       * Type guard: Check if data is a Checkout
       */ isCheckout(data) {
        if (!data || typeof data !== 'object') return false;
        const obj = data;
        return 'equipmentIds' in obj || 'destination' in obj || 'purpose' in obj;
      }
      /**
       * Type guard: Check if data is an EquipmentImport
       */ isEquipmentImport(data) {
        if (!data || typeof data !== 'object') return false;
        const obj = data;
        return 'sourceType' in obj && ('vendorName' in obj || 'ownerDepartment' in obj);
      }
      mapCalibrationToApprovalItem(calibration) {
        // Note: Calibration 타입에는 equipment 조인 정보가 없음
        // 필요시 별도로 장비 정보를 조회해야 함
        // registeredByUser 관계를 통해 사용자 정보 추출
        const registeredByUser = calibration.registeredByUser;
        const team = registeredByUser?.team;
        return {
          id: calibration.id,
          category: 'calibration',
          status: this.mapCalibrationStatus(calibration.approvalStatus),
          requesterId: calibration.registeredBy || '',
          requesterName: registeredByUser?.name
            ? String(registeredByUser.name)
            : calibration.registeredByRole ===
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'UserRoleValues'
                ].TEST_ENGINEER
              ? '시험실무자'
              : '기술책임자',
          requesterTeam: team?.name ? String(team.name) : '',
          requestedAt: calibration.createdAt,
          summary: `장비(${calibration.equipmentId}) 교정 기록 등록`,
          details: {
            equipmentId: calibration.equipmentId,
            calibrationDate: calibration.calibrationDate,
            nextCalibrationDate: calibration.nextCalibrationDate,
            result: calibration.result,
            calibrationAgency: calibration.calibrationAgency,
            certificateNumber: calibration.certificateNumber,
          },
          originalData: calibration,
        };
      }
      mapCheckoutToApprovalItem(checkout, category) {
        const equipmentNames = checkout.equipment?.map((e) => e.name).join(', ') || '장비';
        // user.team 관계를 통해 팀 정보 추출
        const user = checkout.user;
        const team = user?.team;
        return {
          id: checkout.id,
          category,
          status: this.mapCheckoutStatus(checkout.status),
          requesterId: checkout.requesterId || checkout.userId || '',
          requesterName: checkout.user?.name || '알 수 없음',
          requesterTeam: team?.name ? String(team.name) : '',
          requestedAt: checkout.createdAt,
          summary:
            category === 'outgoing'
              ? `${equipmentNames} 반출 요청`
              : `${equipmentNames} 반입 승인 대기`,
          details: {
            equipmentIds: checkout.equipmentIds,
            equipment: checkout.equipment,
            destination: checkout.destination,
            purpose: checkout.purpose,
            expectedReturnDate: checkout.expectedReturnDate,
          },
          originalData: checkout,
        };
      }
      mapPlanToApprovalItem(plan, category) {
        // 백엔드 findAll()이 LEFT JOIN으로 플랫 필드 반환: authorName, teamName
        const siteId = String(plan.siteId || '');
        const siteLabel =
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SITE_LABELS'
          ][siteId] || siteId;
        return {
          id: String(plan.id),
          category,
          status: this.mapPlanStatus(String(plan.status)),
          requesterId: String(plan.createdBy || ''),
          requesterName: plan.authorName ? String(plan.authorName) : '알 수 없음',
          requesterTeam: plan.teamName ? String(plan.teamName) : '',
          requestedAt: String(plan.createdAt || ''),
          summary: `${plan.year || ''}년 ${siteLabel} 교정계획서`,
          details: plan,
          originalData: plan,
        };
      }
      mapSoftwareToApprovalItem(item) {
        // 백엔드 findHistory()가 LEFT JOIN으로 플랫 필드 반환: changerName, teamName, equipmentName
        return {
          id: String(item.id),
          category: 'software',
          status: 'pending_review',
          requesterId: String(item.changedBy || ''),
          requesterName: item.changerName ? String(item.changerName) : '알 수 없음',
          requesterTeam: item.teamName ? String(item.teamName) : '',
          requestedAt: String(item.changedAt || item.createdAt || ''),
          summary: `${item.softwareName || '소프트웨어'} 변경 요청`,
          details: item,
          originalData: item,
        };
      }
      mapNonConformanceToApprovalItem(nc) {
        // 백엔드 relation 이름: corrector, discoverer (correctedByUser/discoveredByUser가 아님)
        const corrector = nc.corrector;
        const discoverer = nc.discoverer;
        const user = corrector || discoverer;
        const team = user?.team;
        return {
          id: nc.id,
          category: 'nonconformity',
          status: 'pending',
          requesterId: nc.correctedBy || nc.discoveredBy || '',
          requesterName: user?.name ? String(user.name) : '시험실무자',
          requesterTeam: team?.name ? String(team.name) : '',
          requestedAt: nc.correctionDate || nc.discoveryDate,
          summary: `${nc.cause} (조치 완료)`,
          details: {
            equipmentId: nc.equipmentId,
            discoveryDate: nc.discoveryDate,
            cause: nc.cause,
            ncType: nc.ncType,
            correctionContent: nc.correctionContent,
            correctionDate: nc.correctionDate,
            actionPlan: nc.actionPlan,
            rejectionReason: nc.rejectionReason,
            rejectedAt: nc.rejectedAt,
          },
          originalData: nc,
        };
      }
      mapInspectionToApprovalItem(item) {
        // 백엔드 findAllIntermediateChecks()가 플랫 필드 반환: equipmentName, team, teamName
        return {
          id: String(item.calibrationId || item.id),
          category: 'inspection',
          status: 'pending',
          requesterId: '',
          requesterName: '자동 알림',
          requesterTeam: item.teamName ? String(item.teamName) : item.team ? String(item.team) : '',
          requestedAt: String(item.nextIntermediateCheckDate || item.createdAt || ''),
          summary: `${item.equipmentName || '장비'} 중간점검`,
          details: item,
          originalData: item,
        };
      }
      mapDisposalToApprovalItem(item, category) {
        const equipment = item.equipment;
        const requester = item.requester;
        const team = requester?.team;
        return {
          id: String(item.id),
          category,
          status:
            category === 'disposal_review'
              ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'UnifiedApprovalStatusValues'
                ].PENDING
              : __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'UnifiedApprovalStatusValues'
                ].REVIEWED,
          requesterId: String(item.requestedBy || ''),
          requesterName: requester?.name ? String(requester.name) : '알 수 없음',
          requesterTeam: team?.name ? String(team.name) : '',
          requestedAt: String(item.requestedAt || ''),
          summary: `${equipment?.name || '장비'} (${equipment?.managementNumber || ''}) 폐기 ${category === 'disposal_review' ? '검토' : '승인'}`,
          details: {
            reason: item.reason,
            reasonDetail: item.reasonDetail,
            equipmentId: item.equipmentId,
            equipment,
            reviewOpinion: item.reviewOpinion,
            reviewedAt: item.reviewedAt,
          },
          originalData: item,
        };
      }
      mapEquipmentRequestToApprovalItem(item) {
        const requester = item.requester;
        const equipment = item.equipment;
        const requestType = String(item.requestType || 'create');
        const requestTypeLabels = {
          create: '등록',
          update: '수정',
          delete: '삭제',
        };
        // requestData에서 장비명 추출 시도
        let equipmentName = '';
        if (equipment?.name) {
          equipmentName = String(equipment.name);
        } else if (item.requestData) {
          try {
            const data =
              typeof item.requestData === 'string'
                ? JSON.parse(item.requestData)
                : item.requestData;
            equipmentName = data.name || data.equipmentName || '';
          } catch {
            // JSON 파싱 실패 무시
          }
        }
        const summary = equipmentName
          ? `${equipmentName} ${requestTypeLabels[requestType] || requestType} 요청`
          : `장비 ${requestTypeLabels[requestType] || requestType} 요청`;
        return {
          id: String(item.id),
          category: 'equipment',
          status: this.mapEquipmentRequestStatus(String(item.approvalStatus || '')),
          requesterId: String(item.requestedBy || ''),
          requesterName: requester?.name ? String(requester.name) : '알 수 없음',
          requesterTeam: (() => {
            const team = requester?.team;
            return team?.name ? String(team.name) : '';
          })(),
          requestedAt: String(item.requestedAt || ''),
          summary,
          details: {
            requestType,
            equipmentId: item.equipmentId,
            equipment,
            requestData: item.requestData,
          },
          originalData: item,
        };
      }
      mapEquipmentRequestStatus(status) {
        switch (status) {
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationApprovalStatusValues'
          ].PENDING_APPROVAL:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationApprovalStatusValues'
          ].APPROVED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].APPROVED;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationApprovalStatusValues'
          ].REJECTED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].REJECTED;
          default:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
        }
      }
      mapCalibrationStatus(status) {
        switch (status) {
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationApprovalStatusValues'
          ].PENDING_APPROVAL:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationApprovalStatusValues'
          ].APPROVED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].APPROVED;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationApprovalStatusValues'
          ].REJECTED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].REJECTED;
          default:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
        }
      }
      mapCheckoutStatus(status) {
        switch (status) {
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutStatusValues'
          ].PENDING:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutStatusValues'
          ].APPROVED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].APPROVED;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutStatusValues'
          ].REJECTED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].REJECTED;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutStatusValues'
          ].RETURNED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING; // 반입 승인 대기
          default:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
        }
      }
      mapPlanStatus(status) {
        switch (status) {
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationPlanStatusValues'
          ].PENDING_REVIEW:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING_REVIEW;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationPlanStatusValues'
          ].PENDING_APPROVAL:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].REVIEWED;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationPlanStatusValues'
          ].APPROVED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].APPROVED;
          case __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationPlanStatusValues'
          ].REJECTED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].REJECTED;
          default:
            return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING;
        }
      }
      /**
       * EquipmentImport를 ApprovalItem으로 변환
       *
       * Handles both rental and internal_shared imports
       */ mapEquipmentImportToApprovalItem(item, category) {
        // requester 관계를 통해 사용자 정보 추출
        const requester = item.requester;
        const team = requester?.team;
        // Summary varies by source type
        const isRental = item.sourceType === 'rental';
        const summary = isRental
          ? `${item.equipmentName} 렌탈 반입 (${item.vendorName})`
          : `${item.equipmentName} 공용장비 반입 (${item.ownerDepartment})`;
        return {
          id: item.id,
          category,
          status:
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'UnifiedApprovalStatusValues'
            ].PENDING,
          requesterId: item.requesterId,
          requesterName: requester?.name ? String(requester.name) : '신청자',
          requesterTeam: team?.name ? String(team.name) : '',
          requestedAt: item.createdAt,
          summary,
          details: {
            equipmentName: item.equipmentName,
            classification: item.classification,
            sourceType: item.sourceType,
            // Rental-specific
            vendorName: item.vendorName,
            vendorContact: item.vendorContact,
            // Internal shared-specific
            ownerDepartment: item.ownerDepartment,
            internalContact: item.internalContact,
            borrowingJustification: item.borrowingJustification,
            // Common
            usagePeriodStart: item.usagePeriodStart,
            usagePeriodEnd: item.usagePeriodEnd,
            reason: item.reason,
          },
          originalData: item,
        };
      }
    }
    const approvalsApi = new ApprovalsApi();
    const __TURBOPACK__default__export__ = approvalsApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/brand.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * Brand Design Tokens - UL-QP-18 Equipment Management System
     *
     * 글로벌 디자인 언어 정의. 11개 페이지가 공유하는 SSOT.
     * 정밀 계측 산업 / 엄격한 규정 준수 / 데이터 신뢰성 최우선.
     *
     * 아키텍처:
     * - CSS 변수: globals.css의 :root / .dark 블록에 선언 (HSL 채널값)
     * - Tailwind: tailwind.config.js에 brand.* 토큰으로 등록
     * - 이 파일: Tailwind 클래스 조합 헬퍼 + 레이아웃 상수
     *
     * SSOT 경계:
     * - 색상 → globals.css (CSS 변수) + tailwind.config.js (theme 등록)
     * - 장비 상태 스타일 → components/equipment.ts (EQUIPMENT_STATUS_TOKENS)
     * - 모션 → semantic.ts (MOTION_TOKENS) + motion.ts (헬퍼)
     * - 긴급도 피드백 → visual-feedback.ts (URGENCY_FEEDBACK_MAP)
     * - 이 파일은 위 SSOT를 중복 정의하지 않음
     */ // ============================================================================
    // 1. Color Reference (프로그래밍 참조용 — 런타임 사용은 Tailwind 클래스)
    // ============================================================================
    /**
     * 시멘틱 색상 hex 참조값
     *
     * 차트 라이브러리, Canvas API 등 CSS 변수가 불가능한 곳에서 사용.
     * 일반 컴포넌트는 반드시 Tailwind 클래스(bg-brand-ok 등)를 사용할 것.
     *
     * CSS 변수 SSOT: globals.css --brand-color-*
     * Tailwind SSOT: tailwind.config.js brand.*
     */ __turbopack_context__.s([
      'BRAND_COLORS_HEX',
      () => BRAND_COLORS_HEX,
      'BRAND_LAYOUT',
      () => BRAND_LAYOUT,
      'FONT',
      () => FONT,
      'getBrandCardClasses',
      () => getBrandCardClasses,
      'getBrandElevatedClasses',
      () => getBrandElevatedClasses,
      'getBrandMutedTextClasses',
      () => getBrandMutedTextClasses,
      'getBrandSectionHeaderClasses',
      () => getBrandSectionHeaderClasses,
      'getKpiCounterClasses',
      () => getKpiCounterClasses,
      'getManagementNumberClasses',
      () => getManagementNumberClasses,
      'getSemanticBadgeClasses',
      () => getSemanticBadgeClasses,
      'getSemanticBgLightClasses',
      () => getSemanticBgLightClasses,
      'getSemanticContainerClasses',
      () => getSemanticContainerClasses,
      'getSemanticContainerColorClasses',
      () => getSemanticContainerColorClasses,
      'getSemanticContainerTextClasses',
      () => getSemanticContainerTextClasses,
      'getSemanticDotClasses',
      () => getSemanticDotClasses,
      'getSemanticLeftBorderClasses',
      () => getSemanticLeftBorderClasses,
      'getSemanticSolidBgClasses',
      () => getSemanticSolidBgClasses,
      'getSemanticStatusClasses',
      () => getSemanticStatusClasses,
      'getSiteBadgeClasses',
      () => getSiteBadgeClasses,
      'getSiteDotClasses',
      () => getSiteDotClasses,
      'getTimestampClasses',
      () => getTimestampClasses,
    ]);
    const BRAND_COLORS_HEX = {
      ok: '#10B981',
      warning: '#F59E0B',
      critical: '#EF4444',
      info: '#3B82F6',
      neutral: '#6B7280',
      purple: '#8B5CF6',
      repair: '#F97316',
      temporary: '#22B8CF',
    };
    const FONT = {
      /** 헤딩, 페이지 타이틀, 네비게이션 아이템 */ heading: 'font-display',
      /** 본문 텍스트, 폼 라벨, 설명 */ body: 'font-body',
      /** 관리번호, 타임스탬프, 코드 — tabular-nums 포함 */ mono: 'font-mono tabular-nums',
      /** KPI 대형 카운터 (대시보드) */ kpi: 'font-mono tabular-nums font-semibold',
    };
    const BRAND_LAYOUT = {
      /** 최소 설계 기준 너비 (px) */ minDesignWidth: 1280,
      /** 카드 간격 */ cardGap: 'gap-4',
      /** 섹션 내 여백: 정보 밀도 우선 → 최소화 */ sectionPadding: {
        compact: 'p-3',
        default: 'p-4',
        relaxed: 'p-6',
      },
      /** 페이지 컨텐츠 최대 너비 */ maxContentWidth: 'max-w-7xl',
      /** 그리드 컬럼 (반응형) */ grid: {
        /** 통계 카드 (대시보드) */ stats: 'grid-cols-2 md:grid-cols-4',
        /** 장비 카드 (목록) */ equipment: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        /** 설정/폼 (2컬럼) */ form: 'grid-cols-1 md:grid-cols-2',
      },
    };
    const BRAND_CLASS_MATRIX = {
      ok: {
        text: 'text-brand-ok',
        bgLight: 'bg-brand-ok/10',
        status: 'bg-brand-ok/10 text-brand-ok',
        badge: 'text-brand-ok bg-brand-ok/10 border-brand-ok/20',
        container: 'bg-brand-ok/10 border-brand-ok/20',
        leftBorder: 'border-l-brand-ok',
        solid: 'bg-brand-ok text-white',
        dot: 'bg-brand-ok rounded-full',
      },
      warning: {
        text: 'text-brand-warning',
        bgLight: 'bg-brand-warning/10',
        status: 'bg-brand-warning/10 text-brand-warning',
        badge: 'text-brand-warning bg-brand-warning/10 border-brand-warning/20',
        container: 'bg-brand-warning/10 border-brand-warning/20',
        leftBorder: 'border-l-brand-warning',
        solid: 'bg-brand-warning text-white',
        dot: 'bg-brand-warning rounded-full',
      },
      critical: {
        text: 'text-brand-critical',
        bgLight: 'bg-brand-critical/10',
        status: 'bg-brand-critical/10 text-brand-critical',
        badge: 'text-brand-critical bg-brand-critical/10 border-brand-critical/20',
        container: 'bg-brand-critical/10 border-brand-critical/20',
        leftBorder: 'border-l-brand-critical',
        solid: 'bg-brand-critical text-white',
        dot: 'bg-brand-critical rounded-full',
      },
      info: {
        text: 'text-brand-info',
        bgLight: 'bg-brand-info/10',
        status: 'bg-brand-info/10 text-brand-info',
        badge: 'text-brand-info bg-brand-info/10 border-brand-info/20',
        container: 'bg-brand-info/10 border-brand-info/20',
        leftBorder: 'border-l-brand-info',
        solid: 'bg-brand-info text-white',
        dot: 'bg-brand-info rounded-full',
      },
      neutral: {
        text: 'text-brand-neutral',
        bgLight: 'bg-brand-neutral/10',
        status: 'bg-brand-neutral/10 text-brand-neutral',
        badge: 'text-brand-neutral bg-brand-neutral/10 border-brand-neutral/20',
        container: 'bg-brand-neutral/10 border-brand-neutral/20',
        leftBorder: 'border-l-brand-neutral',
        solid: 'bg-brand-neutral text-white',
        dot: 'bg-brand-neutral rounded-full',
      },
      purple: {
        text: 'text-brand-purple',
        bgLight: 'bg-brand-purple/10',
        status: 'bg-brand-purple/10 text-brand-purple',
        badge: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
        container: 'bg-brand-purple/10 border-brand-purple/20',
        leftBorder: 'border-l-brand-purple',
        solid: 'bg-brand-purple text-white',
        dot: 'bg-brand-purple rounded-full',
      },
      repair: {
        text: 'text-brand-repair',
        bgLight: 'bg-brand-repair/10',
        status: 'bg-brand-repair/10 text-brand-repair',
        badge: 'text-brand-repair bg-brand-repair/10 border-brand-repair/20',
        container: 'bg-brand-repair/10 border-brand-repair/20',
        leftBorder: 'border-l-brand-repair',
        solid: 'bg-brand-repair text-white',
        dot: 'bg-brand-repair rounded-full',
      },
      temporary: {
        text: 'text-brand-temporary',
        bgLight: 'bg-brand-temporary/10',
        status: 'bg-brand-temporary/10 text-brand-temporary',
        badge: 'text-brand-temporary bg-brand-temporary/10 border-brand-temporary/20',
        container: 'bg-brand-temporary/10 border-brand-temporary/20',
        leftBorder: 'border-l-brand-temporary',
        solid: 'bg-brand-temporary text-white',
        dot: 'bg-brand-temporary rounded-full',
      },
    };
    function getBrandCardClasses() {
      return 'bg-brand-bg-surface border border-brand-border-subtle rounded-lg';
    }
    function getBrandSectionHeaderClasses() {
      return 'text-brand-text-primary font-display font-semibold';
    }
    function getManagementNumberClasses() {
      return 'font-mono tabular-nums text-brand-text-primary tracking-wider';
    }
    function getTimestampClasses() {
      return 'font-mono tabular-nums text-brand-text-muted text-sm';
    }
    function getKpiCounterClasses() {
      return 'font-mono tabular-nums font-semibold text-brand-text-primary';
    }
    function getSemanticBadgeClasses(color) {
      return `${BRAND_CLASS_MATRIX[color].badge} border rounded-md px-2 py-0.5 text-xs font-medium`;
    }
    function getBrandElevatedClasses() {
      return 'bg-brand-bg-elevated border border-brand-border-default rounded-lg shadow-md';
    }
    function getBrandMutedTextClasses() {
      return 'text-brand-text-muted text-sm';
    }
    function getSemanticContainerColorClasses(color) {
      return BRAND_CLASS_MATRIX[color].container;
    }
    function getSemanticContainerClasses(color) {
      return `rounded-md border p-4 ${BRAND_CLASS_MATRIX[color].container}`;
    }
    function getSemanticContainerTextClasses(color) {
      return BRAND_CLASS_MATRIX[color].text;
    }
    function getSemanticStatusClasses(color) {
      return BRAND_CLASS_MATRIX[color].status;
    }
    function getSemanticLeftBorderClasses(color) {
      return BRAND_CLASS_MATRIX[color].leftBorder;
    }
    function getSemanticSolidBgClasses(color) {
      return BRAND_CLASS_MATRIX[color].solid;
    }
    function getSemanticDotClasses(color) {
      return BRAND_CLASS_MATRIX[color].dot;
    }
    function getSemanticBgLightClasses(color) {
      return BRAND_CLASS_MATRIX[color].bgLight;
    }
    function getSiteBadgeClasses(site) {
      const colorMap = {
        suw: 'text-brand-site-suw bg-brand-site-suw/10 border-brand-site-suw/20',
        uiw: 'text-brand-site-uiw bg-brand-site-uiw/10 border-brand-site-uiw/20',
        pyt: 'text-brand-site-pyt bg-brand-site-pyt/10 border-brand-site-pyt/20',
      };
      return `${colorMap[site]} border rounded-md px-2 py-0.5 text-xs font-medium`;
    }
    function getSiteDotClasses(site) {
      const colorMap = {
        suw: 'bg-brand-site-suw rounded-full',
        uiw: 'bg-brand-site-uiw rounded-full',
        pyt: 'bg-brand-site-pyt rounded-full',
      };
      return colorMap[site];
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/utils/approval-count-utils.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 승인 카운트 SSOT 유틸리티
     *
     * 네비 뱃지, 대시보드 카드, 승인 관리 페이지 3곳이
     * 동일한 카운트 데이터(PendingCountsByCategory)를 사용하도록 보장합니다.
     *
     * SSOT 체인:
     *   Backend: ApprovalsService.getPendingCountsByRole()
     *     → API: GET /api/approvals/counts
     *       → Frontend Query Key: queryKeys.approvals.counts(role)
     *         → 이 유틸리티가 역할별 총합 계산
     */ __turbopack_context__.s([
      'computeApprovalTotal',
      () => computeApprovalTotal,
      'getDashboardApprovalCategories',
      () => getDashboardApprovalCategories,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/brand.ts [app-client] (ecmascript)'
      );
    function computeApprovalTotal(counts, role) {
      if (!counts || !role) return 0;
      const tabs =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ROLE_TABS'
        ][role] || [];
      return tabs.reduce((sum, tab) => sum + (counts[tab] || 0), 0);
    }
    /**
     * 승인 카테고리 → 시맨틱 색상 매핑
     *
     * brand.ts의 SemanticColorKey를 사용하여 SSOT 체인 유지.
     * CSS 변수 → Tailwind → brand 헬퍼 체인으로 다크모드/사이트 테마 자동 대응.
     */ const CATEGORY_SEMANTIC_COLOR = {
      outgoing: 'repair',
      incoming: 'ok',
      equipment: 'info',
      calibration: 'ok',
      inspection: 'temporary',
      nonconformity: 'warning',
      disposal_review: 'critical',
      disposal_final: 'critical',
      plan_review: 'purple',
      plan_final: 'purple',
      software: 'purple',
    };
    const CATEGORY_COLORS = Object.fromEntries(
      (_c1 = Object.entries(CATEGORY_SEMANTIC_COLOR).map(
        (_c = ([key, semanticKey]) => [
          key,
          {
            color: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'getSemanticContainerTextClasses'
            ])(semanticKey),
            bgColor: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'getSemanticBgLightClasses'
            ])(semanticKey),
          },
        ])
      ))
    );
    _c2 = CATEGORY_COLORS;
    function getDashboardApprovalCategories(role, approvalsRoute, t) {
      const tabs =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ROLE_TABS'
        ][role] || [];
      return tabs.map((tab) => {
        const meta =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'TAB_META'
          ][tab];
        const colors = CATEGORY_COLORS[tab];
        return {
          key: tab,
          label: t(meta.labelKey),
          href: `${approvalsRoute}?tab=${tab}`,
          color: colors.color,
          bgColor: colors.bgColor,
        };
      });
    }
    var _c, _c1, _c2;
    __turbopack_context__.k.register(
      _c,
      'CATEGORY_COLORS$Object.fromEntries$Object.entries(CATEGORY_SEMANTIC_COLOR).map'
    );
    __turbopack_context__.k.register(_c1, 'CATEGORY_COLORS$Object.fromEntries');
    __turbopack_context__.k.register(_c2, 'CATEGORY_COLORS');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/navigation/nav-config.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * Navigation Configuration (SSOT)
     *
     * 데스크톱 사이드바/모바일 드로어 공유 네비게이션 설정
     * - 아이콘: LucideIcon 컴포넌트 참조 (JSX 아님) — 렌더링 측에서 sizing 적용
     * - 섹션 그룹핑: 3개 섹션 (운영/관리/시스템)
     * - Permission 기반 필터링 (역할 하드코딩 없음)
     */ __turbopack_context__.s([
      'NAV_SECTIONS',
      () => NAV_SECTIONS,
      'getFilteredNavSections',
      () => getFilteredNavSections,
      'isNavItemActive',
      () => isNavItemActive,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-client] (ecmascript) <export default as LayoutDashboard>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/package-2.js [app-client] (ecmascript) <export default as Package2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/file-spreadsheet.js [app-client] (ecmascript) <export default as FileSpreadsheet>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clipboard-check.js [app-client] (ecmascript) <export default as ClipboardCheck>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/square-check-big.js [app-client] (ecmascript) <export default as CheckSquare>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSearch$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/file-search.js [app-client] (ecmascript) <export default as FileSearch>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/frontend-routes.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/permissions.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$role$2d$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/role-permissions.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$permission$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/permission-helpers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$approval$2d$count$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/approval-count-utils.ts [app-client] (ecmascript)'
      );
    const NAV_SECTIONS = [
      {
        sectionKey: 'sections.operations',
        items: [
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__[
              'LayoutDashboard'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].DASHBOARD,
            labelKey: 'dashboard',
            requiredPermission: null,
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package2$3e$__[
              'Package2'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].EQUIPMENT.LIST,
            labelKey: 'equipment',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_EQUIPMENT,
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__[
              'ClipboardCheck'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].CHECKOUTS.LIST,
            labelKey: 'checkouts',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_CHECKOUTS,
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__[
              'FileSpreadsheet'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].CALIBRATION.LIST,
            labelKey: 'calibration',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_CALIBRATIONS,
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__[
              'FileText'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].CALIBRATION_PLANS.LIST,
            labelKey: 'calibrationPlans',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_CALIBRATION_PLANS,
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__[
              'AlertTriangle'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].NON_CONFORMANCES.LIST,
            labelKey: 'nonConformances',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_EQUIPMENT,
          },
        ],
      },
      {
        sectionKey: 'sections.management',
        items: [
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__[
              'CheckSquare'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].ADMIN.APPROVALS,
            labelKey: 'adminApprovals',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].APPROVE_EQUIPMENT,
            badgeKey: 'approvals',
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSearch$3e$__[
              'FileSearch'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].ADMIN.AUDIT_LOGS,
            labelKey: 'adminAuditLogs',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_AUDIT_LOGS,
          },
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__[
              'Users'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].TEAMS.LIST,
            labelKey: 'teams',
            requiredPermission:
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Permission'
              ].VIEW_TEAMS,
          },
        ],
      },
      {
        sectionKey: 'sections.system',
        items: [
          {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__[
              'Settings'
            ],
            href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'FRONTEND_ROUTES'
            ].SETTINGS.INDEX,
            labelKey: 'settings',
            requiredPermission: null,
          },
        ],
      },
    ];
    function getFilteredNavSections(role, t, pendingCounts) {
      return NAV_SECTIONS.map((section) => {
        const filteredItems = section.items
          .filter((item) => {
            if (item.requiredPermission === null) return true;
            if (!role) return false;
            if (
              item.href ===
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'FRONTEND_ROUTES'
              ].ADMIN.APPROVALS
            ) {
              return (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$permission$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'hasApprovalPermissions'
              ])(role);
            }
            return (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$role$2d$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'hasPermission'
            ])(role, item.requiredPermission);
          })
          .map((item) => {
            let badge;
            if (
              item.badgeKey === 'approvals' &&
              role &&
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$permission$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'hasApprovalPermissions'
              ])(role) &&
              pendingCounts
            ) {
              const total = (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$approval$2d$count$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'computeApprovalTotal'
              ])(pendingCounts, role);
              badge = total > 0 ? total : undefined;
            }
            return {
              icon: item.icon,
              href: item.href,
              label: t(item.labelKey),
              badge,
            };
          });
        return {
          sectionLabel: t(section.sectionKey),
          items: filteredItems,
        };
      }).filter((section) => section.items.length > 0);
    }
    function isNavItemActive(href, pathname) {
      if (!pathname) return false;
      if (href === '/') return pathname === '/';
      return pathname.startsWith(href);
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/MobileNav.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['MobileNav', () => MobileNav]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    /**
     * MobileNav (Client Component)
     *
     * 모바일 환경에서 사용하는 네비게이션 드로어 컴포넌트
     * - 섹션 그룹핑: FilteredNavSection[] 기반 (Phase 1 - nav-config.ts SSOT)
     * - 디자인 토큰: getMobileNavItemClasses() (Phase 2 - mobile-nav.ts SSOT)
     *
     * 접근성 (WCAG 2.1 AA):
     * - Radix Dialog 기반 Sheet로 포커스 트랩/스크롤 잠금/Escape 닫기 네이티브 처리
     * - aria-modal, aria-label 속성 (Radix 자동 관리)
     * - 닫을 때 트리거 버튼으로 자동 포커스 반환
     * - prefers-reduced-motion 존중 (Sheet 애니메이션)
     *
     * 성능 최적화 (vercel-react-best-practices):
     * - useCallback으로 이벤트 핸들러 안정화
     * - memo로 NavLink 컴포넌트 최적화
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/sheet.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/mobile-nav.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$nav$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/navigation/nav-config.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature();
    ('use client');
    // aria-live 영역에 스크린리더 알림 전송
    function announceToScreenReader(message) {
      const liveRegion = document.getElementById('live-announcements');
      if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
    }
    const NavLink = /*#__PURE__*/ (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'memo'
    ])(
      _s(
        function NavLink({ item, isActive, onClick }) {
          _s();
          const t = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useTranslations'
          ])('navigation');
          const Icon = item.icon;
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ],
            {
              href: item.href,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getMobileNavItemClasses'
                ])(isActive)
              ),
              'aria-current': isActive ? 'page' : undefined,
              onClick: onClick,
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'span',
                  {
                    'aria-hidden': 'true',
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      Icon,
                      {
                        className: 'h-5 w-5',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                        lineNumber: 74,
                        columnNumber: 9,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                    lineNumber: 73,
                    columnNumber: 7,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'span',
                  {
                    className: 'flex-1',
                    children: item.label,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                    lineNumber: 76,
                    columnNumber: 7,
                  },
                  this
                ),
                item.badge !== undefined &&
                  item.badge > 0 &&
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'span',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(
                        'ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'MOBILE_NAV_TOKENS'
                        ].badge.background,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'MOBILE_NAV_TOKENS'
                        ].badge.text
                      ),
                      'aria-label': t('layout.notificationCount', {
                        count: item.badge,
                      }),
                      children: item.badge,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                      lineNumber: 78,
                      columnNumber: 9,
                    },
                    this
                  ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
              lineNumber: 67,
              columnNumber: 5,
            },
            this
          );
        },
        'h6+q2O3NJKPY5uL0BIJGLIanww8=',
        false,
        function () {
          return [
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useTranslations'
            ],
          ];
        }
      )
    );
    _c = NavLink;
    function MobileNav({ navSections, brandName, brandIcon }) {
      _s1();
      const [isOpen, setIsOpen] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const pathname = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'usePathname'
      ])();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const displayBrandName = brandName ?? t('layout.systemName');
      // 경로 변경 시 드로어 닫기
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'MobileNav.useEffect': () => {
            setIsOpen(false);
          },
        }['MobileNav.useEffect'],
        [pathname]
      );
      // 데스크톱 뷰포트 전환 시 드로어 닫기 (body scroll lock 방지)
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'MobileNav.useEffect': () => {
            const mq = window.matchMedia('(min-width: 768px)');
            const handler = {
              'MobileNav.useEffect.handler': () => {
                if (mq.matches) setIsOpen(false);
              },
            }['MobileNav.useEffect.handler'];
            mq.addEventListener('change', handler);
            return {
              'MobileNav.useEffect': () => mq.removeEventListener('change', handler),
            }['MobileNav.useEffect'];
          },
        }['MobileNav.useEffect'],
        []
      );
      // 스크린리더 알림
      const handleOpenChange = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'MobileNav.useCallback[handleOpenChange]': (open) => {
            setIsOpen(open);
            announceToScreenReader(open ? t('layout.menuOpened') : t('layout.menuClosed'));
          },
        }['MobileNav.useCallback[handleOpenChange]'],
        [t]
      );
      const closeMenu = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'MobileNav.useCallback[closeMenu]': () => {
            setIsOpen(false);
            announceToScreenReader(t('layout.menuClosed'));
          },
        }['MobileNav.useCallback[closeMenu]'],
        [t]
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Sheet'
        ],
        {
          open: isOpen,
          onOpenChange: handleOpenChange,
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'SheetTrigger'
              ],
              {
                asChild: true,
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Button'
                  ],
                  {
                    variant: 'ghost',
                    size: 'icon',
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'md:hidden',
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'FOCUS_TOKENS'
                      ].classes.default
                    ),
                    'aria-label': isOpen ? t('layout.menuClose') : t('layout.menuOpen'),
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__[
                        'Menu'
                      ],
                      {
                        className: 'h-6 w-6',
                        'aria-hidden': 'true',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                        lineNumber: 138,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                    lineNumber: 132,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                lineNumber: 131,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'SheetContent'
              ],
              {
                side: 'left',
                hideClose: true,
                className:
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'MOBILE_NAV_DRAWER_TOKENS'
                  ].content,
                'aria-describedby': undefined,
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'SheetTitle'
                    ],
                    {
                      className: 'sr-only',
                      children: t('layout.mainNav'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                      lineNumber: 149,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(
                        'flex h-14 items-center justify-between px-4',
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'MOBILE_NAV_DRAWER_TOKENS'
                        ].headerBorder
                      ),
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              'flex items-center gap-2 font-semibold',
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'MOBILE_NAV_DRAWER_TOKENS'
                              ].text
                            ),
                            children: [
                              brandIcon,
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'span',
                                {
                                  children: displayBrandName,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/MobileNav.tsx',
                                  lineNumber: 162,
                                  columnNumber: 13,
                                },
                                this
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                            lineNumber: 158,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Button'
                          ],
                          {
                            variant: 'ghost',
                            size: 'icon',
                            onClick: closeMenu,
                            'aria-label': t('layout.menuClose'),
                            className:
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'FOCUS_TOKENS'
                              ].classes.default,
                            children: /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__[
                                'X'
                              ],
                              {
                                className: 'h-5 w-5',
                                'aria-hidden': 'true',
                              },
                              void 0,
                              false,
                              {
                                fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                                lineNumber: 171,
                                columnNumber: 13,
                              },
                              this
                            ),
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                            lineNumber: 164,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                      lineNumber: 152,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'nav',
                    {
                      'aria-label': t('layout.mainNav'),
                      className: 'flex flex-col overflow-y-auto max-h-[calc(100vh-3.5rem)] p-2',
                      children: navSections.map((section, sectionIndex) =>
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            children: [
                              sectionIndex > 0 &&
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'div',
                                  {
                                    className:
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'MOBILE_NAV_SECTION_TOKENS'
                                      ].divider,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/MobileNav.tsx',
                                    lineNumber: 183,
                                    columnNumber: 36,
                                  },
                                  this
                                ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'div',
                                {
                                  className: (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                    'cn'
                                  ])(
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'MOBILE_NAV_SECTION_TOKENS'
                                    ].label,
                                    sectionIndex === 0
                                      ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'MOBILE_NAV_SECTION_TOKENS'
                                        ].firstSpacing
                                      : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$mobile$2d$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'MOBILE_NAV_SECTION_TOKENS'
                                        ].spacing
                                  ),
                                  children: section.sectionLabel,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/MobileNav.tsx',
                                  lineNumber: 185,
                                  columnNumber: 15,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'div',
                                {
                                  className: 'flex flex-col gap-1',
                                  children: section.items.map((item) =>
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      NavLink,
                                      {
                                        item: item,
                                        isActive: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$nav$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'isNavItemActive'
                                        ])(item.href, pathname),
                                        onClick: closeMenu,
                                      },
                                      item.href,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/MobileNav.tsx',
                                        lineNumber: 198,
                                        columnNumber: 19,
                                      },
                                      this
                                    )
                                  ),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/MobileNav.tsx',
                                  lineNumber: 196,
                                  columnNumber: 15,
                                },
                                this
                              ),
                            ],
                          },
                          section.sectionLabel,
                          true,
                          {
                            fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                            lineNumber: 181,
                            columnNumber: 13,
                          },
                          this
                        )
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                      lineNumber: 176,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
                lineNumber: 143,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/MobileNav.tsx',
          lineNumber: 129,
          columnNumber: 5,
        },
        this
      );
    }
    _s1(MobileNav, 'mK2nRbM+TwMyX6j+28JgbdL+ij4=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'usePathname'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c1 = MobileNav;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'NavLink');
    __turbopack_context__.k.register(_c1, 'MobileNav');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/navigation/route-metadata.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'extractDynamicParams',
      () => extractDynamicParams,
      'getParentChain',
      () => getParentChain,
      'getRouteMetadata',
      () => getRouteMetadata,
      'isDynamicRoute',
      () => isDynamicRoute,
      'normalizeDynamicRoute',
      () => normalizeDynamicRoute,
      'routeMap',
      () => routeMap,
    ]);
    /**
     * Route Metadata System
     *
     * 전체 애플리케이션의 라우트 구조와 메타데이터를 정의합니다.
     * 브레드크럼 네비게이션 생성에 사용됩니다.
     *
     * @module route-metadata
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/package-2.js [app-client] (ecmascript) <export default as Package2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clipboard$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clipboard.js [app-client] (ecmascript) <export default as Clipboard>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-client] (ecmascript) <export default as BarChart3>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Code$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/code.js [app-client] (ecmascript) <export default as Code>'
      );
    const routeMap = {
      // ========================================
      // 대시보드 (루트)
      // ========================================
      '/': {
        label: '대시보드',
        labelKey: 'navigation.dashboard',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__[
          'Home'
        ],
      },
      // ========================================
      // 장비 관리
      // ========================================
      '/equipment': {
        label: '장비 관리',
        labelKey: 'navigation.equipment',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package2$3e$__[
          'Package2'
        ],
      },
      '/equipment/create': {
        label: '장비 등록',
        labelKey: 'navigation.equipmentCreate',
        parent: '/equipment',
      },
      '/equipment/create-shared': {
        label: '공유 장비 등록',
        labelKey: 'navigation.equipmentCreateShared',
        parent: '/equipment',
      },
      '/equipment/[id]': {
        label: '장비 상세',
        labelKey: 'navigation.equipmentDetail',
        parent: '/equipment',
        dynamic: true,
      },
      '/equipment/[id]/edit': {
        label: '편집',
        labelKey: 'navigation.equipmentEdit',
        parent: '/equipment/[id]',
      },
      '/equipment/[id]/calibration-factors': {
        label: '보정계수',
        labelKey: 'navigation.equipmentCalibrationFactors',
        parent: '/equipment/[id]',
      },
      '/equipment/[id]/non-conformance': {
        label: '부적합 관리',
        labelKey: 'navigation.equipmentNonConformance',
        parent: '/equipment/[id]',
      },
      '/equipment/[id]/rent': {
        label: '대여',
        labelKey: 'navigation.equipmentRent',
        parent: '/equipment/[id]',
      },
      '/equipment/[id]/repair-history': {
        label: '수리 이력',
        labelKey: 'navigation.equipmentRepairHistory',
        parent: '/equipment/[id]',
      },
      '/equipment/[id]/software': {
        label: '소프트웨어',
        labelKey: 'navigation.equipmentSoftware',
        parent: '/equipment/[id]',
      },
      // ========================================
      // 교정 관리
      // ========================================
      '/calibration': {
        label: '교정 관리',
        labelKey: 'navigation.calibration',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clipboard$3e$__[
          'Clipboard'
        ],
      },
      '/calibration/register': {
        label: '교정 등록',
        labelKey: 'navigation.calibrationRegister',
        parent: '/calibration',
      },
      // ========================================
      // 교정계획서
      // ========================================
      '/calibration-plans': {
        label: '교정계획서',
        labelKey: 'navigation.calibrationPlans',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__[
          'Calendar'
        ],
      },
      '/calibration-plans/create': {
        label: '교정계획서 작성',
        labelKey: 'navigation.calibrationPlansCreate',
        parent: '/calibration-plans',
      },
      '/calibration-plans/[uuid]': {
        label: '교정계획서 상세',
        labelKey: 'navigation.calibrationPlansDetail',
        parent: '/calibration-plans',
        dynamic: true,
      },
      // ========================================
      // 부적합 관리
      // ========================================
      '/non-conformances': {
        label: '부적합 관리',
        labelKey: 'navigation.nonConformances',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__[
          'AlertTriangle'
        ],
      },
      '/non-conformances/[id]': {
        label: '부적합 상세',
        labelKey: 'navigation.nonConformancesDetail',
        parent: '/non-conformances',
        dynamic: true,
      },
      // ========================================
      // 반출입 관리
      // ========================================
      '/checkouts': {
        label: '반출입 관리',
        labelKey: 'navigation.checkouts',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__[
          'FileText'
        ],
      },
      '/checkouts/create': {
        label: '반출입 등록',
        labelKey: 'navigation.checkoutsCreate',
        parent: '/checkouts',
      },
      '/checkouts/manage': {
        label: '반출입 관리',
        labelKey: 'navigation.checkoutsManage',
        parent: '/checkouts',
      },
      '/checkouts/[id]': {
        label: '반출 상세',
        labelKey: 'navigation.checkoutsDetail',
        parent: '/checkouts',
        dynamic: true,
      },
      '/checkouts/[id]/check': {
        label: '반출 확인',
        labelKey: 'navigation.checkoutsCheck',
        parent: '/checkouts/[id]',
      },
      '/checkouts/[id]/return': {
        label: '반입 처리',
        labelKey: 'navigation.checkoutsReturn',
        parent: '/checkouts/[id]',
      },
      '/checkouts/import/[id]': {
        label: '렌탈 반입 상세',
        labelKey: 'navigation.checkoutsImportDetail',
        parent: '/checkouts',
        dynamic: true,
      },
      // Equipment Imports (Unified)
      '/checkouts/import/rental': {
        label: '외부 렌탈 반입',
        labelKey: 'navigation.checkoutsImportRental',
        parent: '/checkouts',
      },
      '/checkouts/import/shared': {
        label: '내부 공용 반입',
        labelKey: 'navigation.checkoutsImportShared',
        parent: '/checkouts',
      },
      '/checkouts/import/[id]/receive': {
        label: '수령 확인',
        labelKey: 'navigation.checkoutsImportReceive',
        parent: '/checkouts/import/[id]',
      },
      // ========================================
      // 소프트웨어 관리
      // ========================================
      '/software': {
        label: '소프트웨어 관리',
        labelKey: 'navigation.software',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Code$3e$__[
          'Code'
        ],
      },
      // ========================================
      // 보고서
      // ========================================
      '/reports': {
        label: '보고서',
        labelKey: 'navigation.reports',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__[
          'BarChart3'
        ],
      },
      '/reports/calibration-factors': {
        label: '보정계수 보고서',
        labelKey: 'navigation.reportsCalibrationFactors',
        parent: '/reports',
      },
      // ========================================
      // 팀 관리
      // ========================================
      '/teams': {
        label: '팀 관리',
        labelKey: 'navigation.teams',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__[
          'Users'
        ],
      },
      '/teams/[id]': {
        label: '팀 상세',
        labelKey: 'navigation.teamsDetail',
        parent: '/teams',
        dynamic: true,
      },
      // ========================================
      // 알림
      // ========================================
      '/notifications': {
        label: '알림',
        labelKey: 'navigation.notifications',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__[
          'Bell'
        ],
      },
      // ========================================
      // 설정
      // ========================================
      '/settings': {
        label: '설정',
        labelKey: 'navigation.settings',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__[
          'Settings'
        ],
      },
      '/settings/profile': {
        label: '내 프로필',
        labelKey: 'navigation.settingsProfile',
        parent: '/settings',
      },
      '/settings/notifications': {
        label: '알림 설정',
        labelKey: 'navigation.settingsNotifications',
        parent: '/settings',
      },
      '/settings/display': {
        label: '표시 설정',
        labelKey: 'navigation.settingsDisplay',
        parent: '/settings',
      },
      '/settings/admin/calibration': {
        label: '교정 알림 설정',
        labelKey: 'navigation.settingsCalibration',
        parent: '/settings',
      },
      '/settings/admin/system': {
        label: '시스템 설정',
        labelKey: 'navigation.settingsSystem',
        parent: '/settings',
      },
      // ========================================
      // 관리자 (Admin) - 승인 페이지들
      // ========================================
      '/admin': {
        label: '관리자',
        labelKey: 'navigation.admin',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
        hidden: true,
      },
      '/admin/approvals': {
        label: '승인 관리',
        labelKey: 'navigation.adminApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/equipment-approvals': {
        label: '장비 등록 승인',
        labelKey: 'navigation.adminEquipmentApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/calibration-approvals': {
        label: '교정 승인',
        labelKey: 'navigation.adminCalibrationApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/calibration-plan-approvals': {
        label: '교정계획서 승인',
        labelKey: 'navigation.adminCalibrationPlanApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/calibration-factor-approvals': {
        label: '보정계수 승인',
        labelKey: 'navigation.adminCalibrationFactorApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/return-approvals': {
        label: '반입 승인',
        labelKey: 'navigation.adminReturnApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/non-conformance-approvals': {
        label: '부적합 승인',
        labelKey: 'navigation.adminNonConformanceApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__[
          'AlertTriangle'
        ],
      },
      '/admin/software-approvals': {
        label: '소프트웨어 승인',
        labelKey: 'navigation.adminSoftwareApprovals',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__[
          'Shield'
        ],
      },
      '/admin/audit-logs': {
        label: '감사 로그',
        labelKey: 'navigation.adminAuditLogs',
        parent: '/',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__[
          'FileText'
        ],
      },
      // ========================================
      // 인증 페이지 (브레드크럼 제외)
      // ========================================
      '/login': {
        label: '로그인',
        labelKey: 'navigation.login',
        hidden: true,
      },
      '/error': {
        label: '오류',
        labelKey: 'navigation.error',
        hidden: true,
      },
    };
    function isDynamicRoute(pathname) {
      // pathname에서 동적 세그먼트가 있는지 확인
      return Object.keys(routeMap).some((route) => {
        if (!routeMap[route].dynamic) return false;
        // [id], [uuid] 등을 정규식 패턴으로 변환
        const pattern = route.replace(/\[([^\]]+)\]/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(pathname);
      });
    }
    function normalizeDynamicRoute(pathname) {
      for (const route of Object.keys(routeMap)) {
        if (!routeMap[route].dynamic) continue;
        // [id], [uuid] 등을 정규식 패턴으로 변환
        const pattern = route.replace(/\[([^\]]+)\]/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(pathname)) {
          return route;
        }
      }
      return pathname;
    }
    function getRouteMetadata(pathname) {
      // 먼저 정확한 경로로 찾기
      if (routeMap[pathname]) {
        return routeMap[pathname];
      }
      // 동적 라우트인 경우 정규화하여 찾기
      const normalizedRoute = normalizeDynamicRoute(pathname);
      return routeMap[normalizedRoute];
    }
    function extractDynamicParams(pathname) {
      const normalizedRoute = normalizeDynamicRoute(pathname);
      if (normalizedRoute === pathname) {
        return {}; // 동적 라우트가 아님
      }
      const routeSegments = normalizedRoute.split('/').filter(Boolean);
      const pathSegments = pathname.split('/').filter(Boolean);
      const params = {};
      routeSegments.forEach((segment, index) => {
        const match = segment.match(/\[([^\]]+)\]/);
        if (match) {
          const paramName = match[1];
          params[paramName] = pathSegments[index];
        }
      });
      return params;
    }
    function getParentChain(pathname) {
      const chain = [];
      let currentPath = normalizeDynamicRoute(pathname);
      while (currentPath) {
        chain.unshift(currentPath);
        const metadata = routeMap[currentPath];
        if (!metadata || !metadata.parent) {
          break;
        }
        currentPath = metadata.parent;
      }
      return chain;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/navigation/generate-breadcrumbs.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * Breadcrumb Generation Logic
     *
     * pathname을 받아 브레드크럼 아이템 배열을 생성합니다.
     *
     * @module generate-breadcrumbs
     */ __turbopack_context__.s([
      'debugBreadcrumbs',
      () => debugBreadcrumbs,
      'generateBreadcrumbLabel',
      () => generateBreadcrumbLabel,
      'generateBreadcrumbs',
      () => generateBreadcrumbs,
      'generateMobileBreadcrumbs',
      () => generateMobileBreadcrumbs,
      'getBreadcrumbDepth',
      () => getBreadcrumbDepth,
      'getHomeBreadcrumb',
      () => getHomeBreadcrumb,
      'getParentBreadcrumb',
      () => getParentBreadcrumb,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/navigation/route-metadata.ts [app-client] (ecmascript)'
      );
    /**
     * UUID 형식 감지 (8-4-4-4-12 패턴)
     *
     * @param str - 검사할 문자열
     * @returns UUID 형식 여부
     */ function isUUID(str) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    }
    function generateBreadcrumbs(pathname, dynamicLabels) {
      // 인증 페이지나 숨겨진 페이지는 브레드크럼 없음
      const metadata = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getRouteMetadata'
      ])(pathname);
      if (metadata?.hidden) {
        return [];
      }
      // 부모 경로 체인 가져오기 (정규화된 경로)
      const normalizedPath = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'normalizeDynamicRoute'
      ])(pathname);
      const parentChain = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getParentChain'
      ])(normalizedPath);
      // 동적 파라미터 추출
      const dynamicParams = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'extractDynamicParams'
      ])(pathname);
      // 브레드크럼 아이템 생성
      const breadcrumbs = parentChain.map((route, index) => {
        const routeMetadata =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'routeMap'
          ][route];
        if (!routeMetadata) {
          // 메타데이터가 없는 경우 기본값
          return {
            label: route,
            href: route,
            current: index === parentChain.length - 1,
          };
        }
        // 동적 라우트인 경우 실제 경로로 변환
        let actualHref = route;
        let actualLabel = routeMetadata.label;
        let isDynamic = false;
        let params;
        if (routeMetadata.dynamic) {
          // [id], [uuid] 등을 실제 값으로 교체
          actualHref = route;
          Object.keys(dynamicParams).forEach((paramName) => {
            actualHref = actualHref.replace(`[${paramName}]`, dynamicParams[paramName]);
          });
          // 커스텀 라벨이 제공된 경우 사용, 없으면 UUID 감지
          const paramValue = Object.values(dynamicParams)[0]; // 첫 번째 파라미터 값
          if (dynamicLabels && paramValue && dynamicLabels[paramValue]) {
            actualLabel = dynamicLabels[paramValue];
          } else if (paramValue && isUUID(paramValue)) {
            // UUID가 직접 표시되는 것을 방지 (BreadcrumbProvider가 동적으로 로드)
            actualLabel = routeMetadata.label; // 기본 라벨 유지 (예: "상세", "편집")
          }
          isDynamic = true;
          params = dynamicParams;
        }
        return {
          label: actualLabel,
          labelKey: routeMetadata.labelKey,
          href: actualHref,
          icon: routeMetadata.icon,
          current: index === parentChain.length - 1,
          isDynamic,
          params,
        };
      });
      // 숨겨진 항목 제거
      return breadcrumbs.filter((item) => {
        const itemMetadata = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getRouteMetadata'
        ])(item.href);
        return !itemMetadata?.hidden;
      });
    }
    function generateBreadcrumbLabel(breadcrumbs) {
      return breadcrumbs.map((item) => item.label).join(' > ');
    }
    function generateMobileBreadcrumbs(breadcrumbs) {
      if (breadcrumbs.length <= 2) {
        return breadcrumbs;
      }
      // 홈을 제외한 마지막 2개 항목만 반환
      return breadcrumbs.slice(-2);
    }
    function getHomeBreadcrumb() {
      const homeMetadata =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'routeMap'
        ]['/'];
      return {
        label: homeMetadata.label,
        href: '/',
        icon: homeMetadata.icon,
      };
    }
    function getBreadcrumbDepth(pathname) {
      const breadcrumbs = generateBreadcrumbs(pathname);
      return breadcrumbs.length;
    }
    function getParentBreadcrumb(pathname) {
      const breadcrumbs = generateBreadcrumbs(pathname);
      if (breadcrumbs.length < 2) {
        return undefined; // 부모가 없음 (루트 페이지)
      }
      return breadcrumbs[breadcrumbs.length - 2];
    }
    function debugBreadcrumbs(pathname) {
      const breadcrumbs = generateBreadcrumbs(pathname);
      const normalizedPath = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'normalizeDynamicRoute'
      ])(pathname);
      const dynamicParams = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$route$2d$metadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'extractDynamicParams'
      ])(pathname);
      const lines = [
        `=== Breadcrumb Debug Info ===`,
        `Original Path: ${pathname}`,
        `Normalized Path: ${normalizedPath}`,
        `Dynamic Params: ${JSON.stringify(dynamicParams)}`,
        `Breadcrumb Count: ${breadcrumbs.length}`,
        ``,
        `Breadcrumbs:`,
      ];
      breadcrumbs.forEach((item, index) => {
        lines.push(
          `  ${index + 1}. ${item.label} (${item.href})${item.current ? ' [CURRENT]' : ''}${item.isDynamic ? ' [DYNAMIC]' : ''}`
        );
      });
      return lines.join('\n');
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/Breadcrumb.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Breadcrumb',
      () => Breadcrumb,
      'BreadcrumbSkeleton',
      () => BreadcrumbSkeleton,
      'MobileBreadcrumb',
      () => MobileBreadcrumb,
      'ResponsiveBreadcrumb',
      () => ResponsiveBreadcrumb,
      'default',
      () => __TURBOPACK__default__export__,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    /**
     * Breadcrumb Navigation Component
     *
     * 계층적 브레드크럼 네비게이션을 제공합니다.
     * - 데스크톱: 전체 브레드크럼 표시
     * - 모바일: 축약 브레드크럼 (마지막 2단계)
     * - WCAG 2.1 AA 준수
     *
     * @module Breadcrumb
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$generate$2d$breadcrumbs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/navigation/generate-breadcrumbs.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature(),
      _s2 = __turbopack_context__.k.signature();
    ('use client');
    const NAVIGATION_PREFIX = 'navigation.';
    /** labelKey에서 'navigation.' 접두어를 제거하여 t() 호출용 키를 반환 */ function resolveLabelKey(
      item
    ) {
      if (!item.labelKey) return undefined;
      return item.labelKey.startsWith(NAVIGATION_PREFIX)
        ? item.labelKey.slice(NAVIGATION_PREFIX.length)
        : item.labelKey;
    }
    function Breadcrumb({ className, dynamicLabels, maxItems }) {
      _s();
      const pathname = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'usePathname'
      ])();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const items = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$generate$2d$breadcrumbs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'generateBreadcrumbs'
      ])(pathname, dynamicLabels);
      // 브레드크럼이 없으면 렌더링하지 않음
      if (items.length === 0) {
        return null;
      }
      // maxItems가 설정된 경우 제한
      const displayItems = maxItems ? items.slice(-maxItems) : items;
      const hasMore = maxItems && items.length > maxItems;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'nav',
        {
          'aria-label': 'breadcrumb',
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex items-center gap-1.5', className),
          children: [
            hasMore &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Fragment'
                ],
                {
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'span',
                      {
                        className: 'text-sm text-muted-foreground',
                        'aria-hidden': 'true',
                        children: '...',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                        lineNumber: 73,
                        columnNumber: 11,
                      },
                      this
                    ),
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__[
                        'ChevronRight'
                      ],
                      {
                        className: 'h-4 w-4 text-muted-foreground shrink-0',
                        'aria-hidden': 'true',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                        lineNumber: 76,
                        columnNumber: 11,
                      },
                      this
                    ),
                  ],
                },
                void 0,
                true
              ),
            displayItems.map((item, index) => {
              const Icon = item.icon;
              const isFirst = index === 0;
              const resolvedKey = resolveLabelKey(item);
              const displayLabel = resolvedKey ? t(resolvedKey) : item.label;
              return /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Fragment'
                ],
                {
                  children: [
                    !isFirst &&
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__[
                          'ChevronRight'
                        ],
                        {
                          className: 'h-4 w-4 text-muted-foreground/60 shrink-0',
                          'aria-hidden': 'true',
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                          lineNumber: 90,
                          columnNumber: 15,
                        },
                        this
                      ),
                    item.current
                      ? /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])('text-sm font-medium text-foreground', 'truncate max-w-[200px]'),
                            'aria-current': 'page',
                            children: [
                              Icon &&
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  Icon,
                                  {
                                    className: 'inline h-3.5 w-3.5 mr-1',
                                    'aria-hidden': 'true',
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                                    lineNumber: 101,
                                    columnNumber: 26,
                                  },
                                  this
                                ),
                              displayLabel,
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                            lineNumber: 97,
                            columnNumber: 15,
                          },
                          this
                        )
                      : /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'default'
                          ],
                          {
                            href: item.href,
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              'text-sm text-muted-foreground',
                              'hover:text-foreground',
                              'hover:underline',
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'TRANSITION_PRESETS'
                              ].fastColor,
                              'truncate max-w-[200px]',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ul-info focus-visible:ring-offset-2 rounded'
                            ),
                            children: [
                              Icon &&
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  Icon,
                                  {
                                    className: 'inline h-3.5 w-3.5 mr-1',
                                    'aria-hidden': 'true',
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                                    lineNumber: 116,
                                    columnNumber: 26,
                                  },
                                  this
                                ),
                              displayLabel,
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                            lineNumber: 105,
                            columnNumber: 15,
                          },
                          this
                        ),
                  ],
                },
                item.href,
                true,
                {
                  fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                  lineNumber: 88,
                  columnNumber: 11,
                },
                this
              );
            }),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
          lineNumber: 69,
          columnNumber: 5,
        },
        this
      );
    }
    _s(Breadcrumb, 'ubWVzN2Z0wcQh3unbvhqt4fw9Wc=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'usePathname'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = Breadcrumb;
    function MobileBreadcrumb({ className, dynamicLabels }) {
      _s1();
      const pathname = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'usePathname'
      ])();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const allItems = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$generate$2d$breadcrumbs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'generateBreadcrumbs'
      ])(pathname, dynamicLabels);
      // 브레드크럼이 없으면 렌더링하지 않음
      if (allItems.length === 0) {
        return null;
      }
      // 현재 페이지 (마지막 항목)
      const currentItem = allItems[allItems.length - 1];
      const currentResolvedKey = resolveLabelKey(currentItem);
      const currentLabel = currentResolvedKey ? t(currentResolvedKey) : currentItem.label;
      // 부모 페이지 (2단계: 상위 항목이 있을 때만)
      const parentItem = allItems.length > 1 ? allItems[allItems.length - 2] : null;
      const parentResolvedKey = parentItem ? resolveLabelKey(parentItem) : null;
      const parentLabel = parentItem
        ? parentResolvedKey
          ? t(parentResolvedKey)
          : parentItem.label
        : null;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'nav',
        {
          'aria-label': 'breadcrumb',
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex items-center gap-1', className),
          children: [
            parentItem &&
              parentLabel &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Fragment'
                ],
                {
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'default'
                      ],
                      {
                        href: parentItem.href,
                        className: (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                          'cn'
                        ])(
                          'text-sm text-muted-foreground hover:text-foreground truncate max-w-[100px]',
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'TRANSITION_PRESETS'
                          ].fastColor,
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded'
                        ),
                        children: parentLabel,
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                        lineNumber: 165,
                        columnNumber: 11,
                      },
                      this
                    ),
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__[
                        'ChevronRight'
                      ],
                      {
                        className: 'h-3.5 w-3.5 text-muted-foreground/60 shrink-0',
                        'aria-hidden': 'true',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                        lineNumber: 175,
                        columnNumber: 11,
                      },
                      this
                    ),
                  ],
                },
                void 0,
                true
              ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'span',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])('text-sm text-foreground', 'truncate max-w-[180px]', 'font-medium'),
                'aria-current': 'page',
                children: currentLabel,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                lineNumber: 181,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
          lineNumber: 162,
          columnNumber: 5,
        },
        this
      );
    }
    _s1(MobileBreadcrumb, 'ubWVzN2Z0wcQh3unbvhqt4fw9Wc=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'usePathname'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c1 = MobileBreadcrumb;
    function ResponsiveBreadcrumb({ className, dynamicLabels, maxItems }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])('hidden md:block', className),
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  Breadcrumb,
                  {
                    dynamicLabels: dynamicLabels,
                    maxItems: maxItems,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                    lineNumber: 204,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                lineNumber: 203,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])('md:hidden', className),
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  MobileBreadcrumb,
                  {
                    dynamicLabels: dynamicLabels,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                    lineNumber: 209,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                lineNumber: 208,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true
      );
    }
    _c2 = ResponsiveBreadcrumb;
    function BreadcrumbSkeleton({ className }) {
      _s2();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex items-center gap-1.5 motion-safe:animate-pulse', className),
          'aria-label': t('layout.breadcrumbLoading'),
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'w-16 h-5 bg-muted rounded',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                lineNumber: 229,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__[
                'ChevronRight'
              ],
              {
                className: 'h-4 w-4 text-muted-foreground/50',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                lineNumber: 232,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'w-24 h-5 bg-muted rounded',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
                lineNumber: 235,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/Breadcrumb.tsx',
          lineNumber: 224,
          columnNumber: 5,
        },
        this
      );
    }
    _s2(BreadcrumbSkeleton, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c3 = BreadcrumbSkeleton;
    const __TURBOPACK__default__export__ = ResponsiveBreadcrumb;
    var _c, _c1, _c2, _c3;
    __turbopack_context__.k.register(_c, 'Breadcrumb');
    __turbopack_context__.k.register(_c1, 'MobileBreadcrumb');
    __turbopack_context__.k.register(_c2, 'ResponsiveBreadcrumb');
    __turbopack_context__.k.register(_c3, 'BreadcrumbSkeleton');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/contexts/BreadcrumbContext.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'BreadcrumbProvider',
      () => BreadcrumbProvider,
      'useBreadcrumb',
      () => useBreadcrumb,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    /**
     * Breadcrumb Context
     *
     * 동적 라우트의 브레드크럼 라벨을 관리하기 위한 Context입니다.
     * 각 상세 페이지에서 의미있는 라벨을 설정하면, Header가 이를 읽어 브레드크럼에 표시합니다.
     *
     * @example
     * // 장비 상세 페이지에서 사용:
     * function EquipmentDetailClient({ equipment }) {
     *   const { setDynamicLabel } = useBreadcrumb();
     *
     *   useEffect(() => {
     *     setDynamicLabel(equipment.id, `${equipment.name} (${equipment.managementNumber})`);
     *     return () => clearDynamicLabel(equipment.id);
     *   }, [equipment]);
     *
     *   return <div>...</div>;
     * }
     *
     * @module BreadcrumbContext
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature();
    ('use client');
    const BreadcrumbContext = /*#__PURE__*/ (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContext'
    ])(undefined);
    function BreadcrumbProvider({ children }) {
      _s();
      const [dynamicLabels, setDynamicLabels] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])({});
      const setDynamicLabel = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'BreadcrumbProvider.useCallback[setDynamicLabel]': (id, label) => {
            setDynamicLabels(
              {
                'BreadcrumbProvider.useCallback[setDynamicLabel]': (prev) => ({
                  ...prev,
                  [id]: label,
                }),
              }['BreadcrumbProvider.useCallback[setDynamicLabel]']
            );
          },
        }['BreadcrumbProvider.useCallback[setDynamicLabel]'],
        []
      );
      const clearDynamicLabel = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'BreadcrumbProvider.useCallback[clearDynamicLabel]': (id) => {
            setDynamicLabels(
              {
                'BreadcrumbProvider.useCallback[clearDynamicLabel]': (prev) => {
                  const next = {
                    ...prev,
                  };
                  delete next[id];
                  return next;
                },
              }['BreadcrumbProvider.useCallback[clearDynamicLabel]']
            );
          },
        }['BreadcrumbProvider.useCallback[clearDynamicLabel]'],
        []
      );
      const clearAllDynamicLabels = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'BreadcrumbProvider.useCallback[clearAllDynamicLabels]': () => {
            setDynamicLabels({});
          },
        }['BreadcrumbProvider.useCallback[clearAllDynamicLabels]'],
        []
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        BreadcrumbContext.Provider,
        {
          value: {
            dynamicLabels,
            setDynamicLabel,
            clearDynamicLabel,
            clearAllDynamicLabels,
          },
          children: children,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/contexts/BreadcrumbContext.tsx',
          lineNumber: 78,
          columnNumber: 5,
        },
        this
      );
    }
    _s(BreadcrumbProvider, 'Gl/UPqp47TyTqDwfdawGc2rJceg=');
    _c = BreadcrumbProvider;
    function useBreadcrumb() {
      _s1();
      const context = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useContext'
      ])(BreadcrumbContext);
      if (!context) {
        throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
      }
      return context;
    }
    _s1(useBreadcrumb, 'b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=');
    var _c;
    __turbopack_context__.k.register(_c, 'BreadcrumbProvider');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/Header.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Header', () => Header]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$Breadcrumb$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/Breadcrumb.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$contexts$2f$BreadcrumbContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/contexts/BreadcrumbContext.tsx [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function Header({
      title,
      leftContent,
      rightContent,
      className,
      showBreadcrumb = true,
      dynamicLabels: propDynamicLabels,
    }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      // Context에서 동적 라벨 가져오기
      const { dynamicLabels: contextDynamicLabels } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$contexts$2f$BreadcrumbContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useBreadcrumb'
      ])();
      // Context와 prop 라벨 병합 (prop이 우선순위)
      const mergedDynamicLabels = {
        ...contextDynamicLabels,
        ...propDynamicLabels,
      };
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'header',
        {
          role: 'banner',
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(
            'flex h-14 items-center gap-4 border-b border-border bg-card px-4 md:px-6',
            'sticky top-0 z-30',
            className
          ),
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'flex items-center gap-2',
                children: leftContent,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Header.tsx',
                lineNumber: 47,
                columnNumber: 7,
              },
              this
            ),
            showBreadcrumb
              ? /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: 'flex-1 min-w-0',
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$Breadcrumb$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'ResponsiveBreadcrumb'
                      ],
                      {
                        dynamicLabels: mergedDynamicLabels,
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/Header.tsx',
                        lineNumber: 52,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/Header.tsx',
                    lineNumber: 51,
                    columnNumber: 9,
                  },
                  this
                )
              : /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'h1',
                  {
                    className: 'text-lg font-semibold truncate hidden sm:block',
                    children: title ?? t('layout.systemName'),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/Header.tsx',
                    lineNumber: 55,
                    columnNumber: 9,
                  },
                  this
                ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'ml-auto flex items-center gap-2 md:gap-4',
                children: rightContent,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/Header.tsx',
                lineNumber: 61,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/Header.tsx',
          lineNumber: 38,
          columnNumber: 5,
        },
        this
      );
    }
    _s(Header, 'z1H48fi4PzNRl2wdJVBX18suNJU=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$contexts$2f$BreadcrumbContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useBreadcrumb'
        ],
      ];
    });
    _c = Header;
    var _c;
    __turbopack_context__.k.register(_c, 'Header');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/SkipLink.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['SkipLink', () => SkipLink]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function SkipLink({ href = '#main-content', children }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const handleClick = (e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.focus();
          target.scrollIntoView({
            behavior: 'smooth',
          });
        }
      };
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'a',
        {
          href: href,
          onClick: handleClick,
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(
            'sr-only focus-visible:not-sr-only',
            'focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100]',
            'focus-visible:px-4 focus-visible:py-2',
            'focus-visible:bg-brand-info focus-visible:text-white',
            'focus-visible:rounded-md focus-visible:shadow-lg',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TRANSITION_PRESETS'
            ].fastTransformOpacity
          ),
          children: children ?? t('layout.skipToContent'),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/layout/SkipLink.tsx',
          lineNumber: 37,
          columnNumber: 5,
        },
        this
      );
    }
    _s(SkipLink, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = SkipLink;
    var _c;
    __turbopack_context__.k.register(_c, 'SkipLink');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/dropdown-menu.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'DropdownMenu',
      () => DropdownMenu,
      'DropdownMenuCheckboxItem',
      () => DropdownMenuCheckboxItem,
      'DropdownMenuContent',
      () => DropdownMenuContent,
      'DropdownMenuGroup',
      () => DropdownMenuGroup,
      'DropdownMenuItem',
      () => DropdownMenuItem,
      'DropdownMenuLabel',
      () => DropdownMenuLabel,
      'DropdownMenuPortal',
      () => DropdownMenuPortal,
      'DropdownMenuRadioGroup',
      () => DropdownMenuRadioGroup,
      'DropdownMenuRadioItem',
      () => DropdownMenuRadioItem,
      'DropdownMenuSeparator',
      () => DropdownMenuSeparator,
      'DropdownMenuShortcut',
      () => DropdownMenuShortcut,
      'DropdownMenuSub',
      () => DropdownMenuSub,
      'DropdownMenuSubContent',
      () => DropdownMenuSubContent,
      'DropdownMenuSubTrigger',
      () => DropdownMenuSubTrigger,
      'DropdownMenuTrigger',
      () => DropdownMenuTrigger,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-client] (ecmascript) <export default as Circle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const DropdownMenu =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ];
    const DropdownMenuTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Trigger'
      ];
    const DropdownMenuGroup =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Group'
      ];
    const DropdownMenuPortal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Portal'
      ];
    const DropdownMenuSub =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Sub'
      ];
    const DropdownMenuRadioGroup =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'RadioGroup'
      ];
    const DropdownMenuSubTrigger =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, inset, children, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'SubTrigger'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
                inset && 'pl-8',
                className
              ),
              ...props,
              children: [
                children,
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__[
                    'ChevronRight'
                  ],
                  {
                    className: 'ml-auto h-4 w-4',
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                    lineNumber: 37,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 27,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = DropdownMenuSubTrigger;
    DropdownMenuSubTrigger.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'SubTrigger'
      ].displayName;
    const DropdownMenuSubContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c2 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'SubContent'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 46,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c3 = DropdownMenuSubContent;
    DropdownMenuSubContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'SubContent'
      ].displayName;
    const DropdownMenuContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c4 = ({ className, sideOffset = 4, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Portal'
            ],
            {
              children: /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Content'
                ],
                {
                  ref: ref,
                  sideOffset: sideOffset,
                  className: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'cn'
                  ])(
                    'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className
                  ),
                  ...props,
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                  lineNumber: 62,
                  columnNumber: 5,
                },
                ('TURBOPACK compile-time value', void 0)
              ),
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 61,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c5 = DropdownMenuContent;
    DropdownMenuContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Content'
      ].displayName;
    const DropdownMenuItem =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c6 = ({ className, inset, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Item'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none motion-safe:transition-colors motion-reduce:transition-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                inset && 'pl-8',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 81,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c7 = DropdownMenuItem;
    DropdownMenuItem.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Item'
      ].displayName;
    const DropdownMenuCheckboxItem =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c8 = ({ className, children, checked, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'CheckboxItem'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none motion-safe:transition-colors motion-reduce:transition-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className
              ),
              checked: checked,
              ...props,
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'span',
                  {
                    className: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'ItemIndicator'
                      ],
                      {
                        children: /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__[
                            'Check'
                          ],
                          {
                            className: 'h-4 w-4',
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                            lineNumber: 108,
                            columnNumber: 9,
                          },
                          ('TURBOPACK compile-time value', void 0)
                        ),
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                        lineNumber: 107,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                    lineNumber: 106,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
                children,
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 97,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c9 = DropdownMenuCheckboxItem;
    DropdownMenuCheckboxItem.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'CheckboxItem'
      ].displayName;
    const DropdownMenuRadioItem =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c10 = ({ className, children, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'RadioItem'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none motion-safe:transition-colors motion-reduce:transition-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className
              ),
              ...props,
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'span',
                  {
                    className: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'ItemIndicator'
                      ],
                      {
                        children: /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__[
                            'Circle'
                          ],
                          {
                            className: 'h-2 w-2 fill-current',
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                            lineNumber: 130,
                            columnNumber: 9,
                          },
                          ('TURBOPACK compile-time value', void 0)
                        ),
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                        lineNumber: 129,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
                    lineNumber: 128,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
                children,
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 120,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c11 = DropdownMenuRadioItem;
    DropdownMenuRadioItem.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'RadioItem'
      ].displayName;
    const DropdownMenuLabel =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c12 = ({ className, inset, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Label'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 144,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c13 = DropdownMenuLabel;
    DropdownMenuLabel.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Label'
      ].displayName;
    const DropdownMenuSeparator =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c14 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Separator'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('-mx-1 my-1 h-px bg-muted', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
              lineNumber: 156,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c15 = DropdownMenuSeparator;
    DropdownMenuSeparator.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Separator'
      ].displayName;
    const DropdownMenuShortcut = ({ className, ...props }) => {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'span',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('ml-auto text-xs tracking-widest opacity-60', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/dropdown-menu.tsx',
          lineNumber: 166,
          columnNumber: 5,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    };
    _c16 = DropdownMenuShortcut;
    DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15, _c16;
    __turbopack_context__.k.register(_c, 'DropdownMenuSubTrigger$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'DropdownMenuSubTrigger');
    __turbopack_context__.k.register(_c2, 'DropdownMenuSubContent$React.forwardRef');
    __turbopack_context__.k.register(_c3, 'DropdownMenuSubContent');
    __turbopack_context__.k.register(_c4, 'DropdownMenuContent$React.forwardRef');
    __turbopack_context__.k.register(_c5, 'DropdownMenuContent');
    __turbopack_context__.k.register(_c6, 'DropdownMenuItem$React.forwardRef');
    __turbopack_context__.k.register(_c7, 'DropdownMenuItem');
    __turbopack_context__.k.register(_c8, 'DropdownMenuCheckboxItem$React.forwardRef');
    __turbopack_context__.k.register(_c9, 'DropdownMenuCheckboxItem');
    __turbopack_context__.k.register(_c10, 'DropdownMenuRadioItem$React.forwardRef');
    __turbopack_context__.k.register(_c11, 'DropdownMenuRadioItem');
    __turbopack_context__.k.register(_c12, 'DropdownMenuLabel$React.forwardRef');
    __turbopack_context__.k.register(_c13, 'DropdownMenuLabel');
    __turbopack_context__.k.register(_c14, 'DropdownMenuSeparator$React.forwardRef');
    __turbopack_context__.k.register(_c15, 'DropdownMenuSeparator');
    __turbopack_context__.k.register(_c16, 'DropdownMenuShortcut');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/components/header.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'HEADER_INTERACTIVE_STYLES',
      () => HEADER_INTERACTIVE_STYLES,
      'HEADER_SIZES',
      () => HEADER_SIZES,
      'HEADER_SPACING',
      () => HEADER_SPACING,
      'NOTIFICATION_BADGE_POSITION',
      () => NOTIFICATION_BADGE_POSITION,
      'getHeaderButtonClasses',
      () => getHeaderButtonClasses,
      'getHeaderSizeClasses',
      () => getHeaderSizeClasses,
      'getHeaderSpacingClass',
      () => getHeaderSpacingClass,
      'getNotificationBadgePositionClass',
      () => getNotificationBadgePositionClass,
    ]);
    /**
     * Header Component Tokens (Layer 3: Component-Specific)
     *
     * Semantic tokens를 Header 컴포넌트 맥락에 맞게 조합합니다.
     * 다른 컴포넌트(sidebar, toolbar 등)도 같은 패턴으로 확장 가능합니다.
     *
     * SSOT: Header의 모든 스타일은 여기서만 정의
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/primitives.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    const HEADER_SIZES = {
      /** 버튼 컨테이너 (터치 영역) */ container:
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'INTERACTIVE_TOKENS'
          ].size.standard,
          'h'
        ) +
        ' ' +
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'INTERACTIVE_TOKENS'
          ].size.standard,
          'w'
        ),
      /** 아이콘 */ icon:
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'INTERACTIVE_TOKENS'
          ].icon.standard,
          'h'
        ) +
        ' ' +
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'INTERACTIVE_TOKENS'
          ].icon.standard,
          'w'
        ),
      /** 배지 (알림 카운트) */ badge:
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CONTENT_TOKENS'
          ].badge.medium,
          'h'
        ) +
        ' ' +
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CONTENT_TOKENS'
          ].badge.medium,
          'min-w'
        ),
      /** 아바타 */ avatar:
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CONTENT_TOKENS'
          ].avatar.medium,
          'h'
        ) +
        ' ' +
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'toTailwindSize'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CONTENT_TOKENS'
          ].avatar.medium,
          'w'
        ),
    };
    const HEADER_SPACING = {
      /** 요소 간 수평 간격 */ gap: (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'toTailwindGap'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'INTERACTIVE_TOKENS'
        ].spacing.gap
      ),
    };
    const HEADER_INTERACTIVE_STYLES = {
      /** 포커스 (WCAG 2.1 AAA) */ focus: [
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ul-info',
        'focus-visible:ring-offset-2',
      ].join(' '),
      /** 호버 */ hover: 'hover:bg-muted/80',
      /** Transition (Web Interface Guidelines 준수) */ transition:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastAll,
      /** 버튼 모양 */ shape: 'rounded-full',
    };
    function getHeaderButtonClasses() {
      return [
        HEADER_SIZES.container,
        HEADER_INTERACTIVE_STYLES.shape,
        HEADER_INTERACTIVE_STYLES.focus,
        HEADER_INTERACTIVE_STYLES.hover,
        HEADER_INTERACTIVE_STYLES.transition,
      ].join(' ');
    }
    function getHeaderSizeClasses(element) {
      return HEADER_SIZES[element];
    }
    function getHeaderSpacingClass() {
      return HEADER_SPACING.gap;
    }
    const NOTIFICATION_BADGE_POSITION = {
      mobile: '-right-0.5 -top-0.5',
      desktop: 'md:-right-1 md:-top-1',
    };
    function getNotificationBadgePositionClass() {
      return `${NOTIFICATION_BADGE_POSITION.mobile} ${NOTIFICATION_BADGE_POSITION.desktop}`;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/ThemeToggle.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ThemeToggle', () => ThemeToggle]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/monitor.js [app-client] (ecmascript) <export default as Monitor>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dropdown-menu.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/header.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ThemeToggle() {
      _s();
      const { theme, setTheme } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTheme'
      ])();
      const [mounted, setMounted] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      // Hydration 이슈 방지
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'ThemeToggle.useEffect': () => {
            setMounted(true);
          },
        }['ThemeToggle.useEffect'],
        []
      );
      if (!mounted) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Button'
          ],
          {
            variant: 'ghost',
            size: 'icon',
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'getHeaderButtonClasses'
            ])(),
            children: [
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__[
                  'Sun'
                ],
                {
                  className: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'getHeaderSizeClasses'
                  ])('icon'),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                  lineNumber: 38,
                  columnNumber: 9,
                },
                this
              ),
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'span',
                {
                  className: 'sr-only',
                  children: t('layout.themeToggle'),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                  lineNumber: 39,
                  columnNumber: 9,
                },
                this
              ),
            ],
          },
          void 0,
          true,
          {
            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
            lineNumber: 37,
            columnNumber: 7,
          },
          this
        );
      }
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'DropdownMenu'
        ],
        {
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'DropdownMenuTrigger'
              ],
              {
                asChild: true,
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Button'
                  ],
                  {
                    variant: 'ghost',
                    size: 'icon',
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'text-foreground',
                      (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getHeaderButtonClasses'
                      ])()
                    ),
                    'aria-label': t('layout.themeToggle'),
                    children: [
                      theme === 'dark'
                        ? /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__[
                              'Moon'
                            ],
                            {
                              className: (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'getHeaderSizeClasses'
                              ])('icon'),
                            },
                            void 0,
                            false,
                            {
                              fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                              lineNumber: 54,
                              columnNumber: 13,
                            },
                            this
                          )
                        : theme === 'light'
                          ? /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__[
                                'Sun'
                              ],
                              {
                                className: (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'getHeaderSizeClasses'
                                ])('icon'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                                lineNumber: 56,
                                columnNumber: 13,
                              },
                              this
                            )
                          : /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__[
                                'Monitor'
                              ],
                              {
                                className: (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'getHeaderSizeClasses'
                                ])('icon'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                                lineNumber: 58,
                                columnNumber: 13,
                              },
                              this
                            ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'span',
                        {
                          className: 'sr-only',
                          children: t('layout.themeToggle'),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                          lineNumber: 60,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                    lineNumber: 47,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                lineNumber: 46,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'DropdownMenuContent'
              ],
              {
                align: 'end',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      onClick: () => setTheme('light'),
                      className: 'flex items-center gap-2 cursor-pointer',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__[
                            'Sun'
                          ],
                          {
                            className: 'h-4 w-4',
                            'aria-hidden': 'true',
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                            lineNumber: 68,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            children: t('layout.lightMode'),
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                            lineNumber: 69,
                            columnNumber: 11,
                          },
                          this
                        ),
                        theme === 'light' &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'span',
                            {
                              className: 'ml-auto text-ul-green',
                              children: '✓',
                            },
                            void 0,
                            false,
                            {
                              fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                              lineNumber: 70,
                              columnNumber: 33,
                            },
                            this
                          ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                      lineNumber: 64,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      onClick: () => setTheme('dark'),
                      className: 'flex items-center gap-2 cursor-pointer',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__[
                            'Moon'
                          ],
                          {
                            className: 'h-4 w-4',
                            'aria-hidden': 'true',
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                            lineNumber: 76,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            children: t('layout.darkMode'),
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                            lineNumber: 77,
                            columnNumber: 11,
                          },
                          this
                        ),
                        theme === 'dark' &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'span',
                            {
                              className: 'ml-auto text-ul-green',
                              children: '✓',
                            },
                            void 0,
                            false,
                            {
                              fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                              lineNumber: 78,
                              columnNumber: 32,
                            },
                            this
                          ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                      lineNumber: 72,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      onClick: () => setTheme('system'),
                      className: 'flex items-center gap-2 cursor-pointer',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__[
                            'Monitor'
                          ],
                          {
                            className: 'h-4 w-4',
                            'aria-hidden': 'true',
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                            lineNumber: 84,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            children: t('layout.systemMode'),
                          },
                          void 0,
                          false,
                          {
                            fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                            lineNumber: 85,
                            columnNumber: 11,
                          },
                          this
                        ),
                        theme === 'system' &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'span',
                            {
                              className: 'ml-auto text-ul-green',
                              children: '✓',
                            },
                            void 0,
                            false,
                            {
                              fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                              lineNumber: 86,
                              columnNumber: 34,
                            },
                            this
                          ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                      lineNumber: 80,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
                lineNumber: 63,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/ThemeToggle.tsx',
          lineNumber: 45,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ThemeToggle, 'tAXXOKVhxn+IqLGmAIlwQFcIPWM=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTheme'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ThemeToggle;
    var _c;
    __turbopack_context__.k.register(_c, 'ThemeToggle');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-auth.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useAuth', () => useAuth]);
    /**
     * 인증 관련 커스텀 훅
     *
     * ⚠️ 인증 정책: NextAuth 단일 인증 소스
     * - 모든 인증 상태는 NextAuth 세션에서 관리
     * - localStorage 토큰 사용 금지
     * - API 호출 시 세션의 accessToken 사용
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/roles.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/auth-token.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var _s = __turbopack_context__.k.signature();
    function useAuth() {
      _s();
      const { data: session, status } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      const router = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRouter'
      ])();
      const isAuthenticated = status === 'authenticated' && !!session;
      const isLoading = status === 'loading';
      // 역할 확인 함수
      const hasRole = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useAuth.useCallback[hasRole]': (requiredRole) => {
            if (!isAuthenticated || !session?.user?.roles) {
              return false;
            }
            const userRoles = session.user.roles;
            const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            return requiredRoles.some(
              {
                'useAuth.useCallback[hasRole]': (role) =>
                  userRoles.includes(role) ||
                  userRoles.includes(role.toUpperCase()) ||
                  userRoles.includes(role.toLowerCase()),
              }['useAuth.useCallback[hasRole]']
            );
          },
        }['useAuth.useCallback[hasRole]'],
        [isAuthenticated, session]
      );
      // 시험소 관리자 권한 확인 (lab_manager, system_admin — SSOT: ADMIN_ROLES)
      const isAdmin = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useAuth.useCallback[isAdmin]': () => {
            return hasRole(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'ADMIN_ROLES'
              ]
            );
          },
        }['useAuth.useCallback[isAdmin]'],
        [hasRole]
      );
      // 기술책임자 이상 권한 확인 (technical_manager, lab_manager, system_admin)
      const isManager = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useAuth.useCallback[isManager]': () => {
            return hasRole([
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'UserRoleValues'
              ].TECHNICAL_MANAGER,
              ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'ADMIN_ROLES'
              ],
            ]);
          },
        }['useAuth.useCallback[isManager]'],
        [hasRole]
      );
      // 로그아웃 함수
      const logout = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useAuth.useCallback[logout]': async () => {
            // ✅ API 클라이언트 토큰 캐시 초기화
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'clearTokenCache'
            ])();
            // 다른 탭에 수동 로그아웃 알림 (BroadcastChannel 미지원 브라우저 안전 처리)
            if (
              ('TURBOPACK compile-time value', 'object') !== 'undefined' &&
              'BroadcastChannel' in window
            ) {
              const ch = new BroadcastChannel(
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'SESSION_SYNC_CHANNEL'
                ]
              );
              ch.postMessage({
                type: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'SESSION_SYNC_MESSAGE'
                ].LOGOUT,
              });
              ch.close();
            }
            await (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'signOut'
            ])({
              redirect: false,
            });
            router.push('/login');
            router.refresh();
          },
        }['useAuth.useCallback[logout]'],
        [router]
      );
      // auth:session-expired 핸들러는 AuthSync(providers.tsx)가 SSOT로 처리
      return {
        session,
        user: session?.user,
        isAuthenticated,
        isLoading,
        hasRole,
        isAdmin,
        isManager,
        logout,
      };
    }
    _s(useAuth, 'yuPDITisOpOgHqvQowFpxZrmq9o=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRouter'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/avatar.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Avatar',
      () => Avatar,
      'AvatarFallback',
      () => AvatarFallback,
      'AvatarImage',
      () => AvatarImage,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-avatar/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const Avatar =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Root'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/avatar.tsx',
              lineNumber: 12,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = Avatar;
    Avatar.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ].displayName;
    const AvatarImage =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c2 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Image'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('aspect-square h-full w-full', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/avatar.tsx',
              lineNumber: 24,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c3 = AvatarImage;
    AvatarImage.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Image'
      ].displayName;
    const AvatarFallback =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c4 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Fallback'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('flex h-full w-full items-center justify-center rounded-full bg-muted', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/avatar.tsx',
              lineNumber: 36,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c5 = AvatarFallback;
    AvatarFallback.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Fallback'
      ].displayName;
    var _c, _c1, _c2, _c3, _c4, _c5;
    __turbopack_context__.k.register(_c, 'Avatar$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Avatar');
    __turbopack_context__.k.register(_c2, 'AvatarImage$React.forwardRef');
    __turbopack_context__.k.register(_c3, 'AvatarImage');
    __turbopack_context__.k.register(_c4, 'AvatarFallback$React.forwardRef');
    __turbopack_context__.k.register(_c5, 'AvatarFallback');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['UserProfileDropdown', () => UserProfileDropdown]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-auth.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/avatar.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dropdown-menu.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/skeleton.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/header.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/frontend-routes.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var _s = __turbopack_context__.k.signature();
    ('use client');
    // 역할별 배지 색상
    const roleBadgeColors = {
      test_engineer: 'bg-brand-info/10 text-brand-info',
      technical_manager: 'bg-brand-ok/10 text-brand-ok',
      quality_manager: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
      lab_manager: 'bg-brand-purple/10 text-brand-purple',
      system_admin: 'bg-ul-red/10 text-ul-red dark:bg-ul-red/20',
    };
    function UserProfileDropdown() {
      _s();
      const { user, isLoading, logout } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useAuth'
      ])();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      if (isLoading) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          'div',
          {
            className: 'flex items-center gap-2',
            children: [
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Skeleton'
                ],
                {
                  className: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'cn'
                  ])(
                    'rounded-full',
                    (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'getHeaderSizeClasses'
                    ])('avatar')
                  ),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                  lineNumber: 47,
                  columnNumber: 9,
                },
                this
              ),
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Skeleton'
                ],
                {
                  className: 'h-4 w-20 hidden sm:block',
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                  lineNumber: 48,
                  columnNumber: 9,
                },
                this
              ),
            ],
          },
          void 0,
          true,
          {
            fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
            lineNumber: 46,
            columnNumber: 7,
          },
          this
        );
      }
      if (!user) {
        return null;
      }
      const userRole =
        user.role?.toLowerCase() ||
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'UserRoleValues'
        ].TEST_ENGINEER;
      const roleNames = {
        test_engineer: t('roles.test_engineer'),
        technical_manager: t('roles.technical_manager'),
        quality_manager: t('roles.quality_manager'),
        lab_manager: t('roles.lab_manager'),
        system_admin: t('roles.system_admin'),
      };
      const roleDisplayName = roleNames[userRole] ?? userRole;
      const badgeColor = roleBadgeColors[userRole] || roleBadgeColors.test_engineer;
      // 이름의 첫 글자 추출 (아바타 fallback용)
      const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
      };
      const handleLogout = async () => {
        await logout();
      };
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'DropdownMenu'
        ],
        {
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'DropdownMenuTrigger'
              ],
              {
                asChild: true,
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Button'
                  ],
                  {
                    variant: 'ghost',
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'flex items-center gap-2 px-2',
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'HEADER_INTERACTIVE_STYLES'
                      ].hover,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'HEADER_INTERACTIVE_STYLES'
                      ].focus,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'HEADER_INTERACTIVE_STYLES'
                      ].transition
                    ),
                    'aria-label': t('layout.userMenu'),
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Avatar'
                        ],
                        {
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                            'cn'
                          ])(
                            'border-2 border-ul-midnight/20 dark:border-white/20',
                            (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'getHeaderSizeClasses'
                            ])('avatar')
                          ),
                          children: /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'AvatarFallback'
                            ],
                            {
                              className: 'bg-ul-midnight text-white text-xs font-medium',
                              children: getInitials(user.name),
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                              lineNumber: 101,
                              columnNumber: 13,
                            },
                            this
                          ),
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                          lineNumber: 95,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'span',
                        {
                          className: 'hidden sm:block text-sm font-medium truncate max-w-[120px]',
                          children: user.name || t('layout.user'),
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                          lineNumber: 105,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__[
                          'ChevronDown'
                        ],
                        {
                          className: 'h-4 w-4 text-muted-foreground',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                          lineNumber: 108,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                    lineNumber: 85,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                lineNumber: 84,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'DropdownMenuContent'
              ],
              {
                align: 'end',
                className: 'w-56',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuLabel'
                    ],
                    {
                      className: 'font-normal',
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'flex flex-col gap-1',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'p',
                              {
                                className: 'text-sm font-medium leading-none',
                                children: user.name || t('layout.user'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 116,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'p',
                              {
                                className: 'text-xs text-muted-foreground truncate',
                                children: user.email || t('layout.noEmail'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 117,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit mt-1 ${badgeColor}`,
                                children: roleDisplayName,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 120,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                          lineNumber: 115,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                      lineNumber: 114,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuSeparator'
                    ],
                    {},
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                      lineNumber: 128,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      asChild: true,
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'default'
                        ],
                        {
                          href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'FRONTEND_ROUTES'
                          ].SETTINGS.PROFILE,
                          className: 'cursor-pointer',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__[
                                'User'
                              ],
                              {
                                className: 'mr-2 h-4 w-4',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 133,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                children: t('settingsProfile'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 134,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                          lineNumber: 132,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                      lineNumber: 131,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      asChild: true,
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'default'
                        ],
                        {
                          href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'FRONTEND_ROUTES'
                          ].SETTINGS.INDEX,
                          className: 'cursor-pointer',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__[
                                'Settings'
                              ],
                              {
                                className: 'mr-2 h-4 w-4',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 141,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                children: t('settings'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                                lineNumber: 142,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                          lineNumber: 140,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                      lineNumber: 139,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuSeparator'
                    ],
                    {},
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                      lineNumber: 146,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      onClick: handleLogout,
                      className:
                        'text-ul-red focus-visible:text-ul-red focus-visible:bg-ul-red/10 cursor-pointer',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__[
                            'LogOut'
                          ],
                          {
                            className: 'mr-2 h-4 w-4',
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                            lineNumber: 153,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            children: t('layout.logout'),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                            lineNumber: 154,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                      lineNumber: 149,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
                lineNumber: 112,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx',
          lineNumber: 83,
          columnNumber: 5,
        },
        this
      );
    }
    _s(UserProfileDropdown, 'Sg5qZs8JPK/wIhZO6p7LZZxoI/0=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useAuth'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = UserProfileDropdown;
    var _c;
    __turbopack_context__.k.register(_c, 'UserProfileDropdown');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/badge.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Badge', () => Badge, 'badgeVariants', () => badgeVariants]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    const badgeVariants = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'cva'
    ])(
      'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold motion-safe:transition-[color,background-color,border-color] motion-safe:duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      {
        variants: {
          variant: {
            default:
              'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
            secondary:
              'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            destructive:
              'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
            outline: 'text-foreground',
            success: 'border-transparent bg-brand-ok/10 text-brand-ok shadow hover:bg-brand-ok/20',
          },
        },
        defaultVariants: {
          variant: 'default',
        },
      }
    );
    function Badge({ className, variant, ...props }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'span',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(
            badgeVariants({
              variant,
            }),
            className
          ),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/badge.tsx',
          lineNumber: 31,
          columnNumber: 10,
        },
        this
      );
    }
    _c = Badge;
    var _c;
    __turbopack_context__.k.register(_c, 'Badge');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/visual-feedback.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'URGENCY_FEEDBACK_MAP',
      () => URGENCY_FEEDBACK_MAP,
      'VISUAL_FEEDBACK_TOKENS',
      () => VISUAL_FEEDBACK_TOKENS,
      'getCountBasedUrgency',
      () => getCountBasedUrgency,
      'getElapsedDaysUrgency',
      () => getElapsedDaysUrgency,
      'getStatusBasedUrgency',
      () => getStatusBasedUrgency,
      'getTimeBasedUrgency',
      () => getTimeBasedUrgency,
      'getUrgencyFeedbackClasses',
      () => getUrgencyFeedbackClasses,
    ]);
    /**
     * Visual Feedback System - Design Token v3
     *
     * SSOT: 긴급도 기반 시각적 피드백 아키텍처
     *
     * Architecture:
     * - Urgency Level: 비즈니스 로직 계층 (info/warning/critical/emergency)
     * - Feedback Mode: 시각적 표현 계층 (static/subtle/attention/urgent)
     * - Animation Strategy: 접근성 고려 (motion-safe, prefers-reduced-motion)
     *
     * Design Philosophy:
     * - "긴급함"은 사용자 피로도를 유발 → 신중하게 사용
     * - Pulse는 emergency만 → 남용 금지
     * - Ring/Scale은 attention부터 → 계층적 강조
     * - 모든 animation은 motion-safe 조건부 적용
     *
     * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/approval-kpi.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    const URGENCY_FEEDBACK_MAP = {
      info: 'static',
      warning: 'subtle',
      critical: 'attention',
      emergency: 'urgent',
    };
    const VISUAL_FEEDBACK_TOKENS = {
      /** 기본 (변화 없음) */ static: {
        scale: 'scale-100',
        ring: '',
        animation: '',
        bgOpacity: 'bg-opacity-100',
      },
      /** 미묘한 강조 (scale만) */ subtle: {
        scale: 'scale-105',
        ring: '',
        animation: '',
        bgOpacity: 'bg-opacity-100',
      },
      /** 명확한 강조 (scale + ring) */ attention: {
        scale: 'scale-105',
        ring: 'ring-1 ring-destructive/30 ring-offset-1',
        animation: '',
        bgOpacity: 'bg-opacity-100',
      },
      /** 최대 강조 (scale + ring + pulse) - 신중하게 사용 */ urgent: {
        scale: 'scale-110',
        ring: 'ring-2 ring-destructive/50 ring-offset-2',
        animation:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ANIMATION_PRESETS'
          ].pulse,
        bgOpacity: 'bg-opacity-90',
      },
    };
    function getUrgencyFeedbackClasses(urgency, includeAnimation = true) {
      const mode = URGENCY_FEEDBACK_MAP[urgency];
      const feedback = VISUAL_FEEDBACK_TOKENS[mode];
      return [
        feedback.scale,
        feedback.ring,
        includeAnimation ? feedback.animation : '',
        feedback.bgOpacity,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastTransform,
      ]
        .filter(Boolean)
        .join(' ');
    }
    function getCountBasedUrgency(count) {
      if (count >= 20) return 'emergency'; // 20+ → 긴급 (pulse)
      if (count >= 10) return 'critical'; // 10-19 → 위험 (ring)
      if (count >= 5) return 'warning'; // 5-9 → 주의 (scale)
      return 'info'; // 1-4 → 정보 (기본)
    }
    function getTimeBasedUrgency(daysUntilDue) {
      if (daysUntilDue < 0) return 'emergency'; // 지연 → 긴급
      if (daysUntilDue <= 3) return 'critical'; // D-3 이내 → 위험
      if (daysUntilDue <= 7) return 'warning'; // D-7 이내 → 주의
      return 'info'; // 여유 있음 → 정보
    }
    function getElapsedDaysUrgency(elapsedDays) {
      if (
        elapsedDays >=
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'APPROVAL_KPI'
        ].URGENT_THRESHOLD_DAYS
      )
        return 'critical';
      if (
        elapsedDays >=
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'APPROVAL_KPI'
        ].WARNING_THRESHOLD_DAYS
      )
        return 'warning';
      return 'info';
    }
    function getStatusBasedUrgency(status) {
      const map = {
        normal: 'info',
        warning: 'warning',
        error: 'critical',
        critical: 'emergency',
      };
      return map[status];
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/components/notification.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'NOTIFICATION_BADGE_VARIANTS',
      () => NOTIFICATION_BADGE_VARIANTS,
      'NOTIFICATION_DROPDOWN_ANIMATION',
      () => NOTIFICATION_DROPDOWN_ANIMATION,
      'NOTIFICATION_DROPDOWN_ELEVATION',
      () => NOTIFICATION_DROPDOWN_ELEVATION,
      'NOTIFICATION_DROPDOWN_SHADOW',
      () => NOTIFICATION_DROPDOWN_SHADOW,
      'NOTIFICATION_EMPTY_STATE',
      () => NOTIFICATION_EMPTY_STATE,
      'NOTIFICATION_LIST_EMPTY_TOKENS',
      () => NOTIFICATION_LIST_EMPTY_TOKENS,
      'NOTIFICATION_LIST_FILTER_TOKENS',
      () => NOTIFICATION_LIST_FILTER_TOKENS,
      'NOTIFICATION_LIST_HEADER_TOKENS',
      () => NOTIFICATION_LIST_HEADER_TOKENS,
      'NOTIFICATION_LIST_ITEM_TOKENS',
      () => NOTIFICATION_LIST_ITEM_TOKENS,
      'NOTIFICATION_LIST_PAGINATION_TOKENS',
      () => NOTIFICATION_LIST_PAGINATION_TOKENS,
      'NOTIFICATION_LIST_SKELETON_TOKENS',
      () => NOTIFICATION_LIST_SKELETON_TOKENS,
      'READ_NOTIFICATION_STYLES',
      () => READ_NOTIFICATION_STYLES,
      'UNREAD_NOTIFICATION_STYLES',
      () => UNREAD_NOTIFICATION_STYLES,
      'getNotificationBadgeClasses',
      () => getNotificationBadgeClasses,
      'getNotificationBadgeVariant',
      () => getNotificationBadgeVariant,
      'getNotificationItemAnimation',
      () => getNotificationItemAnimation,
      'getNotificationItemStyles',
      () => getNotificationItemStyles,
    ]);
    /**
     * Notification Component Tokens (Architecture v3)
     *
     * SSOT: Visual Feedback System 기반 알림 디자인
     * - Count → Urgency Level → Visual Feedback (명시적 매핑)
     * - 하드코딩 제거, Design Token 참조
     *
     * SSOT 역할:
     * - NOTIFICATION_LIST_HEADER_TOKENS: 리스트 페이지 헤더
     * - NOTIFICATION_LIST_FILTER_TOKENS: 탭 + 필터 바
     * - NOTIFICATION_LIST_ITEM_TOKENS: 알림 아이템 카드
     * - NOTIFICATION_LIST_SKELETON_TOKENS: 로딩 스켈레톤
     * - NOTIFICATION_LIST_EMPTY_TOKENS: 빈 상태
     * - NOTIFICATION_LIST_PAGINATION_TOKENS: 페이지네이션
     *
     * @see ../visual-feedback.ts - SSOT for urgency-based feedback
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/visual-feedback.ts [app-client] (ecmascript)'
      );
    const NOTIFICATION_BADGE_VARIANTS = {
      default: {
        scale: 'scale-100',
        animation: '',
        ring: '',
      },
      attention: {
        scale: 'scale-105',
        animation: '',
        ring: 'ring-1 ring-destructive/30 ring-offset-1',
      },
      urgent: {
        scale: 'scale-110',
        animation: '',
        ring: 'ring-2 ring-destructive/50 ring-offset-2',
      },
    };
    function getNotificationBadgeVariant(count) {
      if (count >= 10) return 'urgent';
      if (count >= 6) return 'attention';
      return 'default';
    }
    function getNotificationBadgeClasses(count, includeAnimation = false) {
      const urgency = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getCountBasedUrgency'
      ])(count);
      const feedbackClasses = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getUrgencyFeedbackClasses'
      ])(urgency, includeAnimation);
      return [feedbackClasses, 'font-bold', 'tabular-nums'].filter(Boolean).join(' ');
    }
    const NOTIFICATION_DROPDOWN_ANIMATION = {
      /** 등장 애니메이션 */ enter: [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'ANIMATION_PRESETS'
        ].fadeIn,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'ANIMATION_PRESETS'
        ].slideDown,
        `duration-${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['MOTION_TOKENS'].entrance.slide.duration}`,
      ].join(' '),
      /** 퇴장 애니메이션 */ exit: [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'ANIMATION_PRESETS'
        ].fadeOut,
        `duration-${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['MOTION_TOKENS'].exit.fade.duration}`,
      ].join(' '),
    };
    function getNotificationItemAnimation(index) {
      return {
        animationDelay: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getStaggerDelay'
        ])(index, 'list'),
      };
    }
    const NOTIFICATION_DROPDOWN_ELEVATION =
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'ELEVATION_TOKENS'
      ].layer.floating;
    const NOTIFICATION_DROPDOWN_SHADOW =
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'ELEVATION_TOKENS'
      ].shadow.prominent;
    const UNREAD_NOTIFICATION_STYLES = {
      /** 배경색 */ background: 'bg-card',
      /** 펄스 애니메이션 (주목) */ animation:
        'motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]',
      /** 인디케이터 점 */ indicator: {
        size: 'h-2 w-2',
        color: 'bg-primary',
        position: 'absolute right-3 top-3',
        shape: 'rounded-full',
      },
    };
    const READ_NOTIFICATION_STYLES = {
      background: 'bg-muted/80',
      animation: '',
    };
    function getNotificationItemStyles(isRead) {
      return isRead ? READ_NOTIFICATION_STYLES : UNREAD_NOTIFICATION_STYLES;
    }
    const NOTIFICATION_EMPTY_STATE = {
      icon: {
        size: 'h-10 w-10',
        color: 'text-muted-foreground/30',
      },
      checkmark: {
        size: 'h-4 w-4',
        position: 'absolute -bottom-0.5 -right-0.5',
        background: 'bg-success',
        shape: 'rounded-full',
      },
    };
    const NOTIFICATION_LIST_HEADER_TOKENS = {
      container: 'flex items-center justify-between flex-wrap gap-4',
      iconWrapper: 'relative',
      icon: 'h-6 w-6 text-primary',
      unreadBadge:
        'absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center',
      unreadBadgeText: 'text-xs text-destructive-foreground tabular-nums font-bold',
      titleGroup: 'flex items-center gap-3',
      title: 'text-2xl font-bold tracking-tight text-foreground',
      subtitle: 'text-sm text-muted-foreground tabular-nums',
    };
    const NOTIFICATION_LIST_FILTER_TOKENS = {
      filterRow: 'flex items-center justify-between flex-wrap gap-3',
      filterGroup: 'flex items-center gap-2',
      tabBadge:
        'ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground tabular-nums',
      categorySelect: 'w-[130px]',
      searchInput: 'w-[200px]',
      tabContent: 'mt-4',
    };
    const NOTIFICATION_LIST_ITEM_TOKENS = {
      wrapper: 'relative group motion-safe:animate-[staggerFadeIn_0.3s_ease-out_forwards]',
      card: {
        base: [
          'group p-4 mb-2 rounded-lg shadow-sm relative border-l-4 block w-full text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TRANSITION_PRESETS'
          ].moderateShadowTransform,
          'motion-safe:hover:shadow-lg motion-safe:hover:scale-[1.01] motion-safe:hover:-translate-y-0.5',
        ].join(' '),
        unread: 'bg-card motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]',
        read: 'bg-muted/80 opacity-60',
      },
      indicator: {
        dot: 'absolute right-3 top-3 h-2 w-2 rounded-full bg-primary motion-safe:animate-badge-pulse',
      },
      iconCircle: [
        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastTransform,
        'motion-safe:group-hover:scale-110',
      ].join(' '),
      iconSize: 'h-4 w-4',
      content: 'flex-1 min-w-0',
      title: 'font-semibold text-sm line-clamp-2 tracking-tight leading-snug',
      body: 'text-sm text-muted-foreground mt-1 line-clamp-3 leading-relaxed',
      timeRow: 'flex items-center gap-1 text-xs text-muted-foreground/60 mt-2',
      timeIcon: 'h-3 w-3',
      deleteBtn: [
        'absolute right-2 top-2 h-6 w-6',
        'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastOpacity,
      ].join(' '),
      deleteIcon: 'h-3 w-3',
    };
    const NOTIFICATION_LIST_SKELETON_TOKENS = {
      container: 'space-y-3',
      card: 'p-4 rounded-lg bg-muted/50 border-l-4 border-muted animate-pulse',
      row: 'flex items-start gap-3',
      iconPlaceholder: 'h-4 w-4 rounded bg-muted-foreground/20 mt-1',
      contentGroup: 'flex-1 space-y-2',
      titleLine: 'h-4 bg-muted-foreground/20 rounded w-3/4',
      bodyLine: 'h-3 bg-muted-foreground/10 rounded w-full',
      timeLine: 'h-3 bg-muted-foreground/10 rounded w-1/4',
    };
    const NOTIFICATION_LIST_EMPTY_TOKENS = {
      container: 'py-16 text-center',
      iconWrapper: 'relative inline-block mb-4 motion-safe:animate-gentle-bounce',
      icon: 'h-16 w-16 mx-auto text-muted-foreground/30',
      checkmark: [
        'absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success',
        'flex items-center justify-center motion-safe:animate-checkmark-pop shadow-lg',
      ].join(' '),
      checkmarkText: 'text-xs text-success-foreground font-bold',
      title: 'text-lg font-semibold mb-2 tracking-tight',
      desc: 'text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed',
    };
    const NOTIFICATION_LIST_PAGINATION_TOKENS = {
      container: 'flex items-center justify-between',
      info: 'text-sm text-muted-foreground tabular-nums',
      buttonGroup: 'flex gap-2',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-date-formatter.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useDateFormatter', () => useDateFormatter]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function useDateFormatter() {
      _s();
      const locale = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLocale'
      ])();
      const dateFnsLocale =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'DATE_FNS_LOCALES'
        ][locale] ??
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'DATE_FNS_LOCALES'
        ].ko;
      // 로케일별 전체 날짜+시간 포맷 문자열
      const fullDateFmt = locale === 'en' ? 'MMM d, yyyy HH:mm' : 'yyyy년 MM월 dd일 HH:mm';
      return {
        /** 날짜를 포맷된 문자열로 변환 */ fmtDate: (date, formatStr) =>
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'formatDate'
          ])(date, formatStr, false, dateFnsLocale),
        /** 날짜와 시간을 포함한 포맷 */ fmtDateTime: (date) =>
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'formatDate'
          ])(date, fullDateFmt, false, dateFnsLocale),
        /** 상대 시간 표시 ("3 minutes ago" / "3분 전") */ fmtRelative: (date) =>
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'formatRelativeTime'
          ])(date, dateFnsLocale),
        /** 현재 로케일의 전체 날짜+시간 포맷 문자열 */ fullDateFmt,
      };
    }
    _s(useDateFormatter, 'ubkSS9Gz1bw7UV2c73rm/bCUdh8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useLocale'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/notifications/notification-item.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['NotificationItem', () => NotificationItem]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/box.js [app-client] (ecmascript) <export default as Box>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/notification.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$date$2d$formatter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-date-formatter.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    const CATEGORY_STYLE_MAP = {
      checkout: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__[
          'Box'
        ],
        color: 'text-brand-repair',
        borderColor: 'border-l-brand-repair',
        bgColor: 'bg-brand-repair/10',
      },
      calibration: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__[
          'Calendar'
        ],
        color: 'text-brand-info',
        borderColor: 'border-l-brand-info',
        bgColor: 'bg-brand-info/10',
      },
      calibration_plan: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__[
          'Calendar'
        ],
        color: 'text-brand-purple',
        borderColor: 'border-l-brand-purple',
        bgColor: 'bg-brand-purple/10',
      },
      non_conformance: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__[
          'AlertCircle'
        ],
        color: 'text-brand-critical',
        borderColor: 'border-l-brand-critical',
        bgColor: 'bg-brand-critical/10',
      },
      disposal: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
          'XCircle'
        ],
        color: 'text-muted-foreground',
        borderColor: 'border-l-muted-foreground',
        bgColor: 'bg-muted/50',
      },
      equipment_import: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__[
          'ArrowLeft'
        ],
        color: 'text-brand-purple',
        borderColor: 'border-l-brand-purple',
        bgColor: 'bg-brand-purple/10',
      },
      equipment: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__[
          'Settings'
        ],
        color: 'text-brand-ok',
        borderColor: 'border-l-brand-ok',
        bgColor: 'bg-brand-ok/10',
      },
      system: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__[
          'AlertCircle'
        ],
        color: 'text-brand-critical',
        borderColor: 'border-l-brand-critical',
        bgColor: 'bg-brand-critical/10',
      },
    };
    const DEFAULT_STYLE = {
      icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__[
        'Bell'
      ],
      color: 'text-muted-foreground',
      borderColor: 'border-l-muted-foreground',
      bgColor: 'bg-muted/50',
    };
    function getCategoryStyle(category) {
      return CATEGORY_STYLE_MAP[category] ?? DEFAULT_STYLE;
    }
    function NotificationItem({ notification, onMarkAsRead }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('notifications');
      const { fmtRelative, fmtDateTime } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$date$2d$formatter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useDateFormatter'
      ])();
      const style = getCategoryStyle(notification.category);
      const Icon = style.icon;
      const formattedDate = fmtRelative(notification.createdAt);
      const fullDate = fmtDateTime(notification.createdAt);
      const handleMarkAsRead = () => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
      };
      const T =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'NOTIFICATION_LIST_ITEM_TOKENS'
        ];
      const content = /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            !notification.isRead &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'div',
                {
                  className: T.indicator.dot,
                  'aria-hidden': 'true',
                  children: /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'span',
                    {
                      className: 'sr-only',
                      children: t('alerts.tabs.unread'),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notification-item.tsx',
                      lineNumber: 130,
                      columnNumber: 11,
                    },
                    this
                  ),
                },
                void 0,
                false,
                {
                  fileName:
                    '[project]/apps/frontend/components/notifications/notification-item.tsx',
                  lineNumber: 129,
                  columnNumber: 9,
                },
                this
              ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'flex items-start gap-3',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(T.iconCircle, style.bgColor),
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        Icon,
                        {
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                            'cn'
                          ])(T.iconSize, style.color),
                          'aria-hidden': 'true',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/notifications/notification-item.tsx',
                          lineNumber: 135,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notification-item.tsx',
                      lineNumber: 134,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: T.content,
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: T.title,
                            children: notification.title,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/notifications/notification-item.tsx',
                            lineNumber: 139,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: T.body,
                            children: notification.content,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/notifications/notification-item.tsx',
                            lineNumber: 140,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: T.timeRow,
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__[
                                  'Clock'
                                ],
                                {
                                  className: T.timeIcon,
                                  'aria-hidden': 'true',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/notifications/notification-item.tsx',
                                  lineNumber: 142,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'time',
                                {
                                  dateTime: notification.createdAt,
                                  title: fullDate,
                                  children: formattedDate,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/notifications/notification-item.tsx',
                                  lineNumber: 143,
                                  columnNumber: 13,
                                },
                                this
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/notifications/notification-item.tsx',
                            lineNumber: 141,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notification-item.tsx',
                      lineNumber: 138,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/notifications/notification-item.tsx',
                lineNumber: 133,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true
      );
      const baseClassName = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
        'cn'
      ])(T.card.base, notification.isRead ? T.card.read : T.card.unread, style.borderColor);
      // 내부 링크가 있으면 Next.js Link (SPA 내비게이션)
      if (notification.linkUrl?.startsWith('/')) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ],
          {
            href: notification.linkUrl,
            className: baseClassName,
            title: fullDate,
            onClick: handleMarkAsRead,
            children: content,
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/notifications/notification-item.tsx',
            lineNumber: 161,
            columnNumber: 7,
          },
          this
        );
      }
      // 외부 링크가 있으면 <a> 태그
      if (notification.linkUrl) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          'a',
          {
            href: notification.linkUrl,
            className: baseClassName,
            title: fullDate,
            onClick: handleMarkAsRead,
            rel: 'noopener noreferrer',
            children: content,
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/notifications/notification-item.tsx',
            lineNumber: 175,
            columnNumber: 7,
          },
          this
        );
      }
      // 링크 없으면 button (읽음 처리만)
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'button',
        {
          type: 'button',
          className: baseClassName,
          title: fullDate,
          onClick: handleMarkAsRead,
          children: content,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/notifications/notification-item.tsx',
          lineNumber: 189,
          columnNumber: 5,
        },
        this
      );
    }
    _s(NotificationItem, 'NHj+OQfaxFvE4eS5NyAdphe2w3w=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$date$2d$formatter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useDateFormatter'
        ],
      ];
    });
    _c = NotificationItem;
    var _c;
    __turbopack_context__.k.register(_c, 'NotificationItem');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/notifications-api.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    /**
     * 알림 API 클라이언트
     *
     * SSOT: API_ENDPOINTS.NOTIFICATIONS 사용
     */ const notificationsApi = {
      /**
       * 내 알림 목록 조회
       */ async list(params) {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.set('category', params.category);
        if (params?.isRead !== undefined) queryParams.set('isRead', String(params.isRead));
        if (params?.search) queryParams.set('search', params.search);
        if (params?.page) queryParams.set('page', String(params.page));
        if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));
        const qs = queryParams.toString();
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['API_ENDPOINTS'].NOTIFICATIONS.LIST}${qs ? `?${qs}` : ''}`;
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(url);
        return response.data?.data ?? response.data;
      },
      /**
       * 미읽음 알림 개수 조회
       */ async getUnreadCount() {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NOTIFICATIONS.UNREAD_COUNT
          );
        return response.data?.data ?? response.data;
      },
      /**
       * 알림 읽음 표시
       */ async markAsRead(id) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].patch(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].NOTIFICATIONS.MARK_READ(id)
        );
      },
      /**
       * 모든 알림 읽음 표시
       */ async markAllAsRead() {
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].patch(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].NOTIFICATIONS.MARK_ALL_READ
        );
      },
      /**
       * 알림 삭제
       */ async remove(id) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'apiClient'
        ].delete(
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_ENDPOINTS'
          ].NOTIFICATIONS.DELETE(id)
        );
      },
      /**
       * 알림 설정 조회
       */ async getPreferences() {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].get(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NOTIFICATIONS.SETTINGS
          );
        return response.data?.data ?? response.data;
      },
      /**
       * 알림 설정 업데이트
       */ async updatePreferences(prefs) {
        const response =
          await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'apiClient'
          ].patch(
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'API_ENDPOINTS'
            ].NOTIFICATIONS.SETTINGS,
            prefs
          );
        return response.data?.data ?? response.data;
      },
    };
    const __TURBOPACK__default__export__ = notificationsApi;
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-notifications.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'useDeleteNotification',
      () => useDeleteNotification,
      'useMarkAllAsRead',
      () => useMarkAllAsRead,
      'useMarkAsRead',
      () => useMarkAsRead,
      'useNotificationList',
      () => useNotificationList,
      'useNotificationPreferences',
      () => useNotificationPreferences,
      'useUnreadCount',
      () => useUnreadCount,
      'useUpdateNotificationPreferences',
      () => useUpdateNotificationPreferences,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/notifications-api.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature(),
      _s2 = __turbopack_context__.k.signature(),
      _s3 = __turbopack_context__.k.signature(),
      _s4 = __turbopack_context__.k.signature(),
      _s5 = __turbopack_context__.k.signature(),
      _s6 = __turbopack_context__.k.signature();
    ('use client');
    function useUnreadCount() {
      _s();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].notifications.unreadCount(),
        queryFn: {
          'useUnreadCount.useQuery': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getUnreadCount(),
        }['useUnreadCount.useQuery'],
        ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'QUERY_CONFIG'
        ].NOTIFICATIONS,
        select: {
          'useUnreadCount.useQuery': (data) => data.count,
        }['useUnreadCount.useQuery'],
      });
    }
    _s(useUnreadCount, '4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
      ];
    });
    function useNotificationList(params) {
      _s1();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].notifications.list(params),
        queryFn: {
          'useNotificationList.useQuery': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].list(params),
        }['useNotificationList.useQuery'],
        ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'QUERY_CONFIG'
        ].NOTIFICATIONS,
      });
    }
    _s1(useNotificationList, '4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
      ];
    });
    function useMarkAsRead() {
      _s2();
      const queryClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQueryClient'
      ])();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMutation'
      ])({
        mutationFn: {
          'useMarkAsRead.useMutation': (id) =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].markAsRead(id),
        }['useMarkAsRead.useMutation'],
        onSettled: {
          'useMarkAsRead.useMutation': () => {
            // SSOT: onSettled에서 캐시 무효화 (항상 실행)
            queryClient.invalidateQueries({
              queryKey:
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'queryKeys'
                ].notifications.all,
            });
          },
        }['useMarkAsRead.useMutation'],
      });
    }
    _s2(useMarkAsRead, 'YK0wzM21ECnncaq5SECwU+/SVdQ=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQueryClient'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMutation'
        ],
      ];
    });
    function useMarkAllAsRead() {
      _s3();
      const queryClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQueryClient'
      ])();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMutation'
      ])({
        mutationFn: {
          'useMarkAllAsRead.useMutation': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].markAllAsRead(),
        }['useMarkAllAsRead.useMutation'],
        onSuccess: {
          'useMarkAllAsRead.useMutation': () => {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'toast'
            ].success('모든 알림을 읽음으로 표시했습니다.');
          },
        }['useMarkAllAsRead.useMutation'],
        onSettled: {
          'useMarkAllAsRead.useMutation': () => {
            queryClient.invalidateQueries({
              queryKey:
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'queryKeys'
                ].notifications.all,
            });
          },
        }['useMarkAllAsRead.useMutation'],
      });
    }
    _s3(useMarkAllAsRead, 'YK0wzM21ECnncaq5SECwU+/SVdQ=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQueryClient'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMutation'
        ],
      ];
    });
    function useDeleteNotification() {
      _s4();
      const queryClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQueryClient'
      ])();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMutation'
      ])({
        mutationFn: {
          'useDeleteNotification.useMutation': (id) =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].remove(id),
        }['useDeleteNotification.useMutation'],
        onSuccess: {
          'useDeleteNotification.useMutation': () => {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'toast'
            ].success('알림이 삭제되었습니다.');
          },
        }['useDeleteNotification.useMutation'],
        onSettled: {
          'useDeleteNotification.useMutation': () => {
            queryClient.invalidateQueries({
              queryKey:
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'queryKeys'
                ].notifications.all,
            });
          },
        }['useDeleteNotification.useMutation'],
      });
    }
    _s4(useDeleteNotification, 'YK0wzM21ECnncaq5SECwU+/SVdQ=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQueryClient'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMutation'
        ],
      ];
    });
    function useNotificationPreferences() {
      _s5();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].notifications.preferences(),
        queryFn: {
          'useNotificationPreferences.useQuery': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].getPreferences(),
        }['useNotificationPreferences.useQuery'],
        staleTime:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CACHE_TIMES'
          ].LONG,
      });
    }
    _s5(useNotificationPreferences, '4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
      ];
    });
    function useUpdateNotificationPreferences() {
      _s6();
      const queryClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQueryClient'
      ])();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMutation'
      ])({
        mutationFn: {
          'useUpdateNotificationPreferences.useMutation': (prefs) =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$notifications$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].updatePreferences(prefs),
        }['useUpdateNotificationPreferences.useMutation'],
        onSettled: {
          'useUpdateNotificationPreferences.useMutation': () => {
            queryClient.invalidateQueries({
              queryKey:
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'queryKeys'
                ].notifications.preferences(),
            });
          },
        }['useUpdateNotificationPreferences.useMutation'],
      });
    }
    _s6(useUpdateNotificationPreferences, 'YK0wzM21ECnncaq5SECwU+/SVdQ=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQueryClient'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMutation'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['NotificationsDropdown', () => NotificationsDropdown]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dropdown-menu.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/badge.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$notifications$2f$notification$2d$item$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/notifications/notification-item.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-notifications.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/frontend-routes.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/header.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/notification.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function NotificationsDropdown() {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const { data: unreadCount = 0 } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useUnreadCount'
      ])();
      const { data: notificationData, isLoading } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useNotificationList'
      ])({
        pageSize: 5,
      });
      const markAsReadMutation = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMarkAsRead'
      ])();
      const markAllAsReadMutation = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMarkAllAsRead'
      ])();
      const notifications = notificationData?.items ?? [];
      const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
      };
      const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
      };
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'DropdownMenu'
        ],
        {
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'DropdownMenuTrigger'
              ],
              {
                asChild: true,
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Button'
                  ],
                  {
                    variant: 'ghost',
                    size: 'sm',
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'relative',
                      (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getHeaderButtonClasses'
                      ])()
                    ),
                    'aria-label': t('layout.notificationsLabel'),
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__[
                          'Bell'
                        ],
                        {
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'getHeaderSizeClasses'
                          ])('icon'),
                          'aria-hidden': 'true',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                          lineNumber: 77,
                          columnNumber: 11,
                        },
                        this
                      ),
                      unreadCount > 0 &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Badge'
                          ],
                          {
                            variant: 'destructive',
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              'absolute px-1 text-xs tabular-nums',
                              (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'getHeaderSizeClasses'
                              ])('badge'),
                              (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'getNotificationBadgePositionClass'
                              ])(),
                              (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'getNotificationBadgeClasses'
                              ])(unreadCount)
                            ),
                            children: unreadCount > 9 ? '9+' : unreadCount,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                            lineNumber: 79,
                            columnNumber: 13,
                          },
                          this
                        ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName:
                      '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                    lineNumber: 71,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName:
                  '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                lineNumber: 70,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'DropdownMenuContent'
              ],
              {
                align: 'end',
                className: 'w-80',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuLabel'
                    ],
                    {
                      className: 'flex justify-between items-center',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            children: t('layout.notificationsLabel'),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                            lineNumber: 95,
                            columnNumber: 11,
                          },
                          this
                        ),
                        unreadCount > 0 &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'Button'
                            ],
                            {
                              variant: 'ghost',
                              size: 'sm',
                              className: 'h-6 text-xs',
                              onClick: handleMarkAllAsRead,
                              disabled: markAllAsReadMutation.isPending,
                              children: t('layout.markAllRead'),
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                              lineNumber: 97,
                              columnNumber: 13,
                            },
                            this
                          ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                      lineNumber: 94,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuSeparator'
                    ],
                    {},
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                      lineNumber: 108,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuGroup'
                    ],
                    {
                      className: 'overflow-y-auto max-h-[60vh] min-h-[100px]',
                      children: isLoading
                        ? /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'div',
                            {
                              className: 'p-4 space-y-3',
                              children: Array.from({
                                length: 3,
                              }).map((_, i) =>
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'div',
                                  {
                                    className: 'h-16 rounded bg-muted/50 motion-safe:animate-pulse',
                                    style: {
                                      animationDelay: `${i * 100}ms`,
                                    },
                                  },
                                  i,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                    lineNumber: 113,
                                    columnNumber: 17,
                                  },
                                  this
                                )
                              ),
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                              lineNumber: 111,
                              columnNumber: 13,
                            },
                            this
                          )
                        : notifications.length === 0
                          ? /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                className: 'py-8 text-center',
                                children: [
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'div',
                                    {
                                      className:
                                        'relative inline-block mb-3 motion-safe:animate-gentle-bounce',
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__[
                                            'Bell'
                                          ],
                                          {
                                            className: (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                              'cn'
                                            ])(
                                              'mx-auto',
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'NOTIFICATION_EMPTY_STATE'
                                              ].icon.size,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'NOTIFICATION_EMPTY_STATE'
                                              ].icon.color
                                            ),
                                            'aria-hidden': 'true',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                            lineNumber: 123,
                                            columnNumber: 17,
                                          },
                                          this
                                        ),
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          'div',
                                          {
                                            className: (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                              'cn'
                                            ])(
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'NOTIFICATION_EMPTY_STATE'
                                              ].checkmark.size,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'NOTIFICATION_EMPTY_STATE'
                                              ].checkmark.position,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'NOTIFICATION_EMPTY_STATE'
                                              ].checkmark.background,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'NOTIFICATION_EMPTY_STATE'
                                              ].checkmark.shape,
                                              'flex items-center justify-center motion-safe:animate-checkmark-pop shadow-lg'
                                            ),
                                            children: /*#__PURE__*/ (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'jsxDEV'
                                            ])(
                                              'span',
                                              {
                                                className:
                                                  'text-xs text-success-foreground font-bold',
                                                children: '✓',
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                                lineNumber: 140,
                                                columnNumber: 19,
                                              },
                                              this
                                            ),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                            lineNumber: 131,
                                            columnNumber: 17,
                                          },
                                          this
                                        ),
                                      ],
                                    },
                                    void 0,
                                    true,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                      lineNumber: 122,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'p',
                                    {
                                      className: 'text-sm text-muted-foreground',
                                      children: t('layout.noNewNotifications'),
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                      lineNumber: 143,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                ],
                              },
                              void 0,
                              true,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                lineNumber: 121,
                                columnNumber: 13,
                              },
                              this
                            )
                          : /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                className: 'p-2',
                                children: notifications.map((notification, index) =>
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'div',
                                    {
                                      className:
                                        'motion-safe:animate-[staggerFadeIn_0.2s_ease-out_forwards]',
                                      style: (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$notification$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'getNotificationItemAnimation'
                                      ])(index),
                                      children: /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$notifications$2f$notification$2d$item$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'NotificationItem'
                                        ],
                                        {
                                          notification: notification,
                                          onMarkAsRead: handleMarkAsRead,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                          lineNumber: 153,
                                          columnNumber: 19,
                                        },
                                        this
                                      ),
                                    },
                                    notification.id,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                      lineNumber: 148,
                                      columnNumber: 17,
                                    },
                                    this
                                  )
                                ),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                                lineNumber: 146,
                                columnNumber: 13,
                              },
                              this
                            ),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                      lineNumber: 109,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuSeparator'
                    ],
                    {},
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                      lineNumber: 159,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DropdownMenuItem'
                    ],
                    {
                      asChild: true,
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'default'
                        ],
                        {
                          href: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'FRONTEND_ROUTES'
                          ].NOTIFICATIONS.LIST,
                          className: 'justify-center text-xs text-muted-foreground',
                          children: t('layout.viewAllNotifications'),
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                          lineNumber: 161,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                      lineNumber: 160,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName:
                  '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
                lineNumber: 93,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx',
          lineNumber: 69,
          columnNumber: 5,
        },
        this
      );
    }
    _s(NotificationsDropdown, '+1uos/uanW6jU5q2jofL5iI9aGc=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useUnreadCount'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useNotificationList'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMarkAsRead'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMarkAllAsRead'
        ],
      ];
    });
    _c = NotificationsDropdown;
    var _c;
    __turbopack_context__.k.register(_c, 'NotificationsDropdown');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/dialog.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Dialog',
      () => Dialog,
      'DialogClose',
      () => DialogClose,
      'DialogContent',
      () => DialogContent,
      'DialogDescription',
      () => DialogDescription,
      'DialogFooter',
      () => DialogFooter,
      'DialogHeader',
      () => DialogHeader,
      'DialogOverlay',
      () => DialogOverlay,
      'DialogPortal',
      () => DialogPortal,
      'DialogTitle',
      () => DialogTitle,
      'DialogTrigger',
      () => DialogTrigger,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const Dialog =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ];
    const DialogTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Trigger'
      ];
    const DialogPortal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Portal'
      ];
    const DialogClose =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Close'
      ];
    const DialogOverlay =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](({ className, ...props }, ref) =>
        /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Overlay'
          ],
          {
            ref: ref,
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'cn'
            ])(
              'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              className
            ),
            ...props,
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
            lineNumber: 21,
            columnNumber: 3,
          },
          ('TURBOPACK compile-time value', void 0)
        )
      );
    _c = DialogOverlay;
    DialogOverlay.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Overlay'
      ].displayName;
    /**
     * DialogContent component following shadcn/ui pattern.
     *
     * Note: Radix UI v1.1+ shows a dev-mode warning about DialogTitle being required.
     * This is expected when using the shadcn/ui pattern where DialogTitle is wrapped
     * inside DialogHeader. All our dialogs properly include DialogTitle components,
     * so this warning can be safely ignored. The structure is still fully accessible.
     *
     * Typical usage:
     * <DialogContent>
     *   <DialogHeader>
     *     <DialogTitle>Title</DialogTitle>
     *   </DialogHeader>
     *   {content}
     * </DialogContent>
     */ const DialogContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c1 = ({ className, children, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            DialogPortal,
            {
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  DialogOverlay,
                  {},
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
                    lineNumber: 53,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Content'
                  ],
                  {
                    ref: ref,
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                      className
                    ),
                    ...props,
                    children: [
                      children,
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Close'
                        ],
                        {
                          className:
                            'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background motion-safe:transition-[opacity] motion-safe:duration-150 motion-reduce:transition-none hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__[
                                'X'
                              ],
                              {
                                className: 'h-4 w-4',
                              },
                              void 0,
                              false,
                              {
                                fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
                                lineNumber: 64,
                                columnNumber: 9,
                              },
                              ('TURBOPACK compile-time value', void 0)
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: 'sr-only',
                                children: 'Close',
                              },
                              void 0,
                              false,
                              {
                                fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
                                lineNumber: 65,
                                columnNumber: 9,
                              },
                              ('TURBOPACK compile-time value', void 0)
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
                          lineNumber: 63,
                          columnNumber: 7,
                        },
                        ('TURBOPACK compile-time value', void 0)
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
                    lineNumber: 54,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
              lineNumber: 52,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c2 = DialogContent;
    DialogContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Content'
      ].displayName;
    const DialogHeader = ({ className, ...props }) =>
      /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex flex-col space-y-1.5 text-center sm:text-left', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
          lineNumber: 73,
          columnNumber: 3,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    _c3 = DialogHeader;
    DialogHeader.displayName = 'DialogHeader';
    const DialogFooter = ({ className, ...props }) =>
      /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
          lineNumber: 78,
          columnNumber: 3,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    _c4 = DialogFooter;
    DialogFooter.displayName = 'DialogFooter';
    const DialogTitle =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c5 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Title'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-lg font-semibold leading-none tracking-tight', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
              lineNumber: 89,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c6 = DialogTitle;
    DialogTitle.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Title'
      ].displayName;
    const DialogDescription =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c7 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Description'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-sm text-muted-foreground', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/dialog.tsx',
              lineNumber: 101,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c8 = DialogDescription;
    DialogDescription.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Description'
      ].displayName;
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
    __turbopack_context__.k.register(_c, 'DialogOverlay');
    __turbopack_context__.k.register(_c1, 'DialogContent$React.forwardRef');
    __turbopack_context__.k.register(_c2, 'DialogContent');
    __turbopack_context__.k.register(_c3, 'DialogHeader');
    __turbopack_context__.k.register(_c4, 'DialogFooter');
    __turbopack_context__.k.register(_c5, 'DialogTitle$React.forwardRef');
    __turbopack_context__.k.register(_c6, 'DialogTitle');
    __turbopack_context__.k.register(_c7, 'DialogDescription$React.forwardRef');
    __turbopack_context__.k.register(_c8, 'DialogDescription');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'GlobalSearchDialog',
      () => GlobalSearchDialog,
      'saveRecentPage',
      () => saveRecentPage,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    /**
     * GlobalSearchDialog
     *
     * ⌘K / Ctrl+K 전역 검색 다이얼로그
     * - 메뉴 탐색: nav-config.ts NAV_SECTIONS 기반 (i18n 라벨 검색)
     * - 최근 페이지: localStorage 기반 최근 5개
     * - 키보드 내비게이션: ↑↓ 이동, Enter 선택, Escape 닫기
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/layout-grid.js [app-client] (ecmascript) <export default as LayoutGrid>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    const RECENT_PAGES_KEY = 'recent-pages';
    const MAX_RECENT = 5;
    function getRecentPages() {
      if (
        ('TURBOPACK compile-time falsy', 0) //TURBOPACK unreachable
      );
      try {
        const stored = localStorage.getItem(RECENT_PAGES_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    function saveRecentPage(href, label) {
      if (
        ('TURBOPACK compile-time falsy', 0) //TURBOPACK unreachable
      );
      try {
        const pages = getRecentPages().filter((p) => p.href !== href);
        pages.unshift({
          href,
          label,
        });
        localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(pages.slice(0, MAX_RECENT)));
      } catch {
        // storage 오류 무시
      }
    }
    function GlobalSearchDialog({ open, onOpenChange, filteredSections }) {
      _s();
      const [query, setQuery] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])('');
      const [selectedIndex, setSelectedIndex] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(0);
      const router = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRouter'
      ])();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const inputRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(null);
      // 다이얼로그 열릴 때 입력창 포커스, 상태 초기화
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'GlobalSearchDialog.useEffect': () => {
            if (open) {
              setQuery('');
              setSelectedIndex(0);
              requestAnimationFrame(
                {
                  'GlobalSearchDialog.useEffect': () => inputRef.current?.focus(),
                }['GlobalSearchDialog.useEffect']
              );
            }
          },
        }['GlobalSearchDialog.useEffect'],
        [open]
      );
      // 메뉴 검색 — filteredSections (Permission 필터링 적용됨)
      const menuResults = filteredSections
        .flatMap((section) =>
          section.items.map((item) => ({
            href: item.href,
            label: item.label,
            type: 'menu',
            icon: item.icon,
          }))
        )
        .filter((item) => (query ? item.label.toLowerCase().includes(query.toLowerCase()) : true));
      // 최근 페이지
      const recentResults = getRecentPages()
        .filter((p) => (query ? p.label.toLowerCase().includes(query.toLowerCase()) : true))
        .map((p) => ({
          href: p.href,
          label: p.label,
          type: 'recent',
        }));
      // 전체 결과: query 없을 때 최근 > 메뉴, query 있을 때 메뉴 > 최근
      const allResults = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'GlobalSearchDialog.useMemo[allResults]': () =>
            query ? [...menuResults, ...recentResults] : [...recentResults, ...menuResults],
        }['GlobalSearchDialog.useMemo[allResults]'],
        [query, menuResults, recentResults]
      );
      const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, allResults.length - 1));
      const handleSelect = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'GlobalSearchDialog.useCallback[handleSelect]': (result) => {
            saveRecentPage(result.href, result.label);
            router.push(result.href);
            onOpenChange(false);
          },
        }['GlobalSearchDialog.useCallback[handleSelect]'],
        [router, onOpenChange]
      );
      const handleKeyDown = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'GlobalSearchDialog.useCallback[handleKeyDown]': (e) => {
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(
                  {
                    'GlobalSearchDialog.useCallback[handleKeyDown]': (i) =>
                      Math.min(i + 1, allResults.length - 1),
                  }['GlobalSearchDialog.useCallback[handleKeyDown]']
                );
                break;
              case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(
                  {
                    'GlobalSearchDialog.useCallback[handleKeyDown]': (i) => Math.max(i - 1, 0),
                  }['GlobalSearchDialog.useCallback[handleKeyDown]']
                );
                break;
              case 'Enter':
                if (allResults[safeSelectedIndex]) {
                  handleSelect(allResults[safeSelectedIndex]);
                }
                break;
              case 'Escape':
                onOpenChange(false);
                break;
            }
          },
        }['GlobalSearchDialog.useCallback[handleKeyDown]'],
        [allResults, safeSelectedIndex, handleSelect, onOpenChange]
      );
      const showRecentSection = !query && recentResults.length > 0;
      const showMenuSection = menuResults.length > 0;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Dialog'
        ],
        {
          open: open,
          onOpenChange: onOpenChange,
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'DialogContent'
            ],
            {
              className: 'p-0 gap-0 max-w-md overflow-hidden',
              onKeyDown: handleKeyDown,
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'DialogHeader'
                  ],
                  {
                    className: 'sr-only',
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'DialogTitle'
                      ],
                      {
                        children: t('layout.search'),
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                        lineNumber: 150,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                    lineNumber: 149,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: 'flex items-center gap-2 border-b px-3 py-2',
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__[
                          'Search'
                        ],
                        {
                          className: 'h-4 w-4 text-muted-foreground shrink-0',
                          'aria-hidden': 'true',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                          lineNumber: 155,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'input',
                        {
                          ref: inputRef,
                          type: 'text',
                          value: query,
                          onChange: (e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                          },
                          placeholder: t('layout.searchPlaceholder'),
                          className:
                            'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground',
                          'aria-label': t('layout.search'),
                          role: 'combobox',
                          'aria-expanded': allResults.length > 0,
                          'aria-haspopup': 'listbox',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                          lineNumber: 156,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                    lineNumber: 154,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: 'max-h-[320px] overflow-y-auto p-1',
                    role: 'listbox',
                    children: [
                      allResults.length === 0 &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'p',
                          {
                            className: 'text-sm text-muted-foreground text-center py-6',
                            children: t('layout.noResults'),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                            lineNumber: 176,
                            columnNumber: 13,
                          },
                          this
                        ),
                      showRecentSection &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'p',
                                {
                                  className:
                                    'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5',
                                  children: t('layout.recentPages'),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                                  lineNumber: 184,
                                  columnNumber: 15,
                                },
                                this
                              ),
                              recentResults.map((result, idx) =>
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  SearchResultItem,
                                  {
                                    result: result,
                                    isSelected: idx === safeSelectedIndex,
                                    onClick: () => handleSelect(result),
                                  },
                                  `${result.href}-recent`,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                                    lineNumber: 188,
                                    columnNumber: 17,
                                  },
                                  this
                                )
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                            lineNumber: 183,
                            columnNumber: 13,
                          },
                          this
                        ),
                      showMenuSection &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'p',
                                {
                                  className:
                                    'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5',
                                  children: t('layout.menus'),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                                  lineNumber: 201,
                                  columnNumber: 15,
                                },
                                this
                              ),
                              menuResults.map((result, idx) => {
                                const globalIdx = showRecentSection
                                  ? recentResults.length + idx
                                  : idx;
                                return /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  SearchResultItem,
                                  {
                                    result: result,
                                    isSelected: globalIdx === safeSelectedIndex,
                                    onClick: () => handleSelect(result),
                                  },
                                  `${result.href}-menu`,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                                    lineNumber: 207,
                                    columnNumber: 19,
                                  },
                                  this
                                );
                              }),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                            lineNumber: 200,
                            columnNumber: 13,
                          },
                          this
                        ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                    lineNumber: 174,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
              lineNumber: 148,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
          lineNumber: 147,
          columnNumber: 5,
        },
        this
      );
    }
    _s(GlobalSearchDialog, 'fxmg5CT5H5FLwZAW02um4pRX288=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRouter'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = GlobalSearchDialog;
    function SearchResultItem({ result, isSelected, onClick }) {
      // 메뉴 아이템: 실제 메뉴 아이콘 표시 / 최근 페이지: Clock / fallback: LayoutGrid
      const Icon =
        result.type === 'recent'
          ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__[
              'Clock'
            ]
          : (result.icon ??
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__[
              'LayoutGrid'
            ]);
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'button',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(
            'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left',
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TRANSITION_PRESETS'
            ].fastColor,
            isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'
          ),
          onClick: onClick,
          role: 'option',
          'aria-selected': isSelected,
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              Icon,
              {
                className: 'h-4 w-4 text-muted-foreground shrink-0',
                'aria-hidden': 'true',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                lineNumber: 245,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'span',
              {
                className: 'truncate',
                children: result.label,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
                lineNumber: 246,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx',
          lineNumber: 235,
          columnNumber: 5,
        },
        this
      );
    }
    _c1 = SearchResultItem;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'GlobalSearchDialog');
    __turbopack_context__.k.register(_c1, 'SearchResultItem');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['GlobalSearchTrigger', () => GlobalSearchTrigger]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    /**
     * GlobalSearchTrigger
     *
     * 데스크톱 헤더용 검색 트리거 버튼 (hidden md:flex)
     * - 클릭 또는 ⌘K/Ctrl+K로 GlobalSearchDialog 열기
     * - 모바일에서 숨김 — MobileNav가 공간을 차지
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$GlobalSearchDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function GlobalSearchTrigger({ filteredSections }) {
      _s();
      const [open, setOpen] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      // ⌘K / Ctrl+K 글로벌 단축키
      const handleKeyDown = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'GlobalSearchTrigger.useCallback[handleKeyDown]': (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
              e.preventDefault();
              setOpen(true);
            }
          },
        }['GlobalSearchTrigger.useCallback[handleKeyDown]'],
        []
      );
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'GlobalSearchTrigger.useEffect': () => {
            window.addEventListener('keydown', handleKeyDown);
            return {
              'GlobalSearchTrigger.useEffect': () =>
                window.removeEventListener('keydown', handleKeyDown),
            }['GlobalSearchTrigger.useEffect'];
          },
        }['GlobalSearchTrigger.useEffect'],
        [handleKeyDown]
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'button',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])(
                  'hidden md:flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5',
                  'text-sm text-muted-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'TRANSITION_PRESETS'
                  ].fastColor,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'FOCUS_TOKENS'
                  ].classes.brand,
                  'min-w-[160px]'
                ),
                onClick: () => setOpen(true),
                'aria-label': t('layout.search'),
                'aria-haspopup': 'dialog',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__[
                      'Search'
                    ],
                    {
                      className: 'h-3.5 w-3.5 shrink-0',
                      'aria-hidden': 'true',
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx',
                      lineNumber: 55,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'span',
                    {
                      className: 'flex-1 text-left truncate',
                      children: t('layout.searchPlaceholder'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx',
                      lineNumber: 56,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'kbd',
                    {
                      className:
                        'ml-auto text-xs text-muted-foreground/70 font-sans pointer-events-none',
                      children: t('layout.searchShortcut'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx',
                      lineNumber: 57,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx',
                lineNumber: 42,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$GlobalSearchDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'GlobalSearchDialog'
              ],
              {
                open: open,
                onOpenChange: setOpen,
                filteredSections: filteredSections,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx',
                lineNumber: 62,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true
      );
    }
    _s(GlobalSearchTrigger, 'drKhfwy+NrS0rf99b5GtWuLouYc=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = GlobalSearchTrigger;
    var _c;
    __turbopack_context__.k.register(_c, 'GlobalSearchTrigger');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/components/sidebar.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'SIDEBAR_COLORS',
      () => SIDEBAR_COLORS,
      'SIDEBAR_ITEM_TOKENS',
      () => SIDEBAR_ITEM_TOKENS,
      'SIDEBAR_LAYOUT',
      () => SIDEBAR_LAYOUT,
      'SIDEBAR_SECTION_TOKENS',
      () => SIDEBAR_SECTION_TOKENS,
      'getSidebarItemClasses',
      () => getSidebarItemClasses,
      'getSidebarMarginClasses',
      () => getSidebarMarginClasses,
      'getSidebarWidthClasses',
      () => getSidebarWidthClasses,
    ]);
    /**
     * Sidebar Component Tokens (Layer 3: Component-Specific)
     *
     * header.ts 패턴을 따라 Layer 2 → Layer 3 참조 구조
     * SSOT: 사이드바의 모든 스타일은 여기서만 정의
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/primitives.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    const SIDEBAR_LAYOUT = {
      expanded: {
        width: 'w-56',
        marginLeft: 'md:ml-56',
      },
      collapsed: {
        width: 'w-[52px]',
        marginLeft: 'md:ml-[52px]',
      },
      mobile: {
        width: 'w-72',
      },
      headerHeight: 'h-14',
      /** width/margin-left transition (prefers-reduced-motion 지원) */ transition:
        'motion-safe:transition-[width,margin-left] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
    };
    const SIDEBAR_COLORS = {
      background: 'bg-ul-midnight',
      border: 'border-white/10',
      brandPrimary: 'text-ul-red',
      brandSecondary: 'text-white/40',
    };
    /**
     * 아이콘 크기 — INTERACTIVE_TOKENS.icon.standard 기반 (반응형)
     */ const _iconH = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'toTailwindSize'
    ])(
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'INTERACTIVE_TOKENS'
      ].icon.standard,
      'h'
    );
    const _iconW = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'toTailwindSize'
    ])(
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'INTERACTIVE_TOKENS'
      ].icon.standard,
      'w'
    );
    const SIDEBAR_ITEM_TOKENS = {
      active: {
        base: 'text-white bg-white/15 font-medium',
        /** border-l-[3px] 보상: px-3(12px) - 3px = 9px */ indicator:
          'border-l-[3px] border-white pl-[9px]',
      },
      inactive: {
        base: 'text-white/70 hover:text-white hover:bg-white/10',
        indicator: 'border-l-[3px] border-transparent',
      },
      /** 아이콘 크기 — 렌더링 시 적용 */ iconSize: `${_iconH} ${_iconW}`,
      badge: {
        background: 'bg-ul-red',
        text: 'text-white',
      },
      /** prefers-reduced-motion 지원 transition */ transition:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastBgColor,
      /** 포커스 (어두운 배경) */ focus:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'FOCUS_TOKENS'
        ].classes.onDark,
    };
    const SIDEBAR_SECTION_TOKENS = {
      label: 'text-[11px] font-semibold text-white/40 uppercase tracking-wider',
      spacing: 'px-3 pt-4 pb-1',
      /** 첫 번째 섹션은 상단 패딩 없음 */ firstSpacing: 'px-3 pb-1',
      divider: 'border-t border-white/10 mt-2',
    };
    function getSidebarItemClasses(isActive, isCollapsed = false) {
      const stateBase = isActive
        ? SIDEBAR_ITEM_TOKENS.active.base
        : SIDEBAR_ITEM_TOKENS.inactive.base;
      if (isCollapsed) {
        const collapsedIndicator = isActive
          ? 'border-l-[3px] border-white'
          : 'border-l-[3px] border-transparent';
        return [
          'flex items-center justify-center rounded-lg py-2 relative w-full',
          stateBase,
          collapsedIndicator,
          SIDEBAR_ITEM_TOKENS.transition,
          SIDEBAR_ITEM_TOKENS.focus,
        ].join(' ');
      }
      const indicator = isActive
        ? SIDEBAR_ITEM_TOKENS.active.indicator
        : SIDEBAR_ITEM_TOKENS.inactive.indicator;
      return [
        'flex items-center gap-3 rounded-lg px-3 py-2 relative',
        stateBase,
        indicator,
        SIDEBAR_ITEM_TOKENS.transition,
        SIDEBAR_ITEM_TOKENS.focus,
      ].join(' ');
    }
    function getSidebarWidthClasses(isCollapsed) {
      return isCollapsed ? SIDEBAR_LAYOUT.collapsed.width : SIDEBAR_LAYOUT.expanded.width;
    }
    function getSidebarMarginClasses(isCollapsed) {
      return isCollapsed ? SIDEBAR_LAYOUT.collapsed.marginLeft : SIDEBAR_LAYOUT.expanded.marginLeft;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-sidebar-state.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useSidebarState', () => useSidebarState]);
    /**
     * Sidebar State Hook
     *
     * localStorage 기반 사이드바 접기/펼치기 상태 관리
     * - SSR 안전: 초기값 false, useEffect에서 localStorage 읽기
     * - 태블릿 기본값: 768–1024px에서 collapsed 기본 (이슈 #15)
     * - 키보드 단축키: Ctrl+B (VS Code 패턴)
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    const STORAGE_KEY = 'sidebar-collapsed';
    /** 태블릿 환경 감지 (768–1024px) — SSR 안전 */ function isTablet() {
      if (
        ('TURBOPACK compile-time falsy', 0) //TURBOPACK unreachable
      );
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    function useSidebarState() {
      _s();
      const [isCollapsed, setIsCollapsed] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      // SSR 이후 localStorage에서 상태 복원
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'useSidebarState.useEffect': () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
              setIsCollapsed(stored === 'true');
            } else if (isTablet()) {
              // 태블릿: 초기값 collapsed
              setIsCollapsed(true);
            }
          },
        }['useSidebarState.useEffect'],
        []
      );
      const toggle = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useSidebarState.useCallback[toggle]': () => {
            setIsCollapsed(
              {
                'useSidebarState.useCallback[toggle]': (prev) => {
                  const next = !prev;
                  localStorage.setItem(STORAGE_KEY, String(next));
                  return next;
                },
              }['useSidebarState.useCallback[toggle]']
            );
          },
        }['useSidebarState.useCallback[toggle]'],
        []
      );
      const expand = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useSidebarState.useCallback[expand]': () => {
            setIsCollapsed(false);
            localStorage.setItem(STORAGE_KEY, 'false');
          },
        }['useSidebarState.useCallback[expand]'],
        []
      );
      const collapse = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useSidebarState.useCallback[collapse]': () => {
            setIsCollapsed(true);
            localStorage.setItem(STORAGE_KEY, 'true');
          },
        }['useSidebarState.useCallback[collapse]'],
        []
      );
      // Ctrl+B / ⌘+B 키보드 단축키
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'useSidebarState.useEffect': () => {
            const handleKeyDown = {
              'useSidebarState.useEffect.handleKeyDown': (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                  e.preventDefault();
                  toggle();
                }
              },
            }['useSidebarState.useEffect.handleKeyDown'];
            window.addEventListener('keydown', handleKeyDown);
            return {
              'useSidebarState.useEffect': () =>
                window.removeEventListener('keydown', handleKeyDown),
            }['useSidebarState.useEffect'];
          },
        }['useSidebarState.useEffect'],
        [toggle]
      );
      return {
        isCollapsed,
        toggle,
        expand,
        collapse,
      };
    }
    _s(useSidebarState, 'olWxklgGlz0gy34Jl/jOSTAejB0=');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/DashboardShell.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'DashboardShell',
      () => DashboardShell,
      'DashboardShellSkeleton',
      () => DashboardShellSkeleton,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    /**
     * Dashboard Shell (Client Component)
     *
     * 대시보드 레이아웃 UI 컴포넌트
     * - 사이드바: 섹션 그룹핑 + 접기/펼치기 (Phase 1-3)
     * - 헤더: 글로벌 검색 트리거 (Phase 4)
     * - 모바일: MobileNav 드로어
     *
     * 성능 최적화 (vercel-react-best-practices):
     * - SidebarItem: memo로 불필요한 리렌더 방지
     * - filteredSections: useMemo로 의존성 변경 시만 재계산
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/wrench.js [app-client] (ecmascript) <export default as Wrench>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsLeft$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevrons-left.js [app-client] (ecmascript) <export default as ChevronsLeft>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsRight$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevrons-right.js [app-client] (ecmascript) <export default as ChevronsRight>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/skeleton.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notification$2d$stream$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-notification-stream.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$MobileNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/MobileNav.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/Header.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$SkipLink$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/SkipLink.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/ThemeToggle.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$UserProfileDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/UserProfileDropdown.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$notifications$2f$notifications$2d$dropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/notifications/notifications-dropdown.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$GlobalSearchTrigger$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/GlobalSearchTrigger.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$permission$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/permission-helpers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$contexts$2f$BreadcrumbContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/contexts/BreadcrumbContext.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/header.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/sidebar.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$nav$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/navigation/nav-config.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$GlobalSearchDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/GlobalSearchDialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$sidebar$2d$state$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-sidebar-state.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature(),
      _s2 = __turbopack_context__.k.signature();
    ('use client');
    // SidebarItem을 memo로 래핑하여 불필요한 리렌더 방지 (rerender-memo)
    const SidebarItem = /*#__PURE__*/ (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'memo'
    ])(
      _s(
        function SidebarItem({ icon: Icon, href, label, isActive, badge, isCollapsed }) {
          _s();
          const t = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useTranslations'
          ])('navigation');
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ],
            {
              href: href,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getSidebarItemClasses'
                ])(!!isActive, isCollapsed)
              ),
              'aria-current': isActive ? 'page' : undefined,
              title: isCollapsed ? label : undefined,
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'span',
                  {
                    'aria-hidden': 'true',
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      Icon,
                      {
                        className:
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'SIDEBAR_ITEM_TOKENS'
                          ].iconSize,
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                        lineNumber: 85,
                        columnNumber: 9,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                    lineNumber: 84,
                    columnNumber: 7,
                  },
                  this
                ),
                !isCollapsed &&
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'span',
                    {
                      className: 'flex-1 truncate',
                      children: label,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 87,
                      columnNumber: 24,
                    },
                    this
                  ),
                !isCollapsed &&
                  badge !== undefined &&
                  badge > 0 &&
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'span',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(
                        'ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'SIDEBAR_ITEM_TOKENS'
                        ].badge.background,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'SIDEBAR_ITEM_TOKENS'
                        ].badge.text,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'ANIMATION_PRESETS'
                        ].pulse
                      ),
                      'aria-label': t('layout.notificationCount', {
                        count: badge,
                      }),
                      children: badge,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 90,
                      columnNumber: 9,
                    },
                    this
                  ),
                isCollapsed &&
                  badge !== undefined &&
                  badge > 0 &&
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'span',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(
                        'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'SIDEBAR_ITEM_TOKENS'
                        ].badge.background
                      ),
                      'aria-label': t('layout.notificationCount', {
                        count: badge,
                      }),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 104,
                      columnNumber: 9,
                    },
                    this
                  ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
              lineNumber: 78,
              columnNumber: 5,
            },
            this
          );
        },
        'h6+q2O3NJKPY5uL0BIJGLIanww8=',
        false,
        function () {
          return [
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useTranslations'
            ],
          ];
        }
      )
    );
    _c = SidebarItem;
    function DashboardShell({ children }) {
      _s1();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const pathname = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'usePathname'
      ])();
      const { data: session, status } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      const userRole = session?.user?.role;
      const { isCollapsed, toggle } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$sidebar$2d$state$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSidebarState'
      ])();
      // SSE 알림 실시간 스트림 (세션 있을 때만 자동 연결)
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notification$2d$stream$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useNotificationStream'
      ])();
      // 승인 대기 카운트 조회 (권한이 있는 경우에만)
      const { data: pendingCounts } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.counts(userRole),
        queryFn: {
          'DashboardShell.useQuery': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'approvalsApi'
            ].getPendingCounts(),
        }['DashboardShell.useQuery'],
        enabled:
          !!userRole &&
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$permission$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'hasApprovalPermissions'
          ])(userRole),
        staleTime:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CACHE_TIMES'
          ].SHORT,
        refetchInterval:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'REFETCH_INTERVALS'
          ].NEAR_REALTIME,
      });
      // SSOT: nav-config.ts에서 필터링된 섹션 조회
      // getFilteredNavSections가 useMemo 안에서만 호출되므로 참조 안정적
      const filteredSections = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'DashboardShell.useMemo[filteredSections]': () =>
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$nav$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'getFilteredNavSections'
            ])(
              userRole,
              {
                'DashboardShell.useMemo[filteredSections]': (key) => t(key),
              }['DashboardShell.useMemo[filteredSections]'],
              pendingCounts
            ),
        }['DashboardShell.useMemo[filteredSections]'],
        [userRole, pendingCounts, t]
      );
      // 페이지 방문 시 최근 페이지 자동 저장 — 검색 다이얼로그 '최근 페이지' 섹션용
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'DashboardShell.useEffect': () => {
            const activeItem = filteredSections
              .flatMap(
                {
                  'DashboardShell.useEffect.activeItem': (s) => s.items,
                }['DashboardShell.useEffect.activeItem']
              )
              .find(
                {
                  'DashboardShell.useEffect.activeItem': (item) =>
                    (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$nav$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'isNavItemActive'
                    ])(item.href, pathname),
                }['DashboardShell.useEffect.activeItem']
              );
            if (activeItem) {
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$GlobalSearchDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'saveRecentPage'
              ])(pathname, activeItem.label);
            }
          },
        }['DashboardShell.useEffect'],
        [pathname, filteredSections]
      );
      // Layer 0: 세션 복원 전까지 인증 의존 컴포넌트 미마운트
      if (status === 'loading') {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          DashboardShellSkeleton,
          {},
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
            lineNumber: 159,
            columnNumber: 12,
          },
          this
        );
      }
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$contexts$2f$BreadcrumbContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'BreadcrumbProvider'
        ],
        {
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'div',
            {
              className: 'flex min-h-screen bg-background',
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$SkipLink$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'SkipLink'
                  ],
                  {
                    href: '#main-content',
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                    lineNumber: 166,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'aside',
                  {
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'fixed inset-y-0 z-20 hidden md:flex md:flex-col',
                      (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getSidebarWidthClasses'
                      ])(isCollapsed),
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'SIDEBAR_COLORS'
                      ].background,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'SIDEBAR_LAYOUT'
                      ].transition
                    ),
                    'aria-label': t('layout.mainNav'),
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                            'cn'
                          ])(
                            'flex h-14 items-center border-b shrink-0',
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'SIDEBAR_COLORS'
                            ].border,
                            isCollapsed ? 'px-2 justify-between' : 'px-4'
                          ),
                          children: isCollapsed
                            ? /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Fragment'
                                ],
                                {
                                  children: [
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'default'
                                      ],
                                      {
                                        href: '/',
                                        className: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                          'cn'
                                        ])(
                                          'flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red',
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'FOCUS_TOKENS'
                                          ].classes.onDark
                                        ),
                                        'aria-label': t('layout.goHome'),
                                        children: /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__[
                                            'Wrench'
                                          ],
                                          {
                                            className: 'h-4 w-4 text-white',
                                            'aria-hidden': 'true',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 196,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 188,
                                        columnNumber: 17,
                                      },
                                      this
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'Button'
                                      ],
                                      {
                                        variant: 'ghost',
                                        size: 'icon',
                                        className: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                          'cn'
                                        ])(
                                          'h-7 w-7 text-white/50 hover:text-white hover:bg-white/10',
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'FOCUS_TOKENS'
                                          ].classes.onDark
                                        ),
                                        onClick: toggle,
                                        'aria-label': t('layout.expandSidebar'),
                                        'aria-expanded': !isCollapsed,
                                        children: /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsRight$3e$__[
                                            'ChevronsRight'
                                          ],
                                          {
                                            className: 'h-4 w-4',
                                            'aria-hidden': 'true',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 209,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 198,
                                        columnNumber: 17,
                                      },
                                      this
                                    ),
                                  ],
                                },
                                void 0,
                                true
                              )
                            : /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Fragment'
                                ],
                                {
                                  children: [
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'default'
                                      ],
                                      {
                                        href: '/',
                                        className: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                          'cn'
                                        ])(
                                          'flex items-center gap-2 font-semibold text-white group',
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'FOCUS_TOKENS'
                                          ].classes.onDark,
                                          'rounded-md hover:bg-white/10 px-2 py-1.5 -mx-2',
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'TRANSITION_PRESETS'
                                          ].fastBg
                                        ),
                                        'aria-label': t('layout.goHome'),
                                        children: [
                                          /*#__PURE__*/ (0,
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'jsxDEV'
                                          ])(
                                            'div',
                                            {
                                              className: (0,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                                'cn'
                                              ])(
                                                'flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red',
                                                'group-hover:scale-110',
                                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                  'TRANSITION_PRESETS'
                                                ].fastTransform
                                              ),
                                              children: /*#__PURE__*/ (0,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'jsxDEV'
                                              ])(
                                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__[
                                                  'Wrench'
                                                ],
                                                {
                                                  className: 'h-4 w-4 text-white',
                                                  'aria-hidden': 'true',
                                                },
                                                void 0,
                                                false,
                                                {
                                                  fileName:
                                                    '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                                  lineNumber: 231,
                                                  columnNumber: 21,
                                                },
                                                this
                                              ),
                                            },
                                            void 0,
                                            false,
                                            {
                                              fileName:
                                                '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                              lineNumber: 224,
                                              columnNumber: 19,
                                            },
                                            this
                                          ),
                                          /*#__PURE__*/ (0,
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'jsxDEV'
                                          ])(
                                            'span',
                                            {
                                              className: (0,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                                'cn'
                                              ])(
                                                'group-hover:text-ul-info',
                                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                  'TRANSITION_PRESETS'
                                                ].fastColor
                                              ),
                                              children: t('layout.systemName'),
                                            },
                                            void 0,
                                            false,
                                            {
                                              fileName:
                                                '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                              lineNumber: 233,
                                              columnNumber: 19,
                                            },
                                            this
                                          ),
                                        ],
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 214,
                                        columnNumber: 17,
                                      },
                                      this
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'Button'
                                      ],
                                      {
                                        variant: 'ghost',
                                        size: 'icon',
                                        className: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                          'cn'
                                        ])(
                                          'ml-auto h-7 w-7 text-white/50 hover:text-white hover:bg-white/10',
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'FOCUS_TOKENS'
                                          ].classes.onDark
                                        ),
                                        onClick: toggle,
                                        'aria-label': t('layout.collapseSidebar'),
                                        'aria-expanded': !isCollapsed,
                                        children: /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsLeft$3e$__[
                                            'ChevronsLeft'
                                          ],
                                          {
                                            className: 'h-4 w-4',
                                            'aria-hidden': 'true',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 248,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 237,
                                        columnNumber: 17,
                                      },
                                      this
                                    ),
                                  ],
                                },
                                void 0,
                                true
                              ),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 179,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'nav',
                        {
                          className: 'flex flex-col flex-1 overflow-y-auto p-2',
                          'aria-label': t('layout.mainNav'),
                          children: filteredSections.map((section, sectionIndex) =>
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                children: [
                                  sectionIndex > 0 &&
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      'div',
                                      {
                                        className: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                          'cn'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'SIDEBAR_SECTION_TOKENS'
                                          ].divider,
                                          isCollapsed ? 'my-1' : undefined
                                        ),
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 263,
                                        columnNumber: 19,
                                      },
                                      this
                                    ),
                                  !isCollapsed &&
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      'div',
                                      {
                                        className: (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                          'cn'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'SIDEBAR_SECTION_TOKENS'
                                          ].label,
                                          sectionIndex === 0
                                            ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'SIDEBAR_SECTION_TOKENS'
                                              ].firstSpacing
                                            : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'SIDEBAR_SECTION_TOKENS'
                                              ].spacing
                                        ),
                                        children: section.sectionLabel,
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 269,
                                        columnNumber: 19,
                                      },
                                      this
                                    ),
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'div',
                                    {
                                      className: 'flex flex-col gap-1',
                                      children: section.items.map((item) =>
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          SidebarItem,
                                          {
                                            icon: item.icon,
                                            href: item.href,
                                            label: item.label,
                                            isActive: (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$navigation$2f$nav$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'isNavItemActive'
                                            ])(item.href, pathname),
                                            badge: item.badge,
                                            isCollapsed: isCollapsed,
                                          },
                                          item.href,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 283,
                                            columnNumber: 21,
                                          },
                                          this
                                        )
                                      ),
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                      lineNumber: 281,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                ],
                              },
                              section.sectionLabel,
                              true,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 260,
                                columnNumber: 15,
                              },
                              this
                            )
                          ),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 255,
                          columnNumber: 11,
                        },
                        this
                      ),
                      !isCollapsed &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              'p-4 border-t shrink-0',
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'SIDEBAR_COLORS'
                              ].border
                            ),
                            children: /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                className: 'flex items-center gap-2',
                                children: [
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'span',
                                    {
                                      className: (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                        'cn'
                                      ])(
                                        'font-bold text-xs',
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'SIDEBAR_COLORS'
                                        ].brandPrimary
                                      ),
                                      children: 'UL Solutions',
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                      lineNumber: 302,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'span',
                                    {
                                      className: 'text-white/30 text-xs',
                                      children: '|',
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                      lineNumber: 305,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'span',
                                    {
                                      className: (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                        'cn'
                                      ])(
                                        'text-xs',
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'SIDEBAR_COLORS'
                                        ].brandSecondary
                                      ),
                                      children: 'Working for a safer world.',
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                      lineNumber: 306,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                ],
                              },
                              void 0,
                              true,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 301,
                                columnNumber: 15,
                              },
                              this
                            ),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                            lineNumber: 300,
                            columnNumber: 13,
                          },
                          this
                        ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                    lineNumber: 169,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'flex flex-col flex-1',
                      (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getSidebarMarginClasses'
                      ])(isCollapsed),
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'SIDEBAR_LAYOUT'
                      ].transition
                    ),
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Header'
                        ],
                        {
                          title: t('layout.systemName'),
                          leftContent: /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'Fragment'
                            ],
                            {
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$MobileNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'MobileNav'
                                  ],
                                  {
                                    navSections: filteredSections,
                                    brandName: t('layout.systemName'),
                                    brandIcon: /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__[
                                        'Wrench'
                                      ],
                                      {
                                        className: 'h-6 w-6',
                                        'aria-hidden': 'true',
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                        lineNumber: 330,
                                        columnNumber: 30,
                                      },
                                      void 0
                                    ),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                    lineNumber: 327,
                                    columnNumber: 17,
                                  },
                                  void 0
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$GlobalSearchTrigger$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'GlobalSearchTrigger'
                                  ],
                                  {
                                    filteredSections: filteredSections,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                    lineNumber: 332,
                                    columnNumber: 17,
                                  },
                                  void 0
                                ),
                              ],
                            },
                            void 0,
                            true
                          ),
                          rightContent: /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'div',
                            {
                              className: (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                'cn'
                              ])(
                                'flex items-center',
                                (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$header$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'getHeaderSpacingClass'
                                ])()
                              ),
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'ThemeToggle'
                                  ],
                                  {},
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                    lineNumber: 337,
                                    columnNumber: 17,
                                  },
                                  void 0
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$notifications$2f$notifications$2d$dropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'NotificationsDropdown'
                                  ],
                                  {},
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                    lineNumber: 338,
                                    columnNumber: 17,
                                  },
                                  void 0
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$UserProfileDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'UserProfileDropdown'
                                  ],
                                  {},
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                    lineNumber: 339,
                                    columnNumber: 17,
                                  },
                                  void 0
                                ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName:
                                '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                              lineNumber: 336,
                              columnNumber: 15,
                            },
                            void 0
                          ),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 323,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'main',
                        {
                          id: 'main-content',
                          className: 'flex-1 overflow-auto',
                          role: 'main',
                          tabIndex: -1,
                          children: children,
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 345,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                    lineNumber: 315,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    'aria-live': 'polite',
                    'aria-atomic': 'true',
                    className: 'sr-only',
                    id: 'live-announcements',
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                    lineNumber: 351,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
              lineNumber: 164,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
          lineNumber: 163,
          columnNumber: 5,
        },
        this
      );
    }
    _s1(DashboardShell, 'efqWrVu8KAG4jL0t1HpYzTikgQw=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'usePathname'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$sidebar$2d$state$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSidebarState'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$notification$2d$stream$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useNotificationStream'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
      ];
    });
    _c1 = DashboardShell;
    function DashboardShellSkeleton() {
      _s2();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: 'flex min-h-screen bg-background',
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'aside',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])(
                  'fixed inset-y-0 z-20 hidden md:block',
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'SIDEBAR_LAYOUT'
                  ].expanded.width,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'SIDEBAR_COLORS'
                  ].background
                ),
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(
                        'flex h-14 items-center border-b px-4',
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'SIDEBAR_COLORS'
                        ].border
                      ),
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'flex items-center gap-2',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                className:
                                  'flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red',
                                children: /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__[
                                    'Wrench'
                                  ],
                                  {
                                    className: 'h-4 w-4 text-white',
                                    'aria-hidden': 'true',
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                    lineNumber: 377,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 376,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: 'font-semibold text-white',
                                children: t('layout.systemName'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 379,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 375,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 374,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'nav',
                    {
                      className: 'flex flex-col gap-1 p-4',
                      children: Array.from({
                        length: 7,
                      }).map((_, i) =>
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: 'flex items-center gap-3 rounded-lg px-3 py-2',
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Skeleton'
                                ],
                                {
                                  className: 'h-5 w-5 rounded bg-white/10',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                  lineNumber: 386,
                                  columnNumber: 15,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Skeleton'
                                ],
                                {
                                  className: 'h-4 flex-1 bg-white/10',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                  lineNumber: 387,
                                  columnNumber: 15,
                                },
                                this
                              ),
                            ],
                          },
                          i,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                            lineNumber: 385,
                            columnNumber: 13,
                          },
                          this
                        )
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 383,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'cn'
                      ])(
                        'absolute bottom-0 left-0 right-0 p-4 border-t',
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'SIDEBAR_COLORS'
                        ].border
                      ),
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'flex items-center gap-2',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: 'text-ul-red font-bold text-xs',
                                children: 'UL Solutions',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 394,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: 'text-white/30 text-xs',
                                children: '|',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 395,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: 'text-white/40 text-xs',
                                children: 'Working for a safer world.',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 396,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 393,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 392,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                lineNumber: 367,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])(
                  'flex flex-col flex-1',
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$sidebar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'SIDEBAR_LAYOUT'
                  ].expanded.marginLeft
                ),
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'header',
                    {
                      className:
                        'sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Skeleton'
                          ],
                          {
                            className: 'h-6 w-6 md:hidden',
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                            lineNumber: 404,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: 'flex-1',
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                            lineNumber: 405,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: 'flex items-center gap-2',
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Skeleton'
                                ],
                                {
                                  className: 'h-8 w-8 rounded-md',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                  lineNumber: 407,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Skeleton'
                                ],
                                {
                                  className: 'h-8 w-8 rounded-md',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                  lineNumber: 408,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'Skeleton'
                                ],
                                {
                                  className: 'h-8 w-8 rounded-full',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                  lineNumber: 409,
                                  columnNumber: 13,
                                },
                                this
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                            lineNumber: 406,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 403,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'main',
                    {
                      className: 'flex-1 overflow-auto p-6',
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'space-y-6',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Skeleton'
                              ],
                              {
                                className: 'h-9 w-48',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 415,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                className: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                                children: Array.from({
                                  length: 6,
                                }).map((_, i) =>
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    'div',
                                    {
                                      className: 'border rounded-lg p-6 space-y-4',
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'Skeleton'
                                          ],
                                          {
                                            className: 'h-6 w-32',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 419,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'Skeleton'
                                          ],
                                          {
                                            className: 'h-4 w-full',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 420,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'Skeleton'
                                          ],
                                          {
                                            className: 'h-4 w-3/4',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                            lineNumber: 421,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                      ],
                                    },
                                    i,
                                    true,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                      lineNumber: 418,
                                      columnNumber: 17,
                                    },
                                    this
                                  )
                                ),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                                lineNumber: 416,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                          lineNumber: 414,
                          columnNumber: 11,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                      lineNumber: 413,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
                lineNumber: 402,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/layout/DashboardShell.tsx',
          lineNumber: 365,
          columnNumber: 5,
        },
        this
      );
    }
    _s2(DashboardShellSkeleton, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c2 = DashboardShellSkeleton;
    var _c, _c1, _c2;
    __turbopack_context__.k.register(_c, 'SidebarItem');
    __turbopack_context__.k.register(_c1, 'DashboardShell');
    __turbopack_context__.k.register(_c2, 'DashboardShellSkeleton');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
]);

//# sourceMappingURL=apps_frontend_d81fb5b6._.js.map
