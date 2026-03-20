(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === 'object' ? document.currentScript : undefined,
  '[project]/apps/frontend/lib/api/error.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'getErrorMessage',
      () => getErrorMessage,
      'isApiError',
      () => isApiError,
      'isForbiddenError',
      () => isForbiddenError,
      'isNotFoundError',
      () => isNotFoundError,
      'isUnauthorizedError',
      () => isUnauthorizedError,
      'toApiError',
      () => toApiError,
    ]);
    /**
     * API 에러 타입 정의 및 유틸리티
     *
     * ⚠️ IMPORTANT: Single Source of Truth
     * - ApiError 클래스는 equipment-errors.ts에서 정의
     * - 이 파일은 공통 유틸리티만 제공
     * - 두 개의 ApiError 클래스 충돌 방지
     *
     * Next.js 16 Best Practice:
     * - any 타입 사용 금지
     * - 타입 안전한 에러 처리
     */ // ✅ equipment-errors.ts의 ApiError를 re-export (단일 소스)
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/errors/equipment-errors.ts [app-client] (ecmascript) <locals>'
      );
    function toApiError(error) {
      // 1. 이미 ApiError인 경우
      if (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      ) {
        return error;
      }
      // 2. equipment-errors.ts의 ApiError 형식 처리 (name='ApiError', code 프로퍼티)
      if (
        typeof error === 'object' &&
        error !== null &&
        error instanceof Error &&
        error.name === 'ApiError' &&
        'code' in error
      ) {
        const equipmentApiError = error;
        // statusCode 또는 code로부터 status 추론
        const status = equipmentApiError.statusCode ?? getStatusFromCode(equipmentApiError.code);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ](
          equipmentApiError.message || 'An unknown error occurred.',
          equipmentApiError.code,
          status,
          equipmentApiError.details
        );
      }
      // 3. Axios 에러 형식 처리
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object'
      ) {
        const axiosError = error;
        if (axiosError.response?.status) {
          const status = axiosError.response.status;
          // Prefer backend error code (e.g., VERSION_CONFLICT) over HTTP status mapping
          const backendCode = axiosError.response.data?.code;
          const mappedCode = backendCode
            ? (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'mapBackendErrorCode'
              ])(backendCode)
            : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'EquipmentErrorCode'
              ].UNKNOWN_ERROR;
          const errorCode =
            mappedCode !==
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].UNKNOWN_ERROR
              ? mappedCode
              : (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'httpStatusToErrorCode'
                ])(status);
          return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'ApiError'
          ](
            axiosError.response.data?.message || getDefaultMessageForStatus(status),
            errorCode,
            status,
            axiosError.response.data?.details
          );
        }
      }
      // 4. fetch API 에러 형식 처리 (status 프로퍼티)
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
      ) {
        const fetchError = error;
        const errorCode = fetchError.code
          ? fetchError.code
          : (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'httpStatusToErrorCode'
            ])(fetchError.status);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ](
          fetchError.message || getDefaultMessageForStatus(fetchError.status),
          errorCode,
          fetchError.status
        );
      }
      // 5. 일반 Error 객체
      if (error instanceof Error) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ](
          error.message,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'EquipmentErrorCode'
          ].UNKNOWN_ERROR
        );
      }
      return null;
    }
    /**
     * 에러 코드에서 HTTP 상태 코드 추론
     */ function getStatusFromCode(code) {
      const codeToStatus = {
        NOT_FOUND: 404,
        EQUIPMENT_NOT_FOUND: 404,
        UNAUTHORIZED: 401,
        SESSION_EXPIRED: 401,
        PERMISSION_DENIED: 403,
        FORBIDDEN: 403,
        VALIDATION_ERROR: 400,
        BAD_REQUEST: 400,
        REQUIRED_FIELD_MISSING: 400,
        INVALID_FORMAT: 400,
        INVALID_DATE: 400,
        DUPLICATE_ERROR: 409,
        DUPLICATE_MANAGEMENT_NUMBER: 409,
        DUPLICATE_SERIAL_NUMBER: 409,
        CONFLICT: 409,
        VERSION_CONFLICT: 409,
        SERVER_ERROR: 500,
        NETWORK_ERROR: 0,
        TIMEOUT_ERROR: 408,
        FILE_TOO_LARGE: 413,
        INVALID_FILE_TYPE: 415,
      };
      return codeToStatus[code] ?? 500;
    }
    /**
     * HTTP 상태 코드에 대한 기본 메시지
     */ function getDefaultMessageForStatus(status) {
      const statusMessages = {
        400: 'Bad request.',
        401: 'Authentication required. Please log in again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        409: 'Another user has modified this data. Please check the latest data.',
        413: 'File size is too large.',
        415: 'Unsupported file format.',
        500: 'An internal server error occurred.',
        502: 'Cannot connect to the server.',
        503: 'The server is temporarily unavailable.',
      };
      return statusMessages[status] || 'An unknown error occurred.';
    }
    function isApiError(error) {
      return (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      );
    }
    function getErrorMessage(error, defaultMessage = 'An error occurred.') {
      // ApiError인 경우 getUserMessage 사용
      if (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      ) {
        return error.getUserMessage();
      }
      // 변환 시도
      const apiError = toApiError(error);
      if (apiError) {
        return apiError.getUserMessage();
      }
      // 일반 Error
      if (error instanceof Error) {
        return error.message;
      }
      return defaultMessage;
    }
    function isNotFoundError(error) {
      // ApiError 인스턴스 체크
      if (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      ) {
        return (
          error.statusCode === 404 ||
          error.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].NOT_FOUND ||
          error.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].EQUIPMENT_NOT_FOUND
        );
      }
      // 변환 후 체크
      const apiError = toApiError(error);
      if (apiError) {
        return (
          apiError.statusCode === 404 ||
          apiError.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].NOT_FOUND ||
          apiError.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].EQUIPMENT_NOT_FOUND
        );
      }
      // 에러 객체에 직접 statusCode 또는 code가 있는 경우
      if (typeof error === 'object' && error !== null) {
        const errorObj = error;
        if (errorObj.statusCode === 404 || errorObj.status === 404) {
          return true;
        }
        if (errorObj.code === 'NOT_FOUND' || errorObj.code === 'EQUIPMENT_NOT_FOUND') {
          return true;
        }
      }
      return false;
    }
    function isUnauthorizedError(error) {
      if (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      ) {
        return (
          error.statusCode === 401 ||
          error.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].UNAUTHORIZED ||
          error.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].SESSION_EXPIRED
        );
      }
      const apiError = toApiError(error);
      if (apiError) {
        return (
          apiError.statusCode === 401 ||
          apiError.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].UNAUTHORIZED ||
          apiError.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].SESSION_EXPIRED
        );
      }
      if (typeof error === 'object' && error !== null) {
        const errorObj = error;
        if (errorObj.statusCode === 401 || errorObj.status === 401) {
          return true;
        }
      }
      return false;
    }
    function isForbiddenError(error) {
      if (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      ) {
        return (
          error.statusCode === 403 ||
          error.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].PERMISSION_DENIED
        );
      }
      const apiError = toApiError(error);
      if (apiError) {
        return (
          apiError.statusCode === 403 ||
          apiError.code ===
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].PERMISSION_DENIED
        );
      }
      if (typeof error === 'object' && error !== null) {
        const errorObj = error;
        if (errorObj.statusCode === 403 || errorObj.status === 403) {
          return true;
        }
      }
      return false;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-optimistic-mutation.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useOptimisticMutation', () => useOptimisticMutation]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/use-toast.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$error$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/error.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/errors/equipment-errors.ts [app-client] (ecmascript) <locals>'
      );
    var _s = __turbopack_context__.k.signature();
    /**
     * ✅ TanStack Query Optimistic Update Pattern (SSOT)
     *
     * 사용자 경험 개선을 위한 Optimistic Update 패턴 구현
     *
     * ## 핵심 원칙
     * 1. **즉시 UI 피드백**: 서버 응답 대기 없이 0ms 만에 UI 업데이트 (onMutate)
     * 2. **서버 = 유일한 진실의 소스**: 성공/실패 무관하게 항상 서버 데이터로 동기화 (onSettled)
     * 3. **타입 안전**: TData(서버 응답)와 TCachedData(캐시)를 절대 혼용하지 않음
     *
     * ## TanStack Query 생명주기 (공식 Optimistic Update 패턴)
     * ```
     * 사용자 클릭
     *   ↓
     * onMutate (0ms)
     *   - 진행 중인 쿼리 취소 (race condition 방지)
     *   - 현재 데이터 스냅샷 저장
     *   - 캐시 즉시 업데이트 (optimistic)
     *   ↓
     * API 요청 (백그라운드)
     *   ↓
     * onSuccess → 성공 토스트 + 콜백
     * onError   → 에러 토스트 + 콜백
     *   ↓
     * onSettled (항상 실행)
     *   - queryKey 무효화 → 서버에서 최신 데이터 조회 (SSOT)
     *   - invalidateKeys 무효화 → 관련 쿼리 백그라운드 재조회
     * ```
     *
     * ## ⚠️ 타입 안전 주의사항 (TData vs TCachedData)
     *
     * TData(서버 응답 타입)와 TCachedData(캐시 데이터 타입)는 다른 타입일 수 있습니다:
     * - bulkApprove: TData = { success: string[]; failed: string[] }, TCachedData = ApprovalItem[]
     * - approve(void): TData = void, TCachedData = ApprovalItem[]
     * - createEquipment: TData = Equipment, TCachedData = { data: Equipment[] }
     *
     * 따라서 onSuccess에서 setQueryData(queryKey, data)를 절대 사용하면 안 됩니다.
     * 이는 TCachedData 캐시에 TData를 기록하여 타입 불일치 런타임 에러를 유발합니다.
     * (예: items.map is not a function)
     *
     * @example
     * ```tsx
     * // 승인 처리 (목록에서 항목 제거)
     * const approveMutation = useOptimisticMutation({
     *   mutationFn: (item) => approvalsApi.approve(item.id),
     *   queryKey: ['approvals'],
     *   optimisticUpdate: (old, item) => old?.filter(i => i.id !== item.id) || [],
     *   invalidateKeys: [['approval-counts']],
     *   successMessage: '승인되었습니다.',
     * });
     * ```
     *
     * @see https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
     */ ('use client');
    function useOptimisticMutation({
      mutationFn,
      queryKey,
      optimisticUpdate,
      invalidateKeys = [],
      successMessage,
      errorMessage,
      onSuccessCallback,
      onErrorCallback,
    }) {
      _s();
      const queryClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQueryClient'
      ])();
      const { toast } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useToast'
      ])();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMutation'
      ])({
        mutationFn,
        /**
         * ✅ Phase 1: onMutate - 즉시 캐시 업데이트
         *
         * 서버 요청 전에 실행되어 UI를 즉시 업데이트합니다.
         *
         * @returns context - onError에서 사용할 스냅샷
         */ onMutate: {
          'useOptimisticMutation.useMutation': async (variables) => {
            // 1. 진행 중인 쿼리 취소 (race condition 방지)
            await queryClient.cancelQueries({
              queryKey,
            });
            // 2. 현재 데이터 스냅샷 저장 (롤백용)
            const snapshot = queryClient.getQueryData(queryKey);
            // 3. Optimistic 업데이트 - 즉시 캐시 수정
            queryClient.setQueryData(
              queryKey,
              {
                'useOptimisticMutation.useMutation': (old) => optimisticUpdate(old, variables),
              }['useOptimisticMutation.useMutation']
            );
            // 4. onError에서 사용할 context 반환
            return {
              snapshot,
            };
          },
        }['useOptimisticMutation.useMutation'],
        /**
         * ✅ Phase 2: onError - 에러 알림
         *
         * 서버 에러 발생 시 사용자에게 알림을 표시합니다.
         * 쿼리 무효화는 onSettled에서 일괄 처리합니다 (중복 제거).
         *
         * ⚠️ 스냅샷 롤백을 사용하지 않는 이유:
         * - 에러 발생 = "서버 상태가 예상과 다름"을 의미
         * - 스냅샷은 mutation 전 로컬 데이터이므로 실제 서버 상태와 다를 수 있음
         * - SSOT 원칙: onSettled의 invalidateQueries가 서버 최신 데이터로 동기화
         */ onError: {
          'useOptimisticMutation.useMutation': (error, variables) => {
            // 1. 에러 토스트 표시 (409 충돌은 전용 메시지)
            if (
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'isConflictError'
              ])(error)
            ) {
              toast({
                title: '데이터 충돌',
                description:
                  '다른 사용자가 이 데이터를 수정했습니다. 최신 데이터로 자동 새로고침됩니다.',
                variant: 'destructive',
              });
            } else {
              const message = errorMessage
                ? typeof errorMessage === 'function'
                  ? errorMessage(error)
                  : errorMessage
                : (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$error$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'getErrorMessage'
                  ])(error, '작업 중 오류가 발생했습니다.');
              toast({
                title: '오류',
                description: message,
                variant: 'destructive',
              });
            }
            // 2. 커스텀 에러 콜백
            onErrorCallback?.(error, variables);
          },
        }['useOptimisticMutation.useMutation'],
        /**
         * ✅ Phase 3: onSuccess - 성공 알림
         *
         * 서버 응답 성공 시 사용자에게 알림을 표시합니다.
         * 쿼리 무효화는 onSettled에서 일괄 처리합니다.
         *
         * ⚠️ CRITICAL: setQueryData(queryKey, data) 사용 금지!
         * TData(서버 응답)와 TCachedData(캐시)는 다른 타입일 수 있습니다:
         *   - bulkApprove: TData = { success, failed } → TCachedData = ApprovalItem[] (crash!)
         *   - approve(void): TData = void → TCachedData = ApprovalItem[] (cache 삭제!)
         *   - create: TData = Equipment → TCachedData = { data: Equipment[] } (crash!)
         * setQueryData는 unknown을 수용하므로 TypeScript가 이 불일치를 잡지 못합니다.
         */ onSuccess: {
          'useOptimisticMutation.useMutation': (data, variables) => {
            // 1. 성공 토스트 표시
            if (successMessage) {
              const message =
                typeof successMessage === 'function'
                  ? successMessage(data, variables)
                  : successMessage;
              toast({
                title: '성공',
                description: message,
              });
            }
            // 2. 커스텀 성공 콜백
            onSuccessCallback?.(data, variables);
          },
        }['useOptimisticMutation.useMutation'],
        /**
         * ✅ Phase 4: onSettled - 서버 동기화 (SSOT)
         *
         * 성공/실패 무관하게 항상 실행됩니다.
         * 서버에서 최신 데이터를 가져와 optimistic 캐시를 확정/교정합니다.
         *
         * 이 패턴의 장점:
         * 1. 성공 시: optimistic 데이터가 서버 데이터로 확정됨
         * 2. 실패 시: 잘못된 optimistic 데이터가 서버 데이터로 교정됨
         * 3. 관련 쿼리 무효화가 성공/실패 경로에서 중복되지 않음
         *
         * @see https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
         */ onSettled: {
          'useOptimisticMutation.useMutation': async () => {
            // 1. 주 쿼리 무효화 → 서버 최신 데이터로 동기화
            await queryClient.invalidateQueries({
              queryKey,
            });
            // 2. 관련 쿼리도 무효화 (승인 카운트, 대시보드 등)
            if (invalidateKeys.length > 0) {
              await Promise.all(
                invalidateKeys.map(
                  {
                    'useOptimisticMutation.useMutation': (key) =>
                      queryClient.invalidateQueries({
                        queryKey: key,
                      }),
                  }['useOptimisticMutation.useMutation']
                )
              );
            }
          },
        }['useOptimisticMutation.useMutation'],
      });
    }
    _s(useOptimisticMutation, 'zHg3Sjn36STGCnrkGliH3sciqaA=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQueryClient'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useToast'
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
  '[project]/apps/frontend/lib/api/cache-invalidation.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CalibrationPlansCacheInvalidation',
      () => CalibrationPlansCacheInvalidation,
      'CheckoutCacheInvalidation',
      () => CheckoutCacheInvalidation,
      'DashboardCacheInvalidation',
      () => DashboardCacheInvalidation,
      'EquipmentCacheInvalidation',
      () => EquipmentCacheInvalidation,
      'NonConformanceCacheInvalidation',
      () => NonConformanceCacheInvalidation,
      'NotificationCacheInvalidation',
      () => NotificationCacheInvalidation,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    class EquipmentCacheInvalidation {
      /**
       * 모든 장비 캐시 무효화 (목록 + 상세)
       *
       * 사용 시점:
       * - 대량 장비 변경 (예: 스케줄러 실행 후)
       * - 전체 재동기화 필요 시
       * - 여러 장비가 영향받는 작업 후
       *
       * 무효화 범위:
       * - 모든 목록 변형 (필터 조합 무관)
       * - 모든 장비 상세
       * - 모든 하위 리소스 (NC, 사고 이력 등)
       *
       * @example
       * ```typescript
       * // 대량 상태 변경 후
       * await EquipmentCacheInvalidation.invalidateAll(queryClient);
       * ```
       */ static async invalidateAll(queryClient) {
        await queryClient.invalidateQueries({
          queryKey:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'queryKeys'
            ].equipment.all,
          exact: false,
        });
      }
      /**
       * 특정 장비 상세 + 목록 무효화
       *
       * 사용 시점:
       * - 단일 장비 업데이트 (상태, 정보 등)
       * - NC 생성 (장비 상태 → non_conforming)
       * - 폐기 처리 (장비 상태 → retired)
       * - 사고 이력 등록 (장비 상태 영향 가능)
       *
       * 무효화 전략:
       * 1. 특정 장비 상세 + 모든 하위 리소스
       *    (NC, 사고 이력, 폐기 요청 등)
       * 2. 모든 목록 변형
       *    (상태 변경 시 필터링 결과 달라짐)
       *
       * 왜 목록도 무효화?
       * - 예: available → non_conforming 시
       *   status=available 필터 결과에서 제외됨
       * - 예: 팀 변경 시 teamId 필터 결과 달라짐
       *
       * @param queryClient - React Query 클라이언트
       * @param equipmentId - 장비 UUID
       *
       * @example
       * ```typescript
       * // NC 생성 후
       * await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
       *
       * // 장비 정보 수정 후
       * await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
       * ```
       */ static async invalidateEquipment(queryClient, equipmentId) {
        await Promise.all([
          // 1. 특정 장비 상세 + 하위 리소스
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.detail(equipmentId),
            exact: false,
          }),
          // 2. 모든 목록 변형 (상태 변경으로 필터링 영향)
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.lists(),
            exact: false,
          }),
          // 3. 대시보드 캐시 무효화 (장비 상태 변경 시 통계 영향)
          DashboardCacheInvalidation.invalidateAll(queryClient),
        ]);
      }
      /**
       * 장비 데이터 즉시 refetch (중요 업데이트용)
       *
       * 사용 시점:
       * - 사용자가 즉시 UI 업데이트 기대
       * - 상태 배지가 최신 상태 반영해야 함
       * - 무효화만으로는 느릴 때 (마운트 안 된 쿼리는 refetch 안 됨)
       *
       * invalidate vs refetch:
       * - invalidate: 데이터를 stale로 표시 (다음 mount/focus 시 refetch)
       * - refetch: 즉시 데이터 재요청 (마운트된 쿼리만 해당)
       *
       * @param queryClient - React Query 클라이언트
       * @param equipmentId - 장비 UUID
       *
       * @example
       * ```typescript
       * // NC 생성 후 즉시 UI 업데이트
       * await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
       * await EquipmentCacheInvalidation.refetchEquipment(queryClient, equipmentId);
       * ```
       */ static async refetchEquipment(queryClient, equipmentId) {
        await Promise.all([
          // 1. 상세 페이지 refetch (마운트된 경우만)
          queryClient.refetchQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.detail(equipmentId),
            type: 'active',
          }),
          // 2. 목록 페이지 refetch (마운트된 경우만)
          queryClient.refetchQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.lists(),
            type: 'active',
          }),
        ]);
      }
      /**
       * NC 생성 후 캐시 무효화
       *
       * 무효화 대상:
       * - 장비 상세 + 목록 (상태 변경)
       * - NC 목록 (새 NC 추가)
       *
       * @param queryClient - React Query 클라이언트
       * @param equipmentId - 장비 UUID
       * @param ncId - 생성된 NC UUID (선택)
       *
       * @example
       * ```typescript
       * await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(
       *   queryClient,
       *   equipmentId,
       *   ncId
       * );
       * ```
       */ static async invalidateAfterNonConformanceCreation(queryClient, equipmentId, ncId) {
        await Promise.all([
          // 1. 장비 관련 캐시
          this.invalidateEquipment(queryClient, equipmentId),
          // 2. NC 목록 캐시
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].nonConformances.all,
            exact: false,
          }),
          // 3. 특정 NC 상세 (ncId 제공 시)
          ncId
            ? queryClient.invalidateQueries({
                queryKey:
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'queryKeys'
                  ].nonConformances.detail(ncId),
              })
            : Promise.resolve(),
        ]);
      }
      /**
       * 폐기 처리 후 캐시 무효화
       *
       * 무효화 대상:
       * - 장비 상세 + 목록 (상태 → retired)
       * - 폐기 요청 목록
       *
       * @param queryClient - React Query 클라이언트
       * @param equipmentId - 장비 UUID
       *
       * @example
       * ```typescript
       * await EquipmentCacheInvalidation.invalidateAfterDisposal(
       *   queryClient,
       *   equipmentId
       * );
       * ```
       */ static async invalidateAfterDisposal(queryClient, equipmentId) {
        await Promise.all([
          // 1. 장비 관련 캐시
          this.invalidateEquipment(queryClient, equipmentId),
          // 2. 폐기 요청 목록
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].disposal.all,
            exact: false,
          }),
        ]);
      }
      /**
       * 사고 이력 등록 후 캐시 무효화
       *
       * 무효화 대상:
       * - 장비 사고 이력 목록
       * - 장비 상세 (사고로 상태 변경 가능)
       *
       * @param queryClient - React Query 클라이언트
       * @param equipmentId - 장비 UUID
       *
       * @example
       * ```typescript
       * await EquipmentCacheInvalidation.invalidateAfterIncidentHistory(
       *   queryClient,
       *   equipmentId
       * );
       * ```
       */ static async invalidateAfterIncidentHistory(queryClient, equipmentId) {
        await Promise.all([
          // 1. 장비 사고 이력
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.incidentHistory(equipmentId),
          }),
          // 2. 장비 상세 (사고로 상태 변경 가능)
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.detail(equipmentId),
            exact: false,
          }),
          // 3. 목록도 무효화 (상태 변경 시 필터링 영향)
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].equipment.lists(),
            exact: false,
          }),
        ]);
      }
    }
    class NonConformanceCacheInvalidation {
      /**
       * 모든 부적합 캐시 무효화 (목록 + 상세)
       */ static async invalidateAll(queryClient) {
        await queryClient.invalidateQueries({
          queryKey:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'queryKeys'
            ].nonConformances.all,
          exact: false,
        });
      }
      /**
       * 특정 부적합 상세 + 목록 무효화
       */ static async invalidateNC(queryClient, ncId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].nonConformances.detail(ncId),
          }),
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].nonConformances.lists(),
            exact: false,
          }),
        ]);
      }
      /**
       * NC 상태 변경 후 무효화 (장비 + 대시보드 포함)
       *
       * 사용 시점:
       * - 조치 완료 (open → corrected)
       * - 종결 (corrected → closed) → 장비 상태 available 복원
       * - 반려 (corrected → open)
       */ static async invalidateAfterStatusChange(queryClient, ncId, equipmentId) {
        await Promise.all([
          this.invalidateNC(queryClient, ncId),
          // 장비 상태 영향 (closed 시 non_conforming → available)
          equipmentId
            ? EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId)
            : Promise.resolve(),
          // 대시보드 통계 영향
          DashboardCacheInvalidation.invalidateAll(queryClient),
          // 승인 카운트 영향 (corrected 목록 변동)
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].approvals.countsAll,
            exact: false,
          }),
        ]);
      }
    }
    class NotificationCacheInvalidation {
      /**
       * 모든 알림 캐시 무효화 (목록 + 미읽음 카운트)
       *
       * 사용 시점:
       * - 승인/반려 처리 후 (관련 알림 발생)
       * - 벌크 승인 후
       * - 알림 설정 변경 후
       */ static async invalidateAll(queryClient) {
        await queryClient.invalidateQueries({
          queryKey:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'queryKeys'
            ].notifications.all,
          exact: false,
        });
      }
    }
    class CalibrationPlansCacheInvalidation {
      /**
       * 모든 교정계획서 캐시 무효화
       */ static async invalidateAll(queryClient) {
        await queryClient.invalidateQueries({
          queryKey:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'queryKeys'
            ].calibrationPlans.all,
          exact: false,
        });
      }
      /**
       * 특정 교정계획서 상세 + 목록 무효화
       */ static async invalidatePlan(queryClient, planId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].calibrationPlans.detail(planId),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'queryKeys'
              ].calibrationPlans.lists(),
            exact: false,
          }),
        ]);
      }
      /**
       * 상태 변경 후 무효화 (대시보드 포함)
       */ static async invalidateAfterStatusChange(queryClient, planId) {
        await Promise.all([
          this.invalidatePlan(queryClient, planId),
          DashboardCacheInvalidation.invalidateAll(queryClient),
        ]);
      }
    }
    class CheckoutCacheInvalidation {
      /** 체크아웃 승인/반려 후 무효화 대상 키 */ static APPROVAL_KEYS = [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].checkouts.all,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].approvals.all,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].approvals.countsAll,
      ];
      /** 반입 승인 후 무효화 대상 키 */ static RETURN_APPROVAL_KEYS = [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].checkouts.all,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].approvals.all,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].approvals.countsAll,
      ];
      /** 반입 제출(반출→반입) 후 무효화 대상 키 */ static RETURN_KEYS = [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].checkouts.all,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].approvals.all,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'queryKeys'
        ].approvals.countsAll,
      ];
    }
    class DashboardCacheInvalidation {
      /**
       * 모든 대시보드 캐시 무효화
       *
       * 사용 시점:
       * - 장비 상태 변경 (통계 영향)
       * - 팀 필터 변경
       * - 권한 변경
       */ static async invalidateAll(queryClient) {
        await queryClient.invalidateQueries({
          queryKey:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'queryKeys'
            ].dashboard.all,
          exact: false,
        });
      }
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/textarea.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Textarea', () => Textarea]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    const Textarea =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, ...props }, ref) => {
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'textarea',
            {
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
              ),
              ref: ref,
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/textarea.tsx',
              lineNumber: 11,
              columnNumber: 7,
            },
            ('TURBOPACK compile-time value', void 0)
          );
        })
      );
    _c1 = Textarea;
    Textarea.displayName = 'Textarea';
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'Textarea$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Textarea');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/label.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Label', () => Label]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-label/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const labelVariants = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'cva'
    ])(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
    );
    const Label =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Root'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(labelVariants(), className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/label.tsx',
              lineNumber: 18,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = Label;
    Label.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ].displayName;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'Label$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Label');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/tooltip.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Tooltip',
      () => Tooltip,
      'TooltipContent',
      () => TooltipContent,
      'TooltipProvider',
      () => TooltipProvider,
      'TooltipTrigger',
      () => TooltipTrigger,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-tooltip/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const TooltipProvider =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Provider'
      ];
    const Tooltip =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ];
    const TooltipTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Trigger'
      ];
    const TooltipContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, sideOffset = 4, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Content'
            ],
            {
              ref: ref,
              sideOffset: sideOffset,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/tooltip.tsx',
              lineNumber: 18,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = TooltipContent;
    TooltipContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Content'
      ].displayName;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'TooltipContent$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'TooltipContent');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/hooks/use-approvals-api.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useApprovalsApi', () => useApprovalsApi]);
    /**
     * Approvals API Hook (Best Practice)
     *
     * ✅ HYBRID 접근: 중요한 메서드는 AuthenticatedClient 사용
     * - getPendingCounts, getPendingItems: useAuthenticatedClient 사용 (타이밍 안전)
     * - approve, reject, bulk*: approvalsApi 위임 (복잡한 로직 재사용)
     *
     * 이유:
     * - approvalsApi 클래스가 내부적으로 apiClient 사용 (getSession 타이밍 이슈)
     * - 조회(GET) 메서드는 authenticated client로 직접 호출
     * - 액션(POST/PATCH) 메서드는 기존 로직 재사용 (점진적 마이그레이션)
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$authenticated$2d$client$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/authenticated-client-provider.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    function useApprovalsApi() {
      _s();
      const client = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$authenticated$2d$client$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useAuthenticatedClient'
      ])();
      /**
       * 카테고리별 승인 대기 개수 조회
       * ✅ AuthenticatedClient 사용: 세션 타이밍 안전
       */ const getPendingCounts = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useApprovalsApi.useCallback[getPendingCounts]': async (_role) => {
            try {
              const response = await client.get(
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'API_ENDPOINTS'
                ].APPROVALS.COUNTS
              );
              return (
                response.data || {
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
                }
              );
            } catch (error) {
              console.error('Failed to fetch approval counts:', error);
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
          },
        }['useApprovalsApi.useCallback[getPendingCounts]'],
        [client]
      );
      /**
       * 카테고리별 승인 대기 목록 조회
       * ✅ approvalsApi 위임: 복잡한 카테고리별 엔드포인트 매핑 로직 재사용
       */ const getPendingItems = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useApprovalsApi.useCallback[getPendingItems]': async (category, userTeamId) => {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].getPendingItems(category, userTeamId);
          },
        }['useApprovalsApi.useCallback[getPendingItems]'],
        []
      );
      /**
       * 승인 처리
       */ const approve = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useApprovalsApi.useCallback[approve]': async (
            category,
            id,
            userId,
            reason,
            equipmentId,
            originalData
          ) => {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].approve(category, id, userId, reason, equipmentId, originalData);
          },
        }['useApprovalsApi.useCallback[approve]'],
        []
      );
      /**
       * 반려 처리
       */ const reject = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useApprovalsApi.useCallback[reject]': async (
            category,
            id,
            userId,
            reason,
            equipmentId,
            originalData
          ) => {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].reject(category, id, userId, reason, equipmentId, originalData);
          },
        }['useApprovalsApi.useCallback[reject]'],
        []
      );
      /**
       * 일괄 승인 처리
       */ const bulkApprove = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useApprovalsApi.useCallback[bulkApprove]': async (category, ids, userId, comment) => {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].bulkApprove(category, ids, userId, comment);
          },
        }['useApprovalsApi.useCallback[bulkApprove]'],
        []
      );
      /**
       * 일괄 반려 처리
       */ const bulkReject = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useApprovalsApi.useCallback[bulkReject]': async (category, ids, userId, reason) => {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'default'
            ].bulkReject(category, ids, userId, reason);
          },
        }['useApprovalsApi.useCallback[bulkReject]'],
        []
      );
      return {
        getPendingCounts,
        getPendingItems,
        approve,
        reject,
        bulkApprove,
        bulkReject,
      };
    }
    _s(useApprovalsApi, 'yY+xBVQFd7ovMYBjWbKnLOmJCeA=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$authenticated$2d$client$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useAuthenticatedClient'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'APPROVAL_ACTION_BUTTON_TOKENS',
      () => APPROVAL_ACTION_BUTTON_TOKENS,
      'APPROVAL_BULK_BAR_TOKENS',
      () => APPROVAL_BULK_BAR_TOKENS,
      'APPROVAL_CARD_BORDER_TOKENS',
      () => APPROVAL_CARD_BORDER_TOKENS,
      'APPROVAL_CATEGORY_SIDEBAR_TOKENS',
      () => APPROVAL_CATEGORY_SIDEBAR_TOKENS,
      'APPROVAL_DETAIL_PANEL_TOKENS',
      () => APPROVAL_DETAIL_PANEL_TOKENS,
      'APPROVAL_ELAPSED_DAYS_TOKENS',
      () => APPROVAL_ELAPSED_DAYS_TOKENS,
      'APPROVAL_EMPTY_STATE_TOKENS',
      () => APPROVAL_EMPTY_STATE_TOKENS,
      'APPROVAL_FOCUS',
      () => APPROVAL_FOCUS,
      'APPROVAL_INFO_GRID_TOKENS',
      () => APPROVAL_INFO_GRID_TOKENS,
      'APPROVAL_KPI_STRIP_TOKENS',
      () => APPROVAL_KPI_STRIP_TOKENS,
      'APPROVAL_MOBILE_CATEGORY_BAR_TOKENS',
      () => APPROVAL_MOBILE_CATEGORY_BAR_TOKENS,
      'APPROVAL_MOTION',
      () => APPROVAL_MOTION,
      'APPROVAL_ROW_GRID_COLS',
      () => APPROVAL_ROW_GRID_COLS,
      'APPROVAL_ROW_TOKENS',
      () => APPROVAL_ROW_TOKENS,
      'APPROVAL_STATUS_BADGE_TOKENS',
      () => APPROVAL_STATUS_BADGE_TOKENS,
      'APPROVAL_STEPPER_TOKENS',
      () => APPROVAL_STEPPER_TOKENS,
      'APPROVAL_TAB_TOKENS',
      () => APPROVAL_TAB_TOKENS,
      'APPROVAL_TIMELINE_TOKENS',
      () => APPROVAL_TIMELINE_TOKENS,
      'getApprovalActionButtonClasses',
      () => getApprovalActionButtonClasses,
      'getApprovalCardBorderClasses',
      () => getApprovalCardBorderClasses,
      'getApprovalStatusBadgeClasses',
      () => getApprovalStatusBadgeClasses,
      'getApprovalStepperNodeClasses',
      () => getApprovalStepperNodeClasses,
      'getElapsedDaysClasses',
      () => getElapsedDaysClasses,
    ]);
    /**
     * Approval Component Tokens (Layer 3: Component-Specific)
     *
     * 승인관리(Unified Approval) 컴포넌트의 디자인 값 SSOT
     * - 5개 UnifiedApprovalStatus 배지 + 카드 보더
     * - 다단계 승인 Stepper (폐기 2단계, 교정계획 3단계)
     * - 승인 이력 Timeline
     * - 승인/반려 액션 버튼
     * - 탭, 벌크 액션 바, Empty state
     * - 정보 그리드 (요청자/팀/일시)
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/brand.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/visual-feedback.ts [app-client] (ecmascript)'
      );
    const APPROVAL_STATUS_BADGE_TOKENS = {
      /** 대기 (UL Orange) */ pending: 'bg-ul-orange text-white',
      /** 검토 대기 (UL Orange) */ pending_review: 'bg-ul-orange text-white',
      /** 검토 완료 (UL Blue) */ reviewed: 'bg-ul-blue text-white',
      /** 승인 완료 (UL Green) */ approved: 'bg-ul-green text-white',
      /** 반려 (UL Red) */ rejected: 'bg-ul-red text-white',
    };
    const APPROVAL_CARD_BORDER_TOKENS = {
      pending: 'border-l-ul-orange',
      pending_review: 'border-l-ul-orange',
      reviewed: 'border-l-ul-blue',
      approved: 'border-l-ul-green',
      rejected: 'border-l-ul-red',
    };
    const APPROVAL_STEPPER_TOKENS = {
      /** 스텝 노드 크기 */ node: {
        size: 'w-8 h-8',
        base: `flex items-center justify-center rounded-full border-2 ${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['TRANSITION_PRESETS'].fastColor}`,
      },
      /** 스텝 상태별 스타일 */ status: {
        /** 완료 (UL Green) */ completed: 'border-ul-green bg-ul-green text-white',
        /** 진행 중 (UL Blue) */ current: 'border-ul-blue bg-ul-blue text-white',
        /** 대기 (Gray) */ pending: 'border-brand-neutral/30 bg-background text-muted-foreground',
        /** 반려 (UL Red) */ rejected: 'border-ul-red bg-ul-red text-white',
      },
      /** 스텝 라벨 */ label: {
        base: 'text-sm font-medium',
        /** 진행 중 (UL Blue - 기존 hex #0067B1 대체) */ current: 'text-ul-blue dark:text-ul-info',
        /** 완료/대기 */ inactive: 'text-muted-foreground',
      },
      /** 연결선 */ connector: {
        base: 'w-8 h-0.5 mx-2',
        completed: 'bg-ul-green',
        pending: 'bg-brand-neutral/20',
      },
      /** 아이콘 */ icon: 'h-4 w-4',
      /** 최소 너비 (단계 정보) */ infoWidth: 'min-w-[80px]',
    };
    const APPROVAL_TIMELINE_TOKENS = {
      /** 액션별 아이콘 배지 스타일 */ iconBadge: {
        approve: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticSolidBgClasses'
        ])('ok'),
        review: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticSolidBgClasses'
        ])('info'),
        reject: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticSolidBgClasses'
        ])('critical'),
      },
      /** 액션별 카드 스타일 (상세 다이얼로그용) */ card: {
        approved: `border-l-4 ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['getSemanticContainerColorClasses'])('ok')}`,
        rejected: `border-l-4 ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['getSemanticContainerColorClasses'])('critical')}`,
        reviewed: `border-l-4 ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['getSemanticContainerColorClasses'])('info')}`,
        requested: `border-l-4 ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['getSemanticContainerColorClasses'])('neutral')}`,
      },
      /** 연결선 */ connector: 'border-l-2 border-border ml-3',
      /** 블록 인용 (코멘트) */ blockquote: 'border-l-2 border-muted-foreground/30 pl-2',
      /** 거절 섹션 상단 보더 (detail-renderers.tsx) */ rejectionBorder:
        'border-t border-destructive/30',
    };
    const APPROVAL_ACTION_BUTTON_TOKENS = {
      /** 승인 버튼 (UL Green solid — Primary action으로 시각적 우선순위 부여) */ approve:
        'bg-ul-green text-white border border-ul-green hover:bg-ul-green/90 hover:shadow-[0_2px_8px_rgba(0,164,81,0.25)]',
      /** 승인 아이콘 버튼 (ghost — 데스크탑 컴팩트 로우용) */ approveIcon:
        'text-ul-green hover:bg-ul-green/10',
      /** 반려 버튼 (UL Red outline — 비대칭으로 approve 대비 억제) */ reject:
        'border border-ul-red text-ul-red hover:bg-ul-red/10',
      /** 반려 아이콘 버튼 (ghost — 데스크탑 컴팩트 로우용) */ rejectIcon:
        'text-ul-red hover:bg-ul-red/10',
      /** 상세 보기 버튼 (Neutral outline) */ detail:
        'border border-border text-foreground hover:bg-muted/80',
    };
    const APPROVAL_TAB_TOKENS = {
      /** 탭 리스트 컨테이너 */ listContainer: 'bg-muted/50',
      /** Active indicator (UL Red 언더라인) */ activeIndicator:
        'data-[state=active]:border-b-2 data-[state=active]:border-ul-red',
      /** 탭 배지 기본 스타일 (count 기반 urgency는 getUrgencyFeedbackClasses 사용) */ badge: {
        base: 'ml-1 h-5 min-w-5 px-1.5',
      },
    };
    const APPROVAL_BULK_BAR_TOKENS = {
      container: 'bg-muted/30',
    };
    const APPROVAL_INFO_GRID_TOKENS = {
      /** 아이콘 컨테이너 */ iconContainer:
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted',
      /** 아이콘 크기 */ icon: 'h-3.5 w-3.5 text-muted-foreground',
      /** 라벨 */ label: 'text-muted-foreground',
      /** 값 */ value: 'font-medium',
    };
    const APPROVAL_EMPTY_STATE_TOKENS = {
      /** 컨테이너 — radial gradient 배경으로 분위기 연출 */ container:
        'text-center py-16 relative overflow-hidden',
      /** 배경 radial gradient (::before pseudo) */ bgGradient:
        'before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_30%,hsl(var(--brand-color-ok)/0.08),transparent_70%)] before:pointer-events-none',
      /** 아이콘 링 — pop 애니메이션 */ iconRing:
        'mx-auto mb-5 w-[72px] h-[72px] rounded-full bg-brand-ok/10 flex items-center justify-center relative motion-safe:animate-approval-ring-pop',
      /** 외곽 확장 링 (::after pseudo) */ iconRingExpand:
        'after:absolute after:inset-[-4px] after:rounded-full after:border-2 after:border-brand-ok after:opacity-20 after:motion-safe:animate-approval-ring-expand',
      /** 체크마크 아이콘 */ icon: 'h-8 w-8 text-brand-ok motion-safe:animate-approval-check-draw',
      /** 타이틀 */ title:
        'text-lg font-semibold text-foreground font-display relative motion-safe:animate-approval-text-up-1',
      /** 설명 */ description:
        'text-sm text-muted-foreground mt-1.5 relative motion-safe:animate-approval-text-up-2',
      /** 오늘 처리 건수 영역 */ stat: {
        container:
          'mt-5 pt-5 border-t border-border relative motion-safe:animate-approval-text-up-3',
        label: 'text-xs text-muted-foreground',
        value: 'text-xl font-bold text-brand-ok font-display',
        unit: 'text-sm text-muted-foreground font-normal ml-0.5',
      },
    };
    const APPROVAL_MOTION = {
      /** 카드 hover: box-shadow + transform */ cardHover: [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastShadowTransform,
        'hover:shadow-md',
        'hover:scale-[1.01]',
        'hover:-translate-y-0.5',
      ].join(' '),
      /** 리스트 아이템 stagger delay */ listStagger: (index) =>
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getStaggerDelay'
        ])(index, 'list'),
      /** 리스트 아이템 진입 애니메이션 */ listItemEnter:
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2',
      /** 스켈레톤 pulse */ skeleton: 'motion-safe:animate-pulse',
      /** 처리 중 (opacity 감소) — transition 없음 = rollback 시 즉시 복원 */ processing:
        'opacity-40 pointer-events-none',
      /** 승인 성공 퇴장 — Green 플래시 → 우측 슬라이드 아웃 */ exitingSuccess:
        'motion-safe:animate-approval-exit-success',
      /** 반려 퇴장 — 좌측 슬라이드 아웃 */ exitingReject:
        'motion-safe:animate-approval-exit-reject',
      /** 퇴장 애니메이션 duration (ms) — JS setTimeout용 */ exitDurationMs: 600,
    };
    const APPROVAL_FOCUS = {
      /** 카드 focus */ card: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'FOCUS_TOKENS'
      ].classes.default,
      /** 버튼 focus */ button:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'FOCUS_TOKENS'
        ].classes.default,
    };
    const APPROVAL_ROW_GRID_COLS = 'lg:grid-cols-[32px_4px_1fr_140px_100px_80px_auto]';
    const APPROVAL_ROW_TOKENS = {
      /** 로우 컨테이너 — desktop grid, mobile stacked */ container: {
        base: 'group relative border-b border-border last:border-b-0',
        desktop: `lg:grid ${APPROVAL_ROW_GRID_COLS} lg:items-center lg:gap-3 lg:px-4 lg:py-3`,
        mobile: 'flex flex-col gap-2 p-4 lg:p-0',
        /** 헤더 행 (컬럼 라벨) */ header: `hidden lg:grid ${APPROVAL_ROW_GRID_COLS} lg:gap-3 lg:px-4 lg:py-2 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground`,
      },
      /** urgency 기반 행 배경색 (경과일 기반) */ urgencyBg: {
        info: '',
        warning: 'bg-brand-warning/5',
        critical: 'bg-brand-critical/5',
        emergency: 'bg-brand-critical/10',
      },
      /** urgency 좌측 보더 (4px 수직 막대) — critical/emergency에 pulse 맥동 */ urgencyBorder: {
        info: 'bg-border',
        warning: 'bg-brand-warning',
        critical: 'bg-brand-critical motion-safe:animate-approval-pulse-dot',
        emergency: 'bg-brand-critical motion-safe:animate-approval-pulse-dot',
      },
      /** 호버 스타일 */ hover: 'hover:bg-muted/40',
      /** 다단계 인라인 도트 배지 */ stepBadge:
        'text-xs text-muted-foreground font-mono tabular-nums',
      /** 액션 버튼 영역 (desktop: icon-only, mobile: text 포함) */ actions: {
        container: 'flex items-center gap-1',
        iconButton: 'h-8 w-8 p-0',
      },
    };
    const APPROVAL_KPI_STRIP_TOKENS = {
      container: 'grid grid-cols-2 lg:grid-cols-4 gap-3',
      card: {
        base: 'bg-card border border-border rounded-lg p-4 flex items-start gap-3.5 border-l-4 relative overflow-hidden group/kpi',
        hover: [
          'hover:shadow-sm',
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TRANSITION_PRESETS'
          ].fastShadowBorder,
        ].join(' '),
        /** hover color wash — ::after pseudo로 variant별 배경 오버레이 */ hoverWash:
          'after:absolute after:inset-0 after:opacity-0 after:transition-opacity after:duration-300 after:pointer-events-none group-hover/kpi:after:opacity-100',
        focus:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'FOCUS_TOKENS'
          ].classes.default,
      },
      /** KPI 카드 내 콘텐츠 z-index (hover wash 위에 표시) */ contentZ: 'relative z-[1]',
      /** KPI 핵심 숫자 — 32px DM Sans Bold로 시선 유도 */ value:
        'text-3xl font-bold tabular-nums leading-tight font-display tracking-tight',
      /** 숫자 단위 (일, 건) */ valueUnit: 'text-base font-normal text-muted-foreground ml-0.5',
      label: 'text-[11px] font-medium text-muted-foreground uppercase tracking-wider',
      sub: 'text-[11px] text-muted-foreground/70',
      /** 긴급 pulse dot (urgent KPI 카드 우상단) */ pulseDot: {
        container: 'absolute top-3 right-3',
        dot: 'w-2 h-2 rounded-full bg-brand-critical',
        ring: 'absolute inset-[-3px] rounded-full bg-brand-critical opacity-40 motion-safe:animate-approval-pulse-dot',
      },
      borderColors: {
        total: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticLeftBorderClasses'
        ])('info'),
        urgent: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticLeftBorderClasses'
        ])('critical'),
        avgWait: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticLeftBorderClasses'
        ])('warning'),
        processed: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticLeftBorderClasses'
        ])('ok'),
      },
      iconBg: {
        total: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticStatusClasses'
        ])('info'),
        urgent: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticStatusClasses'
        ])('critical'),
        avgWait: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticStatusClasses'
        ])('warning'),
        processed: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSemanticStatusClasses'
        ])('ok'),
      },
      /** hover wash variant별 ::after 배경색 */ hoverWashBg: {
        total: 'after:bg-brand-info/[0.06]',
        urgent: 'after:bg-brand-critical/[0.05]',
        avgWait: 'after:bg-brand-warning/[0.06]',
        processed: 'after:bg-brand-ok/[0.06]',
      },
      /** 아이콘 컨테이너 — 40px, 10px radius */ iconContainer:
        'w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0',
    };
    const APPROVAL_CATEGORY_SIDEBAR_TOKENS = {
      container: 'w-[220px] flex-shrink-0 sticky top-20 self-start',
      sectionLabel:
        'text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-3 py-2',
      item: {
        base: [
          'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm relative',
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TRANSITION_PRESETS'
          ].fastBgColor,
        ].join(' '),
        /** Active: 좌측 accent bar + 연한 배경 (전체 반전 대비 유연한 시각 위계) */ active:
          'bg-brand-info/10 text-brand-info font-semibold',
        /** Active 좌측 accent bar (3px, ::before pseudo로 렌더링) */ activeBar:
          'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-brand-info',
        inactive: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      },
      icon: 'h-4 w-4 flex-shrink-0',
      badge: {
        base: 'ml-auto text-xs font-medium tabular-nums',
        normal: 'text-muted-foreground',
        urgent: 'text-brand-critical font-semibold',
      },
      divider: 'border-t border-border my-2',
    };
    const APPROVAL_MOBILE_CATEGORY_BAR_TOKENS = {
      container: 'flex gap-1.5 overflow-x-auto pb-2 scrollbar-none',
      pill: {
        base: [
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border',
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TRANSITION_PRESETS'
          ].fastBgColorBorder,
        ].join(' '),
        active: 'bg-primary text-primary-foreground border-primary',
        inactive: 'bg-background text-muted-foreground border-border hover:bg-muted',
      },
      sectionDivider: 'w-px bg-border self-stretch mx-1 flex-shrink-0',
      badge: 'text-xs tabular-nums',
    };
    const APPROVAL_DETAIL_PANEL_TOKENS = {
      /** 패널 최외곽 컨테이너 */ container:
        'flex flex-col h-full overflow-hidden bg-card border-l border-border',
      /** 진입 애니메이션 — APPROVAL_MOTION.listItemEnter 패턴과 일관 */ contentEnter: `flex flex-col h-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['MOTION_TOKENS'].transition.fast.duration}`,
      /** 헤더 (요약 정보) */ header: {
        container: 'flex-shrink-0 p-4 border-b border-border space-y-3',
        topRow: 'flex items-center gap-2',
        title: 'text-base font-semibold text-foreground line-clamp-2',
        metaGrid: 'grid grid-cols-3 gap-3',
        /** APPROVAL_INFO_GRID_TOKENS.label 패턴 재사용 */ metaLabel:
          APPROVAL_INFO_GRID_TOKENS.label,
        metaValue: 'text-sm font-medium text-foreground',
      },
      /** 스크롤 영역 (본문) */ body: 'flex-1 overflow-y-auto p-4 space-y-4',
      /** 섹션 (상세 정보 블록) */ section: {
        container: 'space-y-2',
        title: 'flex items-center gap-2 text-sm font-medium text-foreground',
        titleLine: 'flex-1 h-px bg-border',
      },
      /** 첨부 파일 행 */ attachment: {
        row: 'flex items-center gap-2 py-1.5',
        icon: `${APPROVAL_INFO_GRID_TOKENS.icon} flex-shrink-0`,
        name: 'text-sm truncate flex-1',
        size: 'text-xs text-muted-foreground tabular-nums',
      },
      /** 하단 고정 액션 영역 */ footer: {
        container: `flex-shrink-0 flex items-center gap-2 p-4 border-t border-border ${APPROVAL_BULK_BAR_TOKENS.container}`,
        button: 'flex-1 h-9 text-sm font-medium',
      },
      /** 키보드 단축키 배지 */ kbdBadge:
        'ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border',
      /** 빈 상태 (항목 미선택) — 패널 전용 축소판 */ empty: {
        wrapper: 'flex-1 flex items-center justify-center p-8',
        iconContainer:
          'mx-auto mb-3 w-12 h-12 rounded-full bg-muted flex items-center justify-center',
        icon: 'h-6 w-6 text-muted-foreground/50',
        text: 'text-sm font-medium text-foreground',
        hint: 'text-xs text-muted-foreground mt-1',
      },
    };
    function getApprovalStatusBadgeClasses(status) {
      return APPROVAL_STATUS_BADGE_TOKENS[status] || APPROVAL_STATUS_BADGE_TOKENS.pending;
    }
    function getApprovalCardBorderClasses(status) {
      return APPROVAL_CARD_BORDER_TOKENS[status] || APPROVAL_CARD_BORDER_TOKENS.pending;
    }
    function getApprovalStepperNodeClasses(stepStatus) {
      return [
        APPROVAL_STEPPER_TOKENS.node.base,
        APPROVAL_STEPPER_TOKENS.node.size,
        APPROVAL_STEPPER_TOKENS.status[stepStatus],
      ].join(' ');
    }
    function getApprovalActionButtonClasses(action) {
      return APPROVAL_ACTION_BUTTON_TOKENS[action];
    }
    const APPROVAL_ELAPSED_DAYS_TOKENS = {
      base: 'font-mono tabular-nums text-sm',
      info: 'text-muted-foreground',
      warning: 'text-brand-warning font-medium',
      critical: 'text-brand-critical font-semibold',
      emergency: 'text-brand-critical font-semibold',
    };
    function getElapsedDaysClasses(elapsedDays) {
      const urgency = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getElapsedDaysUrgency'
      ])(elapsedDays);
      return [APPROVAL_ELAPSED_DAYS_TOKENS.base, APPROVAL_ELAPSED_DAYS_TOKENS[urgency]].join(' ');
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalKpiStrip', () => ApprovalKpiStrip]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-client] (ecmascript) <export default as ClipboardList>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/skeleton.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function KpiCard({ label, value, sub, icon: Icon, colorVariant, isLoading }) {
      const tokens =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'APPROVAL_KPI_STRIP_TOKENS'
        ];
      const isUrgent = colorVariant === 'urgent';
      const numValue = Number(value);
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(
            tokens.card.base,
            tokens.card.hover,
            tokens.card.hoverWash,
            tokens.card.focus,
            tokens.borderColors[colorVariant],
            tokens.hoverWashBg[colorVariant]
          ),
          tabIndex: 0,
          role: 'group',
          'aria-label': label,
          children: [
            isUrgent &&
              !isLoading &&
              numValue > 0 &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'div',
                {
                  className: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'cn'
                  ])(tokens.pulseDot.container, tokens.contentZ),
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'div',
                      {
                        className: tokens.pulseDot.dot,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                        lineNumber: 47,
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
                        className: tokens.pulseDot.ring,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                        lineNumber: 48,
                        columnNumber: 11,
                      },
                      this
                    ),
                  ],
                },
                void 0,
                true,
                {
                  fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                  lineNumber: 46,
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
                ])(tokens.iconContainer, tokens.iconBg[colorVariant], tokens.contentZ),
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  Icon,
                  {
                    className: 'h-4 w-4',
                    'aria-hidden': 'true',
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                    lineNumber: 52,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                lineNumber: 51,
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
                ])('flex-1 min-w-0', tokens.contentZ),
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: tokens.label,
                      children: label,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                      lineNumber: 55,
                      columnNumber: 9,
                    },
                    this
                  ),
                  isLoading
                    ? /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Skeleton'
                        ],
                        {
                          className: 'h-8 w-14 mt-0.5',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                          lineNumber: 57,
                          columnNumber: 11,
                        },
                        this
                      )
                    : /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: tokens.value,
                          children:
                            value === '0' || value === '-'
                              ? /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'span',
                                  {
                                    className: 'text-muted-foreground/40',
                                    children: value === '0' ? '–' : value,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                                    lineNumber: 61,
                                    columnNumber: 15,
                                  },
                                  this
                                )
                              : value,
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                          lineNumber: 59,
                          columnNumber: 11,
                        },
                        this
                      ),
                  sub &&
                    !isLoading &&
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'div',
                      {
                        className: tokens.sub,
                        children: sub,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                        lineNumber: 67,
                        columnNumber: 31,
                      },
                      this
                    ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                lineNumber: 54,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
          lineNumber: 31,
          columnNumber: 5,
        },
        this
      );
    }
    _c = KpiCard;
    function ApprovalKpiStrip({
      totalPending,
      urgentCount,
      avgWaitDays,
      todayProcessed,
      isLoading,
    }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'APPROVAL_KPI_STRIP_TOKENS'
            ].container,
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              KpiCard,
              {
                label: t('kpi.totalPending'),
                value: String(totalPending),
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__[
                  'ClipboardList'
                ],
                colorVariant: 'total',
                isLoading: isLoading,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                lineNumber: 92,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              KpiCard,
              {
                label: t('kpi.urgentCount'),
                value: String(urgentCount),
                sub: urgentCount > 0 ? t('kpi.urgentSub') : undefined,
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__[
                  'AlertTriangle'
                ],
                colorVariant: 'urgent',
                isLoading: isLoading,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                lineNumber: 99,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              KpiCard,
              {
                label: t('kpi.avgWait'),
                value: avgWaitDays > 0 ? String(avgWaitDays) : '-',
                sub: avgWaitDays > 0 ? t('kpi.dayUnit') : undefined,
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__[
                  'Clock'
                ],
                colorVariant: 'avgWait',
                isLoading: isLoading,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                lineNumber: 107,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              KpiCard,
              {
                label: t('kpi.todayProcessed'),
                value: todayProcessed !== null ? String(todayProcessed) : '-',
                sub: todayProcessed === null ? t('kpi.comingSoon') : undefined,
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__[
                  'CheckCircle2'
                ],
                colorVariant: 'processed',
                isLoading: isLoading,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
                lineNumber: 115,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx',
          lineNumber: 91,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalKpiStrip, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c1 = ApprovalKpiStrip;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'KpiCard');
    __turbopack_context__.k.register(_c1, 'ApprovalKpiStrip');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/approval-icons.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['APPROVAL_ICONS', () => APPROVAL_ICONS]);
    /**
     * 승인 카테고리 아이콘 매핑 — SSOT
     *
     * TAB_META[category].icon 문자열 → Lucide React 컴포넌트
     * ApprovalCategorySidebar, ApprovalMobileCategoryBar에서 공유
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/file-check.js [app-client] (ecmascript) <export default as FileCheck>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clipboard-check.js [app-client] (ecmascript) <export default as ClipboardCheck>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$from$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpFromLine$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/arrow-up-from-line.js [app-client] (ecmascript) <export default as ArrowUpFromLine>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$to$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownToLine$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/arrow-down-to-line.js [app-client] (ecmascript) <export default as ArrowDownToLine>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Code$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/code.js [app-client] (ecmascript) <export default as Code>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PackagePlus$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/package-plus.js [app-client] (ecmascript) <export default as PackagePlus>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$share$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Share2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/share-2.js [app-client] (ecmascript) <export default as Share2>'
      );
    const APPROVAL_ICONS = {
      Package:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__[
          'Package'
        ],
      FileCheck:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__[
          'FileCheck'
        ],
      ClipboardCheck:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__[
          'ClipboardCheck'
        ],
      ArrowUpFromLine:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$from$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpFromLine$3e$__[
          'ArrowUpFromLine'
        ],
      ArrowDownToLine:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$to$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownToLine$3e$__[
          'ArrowDownToLine'
        ],
      AlertTriangle:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__[
          'AlertTriangle'
        ],
      Trash2:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__[
          'Trash2'
        ],
      Calendar:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__[
          'Calendar'
        ],
      Code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Code$3e$__[
        'Code'
      ],
      PackagePlus:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PackagePlus$3e$__[
          'PackagePlus'
        ],
      Share2:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$share$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Share2$3e$__[
          'Share2'
        ],
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalCategorySidebar', () => ApprovalCategorySidebar]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/visual-feedback.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$approval$2d$icons$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/approval-icons.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ApprovalCategorySidebar({
      availableTabs,
      activeTab,
      pendingCounts,
      onTabChange,
      className,
    }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const tokens =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'APPROVAL_CATEGORY_SIDEBAR_TOKENS'
        ];
      // 섹션별 탭 그룹핑
      const sectionGroups = availableTabs.reduce((acc, tab) => {
        const section =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'TAB_META'
          ][tab].section;
        if (!acc[section]) acc[section] = [];
        acc[section].push(tab);
        return acc;
      }, {});
      // APPROVAL_SECTIONS.order로 정렬
      const sortedSections = Object.keys(sectionGroups).sort(
        (a, b) =>
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'APPROVAL_SECTIONS'
          ][a].order -
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'APPROVAL_SECTIONS'
          ][b].order
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'nav',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(tokens.container, className),
          role: 'navigation',
          'aria-label': t('sidebar.ariaLabel'),
          children: sortedSections.map((section, sectionIndex) =>
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
                        className: tokens.divider,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                        lineNumber: 62,
                        columnNumber: 32,
                      },
                      this
                    ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: tokens.sectionLabel,
                      children: t(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                          'APPROVAL_SECTIONS'
                        ][section].labelKey
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                      lineNumber: 63,
                      columnNumber: 11,
                    },
                    this
                  ),
                  sectionGroups[section].map((tab) => {
                    const meta =
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'TAB_META'
                      ][tab];
                    const count = pendingCounts?.[tab] ?? 0;
                    const isActive = activeTab === tab;
                    const urgency = (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'getCountBasedUrgency'
                    ])(count);
                    const isUrgent = urgency === 'critical' || urgency === 'emergency';
                    const IconComponent =
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$approval$2d$icons$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'APPROVAL_ICONS'
                      ][meta.icon];
                    return /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'button',
                      {
                        type: 'button',
                        onClick: () => onTabChange(tab),
                        className: (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                          'cn'
                        ])(
                          tokens.item.base,
                          isActive
                            ? `${tokens.item.active} ${tokens.item.activeBar}`
                            : tokens.item.inactive
                        ),
                        'aria-current': isActive ? 'page' : undefined,
                        children: [
                          IconComponent &&
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              IconComponent,
                              {
                                className: tokens.icon,
                                'aria-hidden': 'true',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                                lineNumber: 83,
                                columnNumber: 35,
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
                              children: t(`tabMeta.${tab}.label`),
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                              lineNumber: 84,
                              columnNumber: 17,
                            },
                            this
                          ),
                          count > 0 &&
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
                                  tokens.badge.base,
                                  isActive
                                    ? '' // active 상태에서는 primary-foreground 색상 상속
                                    : isUrgent
                                      ? tokens.badge.urgent
                                      : tokens.badge.normal
                                ),
                                children: count,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                                lineNumber: 86,
                                columnNumber: 19,
                              },
                              this
                            ),
                        ],
                      },
                      tab,
                      true,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                        lineNumber: 73,
                        columnNumber: 15,
                      },
                      this
                    );
                  }),
                ],
              },
              section,
              true,
              {
                fileName:
                  '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
                lineNumber: 61,
                columnNumber: 9,
              },
              this
            )
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx',
          lineNumber: 55,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalCategorySidebar, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalCategorySidebar;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalCategorySidebar');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalMobileCategoryBar', () => ApprovalMobileCategoryBar]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$approval$2d$icons$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/approval-icons.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ApprovalMobileCategoryBar({
      availableTabs,
      activeTab,
      pendingCounts,
      onTabChange,
      className,
    }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const tokens =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'APPROVAL_MOBILE_CATEGORY_BAR_TOKENS'
        ];
      // 섹션별 탭 그룹핑
      const sectionGroups = availableTabs.reduce((acc, tab) => {
        const section =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'TAB_META'
          ][tab].section;
        if (!acc[section]) acc[section] = [];
        acc[section].push(tab);
        return acc;
      }, {});
      const sortedSections = Object.keys(sectionGroups).sort(
        (a, b) =>
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'APPROVAL_SECTIONS'
          ][a].order -
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'APPROVAL_SECTIONS'
          ][b].order
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(tokens.container, className),
          role: 'tablist',
          'aria-label': t('mobileBar.ariaLabel'),
          children: sortedSections.map((section, sectionIndex) =>
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'contents',
                children: [
                  sectionIndex > 0 &&
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'div',
                      {
                        className: tokens.sectionDivider,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
                        lineNumber: 61,
                        columnNumber: 32,
                      },
                      this
                    ),
                  sectionGroups[section].map((tab) => {
                    const meta =
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                        'TAB_META'
                      ][tab];
                    const count = pendingCounts?.[tab] ?? 0;
                    const isActive = activeTab === tab;
                    const IconComponent =
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$approval$2d$icons$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'APPROVAL_ICONS'
                      ][meta.icon];
                    return /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'button',
                      {
                        type: 'button',
                        role: 'tab',
                        onClick: () => onTabChange(tab),
                        className: (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                          'cn'
                        ])(tokens.pill.base, isActive ? tokens.pill.active : tokens.pill.inactive),
                        'aria-selected': isActive,
                        children: [
                          IconComponent &&
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              IconComponent,
                              {
                                className: 'h-3.5 w-3.5',
                                'aria-hidden': 'true',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
                                lineNumber: 80,
                                columnNumber: 35,
                              },
                              this
                            ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'span',
                            {
                              children: t(`tabMeta.${tab}.label`),
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
                              lineNumber: 81,
                              columnNumber: 17,
                            },
                            this
                          ),
                          count > 0 &&
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: tokens.badge,
                                children: count,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
                                lineNumber: 82,
                                columnNumber: 31,
                              },
                              this
                            ),
                        ],
                      },
                      tab,
                      true,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
                        lineNumber: 69,
                        columnNumber: 15,
                      },
                      this
                    );
                  }),
                ],
              },
              section,
              true,
              {
                fileName:
                  '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
                lineNumber: 60,
                columnNumber: 9,
              },
              this
            )
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx',
          lineNumber: 54,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalMobileCategoryBar, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalMobileCategoryBar;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalMobileCategoryBar');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/checkbox.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Checkbox', () => Checkbox]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-checkbox/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const Checkbox =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Root'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
                className
              ),
              ...props,
              children: /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Indicator'
                ],
                {
                  className: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'cn'
                  ])('flex items-center justify-center text-current'),
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
                      fileName: '[project]/apps/frontend/components/ui/checkbox.tsx',
                      lineNumber: 24,
                      columnNumber: 7,
                    },
                    ('TURBOPACK compile-time value', void 0)
                  ),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/ui/checkbox.tsx',
                  lineNumber: 21,
                  columnNumber: 5,
                },
                ('TURBOPACK compile-time value', void 0)
              ),
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/checkbox.tsx',
              lineNumber: 13,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = Checkbox;
    Checkbox.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ].displayName;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'Checkbox$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Checkbox');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalRow.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalRow', () => ApprovalRow]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/badge.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/checkbox.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/tooltip.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/brand.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/visual-feedback.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ApprovalRow({
      item,
      isSelected,
      isMutating = false,
      isExiting = false,
      onToggleSelect,
      onApprove,
      onReject,
      onViewDetail,
      actionLabel,
    }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const elapsedDays = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'daysBetween'
      ])(item.requestedAt);
      const urgency = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$visual$2d$feedback$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getElapsedDaysUrgency'
      ])(elapsedDays);
      const tokens =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'APPROVAL_ROW_TOKENS'
        ];
      const meta =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'TAB_META'
        ][item.category];
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])(
            tokens.container.base,
            tokens.container.desktop,
            tokens.container.mobile,
            tokens.hover,
            tokens.urgencyBg[urgency],
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'APPROVAL_FOCUS'
            ].card,
            isMutating &&
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].processing,
            isExiting === 'success' &&
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].exitingSuccess,
            isExiting === 'reject' &&
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].exitingReject
          ),
          'data-testid': 'approval-item',
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'flex items-center justify-center',
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Checkbox'
                  ],
                  {
                    id: `select-${item.id}`,
                    checked: isSelected,
                    onCheckedChange: onToggleSelect,
                    'aria-label': `${item.summary} ${t('item.select')}`,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                    lineNumber: 76,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                lineNumber: 75,
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
                ])('hidden lg:block w-1 self-stretch rounded-full', tokens.urgencyBorder[urgency]),
                'aria-hidden': 'true',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                lineNumber: 85,
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
                className: 'min-w-0 space-y-1',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: 'flex items-center gap-2 flex-wrap',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Badge'
                          ],
                          {
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'getApprovalStatusBadgeClasses'
                              ])(item.status),
                              'text-xs'
                            ),
                            children:
                              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'UNIFIED_APPROVAL_STATUS_LABELS'
                              ][item.status] || item.status,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 96,
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
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              'text-sm font-medium truncate',
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'FONT'
                              ].heading
                            ),
                            children: item.summary,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 99,
                            columnNumber: 11,
                          },
                          this
                        ),
                        meta.multiStep &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'span',
                            {
                              className: tokens.stepBadge,
                              'aria-label': t('row.stepBadge'),
                              children:
                                item.approvalHistory && item.approvalHistory.length > 0
                                  ? `${'●'.repeat(item.approvalHistory.length)}${'○'.repeat(Math.max(0, (meta.multiStepType === 'disposal' ? 2 : 3) - item.approvalHistory.length))} ${item.approvalHistory.length}/${meta.multiStepType === 'disposal' ? 2 : 3}`
                                  : `○○${meta.multiStepType === 'calibration_plan' ? '○' : ''} 0/${meta.multiStepType === 'disposal' ? 2 : 3}`,
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                              lineNumber: 101,
                              columnNumber: 13,
                            },
                            this
                          ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                      lineNumber: 95,
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
                      className: 'flex items-center gap-3 text-xs text-muted-foreground lg:hidden',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'span',
                          {
                            children: item.requesterName,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 110,
                            columnNumber: 11,
                          },
                          this
                        ),
                        item.requesterTeam &&
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
                                    'aria-hidden': 'true',
                                    children: '·',
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                    lineNumber: 113,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'span',
                                  {
                                    children: item.requesterTeam,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                    lineNumber: 114,
                                    columnNumber: 15,
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
                            'aria-hidden': 'true',
                            children: '·',
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 117,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'time',
                          {
                            dateTime: item.requestedAt,
                            children: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'formatDate'
                            ])(item.requestedAt, 'yyyy-MM-dd'),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 118,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                      lineNumber: 109,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                lineNumber: 94,
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
                className: 'hidden lg:block min-w-0',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: 'text-sm truncate',
                      children: item.requesterName,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                      lineNumber: 124,
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
                      className: 'text-xs text-muted-foreground truncate',
                      children: item.requesterTeam || '-',
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                      lineNumber: 125,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                lineNumber: 123,
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
                className: 'hidden lg:block',
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'time',
                  {
                    dateTime: item.requestedAt,
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'text-sm',
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'FONT'
                      ].mono
                    ),
                    children: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'formatDate'
                    ])(item.requestedAt, 'MM-dd'),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                    lineNumber: 130,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                lineNumber: 129,
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
                className: 'hidden lg:block',
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'span',
                  {
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'getElapsedDaysClasses'
                    ])(elapsedDays),
                    children:
                      elapsedDays === 0
                        ? t('item.elapsedToday')
                        : `${elapsedDays}${t('kpi.dayUnit')}`,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                    lineNumber: 137,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                lineNumber: 136,
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
                className: tokens.actions.container,
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      className: 'hidden lg:flex items-center gap-1',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Tooltip'
                          ],
                          {
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'TooltipTrigger'
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
                                      type: 'button',
                                      size: 'icon',
                                      variant: 'ghost',
                                      onClick: onViewDetail,
                                      disabled: isMutating || !!isExiting,
                                      className: tokens.actions.iconButton,
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__[
                                            'Eye'
                                          ],
                                          {
                                            className: 'h-4 w-4',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                            lineNumber: 156,
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
                                            className: 'sr-only',
                                            children: t('row.tooltipDetail'),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                            lineNumber: 157,
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
                                        '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                      lineNumber: 148,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 147,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'TooltipContent'
                                ],
                                {
                                  children: t('row.tooltipDetail'),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 160,
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
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 146,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Tooltip'
                          ],
                          {
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'TooltipTrigger'
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
                                      type: 'button',
                                      size: 'icon',
                                      variant: 'ghost',
                                      onClick: onApprove,
                                      disabled: isMutating || !!isExiting,
                                      className: (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                        'cn'
                                      ])(
                                        tokens.actions.iconButton,
                                        (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'getApprovalActionButtonClasses'
                                        ])('approveIcon')
                                      ),
                                      'aria-busy': isMutating,
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__[
                                            'CheckCircle2'
                                          ],
                                          {
                                            className: 'h-4 w-4',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                            lineNumber: 176,
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
                                            className: 'sr-only',
                                            children: t('row.tooltipApprove'),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                            lineNumber: 177,
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
                                        '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                      lineNumber: 164,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 163,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'TooltipContent'
                                ],
                                {
                                  children: actionLabel,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 180,
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
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 162,
                            columnNumber: 11,
                          },
                          this
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Tooltip'
                          ],
                          {
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'TooltipTrigger'
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
                                      type: 'button',
                                      size: 'icon',
                                      variant: 'ghost',
                                      onClick: onReject,
                                      disabled: isMutating || !!isExiting,
                                      className: (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                        'cn'
                                      ])(
                                        tokens.actions.iconButton,
                                        (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'getApprovalActionButtonClasses'
                                        ])('rejectIcon')
                                      ),
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
                                            'XCircle'
                                          ],
                                          {
                                            className: 'h-4 w-4',
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                            lineNumber: 195,
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
                                            className: 'sr-only',
                                            children: t('row.tooltipReject'),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                            lineNumber: 196,
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
                                        '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                      lineNumber: 184,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 183,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'TooltipContent'
                                ],
                                {
                                  children: t('item.reject'),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 199,
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
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 182,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                      lineNumber: 145,
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
                      className: 'flex items-center gap-2 lg:hidden',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'Button'
                          ],
                          {
                            type: 'button',
                            size: 'sm',
                            variant: 'outline',
                            onClick: onViewDetail,
                            disabled: isMutating || !!isExiting,
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__[
                                  'Eye'
                                ],
                                {
                                  className: 'h-4 w-4 mr-1',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 212,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              t('item.detail'),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 205,
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
                            type: 'button',
                            size: 'sm',
                            onClick: onApprove,
                            disabled: isMutating || !!isExiting,
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'getApprovalActionButtonClasses'
                            ])('approve'),
                            'aria-busy': isMutating,
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__[
                                  'CheckCircle2'
                                ],
                                {
                                  className: 'h-4 w-4 mr-1',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 223,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              actionLabel,
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 215,
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
                            type: 'button',
                            size: 'sm',
                            variant: 'outline',
                            onClick: onReject,
                            disabled: isMutating || !!isExiting,
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'getApprovalActionButtonClasses'
                            ])('reject'),
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
                                  'XCircle'
                                ],
                                {
                                  className: 'h-4 w-4 mr-1',
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                                  lineNumber: 234,
                                  columnNumber: 13,
                                },
                                this
                              ),
                              t('item.reject'),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                            lineNumber: 226,
                            columnNumber: 11,
                          },
                          this
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
                      lineNumber: 204,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
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
          fileName: '[project]/apps/frontend/components/approvals/ApprovalRow.tsx',
          lineNumber: 60,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalRow, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalRow;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalRow');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalList.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalList', () => ApprovalList]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/skeleton.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalRow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalRow.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ApprovalList({
      items,
      isLoading,
      selectedItems,
      processingIds,
      exitingIds,
      onToggleSelect,
      onApprove,
      onReject,
      onViewDetail,
      actionLabel,
      todayProcessed,
    }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      if (isLoading) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          'div',
          {
            className: 'border border-border rounded-lg overflow-hidden',
            children: [
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'div',
                {
                  className:
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'APPROVAL_ROW_TOKENS'
                    ].container.header,
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'Skeleton'
                      ],
                      {
                        className: 'h-4 w-4',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 50,
                        columnNumber: 11,
                      },
                      this
                    ),
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'div',
                      {},
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 51,
                        columnNumber: 11,
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
                        className: 'h-4 w-20',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 52,
                        columnNumber: 11,
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
                        className: 'h-4 w-16',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 53,
                        columnNumber: 11,
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
                        className: 'h-4 w-12',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 54,
                        columnNumber: 11,
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
                        className: 'h-4 w-10',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 55,
                        columnNumber: 11,
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
                        className: 'h-4 w-16',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                        lineNumber: 56,
                        columnNumber: 11,
                      },
                      this
                    ),
                  ],
                },
                void 0,
                true,
                {
                  fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                  lineNumber: 49,
                  columnNumber: 9,
                },
                this
              ),
              Array.from({
                length: 5,
              }).map((_, i) =>
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_ROW_TOKENS'].container.base} ${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_ROW_TOKENS'].container.desktop}`,
                    style: {
                      animationDelay:
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'APPROVAL_MOTION'
                        ].listStagger(i),
                    },
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Skeleton'
                        ],
                        {
                          className: 'h-4 w-4',
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 65,
                          columnNumber: 13,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {},
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 66,
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
                          className: 'space-y-1',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Skeleton'
                              ],
                              {
                                className: 'h-5 w-48',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                                lineNumber: 68,
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
                                className: 'h-3 w-32',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                                lineNumber: 69,
                                columnNumber: 15,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 67,
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
                          className: 'h-5 w-24 hidden lg:block',
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 71,
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
                          className: 'h-5 w-16 hidden lg:block',
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 72,
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
                          className: 'h-5 w-12 hidden lg:block',
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 73,
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
                          className: 'h-5 w-20 hidden lg:block',
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 74,
                          columnNumber: 13,
                        },
                        this
                      ),
                    ],
                  },
                  i,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                    lineNumber: 60,
                    columnNumber: 11,
                  },
                  this
                )
              ),
            ],
          },
          void 0,
          true,
          {
            fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
            lineNumber: 47,
            columnNumber: 7,
          },
          this
        );
      }
      if (items.length === 0) {
        const tokens =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'APPROVAL_EMPTY_STATE_TOKENS'
          ];
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          'div',
          {
            className: `border border-border rounded-lg ${tokens.container} ${tokens.bgGradient}`,
            role: 'status',
            'aria-live': 'polite',
            children: [
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'div',
                {
                  className: `${tokens.iconRing} ${tokens.iconRingExpand}`,
                  children: /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__[
                      'CheckCircle2'
                    ],
                    {
                      className: tokens.icon,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 90,
                      columnNumber: 11,
                    },
                    this
                  ),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                  lineNumber: 89,
                  columnNumber: 9,
                },
                this
              ),
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'p',
                {
                  className: tokens.title,
                  children: t('list.allClear'),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                  lineNumber: 92,
                  columnNumber: 9,
                },
                this
              ),
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'p',
                {
                  className: tokens.description,
                  children: t('list.empty'),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                  lineNumber: 93,
                  columnNumber: 9,
                },
                this
              ),
              todayProcessed !== null &&
                todayProcessed !== undefined &&
                todayProcessed > 0 &&
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: tokens.stat.container,
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: tokens.stat.label,
                          children: t('kpi.todayProcessed'),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                          lineNumber: 96,
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
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: tokens.stat.value,
                                children: todayProcessed,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                                lineNumber: 98,
                                columnNumber: 15,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'span',
                              {
                                className: tokens.stat.unit,
                                children: t('list.countUnit'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                                lineNumber: 99,
                                columnNumber: 15,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
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
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                    lineNumber: 95,
                    columnNumber: 11,
                  },
                  this
                ),
            ],
          },
          void 0,
          true,
          {
            fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
            lineNumber: 84,
            columnNumber: 7,
          },
          this
        );
      }
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: 'border border-border rounded-lg overflow-hidden',
          'data-testid': 'approval-list',
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className:
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'APPROVAL_ROW_TOKENS'
                  ].container.header,
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {},
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 111,
                      columnNumber: 9,
                    },
                    this
                  ),
                  ' ',
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {},
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 112,
                      columnNumber: 9,
                    },
                    this
                  ),
                  ' ',
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    'div',
                    {
                      children: t('row.colSummary'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 113,
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
                      children: t('item.requester'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 114,
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
                      children: t('item.requestDate'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 115,
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
                      children: t('item.elapsedLabel'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 116,
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
                      children: t('row.colActions'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 117,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                lineNumber: 110,
                columnNumber: 7,
              },
              this
            ),
            items.map((item, index) =>
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'div',
                {
                  className: `${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_MOTION'].listItemEnter} [content-visibility:auto] [contain-intrinsic-size:0_64px]`,
                  style: {
                    animationDelay:
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'APPROVAL_MOTION'
                      ].listStagger(index),
                  },
                  children: /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalRow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'ApprovalRow'
                    ],
                    {
                      item: item,
                      isSelected: selectedItems.includes(item.id),
                      isMutating: processingIds.has(item.id),
                      isExiting: exitingIds.get(item.id) || false,
                      onToggleSelect: () => onToggleSelect(item.id),
                      onApprove: () => onApprove(item),
                      onReject: () => onReject(item),
                      onViewDetail: () => onViewDetail(item),
                      actionLabel: actionLabel,
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                      lineNumber: 127,
                      columnNumber: 11,
                    },
                    this
                  ),
                },
                item.id,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
                  lineNumber: 122,
                  columnNumber: 9,
                },
                this
              )
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalList.tsx',
          lineNumber: 108,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalList, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalList;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalList');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['BulkActionBar', () => BulkActionBar]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/checkbox.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/alert-dialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/textarea.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/label.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function BulkActionBar({
      selectedCount,
      totalCount,
      onSelectAll,
      onBulkApprove,
      onBulkReject,
      actionLabel,
    }) {
      _s();
      const [isApproveDialogOpen, setIsApproveDialogOpen] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const [isRejectDialogOpen, setIsRejectDialogOpen] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const [rejectReason, setRejectReason] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])('');
      const [isProcessing, setIsProcessing] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const isAllSelected = selectedCount === totalCount && totalCount > 0;
      const hasSelection = selectedCount > 0;
      const handleBulkApprove = async () => {
        setIsProcessing(true);
        try {
          await onBulkApprove();
          setIsApproveDialogOpen(false);
        } finally {
          setIsProcessing(false);
        }
      };
      const handleBulkReject = async () => {
        if (
          !rejectReason.trim() ||
          rejectReason.length <
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'REJECTION_MIN_LENGTH'
            ]
        ) {
          return;
        }
        setIsProcessing(true);
        try {
          await onBulkReject(rejectReason);
          setIsRejectDialogOpen(false);
          setRejectReason('');
        } finally {
          setIsProcessing(false);
        }
      };
      if (totalCount === 0) {
        return null;
      }
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: `flex items-center justify-between py-3 px-4 rounded-lg ${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_BULK_BAR_TOKENS'].container}`,
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'flex items-center gap-3',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'Checkbox'
                    ],
                    {
                      id: 'select-all',
                      checked: isAllSelected,
                      onCheckedChange: onSelectAll,
                      'aria-label': isAllSelected ? t('bulk.deselectAll') : t('bulk.selectAll'),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                      lineNumber: 84,
                      columnNumber: 9,
                    },
                    this
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'Label'
                    ],
                    {
                      htmlFor: 'select-all',
                      className: 'text-sm cursor-pointer',
                      children: [t('bulk.selectAll'), ' (', selectedCount, '/', totalCount, ')'],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                      lineNumber: 90,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                lineNumber: 83,
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
                className: 'flex gap-2',
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'Button'
                    ],
                    {
                      type: 'button',
                      size: 'sm',
                      disabled: !hasSelection,
                      onClick: () => setIsApproveDialogOpen(true),
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getApprovalActionButtonClasses'
                      ])('approve'),
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__[
                            'CheckCircle2'
                          ],
                          {
                            className: 'h-4 w-4 mr-1',
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                            lineNumber: 104,
                            columnNumber: 11,
                          },
                          this
                        ),
                        t('bulk.action', {
                          action: actionLabel,
                        }),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                      lineNumber: 97,
                      columnNumber: 9,
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
                      type: 'button',
                      size: 'sm',
                      variant: 'outline',
                      disabled: !hasSelection,
                      onClick: () => setIsRejectDialogOpen(true),
                      className: (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getApprovalActionButtonClasses'
                      ])('reject'),
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
                            'XCircle'
                          ],
                          {
                            className: 'h-4 w-4 mr-1',
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                            lineNumber: 115,
                            columnNumber: 11,
                          },
                          this
                        ),
                        t('bulk.reject'),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                      lineNumber: 107,
                      columnNumber: 9,
                    },
                    this
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                lineNumber: 96,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'AlertDialog'
              ],
              {
                open: isApproveDialogOpen,
                onOpenChange: setIsApproveDialogOpen,
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'AlertDialogContent'
                  ],
                  {
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogHeader'
                        ],
                        {
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogTitle'
                              ],
                              {
                                children: t('bulk.confirmTitle', {
                                  action: actionLabel,
                                }),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 124,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogDescription'
                              ],
                              {
                                children: t('bulk.confirmDescription', {
                                  action: actionLabel,
                                  count: selectedCount,
                                }),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 125,
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
                            '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                          lineNumber: 123,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogFooter'
                        ],
                        {
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogCancel'
                              ],
                              {
                                disabled: isProcessing,
                                children: t('actions.cancel'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 130,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogAction'
                              ],
                              {
                                onClick: handleBulkApprove,
                                disabled: isProcessing,
                                className: (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'getApprovalActionButtonClasses'
                                ])('approve'),
                                children: isProcessing ? t('processing') : actionLabel,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 131,
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
                            '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                          lineNumber: 129,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                    lineNumber: 122,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                lineNumber: 121,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'AlertDialog'
              ],
              {
                open: isRejectDialogOpen,
                onOpenChange: setIsRejectDialogOpen,
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'AlertDialogContent'
                  ],
                  {
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogHeader'
                        ],
                        {
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogTitle'
                              ],
                              {
                                children: t('bulk.reject'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 146,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogDescription'
                              ],
                              {
                                children: t('bulk.rejectDescription', {
                                  count: selectedCount,
                                }),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 147,
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
                            '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                          lineNumber: 145,
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
                          className: 'py-4',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Label'
                              ],
                              {
                                htmlFor: 'bulk-reject-reason',
                                children: t('rejectModal.reasonLabel'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 152,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Textarea'
                              ],
                              {
                                id: 'bulk-reject-reason',
                                placeholder: t('rejectModal.reasonPlaceholder'),
                                value: rejectReason,
                                onChange: (e) => setRejectReason(e.target.value),
                                className: 'mt-2 min-h-[100px]',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 153,
                                columnNumber: 13,
                              },
                              this
                            ),
                            rejectReason.length > 0 &&
                              rejectReason.length <
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                  'REJECTION_MIN_LENGTH'
                                ] &&
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'p',
                                {
                                  className: 'text-sm text-destructive mt-1',
                                  role: 'alert',
                                  children: [
                                    t('bulk.rejectValidation'),
                                    ' (',
                                    rejectReason.length,
                                    '/10)',
                                  ],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                  lineNumber: 161,
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
                            '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                          lineNumber: 151,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogFooter'
                        ],
                        {
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogCancel'
                              ],
                              {
                                disabled: isProcessing,
                                children: t('actions.cancel'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 167,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogAction'
                              ],
                              {
                                onClick: handleBulkReject,
                                disabled:
                                  isProcessing ||
                                  rejectReason.length <
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                      'REJECTION_MIN_LENGTH'
                                    ],
                                className: (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'getApprovalActionButtonClasses'
                                ])('reject'),
                                children: isProcessing ? t('processing') : t('actions.reject'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                                lineNumber: 168,
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
                            '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                          lineNumber: 166,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
                    lineNumber: 144,
                    columnNumber: 9,
                  },
                  this
                ),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
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
          fileName: '[project]/apps/frontend/components/approvals/BulkActionBar.tsx',
          lineNumber: 79,
          columnNumber: 5,
        },
        this
      );
    }
    _s(BulkActionBar, 'MOKO7AEKdckFAg38GQAnUvTFhSg=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = BulkActionBar;
    var _c;
    __turbopack_context__.k.register(_c, 'BulkActionBar');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/separator.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Separator', () => Separator]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-separator/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const Separator =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Root'
            ],
            {
              ref: ref,
              decorative: decorative,
              orientation: orientation,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'shrink-0 bg-border',
                orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/separator.tsx',
              lineNumber: 16,
              columnNumber: 5,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = Separator;
    Separator.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ].displayName;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'Separator$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Separator');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalStepIndicator', () => ApprovalStepIndicator]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    // 폐기: 2단계
    const disposalSteps = [
      {
        key: 'pending_review',
        labelKey: 'steps.request',
        roleKey: 'steps.roles.test_engineer',
      },
      {
        key: 'reviewed',
        labelKey: 'steps.review',
        roleKey: 'steps.roles.technical_manager',
      },
      {
        key: 'approved',
        labelKey: 'steps.approve',
        roleKey: 'steps.roles.lab_manager',
      },
    ];
    // 교정계획서: 3단계
    const planSteps = [
      {
        key: 'pending_review',
        labelKey: 'steps.draft',
        roleKey: 'steps.roles.technical_manager',
      },
      {
        key: 'reviewed',
        labelKey: 'steps.review',
        roleKey: 'steps.roles.quality_manager',
      },
      {
        key: 'approved',
        labelKey: 'steps.approve',
        roleKey: 'steps.roles.lab_manager',
      },
    ];
    const STATUS_ORDER = {
      pending: 0,
      pending_review: 1,
      reviewed: 2,
      approved: 3,
      rejected: -1,
    };
    function ApprovalStepIndicator({ type, currentStatus, history }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const steps = type === 'disposal' ? disposalSteps : planSteps;
      const currentOrder = STATUS_ORDER[currentStatus] ?? 0;
      const isRejected =
        currentStatus ===
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'UnifiedApprovalStatusValues'
        ].REJECTED;
      // 각 단계에 해당하는 이력 찾기
      const getHistoryForStep = (stepIndex) => {
        return history?.find((h) => h.step === stepIndex + 1);
      };
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: 'flex items-center gap-2 py-3',
          role: 'group',
          'aria-label': t('steps.ariaLabel'),
          'data-testid': 'step-indicator',
          children: steps.map((step, index) => {
            const stepOrder = index + 1;
            const isCompleted = !isRejected && currentOrder >= stepOrder;
            const isCurrent = currentOrder === stepOrder && !isRejected;
            const historyEntry = getHistoryForStep(index);
            const stepperStatus =
              isRejected && isCurrent
                ? 'rejected'
                : isCompleted
                  ? 'completed'
                  : isCurrent
                    ? 'current'
                    : 'pending';
            return /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: 'flex items-center',
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
                        (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'getApprovalStepperNodeClasses'
                        ])(stepperStatus),
                        (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'getTransitionClasses'
                        ])('fast', ['border-color', 'background-color', 'color'])
                      ),
                      'aria-current': isCurrent ? 'step' : undefined,
                      children:
                        isRejected && isCurrent
                          ? /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
                                'XCircle'
                              ],
                              {
                                className:
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'APPROVAL_STEPPER_TOKENS'
                                  ].icon,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                                lineNumber: 96,
                                columnNumber: 17,
                              },
                              this
                            )
                          : isCompleted
                            ? /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__[
                                  'Check'
                                ],
                                {
                                  className:
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'APPROVAL_STEPPER_TOKENS'
                                    ].icon,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                                  lineNumber: 98,
                                  columnNumber: 17,
                                },
                                this
                              )
                            : /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__[
                                  'Clock'
                                ],
                                {
                                  className:
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'APPROVAL_STEPPER_TOKENS'
                                    ].icon,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                                  lineNumber: 100,
                                  columnNumber: 17,
                                },
                                this
                              ),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                      lineNumber: 88,
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
                      className: `ml-2 ${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_STEPPER_TOKENS'].infoWidth}`,
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'p',
                          {
                            className: (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                              'cn'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'APPROVAL_STEPPER_TOKENS'
                              ].label.base,
                              isCurrent
                                ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'APPROVAL_STEPPER_TOKENS'
                                  ].label.current
                                : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'APPROVAL_STEPPER_TOKENS'
                                  ].label.inactive
                            ),
                            children: t(step.labelKey),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                            lineNumber: 106,
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
                            className: 'text-xs text-muted-foreground',
                            children: t(step.roleKey),
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                            lineNumber: 116,
                            columnNumber: 15,
                          },
                          this
                        ),
                        historyEntry &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'p',
                            {
                              className: 'text-xs text-muted-foreground/70 truncate max-w-[100px]',
                              children: historyEntry.actorName,
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                              lineNumber: 118,
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
                        '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                      lineNumber: 105,
                      columnNumber: 13,
                    },
                    this
                  ),
                  index < steps.length - 1 &&
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
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'APPROVAL_STEPPER_TOKENS'
                          ].connector.base,
                          currentOrder > stepOrder
                            ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'APPROVAL_STEPPER_TOKENS'
                              ].connector.completed
                            : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'APPROVAL_STEPPER_TOKENS'
                              ].connector.pending
                        ),
                        'aria-hidden': 'true',
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                        lineNumber: 126,
                        columnNumber: 15,
                      },
                      this
                    ),
                ],
              },
              step.key,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
                lineNumber: 86,
                columnNumber: 11,
              },
              this
            );
          }),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx',
          lineNumber: 64,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalStepIndicator, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalStepIndicator;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalStepIndicator');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalHistoryCard', () => ApprovalHistoryCard]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    const ACTION_ICONS = {
      review:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__[
          'Eye'
        ],
      approve:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__[
          'Check'
        ],
      reject:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
          'XCircle'
        ],
    };
    function ApprovalHistoryCard({ history }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const actionLabels = {
        review: t('history.reviewCompleted'),
        approve: t('history.approved'),
        reject: t('history.rejected'),
      };
      if (!history || history.length === 0) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          'p',
          {
            className: 'text-sm text-muted-foreground text-center py-4',
            children: t('history.empty'),
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
            lineNumber: 30,
            columnNumber: 12,
          },
          this
        );
      }
      // 시간순 정렬 (최신이 아래로)
      const sortedHistory = [...history].sort(
        (a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime()
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: 'space-y-3',
          children: sortedHistory.map((entry, index) => {
            const IconComponent =
              ACTION_ICONS[entry.action] ||
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__[
                'Eye'
              ];
            const actionStyle =
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_TIMELINE_TOKENS'
              ].iconBadge[entry.action] ||
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_TIMELINE_TOKENS'
              ].iconBadge.review;
            return /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'div',
              {
                className: (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'cn'
                ])(
                  'relative pl-8 pb-4',
                  index < sortedHistory.length - 1 &&
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'APPROVAL_TIMELINE_TOKENS'
                    ].connector
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
                        'absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full',
                        actionStyle
                      ),
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        IconComponent,
                        {
                          className: 'h-3 w-3',
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                          lineNumber: 62,
                          columnNumber: 15,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName:
                        '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                      lineNumber: 56,
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
                      className: 'bg-muted/50 rounded-lg p-3 ml-2',
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className: 'flex items-center justify-between mb-1',
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'span',
                                {
                                  className: 'font-medium text-sm',
                                  children: actionLabels[entry.action] || entry.action,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                                  lineNumber: 68,
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
                                  className: 'text-xs text-muted-foreground',
                                  children: (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'formatDate'
                                  ])(entry.actionAt, 'yyyy-MM-dd HH:mm'),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                                  lineNumber: 71,
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
                              '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                            lineNumber: 67,
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
                            children: [entry.actorName, ' (', entry.actorRole, ')'],
                          },
                          void 0,
                          true,
                          {
                            fileName:
                              '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                            lineNumber: 75,
                            columnNumber: 15,
                          },
                          this
                        ),
                        entry.comment &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'p',
                            {
                              className: `mt-2 text-sm italic ${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_TIMELINE_TOKENS'].blockquote}`,
                              children: ['"', entry.comment, '"'],
                            },
                            void 0,
                            true,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                              lineNumber: 79,
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
                        '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                      lineNumber: 66,
                      columnNumber: 13,
                    },
                    this
                  ),
                ],
              },
              `${entry.step}-${entry.actionAt}`,
              true,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
                lineNumber: 48,
                columnNumber: 11,
              },
              this
            );
          }),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx',
          lineNumber: 39,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalHistoryCard, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalHistoryCard;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalHistoryCard');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/detail-renderers.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CategoryBadge',
      () => CategoryBadge,
      'CategoryDetails',
      () => CategoryDetails,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/badge.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature();
    ('use client');
    // ============================================================================
    // 공통 컴포넌트
    // ============================================================================
    function DetailRow({ label, value }) {
      if (value === null || value === undefined || value === '') return null;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: 'flex justify-between py-2',
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'span',
              {
                className: 'text-muted-foreground',
                children: label,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 23,
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
                className: 'font-medium text-right max-w-[60%]',
                children: String(value),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 24,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
          lineNumber: 22,
          columnNumber: 5,
        },
        this
      );
    }
    _c = DetailRow;
    function DateRow({ label, value }) {
      if (!value || typeof value !== 'string') return null;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        DetailRow,
        {
          label: label,
          value: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'formatDate'
          ])(value, 'yyyy-MM-dd'),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
          lineNumber: 31,
          columnNumber: 10,
        },
        this
      );
    }
    _c1 = DateRow;
    /**
     * SSOT 라벨을 적용한 DetailRow
     * labels 맵에서 value를 찾아 라벨로 변환, 없으면 원본 표시
     */ function LabeledRow({ label, value, labels }) {
      if (value === null || value === undefined || value === '') return null;
      const key = String(value);
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        DetailRow,
        {
          label: label,
          value: labels[key] || key,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
          lineNumber: 49,
          columnNumber: 10,
        },
        this
      );
    }
    _c2 = LabeledRow;
    function CategoryBadge({ category }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      const meta =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'TAB_META'
        ][category];
      if (!meta) return null;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Badge'
        ],
        {
          variant: 'outline',
          className: 'text-xs',
          children: t(meta.labelKey),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
          lineNumber: 63,
          columnNumber: 5,
        },
        this
      );
    }
    _s(CategoryBadge, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c3 = CategoryBadge;
    // ============================================================================
    // 카테고리별 렌더러 (t 함수를 통해 i18n 적용)
    // ============================================================================
    /** 장비 등록/수정/삭제 */ function renderEquipmentDetails(details, t) {
      const requestTypeLabels = {
        create: t('requestTypes.create'),
        update: t('requestTypes.update'),
        delete: t('requestTypes.delete'),
      };
      const requestType = String(details.requestType || '');
      // equipment 객체에서 장비 정보 추출
      const eq = details.equipment;
      // requestData에서 추가 정보 추출 (신규 등록 시 equipment가 없을 수 있음)
      let requestData = null;
      if (details.requestData) {
        try {
          requestData =
            typeof details.requestData === 'string'
              ? JSON.parse(details.requestData)
              : details.requestData;
        } catch {
          // JSON 파싱 실패 무시
        }
      }
      const name = eq?.name || requestData?.name || requestData?.equipmentName;
      const managementNumber = eq?.managementNumber || requestData?.managementNumber;
      const modelName = eq?.modelName || requestData?.modelName;
      const serialNumber = eq?.serialNumber || requestData?.serialNumber;
      const manufacturer = eq?.manufacturer || requestData?.manufacturer;
      const purchaseYear = eq?.purchaseYear || requestData?.purchaseYear;
      const description = eq?.description || requestData?.description;
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
              LabeledRow,
              {
                label: t('detailRows.type'),
                value: requestType,
                labels: requestTypeLabels,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 109,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.managementNumber'),
                value: managementNumber,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 110,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.equipmentName'),
                value: name,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 111,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.modelName'),
                value: modelName,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 112,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.serialNumber'),
                value: serialNumber,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 113,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.manufacturer'),
                value: manufacturer,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 114,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.purchaseYear'),
                value: purchaseYear,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 115,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.specification'),
                value: description,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 116,
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
    /** 교정 기록 */ function renderCalibrationDetails(details, t) {
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
              DetailRow,
              {
                label: t('detailRows.equipmentId'),
                value: details.equipmentId,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 125,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DateRow,
              {
                label: t('detailRows.calibrationDate'),
                value: details.calibrationDate,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 126,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DateRow,
              {
                label: t('detailRows.nextCalibrationDate'),
                value: details.nextCalibrationDate,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 127,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              LabeledRow,
              {
                label: t('detailRows.calibrationResult'),
                value: details.result,
                labels:
                  __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'CALIBRATION_RESULT_LABELS'
                  ],
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 128,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.calibrationOrganization'),
                value: details.calibrationAgency,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 133,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.certificateNumber'),
                value: details.certificateNumber,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 137,
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
    /** 반출 / 반입 / 공용장비 */ function renderCheckoutDetails(details, t) {
      // equipment 배열에서 장비 이름 목록 추출
      const equipmentList = details.equipment;
      const equipmentNames = equipmentList
        ?.map((e) => e.name || e.managementNumber)
        .filter(Boolean)
        .join(', ');
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            equipmentNames &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                DetailRow,
                {
                  label: t('detailRows.equipment'),
                  value: equipmentNames,
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                  lineNumber: 153,
                  columnNumber: 26,
                },
                this
              ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              LabeledRow,
              {
                label: t('detailRows.checkoutPurpose'),
                value: details.purpose,
                labels:
                  __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'CHECKOUT_PURPOSE_LABELS'
                  ],
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 154,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.destination'),
                value: details.destination,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 159,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DateRow,
              {
                label: t('detailRows.expectedReturnDate'),
                value: details.expectedReturnDate,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 160,
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
    /** 부적합 재개 */ function renderNonConformityDetails(details, t) {
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
              DetailRow,
              {
                label: t('detailRows.equipmentId'),
                value: details.equipmentId,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 169,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              LabeledRow,
              {
                label: t('detailRows.ncType'),
                value: details.ncType,
                labels:
                  __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'NON_CONFORMANCE_TYPE_LABELS'
                  ],
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 170,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.cause'),
                value: details.cause,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 175,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.correctionContent'),
                value: details.correctionContent,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 176,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DateRow,
              {
                label: t('detailRows.correctionDate'),
                value: details.correctionDate,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 177,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.actionPlan'),
                value: details.actionPlan,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 178,
                columnNumber: 7,
              },
              this
            ),
            details.rejectionReason &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                'div',
                {
                  className: `mt-2 pt-2 ${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['APPROVAL_TIMELINE_TOKENS'].rejectionBorder}`,
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      DetailRow,
                      {
                        label: t('detailRows.previousRejectionReason'),
                        value: details.rejectionReason,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                        lineNumber: 181,
                        columnNumber: 11,
                      },
                      this
                    ),
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      DateRow,
                      {
                        label: t('detailRows.rejectionDate'),
                        value: details.rejectedAt,
                      },
                      void 0,
                      false,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                        lineNumber: 185,
                        columnNumber: 11,
                      },
                      this
                    ),
                  ],
                },
                void 0,
                true,
                {
                  fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                  lineNumber: 180,
                  columnNumber: 9,
                },
                this
              ),
          ],
        },
        void 0,
        true
      );
    }
    /** 폐기 검토 / 최종 승인 */ function renderDisposalDetails(details, isFinal, t) {
      const eq = details.equipment;
      const equipmentLabel = eq
        ? `${eq.name || ''}${eq.managementNumber ? ` (${eq.managementNumber})` : ''}`
        : undefined;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            equipmentLabel &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                DetailRow,
                {
                  label: t('detailRows.equipment'),
                  value: equipmentLabel,
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                  lineNumber: 201,
                  columnNumber: 26,
                },
                this
              ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              LabeledRow,
              {
                label: t('detailRows.disposalReason'),
                value: details.reason,
                labels:
                  __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'DISPOSAL_REASON_LABELS'
                  ],
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 202,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.detailedReason'),
                value: details.reasonDetail,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 207,
                columnNumber: 7,
              },
              this
            ),
            isFinal &&
              details.reviewOpinion &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                DetailRow,
                {
                  label: t('detailRows.reviewOpinion'),
                  value: details.reviewOpinion,
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                  lineNumber: 209,
                  columnNumber: 9,
                },
                this
              ),
            isFinal &&
              details.reviewedAt &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                DateRow,
                {
                  label: t('detailRows.reviewDate'),
                  value: details.reviewedAt,
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                  lineNumber: 212,
                  columnNumber: 9,
                },
                this
              ),
          ],
        },
        void 0,
        true
      );
    }
    /** 교정계획서 검토 / 최종 승인 */ function renderPlanDetails(details, t) {
      const site = details.site;
      const siteName = site?.name;
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
              DetailRow,
              {
                label: t('detailRows.year'),
                value: details.year,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 225,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.site'),
                value: siteName,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 226,
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
    /** 소프트웨어 */ function renderSoftwareDetails(details, t) {
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
              DetailRow,
              {
                label: t('detailRows.softwareName'),
                value: details.softwareName,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 235,
                columnNumber: 7,
              },
              this
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DetailRow,
              {
                label: t('detailRows.changeReason'),
                value: details.changeReason || details.reason,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 236,
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
    /** 중간점검 */ function renderInspectionDetails(details, t) {
      const equipment = details.equipment;
      const equipmentName = equipment?.name;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            equipmentName &&
              /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                DetailRow,
                {
                  label: t('detailRows.equipment'),
                  value: equipmentName,
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                  lineNumber: 251,
                  columnNumber: 25,
                },
                this
              ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              DateRow,
              {
                label: t('detailRows.inspectionDate'),
                value: details.nextIntermediateCheckDate,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                lineNumber: 252,
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
    function CategoryDetails({ category, details }) {
      _s1();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      switch (category) {
        case 'equipment':
          return renderEquipmentDetails(details, t);
        case 'calibration':
          return renderCalibrationDetails(details, t);
        case 'outgoing':
        case 'incoming':
          return renderCheckoutDetails(details, t);
        case 'nonconformity':
          return renderNonConformityDetails(details, t);
        case 'disposal_review':
          return renderDisposalDetails(details, false, t);
        case 'disposal_final':
          return renderDisposalDetails(details, true, t);
        case 'plan_review':
        case 'plan_final':
          return renderPlanDetails(details, t);
        case 'software':
          return renderSoftwareDetails(details, t);
        case 'inspection':
          return renderInspectionDetails(details, t);
        default:
          // 알 수 없는 카테고리: fallback으로 기본 Object.entries 렌더링
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Fragment'
            ],
            {
              children: Object.entries(details)
                .filter(
                  ([, value]) => value !== null && value !== undefined && typeof value !== 'object'
                )
                .map(([key, value]) =>
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    DetailRow,
                    {
                      label: key,
                      value: value,
                    },
                    key,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/detail-renderers.tsx',
                      lineNumber: 306,
                      columnNumber: 15,
                    },
                    this
                  )
                ),
            },
            void 0,
            false
          );
      }
    }
    _s1(CategoryDetails, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c4 = CategoryDetails;
    var _c, _c1, _c2, _c3, _c4;
    __turbopack_context__.k.register(_c, 'DetailRow');
    __turbopack_context__.k.register(_c1, 'DateRow');
    __turbopack_context__.k.register(_c2, 'LabeledRow');
    __turbopack_context__.k.register(_c3, 'CategoryBadge');
    __turbopack_context__.k.register(_c4, 'CategoryDetails');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => ApprovalDetailModal]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/badge.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/separator.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) <export default as Download>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalStepIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalStepIndicator.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalHistoryCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalHistoryCard.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$detail$2d$renderers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/detail-renderers.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ApprovalDetailModal({ item, isOpen, onClose, onApprove, onReject, actionLabel }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      // 다단계 승인 여부 확인
      const isMultiStep =
        item.category === 'disposal_review' ||
        item.category === 'disposal_final' ||
        item.category === 'plan_review' ||
        item.category === 'plan_final';
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Dialog'
        ],
        {
          open: isOpen,
          onOpenChange: onClose,
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'DialogContent'
            ],
            {
              className:
                'max-w-2xl max-h-[90vh] data-[state=open]:duration-300 data-[state=open]:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'DialogHeader'
                  ],
                  {
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'DialogTitle'
                        ],
                        {
                          children: t('detail.title'),
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                          lineNumber: 54,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'DialogDescription'
                        ],
                        {
                          children: t('detail.description'),
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                          lineNumber: 55,
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
                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                    lineNumber: 53,
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
                    className: 'max-h-[60vh] overflow-y-auto pr-4',
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
                            'div',
                            {
                              className: 'space-y-4',
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'div',
                                  {
                                    className: 'flex items-center gap-3',
                                    children: [
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'Badge'
                                        ],
                                        {
                                          className: (0,
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'getApprovalStatusBadgeClasses'
                                          ])(item.status),
                                          children:
                                            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'UNIFIED_APPROVAL_STATUS_LABELS'
                                            ][item.status] || item.status,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                          lineNumber: 63,
                                          columnNumber: 17,
                                        },
                                        this
                                      ),
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$detail$2d$renderers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'CategoryBadge'
                                        ],
                                        {
                                          category: item.category,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                          lineNumber: 66,
                                          columnNumber: 17,
                                        },
                                        this
                                      ),
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        'h3',
                                        {
                                          className: 'text-lg font-semibold',
                                          children: item.summary,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                          lineNumber: 67,
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
                                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                    lineNumber: 62,
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
                                    className: 'grid grid-cols-2 gap-4 text-sm',
                                    children: [
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
                                                className: 'text-muted-foreground',
                                                children: t('detail.requester'),
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                lineNumber: 72,
                                                columnNumber: 19,
                                              },
                                              this
                                            ),
                                            /*#__PURE__*/ (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'jsxDEV'
                                            ])(
                                              'p',
                                              {
                                                className: 'font-medium',
                                                children: item.requesterName,
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                lineNumber: 73,
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
                                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                          lineNumber: 71,
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
                                          children: [
                                            /*#__PURE__*/ (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'jsxDEV'
                                            ])(
                                              'p',
                                              {
                                                className: 'text-muted-foreground',
                                                children: t('detail.department'),
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                lineNumber: 76,
                                                columnNumber: 19,
                                              },
                                              this
                                            ),
                                            /*#__PURE__*/ (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'jsxDEV'
                                            ])(
                                              'p',
                                              {
                                                className: 'font-medium',
                                                children: item.requesterTeam || '-',
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                lineNumber: 77,
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
                                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                          lineNumber: 75,
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
                                          children: [
                                            /*#__PURE__*/ (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'jsxDEV'
                                            ])(
                                              'p',
                                              {
                                                className: 'text-muted-foreground',
                                                children: t('detail.requestDate'),
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                lineNumber: 80,
                                                columnNumber: 19,
                                              },
                                              this
                                            ),
                                            /*#__PURE__*/ (0,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'jsxDEV'
                                            ])(
                                              'p',
                                              {
                                                className: 'font-medium',
                                                children: (0,
                                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                  'formatDate'
                                                ])(item.requestedAt, 'yyyy-MM-dd HH:mm'),
                                              },
                                              void 0,
                                              false,
                                              {
                                                fileName:
                                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                lineNumber: 81,
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
                                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                          lineNumber: 79,
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
                                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                    lineNumber: 70,
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
                                '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                              lineNumber: 61,
                              columnNumber: 13,
                            },
                            this
                          ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'Separator'
                            ],
                            {},
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                              lineNumber: 86,
                              columnNumber: 13,
                            },
                            this
                          ),
                          isMultiStep &&
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
                                    'div',
                                    {
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          'h4',
                                          {
                                            className: 'text-sm font-semibold mb-3',
                                            children: t('detail.approvalStatus'),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                            lineNumber: 92,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalStepIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'ApprovalStepIndicator'
                                          ],
                                          {
                                            type:
                                              item.category === 'disposal_review' ||
                                              item.category === 'disposal_final'
                                                ? 'disposal'
                                                : 'calibration_plan',
                                            currentStatus: item.status,
                                            history: item.approvalHistory,
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                            lineNumber: 93,
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
                                        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                      lineNumber: 91,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'Separator'
                                    ],
                                    {},
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                      lineNumber: 103,
                                      columnNumber: 17,
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
                            'div',
                            {
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'h4',
                                  {
                                    className: 'text-sm font-semibold mb-3',
                                    children: t('detail.requestDetail'),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                    lineNumber: 109,
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
                                    className: 'bg-muted/50 rounded-lg p-4 divide-y',
                                    children: /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$detail$2d$renderers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'CategoryDetails'
                                      ],
                                      {
                                        category: item.category,
                                        details: item.details,
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                        lineNumber: 111,
                                        columnNumber: 17,
                                      },
                                      this
                                    ),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                    lineNumber: 110,
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
                                '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                              lineNumber: 108,
                              columnNumber: 13,
                            },
                            this
                          ),
                          item.attachments &&
                            item.attachments.length > 0 &&
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
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'Separator'
                                    ],
                                    {},
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                      lineNumber: 118,
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
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          'h4',
                                          {
                                            className: 'text-sm font-semibold mb-3',
                                            children: t('detail.attachments'),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                            lineNumber: 120,
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
                                            className: 'space-y-2',
                                            children: item.attachments.map((attachment) =>
                                              /*#__PURE__*/ (0,
                                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                'jsxDEV'
                                              ])(
                                                'div',
                                                {
                                                  className:
                                                    'flex items-center justify-between p-3 bg-muted/50 rounded-lg',
                                                  children: [
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
                                                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__[
                                                              'FileText'
                                                            ],
                                                            {
                                                              className:
                                                                'h-4 w-4 text-muted-foreground',
                                                              'aria-hidden': 'true',
                                                            },
                                                            void 0,
                                                            false,
                                                            {
                                                              fileName:
                                                                '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                              lineNumber: 128,
                                                              columnNumber: 27,
                                                            },
                                                            this
                                                          ),
                                                          /*#__PURE__*/ (0,
                                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                            'jsxDEV'
                                                          ])(
                                                            'span',
                                                            {
                                                              className: 'text-sm',
                                                              children: attachment.filename,
                                                            },
                                                            void 0,
                                                            false,
                                                            {
                                                              fileName:
                                                                '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                              lineNumber: 129,
                                                              columnNumber: 27,
                                                            },
                                                            this
                                                          ),
                                                          /*#__PURE__*/ (0,
                                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                            'jsxDEV'
                                                          ])(
                                                            'span',
                                                            {
                                                              className:
                                                                'text-xs text-muted-foreground',
                                                              children: [
                                                                '(',
                                                                Math.round(attachment.size / 1024),
                                                                'KB)',
                                                              ],
                                                            },
                                                            void 0,
                                                            true,
                                                            {
                                                              fileName:
                                                                '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                              lineNumber: 130,
                                                              columnNumber: 27,
                                                            },
                                                            this
                                                          ),
                                                        ],
                                                      },
                                                      void 0,
                                                      true,
                                                      {
                                                        fileName:
                                                          '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                        lineNumber: 127,
                                                        columnNumber: 25,
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
                                                        type: 'button',
                                                        size: 'sm',
                                                        variant: 'ghost',
                                                        'aria-label': `${attachment.filename} download`,
                                                        onClick: () =>
                                                          window.open(attachment.url, '_blank'),
                                                        children: /*#__PURE__*/ (0,
                                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                                          'jsxDEV'
                                                        ])(
                                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__[
                                                            'Download'
                                                          ],
                                                          {
                                                            className: 'h-4 w-4',
                                                            'aria-hidden': 'true',
                                                          },
                                                          void 0,
                                                          false,
                                                          {
                                                            fileName:
                                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                            lineNumber: 141,
                                                            columnNumber: 27,
                                                          },
                                                          this
                                                        ),
                                                      },
                                                      void 0,
                                                      false,
                                                      {
                                                        fileName:
                                                          '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                        lineNumber: 134,
                                                        columnNumber: 25,
                                                      },
                                                      this
                                                    ),
                                                  ],
                                                },
                                                attachment.id,
                                                true,
                                                {
                                                  fileName:
                                                    '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                                  lineNumber: 123,
                                                  columnNumber: 23,
                                                },
                                                this
                                              )
                                            ),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                            lineNumber: 121,
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
                                        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                      lineNumber: 119,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                ],
                              },
                              void 0,
                              true
                            ),
                          item.approvalHistory &&
                            item.approvalHistory.length > 0 &&
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
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'Separator'
                                    ],
                                    {},
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                      lineNumber: 153,
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
                                      children: [
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          'h4',
                                          {
                                            className: 'text-sm font-semibold mb-3',
                                            children: t('detail.approvalHistory'),
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                            lineNumber: 155,
                                            columnNumber: 19,
                                          },
                                          this
                                        ),
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalHistoryCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'ApprovalHistoryCard'
                                          ],
                                          {
                                            history: item.approvalHistory,
                                          },
                                          void 0,
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                            lineNumber: 156,
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
                                        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                      lineNumber: 154,
                                      columnNumber: 17,
                                    },
                                    this
                                  ),
                                ],
                              },
                              void 0,
                              true
                            ),
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                        lineNumber: 59,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName:
                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                    lineNumber: 58,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'DialogFooter'
                  ],
                  {
                    className: 'flex gap-2 sm:gap-2',
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Button'
                        ],
                        {
                          type: 'button',
                          variant: 'outline',
                          onClick: onClose,
                          children: t('detail.close'),
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                          lineNumber: 164,
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
                          type: 'button',
                          onClick: onApprove,
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'getApprovalActionButtonClasses'
                          ])('approve'),
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__[
                                'CheckCircle2'
                              ],
                              {
                                className: 'h-4 w-4 mr-1',
                                'aria-hidden': 'true',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                lineNumber: 172,
                                columnNumber: 13,
                              },
                              this
                            ),
                            actionLabel,
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                          lineNumber: 167,
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
                          type: 'button',
                          variant: 'outline',
                          onClick: onReject,
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'getApprovalActionButtonClasses'
                          ])('reject'),
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
                                'XCircle'
                              ],
                              {
                                className: 'h-4 w-4 mr-1',
                                'aria-hidden': 'true',
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                                lineNumber: 181,
                                columnNumber: 13,
                              },
                              this
                            ),
                            t('detail.reject'),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                          lineNumber: 175,
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
                      '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
                    lineNumber: 163,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
              lineNumber: 52,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx',
          lineNumber: 51,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalDetailModal, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = ApprovalDetailModal;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalDetailModal');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/select.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Select',
      () => Select,
      'SelectContent',
      () => SelectContent,
      'SelectGroup',
      () => SelectGroup,
      'SelectItem',
      () => SelectItem,
      'SelectLabel',
      () => SelectLabel,
      'SelectScrollDownButton',
      () => SelectScrollDownButton,
      'SelectScrollUpButton',
      () => SelectScrollUpButton,
      'SelectSeparator',
      () => SelectSeparator,
      'SelectTrigger',
      () => SelectTrigger,
      'SelectValue',
      () => SelectValue,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-select/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const Select =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ];
    const SelectGroup =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Group'
      ];
    const SelectValue =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Value'
      ];
    const SelectTrigger =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, children, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Trigger'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
                className
              ),
              ...props,
              children: [
                children,
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Icon'
                  ],
                  {
                    asChild: true,
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__[
                        'ChevronDown'
                      ],
                      {
                        className: 'h-4 w-4 opacity-50',
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/select.tsx',
                        lineNumber: 29,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/select.tsx',
                    lineNumber: 28,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/select.tsx',
              lineNumber: 19,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = SelectTrigger;
    SelectTrigger.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Trigger'
      ].displayName;
    const SelectScrollUpButton =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](({ className, ...props }, ref) =>
        /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ScrollUpButton'
          ],
          {
            ref: ref,
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'cn'
            ])('flex cursor-default items-center justify-center py-1', className),
            ...props,
            children: /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__[
                'ChevronUp'
              ],
              {
                className: 'h-4 w-4',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/ui/select.tsx',
                lineNumber: 44,
                columnNumber: 5,
              },
              ('TURBOPACK compile-time value', void 0)
            ),
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/ui/select.tsx',
            lineNumber: 39,
            columnNumber: 3,
          },
          ('TURBOPACK compile-time value', void 0)
        )
      );
    _c2 = SelectScrollUpButton;
    SelectScrollUpButton.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'ScrollUpButton'
      ].displayName;
    const SelectScrollDownButton =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](({ className, ...props }, ref) =>
        /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ScrollDownButton'
          ],
          {
            ref: ref,
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'cn'
            ])('flex cursor-default items-center justify-center py-1', className),
            ...props,
            children: /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__[
                'ChevronDown'
              ],
              {
                className: 'h-4 w-4',
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/ui/select.tsx',
                lineNumber: 58,
                columnNumber: 5,
              },
              ('TURBOPACK compile-time value', void 0)
            ),
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/ui/select.tsx',
            lineNumber: 53,
            columnNumber: 3,
          },
          ('TURBOPACK compile-time value', void 0)
        )
      );
    _c3 = SelectScrollDownButton;
    SelectScrollDownButton.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'ScrollDownButton'
      ].displayName;
    const SelectContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c4 = ({ className, children, position = 'popper', ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Portal'
            ],
            {
              children: /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Content'
                ],
                {
                  ref: ref,
                  className: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'cn'
                  ])(
                    'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    position === 'popper' &&
                      'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                    className
                  ),
                  position: position,
                  ...props,
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      SelectScrollUpButton,
                      {},
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/select.tsx',
                        lineNumber: 79,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'Viewport'
                      ],
                      {
                        className: (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                          'cn'
                        ])(
                          'p-1',
                          position === 'popper' &&
                            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
                        ),
                        children: children,
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/select.tsx',
                        lineNumber: 80,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      SelectScrollDownButton,
                      {},
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/select.tsx',
                        lineNumber: 89,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                  ],
                },
                void 0,
                true,
                {
                  fileName: '[project]/apps/frontend/components/ui/select.tsx',
                  lineNumber: 68,
                  columnNumber: 5,
                },
                ('TURBOPACK compile-time value', void 0)
              ),
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/select.tsx',
              lineNumber: 67,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c5 = SelectContent;
    SelectContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Content'
      ].displayName;
    const SelectLabel =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c6 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Label'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('py-1.5 pl-8 pr-2 text-sm font-semibold', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/select.tsx',
              lineNumber: 99,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c7 = SelectLabel;
    SelectLabel.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Label'
      ].displayName;
    const SelectItem =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c8 = ({ className, children, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Item'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus-visible:bg-accent focus-visible:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
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
                            fileName: '[project]/apps/frontend/components/ui/select.tsx',
                            lineNumber: 121,
                            columnNumber: 9,
                          },
                          ('TURBOPACK compile-time value', void 0)
                        ),
                      },
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/select.tsx',
                        lineNumber: 120,
                        columnNumber: 7,
                      },
                      ('TURBOPACK compile-time value', void 0)
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/select.tsx',
                    lineNumber: 119,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ItemText'
                  ],
                  {
                    children: children,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/select.tsx',
                    lineNumber: 125,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/select.tsx',
              lineNumber: 111,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c9 = SelectItem;
    SelectItem.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Item'
      ].displayName;
    const SelectSeparator =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c10 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
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
              fileName: '[project]/apps/frontend/components/ui/select.tsx',
              lineNumber: 134,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c11 = SelectSeparator;
    SelectSeparator.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Separator'
      ].displayName;
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
    __turbopack_context__.k.register(_c, 'SelectTrigger$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'SelectTrigger');
    __turbopack_context__.k.register(_c2, 'SelectScrollUpButton');
    __turbopack_context__.k.register(_c3, 'SelectScrollDownButton');
    __turbopack_context__.k.register(_c4, 'SelectContent$React.forwardRef');
    __turbopack_context__.k.register(_c5, 'SelectContent');
    __turbopack_context__.k.register(_c6, 'SelectLabel$React.forwardRef');
    __turbopack_context__.k.register(_c7, 'SelectLabel');
    __turbopack_context__.k.register(_c8, 'SelectItem$React.forwardRef');
    __turbopack_context__.k.register(_c9, 'SelectItem');
    __turbopack_context__.k.register(_c10, 'SelectSeparator$React.forwardRef');
    __turbopack_context__.k.register(_c11, 'SelectSeparator');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/RejectModal.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => RejectModal]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/textarea.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/label.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/select.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    const TEMPLATE_KEYS = ['spec', 'schedule', 'calibration', 'document', 'other'];
    function RejectModal({ item, isOpen, onClose, onConfirm }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      // 반려 사유 템플릿 (i18n)
      const rejectTemplates = [
        {
          value: '',
          label: t('rejectModal.directInput'),
        },
        ...TEMPLATE_KEYS.map((key) => ({
          value: t(`rejectModal.templates.${key}`),
          label: t(`rejectModal.templates.${key}`),
        })),
      ];
      // Local state for real-time validation
      const [reasonValue, setReasonValue] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])('');
      const [validationError, setValidationError] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(null);
      // Reset state when modal opens/closes
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'RejectModal.useEffect': () => {
            if (isOpen) {
              setReasonValue('');
              setValidationError(null);
            }
          },
        }['RejectModal.useEffect'],
        [isOpen]
      );
      // useActionState 패턴 사용 (Next.js 16)
      const [state, formAction, isPending] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useActionState'
      ])(
        {
          'RejectModal.useActionState': async (prevState, formData) => {
            const reason = formData.get('reason');
            // 반려 사유 10자 이상 검증
            if (
              !reason ||
              reason.trim().length <
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'REJECTION_MIN_LENGTH'
                ]
            ) {
              setValidationError(t('rejectModal.validation'));
              return {
                error: null,
                success: false,
              };
            }
            try {
              await onConfirm(reason.trim());
              return {
                error: null,
                success: true,
              };
            } catch {
              return {
                error: t('toasts.rejectError'),
                success: false,
              };
            }
          },
        }['RejectModal.useActionState'],
        {
          error: null,
          success: false,
        }
      );
      // Real-time validation on input change
      const handleReasonChange = (e) => {
        const value = e.target.value;
        setReasonValue(value);
        // Clear validation error if user enters valid input
        if (
          value.trim().length >=
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'REJECTION_MIN_LENGTH'
          ]
        ) {
          setValidationError(null);
        }
      };
      const handleTemplateSelect = (value) => {
        // 'direct' = 직접 입력 (빈 문자열 대체값) → textarea 초기화
        const resolvedValue = value === 'direct' ? '' : value;
        setReasonValue(resolvedValue);
        if (
          resolvedValue.trim().length >=
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'REJECTION_MIN_LENGTH'
          ]
        ) {
          setValidationError(null);
        }
      };
      // Use validation error from real-time validation or form submission
      const displayError = validationError || state.error;
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Dialog'
        ],
        {
          open: isOpen,
          onOpenChange: onClose,
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'DialogContent'
            ],
            {
              className: 'max-w-md',
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'DialogHeader'
                  ],
                  {
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'DialogTitle'
                        ],
                        {
                          children: t('rejectModal.title'),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                          lineNumber: 120,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'DialogDescription'
                        ],
                        {
                          children: t('rejectModal.description', {
                            summary: item.summary,
                          }),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                          lineNumber: 121,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                    lineNumber: 119,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'form',
                  {
                    action: formAction,
                    className: 'space-y-4',
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'space-y-2',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Label'
                              ],
                              {
                                htmlFor: 'template',
                                children: t('rejectModal.templatesLabel'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                lineNumber: 129,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Select'
                              ],
                              {
                                onValueChange: handleTemplateSelect,
                                children: [
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'SelectTrigger'
                                    ],
                                    {
                                      id: 'template',
                                      children: /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'SelectValue'
                                        ],
                                        {
                                          placeholder: t('rejectModal.templateSelectPlaceholder'),
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                          lineNumber: 132,
                                          columnNumber: 17,
                                        },
                                        this
                                      ),
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                      lineNumber: 131,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'SelectContent'
                                    ],
                                    {
                                      children: rejectTemplates.map((template) =>
                                        /*#__PURE__*/ (0,
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'jsxDEV'
                                        ])(
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'SelectItem'
                                          ],
                                          {
                                            value: template.value || 'direct',
                                            children: template.label,
                                          },
                                          template.value || 'direct',
                                          false,
                                          {
                                            fileName:
                                              '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                            lineNumber: 136,
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
                                        '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                      lineNumber: 134,
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
                                  '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                lineNumber: 130,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                          lineNumber: 128,
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
                          className: 'space-y-2',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Label'
                              ],
                              {
                                htmlFor: 'reject-reason',
                                children: [t('rejectModal.reasonLabel'), ' *'],
                              },
                              void 0,
                              true,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                lineNumber: 146,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Textarea'
                              ],
                              {
                                id: 'reject-reason',
                                name: 'reason',
                                value: reasonValue,
                                onChange: handleReasonChange,
                                placeholder: t('rejectModal.reasonPlaceholder'),
                                className: 'min-h-[120px]',
                                'aria-describedby': displayError ? 'reject-error' : undefined,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                lineNumber: 147,
                                columnNumber: 13,
                              },
                              this
                            ),
                            displayError &&
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'p',
                                {
                                  id: 'reject-error',
                                  className: 'text-sm text-destructive',
                                  role: 'alert',
                                  'aria-live': 'assertive',
                                  children: displayError,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                  lineNumber: 157,
                                  columnNumber: 15,
                                },
                                this
                              ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                          lineNumber: 145,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'DialogFooter'
                        ],
                        {
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Button'
                              ],
                              {
                                type: 'button',
                                variant: 'outline',
                                onClick: onClose,
                                disabled: isPending,
                                children: t('rejectModal.cancel'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                lineNumber: 169,
                                columnNumber: 13,
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
                                type: 'submit',
                                variant: 'outline',
                                disabled: isPending,
                                'aria-busy': isPending,
                                className: (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'getApprovalActionButtonClasses'
                                ])('reject'),
                                children: [
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__[
                                      'XCircle'
                                    ],
                                    {
                                      className: 'h-4 w-4 mr-1',
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                      lineNumber: 179,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                  isPending ? t('processing') : t('rejectModal.title'),
                                ],
                              },
                              void 0,
                              true,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                                lineNumber: 172,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                          lineNumber: 168,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
                    lineNumber: 126,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
              lineNumber: 118,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/RejectModal.tsx',
          lineNumber: 117,
          columnNumber: 5,
        },
        this
      );
    }
    _s(RejectModal, 'AN4TkyBtAJa2aKuahvEj21aD5BU=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useActionState'
        ],
      ];
    });
    _c = RejectModal;
    var _c;
    __turbopack_context__.k.register(_c, 'RejectModal');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-approval-kpi.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useApprovalKpi', () => useApprovalKpi]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    function useApprovalKpi(pendingCounts, activeCategory, availableTabs) {
      _s();
      const { data: kpiData } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.kpi(activeCategory),
        queryFn: {
          'useApprovalKpi.useQuery': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'approvalsApi'
            ].getKpi(activeCategory),
        }['useApprovalKpi.useQuery'],
        ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'QUERY_CONFIG'
        ].DASHBOARD,
      });
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'useApprovalKpi.useMemo': () => {
            // totalPending: 역할 기반 카테고리 합산 (counts API에서 파생)
            const totalPending = availableTabs.reduce(
              {
                'useApprovalKpi.useMemo.totalPending': (sum, tab) => {
                  return sum + (pendingCounts?.[tab] ?? 0);
                },
              }['useApprovalKpi.useMemo.totalPending'],
              0
            );
            return {
              totalPending,
              urgentCount: kpiData?.urgentCount ?? 0,
              avgWaitDays: kpiData?.avgWaitDays ?? 0,
              todayProcessed: kpiData?.todayProcessed ?? null,
            };
          },
        }['useApprovalKpi.useMemo'],
        [pendingCounts, availableTabs, kpiData]
      );
    }
    _s(useApprovalKpi, 'j50UO8EOs9ZUJk/oqut0yQ74Ol0=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ApprovalsClient', () => ApprovalsClient]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/navigation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-optimistic-mutation.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$cache$2d$invalidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/cache-invalidation.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/textarea.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/label.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/dialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/tooltip.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/approvals-api.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$hooks$2f$use$2d$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/hooks/use-approvals-api.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalKpiStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalKpiStrip.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalCategorySidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalCategorySidebar.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalMobileCategoryBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalList.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$BulkActionBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/BulkActionBar.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalDetailModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/ApprovalDetailModal.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$RejectModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/approvals/RejectModal.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-approval-kpi.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/approval.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function ApprovalsClient({ userRole, userId, userTeamId, initialTab }) {
      _s();
      const router = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRouter'
      ])();
      const searchParams = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSearchParams'
      ])();
      const approvalsApi = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$hooks$2f$use$2d$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useApprovalsApi'
      ])();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('approvals');
      // 현재 역할에서 사용 가능한 탭 (useMemo로 안정화)
      const availableTabs = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'ApprovalsClient.useMemo[availableTabs]': () =>
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'ROLE_TABS'
            ][userRole] || [],
        }['ApprovalsClient.useMemo[availableTabs]'],
        [userRole]
      );
      const defaultTab = initialTab || availableTabs[0] || 'equipment';
      const [activeTab, setActiveTab] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(defaultTab);
      const [selectedItems, setSelectedItems] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])([]);
      const [detailModalItem, setDetailModalItem] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(null);
      const [rejectModalItem, setRejectModalItem] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(null);
      // 처리 중/퇴장 애니메이션 상태
      const [processingIds, setProcessingIds] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(new Set());
      const [exitingIds, setExitingIds] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(new Map());
      // 승인 코멘트 다이얼로그 상태 (commentRequired 카테고리용)
      const [approveCommentItem, setApproveCommentItem] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(null);
      const [approveComment, setApproveComment] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])('');
      // 벌크 승인 코멘트 다이얼로그 상태
      const [isBulkApproveCommentOpen, setIsBulkApproveCommentOpen] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const [bulkApproveComment, setBulkApproveComment] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])('');
      // URL 쿼리 파라미터 동기화
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'ApprovalsClient.useEffect': () => {
            const tabParam = searchParams.get('tab');
            if (tabParam && availableTabs.includes(tabParam)) {
              setActiveTab(tabParam);
            }
          },
        }['ApprovalsClient.useEffect'],
        [searchParams, availableTabs]
      );
      // 탭 변경 핸들러
      const handleTabChange = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'ApprovalsClient.useCallback[handleTabChange]': (tab) => {
            setActiveTab(tab);
            setSelectedItems([]);
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', tab);
            router.push(`?${params.toString()}`, {
              scroll: false,
            });
          },
        }['ApprovalsClient.useCallback[handleTabChange]'],
        [router, searchParams]
      );
      // 승인 대기 목록 조회
      const { data: pendingItems = [], isLoading } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.list(activeTab, userTeamId),
        queryFn: {
          'ApprovalsClient.useQuery': () => approvalsApi.getPendingItems(activeTab, userTeamId),
        }['ApprovalsClient.useQuery'],
        staleTime:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CACHE_TIMES'
          ].SHORT,
      });
      // 경과일 내림차순 정렬 (오래된 건 상단)
      const sortedItems = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'ApprovalsClient.useMemo[sortedItems]': () => {
            return [...pendingItems].sort(
              {
                'ApprovalsClient.useMemo[sortedItems]': (a, b) =>
                  new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
              }['ApprovalsClient.useMemo[sortedItems]']
            );
          },
        }['ApprovalsClient.useMemo[sortedItems]'],
        [pendingItems]
      );
      // 카테고리별 대기 개수 조회
      const { data: pendingCounts } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useQuery'
      ])({
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.counts(userRole),
        queryFn: {
          'ApprovalsClient.useQuery': () => approvalsApi.getPendingCounts(userRole),
        }['ApprovalsClient.useQuery'],
        staleTime:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CACHE_TIMES'
          ].MEDIUM,
      });
      // KPI 데이터 — 서버 사이드 집계 (GET /api/approvals/kpi?category=X)
      const kpi = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useApprovalKpi'
      ])(pendingCounts, activeTab, availableTabs);
      // ✅ 승인 처리 - Optimistic Update 패턴
      const approveMutation = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useOptimisticMutation'
      ])({
        mutationFn: {
          'ApprovalsClient.useOptimisticMutation[approveMutation]': async ({ item, comment }) => {
            const equipmentId = item.details?.equipmentId;
            await approvalsApi.approve(
              item.category,
              item.id,
              userId,
              comment,
              equipmentId,
              item.originalData
            );
          },
        }['ApprovalsClient.useOptimisticMutation[approveMutation]'],
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.list(activeTab, userTeamId),
        optimisticUpdate: {
          'ApprovalsClient.useOptimisticMutation[approveMutation]': (old) => old || [],
        }['ApprovalsClient.useOptimisticMutation[approveMutation]'],
        invalidateKeys: [
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.counts(userRole),
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.kpi(activeTab),
          ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$cache$2d$invalidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutCacheInvalidation'
          ].APPROVAL_KEYS,
        ],
        successMessage: {
          'ApprovalsClient.useOptimisticMutation[approveMutation]': (_, { item }) =>
            t('toasts.approveDynamic', {
              summary: item.summary,
            }),
        }['ApprovalsClient.useOptimisticMutation[approveMutation]'],
        errorMessage: t('toasts.approveError'),
        onSuccessCallback: {
          'ApprovalsClient.useOptimisticMutation[approveMutation]': (_, { item }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[approveMutation]': (prev) => {
                  const s = new Set(prev);
                  s.delete(item.id);
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[approveMutation]']
            );
            setExitingIds(
              {
                'ApprovalsClient.useOptimisticMutation[approveMutation]': (prev) =>
                  new Map(prev).set(item.id, 'success'),
              }['ApprovalsClient.useOptimisticMutation[approveMutation]']
            );
            setTimeout(
              {
                'ApprovalsClient.useOptimisticMutation[approveMutation]': () => {
                  setExitingIds(
                    {
                      'ApprovalsClient.useOptimisticMutation[approveMutation]': (prev) => {
                        const m = new Map(prev);
                        m.delete(item.id);
                        return m;
                      },
                    }['ApprovalsClient.useOptimisticMutation[approveMutation]']
                  );
                },
              }['ApprovalsClient.useOptimisticMutation[approveMutation]'],
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].exitDurationMs
            );
            setDetailModalItem(null);
            setApproveCommentItem(null);
            setApproveComment('');
          },
        }['ApprovalsClient.useOptimisticMutation[approveMutation]'],
        onErrorCallback: {
          'ApprovalsClient.useOptimisticMutation[approveMutation]': (_, { item }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[approveMutation]': (prev) => {
                  const s = new Set(prev);
                  s.delete(item.id);
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[approveMutation]']
            );
          },
        }['ApprovalsClient.useOptimisticMutation[approveMutation]'],
      });
      /**
       * 승인 핸들러 — SSOT: TAB_META.commentRequired 기반 분기
       */ const handleApprove = (item) => {
        const meta =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'TAB_META'
          ][item.category];
        if (meta?.commentRequired) {
          setDetailModalItem(null);
          setApproveCommentItem(item);
          setApproveComment('');
        } else {
          setProcessingIds((prev) => new Set(prev).add(item.id));
          approveMutation.mutate({
            item,
          });
        }
      };
      const handleApproveWithComment = () => {
        if (!approveCommentItem || !approveComment.trim()) return;
        setProcessingIds((prev) => new Set(prev).add(approveCommentItem.id));
        approveMutation.mutate({
          item: approveCommentItem,
          comment: approveComment,
        });
      };
      // ✅ 반려 처리
      const rejectMutation = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useOptimisticMutation'
      ])({
        mutationFn: {
          'ApprovalsClient.useOptimisticMutation[rejectMutation]': async ({ item, reason }) => {
            const equipmentId = item.details?.equipmentId;
            await approvalsApi.reject(
              item.category,
              item.id,
              userId,
              reason,
              equipmentId,
              item.originalData
            );
          },
        }['ApprovalsClient.useOptimisticMutation[rejectMutation]'],
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.list(activeTab, userTeamId),
        optimisticUpdate: {
          'ApprovalsClient.useOptimisticMutation[rejectMutation]': (old) => old || [],
        }['ApprovalsClient.useOptimisticMutation[rejectMutation]'],
        invalidateKeys: [
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.counts(userRole),
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.kpi(activeTab),
          ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$cache$2d$invalidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutCacheInvalidation'
          ].APPROVAL_KEYS,
        ],
        successMessage: {
          'ApprovalsClient.useOptimisticMutation[rejectMutation]': (_, { item }) =>
            t('toasts.rejectDynamic', {
              summary: item.summary,
            }),
        }['ApprovalsClient.useOptimisticMutation[rejectMutation]'],
        errorMessage: t('toasts.rejectError'),
        onSuccessCallback: {
          'ApprovalsClient.useOptimisticMutation[rejectMutation]': (_, { item }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[rejectMutation]': (prev) => {
                  const s = new Set(prev);
                  s.delete(item.id);
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[rejectMutation]']
            );
            setExitingIds(
              {
                'ApprovalsClient.useOptimisticMutation[rejectMutation]': (prev) =>
                  new Map(prev).set(item.id, 'reject'),
              }['ApprovalsClient.useOptimisticMutation[rejectMutation]']
            );
            setTimeout(
              {
                'ApprovalsClient.useOptimisticMutation[rejectMutation]': () => {
                  setExitingIds(
                    {
                      'ApprovalsClient.useOptimisticMutation[rejectMutation]': (prev) => {
                        const m = new Map(prev);
                        m.delete(item.id);
                        return m;
                      },
                    }['ApprovalsClient.useOptimisticMutation[rejectMutation]']
                  );
                },
              }['ApprovalsClient.useOptimisticMutation[rejectMutation]'],
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].exitDurationMs
            );
            setRejectModalItem(null);
          },
        }['ApprovalsClient.useOptimisticMutation[rejectMutation]'],
        onErrorCallback: {
          'ApprovalsClient.useOptimisticMutation[rejectMutation]': (_, { item }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[rejectMutation]': (prev) => {
                  const s = new Set(prev);
                  s.delete(item.id);
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[rejectMutation]']
            );
          },
        }['ApprovalsClient.useOptimisticMutation[rejectMutation]'],
      });
      const handleReject = async (item, reason) => {
        setProcessingIds((prev) => new Set(prev).add(item.id));
        await rejectMutation.mutateAsync({
          item,
          reason,
        });
      };
      // ✅ 일괄 승인 처리
      const bulkApproveMutation = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useOptimisticMutation'
      ])({
        mutationFn: {
          'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': async ({
            ids,
            comment,
          }) => {
            return await approvalsApi.bulkApprove(activeTab, ids, userId, comment);
          },
        }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]'],
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.list(activeTab, userTeamId),
        optimisticUpdate: {
          'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (old) => old || [],
        }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]'],
        invalidateKeys: [
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.counts(userRole),
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.kpi(activeTab),
          ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$cache$2d$invalidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutCacheInvalidation'
          ].APPROVAL_KEYS,
        ],
        successMessage: {
          'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (result) => {
            if (result.failed.length > 0) {
              return t('toasts.bulkApproveResult', {
                success: result.success.length,
                failed: result.failed.length,
              });
            }
            return t('toasts.bulkApproveAll', {
              count: result.success.length,
            });
          },
        }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]'],
        errorMessage: t('toasts.bulkApproveError'),
        onSuccessCallback: {
          'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (_, { ids }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (prev) => {
                  const s = new Set(prev);
                  ids.forEach(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (id) =>
                        s.delete(id),
                    }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
                  );
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
            );
            setExitingIds(
              {
                'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (prev) => {
                  const m = new Map(prev);
                  ids.forEach(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (id) =>
                        m.set(id, 'success'),
                    }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
                  );
                  return m;
                },
              }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
            );
            setTimeout(
              {
                'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': () => {
                  setExitingIds(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (prev) => {
                        const m = new Map(prev);
                        ids.forEach(
                          {
                            'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (id) =>
                              m.delete(id),
                          }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
                        );
                        return m;
                      },
                    }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
                  );
                },
              }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]'],
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].exitDurationMs
            );
            setSelectedItems([]);
            setIsBulkApproveCommentOpen(false);
            setBulkApproveComment('');
          },
        }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]'],
        onErrorCallback: {
          'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (_, { ids }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (prev) => {
                  const s = new Set(prev);
                  ids.forEach(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkApproveMutation]': (id) =>
                        s.delete(id),
                    }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
                  );
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]']
            );
          },
        }['ApprovalsClient.useOptimisticMutation[bulkApproveMutation]'],
      });
      const handleBulkApprove = () => {
        if (selectedItems.length === 0) return;
        const meta =
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'TAB_META'
          ][activeTab];
        if (meta?.commentRequired) {
          setIsBulkApproveCommentOpen(true);
          setBulkApproveComment('');
        } else {
          setProcessingIds((prev) => new Set(Array.from(prev).concat(selectedItems)));
          bulkApproveMutation.mutate({
            ids: selectedItems,
          });
        }
      };
      const handleBulkApproveWithComment = () => {
        if (!bulkApproveComment.trim()) return;
        setProcessingIds((prev) => new Set(Array.from(prev).concat(selectedItems)));
        bulkApproveMutation.mutate({
          ids: selectedItems,
          comment: bulkApproveComment,
        });
      };
      // ✅ 일괄 반려 처리
      const bulkRejectMutation = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useOptimisticMutation'
      ])({
        mutationFn: {
          'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': async ({ ids, reason }) => {
            return await approvalsApi.bulkReject(activeTab, ids, userId, reason);
          },
        }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]'],
        queryKey:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.list(activeTab, userTeamId),
        optimisticUpdate: {
          'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (old) => old || [],
        }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]'],
        invalidateKeys: [
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.counts(userRole),
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'queryKeys'
          ].approvals.kpi(activeTab),
          ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$cache$2d$invalidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutCacheInvalidation'
          ].APPROVAL_KEYS,
        ],
        successMessage: {
          'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (result) => {
            if (result.failed.length > 0) {
              return t('toasts.bulkRejectResult', {
                success: result.success.length,
                failed: result.failed.length,
              });
            }
            return t('toasts.bulkRejectAll', {
              count: result.success.length,
            });
          },
        }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]'],
        errorMessage: t('toasts.bulkRejectError'),
        onSuccessCallback: {
          'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (_, { ids }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (prev) => {
                  const s = new Set(prev);
                  ids.forEach(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (id) =>
                        s.delete(id),
                    }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
                  );
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
            );
            setExitingIds(
              {
                'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (prev) => {
                  const m = new Map(prev);
                  ids.forEach(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (id) =>
                        m.set(id, 'reject'),
                    }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
                  );
                  return m;
                },
              }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
            );
            setTimeout(
              {
                'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': () => {
                  setExitingIds(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (prev) => {
                        const m = new Map(prev);
                        ids.forEach(
                          {
                            'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (id) =>
                              m.delete(id),
                          }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
                        );
                        return m;
                      },
                    }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
                  );
                },
              }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]'],
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'APPROVAL_MOTION'
              ].exitDurationMs
            );
            setSelectedItems([]);
          },
        }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]'],
        onErrorCallback: {
          'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (_, { ids }) => {
            setProcessingIds(
              {
                'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (prev) => {
                  const s = new Set(prev);
                  ids.forEach(
                    {
                      'ApprovalsClient.useOptimisticMutation[bulkRejectMutation]': (id) =>
                        s.delete(id),
                    }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
                  );
                  return s;
                },
              }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]']
            );
          },
        }['ApprovalsClient.useOptimisticMutation[bulkRejectMutation]'],
      });
      const handleBulkReject = async (reason) => {
        if (selectedItems.length === 0) return;
        setProcessingIds((prev) => new Set(Array.from(prev).concat(selectedItems)));
        await bulkRejectMutation.mutateAsync({
          ids: selectedItems,
          reason,
        });
      };
      // 선택 토글
      const handleToggleSelect = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'ApprovalsClient.useCallback[handleToggleSelect]': (id) => {
            setSelectedItems(
              {
                'ApprovalsClient.useCallback[handleToggleSelect]': (prev) =>
                  prev.includes(id)
                    ? prev.filter(
                        {
                          'ApprovalsClient.useCallback[handleToggleSelect]': (i) => i !== id,
                        }['ApprovalsClient.useCallback[handleToggleSelect]']
                      )
                    : [...prev, id],
              }['ApprovalsClient.useCallback[handleToggleSelect]']
            );
          },
        }['ApprovalsClient.useCallback[handleToggleSelect]'],
        []
      );
      // 전체 선택
      const handleSelectAll = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'ApprovalsClient.useCallback[handleSelectAll]': () => {
            if (selectedItems.length === sortedItems.length) {
              setSelectedItems([]);
            } else {
              setSelectedItems(
                sortedItems.map(
                  {
                    'ApprovalsClient.useCallback[handleSelectAll]': (item) => item.id,
                  }['ApprovalsClient.useCallback[handleSelectAll]']
                )
              );
            }
          },
        }['ApprovalsClient.useCallback[handleSelectAll]'],
        [sortedItems, selectedItems.length]
      );
      // 현재 탭의 코멘트 다이얼로그 메타 (SSOT: TAB_META)
      const activeTabMeta =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'TAB_META'
        ][activeTab];
      const commentMeta = approveCommentItem
        ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'TAB_META'
          ][approveCommentItem.category]
        : null;
      if (availableTabs.length === 0) {
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          'div',
          {
            className: 'text-center py-12 text-muted-foreground',
            children: /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              'p',
              {
                children: t('noPermission'),
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                lineNumber: 409,
                columnNumber: 9,
              },
              this
            ),
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
            lineNumber: 408,
            columnNumber: 7,
          },
          this
        );
      }
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TooltipProvider'
        ],
        {
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'div',
            {
              className: 'space-y-4',
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalKpiStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ApprovalKpiStrip'
                  ],
                  {
                    totalPending: kpi.totalPending,
                    urgentCount: kpi.urgentCount,
                    avgWaitDays: kpi.avgWaitDays,
                    todayProcessed: kpi.todayProcessed,
                    isLoading: isLoading && !pendingCounts,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                    lineNumber: 418,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalMobileCategoryBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ApprovalMobileCategoryBar'
                  ],
                  {
                    className: 'lg:hidden',
                    availableTabs: availableTabs,
                    activeTab: activeTab,
                    pendingCounts: pendingCounts,
                    onTabChange: handleTabChange,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                    lineNumber: 427,
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
                    className: 'flex gap-6',
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalCategorySidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'ApprovalCategorySidebar'
                        ],
                        {
                          className: 'hidden lg:block',
                          availableTabs: availableTabs,
                          activeTab: activeTab,
                          pendingCounts: pendingCounts,
                          onTabChange: handleTabChange,
                        },
                        void 0,
                        false,
                        {
                          fileName:
                            '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                          lineNumber: 438,
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
                          className: 'flex-1 min-w-0 space-y-3',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$BulkActionBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'BulkActionBar'
                              ],
                              {
                                selectedCount: selectedItems.length,
                                totalCount: sortedItems.length,
                                onSelectAll: handleSelectAll,
                                onBulkApprove: handleBulkApprove,
                                onBulkReject: handleBulkReject,
                                actionLabel: t(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                    'TAB_META'
                                  ][activeTab].actionKey
                                ),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                lineNumber: 449,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'ApprovalList'
                              ],
                              {
                                items: sortedItems,
                                isLoading: isLoading,
                                selectedItems: selectedItems,
                                processingIds: processingIds,
                                exitingIds: exitingIds,
                                onToggleSelect: handleToggleSelect,
                                onApprove: handleApprove,
                                onReject: (item) => setRejectModalItem(item),
                                onViewDetail: (item) => setDetailModalItem(item),
                                actionLabel: t(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                    'TAB_META'
                                  ][activeTab].actionKey
                                ),
                                todayProcessed: kpi.todayProcessed,
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                lineNumber: 459,
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
                            '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                          lineNumber: 447,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                    lineNumber: 436,
                    columnNumber: 9,
                  },
                  this
                ),
                detailModalItem &&
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$ApprovalDetailModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'default'
                    ],
                    {
                      item: detailModalItem,
                      isOpen: !!detailModalItem,
                      onClose: () => setDetailModalItem(null),
                      onApprove: () => handleApprove(detailModalItem),
                      onReject: () => {
                        setDetailModalItem(null);
                        setRejectModalItem(detailModalItem);
                      },
                      actionLabel: t(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                          'TAB_META'
                        ][detailModalItem.category].actionKey
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                      lineNumber: 477,
                      columnNumber: 11,
                    },
                    this
                  ),
                rejectModalItem &&
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$approvals$2f$RejectModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'default'
                    ],
                    {
                      item: rejectModalItem,
                      isOpen: !!rejectModalItem,
                      onClose: () => setRejectModalItem(null),
                      onConfirm: (reason) => handleReject(rejectModalItem, reason),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                      lineNumber: 492,
                      columnNumber: 11,
                    },
                    this
                  ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Dialog'
                  ],
                  {
                    open: !!approveCommentItem,
                    onOpenChange: (open) => {
                      if (!open) {
                        setApproveCommentItem(null);
                        setApproveComment('');
                      }
                    },
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'DialogContent'
                      ],
                      {
                        children:
                          approveCommentItem &&
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
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'DialogHeader'
                                  ],
                                  {
                                    children: [
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'DialogTitle'
                                        ],
                                        {
                                          children: commentMeta?.commentDialogTitleKey
                                            ? t(
                                                `tabMeta.${approveCommentItem.category}.commentDialogTitle`
                                              )
                                            : t('commentDialog.titleFallback'),
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                          lineNumber: 514,
                                          columnNumber: 19,
                                        },
                                        this
                                      ),
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'DialogDescription'
                                        ],
                                        {
                                          children: approveCommentItem.summary,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                          lineNumber: 519,
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
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 513,
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
                                    className: 'space-y-4 py-4',
                                    children: /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      'div',
                                      {
                                        className: 'space-y-2',
                                        children: [
                                          /*#__PURE__*/ (0,
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'jsxDEV'
                                          ])(
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'Label'
                                            ],
                                            {
                                              htmlFor: 'approve-comment',
                                              children: [t('commentDialog.label'), ' *'],
                                            },
                                            void 0,
                                            true,
                                            {
                                              fileName:
                                                '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                              lineNumber: 523,
                                              columnNumber: 21,
                                            },
                                            this
                                          ),
                                          /*#__PURE__*/ (0,
                                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'jsxDEV'
                                          ])(
                                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                              'Textarea'
                                            ],
                                            {
                                              id: 'approve-comment',
                                              placeholder: commentMeta?.commentPlaceholderKey
                                                ? t(
                                                    `tabMeta.${approveCommentItem.category}.commentPlaceholder`
                                                  )
                                                : t('commentDialog.placeholderFallback'),
                                              value: approveComment,
                                              onChange: (e) => setApproveComment(e.target.value),
                                              className: 'min-h-[100px]',
                                            },
                                            void 0,
                                            false,
                                            {
                                              fileName:
                                                '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                              lineNumber: 524,
                                              columnNumber: 21,
                                            },
                                            this
                                          ),
                                        ],
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                        lineNumber: 522,
                                        columnNumber: 19,
                                      },
                                      this
                                    ),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 521,
                                    columnNumber: 17,
                                  },
                                  this
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'DialogFooter'
                                  ],
                                  {
                                    children: [
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                          'Button'
                                        ],
                                        {
                                          type: 'button',
                                          variant: 'outline',
                                          onClick: () => {
                                            setApproveCommentItem(null);
                                            setApproveComment('');
                                          },
                                          children: t('actions.cancel'),
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                          lineNumber: 538,
                                          columnNumber: 19,
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
                                          type: 'button',
                                          onClick: handleApproveWithComment,
                                          disabled:
                                            !approveComment.trim() || approveMutation.isPending,
                                          className: (0,
                                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                            'getApprovalActionButtonClasses'
                                          ])('approve'),
                                          children: t(
                                            `tabMeta.${approveCommentItem.category}.action`
                                          ),
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                          lineNumber: 548,
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
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 537,
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
                        fileName:
                          '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                        lineNumber: 510,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                    lineNumber: 501,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Dialog'
                  ],
                  {
                    open: isBulkApproveCommentOpen,
                    onOpenChange: (open) => {
                      if (!open) {
                        setIsBulkApproveCommentOpen(false);
                        setBulkApproveComment('');
                      }
                    },
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'DialogContent'
                      ],
                      {
                        children: [
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'DialogHeader'
                            ],
                            {
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'DialogTitle'
                                  ],
                                  {
                                    children: activeTabMeta?.commentDialogTitleKey
                                      ? t(`tabMeta.${activeTab}.commentDialogTitle`)
                                      : t('bulkCommentDialog.titleFallback'),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 574,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'DialogDescription'
                                  ],
                                  {
                                    children: t('bulkCommentDialog.description', {
                                      count: selectedItems.length,
                                    }),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 579,
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
                                '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                              lineNumber: 573,
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
                              className: 'space-y-4 py-4',
                              children: /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'jsxDEV'
                              ])(
                                'div',
                                {
                                  className: 'space-y-2',
                                  children: [
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'Label'
                                      ],
                                      {
                                        htmlFor: 'bulk-approve-comment',
                                        children: [t('bulkCommentDialog.label'), ' *'],
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                        lineNumber: 585,
                                        columnNumber: 17,
                                      },
                                      this
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'jsxDEV'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'Textarea'
                                      ],
                                      {
                                        id: 'bulk-approve-comment',
                                        placeholder: activeTabMeta?.commentPlaceholderKey
                                          ? t(`tabMeta.${activeTab}.commentPlaceholder`)
                                          : t('commentDialog.placeholderFallback'),
                                        value: bulkApproveComment,
                                        onChange: (e) => setBulkApproveComment(e.target.value),
                                        className: 'min-h-[100px]',
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                        lineNumber: 586,
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
                                    '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                  lineNumber: 584,
                                  columnNumber: 15,
                                },
                                this
                              ),
                            },
                            void 0,
                            false,
                            {
                              fileName:
                                '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                              lineNumber: 583,
                              columnNumber: 13,
                            },
                            this
                          ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'DialogFooter'
                            ],
                            {
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'Button'
                                  ],
                                  {
                                    type: 'button',
                                    variant: 'outline',
                                    onClick: () => {
                                      setIsBulkApproveCommentOpen(false);
                                      setBulkApproveComment('');
                                    },
                                    children: t('actions.cancel'),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 600,
                                    columnNumber: 15,
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
                                    type: 'button',
                                    onClick: handleBulkApproveWithComment,
                                    disabled:
                                      !bulkApproveComment.trim() || bulkApproveMutation.isPending,
                                    className: (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$approval$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                      'getApprovalActionButtonClasses'
                                    ])('approve'),
                                    children: t('bulkCommentDialog.buttonLabel', {
                                      count: selectedItems.length,
                                      action: t(`tabMeta.${activeTab}.action`),
                                    }),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                                    lineNumber: 610,
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
                                '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                              lineNumber: 599,
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
                          '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                        lineNumber: 572,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
                    lineNumber: 563,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
              lineNumber: 416,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/approvals/ApprovalsClient.tsx',
          lineNumber: 415,
          columnNumber: 5,
        },
        this
      );
    }
    _s(ApprovalsClient, 'qz5mJrJKcVY03IbmzpSBBdBCFZQ=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRouter'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSearchParams'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$hooks$2f$use$2d$approvals$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useApprovalsApi'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useQuery'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useApprovalKpi'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useOptimisticMutation'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useOptimisticMutation'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useOptimisticMutation'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$optimistic$2d$mutation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useOptimisticMutation'
        ],
      ];
    });
    _c = ApprovalsClient;
    var _c;
    __turbopack_context__.k.register(_c, 'ApprovalsClient');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
]);

//# sourceMappingURL=apps_frontend_aec78662._.js.map
