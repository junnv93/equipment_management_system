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
 */
'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage, isConflictError } from '@/lib/api/error';
import { ERROR_MESSAGES, EquipmentErrorCode } from '@/lib/errors/equipment-errors';

/**
 * Optimistic Mutation 옵션
 *
 * @template TData - 서버 응답 데이터 타입
 * @template TVariables - Mutation 입력 변수 타입
 * @template TCachedData - 쿼리 캐시에 저장된 데이터 타입 (TData와 다를 수 있음)
 */
export interface OptimisticMutationOptions<TData, TVariables, TCachedData = TData> {
  /**
   * API 호출 함수
   *
   * @example
   * mutationFn: (item) => checkoutApi.approve(item.id)
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * 업데이트할 쿼리 키
   *
   * @example
   * queryKey: ['approvals', 'pending']
   * queryKey: ['equipment', equipmentId]
   */
  queryKey: QueryKey;

  /**
   * Optimistic 업데이트 함수
   *
   * onMutate에서 즉시 실행되어 캐시를 업데이트합니다.
   *
   * @param oldData - 현재 캐시 데이터 (undefined일 수 있음)
   * @param variables - Mutation 입력 변수
   * @returns 새로운 캐시 데이터
   *
   * @example
   * // 목록에서 제거
   * optimisticUpdate: (old, item) => old?.filter(i => i.id !== item.id) || []
   *
   * // 항목 수정
   * optimisticUpdate: (old, { id, status }) =>
   *   old?.map(item => item.id === id ? { ...item, status } : item) || []
   *
   * // 항목 추가
   * optimisticUpdate: (old, data) => [...(old || []), { ...data, id: 'temp' }]
   */
  optimisticUpdate: (oldData: TCachedData | undefined, variables: TVariables) => TCachedData;

  /**
   * 추가로 무효화할 쿼리 키 목록 (선택사항)
   *
   * 성공 시 이 쿼리들이 백그라운드에서 재조회됩니다.
   *
   * @example
   * invalidateKeys: [['approval-counts'], ['dashboard-stats']]
   */
  invalidateKeys?: readonly QueryKey[];

  /**
   * 성공 시 토스트 메시지 (선택사항)
   *
   * @example
   * successMessage: '승인되었습니다.'
   * successMessage: (data, vars) => `${vars.name}이(가) 승인되었습니다.`
   */
  successMessage?: string | ((data: TData, variables: TVariables) => string);

  /**
   * 에러 시 토스트 메시지 (선택사항)
   *
   * 기본값: getErrorMessage(error)의 결과
   *
   * @example
   * errorMessage: '승인 처리 중 오류가 발생했습니다.'
   * errorMessage: (error) => `에러: ${error.message}`
   */
  errorMessage?: string | ((error: Error) => string);

  /**
   * 성공 시 추가 콜백 (선택사항)
   *
   * @example
   * onSuccessCallback: () => router.push('/approvals')
   * onSuccessCallback: (data) => setDetailModalItem(null)
   */
  onSuccessCallback?: (data: TData, variables: TVariables) => void;

  /**
   * 에러 시 추가 콜백 (선택사항)
   *
   * @example
   * onErrorCallback: (error) => console.error('Mutation failed:', error)
   */
  onErrorCallback?: (error: Error, variables: TVariables) => void;
}

/**
 * Optimistic Update 패턴을 적용한 useMutation 래퍼 (SSOT)
 *
 * @description
 * TanStack Query의 onMutate/onError/onSuccess/onSettled 생명주기를 활용하여
 * 즉시 UI 업데이트 + 서버 동기화 패턴을 구현합니다.
 *
 * ## 4단계 생명주기
 * 1. **onMutate**: 즉시 캐시 업데이트 (0ms UI 피드백)
 * 2. **onSuccess**: 성공 토스트 + 콜백
 * 3. **onError**: 에러 토스트 + 콜백 (409 충돌 전용 메시지 포함)
 * 4. **onSettled**: 쿼리 무효화 → 서버 최신 데이터로 동기화 (SSOT)
 *
 * @template TData - 서버 응답 데이터 타입 (mutationFn 반환값)
 * @template TVariables - Mutation 입력 변수 타입
 * @template TCachedData - 쿼리 캐시 데이터 타입 (TData와 다를 수 있음!)
 */
export function useOptimisticMutation<TData, TVariables, TCachedData = TData>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  invalidateKeys = [],
  successMessage,
  errorMessage,
  onSuccessCallback,
  onErrorCallback,
}: OptimisticMutationOptions<TData, TVariables, TCachedData>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<TData, Error, TVariables, { snapshot: TCachedData | undefined }>({
    mutationFn,

    /**
     * ✅ Phase 1: onMutate - 즉시 캐시 업데이트
     *
     * 서버 요청 전에 실행되어 UI를 즉시 업데이트합니다.
     *
     * @returns context - onError에서 사용할 스냅샷
     */
    onMutate: async (variables) => {
      // 1. 진행 중인 쿼리 취소 (race condition 방지)
      await queryClient.cancelQueries({ queryKey });

      // 2. 현재 데이터 스냅샷 저장 (롤백용)
      const snapshot = queryClient.getQueryData<TCachedData>(queryKey);

      // 3. Optimistic 업데이트 - 즉시 캐시 수정
      queryClient.setQueryData(queryKey, (old: TCachedData | undefined) =>
        optimisticUpdate(old, variables)
      );

      // 4. onError에서 사용할 context 반환
      return { snapshot };
    },

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
     */
    onError: (error, variables) => {
      // 1. 에러 토스트 표시 (409 충돌은 전용 메시지)
      if (isConflictError(error)) {
        const conflictInfo = ERROR_MESSAGES[EquipmentErrorCode.VERSION_CONFLICT];
        toast({
          title: conflictInfo.title,
          description: conflictInfo.message,
          variant: 'destructive',
        });
      } else {
        const message = errorMessage
          ? typeof errorMessage === 'function'
            ? errorMessage(error)
            : errorMessage
          : getErrorMessage(error, ERROR_MESSAGES[EquipmentErrorCode.UNKNOWN_ERROR].message);

        toast({
          title: ERROR_MESSAGES[EquipmentErrorCode.UNKNOWN_ERROR].title,
          description: message,
          variant: 'destructive',
        });
      }

      // 2. 커스텀 에러 콜백
      onErrorCallback?.(error, variables);
    },

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
     */
    onSuccess: (data, variables) => {
      // 1. 성공 토스트 표시
      if (successMessage) {
        const message =
          typeof successMessage === 'function' ? successMessage(data, variables) : successMessage;
        toast({
          title: '성공',
          description: message,
        });
      }

      // 2. 커스텀 성공 콜백
      onSuccessCallback?.(data, variables);
    },

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
     */
    onSettled: async () => {
      // 1. 주 쿼리 무효화 → 서버 최신 데이터로 동기화
      await queryClient.invalidateQueries({ queryKey });

      // 2. 관련 쿼리도 무효화 (승인 카운트, 대시보드 등)
      if (invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
      }
    },
  });
}
