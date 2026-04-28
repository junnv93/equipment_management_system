'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';

/**
 * Server Action에서 반환하는 표준 상태 타입
 *
 * @example Server Action 구현
 * ```ts
 * 'use server';
 * import type { FormActionState } from '@/hooks/use-form-action';
 *
 * export async function submitEquipmentAction(
 *   _prevState: FormActionState,
 *   formData: FormData
 * ): Promise<FormActionState> {
 *   try {
 *     const parsed = EquipmentCreateSchema.safeParse(Object.fromEntries(formData));
 *     if (!parsed.success) {
 *       return { status: 'error', errors: parsed.error.flatten().fieldErrors };
 *     }
 *     await equipmentService.create(parsed.data);
 *     return { status: 'success' };
 *   } catch {
 *     return { status: 'error', message: 'feedback.failed' };
 *   }
 * }
 * ```
 */
export interface FormActionState<
  TErrors extends Record<string, string[]> = Record<string, string[]>,
> {
  status: 'idle' | 'success' | 'error';
  /** i18n key 또는 직접 메시지 (에러 시 설명) */
  message?: string;
  /** Zod fieldErrors 형식의 필드별 에러 */
  errors?: Partial<TErrors>;
}

export const INITIAL_FORM_ACTION_STATE: FormActionState = { status: 'idle' };

export interface UseFormActionOptions<TErrors extends Record<string, string[]>> {
  /**
   * Server Action 함수.
   * `(prevState: FormActionState, formData: FormData) => Promise<FormActionState>` 서명 필요.
   */
  action: (
    prevState: FormActionState<TErrors>,
    formData: FormData
  ) => Promise<FormActionState<TErrors>>;
  /**
   * 성공 시 토스트 메시지 key (FEEDBACK_KEYS 상수 사용).
   * 기본값: FEEDBACK_KEYS.success
   */
  successKey?: string;
  /**
   * 에러 시 토스트 메시지 key (FEEDBACK_KEYS 상수 사용).
   * state.message가 있으면 이 key보다 우선 표시됨.
   * 기본값: FEEDBACK_KEYS.failed
   */
  errorKey?: string;
  /** 성공 후 추가 콜백 (리다이렉트, 모달 닫기 등) */
  onSuccess?: () => void;
  /** 에러 후 추가 콜백 */
  onError?: (state: FormActionState<TErrors>) => void;
}

export interface UseFormActionReturn<TErrors extends Record<string, string[]>> {
  /** 현재 액션 상태 */
  state: FormActionState<TErrors>;
  /** form action prop에 전달 (`<form action={formAction}>`) */
  formAction: (formData: FormData) => void;
  /** 서버 액션 진행 중 여부 (React 19 Transition) */
  isPending: boolean;
}

/**
 * React 19 Server Action 래퍼 훅 (SSOT)
 *
 * `useActionState`를 감싸 i18n 토스트 피드백을 표준화.
 * 필드별 에러(`state.errors`)는 폼 컴포넌트에서 직접 렌더링.
 *
 * @example
 * ```tsx
 * const { state, formAction, isPending } = useFormAction({
 *   action: submitEquipmentAction,
 *   successKey: FEEDBACK_KEYS.created,
 *   onSuccess: () => router.push('/equipment'),
 * });
 *
 * <form action={formAction}>
 *   <Input name="name" aria-describedby={state.errors?.name ? 'name-error' : undefined} />
 *   {state.errors?.name && <p id="name-error" role="alert">{state.errors.name[0]}</p>}
 *   <Button type="submit" loading={isPending} loadingLabel={t(FEEDBACK_KEYS.saving)}>
 *     {t('submit')}
 *   </Button>
 * </form>
 * ```
 */
export function useFormAction<TErrors extends Record<string, string[]> = Record<string, string[]>>({
  action,
  successKey = FEEDBACK_KEYS.success,
  errorKey = FEEDBACK_KEYS.failed,
  onSuccess,
  onError,
}: UseFormActionOptions<TErrors>): UseFormActionReturn<TErrors> {
  const { toast } = useToast();
  const t = useTranslations();

  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_FORM_ACTION_STATE as FormActionState<TErrors>
  );

  // Stable refs to avoid stale closures in effect
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  // status 변경 시 toast 표시 (idle 초기 상태 무시)
  const prevStatusRef = useRef<FormActionState['status']>('idle');
  useEffect(() => {
    if (prevStatusRef.current === state.status) return;
    prevStatusRef.current = state.status;

    if (state.status === 'success') {
      toast({ description: t(successKey) });
      onSuccessRef.current?.();
    }

    if (state.status === 'error') {
      const description = state.message ? t(state.message) : t(errorKey);
      toast({ description, variant: 'destructive' });
      onErrorRef.current?.(state);
    }
  }, [state, successKey, errorKey, t, toast]);

  return { state, formAction, isPending };
}
