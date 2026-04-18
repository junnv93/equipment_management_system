'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { safeCallback } from './lib/safe-callback';

interface MutationWithRefreshOptions<TData, TVariables, TContext> extends Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  'onSuccess' | 'onError'
> {
  /**
   * 성공 시 무효화할 쿼리 키 목록
   */
  invalidateKeys?: ReadonlyArray<readonly (string | number)[]>;

  /**
   * 서버 컴포넌트 캐시도 갱신할지 여부
   * true: router.refresh() 호출 (Server Component 데이터 갱신 필요 시)
   * false: 클라이언트 캐시만 무효화
   */
  refreshServerCache?: boolean;

  /**
   * 성공 시 토스트 메시지
   */
  successMessage?: {
    title: string;
    description?: string;
  };

  /**
   * 에러 시 토스트 타이틀
   */
  errorTitle?: string;

  /**
   * 추가 성공 콜백
   */
  onSuccessCallback?: (data: TData, variables: TVariables, context: TContext | undefined) => void;

  /**
   * 추가 에러 콜백
   */
  onErrorCallback?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
}

/**
 * 캐시 무효화 전략이 표준화된 mutation 훅
 *
 * Best Practice:
 * - refreshServerCache=true: Server Component 데이터가 변경된 경우
 * - refreshServerCache=false: Client Component만 갱신 필요한 경우
 * - 절대로 router.refresh()와 invalidateQueries를 동시에 같은 데이터에 사용하지 않음
 *
 * @example
 * ```typescript
 * const deleteMutation = useMutationWithRefresh({
 *   mutationFn: (id: string) => api.delete(id),
 *   invalidateKeys: [['incident-history', equipmentId]],
 *   refreshServerCache: true,
 *   successMessage: { title: '삭제 완료', description: '이력이 삭제되었습니다.' },
 *   errorTitle: '삭제 실패',
 * });
 * ```
 */
export function useMutationWithRefresh<TData = unknown, TVariables = void, TContext = unknown>({
  invalidateKeys = [],
  refreshServerCache = false,
  successMessage,
  errorTitle = '오류가 발생했습니다',
  onSuccessCallback,
  onErrorCallback,
  ...mutationOptions
}: MutationWithRefreshOptions<TData, TVariables, TContext>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<TData, Error, TVariables, TContext>({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // 1. Server Component 캐시 갱신 (Router Cache 무효화)
      if (refreshServerCache) {
        router.refresh();
      }

      // 2. 성공 토스트
      if (successMessage) {
        toast({
          title: successMessage.title,
          description: successMessage.description,
        });
      }

      // 3. 추가 콜백 — throw해도 성공 토스트를 뒤집지 않음
      await safeCallback(
        () => onSuccessCallback?.(data, variables, context),
        'useMutationWithRefresh.onSuccess'
      );
    },
    onError: async (error, variables, context) => {
      // 에러 메시지 추출 (ApiError 포함 모든 에러 타입 처리)
      const errorMessage = getErrorMessage(error, '알 수 없는 오류가 발생했습니다.');

      console.error(`[Mutation Error] ${errorTitle}:`, error);

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });

      // 추가 콜백 — throw해도 에러 경로를 방해하지 않음
      await safeCallback(
        () => onErrorCallback?.(error, variables, context),
        'useMutationWithRefresh.onError'
      );
    },
    onSettled: async () => {
      // 클라이언트 캐시 무효화 — 항상 실행 (성공/실패 무관)
      if (invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
      }
    },
  });
}

/**
 * 삭제 작업에 특화된 mutation 훅
 */
export function useDeleteMutation<TVariables = string>({
  mutationFn,
  resourceName,
  invalidateKeys = [],
  refreshServerCache = true,
  onSuccessCallback,
}: {
  mutationFn: (variables: TVariables) => Promise<void>;
  resourceName: string;
  invalidateKeys?: ReadonlyArray<readonly (string | number)[]>;
  refreshServerCache?: boolean;
  onSuccessCallback?: () => void;
}) {
  return useMutationWithRefresh<void, TVariables>({
    mutationFn,
    invalidateKeys,
    refreshServerCache,
    successMessage: {
      title: '삭제 완료',
      description: `${resourceName}이(가) 삭제되었습니다.`,
    },
    errorTitle: `${resourceName} 삭제 실패`,
    onSuccessCallback,
  });
}
