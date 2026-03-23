/**
 * 폼 제출 공통 훅
 *
 * ✅ 재사용 가능한 로직: 모든 create 페이지에서 공통으로 사용
 * ✅ 일관된 에러 처리: API_STANDARDS 준수
 * ✅ 타입 안전성: 제네릭으로 타입 보장
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createApiError } from '@/lib/api/utils/response-transformers';

export interface UseFormSubmissionOptions<TData, TVariables> {
  /** Mutation 함수 */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** 성공 시 쿼리 키 무효화 */
  invalidateQueries?: string[][];
  /** 성공 시 리다이렉트 경로 */
  redirectPath?: string;
  /** 성공 메시지 */
  successMessage?: {
    title: string;
    description: string;
  };
  /** 에러 메시지 */
  errorMessage?: {
    title: string;
    description?: string;
  };
}

export function useFormSubmission<TData, TVariables>({
  mutationFn,
  invalidateQueries = [],
  redirectPath,
  successMessage = {
    title: '처리 완료',
    description: '요청이 성공적으로 처리되었습니다.',
  },
  errorMessage = {
    title: '처리 실패',
    description: '요청 처리 중 오류가 발생했습니다.',
  },
}: UseFormSubmissionOptions<TData, TVariables>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn,
    onSuccess: async () => {
      // 쿼리 무효화를 리다이렉트 전에 완료 — 대상 페이지에서 stale 캐시 방지
      await Promise.all(
        invalidateQueries.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      );

      // 성공 메시지
      toast({
        title: successMessage.title,
        description: successMessage.description,
      });

      // 리다이렉트
      if (redirectPath) {
        router.push(redirectPath);
      }
    },
    onSettled: () => {
      // 에러 시에도 캐시 갱신 보장
      if (!redirectPath) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error: unknown) => {
      // 에러 변환 (API_STANDARDS 준수)
      const apiError = createApiError(error);

      toast({
        title: errorMessage.title,
        description: apiError.message || errorMessage.description,
        variant: 'destructive',
      });

      console.error('Form submission error:', error);
    },
  });

  return mutation;
}
