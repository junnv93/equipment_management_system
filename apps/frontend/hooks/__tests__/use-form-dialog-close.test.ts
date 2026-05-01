/**
 * useFormDialogClose — Phase 0A-ext SSOT 동작 검증
 *
 * 시나리오:
 * 1. isDirty=true → confirmOpen=true (사용자에게 confirmation 노출)
 * 2. isDirty=false → onConfirmClose 즉시 호출 (clean close)
 * 3. confirm 클릭 → onConfirmClose + confirmOpen=false
 * 4. cancel 클릭 → confirmOpen=false (dialog 유지)
 * 5. markCommitted 후 requestClose → confirm 우회 (정상 submit 흐름)
 * 6. markCommitted는 1회 사용 후 자동 reset (다음 requestClose는 다시 isDirty 검사)
 */

import { act, renderHook } from '@testing-library/react';
import { useFormDialogClose } from '../use-form-dialog-close';

describe('useFormDialogClose', () => {
  it('isDirty=false 시 requestClose는 onConfirmClose 즉시 호출', () => {
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty: () => false,
        onConfirmClose,
      })
    );

    act(() => {
      result.current.requestClose();
    });

    expect(onConfirmClose).toHaveBeenCalledTimes(1);
    expect(result.current.confirmOpen).toBe(false);
  });

  it('isDirty=true 시 requestClose는 confirmOpen=true 만 설정', () => {
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty: () => true,
        onConfirmClose,
      })
    );

    act(() => {
      result.current.requestClose();
    });

    expect(onConfirmClose).not.toHaveBeenCalled();
    expect(result.current.confirmOpen).toBe(true);
  });

  it('confirm 호출 시 onConfirmClose + confirmOpen=false', () => {
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty: () => true,
        onConfirmClose,
      })
    );

    act(() => result.current.requestClose());
    expect(result.current.confirmOpen).toBe(true);

    act(() => result.current.confirm());

    expect(onConfirmClose).toHaveBeenCalledTimes(1);
    expect(result.current.confirmOpen).toBe(false);
  });

  it('cancel 호출 시 confirmOpen=false (onConfirmClose 미호출)', () => {
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty: () => true,
        onConfirmClose,
      })
    );

    act(() => result.current.requestClose());
    act(() => result.current.cancel());

    expect(onConfirmClose).not.toHaveBeenCalled();
    expect(result.current.confirmOpen).toBe(false);
  });

  it('markCommitted 후 requestClose는 confirm 우회 (정상 submit 흐름)', () => {
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty: () => true,
        onConfirmClose,
      })
    );

    act(() => result.current.markCommitted());
    act(() => result.current.requestClose());

    expect(onConfirmClose).toHaveBeenCalledTimes(1);
    expect(result.current.confirmOpen).toBe(false);
  });

  it('markCommitted는 1회 사용 후 자동 reset (다음 requestClose는 다시 isDirty 검사)', () => {
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty: () => true,
        onConfirmClose,
      })
    );

    // 1회: markCommitted → 우회
    act(() => result.current.markCommitted());
    act(() => result.current.requestClose());
    expect(onConfirmClose).toHaveBeenCalledTimes(1);

    // 2회: markCommitted 안 함 → isDirty 검사 → confirmOpen=true
    act(() => result.current.requestClose());
    expect(onConfirmClose).toHaveBeenCalledTimes(1); // 추가 호출 X
    expect(result.current.confirmOpen).toBe(true);
  });

  it('isDirty 함수는 매 requestClose 시점에 호출 (closure 최신 state)', () => {
    let isDirtyValue = false;
    const isDirty = jest.fn(() => isDirtyValue);
    const onConfirmClose = jest.fn();
    const { result } = renderHook(() =>
      useFormDialogClose({
        isDirty,
        onConfirmClose,
      })
    );

    // clean close
    act(() => result.current.requestClose());
    expect(isDirty).toHaveBeenCalledTimes(1);
    expect(onConfirmClose).toHaveBeenCalledTimes(1);

    // dirty 후 다시 close 시도
    isDirtyValue = true;
    act(() => result.current.requestClose());
    expect(isDirty).toHaveBeenCalledTimes(2);
    expect(onConfirmClose).toHaveBeenCalledTimes(1); // confirm 노출, 호출 X
    expect(result.current.confirmOpen).toBe(true);
  });
});
