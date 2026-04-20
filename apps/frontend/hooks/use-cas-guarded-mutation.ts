'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';

/**
 * CAS(Optimistic Locking) fetch-before-mutate 훅 (SSOT)
 *
 * ## 해결하는 문제
 * 3단계 승인 워크플로우에서 각 단계마다 casVersion이 증가한다.
 * props/캐시에서 가져온 casVersion은 다른 사용자의 액션으로 stale해질 수 있다.
 * 이 훅은 mutationFn 실행 직전에 항상 최신 casVersion을 조회하여 409를 예방한다.
 *
 * ## 사용 패턴
 * ```tsx
 * const submitMutation = useCasGuardedMutation({
 *   fetchCasVersion: () => calibrationPlansApi.getCalibrationPlan(planUuid).then(p => p.casVersion),
 *   mutationFn: (_, casVersion) => calibrationPlansApi.submitForReview(planUuid, { casVersion }),
 *   onSuccess: () => { toast(...); invalidateAfterChange(); setDialogOpen(false); },
 *   onError: (error) => { toast({ title: ..., description: error.response?.data?.message || ... }); },
 * });
 * ```
 *
 * VERSION_CONFLICT(409)는 자동으로 표준 토스트 처리 — onError 콜백에는 전달되지 않는다.
 * 그 외 에러는 onError로 전달된다.
 */
export interface CasGuardedMutationOptions<TData, TVariables = void> {
  /** 항상 최신 casVersion을 반환하는 API 조회 함수 */
  fetchCasVersion: () => Promise<number>;
  /** (variables, casVersion) → 실제 API 호출 */
  mutationFn: (variables: TVariables, casVersion: number) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** VERSION_CONFLICT 제외한 나머지 에러만 전달됨 */
  onError?: (
    error: Error & { response?: { data?: { message?: string } } },
    variables: TVariables
  ) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void | Promise<void>;
}

export function useCasGuardedMutation<TData, TVariables = void>({
  fetchCasVersion,
  mutationFn,
  onSuccess,
  onError,
  onSettled,
}: CasGuardedMutationOptions<TData, TVariables>) {
  const { toast } = useToast();
  const t = useTranslations('errors');

  return useMutation<TData, Error & { response?: { data?: { message?: string } } }, TVariables>({
    mutationFn: async (variables) => {
      const casVersion = await fetchCasVersion();
      return mutationFn(variables, casVersion);
    },

    onSuccess,

    onError: (error, variables) => {
      if (isConflictError(error)) {
        // VERSION_CONFLICT는 표준 토스트로 처리 — 호출부 onError 우회
        const conflictInfo = getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, t);
        toast({
          title: conflictInfo.title,
          description: conflictInfo.message,
          variant: 'destructive',
        });
        return;
      }
      onError?.(error, variables);
    },

    onSettled,
  });
}
