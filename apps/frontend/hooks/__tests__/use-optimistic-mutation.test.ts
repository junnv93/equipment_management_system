/**
 * useOptimisticMutation — async onSuccessCallback 시맨틱 회귀 테스트
 *
 * 핵심 검증: onSuccessCallback이 async일 때 훅의 onSuccess가 이를 await한다.
 * 이 테스트가 실패하면 사진 업로드 중 모달이 조기에 닫히는 버그가 재발한다.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimisticMutation } from '../use-optimistic-mutation';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/lib/api/error', () => ({
  getErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
  isConflictError: jest.fn(() => false),
}));

jest.mock('@/lib/errors/equipment-errors', () => ({
  EquipmentErrorCode: { VERSION_CONFLICT: 'VC', UNKNOWN_ERROR: 'UE' },
  getLocalizedErrorInfo: jest.fn(() => ({ title: '오류', message: '알 수 없는 오류' })),
}));

type Item = { id: string };

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

describe('useOptimisticMutation', () => {
  it('동기 onSuccessCallback을 호출한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['items'], [] as Item[]);

    const onSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useOptimisticMutation<Item, Item, Item[]>({
          mutationFn: async (vars) => vars,
          queryKey: ['items'],
          optimisticUpdate: (old, vars) => [...(old ?? []), vars],
          onSuccessCallback: onSuccess,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.mutate({ id: '1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledWith({ id: '1' }, { id: '1' });
  });

  it('async onSuccessCallback이 완료될 때까지 훅이 대기한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['items'], [] as Item[]);

    const executionOrder: string[] = [];
    let resolveUpload!: () => void;
    const uploadPromise = new Promise<void>((res) => {
      resolveUpload = res;
    });

    const asyncCallback = jest.fn(async () => {
      await uploadPromise;
      executionOrder.push('upload-done');
    });

    const { result } = renderHook(
      () =>
        useOptimisticMutation<Item, Item, Item[]>({
          mutationFn: async (vars) => vars,
          queryKey: ['items'],
          optimisticUpdate: (old, vars) => [...(old ?? []), vars],
          onSuccessCallback: asyncCallback,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.mutate({ id: '2' });
    });

    // 콜백이 호출되었지만 아직 완료되지 않은 상태
    await waitFor(() => expect(asyncCallback).toHaveBeenCalled());
    expect(executionOrder).not.toContain('upload-done');

    // 비동기 작업 완료
    act(() => {
      resolveUpload();
    });

    await waitFor(() => expect(executionOrder).toContain('upload-done'));
    expect(result.current.isSuccess).toBe(true);
  });

  it('onSuccessCallback이 reject해도 성공 상태를 유지하고 에러를 로깅한다 (AD-7 regression)', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['items'], [] as Item[]);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const rejectingCallback = jest.fn().mockRejectedValue(new Error('callback-boom'));

    const { result } = renderHook(
      () =>
        useOptimisticMutation<Item, Item, Item[]>({
          mutationFn: async (vars) => vars,
          queryKey: ['items'],
          optimisticUpdate: (old, vars) => [...(old ?? []), vars],
          onSuccessCallback: rejectingCallback,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.mutate({ id: '3' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rejectingCallback).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('[useOptimisticMutation.onSuccess]', 'callback-boom');
    expect(result.current.isError).toBe(false);

    errorSpy.mockRestore();
  });

  it('onErrorCallback이 reject해도 에러 상태를 유지한다 (AD-7 regression)', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['items'], [] as Item[]);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const rejectingErrorCallback = jest.fn().mockRejectedValue(new Error('error-callback-boom'));

    const { result } = renderHook(
      () =>
        useOptimisticMutation<Item, Item, Item[]>({
          mutationFn: async () => {
            throw new Error('mutation-fail');
          },
          queryKey: ['items'],
          optimisticUpdate: (old) => old ?? [],
          onErrorCallback: rejectingErrorCallback,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.mutate({ id: '4' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rejectingErrorCallback).toHaveBeenCalled();
    // 에러 콜백 throw가 별도 로그로 흡수됨
    expect(errorSpy).toHaveBeenCalledWith('[useOptimisticMutation.onError]', 'error-callback-boom');

    errorSpy.mockRestore();
  });
});
